/* Round 15/26 — operações consistentes; consultas indexadas nunca degradam para leitura ampla. */
(function consistencyR15Services(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const baseSaveActivity=services.planning?.saveActivity?.bind(services.planning);

  function stayMonths(start,end){
    if(!start||!end)return [];
    const from=new Date(`${start}T12:00:00`),to=new Date(`${end}T12:00:00`),out=[];
    let y=from.getFullYear(),m=from.getMonth(),ey=to.getFullYear(),em=to.getMonth();
    while(y<ey||(y===ey&&m<=em)){out.push(`${y}-${String(m+1).padStart(2,'0')}`);m++;if(m===12){m=0;y++}}
    return out;
  }
  function indexUnavailable(error){return /index|failed-precondition/i.test(`${error?.code||''} ${error?.message||''}`)}
  async function focusedSessions(applicationId,from,to){
    const context=await services.firebase(),{firestore}=context.modules,collection=firestore.collection(context.db,'activity_sessions'),appId=String(applicationId),started=Date.now();
    const map=snapshot=>snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).sort(typeof activityScheduleCompare==='function'?activityScheduleCompare:(a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    const constraints=[firestore.where('applicationId','==',appId)];
    if(from)constraints.push(firestore.where('date','>=',String(from)));
    if(to)constraints.push(firestore.where('date','<=',String(to)));
    if(from||to)constraints.push(firestore.orderBy('date','asc'));
    try{const snapshot=await firestore.getDocs(firestore.query(collection,...constraints));services.recordQuery?.('activity_sessions/focused',started,snapshot.size,{applicationId:appId,from:from||'',to:to||''});return map(snapshot)}
    catch(error){
      if((from||to)&&indexUnavailable(error)){
        const safeError=new Error('O índice activity_sessions(applicationId, date) ainda não está pronto. A leitura ampla foi bloqueada para proteger a cota do Firestore.');
        safeError.code='oleiro/index-not-ready';throw safeError;
      }
      throw error;
    }
  }
  async function sessionsForActivity(applicationId,activityId){
    const context=await services.firebase(),{firestore}=context.modules,appId=String(applicationId),actId=String(activityId),started=Date.now();
    const snapshot=await firestore.getDocs(firestore.query(
      firestore.collection(context.db,'activity_sessions'),
      firestore.where('applicationId','==',appId),
      firestore.where('activityId','==',actId)
    ));
    services.recordQuery?.('activity_sessions/activity',started,snapshot.size,{applicationId:appId,activityId:actId});
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  }

  if(services.planning){
    if(baseSaveActivity){
      services.planning.saveActivity=async function(args={}){
        if(args.postApprovalProposal===true&&args.activityId&&args.applicationId){const activitySessions=await sessionsForActivity(args.applicationId,args.activityId);return baseSaveActivity({...args,existingSessions:activitySessions})}
        return baseSaveActivity(args);
      };
    }

    services.planning.reviewChangeRequest=async function({sessionId,decision,note=''}){
      if(!sessionId||!['approve','reject','adjustments'].includes(decision))throw new Error('Decisão inválida.');
      const reviewNote=String(note||'').trim();if(decision==='adjustments'&&!reviewNote)throw new Error('Informe o reajuste solicitado.');
      return services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,ref=firestore.doc(context.db,'activity_sessions',String(sessionId)),started=Date.now(),snapshot=await firestore.getDoc(ref);
        services.recordQuery?.('activity_sessions/review-by-id',started,snapshot.exists()?1:0,{sessionId:String(sessionId)});
        if(!snapshot.exists())throw new Error('Solicitação não encontrada.');
        const row={id:snapshot.id,...snapshot.data()};if(row.status!=='change_requested')throw new Error('Esta mudança não está mais aguardando análise.');
        const parts=String(row.changeNote||'').split('|'),isMove=parts[0]==='move',oldDate=isMove?parts[1]:row.date,oldSchedule=isMove?parts[2]:(row.period||row.time||''),newDate=isMove?parts[3]:row.date,newSchedule=isMove?parts[4]:(row.period||row.time||''),periodValues=new Set(['Sem preferência','Manhã','Tarde','Noite']),oldSchedulePatch=periodValues.has(oldSchedule)?{period:oldSchedule}:(oldSchedule?{time:oldSchedule}:{}),now=firestore.serverTimestamp();
        let patch={updatedAt:now};
        if(decision==='approve')patch={...patch,status:'confirmed',changeNote:'',confirmedAt:now};
        if(decision==='reject')patch={...patch,date:oldDate||row.date,...oldSchedulePatch,status:'confirmed',changeNote:`rejected|${oldDate||row.date}|${oldSchedule}|${newDate||row.date}|${newSchedule}`};
        if(decision==='adjustments')patch={...patch,date:oldDate||row.date,...oldSchedulePatch,status:'confirmed',changeNote:`adjustments|${oldDate||row.date}|${oldSchedule}|${newDate||row.date}|${newSchedule}|${encodeURIComponent(reviewNote)}`};
        await firestore.updateDoc(ref,patch);return {...row,...patch,decision,reviewNote};
      },{loading:false});
    };
  }

  if(services.applications){
    services.applications.changeUnit=async function(id,{unitId,unitName}={}){
      if(!id||!unitId)throw new Error('Selecione uma unidade.');
      return services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id),normalized=String(unitId).toLowerCase(),sessions=await focusedSessions(applicationId,'',''),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        batch.update(firestore.doc(context.db,'applications',applicationId),{unitId:normalized,unitName:String(unitName||unitId),updatedAt:now});sessions.forEach(session=>batch.update(firestore.doc(context.db,'activity_sessions',String(session.id)),{unitId:normalized,updatedAt:now}));await batch.commit();return {unitId:normalized,unitName:String(unitName||unitId),updatedSessions:sessions.length};
      },{loading:false});
    };

    services.applications.prepareStayDateChange=async function(id,{stayStart,stayEnd}={}){
      if(!id||!stayStart||!stayEnd||stayEnd<stayStart)throw new Error('Período inválido.');
      return services.run(async()=>{const sessions=await focusedSessions(String(id),'',''),outside=sessions.filter(s=>!s.date||s.date<stayStart||s.date>stayEnd),outsideIds=new Set(outside.map(s=>String(s.id))),remaining=sessions.filter(s=>!outsideIds.has(String(s.id)));return {stayStart,stayEnd,sessions,outside,remaining,outsideCount:outside.length,outsideDates:[...new Set(outside.map(s=>s.date).filter(Boolean))].sort()}},{loading:false});
    };

    services.applications.applyPreparedStayDateChange=async function(id,prepared){
      if(!id||!prepared?.stayStart||!prepared?.stayEnd)throw new Error('Alteração de período inválida.');
      return services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id),outside=prepared.outside||[],remaining=prepared.remaining||[],remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean)),outsideActivityIds=new Set(outside.map(s=>String(s.activityId||'')).filter(Boolean)),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        outside.forEach(s=>batch.delete(firestore.doc(context.db,'activity_sessions',String(s.id))));
        let removedActivities=0;outsideActivityIds.forEach(activityId=>{if(!remainingActivityIds.has(activityId)){batch.delete(firestore.doc(context.db,'activities',activityId));removedActivities++}});
        batch.update(firestore.doc(context.db,'applications',applicationId),{stayStart:prepared.stayStart,stayEnd:prepared.stayEnd,stayMonths:stayMonths(prepared.stayStart,prepared.stayEnd),sessionCount:remaining.length,activityCount:remainingActivityIds.size,updatedAt:now});await batch.commit();return {removedSessions:outside.length,removedActivities,sessionCount:remaining.length,activityCount:remainingActivityIds.size};
      },{loading:false});
    };
  }
})();
