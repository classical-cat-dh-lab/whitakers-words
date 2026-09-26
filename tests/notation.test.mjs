import test from 'node:test';
import assert from 'node:assert/strict';
import {compactTerm} from '../browser/notation.mjs';
import {presentAnalysis} from '../dist/reader.js';
import {createNodeAnalyzer} from '../node/index.mjs';

test('browser notation shortens inflection labels without altering results or full meanings', async () => {
  const analyzer = await createNodeAnalyzer();
  const result = analyzer.analyze('regina bona tetigisti');
  const view = presentAnalysis(result), before = JSON.stringify({result, view});
  const labels = view.tokens.flatMap(t => t.items.flatMap(i => i.labels)).map(compactTerm);
  assert.ok(labels.some(t => t.text === '1st decl' && t.full === 'first declension'));
  assert.ok(labels.some(t => t.text === '1st and 2nd decl' && t.full === 'first and second declension'));
  assert.ok(labels.some(t => t.text === '3rd conj' && t.full === 'third conjugation'));
  assert.equal(JSON.stringify({result, view}), before);
  for (const [word, number] of [['first','1st'],['second','2nd'],['third','3rd'],['fourth','4th'],['fifth','5th']]) {
    assert.equal(compactTerm({text: word + ' decl.; Greek pattern', full: word + ' declension; Greek pattern'}).text, number + ' decl; Greek pattern');
  }
  assert.equal(compactTerm({text:'conj.', full:'conjunction'}).text, 'conj.');
});
