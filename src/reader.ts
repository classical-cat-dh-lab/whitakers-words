import type { Analysis, EnglishResult, Entry, NativeMorphology, Parse, PartOfSpeech, Quality } from './model.js';
import { describeQuality } from './model.js';
import { TERMS, plain, term, POS_TERMS, CASE_TERMS, NUMBER_TERMS, GENDER_TERMS, TENSE_TERMS, VOICE_TERMS, MOOD_TERMS, DEGREE_TERMS, SORT_TERMS, PERSON_TERMS, PRONOUN_TERMS, VERB_TERMS, type Term } from './terminology.js';
export const READER_VERSION = 'student-v1' as const;
export interface ReaderDetail {
    label: string;
    value: string;
}
export interface ReaderForm {
    sourceIndex: number;
    terms: Term[];
    notes: string[];
    form: string;
}
export interface ReaderItem {
    kind: 'entry' | 'explanation';
    title: string;
    labels: Term[];
    forms: ReaderForm[];
    meaning: string;
    details: ReaderDetail[];
    sourceIndices: number[];
}
export interface ReaderToken {
    surface: string;
    status: string;
    items: ReaderItem[];
    notes: string[];
}
export interface ReaderResult {
    version: typeof READER_VERSION;
    language: 'latin' | 'english';
    tokens: ReaderToken[];
    notes: string[];
}
const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
const nouns: Record<string, string> = {
    '1:0': 'first decl.', '1:1': 'first decl.', '1:6': 'first decl.; Greek -e pattern', '1:7': 'first decl.; Greek -es pattern', '1:8': 'first decl.; Greek -as pattern',
    '2:0': 'second decl.', '2:1': 'second decl.; -us pattern', '2:2': 'second decl.; neuter pattern', '2:3': 'second decl.; -er pattern', '2:4': 'second decl.; -ius / -ium pattern', '2:5': 'second decl.; filius-type pattern', '2:6': 'second decl.; Greek -os pattern', '2:7': 'second decl.; Greek -os pattern', '2:8': 'second decl.; Greek -on pattern', '2:9': 'second decl.; mixed Greek pattern',
    '3:0': 'third decl.', '3:1': 'third decl.; consonant-stem pattern', '3:2': 'third decl.; neuter consonant-stem pattern', '3:3': 'third decl.; i-stem pattern', '3:4': 'third decl.; neuter i-stem pattern', '3:6': 'third decl.; Greek pattern', '3:7': 'third decl.; Greek pattern', '3:8': 'third decl.; Greek pattern', '3:9': 'third decl.; Greek pattern',
    '4:0': 'fourth decl.', '4:1': 'fourth decl.; -us pattern', '4:2': 'fourth decl.; neuter -u pattern', '4:3': 'fourth decl.; domus-type mixed pattern', '4:4': 'fourth decl.; echo-type Greek pattern', '5:1': 'fifth decl.',
    '9:8': 'abbreviation', '9:9': 'indeclinable'
};
const adjectives: Record<string, string> = {
    '0:0': 'degree-specific adjective pattern', '1:0': 'first and second decl.', '1:1': 'first and second decl.', '1:2': 'first and second decl.; -er pattern', '1:3': 'pronominal adjective pattern', '1:4': 'alter-type adjective pattern', '1:5': 'alius-type adjective pattern',
    '2:0': 'Greek adjective pattern', '2:1': 'Greek adjective; feminine -e pattern', '2:2': 'Greek adjective; feminine -a pattern', '2:3': 'Greek adjective; -es pattern', '2:6': 'Greek adjective; common-gender -os pattern', '2:7': 'Greek adjective; masculine -os pattern', '2:8': 'Greek adjective; neuter -on pattern',
    '3:0': 'third decl.', '3:1': 'third decl.; one termination', '3:2': 'third decl.; two terminations', '3:3': 'third decl.; three terminations', '3:6': 'third decl.; Greek pattern', '9:8': 'abbreviation', '9:9': 'indeclinable'
};
const verbs: Record<string, string> = {
    '0:0': 'general verb pattern', '1:1': 'first conj.', '2:1': 'second conj.', '3:0': 'third conj.', '3:1': 'third conj.', '3:2': 'irregular: fero-type', '3:3': 'irregular: fio-type', '3:4': 'fourth conj.', '4:1': 'fourth conj.',
    '5:0': 'irregular: sum-type', '5:1': 'irregular: sum-type', '5:2': 'irregular: possum-type', '6:1': 'irregular: eo-type', '6:2': 'irregular: volo-type', '7:1': 'defective: aio-type', '7:2': 'defective: inquam-type', '7:3': 'irregular: edo-type', '8:0': 'special contracted verb forms', '8:1': 'first conj.; special contracted forms', '8:2': 'second conj.; special contracted forms', '8:3': 'third conj.; special contracted forms', '9:8': 'abbreviation', '9:9': 'uninflected verb form'
};
const pronouns: Record<number, string> = { 1: 'qui / quis pattern', 3: 'hic pattern', 4: 'is / idem pattern', 5: 'personal or reflexive pronoun pattern', 6: 'ille / iste / ipse pattern', 9: 'indeclinable' };
const numeralPatterns: Record<string, string> = { '0:0': 'shared numeral pattern', '1:1': 'unus-type numeral pattern', '1:2': 'duo-type numeral pattern', '1:3': 'tres-type numeral pattern', '1:4': 'hundreds numeral pattern', '2:0': 'indeclinable cardinal pattern' };
export function inflectionPattern(pos: PartOfSpeech, which: number, variant: number): string {
    const key = `${which}:${variant}`;
    let value: string | undefined;
    if (pos === 'N')
        value = nouns[key];
    else if (pos === 'ADJ')
        value = adjectives[key];
    else if (pos === 'V' || pos === 'VPAR' || pos === 'SUPINE')
        value = verbs[key] ?? (variant === 0 && which > 0 && which <= 4 ? `${ordinals[which]} conj.` : undefined);
    else if (pos === 'PRON' || pos === 'PACK')
        value = pronouns[which];
    else if (pos === 'NUM')
        value = numeralPatterns[key];
    else
        return '';
    if (!value)
        throw new Error(`Unmapped student-display inflection pattern: ${pos}`);
    return value;
}
export function dictionaryForms(citation: string): string {
    // This is the bounded citation suffix grammar, not a parser for legacy output.
    return citation.replace(/ {2}(?:VPAR|SUPINE|PRON|PACK|ADJ|NUM|ADV|PREP|CONJ|INTERJ|N|V|X)\b.*$/, '').replace(/\babb\./g, 'abbr.').trim();
}
const age: Record<string, string> = { X: 'Unrestricted or unspecified', A: 'Archaic', B: 'Early Latin', C: 'Classical Latin', D: 'Late Latin', E: 'Later Latin', F: 'Medieval Latin', G: 'Neo-Latin', H: 'Modern Latin' };
const frequency: Record<string, string> = { X: 'Unspecified', A: 'Very frequent', B: 'Frequent', C: 'Common', D: 'Less frequent', E: 'Uncommon', F: 'Very rare', I: 'Inscription evidence', M: 'Graffiti evidence', N: 'Chiefly Pliny' };
const inflectionFrequency: Record<string, string> = { X: 'Unspecified', A: 'Most frequent form', B: 'Sometimes used', C: 'Uncommon form', D: 'Infrequent form', E: 'Rare form', F: 'Very rare form', I: 'Inscription evidence', M: 'Unspecified legacy category', N: 'Unspecified legacy category' };
const area: Record<string, string> = { X: 'General or unspecified', A: 'Agriculture, plants, animals and rural life', B: 'Biology, medicine and the body', D: 'Drama, music and the arts', E: 'Ecclesiastical, biblical and religious', G: 'Grammar, rhetoric, literature and education', L: 'Law, government, finance and politics', P: 'Poetry', S: 'Science, philosophy and measures', T: 'Technical fields, architecture and topography', W: 'Military and naval', Y: 'Mythology' };
const geography: Record<string, string> = { X: 'General or unspecified', A: 'Africa', B: 'Britain', C: 'China', D: 'Scandinavia', E: 'Egypt', F: 'France / Gaul', G: 'Germany', H: 'Greece', I: 'Italy / Rome', J: 'India', K: 'Balkans', N: 'Netherlands', P: 'Persia', Q: 'Near East', R: 'Russia', S: 'Spain / Iberia', U: 'Eastern Europe' };
const source: Record<string, string> = { X: 'General or unspecified', A: 'Unspecified legacy reference', B: 'Beeson, A Primer of Medieval Latin', C: "Cassell’s Latin Dictionary", D: 'Adams, Latin Sexual Vocabulary', E: 'Stelten, Dictionary of Ecclesiastical Latin', F: 'Deferrari, Dictionary of St. Thomas Aquinas', G: 'Gildersleeve and Lodge, Latin Grammar', H: 'Ouvrard, Collatinus', I: 'Leverett, Lexicon of the Latin Language', J: 'Bracton, De Legibus et Consuetudinibus Angliae', K: 'Licoppe, Calepinus Novus', L: 'Lewis, An Elementary Latin Dictionary', M: 'Latham, Revised Medieval Latin Word-List', N: 'Nelson wordlist', O: 'Oxford Latin Dictionary', P: 'Souter, A Glossary of Later Latin', Q: 'Other dictionaries, cited or unspecified', R: 'Plater and White, A Grammar of the Vulgate', S: 'Lewis and Short, A Latin Dictionary', T: 'Translation evidence; no dictionary reference', U: 'Unspecified legacy reference', V: 'Blatt, Vademecum in opus Saxonis', W: "Whitaker’s conjecture or extrapolation", Y: 'Temporary legacy reference category', Z: 'User contribution; no dictionary reference' };
function decode(table: Record<string, string>, code: string): string {
    const value = table[code];
    if (!value)
        throw new Error('Unmapped student-display metadata');
    return value;
}
function entryDetails(entry: Entry): ReaderDetail[] {
    return [{ label: 'Period', value: decode(age, entry.flags[0]) }, { label: 'Subject', value: decode(area, entry.flags[1]) }, { label: 'Region', value: decode(geography, entry.flags[2]) }, { label: 'Dictionary frequency', value: decode(frequency, entry.flags[3]) }, { label: 'Reference used by WORDS', value: decode(source, entry.flags[4]) }];
}
function labels(pos: PartOfSpeech, entry: Entry, q?: NativeMorphology): Term[] {
    const result = [term(POS_TERMS, pos)], part = entry.part;
    const classified = pos === 'VPAR' || pos === 'SUPINE' ? 'V' : pos;
    const same = classified === part.pos || pos === 'PRON' && part.pos === 'PACK';
    // English lookup has dictionary entries but no analyzed form rows.
    if (!q && same) {
        if (pos === 'N')
            result.push(term(GENDER_TERMS, part.codes[2]));
        if (pos === 'ADJ' || pos === 'ADV') {
            const degree = part.codes[pos === 'ADJ' ? 2 : 0];
            if (degree !== 'X')
                result.push(term(DEGREE_TERMS, degree));
        }
        if (pos === 'PREP') {
            const objectCase = term(CASE_TERMS, part.codes[0]);
            result.push(plain('with ' + objectCase.text, 'with ' + objectCase.full));
        }
        if (pos === 'NUM') {
            result.push(term(SORT_TERMS, part.codes[2]));
            if (+part.codes[3] > 0)
                result.push(plain('value: ' + part.codes[3]));
        }
    }
    if (same && part.pos === 'V' && part.codes[2] !== 'X' && !part.codes[2].startsWith('TO_BE'))
        result.push(term(VERB_TERMS, part.codes[2]));
    if (same && (part.pos === 'PRON' || part.pos === 'PACK') && part.codes[2] !== 'X')
        result.push(term(PRONOUN_TERMS, part.codes[2]));
    if (part.pos === 'PACK' && same)
        result.push(plain('with attached ending'));
    const patternTerm = (pattern: string) => plain(pattern, pattern.replace(/\bdecl\./g, 'declension').replace(/\bconj\./g, 'conjugation'));
    if (q && 'class' in q)
        result.push(patternTerm(inflectionPattern(pos, q.class, q.variant)));
    else if (same && /^[0-9]$/.test(part.codes[0] ?? ''))
        result.push(patternTerm(inflectionPattern(pos, +part.codes[0], +part.codes[1])));
    return result;
}
function form(p: Parse, index: number): ReaderForm {
    const q = describeQuality(p.rule.quality), terms: Term[] = [], notes: string[] = [];
    if (p.dictionary === 'RRR')
        return { sourceIndex: index, terms: [TERMS.cardinal, plain('Roman numeral')], notes: [], form: p.stem };
    if (p.dictionary === 'PPP' && q.pos === 'V')
        terms.push(plain('compound verb'));
    if ('tense' in q) {
        terms.push(term(TENSE_TERMS, q.tense), term(VOICE_TERMS, q.voice));
        if (q.pos === 'V')
            terms.push(term(MOOD_TERMS, q.mood));
    }
    if ('case' in q)
        terms.push(term(CASE_TERMS, q.case));
    if (q.pos === 'V' && q.person) {
        const person = PERSON_TERMS[q.person];
        if (!person)
            throw new Error('Unmapped student-display person');
        terms.push(person);
    }
    else if (q.pos === 'V' && q.mood !== 'INF' && q.mood !== 'PPL')
        terms.push(plain('person unspecified'));
    if ('number' in q && !(q.pos === 'V' && q.mood === 'INF' && q.number === 'X'))
        terms.push(term(NUMBER_TERMS, q.number));
    if ('gender' in q)
        terms.push(term(GENDER_TERMS, q.gender));
    if ('comparison' in q)
        terms.push(term(DEGREE_TERMS, q.comparison));
    if ('sort' in q)
        terms.push(term(SORT_TERMS, q.sort));
    if (p.entry.part.pos === 'V' && p.entry.part.codes[2] === 'DEP' && 'voice' in q && q.voice === 'PASSIVE')
        notes.push('Passive form; the dictionary marks this verb as deponent.');
    if (p.rule.age !== 'X')
        notes.push(decode(age, p.rule.age));
    if (!'XAB'.includes(p.rule.frequency))
        notes.push(decode(inflectionFrequency, p.rule.frequency));
    if (p.dictionary === 'PPP' && p.stem.startsWith('PPL+'))
        notes.push('Compound with ' + p.stem.slice(4));
    if (p.dictionary === 'PPP' && p.stem.startsWith('SUPINE'))
        notes.push('Compound with iri');
    return { sourceIndex: index, terms, notes, form: p.dictionary === 'PPP' ? '' : p.stem + p.rule.ending };
}
function explanatoryTitle(p: Parse): string {
    const kind = p.traces[0]?.kind;
    if (p.rule.quality.pos === 'TACKON')
        return 'Attached ending: -' + p.stem;
    if (p.rule.quality.pos === 'PREFIX')
        return 'Prefix: ' + p.stem + '-';
    if (p.rule.quality.pos === 'SUFFIX')
        return 'Suffix: -' + p.stem;
    return kind === 'syncope' ? 'Syncopated form' : kind === 'split' ? 'Possible compound of two words' : kind === 'roman' ? 'Irregular Roman numeral' : kind === 'slury' ? 'Assimilated spelling' : 'Alternative spelling';
}
function explanationText(p: Parse): string {
    const trace = p.traces[0];
    const meaning = p.entry.meaning.trim();
    if (p.rule.quality.pos === 'TACKON') {
        if (meaning.startsWith('PACKON') && meaning.includes('=>'))
            return 'Pronoun ending: ' + meaning.split('=>').slice(1).join('=>').trim();
        if (p.stem === 'cum' && meaning.startsWith('TACKON with'))
            return 'With; attached to a pronoun.';
        if (!/\b(?:PRON|PACK|N|V|ADJ)\s+\d/.test(meaning))
            return meaning.replace(/^TACKON\b\s*/, '');
        return `The ending -${p.stem} is attached to the analyzed base.`;
    }
    if (p.rule.quality.pos === 'PREFIX' || p.rule.quality.pos === 'SUFFIX')
        return /\b(?:PRON|PACK|N|V|ADJ)\s+\d/.test(meaning) ? 'The original note describes the function of this affix.' : meaning;
    if (trace && trace.input !== trace.output)
        return `WORDS also examines “${trace.output}” for “${trace.input}”.`;
    return p.entry.meaning.trim();
}
function latinItems(parses: Parse[], surface: string): ReaderItem[] {
    const items: ReaderItem[] = [];
    let lastKey = '';
    for (const [index, p] of parses.entries()) {
        const pos = p.rule.quality.pos, artificial = ['XXX', 'YYY', 'ADDONS'].includes(p.dictionary) || ['PREFIX', 'SUFFIX', 'TACKON'].includes(pos);
        if (artificial) {
            items.push({ kind: 'explanation', title: explanatoryTitle(p), labels: [], forms: [], meaning: explanationText(p), details: p.entry.meaning.trim() ? [{ label: 'Original WORDS note', value: p.entry.meaning.trim() }] : [], sourceIndices: [index] });
            lastKey = '';
            continue;
        }
        if (p.dictionary === 'PPP' && pos === 'V' && items.at(-1)?.kind === 'entry') {
            const last = items.at(-1)!;
            last.forms.push(form(p, index));
            last.sourceIndices.push(index);
            if (p.entry.meaning)
                last.details.push({ label: 'Original compound note', value: p.entry.meaning.trim() });
            continue;
        }
        const key = p.dictionary + ':' + p.entry.id + ':' + pos;
        if (key === lastKey) {
            const last = items.at(-1)!;
            last.forms.push(form(p, index));
            last.sourceIndices.push(index);
            continue;
        }
        const citation = dictionaryForms(p.entry.citation), q = describeQuality(p.rule.quality);
        const details = ['GEN', 'UNI'].includes(p.dictionary) ? entryDetails(p.entry) : [];
        if (p.entry.part.pos === 'X' && p.dictionary === 'UNI')
            details.push({ label: 'Legacy record', value: 'The dictionary part of speech is unspecified; the form analysis supplies the label shown here.' });
        if (p.entry.part.pos !== pos && p.entry.part.pos !== 'X' && !['VPAR', 'SUPINE'].includes(pos))
            details.push({ label: 'Dictionary entry type', value: term(POS_TERMS, p.entry.part.pos).full });
        items.push({ kind: 'entry', title: citation || p.stem + p.rule.ending || surface, labels: labels(pos, p.entry, q), forms: [form(p, index)], meaning: p.entry.meaning.replace(/^\|+|\r/g, '').trim(), details, sourceIndices: [index] });
        lastKey = key;
    }
    return items;
}
export function presentAnalysis(result: Analysis | EnglishResult): ReaderResult {
    if ('hits' in result) {
        return { version: READER_VERSION, language: 'english', tokens: [{ surface: result.input, status: result.hits.length ? 'analyzed' : 'unknown', notes: result.trimmed ? ['Additional entries were omitted by the legacy display profile.'] : [], items: result.hits.map(({ entry }, index) => ({ kind: 'entry', title: dictionaryForms(entry.citation), labels: labels(entry.part.pos, entry), forms: [], meaning: entry.meaning.replace(/\r/g, '').trim(), details: entryDetails(entry), sourceIndices: [index] })) }], notes: [] };
    }
    return { version: READER_VERSION, language: 'latin', tokens: result.tokens.map(t => ({ surface: t.surface, status: t.status, items: latinItems(t.parses, t.surface), notes: t.trimmed ? ['The legacy profile filtered some candidate forms.'] : [] })), notes: result.diagnostics.map(d => d.startsWith('legacy-non-ascii') ? 'WORDS separates non-ASCII characters from Latin lookup fragments; your original text is retained.' : d.startsWith('legacy-chunked-line') ? 'WORDS processes a long line in successive chunks.' : d) };
}
