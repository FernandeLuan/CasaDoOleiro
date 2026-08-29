// Round 32 focused regression: activity-scoped reasons, ready state and emergency contact cleanup.
import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};
async function prepare(page){await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}))}
async function login(page,email,password,target){await prepare(page);await page.goto('/?emulator=1');await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#loginButton').click();await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000})}
async function relogin(page,email,password,target){await page.evaluate(()=>window.OleiroAuth?.signOut?.());await login(page,email,password,target)}
const navAction=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});
async function openVolunteer(page,status,name){await navAction(page,'Voluntariado').click();const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption(status);await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});const item=list.locator('.list-item.clickable').filter({hasText:name}).first();await expect(item).toBeVisible({timeout:20_000});await item.click();return page.locator('#modalRoot')}

test.beforeEach(async()=>{await seedEmulators()});

test('Adjustment reason stays on the requested activity and edited day turns green before resend',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');const modal=await openVolunteer(page,'pending','Voluntário E2E');
  const day=modal.locator('details[data-plan-date="2026-09-15"]');await expect(day).toBeVisible({timeout:20_000});await day.locator('summary').click();let card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await card.getByRole('button',{name:/Ajustar$/}).click();
  await page.locator('#r31SessionAdjustNote').fill('Alterar somente o horário desta atividade.');await page.locator('#r31SessionAdjustSave').click();
  const reopened=modal.locator('details[data-plan-date="2026-09-15"]');card=reopened.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toHaveClass(/r31-card-warning/);
  const dayState=reopened.locator('.r31-day-signal.warning');await expect(dayState).toHaveText('Reajustar');await expect(dayState.locator('i')).toHaveCount(0);
  const activityInfo=card.locator('.r32-session-signal.warning');await expect(activityInfo).toBeVisible();await activityInfo.click();await expect(page.locator('#r32SessionSignalPopover')).toContainText('Alterar somente o horário desta atividade.');

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();let volunteerCard=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await expect(volunteerCard.locator('.r32-session-signal.warning')).toBeVisible();await volunteerCard.getByRole('button',{name:/Ajustar atividade/}).click();await page.locator('#r31ActTime').fill('16:00');await page.locator('#r31VolunteerAdjustSave').click();
  volunteerCard=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await expect(volunteerCard).toHaveClass(/r32-card-ready/);await expect(volunteerCard).toContainText('Ajustado');await expect(page.locator('#vday-2026-09-15 .r32-day-state-badge.success')).toHaveText('Ajustado');
  await page.locator('.plan-summary').getByRole('button',{name:/Reenviar planejamento/}).click();await expect.poll(()=>page.evaluate(()=>{const s=state.sessions.find(row=>row.id==='e2e-candidate-session');return `${state.currentApplication?.status}|${s?.adminAdjustmentStatus}|${s?.time}`}),{timeout:20_000}).toBe('analysis|analysis|16:00');
});

test('Admin emergency contact has no avatar or decorative person icon',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');const modal=await openVolunteer(page,'pending','Voluntário E2E');await modal.getByRole('button',{name:/Conta/}).click();
  const emergency=modal.locator('.account-emergency-card');await expect(emergency).toBeVisible({timeout:20_000});await expect(emergency.locator('.account-person-icon')).toHaveCount(0);await expect(emergency.locator('.avatar')).toHaveCount(0);await expect(emergency).toContainText('Contato de emergência');
});
