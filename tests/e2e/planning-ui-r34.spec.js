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
const navAction=(page,label)=>page.getByRole('button',{name:new RegExp(`^.{0,3}${label}$`)});
async function openAdminPlanning(page,name){
  const desktop=page.locator('.admin-sidebar-nav-r62 button.admin-sidebar-item-r62').filter({hasText:'Planejamento'}).first();
  if(await desktop.isVisible().catch(()=>false))await desktop.click();else{const mobile=page.locator('#navRoot button.nav-btn').filter({hasText:'Planejamento'}).first();await expect(mobile).toHaveCount(1,{timeout:20_000});await mobile.evaluate(button=>button.click())}
  const board=page.locator('.planning-board-page');await expect(board).toBeVisible({timeout:20_000});
  const search=board.getByPlaceholder('Buscar voluntário por nome');await expect(search).toBeVisible();await search.fill(name);
  const selected=board.locator('.planning-board-selected').filter({hasText:name});await expect(selected).toBeVisible({timeout:20_000});await selected.getByRole('button',{name:/Abrir perfil/}).click();
  const detail=page.locator('.planning-detail-page');await expect(detail).toBeVisible({timeout:20_000});await expect(detail.locator('.planning-page-loading')).toHaveCount(0,{timeout:20_000});
  return detail.locator('.planning-page-content');
}
async function expectHorizontal(buttons){
  await expect(buttons).toHaveCount(3);
  await expect(buttons.nth(0)).toContainText('Editar');await expect(buttons.nth(1)).toContainText('Mover');await expect(buttons.nth(2)).toContainText('Excluir');
  const boxes=await buttons.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {top:Math.round(r.top),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}));
  expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThanOrEqual(2);
  expect(boxes[0].left).toBeLessThan(boxes[1].left);expect(boxes[1].left).toBeLessThan(boxes[2].left);expect(boxes.every(b=>b.width>0)).toBe(true);
}

test.beforeEach(async()=>{await seedEmulators()});

test('Editar Mover e Excluir stay on the same row in Admin planning',async({page})=>{
  await login(page);const planning=await openAdminPlanning(page,'Voluntário E2E');
  const day=planning.locator('details[data-plan-date="2026-09-15"]');await expect(day).toBeVisible({timeout:20_000});if((await day.getAttribute('open'))===null)await day.locator('summary').click();await expect(day).toHaveAttribute('open','');
  const card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toBeVisible();await expectHorizontal(card.locator('.admin-session-manage-actions>.btn'));
});

test('Editar Mover e Excluir stay on the same row in candidate portal planning',async({page})=>{
  await signIn(page,'voluntario@oleiro.test','Volunteer123!','portal');await navAction(page,'Planejamento').click();
  const card=page.locator('.activity-card.volunteer-session-card').filter({hasText:'Oficina candidato E2E'}).first();await expect(card).toBeVisible({timeout:20_000});
  await expectHorizontal(card.locator('.candidate-session-actions>.btn'));
});
