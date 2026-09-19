// Query the complete portable EWDS index, preserving the Ada binary-search tie order.
import { SNAPSHOT, PROFILE, VERSION, DATA_IDENTITY, POS, type PartOfSpeech, type EnglishResult, type EnglishIndexRow } from './model.js';
import type { Dataset } from './data.js';
export function searchEnglish(data: Dataset, input: string, partOfSpeech: PartOfSpeech = 'X', trim = true): EnglishResult {
    if (typeof input !== 'string' || !POS.includes(partOfSpeech) || typeof trim !== 'boolean')
        throw new TypeError('Invalid English lookup request');
    const lookup = (input.match(/[a-zA-Z]+/g)?.[0] ?? '').slice(0, 24).toLowerCase(), hits: EnglishIndexRow[] = [];
    const index = data.english;
    let left = 0, right = index.length - 1, j = Math.floor((left + right) / 2), first = true, second = true;
    const load = (row: EnglishIndexRow) => {
        if (partOfSpeech === 'X' || row.pos === partOfSpeech || row.pos === 'PACK' && partOfSpeech === 'PRON')
            hits.push(row);
    };
    if (lookup)
        for (let attempts = 0; attempts < 100; attempts++) {
            if (left === right - 1 || left === right) {
                if (first) {
                    j = left;
                    first = false;
                }
                else if (second) {
                    j = right;
                    second = false;
                }
                else
                    break;
            }
            const word = index[j].word.toLowerCase();
            if (word < lookup) {
                left = j;
                j = Math.floor((left + right) / 2);
            }
            else if (word > lookup) {
                right = j;
                j = Math.floor((left + right) / 2);
            }
            else {
                for (let i = j; i >= left; i--) {
                    if (index[i].word.toLowerCase() !== lookup)
                        break;
                    load(index[i]);
                }
                for (let i = j + 1; i <= right; i++) {
                    if (index[i].word.toLowerCase() !== lookup)
                        break;
                    load(index[i]);
                }
                break;
            }
        }
    if (hits.length > 500)
        throw new RangeError('Legacy English hit buffer exceeds 500 records');
    const frequency = 'XABCDEFIMN';
    hits.sort((a, b) => b.rank - a.rank || frequency.indexOf(a.frequency) - frequency.indexOf(b.frequency) || a.semi - b.semi);
    const totalHits = hits.length, trimmed = trim && totalHits > 6, selected = hits.slice(0, trimmed ? 6 : totalHits).map(index => ({ index, entry: data.entries[index.entryId - 1] }));
    let legacyText = selected.length ? '' : 'No Match\n';
    for (const { entry: e } of selected) {
        let citation = e.citation + '   ';
        const c = e.part.codes;
        if (e.part.pos === 'N')
            citation += '  ' + c[0] + ' ' + c[1] + '  ' + c[2] + '  ';
        if (e.part.pos === 'V') {
            citation += '  ' + c[0] + ' ' + c[1];
            if (['GEN', 'DAT', 'ABL', 'TRANS', 'INTRANS', 'IMPERS', 'DEP', 'SEMIDEP', 'PERFDEF'].includes(c[2]))
                citation += '  ' + c[2] + '  ';
        }
        legacyText += '\n' + citation + ' [' + e.flags + ']  \n' + e.meaning.replace(/^ +| +$/g, '') + '\n';
    }
    if (trimmed)
        legacyText += '*\n';
    return { schemaVersion: 1, snapshot: SNAPSHOT, engineVersion: VERSION, profile: trim && partOfSpeech === 'X' ? PROFILE : 'custom', dataIdentity: { ...DATA_IDENTITY }, input, lookup, partOfSpeech, totalHits, trimmed, hits: structuredClone(selected), legacyText };
}
