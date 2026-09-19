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
  await page.waitForFunction(targetName=>{
    if(typeof window.render!=='function')return false;
    return targetName==='portal'?typeof window.navigateVolunteer==='function':targetName==='admin'?typeof window.navigateManager==='function':true;
  },target,{timeout:20_000});
}

const navAction=(page,label)=>page.getByRole('button',{name:new RegExp(`^.{0,3}${label}$`)});
const appAction=(page,label)=>page.locator('#app').getByRole('button',{name:new RegExp(label)});
const activityCard=(page,label)=>page.locator('.activity-card').filter({hasText:label});
const profileNavAction=page=>page.locator(`button[onclick="navigateVolunteer('profile')"]:visible`).first();

async function waitForCandidateList(page){
  const list=page.locator('#candidateList');
  await expect(list).toBeVisible({timeout:20_000});
  await expect(list.getByText(/Carregando voluntários/)).toHaveCount(0,{timeout:20_000});
  return list;
}

async function openPendingVolunteer(page){
  await navAction(page,'Voluntariado').click();
  await waitForCandidateList(page);
  await appAction(page,'Filtros').click();
  await page.locator('#candidateStatusFilter').selectOption('pending');
  await page.locator('#modalRoot').getByRole('button',{name:/Aplicar$/}).click();
  const list=await waitForCandidateList(page);
  const candidate=list.locator('.list-item.clickable').filter({hasText:'Voluntário E2E'}).first();
  await expect(candidate).toBeVisible({timeout:20_000});
  await candidate.click();
  const detail=page.locator('#app');
  await expect(detail.locator('.person-refactor-tabs button.active')).toContainText('Planejamento',{timeout:20_000});
  return detail;
}

test.beforeEach(async()=>{
  await seedEmulators();
});

test('Admin manages independent A/B/C/D groups for Rodeio and Indaial',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await navAction(page,'Grupos').click();
  const grid=page.locator('.groups-page-grid');await expect(grid).toBeVisible({timeout:20_000});
  const columns=grid.locator('.groups-unit-column');await expect(columns).toHaveCount(2,{timeout:20_000});
  const rodeio=columns.filter({hasText:'Rodeio'}),indaial=columns.filter({hasText:'Indaial'});
  await expect(rodeio.locator('.groups-unit-group')).toHaveCount(4);await expect(indaial.locator('.groups-unit-group')).toHaveCount(4);
  await expect(rodeio.locator('.groups-unit-status')).toHaveText('Ativa');await expect(indaial.locator('.groups-unit-status')).toHaveText('Inativa');
  await expect(rodeio.getByText('Grupo A',{exact:true})).toBeVisible();await expect(rodeio.getByText('Grupo D',{exact:true})).toBeVisible();
  await expect(indaial.getByText('Grupo A',{exact:true})).toBeVisible();await expect(indaial.getByText('Grupo D',{exact:true})).toBeVisible();
});

test('Admin date controls work in candidate, agenda and meeting flows',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await navAction(page,'Voluntariado').click();
  await waitForCandidateList(page);
  await page.getByRole('button',{name:'Novo candidato'}).click();

  const candidateFrom=page.locator('#ncFrom'),candidateTo=page.locator('#ncTo');
  await expect(candidateFrom).toBeVisible();
  await expect(candidateTo).toBeVisible();
  await expect(candidateFrom).toHaveAttribute('type','date');
  await candidateFrom.evaluate(el=>Object.defineProperty(el,'showPicker',{configurable:true,value(){this.dataset.pickerProbe='opened'}}));
  await candidateFrom.click();
  await expect(candidateFrom).toHaveAttribute('data-picker-probe','opened');
  await candidateFrom.fill('2026-09-21');
  await candidateTo.fill('2026-10-02');
  await expect(candidateFrom).toHaveValue('2026-09-21');
  await expect(candidateTo).toHaveValue('2026-10-02');
  await expect(page.locator('#ncFromText')).toHaveText('21/09/2026');
  await expect(page.locator('#ncToText')).toHaveText('02/10/2026');

  await page.evaluate(()=>closeModal());
  await page.evaluate(()=>openAgendaRangeModal());
  const agendaFrom=page.locator('#agendaFromInput'),agendaTo=page.locator('#agendaToInput');
  await expect(agendaFrom).toBeVisible();
  await expect(agendaTo).toBeVisible();
  await agendaFrom.evaluate(el=>Object.defineProperty(el,'showPicker',{configurable:true,value(){this.dataset.pickerProbe='opened'}}));
  await agendaFrom.click();
  await expect(agendaFrom).toHaveAttribute('data-picker-probe','opened');
  await agendaFrom.fill('2026-09-01');
  await agendaTo.fill('2026-09-30');
  await expect(agendaFrom).toHaveValue('2026-09-01');
  await expect(agendaTo).toHaveValue('2026-09-30');

  await page.evaluate(()=>closeModal());
  await page.evaluate(()=>{
    const fake={id:'meeting-date-e2e',name:'Data E2E',status:'meeting',meetingStatus:'pending',meetingDuration:30};
    state.candidates=[fake,...(state.candidates||[]).filter(row=>row.id!==fake.id)];
    openSelectionMeetingEditor(encodeURIComponent(fake.id));
  });
  const meetingDate=page.locator('#selectionMeetingDate'),meetingTime=page.locator('#selectionMeetingTime');
  await expect(meetingDate).toBeVisible();
  await expect(meetingDate).toHaveAttribute('type','date');
  await meetingDate.fill('2026-09-15');
  await meetingTime.fill('14:30');
  await expect(meetingDate).toHaveValue('2026-09-15');
  await expect(meetingTime).toHaveValue('14:30');
  const usableDateInputs=await page.locator('input[type="date"]:visible').evaluateAll(inputs=>inputs.every(input=>input.getBoundingClientRect().width>0&&input.getBoundingClientRect().height>0&&!input.disabled));
  expect(usableDateInputs).toBe(true);
});

test('Emergency contact is optional at registration and rejects incomplete data',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  await navAction(page,'Voluntariado').click();
  await waitForCandidateList(page);
  await page.getByRole('button',{name:'Novo candidato'}).click();

  await expect(page.locator('#ncEmergencyName1')).toBeVisible();
  await expect(page.locator('#ncEmergencyRelationship1')).toBeVisible();
  await expect(page.locator('#ncEmergencyPhone1')).toBeVisible();

  await page.locator('#ncName1').fill('Cadastro Opcional E2E');
  await page.locator('#ncEmail1').fill('opcional@oleiro.test');
  await page.locator('#ncGender1').selectOption('male');
  await page.locator('#ncFrom').fill('2026-10-05');
  await page.locator('#ncTo').fill('2026-10-16');
  await expect(page.locator('#ncSubmit')).toBeEnabled();

  await page.locator('#ncEmergencyRelationship1').fill('Irmão');
  await expect(page.locator('#ncSubmit')).toBeDisabled();
  await page.locator('#ncEmergencyName1').fill('Contato E2E');
  await page.locator('#ncEmergencyPhone1').fill('+55 47 99999-1111');
  await expect(page.locator('#ncSubmit')).toBeEnabled();
});

test('Candidate History is lazy and loads only after opening its tab',async({page})=>{
  await login(page,'admin@oleiro.test','Admin123!','admin');
  const modal=await openPendingVolunteer(page);
  await expect(modal.getByRole('button',{name:/Histórico$/})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='applications/history').length||0)).toBe(0);

  await modal.getByRole('button',{name:/Histórico$/}).click();
  await expect(modal.getByText('Histórico do candidato',{exact:true})).toBeVisible();
  await expect(modal.getByText('Perfil criado',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='applications/history').length||0)).toBe(1);
});

test('Volunteer can edit own emergency contact and Admin sees the same profile data',async({page})=>{
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');
  await profileNavAction(page).click();
  const emergency=page.locator('.volunteer-emergency-card');
  await expect(emergency).toBeVisible();
  await expect(emergency).toContainText('Contato de emergência');
  await expect(emergency).toContainText('Não informado');
  await emergency.getByRole('button',{name:/Adicionar contato$/}).click();
  await page.locator('#myEmergencyName').fill('Contato E2E');
  await page.locator('#myEmergencyRelationship').fill('Irmão');
  await page.locator('#myEmergencyPhone').fill('+55 47 99999-1111');
  await page.locator('#modalRoot').getByRole('button',{name:/Salvar contato$/}).click();
  await expect(emergency).toContainText('Contato E2E');
  await expect(emergency).toContainText('+55 47 99999-1111');

  await page.evaluate(()=>window.OleiroAuth.signOut());
  await login(page,'admin@oleiro.test','Admin123!','admin');
  const modal=await openPendingVolunteer(page);
  await modal.getByRole('button',{name:/Conta$/}).click();
  const adminEmergency=modal.locator('.account-contact-card-r70 .account-person-row').first().locator('.account-person-emergency-r70, .account-person-emergency-inline-r71');
  await expect(adminEmergency).toBeVisible({timeout:20_000});
  await expect(adminEmergency).toContainText('Contato E2E');
  await expect(adminEmergency).toContainText('Irmão');
  await expect(adminEmergency).toContainText('+55 47 99999-1111');
  const profileReads=await page.evaluate(()=>window.OleiroQueryMetrics?.filter(row=>row.name==='profiles/by-ids').reduce((sum,row)=>sum+(Number(row.pointReads)||0),0)||0);expect(profileReads).toBeLessThanOrEqual(1);
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
  {lang:'en',infoNav:'Information',arrival:'How to get here',software:'Software version',planning:'Planning',add:'Add activity',namePlaceholder:'E.g. English conversation',descriptionPlaceholder:'How does the activity work?',profileNav:'Account',emergencyTitle:'Emergency contact',emergencyAdd:'Add contact'},
  {lang:'es',infoNav:'Información',arrival:'Cómo llegar',software:'Versión del software',planning:'Planificación',add:'Agregar actividad',namePlaceholder:'Ej.: Conversación en inglés',descriptionPlaceholder:'¿Cómo funciona la actividad?',profileNav:'Cuenta',emergencyTitle:'Contacto de emergencia',emergencyAdd:'Agregar contacto'}
]){
  test(`Volunteer critical information, profile and activity placeholders render in ${locale.lang}`,async({page})=>{
    await login(page,'voluntario@oleiro.test','Volunteer123!','portal',locale.lang);
    await page.evaluate(()=>window.navigateVolunteer?.('info'));
    await expect(page.locator('#app')).toContainText(locale.arrival,{timeout:20_000});
    await expect(page.locator('#app')).toContainText(locale.lang==='en'?'Accommodation and meals':'Alojamiento y comidas');

    await navAction(page,locale.planning).click();
    await page.getByRole('button',{name:new RegExp(`${locale.add}$`)}).first().click();
    await expect(page.locator('#actName')).toHaveAttribute('placeholder',locale.namePlaceholder);
    await expect(page.locator('#actDesc')).toHaveAttribute('placeholder',locale.descriptionPlaceholder);
    await expect(page.locator('#actParticipation option[value="Até 5"]')).not.toHaveText('Até 5');
    await expect(page.locator('#actPeriod option[value="Manhã"]')).not.toHaveText('Manhã');
    await page.evaluate(()=>closeModal());

    await profileNavAction(page).click();
    const emergency=page.locator('.volunteer-emergency-card');
    await expect(emergency).toContainText(locale.emergencyTitle);
    await expect(emergency.getByRole('button',{name:new RegExp(`${locale.emergencyAdd}$`)})).toBeVisible();
  });
}

for(const locale of [
  {lang:'pt',title:'Nova versão disponível',button:'Atualizar agora'},
  {lang:'en',title:'New version available',button:'Update now'},
  {lang:'es',title:'Nueva versión disponible',button:'Actualizar ahora'}
]){
  test(`Release update is localized and never opens a browser confirm in ${locale.lang}`,async({page})=>{
    let commit='release-a-000000000000',dialogCount=0;
    page.on('dialog',async dialog=>{dialogCount+=1;await dialog.dismiss()});
    await page.route('**/release.json*',route=>route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({version:'2026.08.28.1',build:1,commit,publishedAt:'2026-08-28T12:00:00Z'})
    }));
    await login(page,'voluntario@oleiro.test','Volunteer123!','portal',locale.lang);
    await expect.poll(()=>page.evaluate(()=>window.OleiroRelease?.current()?.commit||''),{timeout:20_000}).toBe('release-a-000000000000');
    const before=new URL(page.url());
    commit='release-b-000000000000';
    await page.evaluate(()=>window.OleiroRelease.check());
    const banner=page.locator('#oleiroUpdateBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(locale.title);
    await expect(banner.getByRole('button',{name:locale.button})).toBeVisible();
    await expect(page).toHaveURL(before.toString());
    await banner.getByRole('button',{name:locale.button}).click();
    await expect.poll(()=>dialogCount).toBe(0);
    await expect(page).toHaveURL(/_build=release-b-0+/,{timeout:20_000});
  });
}
