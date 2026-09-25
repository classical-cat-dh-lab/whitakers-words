// Ordered translations of List_Package.Fix_Adverb and List_Sweep.
import { type Parse, type LegacyOptions } from './model.js';
import { compareQ, dictionaryOrder, emptyEntry, emptyRule, nullParse, sameParse, sameQuality, LegacyConstraintError } from './core.js';
function allowed(p: Parse): boolean {
    if (p.dictionary !== 'GEN' || p.rule.quality.pos !== 'V')
        return true;
    const c = p.rule.quality.codes, part = p.entry.part;
    if (part.pos !== 'V')
        return false;
    const kind = part.codes[2];
    let result = true;
    if (c.join(',') === '3,1,PRES,ACTIVE,IMP,2,S' && !p.rule.ending && !['dic', 'duc', 'fac', 'fer'].includes(p.stem.slice(-3)))
        result = false;
    if (c[4] === 'IMP' && !(c[2] === 'PRES' && c[5] === '2' || c[2] === 'FUT' && ['2', '3'].includes(c[5])))
        result = false;
    if (kind === 'IMPERS' && c[5] !== '3')
        result = false;
    if (kind === 'DEP' && c[3] === 'ACTIVE' && ['IND', 'SUB', 'IMP', 'INF'].includes(c[4]))
        result = c[4] === 'INF' && c[2] === 'FUT';
    if (kind === 'SEMIDEP' && ['IND', 'SUB', 'IMP'].includes(c[4]) && (c[3] === 'PASSIVE' && ['PRES', 'IMPF', 'FUT'].includes(c[2]) || c[3] === 'ACTIVE' && ['PERF', 'PLUP', 'FUTP'].includes(c[2])))
        result = false;
    return result;
}
const xon = (p: Parse) => ['TACKON', 'PREFIX', 'SUFFIX'].includes(p.rule.quality.pos);
const artificial = (p: Parse) => ['ADDONS', 'XXX', 'YYY'].includes(p.dictionary);
const clone = (p: Parse): Parse => ({ ...p, rule: { ...p.rule, quality: { ...p.rule.quality, codes: [...p.rule.quality.codes] } } });
export function sweep(input: Parse[], options: LegacyOptions, context: {
    allCaps?: boolean;
    period?: boolean;
} = {}): {
    parses: Parse[];
    trimmed: boolean;
} {
    // Keep the storage beyond Last: Ada slice assignments leave those slots intact.
    const pa = [nullParse, ...input.map(clone)];
    let last = input.length, trimmed = false;
    const get = (i: number): Parse => pa[i] ?? nullParse;
    const copy = (to: number, from: number, count: number) => {
        const values = Array.from({ length: Math.max(0, count) }, (_, i) => get(from + i));
        values.forEach((p, i) => { pa[to + i] = p; });
    };
    const remove = (i: number, end: number) => copy(i, i + 1, end - i);
    let pppMeaning: string | undefined;
    if (options.fixes && !input.some(p => p.rule.quality.pos === 'ADV')) {
        let j1 = 0, j2 = 0;
        for (let i = last; i >= 1; i--) {
            const q = get(i).rule.quality, c = q.codes;
            if (q.pos !== 'ADJ' || c[2] !== 'VOC' || c[3] !== 'S' || c[4] !== 'M' || !(c[0] === '1' && c[1] === '1' && c[5] === 'POS' || c[5] === 'SUPER'))
                continue;
            let j = i;
            while (j >= 1) {
                if (get(j).rule.quality.pos !== 'ADJ') {
                    j2 = j;
                    break;
                }
                j--;
            }
            while (j >= 1) {
                if (!xon(get(j))) {
                    j1 = j;
                    break;
                }
                j--;
            }
            for (let k = j1 + 1; k <= j2; k++)
                pa[last + k - j1 + 1] = get(k);
            last += j2 - j1 + 1;
            pa[last] = { stem: 'e', rule: { ...emptyRule, quality: { pos: 'SUFFIX', codes: [] }, frequency: 'B' }, entry: emptyEntry, dictionary: 'PPP', traces: [] };
            last++;
            if (last > 100)
                throw new LegacyConstraintError('Legacy Fix_Adverb parse buffer overflow');
            const p = get(j2 + 1), comparison = p.rule.quality.codes[5];
            if (comparison === 'POS' || comparison === 'SUPER') {
                pppMeaning = comparison === 'POS' ? '-ly; -ily;  Converting ADJ to ADV' : '-estly; -estily; most -ly, very -ly  Converting ADJ to ADV';
                pa[last] = { ...p, rule: { ...emptyRule, quality: { pos: 'ADV', codes: [comparison] }, ending: comparison === 'POS' ? 'e' : 'me', frequency: 'B' } };
            }
        }
    }
    const pronKinds = ['X', 'PERS', 'REL', 'REFLEX', 'DEMONS', 'INTERR', 'INDEF', 'ADJECT'];
    for (let i = 1; i <= last; i++) {
        const p = get(i);
        if (p.dictionary === 'GEN' && p.entry.part.pos === 'PRON' && p.entry.part.codes[0] === '1') {
            pa[i] = clone(p);
            pa[i].rule.quality.codes[1] = String(pronKinds.indexOf(p.entry.part.codes[2]));
        }
    }
    const order = (first: number, end: number): number => {
        const originalEnd = end;
        const less = (a: Parse, b: Parse) => a.rule.quality.pos === 'PRON' && b.rule.quality.pos === 'PRON' && a.rule.quality.codes[0] === '1' ? +a.rule.quality.codes[1] < +b.rule.quality.codes[1] : compareQ(a.rule.quality, b.rule.quality) < 0;
        const equ = (a: Parse, b: Parse) => a.rule.quality.pos === 'PRON' && b.rule.quality.pos === 'PRON' && a.rule.quality.codes[0] === '1' ? a.rule.quality.codes[1] === b.rule.quality.codes[1] : sameQuality(a.rule.quality, b.rule.quality);
        const meaning = (p: Parse) => p.entry.id && ['GEN', 'UNI'].includes(p.dictionary) ? p.entry.meaning.padEnd(80) : ' '.repeat(80);
        const swap = (l: Parse, r: Parse) => dictionaryOrder.indexOf(r.dictionary) > dictionaryOrder.indexOf(l.dictionary) || r.dictionary === l.dictionary && (r.entry.id < l.entry.id || r.entry.id === l.entry.id && (less(r, l) || equ(r, l) && (meaning(r) < meaning(l) || meaning(r) === meaning(l) && (r.rule.ending.length < l.rule.ending.length || r.rule.ending.length === l.rule.ending.length && compareQ(r.rule.quality, l.rule.quality) < 0))));
        for (;;) {
            let hits = 0;
            for (let i = first; i < end; i++)
                if (swap(get(i), get(i + 1))) {
                    [pa[i], pa[i + 1]] = [get(i + 1), get(i)];
                    hits++;
                }
            if (!hits)
                break;
        }
        if (options.trim) {
            const items = pa.slice(first, end + 1);
            const nonArchaic = items.some(p => p.dictionary === 'GEN' && p.rule.age !== 'A' && p.entry.flags[0] !== 'A');
            const nonMedieval = items.some(p => p.dictionary === 'GEN' && 'XABCDE'.includes(p.rule.age) && 'XABCDE'.includes(p.entry.flags[0]));
            const nonUncommon = items.some(p => p.dictionary === 'GEN' && 'XAB'.includes(p.rule.frequency) && 'XABC'.includes(p.entry.flags[3]));
            const abbreviation = items.some(p => p.dictionary === 'GEN' && p.rule.quality.pos === 'N' && p.rule.quality.codes[0] === '9' && p.rule.quality.codes[1] === '8');
            for (let i = end; i >= first; i--) {
                const p = get(i);
                const reject = !allowed(p) || sameParse(p, nullParse) || nonArchaic && options.omitArchaic && p.rule.age === 'A' || nonMedieval && options.omitMedieval && 'FGH'.includes(p.rule.age) || nonUncommon && options.omitUncommon && 'CDEFIMN'.includes(p.rule.frequency) || abbreviation && context.allCaps && context.period && (p.rule.quality.pos !== 'N' || p.rule.quality.codes.join(',') !== '9,8,X,X,M' && p.stem.length === 1 && 'ACDLM'.includes(p.stem));
                if (reject) {
                    remove(i, end);
                    end--;
                    trimmed = true;
                }
            }
        }
        return originalEnd - end;
    };
    let fixOn = false, wordOn = false, first = 1, end = 0, diff = 0;
    for (let j = last; j >= 1; j--) {
        const p = get(j);
        if ((artificial(p) || xon(p)) && wordOn) {
            fixOn = true;
            wordOn = false;
            first = j + 1;
            if (get(j + 1).rule.quality.pos === p.rule.quality.pos)
                throw new Error('Legacy List_Sweep internal loop error (#70)');
            diff = order(first, end);
            copy(end - diff + 1, end + 1, last - end);
            last -= diff;
            first = 1;
            end = 0;
        }
        else if ((artificial(p) || xon(p)) && fixOn) {
            // Retain the associated fix rows, even if trimming removed their forms.
        }
        else if ((artificial(p) || p.rule.quality.pos === 'X') && !wordOn) {
            copy(end - diff + 1, end + 1, last - end);
            last -= diff;
            end--;
        }
        else {
            wordOn = true;
            fixOn = false;
            if (end <= 0)
                end = j;
            if (j === 1) {
                diff = order(1, end);
                copy(end - diff + 1, end + 1, last - end);
                last -= diff;
            }
        }
    }
    let previous = get(1), j = 2;
    while (j <= last) {
        const p = get(j);
        if (!sameParse(p, previous)) {
            if (!['XXX', 'YYY', 'PPP'].includes(p.dictionary)) {
                if (sameQuality(p.rule.quality, previous.rule.quality) && p.entry.id === previous.entry.id) {
                    remove(j, last);
                    last--;
                }
                else if (j + 1 <= last && sameParse(p, get(j + 1))) {
                    remove(j, last);
                    last--;
                }
            }
            else
                j++;
        }
        else
            j++;
        previous = p;
    }
    const parses = Array.from({ length: Math.max(0, last) }, (_, i) => clone(get(i + 1)));
    for (const p of parses) {
        const q = p.rule.quality;
        if (q.pos === 'PRON' && q.codes[0] === '1')
            q.codes[1] = '0';
        if (q.pos === 'V' && q.codes[0] === '3' && q.codes[1] === '4') {
            q.codes[0] = '4';
            q.codes[1] = '1';
        }
        if (p.dictionary === 'PPP' && pppMeaning !== undefined)
            p.entry = { ...p.entry, meaning: pppMeaning };
    }
    return { parses, trimmed };
}
