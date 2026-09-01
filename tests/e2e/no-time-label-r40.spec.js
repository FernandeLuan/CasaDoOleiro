import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('activity without preferred time keeps candidate views aligned with N/A', async () => {
  const planning = fs.readFileSync('js/portal/planejamento.js', 'utf8');
  const home = fs.readFileSync('js/portal/home.js', 'utf8');

  expect(planning).toContain("escapeHtml(s.activity.time||'N/A')");
  expect(planning).toContain(" • <span data-no-i18n>");
  expect(planning).not.toContain("escapeHtml(s.activity.time||'—')");

  expect(home).toContain("escapeHtml(s.activity.time||'N/A')");
  expect(home).not.toContain("escapeHtml(s.activity.time||'—')");
});
