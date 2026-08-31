// Round 35 regression: planning approval state, post-approval readjustment and time/period consistency.
import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};
async function prepare(page){await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}))}
async function login(page,email,password,target){await prepare(page);await page.goto('/?emulator=1');await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#loginButton').click();await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000})}
async function relogin(page,email,password,target){await page.evaluate(()=>window.OleiroAuth?.signOut?.());await login(page,email,password,target)}
const navAction=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});
async function openVolunteer(page,status,name){
  await navAction(page,'Voluntariado').click();const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});
  await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption(status);await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  const item=list.locator('.list-item.clickable').filter({hasText:name}).first();await expect(item).toBeVisible({timeout:20_000});await item.click();return page.locator('#modalRoot');
}
async function ensureDay(modal,date){const day=modal.locator(`details[data-plan-date="${date}"]`);await expect(day).toBeVisible({timeout:20_000});await day.evaluate(node=>{node.open=true});return day}

async function createApprovedProposal(page,name,time='15:15'){
  await navAction(page,'Agenda').click();const day=page.locator('#vday-2026-09-23');await expect(day).toBeVisible({timeout:20_000});await day.getByRole('button',{name:/Adicionar atividade/}).click();
  await page.locator('#actName').fill(name);await page.locator('#actTime').fill(time);await page.locator('#modalRoot').getByRole('button',{name:/Enviar para análise/}).click();
  await expect.poll(()=>page.evaluate(activityName=>state.sessions.some(row=>row.activityName===activityName&&row.postApprovalProposal===true&&row.reviewStatus==='analysis'),name),{timeout:20_000}).toBe(true);
}

test.beforeEach(async()=>{await seedEmulators()});

test('new activity has no fake 15:15 default and period follows the selected time',async({page})=>{
  await login(page,'approved@oleiro.test','Approved123!','portal');await navAction(page,'Agenda').click();const day=page.locator('#vday-2026-09-23');await expect(day).toBeVisible({timeout:20_000});await day.getByRole('button',{name:/Adicionar atividade/}).click();
  await expect(page.locator('#actTime')).toHaveValue('');await expect(page.locator('#actPeriod')).toHaveValue('Sem preferência');
  await page.locator('#actTime').fill('15:15');await expect(page.locator('#actPeriod')).toHaveValue('Tarde');
  await page.locator('#actTime').fill('20:10');await expect(page.locator('#actPeriod')).toHaveValue('Noite');
});

test('post-approval activity returned for readjustment stays horizontal and resubmits without permission error',async({page})=>{
  const activityName='Nova atividade reajuste E2E';
  await login(page,'approved@oleiro.test','Approved123!','portal');await createApprovedProposal(page,activityName);

  await relogin(page,'admin@oleiro.test','Admin123!','admin');const modal=await openVolunteer(page,'approved','Aprovado E2E');const day=await ensureDay(modal,'2026-09-23');let card=day.locator('.admin-portal-activity-card').filter({hasText:activityName});await expect(card).toBeVisible();await card.getByRole('button',{name:/Reajustar$/}).click();await page.locator('#postApprovalReajustNote').fill('Trocar o horário antes de aprovar.');await page.locator('#modalRoot').getByRole('button',{name:/Enviar reajuste/}).click();

  await relogin(page,'approved@oleiro.test','Approved123!','portal');await navAction(page,'Agenda').click();card=page.locator('.activity-card.post-approval-proposal').filter({hasText:activityName});await expect(card).toBeVisible({timeout:20_000});const buttons=card.locator('.candidate-session-actions>.btn');await expect(buttons).toHaveCount(2);const tops=await buttons.evaluateAll(nodes=>nodes.map(node=>Math.round(node.getBoundingClientRect().top)));expect(Math.max(...tops)-Math.min(...tops)).toBeLessThanOrEqual(2);
  await card.getByRole('button',{name:/Reajustar/}).click();await expect(page.locator('#actName')).toHaveValue(activityName);await page.locator('#actTime').fill('16:45');await expect(page.locator('#actPeriod')).toHaveValue('Tarde');await page.locator('#modalRoot').getByRole('button',{name:/Reenviar para análise|Enviar para análise/}).click();
  await expect.poll(()=>page.evaluate(async name=>{const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-approved-application'});const row=rows.find(item=>item.activityName===name);return row?`${row.reviewStatus}|${row.time}|${row.period}`:''},activityName),{timeout:20_000}).toBe('analysis|16:45|Tarde');
});

test('approving planning resolves Ajustado instead of carrying the tag into approved planning',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');let modal=await openVolunteer(page,'pending','Voluntário E2E');let day=await ensureDay(modal,'2026-09-15');let card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await card.getByRole('button',{name:/Pedir ajuste/}).click();await page.locator('#r31SessionAdjustNote').fill('Trocar o horário.');await page.locator('#r31SessionAdjustSave').click();

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();card=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await card.getByRole('button',{name:/Ajustar atividade/}).click();await page.locator('#r31ActTime').fill('16:00');await page.locator('#r31VolunteerAdjustSave').click();await expect(page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'})).toContainText('Ajustado');

  await relogin(page,'admin@oleiro.test','Admin123!','admin');modal=await openVolunteer(page,'adjustments','Voluntário E2E');day=await ensureDay(modal,'2026-09-15');await expect(day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'})).toContainText('Ajustado');const approve=modal.getByRole('button',{name:/Aprovar$/}).last();await expect(approve).toBeVisible();await approve.click();await page.locator('#approvePlanningConfirmR25').click();
  await expect.poll(()=>page.evaluate(async()=>{const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-application'});const row=rows.find(item=>item.id==='e2e-candidate-session');return row?`${row.status}|${row.adminAdjustmentStatus}`:''}),{timeout:20_000}).toBe('plan_approved|approved');

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();card=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toContainText('Planejamento aprovado');await expect(card).not.toContainText('Ajustado');
});
