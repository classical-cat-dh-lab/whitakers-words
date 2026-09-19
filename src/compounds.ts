// Port of Parse.Compounds_With_Sum, including its historical voice assignment.
import type { Parse, Quality } from './model.js';
import { emptyEntry, emptyRule } from './core.js';
const sumForms = [
    'sum es est sumus estis sunt', 'eram eras erat eramus eratis erant', 'ero eris erit erimus eritis erunt',
    'fui fuisti fuit fuimus fuistis fuerunt', 'fueram fueras fuerat fueramus fueratis fuerant', 'fuero fueris fuerit fuerimus fueritis fuerunt',
    'sim sis sit simus sitis sint', 'essem esses esset essemus essetis essent', 'zzz zzz zzz zzz zzz zzz',
    'fuerim fueris fuerit fuerimus fueritis fuerint', 'fuissem fuisses fuisset fuissemus fuissetis fuissent', 'zzz zzz zzz zzz zzz zzz'
];
const tenses = ['PRES', 'IMPF', 'FUT', 'PERF', 'PLUP', 'FUTP'];
function sum(word: string): {
    tense: string;
    mood: string;
    person: string;
    number: string;
} | null {
    if (!/^[sef]/.test(word))
        return null;
    for (let i = 0; i < sumForms.length; i++) {
        const j = sumForms[i].split(' ').indexOf(word);
        if (j >= 0)
            return { tense: tenses[i % 6], mood: i < 6 ? 'IND' : 'SUB', person: String(j % 3 + 1), number: j < 3 ? 'S' : 'P' };
    }
    return null;
}
const glosses = [
    ['PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system', 'FUT ACTIVE PPL + verb TO_BE => ACTIVE Periphrastic - about to, going to', 'FUT PASSIVE PPL + verb TO_BE => PASSIVE Periphrastic - should/ought/had to'],
    ['PERF PASSIVE PPL + esse => PERF PASSIVE INF', 'FUT ACTIVE PPL + esse => PRES Periphastic/FUT ACTIVE INF - be about/going to', 'FUT PASSIVE PPL + esse => PRES PASSIVE INF'],
    ['PERF PASSIVE PPL + esse => PERF PASSIVE INF', 'FUT ACT PPL+fuisse => PERF ACT INF Periphrastic - to have been about/going to', 'FUT PASSIVE PPL + fuisse => PERF PASSIVE INF Periphrastic - about to, going to']
];
const variant = (q: Quality) => q.pos !== 'VPAR' ? -1 : ['PERF,PASSIVE,PPL', 'FUT,ACTIVE,PPL', 'FUT,PASSIVE,PPL'].indexOf(q.codes.slice(5).join(','));
function compound(word: string, q: Quality, codes: string[], meaning: string): Parse {
    return { stem: word.slice(0, 18), rule: { ...emptyRule, quality: { pos: 'V', codes }, frequency: 'A' }, entry: { ...emptyEntry, meaning }, dictionary: 'PPP', traces: [{ kind: 'compound', sourceId: 'words_engine-parse.adb:Compounds_With_Sum', input: word, output: codes.join(' '), explanation: meaning }] };
}
export function compounds(parses: Parse[], next: string): {
    parses: Parse[];
    consumed: boolean;
} {
    const info = sum(next), infinitive = next === 'esse' || next === 'fuisse', iri = next === 'iri';
    const eligible = (q: Quality) => info ? q.pos === 'VPAR' && q.codes[2] === 'NOM' && q.codes[3] === info.number && variant(q) >= 0 : infinitive ? variant(q) >= 0 && (next === 'esse' || q.codes[5] === 'FUT') : iri ? q.pos === 'SUPINE' && q.codes[2] === 'ACC' : false;
    if (!parses.some(p => eligible(p.rule.quality)))
        return { parses, consumed: false };
    const result = [...parses];
    let on = false, q: Quality | null = null, codes: string[] = ['0', '0', 'X', 'X', 'X', '0', 'X'], meaning = '';
    for (let i = result.length - 1; i >= 0; i--) {
        const p = result[i], quality = p.rule.quality, c = quality.codes;
        if (['TACKON', 'PREFIX', 'SUFFIX'].includes(quality.pos) && on)
            continue;
        const keep = info ? quality.pos === 'VPAR' && c[2] === 'NOM' && c[3] === info.number : infinitive ? quality.pos === 'VPAR' : quality.pos === 'SUPINE' && c[2] === 'ACC';
        if (!keep) {
            result.splice(i, 1);
            on = false;
            continue;
        }
        const v = variant(quality);
        if (iri) {
            on = true;
            q = quality;
            codes = [...c.slice(0, 2), 'FUT', 'PASSIVE', 'INF', '0', 'X'];
            meaning = 'SUPINE + iri => FUT PASSIVE INF - to be about/going/ready to be ~';
            result.push(compound('SUPINE + iri', q, codes, meaning));
        }
        else if (v >= 0) {
            on = true;
            q = quality;
            meaning = glosses[info ? 0 : next === 'esse' ? 1 : 2][v];
            if (info) {
                const tense = v === 0 ? ({ PRES: 'PERF', PERF: 'PERF', IMPF: 'PLUP', PLUP: 'PLUP', FUT: 'FUTP' }[info.tense] ?? 'X') : info.tense;
                codes = [...c.slice(0, 2), tense, 'PASSIVE', info.mood, info.person, info.number];
            }
            else {
                const tense = c[5] === 'FUT' ? (next === 'fuisse' ? 'PERF' : c[6] === 'PASSIVE' ? 'PRES' : 'FUT') : c[5];
                codes = [...c.slice(0, 2), tense, c[6], 'INF', '0', 'X'];
            }
        }
    }
    if (!iri && q)
        result.push(compound('PPL+' + next, q, codes, meaning));
    return { parses: result, consumed: true };
}
