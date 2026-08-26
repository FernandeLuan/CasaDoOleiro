(function initPlanningService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const activityCache=new Map();

  async function fetchActivitiesByIds(context,ids){
    const {firestore}=context.modules;
    const unique=[...new Set((ids||[]).filter(Boolean).map(String))];
    const missing=unique.filter(id=>!activityCache.has(id));
    if(missing.length){
      const rows=await Promise.all(missing.map(async id=>{const snap=await firestore.getDoc(firestore.doc(context.db,'activities',id));return snap.exists()?{id:snap.id,...snap.data()}:null}));
      rows.filter(Boolean).forEach(row=>activityCache.set(String(row.id),row));
    }
    return new Map(unique.map(id=>[id,activityCache.get(id)]).filter(([,row])=>row));
  }
  async function applicationSessions(context,applicationId){
    const {firestore}=context.modules;
    const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',String(applicationId))));
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  }

  services.planning={
    async listSessions({applicationId,from,to}={}){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();const rows=await applicationSessions(context,applicationId);
        return rows.filter(row=>(!from||row.date>=from)&&(!to||row.date<=to)).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
      },{loading:false});
    },
    async listManagerSchedule({from,to,unitId='all'}={}){
      if(!from||!to)return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('date','>=',from),firestore.where('date','<=',to),firestore.orderBy('date','asc')));
        let sessions=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
        if(unitId&&unitId!=='all')sessions=sessions.filter(row=>String(row.unitId||'').toLowerCase()===String(unitId).toLowerCase());
        const missing=sessions.filter(s=>!s.activityName).map(s=>s.activityId);const activityMap=missing.length?await fetchActivitiesByIds(context,missing):new Map();
        return sessions.map(session=>{const definition=activityMap.get(String(session.activityId))||{};return {...session,activity:{id:session.activityId,name:session.activityName||definition.name||'Atividade',description:session.activityDescription||definition.description||'',duration:Number(session.duration||definition.duration||60),participation:session.participation||definition.participation||'Livre',groupPreference:session.groupPreference||definition.groupPreference||'A definir',materials:session.materials||definition.materials||'',notes:session.notes||definition.notes||'',period:session.period||definition.period||'Sem preferência',time:session.time||definition.time||'',owner:session.ownerName||definition.ownerName||'Voluntário',applicationId:session.applicationId}}});
      },{loading:false});
    },
    async listActivities(applicationId){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',String(applicationId))));
        const rows=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));rows.forEach(row=>activityCache.set(String(row.id),row));return rows;
      },{loading:false});
    },
    async saveActivity({activityId=null,applicationId,unitId,createdByUid,ownerName='',data,dates,existingSessions=[]}){
      if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const activityRef=activityId?firestore.doc(context.db,'activities',String(activityId)):firestore.doc(firestore.collection(context.db,'activities'));const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        const editableDefinition={applicationId:String(applicationId),ownerName:String(ownerName||''),name:data.name,description:data.description||'',duration:Number(data.duration)||60,participation:data.participation||'Livre',groupPreference:data.groupPreference||'A definir',materials:data.materials||'',notes:data.notes||'',period:data.period||'Sem preferência',time:data.time||'',updatedAt:now};
        if(activityId)batch.update(activityRef,editableDefinition);else batch.set(activityRef,{...editableDefinition,createdByUid:String(createdByUid),createdAt:now});
        const wanted=new Set((dates||[]).map(String));const byDate=new Map((existingSessions||[]).filter(s=>String(s.activityId)===activityRef.id).map(s=>[String(s.date),s]));
        const sessionDefinition={activityName:data.name,activityDescription:data.description||'',participation:data.participation||'Livre',groupPreference:data.groupPreference||'A definir',materials:data.materials||'',notes:data.notes||'',ownerName:String(ownerName||''),time:data.time||'',period:data.period||'Sem preferência',duration:Number(data.duration)||60};
        const resultSessions=[];const deletedSessionIds=[];
        for(const [date,session] of byDate){const ref=firestore.doc(context.db,'activity_sessions',String(session.id));if(!wanted.has(date)){batch.delete(ref);deletedSessionIds.push(String(session.id));}else{batch.update(ref,{...sessionDefinition,updatedAt:now});resultSessions.push({...session,...sessionDefinition,date});}}
        for(const date of wanted){if(byDate.has(date))continue;const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));const row={id:sessionRef.id,applicationId:String(applicationId),activityId:activityRef.id,unitId:String(unitId||''),date,...sessionDefinition,status:'proposed',groupId:null,createdByUid:String(createdByUid)};batch.set(sessionRef,{...row,createdAt:now,updatedAt:now});resultSessions.push(row);}
        const allSessionIds=new Set((existingSessions||[]).map(s=>String(s.id)).filter(Boolean));deletedSessionIds.forEach(id=>allSessionIds.delete(id));resultSessions.forEach(s=>allSessionIds.add(String(s.id)));
        const existingActivityIds=new Set((existingSessions||[]).map(s=>String(s.activityId)).filter(Boolean));existingActivityIds.add(activityRef.id);
        batch.update(firestore.doc(context.db,'applications',String(applicationId)),{sessionCount:allSessionIds.size,activityCount:existingActivityIds.size,updatedAt:now});
        await batch.commit();const activity={id:activityRef.id,...editableDefinition,createdByUid:String(createdByUid)};activityCache.set(activityRef.id,activity);return {activityId:activityRef.id,activity,sessions:resultSessions,deletedSessionIds};
      },{loading:false});
    },
    async deleteSession(sessionId,{applicationId,activityId}={}){
      if(!sessionId||!applicationId)throw new Error('Sessão não encontrada.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const [sessions,activitySnapshot]=await Promise.all([applicationSessions(context,applicationId),firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',String(applicationId))))]);
        const remaining=sessions.filter(s=>String(s.id)!==String(sessionId));const remainingForActivity=remaining.filter(s=>String(s.activityId)===String(activityId));const remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean));const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        batch.delete(firestore.doc(context.db,'activity_sessions',String(sessionId)));if(!remainingForActivity.length&&activityId){batch.delete(firestore.doc(context.db,'activities',String(activityId)));activityCache.delete(String(activityId));}
        batch.update(firestore.doc(context.db,'applications',String(applicationId)),{sessionCount:remaining.length,activityCount:remainingActivityIds.size,updatedAt:now});await batch.commit();return {deletedActivity:!remainingForActivity.length,sessionCount:remaining.length,activityCount:remainingActivityIds.size};
      },{loading:false});
    },
    async updateSession(sessionId,patch){
      if(!sessionId)throw new Error('Sessão não encontrada.');
      return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;await firestore.updateDoc(firestore.doc(context.db,'activity_sessions',String(sessionId)),{...patch,updatedAt:firestore.serverTimestamp()});return true;},{loading:false});
    }
  };
})();
