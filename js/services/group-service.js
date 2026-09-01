(function initGroupService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const memory=new Map();
  const ttlMs=10*60*1000;

  function normalizeUnit(unitId){return String(unitId||'rodeio').toLowerCase()}
  function scopedUnit(unitId){
    const requested=normalizeUnit(unitId);
    return normalizeUnit(services.accessScope?.forceUnit?.(requested)||requested);
  }
  function cacheKey(unitId){return `oleiro-groups-${normalizeUnit(unitId)}`}
  function clone(rows){return (rows||[]).map(row=>({...row,members:[...(row.members||[])]}))}
  function mapGroup(doc){const data=doc.data();return {id:doc.id,code:data.code||doc.id.split('_').pop(),unitId:data.unitId||'rodeio',capacity:Number(data.capacity||5),note:data.note||'',members:Array.isArray(data.members)?data.members:[],...data}}
  function sortRows(rows){return clone(rows).sort((a,b)=>String(a.code).localeCompare(String(b.code)))}

  function readCache(unitId){
    const key=normalizeUnit(unitId),inMemory=memory.get(key);
    if(inMemory&&Date.now()-inMemory.at<=ttlMs)return clone(inMemory.rows);
    try{
      const raw=sessionStorage.getItem(cacheKey(key));if(!raw)return null;
      const parsed=JSON.parse(raw);if(!parsed?.rows||Date.now()-Number(parsed.at||0)>ttlMs)return null;
      memory.set(key,{at:Number(parsed.at||Date.now()),rows:parsed.rows});return clone(parsed.rows);
    }catch{return null}
  }

  function writeCache(unitId,rows){
    const key=normalizeUnit(unitId),entry={at:Date.now(),rows:sortRows(rows)};memory.set(key,entry);
    try{sessionStorage.setItem(cacheKey(key),JSON.stringify(entry))}catch{}
    return clone(entry.rows);
  }

  services.groups={
    async list({unitId='rodeio',force=false}={}){
      const normalized=scopedUnit(unitId);if(!force){const cached=readCache(normalized);if(cached)return cached}
      const rows=await services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,started=Date.now();
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'groups'),firestore.where('unitId','==',normalized)));
        services.recordQuery?.('groups/unit',started,snapshot.size,{unitId:normalized});
        return snapshot.docs.map(mapGroup);
      },{loading:false,monitor:{area:'groups',action:'list_unit',unitId:normalized}});
      return writeCache(normalized,rows);
    },

    async ensureDefaults(unitId='rodeio'){
      const normalized=scopedUnit(unitId),current=await this.list({unitId:normalized}),required=['A','B','C','D'];
      const existingCodes=new Set(current.map(row=>String(row.code||'').toUpperCase())),missing=required.filter(code=>!existingCodes.has(code));
      if(!missing.length)return sortRows(current);
      const created=await services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        const rows=missing.map(code=>({id:`${normalized}_${code}`,code,unitId:normalized,capacity:5,note:'',members:[]}));
        rows.forEach(row=>batch.set(firestore.doc(context.db,'groups',row.id),{code:row.code,unitId:row.unitId,capacity:5,note:'',members:[],createdAt:now,updatedAt:now},{merge:true}));
        await batch.commit();return rows;
      },{loading:false,monitor:{area:'groups',action:'ensure_defaults',unitId:normalized}});
      return writeCache(normalized,[...current,...created]);
    },

    async update(id,patch){
      await services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'groups',String(id)),{...patch,updatedAt:firestore.serverTimestamp()});
      },{loading:false,monitor:{area:'groups',action:'update',groupId:String(id)}});
      for(const [unitId,entry] of memory.entries()){
        const rows=clone(entry.rows),index=rows.findIndex(row=>String(row.id)===String(id));
        if(index>=0){rows[index]={...rows[index],...patch};writeCache(unitId,rows)}
      }
      return true;
    },

    invalidate(unitId='rodeio'){
      const key=scopedUnit(unitId);memory.delete(key);try{sessionStorage.removeItem(cacheKey(key))}catch{}
    }
  };
})();
