import assert from 'assert';

import { fuzzyMatch, nextTokenIdx } from '../main/index.js';

interface TestCase {
    query: string;
    source: string;
    matches: number[];
    useWildcard?: boolean;
}

describe('Fuzzy match', () => {

    it('nextTokenIdx', () => {
        assert.strictEqual(nextTokenIdx('getText', 0), 3);
        assert.strictEqual(nextTokenIdx('getText', 1), 3);
        assert.strictEqual(nextTokenIdx('getText', 3), 7);
        assert.strictEqual(nextTokenIdx('get text', 0), 4);
        assert.strictEqual(nextTokenIdx('get_text', 0), 4);
        assert.strictEqual(nextTokenIdx('get-text', 0), 4);
        assert.strictEqual(nextTokenIdx('Get / Text', 0), 6);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 0), 6);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 1), 6);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 6), 12);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 12), 20);
    });

    const suite: Record<string, TestCase[]> = {
        'match whole words': [
            { query: 'text', source: 'getText', matches: [3, 4, 5, 6] },
            { query: 'text', source: 'get-text', matches: [4, 5, 6, 7] },
            { query: 'text', source: 'get_text', matches: [4, 5, 6, 7] },
            { query: 'text', source: 'Get Text', matches: [4, 5, 6, 7] },
            { query: 'text', source: 'no match', matches: [] },
        ],
        'match the beginning of tokens': [
            { query: 'gt', source: 'getText', matches: [0, 3] },
            { query: 'gt', source: 'get-text', matches: [0, 4] },
            { query: 'gt', source: 'get_text', matches: [0, 4] },
            { query: 'gt', source: 'Get Text', matches: [0, 4] },
            { query: 'gt', source: 'no match', matches: [] },
        ],
        'match wildcard': [
            { query: 'text', source: 'batchExtract', matches: [2, 5, 6, 7] },
            { query: 'text', source: 'batch-extract', matches: [2, 6, 7, 8] },
            { query: 'text', source: 'batch_extract', matches: [2, 6, 7, 8] },
            { query: 'text', source: 'Batch Extract', matches: [2, 6, 7, 8] },
            { query: 'text', source: 'No match', matches: [] },
        ],
        'match second token': [
            { query: 'map', source: 'Math / Map Range', matches: [7, 8, 9], useWildcard: false }
        ]
    };

    for (const [title, cases] of Object.entries(suite)) {
        describe(title, () => {
            for (const testCase of cases) {
                const match = testCase.matches.length > 0;
                const sym = match ? '✓' : '✗';
                it(`${sym} ${testCase.query} -> ${testCase.source}`, () => {
                    const res = fuzzyMatch(testCase.query, testCase.source, {
                        useWildcard: testCase.useWildcard,
                    });
                    assert.deepStrictEqual(res.matches, testCase.matches);
                    assert(match ? res.score > 0 : res.score === 0);
                });
            }
        });
    }

});
