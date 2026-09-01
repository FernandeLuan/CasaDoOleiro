import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('activity without preferred time keeps title alignment with N/A', async () => {
  const source = fs.readFileSync('js/portal/planejamento.js', 'utf8');
  expect(source).toContain("escapeHtml(s.activity.time||'N/A')");
  expect(source).toContain(" • <span data-no-i18n>");
  expect(source).not.toContain("escapeHtml(s.activity.time||'—')");
});
