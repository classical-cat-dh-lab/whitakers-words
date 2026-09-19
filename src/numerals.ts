// Port of words_engine-roman_numerals_package.adb. See licenses/whitaker.txt.
import type { Parse } from './model.js';
import { emptyEntry, emptyRule } from './core.js';
export const onlyRoman = (word: string): boolean => /^[MDCLXVI]+$/i.test(word);
export function romanNumber(word: string): number {
    if (!onlyRoman(word))
        return 0;
    const s = word.toUpperCase();
    let j = s.length - 1, total = 0;
    // Preserve the legacy acceptance of IIII/VIIII and its limits and ordering.
    while (j >= 0) {
        const previous = j;
        if (s[j] === 'I') {
            total++;
            if (--j < 0)
                return total;
            while (s[j] === 'I') {
                if (++total >= 5)
                    return 0;
                if (--j < 0)
                    return total;
            }
        }
        if (s[j] === 'V') {
            total += 5;
            if (--j < 0)
                return total;
            if (s[j] === 'I' && total === 5) {
                total--;
                if (--j < 0)
                    return total;
            }
            if ('IV'.includes(s[j]))
                return 0;
        }
        if (s[j] === 'X') {
            total += 10;
            if (--j < 0)
                return total;
            while (s[j] === 'X') {
                total += 10;
                if (total >= 50)
                    return 0;
                if (--j < 0)
                    return total;
            }
            if (s[j] === 'I' && total === 10) {
                total--;
                if (--j < 0)
                    return total;
            }
            if ('IV'.includes(s[j]))
                return 0;
        }
        if (s[j] === 'L') {
            total += 50;
            if (--j < 0)
                return total;
            if (s[j] === 'X' && total <= 59) {
                total -= 10;
                if (--j < 0)
                    return total;
            }
            if ('IVXL'.includes(s[j]))
                return 0;
            if (s[j] === 'C') {
                total += 100;
                if (--j < 0)
                    return total;
                if (s[j] === 'X' && total === 100) {
                    total -= 10;
                    if (--j < 0)
                        return total;
                }
            }
            if ('IVXL'.includes(s[j]))
                return 0;
        }
        if (s[j] === 'C') {
            total += 100;
            if (--j < 0)
                return total;
            while (s[j] === 'C') {
                total += 100;
                if (total >= 500)
                    return 0;
                if (--j < 0)
                    return total;
            }
            if (s[j] === 'X' && total <= 109) {
                total -= 10;
                if (--j < 0)
                    return total;
            }
            if ('IVXL'.includes(s[j]))
                return 0;
        }
        if (s[j] === 'D') {
            total += 500;
            if (--j < 0)
                return total;
            if (s[j] === 'C' && total <= 599) {
                total -= 100;
                if (--j < 0)
                    return total;
            }
            if (s[j] === 'M') {
                total += 1000;
                if (--j < 0)
                    return total;
            }
            if (s[j] === 'C' && total <= 1099) {
                total -= 100;
                if (--j < 0)
                    return total;
            }
            if ('IVXLCD'.includes(s[j]))
                return 0;
        }
        if (s[j] === 'M') {
            total += 1000;
            if (--j < 0)
                return total;
            while (s[j] === 'M') {
                total += 1000;
                if (total >= 5000)
                    return 0;
                if (--j < 0)
                    return total;
            }
            if (s[j] === 'C' && total <= 1099) {
                total -= 100;
                if (--j < 0)
                    return total;
            }
            if ('IVXLCD'.includes(s[j]))
                return 0;
        }
        if (j === previous)
            return 0;
    }
    return total;
}
export function badRomanNumber(s: string): number {
    const value = (c: string) => ({ M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 }[c.toUpperCase()] ?? 0);
    let total = value(s.at(-1) ?? ''), from = total;
    for (let i = s.length - 2; i >= 0; i--) {
        const a = value(s[i]), b = value(s[i + 1]);
        if (a < b) {
            total -= a;
            from = b;
        }
        else if (a === b)
            total += a < from ? -a : a;
        else {
            total += a;
            from = b;
        }
    }
    return Math.max(0, total);
}
export function romanParse(word: string, bad = false): Parse[] {
    const number = bad ? badRomanNumber(word) : romanNumber(word);
    if (!number)
        return [];
    const meaning = ` ${number}  as ${bad ? 'ill-formed ROMAN NUMERAL?' : 'a ROMAN NUMERAL'};`;
    return [{ stem: word.slice(0, 18), rule: { ...emptyRule, quality: { pos: 'NUM', codes: ['2', '0', 'X', 'X', 'X', 'CARD'] }, frequency: bad ? 'D' : 'A' }, entry: { ...emptyEntry, meaning }, dictionary: 'RRR', traces: [{ kind: 'roman', sourceId: 'words_engine-roman_numerals_package.adb', input: word, output: String(number), explanation: meaning.trim() }] }];
}
