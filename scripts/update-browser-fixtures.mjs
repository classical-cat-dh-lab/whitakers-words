import {createNodeAnalyzer} from '../node/index.mjs';
import {applyCorrectedLayer} from '../dist/index.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(!process.argv.includes('--write'))throw new Error('Explicit --write is required to update browser parity hashes. Run the Ada compatibility tests first.');
const path=new URL('../browser/validation-cases.json',import.meta.url),cases=JSON.parse(await readFile(path,'utf8')),analyzer=await createNodeAnalyzer();
for(const c of cases){let r=c.mode==='english'?analyzer.lookupEnglish(c.input):analyzer.analyze(c.input);if(c.mode==='corrected')r=applyCorrectedLayer(r);c.sha256=createHash('sha256').update(JSON.stringify(r)).digest('hex');}
await writeFile(path,JSON.stringify(cases,null,2)+'\n');
