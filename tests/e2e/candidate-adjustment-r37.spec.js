// Round 37 focused regression for candidate adjustments with new draft activities.
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
async function openVolunteerByStatus(page,status,name){
  const list=page.locator('#candidateList');await navAction(page,'Voluntariado').click();
  try{await expect(list).toBeVisible({timeout:10_000})}catch{await navAction(page,'Voluntariado').click();await expect(list).toBeVisible({timeout:20_000})}
  await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption(status);await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  const item=list.locator('.list-item.clickable').filter({hasText:name}).first();await expect(item).toBeVisible({timeout:20_000});await item.click();return page.locator('#modalRoot');
}
async function ensureDetailsOpen(details){await expect(details).toBeVisible();await details.evaluate(node=>{node.open=true});await expect(details).toHaveJSProperty('open',true)}

async function addActivity(page,date,name,time){
  const day=page.locator(`#vday-${date}`);await expect(day).toBeVisible({timeout:20_000});await day.getByRole('button',{name:/Adicionar atividade/}).click();
  await page.locator('#actName').fill(name);await page.locator('#actTime').fill(time);await page.locator('#modalRoot').getByRole('button',{name:/Adicionar atividade/}).click();
  await expect(page.locator('.activity-card').filter({hasText:name})).toBeVisible({timeout:20_000});
}

test.beforeEach(async()=>{await seedEmulators()});

test('analysis stays locked; requested adjustment can add new drafts and resubmit them together',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();

  // Build a second pre-existing activity so the adjustment can prove that unrelated old
  // activities remain locked after the Admin asks for one session-specific change.
  await addActivity(page,'2026-09-16','Atividade antiga E2E','10:00');
  await page.getByRole('button',{name:/Enviar planejamento/}).click();
  await expect.poll(()=>page.evaluate(()=>state.currentApplication?.status),{timeout:20_000}).toBe('analysis');
  await expect(page.getByRole('button',{name:/Adicionar atividade/})).toHaveCount(0);
  await expect(page.locator('.activity-card .activity-actions')).toHaveCount(0);

  await relogin(page,'admin@oleiro.test','Admin123!','admin');const modal=await openVolunteerByStatus(page,'analysis','Voluntário E2E');
  const day=modal.locator('details[data-plan-date="2026-09-15"]');await ensureDetailsOpen(day);const card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toBeVisible();
  await card.getByRole('button',{name:/Pedir ajuste$/}).click();await page.locator('#r31SessionAdjustNote').fill('Trocar o horário desta atividade.');await page.locator('#r31SessionAdjustSave').click();
  await expect.poll(()=>page.evaluate(async()=>{const app=await window.OleiroServices.applications.getById('e2e-application');return app?.status}),{timeout:20_000}).toBe('adjustments');

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();
  await expect(page.getByRole('button',{name:/Adicionar atividade/}).first()).toBeVisible({timeout:20_000});
  const requested=page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'});await expect(requested.getByRole('button',{name:/Ajustar atividade/})).toBeVisible();await expect(requested.getByRole('button',{name:/Excluir/})).toHaveCount(0);
  const unrelated=page.locator('.activity-card').filter({hasText:'Atividade antiga E2E'});await expect(unrelated).toBeVisible();await expect(unrelated.locator('.activity-actions')).toHaveCount(0);

  await addActivity(page,'2026-09-17','Nova no reajuste E2E','14:30');
  let fresh=page.locator('.activity-card').filter({hasText:'Nova no reajuste E2E'});await expect(fresh).toContainText('Nova atividade');await expect(fresh.locator('.activity-actions')).toBeVisible();await expect(fresh.getByRole('button',{name:/Editar/})).toBeVisible();await expect(fresh.getByRole('button',{name:/Excluir/})).toBeVisible();

  // Reload proves that the draft remains recognized from persisted timestamps, not only
  // from temporary in-memory state.
  await page.reload();await expect(page).toHaveURL(/\/portal\//,{timeout:30_000});await navAction(page,'Planejamento').click();
  fresh=page.locator('.activity-card').filter({hasText:'Nova no reajuste E2E'});await expect(fresh).toContainText('Nova atividade',{timeout:20_000});await expect(fresh.getByRole('button',{name:/Editar/})).toBeVisible();await expect(page.locator('.activity-card').filter({hasText:'Atividade antiga E2E'}).locator('.activity-actions')).toHaveCount(0);

  await page.locator('.activity-card').filter({hasText:'Oficina candidato E2E'}).getByRole('button',{name:/Ajustar atividade/}).click();await page.locator('#r31ActTime').fill('16:00');await page.locator('#r31VolunteerAdjustSave').click();
  await page.getByRole('button',{name:/Reenviar planejamento/}).click();
  await expect.poll(()=>page.evaluate(()=>state.currentApplication?.status),{timeout:20_000}).toBe('analysis');
  await expect(page.getByRole('button',{name:/Adicionar atividade/})).toHaveCount(0);await expect(page.locator('.activity-card').filter({hasText:'Nova no reajuste E2E'}).locator('.activity-actions')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(async()=>{const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-application'});return rows.some(row=>row.activityName==='Nova no reajuste E2E'&&row.status==='proposed')}),{timeout:20_000}).toBe(true);
});
