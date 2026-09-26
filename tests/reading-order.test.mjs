import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createNodeAnalyzer} from '../node/index.mjs';
import {presentAnalysis} from '../dist/reader.js';
import {orderReading} from '../browser/reading-order.mjs';

const analyzer = await createNodeAnalyzer();
test('Latin frequency order promotes likely dictionary entries and keeps original and English views available', () => {
  const result = analyzer.analyze('cornu canis cornu'), view = presentAnalysis(result);
  const ordered = orderReading(view, result);
  assert.deepEqual(ordered.tokens.map(t => t.surface), ['cornu', 'canis', 'cornu']);
  assert.equal(view.tokens[0].items[0].title, 'cornus, cornus');
  assert.equal(ordered.tokens[0].items[0].title, 'cornu, cornus');
  assert.equal(ordered.tokens[0].items[0].frequency.code, 'A');
  assert.equal(ordered.tokens[0].items[0].frequency.label, 'Very frequent');
  const tied = view.tokens[1].items.filter(i => result.tokens[1].parses[i.sourceIndices[0]].entry.flags[3] === 'A');
  assert.deepEqual(ordered.tokens[1].items.filter(i => i.frequency.code === 'A').map(i => i.title), tied.map(i => i.title));
  assert.strictEqual(orderReading(view, result, 'original'), view);
  const english = analyzer.lookupEnglish('queen'), englishView = presentAnalysis(english);
  assert.strictEqual(orderReading(englishView, english), englishView);
});

test('unranked frequency evidence stays distinct and explanations retain their interpretation groups', () => {
  const result = analyzer.analyze('cornu'), view = presentAnalysis(result);
  // Controlled metadata exercises all nonordinal source categories without changing the dictionary.
  const codes = ['X', 'F', 'I', 'M', 'N', 'A'];
  const item = view.tokens[0].items[0], parse = result.tokens[0].parses[0];
  const entries = codes.map((code, index) => ({...item, title: code, sourceIndices: [index]}));
  const explanation = {kind: 'explanation', title: 'Attached ending', sourceIndices: []};
  result.tokens[0].parses = codes.map(code => ({...parse, entry: {...parse.entry, flags: parse.entry.flags.slice(0, 3) + code + parse.entry.flags.slice(4)}}));
  view.tokens[0].items = [...entries.slice(0, 5), explanation, entries[5]];
  const sorted = orderReading(view, result).tokens[0].items;
  assert.deepEqual(sorted.map(i => i.title), ['F', 'X', 'I', 'M', 'N', 'Attached ending', 'A']);
  for (const i of sorted.slice(1, 5)) assert.equal(i.frequency.rank, null);
  assert.deepEqual(sorted.slice(1, 5).map(i => i.frequency.label), ['Frequency unspecified', 'Inscription evidence', 'Graffiti evidence', 'Chiefly Pliny']);
  assert.strictEqual(sorted[5], explanation);
});

test('browser ordering preserves every reading item and its forms across all 3,953 reference inputs', async () => {
  const corpus = JSON.parse(gunzipSync(await readFile(new URL('compatibility/corpus.json.gz', import.meta.url))));
  for (const {word} of corpus) {
    const result = analyzer.analyze(word), view = presentAnalysis(result), before = JSON.stringify({result, view});
    const ordered = orderReading(view, result);
    assert.equal(JSON.stringify({result, view}), before, word + ' mutation');
    assert.deepEqual(ordered.tokens.map(t => t.surface), view.tokens.map(t => t.surface));
    for (const [index, token] of ordered.tokens.entries()) {
      const original = view.tokens[index].items;
      assert.equal(token.items.length, original.length, word + ' item count');
      const sourceOrder = token.items.map(({frequency, ...item}) => item).sort((a, b) => a.sourceIndices[0] - b.sourceIndices[0]);
      assert.deepEqual(sourceOrder, original, word + ' candidate/form accounting');
      original.forEach((item, i) => {if (item.kind !== 'entry') assert.strictEqual(token.items[i], item, word + ' explanation position');});
    }
  }
});
