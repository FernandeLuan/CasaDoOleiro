(function initUserService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const MANAGER_CACHE_MS=10*60*1000;let managerCache=null;
  services.users={
    async listManagers({force=false}={}){if(!force&&managerCache&&Date.now()-managerCache.at<MANAGER_CACHE_MS)return managerCache.rows.map(row=>({...row}));return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules,started=Date.now();const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'users'),firestore.where('role','in',['admin','coordinator'])));services.recordQuery?.('users/managers',started,snapshot.size,{roles:2});const rows=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>row.active===true);managerCache={at:Date.now(),rows};return rows.map(row=>({...row}));},{loading:false});},
    async getByIds(uids){const ids=[...new Set((uids||[]).map(String).filter(Boolean))];if(!ids.length)return [];return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules,started=Date.now();const snapshots=await Promise.all(ids.map(uid=>firestore.getDoc(firestore.doc(context.db,'users',uid))));services.recordQuery?.('users/by-ids',started,snapshots.filter(snapshot=>snapshot.exists()).length,{requested:ids.length,pointReads:ids.length});return snapshots.map((snapshot,index)=>snapshot.exists()?{id:snapshot.id,...snapshot.data()}: {id:ids[index],missing:true});},{loading:false});},
    invalidateManagers(){managerCache=null}
  };
})();
