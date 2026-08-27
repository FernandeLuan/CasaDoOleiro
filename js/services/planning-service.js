(function initPlanningService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const activityCache=new Map();

  async function fetchActivitiesByIds(context,ids){
    const {firestore}=context.modules;
    const unique=[...new Set((ids||[]).filter(Boolean).map(String))];
    const missing=unique.filter(id=>!activityCache.has(id));
    if(missing.length){
      const rows=await Promise.all(missing.map(async id=>{
        const snap=await firestore.getDoc(firestore.doc(context.db,'activities',id));
        return snap.exists()?{id:snap.id,...snap.data()}:null;
      }));
      rows.filter(Boolean).forEach(row=>activityCache.set(String(row.id),row));
    }
    return new Map(unique.map(id=>[id,activityCache.get(id)]).filter(([,row])=>row));
  }

  function indexUnavailable(error){return /index|failed-precondition/i.test(`${error?.code||''} ${error?.message||''}`)}
  async function applicationSessions(context,applicationId,{from=null,to=null}={}){
    const {firestore}=context.modules,collection=firestore.collection(context.db,'activity_sessions'),appId=String(applicationId),constraints=[firestore.where('applicationId','==',appId)];
    if(from)constraints.push(firestore.where('date','>=',String(from)));
    if(to)constraints.push(firestore.where('date','<=',String(to)));
    if(from||to)constraints.push(firestore.orderBy('date','asc'));
    try{
      const snapshot=await firestore.getDocs(firestore.query(collection,...constraints));return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    }catch(error){
      if(!(from||to)||!indexUnavailable(error))throw error;
      console.warn('Índice applicationId + date ainda indisponível; usando leitura compatível temporária.');
      const fallback=await firestore.getDocs(firestore.query(collection,firestore.where('applicationId','==',appId)));
      return fallback.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>(!from||row.date>=from)&&(!to||row.date<=to));
    }
  }

  services.planning={
    async listSessions({applicationId,from,to}={}){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const rows=await applicationSessions(context,applicationId,{from,to});
        return rows.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
      },{loading:false});
    },

    async listPendingChanges({limit=100}={}){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;const max=Math.max(1,Math.min(Number(limit)||100,200));
        const [changesSnapshot,proposalSnapshot]=await Promise.all([
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('status','==','change_requested'),firestore.limit(max))),
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('reviewStatus','==','analysis'),firestore.limit(max)))
        ]);
        const rows=[
          ...changesSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'change'})),
          ...proposalSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'post_approval'}))
        ];
        const unique=new Map();rows.forEach(row=>unique.set(String(row.id),row));return [...unique.values()].slice(0,max);
      },{loading:false});
    },

    async listManagerSchedule({from,to,unitId='all'}={}){
      if(!from||!to)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules,collection=firestore.collection(context.db,'activity_sessions'),normalizedUnit=unitId&&unitId!=='all'?String(unitId).toLowerCase():'';
        const base=[firestore.where('date','>=',from),firestore.where('date','<=',to),firestore.orderBy('date','asc')];let sessions=[];
        try{
          const constraints=normalizedUnit?[firestore.where('unitId','==',normalizedUnit),...base]:base;
          const snapshot=await firestore.getDocs(firestore.query(collection,...constraints));sessions=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
        }catch(error){
          if(!normalizedUnit||!indexUnavailable(error))throw error;
          console.warn('Índice unitId + date ainda indisponível; usando filtro compatível temporário.');
          const snapshot=await firestore.getDocs(firestore.query(collection,...base));sessions=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>String(row.unitId||'').toLowerCase()===normalizedUnit);
        }
        const missing=sessions.filter(s=>!s.activityName).map(s=>s.activityId);
        const activityMap=missing.length?await fetchActivitiesByIds(context,missing):new Map();
        return sessions.map(session=>{
          const definition=activityMap.get(String(session.activityId))||{};
          return {
            ...session,
            activity:{
              id:session.activityId,
              name:session.activityName||definition.name||'Atividade',
              description:session.activityDescription||definition.description||'',
              duration:Number(session.duration||definition.duration||60),
              participation:session.participation||definition.participation||'Livre',
              materials:session.materials||definition.materials||'',
              notes:session.notes||definition.notes||'',
              period:session.period||definition.period||'Sem preferência',
              time:session.time||definition.time||'',
              owner:session.ownerName||definition.ownerName||'Voluntário',
              applicationId:session.applicationId
            }
          };
        });
      },{loading:false});
    },

    async listActivities(applicationId){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(
          firestore.query(
            firestore.collection(context.db,'activities'),
            firestore.where('applicationId','==',String(applicationId))
          )
        );
        const rows=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
        rows.forEach(row=>activityCache.set(String(row.id),row));
        return rows;
      },{loading:false});
    },

    async saveActivity({activityId=null,applicationId,unitId,createdByUid,ownerName='',data,dates,existingSessions=[],postApprovalProposal=false}){
      if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const activityRef=activityId
          ?firestore.doc(context.db,'activities',String(activityId))
          :firestore.doc(firestore.collection(context.db,'activities'));
        const batch=firestore.writeBatch(context.db);
        const now=firestore.serverTimestamp();
        const previousActivity=activityId?activityCache.get(String(activityId)):null;
        const reviewFields=postApprovalProposal?{postApprovalProposal:true,reviewStatus:'analysis',reviewNote:'',reviewSubmittedAt:now}:{};
        const editableDefinition={
          applicationId:String(applicationId),
          ownerName:String(ownerName||''),
          name:data.name,
          description:data.description||'',
          duration:Number(data.duration)||60,
          participation:data.participation||'Livre',
          materials:data.materials||'',
          notes:data.notes||'',
          period:data.period||'Sem preferência',
          time:data.time||'',
          ...reviewFields,
          updatedAt:now
        };

        if(activityId){
          batch.update(activityRef,editableDefinition);
        }else{
          batch.set(activityRef,{...editableDefinition,createdByUid:String(createdByUid),createdAt:now});
        }

        const wanted=new Set((dates||[]).map(String));
        const byDate=new Map(
          (existingSessions||[])
            .filter(s=>String(s.activityId)===String(activityRef.id))
            .map(s=>[String(s.date),s])
        );
        const sessionDefinition={
          activityName:data.name,
          activityDescription:data.description||'',
          participation:data.participation||'Livre',
          materials:data.materials||'',
          notes:data.notes||'',
          ownerName:String(ownerName||''),
          time:data.time||'',
          period:data.period||'Sem preferência',
          duration:Number(data.duration)||60,
          ...reviewFields
        };
        const resultSessions=[];
        const deletedSessionIds=[];

        for(const [date,session] of byDate){
          const ref=firestore.doc(context.db,'activity_sessions',String(session.id));
          if(!wanted.has(date)){
            batch.delete(ref);
            deletedSessionIds.push(String(session.id));
          }else{
            const statusPatch=postApprovalProposal?{status:'proposed'}:{};
            batch.update(ref,{...sessionDefinition,...statusPatch,updatedAt:now});
            resultSessions.push({...session,...sessionDefinition,...statusPatch,date});
          }
        }

        for(const date of wanted){
          if(byDate.has(date))continue;
          const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));
          const row={
            id:sessionRef.id,
            applicationId:String(applicationId),
            activityId:activityRef.id,
            unitId:String(unitId||''),
            date,
            ...sessionDefinition,
            status:'proposed',
            groupId:null,
            createdByUid:String(createdByUid)
          };
          batch.set(sessionRef,{...row,createdAt:now,updatedAt:now});
          resultSessions.push(row);
        }

        await batch.commit();
        const activity={
          id:activityRef.id,
          ...editableDefinition,
          createdByUid:previousActivity?.createdByUid||String(createdByUid)
        };
        activityCache.set(String(activityRef.id),activity);
        return {activityId:activityRef.id,activity,sessions:resultSessions,deletedSessionIds};
      },{loading:false});
    },

    async reviewPostApprovalProposal({applicationId,activityId,decision,note=''}){
      if(!applicationId||!activityId||!['approve','reject','adjustments'].includes(decision))throw new Error('Decisão inválida.');
      const reviewNote=String(note||'').trim();if(decision==='adjustments'&&!reviewNote)throw new Error('Informe o reajuste solicitado.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const allSessions=await applicationSessions(context,applicationId),sessions=allSessions.filter(row=>String(row.activityId)===String(activityId));
        if(!sessions.length)throw new Error('Proposta não encontrada.');
        const activityRef=firestore.doc(context.db,'activities',String(activityId)),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        const reviewStatus=decision==='approve'?'approved':decision==='reject'?'rejected':'adjustments';
        const sessionStatus=decision==='approve'?'confirmed':decision==='reject'?'rejected':'proposed';
        const reviewPatch={postApprovalProposal:true,reviewStatus,reviewNote:decision==='adjustments'?reviewNote:'',reviewedAt:now,updatedAt:now};
        batch.update(activityRef,reviewPatch);
        sessions.forEach(session=>batch.update(firestore.doc(context.db,'activity_sessions',String(session.id)),{...reviewPatch,status:sessionStatus,...(decision==='approve'?{confirmedAt:now}:{} )}));
        let counts=null;
        if(decision==='approve'){
          const simulated=allSessions.map(row=>String(row.activityId)===String(activityId)?{...row,status:'confirmed'}:row).filter(row=>row.status==='confirmed');
          const activityCount=new Set(simulated.map(row=>String(row.activityId||'')).filter(Boolean)).size;
          counts={sessionCount:simulated.length,activityCount};
          batch.update(firestore.doc(context.db,'applications',String(applicationId)),{sessionCount:counts.sessionCount,activityCount:counts.activityCount,updatedAt:now});
        }
        await batch.commit();
        const cached=activityCache.get(String(activityId));if(cached)Object.assign(cached,{postApprovalProposal:true,reviewStatus,reviewNote:decision==='adjustments'?reviewNote:''});
        return {reviewStatus,status:sessionStatus,sessionIds:sessions.map(row=>String(row.id)),counts};
      },{loading:false});
    },

    async deleteSession(sessionId,{applicationId,activityId}={}){
      if(!sessionId||!applicationId)throw new Error('Sessão não encontrada.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const sessions=await applicationSessions(context,applicationId);
        const remaining=sessions.filter(s=>String(s.id)!==String(sessionId));
        const remainingForActivity=remaining.filter(s=>String(s.activityId)===String(activityId));
        const remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean));
        const batch=firestore.writeBatch(context.db);
        batch.delete(firestore.doc(context.db,'activity_sessions',String(sessionId)));
        if(!remainingForActivity.length&&activityId){
          batch.delete(firestore.doc(context.db,'activities',String(activityId)));
          activityCache.delete(String(activityId));
        }
        await batch.commit();
        return {
          deletedActivity:!remainingForActivity.length,
          sessionCount:remaining.length,
          activityCount:remainingActivityIds.size
        };
      },{loading:false});
    },

    async updateSession(sessionId,patch){
      if(!sessionId)throw new Error('Sessão não encontrada.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        await firestore.updateDoc(
          firestore.doc(context.db,'activity_sessions',String(sessionId)),
          {...patch,updatedAt:firestore.serverTimestamp()}
        );
        return true;
      },{loading:false});
    }
  };
})();