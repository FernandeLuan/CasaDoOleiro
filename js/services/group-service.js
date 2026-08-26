(function initGroupService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const memory=new Map();
  const ttlMs=10*60*1000;

  function normalizeUnit(unitId){return String(unitId||'rodeio').toLowerCase()}
  function cacheKey(unitId){return `oleiro-groups-${normalizeUnit(unitId)}`}
  function clone(rows){return (rows||[]).map(row=>({...row,members:[...(row.members||[])]}))}
  function mapGroup(doc){const data=doc.data();return {id:doc.id,code:data.code||doc.id.split('_').pop(),unitId:data.unitId||'rodeio',capacity:Number(data.capacity||5),note:data.note||'',members:Array.isArray(data.members)?data.members:[],...data}}

  function readCache(unitId){
    const key=normalizeUnit(unitId);
    const inMemory=memory.get(key);
    if(inMemory&&Date.now()-inMemory.at<=ttlMs)return clone(inMemory.rows);
    try{
      const raw=sessionStorage.getItem(cacheKey(key));
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      if(!parsed?.rows||Date.now()-Number(parsed.at||0)>ttlMs)return null;
      memory.set(key,{at:Number(parsed.at||Date.now()),rows:parsed.rows});
      return clone(parsed.rows);
    }catch{return null}
  }

  function writeCache(unitId,rows){
    const key=normalizeUnit(unitId),entry={at:Date.now(),rows:clone(rows)};
    memory.set(key,entry);
    try{sessionStorage.setItem(cacheKey(key),JSON.stringify(entry))}catch{}
    return clone(entry.rows);
  }

  services.groups={
    async list({unitId='rodeio',force=false}={}){
      const normalized=normalizeUnit(unitId);
      if(!force){const cached=readCache(normalized);if(cached)return cached}
      const rows=await services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'groups'),firestore.where('unitId','==',normalized)));
        return snapshot.docs.map(mapGroup).sort((a,b)=>String(a.code).localeCompare(String(b.code)));
      },{loading:false});
      return writeCache(normalized,rows);
    },

    async ensureDefaults(unitId='rodeio'){
      const normalized=normalizeUnit(unitId),current=await this.list({unitId:normalized});
      if(current.length)return current;
      const rows=await services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const batch=firestore.writeBatch(context.db);
        const defaults=['A','B','C','D'].map(code=>({id:`${normalized}_${code}`,code,unitId:normalized,capacity:5,note:'',members:[]}));
        defaults.forEach(row=>batch.set(firestore.doc(context.db,'groups',row.id),{code:row.code,unitId:row.unitId,capacity:5,note:'',members:[],createdAt:firestore.serverTimestamp(),updatedAt:firestore.serverTimestamp()}));
        await batch.commit();return defaults;
      },{loading:false});
      return writeCache(normalized,rows);
    },

    async update(id,patch){
      await services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'groups',String(id)),{...patch,updatedAt:firestore.serverTimestamp()});
      },{loading:false});
      for(const [unitId,entry] of memory.entries()){
        const rows=clone(entry.rows),index=rows.findIndex(row=>String(row.id)===String(id));
        if(index>=0){rows[index]={...rows[index],...patch};writeCache(unitId,rows)}
      }
      return true;
    },

    invalidate(unitId='rodeio'){
      const key=normalizeUnit(unitId);memory.delete(key);try{sessionStorage.removeItem(cacheKey(key))}catch{}
    }
  };
})();
