/* Shared, dependency-free offline bundle validation. */
export const CACHE_PREFIX = 'words-runtime-';
export const DATABASE = 'whitakers-words-offline';
export const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');

export function validateManifest(manifest) {
  if (manifest?.format !== 1 || !/^[a-z0-9.-]+-[a-f0-9]{12}$/.test(manifest.id) || manifest.base !== `/releases/${manifest.id}/`) throw new Error('Unsupported offline bundle.');
  if (!Array.isArray(manifest.files) || !manifest.files.length || manifest.files.length > 300) throw new Error('Invalid file list.');
  const urls = new Set();
  let size = 0;
  for (const file of manifest.files) {
    if (typeof file.url !== 'string' || !file.url.startsWith(manifest.base) || /[%?#\\]|(?:^|\/)\.{1,2}(?:\/|$)/.test(file.url) || urls.has(file.url) || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || file.bytes > 25 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('Invalid bundle file.');
    urls.add(file.url); size += file.bytes;
  }
  if (size !== manifest.bytes || size > 100 * 1024 * 1024 || !urls.has(manifest.entry) || !urls.has(manifest.base + 'browser/worker.mjs') || !manifest.smoke?.input || !/^[a-f0-9]{64}$/.test(manifest.smoke.sha256)) throw new Error('Incomplete offline bundle.');
  return manifest;
}

export async function verifyResponse(response, file) {
  if (!response?.ok) throw new Error('A required offline file is unavailable.');
  const bytes = await response.clone().arrayBuffer();
  if (bytes.byteLength !== file.bytes || await digest(bytes) !== file.sha256) throw new Error('An offline file failed its integrity check.');
  return response;
}
