import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNodeAnalyzer} from '../node/index.mjs';
import {readDataset} from '../node/data.mjs';
import {LegacyCore} from '../dist/core.js';
import {ParseBuffer, nullParse, LegacyConstraintError} from '../dist/buffer.js';

const fixture=JSON.parse(await readFile(new URL('compatibility/parse-buffers.json',import.meta.url)));
const analyzer=await createNodeAnalyzer(),data=await readDataset();
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();

test('retained parse slots, fixed loop bounds and call-boundary case conversion match Ada',()=>{
  for(const c of fixture.cases)
    assert.equal(view(analyzer.analyze(c.input,c.options).legacyText),c.expected,JSON.stringify({input:c.input,options:c.options}));
  // Reversing requests must not carry a previous buffer into the next lookup.
  for(const c of [...fixture.cases].reverse())
    assert.equal(view(analyzer.analyze(c.input,c.options).legacyText),c.expected,c.input);
});

test('parse storage preserves overlapping copies, inactive slots and native rollback bounds',()=>{
  const record=stem=>({...nullParse,stem});
  const b=new ParseBuffer(4,['a','b','c'].map(record));
  b.remove(2);
  assert.deepEqual(b.read().map(p=>p.stem),['a','c']);
  assert.equal(b.get(3).stem,'c');
  b.insert(2,record('d'));
  assert.deepEqual(b.read().map(p=>p.stem),['a','d','c']);
  b.copy(2,1,3);
  assert.deepEqual(b.read(1,4).map(p=>p.stem),['a','a','d','c']);
  b.last=1;
  assert.equal(b.get(4).stem,'c');
  const slice=b.view();
  slice.set(1,record('shared'));
  assert.equal(b.get(1).stem,'shared');
  assert.throws(()=>slice.get(2),LegacyConstraintError);
  for(const capacity of [20,40,100]) {
    const full=new ParseBuffer(capacity,Array(capacity).fill(record('retained')));
    assert.throws(()=>full.append(record('overflow')),LegacyConstraintError);
    assert.equal(full.last,capacity+1);
    assert.equal(full.get(capacity).stem,'retained');
  }
  const small=new ParseBuffer(1),core=new LegacyCore(data);
  core.wordInto('amare',small);
  assert.equal(small.last,0);
  assert.notDeepEqual(small.get(1),nullParse);
});

test('all addon spellings and connections reproduce native text-reader state',async()=>{
  const expected=JSON.parse(await readFile(new URL('compatibility/addon-reader.json',import.meta.url)));
  assert.equal(expected.records.length,343);
  for(const r of expected.records) {
    const actual=data.affixes[r.id-1];
    assert.deepEqual({id:actual.id,fix:actual.fix,connect:actual.connect},r);
  }
});
