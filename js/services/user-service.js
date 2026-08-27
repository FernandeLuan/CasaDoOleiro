(function initUserService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  services.users={
    async listManagers(){return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'users'),firestore.where('role','in',['admin','coordinator'])));return snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>row.active===true);},{loading:false});},
    async getByIds(uids){const ids=[...new Set((uids||[]).map(String).filter(Boolean))];if(!ids.length)return [];return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const snapshots=await Promise.all(ids.map(uid=>firestore.getDoc(firestore.doc(context.db,'users',uid))));return snapshots.map((snapshot,index)=>snapshot.exists()?{id:snapshot.id,...snapshot.data()}: {id:ids[index],missing:true});},{loading:false});}
  };
})();
