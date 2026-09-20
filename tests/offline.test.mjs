import test from 'node:test';
import assert from 'node:assert/strict';
import {digest, validateManifest, verifyResponse} from '../browser/offline-core.mjs';

const base = '/releases/0.1.0-alpha.1-0123456789ab/';
const file = {url: base + 'browser/index.html', bytes: 2, sha256: await digest(new TextEncoder().encode('ok'))};
const worker = {...file, url: base + 'browser/worker.mjs'};
const manifest = {format: 1, id: '0.1.0-alpha.1-0123456789ab', base, entry: file.url, bytes: 4, files: [file, worker], smoke: {input: 'rem', sha256: file.sha256}};

test('offline downloads reject corruption, failed HTTP and incomplete responses', async () => {
  assert.equal((await verifyResponse(new Response('ok'), file)).status, 200);
  await assert.rejects(verifyResponse(new Response('no'), file), /integrity/);
  await assert.rejects(verifyResponse(new Response('o'), file), /integrity/);
  await assert.rejects(verifyResponse(new Response('ok', {status: 503}), file), /unavailable/);
  await assert.rejects(verifyResponse(undefined, file), /unavailable/);
});

test('offline manifests cannot escape their release or declare a partial bundle complete', () => {
  assert.equal(validateManifest(manifest), manifest);
  for (const url of ['https://example.org/engine.js', base + '../engine.js', base + '%2e%2e/engine.js', base + 'engine.js?other=1']) {
    assert.throws(() => validateManifest({...manifest, files: [{...file, url}, worker]}));
  }
  assert.throws(() => validateManifest({...manifest, files: [file, file]}));
  assert.throws(() => validateManifest({...manifest, files: [file]}));
  assert.throws(() => validateManifest({...manifest, bytes: 5}));
  assert.throws(() => validateManifest({...manifest, entry: base + 'absent.html'}));
});
