# Student display abbreviations

Display version: student-v1. This is the implemented house style for Latin students,
using familiar dictionary and classroom notation; it is not a claim that every
publisher uses one identical abbreviation standard. The table is generated from
the same registry as the page and its abbreviation hints.

Part-of-speech labels keep **noun** and **verb** in full, avoiding confusion between
“noun” and neuter **n.** Gender labels use **m.**, **f.**, **n.**, and **m./f.**
Indicative **indic.**, imperative **imper.**, imperfect **impf.**, and impersonal
**impers.** have distinct spellings. Person labels occur with **sg.** or **pl.**;
“2nd sg.” means second person singular, not a WORDS class code.

| Category | Display | Meaning |
|---|---|---|
| Part of speech | noun | noun |
| Part of speech | verb | verb |
| Part of speech | adj. | adjective |
| Part of speech | pron. | pronoun |
| Part of speech | num. | numeral |
| Part of speech | adv. | adverb |
| Part of speech | prep. | preposition |
| Part of speech | conj. | conjunction |
| Part of speech | interj. | interjection |
| Part of speech | part. | participle |
| Part of speech | supine | supine |
| Case | nom. | nominative |
| Case | voc. | vocative |
| Case | gen. | genitive |
| Case | loc. | locative |
| Case | dat. | dative |
| Case | abl. | ablative |
| Case | acc. | accusative |
| Number | sg. | singular |
| Number | pl. | plural |
| Gender | m. | masculine |
| Gender | f. | feminine |
| Gender | n. | neuter |
| Gender | m./f. | common gender: masculine or feminine |
| Tense | pres. | present |
| Tense | impf. | imperfect |
| Tense | fut. | future |
| Tense | perf. | perfect |
| Tense | plupf. | pluperfect |
| Tense | fut. perf. | future perfect |
| Voice | act. | active |
| Voice | pass. | passive |
| Mood | indic. | indicative |
| Mood | subj. | subjunctive |
| Mood | imper. | imperative |
| Mood | inf. | infinitive |
| Person | 1st | first person |
| Person | 2nd | second person |
| Person | 3rd | third person |
| Comparison | positive | positive degree |
| Comparison | comp. | comparative |
| Comparison | superl. | superlative |
| Numeral | card. | cardinal numeral |
| Numeral | ord. | ordinal numeral |
| Numeral | distrib. | distributive numeral |
| Numeral | numeral adv. | numeral adverb |
| Verb type | trans. | transitive |
| Verb type | intrans. | intransitive |
| Verb type | impers. | impersonal |
| Verb type | dep. | deponent |
| Verb type | semi-dep. | semideponent |
| Pronoun type | pers. | personal |
| Pronoun type | rel. | relative |
| Pronoun type | reflex. | reflexive |
| Pronoun type | dem. | demonstrative |
| Pronoun type | interrog. | interrogative |
| Pronoun type | indef. | indefinite |
| Pronoun type | adjectival | adjectival use |
| Inflection pattern | decl | declension |
| Inflection pattern | conj | conjugation (in a numbered inflection pattern) |
| Inflection pattern | indecl. | indeclinable |
| Inflection pattern | abbr. | abbreviation |

## Numeric legacy classes

Inflection classes are described contextually: **3rd conj**, **2nd decl;
neuter pattern**, **1st and 2nd decl**, or **irregular: sum-type**, for
example. They are not printed as internal numeric pairs. Greek, mixed, contracted
and defective patterns retain descriptions supported by the frozen source.
“conj” after an ordinal means conjugation; as a standalone part-of-speech label,
“conj.” means conjunction. Supine and positive degree are left in full.

An unspecified field is written out, not rendered as X. A nonfinite form has no
“zeroth person”. These are display decisions; no candidate or legacy code changes.
Original dictionary prose and the expandable original affix/compound notes retain
their inherited wording, including any abbreviations embedded in that prose.

## Reference conventions

The common case, tense, number, gender and part-of-speech abbreviations are
consistent with examples in [Dickinson College Commentaries, Lucian: Abbreviations](https://dcc.dickinson.edu/lucian-true/abbreviations)
and [Homer: Abbreviations](https://dcc.dickinson.edu/homer-iliad/intro/abbreviations).
These contemporary teaching editions illustrate shared classical-language
notation and differences between house styles; this product selects a consistent
Latin subset. Native meanings and numeric patterns are checked against the pinned
INFLECTS.LAT and the Ada dictionary/inflections type definitions in the preserved
archive. The registry can be revised after terminology review without changing
the legacy engine.
