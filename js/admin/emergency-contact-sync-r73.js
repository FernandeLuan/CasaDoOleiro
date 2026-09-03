/* R73 — sincroniza Contato de emergência com a página dedicada após salvar/limpar. */
(function emergencyContactSyncR73(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_EMERGENCY_CONTACT_SYNC_R73__)return;
  window.__OLEIRO_EMERGENCY_CONTACT_SYNC_R73__=true;

  async function reloadEmergencyProfiles(p){
    if(!p?.id)return;
    const uids=(p.participantUids||[]).map(String).filter(Boolean);
    if(!uids.length){p.participantProfiles=[];p.emergencyProfilesLoaded=true;p.emergencyProfilesLoading=false;return}
    if(!window.OleiroServices?.profiles?.getByIds)return;
    const rows=await window.OleiroServices.profiles.getByIds(uids);
    p.participantProfiles=rows||[];
    p.emergencyProfilesLoaded=true;
    p.emergencyProfilesLoading=false;
  }

  async function rebuildAccount(id){
    const p=typeof candidateById==='function'?candidateById(id):null;
    if(!p)return;
    try{await reloadEmergencyProfiles(p)}catch(error){console.error('Falha ao reler contato de emergência:',error)}

    if(state.adminAccountReadAt)state.adminAccountReadAt[String(p.id)]=0;
    if(state.managerPage!=='planning'||String(state.managerPlanningPersonId)!==String(p.id))return;

    state.managerPlanningTab='account';
    state.managerPlanningBody='';
    state.managerPlanningLoading=true;
    if(typeof closeModal==='function')closeModal();

    try{
      if(typeof window.openPerson==='function')await window.openPerson(String(p.id),'account');
    }catch(error){
      console.error('Falha ao reconstruir Conta após contato de emergência:',error);
    }finally{
      state.managerPlanningLoading=false;
      if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(p.id)&&typeof render==='function')render();
    }
  }

  const baseSave=window.saveVolunteerEmergencyContact;
  if(typeof baseSave==='function'){
    window.saveVolunteerEmergencyContact=async function(encodedId,index){
      const id=decodeURIComponent(encodedId);
      await baseSave(encodedId,index);
      await rebuildAccount(id);
    };
    saveVolunteerEmergencyContact=window.saveVolunteerEmergencyContact;
  }

  const baseClear=window.clearVolunteerEmergencyContact;
  if(typeof baseClear==='function'){
    window.clearVolunteerEmergencyContact=async function(encodedId,index){
      const id=decodeURIComponent(encodedId);
      await baseClear(encodedId,index);
      await rebuildAccount(id);
    };
    clearVolunteerEmergencyContact=window.clearVolunteerEmergencyContact;
  }
})();
