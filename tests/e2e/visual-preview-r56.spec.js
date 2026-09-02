import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const preview=(file='index.html')=>pathToFileURL(path.join(process.cwd(),'visual-preview',file)).href;

test('visual preview exposes isolated admin, candidate and volunteer entries', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(preview());
  await expect(page.getByText('AMBIENTE DE TESTE', { exact: false })).toBeVisible();
  await expect(page.locator('[data-role-link="admin"]')).toBeVisible();
  await expect(page.locator('[data-role-link="candidate"]')).toBeVisible();
  await expect(page.locator('[data-role-link="volunteer"]')).toBeVisible();
});

test('admin preview renders candidate workspace and planning actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(preview('admin.html'));
  await page.getByRole('button',{name:/Voluntariado/}).first().click();
  await expect(page.getByRole('heading', { name: 'Candidatos e jornadas' })).toBeVisible();
  await page.getByText('Josias Almeida', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Josias Almeida' })).toBeVisible();
  await expect(page.locator('.day-card.open')).toContainText('11/09');
  await expect(page.getByRole('button', { name: /Adicionar atividade/i }).first()).toBeVisible();
});
