import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {documentPages, renderMarkdown, renderNotice} from '../scripts/document-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

test('hosted notices preserve every word and documentation links resolve within the generated pages', async () => {
  for (const path of ['LICENSE', 'licenses/whitaker.txt']) {
    const source = await readFile(new URL('../' + path, import.meta.url), 'utf8');
    assert.equal(plain(renderNotice(source)), source.replace(/\s+/g, ' ').trim());
  }
  const pages = await documentPages(root, '0.2.1-alpha.1');
  for (const [path, bytes] of pages) {
    const html = bytes.toString();
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(match[1], 'https://example.test/' + path);
      if (url.origin !== 'https://example.test' || !url.pathname.startsWith('/docs/')) continue;
      assert.ok(pages.has(url.pathname.slice(1)), `${path}: unresolved ${match[1]}`);
    }
  }
});

test('documentation rendering keeps code literal and escapes content and unsafe link schemes', () => {
  const html = renderMarkdown('# Example\n\nText with `x < y` and **emphasis**.\n\n| Name | Meaning |\n|---|---|\n| rem | thing |\n\n```js\n<script>literal</script>\n```\n\n<script>not markup</script>');
  assert.match(html, /<code>x &lt; y<\/code>/);
  assert.match(html, /<th scope="col">Name<\/th>/);
  assert.match(html, /<strong>emphasis<\/strong>/);
  assert.equal(html.includes('<script>'), false);
  assert.throws(() => renderMarkdown('[invalid](javascript:alert)'), /Unsupported document link/);
});
