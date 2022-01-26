export function formatHighlight(source: string, matches: number[], tag: string = 'b') {
    return source
        .split('')
        .map((char, i) => matches.includes(i) ? `<${tag}>${char}</${tag}>` : char)
        .join('');
}
