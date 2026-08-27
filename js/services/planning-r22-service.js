/* Round 22 — operações administrativas e validações de planejamento com orçamento de leitura limitado. */
(function planningR22Service(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.planning)return;

  const baseSaveActivity=services.planning.saveActivity?.bind(services.planning);
  const baseSubmitPlanning=services.applications?.submitPlanning?.bind(services.applications);

  function metric(name,started,count,meta={}){
    const row={name,ms:Date.now()-started,count:Number(count)||0,...meta,at:new Date().toISOString()};
    window.OleiroQueryMetrics=window.OleiroQueryMetrics||[];
    window.OleiroQueryMetrics.push(row);
    if(window.OleiroQueryMetrics.length>40)window.OleiroQueryMetrics.splice(0,window.OleiroQueryMetrics.length-40);
    if(row.ms>1200)console.warn(`[Firestore lento] ${name}: ${row.ms}ms • ${row.count} docs`,meta);
  }
  function cleanGroup(value){const group=String(value||'').trim();return ['A','B','C','D','Livre'].includes(group)?group:null}

  services.planning.hasSessions=async function({applicationId}={}){
    if(!applicationId)return false;
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,started=Date.now();
      const snapshot=await firestore.getDocs(firestore.query(
        firestore.collection(context.db,'activity_sessions'),
        firestore.where('applicationId','==',String(applicationId)),
        firestore.limit(1)
      ));
      metric('activity_sessions/exists',started,snapshot.size,{applicationId:String(applicationId),limit:1});
      return !snapshot.empty;
    },{loading:false});
  };

  if(baseSaveActivity){
    services.planning.saveActivity=async function(args={}){
      const result=await baseSaveActivity(args);
      const groupRequested=Object.prototype.hasOwnProperty.call(args,'groupId');
      const managerCreated=args.managerCreated===true;
      const markCounts=args.updateApplicationCounts===true;
      if(!groupRequested&&!managerCreated&&!markCounts)return result;

      await services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        const groupId=cleanGroup(args.groupId);let changed=false;
        (result?.sessions||[]).forEach(session=>{
          const patch={};
          if(groupRequested)patch.groupId=groupId;
          if(managerCreated)patch.managerCreated=true;
          if(!Object.keys(patch).length)return;
          batch.update(firestore.doc(context.db,'activity_sessions',String(session.id)),{...patch,updatedAt:now});
          Object.assign(session,patch);changed=true;
        });
        if(managerCreated&&result?.activityId){
          batch.update(firestore.doc(context.db,'activities',String(result.activityId)),{managerCreated:true,updatedAt:now});
          if(result.activity)result.activity.managerCreated=true;changed=true;
        }
        if(markCounts&&args.applicationId){
          batch.update(firestore.doc(context.db,'applications',String(args.applicationId)),{planningCountVersion:1,updatedAt:now});changed=true;
        }
        if(changed)await batch.commit();
      },{loading:false});
      return result;
    };
  }

  services.planning.managerUpdateSession=async function({sessionId,activityId,patch={}}={}){
    if(!sessionId)throw new Error('Sessão não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      const sessionPatch={
        activityName:String(patch.activityName||'').trim()||'Atividade',
        activityDescription:String(patch.activityDescription||''),
        duration:Math.max(15,Math.min(Number(patch.duration)||60,240)),
        participation:String(patch.participation||'Livre'),
        materials:String(patch.materials||''),
        notes:String(patch.notes||''),
        period:String(patch.period||'Sem preferência'),
        time:String(patch.time||''),
        groupId:cleanGroup(patch.groupId),
        updatedAt:now
      };
      batch.update(firestore.doc(context.db,'activity_sessions',String(sessionId)),sessionPatch);
      if(activityId){
        batch.update(firestore.doc(context.db,'activities',String(activityId)),{
          name:sessionPatch.activityName,description:sessionPatch.activityDescription,duration:sessionPatch.duration,
          participation:sessionPatch.participation,materials:sessionPatch.materials,notes:sessionPatch.notes,
          period:sessionPatch.period,time:sessionPatch.time,updatedAt:now
        });
      }
      await batch.commit();
      return {...sessionPatch,updatedAt:null};
    },{loading:false});
  };

  services.planning.deleteSession=async function(sessionId,{applicationId,activityId,knownCounts=null,updateApplicationCounts=false,planningStatePatch=null}={}){
    if(!sessionId||!applicationId)throw new Error('Sessão não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,appId=String(applicationId),actId=String(activityId||'');
      let deletedActivity=false;
      if(actId){
        const started=Date.now();
        const occurrenceSnapshot=await firestore.getDocs(firestore.query(
          firestore.collection(context.db,'activity_sessions'),
          firestore.where('activityId','==',actId),
          firestore.limit(2)
        ));
        metric('activity_sessions/activity-delete-check',started,occurrenceSnapshot.size,{activityId:actId,limit:2});
        const other=occurrenceSnapshot.docs.some(doc=>String(doc.id)!==String(sessionId));
        deletedActivity=!other;
      }

      let nextSessionCount=null,nextActivityCount=null;
      if(updateApplicationCounts){
        const knownSession=Number(knownCounts?.sessionCount),knownActivity=Number(knownCounts?.activityCount);
        if(Number.isFinite(knownSession)&&Number.isFinite(knownActivity)){
          nextSessionCount=Math.max(0,knownSession-1);
          nextActivityCount=Math.max(0,knownActivity-(deletedActivity?1:0));
        }else{
          if(typeof firestore.getCountFromServer!=='function')throw new Error('Contagem segura do Firestore indisponível. Exclusão cancelada para evitar leitura ampla.');
          const started=Date.now();
          const [sessionCountSnapshot,activityCountSnapshot]=await Promise.all([
            firestore.getCountFromServer(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',appId))),
            firestore.getCountFromServer(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',appId)))
          ]);
          nextSessionCount=Math.max(0,(Number(sessionCountSnapshot.data().count)||0)-1);
          nextActivityCount=Math.max(0,(Number(activityCountSnapshot.data().count)||0)-(deletedActivity?1:0));
          metric('planning/delete-counts',started,2,{applicationId:appId,aggregations:2});
        }
      }

      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.delete(firestore.doc(context.db,'activity_sessions',String(sessionId)));
      if(deletedActivity&&actId)batch.delete(firestore.doc(context.db,'activities',actId));
      const applicationPatch={...(planningStatePatch||{}),updatedAt:now};
      if(updateApplicationCounts){applicationPatch.sessionCount=nextSessionCount;applicationPatch.activityCount=nextActivityCount;applicationPatch.planningCountVersion=1}
      if(Object.keys(applicationPatch).length>1||updateApplicationCounts)batch.update(firestore.doc(context.db,'applications',appId),applicationPatch);
      await batch.commit();
      return {deletedActivity,sessionCount:nextSessionCount,activityCount:nextActivityCount,planningStatePatch:planningStatePatch||null};
    },{loading:false});
  };

  if(baseSubmitPlanning){
    services.applications.submitPlanning=async function(id,...rest){
      if(!id)throw new Error('Candidatura não encontrada.');
      const hasAny=await services.planning.hasSessions({applicationId:id});
      if(!hasAny)throw new Error('Adicione pelo menos uma atividade antes de enviar o planejamento.');
      return baseSubmitPlanning(id,...rest);
    };
  }
})();
