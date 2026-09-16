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
  await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#loginButton').click();await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000});await page.waitForFunction(targetName=>typeof window.render==='function'&&(targetName==='portal'?typeof window.navigateVolunteer==='function':targetName==='admin'?typeof window.navigateManager==='function':true),target,{timeout:20_000});
}
const navAction=(page,label)=>page.getByRole('button',{name:new RegExp(`^.{0,3}${label}$`)});
async function openPendingVolunteer(page){
  await navAction(page,'Voluntariado').click();
  const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption('pending');await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();
  await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});const candidate=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();await expect(candidate).toBeVisible({timeout:20_000});await candidate.click();const detail=page.locator('#app');await expect(detail.locator('.person-refactor-tabs button.active')).toContainText('Planejamento',{timeout:20_000});return detail;
}

test.beforeEach(async()=>{await seedEmulators()});

test('Admin account keeps emergency contact inside the consolidated participant card',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');const detail=await openPendingVolunteer(page);await detail.getByRole('button',{name:/Conta$/}).click();
  const account=detail.locator('.admin-account-refactor.account-consolidated-r70');await expect(account).toBeVisible({timeout:20_000});
  const person=account.locator('.account-contact-card-r70 .account-person-row').first();await expect(person).toContainText('Voluntário E2E');
  const emergency=person.locator('.account-person-emergency-r70, .account-person-emergency-inline-r71');await expect(emergency).toBeVisible();await expect(emergency).toContainText('Contato de emergência');
  const edit=emergency.getByRole('button',{name:/Adicionar(?: contato)?|Editar(?: contato)?/});await expect(edit).toBeVisible();await expect(edit.locator('i.fa-pen, i.fa-plus')).toHaveCount(1);
});

test('Admin creates same activity in two periods with independent multi-group selections',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');const detail=await openPendingVolunteer(page);const day=detail.locator('.planning-person-day[data-plan-date]').first();await expect(day).toBeVisible({timeout:20_000});const add=day.locator('.planning-person-add');await expect(add).toBeVisible();await add.click();
  await page.locator('#managerActName').fill('Oficina repetida E2E');await page.locator('#managerActDesc').fill('Descrição visível no card');await page.locator('#managerActNotes').fill('Observação visível');await page.locator('#managerActMaterials').fill('Cartolina');await page.locator('#managerActPeriod').selectOption({label:'Tarde'});
  await expect(page.locator('#managerActTime')).toHaveCount(0);
  const primary=page.locator('[data-group-picker="manager-primary"]');await primary.locator('input[value="A"]').check();await primary.locator('input[value="B"]').check();await expect(page.locator('#managerActGroup')).toHaveValue('A + B');
  await page.locator('#adminRepeatBlock').getByRole('button',{name:/Adicionar sessão$/}).click();const repeat=page.locator('#adminRepeatList .activity-repeat-row').first();await repeat.locator('select[data-repeat-period]').selectOption('Noite');await repeat.locator('input[value="A"]').uncheck();await repeat.locator('input[value="B"]').uncheck();await repeat.locator('input[value="C"]').check();
  await page.locator('#managerActSave').click();await expect(page.locator('#managerActSave')).toHaveCount(0,{timeout:20_000});
  await expect.poll(()=>page.evaluate(()=>Object.values(state.adminPlanPageCache||{}).flatMap(cache=>cache?.sessions||[]).filter(row=>row.activityName==='Oficina repetida E2E').map(row=>({period:row.period,groupId:row.groupId}))),{timeout:20_000}).toHaveLength(2);
  const stored=await page.evaluate(()=>Object.values(state.adminPlanPageCache||{}).flatMap(cache=>cache?.sessions||[]).filter(row=>row.activityName==='Oficina repetida E2E').map(row=>({period:row.period,groupId:row.groupId,hasTime:Object.hasOwn(row,'time')})).sort((a,b)=>a.period.localeCompare(b.period)));
  expect(stored).toEqual([{period:'Noite',groupId:'C',hasTime:false},{period:'Tarde',groupId:'A + B',hasTime:false}]);
  const activityRows=detail.locator('.admin-portal-activity-card').filter({hasText:'Oficina repetida E2E'});await expect(activityRows).toHaveCount(2,{timeout:20_000});const text=(await activityRows.allTextContents()).join(' ');expect(text).toContain('Tarde');expect(text).toContain('Noite');expect(text).toContain('Descrição visível no card');expect(text).toContain('Observação visível');expect(text).toContain('Cartolina');
});

test('Volunteer repeats an activity on the same day and sees notes and materials inline',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();const add=page.getByRole('button',{name:/Adicionar atividade$/}).first();await expect(add).toBeVisible();await add.click();
  await page.locator('#actName').fill('Atividade repetida E2E');await page.locator('#actDesc').fill('Descrição da atividade');await page.locator('#actNotes').fill('Levar água');await page.locator('#actMaterials').fill('Bola');await page.locator('#actPeriod').selectOption('Manhã');
  await page.locator('#volunteerRepeatBlock').getByRole('button',{name:/Adicionar sessão$/}).click();await page.locator('#volunteerRepeatList select[data-repeat-period]').selectOption('Noite');await page.locator('#modalRoot').getByRole('button',{name:/Adicionar atividade$/}).click();
  const cards=page.locator('.activity-card').filter({hasText:'Atividade repetida E2E'});await expect(cards).toHaveCount(2,{timeout:20_000});await expect(cards.nth(0)).toContainText('Descrição da atividade');await expect(cards.nth(0)).toContainText('Levar água');await expect(cards.nth(0)).toContainText('Bola');await expect(cards.locator('.volunteer-info-button,.planning-note-button')).toHaveCount(0);
  const titles=await cards.locator('h4').allTextContents();expect(titles).toEqual(['Atividade repetida E2E','Atividade repetida E2E']);await expect(cards.nth(0)).toContainText('Manhã');await expect(cards.nth(1)).toContainText('Noite');
});
