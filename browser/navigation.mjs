// Legacy workers may still redirect to a bundle entry during their first upgrade.
// Generated HTML already pins every resource, so changing its public URL is safe.
const path = document.querySelector('meta[name="words-page"]')?.content;
if (path && location.pathname !== path) history.replaceState(null, '', path + location.search + location.hash);

// Stable URLs alone cannot identify the release used by an older open tab.
// Unknown/nonresponsive clients make cache cleanup defer conservatively.
navigator.serviceWorker?.addEventListener('message', event => {
  if (event.data?.action !== 'words-release-query' || !event.ports[0]) return;
  event.ports[0].postMessage({
    release: document.querySelector('meta[name="words-release"]')?.content,
    busy: document.querySelector('#offline-save')?.disabled === true
  });
});
