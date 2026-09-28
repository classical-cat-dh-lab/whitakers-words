// Check the declared release baseline without altering it.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const originalBytes=await readFile(new URL('docs/backend-baseline.json',root));
const original=JSON.parse(originalBytes);
const checkpointBytes=await readFile(new URL('docs/legacy-checkpoint.json',root));
const checkpoint=JSON.parse(checkpointBytes);
const baseline=JSON.parse(await readFile(new URL('docs/legacy-release.json',root)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(sha(originalBytes)!==checkpoint.predecessor.sha256)throw new Error('Historical baseline manifest changed');
if(sha(checkpointBytes)!==baseline.predecessor.sha256)throw new Error('Final qualification checkpoint changed');
if(JSON.stringify(Object.keys(baseline.files).sort())!==JSON.stringify(Object.keys(original.files).sort()))throw new Error('Frozen backend coverage changed');
const changed=Object.keys(original.files).filter(path=>original.files[path]!==checkpoint.files[path]).sort();
if(JSON.stringify(changed)!==JSON.stringify(checkpoint.changedPaths.slice().sort()))throw new Error('Undeclared change from historical baseline');
const finalized=Object.keys(baseline.files).filter(path=>checkpoint.files[path]!==baseline.files[path]);
if(JSON.stringify(finalized)!==JSON.stringify(['src/model.ts']))throw new Error('Release finalization changed more than the engine version');
const model=await readFile(new URL('src/model.ts',root),'utf8');
if(sha(model.replace("export const VERSION = '1.0.0' as const;", "export const VERSION = '1.0.0-rc.1' as const;"))!==checkpoint.files['src/model.ts'])throw new Error('Engine finalization is not version-only');
for(const [path,expected] of Object.entries(baseline.files)){
  const actual=sha(await readFile(new URL(path,root)));
  if(actual!==expected)throw new Error('Frozen backend baseline changed: '+path);
}
console.log('Verified frozen backend baseline: '+baseline.id);
