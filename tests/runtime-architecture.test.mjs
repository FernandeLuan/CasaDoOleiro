import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, normalize } from 'node:path';

const retiredNotLoaded=new Set(['js/portal/candidate-view.js']);

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

test('candidate planning has one canonical page owner',()=>{
  const portalHtml=readFileSync('portal/index.html','utf8');
  const planning=readFileSync('js/portal/planejamento.js','utf8');
  const enhancements=readFileSync('js/portal/planning-enhancements.js','utf8');
  const retired=readFileSync('js/portal/candidate-view.js','utf8');
  const rules=readFileSync('js/shared/domain-rules.js','utf8');

  assert.ok(!portalHtml.includes('../js/portal/candidate-view.js'),'candidate-view.js is retired and must not be loaded');
  assert.match(planning,/function volunteerPlan\s*\(/);
  assert.match(planning,/candidatePlanningEditable\(status\)/);
  assert.match(planning,/candidate-plan-content/);
  assert.ok(!planning.includes('candidate-plan-compact-head'),'Planning must not reintroduce the duplicated period/status header');
  assert.ok(!/volunteerPlan\s*=\s*function/.test(enhancements),'planning-enhancements must not own the page renderer');
  assert.ok(retired.includes('candidate-plan-compact-head'),'Retired module retained only as rollback evidence');
  assert.ok(rules.includes("'submitted'"),'Submitted/analysis must stay editable until approval');
});

test('admin shell delegates planning page ownership',()=>{
  const shell=readFileSync('js/admin/admin-shell.js','utf8');
  const planning=readFileSync('js/admin/planning-page.js','utf8');
  assert.ok(planning.includes('window.adminPlanningPageHtml=managerPlanning'));
  assert.ok(shell.includes("typeof window.adminPlanningPageHtml==='function'"));
  assert.ok(!shell.includes('function planningDetailHtml('),'Admin shell must not duplicate planning page markup');
});

test('analysis and adjustments expose canonical planning approval',()=>{
  const planning=readFileSync('js/admin/planning-page.js','utf8');
  assert.ok(planning.includes("['analysis','adjustments'].includes(status)"));
  assert.ok(planning.includes('requestApprovePlanning'));
  assert.ok(planning.includes('approvePlanningConfirmR25'));
  assert.ok(planning.includes('approveCandidate('));
  assert.ok(planning.includes(".admin-plan-review-footer,.planning-admin-footer"),'legacy footer stays stripped only after approval is migrated');
});

test('admin planning keeps request-adjustment in the contextual action rail',()=>{
  const agenda=readFileSync('js/admin/planning-person-agenda.js','utf8');
  assert.ok(agenda.includes("iconAction('Pedir ajuste'"));
  assert.ok(agenda.includes('requestR31SessionAdjustment'));
  assert.ok(agenda.includes("['analysis','adjustments'].includes"));
});

test('retired candidate renderer is safe if an old cached page still loads it',()=>{
  const retired=readFileSync('js/portal/candidate-view.js','utf8');
  const css=readFileSync('css/product-current.css','utf8');
  assert.ok(retired.includes("['draft','submitted','adjustments']"));
  assert.ok(!retired.includes('${compactHeader()}'),'Retired renderer must not bring back duplicated period/status');
  assert.ok(css.includes('.candidate-plan-compact-head{display:none!important}'));
});

test('delete confirmation has no missing inline handlers',()=>{
  const confirmation=readFileSync('js/admin/confirmation.js','utf8');
  assert.ok(confirmation.includes('window.syncDeleteVolunteerConfirm=function'));
  assert.ok(confirmation.includes('window.confirmDeleteVolunteerApplication=function'));
  assert.ok(confirmation.includes('window.copyDeleteVolunteerCommand=async function'));
  assert.ok(confirmation.includes('tools/delete-volunteer.js'));
});

test('analysis copy never says editing is blocked',()=>{
  const home=readFileSync('js/portal/round5-ui.js','utf8');
  assert.ok(!home.includes('edição fica bloqueada'));
  assert.ok(home.includes('continuar adicionando e ajustando atividades'));
});

test('all local script references exist',()=>{
  for(const htmlPath of ['portal/index.html','admin/index.html']){
    for(const path of localScripts(htmlPath))assert.ok(existsSync(path),`${htmlPath} references missing script ${path}`);
  }
});
