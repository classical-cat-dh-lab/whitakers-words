import {readFileSync, existsSync, mkdirSync, copyFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = b => createHash('sha256').update(b).digest('hex');
const compiler = JSON.parse(readFileSync(resolve(root, 'typescript.lock.json'), 'utf8'));
const archive = resolve(root, 'vendor/typescript/typescript-6.0.3.tgz');
if (hash(readFileSync(archive)) !== compiler.sha256) throw new Error('TypeScript archive checksum mismatch');
const directory = resolve(root, '.tools/typescript');
mkdirSync(directory, {recursive: true});
execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', directory]);
const legacy = JSON.parse(readFileSync(resolve(root, 'legacy.lock.json'), 'utf8'));
const derived = JSON.parse(readFileSync(resolve(root,'data/derived.lock.json'),'utf8'));
for(const [file, expected] of Object.entries(derived.tables))if(hash(readFileSync(resolve(root,'data',file)))!==expected.sha256)throw new Error(`Derived data changed: ${file}`);
const design=JSON.parse(readFileSync(resolve(root,'browser/design-system.lock.json'),'utf8'));
for(const [file, expected] of Object.entries(design.files))if(hash(readFileSync(resolve(root,'browser',design.path,file)))!==expected)throw new Error(`Design resource changed: ${file}`);
for (const [file, expected] of Object.entries(legacy.data)) {
  if (file === 'LICENCE.txt') continue;
  if (hash(readFileSync(resolve(root, 'data/legacy', file))) !== expected.sha256) throw new Error(`Legacy data changed: ${file}`);
}
execFileSync(process.execPath, [resolve(directory, 'lib/tsc.js'), '-p', resolve(root, 'tsconfig.json')], {stdio: 'inherit'});
console.log('PASS: pinned data verified; TypeScript compiled to JavaScript ESM');
