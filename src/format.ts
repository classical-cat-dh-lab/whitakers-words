import type { Entry, Parse, Quality } from './model.js';
const pad = (s: string, n: number) => s.padEnd(n, ' ');
export function qualityText(q: Quality, entry: Entry, dictionary: Parse['dictionary']): string {
    const c = [...q.codes];
    let widths: number[] = [];
    switch (q.pos) {
        case 'N':
        case 'PRON':
        case 'PACK':
        case 'SUPINE':
            widths = [1, 1, 3, 1, 1];
            break;
        case 'ADJ':
        case 'NUM':
            widths = [1, 1, 3, 1, 1, q.pos === 'ADJ' ? 5 : 6];
            break;
        case 'ADV':
            widths = [5];
            break;
        case 'V':
            widths = [1, 1, 4, 7, 3, 1, 1];
            break;
        case 'VPAR':
            widths = [1, 1, 3, 1, 1, 4, 7, 3];
            break;
        case 'PREP':
            widths = [3];
            break;
    }
    if (dictionary === 'GEN' && entry.part.pos === 'V' && entry.part.codes[2] === 'DEP') {
        if (q.pos === 'V' && ['IND', 'SUB', 'IMP', 'INF'].includes(c[4]))
            c[3] = '';
        if (q.pos === 'VPAR' && c[7] === 'PPL')
            c[6] = '';
    }
    return pad(pad(q.pos, 6) + ' ' + c.map((x, i) => pad(x, widths[i] ?? 1)).join(' '), 35);
}
const infAge: Record<string, string> = { X: 'Always', A: 'Archaic', B: 'Early', C: 'Classic', D: 'Late', E: 'Later', F: 'Medieval', G: 'Scholar', H: 'Modern' };
const infFreq: Record<string, string> = { X: '', A: 'mostfreq', B: 'sometime', C: 'uncommon', D: 'infreq', E: 'rare', F: 'veryrare', I: 'inscript', M: '', N: '' };
const dictAge: Record<string, string> = { X: '', A: 'Archaic', B: 'Early', C: 'Classic', D: 'Late', E: 'Later', F: 'Medieval', G: 'NeoLatin', H: 'Modern' };
const dictFreq: Record<string, string> = { X: '', A: 'veryfreq', B: 'frequent', C: 'common', D: 'lesser', E: 'uncommon', F: 'veryrare', I: 'inscript', M: 'graffiti', N: 'Pliny' };
const trimSpaces = (s: string) => s.replace(/^ +| +$/g, '');
export function meaningText(s: string): string { return trimSpaces(trimSpaces(s).replace(/^\|+|\|+$/g, '').slice(0, 79)); }
export function dictionaryText(e: Entry): string {
    let s = e.citation ? e.citation + '  ' : '';
    s += ' [' + e.flags + ']  ';
    const age = dictAge[e.flags[0]] ?? '', frequency = dictFreq[e.flags[3]] ?? '';
    if (age)
        s += '  ' + age;
    if ('DEFINM'.includes(e.flags[3]) && frequency)
        s += '  ' + frequency;
    return s;
}
function numeralMeaning(p: Parse): string | null {
    if (p.entry.part.pos !== 'NUM' || +p.entry.part.codes[3] <= 0)
        return null;
    const n = +p.entry.part.codes[3];
    const sort = p.rule.quality.codes[5];
    if (p.rule.quality.pos !== 'NUM')
        return pad('Number  ' + n, 80);
    switch (sort) {
        case 'CARD': return pad(` ${n} - (CARD answers 'how many');`, 80);
        case 'ORD': return pad(` ${n}th - (ORD, 'in series'); (a/the) ${n}th (part) (fract w/pars?);`, 80);
        case 'DIST': return pad(` ${n} each/apiece/times/fold/together/at a time - 'how many each'; by  ${n}s; `, 80).slice(0, 80);
        case 'ADVERB': return pad(` ${n} times, on ${n} occasions - (ADVERB answers 'how often');`, 80);
        default: return pad('', 80);
    }
}
export function inflectionText(p: Parse): string {
    if (p.literal !== undefined)
        return p.literal;
    const stem = p.stem + (p.rule.ending ? '.' + p.rule.ending : '');
    if (p.rule.quality.pos === 'X')
        return pad(stem, 21);
    let s = (stem.length >= 21 ? stem + '\n' : pad(stem, 21)) + qualityText(p.rule.quality, p.entry, p.dictionary);
    if (p.rule.age !== 'X' && infAge[p.rule.age])
        s += '  ' + pad(infAge[p.rule.age], 8);
    if ('CDEFIMN'.includes(p.rule.frequency) && infFreq[p.rule.frequency])
        s += '  ' + pad(infFreq[p.rule.frequency], 8);
    return s;
}
export function formatParses(parses: Parse[], trimmed: boolean): string {
    const groups: Parse[][] = [];
    for (const p of parses) {
        const previous = groups.at(-1);
        if (previous && p.dictionary === 'PPP' && p.rule.quality.pos === 'V')
            previous.push(p);
        else if (previous && previous[0].dictionary === p.dictionary && previous[0].entry.id === p.entry.id && previous[0].rule.quality.pos === p.rule.quality.pos && p.dictionary !== 'UNI' && !['TACKON', 'PREFIX', 'SUFFIX', 'X'].includes(p.rule.quality.pos))
            previous.push(p);
        else
            groups.push([p]);
    }
    let previousIR = '', previousCitation = '';
    let output = '';
    const used = new Set<string>();
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i], p = group[0], e = p.entry;
        const ir = JSON.stringify(group.map(p => [p.stem, p.rule.quality, p.rule.key, p.rule.ending, p.rule.age, p.rule.frequency]));
        if (ir !== previousIR) {
            output += group.map(p => inflectionText(p.dictionary === 'PPP' && p.rule.quality.pos === 'V' ? { ...p, entry: e, dictionary: group[0].dictionary } : p) + (p.stem.startsWith('PPL') ? '\n' + p.entry.meaning.padEnd(76, ' ').slice(0, 76) : '')).join('\n') + '\n';
            previousIR = ir;
        }
        if (['GEN', 'UNI'].includes(p.dictionary)) {
            if (i === 0 || e.citation !== previousCitation)
                output += dictionaryText(e) + '\n';
            if (i === groups.length - 1 || e.meaning !== groups[i + 1][0].entry.meaning)
                output += (numeralMeaning(p) ?? meaningText(e.meaning)) + '\n';
        }
        else if (p.dictionary === 'ADDONS' || !used.has(p.dictionary)) {
            output += meaningText(e.meaning) + '\n';
            used.add(p.dictionary);
        }
        previousCitation = e.citation;
    }
    return output + (trimmed ? '*' : '') + '\n';
}
