export function normalizeToken(str: string) {
    return str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}
