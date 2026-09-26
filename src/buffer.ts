import type { Entry, Parse, Rule } from './model.js';
export const emptyEntry: Entry = { id: 0, sourceLine: null, stems: ['', '', '', ''], part: { pos: 'X', codes: [] }, flags: 'XXXXX', meaning: '', citation: '' };
export const emptyRule: Rule = { id: 0, sourceLine: 0, quality: { pos: 'X', codes: [] }, key: 0, ending: '', age: 'X', frequency: 'X' };
export const nullParse: Parse = { stem: '', rule: emptyRule, entry: emptyEntry, dictionary: 'X', traces: [] };
export class LegacyConstraintError extends Error {
}
/** Native one-based storage. Last is independent of the retained array contents.
 * Records are replaced, never mutated in place, so overlapping copies have Ada
 * value semantics without cloning the immutable dictionary for every assignment.
 */
export class ParseBuffer {
    private readonly slots: Parse[];
    last = 0;
    constructor(readonly capacity: number, initial: readonly Parse[] = [], storage?: Parse[]) {
        this.slots = storage ?? Array(capacity + 1).fill(nullParse);
        this.appendAll(initial);
    }
    private check(index: number): void {
        if (!Number.isInteger(index) || index < 1 || index > this.capacity)
            throw new LegacyConstraintError('Legacy parse buffer index outside 1..' + this.capacity);
    }
    get(index: number): Parse { this.check(index); return this.slots[index]; }
    set(index: number, value: Parse): void { this.check(index); this.slots[index] = value; }
    append(value: Parse): void { this.set(++this.last, value); }
    appendAll(values: readonly Parse[]): void {
        for (const value of values)
            this.append(value);
    }
    read(first = 1, last = this.last): Parse[] {
        if (last < first)
            return [];
        this.check(first);
        this.check(last);
        return this.slots.slice(first, last + 1);
    }
    copy(to: number, from: number, count: number, source: ParseBuffer = this): void {
        if (count <= 0)
            return;
        const values = source.read(from, from + count - 1);
        this.check(to);
        this.check(to + count - 1);
        for (let i = 0; i < count; i++)
            this.slots[to + i] = values[i];
    }
    remove(index: number): void {
        this.copy(index, index + 1, this.last - index);
        this.last--;
    }
    insert(first: number, value: Parse): void {
        this.last++;
        this.copy(first + 1, first, this.last - first);
        this.set(first, value);
    }
    view(capacity = this.last): ParseBuffer {
        if (capacity < 0 || capacity > this.capacity)
            throw new LegacyConstraintError('Legacy parse slice exceeds storage');
        const result = new ParseBuffer(capacity, [], this.slots);
        result.last = capacity;
        return result;
    }
}
