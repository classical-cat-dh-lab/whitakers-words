import {readFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const escape = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const metadataPages = new Map([
  ['backend-baseline.json', 'backend-baseline-data.html'],
  ['legacy-checkpoint.json', 'legacy-checkpoint-data.html'],
  ['legacy-release.json', 'legacy-release-data.html'],
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
  <script src="../browser/theme-init.js"></script>
  <title>${escape(title)} · Whitaker’s Words</title>
  <link rel="icon" href="../browser/icon.svg">
  <link rel="stylesheet" href="../browser/resources/design-system/2.3.0/dist/tokens.css">
  <link rel="stylesheet" href="../browser/resources/design-system/2.3.0/dist/fonts.css">
  <link rel="stylesheet" href="../browser/style.css">
  <link rel="stylesheet" href="../browser/night-theme.css">
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
  const pages = new Map(), history = [];
  for (const name of (await readdir(resolve(root, 'docs'))).filter(name => name.endsWith('.md')).sort()) {
    const source = await readFile(resolve(root, 'docs', name), 'utf8');
    const title = /^# (.+)$/m.exec(source)?.[1];
    if (!title) throw new Error('Document needs a title: ' + name);
    const target = name.replace(/\.md$/, '.html');
    const historical = /^(?:baseline\.|backend-baseline\.|legacy-checkpoint\.)/.test(name) || name.startsWith('release-') && name !== `release-${version}.md` && name !== 'release-1.0.md';
    const notice = historical ? `<p><strong>Historical reference.</strong> This page describes an earlier checkpoint. See <a href="release-${escape(version)}.html">the current application release</a> and <a href="compatibility.html">current engine qualification</a>.</p>` : '';
    pages.set('docs/' + target, Buffer.from(page(title, notice + renderMarkdown(source))));
    if (historical) history.push(`<li><a href="${target}">${escape(title)}</a></li>`);
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
  const notices = [];
  for (const [file, title] of [['licenses/typescript.txt', 'TypeScript license'], ['licenses/typescript-third-party.txt', 'TypeScript third-party notices']]) {
    notices.push(`<h2>${title}</h2>${renderNotice(await readFile(resolve(root, file), 'utf8'))}`);
  }
  const fontRoot = 'browser/resources/design-system/2.3.0/fonts/licenses';
  for (const file of (await readdir(resolve(root, fontRoot))).sort()) {
    const title = escape(file.replace(/^OFL-|\.(txt|pdf)$/g, ''));
    if (file.endsWith('.txt')) notices.push(`<h2>${title}</h2>${renderNotice(await readFile(resolve(root, fontRoot, file), 'utf8'))}`);
    else notices.push(`<h2>${title}</h2><p><a href="../${fontRoot}/${escape(file)}" download>Original license (PDF)</a></p>`);
  }
  pages.set('docs/third-party.html', Buffer.from(page('Third-party licenses', '<h1>Third-party licenses</h1>' + notices.join('\n'))));
  pages.set('docs/source.html', Buffer.from(page('Source and documentation', `<h1>Source and documentation</h1>
<p>Application <strong>${escape(version)}</strong> uses frozen <strong>engine 1.0.0</strong>, preserving upstream WORDS <strong>1.99.0</strong>. These version numbers identify different components. Analysis runs on your device.</p>
<h2>Using the dictionary</h2><ul><li><a href="browser-input.html">Browser guide</a></li><li><a href="offline-help.html">Offline help and installation</a></li><li><a href="abbreviations.html">Abbreviations and terminology</a></li></ul>
<h2>Release and source</h2>
<p><a href="release-${escape(version)}.html">What changed in ${escape(version)}</a> · <a href="release-1.0.html">The 1.0 engine milestone</a> · <a href="citation.html">Citation metadata</a></p>
<p><a href="/downloads/whitakers-words-${escape(version)}-source.tar.gz" download>Download the complete source archive (${escape(version)})</a></p>
<p>The archive includes implementation, dictionary data, build tools, tests and documentation. <a href="https://github.com/classical-cat-dh-lab/whitakers-words/releases/tag/v${escape(version)}">GitHub release ${escape(version)}</a> provides the source and ready-to-host website. Downloads require a connection.</p>
<h2>Engineering</h2><ul><li><a href="api.html">API and CLI</a></li><li><a href="building.html">Build and data reproduction</a></li><li><a href="architecture.html">Architecture</a></li><li><a href="compatibility.html">Compatibility and tested scope</a></li><li><a href="legacy-release-data.html">Frozen engine manifest</a></li></ul>
<h2>Attribution and licenses</h2>
<p>William Whitaker created WORDS and its dictionary. The preserved source, data and adapted algorithms retain <a href="original-notice.html">Whitaker’s original notice</a>.</p>
<p>This project’s TypeScript implementation and tooling are © 2026 Xinjie Fang / Classical Cat Digital Humanities Lab, under <a href="license.html">AGPL-3.0-only</a>. Original project documentation is <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>. <a href="third-party.html">TypeScript and font licenses</a> retain their separate terms.</p>
<details><summary>Historical releases and reference records</summary><p>These pages describe their named checkpoints; their earlier limitations and test counts are historical.</p><ul>${history.join('')}</ul></details>`)));
  return pages;
}
