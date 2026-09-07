import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkSiteAssets } from '../scripts/check-site-assets.mjs';

async function fixture(t, files) {
  const root = await mkdtemp(path.join(tmpdir(), 'oleiro-assets-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

const check = root => checkSiteAssets(root, { entries: ['index.html'] });

test('accepts existing assets, cache keys and external references', async t => {
  const root = await fixture(t, {
    'index.html': '<link href="css/site.css?v=1"><script src="js/app.js?x=2"></script><img src="/icons/logo.svg"><a href="https://example.com">External</a><a href="#home">Home</a>',
    'css/site.css': 'body{background:url("../icons/logo.svg")}',
    'js/app.js': '',
    'icons/logo.svg': '<svg></svg>'
  });
  assert.equal((await check(root)).checked, 4);
});

test('rejects a missing script in the login entry point', async t => {
  const root = await fixture(t, { 'index.html': '<script src="js/removed.js"></script>' });
  await assert.rejects(check(root), /index\.html: arquivo local ausente: js\/removed\.js/);
});

test('rejects missing nested CSS imports', async t => {
  const root = await fixture(t, {
    'index.html': '<link href="css/site.css">',
    'css/site.css': '@import "missing.css";'
  });
  await assert.rejects(check(root), /css\/site\.css: arquivo local ausente: missing\.css/);
});

test('rejects references escaping the site root', async t => {
  const root = await fixture(t, { 'index.html': '<script src="../private.js"></script>' });
  await assert.rejects(check(root), /referência fora do site/);
});

test('requires every declared entry point', async t => {
  const root = await fixture(t, { 'index.html': '' });
  await assert.rejects(checkSiteAssets(root, { entries: ['index.html', 'admin/index.html'] }), /Entrada obrigatória ausente: admin\/index\.html/);
});
