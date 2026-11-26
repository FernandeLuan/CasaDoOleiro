import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('history events persist the authenticated email and render it as the author', async () => {
  const service = await read('../js/services/history-service.js');
  const history = await read('../js/admin/account-history.js');
  const applications = await read('../js/services/application-service.js');
  assert.match(service, /actorEmail:String\(session\?\.email\|\|user\.email\|\|window\.OleiroFirebase\?\.auth\?\.currentUser\?\.email\|\|''\)/);
  assert.match(history, /row\?\.actorEmail/);
  assert.match(applications, /async updateLifecycle/);
  assert.match(applications, /profile_inactivated/);
  assert.match(applications, /profile_reactivated/);
  assert.match(applications, /services\.history\.appendToBatch\(batch,context,id,eventType/);
});

test('WhatsApp sharing is disabled without active sessions and does not open a blank tab', async () => {
  const planning = await read('../js/portal/planejamento.js');
  assert.match(planning, /const hasActive=activeCandidateSessions\(\)\.length>0/);
  assert.match(planning, /disabled aria-disabled="true"/);
  assert.match(planning, /OleiroPlanningShare\?\.openWhatsApp/);
  assert.match(planning, /reservePopup\?\.\(\)/);
  assert.doesNotMatch(planning, /window\.location\.assign\(url\)/);
  assert.doesNotMatch(planning, /window\.open\(url/);
});

test('inactive volunteer account details stop loading access records and show a skeleton for pending reads', async () => {
  const details = await read('../js/admin/candidate-detail-data.js');
  assert.match(details, /oleiro-skeleton/);
  assert.match(details, /p\.inactive===true\|\|p\.active===false\|\|p\.status==='rejected'/);
  assert.match(details, /finally\{state\.adminAccountReadAt\[key\]=Date\.now\(\)\}/);
  assert.match(details, /Acesso inativo/);
});

test('admin version panel removes the details link and waits for authenticated home before announcement', async () => {
  const release = await read('../js/admin/release-notes.js');
  assert.doesNotMatch(release, /Ver detalhes/);
  assert.match(release, /if\(state\?\.managerPage==='home'\)\{maybeAnnounce\(\)/);
  assert.match(release, /if\(popupOpened\|\|seen\(\)\)return/);
  assert.ok(release.includes("const demoProject=String(window.OLEIRO_FIREBASE_CONFIG?.projectId||'').startsWith('demo-')"));
  assert.match(release, /const automatedBrowser=typeof navigator!=='undefined'&&navigator\.webdriver===true/);
  const notes = JSON.parse(await read('../release-notes.json'));
  assert.equal(notes.releases[0].version, '383');
  assert.ok(notes.releases[0].audience.includes('admin'));
  assert.ok(notes.releases[0].audience.includes('volunteer'));
});

test('project read permissions remain scoped to active users and their own project IDs', async () => {
  const rules = await read('../firestore.rules');
  assert.match(rules, /match \/legacy_projects\/\{projectId\}/);
  assert.match(rules, /allow get: if isAdmin\(\)/);
  assert.match(rules, /projectId\.matches\('\.\*__' \+ request\.auth\.uid\)/);
  assert.match(rules, /allow list: if isAdmin\(\)[\s\S]*isCoordinator\(\) && managerHasUnit\(resource\.data\.unitId\)/);
  assert.match(rules, /allow delete: if false/);
});


test('profile activation and inactivation persist actor history atomically',async()=>{
  const lifecycle=await read('../js/services/application-service.js');
  const reactivation=await read('../js/services/candidate-reactivation-service.js');
  const history=await read('../js/services/history-service.js');
  const admin=await read('../js/admin/candidate-lifecycle.js');
  assert.match(lifecycle,/services\.history\.appendToBatch\(batch,context,id,eventType/);
  assert.match(lifecycle,/await batch\.commit\(\)/);
  assert.doesNotMatch(lifecycle,/A alteração foi salva, mas o histórico não pôde ser registrado/);
  assert.match(reactivation,/appendToBatch\(batch,context,applicationId,'profile_reactivated'/);
  assert.match(history,/actorEmail:String\(session\?\.email\|\|user\.email\|\|window\.OleiroFirebase\?\.auth\?\.currentUser\?\.email\|\|''\)/);
  assert.match(admin,/participantAccessCache\[String\(p\.id\)\]=Object\.fromEntries/);
  assert.match(admin,/adminAccountReadAt\[String\(p\.id\)\]=Date\.now\(\)/);
  assert.match(admin,/\.\.\.\(previousAccess\[key\]\|\|\{\}\)/,'Lifecycle cache updates must preserve firstPortalAccessAt and other access metadata');
});

test('volunteer planning cannot remain indefinitely in a loading state',async()=>{
  const app=await read('../js/portal/app.js');
  const account=await read('../js/admin/candidate-detail-data.js');
  assert.match(app,/portalPlanningWithDeadline/);
  assert.match(app,/state\.volunteerPlanningFailedFor=applicationId/);
  assert.match(app,/Serviço de planejamento indisponível/);
  assert.match(account,/Promise\.race\(\[window\.OleiroServices\.users\.getByIds\(uids\),timeout\]\)/);
});

test('WhatsApp planning share requires active dated sessions and an active application',async()=>{
  const planning=await read('../js/portal/planejamento.js');
  assert.match(planning,/function portalShareableSession/);
  assert.match(planning,/!String\(row\.activityId\|\|''\)\.trim\(\)/);
  assert.ok(planning.includes('row.date'));
  assert.ok(planning.includes('PORTAL_SHARE_COOLDOWN_MS=60*1000'));
  assert.ok(planning.includes('sessionStorage.setItem'));
  assert.match(planning,/Aguarde um minuto para compartilhar novamente/);
  assert.match(planning,/return application\.status!=='rejected'&&application\.active!==false&&!application\.inactive/);
  assert.match(planning,/const sessions=activeCandidateSessions\(\)/);
  assert.match(planning,/disabled aria-disabled="true"/);
});


test('reactivating a rejected volunteer records the lifecycle event in the same Firestore batch',async()=>{
  const service=await read('../js/services/candidate-reactivation-service.js');
  assert.match(service,/appendToBatch\(batch,context,applicationId,'profile_reactivated'/);
  assert.match(service,/await batch\.commit\(\)/);
});


test('admin WhatsApp sharing accepts valid ISO dates when filtering sessions', async () => {
  const planning = await read('../js/admin/planning-page.js');
  assert.ok(planning.includes("/^\\d{4}-\\d{2}-\\d{2}$/"), 'Date validation must use digit classes, not a literal backslash');
  assert.ok(!planning.includes("/^\\\\d{4}-\\\\d{2}-\\\\d{2}$/"), 'Double-escaped date validation would reject every real date');
});


test('volunteer profile edits are recorded atomically in application history', async () => {
  const profile = await read('../js/admin/candidate-profile-details.js');
  const applicationService = await read('../js/services/application-service.js');
  const history = await read('../js/admin/account-history.js');
  assert.equal((applicationService.match(/appendToBatch\(batch,context,applicationId,'profile_updated'/g)||[]).length, 2);
  assert.equal((profile.match(/invalidateHistoryCache\?\.\(p\.id\)/g)||[]).length, 2);
  assert.match(profile, /applications\.updateParticipantGender/);
  assert.match(profile, /applications\.updateRegistrationLink/);
  assert.match(history, /profile_updated:'Dados do perfil atualizados'/);
  assert.ok(history.includes('fields[m.field]'));
  const emergency = await read('../js/services/volunteer-profile-service.js');
  const emergencyUi = await read('../js/admin/emergency-contact.js');
  assert.match(emergency, /appendToBatch\(batch,context,applicationId,'profile_updated'/);
  assert.match(emergencyUi, /participantIndex:i\+1/);
});


test('admin WhatsApp visibility is verified against all persisted sessions, never a stale sessionCount', async () => {
  const planning = await read('../js/admin/planning-page.js');
  assert.ok(planning.includes('function adminShareableRows(rows)'));
  assert.ok(planning.includes('refreshAdminShareEligibility(p'));
  assert.ok(planning.includes('listSessions({applicationId:id})'));
  assert.ok(!planning.includes('Number(p?.sessionCount||0)>0'));
  assert.ok(planning.includes('eligibility?.valid!==true'));
  assert.ok(planning.includes('button.disabled=status.disabled'));
});


test('Admin share button restores the WhatsApp icon and clears the loading state', async () => {
  const planning = await read('../js/admin/planning-page.js');
  assert.ok(planning.includes("icon.className='fa-brands fa-whatsapp'"));
  assert.ok(planning.includes("button.removeAttribute('aria-busy')"));
  assert.ok(planning.includes("button.classList.toggle('is-complete',status.cooldownActive)"));
});

test('Admin share eligibility bypasses cached planning sessions for a fresh server read', async () => {
  const planning = await read('../js/admin/planning-page.js');
  const service = await read('../js/services/planning-service.js');
  assert.ok(planning.includes('listSessions({applicationId:id,fresh:true})'));
  assert.ok(planning.includes('fresh:true'));
  assert.ok(service.includes('async listSessions({applicationId,from,to,fresh=false})'));
  assert.ok(service.includes('?await applicationSessions(context,applicationId,{from,to})'));
  assert.ok(service.includes('getDocsFromServer||firestore.getDocs'));
});

test('Admin lifecycle writes the audit event atomically and invalidates history caches', async () => {
  const application = await read('../js/services/application-service.js');
  assert.ok(application.includes('getDocFromServer||firestore.getDoc'));
  assert.ok(application.includes("services.history.appendToBatch(batch,context,id,eventType"));
  assert.ok(application.includes('window.OleiroUI?.invalidateHistoryCache?.(historyKey)'));
});

test('Admin history reads from Firestore server and surfaces query failures', async () => {
  const history = await read('../js/services/history-service.js');
  assert.ok(history.includes('getDocsFromServer||firestore.getDocs'));
  assert.ok(history.includes('Falha ao consultar o histórico persistido da candidatura'));
  assert.ok(!history.includes('fallback:true'));
});
