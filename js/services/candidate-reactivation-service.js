/* Reativação consistente de candidatura: acesso + candidatura + planejamento no mesmo batch. */
(function candidateReactivationService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.applications)return;

  function metric(name,started,count,meta={}){
    const row={name,ms:Date.now()-started,count:Number(count)||0,...meta,at:new Date().toISOString()};
    window.OleiroQueryMetrics=window.OleiroQueryMetrics||[];
    window.OleiroQueryMetrics.push(row);
    if(window.OleiroQueryMetrics.length>40)window.OleiroQueryMetrics.splice(0,window.OleiroQueryMetrics.length-40);
    if(row.ms>1200)console.warn(`[Firestore lento] ${name}: ${row.ms}ms • ${row.count} docs`,meta);
  }

  services.applications.reactivateCandidatePlanning=async function(id,{participantUids=[],planningDeadlineAt=null}={}){
    if(!id)throw new Error('Candidatura não encontrada.');
    if(!planningDeadlineAt)throw new Error('Novo prazo do planejamento não informado.');

    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,applicationId=String(id),started=Date.now();
      const [sessionsSnapshot,activitiesSnapshot]=await Promise.all([
        firestore.getDocs(firestore.query(
          firestore.collection(context.db,'activity_sessions'),
          firestore.where('applicationId','==',applicationId)
        )),
        firestore.getDocs(firestore.query(
          firestore.collection(context.db,'activities'),
          firestore.where('applicationId','==',applicationId)
        ))
      ]);
      metric('candidate/reactivation-planning',started,sessionsSnapshot.size+activitiesSnapshot.size,{applicationId,queries:2});

      const uids=[...new Set((participantUids||[]).filter(Boolean).map(String))];
      const total=sessionsSnapshot.size+activitiesSnapshot.size+uids.length+1;
      if(total>450)throw new Error('Este planejamento é grande demais para reativar em uma única operação segura.');

      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp(),remove=firestore.deleteField();
      batch.update(firestore.doc(context.db,'applications',applicationId),{
        status:'pending',active:true,planningDeadlineAt,planningSubmittedAt:null,planningApprovedAt:null,
        dayAdjustments:{},meetingStatus:null,meetingDate:null,meetingTime:'',meetingDuration:30,meetingLink:'',meetingNotes:'',
        meetingScheduledAt:remove,meetingCompletedAt:remove,finalDecision:null,finalDecisionAt:remove,finalDecisionByUid:'',
        rejectedReason:'',rejectedAt:null,autoRejected:false,needsAdminAttention:false,
        sessionCount:sessionsSnapshot.size,activityCount:activitiesSnapshot.size,planningCountVersion:1,updatedAt:now
      });

      sessionsSnapshot.docs.forEach(doc=>{
        const data=doc.data(),managerCreated=data.managerCreated===true;
        batch.update(doc.ref,{
          status:managerCreated?'manager_confirmed':'proposed',rejectedAt:remove,confirmedAt:remove,
          changeRequestedAt:remove,changeNote:'',postApprovalProposal:false,reviewStatus:'',reviewNote:'',
          reviewSubmittedAt:remove,reviewedAt:remove,updatedAt:now
        });
      });
      activitiesSnapshot.docs.forEach(doc=>{
        const data=doc.data(),managerCreated=data.managerCreated===true;
        batch.update(doc.ref,{
          status:managerCreated?'manager_confirmed':'proposed',rejectedAt:remove,
          postApprovalProposal:false,reviewStatus:'',reviewNote:'',reviewSubmittedAt:remove,reviewedAt:remove,updatedAt:now
        });
      });
      uids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:true,updatedAt:now}));

      await batch.commit();
      return {status:'pending',active:true,sessionCount:sessionsSnapshot.size,activityCount:activitiesSnapshot.size,planningDeadlineAt};
    },{loading:false});
  };
})();
