import {digest, validateManifest} from './offline-core.mjs';

const panel = document.querySelector('#offline'), message = document.querySelector('#offline-status');
const saveButton = document.querySelector('#offline-save'), cancelButton = document.querySelector('#offline-cancel');
const reloadButton = document.querySelector('#offline-reload'), progress = document.querySelector('#offline-progress');
let worker, registration, manifest, installPrompt, persistence = '', update, lastCheck = 0;
const runningId = document.querySelector('meta[name="words-release"]')?.content;
let helpOpen = false, saveJob;
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

async function latestManifest() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('/release.json', {cache: 'no-store', signal: controller.signal});
    if (!response.ok) throw new Error('Connect to the internet to check for updates. Your saved dictionary is unchanged.');
    return validateManifest(await response.json());
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The update check timed out. Reconnect and retry; your saved dictionary is unchanged.');
    throw error;
  } finally { clearTimeout(timer); }
}

function call(action, extra = {}, onProgress, target = worker, timeout = 180000) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel(); let timer, settled = false;
    const close = () => { settled = true; clearTimeout(timer); channel.port1.close(); };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        close();
        if (action === 'save') {
          try { await call('cancel', {jobId: extra.jobId}, undefined, target, 15000); }
          catch { reject(new Error('The download could not be stopped. Reload this page before trying again.')); return; }
        }
        reject(new Error('The offline operation stopped responding. Please retry.'));
      }, timeout);
    };
    channel.port1.onmessage = ({data}) => {
      if (settled) return;
      if (data.progress) { arm(); onProgress?.(data.progress); }
      if (data.done) {
        close();
        if (data.error) reject(new Error(data.error)); else resolve(data.result);
      }
    };
    arm();
    try { target.postMessage({action, ...extra}, [channel.port2]); }
    catch (error) { close(); reject(error); }
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
  const available = status.ready && manifest && manifest.id !== status.active.id;
  const savedDifferent = status.ready && status.active.id !== runningId;
  panel.classList.toggle('offline-ready', Boolean(status.ready));
  panel.classList.remove('offline-notice');
  panel.hidden = !(update || available || savedDifferent || (status.active && !status.ready) || helpOpen);
  document.querySelector('#offline-help').hidden = false;
  document.querySelector('#install-app').hidden = !installPrompt;
  reloadButton.hidden = !update;
  if (status.ready) {
    message.textContent = `Ready offline · ${status.active.version}. ${persistence}`;
    saveButton.textContent = available ? 'Download update' : 'Check for updates';
    saveButton.title = available ? 'Download and verify the new version' : 'Check the latest version without downloading the dictionary again';
    saveButton.hidden = Boolean(update);
    if (update) message.textContent += ' An update is verified and ready. Reload when convenient.';
    else if (available) message.textContent += ' A new version is available. Choose Download update to save it; your current lookup will stay open.';
    else if (savedDifferent) message.textContent += ' This page and your saved copy differ. Check for updates to find the latest version.';
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
    manifest = await latestManifest();
    await refresh();
    await call('cleanup');
  } catch { /* The selected offline version remains usable. */ }
}

saveButton.addEventListener('click', async () => {
  panel.hidden = false;
  panel.classList.add('offline-notice');
  const downloading = saveButton.textContent === 'Download update';
  saveButton.disabled = true; progress.value = 0;
  message.textContent = 'Checking for updates…';
  document.querySelector('#offline-close').hidden = true;
  try {
    manifest = await latestManifest(); lastCheck = Date.now();
    const before = await refresh();
    if (update || (before.ready && before.active.id === manifest.id)) {
      if (!update) message.textContent = `Up to date · ${manifest.version}. Your saved dictionary is ready offline.`;
      panel.hidden = false;
      return;
    }
    // A manual check discovers updates without starting an unexpected download.
    if (before.ready && !downloading) { panel.hidden = false; return; }
    panel.hidden = false; cancelButton.hidden = false; progress.hidden = false;
    // Firefox may wait for a storage-permission decision. Saving must not wait
    // for an optional persistence grant; Cache Storage works without it.
    persistence = 'Your browser may reclaim saved storage.';
    navigator.storage?.persist?.().then(granted => {
      if (granted) persistence = 'Persistent storage granted.';
    }).catch(() => {});
    saveJob = crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
    const result = await call('save', {jobId: saveJob}, ({bytes, total}) => {
      progress.max = total; progress.value = bytes;
      message.textContent = `Saving and checking files: ${megabytes(bytes)} / ${megabytes(total)}.`;
    });
    cancelButton.hidden = true; message.textContent = 'Checking the saved analyzer…';
    await sample(result.candidate);
    await call('confirm', {id: result.candidate.id, jobId: saveJob});
    manifest = result.candidate;
    const status = await refresh();
    if (status.ready && status.active.id === runningId) await takeControl(runningId);
  } catch (error) { if (saveJob) await call('discard', {jobId: saveJob}).catch(() => {}); panel.hidden = false; panel.classList.add('offline-notice'); message.textContent = error instanceof TypeError ? 'Cannot check for updates. Reconnect and try again; your saved dictionary is unchanged.' : error.message; }
  finally { saveJob = undefined; saveButton.disabled = false; cancelButton.disabled = false; cancelButton.hidden = true; progress.hidden = true; document.querySelector('#offline-close').hidden = false; call('cleanup').catch(() => {}); }
});
cancelButton.addEventListener('click', () => { cancelButton.disabled = true; message.textContent = 'Cancelling download…'; call('cancel', {jobId: saveJob}).catch(error => { message.textContent = error.message; cancelButton.disabled = false; }); });
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
      manifest = await latestManifest();
    } catch { /* Cached operation needs no live manifest. */ }
    const status = await refresh();
    if (status.ready && status.active.id === runningId) await takeControl(runningId);
    saveButton.disabled = false;
    call('cleanup').catch(() => {});
    lastCheck = Date.now();
    window.addEventListener('online', () => { lastCheck = 0; checkForUpdates(); });
    window.addEventListener('focus', checkForUpdates);
    navigator.serviceWorker.addEventListener('controllerchange', () => { worker = navigator.serviceWorker.controller; });
  } catch { controls.hidden = true; panel.hidden = false; message.textContent = 'Offline storage is unavailable in this browser session. Online lookup still works.'; }
}
start();
