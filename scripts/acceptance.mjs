// Resumable fixed-package Ada/TypeScript comparison; no external dependencies.
import {readFile,writeFile,mkdir,readdir,mkdtemp,copyFile,rm,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir,cpus,release} from 'node:os';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {createNodeAnalyzer} from '../node/index.mjs';
import {prepareLatinInput} from '../browser/input.mjs';
const root=new URL('../',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const comparisonView=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').trim();
export function adapterLimit(input){
  if(!input.trim())return 'empty-console-line';
  if(/^[@#!~]/.test(input))return 'interactive-command';
  if(Buffer.byteLength(input)>2500)return 'console-line-limit';
  if(/[\r\n\0]/.test(input))return 'console-control';
  return null;
}
const dataFiles=['DICTFILE.GEN','STEMFILE.GEN','INDXFILE.GEN','EWDSFILE.GEN','INFLECTS.SEC','ADDONS.LAT','UNIQUES.LAT'];
const names=['original','simple','teaching','special','browser'];
async function runWorker(){
  const {oracle,out}=workerData,run=await mkdtemp(join(tmpdir(),'words-ab-'));
  for(const name of dataFiles)await copyFile(join(oracle,name),join(run,name));
  await copyFile(new URL('tests/legacy/profile/WORD.MDV',root),join(run,'WORD.MDV'));
  const start=performance.now(),analyzer=await createNodeAnalyzer(),loadMs=performance.now()-start;
  function reference(inputs){
    const t=performance.now();
    const r=spawnSync(join(oracle,'bin/words'),[],{input:inputs.join('\n')+'\n\n\n',cwd:run,env:{PATH:process.env.PATH,WHITAKERS_WORDS_DATADIR:run,LC_ALL:'C'},timeout:120000,maxBuffer:128*1024*1024});
    const stdout=r.stdout??Buffer.alloc(0),stderr=r.stderr??Buffer.alloc(0),frames=stdout.toString('utf8').split(/^=>/m).slice(1,-1);
    return {frames,ok:r.status===0&&!stderr.length&&frames.length===inputs.length,status:r.status,error:r.error?.code,stderr:stderr.toString(),stdout,ms:performance.now()-t};
  }
  parentPort.on('message',async job=>{
    if(job===null){await rm(run,{recursive:true,force:true});parentPort.close();return;}
    try{
      const records=JSON.parse(gunzipSync(await readFile(join(out,'inputs',job+'.json.gz'))));
      const counters={equal:0,different:0,adapterUnsupported:0,oracleFailure:0,portFailure:0};
      const profiles=Object.fromEntries(names.map(p=>[p,{...counters,analyzed:0,partial:0,unknown:0,'unsupported-input':0,empty:0}]));
      const valid=records.filter(([input])=>!adapterLimit(input)),batch=reference(valid.map(([input])=>input));
      let index=0,portMs=0;const differences=[],latencies=[],outcomes=[];
      for(const [input,mask] of records){
        let outcome,expected,actual,status,detail;
        const limit=adapterLimit(input);
        if(limit){outcome='adapterUnsupported';detail=limit;}
        else {
          const oracleResult=batch.ok?{ok:true,frames:[batch.frames[index]]}:reference([input]);index++;
          if(!oracleResult.ok){outcome='oracleFailure';detail={exitCode:oracleResult.status,error:oracleResult.error,stderr:oracleResult.stderr,stdout:oracleResult.stdout.toString()};}
          else {
            expected=comparisonView(oracleResult.frames[0]);const t=performance.now();
            try{const result=analyzer.analyze(input);status=result.status;actual=comparisonView(result.legacyText);outcome=actual===expected?'equal':'different';}
            catch(error){outcome='portFailure';detail=error.stack;}
            const ms=performance.now()-t;portMs+=ms;latencies.push(ms);
          }
        }
        counters[outcome]++;
        for(const [i,name] of names.entries())if(mask&(1<<i)){profiles[name][outcome]++;if(status)profiles[name][status]++;}
        outcomes.push([input,mask,outcome,status??null,sha(expected??''),sha(actual??'')]);
        if(outcome!=='equal')differences.push({input,mask,outcome,expected,actual,detail});
      }
      latencies.sort((a,b)=>a-b);
      const report={batch:job,cases:records.length,counters,profiles,oracleMs:batch.ms,portMs,loadMs,rss:process.memoryUsage().rss,latency:{median:latencies[Math.floor(latencies.length*.5)]??0,p95:latencies[Math.floor(latencies.length*.95)]??0,max:latencies.at(-1)??0},inputSha256:sha(JSON.stringify(records)),oracleStdoutSha256:sha(batch.stdout),oracleBatchHealthy:batch.ok,differences};
      await writeFile(join(out,'results',job+'.outcomes.json.gz'),gzipSync(JSON.stringify(outcomes)));
      await writeFile(join(out,'results',job+'.json.tmp'),JSON.stringify(report));
      await rename(join(out,'results',job+'.json.tmp'),join(out,'results',job+'.json'));
      parentPort.postMessage({batch:job,cases:records.length,counters});
    }catch(error){parentPort.postMessage({error:error.stack});}
  });
  parentPort.postMessage({ready:true});
}
async function main(){
  const args=process.argv.slice(2),get=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
  if(!get('--data')||!get('--oracle')||!get('--out'))throw new Error('Usage: node scripts/acceptance.mjs --data <fixed data directory> --oracle <built reference> --out <private results> [--workers 4] [--limit N]');
  const data=resolve(get('--data')),oracle=resolve(get('--oracle')),out=resolve(get('--out')),workers=Number(get('--workers',4)),limit=Number(get('--limit',0));
  const source=JSON.parse(await readFile(join(data,'manifest.json'))),build=JSON.parse(await readFile(join(oracle,'build-manifest.json')));
  if(sha(await readFile(join(oracle,'bin/words')))!==build.binarySha256)throw new Error('Oracle executable drift');
  for(const name of dataFiles)if(sha(await readFile(join(oracle,name)))!==build.generatedData[name])throw new Error('Oracle data drift: '+name);
  const engineFiles=(await readdir(new URL('dist/',root))).filter(x=>x.endsWith('.js')).sort();
  const engineHash=sha(JSON.stringify(await Promise.all(engineFiles.map(async f=>[f,sha(await readFile(new URL('dist/'+f,root)))]))));
  const identity={corpusManifest:sha(await readFile(join(data,'manifest.json'))),engineHash,adapterHash:sha(await readFile(new URL('browser/input.mjs',root))),scriptHash:sha(await readFile(new URL(import.meta.url))),oracle:build.binarySha256,profile:sha(await readFile(new URL('tests/legacy/profile/WORD.MDV',root))),limit};
  await mkdir(join(out,'inputs'),{recursive:true});await mkdir(join(out,'results'),{recursive:true});
  let manifest;
  try{manifest=JSON.parse(await readFile(join(out,'run.json')));if(JSON.stringify(manifest.identity)!==JSON.stringify(identity))throw new Error('Run identity changed: choose a fresh output directory');}
  catch(error){
    if(error.code!=='ENOENT')throw error;
    const inputs=new Map(),counts={};
    for(const [i,name] of names.slice(0,4).entries()){
      const p=source.profiles[name],gz=await readFile(join(data,p.file));if(sha(gz)!==p.gzip_sha256)throw new Error('Gzip checksum: '+name);
      const bytes=gunzipSync(gz);if(sha(bytes)!==p.sha256)throw new Error('Text checksum: '+name);
      const lines=bytes.toString('utf8').split('\n');if(lines.pop()!==''||lines.length!==p.count)throw new Error('Line accounting: '+name);
      counts[name]=lines.length;
      for(const input of lines)inputs.set(input,(inputs.get(input)??0)|(1<<i));
      console.log('Verified '+name+': '+lines.length);
    }
    const rawUnique=inputs.size;let changed=0;
    for(const input of [...inputs.keys()]){const normalized=prepareLatinInput(input).lookup;if(normalized!==input)changed++;inputs.set(normalized,(inputs.get(normalized)??0)|16);}
    const selected=[...inputs].sort(([a],[b])=>a<b?-1:a>b?1:0);inputs.clear();if(limit)selected.length=Math.min(selected.length,limit);
    const batches=[];
    for(let i=0;i<selected.length;i+=2000){const id=String(batches.length).padStart(5,'0');await writeFile(join(out,'inputs',id+'.json.gz'),gzipSync(JSON.stringify(selected.slice(i,i+2000))));batches.push(id);}
    manifest={identity,created:new Date().toISOString(),counts,rawUnique,macronChanged:changed,distinctQueries:selected.length,batches,runtime:process.version,platform:process.platform,architecture:process.arch,os:release(),cpu:cpus()[0].model,workers,oracleBuild:build};
    await writeFile(join(out,'run.json'),JSON.stringify(manifest,null,2)+'\n');
  }
  const done=new Set((await readdir(join(out,'results'))).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5))),queue=manifest.batches.filter(b=>!done.has(b));
  console.log(JSON.stringify({distinctQueries:manifest.distinctQueries,batches:manifest.batches.length,resuming:done.size,remaining:queue.length}));
  const started=performance.now();let completed=done.size;
  await Promise.all(Array.from({length:Math.min(workers,queue.length)},()=>new Promise((resolve,reject)=>{
    const worker=new Worker(new URL(import.meta.url),{workerData:{oracle,out}});
    worker.on('error',reject);worker.on('exit',code=>code?reject(new Error('Worker exit '+code)):resolve());
    worker.on('message',m=>{if(m.error){reject(new Error(m.error));worker.terminate();return;}if(m.batch){completed++;if(completed%10===0)console.log(JSON.stringify({completed,total:manifest.batches.length,last:m.counters,elapsedSeconds:Math.round((performance.now()-started)/1000)}));}worker.postMessage(queue.shift()??null);});
  })));
  const summary={...manifest,completed:new Date().toISOString(),sessionSeconds:(performance.now()-started)/1000,counters:{},profiles:{},oracleMs:0,portMs:0,maxRss:0,failedBatches:[]};
  for(const b of manifest.batches){const r=JSON.parse(await readFile(join(out,'results',b+'.json')));for(const [k,v] of Object.entries(r.counters))summary.counters[k]=(summary.counters[k]??0)+v;for(const [p,values] of Object.entries(r.profiles)){summary.profiles[p]??={};for(const [k,v]of Object.entries(values))summary.profiles[p][k]=(summary.profiles[p][k]??0)+v;}summary.oracleMs+=r.oracleMs;summary.portMs+=r.portMs;summary.maxRss=Math.max(summary.maxRss,r.rss);if(r.differences.length)summary.failedBatches.push(b);}
  await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({complete:true,counters:summary.counters,seconds:summary.sessionSeconds}));
}
if(!isMainThread)await runWorker();else if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await main();
