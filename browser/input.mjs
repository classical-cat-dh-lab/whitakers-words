// Browser input adaptation only. The legacy engine and its spans are unchanged.
export const INPUT_PROFILE = 'latin-macrons-v1';
export function prepareLatinInput(original) {
  let lookup = '';
  const spans = [];
  for (const match of original.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    const cluster = match[0], start = match.index, end = start + cluster.length;
    const decomposed = cluster.normalize('NFD');
    const folded = /[\u0304\u00af\u02c9]/u.test(decomposed)
      ? decomposed.replace(/[\u0304\u00af\u02c9]/gu, '').normalize('NFC') : cluster;
    lookup += folded;
    for (let i = 0; i < folded.length; i++) spans.push({start, end});
  }
  return {profile: INPUT_PROFILE, original, lookup, spans};
}
export function originalSurface(prepared, span) {
  const first = prepared.spans[span.start], last = prepared.spans[span.end - 1];
  return first && last ? prepared.original.slice(first.start, last.end) : '';
}
// Keep slash-separated alternatives together. Semicolons delimit reading lines;
// retain the original punctuation and leave structured meanings untouched.
export function meaningLines(meaning) {
  return meaning.split(/(?<=;)/u).map(part => part.trim()).filter(Boolean);
}
