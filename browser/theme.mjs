// Shared by the dictionary and static documents; preferences stay on this device.
const toggle = document.querySelector('#theme-toggle');
const status = document.querySelector('#theme-status');
let changed = false;

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="color-scheme"]').content = theme;
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--ds-color-surface-base').trim();
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  toggle.title = theme === 'dark' ? 'Turn night mode off' : 'Turn night mode on';
}

const database = new Promise((resolve, reject) => {
  const request = indexedDB.open('words-preferences', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('settings');
  request.onsuccess = () => {
    const db = request.result;
    db.onversionchange = () => db.close();
    resolve(db);
  };
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error('Preference storage is blocked.'));
});

async function preference(write) {
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', write ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('settings');
    const request = write ? store.put(write, 'theme') : store.get('theme');
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = transaction.onerror = () => reject(transaction.error);
  });
}

function unavailable() {
  status.hidden = false;
  status.textContent = 'Your browser could not save this preference. Night mode still works on this page.';
}

apply('light');
preference().then(theme => {
  if (!changed && theme === 'dark') apply('dark');
}).catch(unavailable);

toggle.addEventListener('click', () => {
  changed = true;
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  apply(theme);
  preference(theme).then(() => { status.hidden = true; }).catch(unavailable);
});

// Returning from a document restores the latest choice, including with bfcache.
window.addEventListener('pageshow', event => {
  if (event.persisted) preference().then(theme => apply(theme === 'dark' ? 'dark' : 'light')).catch(unavailable);
});
