(function initApplicationMaintenanceService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  services.applications=services.applications||{};
  services.applications.processExpiredPending=async function({pageSize=50}={}){
    return services.run(async()=>{
      const context=await services.firebase();const {firestore}=context.modules;let total=0;
      const max=Math.max(1,Math.min(Number(pageSize)||50,100));
      for(let page=0;page<20;page++){
        const started=Date.now();
        const snapshot=await firestore.getDocs(firestore.query(
          firestore.collection(context.db,'applications'),
          firestore.where('status','==','pending'),
          firestore.where('planningDeadlineAt','<=',firestore.Timestamp.fromDate(new Date())),
          firestore.orderBy('planningDeadlineAt','asc'),
          firestore.limit(max)
        ));
        services.recordQuery?.('applications/expired-pending',started,snapshot.size,{page:page+1,limit:max});
        if(snapshot.empty)break;
        for(const applicationDoc of snapshot.docs){
          const data=applicationDoc.data()||{},uids=[...new Set((data.participantUids||[]).map(String).filter(Boolean))],batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
          batch.update(applicationDoc.ref,{status:'rejected',active:false,planningDeadlineAt:null,rejectedReason:'Prazo de 7 dias para envio do planejamento expirado.',rejectedAt:now,autoRejected:true,needsAdminAttention:false,updatedAt:now});
          uids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:false,updatedAt:now}));
          await batch.commit();total+=1;
        }
        if(snapshot.size<max)break;
      }
      return total;
    },{loading:false});
  };
})();
