// Critical browser regression: isolated Firebase emulators only; never production data.
import {test,expect} from '@playwright/test';

const firebaseConfig={
  apiKey:'demo-api-key',
  authDomain:'demo-casadooleiro.firebaseapp.com',
  projectId:'demo-casadooleiro',
  appId:'1:123:web:e2e'
};

async function prepare(page){
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`
  }));
}

async function login(page,email,password,target){
  await prepare(page);
  await page.goto('/?emulator=1');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#loginButton').click();
  await expect(page).toHaveURL(new RegExp(`/${target}/`));
}

const action=(page,label)=>page.getByRole('button',{name:new RegExp(`${label}$`)});

test('Admin manages independent A/B/C/D groups for Rodeio and Indaial',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await action(page,'Menu').click();
  await action(page,'Grupos').click();
  await expect(page.locator('#managerGroupUnit')).toBeVisible();

  await page.locator('#managerGroupUnit').selectOption('indaial');
  await expect(page.locator('.group-details')).toHaveCount(4);
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
  await expect(page.getByText('Grupo D',{exact:true})).toBeVisible();
  await expect(page.locator('.section-title').getByText(/Indaial.*inativa/i)).toBeVisible();

  await page.locator('#managerGroupUnit').selectOption('rodeio');
  await expect(page.locator('.group-details')).toHaveCount(4);
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
});

test('Candidate History is lazy and loads only after opening its tab',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await action(page,'Voluntariado').click();
  await action(page,'Filtros').click();
  await page.locator('#candidateStatusFilter').selectOption('pending');
  await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();

  const candidate=page.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();
  await expect(candidate).toBeVisible();
  await candidate.click();
  await expect(page.getByRole('button',{name:/Histórico$/})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='applications/history').length||0)).toBe(0);

  await page.getByRole('button',{name:/Histórico$/}).click();
  await expect(page.getByText('Histórico do candidato',{exact:true})).toBeVisible();
  await expect(page.getByText('Candidato cadastrado',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='applications/history').length||0)).toBe(1);
});

test('Candidate creates, edits, moves and deletes own proposed activity',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');
  await action(page,'Planejamento').click();
  await expect(page.getByRole('button',{name:/Adicionar atividade$/}).first()).toBeVisible();

  await page.getByRole('button',{name:/Adicionar atividade$/}).first().click();
  await page.locator('#actName').fill('Atividade E2E');
  await page.locator('#actDesc').fill('Fluxo automatizado');
  await page.locator('#modalRoot').getByRole('button',{name:/Adicionar atividade$/}).click();
  await expect(page.getByText('Atividade E2E',{exact:true})).toBeVisible();
  await expect(page.getByText(/1 atividades/)).toBeVisible();

  let card=page.locator('.activity-card').filter({hasText:'Atividade E2E'}).first();
  await card.getByRole('button',{name:/Editar$/}).click();
  await page.locator('#actName').fill('Atividade E2E editada');
  await page.locator('#modalRoot').getByRole('button',{name:/Salvar alterações$/}).click();
  await expect(page.getByText('Atividade E2E editada',{exact:true})).toBeVisible();

  card=page.locator('.activity-card').filter({hasText:'Atividade E2E editada'}).first();
  await card.getByRole('button',{name:/Mover$/}).click();
  await expect(page.locator('#moveDate')).toBeVisible();
  await page.locator('#modalRoot').getByRole('button',{name:/Mover$/}).click();
  await expect(page.getByText('Atividade E2E editada',{exact:true})).toBeVisible();

  card=page.locator('.activity-card').filter({hasText:'Atividade E2E editada'}).first();
  await card.getByRole('button',{name:/Excluir$/}).click();
  await page.locator('#modalRoot').getByRole('button',{name:/Excluir$/}).click();
  await expect(page.getByText('Atividade E2E editada',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/0 atividades/)).toBeVisible();
});
