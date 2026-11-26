import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const compatibilityCss = await readFile(new URL('../css/form-editing-compat.css', import.meta.url), 'utf8');

test('iOS editing compatibility preserves text selection and contextual paste on editable controls', () => {
  for (const selector of [
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[contenteditable="true"]',
    '[role="textbox"][aria-multiline="true"]'
  ]) assert.ok(compatibilityCss.includes(selector), `missing editable control selector: ${selector}`);
  assert.match(compatibilityCss, /-webkit-user-select:\s*text\s*!important/);
  assert.match(compatibilityCss, /user-select:\s*text\s*!important/);
  assert.match(compatibilityCss, /-webkit-touch-callout:\s*default\s*!important/);
});

for (const [entry, href] of [
  ['../index.html', 'css/form-editing-compat.css'],
  ['../admin/index.html', '../css/form-editing-compat.css'],
  ['../portal/index.html', '../css/form-editing-compat.css']
]) {
  test(`editing compatibility stylesheet is loaded by ${entry}`, async () => {
    const html = await readFile(new URL(entry, import.meta.url), 'utf8');
    assert.ok(html.includes(href), `missing ${href} in ${entry}`);
  });
}

test('new-candidate fields expose native iOS email and phone input hints', async () => {
  const source = await readFile(new URL('../js/admin/candidate-form.js', import.meta.url), 'utf8');
  assert.match(source, /type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false"/);
  assert.match(source, /type="tel" inputmode="tel" autocomplete="tel"/);
});
