/* Round 36 — planning approval resolves candidate adjustment state atomically. */
(function selectionFlowR36Service(){
  const services=window.OleiroServices=window.OleiroServices||{};if(!services.applications||!services.planning)return;
  services.applications.approvePlanning=async function(id,{participantUids=[]}={}){
    if(!id)throw new Error('Candidatura não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id),started=Date.now();
      const [sessionsSnapshot,activitiesSnapshot]=await Promise.all([
        firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',applicationId))),
        firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',applicationId)))
      ]);
      services.recordQuery?.('selection/planning-docs-r36',started,sessionsSnapshot.size+activitiesSnapshot.size,{applicationId,queries:2});
      if(!sessionsSnapshot.size)throw new Error('Não há atividades para aprovar.');
      const uids=[...new Set((participantUids||[]).filter(Boolean).map(String))];
      if(sessionsSnapshot.size+activitiesSnapshot.size+uids.length+1>450)throw new Error('Este planejamento é grande demais para concluir a etapa em uma única operação segura.');
      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.update(firestore.doc(context.db,'applications',applicationId),{
        status:'meeting',active:true,planningDeadlineAt:null,planningApprovedAt:now,dayAdjustments:{},
        meetingStatus:'pending',meetingDate:null,meetingTime:'',meetingDuration:30,meetingLink:'',meetingNotes:'',
        sessionCount:sessionsSnapshot.size,activityCount:activitiesSnapshot.size,planningCountVersion:1,updatedAt:now
      });
      sessionsSnapshot.docs.forEach(doc=>{
        const row=doc.data()||{},patch={status:'plan_approved',changeNote:'',updatedAt:now};
        if(row.adminAdjustmentStatus)patch.adminAdjustmentStatus='approved';
        batch.update(doc.ref,patch);
      });
      activitiesSnapshot.docs.forEach(doc=>batch.update(doc.ref,{status:'plan_approved',updatedAt:now}));
      uids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:true,updatedAt:now}));
      await batch.commit();return {confirmedSessions:sessionsSnapshot.size,sessionCount:sessionsSnapshot.size,activityCount:activitiesSnapshot.size,status:'meeting'};
    },{loading:false});
  };
})();
