import assert from 'assert';

import { fuzzyMatch, FuzzyMatchOptions } from '../main/index.js';

interface TestCase {
    q: string;
    s: string;
    m: number[];
    options?: FuzzyMatchOptions;
}

describe('Fuzzy match', () => {

    const suite: Record<string, TestCase[]> = {
        'match whole words': [
            { q: 'text', s: 'getText', m: [3, 4, 5, 6] },
            { q: 'text', s: 'get-text', m: [4, 5, 6, 7] },
            { q: 'text', s: 'get_text', m: [4, 5, 6, 7] },
            { q: 'text', s: 'Get Text', m: [4, 5, 6, 7] },
            { q: 'text', s: 'no match', m: [] },
        ],
        'match the beginning of tokens': [
            { q: 'gt', s: 'getText', m: [0, 3] },
            { q: 'gt', s: 'get-text', m: [0, 4] },
            { q: 'gt', s: 'get_text', m: [0, 4] },
            { q: 'gt', s: 'Get Text', m: [0, 4] },
            { q: 'gt', s: 'no match', m: [] },
        ],
        'match wildcard': [
            { q: 'text', s: 'batchExtract', m: [2, 5, 6, 7] },
            { q: 'text', s: 'batch-extract', m: [2, 6, 7, 8] },
            { q: 'text', s: 'batch_extract', m: [2, 6, 7, 8] },
            { q: 'text', s: 'Batch Extract', m: [2, 6, 7, 8] },
            { q: 'text', s: 'No match', m: [] },
        ],
        'match second token': [
            {
                q: 'map',
                s: 'Math / Map Range',
                m: [7, 8, 9],
                options: {
                    biasWildcard: 0,
                }
            },
        ],
        'match tokens is lenient order': [
            { q: 'list last order', s: 'Get Last Orders', m: [4, 5, 6, 7, 9, 10, 11, 12, 13] },
            { q: 'get youtube video', s: 'youtube_list_videos', m: [0, 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17] },
            { q: 'get youtube video', s: 'YouTube List Videos', m: [0, 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17] },
        ],
        'match both tokens': [
            {
                q: 'mathmap',
                s: 'Math / Map Range',
                m: [0, 1, 2, 3, 7, 8, 9],
                options: {
                    biasWildcard: 0,
                }
            },
        ],
    };

    for (const [title, cases] of Object.entries(suite)) {
        describe(title, () => {
            for (const testCase of cases) {
                const match = testCase.m.length > 0;
                const sym = match ? '✓' : '✗';
                it(`${sym} ${testCase.q} -> ${testCase.s}`, () => {
                    const res = fuzzyMatch(testCase.q, testCase.s, testCase.options);
                    assert.deepStrictEqual(res.matches, testCase.m);
                    assert(match ? res.score > 0 : res.score === 0);
                });
            }
        });
    }

});
