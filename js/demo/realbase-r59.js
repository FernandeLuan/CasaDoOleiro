/* R59 — camada de homologação. Reutiliza a UI real e substitui somente Auth/Services por memória local. */
(function realBaseDemoR59(){
  const params=new URLSearchParams(location.search);const requested=params.get('demo');
  const previewHost=/--visual-redesign-|--realbase-|localhost|127\.0\.0\.1/.test(location.hostname);
  if(!requested&&!previewHost)return;
  const role=requested||(/\/admin\//.test(location.pathname)?'admin':null);
  if(!['admin','candidate','volunteer'].includes(role)){
    if(!/\/homologacao\//.test(location.pathname))location.replace('/homologacao/');
    return;
  }
  window.__OLEIRO_DEMO__={role,version:'r59-realbase'};
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const nowIso=()=>new Date().toISOString();
  const uid=prefix=>`${prefix}-${Math.random().toString(36).slice(2,9)}`;
  const stayMonths=(start,end)=>{const out=[];if(!start||!end)return out;const d=new Date(start+'T12:00:00'),last=new Date(end+'T12:00:00');d.setDate(1);last.setDate(1);while(d<=last){out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()+1)}return out};
  const syncAliases=a=>{a.applicationId=a.id;a.name=(a.participantNames||[]).join(' + ')||a.name||'Voluntário';a.country=(a.participantCountries||[]).join(' / ')||a.country||'—';a.email=(a.participantEmails||[]).join(', ')||a.email||'';a.phone=(a.participantPhones||[]).join(' / ')||a.phone||'';a.unit=a.unitName||a.unitId||'—';a.from=String(a.stayStart||a.from||'').slice(0,10);a.to=String(a.stayEnd||a.to||'').slice(0,10);a.stayStart=a.from;a.stayEnd=a.to;a.pendingUntil=a.planningDeadlineAt||null;a.submitted=a.planningSubmittedAt||'—';a.sessions=Number(a.sessionCount||0);a.activities=Number(a.activityCount||0);a.inactive=a.active===false;a.profileHydrated=true;a.dayAdjustments=a.dayAdjustments||{};a.stayMonths=a.stayMonths?.length?a.stayMonths:stayMonths(a.from,a.to);return a};
  const app=(data)=>syncAliases({active:true,planningCountVersion:1,participantCount:1,participantStatus:{},participantPhones:[],participantGenders:['male'],dayAdjustments:{},meetingStatus:'pending',meetingDuration:30,...data});

  const db={
    units:[{id:'rodeio',name:'Rodeio',active:true,acceptingVolunteers:true},{id:'indaial',name:'Indaial',active:true,acceptingVolunteers:true}],
    groups:{
      rodeio:['A','B','C','D'].map((code,i)=>({id:`rodeio_${code}`,code,unitId:'rodeio',capacity:5,note:i===0?'Grupo de referência da manhã':'',members:i===0?['Carlos','Marina','João']:i===1?['Ana','Pedro']:[]})),
      indaial:['A','B','C','D'].map((code,i)=>({id:`indaial_${code}`,code,unitId:'indaial',capacity:5,note:'',members:i===0?['Rafael','Bianca']:[]}))
    },
    applications:[
      app({id:'josias',type:'individual',participantUids:['u-josias'],participantNames:['Josias Almeida'],participantEmails:['josias.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1001'],participantGenders:['male'],unitId:'rodeio',unitName:'Rodeio',status:'meeting',stayStart:'2026-09-07',stayEnd:'2026-09-21',planningSubmittedAt:'2026-09-01T15:00:00Z',planningApprovedAt:'2026-09-02T10:00:00Z',meetingStatus:'scheduled',meetingDate:'2026-09-04',meetingTime:'15:00',meetingDuration:30,meetingLink:'https://meet.google.com/demo-oleiro',meetingNotes:'Conversa de alinhamento final.',sessionCount:6,activityCount:5,registrationLink:'https://www.worldpackers.com/',internalNote:'Perfil demonstrativo completo.'}),
      app({id:'maria',type:'individual',participantUids:['u-maria'],participantNames:['Maria Fernanda de Oliveira Albuquerque'],participantEmails:['maria.demo@oleiro.test'],participantCountries:['Argentina'],participantPhones:['+54 11 5555-1002'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'pending',stayStart:'2026-09-10',stayEnd:'2026-09-24',planningDeadlineAt:'2026-09-08T23:59:00Z',sessionCount:1,activityCount:1,registrationLink:'https://www.worldpackers.com/',internalNote:''}),
      app({id:'leonardo',type:'individual',participantUids:['u-leonardo'],participantNames:['Leonardo Martins'],participantEmails:['leonardo.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1003'],participantGenders:['male'],unitId:'rodeio',unitName:'Rodeio',status:'analysis',stayStart:'2026-09-12',stayEnd:'2026-09-26',planningSubmittedAt:'2026-09-02T12:30:00Z',sessionCount:3,activityCount:2}),
      app({id:'anna',type:'individual',participantUids:['u-anna'],participantNames:['Anna Schneider'],participantEmails:['anna.demo@oleiro.test'],participantCountries:['Alemanha'],participantPhones:['+49 151 55501004'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'adjustments',stayStart:'2026-09-14',stayEnd:'2026-09-28',planningSubmittedAt:'2026-09-01T09:00:00Z',planningDeadlineAt:'2026-09-09T23:59:00Z',dayAdjustments:{'2026-09-16':{status:'requested',note:'Reduzir a duração total do dia para até 3 horas.'}},sessionCount:3,activityCount:2}),
      app({id:'lucas-rafael',type:'couple',participantUids:['u-lucas','u-rafael'],participantNames:['Lucas Ferreira','Rafael Souza'],participantEmails:['lucas.demo@oleiro.test','rafael.demo@oleiro.test'],participantCountries:['Brasil','Brasil'],participantPhones:['+55 47 99999-1005','+55 47 99999-1006'],participantGenders:['male','male'],participantCount:2,unitId:'rodeio',unitName:'Rodeio',status:'approved',stayStart:'2026-09-18',stayEnd:'2026-10-02',planningSubmittedAt:'2026-08-30T10:00:00Z',meetingStatus:'completed',finalDecision:'approved',finalDecisionAt:'2026-09-01T18:00:00Z',sessionCount:4,activityCount:3}),
      app({id:'sofia',type:'individual',participantUids:['u-sofia'],participantNames:['Sofía Ramírez'],participantEmails:['sofia.demo@oleiro.test'],participantCountries:['Chile'],participantPhones:['+56 9 5555 1007'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'meeting',stayStart:'2026-09-20',stayEnd:'2026-10-04',meetingStatus:'pending',sessionCount:2,activityCount:2}),
      app({id:'bruno',type:'individual',participantUids:['u-bruno'],participantNames:['Bruno Costa'],participantEmails:['bruno.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1008'],participantGenders:['male'],unitId:'rodeio',unitName:'Rodeio',status:'rejected',active:false,stayStart:'2026-09-22',stayEnd:'2026-10-05',meetingStatus:'completed',finalDecision:'rejected',rejectedReason:'Perfil não alinhado ao período disponível.',sessionCount:1,activityCount:1})
    ],
    profiles:{
      'u-josias':{id:'u-josias',name:'Josias Almeida',fullName:'Josias Almeida',email:'josias.demo@oleiro.test',phone:'+55 47 99999-1001',country:'Brasil',language:'pt',gender:'male',emergencyContact:{name:'Marcos Almeida',relationship:'Irmão',phone:'+55 47 99999-9001'}},
      'u-maria':{id:'u-maria',name:'Maria Fernanda de Oliveira Albuquerque',fullName:'Maria Fernanda de Oliveira Albuquerque',email:'maria.demo@oleiro.test',phone:'+54 11 5555-1002',country:'Argentina',language:'es',gender:'female',emergencyContact:{name:'Lucía Albuquerque',relationship:'Mãe',phone:'+54 11 5555-9002'}},
      'u-leonardo':{id:'u-leonardo',name:'Leonardo Martins',email:'leonardo.demo@oleiro.test',phone:'+55 47 99999-1003',country:'Brasil',language:'pt',gender:'male',emergencyContact:{name:'Paulo Martins',relationship:'Pai',phone:'+55 47 99999-9003'}},
      'u-anna':{id:'u-anna',name:'Anna Schneider',email:'anna.demo@oleiro.test',phone:'+49 151 55501004',country:'Alemanha',language:'en',gender:'female',emergencyContact:{name:'Klara Schneider',relationship:'Sister',phone:'+49 151 55509004'}},
      'u-lucas':{id:'u-lucas',name:'Lucas Ferreira',email:'lucas.demo@oleiro.test',phone:'+55 47 99999-1005',country:'Brasil',language:'pt',gender:'male',emergencyContact:{name:'Fernanda Ferreira',relationship:'Irmã',phone:'+55 47 99999-9005'}},
      'u-rafael':{id:'u-rafael',name:'Rafael Souza',email:'rafael.demo@oleiro.test',phone:'+55 47 99999-1006',country:'Brasil',language:'pt',gender:'male',emergencyContact:{name:'Márcia Souza',relationship:'Mãe',phone:'+55 47 99999-9006'}},
      'u-sofia':{id:'u-sofia',name:'Sofía Ramírez',email:'sofia.demo@oleiro.test',phone:'+56 9 5555 1007',country:'Chile',language:'es',gender:'female',emergencyContact:{name:'Diego Ramírez',relationship:'Hermano',phone:'+56 9 5555 9007'}}
    },
    sessions:[],histories:{},
  };

  function addSession(applicationId,id,date,name,{duration=60,period='Sem preferência',participation='Livre',materials='',notes='',description='',status='proposed',groupId=null,managerCreated=false,postApprovalProposal=false,reviewStatus='',reviewNote='',adminAdjustmentStatus='',adminAdjustmentNote=''}={}){
    const activityId=`a-${id}`;db.sessions.push({id:`s-${id}`,sessionId:`s-${id}`,applicationId,activityId,unitId:db.applications.find(a=>a.id===applicationId)?.unitId||'rodeio',date,activityName:name,activityDescription:description,duration,period,participation,materials,notes,ownerName:db.applications.find(a=>a.id===applicationId)?.name||'Voluntário',status,groupId,managerCreated,postApprovalProposal,reviewStatus,reviewNote,adminAdjustmentStatus,adminAdjustmentNote,createdByUid:db.applications.find(a=>a.id===applicationId)?.participantUids?.[0]||'demo'});return activityId;
  }
  addSession('josias','josias-pilates','2026-09-11','Introdução ao Pilates',{period:'Manhã',description:'Explicação introdutória sobre a atividade e exercícios leves de força e flexibilidade.',status:'plan_approved',participation:'Livre'});
  addSession('josias','josias-idiomas','2026-09-14','Idiomas',{period:'Tarde',description:'Conversação e apoio em idiomas.',status:'plan_approved'});
  addSession('josias','josias-musica','2026-09-15','Música e expressão',{period:'Tarde',duration:90,status:'plan_approved'});
  addSession('josias','josias-mercado','2026-09-16','Mercado de trabalho',{period:'Manhã',duration:180,status:'plan_approved'});
  const comp=addSession('josias','josias-compostagem','2026-09-17','Compostagem',{period:'Tarde',duration:90,status:'plan_approved',materials:'Resíduos orgânicos e ferramentas'});
  db.sessions.push({...clone(db.sessions.at(-1)),id:'s-josias-compostagem-2',sessionId:'s-josias-compostagem-2',date:'2026-09-18',activityId:comp,duration:60});
  addSession('maria','maria-idiomas','2026-09-15','Conversação em espanhol',{period:'Tarde',description:'Atividade proposta pela candidata.',status:'proposed'});
  addSession('leonardo','leo-esporte','2026-09-15','Esporte recreativo',{period:'Manhã',status:'proposed'});
  addSession('leonardo','leo-informatica','2026-09-17','Informática básica',{period:'Tarde',duration:120,status:'proposed'});
  db.sessions.push({...clone(db.sessions.at(-1)),id:'s-leo-informatica-2',sessionId:'s-leo-informatica-2',date:'2026-09-18'});
  addSession('anna','anna-idiomas','2026-09-16','Alemão básico',{period:'Manhã',duration:120,status:'proposed',adminAdjustmentStatus:'requested',adminAdjustmentNote:'Reduzir a duração.'});
  addSession('anna','anna-artes','2026-09-17','Artes manuais',{period:'Tarde',duration:90,status:'proposed'});
  db.sessions.push({...clone(db.sessions.at(-1)),id:'s-anna-artes-2',sessionId:'s-anna-artes-2',date:'2026-09-18'});
  addSession('lucas-rafael','lr-cozinha','2026-09-21','Culinária simples',{period:'Manhã',duration:90,status:'confirmed',groupId:'A',managerCreated:true});
  addSession('lucas-rafael','lr-esporte','2026-09-22','Esporte e recreação',{period:'Tarde',duration:60,status:'confirmed',groupId:'Livre',managerCreated:true});
  addSession('lucas-rafael','lr-musica','2026-09-23','Música',{period:'Noite',duration:60,status:'confirmed',groupId:'B',managerCreated:true});
  db.sessions.push({...clone(db.sessions.at(-1)),id:'s-lr-musica-2',sessionId:'s-lr-musica-2',date:'2026-09-24'});
  addSession('sofia','sofia-danca','2026-09-22','Dança e movimento',{period:'Tarde',status:'plan_approved'});
  addSession('sofia','sofia-espanhol','2026-09-23','Espanhol',{period:'Manhã',status:'plan_approved'});
  addSession('bruno','bruno-demo','2026-09-23','Atividade arquivada',{status:'rejected'});

  db.histories={
    josias:[{id:'h1',type:'meeting_scheduled',actorLabel:'Administrador',metadata:{date:'04/09/2026',time:'15:00'},createdAt:nowIso()},{id:'h2',type:'planning_approved',actorLabel:'Administrador',metadata:{},createdAt:'2026-09-02T10:00:00Z'},{id:'h3',type:'candidate_created',actorLabel:'Administrador',metadata:{},createdAt:'2026-08-28T10:00:00Z'}],
    maria:[{id:'hm1',type:'candidate_created',actorLabel:'Administrador',metadata:{},createdAt:'2026-09-01T10:00:00Z'}]
  };
  window.OleiroDemoDB=db;

  const applications=()=>db.applications.map(syncAliases);
  const findApp=id=>applications().find(a=>String(a.id)===String(id));
  const sessionsFor=id=>db.sessions.filter(s=>String(s.applicationId)===String(id));
  const recalc=id=>{const a=findApp(id);if(!a)return;const rows=sessionsFor(id).filter(s=>s.status!=='rejected');a.sessionCount=rows.length;a.activityCount=new Set(rows.map(s=>s.activityId)).size;syncAliases(a)};
  const activityFromSession=s=>({id:s.activityId,applicationId:s.applicationId,name:s.activityName||'Atividade',description:s.activityDescription||'',duration:Number(s.duration)||60,participation:s.participation||'Livre',materials:s.materials||'',notes:s.notes||'',period:s.period||'Sem preferência',time:s.time||'',owner:s.ownerName||'Voluntário',ownerName:s.ownerName||'Voluntário',createdByUid:s.createdByUid||'',managerCreated:s.managerCreated===true,postApprovalProposal:s.postApprovalProposal===true,reviewStatus:s.reviewStatus||'',reviewNote:s.reviewNote||''});
  const serviceFallback=obj=>new Proxy(obj,{get(target,key){if(key in target)return target[key];if(typeof key!=='string')return undefined;return async()=>{if(/^list/.test(key))return [];if(/^count/.test(key))return 0;if(/^get/.test(key))return null;if(/^has|^is/.test(key))return false;return true}}});

  const services=window.OleiroServices=window.OleiroServices||{};
  services.applications=serviceFallback({
    async list({status='approved',unit='all',search='',limit=10}={}){let rows=applications();if(status&&status!=='all')rows=rows.filter(a=>a.status===status);if(unit&&unit!=='all')rows=rows.filter(a=>String(a.unitId).toLowerCase()===String(unit).toLowerCase());const term=String(search||'').trim().toLowerCase();if(term)rows=rows.filter(a=>`${a.name} ${a.email} ${a.country}`.toLowerCase().includes(term));return {items:clone(rows.slice(0,limit)),nextCursor:null,hasMore:false}},
    async countStatus(status){return applications().filter(a=>a.status===status).length},
    async listUpcoming({field='stayStart',from,limit=3}={}){const alias=field==='stayEnd'?'to':'from';return clone(applications().filter(a=>a.status==='approved'&&!a.inactive&&a[alias]>=from).sort((a,b)=>a[alias].localeCompare(b[alias])).slice(0,limit))},
    async listOccupancyMonth(month,{unitId='all'}={}){return clone(applications().filter(a=>a.status==='approved'&&!a.inactive&&a.stayMonths.includes(month)&&(unitId==='all'||a.unitId===unitId)))},
    async getById(id){return clone(findApp(id)||null)},
    async update(id,patch={}){const a=findApp(id);if(!a)return false;Object.assign(a,patch);if(patch.stayStart)a.from=patch.stayStart;if(patch.stayEnd)a.to=patch.stayEnd;syncAliases(a);return true},
    async updateLifecycle(id,{applicationPatch={},participantActive=null}={}){const a=findApp(id);if(!a)return false;Object.assign(a,applicationPatch);if(participantActive!==null)a.active=participantActive===true;syncAliases(a);return true},
    async requestDayAdjustment(id,date,note){const a=findApp(id);a.dayAdjustments[date]={status:'requested',note:String(note||'')};a.status='adjustments';return true},
    async submitPlanning(id){const a=findApp(id);a.status='analysis';a.planningSubmittedAt=nowIso();syncAliases(a);return true},
    async submitPlanningWithSessionAdjustments(id){return this.submitPlanning(id)},
    async resetPlanning(id){const a=findApp(id);db.sessions=db.sessions.filter(s=>s.applicationId!==id);Object.assign(a,{status:'pending',planningSubmittedAt:null,dayAdjustments:{},sessionCount:0,activityCount:0});syncAliases(a);return {deletedSessions:0,deletedActivities:0}},
    async previewStayDateChange(id,{stayStart,stayEnd}={}){const outside=sessionsFor(id).filter(s=>s.date<stayStart||s.date>stayEnd);return {outsideCount:outside.length,outsideDates:[...new Set(outside.map(s=>s.date))],sessionCount:sessionsFor(id).length}},
    async changeStayDates(id,{stayStart,stayEnd}={}){const a=findApp(id);a.stayStart=a.from=stayStart;a.stayEnd=a.to=stayEnd;db.sessions=db.sessions.filter(s=>s.applicationId!==id||(s.date>=stayStart&&s.date<=stayEnd));recalc(id);syncAliases(a);return true},
    async setParticipantsActive(uids,active){applications().filter(a=>a.participantUids?.some(x=>uids.includes(x))).forEach(a=>{a.active=active===true;syncAliases(a)});return true},
    async approvePlanning(id){const a=findApp(id);a.status='meeting';a.planningApprovedAt=nowIso();a.meetingStatus='pending';sessionsFor(id).forEach(s=>s.status='plan_approved');syncAliases(a);return {status:'meeting',sessionCount:a.sessionCount,activityCount:a.activityCount}},
    async scheduleSelectionMeeting(id,{date,time,duration=30,link='',notes=''}={}){const a=findApp(id);Object.assign(a,{status:'meeting',meetingStatus:'scheduled',meetingDate:date,meetingTime:time,meetingDuration:duration,meetingLink:link,meetingNotes:notes});return clone(a)},
    async completeSelectionMeeting(id){const a=findApp(id);a.meetingStatus='completed';return true},
    async finalizeSelection(id,{decision,reason=''}={}){const a=findApp(id);const approved=decision==='approve';Object.assign(a,{status:approved?'approved':'rejected',active:approved,meetingStatus:'completed',finalDecision:approved?'approved':'rejected',finalDecisionAt:nowIso(),rejectedReason:approved?'':reason});sessionsFor(id).forEach(s=>s.status=approved?'confirmed':'rejected');syncAliases(a);return {status:a.status,active:a.active,sessionCount:a.sessionCount,activityCount:a.activityCount,rejectedReason:a.rejectedReason}}
  });

  services.units=serviceFallback({async list({includeInactive=false}={}){return clone(includeInactive?db.units:db.units.filter(u=>u.active))},async get(id){return clone(db.units.find(u=>u.id===id)||null)},async update(id,patch={}){const u=db.units.find(x=>x.id===id);if(u)Object.assign(u,patch);return clone(u)},invalidate(){}});
  services.groups=serviceFallback({async list({unitId='rodeio'}={}){return clone(db.groups[unitId]||[])},async ensureDefaults(unitId='rodeio'){return clone(db.groups[unitId]||[])},async update(id,patch={}){Object.values(db.groups).flat().filter(g=>g.id===id).forEach(g=>Object.assign(g,patch));return true},invalidate(){}});
  services.profiles=serviceFallback({normalizeEmergencyContact:v=>({name:String(v?.name||'').trim(),relationship:String(v?.relationship||'').trim(),phone:String(v?.phone||'').trim()}),async getByIds(ids){return clone(ids.map(id=>db.profiles[id]||{id,missing:true}))},async updateEmergencyContact(id,value){if(!db.profiles[id])db.profiles[id]={id};db.profiles[id].emergencyContact={name:String(value?.name||''),relationship:String(value?.relationship||''),phone:String(value?.phone||'')};return clone(db.profiles[id].emergencyContact)},invalidate(){}});
  services.history=serviceFallback({async list(applicationId,{limit=20}={}){const rows=clone((db.histories[applicationId]||[]).slice(0,limit));return {items:rows,nextCursor:null,hasMore:false}},async append(applicationId,type,{metadata={}}={}){db.histories[applicationId]=db.histories[applicationId]||[];db.histories[applicationId].unshift({id:uid('history'),type,metadata,actorLabel:'Administrador Demo',createdAt:nowIso()});return true}});

  services.planning=serviceFallback({
    async listSessions({applicationId,from,to}={}){let rows=sessionsFor(applicationId);if(from)rows=rows.filter(s=>s.date>=from);if(to)rows=rows.filter(s=>s.date<=to);return clone(rows.sort((a,b)=>a.date.localeCompare(b.date)))},
    async listActivities(applicationId){const map=new Map();sessionsFor(applicationId).forEach(s=>{if(!map.has(s.activityId))map.set(s.activityId,activityFromSession(s))});return clone([...map.values()])},
    async hasSessions({applicationId}={}){return sessionsFor(applicationId).length>0},
    async listPendingChanges(){return clone(db.sessions.filter(s=>s.status==='change_requested'||s.reviewStatus==='analysis').map(s=>({...s,reviewKind:s.postApprovalProposal?'post_approval':'change'})))},
    async listManagerSchedule({from,to,unitId='all'}={}){return clone(db.sessions.filter(s=>s.status==='confirmed'&&s.date>=from&&s.date<=to&&(unitId==='all'||s.unitId===unitId)).map(s=>({...s,sessionId:s.id,raw:s,activity:activityFromSession(s)})))},
    async updateSession(id,patch={}){const s=db.sessions.find(x=>x.id===id);if(s)Object.assign(s,patch);return true},
    async managerUpdateSession({sessionId,patch={}}={}){const s=db.sessions.find(x=>x.id===sessionId);if(s)Object.assign(s,patch,{activityName:patch.activityName||s.activityName,activityDescription:patch.activityDescription??s.activityDescription});return clone(s)},
    async deleteSession(sessionId,{applicationId}={}){db.sessions=db.sessions.filter(s=>s.id!==sessionId);if(applicationId)recalc(applicationId);return {deletedActivity:true}},
    async saveActivity(args={}){const applicationId=String(args.applicationId),activityId=args.activityId||uid('activity'),dates=(args.dates||[]).map(String),data=args.data||{},existing=db.sessions.filter(s=>s.applicationId===applicationId&&s.activityId===activityId),wanted=new Set(dates);db.sessions=db.sessions.filter(s=>!(s.applicationId===applicationId&&s.activityId===activityId&&!wanted.has(s.date)));const created=[];dates.forEach(date=>{let s=db.sessions.find(x=>x.applicationId===applicationId&&x.activityId===activityId&&x.date===date);const status=args.managerCreated?'manager_confirmed':args.postApprovalProposal?'proposed':(args.sessionStatus||'proposed');const patch={applicationId,activityId,unitId:args.unitId||findApp(applicationId)?.unitId||'rodeio',date,activityName:data.name||'Atividade',activityDescription:data.description||'',duration:Number(data.duration)||60,participation:data.participation||'Livre',materials:data.materials||'',notes:data.notes||'',period:data.period||'Sem preferência',ownerName:args.ownerName||findApp(applicationId)?.name||'Voluntário',status,groupId:Object.prototype.hasOwnProperty.call(args,'groupId')?args.groupId:null,createdByUid:args.createdByUid||'demo',managerCreated:args.managerCreated===true,postApprovalProposal:args.postApprovalProposal===true,reviewStatus:args.postApprovalProposal?'analysis':'',reviewNote:''};if(s)Object.assign(s,patch);else{s={id:uid('session'),sessionId:'',...patch};s.sessionId=s.id;db.sessions.push(s)}created.push(clone(s))});recalc(applicationId);return {activityId,activity:{id:activityId,...data,applicationId},sessions:created,deletedSessionIds:existing.filter(s=>!wanted.has(s.date)).map(s=>s.id)}},
    async requestSessionAdjustment({applicationId,sessionId,note}={}){const s=db.sessions.find(x=>x.id===sessionId);if(s)Object.assign(s,{adminAdjustmentStatus:'requested',adminAdjustmentNote:note});const a=findApp(applicationId);if(a&&a.status!=='approved')a.status='adjustments';return true},
    async requestExistingChange({sessionId,proposal={},reason=''}={}){const s=db.sessions.find(x=>x.id===sessionId);if(s)Object.assign(s,{status:'change_requested',changeProposal:clone(proposal),changeNote:reason,changeReviewStatus:'analysis'});return clone(s)},
    async resubmitExistingChange({sessionId,proposal={},reason=''}={}){return this.requestExistingChange({sessionId,proposal,reason})},
    async reviewExistingChange({sessionId,decision,note=''}={}){const s=db.sessions.find(x=>x.id===sessionId);if(!s)return null;if(decision==='approve'){Object.assign(s,s.changeProposal||{},{status:'confirmed',changeReviewStatus:'approved',changeReviewNote:''})}else if(decision==='reject')Object.assign(s,{status:'confirmed',changeReviewStatus:'rejected',changeReviewNote:note});else Object.assign(s,{status:'change_requested',changeReviewStatus:'adjustments',changeReviewNote:note});return clone(s)},
    async reviewPostApprovalProposal({applicationId,activityId,decision,note=''}={}){const rows=sessionsFor(applicationId).filter(s=>s.activityId===activityId);rows.forEach(s=>Object.assign(s,{reviewStatus:decision==='approve'?'approved':decision==='reject'?'rejected':'adjustments',reviewNote:decision==='adjustments'?note:'',status:decision==='approve'?'confirmed':decision==='reject'?'rejected':'proposed'}));recalc(applicationId);return true}
  });

  services.onboarding=serviceFallback({async createCandidate(payload={}){const participants=payload.participants||[],id=uid('candidate'),uids=participants.map((p,i)=>`${id}-p${i+1}`);participants.forEach((p,i)=>db.profiles[uids[i]]={id:uids[i],name:p.name,fullName:p.name,email:p.email,phone:p.phone||'',country:p.country||'',language:p.language||'pt',gender:p.gender||'',emergencyContact:clone(p.emergencyContact||{name:'',relationship:'',phone:''})});const row=app({id,type:participants.length===2?'couple':'individual',participantUids:uids,participantNames:participants.map(p=>p.name),participantEmails:participants.map(p=>p.email),participantCountries:participants.map(p=>p.country||''),participantPhones:participants.map(p=>p.phone||''),participantGenders:participants.map(p=>p.gender||''),participantCount:participants.length,unitId:payload.unitId||'rodeio',unitName:payload.unitName||'Rodeio',status:'pending',stayStart:payload.stayStart,stayEnd:payload.stayEnd,planningDeadlineAt:'2026-09-10T23:59:00Z',registrationLink:payload.registrationLink||'',internalNote:payload.note||'',sessionCount:0,activityCount:0});db.applications.unshift(row);return {applicationId:id,participantUids:uids,invitationFailures:[]}}});
  services.users=serviceFallback({async get(){return null},async update(){return true}});
  services.adminAccess=serviceFallback({});services.maintenance=serviceFallback({});services.candidateReactivation=serviceFallback({});

  const chosen=role==='candidate'?findApp('maria'):role==='volunteer'?findApp('lucas-rafael'):null;
  const currentUid=role==='candidate'?'u-maria':role==='volunteer'?'u-lucas':'demo-admin';
  const currentSession=role==='admin'?{uid:'demo-admin',email:'admin.demo@oleiro.test',role:'manager',user:{role:'admin',name:'Administrador Demo',unitIds:['rodeio','indaial'],active:true}}:{uid:currentUid,email:db.profiles[currentUid]?.email||'demo@oleiro.test',role:'volunteer',mode:role==='volunteer'?'approved':'candidate',application:clone(chosen),user:{role:'volunteer',name:db.profiles[currentUid]?.name||'Voluntário Demo',unitIds:[chosen?.unitId||'rodeio'],active:true}};
  window.OleiroAuth=window.OleiroAuth||{};window.OleiroAuth.currentSession=async()=>clone(currentSession);window.OleiroAuth.signOut=async()=>{location.href='/homologacao/'};
  window.OleiroAuthGuard=window.OleiroAuthGuard||{};window.OleiroAuthGuard.requireRole=async expected=>new Promise(resolve=>setTimeout(()=>resolve(expected===currentSession.role?clone(currentSession):null),30));

  function installRibbon(){if(document.querySelector('.r59-demo-ribbon'))return;const a=document.createElement('a');a.className='r59-demo-ribbon';a.href='/homologacao/';a.innerHTML='<i></i><span>AMBIENTE DE TESTE · trocar perfil</span>';document.body.appendChild(a)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRibbon,{once:true});else installRibbon();
})();
