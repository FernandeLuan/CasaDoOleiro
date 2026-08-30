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

test.beforeEach(async()=>{await seedEmulators()});

test('approved existing activity can be readjusted and resent by volunteer',async({page})=>{
  await login(page,'approved@oleiro.test','Approved123!','portal');
  await page.evaluate(async()=>{
    await window.OleiroServices.planning.requestExistingChange({
      sessionId:'e2e-approved-session',
      proposal:{time:'10:00',period:'Manhã'},
      reason:'Quero mudar o horário.'
    });
  });

  await relogin(page,'admin@oleiro.test','Admin123!','admin');
  await page.evaluate(async()=>{
    await window.OleiroServices.planning.reviewExistingChange({
      sessionId:'e2e-approved-session',decision:'adjustments',note:'Use 10:30.'
    });
  });

  await relogin(page,'approved@oleiro.test','Approved123!','portal');
  await navAction(page,'Agenda').click();
  const card=page.locator('.activity-card.volunteer-session-card').filter({hasText:'Atividade confirmada E2E'}).first();
  await expect(card).toBeVisible({timeout:20_000});await expect(card).toContainText('Reajustar');

  await page.evaluate(async()=>{
    await window.OleiroServices.planning.resubmitExistingChange({
      sessionId:'e2e-approved-session',
      proposal:{time:'10:30',period:'Manhã'},
      reason:'Ajustado conforme orientação.'
    });
  });
  const result=await page.evaluate(async()=>{
    const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-approved-application'}),row=rows.find(item=>item.id==='e2e-approved-session');
    return row?{status:row.status,review:row.changeReviewStatus,time:row.changeProposal?.time,period:row.changeProposal?.period}:null;
  });
  expect(result).toEqual({status:'change_requested',review:'analysis',time:'10:30',period:'Manhã'});
});

test('planning approval removes stale Ajustado state from candidate portal',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await page.evaluate(async()=>{
    await window.OleiroServices.planning.requestSessionAdjustment({
      applicationId:'e2e-application',sessionId:'e2e-candidate-session',note:'Ajuste final.',applicationStatus:'pending'
    });
  });

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');
  await page.evaluate(async()=>{
    await window.OleiroServices.planning.updateSession('e2e-candidate-session',{time:'16:00',period:'Tarde'});
    await window.OleiroServices.applications.submitPlanningWithSessionAdjustments('e2e-application',{sessionIds:['e2e-candidate-session']});
  });

  await relogin(page,'admin@oleiro.test','Admin123!','admin');
  await page.evaluate(async()=>{
    await window.OleiroServices.applications.approvePlanning('e2e-application',{participantUids:['e2e-volunteer']});
  });

  await relogin(page,'voluntario@oleiro.test','Volunteer123!','portal');
  await navAction(page,'Planejamento').click();
  const card=page.locator('.activity-card.volunteer-session-card').filter({hasText:'Oficina candidato E2E'}).first();
  await expect(card).toBeVisible({timeout:20_000});
  await expect(page.getByText('Ajustado',{exact:true})).toHaveCount(0);
  await expect(card).not.toContainText('Ajustado');

  const result=await page.evaluate(async()=>{
    const rows=await window.OleiroServices.planning.listSessions({applicationId:'e2e-application'}),row=rows.find(item=>item.id==='e2e-candidate-session');
    return row?{status:row.status,adjustment:row.adminAdjustmentStatus,time:row.time,period:row.period}:null;
  });
  expect(result).toEqual({status:'plan_approved',adjustment:'approved',time:'16:00',period:'Tarde'});
});
