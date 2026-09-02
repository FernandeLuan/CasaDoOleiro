import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const preview=file=>pathToFileURL(path.join(process.cwd(),'visual-preview',file)).href;

async function noOverflow(page){
  const m=await page.evaluate(()=>({w:innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  expect(m.html).toBeLessThanOrEqual(m.w+1);expect(m.body).toBeLessThanOrEqual(m.w+1);
}

test('R58 chooser separates admin, candidate and approved volunteer',async({page})=>{
  await page.goto(preview('index.html'));
  await expect(page.locator('[data-role-link="admin"]')).toHaveAttribute('href','./admin.html');
  await expect(page.locator('[data-role-link="candidate"]')).toHaveAttribute('href','./candidate.html');
  await expect(page.locator('[data-role-link="volunteer"]')).toHaveAttribute('href','./volunteer.html');
});

test('R58 admin mirrors real primary navigation and management menu',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(preview('admin.html'));
  const sidebar=page.locator('.side-nav');
  for(const label of ['Início','Voluntariado','Agenda','Grupos','Menu'])await expect(sidebar.getByRole('button',{name:new RegExp(label)})).toBeVisible();
  await sidebar.getByRole('button',{name:/Grupos/}).click();
  await expect(page.getByRole('heading',{name:'Grupos'})).toBeVisible();
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
  await sidebar.getByRole('button',{name:/Menu/}).click();
  for(const label of ['Grupos','Informações do portal','Unidades','Rotina','Minha conta','Sair'])await expect(page.getByText(label,{exact:true}).first()).toBeVisible();
  await noOverflow(page);
});

test('R58 candidate mirrors pre-approval navigation and planning actions',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(preview('candidate.html'));
  const nav=page.locator('.mobile-nav');
  for(const label of ['Início','Planejamento','Estadia','Informações','Perfil'])await expect(nav.getByRole('button',{name:new RegExp(label)})).toBeVisible();
  await nav.getByRole('button',{name:/Planejamento/}).click();
  await expect(page.getByRole('heading',{name:'Planejamento'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Replicar atividade/i}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Adicionar atividade/i}).first()).toBeVisible();
  await noOverflow(page);
});

test('R58 approved volunteer replaces planning with agenda',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(preview('volunteer.html'));
  const nav=page.locator('.mobile-nav');
  for(const label of ['Início','Agenda','Estadia','Informações','Perfil'])await expect(nav.getByRole('button',{name:new RegExp(label)})).toBeVisible();
  await expect(nav.getByRole('button',{name:/Planejamento/})).toHaveCount(0);
  await nav.getByRole('button',{name:/Perfil/}).click();
  await expect(page.getByRole('heading',{name:'Contato de emergência'})).toBeVisible();
  await noOverflow(page);
});
