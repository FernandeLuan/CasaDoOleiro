/* Round 15/22 — operações consistentes; consultas indexadas nunca degradam para leitura ampla. */
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
    const context=await services.firebase(),{firestore}=context.modules,collection=firestore.collection(context.db,'activity_sessions');
    const map=snapshot=>snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>(!from||row.date>=from)&&(!to||row.date<=to)).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
    const constraints=[firestore.where('applicationId','==',String(applicationId))];
    if(from)constraints.push(firestore.where('date','>=',String(from)));
    if(to)constraints.push(firestore.where('date','<=',String(to)));
    if(from||to)constraints.push(firestore.orderBy('date','asc'));
    try{return map(await firestore.getDocs(firestore.query(collection,...constraints)))}
    catch(error){
      if((from||to)&&indexUnavailable(error)){
        const safeError=new Error('O índice activity_sessions(applicationId, date) ainda não está pronto. A leitura ampla foi bloqueada para proteger a cota do Firestore.');
        safeError.code='oleiro/index-not-ready';throw safeError;
      }
      throw error;
    }
  }

  if(services.planning){
    if(baseSaveActivity){
      services.planning.saveActivity=async function(args={}){
        if(args.postApprovalProposal===true&&args.activityId&&args.applicationId){const allSessions=await focusedSessions(args.applicationId,'','');return baseSaveActivity({...args,existingSessions:allSessions})}
        return baseSaveActivity(args);
      };
    }

    services.planning.reviewChangeRequest=async function({sessionId,decision,note=''}){
      if(!sessionId||!['approve','reject','adjustments'].includes(decision))throw new Error('Decisão inválida.');
      const reviewNote=String(note||'').trim();if(decision==='adjustments'&&!reviewNote)throw new Error('Informe o reajuste solicitado.');
      return services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,ref=firestore.doc(context.db,'activity_sessions',String(sessionId)),snapshot=await firestore.getDoc(ref);
        if(!snapshot.exists())throw new Error('Solicitação não encontrada.');
        const row={id:snapshot.id,...snapshot.data()};if(row.status!=='change_requested')throw new Error('Esta mudança não está mais aguardando análise.');
        const parts=String(row.changeNote||'').split('|'),isMove=parts[0]==='move',oldDate=isMove?parts[1]:row.date,oldTime=isMove?parts[2]:row.time,newDate=isMove?parts[3]:row.date,newTime=isMove?parts[4]:row.time,now=firestore.serverTimestamp();
        let patch={updatedAt:now};
        if(decision==='approve')patch={...patch,status:'confirmed',changeNote:'',confirmedAt:now};
        if(decision==='reject')patch={...patch,date:oldDate||row.date,time:oldTime||row.time,status:'confirmed',changeNote:`rejected|${oldDate||row.date}|${oldTime||row.time}|${newDate||row.date}|${newTime||row.time}`};
        if(decision==='adjustments')patch={...patch,date:oldDate||row.date,time:oldTime||row.time,status:'confirmed',changeNote:`adjustments|${oldDate||row.date}|${oldTime||row.time}|${newDate||row.date}|${newTime||row.time}|${encodeURIComponent(reviewNote)}`};
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
        const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id),outside=prepared.outside||[],remaining=prepared.remaining||[],remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean)),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();outside.forEach(s=>batch.delete(firestore.doc(context.db,'activity_sessions',String(s.id))));let removedActivities=0;
        if(outside.length){const activitiesSnapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',applicationId)));activitiesSnapshot.docs.forEach(doc=>{if(!remainingActivityIds.has(String(doc.id))){batch.delete(doc.ref);removedActivities++}})}
        batch.update(firestore.doc(context.db,'applications',applicationId),{stayStart:prepared.stayStart,stayEnd:prepared.stayEnd,stayMonths:stayMonths(prepared.stayStart,prepared.stayEnd),sessionCount:remaining.length,activityCount:remainingActivityIds.size,updatedAt:now});await batch.commit();return {removedSessions:outside.length,removedActivities,sessionCount:remaining.length,activityCount:remainingActivityIds.size};
      },{loading:false});
    };
  }
})();
