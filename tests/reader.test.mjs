import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createNodeAnalyzer} from '../node/index.mjs';
import {presentAnalysis,inflectionPattern} from '../dist/reader.js';
import {ABBREVIATIONS} from '../dist/terminology.js';
import {READING_ABBREVIATIONS} from '../browser/notation.mjs';
import {readDataset} from '../node/data.mjs';
const analyzer=await createNodeAnalyzer();
const text=forms=>forms.map(f=>f.terms.map(t=>t.text).join(' '));
test('student notation describes morphology and irregular patterns without numeric class codes',()=>{
  const verb=presentAnalysis(analyzer.analyze('tetigisti')).tokens[0].items[0];assert.equal(verb.title,'tango, tangere, tetigi, tactus');assert.deepEqual(verb.labels.map(l=>l.text),['verb','third conj.']);assert.deepEqual(text(verb.forms),['perf. act. indic. 2nd sg.']);
  const noun=presentAnalysis(analyzer.analyze('regina')).tokens[0].items[0];assert.deepEqual(text(noun.forms),['nom. sg. f.','voc. sg. f.','abl. sg. f.']);
  const sum=presentAnalysis(analyzer.analyze('sum')).tokens[0].items[0];assert(sum.labels.some(l=>l.text==='irregular: sum-type'));assert(!sum.labels.some(l=>l.text.includes('fifth')));
  const me=presentAnalysis(analyzer.analyze('mecum')).tokens[0];assert(me.items[0].meaning.startsWith('With'));assert.deepEqual(text(me.items[1].forms),['abl. sg. m./f.','acc. sg. m./f.']);
  const infinitive=presentAnalysis(analyzer.analyze('audire')).tokens[0].items[0].forms.find(f=>f.terms.some(t=>t.id==='infinitive'));assert(infinitive);assert(!infinitive.terms.some(t=>t.category==='Person'));
  const unique=presentAnalysis(analyzer.analyze('mavis')).tokens[0].items[0];assert.equal(unique.title,'mavis');assert.equal(unique.labels[0].text,'verb');assert.equal(analyzer.analyze('mavis').tokens[0].parses[0].entry.part.pos,'X');
  const queen=presentAnalysis(analyzer.lookupEnglish('queen')).tokens[0].items[0];assert.deepEqual(queen.labels.map(l=>l.text),['noun','f.','first decl.']);
  const without=presentAnalysis(analyzer.lookupEnglish('without')).tokens[0].items;assert(without.find(i=>i.title==='sine').labels.some(l=>l.text==='with abl.'));
  const uninflected=presentAnalysis(analyzer.analyze('cumi')).tokens[0].items;assert(uninflected.some(i=>i.forms.some(f=>f.terms.some(t=>t.text==='person unspecified'))));
});
test('all frozen source patterns and dictionary metadata have explicit display mappings',async()=>{
  const data=await readDataset();
  for(const p of [...data.entries.map(e=>e.part),...data.rules.map(r=>r.quality),...data.uniques.map(u=>u.quality)]){
    if(/^\d/.test(p.codes[0]??'')){const pattern=inflectionPattern(p.pos,+p.codes[0],+p.codes[1]);assert(!/\b\d+\s+\d+\b/.test(pattern));}
  }
  for(const entry of data.entries){const view=presentAnalysis({input:'',hits:[{entry}],trimmed:false});assert.equal(view.tokens[0].items[0].details.length,5);assert(view.tokens[0].items[0].labels.length);}
  assert.throws(()=>inflectionPattern('V',99,99),/Unmapped/);
});
test('the reader preserves every candidate and explanatory row in all 3,953 reference inputs',async()=>{
  const corpus=JSON.parse(gunzipSync(await readFile(new URL('compatibility/corpus.json.gz',import.meta.url))));
  for(const {word}of corpus){const legacy=analyzer.analyze(word),before=JSON.stringify(legacy),view=presentAnalysis(legacy);assert.equal(JSON.stringify(legacy),before,word+' mutation');assert.equal(view.tokens.length,legacy.tokens.length);
    view.tokens.forEach((t,i)=>{assert.equal(t.surface,legacy.tokens[i].surface);assert.deepEqual(t.items.flatMap(x=>x.sourceIndices),legacy.tokens[i].parses.map((_,j)=>j),word+' row accounting');for(const item of t.items){assert(!/\b\d+\s+\d+\b/.test(item.labels.map(t=>t.text).join(' ')),word);}});
  }
});
test('the reviewable abbreviation table matches the live terminology registry',async()=>{
  const document=await readFile(new URL('../docs/abbreviations.md',import.meta.url),'utf8');
  assert.equal(new Set(ABBREVIATIONS.map(t=>t.id)).size,ABBREVIATIONS.length);
  for(const t of READING_ABBREVIATIONS)assert(document.includes(`| ${t.category} | ${t.text} | ${t.full} |`));
});
