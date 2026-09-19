// Student-facing terms. Native WORDS codes remain unchanged in the engine.
export interface Term {
    id: string;
    text: string;
    full: string;
    category: string;
}
const define = (id: string, text: string, full: string, category: string): Term => Object.freeze({ id, text, full, category });
export const TERMS = Object.freeze({
    noun: define('noun', 'noun', 'noun', 'Part of speech'),
    verb: define('verb', 'verb', 'verb', 'Part of speech'),
    adjective: define('adjective', 'adj.', 'adjective', 'Part of speech'),
    pronoun: define('pronoun', 'pron.', 'pronoun', 'Part of speech'),
    numeral: define('numeral', 'num.', 'numeral', 'Part of speech'),
    adverb: define('adverb', 'adv.', 'adverb', 'Part of speech'),
    preposition: define('preposition', 'prep.', 'preposition', 'Part of speech'),
    conjunction: define('conjunction', 'conj.', 'conjunction', 'Part of speech'),
    interjection: define('interjection', 'interj.', 'interjection', 'Part of speech'),
    participle: define('participle', 'part.', 'participle', 'Part of speech'),
    supine: define('supine', 'supine', 'supine', 'Part of speech'),
    nominative: define('nominative', 'nom.', 'nominative', 'Case'),
    vocative: define('vocative', 'voc.', 'vocative', 'Case'),
    genitive: define('genitive', 'gen.', 'genitive', 'Case'),
    locative: define('locative', 'loc.', 'locative', 'Case'),
    dative: define('dative', 'dat.', 'dative', 'Case'),
    ablative: define('ablative', 'abl.', 'ablative', 'Case'),
    accusative: define('accusative', 'acc.', 'accusative', 'Case'),
    singular: define('singular', 'sg.', 'singular', 'Number'),
    plural: define('plural', 'pl.', 'plural', 'Number'),
    masculine: define('masculine', 'm.', 'masculine', 'Gender'),
    feminine: define('feminine', 'f.', 'feminine', 'Gender'),
    neuter: define('neuter', 'n.', 'neuter', 'Gender'),
    common: define('common', 'm./f.', 'common gender: masculine or feminine', 'Gender'),
    present: define('present', 'pres.', 'present', 'Tense'),
    imperfect: define('imperfect', 'impf.', 'imperfect', 'Tense'),
    future: define('future', 'fut.', 'future', 'Tense'),
    perfect: define('perfect', 'perf.', 'perfect', 'Tense'),
    pluperfect: define('pluperfect', 'plupf.', 'pluperfect', 'Tense'),
    futurePerfect: define('future-perfect', 'fut. perf.', 'future perfect', 'Tense'),
    active: define('active', 'act.', 'active', 'Voice'),
    passive: define('passive', 'pass.', 'passive', 'Voice'),
    indicative: define('indicative', 'indic.', 'indicative', 'Mood'),
    subjunctive: define('subjunctive', 'subj.', 'subjunctive', 'Mood'),
    imperative: define('imperative', 'imper.', 'imperative', 'Mood'),
    infinitive: define('infinitive', 'inf.', 'infinitive', 'Mood'),
    first: define('first-person', '1st', 'first person', 'Person'),
    second: define('second-person', '2nd', 'second person', 'Person'),
    third: define('third-person', '3rd', 'third person', 'Person'),
    positive: define('positive', 'positive', 'positive degree', 'Comparison'),
    comparative: define('comparative', 'comp.', 'comparative', 'Comparison'),
    superlative: define('superlative', 'superl.', 'superlative', 'Comparison'),
    cardinal: define('cardinal', 'card.', 'cardinal numeral', 'Numeral'),
    ordinal: define('ordinal', 'ord.', 'ordinal numeral', 'Numeral'),
    distributive: define('distributive', 'distrib.', 'distributive numeral', 'Numeral'),
    numeralAdverb: define('numeral-adverb', 'numeral adv.', 'numeral adverb', 'Numeral'),
    transitive: define('transitive', 'trans.', 'transitive', 'Verb type'),
    intransitive: define('intransitive', 'intrans.', 'intransitive', 'Verb type'),
    impersonal: define('impersonal', 'impers.', 'impersonal', 'Verb type'),
    deponent: define('deponent', 'dep.', 'deponent', 'Verb type'),
    semideponent: define('semideponent', 'semi-dep.', 'semideponent', 'Verb type'),
    personal: define('personal', 'pers.', 'personal', 'Pronoun type'),
    relative: define('relative', 'rel.', 'relative', 'Pronoun type'),
    reflexive: define('reflexive', 'reflex.', 'reflexive', 'Pronoun type'),
    demonstrative: define('demonstrative', 'dem.', 'demonstrative', 'Pronoun type'),
    interrogative: define('interrogative', 'interrog.', 'interrogative', 'Pronoun type'),
    indefinite: define('indefinite', 'indef.', 'indefinite', 'Pronoun type'),
    adjectival: define('adjectival', 'adjectival', 'adjectival use', 'Pronoun type'),
    declension: define('declension', 'decl.', 'declension', 'Inflection pattern'),
    conjugation: define('conjugation', 'conj.', 'conjugation (in a numbered inflection pattern)', 'Inflection pattern'),
    indeclinable: define('indeclinable', 'indecl.', 'indeclinable', 'Inflection pattern'),
    abbreviation: define('abbreviation', 'abbr.', 'abbreviation', 'Inflection pattern'),
});
export const ABBREVIATIONS: readonly Term[] = Object.freeze(Object.values(TERMS));
export const plain = (text: string, full = text): Term => ({ id: 'description', text, full, category: 'Description' });
export const POS_TERMS: Record<string, Term> = { N: TERMS.noun, V: TERMS.verb, ADJ: TERMS.adjective, PRON: TERMS.pronoun, PACK: TERMS.pronoun, NUM: TERMS.numeral, ADV: TERMS.adverb, PREP: TERMS.preposition, CONJ: TERMS.conjunction, INTERJ: TERMS.interjection, VPAR: TERMS.participle, SUPINE: TERMS.supine, X: plain('unspecified part of speech'), TACKON: plain('attached ending'), PREFIX: plain('prefix'), SUFFIX: plain('suffix') };
export const CASE_TERMS: Record<string, Term> = { NOM: TERMS.nominative, VOC: TERMS.vocative, GEN: TERMS.genitive, LOC: TERMS.locative, DAT: TERMS.dative, ABL: TERMS.ablative, ACC: TERMS.accusative, X: plain('case unspecified') };
export const NUMBER_TERMS: Record<string, Term> = { S: TERMS.singular, P: TERMS.plural, X: plain('number unspecified') };
export const GENDER_TERMS: Record<string, Term> = { M: TERMS.masculine, F: TERMS.feminine, N: TERMS.neuter, C: TERMS.common, X: plain('gender unspecified') };
export const TENSE_TERMS: Record<string, Term> = { PRES: TERMS.present, IMPF: TERMS.imperfect, FUT: TERMS.future, PERF: TERMS.perfect, PLUP: TERMS.pluperfect, FUTP: TERMS.futurePerfect, X: plain('tense unspecified') };
export const VOICE_TERMS: Record<string, Term> = { ACTIVE: TERMS.active, PASSIVE: TERMS.passive, X: plain('voice unspecified') };
export const MOOD_TERMS: Record<string, Term> = { IND: TERMS.indicative, SUB: TERMS.subjunctive, IMP: TERMS.imperative, INF: TERMS.infinitive, PPL: TERMS.participle, X: plain('mood unspecified') };
export const DEGREE_TERMS: Record<string, Term> = { POS: TERMS.positive, COMP: TERMS.comparative, SUPER: TERMS.superlative, X: plain('degree unspecified') };
export const SORT_TERMS: Record<string, Term> = { CARD: TERMS.cardinal, ORD: TERMS.ordinal, DIST: TERMS.distributive, ADVERB: TERMS.numeralAdverb, X: plain('numeral type unspecified') };
export const PERSON_TERMS: Record<number, Term> = { 1: TERMS.first, 2: TERMS.second, 3: TERMS.third };
export const PRONOUN_TERMS: Record<string, Term> = { PERS: TERMS.personal, REL: TERMS.relative, REFLEX: TERMS.reflexive, DEMONS: TERMS.demonstrative, INTERR: TERMS.interrogative, INDEF: TERMS.indefinite, ADJECT: TERMS.adjectival, X: plain('pronoun type unspecified') };
export const VERB_TERMS: Record<string, Term> = { GEN: plain('takes gen.', 'takes a genitive complement'), DAT: plain('takes dat.', 'takes a dative complement'), ABL: plain('takes abl.', 'takes an ablative complement'), TRANS: TERMS.transitive, INTRANS: TERMS.intransitive, IMPERS: TERMS.impersonal, DEP: TERMS.deponent, SEMIDEP: TERMS.semideponent, PERFDEF: plain('perfect forms with present meaning'), TO_BE: plain('sum'), TO_BEING: plain('compound of sum'), X: plain('verb type unspecified') };
export function term(table: Record<string, Term>, code: string): Term {
    const result = table[code];
    if (!result)
        throw new Error('Unmapped student-display term');
    return result;
}
