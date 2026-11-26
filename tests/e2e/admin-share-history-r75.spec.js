import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};
async function loginAdmin(page){
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}));
  await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});
  await page.locator('#email').fill('admin@oleiro.test');
  await page.locator('#password').fill('Admin123!');
  await page.locator('#loginButton').click();
  await expect(page).toHaveURL(/\/admin\//,{timeout:30_000});
  await expect(page.getByRole('navigation').getByRole('button',{name:/Planejamento/})).toBeVisible({timeout:30_000});
  const dismiss=page.getByRole('button',{name:'Agora não',exact:true});
  if(await dismiss.isVisible().catch(()=>false))await dismiss.press('Enter');
}
async function openPlanningPerson(page,name){
  await page.getByRole('navigation').getByRole('button',{name:/Planejamento/}).click();
  const item=page.locator('#planningCandidateList .list-item.clickable').filter({hasText:name}).first();
  await expect(item).toBeVisible({timeout:20_000});
  await item.click();
  await expect(page.locator('.planning-detail-page')).toBeVisible({timeout:20_000});
}

test.beforeEach(async()=>{await seedEmulators()});

test('Admin WhatsApp remains disabled when the volunteer has no valid activity',async({page})=>{
  await loginAdmin(page);
  await openPlanningPerson(page,'Indaial E2E');
  const button=page.locator('.admin-planning-share-bar .planning-share-action');
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled({timeout:20_000});
  await expect(button).toContainText('Sem atividades para compartilhar');
  await expect(page.locator('.admin-planning-share-bar')).toContainText('Adicione uma atividade válida');
});

test('Admin WhatsApp button exits spinner after opening the share target',async({page})=>{
  await loginAdmin(page);
  await page.route('https://wa.me/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>WhatsApp mock</title>'}));
  await openPlanningPerson(page,'Voluntário E2E');
  const button=page.locator('.admin-planning-share-bar .planning-share-action');
  await expect(button).toBeEnabled({timeout:20_000});
  const popupPromise=page.waitForEvent('popup');
  await button.click();
  const popup=await popupPromise;
  await popup.waitForURL(/wa\.me\//,{timeout:20_000});
  await page.bringToFront();
  await expect(button).toBeDisabled();
  await expect(button).toContainText('Compartilhado');
  const icon=button.locator('i');
  await expect(icon).toHaveClass(/fa-whatsapp/);
  await expect(icon).not.toHaveClass(/fa-spin/);
  await popup.close();
});

test('Admin inactivation is persisted in History with the actor email',async({page})=>{
  await loginAdmin(page);
  await openPlanningPerson(page,'Aprovado E2E');
  await page.evaluate(()=>window.requestInactivateApprovedVolunteer(encodeURIComponent('e2e-approved-application')));
  await expect(page.locator('#modalRoot')).toContainText('Inativar perfil?');
  await page.locator('#modalRoot').getByRole('button',{name:'Inativar',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>state.candidates.find(row=>row.id==='e2e-approved-application')?.active),{timeout:20_000}).toBe(false);
  await page.locator('.planning-profile-tabs').getByRole('button',{name:'Histórico'}).click();
  const history=page.locator('.planning-history-r71');
  await expect(history).toContainText('Perfil inativado',{timeout:20_000});
  await expect(history).toContainText('admin@oleiro.test');
});
