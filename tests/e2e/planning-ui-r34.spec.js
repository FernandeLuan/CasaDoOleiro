import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};
async function prepare(page){
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}));
}
async function signIn(page,email,password,target){
  await prepare(page);await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},undefined,{timeout:30_000});
  await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#loginButton').click();await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000});
}
async function login(page){await signIn(page,'admin@oleiro.test','Admin123!','admin')}
async function openPlanningBoardVolunteer(page,name){
  await navAction(page,'Planejamento').click();
  await expect(page.locator('.planning-board-page')).toBeVisible({timeout:20_000});
  await page.evaluate(()=>window.setPlanningBoardView('volunteer'));
  const card=page.locator('.planning-board-person-card').filter({hasText:name}).first();
  await expect(card).toBeVisible({timeout:20_000});
  await card.getByRole('button',{name:/Abrir planejamento/}).click();
  await expect(page.locator('.planning-detail-page')).toBeVisible({timeout:20_000});
}const navAction=(page,label)=>page.getByRole('navigation').getByRole('button',{name:new RegExp(`^.{0,3}${label}$`)});
async function openPendingVolunteer(page){
  await navAction(page,'Voluntariado').click();const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});
  const apply=async()=>{await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption('pending');await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000})};
  await apply();let item=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();if(!(await item.isVisible().catch(()=>false))&&await page.getByText('Não foi possível aplicar os filtros.').count()){await apply();item=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first()}
  await expect(item).toBeVisible({timeout:20_000});await item.click();const detail=page.locator('#app');await expect(detail.locator('.person-refactor-tabs button.active')).toContainText('Planejamento',{timeout:20_000});return detail;
}
async function expectHorizontal(buttons){
  await expect(buttons).toHaveCount(3);
  await expect(buttons.nth(0)).toContainText('Editar');await expect(buttons.nth(1)).toContainText('Mover');await expect(buttons.nth(2)).toContainText('Excluir');
  const boxes=await buttons.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {top:Math.round(r.top),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}));
  expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThanOrEqual(2);
  expect(boxes[0].left).toBeLessThan(boxes[1].left);expect(boxes[1].left).toBeLessThan(boxes[2].left);expect(boxes.every(b=>b.width>0)).toBe(true);
}

test.beforeEach(async()=>{await seedEmulators()});

test('Admin planning exposes edit and move in the compact activity action menu',async({page})=>{
  await login(page);const detail=await openPendingVolunteer(page);
  const day=detail.locator('.planning-person-day[data-plan-date="2026-09-15"]');await expect(day).toBeVisible({timeout:20_000});
  const card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toBeVisible();
  await expect(card.locator('.admin-session-manage-actions')).toHaveCount(0);
  const trigger=card.locator('.planning-activity-trigger');await expect(trigger).toBeVisible();await trigger.click();
  await expect(card.getByRole('button',{name:/Editar$/})).toBeVisible();await expect(card.getByRole('button',{name:/Mover$/})).toBeVisible();
});

test('Editar Mover e Excluir stay on the same row in candidate portal planning',async({page})=>{
  await signIn(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();
  const card=page.locator('.activity-card.volunteer-session-card').filter({hasText:'Oficina candidato E2E'}).first();await expect(card).toBeVisible({timeout:20_000});
  await expectHorizontal(card.locator('.candidate-session-actions>.btn'));
});


test('Admin WhatsApp remains disabled when the volunteer has no valid activity',async({page})=>{
  await login(page);await openPlanningBoardVolunteer(page,'Indaial E2E');
  const button=page.locator('.admin-planning-share-bar .planning-share-action');
  await expect(button).toBeVisible();await expect(button).toBeDisabled({timeout:20_000});
  await expect(button).toContainText('Sem atividades para compartilhar');
  await expect(page.locator('.admin-planning-share-bar')).not.toContainText('Adicione uma atividade válida');
});

test('Admin WhatsApp button hands the message to the native launcher and clears the spinner',async({page})=>{
  await login(page);
  await openPlanningBoardVolunteer(page,'Voluntário E2E');
  await page.evaluate(()=>{
    window.__adminSharedMessage='';
    window.OleiroPlanningShare.openNativeWhatsApp=(message)=>{window.__adminSharedMessage=String(message||'');return true};
  });
  const button=page.locator('.admin-planning-share-bar .planning-share-action');
  await expect(button).toBeEnabled({timeout:20_000});
  await button.click();
  await expect.poll(()=>page.evaluate(()=>window.__adminSharedMessage)).toContain('Voluntário E2E');
  await expect(button).toBeDisabled();await expect(button).toContainText('Compartilhado');
  const icon=button.locator('i');await expect(icon).toHaveClass(/fa-whatsapp/);await expect(icon).not.toHaveClass(/fa-spin/);
});

test('Admin inactivation is persisted in History with the actor display name',async({page})=>{
  await login(page);await openPlanningBoardVolunteer(page,'Aprovado E2E');
  await page.locator('.planning-profile-tabs').getByRole('button',{name:'Conta'}).click();
  const riskAction=page.locator('.account-danger-zone .account-risk-lifecycle');
  await expect(riskAction).toContainText('Inativar usuário');
  await riskAction.click();
  await expect(page.locator('#modalRoot')).toContainText('Inativar usuário?');
  await page.locator('#modalRoot').getByRole('button',{name:'Inativar usuário',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>state.candidates.find(row=>row.id==='e2e-approved-application')?.active),{timeout:20_000}).toBe(false);
  const historyTab=page.locator('.planning-detail-page .planning-profile-tabs').getByRole('button',{name:'Histórico'});
  await expect(historyTab).toBeVisible({timeout:20_000});
  await historyTab.click();
  const history=page.locator('.planning-detail-page .planning-history-r71');
  await expect(history).toBeVisible({timeout:20_000});
  await expect(history).toContainText('Perfil inativado',{timeout:20_000});
  await expect(history).toContainText('Administrador E2E');
  await expect(history).not.toContainText('admin@oleiro.test');
});
