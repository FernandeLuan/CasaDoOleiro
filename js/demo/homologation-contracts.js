/* Contratos e cenários de homologação alinhados aos serviços usados pela produção. */
(function homologationContracts(){
  const db=window.OleiroDemoDB,services=window.OleiroServices;
  if(!db||!services||db.__contractsAligned)return;
  db.__contractsAligned=true;

  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const findApp=id=>db.applications.find(row=>String(row.id)===String(id));
  const findSession=id=>db.sessions.find(row=>String(row.id)===String(id));
  const stayMonths=(start,end)=>{const out=[];if(!start||!end)return out;const d=new Date(`${start}T12:00:00`),last=new Date(`${end}T12:00:00`);d.setDate(1);last.setDate(1);while(d<=last){out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()+1)}return out};
  const syncApp=a=>{if(!a)return a;a.applicationId=a.id;a.name=(a.participantNames||[]).join(' + ')||a.name||'Voluntário';a.country=(a.participantCountries||[]).join(' / ')||a.country||'—';a.email=(a.participantEmails||[]).join(', ')||a.email||'';a.phone=(a.participantPhones||[]).join(' / ')||a.phone||'';a.unit=a.unitName||a.unitId||'—';a.from=String(a.stayStart||a.from||'').slice(0,10);a.to=String(a.stayEnd||a.to||'').slice(0,10);a.stayStart=a.from;a.stayEnd=a.to;a.inactive=a.active===false;a.stayMonths=stayMonths(a.from,a.to);return a};
  const recalc=id=>{const app=findApp(id);if(!app)return;const rows=db.sessions.filter(row=>String(row.applicationId)===String(id)&&row.status!=='rejected'&&row.reviewStatus!=='rejected');app.sessionCount=rows.length;app.activityCount=new Set(rows.map(row=>String(row.activityId||'')).filter(Boolean)).size;app.sessions=app.sessionCount;app.activities=app.activityCount;syncApp(app)};

  db.users=db.users||{};
  const ensureUser=(uid,data={})=>{db.users[uid]={id:uid,email:'',role:'volunteer',active:true,firstPortalAccessAt:null,...db.users[uid],...data};return db.users[uid]};
  db.applications.forEach(app=>{(app.participantUids||[]).forEach((uid,index)=>ensureUser(String(uid),{email:app.participantEmails?.[index]||'',active:app.active!==false}))});
  ensureUser('u-camila',{email:'camila.demo@oleiro.test',firstPortalAccessAt:'2026-08-29T11:15:00Z'});
  ensureUser('u-lucas',{email:'lucas.demo@oleiro.test',firstPortalAccessAt:'2026-09-01T12:10:00Z'});
  ensureUser('u-rafael',{email:'rafael.demo@oleiro.test',firstPortalAccessAt:null});
  ensureUser('u-maria',{email:'maria.demo@oleiro.test',firstPortalAccessAt:null});

  if(!findApp('paula-semana')){
    db.applications.push(syncApp({
      id:'paula-semana',type:'individual',participantUids:['u-paula-semana'],participantNames:['Paula Martins'],participantEmails:['paula.semana@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1301'],participantGenders:['female'],participantCount:1,
      unitId:'rodeio',unitName:'Rodeio',status:'approved',active:true,stayStart:'2026-09-07',stayEnd:'2026-09-11',planningSubmittedAt:'2026-09-01T14:00:00Z',planningApprovedAt:'2026-09-02T14:00:00Z',meetingStatus:'completed',finalDecision:'approved',sessionCount:0,activityCount:0,planningCountVersion:1,dayAdjustments:{},registrationLink:'https://www.worldpackers.com/'
    }));
    db.profiles['u-paula-semana']={id:'u-paula-semana',name:'Paula Martins',fullName:'Paula Martins',email:'paula.semana@oleiro.test',phone:'+55 47 99999-1301',country:'Brasil',language:'pt',gender:'female',emergencyContact:{name:'Rita Martins',relationship:'Mãe',phone:'+55 47 98888-1301'}};
    ensureUser('u-paula-semana',{email:'paula.semana@oleiro.test',firstPortalAccessAt:'2026-09-03T10:00:00Z'});
  }

  const ensureScenario=(id,applicationId,date,name,options={})=>{
    if(findSession(id))return findSession(id);const app=findApp(applicationId);if(!app)return null;
    const row={id,sessionId:id,applicationId,activityId:options.activityId||`a-${id}`,unitId:app.unitId||'rodeio',date,activityName:name,activityDescription:options.description||'Cenário funcional de homologação.',duration:Number(options.duration)||60,period:options.period||'Sem preferência',participation:options.participation||'Livre',materials:options.materials||'',notes:options.notes||'',ownerName:app.name||'Voluntário',status:options.status||'confirmed',groupId:Object.prototype.hasOwnProperty.call(options,'groupId')?options.groupId:'Livre',managerCreated:options.managerCreated===true,postApprovalProposal:options.postApprovalProposal===true,reviewStatus:options.reviewStatus||'',reviewNote:options.reviewNote||'',changeReviewStatus:options.changeReviewStatus||'',changeReviewNote:options.changeReviewNote||'',changeProposal:options.changeProposal?clone(options.changeProposal):undefined,changeNote:options.changeNote||'',adminAdjustmentStatus:options.adminAdjustmentStatus||'',adminAdjustmentNote:options.adminAdjustmentNote||'',createdByUid:app.participantUids?.[0]||'demo'};
    db.sessions.push(row);return row;
  };

  ensureScenario('s-camila-existing-adjustments','camila','2026-09-02','Horta e jardinagem',{
    duration:60,period:'Manhã',groupId:'D',status:'change_requested',changeReviewStatus:'adjustments',changeReviewNote:'Manter a duração de 60 min e detalhar a alteração de período.',changeNote:'Quero transferir esta atividade para a tarde.',changeProposal:{date:'2026-09-02',period:'Tarde',duration:60,activityName:'Horta e jardinagem',participation:'Grupo D'},description:'Alteração de atividade existente devolvida ao voluntário para novo reajuste.'
  });
  ensureScenario('s-camila-confirmed-second-day','camila','2026-08-31','Apoio na cozinha',{
    duration:60,period:'Tarde',groupId:'C',status:'confirmed',managerCreated:true,description:'Segunda atividade confirmada para validar múltiplos dias úteis.'
  });
  ensureScenario('s-paula-semana-1','paula-semana','2026-09-07','Recepção e organização',{duration:60,period:'Manhã',groupId:'A',status:'confirmed',managerCreated:true});
  ensureScenario('s-paula-semana-2','paula-semana','2026-09-09','Idiomas',{duration:90,period:'Tarde',groupId:'D',status:'confirmed',managerCreated:true});
  ensureScenario('s-paula-semana-3','paula-semana','2026-09-11','Atividade livre',{duration:60,period:'Manhã',groupId:'Livre',status:'confirmed',managerCreated:true});

  recalc('camila');recalc('paula-semana');
  db.histories=db.histories||{};
  db.histories.camila=db.histories.camila||[];
  if(!db.histories.camila.some(row=>row.id==='h-contract-camila-adjustments'))db.histories.camila.unshift({id:'h-contract-camila-adjustments',type:'adjustment_requested',actorRole:'coordinator',actorLabel:'Equipe Casa do Oleiro',metadata:{activityName:'Horta e jardinagem'},createdAt:'2026-09-03T14:20:00Z'});
  db.histories['paula-semana']=[{id:'h-paula-approved',type:'candidate_approved',actorRole:'coordinator',actorLabel:'Equipe Casa do Oleiro',metadata:{},createdAt:'2026-09-02T14:30:00Z'},{id:'h-paula-planning',type:'planning_approved',actorRole:'coordinator',actorLabel:'Equipe Casa do Oleiro',metadata:{},createdAt:'2026-09-02T14:00:00Z'},{id:'h-paula-created',type:'candidate_created',actorRole:'system',actorLabel:'Sistema',metadata:{},createdAt:'2026-08-29T10:00:00Z'}];

  services.users={
    async listManagers(){return [{id:'demo-admin',email:'admin.demo@oleiro.test',name:'Administrador Demo',role:'admin',active:true}]},
    async getByIds(uids){return clone((uids||[]).map(uid=>db.users[String(uid)]||{id:String(uid),missing:true}))},
    invalidateManagers(){}
  };
  services.adminAccess={async sendPasswordSetup(email,language='pt'){db.passwordSetupRequests=db.passwordSetupRequests||[];db.passwordSetupRequests.push({email:String(email||'').trim().toLowerCase(),language:String(language||'pt'),createdAt:new Date().toISOString()});return true}};

  services.applications.reactivateCandidatePlanning=async function(id,{participantUids=[],planningDeadlineAt=null}={}){
    const app=findApp(id);if(!app||!planningDeadlineAt)throw new Error(!app?'Candidatura não encontrada.':'Novo prazo do planejamento não informado.');
    Object.assign(app,{status:'pending',active:true,planningDeadlineAt,planningSubmittedAt:null,planningApprovedAt:null,dayAdjustments:{},meetingStatus:null,meetingDate:null,meetingTime:'',meetingDuration:30,meetingLink:'',meetingNotes:'',finalDecision:null,finalDecisionAt:null,rejectedReason:'',rejectedAt:null,autoRejected:false,needsAdminAttention:false});
    db.sessions.filter(row=>String(row.applicationId)===String(id)).forEach(row=>Object.assign(row,{status:row.managerCreated===true?'manager_confirmed':'proposed',postApprovalProposal:false,reviewStatus:'',reviewNote:'',changeReviewStatus:'',changeReviewNote:''}));
    (participantUids||[]).forEach(uid=>{const user=ensureUser(String(uid));user.active=true});recalc(id);return clone(app);
  };

  window.OleiroDemoDB=db;
})();
