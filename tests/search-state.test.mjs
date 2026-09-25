import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNodeAnalyzer} from '../node/index.mjs';
const fixture=JSON.parse(await readFile(new URL('compatibility/search-state.json',import.meta.url)));
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
const analyzer=await createNodeAnalyzer();
test('search state, affix comparisons and fallback conditions preserve native output',()=>{
  for(const {input,expected} of fixture.cases)assert.equal(view(analyzer.analyze(input).legacyText),expected,input);
});
test('retained dictionary candidates are isolated across requests and returned objects',()=>{
  const first=analyzer.analyze('abare');
  assert.equal(first.tokens[0].parses[0].entry.id,26);
  first.tokens[0].parses[0].entry.meaning='changed by caller';
  for(const input of ['colucula','amasti','anee','xyzzy','abaris'])analyzer.analyze(input);
  for(const {input,expected} of [...fixture.cases].reverse())assert.equal(view(analyzer.analyze(input).legacyText),expected,input);
});
