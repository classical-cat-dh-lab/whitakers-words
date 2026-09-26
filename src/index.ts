import { loadDataset, type Dataset } from './data.js';
import { LegacyCore } from './core.js';
import { Heuristics } from './heuristics.js';
import { compounds } from './compounds.js';
import { sweep } from './sweep.js';
import { formatParses } from './format.js';
import { searchEnglish } from './english.js';
export { presentAnalysis, READER_VERSION } from './reader.js';
export type { ReaderResult, ReaderToken, ReaderItem, ReaderForm, ReaderDetail } from './reader.js';
export { ABBREVIATIONS } from './terminology.js';
import type { PartOfSpeech, EnglishResult } from './model.js';
import { DEFAULT_OPTIONS, SNAPSHOT, PROFILE, VERSION, DATA_IDENTITY, describeQuality, type SourceData, type LegacyOptions, type Analysis, type TokenResult } from './model.js';
export { SNAPSHOT, PROFILE, VERSION, DEFAULT_OPTIONS, DATA_IDENTITY, featureRecord, describeQuality } from './model.js';
export type { Analysis, TokenResult, SourceData, LegacyOptions, Parse, Entry, Rule, Quality, Trace, NativeMorphology, PartOfSpeech, EnglishResult } from './model.js';
export interface Analyzer {
    analyze(input: string, options?: Partial<LegacyOptions>): Analysis;
    lookupEnglish(input: string, partOfSpeech?: PartOfSpeech, trim?: boolean): EnglishResult;
}
function options(input: Partial<LegacyOptions>): LegacyOptions {
    for (const [key, value] of Object.entries(input))
        if (!(key in DEFAULT_OPTIONS) || typeof value !== 'boolean')
            throw new TypeError('Unknown or invalid legacy option: ' + key);
    return { ...DEFAULT_OPTIONS, ...input };
}
interface Token {
    surface: string;
    lookup: string;
    start: number;
    end: number;
    period: boolean;
    line: number;
}
function tokenize(input: string): Token[] {
    const out: Token[] = [];
    let position = 0, line = 0;
    // WORDS consumes at most 2,500 bytes per console read. ASCII token boundaries
    // are reproduced bytewise; spans refer to the untouched JavaScript string.
    for (const sourceLine of input.split('\n')) {
        const bytes: number[] = [], offsets: number[] = [];
        let local = 0;
        for (const char of sourceLine) {
            const encoded = new TextEncoder().encode(char);
            for (const b of encoded) {
                bytes.push(b);
                offsets.push(position + local);
            }
            local += char.length;
        }
        offsets.push(position + sourceLine.length);
        for (let start = 0; start < bytes.length; start += 2500) {
            line++;
            let text = String.fromCharCode(...bytes.slice(start, start + 2500));
            const dash = text.indexOf('--');
            if (dash > 0)
                text = text.slice(0, dash + 1);
            for (const match of text.matchAll(/[A-Za-z]+\.?/g)) {
                const first = start + match.index, last = first + match[0].length, a = offsets[first], b = offsets[last];
                const period = match[0].endsWith('.'), raw = period ? match[0].slice(0, -1) : match[0];
                out.push({ surface: input.slice(a, b), lookup: raw.replaceAll('QV', 'QU').replaceAll('qv', 'qu'), start: a, end: b, period, line });
            }
        }
        position += sourceLine.length + 1;
    }
    return out;
}
/** @internal The public source-loading entry point is createAnalyzer. */
export function analyzerFromDataset(data: Dataset): Analyzer {
    return Object.freeze({ lookupEnglish: (input: string, pos: PartOfSpeech = 'X', trim = true) => searchEnglish(data, input, pos, trim), analyze(input: string, overrides: Partial<LegacyOptions> = {}): Analysis {
            if (typeof input !== 'string')
                throw new TypeError('Latin input must be a string');
            const selected = options(overrides), core = new LegacyCore(data, selected), heuristics = new Heuristics(core), words = tokenize(input), tokens: TokenResult[] = [];
            for (let i = 0; i < words.length; i++) {
                const token = words[i], next = words[i + 1];
                const parses = heuristics.passBuffer(token.lookup, /^[A-Z][a-z]/.test(token.lookup));
                let consumedNext = false;
                if (parses.last && selected.compounds && next?.line === token.line) {
                    const joined = compounds(parses, next.surface);
                    consumedNext = joined.consumed;
                }
                const filtered = sweep(parses, selected, { allCaps: /^[A-Z]+$/.test(token.lookup), period: token.period });
                const column = i === 0 || words[i - 1].line !== token.line ? 2 : 0;
                const unknown = token.lookup + (token.lookup.length + column > 29 ? '\n' + ' '.repeat(29) : ' '.repeat(29 - column - token.lookup.length)) + '    ========   UNKNOWN    \n' + (filtered.trimmed ? '*' : '') + '\n';
                const legacyText = heuristics.messages.map(s => s + '\n').join('') + (filtered.parses.length ? formatParses(filtered.parses, filtered.trimmed) : unknown);
                const end = consumedNext ? next.end : token.end;
                tokens.push({ surface: input.slice(token.start, end), lookup: token.lookup, span: { start: token.start, end }, status: filtered.parses.length ? 'analyzed' : 'unknown', parses: structuredClone(filtered.parses).map(p => ({ ...p, morphology: describeQuality(p.rule.quality) })), trimmed: filtered.trimmed, legacyText, consumedNext, diagnostics: [] });
                if (consumedNext)
                    i++;
            }
            const unknown = tokens.filter(t => t.status === 'unknown').length;
            const status: Analysis['status'] = tokens.length ? (unknown === tokens.length ? 'unknown' : unknown ? 'partial' : 'analyzed') : input.trim() ? 'unsupported-input' : 'empty';
            const diagnostics: string[] = [];
            if (/[^\x00-\x7f]/.test(input))
                diagnostics.push('legacy-non-ascii: non-ASCII bytes separate ASCII lookup fragments; original input and spans are retained');
            if (input.split('\n').some(line => new TextEncoder().encode(line).length > 2500))
                diagnostics.push('legacy-chunked-line: a line is consumed in successive 2500-byte chunks');
            const profile = Object.keys(selected).some(k => selected[k as keyof LegacyOptions] !== DEFAULT_OPTIONS[k as keyof LegacyOptions]) ? 'custom' : PROFILE;
            return { schemaVersion: 1, engineVersion: VERSION, snapshot: SNAPSHOT, profile, dataIdentity: { ...DATA_IDENTITY }, status, truncated: false, diagnostics, input, options: selected, tokens, legacyText: tokens.map(t => t.legacyText).join(''), appliedDeviations: [] };
        } });
}
export async function createAnalyzer(source: SourceData): Promise<Analyzer> { return analyzerFromDataset(await loadDataset(source)); }
export const correctedLayer = Object.freeze({ id: 'corrected-v1', deviations: Object.freeze([] as readonly string[]) });
export function applyCorrectedLayer(legacy: Analysis, selectedDeviations: readonly string[] = []): {
    layer: 'corrected-v1';
    legacy: Analysis;
    corrected: Analysis;
    deviations: readonly string[];
} {
    if (selectedDeviations.length)
        throw new RangeError('No linguistic deviations have been qualified in corrected-v1');
    return { layer: correctedLayer.id as 'corrected-v1', legacy: structuredClone(legacy), corrected: structuredClone(legacy), deviations: [] };
}
