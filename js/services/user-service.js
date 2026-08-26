(function initUserService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  services.users={
    async listManagers(){return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'users'),firestore.where('role','in',['admin','coordinator'])));return snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>row.active===true);},{loading:false});}
  };
})();
