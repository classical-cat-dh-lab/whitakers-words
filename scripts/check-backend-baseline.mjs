// Check the declared release baseline without altering it.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const baseline=JSON.parse(await readFile(new URL('docs/backend-baseline.json',root)));
for(const [path,expected] of Object.entries(baseline.files)){
  const actual=createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');
  if(actual!==expected)throw new Error('Frozen backend baseline changed: '+path);
}
console.log('Verified frozen backend baseline: '+baseline.id);
