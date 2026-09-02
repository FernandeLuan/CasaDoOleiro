(function initPlanningService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const activityCache=new Map();

  function indexUnavailable(error){return /index|failed-precondition/i.test(`${error?.code||''} ${error?.message||''}`)}
  function cleanGroup(value){const group=String(value||'').trim();return ['A','B','C','D','Livre'].includes(group)?group:null}
  async function applicationSessions(context,applicationId,{from=null,to=null}={}){
    const {firestore}=context.modules,collection=firestore.collection(context.db,'activity_sessions'),appId=String(applicationId),constraints=[firestore.where('applicationId','==',appId)];
    if(from)constraints.push(firestore.where('date','>=',String(from)));
    if(to)constraints.push(firestore.where('date','<=',String(to)));
    if(from||to)constraints.push(firestore.orderBy('date','asc'));
    const started=Date.now();
    try{
      const snapshot=await firestore.getDocs(firestore.query(collection,...constraints));
      services.recordQuery?.('activity_sessions/application',started,snapshot.size,{applicationId:appId,from:from||'',to:to||''});
      return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    }catch(error){
      if((from||to)&&indexUnavailable(error)){
        const safeError=new Error('O índice activity_sessions(applicationId, date) ainda não está pronto. A consulta ampla foi bloqueada para proteger a cota do Firestore.');
        safeError.code='oleiro/index-not-ready';
        throw safeError;
      }
      throw error;
    }
  }
  async function activitySessions(context,applicationId,activityId){
    const {firestore}=context.modules,appId=String(applicationId),actId=String(activityId),started=Date.now();
    const snapshot=await firestore.getDocs(firestore.query(
      firestore.collection(context.db,'activity_sessions'),
      firestore.where('applicationId','==',appId),
      firestore.where('activityId','==',actId)
    ));
    services.recordQuery?.('activity_sessions/activity-review',started,snapshot.size,{applicationId:appId,activityId:actId});
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  }

  services.planning={
    async listSessions({applicationId,from,to}={}){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const rows=await applicationSessions(context,applicationId,{from,to});
        return rows.sort(typeof activityScheduleCompare==='function'?activityScheduleCompare:(a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      },{loading:false});
    },

    async listPendingChanges({limit=100}={}){
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

    async listActivities(applicationId){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules,started=Date.now();
        const snapshot=await firestore.getDocs(
          firestore.query(
            firestore.collection(context.db,'activities'),
            firestore.where('applicationId','==',String(applicationId))
          )
        );
        services.recordQuery?.('activities/application',started,snapshot.size,{applicationId:String(applicationId)});
        const rows=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
        rows.forEach(row=>activityCache.set(String(row.id),row));
        return rows;
      },{loading:false});
    },

    async saveActivity(args={}){
      const {activityId=null,applicationId,unitId,createdByUid,ownerName='',data,dates,existingSessions=[],postApprovalProposal=false,sessionStatus='proposed',updateApplicationCounts=false,managerCreated=false}=args;
      if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const normalizedStatus=['proposed','confirmed'].includes(String(sessionStatus))?String(sessionStatus):'proposed';
        const groupRequested=Object.prototype.hasOwnProperty.call(args,'groupId'),groupId=groupRequested?cleanGroup(args.groupId):null;
        const finalStatus=managerCreated?'manager_confirmed':postApprovalProposal?'proposed':normalizedStatus;
        const activityRef=activityId
          ?firestore.doc(context.db,'activities',String(activityId))
          :firestore.doc(firestore.collection(context.db,'activities'));
        const batch=firestore.writeBatch(context.db);
        const now=firestore.serverTimestamp();
        const previousActivity=activityId?activityCache.get(String(activityId)):null;
        const reviewFields=postApprovalProposal?{postApprovalProposal:true,reviewStatus:'analysis',reviewNote:'',reviewSubmittedAt:now}:{};
        const managerFields=managerCreated?{managerCreated:true,status:'manager_confirmed'}:{};
        const legacyTime=String(data?.time||'').trim(),timeFields=legacyTime?{time:legacyTime}:{},period=typeof activityPeriodValue==='function'?activityPeriodValue(data):String(data.period||'Sem preferência');
        const editableDefinition={
          applicationId:String(applicationId),
          ownerName:String(ownerName||''),
          name:data.name,
          description:data.description||'',
          duration:Number(data.duration)||60,
          participation:data.participation||'Livre',
          materials:data.materials||'',
          notes:data.notes||'',
          period,
          ...timeFields,
          ...reviewFields,
          ...managerFields,
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
          period,
          ...timeFields,
          duration:Number(data.duration)||60,
          ...reviewFields,
          ...(managerCreated?{managerCreated:true}:{} )
        };
        const resultSessions=[];
        const deletedSessionIds=[];

        for(const [date,session] of byDate){
          const ref=firestore.doc(context.db,'activity_sessions',String(session.id));
          if(!wanted.has(date)){
            batch.delete(ref);
            deletedSessionIds.push(String(session.id));
          }else{
            const statusPatch={status:finalStatus},groupPatch=groupRequested?{groupId}:{};
            batch.update(ref,{...sessionDefinition,...statusPatch,...groupPatch,updatedAt:now});
            resultSessions.push({...session,...sessionDefinition,...statusPatch,...groupPatch,date});
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
            status:finalStatus,
            groupId:groupRequested?groupId:null,
            createdByUid:String(createdByUid)
          };
          batch.set(sessionRef,{...row,...(finalStatus==='confirmed'?{confirmedAt:now}:{}),createdAt:now,updatedAt:now});
          resultSessions.push(row);
        }

        if(updateApplicationCounts&&!activityId&&wanted.size){
          batch.update(firestore.doc(context.db,'applications',String(applicationId)),{
            sessionCount:firestore.increment(wanted.size),
            activityCount:firestore.increment(1),
            planningCountVersion:1,
            updatedAt:now
          });
        }

        await batch.commit();
        const activity={
          id:activityRef.id,
          ...(previousActivity?.time?{time:previousActivity.time}:{}),
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
        const sessions=await activitySessions(context,applicationId,activityId);
        if(!sessions.length)throw new Error('Proposta não encontrada.');
        if(!sessions.some(row=>row.postApprovalProposal===true))throw new Error('Esta atividade não é uma proposta pós-aprovação.');
        if(decision==='approve'&&sessions.every(row=>row.status==='confirmed'))throw new Error('Esta atividade já foi aprovada.');
        const activityRef=firestore.doc(context.db,'activities',String(activityId)),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        const reviewStatus=decision==='approve'?'approved':decision==='reject'?'rejected':'adjustments';
        const sessionStatus=decision==='approve'?'confirmed':decision==='reject'?'rejected':'proposed';
        const reviewPatch={postApprovalProposal:true,reviewStatus,reviewNote:decision==='adjustments'?reviewNote:'',status:sessionStatus,reviewedAt:now,updatedAt:now};
        batch.update(activityRef,reviewPatch);
        sessions.forEach(session=>batch.update(firestore.doc(context.db,'activity_sessions',String(session.id)),{...reviewPatch,status:sessionStatus,...(decision==='approve'?{confirmedAt:now}:{} )}));
        let countDelta=null;
        if(decision==='approve'){
          const newSessions=sessions.filter(row=>row.status!=='confirmed').length,newActivity=sessions.some(row=>row.status==='confirmed')?0:1;
          countDelta={sessionCount:newSessions,activityCount:newActivity};
          batch.update(firestore.doc(context.db,'applications',String(applicationId)),{
            sessionCount:firestore.increment(newSessions),activityCount:firestore.increment(newActivity),planningCountVersion:1,updatedAt:now
          });
        }
        await batch.commit();
        const cached=activityCache.get(String(activityId));if(cached)Object.assign(cached,{postApprovalProposal:true,reviewStatus,reviewNote:decision==='adjustments'?reviewNote:'',status:sessionStatus});
        return {reviewStatus,status:sessionStatus,sessionIds:sessions.map(row=>String(row.id)),countDelta};
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
