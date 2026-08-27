/* Round 25/26 — separa aprovação do planejamento, reunião e decisão final sem leituras de navegação adicionais. */
(function selectionFlowR25Service(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.applications||!services.planning)return;

  function cleanUrl(value){
    const raw=String(value||'').trim();if(!raw)return '';
    try{const url=new URL(raw);return ['http:','https:'].includes(url.protocol)?url.toString():''}catch{return ''}
  }
  async function planningDocs(context,applicationId){
    const {firestore}=context.modules,id=String(applicationId),started=Date.now();
    const [sessionsSnapshot,activitiesSnapshot]=await Promise.all([
      firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',id))),
      firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',id)))
    ]);
    services.recordQuery?.('selection/planning-docs',started,sessionsSnapshot.size+activitiesSnapshot.size,{applicationId:id,queries:2});
    return {sessions:sessionsSnapshot.docs,activities:activitiesSnapshot.docs};
  }
  function ensureBatchSize(sessionDocs,activityDocs,participantUids=[]){
    const total=(sessionDocs?.length||0)+(activityDocs?.length||0)+new Set((participantUids||[]).filter(Boolean)).size+1;
    if(total>450)throw new Error('Este planejamento é grande demais para concluir a etapa em uma única operação segura.');
  }

  /* Aprovar aqui significa somente aprovar o planejamento. Ainda não torna o candidato voluntário aprovado. */
  services.applications.approvePlanning=async function(id,{participantUids=[]}={}){
    if(!id)throw new Error('Candidatura não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id);
      const {sessions,activities}=await planningDocs(context,applicationId);if(!sessions.length)throw new Error('Não há atividades para aprovar.');
      ensureBatchSize(sessions,activities,participantUids);
      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.update(firestore.doc(context.db,'applications',applicationId),{
        status:'meeting',active:true,planningDeadlineAt:null,planningApprovedAt:now,dayAdjustments:{},
        meetingStatus:'pending',meetingDate:null,meetingTime:'',meetingDuration:30,meetingLink:'',meetingNotes:'',
        sessionCount:sessions.length,activityCount:activities.length,planningCountVersion:1,updatedAt:now
      });
      sessions.forEach(doc=>batch.update(doc.ref,{status:'plan_approved',changeNote:'',updatedAt:now}));
      activities.forEach(doc=>batch.update(doc.ref,{status:'plan_approved',updatedAt:now}));
      [...new Set((participantUids||[]).filter(Boolean).map(String))].forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:true,updatedAt:now}));
      await batch.commit();return {confirmedSessions:sessions.length,sessionCount:sessions.length,activityCount:activities.length,status:'meeting'};
    },{loading:false});
  };

  services.applications.scheduleSelectionMeeting=async function(id,{date,time,duration=30,link='',notes=''}={}){
    if(!id||!date||!time)throw new Error('Informe a data e o horário da reunião.');
    const safeLink=cleanUrl(link);if(String(link||'').trim()&&!safeLink)throw new Error('Informe um link de reunião válido.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,now=firestore.serverTimestamp();
      const patch={status:'meeting',meetingStatus:'scheduled',meetingDate:String(date),meetingTime:String(time),meetingDuration:Math.max(15,Math.min(Number(duration)||30,180)),meetingLink:safeLink,meetingNotes:String(notes||'').trim(),meetingScheduledAt:now,updatedAt:now};
      await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),patch);return {...patch,meetingScheduledAt:null,updatedAt:null};
    },{loading:false});
  };

  services.applications.completeSelectionMeeting=async function(id){
    if(!id)throw new Error('Candidatura não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,now=firestore.serverTimestamp();
      await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{status:'meeting',meetingStatus:'completed',meetingCompletedAt:now,updatedAt:now});return true;
    },{loading:false});
  };

  services.applications.finalizeSelection=async function(id,{decision,reason='',participantUids=[],managerUid=''}={}){
    if(!id||!['approve','reject'].includes(decision))throw new Error('Decisão inválida.');
    const internalReason=String(reason||'').trim();if(decision==='reject'&&!internalReason)throw new Error('Informe o motivo interno da não aprovação.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id);
      const {sessions,activities}=await planningDocs(context,applicationId);ensureBatchSize(sessions,activities,participantUids);
      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp(),approved=decision==='approve';
      const appPatch=approved?{
        status:'approved',active:true,meetingStatus:'completed',finalDecision:'approved',finalDecisionAt:now,finalDecisionByUid:String(managerUid||''),rejectedReason:'',rejectedAt:null,updatedAt:now
      }:{
        status:'rejected',active:false,meetingStatus:'completed',finalDecision:'rejected',finalDecisionAt:now,finalDecisionByUid:String(managerUid||''),rejectedReason:internalReason,rejectedAt:now,autoRejected:false,updatedAt:now
      };
      batch.update(firestore.doc(context.db,'applications',applicationId),appPatch);
      sessions.forEach(doc=>batch.update(doc.ref,approved?{status:'confirmed',confirmedAt:now,updatedAt:now}:{status:'rejected',rejectedAt:now,updatedAt:now}));
      activities.forEach(doc=>batch.update(doc.ref,approved?{status:'confirmed',updatedAt:now}:{status:'rejected',rejectedAt:now,updatedAt:now}));
      [...new Set((participantUids||[]).filter(Boolean).map(String))].forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:approved,updatedAt:now}));
      await batch.commit();return {status:approved?'approved':'rejected',active:approved,sessionCount:sessions.length,activityCount:activities.length,rejectedReason:approved?'':internalReason};
    },{loading:false});
  };

  /* Agenda operacional: consulta somente sessões realmente confirmadas. Não lê propostas, planejamento aprovado ou recusado. */
  services.planning.listManagerSchedule=async function({from,to,unitId='all'}={}){
    if(!from||!to)return [];
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,collection=firestore.collection(context.db,'activity_sessions'),normalizedUnit=unitId&&unitId!=='all'?String(unitId).toLowerCase():'',started=Date.now();
      const constraints=[firestore.where('status','==','confirmed')];if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));constraints.push(firestore.where('date','>=',String(from)),firestore.where('date','<=',String(to)),firestore.orderBy('date','asc'));
      try{
        const snapshot=await firestore.getDocs(firestore.query(collection,...constraints));services.recordQuery?.('activity_sessions/operational-schedule',started,snapshot.size,{from,to,unitId:normalizedUnit||'all',status:'confirmed'});
        return snapshot.docs.map(doc=>{const row={id:doc.id,...doc.data()};return {...row,activity:{id:row.activityId,name:row.activityName||'Atividade',description:row.activityDescription||'',duration:Number(row.duration)||60,participation:row.participation||'Livre',materials:row.materials||'',notes:row.notes||'',period:row.period||'Sem preferência',time:row.time||'',owner:row.ownerName||'Voluntário',applicationId:row.applicationId}}});
      }catch(error){
        if(/index|failed-precondition/i.test(`${error?.code||''} ${error?.message||''}`)){const safe=new Error('O índice da Agenda confirmada ainda não está pronto. A consulta ampla foi bloqueada para proteger a cota do Firestore.');safe.code='oleiro/index-not-ready';throw safe}throw error;
      }
    },{loading:false});
  };
})();
