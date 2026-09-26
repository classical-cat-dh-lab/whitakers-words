import {digest, validateManifest} from './offline-core.mjs';

const panel = document.querySelector('#offline'), message = document.querySelector('#offline-status');
const saveButton = document.querySelector('#offline-save'), cancelButton = document.querySelector('#offline-cancel');
const reloadButton = document.querySelector('#offline-reload'), progress = document.querySelector('#offline-progress');
let worker, registration, manifest, installPrompt, persistence = '', update, lastCheck = 0;
const runningId = document.querySelector('meta[name="words-release"]')?.content;
let helpOpen = false;
const controls = document.querySelector('#offline-controls');
document.querySelector('#offline-help-link').addEventListener('click', () => {
  helpOpen = true; panel.hidden = false;
  document.querySelector('#offline-help').hidden = false;
  document.querySelector('#offline-help').open = true;
});
document.querySelector('#offline-close').addEventListener('click', () => {
  helpOpen = false; panel.hidden = true;
});
const megabytes = bytes => (bytes / 1024 / 1024).toFixed(1) + ' MB';

function call(action, extra = {}, onProgress, target = worker) {
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
    target.postMessage({action, ...extra}, [channel.port2]);
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
  update = status.pending ?? (status.ready && status.active.id !== runningId && (!manifest || status.active.id === manifest.id) ? status.active : null);
  const available = manifest && manifest.id !== runningId && manifest.id !== status.active?.id;
  const savedDifferent = status.ready && status.active.id !== runningId;
  panel.classList.toggle('offline-ready', Boolean(status.ready));
  panel.classList.remove('offline-notice');
  panel.hidden = !(update || available || savedDifferent || (status.active && !status.ready) || helpOpen);
  document.querySelector('#offline-help').hidden = false;
  document.querySelector('#install-app').hidden = !installPrompt;
  reloadButton.hidden = !update;
  if (status.ready) {
    message.textContent = `Ready offline · ${status.active.version}. ${persistence}`;
    saveButton.textContent = 'Update';
    saveButton.title = 'Check for updates and verify saved files';
    saveButton.hidden = Boolean(update);
    if (update) message.textContent += ' An update is verified and ready. Reload when convenient.';
    else if (available) message.textContent += ' A new version is available. Choose Update to download and verify it; your current lookup will stay open.';
    else if (savedDifferent) message.textContent += ' This page and your saved copy differ. Choose Update to save the current version.';
  } else {
    saveButton.hidden = false;
    message.textContent = status.active ? 'Saved files are incomplete. Reconnect and save again to repair them.' : 'Save the complete dictionary to use it without an internet connection.';
    saveButton.textContent = 'Save offline';
    saveButton.title = manifest ? `Save the complete dictionary (${megabytes(manifest.bytes)})` : 'Save the complete dictionary for offline use';
  }
  return status;
}

async function takeControl(id) {
  const installing = registration.installing;
  if (installing) await new Promise(resolve => {
    const timer = setTimeout(resolve, 10000);
    installing.addEventListener('statechange', () => {
      if (['installed', 'redundant'].includes(installing.state)) { clearTimeout(timer); resolve(); }
    });
  });
  if (!registration.waiting) return;
  // Only adopt routing code after an entire stable-page bundle is verified and
  // active. Open documents keep their explicit release-pinned resource URLs.
  const changed = new Promise(resolve => {
    const timer = setTimeout(resolve, 10000);
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, {once: true});
  });
  await call('take-control', {id}, undefined, registration.waiting);
  await changed; worker = navigator.serviceWorker.controller;
}

async function checkForUpdates() {
  if (!worker || saveButton.disabled || Date.now() - lastCheck < 60000) return;
  lastCheck = Date.now();
  try {
    const response = await fetch('/release.json', {cache: 'no-store'});
    if (response.ok) manifest = validateManifest(await response.json());
    await refresh();
  } catch { /* The selected offline version remains usable. */ }
}

saveButton.addEventListener('click', async () => {
  panel.hidden = false;
  panel.classList.add('offline-notice');
  saveButton.disabled = true; cancelButton.hidden = false; progress.hidden = false; progress.value = 0;
  document.querySelector('#offline-close').hidden = true;
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
    const status = await refresh();
    if (status.ready && status.active.id === runningId) await takeControl(runningId);
  } catch (error) { panel.classList.add('offline-notice'); message.textContent = error.message; }
  finally { saveButton.disabled = false; cancelButton.hidden = true; progress.hidden = true; document.querySelector('#offline-close').hidden = false; }
});
cancelButton.addEventListener('click', () => call('cancel').catch(error => { message.textContent = error.message; }));
reloadButton.addEventListener('click', async () => {
  reloadButton.disabled = true;
  try {
    const status = await call('status');
    if (status.pending?.id === update.id) await call('activate', {id: update.id});
    else if (!status.ready || status.active?.id !== update.id) throw new Error('The verified update is no longer available. Check for updates again.');
    await takeControl(update.id); location.assign('/');
  }
  catch (error) {
    await refresh().catch(() => {});
    panel.classList.add('offline-notice'); message.textContent = error.message;
    panel.hidden = false;
    saveButton.hidden = false; reloadButton.disabled = false;
  }
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event;
  document.querySelector('#install-app').hidden = false;
});
document.querySelector('#install-app').addEventListener('click', async () => {
  await installPrompt?.prompt(); installPrompt = null;
  document.querySelector('#install-app').hidden = true;
});

async function start() {
  if (!('serviceWorker' in navigator) || !isSecureContext) { message.textContent = 'Offline saving is unavailable in this browser. Online lookup still works.'; return; }
  // The development harness remains usable without generating an offline site.
  if (!runningId) { message.textContent = 'Offline saving is available in the exported website.'; return; }
  controls.hidden = false;
  try {
    registration = await navigator.serviceWorker.register('/sw.js', {type: 'module', scope: '/', updateViaCache: 'none'});
    // An existing registration can resolve before its update check starts.
    // Finish that check before deciding whether new routing code is waiting.
    await registration.update().catch(() => {});
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true}));
    worker = navigator.serviceWorker.controller ?? registration.active;
    if (await navigator.storage?.persisted?.()) persistence = 'Persistent storage granted.';
    else persistence = 'Your browser may reclaim saved storage.';
    try {
      const response = await fetch('/release.json', {cache: 'no-store'});
      if (response.ok) manifest = validateManifest(await response.json());
    } catch { /* Cached operation needs no live manifest. */ }
    const status = await refresh();
    if (status.ready && status.active.id === runningId) await takeControl(runningId);
    saveButton.disabled = false;
    lastCheck = Date.now();
    window.addEventListener('online', () => { lastCheck = 0; checkForUpdates(); });
    window.addEventListener('focus', checkForUpdates);
    navigator.serviceWorker.addEventListener('controllerchange', () => { worker = navigator.serviceWorker.controller; });
  } catch { controls.hidden = true; panel.hidden = false; message.textContent = 'Offline storage is unavailable in this browser session. Online lookup still works.'; }
}
start();
