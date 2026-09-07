import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const entrypoints = ['index.html', 'login.html', 'admin/index.html', 'portal/index.html'];
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, '..');

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export async function checkSiteAssets(root = defaultRoot, { entries = entrypoints } = {}) {
  const site = path.resolve(root);
  const errors = [];
  let checked = 0;
  const visited = new Set();

  async function validateReference(from, reference) {
    const value = String(reference || '').trim();
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return null;
    const clean = value.split(/[?#]/, 1)[0];
    if (!clean) return null;
    let decoded;
    try { decoded = decodeURIComponent(clean); }
    catch { errors.push(`${from}: URL local inválida: ${value}`); return null; }
    const target = decoded.startsWith('/')
      ? path.resolve(site, '.' + decoded)
      : path.resolve(path.dirname(path.join(site, from)), decoded);
    if (target !== site && !target.startsWith(site + path.sep)) {
      errors.push(`${from}: referência fora do site: ${value}`);
      return null;
    }
    checked++;
    if (!(await exists(target))) {
      errors.push(`${from}: arquivo local ausente: ${value}`);
      return null;
    }
    return path.relative(site, target).split(path.sep).join('/');
  }

  async function scan(relative) {
    if (visited.has(relative)) return;
    visited.add(relative);
    const extension = path.extname(relative).toLowerCase();
    if (!['.html', '.css'].includes(extension)) return;
    const source = await readFile(path.join(site, relative), 'utf8');
    const references = [];
    if (extension === '.html') {
      for (const match of source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) references.push(match[1]);
    } else {
      for (const match of source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/gi)) references.push(match[1]);
      for (const match of source.matchAll(/url\(\s*(?:["']([^"']+)["']|([^\s)]+))\s*\)/gi)) references.push(match[1] || match[2]);
    }
    for (const reference of references) {
      const target = await validateReference(relative, reference);
      if (target && path.extname(target).toLowerCase() === '.css') await scan(target);
    }
  }

  for (const entry of entries) {
    const relative = entry.replaceAll('\\', '/').replace(/^\/+/, '');
    if (!(await exists(path.join(site, relative)))) {
      if (relative === 'login.html' && site === defaultRoot) continue;
      errors.push(`Entrada obrigatória ausente: ${relative}`);
      continue;
    }
    await scan(relative);
  }
  if (errors.length) throw new Error('Integridade dos assets reprovada:\n- ' + errors.join('\n- '));
  return { entries: entries.length, checked };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkSiteAssets(process.argv[2] || defaultRoot).then(result => {
    console.log(`Assets locais: OK — ${result.checked} referências verificadas.`);
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
