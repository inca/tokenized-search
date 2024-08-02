/* eslint-disable no-console */
import { fuzzyMatch } from './match.js';

export function debugFuzzyMatch(query: string, source: string) {
    const match = fuzzyMatch(query, source);
    console.log(`Query: ${cyan(query)}`);
    console.log(`Candidate: ${cyan(source)}`);
    if (match.score === 0) {
        console.log(`Result: ${red('no match')}`);
    } else {
        const str = source.split('').map((l, i) => {
            return match.matches.includes(i) ? yellow(l) : l;
        }).join('');
        console.log(`Result: ${str} (score: ${match.score})`);
    }
}
/* eslint-enable no-console */

function red(str: string) {
    return '\u001b[31m' + str + '\u001b[0m';
}

function yellow(str: string) {
    return '\u001b[33m' + str + '\u001b[0m';
}

function cyan(str: string) {
    return '\u001b[32m' + str + '\u001b[0m';
}
