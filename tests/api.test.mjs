import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createNodeAnalyzer} from '../node/index.mjs';
import {createAnalyzer,applyCorrectedLayer,featureRecord} from '../dist/index.js';
import {readDataset} from '../node/data.mjs';
const analyzer=await createNodeAnalyzer();
test('all canonical source records and compiler-added sum are accountable',async()=>{
  const data=await readDataset();assert.equal(data.entries.length,39336);assert.equal(data.stemCount,62084);assert.equal(data.rules.length,1797);assert.equal(data.affixes.length,343);assert.equal(data.uniques.length,79);assert.equal(data.english.length,149326);
  assert.equal(data.entries.at(-1).sourceLine,null);assert.deepEqual(data.entries.at(-1).part,{pos:'V',codes:['5','1','TO_BE']});
  assert.deepEqual(data.entries.slice(0,-1).map(e=>e.sourceLine),Array.from({length:39335},(_,i)=>i+1));
});
test('Unicode and compound spans map to the untouched UTF-16 source',()=>{
  const input='😀 amāre ama\u0304re 拉丁語 amatus est.';const result=analyzer.analyze(input);
  assert.deepEqual(result.tokens.map(t=>t.lookup),['am','re','ama','re','amatus','est']);
  for(const t of result.tokens)assert.equal(input.slice(t.span.start,t.span.end),t.surface);
  // A period attached to the following word prevents the original compound test.
  assert.equal(result.tokens.at(-1).consumedNext,false);
});
test('compound and feature provenance remains native to WORDS',()=>{
  const r=analyzer.analyze('amatus est');assert.equal(r.tokens.length,1);assert.equal(r.tokens[0].surface,'amatus est');
  assert(r.tokens[0].parses.some(p=>p.traces.some(t=>t.kind==='compound')));
  const q=r.tokens[0].parses.at(-1).rule.quality;assert.deepEqual(featureRecord(q),{class:1,variant:1,tense:'PERF',voice:'PASSIVE',mood:'IND',person:3,number:'S'});
});
test('request state and returned objects cannot mutate later analyses',()=>{
  const first=analyzer.analyze('arma'),before=structuredClone(first);first.tokens[0].parses[0].entry.meaning='mutated';first.options.trim=false;
  analyzer.analyze('amasti');analyzer.lookupEnglish('wild');analyzer.analyze('amare',{trim:false});
  assert.deepEqual(analyzer.analyze('arma'),before);
  const correction=applyCorrectedLayer(before);correction.corrected.tokens[0].lookup='changed';assert.deepEqual(correction.legacy,before);
  assert.deepEqual(applyCorrectedLayer(before).corrected,before);assert.throws(()=>applyCorrectedLayer(before,['unapproved-correction']));
});
test('invalid options and malformed or modified data fail explicitly',async()=>{
  assert.throws(()=>analyzer.analyze(null),TypeError);assert.throws(()=>analyzer.analyze('arma',{trim:1}),TypeError);assert.throws(()=>analyzer.analyze('arma',{mystery:true}),TypeError);
  await assert.rejects(createAnalyzer({dictionary:'tampered'}),/checksum mismatch/);
  const names={dictionary:'legacy/DICTLINE.GEN',inflections:'legacy/INFLECTS.LAT',addons:'legacy/ADDONS.LAT',uniques:'legacy/UNIQUES.LAT',dictionaryForms:'dictionary-forms.tsv',englishIndex:'english-index.tsv'};
  const source=Object.fromEntries(await Promise.all(Object.entries(names).map(async([k,v])=>[k,await readFile(new URL('../data/'+v,import.meta.url),'utf8')])));
  for(const key of Object.keys(source))await assert.rejects(createAnalyzer({...source,[key]:source[key]+'\n'}),/checksum mismatch/);
});
test('CLI JSON, JSONL, English and corrected results use the same core',()=>{
  const run=(args,input='')=>spawnSync(process.execPath,['cli/main.mjs',...args],{cwd:new URL('../',import.meta.url),input,encoding:'utf8'});
  assert.deepEqual(JSON.parse(run(['arma']).stdout),analyzer.analyze('arma'));
  assert.deepEqual(run(['--jsonl'],'arma\namasti\n').stdout.trim().split('\n').map(JSON.parse),['arma','amasti'].map(w=>analyzer.analyze(w)));
  assert.deepEqual(JSON.parse(run(['--english','wild']).stdout),analyzer.lookupEnglish('wild'));
  assert.deepEqual(JSON.parse(run(['--corrected','arma']).stdout),applyCorrectedLayer(analyzer.analyze('arma')));
  assert.equal(run(['--legacy','arma']).stdout,analyzer.analyze('arma').legacyText);assert.equal(run(['--unsupported']).status,1);
});
test('browser reference hashes cover the same structured contract',async()=>{
  const cases=JSON.parse(await readFile(new URL('../browser/validation-cases.json',import.meta.url),'utf8'));
  for(const c of cases){let r=c.mode==='english'?analyzer.lookupEnglish(c.input):analyzer.analyze(c.input);if(c.mode==='corrected')r=applyCorrectedLayer(r);assert.equal(createHash('sha256').update(JSON.stringify(r)).digest('hex'),c.sha256,c.label);}
});
