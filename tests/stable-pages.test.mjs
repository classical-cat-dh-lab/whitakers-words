import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {documentPages} from '../scripts/document-pages.mjs';
import {publishPage, publicPath} from '../scripts/stable-pages.mjs';
import {canonicalPath, validateManifest, digest} from '../browser/offline-core.mjs';

const base = '/releases/0.3.1-beta.1-0123456789ab/';
test('stable pages retain release-pinned resources at root and document URLs', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const pages = await documentPages(root, '0.3.1-beta.1');
  pages.set('browser/index.html', await readFile(root + '/browser/index.html'));
  for (const [path, bytes] of pages) {
    const html = publishPage(bytes.toString(), path, base), canonical = publicPath(path);
    assert.ok(html.includes(`rel="canonical" href="https://words.latingreek.org${canonical}"`));
    assert.ok(html.includes(`name="words-release" content="0.3.1-beta.1-0123456789ab"`));
    for (const [, attribute, target] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
      assert.ok(/^(?:\/|#|https?:)/.test(target), path + ': document-relative resource ' + target);
      if (attribute === 'src') assert.ok(target.startsWith(base), path + ': unpinned script');
    }
    for (const [, target] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) assert.ok(!target.startsWith('/releases/'), path + ': internal bundle in a navigation link');
  }
});

test('legacy page URLs converge on canonical routes without treating assets as pages', () => {
  for (const path of ['/', '/index.html', '/browser', '/browser/', base + 'browser/', base + 'browser/index.html']) assert.equal(canonicalPath(path), '/');
  for (const path of ['/docs/release-0.3.1', '/docs/release-0.3.1.html', '/docs/release-0.3.1/', base + 'docs/release-0.3.1.html']) assert.equal(canonicalPath(path), '/docs/release-0.3.1/');
  for (const path of [base + 'browser/worker.mjs', base + 'data/legacy/DICTLINE.GEN', base + 'docs/backend-baseline.json', base + 'docs/browser-input.md', '/downloads/source.tar.gz']) assert.equal(canonicalPath(path), path);
});

test('route extensions remain compatible with old manifests and reject cross-release aliases', async () => {
  const paths = ['browser/index.html', 'browser/worker.mjs', 'docs/license.html'];
  const sha256 = await digest(new TextEncoder().encode('ok'));
  const manifest = {format: 1, id: base.split('/')[2], base, entry: base + paths[0], bytes: 6, smoke: {input: 'rem', sha256}, files: paths.map(path => ({url: base + path, bytes: 2, sha256}))};
  assert.equal(validateManifest(manifest), manifest);
  const routes = {'/': manifest.entry, '/docs/license/': base + paths[2]};
  assert.ok(validateManifest({...manifest, routes}));
  for (const bad of [{...routes, '/': '/other/index.html'}, {...routes, '/docs/license/': base + 'docs/missing.html'}, {...routes, '/docs/../': base + paths[2]}, {...routes, '/sw.js': base + paths[1]}]) assert.throws(() => validateManifest({...manifest, routes: bad}));
});
