import {test,expect} from '@playwright/test';

async function noHorizontalOverflow(page){
  await expect.poll(()=>page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}))).toEqual(expect.objectContaining({inner:expect.any(Number)}));
  const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner+2);
}

async function waitDemo(page,role){
  await page.waitForFunction(expected=>window.__OLEIRO_DEMO__?.role===expected&&!!window.OleiroDemoDB,role,{timeout:20_000});
}

const nav=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});

async function adminAllCandidates(page){
  await nav(page,'Voluntariado').click();
  await expect(page.locator('#candidateList')).toBeVisible();
  await page.getByRole('button',{name:'Filtros'}).click();
  await page.locator('#candidateStatusFilter').selectOption('all');
  await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();
  await expect(page.locator('.r59-candidate-row')).toHaveCount(7,{timeout:20_000});
}

test('R59 landing exposes exactly Admin, Candidate and Approved Volunteer real-app entries',async({page})=>{
  await page.goto('/homologacao/');
  await expect(page.getByRole('heading',{name:'Homologação baseada no sistema real'})).toBeVisible();
  const links=page.locator('a.role');
  await expect(links).toHaveCount(3);
  await expect(page.getByRole('link',{name:/Entrar como Admin/})).toHaveAttribute('href','../admin/?demo=admin');
  await expect(page.getByRole('link',{name:/Entrar como Candidato/})).toHaveAttribute('href','../portal/?demo=candidate');
  await expect(page.getByRole('link',{name:/Entrar como Voluntário/})).toHaveAttribute('href','../portal/?demo=volunteer');
});

test('R59 Admin reuses current production navigation, candidates, groups and registration',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/admin/?demo=admin');
  await waitDemo(page,'admin');
  await expect(page.locator('#navRoot')).toBeVisible({timeout:20_000});
  await expect(nav(page,'Início')).toBeVisible();
  await expect(nav(page,'Voluntariado')).toBeVisible();
  await expect(nav(page,'Agenda')).toBeVisible();
  await expect(nav(page,'Ocupação')).toBeVisible();
  await expect(nav(page,'Menu')).toBeVisible();

  await adminAllCandidates(page);
  await expect(page.locator('.r59-candidate-table')).toBeVisible();
  await expect(page.locator('.r59-candidate-table-head')).toContainText('Voluntário');
  await expect(page.locator('.r59-candidate-table-head')).toContainText('Unidade');
  await expect(page.locator('.r59-candidate-table-head')).toContainText('Estadia');
  await expect(page.locator('.r59-candidate-table-head')).toContainText('Status');
  await noHorizontalOverflow(page);

  const josias=page.locator('.r59-candidate-row').filter({hasText:'Josias Almeida'});
  await expect(josias).toContainText('Rodeio');
  await expect(josias).toContainText('Planejamento aprovado');
  await josias.click();
  const person=page.locator('#modalRoot');
  await expect(person.getByText('Josias Almeida',{exact:true}).first()).toBeVisible();
  await expect(person.getByRole('button',{name:/Planejamento$/})).toBeVisible();
  await expect(person.getByRole('button',{name:/Conta$/})).toBeVisible();
  await expect(person.getByRole('button',{name:/Histórico$/})).toBeVisible();
  await person.getByRole('button',{name:/Planejamento$/}).click();
  await expect(person.getByText('Introdução ao Pilates',{exact:true})).toBeVisible({timeout:20_000});

  await page.evaluate(()=>closeModal());
  await nav(page,'Menu').click();
  await expect(page.locator('#app').getByText('Grupos',{exact:true})).toBeVisible();
  await page.locator('#app .menu-list').getByRole('button',{name:/Grupos\b/}).click();
  await expect(page.locator('#managerGroupUnit')).toBeVisible({timeout:20_000});
  await expect(page.locator('.group-details')).toHaveCount(4);
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();

  await nav(page,'Voluntariado').click();
  await page.getByRole('button',{name:'Novo candidato'}).click();
  await expect(page.locator('#ncName1')).toBeVisible();
  await expect(page.locator('#ncEmergencyName1')).toBeVisible();
  await expect(page.locator('#ncEmergencyRelationship1')).toBeVisible();
  await expect(page.locator('#ncEmergencyPhone1')).toBeVisible();
  await expect(page.locator('#ncFrom')).toBeVisible();
  await expect(page.locator('#ncTo')).toBeVisible();
});

test('R59 Candidate uses the current candidate portal and its real planning/profile features',async({page})=>{
  await page.goto('/portal/?demo=candidate');
  await waitDemo(page,'candidate');
  await expect(nav(page,'Início')).toBeVisible({timeout:20_000});
  await expect(nav(page,'Planejamento')).toBeVisible();
  await expect(nav(page,'Estadia')).toBeVisible();
  await expect(nav(page,'Informações')).toBeVisible();
  await expect(nav(page,'Perfil')).toBeVisible();

  await nav(page,'Planejamento').click();
  await expect(page.getByText('Conversação em espanhol',{exact:true})).toBeVisible({timeout:20_000});
  await expect(page.getByRole('button',{name:/Adicionar atividade$/}).first()).toBeVisible();

  await nav(page,'Perfil').click();
  await expect(page.getByText('Contato de emergência',{exact:true})).toBeVisible({timeout:20_000});
  await expect(page.getByText('Lucía Albuquerque',{exact:true})).toBeVisible();
  await noHorizontalOverflow(page);
});

test('R59 Approved Volunteer uses the current post-approval portal with Agenda',async({page})=>{
  await page.goto('/portal/?demo=volunteer');
  await waitDemo(page,'volunteer');
  await expect(nav(page,'Início')).toBeVisible({timeout:20_000});
  await expect(nav(page,'Agenda')).toBeVisible();
  await expect(nav(page,'Estadia')).toBeVisible();
  await expect(nav(page,'Informações')).toBeVisible();
  await expect(nav(page,'Perfil')).toBeVisible();
  await expect(nav(page,'Planejamento')).toHaveCount(0);

  await nav(page,'Agenda').click();
  await expect(page.getByText('Culinária simples',{exact:true})).toBeVisible({timeout:20_000});
  await expect(page.getByText('Esporte e recreação',{exact:true})).toBeVisible();
  await noHorizontalOverflow(page);
});

test('R59 mobile keeps the real Admin usable without horizontal breakage',async({page},testInfo)=>{
  test.skip(!testInfo.project.name.includes('iphone'),'mobile composition is validated in the iPhone project');
  await page.goto('/admin/?demo=admin');
  await waitDemo(page,'admin');
  await adminAllCandidates(page);
  await noHorizontalOverflow(page);
  await expect(page.locator('.r59-candidate-table-head')).toBeHidden();
  await expect(page.locator('.r59-candidate-row').first()).toBeVisible();
  const navBox=await page.locator('#navRoot .bottom-nav').boundingBox();
  expect(navBox).not.toBeNull();
  expect(navBox.width).toBeLessThanOrEqual((await page.evaluate(()=>window.innerWidth))+2);

  await page.getByRole('button',{name:'Novo candidato'}).click();
  await expect(page.locator('#ncEmergencyName1')).toBeVisible();
  await noHorizontalOverflow(page);
  const modalBox=await page.locator('#modalRoot .modal').boundingBox();
  expect(modalBox).not.toBeNull();
  expect(modalBox.width).toBeLessThanOrEqual((await page.evaluate(()=>window.innerWidth))+2);
});
