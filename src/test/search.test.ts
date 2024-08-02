import assert from 'assert';

import { fuzzySearch } from '../main/index.js';

const candidates = [
    'DOM.getText',
    'DOM.getInnerText',
    'DOM.getTextContent',
    'DOM.queryAll',
    'DOM.queryOne',
    'DOM.batchExtract',
    'Value.containsText',
    'Value.equalsText',
    'String.extractRegexp',
];

describe('Fuzzy match', () => {

    it('query: text', () => {
        const results = fuzzySearch('text', candidates);
        assert.deepStrictEqual(results.map(r => r.source), [
            'DOM.getText',
            'DOM.getTextContent',
            'DOM.getInnerText',
            'Value.equalsText',
            'Value.containsText',
            'DOM.batchExtract',
            'String.extractRegexp',
        ]);
        assert.deepStrictEqual(results.map(r => highlight(r.source, r.matches)), [
            'dom.getTEXT',
            'dom.getTEXTcontent',
            'dom.getinnerTEXT',
            'value.equalsTEXT',
            'value.containsTEXT',
            'dom.baTchEXTract',
            'sTring.EXTractregexp',
        ]);
    });

    it('query: as', () => {
        const results = fuzzySearch('qall', candidates);
        assert.deepStrictEqual(results.map(r => r.source), [
            'DOM.queryAll',
        ]);
        assert.deepStrictEqual(results.map(r => highlight(r.source, r.matches)), [
            'dom.QueryALL',
        ]);
    });

    it('query: aas', () => {
        const results = fuzzySearch('aas', candidates);
        assert.deepStrictEqual(results.map(r => r.source), [
            'Value.equalsText',
            'Value.containsText',
        ]);
        assert.deepStrictEqual(results.map(r => highlight(r.source, r.matches)), [
            'vAlue.equAlStext',
            'vAlue.contAinStext',
        ]);
    });

    it('returns highlights in text', () => {
        const results = fuzzySearch('aas', candidates);
        assert.deepStrictEqual(results.map(r => r.highlight), [
            'V<b>a</b>lue.equ<b>a</b>l<b>s</b>Text',
            'V<b>a</b>lue.cont<b>a</b>in<b>s</b>Text',
        ]);
    });

});

/**
 * Highlights source for testing
 *
 * @param source
 * @param matches
 */
function highlight(source: string, matches: number[]) {
    return source.split('')
        .map((l, i) => matches.includes(i) ? l.toUpperCase() : l.toLowerCase())
        .join('');
}
