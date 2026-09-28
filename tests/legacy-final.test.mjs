import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createNodeAnalyzer} from '../node/index.mjs';
const analyzer=await createNodeAnalyzer();
const sha=s=>createHash('sha256').update(s).digest('hex');
const view=s=>s.split('\n').map(l=>l.replace(/[ \t\r]+$/,'')).join('\n').trim();
const bytes=await readFile(new URL('compatibility/legacy-final.json.gz',import.meta.url));
const checkpoint=JSON.parse(await readFile(new URL('../docs/legacy-checkpoint.json',import.meta.url)));
assert.equal(sha(bytes),checkpoint.fixtureSha256);
const fixture=JSON.parse(gunzipSync(bytes));
for(const [suite,count]of [['input',454],['options',4096],['sequences',2048]])
 test(`final ${suite} qualification preserves ${count} native session bodies and error states`,()=>{
  const cases=fixture.cases.filter(c=>c.suite===suite&&!c.adapterBoundary);assert.equal(cases.length,count);
  for(const c of cases){
   const r=c.mode==='english'?analyzer.lookupEnglish(c.input):analyzer.analyze(c.input,c.options);
   assert.equal(sha(view(r.legacyText)),c.expectedSha256,JSON.stringify({suite,id:c.id,input:c.input.slice(0,100),options:c.options}));
   assert.equal(r.status==='legacy-error',c.nativeException,`${suite}:${c.id}`);
   for(const token of r.tokens??[])assert.equal(c.input.slice(token.span.start,token.span.end),token.surface,`${suite}:${c.id} span`);
  }
 });
test('English inline comments retain the native column-one exception and CLI behavior',()=>{
 for(const input of [' -- make','123 -- make','... -- make',' -- queen']){
  const r=analyzer.lookupEnglish(input);assert.equal(r.lookup,'');assert.equal(r.legacyText,'');assert.equal(r.totalHits,0);
  const cli=spawnSync(process.execPath,['cli/main.mjs','--english','--legacy',input],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
  assert.equal(cli.stdout,'');assert.equal(cli.stderr,'');assert.equal(cli.status,0);
 }
 assert.equal(analyzer.lookupEnglish('-- make').status,'legacy-error');
 assert.equal(analyzer.lookupEnglish('-- queen').legacyText,analyzer.lookupEnglish('queen').legacyText);
 assert.equal(analyzer.lookupEnglish('queen -- make').legacyText,analyzer.lookupEnglish('queen').legacyText);
});
test('English API represents one lookup, with no implicit native console reads',()=>{
 assert.equal(fixture.cases.filter(c=>c.adapterBoundary).length,2);
 assert.equal(analyzer.lookupEnglish('x'.repeat(2500)+' queen').legacyText,'No Match\n');
 assert.equal(analyzer.lookupEnglish(' '.repeat(2500)+'queen').legacyText,analyzer.lookupEnglish('queen').legacyText);
});
