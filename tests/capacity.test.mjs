import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createNodeAnalyzer} from '../node/index.mjs';
import {LegacyCore} from '../dist/core.js';
import {ParseBuffer,emptyEntry,emptyRule} from '../dist/buffer.js';
import {capacityRows} from './helpers/capacity.mjs';

test('dictionary, inflection, reduction and pronoun boundary states match native Ada',async()=>{
  const fixture=JSON.parse(await readFile(new URL('compatibility/capacity.json',import.meta.url)));
  assert.deepEqual(capacityRows(LegacyCore,ParseBuffer,emptyEntry,emptyRule),fixture.rows);
});

test('source-selected sequences and sixteen option profiles match native sessions in either request order',async()=>{
  const fixture=JSON.parse(await readFile(new URL('compatibility/capacity-options.json',import.meta.url)));
  const analyzer=await createNodeAnalyzer();
  assert.equal(fixture.cases.length,512);
  for(const c of [...fixture.cases,...fixture.cases.toReversed()]){
    const r=analyzer.analyze(c.input,c.options);
    const text=r.legacyText.split('\n').map(l=>l.trimEnd()).join('\n').trim();
    assert.equal(createHash('sha256').update(text).digest('hex'),c.expectedSha256,JSON.stringify(c));
    assert.equal(r.status==='legacy-error',c.nativeException,c.input);
  }
});
