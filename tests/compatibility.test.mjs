import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {createNodeAnalyzer} from '../node/index.mjs';
const analyzer=await createNodeAnalyzer();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const view=text=>text.split('\n').map(line=>line.trimEnd()).join('\n').trim();
test('3,953 frozen reference observations preserve order, morphology, meanings and internal blank lines',async()=>{
  const manifest=JSON.parse(await readFile(new URL('compatibility/manifest.json',import.meta.url),'utf8'));
  const bytes=await readFile(new URL('compatibility/corpus.json.gz',import.meta.url));assert.equal(hash(bytes),manifest.corpusSha256);
  const raw=gunzipSync(bytes);assert.equal(hash(raw),manifest.uncompressedSha256);const corpus=JSON.parse(raw);assert.equal(corpus.length,manifest.cases);
  const failures=[];
  for(const {word,output} of corpus){const actual=analyzer.analyze(word).legacyText;if(view(actual)!==view(output))failures.push({word,actual,expected:output});}
  assert.deepEqual(failures,[]);
});
test('all 21 original baseline cases, including the five upstream groups',async()=>{
  const root=new URL('legacy/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));let fragments=0;
  for(const c of manifest.cases){
    const dir=new URL('cases/'+c.id+'/',root),files={};
    for(const [name,expected] of Object.entries(c.files)){const bytes=await readFile(new URL(name,dir));assert.equal(hash(bytes),expected);files[name]=bytes.toString('utf8');}
    const english=c.id==='40_english';
    const inputs=files['input.txt'].split('\n').filter(line=>/[A-Za-z]/.test(line)&&line!=='~E').flatMap(line=>{const b=Buffer.from(line);return Array.from({length:Math.ceil(b.length/2500)},(_,i)=>b.subarray(i*2500,(i+1)*2500).toString('utf8'));});
    const frames=files['stdout.txt'].split(/^=>/m).slice(english?2:1).map(frame=>frame.replace(/^Blank exits =>/,'')).filter(frame=>frame.trim());
    assert.equal(inputs.length,frames.length,c.id+' console frame accounting');
    if(!inputs.length)assert.equal(analyzer.analyze(files['input.txt']).legacyText,'');
    for(let i=0;i<inputs.length;i++){const result=english?analyzer.lookupEnglish(inputs[i]):analyzer.analyze(inputs[i]);assert.equal(view(result.legacyText),view(frames[i]),c.id+': '+inputs[i]);fragments++;}
  }assert.equal(fragments,751);
});
