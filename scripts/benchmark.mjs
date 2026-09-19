import {createNodeAnalyzer} from '../node/index.mjs';
import {cpus,release} from 'node:os';
import {readFile,writeFile} from 'node:fs/promises';
const started=performance.now(),analyzer=await createNodeAnalyzer(),loaded=performance.now();
const samples=[];const inputs=['arma','amasti','quidam','amatus est','xyzzy','amāre','respublica','praestantissimus'];
for(let i=0;i<800;i++){const t=performance.now();analyzer.analyze(inputs[i%inputs.length]);samples.push(performance.now()-t);}
samples.sort((a,b)=>a-b);
const aeneid=await readFile(new URL('../tests/legacy/cases/10_aeneid/input.txt',import.meta.url),'utf8'),t=performance.now(),result=analyzer.analyze(aeneid),batch=performance.now()-t;
const report={schemaVersion:1,snapshot:'words-mk270-1f2f0fb',runtime:process.version,platform:process.platform,architecture:process.arch,osRelease:release(),cpu:cpus()[0].model,loadMilliseconds:loaded-started,mixedInputSamples:samples.length,medianMilliseconds:samples[400],p95Milliseconds:samples[760],aeneid:{inputBytes:Buffer.byteLength(aeneid),tokens:result.tokens.length,milliseconds:batch},memoryBytes:process.memoryUsage(),limitations:'One local process; warm filesystem; 800 mixed requests include phrases and unknowns. Memory sampled with the full Aeneid result retained. Not a cross-device browser benchmark.'};
if(process.argv.includes('--write'))await writeFile(new URL('../docs/performance.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
