(function initAttentionService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  services.attention={
    async listForAdmin({unit='rodeio',limit=services.config?.notificationLimit||5}={}){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const constraints=[firestore.where('needsAdminAttention','==',true)];
        if(unit&&unit!=='all')constraints.push(firestore.where('unitId','==',String(unit).toLowerCase()));
        constraints.push(firestore.limit(Math.max(1,Number(limit)||5)));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        return snapshot.docs.map(doc=>{
          const data=doc.data();
          const names=Array.isArray(data.participantNames)?data.participantNames.join(' + '):'Voluntário';
          return {id:doc.id,title:data.adminAttentionTitle||'Atualização de voluntariado',text:data.adminAttentionText||`${names} possui uma pendência para análise.`,applicationId:doc.id};
        });
      });
    },
    async markAdminAttentionRead(id){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{needsAdminAttention:false,adminAttentionHandledAt:firestore.serverTimestamp(),updatedAt:firestore.serverTimestamp()});
        return true;
      },{loading:false});
    }
  };
})();
