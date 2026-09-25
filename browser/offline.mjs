import {digest, validateManifest} from './offline-core.mjs';

const panel = document.querySelector('#offline'), message = document.querySelector('#offline-status');
const saveButton = document.querySelector('#offline-save'), cancelButton = document.querySelector('#offline-cancel');
const reloadButton = document.querySelector('#offline-reload'), progress = document.querySelector('#offline-progress');
let worker, manifest, installPrompt, persistence = '', update;
const megabytes = bytes => (bytes / 1024 / 1024).toFixed(1) + ' MB';

function call(action, extra = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('The offline operation was interrupted. Please retry.')); }, 180000);
    channel.port1.onmessage = ({data}) => {
      if (data.progress) onProgress?.(data.progress);
      if (data.done) {
        clearTimeout(timer); channel.port1.close();
        if (data.error) reject(new Error(data.error)); else resolve(data.result);
      }
    };
    worker.postMessage({action, ...extra}, [channel.port2]);
  });
}

async function sample(candidate) {
  // The Service Worker serves this Worker, its imports and data from the complete
  // candidate cache. This is a new analyzer, not the open tab's in-memory engine.
  const probe = new Worker(candidate.base + 'browser/worker.mjs?offline-check=' + candidate.id, {type: 'module'});
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Offline analysis did not finish. Please retry.')), 30000);
      probe.onerror = () => { clearTimeout(timer); reject(new Error('Cannot start the saved analyzer.')); };
      probe.onmessage = async ({data}) => {
        if (data.type === 'ready') probe.postMessage({id: 1, input: candidate.smoke.input, mode: candidate.smoke.mode});
        if (data.type === 'error') { clearTimeout(timer); reject(new Error('The saved analyzer could not load.')); }
        if (data.type === 'result') {
          clearTimeout(timer);
          try {
            if (await digest(new TextEncoder().encode(JSON.stringify(data.result))) !== candidate.smoke.sha256) throw new Error('The saved analyzer returned an unexpected result.');
            resolve();
          } catch (error) { reject(error); }
        }
      };
    });
  } finally { probe.terminate(); }
}

async function refresh() {
  const status = await call('status');
  update = status.pending;
  panel.classList.toggle('offline-ready', Boolean(status.ready));
  panel.classList.remove('offline-notice');
  const controls = document.querySelector('#offline-controls');
  if (status.ready) document.querySelector('#header-tools').prepend(controls);
  else panel.prepend(controls);
  panel.hidden = Boolean(status.ready) && !update;
  document.querySelector('#offline-help').hidden = Boolean(status.ready);
  document.querySelector('#install-app').hidden = Boolean(status.ready) || !installPrompt;
  reloadButton.hidden = !update;
  if (status.ready) {
    message.textContent = `Ready offline · ${status.active.version}. ${persistence}`;
    saveButton.textContent = 'Update';
    saveButton.title = 'Check for updates and verify saved files';
    saveButton.hidden = Boolean(update);
    if (update) message.textContent += ' An update is verified and ready. Reload when convenient.';
    else if (manifest && manifest.id !== status.active.id) message.textContent += ' An update is available.';
  } else {
    saveButton.hidden = false;
    message.textContent = status.active ? 'Saved files are incomplete. Reconnect and save again to repair them.' : 'Save the complete dictionary to use it without an internet connection.';
    saveButton.textContent = manifest ? `Save for offline use (${megabytes(manifest.bytes)})` : 'Save for offline use';
  }
  return status;
}

saveButton.addEventListener('click', async () => {
  panel.hidden = false;
  panel.classList.add('offline-notice');
  saveButton.disabled = true; cancelButton.hidden = false; progress.hidden = false; progress.value = 0;
  try {
    const persistent = await navigator.storage?.persist?.().catch(() => false);
    persistence = persistent ? 'Persistent storage granted.' : 'Your browser may reclaim saved storage.';
    const result = await call('save', {}, ({bytes, total}) => {
      progress.max = total; progress.value = bytes;
      message.textContent = `Saving and checking files: ${megabytes(bytes)} / ${megabytes(total)}.`;
    });
    cancelButton.hidden = true; message.textContent = 'Checking the saved analyzer…';
    await sample(result.candidate);
    await call('confirm', {id: result.candidate.id});
    manifest = result.candidate;
    await refresh();
  } catch (error) { panel.classList.add('offline-notice'); message.textContent = error.message; }
  finally { saveButton.disabled = false; cancelButton.hidden = true; progress.hidden = true; }
});
cancelButton.addEventListener('click', () => call('cancel').catch(error => { message.textContent = error.message; }));
reloadButton.addEventListener('click', async () => {
  reloadButton.disabled = true;
  try { await call('activate', {id: update.id}); location.assign('/'); }
  catch (error) {
    await refresh().catch(() => {});
    panel.classList.add('offline-notice'); message.textContent = error.message;
    panel.hidden = false;
    saveButton.hidden = false; reloadButton.disabled = false;
  }
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event;
  document.querySelector('#install-app').hidden = panel.classList.contains('offline-ready');
});
document.querySelector('#install-app').addEventListener('click', async () => {
  await installPrompt?.prompt(); installPrompt = null;
  document.querySelector('#install-app').hidden = true;
});

async function start() {
  if (!('serviceWorker' in navigator) || !isSecureContext) return;
  // The development harness remains usable without generating an offline site.
  if (!location.pathname.startsWith('/releases/')) return;
  panel.hidden = false;
  try {
    await navigator.serviceWorker.register('/sw.js', {type: 'module', scope: '/', updateViaCache: 'none'});
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true}));
    worker = navigator.serviceWorker.controller ?? registration.active;
    if (await navigator.storage?.persisted?.()) persistence = 'Persistent storage granted.';
    else persistence = 'Your browser may reclaim saved storage.';
    try {
      const response = await fetch('/release.json', {cache: 'no-store'});
      if (response.ok) manifest = validateManifest(await response.json());
    } catch { /* Cached operation needs no live manifest. */ }
    await refresh(); saveButton.disabled = false;
  } catch { message.textContent = 'Offline storage is unavailable in this browser session. Online analysis still works.'; }
}
start();
