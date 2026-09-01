from pathlib import Path
import json


def must_replace(path, old, new, count=1):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'marker not found in {path}: {old[:120]}')
    p.write_text(text.replace(old, new, count), encoding='utf-8')

# Activity assistant: dynamic unit labels and candidate approval actions.
p = Path('js/admin/activity-assistant-r31.js')
text = p.read_text(encoding='utf-8')
text = text.replace('/* Round 31 — occupancy by unit and Rodeio activity-assistant shell. */', '/* Round 31 — unit-scoped activity assistant shell. */')
marker = "  const assistantUnit=()=>{const ids=state.currentSession?.user?.unitIds;return Array.isArray(ids)&&ids.length?String(ids[0]).toLowerCase():'rodeio'};"
if marker not in text:
    raise SystemExit('assistant unit marker missing')
text = text.replace(marker, marker + "\n  const assistantUnitLabel=()=>{const id=assistantUnit(),unit=(state.units||[]).find(row=>String(row.id).toLowerCase()===id);return unit?.name||id.replace(/^./,c=>c.toUpperCase())};", 1)
text = text.replace('<h1>Rodeio</h1><p class="muted">Atividades, agenda e ocupação da unidade.', '<h1>${escapeHtml(assistantUnitLabel())}</h1><p class="muted">Atividades, agenda e ocupação da unidade.')
text = text.replace('<h2>Hoje em Rodeio</h2>', '<h2>Hoje em ${escapeHtml(assistantUnitLabel())}</h2>')
text = text.replace("openModal('Filtros','Perfis da unidade de Rodeio.'", "openModal('Filtros',`Perfis da unidade de ${escapeHtml(assistantUnitLabel())}.`")
text = text.replace("return `<div class=\"r31-assistant-unit-lock\"><i class=\"fa-solid fa-location-dot\"></i><strong>Rodeio</strong></div>`", "return `<div class=\"r31-assistant-unit-lock\"><i class=\"fa-solid fa-location-dot\"></i><strong>${escapeHtml(assistantUnitLabel())}</strong></div>`")
text = text.replace("return showToast('Seu acesso está restrito à unidade de Rodeio.')", "return showToast(`Seu acesso está restrito à unidade de ${assistantUnitLabel()}.`)")
text = text.replace("if(/approveCandidate|rejectCandidate|openStayDateEditor|requestVolunteerEmailEdit|confirmInactivate|reactivateCandidate|resetCandidatePlanning|openNewCandidate/.test(action))button.remove()", "if(/openStayDateEditor|requestVolunteerEmailEdit|confirmInactivate|reactivateCandidate|resetCandidatePlanning|openNewCandidate/.test(action))button.remove()")
text = text.replace("['approveCandidate','rejectCandidate','reactivateCandidate','openStayDateEditor','requestVolunteerEmailEdit','confirmInactivateApprovedVolunteer'].forEach(denyLifecycle);", "['reactivateCandidate','openStayDateEditor','requestVolunteerEmailEdit','confirmInactivateApprovedVolunteer'].forEach(denyLifecycle);")
p.write_text(text, encoding='utf-8')

# Firestore: assistant manages applications and volunteer active state only inside same unit.
p = Path('firestore.rules')
rules = p.read_text(encoding='utf-8')
marker = "    function assistantMayRequestApplicationAdjustment() {\n"
if marker not in rules:
    raise SystemExit('assistant helper marker missing')
helper = """    function assistantMayManageApplication() {
      return assistantHasUnit(resource.data.unitId)
        && request.resource.data.unitId == resource.data.unitId
        && request.resource.data.participantUids == resource.data.participantUids;
    }

    function assistantMayManageVolunteerUser() {
      return isActivityAssistant()
        && resource.data.role == 'volunteer'
        && request.resource.data.role == 'volunteer'
        && ('unitIds' in resource.data)
        && ('unitIds' in currentUser())
        && resource.data.unitIds.hasAny(currentUser().unitIds)
        && request.resource.data.unitIds == resource.data.unitIds
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'active', 'updatedAt'
        ]);
    }

"""
rules = rules.replace(marker, helper + marker, 1)
rules = rules.replace("      allow read: if (signedIn() && request.auth.uid == uid) || isManager();\n      allow create, delete: if isManager();\n      allow update: if isManager() || participantMarksFirstAccess(uid);", "      allow read: if (signedIn() && request.auth.uid == uid) || isManager() || (isActivityAssistant() && ('unitIds' in resource.data) && resource.data.unitIds.hasAny(currentUser().unitIds));\n      allow create, delete: if isManager();\n      allow update: if isManager() || assistantMayManageVolunteerUser() || participantMarksFirstAccess(uid);")
rules = rules.replace("      allow update: if isManager()\n        || assistantMayRequestApplicationAdjustment()", "      allow update: if isManager()\n        || assistantMayManageApplication()\n        || assistantMayRequestApplicationAdjustment()")
rules = rules.replace("        allow read: if activeUser() && managerOfApplication(applicationId);", "        allow read: if activeUser() && (managerOfApplication(applicationId) || assistantOfApplication(applicationId));")
p.write_text(rules, encoding='utf-8')

# Occupancy: actually apply unit scope (the caller already passes unitId).
p = Path('js/services/application-service.js')
app = p.read_text(encoding='utf-8')
old = """    async listOccupancyMonth(month){
      if(!month)return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,started=Date.now();
        const snapshot=await firestore.getDocs(firestore.query(
          firestore.collection(context.db,'applications'),
          firestore.where('status','==','approved'),
          firestore.where('stayMonths','array-contains',String(month))
        ));
        services.recordQuery?.('applications/occupancy-month',started,snapshot.size,{month:String(month)});
        return snapshot.docs.map(mapApplication).filter(row=>!row.inactive);
      },{loading:false});
    },"""
new = """    async listOccupancyMonth(month,{unitId='all'}={}){
      if(!month)return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,started=Date.now(),constraints=[firestore.where('status','==','approved'),firestore.where('stayMonths','array-contains',String(month))],normalizedUnit=unitId&&unitId!=='all'?normalize(unitId):'';
        if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/occupancy-month',started,snapshot.size,{month:String(month),unitId:normalizedUnit||'all'});
        return snapshot.docs.map(mapApplication).filter(row=>!row.inactive);
      },{loading:false,monitor:{area:'applications',action:'occupancy_month'}});
    },"""
if old not in app:
    raise SystemExit('occupancy function marker missing')
p.write_text(app.replace(old, new, 1), encoding='utf-8')

# Slow-query telemetry from existing query budget metrics.
p = Path('js/services/service-core.js')
core = p.read_text(encoding='utf-8')
core = core.replace("    if(row.ms>1200)console.warn(`[Firestore lento] ${row.name}: ${row.ms}ms • ${row.count} docs`,meta);", "    if(row.ms>1200){console.warn(`[Firestore lento] ${row.name}: ${row.ms}ms • ${row.count} docs`,meta);window.OleiroMonitoring?.captureSlowQuery?.(row)}")
p.write_text(core, encoding='utf-8')

# Sentry: application errors, browser tracing, privacy-safe error replay, slow Firestore query events.
p = Path('js/shared/monitoring.js')
mon = p.read_text(encoding='utf-8')
old = "    if(!criticalCodes.has(code)&&!permissionMessage)return null;\n    return captureException(error,{...meta,firebaseCode:code||'permission-denied'});"
new = "    const level=criticalCodes.has(code)||permissionMessage?'critical':'application';\n    return captureException(error,{...meta,firebaseCode:code||'',severity:level});"
if old not in mon:
    raise SystemExit('captureServiceError marker missing')
mon = mon.replace(old, new, 1)
marker = "  function flushQueue(){while(queue.length){const item=queue.shift();sendException(item.error,item.meta)}}\n"
extra = """  function captureSlowQuery(row={}) {
    if(!config.enabled||!config.dsn||Number(row.ms||0)<1200)return null;
    return captureException(new Error(`Slow Firestore query: ${String(row.name||'unknown')} (${Number(row.ms)||0}ms)`),{area:'performance',action:'slow_firestore_query',extra:{query:String(row.name||''),durationMs:Number(row.ms)||0,count:Number(row.count)||0,unitId:row.unitId||'',status:row.status||''}});
  }
"""
if marker not in mon:
    raise SystemExit('flush marker missing')
mon = mon.replace(marker, marker + extra, 1)
old_init = """        window.Sentry.init({
          dsn:String(config.dsn),
          environment:String(config.environment||'production'),
          release:String(config.release||''),
          sendDefaultPii:false,
          tracesSampleRate:0,
          beforeSend,
          beforeBreadcrumb
        });"""
new_init = """        const integrations=[];
        if(typeof window.Sentry.browserTracingIntegration==='function')integrations.push(window.Sentry.browserTracingIntegration());
        if(typeof window.Sentry.replayIntegration==='function')integrations.push(window.Sentry.replayIntegration({maskAllText:true,blockAllMedia:true,maskAllInputs:true}));
        window.Sentry.init({
          dsn:String(config.dsn),
          environment:String(config.environment||'production'),
          release:String(config.release||''),
          sendDefaultPii:false,
          integrations,
          tracesSampleRate:0.1,
          replaysSessionSampleRate:0,
          replaysOnErrorSampleRate:0.1,
          beforeSend,
          beforeBreadcrumb
        });"""
if old_init not in mon:
    raise SystemExit('Sentry init marker missing')
mon = mon.replace(old_init, new_init, 1)
mon = mon.replace("    captureServiceError,\n", "    captureServiceError,\n    captureSlowQuery,\n", 1)
p.write_text(mon, encoding='utf-8')

# Staff provisioning utility.
tool = """const admin=require('firebase-admin');
if(!admin.apps.length)admin.initializeApp();
const auth=admin.auth(),db=admin.firestore();
const [emailArg,unitArg,nameArg]=process.argv.slice(2);
const email=String(emailArg||'').trim().toLowerCase();
const unitId=String(unitArg||'').trim().toLowerCase();
const name=String(nameArg||'').trim();
if(!email||!unitId)throw new Error('Uso: npm run admin:staff -- EMAIL UNIDADE "NOME"');
if(!['rodeio','indaial'].includes(unitId))throw new Error('Unidade inválida. Use rodeio ou indaial.');
(async()=>{
  let user;
  try{user=await auth.getUserByEmail(email)}catch(error){if(error.code!=='auth/user-not-found')throw error;user=await auth.createUser({email,displayName:name||undefined,disabled:false})}
  const ref=db.doc(`users/${user.uid}`),existing=await ref.get(),now=admin.firestore.FieldValue.serverTimestamp();
  await ref.set({email,displayName:name||user.displayName||'',role:'activity_assistant',active:true,unitIds:[unitId],language:'pt',updatedAt:now,...(!existing.exists?{createdAt:now}:{})},{merge:true});
  const link=await auth.generatePasswordResetLink(email);
  console.log(`Assistente configurada: ${email} -> ${unitId}`);
  console.log('Envie este link diretamente à pessoa para definir a senha:');
  console.log(link);
})().catch(error=>{console.error(error);process.exitCode=1});
"""
Path('functions/tools/upsert-staff.js').write_text(tool, encoding='utf-8')
pkg_path = Path('functions/package.json')
pkg = json.loads(pkg_path.read_text(encoding='utf-8'))
pkg.setdefault('scripts', {})['admin:staff'] = 'node tools/upsert-staff.js'
pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Focused static regression tests.
Path('tests/e2e/assistant-observability-perf-r44.spec.js').write_text("""import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('assistant stays unit-scoped and can run candidate lifecycle', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');
  const ui=fs.readFileSync('js/admin/activity-assistant-r31.js','utf8');
  const apps=fs.readFileSync('js/services/application-service.js','utf8');
  expect(rules).toContain('assistantMayManageApplication');
  expect(rules).toContain('assistantMayManageVolunteerUser');
  expect(rules).toContain('resource.data.unitIds.hasAny(currentUser().unitIds)');
  expect(ui).toContain('assistantUnitLabel');
  expect(ui).not.toContain("['approveCandidate','rejectCandidate','reactivateCandidate'");
  expect(apps).toContain("async listOccupancyMonth(month,{unitId='all'}={})");
  expect(apps).toContain("firestore.where('unitId','==',normalizedUnit)");
});

test('monitoring includes slow-query, tracing and privacy-safe error replay', async () => {
  const monitoring=fs.readFileSync('js/shared/monitoring.js','utf8');
  const core=fs.readFileSync('js/services/service-core.js','utf8');
  expect(monitoring).toContain('captureSlowQuery');
  expect(monitoring).toContain('tracesSampleRate:0.1');
  expect(monitoring).toContain('replaysOnErrorSampleRate:0.1');
  expect(monitoring).toContain('maskAllText:true');
  expect(core).toContain('captureSlowQuery?.(row)');
});
""", encoding='utf-8')
