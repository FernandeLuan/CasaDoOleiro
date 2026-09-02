import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const css = await readFile(new URL('../css/desktop-r49.css', import.meta.url), 'utf8');

test('desktop candidate and person modals override mobile width caps', () => {
  assert.match(css, /@media\s*\(min-width:1024px\)/);
  assert.match(css, /\.modal\.new-candidate-modal\{[\s\S]*?max-width:1120px!important/);
  assert.match(css, /\.modal\.person-refactor-modal\{[\s\S]*?max-width:1180px!important/);
});

test('desktop planning uses two columns and expands opened day', () => {
  assert.match(css, /\.person-refactor-modal \.admin-refactor-planning\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /\.person-refactor-modal \.admin-refactor-planning>details\[open\]\{grid-column:1\/-1\}/);
});

test('desktop candidate form gains structured columns and hides bottom nav behind modals', () => {
  assert.match(css, /\.new-candidate-form\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.candidate-participant-card \.form-grid\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /body\.modal-open \.bottom-nav\{visibility:hidden/);
});
