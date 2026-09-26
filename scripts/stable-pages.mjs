// Published HTML has stable navigation and explicit, release-pinned resources.
export const ORIGIN = 'https://words.latingreek.org';
export function publicPath(path) {
  if (path === 'browser/index.html' || path === 'browser/') return '/';
  const doc = /^docs\/([a-z0-9.-]+)\.html$/.exec(path);
  return doc ? '/docs/' + doc[1] + '/' : null;
}
export function publishPage(source, path, base) {
  const canonical = publicPath(path);
  if (!canonical) throw new Error('Unknown public page: ' + path);
  const location = ORIGIN + base + path;
  const html = source.replace(/\b(href|src)="([^"]+)"/g, (attribute, name, value) => {
    if (value.startsWith('#') || /^(?:https?:|data:|mailto:)/.test(value)) return attribute;
    const url = new URL(value, location);
    let target = url.pathname;
    if (target.startsWith(base)) target = publicPath(target.slice(base.length)) ?? target;
    if (target === base + 'browser/manifest.webmanifest') target = '/manifest.webmanifest';
    return `${name}="${target}${url.search}${url.hash}"`;
  });
  return html.replace('</head>', `  <meta name="words-release" content="${base.split('/')[2]}">\n  <meta name="words-page" content="${canonical}">\n  <link rel="canonical" href="${ORIGIN}${canonical}">\n  <script type="module" src="${base}browser/navigation.mjs"></script>\n</head>`);
}
