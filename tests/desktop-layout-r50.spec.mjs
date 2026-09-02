import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const css = await readFile(new URL('../css/desktop-r49.css', import.meta.url), 'utf8');

test('desktop candidate and person modals override mobile width caps', async () => {
  expect(css).toMatch(/@media\s*\(min-width:1024px\)/);
  expect(css).toMatch(/\.modal\.new-candidate-modal\{[\s\S]*?max-width:1120px!important/);
  expect(css).toMatch(/\.modal\.person-refactor-modal\{[\s\S]*?max-width:1180px!important/);
});

test('desktop planning uses two columns and expands opened day', async () => {
  expect(css).toMatch(/\.person-refactor-modal \.admin-refactor-planning\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  expect(css).toMatch(/\.person-refactor-modal \.admin-refactor-planning>details\[open\]\{grid-column:1\/-1\}/);
});

test('desktop candidate form gains structured columns and hides bottom nav behind modals', async () => {
  expect(css).toMatch(/\.new-candidate-form\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  expect(css).toMatch(/\.candidate-participant-card \.form-grid\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  expect(css).toMatch(/body\.modal-open \.bottom-nav\{visibility:hidden/);
});
