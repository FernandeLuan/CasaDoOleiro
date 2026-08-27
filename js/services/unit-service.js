(function initUnitService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const CACHE_KEY='oleiro-units-r26',CACHE_MS=10*60*1000;let memory=null;
  function row(doc){return {id:doc.id,...doc.data()}}
  function clone(rows){return (rows||[]).map(item=>({...item}))}
  function readCache(){if(memory&&Date.now()-memory.at<CACHE_MS)return clone(memory.rows);try{const parsed=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');if(parsed?.rows&&Date.now()-Number(parsed.at||0)<CACHE_MS){memory={at:Number(parsed.at),rows:parsed.rows};return clone(parsed.rows)}}catch{}return null}
  function writeCache(rows){memory={at:Date.now(),rows:clone(rows)};try{sessionStorage.setItem(CACHE_KEY,JSON.stringify(memory))}catch{}return clone(rows)}
  function invalidate(){memory=null;try{sessionStorage.removeItem(CACHE_KEY)}catch{}}
  services.units={
    async list({includeInactive=false,force=false}={}){let units=!force?readCache():null;if(!units){units=await services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules,started=Date.now();const snapshot=await firestore.getDocs(firestore.collection(context.db,'units'));services.recordQuery?.('units/list',started,snapshot.size,{collection:'units'});return snapshot.docs.map(row).sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id),'pt-BR'));},{loading:false});writeCache(units)}return includeInactive?units:units.filter(unit=>unit.active===true);},
    async get(id){return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules,started=Date.now();const snapshot=await firestore.getDoc(firestore.doc(context.db,'units',id));services.recordQuery?.('units/by-id',started,snapshot.exists()?1:0,{unitId:String(id)});return snapshot.exists()?row(snapshot):null;},{loading:false});},
    async update(id,patch={}){return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const clean={...patch,updatedAt:firestore.serverTimestamp()};await firestore.updateDoc(firestore.doc(context.db,'units',String(id)),clean);invalidate();return {id:String(id),...patch};},{loading:false});},
    invalidate
  };
})();
