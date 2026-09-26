import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createNodeAnalyzer} from '../node/index.mjs';
import {presentAnalysis} from '../dist/index.js';
import {prepareParses} from '../dist/format.js';
import {nullParse,LegacyConstraintError} from '../dist/buffer.js';
const analyzer=await createNodeAnalyzer();
const fixture=JSON.parse(await readFile(new URL('compatibility/exception-sessions.json',import.meta.url)));
const boundaries=JSON.parse(await readFile(new URL('compatibility/cycle-boundaries.json',import.meta.url)));
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
const sha=s=>createHash('sha256').update(s).digest('hex');

test('native line, blank-read and exceptional sessions match across option profiles',()=>{
  for(const c of fixture.cases){
    const result=analyzer.analyze(c.input,c.options);
    assert.equal(sha(view(result.legacyText)),c.expectedSha256,JSON.stringify({input:c.input,options:c.options}));
    assert.equal(result.status==='legacy-error',c.nativeException);
    if(c.nativeException){assert.equal(result.truncated,true);assert.equal(result.legacyFailure.exitCode,c.nativeExitCode);}
    for(const t of result.tokens)assert.equal(c.input.slice(t.span.start,t.span.end),t.surface);
  }
});

test('a native exception discards its pending line, retains completed lines and ends the session',()=>{
  const good=analyzer.analyze('amo');
  const r=analyzer.analyze('amo\namo pilarium amas\nlaudo');
  assert.deepEqual(r.tokens.map(t=>[t.lookup,t.status]),[['amo','analyzed'],['pilarium','legacy-error']]);
  const diagnostic='Unexpected exception in CYCLE_OVER_PA processing pilarium\nException in PARSE_LINE processing amo pilarium amas\nUnexpected exception raised in PARSE\n';
  assert.equal(r.legacyText,good.legacyText+diagnostic);
  assert.deepEqual(r.legacyFailure,{stage:'cycle-over-pa',line:2,word:'pilarium',exitCode:0});
  assert.equal(r.tokens.at(-1).parses.length,0);
  const reader=presentAnalysis(r);
  assert.equal(reader.tokens.at(-1).status,'legacy-error');
  assert.deepEqual(reader.notes,r.diagnostics);
  assert.deepEqual(analyzer.analyze('amo'),good);
  assert.throws(()=>analyzer.analyze('pilarium',{unknown:true}),TypeError);
});

test('blank termination preserves the unread source offset without synthesizing analyses',()=>{
  const input='amo\n   \n\nlaudo';
  const r=analyzer.analyze(input);
  assert.equal(r.legacyText,analyzer.analyze('amo').legacyText);
  assert.equal(r.truncated,true);
  assert.deepEqual(r.legacyStop,{reason:'blank-input',offset:9});
  assert.equal(input.slice(r.legacyStop.offset),'laudo');
  assert.equal(analyzer.analyze('amo\n\n\n').truncated,false);
});

test('CLI exceptional stdout, stderr, exit code and JSONL stopping match the native contract',()=>{
  const run=(args,input='')=>spawnSync(process.execPath,['cli/main.mjs',...args],{cwd:new URL('../',import.meta.url),input,encoding:'utf8'});
  for(const word of ['pilarium','pilarivm']){
    const r=run(['--legacy',word]);
    assert.equal(r.stdout,`Unexpected exception in CYCLE_OVER_PA processing ${word}\nException in PARSE_LINE processing ${word}\nUnexpected exception raised in PARSE\n`);
    assert.equal(r.stderr,'');assert.equal(r.status,0);
  }
  for(const corrected of [false,true]){
    const r=run(['--jsonl',...(corrected?['--corrected']:[])],'amo\npilarium\namas\n');
    const rows=r.stdout.trim().split('\n').map(JSON.parse).map(x=>x.corrected??x);
    assert.deepEqual(rows.map(x=>x.status),['analyzed','legacy-error']);
    assert.equal(r.stderr,'');assert.equal(r.status,0);
  }
  const invalid=run(['--unsupported']);
  assert.equal(invalid.status,1);assert.match(invalid.stderr,/Unknown option/);
});

test('native grouping capacities include the eager read past the final parse slot',()=>{
  for(const {count,perGroup,nativePass} of boundaries.cases){
    const parses=Array.from({length:count},(_,i)=>({...nullParse,dictionary:'GEN',entry:{...nullParse.entry,id:Math.floor(i/perGroup)+1},rule:{...nullParse.rule,quality:{pos:'V',codes:['1','1','PRES','ACTIVE','IND','1','S']}}}));
    if(nativePass)assert.doesNotThrow(()=>prepareParses(parses));
    else assert.throws(()=>prepareParses(parses),LegacyConstraintError);
  }
});
