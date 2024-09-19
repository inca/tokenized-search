import { normalizeToken } from './normalize.js';

export function nextTokenIdx(source: string, startPos: number): number {
    // 1. Consume letters, stop at nearest uppercase (camelCase, PascalCase tokens)
    // 2. Consume letters and non-letters
    // 3. Consume non-letters, stop at nearest letter
    const re = /(?:[A-Z]?[a-z0-9]+(?=[A-Z]))|(?:[a-zA-Z0-9]+[^A-Za-z0-9]*)|(?:[^A-Za-z0-9]*(?=[a-zA-Z0-9]))/g;
    re.lastIndex = startPos;
    const m = re.exec(source);
    return m == null ? source.length : m.index + m[0].length;
}

export function tokenize(source: string): string[] {
    const tokens: string[] = [];
    let idx = 0;
    while (idx < source.length) {
        const nextIdx = nextTokenIdx(source, idx);
        const token = source.substring(idx, nextIdx).replace(/[^a-z0-9]/gi, '');
        if (token.length > 0) {
            tokens.push(normalizeToken(token));
        }
        idx = nextIdx;
    }
    return tokens;
}
