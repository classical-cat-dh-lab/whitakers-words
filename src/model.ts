export const SNAPSHOT = 'words-mk270-1f2f0fb' as const;
export const PROFILE = 'upstream-tests-v1' as const;
export const VERSION = '0.2.1-alpha.1' as const;
export const DATA_IDENTITY = Object.freeze({ commit: '1f2f0fb0867a896d7b9284a03d615ed635d6f992', sourceArchiveSha256: '9fae6c316fb299bbb27f7512d405ee03edecaeb82867a8134a7804677c6c0182', dictionaryFormsSha256: '3e6b20033e6cd894586f89e16352b071a1f3ef0e017de21d0d1c1d4eb0fbe218', englishIndexSha256: '7750aad0435854489aa4374055b58a6db8c270bca7eab130ecf602633b5fa13d' });
export const POS = ['X', 'N', 'PRON', 'PACK', 'ADJ', 'NUM', 'ADV', 'V', 'VPAR', 'SUPINE', 'PREP', 'CONJ', 'INTERJ', 'TACKON', 'PREFIX', 'SUFFIX'] as const;
export type PartOfSpeech = typeof POS[number];
export type CaseCode = 'X' | 'NOM' | 'VOC' | 'GEN' | 'LOC' | 'DAT' | 'ABL' | 'ACC';
export type NumberCode = 'X' | 'S' | 'P';
export type GenderCode = 'X' | 'M' | 'F' | 'N' | 'C';
export type ComparisonCode = 'X' | 'POS' | 'COMP' | 'SUPER';
export type TenseCode = 'X' | 'PRES' | 'IMPF' | 'FUT' | 'PERF' | 'PLUP' | 'FUTP';
export type VoiceCode = 'X' | 'ACTIVE' | 'PASSIVE';
export type MoodCode = 'X' | 'IND' | 'SUB' | 'IMP' | 'INF' | 'PPL';
interface NominalFeatures {
    class: number;
    variant: number;
    case: CaseCode;
    number: NumberCode;
    gender: GenderCode;
}
export type NativeMorphology = ({
    pos: 'N' | 'PRON' | 'PACK' | 'SUPINE';
} & NominalFeatures) | ({
    pos: 'ADJ';
    comparison: ComparisonCode;
} & NominalFeatures) | ({
    pos: 'NUM';
    sort: 'X' | 'CARD' | 'ORD' | 'DIST' | 'ADVERB';
} & NominalFeatures) | ({
    pos: 'VPAR';
    tense: TenseCode;
    voice: VoiceCode;
    mood: MoodCode;
} & NominalFeatures) | {
    pos: 'V';
    class: number;
    variant: number;
    tense: TenseCode;
    voice: VoiceCode;
    mood: MoodCode;
    person: number;
    number: NumberCode;
} | {
    pos: 'ADV';
    comparison: ComparisonCode;
} | {
    pos: 'PREP';
    case: CaseCode;
} | {
    pos: 'X' | 'CONJ' | 'INTERJ' | 'TACKON' | 'PREFIX' | 'SUFFIX';
};
export interface Quality {
    pos: PartOfSpeech;
    codes: string[];
}
export interface Part {
    pos: PartOfSpeech;
    codes: string[];
}
export interface Entry {
    id: number;
    sourceLine: number | null;
    stems: [
        string,
        string,
        string,
        string
    ];
    part: Part;
    flags: string;
    meaning: string;
    citation: string;
}
export interface Rule {
    id: number;
    sourceLine: number;
    quality: Quality;
    key: number;
    ending: string;
    age: string;
    frequency: string;
}
export interface Affix {
    id: number;
    sourceLine: number;
    kind: 'PREFIX' | 'SUFFIX' | 'TACKON';
    fix: string;
    connect: string;
    codes: string[];
    meaning: string;
}
export interface Unique {
    id: number;
    sourceLine: number;
    word: string;
    quality: Quality;
    part: Part;
    flags: string;
    meaning: string;
}
export interface Stem {
    stem: string;
    key: number;
    entry: Entry;
}
export interface Trace {
    kind: 'prefix' | 'suffix' | 'tackon' | 'syncope' | 'trick' | 'slury' | 'split' | 'compound' | 'roman';
    sourceId: string;
    input: string;
    output: string;
    explanation: string;
}
export interface Parse {
    stem: string;
    rule: Rule;
    entry: Entry;
    dictionary: 'X' | 'GEN' | 'UNI' | 'ADDONS' | 'XXX' | 'YYY' | 'PPP' | 'RRR';
    traces: Trace[];
    literal?: string;
}
export interface LegacyOptions {
    trim: boolean;
    omitArchaic: boolean;
    omitMedieval: boolean;
    omitUncommon: boolean;
    fixes: boolean;
    tricks: boolean;
    medievalTricks: boolean;
    syncope: boolean;
    twoWords: boolean;
    compounds: boolean;
    ignoreUnknownNames: boolean;
    ignoreUnknownCaps: boolean;
}
export const DEFAULT_OPTIONS: Readonly<LegacyOptions> = Object.freeze({ trim: true, omitArchaic: true, omitMedieval: false, omitUncommon: true, fixes: true, tricks: true, medievalTricks: true, syncope: true, twoWords: true, compounds: true, ignoreUnknownNames: true, ignoreUnknownCaps: true });
export interface TokenResult {
    surface: string;
    lookup: string;
    span: {
        start: number;
        end: number;
    };
    status: 'analyzed' | 'unknown' | 'legacy-error';
    parses: (Parse & {
        morphology: NativeMorphology;
    })[];
    trimmed: boolean;
    legacyText: string;
    consumedNext: boolean;
    diagnostics: string[];
}
export interface Analysis {
    schemaVersion: 1;
    engineVersion: string;
    snapshot: typeof SNAPSHOT;
    profile: typeof PROFILE | 'custom';
    dataIdentity: typeof DATA_IDENTITY;
    status: 'analyzed' | 'unknown' | 'partial' | 'empty' | 'unsupported-input';
    truncated: boolean;
    diagnostics: string[];
    input: string;
    options: LegacyOptions;
    tokens: TokenResult[];
    legacyText: string;
    appliedDeviations: readonly string[];
}
export interface SourceData {
    dictionary: string;
    inflections: string;
    addons: string;
    uniques: string;
    dictionaryForms: string;
    englishIndex: string;
}
export interface EnglishIndexRow {
    word: string;
    aux: string;
    entryId: number;
    pos: PartOfSpeech;
    frequency: string;
    semi: number;
    kind: number;
    rank: number;
    sourceRow: number;
}
export interface EnglishResult {
    schemaVersion: 1;
    snapshot: typeof SNAPSHOT;
    engineVersion: string;
    profile: typeof PROFILE | 'custom';
    dataIdentity: typeof DATA_IDENTITY;
    input: string;
    lookup: string;
    partOfSpeech: PartOfSpeech;
    totalHits: number;
    trimmed: boolean;
    hits: {
        entry: Entry;
        index: EnglishIndexRow;
    }[];
    legacyText: string;
}
export const QUALITY_LENGTH: Record<PartOfSpeech, number> = { X: 0, N: 5, PRON: 5, PACK: 5, ADJ: 6, NUM: 6, ADV: 1, V: 7, VPAR: 8, SUPINE: 5, PREP: 1, CONJ: 0, INTERJ: 0, TACKON: 0, PREFIX: 0, SUFFIX: 0 };
export function norm(s: string): string { return s.toLowerCase().replaceAll('v', 'u').replaceAll('j', 'i'); }
export function eq(a: string, b: string): boolean { return norm(a) === norm(b); }
export function cloneQuality(q: Quality): Quality { return { pos: q.pos, codes: [...q.codes] }; }
export function nominal(pos: PartOfSpeech): boolean { return ['N', 'PRON', 'PACK', 'ADJ', 'NUM', 'VPAR', 'SUPINE'].includes(pos); }
export function effective(pos: PartOfSpeech): PartOfSpeech { return pos === 'VPAR' || pos === 'SUPINE' ? 'V' : pos; }
export function featureRecord(q: Quality): Record<string, string | number> {
    let keys: string[];
    switch (q.pos) {
        case 'N':
        case 'PRON':
        case 'PACK':
        case 'SUPINE':
            keys = ['class', 'variant', 'case', 'number', 'gender'];
            break;
        case 'ADJ':
            keys = ['class', 'variant', 'case', 'number', 'gender', 'comparison'];
            break;
        case 'NUM':
            keys = ['class', 'variant', 'case', 'number', 'gender', 'sort'];
            break;
        case 'V':
            keys = ['class', 'variant', 'tense', 'voice', 'mood', 'person', 'number'];
            break;
        case 'VPAR':
            keys = ['class', 'variant', 'case', 'number', 'gender', 'tense', 'voice', 'mood'];
            break;
        case 'ADV':
            keys = ['comparison'];
            break;
        case 'PREP':
            keys = ['case'];
            break;
        default: keys = [];
    }
    return Object.fromEntries(keys.map((key, i) => [key, ['class', 'variant', 'person'].includes(key) ? Number(q.codes[i]) : q.codes[i]]));
}
export function describeQuality(q: Quality): NativeMorphology { return { pos: q.pos, ...featureRecord(q) } as NativeMorphology; }
