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
  await page.locator('#email').fill('admin@oleiro.test');await page.locator('#password').fill('Admin123!');await page.locator('#loginButton').click();await expect(page).toHaveURL(/\/admin\//,{timeout:30_000});
}
const navAction=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});
async function openPendingVolunteer(page){
  await navAction(page,'Voluntariado').click();const list=page.locator('#candidateList');await expect(list).toBeVisible({timeout:20_000});
  const apply=async()=>{await page.locator('#app').getByRole('button',{name:/Filtros/}).click();await page.locator('#candidateStatusFilter').selectOption('pending');await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000})};
  await apply();let item=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();if(!(await item.isVisible().catch(()=>false))&&await page.getByText('Não foi possível aplicar os filtros.').count()){await apply();item=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first()}
  await expect(item).toBeVisible({timeout:20_000});await item.click();return page.locator('#modalRoot');
}

test.beforeEach(async()=>{await seedEmulators()});

test('Editar Mover e Excluir stay on the same row in Admin planning',async({page})=>{
  await login(page);const modal=await openPendingVolunteer(page);const planning=modal.getByRole('button',{name:/Planejamento/}).first();if(await planning.count())await planning.click();
  const day=modal.locator('details[data-plan-date="2026-09-15"]');await expect(day).toBeVisible({timeout:20_000});if((await day.getAttribute('open'))===null)await day.locator('summary').click();await expect(day).toHaveAttribute('open','');
  const card=day.locator('.admin-portal-activity-card').filter({hasText:'Oficina candidato E2E'});await expect(card).toBeVisible();const buttons=card.locator('.admin-session-manage-actions>.btn');await expect(buttons).toHaveCount(3);
  await expect(buttons.nth(0)).toContainText('Editar');await expect(buttons.nth(1)).toContainText('Mover');await expect(buttons.nth(2)).toContainText('Excluir');
  const boxes=await buttons.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {top:Math.round(r.top),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}));
  expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThanOrEqual(2);
  expect(boxes[0].left).toBeLessThan(boxes[1].left);expect(boxes[1].left).toBeLessThan(boxes[2].left);expect(boxes.every(b=>b.width>0)).toBe(true);
});
