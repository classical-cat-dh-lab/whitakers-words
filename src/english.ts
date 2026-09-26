// Query the complete portable EWDS index, preserving the Ada binary-search tie order.
import { SNAPSHOT, PROFILE, VERSION, DATA_IDENTITY, POS, type PartOfSpeech, type EnglishResult, type EnglishIndexRow } from './model.js';
import type { Dataset } from './data.js';
export function searchEnglish(data: Dataset, input: string, partOfSpeech: PartOfSpeech = 'X', trim = true): EnglishResult {
    if (typeof input !== 'string' || !POS.includes(partOfSpeech) || typeof trim !== 'boolean')
        throw new TypeError('Invalid English lookup request');
    const lookup = (input.match(/[a-zA-Z]+/g)?.[0] ?? '').replaceAll('QV', 'QU').replaceAll('qv', 'qu').slice(0, 24).toLowerCase(), hits: EnglishIndexRow[] = [];
    const index = data.english;
    let left = 0, right = index.length - 1, j = Math.floor((left + right) / 2), first = true, second = true;
    let overflow = false;
    const load = (row: EnglishIndexRow) => {
        if (partOfSpeech === 'X' || row.pos === partOfSpeech || row.pos === 'PACK' && partOfSpeech === 'PRON') {
            if (hits.length === 500) {
                overflow = true;
                return;
            }
            hits.push(row);
        }
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
                    if (overflow)
                        break;
                }
                for (let i = j + 1; !overflow && i <= right; i++) {
                    if (index[i].word.toLowerCase() !== lookup)
                        break;
                    load(index[i]);
                    if (overflow)
                        break;
                }
                break;
            }
        }
    if (overflow) {
        const diagnostics = ['exception SEARCH NUMBER_OF_HITS =  501', 'Exception in PARSE_LINE processing ' + input, 'Unexpected exception raised in PARSE'];
        return { schemaVersion: 1, snapshot: SNAPSHOT, engineVersion: VERSION, profile: trim && partOfSpeech === 'X' ? PROFILE : 'custom', dataIdentity: { ...DATA_IDENTITY }, input, lookup, partOfSpeech, totalHits: 501, trimmed: false, hits: [], legacyText: diagnostics.join('\n') + '\n', status: 'legacy-error', truncated: true, diagnostics, legacyFailure: { stage: 'english-search', exitCode: 0 } };
    }
    const frequency = 'XABCDEFIMN';
    hits.sort((a, b) => b.rank - a.rank || frequency.indexOf(a.frequency) - frequency.indexOf(b.frequency) || a.semi - b.semi);
    const totalHits = hits.length, trimmed = trim && totalHits > 6, selected = hits.slice(0, trimmed ? 6 : totalHits).map(index => ({ index, entry: data.entries[index.entryId - 1] }));
    let legacyText = selected.length || !lookup ? '' : 'No Match\n';
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
