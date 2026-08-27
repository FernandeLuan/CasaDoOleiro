/* Administração segura do acesso do voluntário. */
(function accessManagement(){
  state.participantAccessCache=state.participantAccessCache||{};
  const basePersonTabContent=personTabContent;
  const baseOpenPerson=openPerson;

  function accessCache(id){return state.participantAccessCache[String(id)]||null}
  async function hydrateParticipantAccess(p,{force=false}={}){
    if(!p?.id||!window.OleiroServices?.users?.getByIds)return null;const key=String(p.id);if(!force&&accessCache(key))return accessCache(key);
    const rows=await window.OleiroServices.users.getByIds(p.participantUids||[]);const map={};rows.forEach(row=>map[String(row.id)]=row);state.participantAccessCache[key]=map;return map;
  }
  function participantRows(p){
    const uids=Array.isArray(p.participantUids)?p.participantUids:[],names=Array.isArray(p.participantNames)?p.participantNames:[],emails=Array.isArray(p.participantEmails)?p.participantEmails:[],cache=accessCache(p.id);
    if(!uids.length)return '<div class="empty">Nenhum acesso vinculado.</div>';
    if(!cache)return '<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando acessos...</div>';
    return uids.map((uid,index)=>{const access=cache[String(uid)]||{},email=emails[index]||access.email||'',name=names[index]||p.name||'Voluntário',first=access.firstPortalAccessAt;return `<div class="access-admin-row"><div class="access-admin-main"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(email||'—')}</span><small>${first?'Primeiro acesso já realizado':'Ainda não acessou o portal'}</small></div>${!first?`<button class="btn btn-outline btn-xs" type="button" onclick="requestVolunteerEmailEdit('${encodeURIComponent(String(p.id))}','${encodeURIComponent(String(uid))}')"><i class="fa-solid fa-pen"></i>Editar e-mail</button>`:''}</div>`}).join('');
  }
  function accessPanel(p){return `<div class="card access-admin-card" style="margin-top:10px"><div class="access-admin-head"><div><span class="eyebrow">Acesso</span><h3>Conta do voluntário</h3></div></div><div class="access-admin-list">${participantRows(p)}</div><div class="access-admin-danger"><button class="btn btn-danger-soft btn-block" type="button" onclick="requestDeleteVolunteerApplication('${encodeURIComponent(String(p.id))}')"><i class="fa-solid fa-trash"></i>Excluir cadastro</button><small>Exclusão definitiva para cadastros de teste ou lançados por engano.</small></div></div>`}

  personTabContent=function(p,tab){let html=basePersonTabContent(p,tab);if(tab==='overview')html+=accessPanel(p);return html};
  openPerson=async function(id,tab='overview'){
    const result=baseOpenPerson(id,tab),p=candidateById(id);if(p&&!accessCache(p.id)){hydrateParticipantAccess(p).then(()=>refreshOpenPersonModal?.(p.id)).catch(error=>console.error('Não foi possível carregar os acessos:',error))}return result;
  };

  window.requestVolunteerEmailEdit=function(encodedApplicationId,encodedUid){
    const applicationId=decodeURIComponent(encodedApplicationId),uid=decodeURIComponent(encodedUid),p=candidateById(applicationId);if(!p)return;
    const index=(p.participantUids||[]).map(String).indexOf(String(uid)),email=(p.participantEmails||[])[index]||accessCache(p.id)?.[uid]?.email||'';
    openModal('Editar e-mail','Disponível somente antes do primeiro acesso do voluntário.',`<div class="field"><label for="adminVolunteerEmail">Novo e-mail</label><input id="adminVolunteerEmail" class="input" type="email" autocomplete="off" value="${escapeHtml(email)}" placeholder="email@exemplo.com"></div><div class="notice" style="margin-top:10px"><i class="fa-solid fa-shield-halved"></i><div>O Authentication, o perfil e a candidatura serão atualizados juntos.</div></div>`,`<button id="adminVolunteerEmailSave" class="btn btn-primary btn-block" type="button" onclick="saveVolunteerEmail('${encodeURIComponent(applicationId)}','${encodeURIComponent(uid)}')">Salvar e-mail</button>`);
  };
  window.saveVolunteerEmail=async function(encodedApplicationId,encodedUid){
    const applicationId=decodeURIComponent(encodedApplicationId),uid=decodeURIComponent(encodedUid),p=candidateById(applicationId),email=document.getElementById('adminVolunteerEmail')?.value.trim().toLowerCase()||'',button=document.getElementById('adminVolunteerEmailSave');
    if(!p||!email||!email.includes('@'))return showToast('Informe um e-mail válido.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{const result=await window.OleiroServices.adminAccess.updateVolunteerEmail({applicationId,uid,email});const index=(p.participantUids||[]).map(String).indexOf(String(uid));p.participantEmails=Array.isArray(p.participantEmails)?[...p.participantEmails]:[];if(index>=0)p.participantEmails[index]=result?.email||email;p.email=p.participantEmails.filter(Boolean).join(', ');const cache=accessCache(p.id)||{};cache[uid]={...(cache[uid]||{}),email:result?.email||email};state.participantAccessCache[String(p.id)]=cache;renderPersonModal(p,'overview');showToast('E-mail atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o e-mail.');if(button?.isConnected){button.disabled=false;button.textContent='Salvar e-mail'}}
  };

  window.requestDeleteVolunteerApplication=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    openModal('Excluir cadastro definitivamente?',`Esta ação remove ${escapeHtml(p.name)} do portal e do Firebase Authentication.`,`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Esta ação não pode ser desfeita.</strong><br>Atividades, sessões, perfil e acesso serão removidos.</div></div><div class="field" style="margin-top:12px"><label for="deleteVolunteerConfirm">Digite EXCLUIR para confirmar</label><input id="deleteVolunteerConfirm" class="input" autocomplete="off" placeholder="EXCLUIR" oninput="syncDeleteVolunteerConfirm()"></div>`,`<button id="deleteVolunteerConfirmButton" class="btn btn-danger btn-block" type="button" onclick="confirmDeleteVolunteerApplication('${encodeURIComponent(id)}')" disabled>Excluir definitivamente</button>`);
  };
  window.syncDeleteVolunteerConfirm=function(){const input=document.getElementById('deleteVolunteerConfirm'),button=document.getElementById('deleteVolunteerConfirmButton');if(button)button.disabled=String(input?.value||'').trim().toUpperCase()!=='EXCLUIR'};
  window.confirmDeleteVolunteerApplication=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),button=document.getElementById('deleteVolunteerConfirmButton');if(!p)return;if(String(document.getElementById('deleteVolunteerConfirm')?.value||'').trim().toUpperCase()!=='EXCLUIR')return;
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Excluindo...'}
    try{await window.OleiroServices.adminAccess.deleteVolunteerApplication(id);delete state.participantAccessCache[String(id)];state.candidates=(state.candidates||[]).filter(row=>String(row.id)!==String(id));closeModal();await loadManagerCandidates?.({force:true});hydrateManagerDashboardData?.().catch(console.error);showToast('Cadastro excluído definitivamente.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível excluir o cadastro.');if(button?.isConnected){button.disabled=false;button.textContent='Excluir definitivamente'}}
  };

  window.personTabContent=personTabContent;window.openPerson=openPerson;
})();
