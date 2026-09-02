import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const previewUrl=()=>pathToFileURL(path.join(process.cwd(),'visual-preview','index.html')).href;

async function expectNoHorizontalOverflow(page){
  const metrics=await page.evaluate(()=>({viewport:window.innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  expect(metrics.html).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport+1);
}

test('R57 uses modern sans typography and keeps the desktop workspace aligned',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(previewUrl());
  const heading=page.getByRole('heading',{name:'Candidatos e jornadas'});
  await expect(heading).toBeVisible();
  const font=await heading.evaluate(el=>getComputedStyle(el).fontFamily);
  expect(font.toLowerCase()).not.toContain('georgia');
  await expectNoHorizontalOverflow(page);

  await page.getByText('Josias Almeida',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'Josias Almeida'})).toBeVisible();
  await page.getByRole('button',{name:'Conta'}).click();
  await expect(page.getByRole('heading',{name:'Contato de emergência'})).toBeVisible();
  await expect(page.getByText('Marcos Almeida',{exact:true})).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('R57 mobile candidates, workspace and forms stay inside the viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(previewUrl());
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.locator('.mobile-nav button:visible')).toHaveCount(3);
  await expect(page.locator('.candidate-row').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByText('Josias Almeida',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'Josias Almeida'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Replicar atividade/i})).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button',{name:'×'}).click();
  await page.getByRole('button',{name:/Novo candidato/i}).click();
  await expect(page.getByRole('heading',{name:'Novo candidato'})).toBeVisible();
  await expect(page.getByText('Contato de emergência',{exact:true}).first()).toBeVisible();
  await expect(page.getByLabel('Nome').last()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
