// Start the single IndexedDB preference read before deferred modules or content.
// A failed/blocked store must never leave the page hidden indefinitely.
(() => {
  const root = document.documentElement;
  root.dataset.themePending = '';
  window.wordsThemeReady = new Promise(resolve => {
    let done = false;
    const finish = (theme, unavailable = false) => {
      if (done) return;
      done = true; clearTimeout(timer);
      root.dataset.theme = theme === 'dark' ? 'dark' : 'light';
      document.querySelector('meta[name="color-scheme"]').content = root.dataset.theme;
      delete root.dataset.themePending;
      resolve({theme: root.dataset.theme, unavailable});
    };
    const timer = setTimeout(() => finish('light', true), 1500);
    try {
      const request = indexedDB.open('words-preferences', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('settings');
      request.onerror = request.onblocked = () => finish('light', true);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const transaction = db.transaction('settings'), value = transaction.objectStore('settings').get('theme');
          transaction.oncomplete = () => { db.close(); finish(value.result); };
          transaction.onabort = transaction.onerror = () => { db.close(); finish('light', true); };
        } catch { db.close(); finish('light', true); }
      };
    } catch { finish('light', true); }
  });
})();
