import { formatHighlight } from './highlight.js';
import { normalizeToken } from './normalize.js';
import { nextTokenIdx, tokenize } from './token.js';

export interface FuzzyMatchOptions {
    highlightTag?: string;
    biasTokensStrict?: number;
    biasLetterTokens?: number;
    biasTokensLenient?: number;
    biasWildcard?: number;
}

export interface FuzzyMatchResult {
    score: number;
    matches: number[];
    highlight: string;
}

type MatchAlgorithm = {
    matcher: (query: string, source: string) => number[];
    bias: (options: FuzzyMatchOptions) => number;
};

const algorithms: MatchAlgorithm[] = [
    {
        matcher: (q, s) => matchTokensStrict(q, s),
        bias: opt => opt.biasTokensStrict ?? 16,
    },
    {
        matcher: (q, s) => matchLetterTokens(q, s),
        bias: opt => opt.biasLetterTokens ?? 8,
    },
    {
        matcher: (q, s) => matchTokensLenient(q, s),
        bias: opt => opt.biasTokensLenient ?? 4,
    },
    {
        matcher: (q, s) => matchWildcard(q, s),
        bias: opt => opt.biasWildcard ?? 1,
    },
];

/**
 * Fuzzily matches `source` string against query, returning score (higher — better)
 * and indices of matched characters.
 *
 * This replicates the functionality implemented by common IDEs and some other solutions
 * (e.g. GitHub) for searching files and symbols, with adding bias towards matching
 * the beginning of the words (called tokens), falling back to other matching algorithms
 * that yield lower score.
 *
 * There are multiple matching algorithms, some are more strict and thus yield more relevant results,
 * the others are more lenient.
 *
 * All algorithms use the same scoring system: matches that occur closer to the
 * beginning of the `source` string yield higher score. Bias allows adjusting the scores of each algorithm,
 * to prioritize the results returned. Use 0 to disable a particular algorithm.
 */
export function fuzzyMatch(
    query: string,
    source: string,
    options: FuzzyMatchOptions = {},
): FuzzyMatchResult {
    const sortedAlgs = algorithms.slice().sort((a, b) => {
        const biasA = a.bias(options);
        const biasB = b.bias(options);
        return biasA < biasB ? 1 : -1;
    });
    for (const algo of sortedAlgs) {
        const bias = algo.bias(options);
        if (bias === 0) {
            continue;
        }
        const matches = algo.matcher(query, source);
        if (matches.length > 0) {
            const score = fuzzyMatchScore(source, matches);
            const highlight = formatHighlight(source, matches, options.highlightTag ?? 'b');
            return {
                score: score * bias,
                matches,
                highlight,
            };
        }
    }
    // No match
    return {
        score: 0,
        matches: [],
        highlight: source,
    };
}

/**
 * Matches each query token to the beginning of source tokens.
 * The query tokens are matched in order.
 *
 * Example: "a b" matches "*A*lpha *B*eta" (but not "Beta Alpha")
 */
export function matchTokensStrict(
    query: string,
    source: string,
    startPos = 0,
): number[] {
    const queue = tokenize(query);
    const matches: number[] = [];
    const sourceNorm = source.toLowerCase();
    let cursor = startPos;
    while (queue.length > 0) {
        if (cursor >= source.length) {
            // Did not match all tokens, try matching again from next token
            const nextPos = nextTokenIdx(source, startPos);
            if (nextPos < source.length) {
                return matchLetterTokens(query, source, nextPos);
            }
            // No match
            return [];
        }
        const token = queue[0];
        const cursorEnd = cursor + token.length;
        const str = sourceNorm.substring(cursor, cursorEnd);
        if (str === token) {
            for (let i = cursor; i < cursorEnd; i++) {
                matches.push(i);
            }
            cursor = Math.min(nextTokenIdx(source, cursorEnd), nextTokenIdx(source, cursor));
            queue.shift();
        } else {
            cursor = nextTokenIdx(source, cursor);
        }
    }
    return matches;
}

/**
 * Matches each letter of the query with the beginning of each token.
 * If matches, tries matching the next letter in the same token,
 * otherwise proceeds to next token.
 *
 * Example: "mapr" matches "*Map* *R*ange"
 */
export function matchLetterTokens(
    query: string,
    source: string,
    startPos = 0,
): number[] {
    // An array of indices into source string that successfully matched our query
    const matches: number[] = [];
    // An index of source string we're currently looking at
    let cursor = startPos;
    // A queue of query letters to be processed
    const queue = normalizeToken(query).split('');
    while (queue.length > 0) {
        if (cursor >= source.length) {
            // Did not match all tokens, try matching again from next token
            const nextPos = nextTokenIdx(source, startPos);
            if (nextPos < source.length) {
                return matchLetterTokens(query, source, nextPos);
            }
            // No match
            return [];
        }
        const letter = queue[0];
        if (letter === source.charAt(cursor).toLowerCase()) {
            matches.push(cursor);
            // We will now check if next character matches
            cursor += 1;
            queue.shift();
        } else {
            cursor = nextTokenIdx(source, cursor);
        }
    }
    return matches;
}

/**
 * Matches query tokens to the beginning of source tokens
 * in no particular order. Returns if any of the source tokens match.
 *
 * Example: "list last order" matches "Get *Last* *Order*s"
 */
export function matchTokensLenient(
    query: string,
    source: string,
): number[] {
    const queryTokens = tokenize(query);
    const matches: number[] = [];
    const sourceNorm = source.toLowerCase();
    let cursor = 0;
    next: while (cursor < source.length) {
        for (const token of queryTokens) {
            const cursorEnd = cursor + token.length;
            const str = sourceNorm.substring(cursor, cursorEnd);
            if (str === token) {
                for (let i = cursor; i < cursorEnd; i++) {
                    matches.push(i);
                }
                cursor = Math.min(nextTokenIdx(source, cursorEnd), nextTokenIdx(source, cursor));
                continue next;
            }
        }
        cursor = nextTokenIdx(source, cursor);
    }
    return matches;
}


/**
 * Treats every letter of query as if it was surrounded by wildcards, e.g.
 * `ab` will be `*a*b*`.
 *
 * Example: ab -> D*a*sh*b*oard
 */
export function matchWildcard(
    query: string,
    source: string,
): number[] {
    const matches: number[] = [];
    let fromIdx = 0;
    query = query.toLowerCase().replace(/\s+/g, '');
    const sourceNorm = source.toLowerCase();
    for (let i = 0; i < query.length; i++) {
        const letter = query.charAt(i).toLowerCase();
        const idx = sourceNorm.indexOf(letter, fromIdx);
        if (idx === -1) {
            return [];
        }
        matches.push(idx);
        fromIdx = idx + 1;
    }
    return matches;
}

/**
 * Calculates match score given indices of matched characters within `source` string.
 * Matches that occur closer to source string beginning yield higher score.
 *
 * @param source Source string
 * @param matches Array of indices in source string indicated matched characters
 */
export function fuzzyMatchScore(source: string, matches: number[]): number {
    const l = source.length;
    const n = matches.length;
    return matches.reduce((sum, m) => sum + n / (l + m), 0);
}
