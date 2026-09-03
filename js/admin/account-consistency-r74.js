/* R74 — consistência da página dedicada de Conta após mutações administrativas. */
(function accountConsistencyR74(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ACCOUNT_CONSISTENCY_R74__)return;
  window.__OLEIRO_ACCOUNT_CONSISTENCY_R74__=true;

  const timers=new Map();
  const syncing=new Map();

  function dedicatedAccountContext(id){
    return typeof state!=='undefined'&&state.managerPage==='planning'&&String(state.managerPlanningPersonId||'')===String(id||'')&&['account','stay','overview'].includes(String(state.managerPlanningTab||'account'));
  }

  async function reloadAccountSources(id){
    const p=typeof candidateById==='function'?candidateById(id):null;
    if(!p)return null;
    const key=String(p.id),tasks=[];

    if(window.OleiroServices?.applications?.getById){
      tasks.push(window.OleiroServices.applications.getById(p.id).then(fresh=>{
        if(!fresh)return;
        Object.assign(p,fresh);
        const index=(state.candidates||[]).findIndex(row=>String(row.id)===key);
        if(index>=0&&state.candidates[index]!==p)state.candidates[index]=p;
      }));
    }

    const uids=(p.participantUids||[]).map(String).filter(Boolean);
    if(uids.length&&window.OleiroServices?.profiles?.getByIds){
      tasks.push(window.OleiroServices.profiles.getByIds(uids).then(rows=>{
        const byId=new Map((rows||[]).map(row=>[String(row?.id||''),row]));
        p.participantProfiles=uids.map((uid,index)=>byId.get(uid)||rows?.[index]||{id:uid});
        p.emergencyProfilesLoaded=true;
        p.emergencyProfilesLoading=false;
      }));
    }

    if(uids.length&&window.OleiroServices?.users?.getByIds){
      tasks.push(window.OleiroServices.users.getByIds(uids).then(rows=>{
        const map={};(rows||[]).forEach(row=>map[String(row.id)]=row);
        state.participantAccessCache=state.participantAccessCache||{};
        state.participantAccessCache[key]=map;
      }));
    }

    await Promise.allSettled(tasks);
    state.adminAccountReadAt=state.adminAccountReadAt||{};
    state.adminAccountReadAt[key]=Date.now();
    return p;
  }

  async function rebuildDedicatedAccount(id){
    const key=String(id||'');if(!key||syncing.has(key))return syncing.get(key);
    const task=(async()=>{
      const p=await reloadAccountSources(key);if(!p||state.managerPage!=='planning'||String(state.managerPlanningPersonId)!==key)return;
      state.managerPlanningTab='account';
      state.managerPlanningBody='';
      state.managerPlanningLoading=true;
      if(typeof closeModal==='function')closeModal();
      try{
        if(typeof window.openPerson==='function')await window.openPerson(key,'account');
      }catch(error){console.error('Falha ao reconstruir Conta após mutação:',error)}
      finally{
        state.managerPlanningLoading=false;
        if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===key&&typeof render==='function')render();
      }
    })().finally(()=>syncing.delete(key));
    syncing.set(key,task);return task;
  }

  function queueAccountSync(id,wasAccount=true){
    const key=String(id||'');if(!key||!wasAccount)return;
    clearTimeout(timers.get(key));
    timers.set(key,setTimeout(()=>{timers.delete(key);rebuildDedicatedAccount(key)},60));
  }

  function wrapApplicationMutation(name){
    const api=window.OleiroServices?.applications,base=api?.[name];
    if(typeof base!=='function'||base.__r74Wrapped)return;
    const wrapped=async function(...args){
      const id=String(args[0]??''),wasAccount=dedicatedAccountContext(id);
      const result=await base.apply(this,args);
      queueAccountSync(id,wasAccount);
      return result;
    };
    wrapped.__r74Wrapped=true;api[name]=wrapped;
  }

  [
    'update','changeStayDates','updateLifecycle','scheduleSelectionMeeting','completeSelectionMeeting',
    'finalizeSelection','reactivateCandidatePlanning','approvePlanning','resetPlanning'
  ].forEach(wrapApplicationMutation);

  /* Gênero é persistido via batch direto no Firestore, fora de OleiroServices.applications. */
  const baseGender=window.saveVolunteerGender;
  if(typeof baseGender==='function'&&!baseGender.__r74Wrapped){
    const wrapped=async function(encodedId,index){
      const id=decodeURIComponent(encodedId),wasAccount=dedicatedAccountContext(id);
      const result=await baseGender(encodedId,index);
      queueAccountSync(id,wasAccount);
      return result;
    };
    wrapped.__r74Wrapped=true;window.saveVolunteerGender=wrapped;saveVolunteerGender=wrapped;
  }

  /* Compatibilidade com editores de unidade que possam existir em camadas legadas. */
  ['saveVolunteerUnit','saveVolunteerUnitChange','confirmVolunteerUnitChange'].forEach(name=>{
    const base=window[name];if(typeof base!=='function'||base.__r74Wrapped)return;
    const wrapped=async function(...args){
      let id='';try{id=decodeURIComponent(String(args[0]??''))}catch{id=String(args[0]??'')}
      const wasAccount=dedicatedAccountContext(id),result=await base.apply(this,args);queueAccountSync(id,wasAccount);return result;
    };
    wrapped.__r74Wrapped=true;window[name]=wrapped;
  });

  window.refreshDedicatedAccountR74=rebuildDedicatedAccount;
})();

/* R75: contato de emergência é hidratado e renderizado diretamente na página dedicada. */
(function loadAccountEmergencyLiveR75(){
  if(document.querySelector('script[data-r75-account-emergency-live]'))return;
  const current=document.currentScript?.src;if(!current)return;
  const script=document.createElement('script');
  script.dataset.r75AccountEmergencyLive='true';
  script.src=new URL('./account-emergency-live-r75.js?v=20260903-r76',current).href;
  document.body.appendChild(script);
})();
