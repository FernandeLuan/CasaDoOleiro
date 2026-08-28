// Critical browser regression: isolated Firebase emulators only; never production data.
import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={
  apiKey:'demo-api-key',
  authDomain:'demo-casadooleiro.firebaseapp.com',
  projectId:'demo-casadooleiro',
  appId:'1:123:web:e2e'
};

async function prepare(page,language='pt'){
  await page.addInitScript(lang=>localStorage.setItem('oleiro-language',lang),language);
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`
  }));
}

async function login(page,email,password,target,language='pt'){
  await prepare(page,language);
  await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{
    try{
      const context=await window.OleiroFirebase?.ready;
      return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function';
    }catch{return false}
  },undefined,{timeout:30_000});
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#loginButton').click();
  await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000});
}

const navAction=(page,label)=>page.locator('#navRoot').getByRole('button',{name:new RegExp(`${label}$`)});
const appAction=(page,label)=>page.locator('#app').getByRole('button',{name:new RegExp(label)});
const activityCard=(page,label)=>page.locator('.activity-card').filter({hasText:label});

async function waitForCandidateList(page){
  const list=page.locator('#candidateList');
  await expect(list).toBeVisible({timeout:20_000});
  await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  return list;
}

async function openPendingCandidates(page){
  await navAction(page,'Voluntariado').click();
  await waitForCandidateList(page);
  await appAction(page,'Filtros').click();
  await page.locator('#candidateStatusFilter').selectOption('pending');
  await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();
  return waitForCandidateList(page);
}

test.beforeEach(async()=>{
  await seedEmulators();
});

test('Admin manages independent A/B/C/D groups for Rodeio and Indaial',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await navAction(page,'Menu').click();
  await page.locator('#app .menu-list').getByRole('button',{name:/Grupos\b/}).click();
  await expect(page.locator('#managerGroupUnit')).toBeVisible({timeout:20_000});

  await page.locator('#managerGroupUnit').selectOption('indaial');
  await expect(page.locator('.group-details')).toHaveCount(4,{timeout:20_000});
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
  await expect(page.getByText('Grupo D',{exact:true})).toBeVisible();
  await expect(page.locator('.section-title').getByText(/Indaial.*inativa/i)).toBeVisible();

  await page.locator('#managerGroupUnit').selectOption('rodeio');
  await expect(page.locator('.group-details')).toHaveCount(4,{timeout:20_000});
  await expect(page.getByText('Grupo A',{exact:true})).toBeVisible();
});

test('Candidate History is lazy and loads only after opening its tab',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  const list=await openPendingCandidates(page);

  const candidate=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();
  await expect(candidate).toBeVisible({timeout:20_000});
  await candidate.click();
  const modal=page.locator('#modalRoot');
  await expect(modal.getByRole('button',{name:/Histórico$/})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='applications/history').length||0)).toBe(0);

  await modal.getByRole('button',{name:/Histórico$/}).click();
  await expect(modal.getByText('Histórico do candidato',{exact:true})).toBeVisible();
  await expect(modal.getByText('Candidato cadastrado',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='applications/history').length||0)).toBe(1);
});

test('Meeting scheduler reuses the standard date picker without mobile overflow',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await openPendingCandidates(page);
  await page.evaluate(()=>{
    const candidate=window.candidateById?.('e2e-application');
    if(!candidate)throw new Error('E2E candidate not loaded');
    Object.assign(candidate,{status:'meeting',meetingStatus:'pending',meetingDate:'2026-09-15',meetingTime:'14:30'});
    window.openSelectionMeetingEditor(encodeURIComponent(candidate.id));
  });

  const modal=page.locator('#modalRoot .modal');
  await expect(modal).toBeVisible();
  await expect(page.locator('.selection-meeting-datetime .date-picker-shell')).toHaveCount(1);
  await expect(page.locator('#selectionMeetingDate')).toHaveValue('2026-09-15');
  await expect(page.locator('#selectionMeetingDateText')).toHaveText('15/09/2026');
  await expect(page.locator('#selectionMeetingTime')).toHaveValue('14:30');

  const layout=await page.evaluate(()=>{
    const modal=document.querySelector('#modalRoot .modal');
    const row=document.querySelector('.selection-meeting-datetime');
    const dateShell=document.querySelector('.selection-meeting-datetime .date-picker-shell');
    const time=document.getElementById('selectionMeetingTime');
    const dateLabel=document.querySelector('label[for="selectionMeetingDate"]');
    const durationLabel=document.querySelector('label[for="selectionMeetingDuration"]');
    if(!modal||!row||!dateShell||!time||!dateLabel||!durationLabel)return {inside:false,sameLabelSize:false};
    const outer=modal.getBoundingClientRect(),inside=node=>{const box=node.getBoundingClientRect();return box.left>=outer.left-1&&box.right<=outer.right+1};
    return {inside:inside(dateShell)&&inside(time)&&row.scrollWidth<=row.clientWidth+1,sameLabelSize:getComputedStyle(dateLabel).fontSize===getComputedStyle(durationLabel).fontSize};
  });
  expect(layout.inside).toBe(true);
  expect(layout.sameLabelSize).toBe(true);
});

test('Candidate creates, edits, moves and deletes own proposed activity',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');
  await navAction(page,'Planejamento').click();
  await expect(page.getByRole('button',{name:/Adicionar atividade$/}).first()).toBeVisible();

  await page.getByRole('button',{name:/Adicionar atividade$/}).first().click();
  await page.locator('#actName').fill('Atividade E2E');
  await page.locator('#actDesc').fill('Fluxo automatizado');
  await page.locator('#modalRoot').getByRole('button',{name:/Adicionar atividade$/}).click();
  await expect(activityCard(page,'Atividade E2E')).toHaveCount(1);
  await expect(activityCard(page,'Atividade E2E').first()).toBeVisible();

  let card=activityCard(page,'Atividade E2E').first();
  await card.getByRole('button',{name:/Editar$/}).click();
  await page.locator('#actName').fill('Atividade E2E editada');
  await page.locator('#modalRoot').getByRole('button',{name:/Salvar alterações$/}).click();
  await expect(activityCard(page,'Atividade E2E editada')).toHaveCount(1);
  await expect(activityCard(page,'Atividade E2E editada').first()).toBeVisible();

  card=activityCard(page,'Atividade E2E editada').first();
  await card.getByRole('button',{name:/Mover$/}).click();
  const moveDate=page.locator('#moveDate');
  await expect(moveDate).toBeVisible();
  const optionCount=await moveDate.locator('option').count();
  expect(optionCount).toBeGreaterThan(1);
  await moveDate.selectOption({index:1});
  await page.locator('#moveSessionSave').click();
  await expect(page.locator('#moveDate')).toHaveCount(0,{timeout:20_000});
  await expect(activityCard(page,'Atividade E2E editada')).toHaveCount(1);

  card=activityCard(page,'Atividade E2E editada').first();
  await card.getByRole('button',{name:/Excluir$/}).click();
  await page.locator('#modalRoot').getByRole('button',{name:/Excluir$/}).click();
  await expect(activityCard(page,'Atividade E2E editada')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Adicionar atividade$/}).first()).toBeVisible();
});

for(const locale of [
  {lang:'en',infoNav:'Information',infoTitle:'House information',planning:'Planning',add:'Add activity',namePlaceholder:'E.g. English conversation',descriptionPlaceholder:'How does the activity work?'},
  {lang:'es',infoNav:'Información',infoTitle:'Información de la Casa',planning:'Planificación',add:'Agregar actividad',namePlaceholder:'Ej.: Conversación en inglés',descriptionPlaceholder:'¿Cómo funciona la actividad?'}
]){
  test(`Volunteer critical information and activity placeholders render in ${locale.lang}`,async({page})=>{
    await login(page,'voluntario@oleiro.test','Volunteer123!','portal',locale.lang);
    await navAction(page,locale.infoNav).click();
    await expect(page.getByText(locale.infoTitle,{exact:true})).toBeVisible();
    await expect(page.locator('#info-arrival')).toBeVisible();
    await expect(page.locator('#info-accommodation')).toBeVisible();
    await expect(page.locator('#info-meals')).toBeVisible();

    await navAction(page,locale.planning).click();
    await page.getByRole('button',{name:new RegExp(`${locale.add}$`)}).first().click();
    await expect(page.locator('#actName')).toHaveAttribute('placeholder',locale.namePlaceholder);
    await expect(page.locator('#actDesc')).toHaveAttribute('placeholder',locale.descriptionPlaceholder);
    await expect(page.locator('#actParticipation option[value="Até 5"]')).not.toHaveText('Até 5');
    await expect(page.locator('#actPeriod option[value="Manhã"]')).not.toHaveText('Manhã');
  });
}
