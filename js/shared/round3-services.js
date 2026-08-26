/* Round 3 — patches de serviço sem afrouxar as regras do Firestore. */
(function round3Services(){
  const services=window.OleiroServices=window.OleiroServices||{};

  /* Grupos: mantém cache curto por sessão para evitar nova consulta em toda navegação. */
  if(services.groups){
    const originalList=services.groups.list?.bind(services.groups);
    const originalEnsure=services.groups.ensureDefaults?.bind(services.groups);
    const originalUpdate=services.groups.update?.bind(services.groups);
    const memory=new Map();
    const keyFor=unitId=>`oleiro-r3-groups-${String(unitId||'rodeio').toLowerCase()}`;
    const clone=rows=>(rows||[]).map(row=>({...row,members:[...(row.members||[])]}));
    function readCache(unitId){
      const key=String(unitId||'rodeio').toLowerCase();
      if(memory.has(key))return clone(memory.get(key));
      try{
        const raw=sessionStorage.getItem(keyFor(key));if(!raw)return null;const parsed=JSON.parse(raw);
        if(!parsed?.rows||Date.now()-Number(parsed.at||0)>10*60*1000)return null;
        memory.set(key,parsed.rows);return clone(parsed.rows);
      }catch{return null}
    }
    function writeCache(unitId,rows){
      const key=String(unitId||'rodeio').toLowerCase(),safe=clone(rows);memory.set(key,safe);
      try{sessionStorage.setItem(keyFor(key),JSON.stringify({at:Date.now(),rows:safe}))}catch{}
      return clone(safe);
    }
    if(originalList){
      services.groups.list=async function(opts={}){const unitId=opts.unitId||'rodeio';const cached=readCache(unitId);if(cached?.length)return cached;const rows=await originalList(opts);return writeCache(unitId,rows)};
    }
    if(originalEnsure){
      services.groups.ensureDefaults=async function(unitId='rodeio'){const cached=readCache(unitId);if(cached?.length)return cached;const rows=await originalEnsure(unitId);return writeCache(unitId,rows)};
    }
    if(originalUpdate){
      services.groups.update=async function(id,patch){const result=await originalUpdate(id,patch);for(const [unitId,rows] of memory.entries()){const index=rows.findIndex(row=>String(row.id)===String(id));if(index>=0){rows[index]={...rows[index],...patch};writeCache(unitId,rows)}}return result};
    }
  }

  /*
   * Planejamento do candidato:
   * as regras permitem criar/editar activity + activity_session, porém não permitem
   * ao candidato atualizar o documento application apenas para recalcular contadores.
   * A rodada anterior colocou essa atualização no mesmo batch e fazia o batch inteiro falhar.
   * Aqui os contadores ficam locais e são recalculados pelo Admin ao abrir o planejamento.
   */
  if(services.planning){
    const localActivities=new Map();
    async function applicationSessions(context,applicationId){
      const {firestore}=context.modules;
      const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',String(applicationId))));
      return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    }

    services.planning.saveActivity=async function({activityId=null,applicationId,unitId,createdByUid,ownerName='',data,dates,existingSessions=[]}){
      if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const activityRef=activityId?firestore.doc(context.db,'activities',String(activityId)):firestore.doc(firestore.collection(context.db,'activities'));
        const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        const editableDefinition={applicationId:String(applicationId),ownerName:String(ownerName||''),name:data.name,description:data.description||'',duration:Number(data.duration)||60,participation:data.participation||'Livre',materials:data.materials||'',notes:data.notes||'',period:data.period||'Sem preferência',time:data.time||'',updatedAt:now};
        if(activityId)batch.update(activityRef,editableDefinition);else batch.set(activityRef,{...editableDefinition,createdByUid:String(createdByUid),createdAt:now});

        const wanted=new Set((dates||[]).map(String));
        const byDate=new Map((existingSessions||[]).filter(s=>String(s.activityId)===String(activityRef.id)).map(s=>[String(s.date),s]));
        const sessionDefinition={activityName:data.name,activityDescription:data.description||'',participation:data.participation||'Livre',materials:data.materials||'',notes:data.notes||'',ownerName:String(ownerName||''),time:data.time||'',period:data.period||'Sem preferência',duration:Number(data.duration)||60};
        const resultSessions=[],deletedSessionIds=[];

        for(const [date,session] of byDate){
          const ref=firestore.doc(context.db,'activity_sessions',String(session.id));
          if(!wanted.has(date)){batch.delete(ref);deletedSessionIds.push(String(session.id));}
          else{batch.update(ref,{...sessionDefinition,updatedAt:now});resultSessions.push({...session,...sessionDefinition,date});}
        }
        for(const date of wanted){
          if(byDate.has(date))continue;
          const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));
          const row={id:sessionRef.id,applicationId:String(applicationId),activityId:activityRef.id,unitId:String(unitId||''),date,...sessionDefinition,status:'proposed',groupId:null,createdByUid:String(createdByUid)};
          batch.set(sessionRef,{...row,createdAt:now,updatedAt:now});resultSessions.push(row);
        }
        await batch.commit();
        const activity={id:activityRef.id,...editableDefinition,createdByUid:String(createdByUid)};localActivities.set(String(activityRef.id),activity);
        return {activityId:activityRef.id,activity,sessions:resultSessions,deletedSessionIds};
      },{loading:false});
    };

    services.planning.deleteSession=async function(sessionId,{applicationId,activityId}={}){
      if(!sessionId||!applicationId)throw new Error('Sessão não encontrada.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const sessions=await applicationSessions(context,applicationId),remaining=sessions.filter(s=>String(s.id)!==String(sessionId));
        const remainingForActivity=remaining.filter(s=>String(s.activityId)===String(activityId));
        const remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean));
        const batch=firestore.writeBatch(context.db);
        batch.delete(firestore.doc(context.db,'activity_sessions',String(sessionId)));
        if(!remainingForActivity.length&&activityId){batch.delete(firestore.doc(context.db,'activities',String(activityId)));localActivities.delete(String(activityId));}
        await batch.commit();
        return {deletedActivity:!remainingForActivity.length,sessionCount:remaining.length,activityCount:remainingActivityIds.size};
      },{loading:false});
    };
  }
})();
