import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNodeAnalyzer} from '../node/index.mjs';
const fixture=JSON.parse(await readFile(new URL('compatibility/source-audit.json',import.meta.url)));
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
const analyzer=await createNodeAnalyzer();
test('source-audited runtime surfaces reproduce native output across option profiles',()=>{
  for(const {input,options,expected} of fixture.cases)
    assert.equal(view(analyzer.analyze(input,options).legacyText),expected,JSON.stringify({input,options}));
  const explanation=analyzer.analyze('amatus est amatum iri').legacyText.split('\n').find(s=>s.startsWith('PERF PASSIVE PPL +'));
  assert.equal(explanation,'PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system'.padEnd(79));
});
