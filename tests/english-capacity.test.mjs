import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createNodeAnalyzer} from '../node/index.mjs';
import {presentAnalysis} from '../dist/index.js';
const analyzer=await createNodeAnalyzer();
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
const sha=s=>createHash('sha256').update(s).digest('hex');

test('every native English index spelling and POS/trim probes match the two reference builds',async()=>{
  const fixture=JSON.parse(gunzipSync(await readFile(new URL('compatibility/english-index.json.gz',import.meta.url))));
  assert.equal(fixture.cases.length,24000);
  for(const c of fixture.cases){
    const r=analyzer.lookupEnglish(c.input,c.pos,c.trim);
    assert.equal(sha(view(r.legacyText)),c.expectedSha256,JSON.stringify(c));
    assert.equal(r.status==='legacy-error',c.nativeException,c.input);
  }
});

test('English overflow retains the attempted hit count, original diagnostics and usable independent calls',()=>{
  const good=analyzer.lookupEnglish('queen');
  assert.equal(analyzer.lookupEnglish('qveen').legacyText,good.legacyText);
  assert.equal(analyzer.lookupEnglish('QVEEN').legacyText,good.legacyText);
  assert.equal(analyzer.lookupEnglish('123').legacyText,'');
  const r=analyzer.lookupEnglish('make');
  assert.equal(r.status,'legacy-error');assert.equal(r.truncated,true);
  assert.equal(r.totalHits,501);assert.equal(r.trimmed,false);assert.deepEqual(r.hits,[]);
  assert.deepEqual(r.legacyFailure,{stage:'english-search',exitCode:0});
  assert.equal(r.legacyText,'exception SEARCH NUMBER_OF_HITS =  501\nException in PARSE_LINE processing make\nUnexpected exception raised in PARSE\n');
  const reader=presentAnalysis(r);
  assert.equal(reader.tokens[0].status,'legacy-error');assert.deepEqual(reader.notes,r.diagnostics);
  assert.deepEqual(analyzer.lookupEnglish('queen'),good);
  assert.throws(()=>analyzer.lookupEnglish('make','INVALID'),TypeError);
});

test('English CLI preserves native stdout/status and stops JSONL after overflow',()=>{
  const run=(args,input='')=>spawnSync(process.execPath,['cli/main.mjs','--english',...args],{cwd:new URL('../',import.meta.url),input,encoding:'utf8'});
  const r=run(['--legacy','make']);
  assert.equal(r.stdout,analyzer.lookupEnglish('make').legacyText);assert.equal(r.stderr,'');assert.equal(r.status,0);
  const batch=run(['--jsonl'],'queen\nmake\nwild\n');
  assert.deepEqual(batch.stdout.trim().split('\n').map(JSON.parse).map(x=>x.input),['queen','make']);
  assert.equal(batch.stderr,'');assert.equal(batch.status,0);
});
