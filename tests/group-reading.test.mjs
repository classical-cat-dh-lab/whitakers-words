import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createNodeAnalyzer} from '../node/index.mjs';
import {presentAnalysis} from '../dist/reader.js';
import {orderReading} from '../browser/reading-order.mjs';
import {groupReading} from '../browser/group-reading.mjs';

const analyzer = await createNodeAnalyzer();
const reading = word => {
  const result = analyzer.analyze(word);
  return groupReading(orderReading(presentAnalysis(result), result)).tokens[0].items;
};

test('repeated principal parts share a heading, complete meanings and identical forms', () => {
  const [magnus] = reading('magnus');
  assert.equal(reading('magnus').length, 1);
  assert.equal(magnus.members.length, 3);
  assert.equal(magnus.sections.length, 1);
  assert.deepEqual(magnus.sections[0].meanings, magnus.members.map(item => item.meaning));
  assert.equal(magnus.sections[0].forms.length, 1);
  assert.deepEqual(magnus.sections[0].forms[0].sourceIndices, [0, 1, 2]);
  assert.equal(reading('magna')[0].sections[0].forms.length, 6);
  const qui = reading('qui').find(item => item.title === 'qui');
  assert.equal(qui.members.length, 10);
  assert.ok(qui.sections.length < qui.members.length);
  assert.ok(qui.sections.some(section => section.labels[0].id === 'adverb'));
  assert.ok(qui.sections.some(section => section.labels.some(label => label.id === 'relative')));
});

test('homonyms retain meaning-to-form associations and metadata differences', () => {
  const malus = reading('malo').find(item => item.title === 'malus, mali');
  assert.equal(malus.sections.length, 2);
  assert.match(malus.sections[0].meanings[0], /mast/);
  assert.ok(malus.sections[0].forms.every(form => form.terms.some(term => term.full === 'masculine')));
  assert.match(malus.sections[1].meanings[0], /apple tree/);
  assert.ok(malus.sections[1].forms.every(form => form.terms.some(term => term.full === 'feminine')));
  const base = presentAnalysis(analyzer.analyze('magnus'));
  base.tokens[0].items[1].details = [{label: 'Period', value: 'Medieval'}];
  const grouped = groupReading(base).tokens[0].items[0];
  assert.equal(grouped.sections.length, 2);
  assert.equal(grouped.sections[1].details[0].value, 'Medieval');
  assert.equal(grouped.sections[1].meanings.length, 1);
});

test('explanations delimit grouping and English lookup retains each distinct meaning', () => {
  const view = presentAnalysis(analyzer.analyze('magnus'));
  const note = {kind: 'explanation', title: 'Alternative spelling', sourceIndices: []};
  view.tokens[0].items.splice(1, 0, note);
  const grouped = groupReading(view).tokens[0].items;
  assert.equal(grouped.length, 3);
  assert.strictEqual(grouped[1], note);
  assert.equal(grouped[0].members.length, 1);
  assert.equal(grouped[2].members.length, 2);
  const english = presentAnalysis(analyzer.lookupEnglish('great'));
  const entries = groupReading(english).tokens[0].items;
  assert.deepEqual(entries.flatMap(item => item.members).sort((a,b) => a.sourceIndices[0]-b.sourceIndices[0]), english.tokens[0].items);
  for (const entry of entries) for (const member of entry.members)
    assert.ok(entry.sections.some(section => section.meanings.includes(member.meaning)));
});

test('browser groups preserve every source item, meaning and form across 3,953 inputs in both orders', async () => {
  const corpus = JSON.parse(gunzipSync(await readFile(new URL('compatibility/corpus.json.gz', import.meta.url))));
  for (const {word} of corpus) {
    const result = analyzer.analyze(word), view = presentAnalysis(result), before = JSON.stringify({result, view});
    for (const order of ['frequency', 'original']) {
      const ordered = orderReading(view, result, order), grouped = groupReading(ordered);
      for (const [index, token] of grouped.tokens.entries()) {
        const restored = token.items.flatMap(item => item.members ?? [item]);
        assert.equal(restored.length, ordered.tokens[index].items.length, word);
        for (const original of ordered.tokens[index].items) assert.ok(restored.includes(original), word);
        const beforeNotes = ordered.tokens[index].items.filter(item => item.kind !== 'entry');
        assert.deepEqual(token.items.filter(item => item.kind !== 'entry'), beforeNotes, word);
        for (const group of token.items.filter(item => item.kind === 'entry')) {
          const originalForms = group.members.flatMap(item => item.forms).map(form => form.sourceIndex).sort((a,b) => a-b);
          const displayedForms = group.sections.flatMap(section => section.forms).flatMap(form => form.sourceIndices).sort((a,b) => a-b);
          assert.deepEqual(displayedForms, originalForms, word + ' form multiplicity');
          for (const member of group.members) {
            for (const form of member.forms) {
              assert.ok(group.sections.some(section => section.meanings.includes(member.meaning)
                && JSON.stringify(section.labels) === JSON.stringify(member.labels)
                && JSON.stringify(section.details) === JSON.stringify(member.details)
                && section.forms.some(candidate => candidate.sourceIndices.includes(form.sourceIndex)
                  && JSON.stringify(candidate.terms) === JSON.stringify(form.terms)
                  && JSON.stringify(candidate.notes) === JSON.stringify(form.notes)
                  && candidate.form === form.form)), word + ' meaning/form association');
            }
          }
        }
      }
    }
    assert.equal(JSON.stringify({result, view}), before, word + ' mutation');
  }
});
