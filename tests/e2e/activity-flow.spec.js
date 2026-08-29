// Focused regression for the current activity flow. Firebase emulators only; never production data.
import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};

async function prepare(page){
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}));
}
async function login(page,email,password,target){
  await prepare(page);await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});
  await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#loginButton').click();await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000});
}
const navAction=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});
async function openPendingVolunteer(page){
  await navAction(page,'Voluntariado').click();
  const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption('pending');await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();
  await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});const candidate=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();await expect(candidate).toBeVisible({timeout:20_000});await candidate.click();return page.locator('#modalRoot');
}

test.beforeEach(async()=>{await seedEmulators()});

test('Admin emergency profile uses participant card and icon-only edit action',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');const modal=await openPendingVolunteer(page);await modal.getByRole('button',{name:/Conta$/}).click();
  const card=modal.locator('.account-emergency-card');await expect(card).toBeVisible();const person=card.locator('.emergency-admin-person').first();await expect(person).toBeVisible({timeout:20_000});await expect(person.locator('.emergency-admin-avatar')).toHaveText('VE');await expect(person.locator('.emergency-admin-owner')).toContainText('Voluntário E2E');
  const edit=person.getByRole('button',{name:/Adicionar contato$/});await expect(edit).toBeVisible();await expect(edit.locator('i.fa-pen')).toHaveCount(1);expect((await edit.textContent())?.trim()).toBe('');
});

test('Admin creates same activity at two times with independent multi-group selections',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');const modal=await openPendingVolunteer(page);const day=modal.locator('details[data-plan-date]').first();await day.locator('summary').click();await expect(day).toHaveAttribute('open','');const add=day.getByRole('button',{name:/Adicionar atividade$/}).first();await expect(add).toBeVisible({timeout:20_000});await add.click();
  await page.locator('#managerActName').fill('Oficina repetida E2E');await page.locator('#managerActDesc').fill('Descrição visível no card');await page.locator('#managerActNotes').fill('Observação visível');await page.locator('#managerActMaterials').fill('Cartolina');await page.locator('#managerActPeriod').selectOption({label:'Tarde'});
  const time=page.locator('#managerActTime');await time.fill('09:00');await time.evaluate(el=>Object.defineProperty(el,'showPicker',{configurable:true,value(){this.dataset.pickerProbe='opened'}}));await time.click({position:{x:20,y:20}});await expect(time).toHaveAttribute('data-picker-probe','opened');
  const primary=page.locator('[data-group-picker="manager-primary"]');await primary.locator('input[value="A"]').check();await primary.locator('input[value="B"]').check();await expect(page.locator('#managerActGroup')).toHaveValue('A + B');
  await page.locator('#adminRepeatBlock').getByRole('button',{name:/Adicionar horário$/}).click();const repeat=page.locator('#adminRepeatList .activity-repeat-row').first();await repeat.locator('input[data-repeat-time]').fill('10:30');await repeat.locator('input[value="A"]').uncheck();await repeat.locator('input[value="B"]').uncheck();await repeat.locator('input[value="C"]').check();
  await page.locator('#managerActSave').click();await expect(page.locator('#managerActSave')).toHaveCount(0,{timeout:20_000});
  const rows=await expect.poll(()=>page.evaluate(()=>Object.values(state.adminPlanPageCache||{}).flatMap(cache=>cache?.sessions||[]).filter(row=>row.activityName==='Oficina repetida E2E').map(row=>({time:row.time,groupId:row.groupId}))),{timeout:20_000}).toHaveLength(2);
  void rows;
  const stored=await page.evaluate(()=>Object.values(state.adminPlanPageCache||{}).flatMap(cache=>cache?.sessions||[]).filter(row=>row.activityName==='Oficina repetida E2E').map(row=>({time:row.time,groupId:row.groupId})).sort((a,b)=>a.time.localeCompare(b.time)));
  expect(stored).toEqual([{time:'09:00',groupId:'A + B'},{time:'10:30',groupId:'C'}]);
  const activityRows=modal.locator('.planning-session-row').filter({hasText:'Oficina repetida E2E'});await expect(activityRows).toHaveCount(2);await expect(activityRows.first()).toHaveClass(/admin-portal-activity-card/);await expect(modal.locator('.admin-period-section[data-period="Tarde"]')).toContainText('Oficina repetida E2E');await expect(activityRows.first()).toContainText('Descrição visível no card');const descriptionCount=await activityRows.first().evaluate((row)=>{const value='Descrição visível no card';return row.innerText.split(value).length-1});expect(descriptionCount).toBe(1);await expect(activityRows.first().locator('.admin-portal-description')).toContainText('Descrição visível no card');await expect(activityRows.first().locator('.admin-portal-detail-divider')).toHaveCount(2);await expect(activityRows.first()).toContainText('Observação visível');await expect(activityRows.first()).toContainText('Cartolina');await expect(activityRows.first().locator('.planning-note-button')).toHaveCount(0);
  const detailOrder=await activityRows.first().evaluate(row=>{const text=row.innerText;return {description:text.indexOf('Descrição visível no card'),notes:text.indexOf('Observação visível'),materials:text.indexOf('Cartolina'),edit:text.indexOf('Editar')}});expect(detailOrder.description).toBeGreaterThanOrEqual(0);expect(detailOrder.notes).toBeGreaterThan(detailOrder.description);expect(detailOrder.materials).toBeGreaterThan(detailOrder.notes);expect(detailOrder.edit).toBeGreaterThan(detailOrder.materials);
});

test('Volunteer repeats an activity on the same day and sees notes and materials inline',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();const add=page.getByRole('button',{name:/Adicionar atividade$/}).first();await expect(add).toBeVisible();await add.click();
  await page.locator('#actName').fill('Atividade repetida E2E');await page.locator('#actDesc').fill('Descrição da atividade');await page.locator('#actNotes').fill('Levar água');await page.locator('#actMaterials').fill('Bola');await page.locator('#actTime').fill('09:00');
  await page.locator('#volunteerRepeatBlock').getByRole('button',{name:/Adicionar horário$/}).click();await page.locator('#volunteerRepeatList input[data-repeat-time]').fill('10:30');await page.locator('#modalRoot').getByRole('button',{name:/Adicionar atividade$/}).click();
  const cards=page.locator('.activity-card').filter({hasText:'Atividade repetida E2E'});await expect(cards).toHaveCount(2,{timeout:20_000});await expect(cards.nth(0)).toContainText('Descrição da atividade');await expect(cards.nth(0)).toContainText('Levar água');await expect(cards.nth(0)).toContainText('Bola');await expect(cards.locator('.volunteer-info-button,.planning-note-button')).toHaveCount(0);
  const times=await cards.locator('h4').allTextContents();expect(times.some(value=>value.includes('09:00'))).toBe(true);expect(times.some(value=>value.includes('10:30'))).toBe(true);
});