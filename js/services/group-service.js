(function initGroupService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  function mapGroup(doc){const data=doc.data();return {id:doc.id,code:data.code||doc.id.split('_').pop(),unitId:data.unitId||'rodeio',capacity:Number(data.capacity||5),note:data.note||'',members:Array.isArray(data.members)?data.members:[],...data};}
  services.groups={
    async list({unitId='rodeio'}={}){
      return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'groups'),firestore.where('unitId','==',String(unitId).toLowerCase())));return snapshot.docs.map(mapGroup).sort((a,b)=>String(a.code).localeCompare(String(b.code)));},{loading:false});
    },
    async ensureDefaults(unitId='rodeio'){
      const current=await this.list({unitId});if(current.length)return current;
      return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const batch=firestore.writeBatch(context.db);const rows=['A','B','C','D'].map(code=>({id:`${String(unitId).toLowerCase()}_${code}`,code,unitId:String(unitId).toLowerCase(),capacity:5,note:'',members:[]}));rows.forEach(row=>batch.set(firestore.doc(context.db,'groups',row.id),{code:row.code,unitId:row.unitId,capacity:5,note:'',members:[],createdAt:firestore.serverTimestamp(),updatedAt:firestore.serverTimestamp()}));await batch.commit();return rows;},{loading:false});
    },
    async update(id,patch){
      return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;await firestore.updateDoc(firestore.doc(context.db,'groups',String(id)),{...patch,updatedAt:firestore.serverTimestamp()});return true;},{loading:false});
    }
  };
})();
