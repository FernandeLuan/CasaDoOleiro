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
async function relogin(page,email,password,target){await page.evaluate(()=>window.OleiroAuth?.signOut?.());await login(page,email,password,target)}
const navAction=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});
async function openApprovedVolunteer(page){
  await navAction(page,'Voluntariado').click();
  const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});
  await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption('approved');await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();
  const item=list.locator('.list-item.clickable').filter({hasText:'Aprovado E2E'}).first();await expect(item).toBeVisible({timeout:20_000});await item.click();return page.locator('#modalRoot');
}
async function createProposal(page){
  await login(page,'approved@oleiro.test','Approved123!','portal');await navAction(page,'Agenda').click();
  const day=page.locator('#vday-2026-09-23');await expect(day).toBeVisible({timeout:20_000});await day.getByRole('button',{name:/Adicionar atividade/}).click();
  await page.locator('#actName').fill('Proposta reajuste R36');await page.locator('#actDesc').fill('Teste de reajuste pós-aprovação');await page.locator('#actTime').fill('14:30');await page.locator('#actPeriod').selectOption('Tarde');
  await page.locator('#modalRoot').getByRole('button',{name:/Enviar para análise/}).click();
  await expect.poll(()=>page.evaluate(()=>state.sessions.some(row=>row.activityName==='Proposta reajuste R36'&&row.postApprovalProposal===true&&row.reviewStatus==='analysis')),{timeout:20_000}).toBe(true);
}

test.beforeEach(async()=>{await seedEmulators()});

test('new approved proposal can be readjusted and resent by volunteer',async({page})=>{
  await createProposal(page);
  await relogin(page,'admin@oleiro.test','Admin123!','admin');const modal=await openApprovedVolunteer(page);
  const planTab=modal.getByRole('button',{name:/Planejamento/}).first();if(await planTab.count())await planTab.click();
  const day=modal.locator('details[data-plan-date="2026-09-23"]');await expect(day).toBeVisible({timeout:20_000});await day.evaluate(node=>{node.open=true});
  const card=day.locator('.admin-portal-activity-card').filter({hasText:'Proposta reajuste R36'});await expect(card).toBeVisible();await card.getByRole('button',{name:/Reajustar$/}).click();
  await page.locator('#postApprovalReajustNote').fill('Trocar o horário para 16:00.');await page.locator('#modalRoot').getByRole('button',{name:/Enviar reajuste/}).click();
  await expect.poll(()=>page.evaluate(async()=>{const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-approved-application'});const row=rows.find(item=>item.activityName==='Proposta reajuste R36');return row?.reviewStatus||''}),{timeout:20_000}).toBe('adjustments');

  await relogin(page,'approved@oleiro.test','Approved123!','portal');await navAction(page,'Agenda').click();
  const volunteerCard=page.locator('.activity-card.volunteer-session-card').filter({hasText:'Proposta reajuste R36'});await expect(volunteerCard).toBeVisible({timeout:20_000});await expect(volunteerCard).toContainText('Reajustar');
  const actions=volunteerCard.locator('.candidate-session-actions>.btn');await expect(actions).toHaveCount(2);
  const boxes=await actions.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {top:Math.round(r.top),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}));
  expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThanOrEqual(2);expect(boxes[0].left).toBeLessThan(boxes[1].left);expect(boxes.every(b=>b.width>0)).toBe(true);

  await volunteerCard.getByRole('button',{name:/Reajustar$/}).click();await page.locator('#actTime').fill('16:00');await page.locator('#actPeriod').selectOption('Tarde');await page.locator('#modalRoot').getByRole('button',{name:/Reenviar para análise|Enviar para análise/}).click();
  await expect.poll(()=>page.evaluate(async()=>{const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-approved-application'});const row=rows.find(item=>item.activityName==='Proposta reajuste R36');return row?`${row.reviewStatus}|${row.time}`:''}),{timeout:20_000}).toBe('analysis|16:00');
});
