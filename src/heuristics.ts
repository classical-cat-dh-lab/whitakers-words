// Port of the ordered legacy fallback passes. See licenses/whitaker.txt.
import { LegacyCore, emptyEntry, emptyRule, marker } from './core.js';
import type { Parse, Trace } from './model.js';
import { TABLES, type Trick } from './trick-tables.js';
import { onlyRoman, romanParse } from './numerals.js';
export function explanation(stem: string, meaning: string, kind: Trace['kind'], input: string, output: string, dictionary: 'XXX' | 'YYY' = 'XXX'): Parse {
    return { stem: stem.slice(0, 18), rule: emptyRule, entry: { ...emptyEntry, meaning: meaning.slice(0, 80) }, dictionary, traces: [{ kind, sourceId: 'words_engine-tricks.adb', input, output, explanation: meaning }] };
}
function withExplanation(mark: Parse, parses: Parse[]): Parse[] { return [mark, ...parses.map(p => ({ ...p, traces: [...mark.traces, ...p.traces] }))]; }
const acceptable = (p: Parse[]) => p.length > 0 && p.at(-2)?.rule.quality.pos !== 'TACKON';
const vowel = (c: string) => 'aeiouy'.includes(c);
export class Heuristics {
    constructor(readonly core: LegacyCore) { }
    syncope(word: string, fixes = false, entering = 0): Parse[] {
        const s = word.toLowerCase();
        const tests = [
            { fragments: ['ii'], last: s.length - 2, first: 0, insert: 'v', stem: 'Syncope  ii => ivi', meaning: "Syncopated perfect ivi can drop 'v' without contracting vowel ", strict: true },
            { fragments: ['as', 'es', 'is', 'os'], last: s.length - 3, first: 0, insert: 'vi', stem: 'Syncope   s => vis', meaning: "Syncopated perfect often drops the 'v' and contracts vowel ", strict: false },
            { fragments: ['ar', 'er', 'or'], last: s.length - 3, first: 1, insert: 've', stem: 'Syncope   r => v.r', meaning: "Syncopated perfect often drops the 'v' and contracts vowel ", strict: true },
            { fragments: ['ier'], last: s.length - 4, first: 0, insert: 'v', stem: 'Syncope  ier=>iver', meaning: "Syncopated perfect often drops the 'v' and contracts vowel ", strict: true },
            { fragments: ['s', 'x'], last: s.length - 3, first: 0, insert: 'is', stem: 'Syncope s/x => +is', meaning: "Syncopated perfect sometimes drops the 'is' after 's' or 'x' ", strict: true }
        ];
        for (const test of tests)
            for (let i = test.last; i >= test.first; i--) {
                if (!test.fragments.some(f => s.startsWith(f, i)))
                    continue;
                const modified = s.slice(0, i + 1) + test.insert + s.slice(i + 1), p = this.core.word(modified, fixes, 0, entering + 1);
                if (!p.length)
                    continue;
                const perfect = p.at(-1)!.rule.quality.pos === 'V' && p.at(-1)!.rule.key === 3;
                if (perfect || !test.strict)
                    return withExplanation(explanation(test.stem, perfect ? test.meaning : '', 'syncope', word, modified, 'YYY'), p);
                break;
            }
        return [];
    }
    tword(word: string, fixes: boolean): Parse[] {
        const p = this.core.word(word, fixes, 0, 1);
        return [...p, ...this.syncope(word, fixes, p.length + 1)];
    }
    table(word: string, tables: Trick[], fixes: boolean, slury = false): Parse[] {
        const s = word;
        for (const [op, a, b] of tables) {
            const attempts: {
                word: string;
                stem: string;
                meaning: string;
            }[] = [];
            if (op === 'Internal') {
                for (let i = 0; i <= s.length - a.length; i++)
                    if (s.startsWith(a, i))
                        attempts.push({ word: s.slice(0, i) + b + s.slice(i + a.length), stem: `Word mod ${a}/${b}`, meaning: `An internal '${a}' might be rendered by '${b}'` });
            }
            else if (op === 'Slur') {
                const n = a.length;
                if (s.length >= n + 2 && s.startsWith(a) && !vowel(s[n]))
                    attempts.push({ word: a.slice(0, -1) + s[n] + s.slice(n), stem: `Slur ${a}/${a.slice(0, -1)}~`, meaning: `An initial '${a}' may be rendered by ${a.slice(0, -1)}~` });
                // The reverse branch compares unequal-length Ada strings and never succeeds.
            }
            else {
                const pairs = op === 'Flip_Flop' ? [[a, String(b)], [String(b), a]] : [[a, String(b)]];
                for (const [from, to] of pairs) {
                    if (s.length >= from.length + 2 && s.startsWith(from)) {
                        attempts.push({ word: to + s.slice(from.length), stem: `Word mod ${from}/${to}`, meaning: `An initial '${slury && op === 'Flip_Flop' ? a : from}' ${op === 'Flip' && !slury ? 'may have replaced usual' : 'may be rendered by'} '${slury && op === 'Flip_Flop' ? b : to}'` });
                        if (slury)
                            break;
                    }
                }
            }
            for (const a of attempts) {
                const p = this.tword(a.word, fixes);
                if (acceptable(p))
                    return withExplanation(explanation(a.stem, a.meaning, slury ? 'slury' : 'trick', s, a.word), p);
            }
        }
        return [];
    }
    slury(word: string, fixes = false): Parse[] {
        const saved = this.core.usePrefixes;
        this.core.usePrefixes = false;
        try { return this.table(word, TABLES[word[0]?.toUpperCase() + '_Slur_Tricks'] ?? [], fixes, true); }
        finally { this.core.usePrefixes = saved; }
    }
    split(word: string, fixes: boolean): Parse[] {
        let num1 = false, num2 = false;
        for (let i = 2; i < word.length - 2; i++) {
            const first = word.slice(0, i), second = word.slice(i);
            if (['dis', 'ex', 'in', 'per', 'prae', 'pro', 're', 'si', 'sub', 'super', 'trans'].includes(first))
                continue;
            let a = this.core.word(first, fixes, 0, 1);
            if (!a.length)
                continue;
            num1 ||= a.some(p => p.rule.quality.pos === 'NUM');
            let b = this.core.word(second, fixes, 0, a.length + 1);
            if (!acceptable(b))
                continue;
            num2 ||= b.some(p => p.rule.quality.pos === 'NUM');
            const numeric = this.core.options.trim && num1 && num2;
            if (numeric) {
                const combined = [...a, ...b];
                for (let j = 0; j < combined.length; j++)
                    if (['GEN', 'UNI'].includes(combined[j].dictionary) && combined[j].rule.quality.pos !== 'NUM')
                        combined.splice(j, 1);
                a = combined;
                b = [];
            }
            const meaning = numeric ? `It is very likely a compound number    ${first} + ${second}` : `May be 2 words combined (${first}+${second}) If not obvious, probably incorrect`;
            const separator: Parse = { stem: '', rule: emptyRule, entry: emptyEntry, dictionary: 'PPP', literal: '', traces: [] };
            return withExplanation(explanation('Two words', meaning, 'split', word, first + ' ' + second), [...a, separator, ...b]);
        }
        return [];
    }
    tricks(word: string, fixes: boolean): Parse[] {
        if (word.startsWith('is')) {
            const p = this.tword('i' + word, fixes), q = p.at(-1)?.rule.quality;
            if (acceptable(p) && q?.pos === 'V' && q.codes[0] === '6' && q.codes[1] === '1')
                return withExplanation(explanation('Word mod is => iis', "Some forms of eo stem 'i' grates with an 'is .. .' ending, so 'is' -> 'iis' ", 'trick', word, 'i' + word), p);
        }
        for (const table of [TABLES[word[0]?.toUpperCase() + '_Tricks'] ?? [], TABLES.Any_Tricks]) {
            const p = this.table(word, table, fixes);
            if (p.length)
                return p;
        }
        if (word.length > 3 && word.endsWith('is')) {
            const modified = word.slice(0, -2) + 'iis';
            const p = this.core.word(modified, fixes).filter(p => { const q = p.rule.quality, c = q.codes; return q.pos === 'ADJ' && c[0] === '1' && c[1] === '1' && ['DAT', 'ABL'].includes(c[2]) && c[3] === 'P'; });
            if (p.length)
                return withExplanation(explanation('Word mod iis -> is', "A Terminal 'iis' on ADJ 1 1 DAT/ABL P might drop 'i'", 'trick', word, modified), p);
        }
        let doubled: Parse[] = [];
        if (this.core.options.medievalTricks) {
            const p = this.table(word, TABLES.Mediaeval_Tricks, fixes);
            if (p.length)
                return p;
            for (let i = 1; i < word.length - 1; i++)
                if (!vowel(word[i]) && vowel(word[i - 1]) && vowel(word[i + 1])) {
                    const modified = word.slice(0, i + 1) + word.slice(i);
                    const p = this.tword(modified, fixes);
                    if (acceptable(p)) {
                        doubled = withExplanation(explanation(`Word mod ${word[i]} -> ${word[i]}${word[i]}`, 'A doubled consonant may be rendered by just the single  MEDIEVAL', 'trick', word, modified), p);
                        break;
                    }
                }
        }
        const split = this.core.options.twoWords ? this.split(word, fixes) : [];
        if (onlyRoman(word))
            return [explanation('Bad Roman Numeral?', '', 'roman', word, word), ...romanParse(word, true)];
        return [...doubled, ...split];
    }
    pass(word: string, capitalized = false): Parse[] {
        const o = this.core.options;
        let p = [...romanParse(word), ...this.core.word(word)];
        let doneEnclitic = false;
        const hasToBe = (parses: Parse[]) => parses.some(x => x.rule.quality.pos === 'V' && x.rule.quality.codes[0] === '5' && x.rule.quality.codes[1] === '1');
        // Native No_Syncope is set before the first pass and enclitic syncope,
        // then cleared by Perform_Syncope. The fixes-only pass does not set it.
        const sync = (w: string, fixes: boolean, suppressed = false) => o.syncope && !suppressed ? this.syncope(w, fixes) : [];
        const enclitic = (fixes: boolean) => {
            if (doneEnclitic)
                return;
            for (const tack of this.core.tackons.slice(0, p.length ? 1 : 4)) {
                const less = this.core.subtract(word, tack);
                if (less === null)
                    continue;
                let hit = this.core.word(less, fixes, 0, p.length);
                if (!p.length && !hit.length)
                    hit = this.slury(less, fixes);
                hit.push(...sync(word, fixes, hasToBe([...p, ...hit])));
                const saved = this.core.onlyFixes;
                this.core.onlyFixes = true;
                try { hit.push(...this.core.word(word, fixes, 0, p.length + hit.length)); }
                finally { this.core.onlyFixes = saved; }
                if (hit.length) {
                    p.push(...withExplanation(marker(tack, 'tackon', word, less), hit));
                    doneEnclitic = true;
                }
                return;
            }
        };
        if (!p.length)
            p = this.slury(word);
        p.push(...sync(word, false, hasToBe(p)));
        enclitic(false);
        if (!p.length && o.fixes) {
            this.core.onlyFixes = true;
            try {
                p = this.core.word(word, true);
                p.push(...sync(word, true));
                enclitic(true);
            }
            finally { this.core.onlyFixes = false; }
        }
        if (!p.length && o.tricks && !(capitalized && o.ignoreUnknownNames)) {
            p = this.tricks(word, o.fixes);
            if (!p.length && !doneEnclitic)
                for (const tack of this.core.tackons.slice(0, 4)) {
                    const less = this.core.subtract(word, tack);
                    if (less === null)
                        continue;
                    const hit = this.tricks(less, o.fixes);
                    if (hit.length)
                        p = withExplanation(marker(tack, 'tackon', word, less), hit);
                    break;
                }
        }
        return p;
    }
}
