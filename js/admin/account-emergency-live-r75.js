/* R75 — contato de emergência da Conta vem diretamente dos perfis, sem depender do modal capturado. */
(function accountEmergencyLiveR75(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ACCOUNT_EMERGENCY_LIVE_R75__)return;
  window.__OLEIRO_ACCOUNT_EMERGENCY_LIVE_R75__=true;

  const inflight=new Map();
  const safe=value=>encodeURIComponent(String(value??''));
  const normalized=value=>window.OleiroServices?.profiles?.normalizeEmergencyContact?.(value)||{
    name:String(value?.name||'').trim(),relationship:String(value?.relationship||'').trim(),phone:String(value?.phone||'').trim()
  };
  const hasContact=value=>{const row=normalized(value);return !!(row.name||row.relationship||row.phone)};

  function currentPerson(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='account'||typeof candidateById!=='function')return null;
    return candidateById(state.managerPlanningPersonId);
  }

  function orderedProfiles(p,rows){
    const uids=(p?.participantUids||[]).map(String);
    const byId=new Map((rows||[]).map(row=>[String(row?.id||''),row]));
    return uids.map((uid,index)=>byId.get(uid)||rows?.[index]||{id:uid});
  }

  async function ensureProfiles(p,{force=false}={}){
    if(!p?.id)return [];
    const uids=(p.participantUids||[]).map(String).filter(Boolean);
    if(!uids.length){p.participantProfiles=[];p.emergencyProfilesLoaded=true;return []}
    if(!force&&p.emergencyProfilesLoaded&&Array.isArray(p.participantProfiles)&&p.participantProfiles.length>=uids.length)return p.participantProfiles;
    const key=String(p.id);
    if(inflight.has(key))return inflight.get(key);
    if(!window.OleiroServices?.profiles?.getByIds)return p.participantProfiles||[];
    const task=window.OleiroServices.profiles.getByIds(uids).then(rows=>{
      p.participantProfiles=orderedProfiles(p,rows||[]);
      p.emergencyProfilesLoaded=true;
      p.emergencyProfilesLoading=false;
      return p.participantProfiles;
    }).finally(()=>inflight.delete(key));
    inflight.set(key,task);return task;
  }

  function emergencyFor(p,index){return normalized(p?.participantProfiles?.[index]?.emergencyContact)}
  function emergencyHtml(contact){
    if(!hasContact(contact))return '<span class="account-empty-value-r70">Não informado</span>';
    const row=normalized(contact),parts=[];
    if(row.name)parts.push(`<strong>${escapeHtml(row.name)}</strong>`);
    if(row.relationship)parts.push(`<span>${escapeHtml(row.relationship)}</span>`);
    if(row.phone)parts.push(`<span>${escapeHtml(row.phone)}</span>`);
    return parts.join('');
  }

  function emergencyBlock(row){
    return row.querySelector('.account-person-emergency-inline-r71')||
      row.querySelector('.account-person-emergency-r70')||
      row.querySelector('.account-person-sections-r70 .account-person-emergency-r70');
  }

  function patchAccount(){
    const p=currentPerson();if(!p)return;
    const root=document.querySelector('.planning-detail-page .account-contact-card-r70');if(!root)return;
    const rows=[...root.querySelectorAll(':scope > .account-person-row')];
    rows.forEach((row,index)=>{
      const block=emergencyBlock(row);if(!block)return;
      const body=block.querySelector('.account-person-emergency-body-r70');if(!body)return;
      const contact=emergencyFor(p,index),has=hasContact(contact);
      body.innerHTML=emergencyHtml(contact);
      let head=block.querySelector('.account-person-section-head-r70');
      if(!head)return;
      let button=head.querySelector('button');
      if(!button){
        button=document.createElement('button');button.type='button';button.className='account-emergency-action-r72';head.appendChild(button);
      }
      button.style.removeProperty('display');
      button.innerHTML=`<i class="fa-solid ${has?'fa-pen':'fa-plus'}"></i>${has?'Editar':'Adicionar'}`;
      button.onclick=event=>{event.preventDefault();event.stopPropagation();window.openVolunteerEmergencyEditor(safe(p.id),index)};
    });
  }

  async function hydrateVisibleAccount({force=false}={}){
    const p=currentPerson();if(!p)return;
    try{await ensureProfiles(p,{force})}catch(error){console.error('Falha ao carregar contato de emergência na Conta:',error)}
    if(currentPerson()?.id===p.id)patchAccount();
  }

  const baseOpenEditor=window.openVolunteerEmergencyEditor;
  if(typeof baseOpenEditor==='function'){
    window.openVolunteerEmergencyEditor=async function(encodedId,index){
      const id=decodeURIComponent(encodedId),p=typeof candidateById==='function'?candidateById(id):null;
      if(p)try{await ensureProfiles(p)}catch(error){console.error(error)}
      return baseOpenEditor(encodedId,index);
    };
    openVolunteerEmergencyEditor=window.openVolunteerEmergencyEditor;
  }

  const baseSave=window.saveVolunteerEmergencyContact;
  if(typeof baseSave==='function'){
    window.saveVolunteerEmergencyContact=async function(encodedId,index){
      const result=await baseSave(encodedId,index),id=decodeURIComponent(encodedId),p=typeof candidateById==='function'?candidateById(id):null;
      if(p)try{await ensureProfiles(p,{force:true})}catch(error){console.error(error)}
      patchAccount();return result;
    };
    saveVolunteerEmergencyContact=window.saveVolunteerEmergencyContact;
  }

  const baseClear=window.clearVolunteerEmergencyContact;
  if(typeof baseClear==='function'){
    window.clearVolunteerEmergencyContact=async function(encodedId,index){
      const result=await baseClear(encodedId,index),id=decodeURIComponent(encodedId),p=typeof candidateById==='function'?candidateById(id):null;
      if(p)try{await ensureProfiles(p,{force:true})}catch(error){console.error(error)}
      patchAccount();return result;
    };
    clearVolunteerEmergencyContact=window.clearVolunteerEmergencyContact;
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){
    renderManager=function(){
      const result=baseRenderManager();
      queueMicrotask(()=>{patchAccount();hydrateVisibleAccount()});
      requestAnimationFrame(patchAccount);
      return result;
    };
    window.renderManager=renderManager;render=function(){return renderManager()};window.render=render;
  }

  const observer=new MutationObserver(()=>{
    if(currentPerson())queueMicrotask(()=>{patchAccount();hydrateVisibleAccount()});
  });
  const target=document.getElementById('app');if(target)observer.observe(target,{childList:true,subtree:true});

  requestAnimationFrame(()=>{patchAccount();hydrateVisibleAccount({force:true})});
})();
