import {readFile,writeFile,mkdir,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readDataset} from '../node/data.mjs';
import {LegacyCore,resolveRule} from '../dist/core.js';
import {Heuristics} from '../dist/heuristics.js';
import {sweep} from '../dist/sweep.js';
import {formatParses} from '../dist/format.js';
import {analyzerFromDataset} from '../dist/index.js';
const root=new URL('../',import.meta.url);
const inputs=['arma','regina','nullius','ludica','quidam','est','mecum','multusque','amasti','amavere','amarunt','quae','dixit','audivi','audiit','audierunt','dixe','amatus','iii','IV','VIIII','IIX','XLIX','CXL','qui','cui','mihi','se','bono','pulchre','maxime','meipsum','respublica','praestantissimus','civitas','iunii','vehementer','adfero','affero','inperium','inpulsus','celum','michi','nichil','optimus','minima','amare','am','re','Ama','ROMA','xyzzy','Aeneas','Aeneae','ludicra','rerum','rem','acu','tetigisti','mortuus','itur','hortare','fer','fac','dic','duc'];
if(process.argv.includes('--aeneid')){const a=await readFile(new URL('tests/legacy/cases/10_aeneid/input.txt',root),'utf8');inputs.push(...a.match(/[a-zA-Z]+/g));}
if(process.argv.includes('--generated')){
  const data=await readDataset();inputs.push(...data.uniques.map(u=>u.word));
  const stems=[...data.stems.values()].flat();
  for(const rule of data.rules){const stem=stems.find(s=>/^[a-z]{2,18}$/i.test(s.stem)&&resolveRule(rule,s.entry.part,s.key));if(stem)inputs.push((stem.stem+rule.ending).toLowerCase());}
  inputs.push('Qui','QUAE','quae','MECUM','aliquid','aliquod','unusquisque','quicumque','quecumque','quidvis','quodlibet','faxis','dixti','audisti','emisti','relictum iri','adgnosco','adplico','inlatus','subpono','difficillime','fortissime','celerrime','quattordecim','septendecim','duodetriginta');
}
const words=[...new Set(inputs)];
await mkdir(new URL('.cache/differential/',root),{recursive:true});
const cache=new URL('.cache/differential/corpus.json',root);
let reference;
if(process.argv.includes('--capture')){
  const work=resolve(process.argv[process.argv.indexOf('--oracle')+1]);
  const run=await mkdtemp(join(tmpdir(),'words-differential-'));
  try{
    for(const name of ['DICTFILE.GEN','STEMFILE.GEN','INDXFILE.GEN','EWDSFILE.GEN','INFLECTS.SEC','ADDONS.LAT','UNIQUES.LAT'])await copyFile(join(work,name),join(run,name));
    await copyFile(new URL('tests/legacy/profile/WORD.MDV',root),join(run,'WORD.MDV'));
    const out=spawnSync(join(work,'bin/words'),[],{input:words.join('\n')+'\n\n\n',cwd:run,env:{...process.env,WHITAKERS_WORDS_DATADIR:run,LC_ALL:'C'},encoding:'utf8',timeout:120000,maxBuffer:64*1024*1024});
    if(out.status!==0||out.stderr)throw new Error('Reference failed: '+out.stderr);
    const frames=out.stdout.split(/^=>/m).slice(1,words.length+1);
    if(frames.length!==words.length)throw new Error('Reference frame accounting failed');
    reference=words.map((word,i)=>({word,output:frames[i].replace(/^\n/,'')}));
    await writeFile(cache,JSON.stringify(reference,null,2)+'\n');
  }finally{await rm(run,{recursive:true,force:true});}
}else reference=JSON.parse(await readFile(cache,'utf8'));
const data=await readDataset(),analyzer=analyzerFromDataset(data);
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
const failures=[];
for(const {word,output} of reference){
  const actual=analyzer.analyze(word).legacyText;
  if(view(output)!==view(actual))failures.push({word,expected:view(output),actual:view(actual)});
}
await writeFile(new URL('.cache/differential/failures.json',root),JSON.stringify(failures,null,2)+'\n');
console.log(JSON.stringify({cases:reference.length,passed:reference.length-failures.length,failed:failures.length,firstFailures:failures.slice(0,12)},null,2));
