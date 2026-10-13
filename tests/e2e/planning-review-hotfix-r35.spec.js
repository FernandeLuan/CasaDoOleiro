// Round 35 regression: planning approval state, post-approval readjustment and time/period consistency.
import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};
async function prepare(page){await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}))}
async function login(page,email,password,target){await prepare(page);await page.goto('/?emulator=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});await page.locator('#email').fill(email);const passwordField=page.locator('#password');await passwordField.fill(password);await passwordField.press('Tab');await page.locator('#loginButton').press('Enter');await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000});await page.waitForFunction(targetName=>typeof window.render==='function'&&(targetName==='portal'?typeof window.navigateVolunteer==='function':targetName==='admin'?typeof window.navigateManager==='function':true),target,{timeout:20_000});if(target==='portal')await page.waitForFunction(()=>state.role==='volunteer'&&state.currentApplication?.id&&state.volunteerPlanningLoadedFor===String(state.currentApplication.id),undefined,{timeout:30_000});const dismissNotice=page.getByRole('button',{name:'Agora não',exact:true});if(await dismissNotice.isVisible().catch(()=>false))await dismissNotice.press('Enter')}
async function relogin(page,email,password,target){await page.evaluate(()=>window.OleiroAuth?.signOut?.());await login(page,email,password,target)}
const navAction=(page,label)=>page.getByRole('button',{name:new RegExp(`^.{0,3}${label}$`)});
async function openVolunteer(page,status,name){
  await navAction(page,'Voluntariado').click();const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});
  await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption(status);await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  const item=list.locator('.list-item.clickable').filter({hasText:name}).first();await expect(item).toBeVisible({timeout:20_000});await item.click();const detail=page.locator('#app');await expect(detail.locator('.person-refactor-tabs button.active')).toContainText('Planejamento',{timeout:20_000});return detail;
}
async function ensureDay(detail,date){const day=detail.locator(`.planning-person-day[data-plan-date="${date}"]`);await expect(day).toBeVisible({timeout:20_000});return day}
async function openAdminActions(card){const trigger=card.locator('.planning-activity-trigger');await expect(trigger).toBeVisible();await trigger.click()}
async function sessionState(page,applicationId,matcher){return page.evaluate(async({applicationId,matcher})=>{const rows=await window.OleiroServices.planning.listSessions({applicationId});const row=rows.find(item=>item.id===matcher||item.activityName===matcher);return row||null},{applicationId,matcher})}
async function sessionDocumentState(page,sessionId){return page.evaluate(async id=>{const context=await window.OleiroFirebase.ready,{firestore}=context.modules,snapshot=await firestore.getDocFromServer(firestore.doc(context.db,'activity_sessions',id));return snapshot.exists()?snapshot.data():null},sessionId)}
async function applicationDocumentState(page,applicationId){return page.evaluate(async id=>{const context=await window.OleiroFirebase.ready,{firestore}=context.modules,snapshot=await firestore.getDocFromServer(firestore.doc(context.db,'applications',id));return snapshot.exists()?snapshot.data():null},applicationId)}

async function createApprovedProposal(page,name,period='Tarde'){
  await navAction(page,'Agenda').click();const day=page.locator('#vday-2026-09-23');await expect(day).toBeVisible({timeout:20_000});await day.getByRole('button',{name:/Adicionar atividade/}).click();
  await page.locator('#actName').fill(name);await page.locator('#actPeriod').selectOption(period);await page.locator('#modalRoot').getByRole('button',{name:/Enviar para análise/}).click();
  await expect.poll(()=>page.evaluate(activityName=>state.sessions.some(row=>row.activityName===activityName&&row.postApprovalProposal===true&&row.reviewStatus==='analysis'),name),{timeout:20_000}).toBe(true);
}

test.beforeEach(async()=>{await seedEmulators()});

test('new activity has no exact-time field and defaults to no period preference',async({page})=>{
  await login(page,'approved@oleiro.test','Approved123!','portal');await navAction(page,'Agenda').click();const day=page.locator('#vday-2026-09-23');await expect(day).toBeVisible({timeout:20_000});await day.getByRole('button',{name:/Adicionar atividade/}).click();
  await expect(page.locator('#actTime')).toHaveCount(0);await expect(page.locator('#actPeriod')).toHaveValue('Sem preferência');
  await expect(page.locator('#actPeriod option')).toHaveText(['Sem preferência','Manhã','Tarde','Noite']);
});

test('post-approval activity returned for readjustment stays horizontal and resubmits without permission error',async({page})=>{
  const activityName='Nova atividade reajuste E2E';
  await login(page,'approved@oleiro.test','Approved123!','portal');await createApprovedProposal(page,activityName);

  await relogin(page,'admin@oleiro.test','Admin123!','admin');const modal=await openVolunteer(page,'approved','Aprovado E2E');const day=await ensureDay(modal,'2026-09-23');let card=day.locator('.admin-portal-activity-card').filter({hasText:activityName});await expect(card).toBeVisible();await openAdminActions(card);await card.getByRole('button',{name:/Reajustar$/}).click();const adjustmentNote=page.locator('#planningPostAdjustment');await expect(adjustmentNote).toBeVisible();await page.waitForTimeout(500);await adjustmentNote.fill('Trocar o período antes de aprovar.');await expect(adjustmentNote).toHaveValue('Trocar o período antes de aprovar.');await page.locator('#modalRoot').getByRole('button',{name:/Enviar reajuste/}).click();
  await expect(page.locator('#planningPostAdjustment')).toHaveCount(0,{timeout:20_000});
  await expect.poll(async()=>{const row=await sessionState(page,'e2e-approved-application',activityName);return row?.reviewStatus||''},{timeout:20_000}).toBe('adjustments');

  await relogin(page,'approved@oleiro.test','Approved123!','portal');await navAction(page,'Agenda').click();card=page.locator('.activity-card.post-approval-proposal').filter({hasText:activityName});await expect(card).toBeVisible({timeout:20_000});const buttons=card.locator('.candidate-session-actions>.btn');await expect(buttons).toHaveCount(2);const tops=await buttons.evaluateAll(nodes=>nodes.map(node=>Math.round(node.getBoundingClientRect().top)));expect(Math.max(...tops)-Math.min(...tops)).toBeLessThanOrEqual(2);
  await card.getByRole('button',{name:/Reajustar/}).click();await expect(page.locator('#actName')).toHaveValue(activityName);await expect(page.locator('#actTime')).toHaveCount(0);await page.locator('#actPeriod').selectOption('Noite');await page.locator('#modalRoot').getByRole('button',{name:/Reenviar para análise|Enviar para análise/}).click();
  await expect.poll(async()=>{const row=await sessionState(page,'e2e-approved-application',activityName);return row?`${row.reviewStatus}|${row.period}|${Object.hasOwn(row,'time')}`:''},{timeout:20_000}).toBe('analysis|Noite|false');
});

test('approving planning resolves Ajustado instead of carrying the tag into approved planning',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();await page.getByRole('button',{name:/Enviar planejamento/}).click();await expect.poll(()=>page.evaluate(()=>state.currentApplication?.status),{timeout:20_000}).toBe('analysis');
  await relogin(page,'admin@oleiro.test','Admin123!','admin');let modal=await openVolunteer(page,'analysis','Voluntário E2E');let day=await ensureDay(modal,'2026-09-15');let card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await openAdminActions(card);await card.getByRole('button',{name:/Pedir ajuste/}).click();const adjustNote=page.locator('#r31SessionAdjustNote');await adjustNote.fill('Trocar o período.');await expect(adjustNote).toHaveValue('Trocar o período.');await page.locator('#r31SessionAdjustSave').click();
  await expect(page.locator('#r31SessionAdjustNote')).toHaveCount(0,{timeout:20_000});
  await expect.poll(async()=>{const row=await sessionState(page,'e2e-application','e2e-candidate-session');return row?.adminAdjustmentStatus||''},{timeout:20_000}).toBe('requested');

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();card=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card.getByRole('button',{name:/Ajustar atividade/})).toBeVisible({timeout:20_000});await card.getByRole('button',{name:/Ajustar atividade/}).click();await expect(page.locator('#r31ActTime')).toHaveCount(0);await page.locator('#r31ActPeriod').selectOption('Noite');await page.locator('#r31VolunteerAdjustSave').click();await expect(page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'})).toContainText('Ajustado');

  await relogin(page,'admin@oleiro.test','Admin123!','admin');modal=await openVolunteer(page,'adjustments','Voluntário E2E');day=await ensureDay(modal,'2026-09-15');await expect(day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'})).toContainText('Ajustado');const approve=modal.getByRole('button',{name:/Aprovar planejamento/}).first();await expect(approve).toBeVisible();await approve.click();await page.locator('#approvePlanningConfirmR25').click();
  // Wait for the admin flow to finish its Firestore batch before signing out; getDocFromServer avoids optimistic local cache.
  await expect(page.locator('#approvePlanningConfirmR25')).toHaveCount(0,{timeout:30_000});
  await expect.poll(async()=>{const row=await sessionDocumentState(page,'e2e-candidate-session');return row?`${row.status}|${row.adminAdjustmentStatus}`:''},{timeout:30_000}).toBe('plan_approved|approved');
  await expect.poll(async()=>{const row=await applicationDocumentState(page,'e2e-application');return row?.status||''},{timeout:30_000}).toBe('meeting');

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');await page.reload({waitUntil:'domcontentloaded'});await expect(page).toHaveURL(/\/portal\//,{timeout:30_000});await expect(page.getByRole('navigation').getByRole('button',{name:/Planejamento/})).toBeVisible({timeout:30_000});await page.waitForFunction(()=>state.role==='volunteer'&&state.currentApplication?.id&&state.volunteerPlanningLoadedFor===String(state.currentApplication.id),undefined,{timeout:30_000});await expect.poll(()=>page.evaluate(()=>{const row=state.sessions.find(item=>item.id==='e2e-candidate-session');return row?`${state.currentApplication?.status}|${row.status}|${row.adminAdjustmentStatus}`:''}),{timeout:20_000}).toBe('meeting|plan_approved|approved');await navAction(page,'Planejamento').click();card=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toContainText('Planejamento aprovado');await expect(card).not.toContainText('Ajustado');
});
