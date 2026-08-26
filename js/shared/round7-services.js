/* Round 7 — ferramenta administrativa para reiniciar um planejamento sem apagar a conta. */
(function round7Services(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.applications)return;

  services.applications.resetPlanning=async function(applicationId,{deadlineDays=7}={}){
    if(!applicationId)throw new Error('Candidatura não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase();
      const {firestore}=context.modules;
      const id=String(applicationId);
      const [sessionsSnapshot,activitiesSnapshot]=await Promise.all([
        firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',id))),
        firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',id)))
      ]);

      const refs=[...sessionsSnapshot.docs.map(doc=>doc.ref),...activitiesSnapshot.docs.map(doc=>doc.ref)];
      for(let i=0;i<refs.length;i+=400){
        const batch=firestore.writeBatch(context.db);
        refs.slice(i,i+400).forEach(ref=>batch.delete(ref));
        await batch.commit();
      }

      const deadline=new Date();deadline.setDate(deadline.getDate()+Math.max(1,Number(deadlineDays)||7));
      const now=firestore.serverTimestamp();
      await firestore.updateDoc(firestore.doc(context.db,'applications',id),{
        status:'pending',
        active:true,
        planningDeadlineAt:firestore.Timestamp.fromDate(deadline),
        planningSubmittedAt:null,
        approvedAt:null,
        dayAdjustments:{},
        sessionCount:0,
        activityCount:0,
        needsAdminAttention:false,
        adminAttentionTitle:'',
        adminAttentionText:'',
        adminAttentionUpdatedAt:null,
        updatedAt:now
      });

      return {
        deletedSessions:sessionsSnapshot.size,
        deletedActivities:activitiesSnapshot.size,
        planningDeadlineAt:deadline.toISOString()
      };
    },{loading:false});
  };
})();
