import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('visual preview renders admin workspace and contextual activity actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const url = pathToFileURL(path.join(process.cwd(), 'visual-preview', 'index.html')).href;
  await page.goto(url);

  await expect(page.getByRole('heading', { name: 'Candidatos e jornadas' })).toBeVisible();
  await expect(page.getByText('AMBIENTE DE TESTE', { exact: false })).toBeVisible();

  await page.getByText('Josias Almeida', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Josias Almeida' })).toBeVisible();

  await page.getByRole('button', { name: /Sexta · 11\/09/i }).click();
  await expect(page.getByRole('button', { name: /Replicar atividade/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Adicionar atividade/i })).toBeVisible();
});

test('visual preview preserves a mobile navigation layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const url = pathToFileURL(path.join(process.cwd(), 'visual-preview', 'index.html')).href;
  await page.goto(url);

  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Candidatos e jornadas' })).toBeVisible();
});
