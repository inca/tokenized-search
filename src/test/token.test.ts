import assert from 'assert';

import { nextTokenIdx, tokenize } from '../main/index.js';

describe('Token', () => {

    it('nextTokenIdx', () => {
        assert.strictEqual(nextTokenIdx('getText', 0), 3);
        assert.strictEqual(nextTokenIdx('getText', 1), 3);
        assert.strictEqual(nextTokenIdx('getText', 3), 7);
        assert.strictEqual(nextTokenIdx('get text', 0), 4);
        assert.strictEqual(nextTokenIdx('get_text', 0), 4);
        assert.strictEqual(nextTokenIdx('get-text', 0), 4);
        assert.strictEqual(nextTokenIdx('Get / Text', 0), 6);
        assert.strictEqual(nextTokenIdx('Get / Text', 3), 6);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 0), 6);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 1), 6);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 6), 12);
        assert.strictEqual(nextTokenIdx('Get / AccessToken / Retry', 12), 20);
    });

    it('tokenize', () => {
        assert.deepStrictEqual(tokenize('helloWorld'), ['hello', 'world']);
        assert.deepStrictEqual(tokenize('hello / world'), ['hello', 'world']);
        assert.deepStrictEqual(tokenize('hello / worldAndStuff'), ['hello', 'world', 'and', 'stuff']);
        assert.deepStrictEqual(tokenize('  #@$! Hello @#$@ / World!%@#'), ['hello', 'world']);
    });

});
