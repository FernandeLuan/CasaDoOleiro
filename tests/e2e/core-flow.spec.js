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

test('Admin manages independent A/B/C/D groups for Rodeio and Indaial',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await page.getByRole('button',{name:/Grupos/}).click();
  await expect(page.locator('#managerGroupUnit')).toBeVisible();

  await page.locator('#managerGroupUnit').selectOption('indaial');
  await expect(page.locator('.group-details')).toHaveCount(4);
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
  await expect(page.getByText('Grupo D',{exact:true})).toBeVisible();
  await expect(page.getByText(/Indaial.*inativa/i)).toBeVisible();

  await page.locator('#managerGroupUnit').selectOption('rodeio');
  await expect(page.locator('.group-details')).toHaveCount(4);
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
});

test('Candidate creates, edits, moves and deletes own proposed activity',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');
  await page.getByRole('button',{name:/Planejamento/}).click();
  await expect(page.getByRole('button',{name:'Adicionar atividade'}).first()).toBeVisible();

  await page.getByRole('button',{name:'Adicionar atividade'}).first().click();
  await page.locator('#actName').fill('Atividade E2E');
  await page.locator('#actDesc').fill('Fluxo automatizado');
  await page.getByRole('button',{name:'Adicionar atividade',exact:true}).click();
  await expect(page.getByText('Atividade E2E',{exact:true})).toBeVisible();
  await expect(page.getByText(/1 atividades/)).toBeVisible();

  let card=page.locator('.activity-card').filter({hasText:'Atividade E2E'}).first();
  await card.getByRole('button',{name:'Editar'}).click();
  await page.locator('#actName').fill('Atividade E2E editada');
  await page.getByRole('button',{name:'Salvar alterações'}).click();
  await expect(page.getByText('Atividade E2E editada',{exact:true})).toBeVisible();

  card=page.locator('.activity-card').filter({hasText:'Atividade E2E editada'}).first();
  await card.getByRole('button',{name:'Mover'}).click();
  await expect(page.locator('#moveDate')).toBeVisible();
  await page.locator('#modalRoot').getByRole('button',{name:'Mover',exact:true}).click();
  await expect(page.getByText('Atividade E2E editada',{exact:true})).toBeVisible();

  card=page.locator('.activity-card').filter({hasText:'Atividade E2E editada'}).first();
  await card.getByRole('button',{name:'Excluir'}).click();
  await page.locator('#modalRoot').getByRole('button',{name:'Excluir',exact:true}).last().click();
  await expect(page.getByText('Atividade E2E editada',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/0 atividades/)).toBeVisible();
});
