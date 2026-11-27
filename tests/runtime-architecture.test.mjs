import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, normalize } from 'node:path';

const retiredConfig=JSON.parse(readFileSync('docs/runtime-retired-modules.json','utf8'));
const retiredNotLoaded=new Set(retiredConfig.retired||[]);

function localScripts(htmlPath){
  const html=readFileSync(htmlPath,'utf8');
  return [...html.matchAll(/<script[^>]+src=["']([^"']+\.js)(?:\?[^"']*)?["']/g)]
    .map(match=>normalize(join(htmlPath.split('/').slice(0,-1).join('/')||'.',match[1])).replaceAll('\\','/'))
    .map(path=>path.replace(/^\.\//,''))
    .filter(path=>path.startsWith('js/'));
}
function screenFiles(dir){
  return readdirSync(dir).filter(name=>name.endsWith('.js')).map(name=>`${dir}/${name}`);
}

test('screen modules are loaded or explicitly retired',()=>{
  const loaded=new Set([...localScripts('portal/index.html'),...localScripts('admin/index.html')]);
  const all=[...screenFiles('js/portal'),...screenFiles('js/admin')];
  const unreferenced=all.filter(path=>!loaded.has(path)).sort();
  assert.deepEqual(unreferenced,[...retiredNotLoaded].sort(),'Unexpected dead/unloaded screen module. Retire it explicitly only after its behavior is merged and tested.');
});

test('runtime modules use semantic names instead of numbered rounds',()=>{
  const all=[...screenFiles('js/portal'),...screenFiles('js/admin')];
  assert.deepEqual(all.filter(path=>/\/round\d/i.test(path)),[],'Numbered round modules must be consolidated into semantic owners.');
});

test('retired round3 candidate override stays removed',()=>{
  assert.ok(!existsSync('js/portal/round3-ui.js'),'round3-ui.js must stay removed after its behavior was consolidated');
});

test('candidate planning has one canonical page owner',()=>{
  const portalHtml=readFileSync('portal/index.html','utf8');
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  const enhancements=readFileSync('js/portal/planning-enhancements.js','utf8');
  const rules=readFileSync('js/shared/domain-rules.js','utf8');

  assert.ok(!portalHtml.includes('../js/portal/candidate-view.js'),'candidate-view.js is retired and must not be loaded');
  assert.match(planning,/function volunteerPlan\s*\(/);
  assert.match(planning,/candidatePlanningEditable\(status\)/);
  assert.match(planning,/candidate-plan-content/);
  assert.ok(!planning.includes('candidate-plan-compact-head'),'Planning must not reintroduce the duplicated period/status header');
  assert.ok(!/volunteerPlan\s*=\s*function/.test(enhancements),'planning-enhancements must not own the page renderer');
  assert.ok(!existsSync('js/portal/candidate-view.js'),'candidate-view.js must stay removed after consolidation');
  assert.ok(rules.includes("'submitted'"),'Submitted/analysis must stay editable until approval');
});

test('admin shell delegates planning page ownership',()=>{
  const shell=readFileSync('js/admin/admin-shell.js','utf8');
  const planning=readFileSync('js/admin/planning-page.js','utf8');
  assert.ok(planning.includes('window.adminPlanningPageHtml=managerPlanning'));
  assert.ok(shell.includes("typeof window.adminPlanningPageHtml==='function'"));
  assert.ok(!shell.includes('function planningDetailHtml('),'Admin shell must not duplicate planning page markup');
});

test('analysis and adjustments expose one canonical planning approval confirmation',()=>{
  const planning=readFileSync('js/admin/planning-page.js','utf8');
  const selection=readFileSync('js/admin/selection-flow.js','utf8');
  assert.ok(planning.includes("['analysis','adjustments'].includes(status)"));
  assert.ok(planning.includes('requestApprovePlanning'));
  assert.ok(planning.includes('return approveCandidate(id)'));
  assert.ok(!planning.includes('approvePlanningConfirmR25'),'planning page must not create a second approval confirmation');
  assert.ok(selection.includes('approvePlanningConfirmR25'),'selection flow owns the single approval confirmation');
  assert.ok(selection.includes('confirmApprovePlanningR25'));
  assert.ok(planning.includes(".admin-plan-review-footer,.planning-admin-footer"),'legacy footer stays stripped only after approval is migrated');
});

test('admin planning keeps request-adjustment in the contextual action rail',()=>{
  const agenda=readFileSync('js/admin/planning-person-agenda.js','utf8');
  assert.ok(agenda.includes("iconAction('Pedir ajuste'"));
  assert.ok(agenda.includes('requestR31SessionAdjustment'));
  assert.ok(agenda.includes("['analysis','adjustments'].includes"));
});

test('retired candidate renderer stays removed and legacy compact header stays hidden',()=>{
  const css=readFileSync('css/product-current.css','utf8');
  assert.ok(!existsSync('js/portal/candidate-view.js'),'candidate-view.js must remain removed from runtime sources');
  assert.ok(css.includes('.candidate-plan-compact-head{display:none!important}'));
});

test('delete confirmation uses only the canonical Cloud Shell flow',()=>{
  const confirmation=readFileSync('js/admin/confirmation.js','utf8');
  assert.ok(confirmation.includes('window.requestDeleteVolunteerApplication=function'));
  assert.ok(confirmation.includes('window.copyDeleteVolunteerCommand=async function'));
  assert.ok(confirmation.includes('tools/delete-volunteer.js'));
  assert.ok(!confirmation.includes('window.confirmDeleteVolunteerApplication=function'),'browser must not expose a direct destructive delete handler');
});

test('analysis copy never says editing is blocked',()=>{
  const home=readFileSync('js/portal/experience-summary.js','utf8');
  assert.ok(!home.includes('edição fica bloqueada'));
  assert.ok(home.includes('continuar adicionando e ajustando atividades'));
});

test('legacy plan_approved sessions stay editable during candidate analysis',()=>{
  const review=readFileSync('js/portal/review-flow.js','utf8');
  assert.ok(review.includes("['pending','analysis','adjustments'].includes"));
  assert.ok(review.includes("row.status==='plan_approved'&&!candidateWorkflowOpen"));
});

test('planning day cache signature includes review-state fields',()=>{
  const agenda=readFileSync('js/admin/planning-person-agenda.js','utf8');
  for(const field of ['adminAdjustmentStatus','adminAdjustmentNote','adminAdjustmentRequestedAt','adminAdjustmentSubmittedAt','_r32AdjustmentReady','changeReviewStatus','changeProposal']){
    assert.ok(agenda.includes(`s?.${field}`),`day signature must include ${field}`);
  }
});

test('desktop volunteer sidebar is localized after dynamic insertion',()=>{
  const shell=readFileSync('js/portal/desktop-shell.js','utf8');
  const i18n=readFileSync('js/shared/i18n-keyed.js','utf8');
  assert.ok(shell.includes("const navText=(key,fallback)=>typeof t==='function'?t(key):fallback"));
  assert.ok(shell.includes("navText('portal.nav.profile','Perfil')"));
  assert.ok(shell.includes("navText('portal.nav.stay','Estadia')"));
  assert.ok(shell.includes("const sidebar=app.querySelector(':scope > .portal-sidebar-desktop')"));
  assert.ok(shell.includes("applyI18n(sidebar)"),'desktop sidebar inserted after render must receive the active locale');
  assert.ok(i18n.includes("'portal.nav.profile':'Profile'"));
  assert.ok(i18n.includes("'portal.nav.stay':'Stay'"));
});

test('submitted candidate uses autosync status instead of fake resend control',()=>{
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  const i18n=readFileSync('js/shared/i18n-keyed.js','utf8');
  const agenda=readFileSync('js/portal/agenda.js','utf8');
  assert.ok(planning.includes('candidate-plan-sync-state'));
  assert.ok(planning.includes("t('portal.home.submittedBody')"));
  assert.ok(agenda.includes("badge(t('portal.profile.analysis'),'info')"));
  assert.ok(!i18n.includes('edição fica bloqueada'));
});

test('all local script references exist',()=>{
  for(const htmlPath of ['portal/index.html','admin/index.html']){
    for(const path of localScripts(htmlPath))assert.ok(existsSync(path),`${htmlPath} references missing script ${path}`);
  }
});


test('production Firestore deploy requires explicit manual confirmation after emulator validation',()=>{
  const workflow=readFileSync('.github/workflows/deploy-firestore-rules.yml','utf8');
  assert.ok(workflow.includes('workflow_dispatch:'),'production deployment must be manual, not triggered by a push');
  assert.ok(!/^  push:/m.test(workflow),'merging changes must never automatically start a production deployment');
  assert.ok(workflow.includes('confirm_production_deploy'),'manual deployment must expose an explicit confirmation input');
  assert.ok(workflow.includes('type: boolean'),'production deployment confirmation must be a boolean input');
  assert.ok(workflow.includes('default: false'),'production deployment confirmation must default to false');
  assert.ok(workflow.includes("if: github.ref == 'refs/heads/main' && inputs.confirm_production_deploy"),'production deployment must require main and explicit confirmation');
  assert.ok(workflow.includes('legacy-planning-permissions.spec.js'),'rules deploy must run the permission regression first');
  assert.match(workflow,/google-github-actions\/auth@[0-9a-f]{40} # v3/,'rules deploy must pin the short-lived Google credentials action');
  assert.ok(workflow.includes('--only firestore:rules,firestore:indexes'),'production workflow must deploy rules and indexes explicitly');
  assert.ok(workflow.indexOf('Validate Firestore unit isolation') < workflow.indexOf('Authenticate to Google Cloud'),'emulator permission tests must pass before production authentication');
  assert.ok(workflow.indexOf('Authenticate to Google Cloud') < workflow.indexOf('--only firestore:rules,firestore:indexes'),'production deployment must happen after validation and authentication');
  assert.ok(!workflow.includes('FIREBASE_TOKEN'),'production rules deploy must not depend on a long-lived Firebase token');
});


test('production release notice dismissal must stay enabled',()=>{
  const releaseNotes=readFileSync('js/portal/release-notes.js','utf8');
  assert.match(releaseNotes,/const ALWAYS_SHOW_HOME_NOTICES=false;/,'Production must persist dismissed release notices instead of forcing homologation banners to reappear.');
  assert.ok(!releaseNotes.includes('const ALWAYS_SHOW_HOME_NOTICES=true;'),'Homologation-only always-show flag must never ship enabled.');
});


test('release dismissal does not depend on browser storage',()=>{
  const releaseNotes=readFileSync('js/portal/release-notes.js','utf8');
  assert.ok(releaseNotes.includes('releaseDismissedInSession=true'),'Dismissal must take effect in memory even when localStorage is unavailable.');
  assert.ok(releaseNotes.includes("filter(slide=>!hiddenHomeNoticeIds.has(slide.id))"),'Dismissed release slides must be removed from the current Home carousel immediately.');
});


test('Portal compatibility overrides match the reviewed runtime contract',()=>{
  const contract=JSON.parse(readFileSync('docs/runtime-contract-overrides.json','utf8'));
  const source=readFileSync(contract.scope,'utf8');
  const actual=[...source.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*=\s*function\b/gm)].map(match=>match[1]);
  const expected=contract.overrides.flatMap(item=>Array(item.occurrences).fill(item.symbol));
  assert.deepEqual(actual,expected,'Portal global function overrides changed. Review ownership, migrate the behavior, and update the contract deliberately.');
  assert.equal(contract.policy.newOverridesRequireContractUpdate,true);
});


test('release announcement modals keep only the compact summary and full-width acknowledgement',()=>{
  const portal=readFileSync('js/portal/release-notes.js','utf8');
  const admin=readFileSync('js/admin/release-notes.js','utf8');
  const css=readFileSync('css/release-notes.css','utf8');
  const portalModal=portal.slice(portal.indexOf('window.openPortalReleaseNotes=function'),portal.indexOf('const baseNavigateVolunteer'));
  const adminModal=admin.slice(admin.indexOf('function modalBody()'),admin.indexOf('window.openAdminReleaseNotes=function'));
  assert.ok(portalModal.includes('ANNOUNCEMENT.summary'));
  assert.ok(adminModal.includes('admin-release-items'),'Admin announcement must show only the new-change cards');
  assert.ok(!adminModal.includes('admin-release-intro'),'Admin announcement must omit the redundant introductory block');
  for(const modal of [portalModal,adminModal]){
    assert.ok(!modal.includes('Atualizações anteriores'));
    assert.ok(!modal.includes('release-history-list'));
    assert.ok(!modal.includes('admin-release-history'));
    assert.ok(!modal.includes('release-notes-list'));
  }
  assert.ok(portal.includes('btn-block'),'Portal acknowledgement must use a full-width button');
  assert.ok(admin.includes('btn-block'),'Admin acknowledgement must use a full-width button');
  assert.match(css,/\.release-notes-actions\s*\{[^}]*grid-template-columns:\s*1fr/s);
});



test('Portal planning accepts ISO calendar dates for shareable sessions',()=>{
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  assert.ok(planning.includes(String.raw`!/^\d{4}-\d{2}-\d{2}$/`),'ISO dates must use a real digit matcher, not a literal backslash');
});

test('Portal WhatsApp sharing requires at least one valid session and enforces a one-minute resend cooldown',()=>{
  const portal=readFileSync('js/portal/planejamento.js','utf8');
  assert.match(portal,/const hasActive=activeCandidateSessions\(\)\.length>0/);
  assert.match(portal,/if\(!sessions\.length\)return showToast/);
  assert.match(portal,/PORTAL_SHARE_COOLDOWN_MS=60\*1000/);
  assert.match(portal,/sessionStorage\.setItem\(portalShareCooldownKey\(\),String\(until\)\)/);
  assert.match(portal,/Aguarde um minuto para compartilhar novamente/);
  assert.match(portal,/button\.disabled=status\.disabled/);
});

test('Admin planning failures leave the spinner and expose an explicit retry action',()=>{
  const detail=readFileSync('js/admin/candidate-detail-data.js','utf8');
  assert.match(detail,/state\.adminPlanErrors\[String\(p\.id\)\]=String\(error/);
  assert.match(detail,/Não foi possível carregar o planejamento/);
  assert.match(detail,/window\.retryAdminPlanning=async function/);
  assert.match(detail,/Tentar novamente/);
});


test('Lifecycle mutations are persisted in the candidate audit history with the acting account',()=>{
  const hooks=readFileSync('js/services/history-hooks.js','utf8');
  const service=readFileSync('js/services/history-service.js','utf8');
  const applications=readFileSync('js/services/application-service.js','utf8');
  assert.match(applications,/async updateLifecycle/);
  assert.match(applications,/profile_inactivated/);
  assert.match(applications,/profile_reactivated/);
  assert.match(applications,/delete window\.state\.adminHistoryCache\[historyKey\]/);
  assert.match(hooks,/await after\(args,result\)/);
  assert.match(service,/actorEmail:String\(session\?\.email\|\|user\.email/);
});

test('Admin projects page explicitly loads Firestore records and exposes permission failures',()=>{
  const projects=readFileSync('js/admin/projects.js','utf8');
  assert.match(projects,/window\.OleiroProjects\.loadAll\(\{force\}\)/);
  assert.match(projects,/state\.projectLoaded=true/);
  assert.match(projects,/state\.projectError/);
  assert.match(projects,/window\.refreshLegacyProjects/);
});

test('WhatsApp cooldown never re-enables sharing when no valid sessions remain',()=>{
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  assert.match(planning,/if\(!hasActive\)return \{disabled:true/);
  assert.match(planning,/const status=portalShareButtonState\(\)/);
  assert.match(planning,/OleiroPlanningShare\?\.openWhatsApp/);
  assert.ok(!planning.includes('window.location.assign(url)'),'Sharing must open WhatsApp without navigating the portal into a persistent loading state.');
});


test('Portal WhatsApp cooldown refreshes immediately after app return and page restoration',()=>{
  const portal=readFileSync('js/portal/planejamento.js','utf8');
  assert.match(portal,/window\.addEventListener\('pageshow',syncPortalShareCooldownTimer\)/);
  assert.match(portal,/window\.addEventListener\('focus',syncPortalShareCooldownTimer\)/);
  assert.match(portal,/document\.addEventListener\('visibilitychange',[^\n]*syncPortalShareCooldownTimer/);
  assert.match(portal,/setTimeout\(syncPortalShareCooldownTimer,0\)/);
  const sync=portal.match(/function syncPortalShareCooldownTimer\(\)\{([\s\S]*?)\n\}/)?.[1]||'';
  assert.ok(sync.indexOf('if(!update())return')>=0,'button state must be recalculated immediately, even if cooldown already expired');
  assert.ok(sync.indexOf('if(portalShareCooldownUntil()>Date.now())')>sync.indexOf('if(!update())return'),'timer must only be restarted after immediate state refresh');
});


test('Portal screen modules own their functions without bootstrap overrides',()=>{
  const app=readFileSync('js/portal/app.js','utf8');
  const home=readFileSync('js/portal/home.js','utf8');
  const stay=readFileSync('js/portal/estadia.js','utf8');
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  assert.doesNotMatch(app,/^\s*(?:volunteerHome|volunteerStayDates|openActivityModal)\s*=\s*function/gm);
  assert.match(home,/function volunteerHome\s*\(/);
  assert.match(stay,/function volunteerStayDates\s*\(/);
  assert.match(planning,/function openActivityModal\s*\(/);
  assert.doesNotMatch(home,/function volunteerStayDates\s*\(/);
  assert.doesNotMatch(app,/window\.volunteerHome=volunteerHome/);
});

test('approved volunteer home hides candidate-only information in its canonical renderer',()=>{
  const home=readFileSync('js/portal/home.js','utf8');
  assert.ok(home.includes("${approved?'':"));
});


test('Portal planning data projection belongs to the Planning module',()=>{
  const app=readFileSync('js/portal/app.js','utf8');
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  for(const symbol of ['planStatusFromApplication','portalPlanActivities','applyVolunteerPlanningRows']){
    assert.match(planning,new RegExp('function '+symbol+'\\s*\\('),symbol+' must be owned by Planning');
    assert.doesNotMatch(app,new RegExp('function '+symbol+'\\s*\\('),symbol+' must not live in bootstrap');
  }
});

test('Portal bootstrap only composes screen modules and does not reassign feature functions',()=>{
  const app=readFileSync('js/portal/app.js','utf8');
  assert.doesNotMatch(app,/^\s*(?:volunteerHome|volunteerStayDates|openActivityModal|volunteerPlan)\s*=\s*function/gm);
  assert.doesNotMatch(app,/window\.(?:volunteerHome|volunteerPlan)\s*=/);
});


test('Admin screen modules delegate Firestore operations to services',()=>{
  const files=[...screenFiles('js/admin'),...screenFiles('js/portal')];
  const direct=/\b(?:getFirestore|initializeFirestore)\s*\(|\bfirestore\.(?:getDocs|getDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction|collection|doc)\s*\(|\bdb\.(?:collection|doc)\s*\(/;
  const offenders=files.filter(path=>direct.test(readFileSync(path,'utf8')));
  assert.deepEqual(offenders,[],'Screen modules must use service APIs instead of accessing Firestore directly');
});

test('application service owns profile metadata writes and stay-date transactions',()=>{
  const service=readFileSync('js/services/application-service.js','utf8');
  const profile=readFileSync('js/admin/candidate-profile-details.js','utf8');
  const product=readFileSync('js/admin/product-current.js','utf8');
  assert.match(service,/async updateParticipantGender\s*\(/);
  assert.match(service,/async updateRegistrationLink\s*\(/);
  assert.match(service,/async changeStayDates\s*\(id,\{[^}]*excludeBoundaryDays/);
  assert.match(profile,/applications\.updateParticipantGender/);
  assert.match(profile,/applications\.updateRegistrationLink/);
  assert.match(product,/applications\.changeStayDates/);
  assert.match(service,/excludeBoundaryDays\?\(session\.date<=stayStart\|\|session\.date>=stayEnd\)/);
  assert.match(product,/excludeBoundaryDays:true/);
  assert.match(service,/remainingSessions:remaining/);
});


test('Admin bootstrap delegates data orchestration to its data module',()=>{
  const app=readFileSync('js/admin/app.js','utf8');
  const data=readFileSync('js/admin/admin-data.js','utf8');
  const html=readFileSync('admin/index.html','utf8');
  for(const symbol of ['hydrateManagerSchedule','hydrateManagerPendingChanges','loadManagerCandidates','hydrateManagerDashboardData','hydrateManagerBaseData','ensureManagerGroups']){
    assert.match(data,new RegExp('function '+symbol+'\\s*\\('),symbol+' must be owned by Admin data orchestration');
  }
  assert.doesNotMatch(app,/function (?:hydrateManagerSchedule|hydrateManagerPendingChanges|loadManagerCandidates|hydrateManagerDashboardData|hydrateManagerBaseData|ensureManagerGroups)\s*\(/);
  assert.ok(html.indexOf('admin-data.js')<html.indexOf('admin/app.js'),'Admin data module must load before the bootstrap');
});


test('Portal experience summary behavior has one canonical feature owner',()=>{
  const home=readFileSync('js/portal/home.js','utf8');
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  const agenda=readFileSync('js/portal/agenda.js','utf8');
  const stay=readFileSync('js/portal/estadia.js','utf8');
  const html=readFileSync('portal/index.html','utf8');
  assert.match(home,/function volunteerHome\s*\(/);
  assert.match(planning,/async function submitPlan\s*\(/);
  assert.match(agenda,/function volunteerDayAdjustment\s*\(/);
  assert.match(stay,/function volunteerStay\s*\(/);
  assert.doesNotMatch(html,/experience-summary\.js/);
  assert.ok(retiredNotLoaded.has('js/portal/experience-summary.js'));
  assert.match(planning,/if\(wasAdjustment\)application\.dayAdjustments=\{\}/);
});
