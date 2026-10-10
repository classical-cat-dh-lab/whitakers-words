import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {digest, validateManifest} from '../browser/offline-core.mjs';

// Run the actual UI controller with a finite Service Worker status fixture.
const source = (await readFile(new URL('../browser/offline.mjs', import.meta.url), 'utf8'))
  .replace(/^import .* from '\.\/offline-core\.mjs';\n/, '');
function release(version) {
  const id = version + '-0123456789ab', base = '/releases/' + id + '/';
  return {format: 1, id, base, version, engine: '1.0.0', entry: base + 'browser/index.html', bytes: 2,
    files: ['index.html', 'worker.mjs'].map(name => ({url: base + 'browser/' + name, bytes: 1, sha256: '0'.repeat(64)})),
    smoke: {input: 'rem', sha256: '0'.repeat(64)}};
}
async function ui({active, pending = null, latest = active, running = active, ready = true}) {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {hidden: false, disabled: true, textContent: '',
      content: running.id, classList: {add() {}, remove() {}, toggle() {}},
      listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; }});
    return elements.get(selector);
  };
  const worker = {postMessage({action}, [port]) {
    const result = action === 'status' ? {ready, active, pending} : {};
    queueMicrotask(() => port.reply({data: {done: true, result}}));
  }};
  class MessageChannel {
    constructor() { this.port1 = {close() {}}; this.port2 = {reply: data => this.port1.onmessage(data)}; }
  }
  const registration = {active: worker, update: async () => {}};
  await runInNewContext(source, {
    digest, validateManifest, MessageChannel, AbortController, setTimeout, clearTimeout,
    isSecureContext: true, document: {querySelector: element}, window: {addEventListener() {}},
    navigator: {serviceWorker: {controller: worker, register: async () => registration,
      ready: Promise.resolve(registration), addEventListener() {}}},
    fetch: async () => ({ok: true, json: async () => latest})
  });
  return element;
}

test('available update names the target application and identifies the saved version', async () => {
  const el = await ui({active: release('1.0.0'), latest: release('1.0.2')});
  assert.match(el('#offline-status').textContent, /^Version 1\.0\.2 is available\./);
  assert.match(el('#offline-status').textContent, /Saved version: 1\.0\.0\./);
  assert.equal(el('#offline-save').textContent, 'Download update');
  assert.equal(el('#offline-reload').hidden, true);
});

test('verified update and reload button name the pending version, not a newer unsaved manifest', async () => {
  const el = await ui({active: release('1.0.0'), pending: release('1.0.2'), latest: release('1.0.3')});
  assert.match(el('#offline-status').textContent, /^Version 1\.0\.2 is verified and ready\./);
  assert.match(el('#offline-status').textContent, /Saved version: 1\.0\.0\./);
  assert.equal(el('#offline-reload').textContent, 'Reload to use 1.0.2');
  assert.equal(el('#offline-reload').hidden, false);
  assert.equal(el('#offline-save').hidden, true);
});

test('an older tab offers the already activated application version, not the engine version', async () => {
  const el = await ui({active: release('1.0.2'), running: release('1.0.1')});
  assert.match(el('#offline-status').textContent, /^Version 1\.0\.2 is verified and ready\./);
  assert.equal(el('#offline-reload').textContent, 'Reload to use 1.0.2');
});

test('current and incomplete saved copies retain their own status and actions', async () => {
  const el = await ui({active: release('1.0.2')});
  assert.match(el('#offline-status').textContent, /^Ready offline · 1\.0\.2\./);
  assert.equal(el('#offline-reload').hidden, true);
  assert.equal(el('#offline-save').textContent, 'Check for updates');
  await el('#offline-save').listeners.click();
  assert.match(el('#offline-status').textContent, /^Up to date · 1\.0\.2\./);
  const incomplete = await ui({active: release('1.0.1'), latest: release('1.0.2'), ready: false});
  assert.match(incomplete('#offline-status').textContent, /^Saved files are incomplete\./);
  assert.equal(incomplete('#offline-reload').hidden, true);
  assert.equal(incomplete('#offline-save').textContent, 'Save offline');
});
