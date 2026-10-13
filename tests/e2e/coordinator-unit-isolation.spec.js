import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={
  apiKey:'demo-api-key',
  authDomain:'demo-casadooleiro.firebaseapp.com',
  projectId:'demo-casadooleiro',
  appId:'1:123:web:e2e'
};

test.beforeEach(async()=>seedEmulators());

test('coordinator screens query only assigned-unit records',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`
  }));
  await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{
    try{return !!(await window.OleiroFirebase?.ready)?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}
  },undefined,{timeout:30_000});
  await page.locator('#email').fill('coordinator@oleiro.test');
  await page.locator('#password').fill('Coordinator123!');
  await page.locator('#loginButton').click();
  await expect(page).toHaveURL(url=>url.pathname.startsWith('/admin/'),{timeout:30_000});
  await page.waitForFunction(()=>window.state?.currentSession?.user?.role==='coordinator'&&typeof window.OleiroServices?.planning?.listScheduleRange==='function',undefined,{timeout:20_000});

  const result=await page.evaluate(async()=>{
    const services=window.OleiroServices;
    const read=async task=>{try{return {value:await task()}}catch(error){return {error:String(error?.message||error)}}};
    const [applications,foreignApplications,sessions,pendingChanges,pendingCount,arrivals,occupancy]=await Promise.all([
      read(()=>services.applications.list({status:'all',unit:'all',limit:50})),
      read(()=>services.applications.list({status:'all',unit:'indaial',limit:50})),
      read(()=>services.planning.listScheduleRange({from:'2026-09-01',to:'2026-09-30'})),
      read(()=>services.planning.listPendingChanges({limit:100})),
      read(()=>services.applications.countStatus('pending')),
      read(()=>services.applications.listUpcoming({field:'stayStart',from:'2026-09-01',to:'2026-09-30',limit:20})),
      read(()=>services.applications.listOccupancyMonth('2026-09',{unitId:'all'}))
    ]);
    return {
      visibleUnits:(window.state.units||[]).map(row=>row.id),
      applications:applications.value?.items?.map(row=>row.unitId),
      foreignApplications:foreignApplications.value?.items,
      sessions:sessions.value?.map(row=>row.unitId),
      pendingChanges:pendingChanges.value?.map(row=>row.unitId),
      pendingCount:pendingCount.value,
      arrivals:arrivals.value?.map(row=>row.unitId),
      occupancy:occupancy.value?.map(row=>row.unitId),
      errors:[applications,foreignApplications,sessions,pendingChanges,pendingCount,arrivals,occupancy].map(row=>row.error).filter(Boolean)
    };
  });

  expect(result.errors).toEqual([]);
  expect(result.visibleUnits).toEqual(['rodeio']);
  expect(result.applications.length).toBeGreaterThan(0);
  expect(result.applications.every(unitId=>unitId==='rodeio')).toBe(true);
  expect(result.foreignApplications).toEqual([]);
  expect(result.sessions.length).toBeGreaterThan(0);
  expect(result.sessions.every(unitId=>unitId==='rodeio')).toBe(true);
  expect(result.pendingChanges.every(unitId=>unitId==='rodeio')).toBe(true);
  expect(result.pendingCount).toBeGreaterThan(0);
  expect(result.arrivals.every(unitId=>unitId==='rodeio')).toBe(true);
  expect(result.occupancy.every(unitId=>unitId==='rodeio')).toBe(true);
});

test('unassigned activity assistant cannot reuse cached occupancy from another scope',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`
  }));
  await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{
    try{return !!(await window.OleiroFirebase?.ready)?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}
  },undefined,{timeout:30_000});
  await page.locator('#email').fill('assistant@oleiro.test');
  await page.locator('#password').fill('Assistant123!');
  await page.locator('#loginButton').click();
  await expect(page).toHaveURL(/\\/admin\\//,{timeout:30_000});
  await page.waitForFunction(()=>window.state?.currentSession?.user?.role==='activity_assistant'&&typeof window.navigateManager==='function',undefined,{timeout:20_000});
  await page.evaluate(()=>{
    const session=state.currentSession,user=session.user;
    state.r31OccupancyMonth='2026-09';
    state.r31OccupancyScopeKey=JSON.stringify([session.uid,user.role,[...(user.unitIds||[])].sort()]);
    state.r31OccupancyCache={'2026-09|rodeio':{at:Date.now(),rows:[{id:'stale',unitId:'rodeio',status:'approved',inactive:false,from:'2026-09-01',to:'2026-09-30',name:'DADO EM CACHE ANTIGO',country:'Brasil'}]}};
    state.r31OccupancyRows=state.r31OccupancyCache['2026-09|rodeio'].rows;
    user.unitIds=[];
    navigateManager('occupancy');
  });
  await expect(page.locator('.occupancy-day.has-people')).toHaveCount(0);
  await expect(page.locator('.occupancy-page-screen')).toContainText('Nenhuma unidade foi atribuída a este usuário.');
});
