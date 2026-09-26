import {readFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const escape = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const metadataPages = new Map([
  ['backend-baseline.json', 'backend-baseline-data.html'],
  ['../CITATION.cff', 'citation.html'],
  ['../legacy.lock.json', 'legacy-lock.html'],
  ['../toolchains.lock.json', 'toolchains-lock.html'],
  ['../tests/legacy/manifest.json', 'baseline-manifest.html'],
]);

function linkTarget(target) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target) && !/^https?:\/\//i.test(target)) throw new Error('Unsupported document link: ' + target);
  const [path, fragment] = target.split('#');
  return (path === '../deviations/README.md' ? 'corrected-layers.html' : metadataPages.get(path) ?? path.replace(/\.md$/, '.html')) + (fragment === undefined ? '' : '#' + fragment);
}

function inline(text) {
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let result = '', end = 0;
  for (const match of text.matchAll(pattern)) {
    result += escape(text.slice(end, match.index));
    if (match[1]) result += `<code>${escape(match[1])}</code>`;
    else if (match[2]) result += `<a href="${escape(linkTarget(match[3]))}">${inline(match[2])}</a>`;
    else result += match[4] ? `<strong>${inline(match[4])}</strong>` : `<em>${inline(match[5])}</em>`;
    end = match.index + match[0].length;
  }
  return result + escape(text.slice(end));
}

// Build-time renderer for the headings, paragraphs, lists, tables and code blocks
// used by the repository's own documentation. Raw HTML is always escaped.
export function renderMarkdown(source) {
  const lines = source.replace(/\r/g, '').split('\n'), output = [], ids = new Map();
  const cells = row => row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
  const startsBlock = line => /^(?:#{1,6} |```|[-*] |\d+\. |> |\|)/.test(line);
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const body = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      if (i === lines.length) throw new Error('Unclosed documentation code block.');
      output.push(`<pre tabindex="0"><code>${escape(body.join('\n'))}</code></pre>`); i++; continue;
    }
    const heading = /^(#{1,6}) (.+)$/.exec(line);
    if (heading) {
      const base = heading[2].toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
      const count = ids.get(base) ?? 0; ids.set(base, count + 1);
      output.push(`<h${heading[1].length} id="${base}${count ? '-' + count : ''}">${inline(heading[2])}</h${heading[1].length}>`); i++; continue;
    }
    if (line.startsWith('|') && /^\|[ :|-]+\|$/.test(lines[i + 1] ?? '')) {
      const headers = cells(line); i += 2; const rows = [];
      while (lines[i]?.startsWith('|')) {
        const row = cells(lines[i++]);
        if (row.length !== headers.length) throw new Error('Documentation table has inconsistent columns.');
        rows.push('<tr>' + row.map(cell => `<td>${inline(cell)}</td>`).join('') + '</tr>');
      }
      output.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="Documentation table"><table><thead><tr>${headers.map(cell => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`); continue;
    }
    if (/^(?:[-*] |\d+\. )/.test(line)) {
      const ordered = /^\d/.test(line), marker = ordered ? /^\d+\. / : /^[-*] /, items = [];
      while (marker.test(lines[i] ?? '')) {
        const item = [lines[i++].replace(marker, '')];
        while (lines[i]?.trim() && !startsBlock(lines[i])) item.push(lines[i++].trim());
        items.push(`<li>${inline(item.join(' '))}</li>`);
      }
      const tag = ordered ? 'ol' : 'ul';
      output.push(`<${tag}>${items.join('')}</${tag}>`); continue;
    }
    if (line.startsWith('> ')) {
      const body = [];
      while (lines[i]?.startsWith('> ')) body.push(lines[i++].slice(2));
      output.push(`<blockquote>${renderMarkdown(body.join('\n'))}</blockquote>`); continue;
    }
    const paragraph = [lines[i++].trim()];
    while (lines[i]?.trim() && !startsBlock(lines[i])) paragraph.push(lines[i++].trim());
    output.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return output.join('\n');
}

// Reflow notices without editing their wording; raw originals remain in the bundle.
export function renderNotice(source) {
  return source.replace(/\r/g, '').split(/\n\s*\n/).filter(part => part.trim()).map(part => {
    const text = part.trim().replace(/\s+/g, ' ');
    const section = /^(\d+\. [^\n]+\.)\n([\s\S]+)$/.exec(part.trim());
    if (section) return `<h2>${escape(section[1])}</h2><p>${escape(section[2].replace(/\s+/g, ' '))}</p>`;
    const heading = /^(?:\d+\. [^\n]+\.|Preamble|TERMS AND CONDITIONS|END OF TERMS AND CONDITIONS|How to Apply These Terms to Your New Programs)$/.test(text);
    return `<${heading ? 'h2' : 'p'}>${escape(text)}</${heading ? 'h2' : 'p'}>`;
  }).join('\n');
}

function page(title, body) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#F4F5F0">
  <title>${escape(title)} · Whitaker’s Words</title>
  <link rel="icon" href="../browser/icon.svg">
  <link rel="stylesheet" href="../browser/resources/design-system/2.3.0/dist/tokens.css">
  <link rel="stylesheet" href="../browser/resources/design-system/2.3.0/dist/fonts.css">
  <link rel="stylesheet" href="../browser/style.css">
  <script type="module" src="../browser/theme.mjs"></script>
</head>
<body><main class="document-page">
  <header>
    <nav class="header-row" aria-label="Document navigation"><a href="../browser/">← Whitaker’s Words</a><div class="header-tools"><button type="button" id="theme-toggle" aria-pressed="false">Night mode</button></div></nav>
    <p id="theme-status" class="preference-status" role="status" hidden></p>
  </header>
  <article>${body}</article>
  <footer><a href="../browser/">Back to dictionary</a> · <a href="compatibility.html">Compatibility</a> · <a href="source.html">Source and documentation</a></footer>
</main></body></html>\n`;
}

export async function documentPages(root, version) {
  const pages = new Map(), documents = [];
  for (const name of (await readdir(resolve(root, 'docs'))).filter(name => name.endsWith('.md')).sort()) {
    const source = await readFile(resolve(root, 'docs', name), 'utf8');
    const title = /^# (.+)$/m.exec(source)?.[1];
    if (!title) throw new Error('Document needs a title: ' + name);
    const target = name.replace(/\.md$/, '.html');
    pages.set('docs/' + target, Buffer.from(page(title, renderMarkdown(source))));
    documents.push(`<li><a href="${target}">${escape(title)}</a></li>`);
  }
  for (const [file, target] of metadataPages) {
    const source = await readFile(resolve(root, 'docs', file), 'utf8');
    const title = file.split('/').at(-1);
    pages.set('docs/' + target, Buffer.from(page(title, `<h1>${escape(title)}</h1><pre tabindex="0"><code>${escape(source)}</code></pre>`)));
  }
  pages.set('docs/corrected-layers.html', Buffer.from(page('Corrected layers', renderMarkdown(await readFile(resolve(root, 'deviations/README.md'), 'utf8')))));
  for (const [file, target, title] of [['licenses/whitaker.txt', 'original-notice', 'Original WORDS notice'], ['LICENSE', 'license', 'GNU Affero General Public License']]) {
    pages.set(`docs/${target}.html`, Buffer.from(page(title, `<h1>${title}</h1>${renderNotice(await readFile(resolve(root, file), 'utf8'))}`)));
  }
  pages.set('docs/source.html', Buffer.from(page('Source and documentation', `<h1>Source and documentation</h1>
<p>Whitaker’s Words ${escape(version)} is an independent TypeScript preservation of William Whitaker’s WORDS. Analysis runs on your device.</p>
<p><a href="/downloads/whitakers-words-${escape(version)}-source.tar.gz" download>Download the complete source archive (${escape(version)})</a></p>
<p>The archive includes the implementation, dictionary data, build tools, tests and documentation for this version. See <a href="building.html">Building and reproducing the baseline</a> for instructions.</p>
<p>Original implementation and tooling are provided under <a href="license.html">AGPL-3.0-only</a>; preserved WORDS material retains its <a href="original-notice.html">original notice</a>.</p>
<h2>Documentation</h2><ul>${documents.join('')}</ul>`)));
  return pages;
}
