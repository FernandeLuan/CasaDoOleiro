(function initUnitService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  function row(doc){return {id:doc.id,...doc.data()}}
  services.units={
    async list({includeInactive=false}={}){return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const snapshot=await firestore.getDocs(firestore.collection(context.db,'units'));const units=snapshot.docs.map(row).sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id),'pt-BR'));return includeInactive?units:units.filter(unit=>unit.active===true);},{loading:false});},
    async get(id){return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const snapshot=await firestore.getDoc(firestore.doc(context.db,'units',id));return snapshot.exists()?row(snapshot):null;},{loading:false});}
  };
})();
