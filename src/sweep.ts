import { POS, type Parse, type LegacyOptions } from './model.js';
import { compareQ, emptyEntry, emptyRule } from './core.js';
function allowed(p: Parse): boolean {
    if (p.dictionary !== 'GEN')
        return true;
    const q = p.rule.quality, c = q.codes, part = p.entry.part;
    if (q.pos !== 'V')
        return true;
    if (part.pos !== 'V')
        return false;
    const kind = part.codes[2];
    if (c[0] === '3' && c[1] === '1' && c[2] === 'PRES' && c[3] === 'ACTIVE' && c[4] === 'IMP' && c[5] === '2' && c[6] === 'S' && !p.rule.ending && !['dic', 'duc', 'fac', 'fer'].includes(p.stem.slice(-3)))
        return false;
    if (c[4] === 'IMP' && !(c[2] === 'PRES' && c[5] === '2' || c[2] === 'FUT' && ['2', '3'].includes(c[5])))
        return false;
    if (kind === 'IMPERS' && c[5] !== '3')
        return false;
    if (kind === 'DEP' && c[3] === 'ACTIVE' && ['IND', 'SUB', 'IMP', 'INF'].includes(c[4]) && !(c[4] === 'INF' && c[2] === 'FUT'))
        return false;
    if (kind === 'SEMIDEP' && ['IND', 'SUB', 'IMP'].includes(c[4]) && (c[3] === 'PASSIVE' && ['PRES', 'IMPF', 'FUT'].includes(c[2]) || c[3] === 'ACTIVE' && ['PERF', 'PLUP', 'FUTP'].includes(c[2])))
        return false;
    return true;
}
const key = (p: Parse) => p.dictionary + ':' + p.entry.id + ':' + JSON.stringify(p.rule.quality);
const artificial = (p: Parse) => ['ADDONS', 'XXX', 'YYY'].includes(p.dictionary) || ['TACKON', 'PREFIX', 'SUFFIX'].includes(p.rule.quality.pos);
export function sweep(input: Parse[], options: LegacyOptions, context: {
    allCaps?: boolean;
    period?: boolean;
} = {}): {
    parses: Parse[];
    trimmed: boolean;
} {
    let parses = input.map(p => ({ ...p, rule: { ...p.rule, quality: { ...p.rule.quality, codes: [...p.rule.quality.codes] } } })), trimmed = false;
    // The source adds the adjective-to-adverb fallback only when no ADV is present.
    if (!parses.some(p => p.rule.quality.pos === 'ADV')) {
        const extras: Parse[] = [];
        for (let i = parses.length - 1; i >= 0; i--) {
            const q = parses[i].rule.quality, c = q.codes;
            if (q.pos === 'ADJ' && c[2] === 'VOC' && c[3] === 'S' && c[4] === 'M' && (c[0] === '1' && c[1] === '1' && c[5] === 'POS' || c[5] === 'SUPER')) {
                let start = i;
                while (start > 0 && parses[start - 1].rule.quality.pos === 'ADJ')
                    start--;
                let fix = start;
                while (fix > 0 && ['TACKON', 'PREFIX', 'SUFFIX'].includes(parses[fix - 1].rule.quality.pos))
                    fix--;
                const p = parses[start], comparison = p.rule.quality.codes[5];
                const meaning = comparison === 'POS' ? '-ly; -ily;  Converting ADJ to ADV' : '-estly; -estily; most -ly, very -ly  Converting ADJ to ADV';
                if (fix < start)
                    extras.push({ stem: '', rule: emptyRule, entry: emptyEntry, dictionary: 'PPP', literal: '', traces: [] }, ...parses.slice(fix, start - 1));
                extras.push({ stem: 'e', rule: { ...emptyRule, quality: { pos: 'SUFFIX', codes: [] }, frequency: 'B' }, entry: { ...emptyEntry, meaning }, dictionary: 'PPP', traces: [] }, { ...p, rule: { ...emptyRule, quality: { pos: 'ADV', codes: [comparison] }, ending: comparison === 'POS' ? 'e' : 'me', frequency: 'B' } });
            }
        }
        parses.push(...extras);
    }
    const groups: Parse[][] = [];
    let markers: Parse[] = [];
    let regular: Parse[] = [];
    const flush = () => {
        if (regular.length) {
            groups.push([...markers, ...regular]);
            markers = [];
            regular = [];
        }
    };
    for (const p of parses) {
        if (artificial(p)) {
            flush();
            markers.push(p);
        }
        else
            regular.push(p);
    }
    flush();
    const output: Parse[] = [];
    for (const group of groups) {
        const prefixes = group.filter(artificial), items = group.filter(p => !artificial(p));
        const dictionaryOrder = ['ADDONS', 'XXX', 'YYY', 'RRR', 'PPP', 'GEN', 'UNI'];
        items.sort((a, b) => dictionaryOrder.indexOf(b.dictionary) - dictionaryOrder.indexOf(a.dictionary) || a.entry.id - b.entry.id || compareQ(a.rule.quality, b.rule.quality) || a.rule.ending.length - b.rule.ending.length);
        const nonArchaic = items.some(p => p.dictionary === 'GEN' && p.rule.age !== 'A' && p.entry.flags[0] !== 'A');
        const nonMedieval = items.some(p => p.dictionary === 'GEN' && 'XABCDE'.includes(p.rule.age) && 'XABCDE'.includes(p.entry.flags[0]));
        const nonUncommon = items.some(p => p.dictionary === 'GEN' && 'XAB'.includes(p.rule.frequency) && 'XABC'.includes(p.entry.flags[3]));
        const abbreviation = items.some(p => p.dictionary === 'GEN' && p.rule.quality.pos === 'N' && p.rule.quality.codes[0] === '9' && p.rule.quality.codes[1] === '8');
        let kept = options.trim ? items.filter(p => {
            const abbreviationReject = abbreviation && context.allCaps && context.period && (p.rule.quality.pos !== 'N' || p.rule.quality.codes.join(',') !== '9,8,X,X,M' && p.stem.length === 1 && 'ACDLM'.includes(p.stem));
            const reject = abbreviationReject || p.literal === '' || !allowed(p) || nonArchaic && options.omitArchaic && p.rule.age === 'A' || nonMedieval && options.omitMedieval && 'FGH'.includes(p.rule.age) || nonUncommon && options.omitUncommon && 'CDEFIMN'.includes(p.rule.frequency);
            if (reject)
                trimmed = true;
            return !reject;
        }) : items;
        const seen = new Set<string>();
        kept = kept.filter(p => {
            const k = key(p);
            if (seen.has(k))
                return false;
            seen.add(k);
            return true;
        });
        if (kept.length)
            output.push(...prefixes, ...kept);
    }
    for (const p of output) {
        const q = p.rule.quality;
        if (q.pos === 'PRON' && q.codes[0] === '1')
            q.codes[1] = '0';
        if (q.pos === 'V' && q.codes[0] === '3' && q.codes[1] === '4') {
            q.codes[0] = '4';
            q.codes[1] = '1';
        }
    }
    return { parses: output, trimmed };
}
