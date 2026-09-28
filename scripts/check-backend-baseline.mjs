// Check the declared release baseline without altering it.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const originalBytes=await readFile(new URL('docs/backend-baseline.json',root));
const original=JSON.parse(originalBytes);
const baseline=JSON.parse(await readFile(new URL('docs/legacy-checkpoint.json',root)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(sha(originalBytes)!==baseline.predecessor.sha256)throw new Error('Historical baseline manifest changed');
if(JSON.stringify(Object.keys(baseline.files).sort())!==JSON.stringify(Object.keys(original.files).sort()))throw new Error('Frozen backend coverage changed');
const changed=Object.keys(original.files).filter(path=>original.files[path]!==baseline.files[path]).sort();
if(JSON.stringify(changed)!==JSON.stringify(baseline.changedPaths.slice().sort()))throw new Error('Undeclared change from historical baseline');
for(const [path,expected] of Object.entries(baseline.files)){
  const actual=sha(await readFile(new URL(path,root)));
  if(actual!==expected)throw new Error('Frozen backend baseline changed: '+path);
}
console.log('Verified frozen backend baseline: '+baseline.id);
