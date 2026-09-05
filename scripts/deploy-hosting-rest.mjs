import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const root = path.resolve(process.env.HOSTING_DIR || 'preview-dist');
const siteId = process.env.FIREBASE_SITE_ID || 'casadooleiro-35c4e';
const channelId = process.env.FIREBASE_CHANNEL_ID || 'homologacao-clean-ui';
const token = process.env.GCP_ACCESS_TOKEN;

if (!token) throw new Error('GCP_ACCESS_TOKEN não informado.');

const apiBase = 'https://firebasehosting.googleapis.com/v1beta1';
const authHeaders = { Authorization: `Bearer ${token}` };

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`${options.method || 'GET'} ${url} -> ${response.status}: ${detail}`);
  }
  return body;
}

async function walk(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const absolute = path.join(dir, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(absolute, relative));
    else if (entry.isFile()) files.push({ absolute, relative });
  }
  return files;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function uploadWithRetry(url, payload, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: payload,
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

const sourceFiles = await walk(root);
if (!sourceFiles.length) throw new Error(`Nenhum arquivo encontrado em ${root}.`);

const assets = [];
const fileMap = {};
const byHash = new Map();

for (const file of sourceFiles) {
  const raw = await readFile(file.absolute);
  const zipped = gzipSync(raw, { level: 9 });
  const hash = sha256(zipped);
  const hostingPath = `/${file.relative.replaceAll(path.sep, '/')}`;
  fileMap[hostingPath] = hash;
  if (!byHash.has(hash)) byHash.set(hash, zipped);
  assets.push({ path: hostingPath, hash });
}

const version = await request(`${apiBase}/sites/${encodeURIComponent(siteId)}/versions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      headers: [
        { glob: '**/*.html', headers: { 'Cache-Control': 'no-store' } },
        { glob: '**/*.js', headers: { 'Cache-Control': 'no-cache' } },
        { glob: '**/*.css', headers: { 'Cache-Control': 'no-cache' } },
      ],
    },
    labels: { source: 'github-actions', environment: 'homologacao' },
  }),
});

if (!version?.name) throw new Error('Firebase Hosting não retornou o nome da versão.');
const versionName = version.name;

const populated = await request(`${apiBase}/${versionName}:populateFiles`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ files: fileMap }),
});

const required = populated?.uploadRequiredHashes || [];
const uploadUrl = populated?.uploadUrl;
if (required.length && !uploadUrl) throw new Error('Firebase Hosting não retornou uploadUrl.');

for (let index = 0; index < required.length; index += 1) {
  const hash = required[index];
  const payload = byHash.get(hash);
  if (!payload) throw new Error(`Conteúdo do hash ${hash} não encontrado localmente.`);
  await uploadWithRetry(`${uploadUrl}/${hash}`, payload);
  if ((index + 1) % 10 === 0 || index + 1 === required.length) {
    console.log(`Upload ${index + 1}/${required.length}`);
  }
}

await request(`${apiBase}/${versionName}?updateMask=status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'FINALIZED' }),
});

const channelName = `sites/${siteId}/channels/${channelId}`;
await request(`${apiBase}/${channelName}?updateMask=ttl`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: channelName, ttl: '2592000s' }),
});

const release = await request(
  `${apiBase}/${channelName}/releases?versionName=${encodeURIComponent(versionName)}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Homologação automática ${process.env.GITHUB_SHA || ''}`.trim() }),
  },
);

const channel = await request(`${apiBase}/${channelName}`);
console.log(`Versão finalizada: ${versionName}`);
console.log(`Arquivos: ${assets.length}; uploads necessários: ${required.length}`);
console.log(`Release: ${release?.name || 'criado'}`);
console.log(`URL: ${channel?.url || '(consulte o canal no Firebase Hosting)'}`);
