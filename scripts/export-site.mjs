import {readFile, writeFile, mkdir, readdir, rm, lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync, deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {validateManifest} from '../browser/offline-core.mjs';
import {documentPages} from './document-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), site = resolve(root, 'site');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json')));
const model = await import('../dist/model.js');
if (pkg.version !== model.VERSION) throw new Error('Package and engine version disagree.');
const files = new Map();
async function add(path) {
  const full = resolve(root, path), info = await lstat(full);
  if (info.isSymbolicLink()) throw new Error('Export refuses symbolic links.');
  if (info.isDirectory()) {
    for (const name of (await readdir(full)).sort()) await add(path + '/' + name);
  } else files.set(path, await readFile(full));
}
for (const file of ['index.html', 'app.mjs', 'input.mjs', 'notation.mjs', 'reading-order.mjs', 'worker.mjs', 'render-reader.mjs', 'offline.mjs', 'offline-core.mjs', 'theme.mjs', 'style.css', 'validation-cases.json', 'icon.svg', 'manifest.webmanifest']) await add('browser/' + file);
await add('browser/resources');
for (const file of (await readdir(resolve(root, 'dist'))).filter(f => f.endsWith('.js')).sort()) await add('dist/' + file);
for (const file of ['legacy/DICTLINE.GEN', 'legacy/INFLECTS.LAT', 'legacy/ADDONS.LAT', 'legacy/UNIQUES.LAT', 'dictionary-forms.tsv', 'english-index.tsv']) await add('data/' + file);
await add('docs');
for (const file of ['licenses/whitaker.txt', 'LICENSE']) await add(file);
for (const [path, bytes] of await documentPages(root, pkg.version)) files.set(path, bytes);

// A small native vector mark, rasterized without an image library or web font.
const polygon = [[100,136],[154,136],[189,326],[239,163],[274,163],[322,326],[359,136],[413,136],[353,376],[301,376],[256,231],[212,376],[159,376]];
function inside(x, y) {
  let yes = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(name, bytes) {
  const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length); crc.writeUInt32BE(crc32(Buffer.concat([type, bytes])));
  return Buffer.concat([length, type, bytes, crc]);
}
function icon(size) {
  const raw = Buffer.alloc(size * (1 + size * 3)), background = [244,245,240], foreground = [102,2,60];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let coverage = 0;
    for (const dx of [.25,.75]) for (const dy of [.25,.75]) coverage += Number(inside((x + dx) * 512 / size, (y + dy) * 512 / size));
    for (let c = 0; c < 3; c++) raw[y * (1 + size * 3) + 1 + x * 3 + c] = Math.round(background[c] + (foreground[c] - background[c]) * coverage / 4);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]);
}
for (const size of [192,512]) files.set(`browser/icon-${size}.png`, icon(size));
const swSource = await readFile(resolve(root, 'browser/sw.mjs'), 'utf8');
const contentIdentity = [...files].sort(([a],[b]) => a.localeCompare(b)).map(([path, bytes]) => [path, hash(bytes)]);
const id = pkg.version + '-' + hash(JSON.stringify({files: contentIdentity, serviceWorker: hash(swSource)})).slice(0,12), base = '/releases/' + id + '/';
const smoke = JSON.parse(await readFile(resolve(root, 'browser/validation-cases.json')))[0];
const manifest = validateManifest({format: 1, id, base, version: pkg.version, engine: model.VERSION, reader: 'student-v1', snapshot: model.SNAPSHOT, data: model.DATA_IDENTITY,
  entry: base + 'browser/index.html', bytes: [...files.values()].reduce((sum, b) => sum + b.length, 0), smoke,
  files: [...files].sort(([a],[b]) => a.localeCompare(b)).map(([path, bytes]) => ({url: base + path, bytes: bytes.length, sha256: hash(bytes)}))});

// This generated directory is the only deployment root, never the repository.
await rm(site, {recursive: true, force: true}); await mkdir(site, {recursive: true});
for (const [path, bytes] of files) {
  const target = resolve(site, base.slice(1), path); await mkdir(dirname(target), {recursive: true}); await writeFile(target, bytes);
}
await writeFile(resolve(site, 'sw.js'), swSource.replace("'./offline-core.mjs'", JSON.stringify(base + 'browser/offline-core.mjs')));
await writeFile(resolve(site, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(resolve(site, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${base}browser/"><title>Whitaker’s Words</title><a href="${base}browser/">Open Whitaker’s Words</a></html>\n`);
await writeFile(resolve(site, '_redirects'), `/ ${base}browser/ 302\n/browser/ ${base}browser/ 302\n`);
await writeFile(resolve(site, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'\n/sw.js\n  Cache-Control: no-cache\n  Service-Worker-Allowed: /\n/release.json\n  Cache-Control: no-cache\n/releases/*\n  Cache-Control: public, max-age=31536000, immutable\n/downloads/*\n  Cache-Control: no-cache\n`);

// Deterministic corresponding-source archive: explicit product allowlist, no Git
// metadata, operator files, local usernames, absolute paths or compiler outputs.
const approvedRoots = new Set(['src','node','cli','browser','data','docs','deviations','licenses','scripts','tests','vendor']);
const approvedFiles = new Set(['README.md','LICENSE','CITATION.cff','package.json','tsconfig.json','wrangler.jsonc','legacy.lock.json','toolchains.lock.json','typescript.lock.json']);
const sourcePaths = [];
async function sourceFiles(path) {
  const info = await lstat(resolve(root, path));
  if (info.isSymbolicLink()) throw new Error('Source archive refuses symbolic links.');
  if (info.isDirectory()) {
    for (const child of (await readdir(resolve(root, path))).filter(name => !name.startsWith('.') && name !== '__pycache__').sort()) await sourceFiles(path + '/' + child);
  } else if (info.isFile()) sourcePaths.push(path);
}
for (const path of [...approvedRoots, ...approvedFiles]) await sourceFiles(path);
sourcePaths.sort();
const tar = [];
for (const path of sourcePaths) {
  if (!(await lstat(resolve(root, path))).isFile()) throw new Error('Source archive requires ordinary files.');
  const data = await readFile(resolve(root, path)), header = Buffer.alloc(512), name = 'whitakers-words-' + pkg.version + '/' + path;
  let tail = name, prefix = '';
  if (Buffer.byteLength(tail) > 100) { const split = name.lastIndexOf('/'); prefix = name.slice(0, split); tail = name.slice(split + 1); }
  if (Buffer.byteLength(tail) > 100 || Buffer.byteLength(prefix) > 155) throw new Error('Source archive path is too long.');
  header.write(tail, 0, 100); header.write('0000644\0', 100); header.write('0000000\0', 108); header.write('0000000\0', 116);
  header.write(data.length.toString(8).padStart(11, '0') + '\0', 124); header.write('00000000000\0', 136);
  header.fill(32, 148, 156); header[156] = 48; header.write('ustar\0', 257); header.write('00', 263); header.write(prefix, 345, 155);
  header.write([...header].reduce((sum, byte) => sum + byte, 0).toString(8).padStart(6, '0') + '\0 ', 148);
  tar.push(header, data, Buffer.alloc((512 - data.length % 512) % 512));
}
tar.push(Buffer.alloc(1024));
const archive = gzipSync(Buffer.concat(tar), {level: 9}), archiveName = `whitakers-words-${pkg.version}-source.tar.gz`;
await mkdir(resolve(site, 'downloads'));
await writeFile(resolve(site, 'downloads', archiveName), archive);
await writeFile(resolve(site, 'downloads/SHA256SUMS.txt'), hash(archive) + '  ' + archiveName + '\n');
console.log(JSON.stringify({id, files: files.size, offlineBytes: manifest.bytes, correspondingSourceBytes: archive.length, sourceSha256: hash(archive)}, null, 2));
