import {readFile,writeFile} from 'node:fs/promises';
import {createNodeAnalyzer} from '../node/index.mjs';
const root=new URL('../tests/legacy/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8')),analyzer=await createNodeAnalyzer();
const view=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
const failures=[];let total=0;
for(const c of manifest.cases){
  const dir=new URL('cases/'+c.id+'/',root),input=await readFile(new URL('input.txt',dir),'utf8'),out=await readFile(new URL('stdout.txt',dir),'utf8');
  const english=c.id==='40_english';
  const lines=input.split('\n').filter(l=>/[A-Za-z]/.test(l)&&l!=='~E').flatMap(l=>{const bytes=Buffer.from(l);return Array.from({length:Math.ceil(bytes.length/2500)},(_,i)=>bytes.subarray(i*2500,(i+1)*2500).toString('utf8'));});
  const frames=out.split(/^=>/m).slice(english?2:1).map(s=>s.replace(/^Blank exits =>/,'')).filter(s=>s.trim());
  if(lines.length!==frames.length){failures.push({case:c.id,frameAccounting:{inputs:lines.length,outputs:frames.length}});continue;}
  for(let i=0;i<lines.length;i++){
    total++;const actual=english?analyzer.lookupEnglish(lines[i]).legacyText:analyzer.analyze(lines[i]).legacyText;
    if(view(actual)!==view(frames[i]))failures.push({case:c.id,input:lines[i],expected:view(frames[i]),actual:view(actual)});
  }
}
await writeFile(new URL('../.cache/differential/fixture-failures.json',import.meta.url),JSON.stringify(failures,null,2)+'\n');
console.log(JSON.stringify({total,failed:failures.length,failures:failures.slice(0,8)},null,2));
