// Port of the ordered legacy fallback passes. See licenses/whitaker.txt.
import { LegacyCore, marker } from './core.js';
import { ParseBuffer, emptyEntry, emptyRule, nullParse, LegacyConstraintError } from './buffer.js';
import type { Parse, Trace } from './model.js';
import { TABLES, type Trick } from './trick-tables.js';
import { onlyRoman, romanParse } from './numerals.js';
export function explanation(stem: string, meaning: string, kind: Trace['kind'], input: string, output: string, dictionary: 'XXX' | 'YYY' = 'XXX'): Parse {
    return { stem: stem.slice(0, 18), rule: emptyRule, entry: { ...emptyEntry, meaning: meaning.slice(0, 80) }, dictionary, traces: [{ kind, sourceId: 'words_engine-tricks.adb', input, output, explanation: meaning }] };
}
function annotate(pa: ParseBuffer, index: number): void {
    const mark = pa.get(index);
    for (let i = index + 1; i <= pa.last; i++) {
        const p = pa.get(i);
        pa.set(i, { ...p, traces: [...mark.traces, ...p.traces] });
    }
}
const acceptable = (pa: ParseBuffer, saved: number) => pa.last > saved + 1 && pa.get(pa.last - 1).rule.quality.pos !== 'TACKON';
const vowel = (c: string) => 'aeiouy'.includes(c.toLowerCase());
export class Heuristics {
    private xxxMeaning = '';
    private yyyMeaning = '';
    readonly messages: string[] = [];
    constructor(readonly core: LegacyCore) { }
    private syncopeInto(word: string, pa: ParseBuffer, fixes: boolean): void {
        this.yyyMeaning = '';
        const s = word.toLowerCase(), saved = pa.last;
        const tests = [
            { fragments: ['ii'], last: s.length - 2, first: 0, insert: 'v', stem: 'Syncope  ii => ivi', meaning: "Syncopated perfect ivi can drop 'v' without contracting vowel ", strict: true },
            { fragments: ['as', 'es', 'is', 'os'], last: s.length - 3, first: 0, insert: 'vi', stem: 'Syncope   s => vis', meaning: "Syncopated perfect often drops the 'v' and contracts vowel ", strict: false },
            { fragments: ['ar', 'er', 'or'], last: s.length - 3, first: 1, insert: 've', stem: 'Syncope   r => v.r', meaning: "Syncopated perfect often drops the 'v' and contracts vowel ", strict: true },
            { fragments: ['ier'], last: s.length - 4, first: 0, insert: 'v', stem: 'Syncope  ier=>iver', meaning: "Syncopated perfect often drops the 'v' and contracts vowel ", strict: true },
            { fragments: ['s', 'x'], last: s.length - 3, first: 0, insert: 'is', stem: 'Syncope s/x => +is', meaning: "Syncopated perfect sometimes drops the 'is' after 's' or 'x' ", strict: true }
        ];
        try {
            for (const test of tests) {
                for (let i = test.last; i >= test.first; i--) {
                    if (!test.fragments.some(f => s.startsWith(f, i)))
                        continue;
                    const modified = s.slice(0, i + 1) + test.insert + s.slice(i + 1);
                    pa.append(explanation(test.stem, '', 'syncope', word, modified, 'YYY'));
                    this.core.wordInto(modified, pa, fixes);
                    if (pa.last > saved + 1)
                        break;
                    pa.last = saved;
                }
                if (pa.last > saved + 1) {
                    const p = pa.get(pa.last), perfect = p.rule.quality.pos === 'V' && p.rule.key === 3;
                    if (perfect || !test.strict) {
                        this.yyyMeaning = perfect ? test.meaning : '';
                        const p = pa.get(saved + 1);
                        pa.set(saved + 1, { ...p, entry: { ...p.entry, meaning: this.yyyMeaning }, traces: p.traces.map(t => ({ ...t, explanation: this.yyyMeaning })) });
                        annotate(pa, saved + 1);
                        return;
                    }
                }
                pa.last = saved;
            }
        }
        catch (error) {
            if (!(error instanceof LegacyConstraintError))
                throw error;
            pa.last = saved;
        }
        pa.set(saved + 1, nullParse);
    }
    private tword(word: string, pa: ParseBuffer, fixes: boolean): void {
        this.core.wordInto(word, pa, fixes);
        this.syncopeInto(word, pa, fixes);
    }
    private table(word: string, tables: Trick[], pa: ParseBuffer, fixes: boolean, slury = false): boolean {
        for (const [op, a, b, max] of tables) {
            const saved = pa.last, attempts: {
                word: string;
                stem: string;
                meaning: string;
            }[] = [];
            if (op === 'Internal') {
                for (let i = 0; i <= word.length - a.length; i++)
                    if (word.startsWith(a, i))
                        attempts.push({ word: word.slice(0, i) + b + word.slice(i + a.length), stem: `Word mod ${a}/${b}`, meaning: `An internal '${a}' might be rendered by '${b}'` });
            }
            else if (op === 'Slur') {
                const n = a.length;
                if (word.length >= n + 2 && word.startsWith(a) && !vowel(word[n]))
                    attempts.push({ word: a.slice(0, -1) + word[n] + word.slice(n), stem: `Slur ${a}/${a.slice(0, -1)}~`, meaning: `An initial '${a}' may be rendered by ${a.slice(0, -1)}~` });
            }
            else {
                for (const [from, to] of op === 'Flip_Flop' ? [[a, String(b)], [String(b), a]] : [[a, String(b)]])
                    if (word.length >= from.length + 2 && word.startsWith(from)) {
                        attempts.push({ word: to + word.slice(from.length), stem: `Word mod ${from}/${to}`, meaning: `An initial '${slury && op === 'Flip_Flop' ? a : from}' ${op === 'Flip' && !slury ? 'may have replaced usual' : 'may be rendered by'} '${slury && op === 'Flip_Flop' ? b : to}'` });
                        if (slury)
                            break;
                    }
            }
            for (const a of attempts) {
                pa.append(explanation(a.stem, a.meaning, slury ? 'slury' : 'trick', word, a.word));
                this.tword(a.word, pa, fixes);
                if (acceptable(pa, saved)) {
                    this.xxxMeaning = a.meaning.slice(0, 80);
                    annotate(pa, saved + 1);
                    break;
                }
                pa.last = saved;
            }
            // Native tables can deliberately continue after a small successful hit.
            if (pa.last > (op === 'Slur' ? Number(b) : max ?? 0))
                return true;
        }
        return false;
    }
    private sluryInto(word: string, pa: ParseBuffer, fixes: boolean): void {
        const saved = pa.last, prefixes = this.core.usePrefixes;
        this.core.usePrefixes = false;
        try {
            this.table(word, TABLES[word[0]?.toUpperCase() + '_Slur_Tricks'] ?? [], pa, fixes, true);
        }
        catch (error) {
            if (!(error instanceof LegacyConstraintError))
                throw error;
            pa.last = saved;
            pa.set(saved + 1, nullParse);
            this.messages.push('Exception in TRY_SLURY processing ' + word);
        }
        finally {
            this.core.usePrefixes = prefixes;
        }
    }
    private splitInto(word: string, pa: ParseBuffer, fixes: boolean): void {
        const saved = pa.last;
        let num1 = false, num2 = false, i = 2;
        while (i < word.length - 2) {
            pa.append(explanation('Two words', '', 'split', word, ''));
            while (i < word.length - 2) {
                const first = word.slice(0, i);
                if (!['dis', 'ex', 'in', 'per', 'prae', 'pro', 're', 'si', 'sub', 'super', 'trans'].includes(first)) {
                    this.core.wordInto(first, pa, fixes);
                    if (pa.last > saved + 1) {
                        num1 ||= pa.read(saved + 1).some(p => p.rule.quality.pos === 'NUM');
                        break;
                    }
                }
                i++;
            }
            if (pa.last <= saved + 1) {
                pa.last = saved;
                return;
            }
            const first = word.slice(0, i), second = word.slice(i);
            pa.append(nullParse);
            const middle = pa.last;
            this.core.wordInto(second, pa, fixes);
            if (pa.last > middle && pa.get(pa.last - 1).rule.quality.pos !== 'TACKON') {
                num2 ||= pa.read(middle).some(p => p.rule.quality.pos === 'NUM');
                const numeric = this.core.options.trim && num1 && num2;
                if (numeric) {
                    // Ada evaluates this bound once. Removed tail slots remain readable.
                    const bound = pa.last;
                    for (let j = saved + 1; j <= bound; j++) {
                        const p = pa.get(j);
                        if (['GEN', 'UNI'].includes(p.dictionary) && p.rule.quality.pos !== 'NUM')
                            pa.remove(j);
                    }
                }
                this.xxxMeaning = (numeric ? `It is very likely a compound number    ${first} + ${second}` : `May be 2 words combined (${first}+${second}) If not obvious, probably incorrect`).slice(0, 80);
                pa.set(saved + 1, explanation('Two words', this.xxxMeaning, 'split', word, first + ' ' + second));
                annotate(pa, saved + 1);
                return;
            }
            pa.last = saved;
            i++;
        }
        pa.last = saved;
    }
    private tricksInto(word: string, pa: ParseBuffer, fixes: boolean): void {
        const saved = pa.last;
        this.xxxMeaning = '';
        try {
            if (word.startsWith('is')) {
                pa.last = 1;
                pa.set(1, explanation('Word mod is => iis', '', 'trick', word, 'i' + word));
                this.tword('i' + word, pa, fixes);
                const q = pa.get(pa.last).rule.quality;
                if (acceptable(pa, saved) && q.pos === 'V' && q.codes[0] === '6' && q.codes[1] === '1') {
                    this.xxxMeaning = "Some forms of eo stem 'i' grates with an 'is .. .' ending, so 'is' -> 'iis' ";
                    pa.set(1, explanation('Word mod is => iis', this.xxxMeaning, 'trick', word, 'i' + word));
                    annotate(pa, 1);
                    return;
                }
                pa.last = 0;
            }
            for (const table of [TABLES[word[0]?.toUpperCase() + '_Tricks'] ?? [], TABLES.Any_Tricks])
                if (this.table(word, table, pa, fixes))
                    return;
            if (word.length > 3 && word.endsWith('is')) {
                const start = pa.last, modified = word.slice(0, -2) + 'iis';
                pa.append(explanation('Word mod iis -> is', '', 'trick', word, modified));
                this.core.wordInto(modified, pa, fixes);
                for (let i = pa.last; i > start + 1; i--) {
                    const q = pa.get(i).rule.quality, c = q.codes;
                    if (!(q.pos === 'ADJ' && c[0] === '1' && c[1] === '1' && ['DAT', 'ABL'].includes(c[2]) && c[3] === 'P'))
                        pa.remove(i);
                }
                if (pa.last > start + 1) {
                    this.xxxMeaning = "A Terminal 'iis' on ADJ 1 1 DAT/ABL P might drop 'i'";
                    pa.set(start + 1, explanation('Word mod iis -> is', this.xxxMeaning, 'trick', word, modified));
                    annotate(pa, start + 1);
                    return;
                }
                pa.last = start;
            }
            if (this.core.options.medievalTricks) {
                if (this.table(word, TABLES.Mediaeval_Tricks, pa, fixes))
                    return;
                const start = pa.last;
                for (let i = 1; i < word.length - 1; i++)
                    if (!vowel(word[i]) && vowel(word[i - 1]) && vowel(word[i + 1])) {
                        const modified = word.slice(0, i + 1) + word.slice(i), meaning = 'A doubled consonant may be rendered by just the single  MEDIEVAL';
                        pa.append(explanation(`Word mod ${word[i]} -> ${word[i]}${word[i]}`, meaning, 'trick', word, modified));
                        this.tword(modified, pa, fixes);
                        if (acceptable(pa, start)) {
                            this.xxxMeaning = meaning;
                            annotate(pa, start + 1);
                            break;
                        }
                        pa.last = start;
                    }
            }
            if (this.core.options.twoWords)
                this.splitInto(word, pa, fixes);
            if (onlyRoman(word)) {
                this.xxxMeaning = '';
                pa.last = 0;
                pa.append(explanation('Bad Roman Numeral?', '', 'roman', word, word));
                pa.appendAll(romanParse(word, true));
            }
        }
        catch (error) {
            if (!(error instanceof LegacyConstraintError))
                throw error;
            pa.last = saved;
            pa.set(saved + 1, nullParse);
            this.messages.push('Exception in TRY_TRICKS processing ' + word);
        }
    }
    pass(word: string, capitalized = false): Parse[] { return this.passBuffer(word, capitalized).read(); }
    passBuffer(word: string, capitalized = false): ParseBuffer {
        this.xxxMeaning = '';
        this.yyyMeaning = '';
        this.messages.length = 0;
        const pa = new ParseBuffer(100), o = this.core.options;
        let doneEnclitic = false;
        const hasToBe = () => pa.read().some(p => p.rule.quality.pos === 'V' && p.rule.quality.codes[0] === '5' && p.rule.quality.codes[1] === '1');
        const sync = (fixes: boolean, suppressed = false) => {
            if (!o.syncope || suppressed)
                return;
            const sy = new ParseBuffer(20);
            this.syncopeInto(word, sy, fixes);
            pa.copy(pa.last + 1, 1, sy.last, sy);
            pa.last += sy.last;
        };
        const enclitic = (fixes: boolean) => {
            if (doneEnclitic)
                return;
            const entering = pa.last, lower = word.toLowerCase();
            for (const tack of this.core.tackons.slice(0, pa.last ? 1 : 4)) {
                const less = this.core.subtract(lower, tack);
                if (less === null)
                    continue;
                this.core.wordInto(less, pa, fixes);
                if (!pa.last)
                    this.sluryInto(less, pa, fixes);
                sync(fixes, hasToBe());
                const saved = this.core.onlyFixes;
                this.core.onlyFixes = true;
                try {
                    this.core.wordInto(word, pa, fixes);
                }
                finally {
                    this.core.onlyFixes = saved;
                }
                if (pa.last > entering) {
                    pa.insert(entering + 1, marker(tack, 'tackon', word, less));
                    annotate(pa, entering + 1);
                    doneEnclitic = true;
                }
                return;
            }
        };
        pa.appendAll(romanParse(word));
        this.core.wordInto(word, pa);
        if (!pa.last)
            this.sluryInto(word, pa, false);
        sync(false, hasToBe());
        enclitic(false);
        if (!pa.last && o.fixes) {
            const saved = this.core.onlyFixes;
            this.core.onlyFixes = true;
            try {
                this.core.wordInto(word, pa, true);
                sync(true);
                enclitic(true);
            }
            finally {
                this.core.onlyFixes = saved;
            }
        }
        if (!pa.last && o.tricks && !(capitalized && o.ignoreUnknownNames)) {
            const tr = new ParseBuffer(40);
            this.tricksInto(word, tr, o.fixes);
            if (!tr.last && !doneEnclitic)
                for (const tack of this.core.tackons.slice(0, 4)) {
                    const less = this.core.subtract(word.toLowerCase(), tack);
                    if (less === null)
                        continue;
                    const saved = tr.last;
                    this.tricksInto(less, tr, o.fixes);
                    if (tr.last > saved) {
                        tr.insert(saved + 1, marker(tack, 'tackon', word, less));
                        annotate(tr, saved + 1);
                    }
                    break;
                }
            pa.copy(pa.last + 1, 1, tr.last, tr);
            pa.last += tr.last;
        }
        for (let i = 1; i <= pa.capacity; i++) {
            const p = pa.get(i);
            if (p.dictionary === 'XXX' || p.dictionary === 'YYY')
                pa.set(i, { ...p, entry: { ...p.entry, meaning: p.dictionary === 'XXX' ? this.xxxMeaning : this.yyyMeaning } });
        }
        return pa;
    }
}
