import { POS, QUALITY_LENGTH, norm, type SourceData, type Entry, type Rule, type Affix, type Unique, type Stem, type PartOfSpeech, type Quality, type Part, type EnglishIndexRow } from './model.js';
export interface Dataset {
    entries: Entry[];
    rules: Rule[];
    affixes: Affix[];
    uniques: Unique[];
    stems: Map<string, Stem[]>;
    orderedStems: Stem[];
    stemKeys: string[];
    stemRanges: Map<string, [
        number,
        number
    ]>;
    endings: Map<string, Rule[]>;
    stemCount: number;
    english: EnglishIndexRow[];
}
const checks: Record<keyof SourceData, string> = { dictionary: '8f6c0fc84d12859abc863eac84ddd49b7e039503855ca34c1d44a6e78abf7569', inflections: 'dd0f019669719d820f690a6199286f6f54addfb06e959a7592699f8c7e6d2a9b', addons: '7a7f40b3020913882e8bfa156ebe01ee3f640b4505ef2b79c8836ef6b8a948fb', uniques: 'ed81efca10ec23d96e992724a98538c820f489b6ea3658afb1356ce6d2f7c8e2', dictionaryForms: '3e6b20033e6cd894586f89e16352b071a1f3ef0e017de21d0d1c1d4eb0fbe218', englishIndex: '7750aad0435854489aa4374055b58a6db8c270bca7eab130ecf602633b5fa13d' };
function pos(s: string): PartOfSpeech {
    if (!(POS as readonly string[]).includes(s))
        throw new Error(`Unknown legacy POS: ${s}`);
    return s as PartOfSpeech;
}
const words = (s: string) => s.trim().split(/\s+/);
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
// Dictionary_Package."<", followed by the remaining stemlist-sort fields.
function partKey(p: Part): number[] {
    const c = p.codes, at = (value: string, set: string) => set.split(' ').indexOf(value);
    const grade = 'X POS COMP SUPER';
    const k = [POS.indexOf(p.pos)];
    if (['N', 'PRON', 'PACK', 'ADJ', 'NUM', 'V'].includes(p.pos))
        k.push(+c[0], +c[1]);
    if (p.pos === 'N')
        k.push(at(c[2], 'X M F N C'), at(c[3], 'X S M A G N P T L W'));
    if (p.pos === 'PRON' || p.pos === 'PACK')
        k.push(at(c[2], 'X PERS REL REFLEX DEMONS INTERR INDEF ADJECT'));
    if (p.pos === 'ADJ')
        k.push(at(c[2], grade));
    if (p.pos === 'NUM')
        k.push(at(c[2], 'X CARD ORD DIST ADVERB'), +c[3]);
    if (p.pos === 'ADV')
        k.push(at(c[0], grade));
    if (p.pos === 'V')
        k.push(at(c[2], 'X TO_BE TO_BEING GEN DAT ABL TRANS INTRANS IMPERS DEP SEMIDEP PERFDEF'));
    if (p.pos === 'PREP')
        k.push(at(c[0], 'X NOM VOC GEN LOC DAT ABL ACC'));
    return k;
}
function lines(s: string): {
    text: string;
    line: number;
}[] { return s.split('\n').map((text, i) => ({ text: text.replace(/\r$/, ''), line: i + 1 })); }
function active(s: string): {
    text: string;
    line: number;
}[] { return lines(s).filter(x => x.text.trim() && !x.text.trimStart().startsWith('--')); }
export async function loadDataset(data: SourceData): Promise<Dataset> {
    for (const [key, digest] of Object.entries(checks)) {
        const buffer = new TextEncoder().encode(data[key as keyof SourceData]);
        const actual = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), n => n.toString(16).padStart(2, '0')).join('');
        if (actual !== digest)
            throw new Error(`Canonical legacy data checksum mismatch: ${key}`);
    }
    return parseDataset(data);
}
export function parseDataset(data: SourceData): Dataset {
    const citations = active(data.dictionaryForms).map(({ text }, i) => {
        const tab = text.indexOf('\t');
        if (Number(text.slice(0, tab)) !== i + 1)
            throw new Error('Invalid citation table identity');
        return text.slice(tab + 1);
    });
    const entries: Entry[] = data.dictionary.split('\n').filter(text => text.trim()).map((text, i) => {
        const line = i + 1;
        if (text.length < 110 || text.length > 191)
            throw new Error(`Invalid dictionary row ${line}`);
        const p = pos(text.slice(76, 82).trim());
        return { id: i + 1, sourceLine: line, stems: [0, 19, 38, 57].map(n => text.slice(n, n + 18).trimEnd()) as Entry['stems'], part: { pos: p, codes: text.slice(83, 99).trim().split(/\s+/).filter(Boolean) }, flags: [100, 102, 104, 106, 108].map(n => text[n]).join(''), meaning: text.slice(110, 190).replace(/ +$/, ''), citation: citations[i] };
    });
    entries.push({ id: entries.length + 1, sourceLine: null, stems: ['s', '', 'fu', 'fut'], part: { pos: 'V', codes: ['5', '1', 'TO_BE'] }, flags: 'XXXAX', meaning: 'be; exist; (also used to form verb perfect passive tenses) with NOM PERF PPL', citation: citations[entries.length] });
    if (entries.length !== 39336 || citations.length !== 39336)
        throw new Error('Canonical dictionary/citation accounting failed');
    const rules: Rule[] = active(data.inflections).map(({ text, line }, i) => {
        const tokens = words(text.split('--')[0]), p = pos(tokens.shift()!);
        const n = QUALITY_LENGTH[p];
        const quality: Quality = { pos: p, codes: tokens.splice(0, n) };
        const key = Number(tokens.shift()), size = Number(tokens.shift());
        const ending = size ? tokens.shift()! : '';
        const age = tokens.shift()!, frequency = tokens.shift()!;
        if (ending.length !== size || tokens.length || !Number.isInteger(key))
            throw new Error(`Invalid inflection row ${line}`);
        return { id: i + 1, sourceLine: line, quality, key, ending, age, frequency };
    });
    const addonLines = active(data.addons), affixes: Affix[] = [];
    if (addonLines.length % 3)
        throw new Error('Incomplete addon record');
    for (let i = 0; i < addonLines.length; i += 3) {
        const h = words(addonLines[i].text);
        const kind = h[0] as Affix['kind'];
        if (!['PREFIX', 'SUFFIX', 'TACKON'].includes(kind))
            throw new Error('Unknown addon kind');
        affixes.push({ id: i / 3 + 1, sourceLine: addonLines[i].line, kind, fix: h[1], connect: h[2] ?? '', codes: words(addonLines[i + 1].text), meaning: addonLines[i + 2].text.slice(0, 80).trimEnd() });
    }
    const uniqueLines = active(data.uniques), uniques: Unique[] = [];
    if (uniqueLines.length % 3)
        throw new Error('Incomplete unique record');
    for (let i = 0; i < uniqueLines.length; i += 3) {
        const t = words(uniqueLines[i + 1].text), p = pos(t.shift()!), codes = t.splice(0, QUALITY_LENGTH[p]);
        const flags = t.splice(-5).join('');
        const partCodes = ['N', 'V', 'PRON', 'PACK'].includes(p) ? [...codes.slice(0, 2), ...t] : p === 'ADJ' ? [...codes.slice(0, 2), codes[5]] : p === 'ADV' ? [codes[0]] : p === 'PREP' ? [codes[0]] : [];
        uniques.push({ id: i / 3 + 1, sourceLine: uniqueLines[i].line, word: uniqueLines[i].text.trim(), quality: { pos: p, codes }, part: { pos: p, codes: partCodes }, flags, meaning: uniqueLines[i + 2].text.slice(0, 80).trimEnd() });
    }
    if (rules.length !== 1797 || affixes.length !== 343 || uniques.length !== 79)
        throw new Error('Canonical rule/affix/unique accounting failed');
    const stems = new Map<string, Stem[]>();
    let stemCount = 0;
    const add = (entry: Entry, stem: string, key: number, force = false) => {
        if (!force && (!stem || stem === 'zzz'))
            return;
        const k = norm(stem);
        const list = stems.get(k) ?? [];
        list.push({ stem, key, entry });
        stems.set(k, list);
        stemCount++;
    };
    for (const entry of entries) {
        const p = entry.part, s = entry.stems;
        if (entry.sourceLine === null) {
            s.forEach((stem, i) => add(entry, stem, i + 1, true));
            continue;
        }
        if (['N', 'ADJ', 'V'].includes(p.pos) && s[0] === s[1] && s[0] !== 'zzz') {
            add(entry, s[0], 0, true);
            if (p.pos !== 'N') {
                add(entry, s[2], 3);
                add(entry, s[3], 4);
            }
        }
        else if (p.pos === 'ADJ' && ['COMP', 'SUPER'].includes(p.codes[2]))
            add(entry, s[0], p.codes[2] === 'COMP' ? 3 : 4, true);
        else if (p.pos === 'ADV' && ['COMP', 'SUPER'].includes(p.codes[0]))
            add(entry, s[0], p.codes[0] === 'COMP' ? 2 : 3, true);
        else if (p.pos === 'NUM' && ['CARD', 'ORD', 'DIST', 'ADVERB'].includes(p.codes[2]))
            add(entry, s[0], ['CARD', 'ORD', 'DIST', 'ADVERB'].indexOf(p.codes[2]) + 1, true);
        else
            s.forEach((stem, i) => add(entry, stem, i + 1));
    }
    if (stemCount !== 62084)
        throw new Error(`Canonical stem accounting failed: ${stemCount}`);
    const partKeys = entries.map(e => partKey(e.part));
    const orderedStems = [...stems.values()].flat().sort((a, b) => {
        let d = lexical(norm(a.stem), norm(b.stem));
        const l = partKeys[a.entry.id - 1], r = partKeys[b.entry.id - 1];
        for (let i = 0; !d && i < l.length; i++)
            d = l[i] - r[i];
        return d || lexical(a.stem.toLowerCase(), b.stem.toLowerCase()) || lexical(a.stem, b.stem) || a.key - b.key || a.entry.id - b.entry.id;
    });
    const stemKeys = orderedStems.map(s => norm(s.stem));
    const stemRanges = new Map<string, [
        number,
        number
    ]>();
    stemKeys.forEach((s, i) => {
        const key = s.slice(0, 2), range = stemRanges.get(key);
        if (range)
            range[1] = i;
        else
            stemRanges.set(key, [i, i]);
    });
    const positions = new Map(orderedStems.map((s, i) => [s, i]));
    for (const list of stems.values())
        list.sort((a, b) => positions.get(a)! - positions.get(b)!);
    const endings = new Map<string, Rule[]>();
    for (const rule of [...rules].reverse()) {
        const k = rule.ending.length + ':' + (rule.ending.at(-1) ?? '');
        const list = endings.get(k) ?? [];
        list.push(rule);
        endings.set(k, list);
    }
    const english: EnglishIndexRow[] = data.englishIndex.trimEnd().split('\n').map((row, i) => {
        const t = row.split('\t');
        if (t.length !== 8)
            throw new Error('Invalid English index row');
        return { word: t[0], aux: t[1], entryId: +t[2], pos: pos(t[3]), frequency: t[4], semi: +t[5], kind: +t[6], rank: +t[7], sourceRow: i + 1 };
    });
    if (english.length !== 149326 || english.some(r => !Number.isInteger(r.entryId) || r.entryId < 0 || r.entryId > 39336))
        throw new Error('English index accounting failed');
    return { entries, rules, affixes, uniques, stems, orderedStems, stemKeys, stemRanges, endings, stemCount, english };
}
