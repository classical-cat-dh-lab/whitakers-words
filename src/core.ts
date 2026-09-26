// Port of the pinned WORDS matching/control rules. Upstream notice: licenses/whitaker.txt.
import { POS, DEFAULT_OPTIONS, eq, norm, effective, cloneQuality, type Quality, type Rule, type Parse, type Entry, type Part, type Stem, type Affix, type LegacyOptions, type Trace } from './model.js';
import type { Dataset } from './data.js';
import { ParseBuffer, emptyEntry, emptyRule, nullParse, LegacyConstraintError } from './buffer.js';
export { emptyEntry, emptyRule, nullParse, LegacyConstraintError } from './buffer.js';
export function decn(left: readonly string[], right: readonly string[]): boolean {
    return left[0] === right[0] && left[1] === right[1] || right[0] === '0' && right[1] === '0' && left[0] !== '9' || left[0] === right[0] && right[1] === '0';
}
const grade = (key: number, adverb = false) => adverb ? (['X', 'POS', 'COMP', 'SUPER'][key] ?? 'X') : (['POS', 'POS', 'POS', 'COMP', 'SUPER'][key] ?? 'X');
// Addons_Package.Equ folds u/v only; dictionary matching also folds i/j.
const affixEq = (a: string, b: string) => a.toLowerCase().replaceAll('v', 'u') === b.toLowerCase().replaceAll('v', 'u');
export function resolveRule(rule: Rule, part: Part, key: number): Rule | null {
    if (part.pos !== effective(rule.quality.pos))
        return null;
    if (!(key === rule.key || rule.key === 0 || key === 0 && ['N', 'ADJ', 'V'].includes(part.pos) && [1, 2].includes(rule.key)))
        return null;
    const q = cloneQuality(rule.quality), c = q.codes, d = part.codes;
    switch (part.pos) {
        case 'N':
            if (!decn(d, c) || !(d[2] === c[4] || c[4] === 'X' || c[4] === 'C' && d[2] !== 'N'))
                return null;
            c[0] = d[0];
            c[1] = d[1];
            c[4] = d[2];
            break;
        case 'PRON':
        case 'PACK':
        case 'V':
            if (!decn(d, c))
                return null;
            c[0] = d[0];
            c[1] = d[1];
            break;
        case 'ADJ':
            if (!decn(d, c) || !(c[5] === d[2] || c[5] === 'X' || d[2] === 'X'))
                return null;
            c[0] = d[0];
            c[1] = d[1];
            c[5] = d[2] !== 'X' ? d[2] : grade(key);
            break;
        case 'NUM':
            if (!decn(d, c) || key !== rule.key)
                return null;
            c[0] = d[0];
            c[1] = d[1];
            c[5] = d[2] !== 'X' ? d[2] : (['X', 'CARD', 'ORD', 'DIST', 'ADVERB'][key] ?? 'X');
            break;
        case 'ADV':
            if (!(c[0] === d[0] || c[0] === 'X' || d[0] === 'X'))
                return null;
            c[0] = d[0] !== 'X' ? d[0] : grade(key, true);
            break;
        case 'PREP':
            if (c[0] !== d[0])
                return null;
            break;
    }
    return { ...rule, quality: q };
}
const order = (s: string, values: string[]) => values.indexOf(s);
export function qualityKey(q: Quality): number[] {
    const c = q.codes, p = q.pos;
    const head = [POS.indexOf(p)];
    const n = (s: string) => order(s, ['X', 'S', 'P']), cs = (s: string) => order(s, ['X', 'NOM', 'VOC', 'GEN', 'LOC', 'DAT', 'ABL', 'ACC']), g = (s: string) => order(s, ['X', 'M', 'F', 'N', 'C']);
    const tense = (s: string) => order(s, ['X', 'PRES', 'IMPF', 'FUT', 'PERF', 'PLUP', 'FUTP']), voice = (s: string) => order(s, ['X', 'ACTIVE', 'PASSIVE']), mood = (s: string) => order(s, ['X', 'IND', 'SUB', 'IMP', 'INF', 'PPL']);
    if (['N', 'PRON', 'PACK', 'ADJ', 'NUM', 'VPAR', 'SUPINE'].includes(p)) {
        head.push(+c[0], +c[1], n(c[3]), cs(c[2]), g(c[4]));
        if (p === 'ADJ')
            head.push(order(c[5], ['X', 'POS', 'COMP', 'SUPER']));
        if (p === 'NUM')
            head.push(order(c[5], ['X', 'CARD', 'ORD', 'DIST', 'ADVERB']));
        // Native VPAR ordering deliberately ignores tense, voice and mood.
    }
    else if (p === 'V')
        head.push(+c[0], +c[1], n(c[6]), tense(c[2]), voice(c[3]), mood(c[4]), +c[5]);
    else if (p === 'ADV')
        head.push(order(c[0], ['X', 'POS', 'COMP', 'SUPER']));
    else if (p === 'PREP')
        head.push(cs(c[0]));
    return head;
}
export function compareQ(a: Quality, b: Quality): number {
    const l = qualityKey(a), r = qualityKey(b);
    for (let i = 0; i < Math.max(l.length, r.length); i++) {
        const d = (l[i] ?? 0) - (r[i] ?? 0);
        if (d)
            return d;
    }
    return 0;
}
export function dedup(parses: Parse[]): Parse[] {
    let previous: Parse | undefined;
    return parses.filter(p => {
        if (previous && p.entry.id === previous.entry.id && sameQuality(p.rule.quality, previous.rule.quality))
            return false;
        previous = p;
        return true;
    });
}
export const dictionaryOrder = ['X', 'ADDONS', 'XXX', 'YYY', 'NNN', 'RRR', 'PPP', 'GEN', 'SPE', 'LOC', 'UNI'];
export const sameQuality = (a: Quality, b: Quality) => a.pos === b.pos && a.codes.join(',') === b.codes.join(',');
export const sameRule = (a: Rule, b: Rule) => sameQuality(a.quality, b.quality) && a.key === b.key && a.ending === b.ending && a.age === b.age && a.frequency === b.frequency;
export const sameParse = (a: Parse, b: Parse) => a.stem === b.stem && sameRule(a.rule, b.rule) && a.entry.id === b.entry.id && a.dictionary === b.dictionary;
export function sorted(parses: Parse[]): Parse[] { return dedup(parses.sort((a, b) => a.entry.id - b.entry.id || a.rule.ending.length - b.rule.ending.length || compareQ(a.rule.quality, b.rule.quality) || (sameQuality(a.rule.quality, b.rule.quality) ? dictionaryOrder.indexOf(a.dictionary) - dictionaryOrder.indexOf(b.dictionary) : 0))); }
export function marker(affix: Affix, kind: Trace['kind'], input: string, output: string): Parse {
    const trace: Trace = { kind, sourceId: `ADDONS.LAT:${affix.sourceLine}`, input, output, explanation: affix.meaning };
    return { stem: affix.fix, rule: { ...emptyRule, quality: { pos: affix.kind, codes: [] } }, entry: { ...emptyEntry, id: affix.id, meaning: affix.meaning }, dictionary: 'ADDONS', traces: [trace] };
}
export class LegacyCore {
    // Native PDL survives rejected attempts. It belongs to this request, not the dataset.
    private candidates: Stem[] = [];
    // QU/PACK searches still consume SSA(1) when no new inflection replaces it.
    private reducedStem = 'x'.repeat(18);
    onlyFixes = false;
    usePrefixes = true;
    readonly options: LegacyOptions;
    readonly prefixes: Affix[];
    readonly suffixes: Affix[];
    readonly tackons: Affix[];
    readonly packons: Affix[];
    readonly tickons: Affix[];
    constructor(readonly data: Dataset, options: Partial<LegacyOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.prefixes = data.affixes.filter(a => a.kind === 'PREFIX' && a.codes[0] !== 'PACK');
        this.tickons = data.affixes.filter(a => a.kind === 'PREFIX' && a.codes[0] === 'PACK');
        this.suffixes = data.affixes.filter(a => a.kind === 'SUFFIX');
        this.packons = data.affixes.filter(a => a.kind === 'TACKON' && a.codes[0] === 'PACK' && ['1', '2'].includes(a.codes[1]) && a.meaning.startsWith('PACKON w/'));
        this.tackons = data.affixes.filter(a => a.kind === 'TACKON' && !this.packons.includes(a));
    }
    pairs(word: string, qu = false): {
        stem: string;
        rule: Rule;
    }[] {
        const out: {
            stem: string;
            rule: Rule;
        }[] = [];
        if (!word)
            return out;
        if (!qu && word.length <= 18)
            for (const rule of this.data.endings.get('0:') ?? [])
                out.push({ stem: word, rule });
        if (!qu && !('acdeimnorst u'.replaceAll(' ', '').includes(word.at(-1)!)))
            return out;
        for (let size = Math.min(qu ? 6 : 7, word.length); size >= 1; size--) {
            if (word.length - size > 18)
                continue;
            for (const rule of this.data.endings.get(size + ':' + word.at(-1)) ?? []) {
                const special = rule.quality.pos === 'PRON' && ['1', '2'].includes(rule.quality.codes[0]);
                if (qu !== special || !eq(rule.ending, word.slice(-size)))
                    continue;
                out.push({ stem: word.slice(0, -size), rule });
            }
        }
        return out;
    }
    private search(stems: string[], restriction: 'regular' | 'qu' | 'pack' = 'regular'): void {
        this.candidates = [];
        const input = [...new Set(stems)].sort((a, b) => a.length - b.length);
        if (!input.length)
            return;
        const load = (item: Stem, restricted = true) => {
            const p = item.entry.part;
            if (restricted && (restriction === 'regular' && (p.pos === 'PACK' || p.pos === 'PRON' && p.codes[0] === '1') || restriction === 'qu' && !(p.pos === 'PRON' && p.codes[0] === '1') || restriction === 'pack' && p.pos !== 'PACK'))
                return;
            if (this.candidates.length === 80)
                throw new LegacyConstraintError('Legacy PDL exceeds 80 records');
            this.candidates.push(item);
        };
        if (!input[0].length)
            load(this.data.orderedStems[0], false);
        const short = input[0].length === 1 ? input[0] : !input[0].length && input[1]?.length === 1 ? input[1] : null;
        if (short !== null)
            for (const item of this.data.stems.get(norm(short)) ?? [])
                load(item, false);
        const range = this.data.stemRanges.get(norm(input.at(-1)!).slice(0, 2));
        if (!range || input.at(-1)!.length < 2)
            return;
        const { orderedStems: index, stemKeys: keys } = this.data;
        let [left, right] = range;
        for (const stem of input) {
            if (stem.length <= 1)
                continue;
            const key = norm(stem);
            let first = true, second = true, j = Math.floor((left + right) / 2), last = j;
            for (;;) {
                if (left === right - 1 || left === right) {
                    if (first) {
                        j = left;
                        first = false;
                    }
                    else if (second) {
                        j = right;
                        second = false;
                    }
                    else {
                        last = j;
                        break;
                    }
                }
                if (keys[j] < key) {
                    left = j;
                    j = Math.floor((left + right) / 2);
                }
                else if (keys[j] > key) {
                    right = j;
                    j = Math.floor((left + right) / 2);
                }
                else {
                    for (let i = j; i >= left && keys[i] === key; i--) {
                        last = i;
                        load(index[i]);
                    }
                    for (let i = j + 1; i <= right && keys[i] === key; i++) {
                        last = i;
                        load(index[i]);
                    }
                    break;
                }
            }
            left = last;
            right = range[1];
        }
    }
    basic(word: string, restriction: 'regular' | 'qu' | 'pack' = 'regular', retained = false, pack?: Affix, destination?: ParseBuffer, packInput = word): Parse[] {
        const out: Parse[] = [];
        const pairs = this.pairs(word, restriction !== 'regular').filter(pair => (restriction !== 'qu' || pair.rule.key === (word.startsWith('qu') || word.startsWith('aliqu') ? 1 : 2) && pair.rule.ending.length <= 4) && (!pack || decn(pair.rule.quality.codes, pack.codes.slice(1))));
        if (restriction === 'regular') {
            if (!pairs.length)
                return out;
            this.reducedStem = pairs.reduce((a, b) => a.stem.length < b.stem.length ? a : b).stem;
            if (!retained)
                this.search(pairs.map(p => p.stem), restriction);
        }
        else {
            if (pairs.length)
                this.reducedStem = pairs.at(-1)!.stem;
            this.search([this.reducedStem], restriction);
        }
        if (pairs.length > 250)
            throw new LegacyConstraintError('Legacy inflection buffer exceeds 250 records');
        for (const item of this.candidates) {
            for (const pair of pairs) {
                // Reduce_Stem_List joins the retained PDL by stem length, not spelling.
                if (restriction === 'regular' && item.stem.length !== pair.stem.length)
                    continue;
                const e = item.entry, p = e.part;
                if (pack && !e.meaning.trimStart().startsWith('(w/-' + pack.fix))
                    continue;
                if (restriction === 'qu' && p.pos !== 'PRON' || restriction === 'pack' && p.pos !== 'PACK')
                    throw new LegacyConstraintError('Legacy QU dictionary variant mismatch');
                let rule: Rule | null;
                if (restriction === 'qu' || restriction === 'pack') {
                    if (p.codes[0] !== pair.rule.quality.codes[0] || p.codes[1] !== pair.rule.quality.codes[1])
                        continue;
                    rule = { ...pair.rule, quality: { pos: 'PRON', codes: [...pair.rule.quality.codes] } };
                }
                else
                    rule = resolveRule(pair.rule, p, item.key);
                if (rule) {
                    if (restriction === 'regular' && out.length === 250)
                        throw new LegacyConstraintError('Legacy reduced buffer exceeds 250 records');
                    const packMarker = pack ? marker(pack, 'tackon', packInput, word) : null;
                    const record: Parse = { stem: pair.stem, rule, entry: e, dictionary: 'GEN', traces: packMarker?.traces ?? [] };
                    if (destination) {
                        if (pack && !out.length)
                            destination.append(packMarker!);
                        destination.append(record);
                    }
                    out.push(record);
                }
            }
        }
        return restriction === 'regular' ? sorted(out) : out;
    }
    uniques(word: string): Parse[] { return this.data.uniques.filter(u => eq(u.word, word.slice(0, 18))).reverse().map(u => ({ stem: u.word, rule: { ...emptyRule, quality: cloneQuality(u.quality) }, entry: { ...emptyEntry, id: u.id, sourceLine: u.sourceLine, stems: [u.word, '', '', ''], flags: u.flags, meaning: u.meaning, citation: u.word + '  X' }, dictionary: 'UNI', traces: [] })); }
    subtract(word: string, fix: Affix, prefix = false): string | null {
        if (word.length <= fix.fix.length)
            return null;
        if (prefix) {
            if (!affixEq(word.slice(0, fix.fix.length), fix.fix) || fix.connect && word[fix.fix.length] !== fix.connect)
                return null;
            return word.slice(fix.fix.length);
        }
        if (!affixEq(word.slice(-fix.fix.length), fix.fix) || fix.kind === 'SUFFIX' && fix.connect && word[word.length - fix.fix.length - 1] !== fix.connect)
            return null;
        return word.slice(0, -fix.fix.length);
    }
    private quInto(word: string, pa: ParseBuffer): void {
        const saved = pa.last;
        try {
            for (const tick of [...this.tickons, null]) {
                const less = tick && this.usePrefixes ? this.subtract(word, tick, true) : null;
                const w = (less ?? word).slice(0, 18);
                pa.last = saved;
                pa.set(saved + 1, nullParse);
                if (tick && w === word)
                    continue;
                if (tick)
                    pa.append(marker(tick, 'prefix', word, w));
                if ((w.startsWith('qu') || w.startsWith('cu')) && w.length >= 3) {
                    this.basic(w, 'qu', false, undefined, pa);
                    if (pa.last > saved + 1)
                        return;
                    for (const affix of this.packons) {
                        let stem = this.subtract(w, affix);
                        if (stem === null)
                            continue;
                        if (affix.fix.startsWith('dam') && stem.endsWith('n'))
                            stem = stem.slice(0, -1) + 'm';
                        this.basic(stem, 'pack', false, affix, pa, word);
                    }
                    if (pa.last > saved + 1)
                        return;
                }
                else if (word.length >= 6 && (word.startsWith('aliqu') || word.startsWith('alicu')))
                    this.basic(word, 'qu', false, undefined, pa);
                if (pa.last === saved + 1)
                    pa.last = saved;
                else
                    return;
            }
        }
        catch (error) {
            if (!(error instanceof LegacyConstraintError))
                throw error;
            // QU catches a constraint failure without restoring Pa_Last or storage.
        }
    }
    private fixedInto(word: string, prefixesFirst: boolean, pa: ParseBuffer): void {
        const pairs = this.pairs(word);
        const prefixes = this.usePrefixes ? this.prefixes.filter(p => word[0] === p.fix[0] && word.length > p.fix.length && eq(word.slice(0, p.fix.length), p.fix)) : [];
        const match = (prefix: Affix | null, suffix: Affix | null): Parse[] => {
            const hits: Parse[] = [];
            const roots: string[] = [];
            for (const pair of pairs) {
                let root = pair.stem;
                if (suffix) {
                    const less = this.subtract(root, suffix);
                    if (less === null)
                        continue;
                    root = less;
                }
                if (prefix) {
                    const less = this.subtract(root, prefix, true);
                    if (less === null)
                        continue;
                    root = less;
                }
                roots.push(root);
            }
            if (!roots.length)
                return hits;
            this.search(roots);
            for (const item of this.candidates) {
                for (const pair of pairs) {
                    if (Math.min(18, item.stem.length + (prefix?.fix.length ?? 0) + (suffix?.fix.length ?? 0)) !== pair.stem.length)
                        continue;
                    let part = item.entry.part, key = item.key;
                    if (['N', 'ADJ'].includes(part.pos) && part.codes[0] === '9' && part.codes[1] === '8')
                        continue;
                    if (suffix) {
                        const s = suffix.codes;
                        if (!(part.pos === s[0] || s[0] === 'X' || part.pos === 'PACK' && s[0] === 'PRON'))
                            continue;
                        if (!(key === +s[1] || +s[1] === 0 || key === 0 && ['N', 'ADJ', 'V'].includes(part.pos) && [1, 2].includes(+s[1])))
                            continue;
                        if (['N', 'PRON', 'ADJ', 'NUM', 'ADV', 'V'].includes(s[2]))
                            part = { pos: s[2] as Part['pos'], codes: s.slice(3, -1) };
                        key = +s.at(-1)!;
                    }
                    // Reduce_Stem_List tests the suffix-transformed part for a prefix.
                    if (prefix && (part.pos === 'INTERJ' || part.pos === 'CONJ' || ['N', 'ADJ'].includes(part.pos) && part.codes[0] === '9' && part.codes[1] === '8' || !(prefix.codes[0] === 'X' || prefix.codes[0] === part.pos)))
                        continue;
                    const rule = resolveRule(pair.rule, part, key);
                    if (!rule)
                        continue;
                    if (hits.length === 250)
                        throw new LegacyConstraintError('Legacy reduced buffer exceeds 250 records');
                    hits.push({ stem: prefix ? pair.stem.slice(prefix.fix.length) : pair.stem, rule, entry: item.entry, dictionary: 'GEN', traces: [] });
                }
            }
            return hits;
        };
        const tryPrefixes = (): Parse[] => {
            for (const prefix of prefixes) {
                const hit = match(prefix, null);
                if (hit.length) {
                    const m = marker(prefix, 'prefix', word, word.slice(prefix.fix.length));
                    return [m, ...sorted(hit).map(p => ({ ...p, traces: m.traces }))];
                }
            }
            return [];
        };
        if (prefixesFirst) {
            const hit = tryPrefixes();
            if (hit.length) {
                pa.appendAll(hit);
                return;
            }
        }
        let lastReduction: Parse[] = [];
        for (const suffix of this.suffixes) {
            if (!pairs.some(p => this.subtract(p.stem, suffix) !== null))
                continue;
            let hit = match(null, suffix);
            let prefixMarker: Parse | null = null;
            if (!this.candidates.length)
                for (const prefix of prefixes) {
                    hit = match(prefix, suffix);
                    if (hit.length) {
                        prefixMarker = marker(prefix, 'prefix', word, word.slice(prefix.fix.length));
                        break;
                    }
                }
            lastReduction = hit;
            if (hit.length) {
                const m = marker(suffix, 'suffix', word, word);
                const traces = [...(prefixMarker?.traces ?? []), ...m.traces];
                pa.appendAll([...(prefixMarker ? [prefixMarker] : []), m, ...hit.map(p => ({ ...p, traces }))]);
            }
        }
        // Prune_Stems tests the last SXX, not whether any earlier suffix succeeded.
        const tail = lastReduction.length ? sorted([...lastReduction]) : tryPrefixes();
        pa.appendAll(tail);
    }
    word(raw: string, fixes = false, depth = 0, entering = 0, capacity = 100): Parse[] {
        const pa = new ParseBuffer(capacity);
        pa.last = entering;
        this.wordInto(raw, pa, fixes);
        return pa.read(entering + 1);
    }
    wordInto(raw: string, pa: ParseBuffer, fixes = false): void {
        const saved = pa.last;
        try {
            this.wordBody(raw, pa, fixes);
        }
        catch (error) {
            if (error instanceof LegacyConstraintError) {
                pa.last = saved;
                return;
            }
            throw error;
        }
    }
    private wordBody(raw: string, pa: ParseBuffer, fixes: boolean): void {
        const word = raw.toLowerCase();
        const entering = pa.last;
        if (!word)
            return;
        pa.appendAll(this.uniques(word));
        this.quInto(word, pa);
        const regular = this.basic(word, 'regular', this.onlyFixes);
        if (!pa.last && !regular.length && fixes)
            this.fixedInto(word, !this.candidates.length, pa);
        else
            pa.appendAll(regular);
        if (pa.last === entering)
            for (const tack of this.tackons.slice(4)) {
                const less = this.subtract(word, tack);
                if (less === null)
                    continue;
                this.wordInto(less, pa, fixes);
                const p = tack.codes[0];
                let tackOn = false, tackHit = p === 'X' && pa.last > entering;
                if (p !== 'X')
                    for (let j = pa.last; j > entering; j--) {
                        const q = pa.get(j).rule.quality;
                        if (['PREFIX', 'SUFFIX'].includes(q.pos) && tackOn) {
                            tackOn = false;
                            continue;
                        }
                        if (q.pos === p) {
                            if (p === 'ADJ' || ['N', 'PRON'].includes(p) && decn(q.codes, tack.codes.slice(1))) {
                                tackHit = true;
                                tackOn = true;
                                continue;
                            }
                            // Native N mismatch leaves the row in place; PRON removes it.
                            if (p === 'N')
                                continue;
                        }
                        pa.remove(j);
                    }
                if (tackHit) {
                    const m = marker(tack, 'tackon', word, less);
                    pa.insert(entering + 1, m);
                    for (let i = entering + 2; i <= pa.last; i++) {
                        const x = pa.get(i);
                        pa.set(i, { ...x, traces: [...m.traces, ...x.traces] });
                    }
                    return;
                }
            }
    }
}
