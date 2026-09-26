// Legacy workers may still redirect to a bundle entry during their first upgrade.
// Generated HTML already pins every resource, so changing its public URL is safe.
const path = document.querySelector('meta[name="words-page"]')?.content;
if (path && location.pathname !== path) history.replaceState(null, '', path + location.search + location.hash);
