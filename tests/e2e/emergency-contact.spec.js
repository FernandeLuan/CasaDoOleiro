// Focused regression for volunteer emergency contact UX. Firebase emulators only; never production data.
import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};

async function prepare(page){
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}));
}

async function login(page){
  await prepare(page);await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});
  await page.locator('#email').fill('voluntario@oleiro.test');await page.locator('#password').fill('Volunteer123!');await page.locator('#loginButton').click();await expect(page).toHaveURL(/\/portal\//,{timeout:30_000});
}

const profileNav=page=>page.locator('#navRoot').getByRole('button',{name:/Perfil$/});

test.beforeEach(async()=>{await seedEmulators()});

test('Empty emergency contact uses pencil-only action and requires every field before save',async({page})=>{
  await login(page);await profileNav(page).click();
  const card=page.locator('.volunteer-emergency-card');await expect(card).toBeVisible();await expect(card).toContainText('Não informado');
  const edit=card.getByRole('button',{name:/Adicionar contato$/});await expect(edit).toBeVisible();await expect(edit.locator('i.fa-pen')).toHaveCount(1);expect((await edit.textContent())?.trim()).toBe('');
  await edit.click();

  const name=page.locator('#myEmergencyName'),relationship=page.locator('#myEmergencyRelationship'),phone=page.locator('#myEmergencyPhone'),save=page.locator('#saveMyEmergencyButton');
  await expect(name).toHaveAttribute('required','');await expect(relationship).toHaveAttribute('required','');await expect(phone).toHaveAttribute('required','');await expect(save).toBeDisabled();

  await name.fill('Contato E2E');await phone.fill('+55 47 99999-1111');await expect(save).toBeDisabled();
  await relationship.fill('Irmão');await expect(save).toBeEnabled();
  await relationship.fill('');await expect(save).toBeDisabled();
  await relationship.fill('Irmão');await expect(save).toBeEnabled();
  await save.click();

  await expect(card).toContainText('Contato E2E',{timeout:20_000});await expect(card).toContainText('Irmão');await expect(card).toContainText('+55 47 99999-1111');
});