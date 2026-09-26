import type { Entry, Parse, Quality } from './model.js';
import { emptyEntry, emptyRule, sameRule, LegacyConstraintError } from './core.js';
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
export function meaningText(s: string): string { return trimSpaces(trimSpaces(s.replace(/^\|+/, '')).slice(0, 79)); }
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
    const prefix = stem.length > 21 ? stem + '\n' + ' '.repeat(21) : pad(stem, 21);
    if (sameRule(p.rule, emptyRule))
        return prefix;
    let s = prefix + qualityText(p.rule.quality, p.entry, p.dictionary);
    if (p.rule.age !== 'X' && infAge[p.rule.age])
        s += '  ' + pad(infAge[p.rule.age], 8);
    if ('CDEFIMN'.includes(p.rule.frequency) && infFreq[p.rule.frequency])
        s += '  ' + pad(infFreq[p.rule.frequency], 8);
    return s;
}
export function prepareParses(parses: Parse[]): Parse[][] {
    const groups: Parse[][] = [];
    // Cycle_Over_Pa resets ODM at each POS run, but retains the previous group
    // and dictionary entry when a PPP verb is appended to a participle/supine.
    for (let i = 0; i < parses.length;) {
        const initial = parses[i];
        if (initial.dictionary === 'UNI') {
            groups.push([initial]);
            i++;
            continue;
        }
        const pos = initial.rule.quality.pos;
        let previousId = 0, previousDictionary: Parse['dictionary'] = 'X';
        while (i < parses.length && parses[i].rule.quality.pos === pos) {
            const p = parses[i];
            const nominal = ['N', 'PRON', 'PACK', 'ADJ', 'NUM'].includes(pos);
            const verbal = ['V', 'VPAR', 'SUPINE'].includes(pos);
            if (nominal || verbal) {
                if (pos === 'NUM' && p.dictionary === 'RRR' || p.entry.id !== previousId && (!verbal || p.dictionary !== 'PPP')) {
                    groups.push([p]);
                    previousId = p.entry.id;
                    previousDictionary = p.dictionary;
                }
                else if (groups.length)
                    groups.at(-1)!.push(p);
            }
            else {
                if (p.dictionary !== previousDictionary || p.entry.id !== previousId)
                    groups.push([p]);
                i++;
                break;
            }
            i++;
            // Ada's `and` evaluates Pa(I) even after I exceeds Pa_Last.
            // At the end of the 100-slot array that read raises Constraint_Error.
            if (i === 100)
                throw new LegacyConstraintError('Legacy CYCLE_OVER_PA index overflow');
        }
    }
    if (groups.length > 40 || groups.some(g => g.length > 12))
        throw new LegacyConstraintError('Legacy CYCLE_OVER_PA output buffer overflow');
    return groups;
}
export function formatGroups(groups: Parse[][], trimmed: boolean): string {
    let previousIR = '', previousCitation = '';
    let output = '';
    const used = new Set<string>();
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i], p = group[0], e = p.entry;
        const ir = JSON.stringify(group.map(p => [p.stem, p.rule.quality, p.rule.key, p.rule.ending, p.rule.age, p.rule.frequency]));
        if (ir !== previousIR) {
            output += group.map(p => inflectionText({ ...p, entry: e, dictionary: group[0].dictionary }) + (p.stem.startsWith('PPL') ? '\n' + p.entry.meaning.padEnd(79, ' ').slice(0, 79) : '')).join('\n') + '\n';
            previousIR = ir;
        }
        if (['GEN', 'UNI'].includes(p.dictionary)) {
            if (i === 0 || e.citation !== previousCitation)
                output += dictionaryText(e) + '\n';
            const next = groups[i + 1]?.[0];
            if (e.meaning !== (next && ['GEN', 'UNI'].includes(next.dictionary) ? next.entry.meaning : ''))
                output += (numeralMeaning(p) ?? meaningText(trimSpaces(e.meaning.replace(/^\|+/, '')))) + '\n';
        }
        else if (p.dictionary === 'ADDONS' || !used.has(p.dictionary)) {
            output += meaningText(e.meaning) + '\n';
            used.add(p.dictionary);
        }
        previousCitation = ['GEN', 'UNI'].includes(p.dictionary) ? e.citation : emptyEntry.citation;
    }
    return output + (trimmed ? '*' : '') + '\n';
}
export function formatParses(parses: Parse[], trimmed: boolean): string {
    return formatGroups(prepareParses(parses), trimmed);
}
