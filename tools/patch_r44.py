from pathlib import Path
import json


def replace_once(path, old, new, label):
    p=Path(path); text=p.read_text(encoding='utf-8')
    if old not in text: raise SystemExit(f'{label}: marker not found in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# Firestore: activity assistants become complete operational managers only for assigned units.
rules_path=Path('firestore.rules'); rules=rules_path.read_text(encoding='utf-8')
marker="    function candidateEditable(applicationId) {"
helpers="""    function assistantManagesVolunteer(uid) {
      let user = get(/databases/$(database)/documents/users/$(uid)).data;
      return isActivityAssistant()
        && exists(/databases/$(database)/documents/users/$(uid))
        && user.role == 'volunteer'
        && ('unitIds' in user)
        && user.unitIds.hasAny(currentUser().unitIds);
    }

    function assistantCreatesVolunteer() {
      return isActivityAssistant()
        && request.resource.data.role == 'volunteer'
        && request.resource.data.active == true
        && request.resource.data.unitIds is list
        && request.resource.data.unitIds.size() > 0
        && request.resource.data.unitIds.hasOnly(currentUser().unitIds);
    }

    function assistantUpdatesVolunteer(uid) {
      return assistantManagesVolunteer(uid)
        && request.resource.data.role == resource.data.role
        && request.resource.data.unitIds == resource.data.unitIds
        && request.resource.data.email == resource.data.email
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'active', 'updatedAt'
        ]);
    }

    function assistantReadsVolunteerProfile(uid) {
      return assistantManagesVolunteer(uid);
    }

    function assistantCreatesVolunteerProfile(uid) {
      let user = getAfter(/databases/$(database)/documents/users/$(uid)).data;
      return isActivityAssistant()
        && user.role == 'volunteer'
        && ('unitIds' in user)
        && user.unitIds.hasAny(currentUser().unitIds);
    }

    function assistantUpdatesVolunteerProfile(uid) {
      return assistantManagesVolunteer(uid)
        && request.resource.data.email == resource.data.email
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'name', 'fullName', 'phone', 'whatsapp', 'country', 'nationality',
          'language', 'gender', 'emergencyContact', 'updatedAt'
        ]);
    }

    function assistantCreatesApplication() {
      let uids = request.resource.data.participantUids;
      let unitId = request.resource.data.unitId;
      let firstUser = getAfter(/databases/$(database)/documents/users/$(uids[0])).data;
      return isActivityAssistant()
        && assistantHasUnit(unitId)
        && uids is list
        && uids.size() in [1, 2]
        && firstUser.role == 'volunteer'
        && ('unitIds' in firstUser)
        && firstUser.unitIds.hasAny([unitId])
        && (
          uids.size() == 1
          || (
            getAfter(/databases/$(database)/documents/users/$(uids[1])).data.role == 'volunteer'
            && getAfter(/databases/$(database)/documents/users/$(uids[1])).data.unitIds.hasAny([unitId])
          )
        );
    }

    function assistantMayOperateApplication() {
      let changed = request.resource.data.diff(resource.data).affectedKeys();
      return assistantHasUnit(resource.data.unitId)
        && request.resource.data.unitId == resource.data.unitId
        && request.resource.data.participantUids == resource.data.participantUids
        && changed.hasOnly([
          'status', 'active', 'planningDeadlineAt', 'planningSubmittedAt',
          'planningApprovedAt', 'approvedAt', 'dayAdjustments', 'sessionCount',
          'activityCount', 'planningCountVersion', 'meetingStatus', 'meetingDate',
          'meetingTime', 'meetingDuration', 'meetingLink', 'meetingNotes',
          'meetingScheduledAt', 'meetingCompletedAt', 'finalDecision',
          'finalDecisionAt', 'finalDecisionByUid', 'rejectedReason', 'rejectedAt',
          'autoRejected', 'needsAdminAttention', 'stayStart', 'stayEnd', 'stayMonths',
          'internalNote', 'updatedAt'
        ])
        && (
          !changed.hasAny(['finalDecisionByUid'])
          || request.resource.data.finalDecisionByUid in ['', request.auth.uid]
        );
    }

"""
if marker not in rules: raise SystemExit('candidateEditable marker not found')
rules=rules.replace(marker,helpers+marker,1)

old="""    match /users/{uid} {
      allow read: if (signedIn() && request.auth.uid == uid) || isManager();
      allow create, delete: if isManager();
      allow update: if isManager() || participantMarksFirstAccess(uid);
    }
"""
new="""    match /users/{uid} {
      allow read: if (signedIn() && request.auth.uid == uid) || isManager() || assistantManagesVolunteer(uid);
      allow create: if isManager() || assistantCreatesVolunteer();
      allow delete: if isManager();
      allow update: if isManager() || assistantUpdatesVolunteer(uid) || participantMarksFirstAccess(uid);
    }
"""
if old not in rules: raise SystemExit('users rules marker not found')
rules=rules.replace(old,new,1)

old="""    match /volunteer_profiles/{uid} {
      allow read: if activeUser() && (request.auth.uid == uid || isManager());
      allow create, delete: if isManager();
      allow update: if isManager() || participantUpdatesEmergencyContact(uid);
    }
"""
new="""    match /volunteer_profiles/{uid} {
      allow read: if activeUser() && (request.auth.uid == uid || isManager() || assistantReadsVolunteerProfile(uid));
      allow create: if isManager() || assistantCreatesVolunteerProfile(uid);
      allow delete: if isManager();
      allow update: if isManager() || assistantUpdatesVolunteerProfile(uid) || participantUpdatesEmergencyContact(uid);
    }
"""
if old not in rules: raise SystemExit('profile rules marker not found')
rules=rules.replace(old,new,1)

old="""      allow create, delete: if isManager();
      allow update: if isManager()
        || assistantMayRequestApplicationAdjustment()
        || participantMaySubmitApplication()
        || participantMayResetEmptyAdjustment();
"""
new="""      allow create: if isManager() || assistantCreatesApplication();
      allow delete: if isManager();
      allow update: if isManager()
        || assistantMayOperateApplication()
        || participantMaySubmitApplication()
        || participantMayResetEmptyAdjustment();
"""
if old not in rules: raise SystemExit('application write marker not found')
rules=rules.replace(old,new,1)
rules=rules.replace('allow read: if activeUser() && managerOfApplication(applicationId);','allow read: if activeUser() && (managerOfApplication(applicationId) || assistantOfApplication(applicationId));',1)

old="""            'notes', 'period', 'time', 'ownerName',
            'reviewStatus', 'reviewNote', 'reviewSubmittedAt', 'reviewRequestNote',
            'reviewBaseline', 'updatedAt'
"""
new="""            'notes', 'period', 'time', 'ownerName', 'status', 'managerCreated',
            'postApprovalProposal', 'reviewStatus', 'reviewNote', 'reviewSubmittedAt',
            'reviewRequestNote', 'reviewBaseline', 'reviewedAt', 'rejectedAt', 'updatedAt'
"""
if old not in rules: raise SystemExit('activity assistant fields marker not found')
rules=rules.replace(old,new,1)

old="""            'adminAdjustmentBaseline', 'reviewStatus', 'reviewNote',
            'reviewSubmittedAt', 'reviewRequestNote', 'reviewBaseline', 'updatedAt'
"""
new="""            'adminAdjustmentBaseline', 'postApprovalProposal', 'reviewStatus', 'reviewNote',
            'reviewSubmittedAt', 'reviewRequestNote', 'reviewBaseline', 'reviewedAt',
            'confirmedAt', 'rejectedAt', 'managerCreated', 'updatedAt'
"""
if old not in rules: raise SystemExit('session assistant fields marker not found')
rules=rules.replace(old,new,1)
rules_path.write_text(rules,encoding='utf-8')

# Application aggregate/preview queries become optionally unit-scoped.
path=Path('js/services/application-service.js'); text=path.read_text(encoding='utf-8')
old="""    async countStatus(status){
      if(!status||status==='all')return 0;
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        if(typeof firestore.getCountFromServer!=='function')throw new Error('Contagem agregada do Firestore indisponível. A leitura ampla foi bloqueada.');
        const q=firestore.query(firestore.collection(context.db,'applications'),firestore.where('status','==',String(status))),started=Date.now();
        const snapshot=await firestore.getCountFromServer(q),count=Number(snapshot.data().count)||0;services.recordQuery?.('applications/count-status',started,count,{status:String(status),aggregation:true});return count;
      },{loading:false});
    },
"""
new="""    async countStatus(status,{unit='all'}={}){
      if(!status||status==='all')return 0;
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        if(typeof firestore.getCountFromServer!=='function')throw new Error('Contagem agregada do Firestore indisponível. A leitura ampla foi bloqueada.');
        const normalizedUnit=unit&&unit!=='all'?normalize(unit):'',constraints=[firestore.where('status','==',String(status))];
        if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));
        const q=firestore.query(firestore.collection(context.db,'applications'),...constraints),started=Date.now();
        const snapshot=await firestore.getCountFromServer(q),count=Number(snapshot.data().count)||0;services.recordQuery?.('applications/count-status',started,count,{status:String(status),unit:normalizedUnit||'all',aggregation:true});return count;
      },{loading:false});
    },
"""
if old not in text: raise SystemExit('countStatus marker not found')
text=text.replace(old,new,1)
old="""    async listUpcoming({field='stayStart',from,limit=3}={}){
      if(!from||!['stayStart','stayEnd'].includes(field))return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,max=Math.max(1,Math.min(Number(limit)||3,10)),started=Date.now();
        const snapshot=await firestore.getDocs(firestore.query(
          firestore.collection(context.db,'applications'),
          firestore.where('status','==','approved'),
          firestore.where(field,'>=',String(from)),
          firestore.orderBy(field,'asc'),
          firestore.limit(max)
        ));
        services.recordQuery?.('applications/upcoming',started,snapshot.size,{field,from:String(from),limit:max});
        return snapshot.docs.map(mapApplication).filter(row=>!row.inactive);
      },{loading:false});
    },
"""
new="""    async listUpcoming({field='stayStart',from,limit=3,unit='all'}={}){
      if(!from||!['stayStart','stayEnd'].includes(field))return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,max=Math.max(1,Math.min(Number(limit)||3,10)),normalizedUnit=unit&&unit!=='all'?normalize(unit):'',constraints=[firestore.where('status','==','approved')],started=Date.now();
        if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));
        constraints.push(firestore.where(field,'>=',String(from)),firestore.orderBy(field,'asc'),firestore.limit(max));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/upcoming',started,snapshot.size,{field,from:String(from),limit:max,unit:normalizedUnit||'all'});
        return snapshot.docs.map(mapApplication).filter(row=>!row.inactive);
      },{loading:false});
    },
"""
if old not in text: raise SystemExit('listUpcoming marker not found')
text=text.replace(old,new,1); path.write_text(text,encoding='utf-8')

# Pending reviews use unit filters instead of global scans.
path=Path('js/services/planning-service.js'); text=path.read_text(encoding='utf-8')
old="""    async listPendingChanges({limit=100}={}){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;const max=Math.max(1,Math.min(Number(limit)||100,200)),started=Date.now();
        const [changesSnapshot,proposalSnapshot]=await Promise.all([
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('status','==','change_requested'),firestore.limit(max))),
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('reviewStatus','==','analysis'),firestore.limit(max)))
        ]);
        services.recordQuery?.('activity_sessions/pending-review',started,changesSnapshot.size+proposalSnapshot.size,{queries:2,limit:max});
        const rows=[
          ...changesSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'change'})),
          ...proposalSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'post_approval'}))
        ];
        const unique=new Map();rows.forEach(row=>unique.set(String(row.id),row));return [...unique.values()].slice(0,max);
      },{loading:false});
    },
"""
new="""    async listPendingChanges({limit=100,unitId='all'}={}){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;const max=Math.max(1,Math.min(Number(limit)||100,200)),normalizedUnit=unitId&&unitId!=='all'?String(unitId).toLowerCase():'',started=Date.now();
        const changes=[firestore.where('status','==','change_requested')],proposals=[firestore.where('reviewStatus','==','analysis')];
        if(normalizedUnit){changes.push(firestore.where('unitId','==',normalizedUnit));proposals.push(firestore.where('unitId','==',normalizedUnit))}
        changes.push(firestore.limit(max));proposals.push(firestore.limit(max));
        const [changesSnapshot,proposalSnapshot]=await Promise.all([
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),...changes)),
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),...proposals))
        ]);
        services.recordQuery?.('activity_sessions/pending-review',started,changesSnapshot.size+proposalSnapshot.size,{queries:2,limit:max,unitId:normalizedUnit||'all'});
        const rows=[
          ...changesSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'change'})),
          ...proposalSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'post_approval'}))
        ];
        const unique=new Map();rows.forEach(row=>unique.set(String(row.id),row));return [...unique.values()].slice(0,max);
      },{loading:false});
    },
"""
if old not in text: raise SystemExit('pending changes marker not found')
text=text.replace(old,new,1); path.write_text(text,encoding='utf-8')

# Expiration maintenance is scoped too.
path=Path('js/services/application-maintenance-service.js'); text=path.read_text(encoding='utf-8')
if "processExpiredPending=async function({pageSize=50}={})" not in text: raise SystemExit('expired signature marker not found')
text=text.replace("processExpiredPending=async function({pageSize=50}={})","processExpiredPending=async function({pageSize=50,unit='all'}={})",1)
old="""        const snapshot=await firestore.getDocs(firestore.query(
          firestore.collection(context.db,'applications'),
          firestore.where('status','==','pending'),
          firestore.where('planningDeadlineAt','<=',firestore.Timestamp.fromDate(new Date())),
          firestore.orderBy('planningDeadlineAt','asc'),
          firestore.limit(max)
        ));
        services.recordQuery?.('applications/expired-pending',started,snapshot.size,{page:page+1,limit:max});
"""
new="""        const normalizedUnit=unit&&unit!=='all'?String(unit).toLowerCase():'',constraints=[firestore.where('status','==','pending')];
        if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));
        constraints.push(firestore.where('planningDeadlineAt','<=',firestore.Timestamp.fromDate(new Date())),firestore.orderBy('planningDeadlineAt','asc'),firestore.limit(max));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/expired-pending',started,snapshot.size,{page:page+1,limit:max,unit:normalizedUnit||'all'});
"""
if old not in text: raise SystemExit('expired query marker not found')
text=text.replace(old,new,1); path.write_text(text,encoding='utf-8')

# Admin frontend clamps all activity-assistant reads to assigned unit(s).
path=Path('js/admin/app.js'); text=path.read_text(encoding='utf-8')
marker="let _managerBackgroundWarmupScheduled=false;\n"
helper=marker+"""function managerIsActivityAssistant(){return String(state.currentSession?.user?.role||'')==='activity_assistant'}
function managerAssignedUnitIds(){return managerIsActivityAssistant()?[...new Set((state.currentSession?.user?.unitIds||[]).map(value=>String(value||'').toLowerCase()).filter(Boolean))]:[]}
function managerScopeUnitId(requested='all'){
  const normalized=String(requested||'all').toLowerCase();if(!managerIsActivityAssistant())return normalized||'all';
  const allowed=managerAssignedUnitIds();return allowed.includes(normalized)?normalized:(allowed[0]||'__no_unit__');
}
window.managerIsActivityAssistant=managerIsActivityAssistant;window.managerScopeUnitId=managerScopeUnitId;
"""
if marker not in text: raise SystemExit('admin helper marker not found')
text=text.replace(marker,helper,1)
old="async function hydrateManagerSchedule(from=_oleiroToday,to=_oleiroToday,{force=false,unitId='all'}={}){\n  if(!window.OleiroServices?.planning?.listManagerSchedule)return [];"
new=old+"\n  unitId=managerScopeUnitId(unitId);"
if old not in text: raise SystemExit('schedule scope marker not found')
text=text.replace(old,new,1)
text=text.replace("listPendingChanges({limit:100})","listPendingChanges({limit:100,unitId:managerScopeUnitId(state.candidateUnit||'all')})",1)
text=text.replace("unit:state.candidateUnit||'all',search:String(state.candidateSearch||'').trim().toLocaleLowerCase('pt-BR')","unit:managerScopeUnitId(state.candidateUnit||'all'),search:String(state.candidateSearch||'').trim().toLocaleLowerCase('pt-BR')",1)
text=text.replace("status:state.candidateFilter||'approved',unit:state.candidateUnit||'all',search:state.candidateSearch||'',","status:state.candidateFilter||'approved',unit:managerScopeUnitId(state.candidateUnit||'all'),search:state.candidateSearch||'',",1)
old="""  const service=window.OleiroServices.applications;
  _managerDashboardPromise=Promise.allSettled([
    service.countStatus?.('analysis')??0,service.countStatus?.('adjustments')??0,
    service.listUpcoming?.({field:'stayStart',from:_oleiroToday,limit:3})??[],
    service.listUpcoming?.({field:'stayEnd',from:_oleiroToday,limit:3})??[]
  ]).then(results=>{
"""
new="""  const service=window.OleiroServices.applications,unit=managerScopeUnitId(state.candidateUnit||'all');
  _managerDashboardPromise=Promise.allSettled([
    service.countStatus?.('analysis',{unit})??0,service.countStatus?.('adjustments',{unit})??0,
    service.listUpcoming?.({field:'stayStart',from:_oleiroToday,limit:3,unit})??[],
    service.listUpcoming?.({field:'stayEnd',from:_oleiroToday,limit:3,unit})??[]
  ]).then(results=>{
"""
if old not in text: raise SystemExit('dashboard scope marker not found')
text=text.replace(old,new,1)
text=text.replace("state.candidateFilter=state.candidateFilter||'approved';state.candidateUnit=state.candidateUnit||'all';state.candidateSearch=state.candidateSearch||'';","state.candidateFilter=state.candidateFilter||'approved';state.candidateUnit=managerScopeUnitId(state.candidateUnit||'all');state.candidateSearch=state.candidateSearch||'';",1)
text=text.replace("state.units=unitsResult||[];","state.units=managerIsActivityAssistant()?(unitsResult||[]).filter(unit=>managerAssignedUnitIds().includes(String(unit.id||'').toLowerCase())):(unitsResult||[]);",1)
path.write_text(text,encoding='utf-8')

path=Path('js/admin/expired-maintenance.js'); text=path.read_text(encoding='utf-8')
text=text.replace("processExpiredPending({pageSize:50})","processExpiredPending({pageSize:50,unit:typeof managerScopeUnitId==='function'?managerScopeUnitId(state.candidateUnit||'all'):'all'})",1)
path.write_text(text,encoding='utf-8')

# Candidate filters no longer offer another unit to assistants.
path=Path('js/admin/voluntariado.js'); text=path.read_text(encoding='utf-8')
marker="function openCandidateFilters(){"
helper="function candidateUnitFilterOptions(){const units=(state.units||[]).map(unit=>[String(unit.id||'').toLowerCase(),unit.name||unit.label||String(unit.id||'')]).filter(([id])=>id);return (typeof managerIsActivityAssistant==='function'&&managerIsActivityAssistant()?units:[['all','Todas as unidades'],...units]);}\n"
if marker not in text: raise SystemExit('candidate filters marker not found')
text=text.replace(marker,helper+marker,1)
old="${[['all','Todas as unidades'],['Rodeio','Rodeio'],['Indaial','Indaial']].map(([id,l])=>`<option value=\"${id}\" ${unit===id?'selected':''}>${l}</option>`).join('')}"
new="${candidateUnitFilterOptions().map(([id,l])=>`<option value=\"${id}\" ${String(unit).toLowerCase()===String(id).toLowerCase()?'selected':''}>${escapeHtml(l)}</option>`).join('')}"
if old not in text: raise SystemExit('candidate unit option marker not found')
text=text.replace(old,new,1)
text=text.replace("state.candidateUnit=document.getElementById('candidateUnitFilter')?.value||'all';","{const requested=document.getElementById('candidateUnitFilter')?.value||'all';state.candidateUnit=typeof managerScopeUnitId==='function'?managerScopeUnitId(requested):requested;}",1)
text=text.replace("function clearCandidateFilters(){state.candidateFilter='approved';state.candidateUnit='all';","function clearCandidateFilters(){state.candidateFilter='approved';state.candidateUnit=typeof managerScopeUnitId==='function'?managerScopeUnitId('all'):'all';",1)
path.write_text(text,encoding='utf-8')

# Composite indexes for scoped dashboard/review/expiry queries.
p=Path('firestore.indexes.json'); data=json.loads(p.read_text(encoding='utf-8'))
wanted=[
  {'collectionGroup':'applications','queryScope':'COLLECTION','fields':[{'fieldPath':'unitId','order':'ASCENDING'},{'fieldPath':'status','order':'ASCENDING'}]},
  {'collectionGroup':'applications','queryScope':'COLLECTION','fields':[{'fieldPath':'unitId','order':'ASCENDING'},{'fieldPath':'status','order':'ASCENDING'},{'fieldPath':'planningDeadlineAt','order':'ASCENDING'}]},
  {'collectionGroup':'activity_sessions','queryScope':'COLLECTION','fields':[{'fieldPath':'unitId','order':'ASCENDING'},{'fieldPath':'status','order':'ASCENDING'}]}
]
existing={json.dumps(item,sort_keys=True) for item in data.get('indexes',[])}
for item in wanted:
    key=json.dumps(item,sort_keys=True)
    if key not in existing:data.setdefault('indexes',[]).append(item);existing.add(key)
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Correct error-code precedence in expanded monitoring.
p=Path('js/shared/monitoring.js'); text=p.read_text(encoding='utf-8')
old="return captureException(error,{...meta,firebaseCode:code||permissionMessage?'permission-denied':'unexpected'});"
new="return captureException(error,{...meta,firebaseCode:code||(permissionMessage?'permission-denied':'unexpected')});"
if old not in text: raise SystemExit('monitor error-code marker not found')
p.write_text(text.replace(old,new,1),encoding='utf-8')

# Static regression covering permissions, query scope and telemetry.
test="""import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('activity assistant is unit-scoped but operationally complete', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');
  const admin=fs.readFileSync('js/admin/app.js','utf8');
  const apps=fs.readFileSync('js/services/application-service.js','utf8');
  const planning=fs.readFileSync('js/services/planning-service.js','utf8');
  expect(rules).toContain('assistantMayOperateApplication');
  expect(rules).toContain('assistantCreatesApplication');
  expect(rules).toContain('assistantUpdatesVolunteer');
  expect(rules).toContain("'confirmedAt', 'rejectedAt', 'managerCreated'");
  expect(admin).toContain('managerScopeUnitId');
  expect(admin).toContain("listPendingChanges({limit:100,unitId:managerScopeUnitId");
  expect(apps).toContain("async countStatus(status,{unit='all'}={})");
  expect(planning).toContain("async listPendingChanges({limit=100,unitId='all'}={})");
});

test('observability includes tracing, slow queries and strict privacy defaults', async () => {
  const monitor=fs.readFileSync('js/shared/monitoring.js','utf8');
  const core=fs.readFileSync('js/services/service-core.js','utf8');
  expect(monitor).toContain('browserTracingIntegration');
  expect(monitor).toContain('tracesSampleRate:0.10');
  expect(monitor).toContain('recordQueryMetric');
  expect(monitor).toContain('Slow Firestore query');
  expect(monitor).toContain('sendDefaultPii:false');
  expect(monitor).toContain("privacyMode:'no-default-pii-no-replay'");
  expect(core).toContain('OleiroMonitoring?.recordQueryMetric?.(row)');
  expect(monitor).not.toContain('replayIntegration(');
});

test('staff provisioning never grants coordinator or admin', async () => {
  const pkg=fs.readFileSync('functions/package.json','utf8');
  const tool=fs.readFileSync('functions/tools/create-staff.js','utf8');
  expect(pkg).toContain('admin:create-staff');
  expect(tool).toContain("role!=='activity_assistant'");
  expect(tool).toContain("role:'activity_assistant'");
  expect(tool).toContain('unitIds:[String(unit.id)]');
});
"""
Path('tests/e2e/assistant-observability-r44.spec.js').write_text(test,encoding='utf-8')
