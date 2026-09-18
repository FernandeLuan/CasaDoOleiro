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

  services.applications.purgeVolunteerApplication=async function(applicationId){
    const id=String(applicationId||'').trim();
    if(!id)throw new Error('Cadastro inválido.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules;
      const applicationRef=firestore.doc(context.db,'applications',id);
      const applicationSnapshot=await firestore.getDoc(applicationRef);
      if(!applicationSnapshot.exists())return {applicationId:id,alreadyDeleted:true,participants:0,activities:0,sessions:0};

      const application=applicationSnapshot.data()||{};
      const uids=[...new Set((application.participantUids||[]).map(String).filter(Boolean))];

      /* Bloqueia o planejamento antes de iniciar a limpeza. Se a conexão cair,
         o Admin pode repetir a operação com segurança. */
      await firestore.updateDoc(applicationRef,{
        active:false,
        deleting:true,
        updatedAt:firestore.serverTimestamp()
      });

      const started=Date.now();
      const [activitiesSnapshot,sessionsSnapshot]=await Promise.all([
        firestore.getDocs(firestore.query(
          firestore.collection(context.db,'activities'),
          firestore.where('applicationId','==',id)
        )),
        firestore.getDocs(firestore.query(
          firestore.collection(context.db,'activity_sessions'),
          firestore.where('applicationId','==',id)
        ))
      ]);
      services.recordQuery?.('applications/purge-related',started,activitiesSnapshot.size+sessionsSnapshot.size,{
        applicationId:id,
        activities:activitiesSnapshot.size,
        sessions:sessionsSnapshot.size
      });

      async function deleteRefs(refs){
        const rows=[...refs];
        for(let offset=0;offset<rows.length;offset+=350){
          const batch=firestore.writeBatch(context.db);
          rows.slice(offset,offset+350).forEach(ref=>batch.delete(ref));
          await batch.commit();
        }
      }

      await deleteRefs([
        ...activitiesSnapshot.docs.map(doc=>doc.ref),
        ...sessionsSnapshot.docs.map(doc=>doc.ref),
        ...uids.map(uid=>firestore.doc(context.db,'volunteer_profiles',uid)),
        ...uids.map(uid=>firestore.doc(context.db,'users',uid))
      ]);

      /* O histórico interno é mantido como trilha de auditoria. Sem o documento pai,
         ele deixa de ser acessível pelo aplicativo e não contém credenciais de acesso. */
      await firestore.deleteDoc(applicationRef);
      return {
        applicationId:id,
        participants:uids.length,
        activities:activitiesSnapshot.size,
        sessions:sessionsSnapshot.size,
        auditHistoryRetained:true
      };
    },{loading:false,monitor:{area:'admin',action:'purge_volunteer_application'}});
  };
})();
