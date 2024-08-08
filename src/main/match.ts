import { formatHighlight } from './highlight.js';

/**
 * Fuzzily matches `source` string against query, returning score (higher — better)
 * and indices of matched characters.
 *
 * This replicates the functionality implemented by common IDEs and some other solutions
 * (i.e. GitHub) for searching files and symbols, with adding bias towards matching
 * the beginning of the words (called tokens), falling back to regular wildcard matching
 * which yields lower score.
 *
 * Instead of implementing a single algorithm which deals with the complexity
 * of matching, scoring and prioritizing, the algorithm is split in two:
 *
 * - `fuzzyMatchByTokens` performs matching occurring only at start of each token
 *   (i.e. start of words or word components in camelCase symbols);
 *   this algorithm doesn't try to match inside tokens (in the middle of words)
 * - `fuzzyMatchWildcard` performs a more simplistic wildcard search
 *   (i.e. `text` -> `*t*e*x*t*`)
 *
 * Both algorithms use the same scoring system: matches that occur closer to the
 * beginning of the `source` string yield higher score. Because token-based matching
 * is generally favourable over wildcard matching, its score is multiplied by
 * numeric `tokenScoreBias` (default is 10).
 *
 * @param query Search query
 * @param source Source string (candidate) for match
 */
export function fuzzyMatch(query: string, source: string, options: FuzzyMatchOptions = {}): FuzzyMatchResult {
    const { tokenScoreBias = 10, useWildcard = true } = options;
    const tokenMatch = fuzzyMatchByTokens(query, source, options);
    if (tokenMatch.score > 0) {
        return {
            score: tokenMatch.score * tokenScoreBias,
            matches: tokenMatch.matches,
            highlight: tokenMatch.highlight,
        };
    }
    // Fall back to wildcard match
    if (useWildcard) {
        return fuzzyMatchByWildcard(query, source, options);
    }
    return {
        score: 0,
        matches: [],
        highlight: source,
    };
}

/**
 * Token-based match matches each letter with the beginning of each token
 * (uppercase letter, start of word, etc), prioritizing matches that occur
 * within the token or across the tokens.
 *
 * @param query Search query
 * @param source Source string (candidate) for match
 */
export function fuzzyMatchByTokens(
    query: string,
    source: string,
    options: FuzzyMatchOptions = {},
): FuzzyMatchResult {
    const matches = matchPass(query, source, 0);
    const score = fuzzyMatchScore(source, matches);
    const highlight = formatHighlight(source, matches, options.highlightTag ?? 'b');
    return { score, matches, highlight };
}

function matchPass(query: string, source: string, startPos: number) {
    // An array of indices into source string that successfully matched our query
    const matches: number[] = [];
    // An index of source string we're currently looking at
    let cursor = startPos;
    // A queue of query letters to be processed
    const queue = query.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').split('');
    while (queue.length > 0) {
        if (cursor >= source.length) {
            // Did not match all tokens, try matching again from next token
            const nextPos = nextTokenIdx(source, startPos);
            if (nextPos < source.length) {
                return matchPass(query, source, nextPos);
            }
            // No luck
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

export function nextTokenIdx(source: string, startPos: number): number {
    // 1. Consume letters, stop at nearest uppercase (camelCase, PascalCase tokens)
    // 2. Consume letters and non-letters
    // 3. Conusme non-letters, stop at nearest letter
    const re = /(?:[A-Z]?[a-z0-9]+(?=[A-Z]))|(?:[a-zA-Z0-9]+[^A-Za-z0-9]*)|(?:[^A-Za-z0-9]*(?=[a-zA-Z0-9]))/g;
    re.lastIndex = startPos;
    const m = re.exec(source);
    return m == null ? source.length : m.index + m[0].length;
}

/**
 * A fallback match algorithm that searches for occurrences of each letter
 * of `query` within `source` string, left-to-right.
 *
 * @param query Search query
 * @param source Source string (candidate) for match
 */
export function fuzzyMatchByWildcard(
    query: string,
    source: string,
    options: FuzzyMatchOptions = {},
): FuzzyMatchResult {
    const matches: number[] = [];
    let fromIdx = 0;
    query = query.toLowerCase().replace(/\s+/g, '');
    const sourceLowercased = source.toLowerCase();
    for (let i = 0; i < query.length; i++) {
        const letter = query.charAt(i).toLowerCase();
        const idx = sourceLowercased.indexOf(letter, fromIdx);
        if (idx === -1) {
            return { score: 0, matches: [], highlight: source };
        }
        matches.push(idx);
        fromIdx = idx + 1;
    }
    const score = fuzzyMatchScore(source, matches);
    const highlight = formatHighlight(source, matches, options.highlightTag ?? 'b');
    return { score, matches, highlight };
}

/**
 * Calculates match score given indices of matched characters within `source` string.
 * Matches that occur closer to source string beginning yield higher score.
 *
 * @param source Source string.
 * @param matches Array of indices in source string indicated matched characters.
 */
export function fuzzyMatchScore(source: string, matches: number[]): number {
    const l = source.length;
    const n = matches.length;
    return matches.reduce((sum, m) => sum + n / (l + m), 0);
}

export interface FuzzyMatchResult {
    score: number;
    matches: number[];
    highlight: string;
}

export interface FuzzyMatchOptions {
    tokenScoreBias?: number;
    highlightTag?: string;
    useWildcard?: boolean;
}
