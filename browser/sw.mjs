import {CACHE_PREFIX, DATABASE, validateManifest, verifyResponse, localResponse, canonicalPath} from './offline-core.mjs';

// No automatic skipWaiting: a new worker never replaces an open application.
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
let download = null;

function state(change) {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DATABASE, 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore('state');
    opening.onerror = () => reject(new Error('Offline storage is unavailable.'));
    opening.onsuccess = () => {
      const db = opening.result, transaction = db.transaction('state', change ? 'readwrite' : 'readonly');
      const store = transaction.objectStore('state'), request = store.get('selection');
      let value;
      request.onsuccess = () => {
        value = request.result ?? {};
        if (change) { value = change(value); store.put(value, 'selection'); }
      };
      transaction.oncomplete = () => { db.close(); resolve(value); };
      transaction.onerror = transaction.onabort = () => { db.close(); reject(new Error('Cannot update offline storage.')); };
    };
  });
}

async function healthy(bundle) {
  if (!bundle || !await caches.has(bundle.cache)) return false;
  try {
    validateManifest(bundle.manifest);
    const cache = await caches.open(bundle.cache);
    for (const file of bundle.manifest.files) await verifyResponse(await cache.match(file.url), file);
    return true;
  } catch { return false; }
}

async function inspect() {
  const saved = await state();
  return {active: saved.active?.manifest ?? null, ready: await healthy(saved.active), pending: saved.pending?.verified && await healthy(saved.pending) ? saved.pending.manifest : null};
}

async function save(send, owner, jobId) {
  if (download) throw new Error('A download is already running. Wait for it to finish or cancel it from the page that started it.');
  let settle;
  const job = {abort: new AbortController(), cache: null, owner, jobId, finished: new Promise(resolve => { settle = resolve; })};
  const touch = () => { clearTimeout(job.timer); job.timer = setTimeout(() => { job.timedOut = true; job.abort.abort(); }, 180000); };
  touch();
  download = job;
  try {
    const response = await fetch('/release.json', {cache: 'no-store', signal: job.abort.signal});
    if (!response.ok) throw new Error('Connect to the internet to download the offline files.');
    const manifest = validateManifest(await response.json());
    const saved = await state();
    if (saved.pending && !saved.pending.verified && saved.pending.owner && await self.clients.get(saved.pending.owner)) throw new Error('Downloaded files are still being checked. Wait for that check to finish.');
    if (saved.active?.manifest.id === manifest.id && await healthy(saved.active)) return {candidate: manifest, unchanged: true};
    job.cache = CACHE_PREFIX + manifest.id + '-' + (crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,'0')).join(''));
    const cache = await caches.open(job.cache);
    let bytes = 0;
    for (const file of manifest.files) {
      if (job.abort.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      // Reuse only verified bytes at the same logical path. Frontend releases
      // should not download an unchanged dictionary or fonts again.
      let incoming;
      for (const bundle of [saved.active, saved.previous]) {
        if (!bundle) continue;
        const previous = bundle.manifest.files.find(old => old.url.slice(bundle.manifest.base.length) === file.url.slice(manifest.base.length) && old.bytes === file.bytes && old.sha256 === file.sha256);
        if (!previous) continue;
        try { incoming = await verifyResponse(await (await caches.open(bundle.cache)).match(previous.url), file); break; }
        catch { /* A missing or damaged cached file must be downloaded. */ }
      }
      if (!incoming) {
        const response = await fetch(file.url, {cache: 'no-store', signal: job.abort.signal});
        if (!response.ok) throw new Error('An offline file is unavailable: ' + response.status);
        const reader = response.body.getReader(), chunks = []; let received = 0;
        while (true) {
          const {done, value} = await reader.read(); if (done) break;
          received += value.length;
          if (received > file.bytes) { await reader.cancel(); throw new Error('An offline file has an unexpected size.'); }
          chunks.push(value); touch(); send({progress: {bytes: bytes + received, total: manifest.bytes}});
        }
        const body = new Uint8Array(received); let offset = 0;
        for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
        incoming = new Response(body, {status: response.status, headers: response.headers});
      }
      await verifyResponse(incoming, file);
      await cache.put(file.url, localResponse(incoming));
      bytes += file.bytes;
      touch(); send({progress: {bytes, total: manifest.bytes}});
    }
    if (job.abort.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    // Candidate resources can now be loaded by the validation Worker, but root
    // navigation still selects the previous, completely verified release.
    await state(current => ({...current, pending: {manifest, cache: job.cache, verified: false, owner, jobId}}));
    return {candidate: manifest};
  } catch (error) {
    if (job.cache) await caches.delete(job.cache);
    if (error.name === 'AbortError') throw new Error(job.timedOut ? 'The download stopped receiving data. Reconnect and retry; previously saved files are unchanged.' : 'Download cancelled. Previously saved files are unchanged.');
    if (error.name === 'QuotaExceededError') throw new Error('There is not enough device storage. Previously saved files are unchanged.');
    throw error;
  } finally { clearTimeout(job.timer); download = null; settle(); }
}

async function discard(owner, jobId) {
  let abandoned;
  await state(current => {
    const pending = current.pending;
    if (pending && !pending.verified && pending.owner === owner && pending.jobId === jobId) {
      abandoned = pending.cache; return {...current, pending: null};
    }
    return current;
  });
  if (abandoned) await caches.delete(abandoned);
  return {discarded: Boolean(abandoned)};
}

async function cancel(owner, jobId) {
  const job = download;
  if (job && job.owner === owner && job.jobId === jobId) {
    job.abort.abort(); await job.finished;
  }
  await discard(owner, jobId);
  return {cancelled: true};
}

function clientRelease(client) {
  const match = /\/releases\/([a-z0-9.-]+-[a-f0-9]{12})\//.exec(client.url);
  if (client.type !== 'window') return Promise.resolve(match ? {release: match[1]} : null);
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 1000);
    channel.port1.onmessage = ({data}) => { clearTimeout(timer); channel.port1.close(); resolve(data); };
    try { client.postMessage({action: 'words-release-query'}, [channel.port2]); }
    catch { clearTimeout(timer); channel.port1.close(); resolve(null); }
  });
}

async function cleanup() {
  if (download) return {deleted: 0, deferred: true};
  const clients = await self.clients.matchAll({type: 'all', includeUncontrolled: true});
  const reports = await Promise.all(clients.map(clientRelease));
  // Includes old releases without this protocol, sleeping tabs, and another
  // worker version's in-flight download. Retry on a later page visit/check.
  if (reports.some(report => !report?.release || report.busy)) return {deleted: 0, deferred: true};
  const names = await caches.keys(), saved = await state();
  const keep = new Set([saved.active?.cache, saved.previous?.cache, saved.pending?.cache]);
  const selectedIds = new Set([saved.active?.manifest.id, saved.previous?.manifest.id]);
  const releases = reports.map(report => report.release).filter(id => !selectedIds.has(id));
  let deleted = 0;
  for (const name of names) {
    if (!name.startsWith(CACHE_PREFIX) || keep.has(name) || releases.some(id => name.startsWith(CACHE_PREFIX + id + '-'))) continue;
    if (download) return {deleted, deferred: true};
    if (await caches.delete(name)) deleted++;
  }
  return {deleted, deferred: false};
}

async function confirm(id, owner, jobId) {
  const current = await state();
  if (current.active?.manifest.id === id && await healthy(current.active)) return inspect();
  if (current.pending?.manifest.id !== id || (jobId !== undefined && (current.pending.owner !== owner || current.pending.jobId !== jobId)) || !await healthy(current.pending)) throw new Error('The downloaded files must be checked again.');
  await state(latest => {
    if (latest.pending?.cache !== current.pending.cache) return latest;
    const verified = {...latest.pending, verified: true};
    if (!latest.active || latest.active.manifest.id === id) return {...latest, active: verified, pending: null};
    return {...latest, pending: verified};
  });
  return inspect();
}

async function activate(id) {
  const current = await state();
  if (!current.pending?.verified || current.pending.manifest.id !== id || !await healthy(current.pending)) throw new Error('No verified update is ready.');
  await state(latest => latest.pending?.cache === current.pending.cache ? {active: latest.pending, previous: latest.active, pending: null} : latest);
  return inspect();
}

self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port || !event.source?.url || new URL(event.source.url).origin !== self.location.origin) return;
  const send = value => port.postMessage(value);
  event.waitUntil((async () => {
    try {
      let result;
      switch (event.data?.action) {
        case 'status': result = await inspect(); break;
        case 'save': result = await save(send, event.source.id, event.data.jobId); break;
        case 'cancel': result = await cancel(event.source.id, event.data.jobId); break;
        case 'discard': result = await discard(event.source.id, event.data.jobId); break;
        case 'cleanup': result = await cleanup(); break;
        case 'confirm': result = await confirm(event.data.id, event.source.id, event.data.jobId); break;
        case 'activate': result = await activate(event.data.id); break;
        case 'take-control': {
          const saved = await state();
          if (saved.active?.manifest.id !== event.data.id || !saved.active.manifest.routes || !await healthy(saved.active)) throw new Error('A verified stable-page bundle must be active first.');
          await self.skipWaiting(); result = {ready: true}; break;
        }
        default: throw new Error('Unknown offline action.');
      }
      send({done: true, result});
    } catch (error) { send({done: true, error: error.message || 'Offline storage failed. Please retry.'}); }
  })());
});

async function offlineResponse(request) {
  const url = new URL(request.url);
  const current = await state();
  if (request.mode === 'navigate' || url.pathname === '/manifest.webmanifest') {
    const path = canonicalPath(url.pathname);
    for (const saved of [current.active, current.previous]) {
      if (!await healthy(saved)) continue;
      if (saved.manifest.routes) {
        if (path !== url.pathname) return Response.redirect(new URL(path + url.search, self.location.origin), 301);
        const target = saved.manifest.routes[path];
        if (target) return localResponse(await (await caches.open(saved.cache)).match(target));
      } else if (path === '/') {
        // First migration from a pre-stable-URL installation: prefer the online
        // stable shell; when offline retain the old working application intact.
        if (url.pathname.startsWith('/releases/')) break;
        try { const response = await fetch(request); if (response.ok) return response; } catch { /* Use legacy saved entry. */ }
        return Response.redirect(new URL(saved.manifest.entry.replace(/index\.html$/, ''), self.location.origin), 302);
      }
      break;
    }
  }
  const pathname = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
  for (const saved of [current.pending, current.active, current.previous]) {
    if (!saved || !pathname.startsWith(saved.manifest.base)) continue;
    if (request.mode === 'navigate' && !await healthy(saved)) continue;
    const cache = await caches.open(saved.cache), cached = await cache.match(pathname);
    if (cached) return localResponse(cached);
  }
  // Release-aware cleanup retains immutable assets needed by older open tabs.
  if (pathname.startsWith('/releases/') && request.mode !== 'navigate') {
    for (const name of await caches.keys()) {
      if (!name.startsWith(CACHE_PREFIX)) continue;
      const cached = await (await caches.open(name)).match(pathname);
      if (cached) return localResponse(cached);
    }
  }
  try { return await fetch(request); }
  catch {
    return new Response('Offline files are unavailable or incomplete. Reconnect, open Whitaker’s Words, and choose Save for offline use to repair them.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/release.json' || url.pathname === '/sw.js') return;
  event.respondWith(offlineResponse(event.request).catch(() => fetch(event.request)));
});
