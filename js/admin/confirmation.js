/* Exclusão administrativa direta do cadastro no Firestore.
   A remoção revoga imediatamente o acesso ao Portal ao excluir o documento users/{uid}. */
(function confirmDeleteVolunteer(){
  window.syncDeleteVolunteerConfirm=function(){
    const input=document.getElementById('deleteVolunteerConfirm'),button=document.getElementById('deleteVolunteerConfirmButton');
    if(!button)return;
    const valid=String(input?.value||'').trim()==='EXCLUIR';
    button.disabled=!valid;
    button.setAttribute('aria-disabled',String(!valid));
  };

  window.requestDeleteVolunteerApplication=function(encodedId){
    const id=decodeURIComponent(String(encodedId||'')),p=candidateById(id);if(!p)return;
    openModal(
      'Excluir cadastro definitivamente?',
      `Esta ação apaga os dados de ${escapeHtml(p.name)} e revoga o acesso ao Portal.`,
      `<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Esta ação não pode ser desfeita.</strong><br>Candidatura, atividades, sessões, perfil e permissão de acesso serão removidos.</div></div><div class="field" style="margin-top:12px"><label for="deleteVolunteerConfirm">Digite EXCLUIR para confirmar</label><input id="deleteVolunteerConfirm" class="input" autocomplete="off" autocapitalize="characters" placeholder="EXCLUIR" oninput="syncDeleteVolunteerConfirm()"></div>`,
      `<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button id="deleteVolunteerConfirmButton" class="btn btn-danger" type="button" onclick="confirmDeleteVolunteerApplication('${encodeURIComponent(id)}')" disabled><i class="fa-solid fa-trash"></i>Excluir definitivamente</button></div>`
    );
  };

  function clearDeletedCandidateState(id){
    const key=String(id);
    state.candidates=(state.candidates||[]).filter(row=>String(row.id)!==key);
    state.pendingChangeRequests=(state.pendingChangeRequests||[]).filter(row=>String(row.applicationId||'')!==key);
    if(state.adminAccountReadAt)delete state.adminAccountReadAt[key];
    if(state.participantAccessCache)delete state.participantAccessCache[key];
    if(state.adminPlanningCache)delete state.adminPlanningCache[key];
    if(state.adminPlanPageIndex)delete state.adminPlanPageIndex[key];
    if(String(state.managerPlanningPersonId||'')===key){
      state.managerPlanningPersonId='';
      state.managerPlanningBody='';
      state.managerPlanningTab='plan';
      state.managerPlanningLoading=false;
    }
  }

  window.confirmDeleteVolunteerApplication=async function(encodedId){
    const id=decodeURIComponent(String(encodedId||'')),p=candidateById(id),button=document.getElementById('deleteVolunteerConfirmButton');
    if(!p)return showToast('Cadastro não encontrado.');
    if(String(document.getElementById('deleteVolunteerConfirm')?.value||'').trim()!=='EXCLUIR')return;
    if(!window.OleiroServices?.applications?.purgeVolunteerApplication)return showToast('Serviço de exclusão indisponível.');

    if(button){
      button.disabled=true;
      button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>Excluindo...';
    }

    try{
      const result=await window.OleiroServices.applications.purgeVolunteerApplication(id);
      clearDeletedCandidateState(id);
      closeModal();
      state.managerPage='volunteer';
      render();
      if(typeof afterNavigation==='function')afterNavigation();
      showToast(result?.alreadyDeleted?'O cadastro já havia sido excluído.':'Cadastro excluído do sistema e acesso revogado.');
      Promise.resolve(typeof hydrateManagerDashboardData==='function'?hydrateManagerDashboardData({force:true}):null).catch(console.error);
    }catch(error){
      console.error('Falha ao excluir cadastro:',error);
      const message=String(error?.message||'');
      if(/permission|insufficient/i.test(message))showToast('A exclusão foi bloqueada pelas permissões do banco. Atualize a página e tente novamente.');
      else showToast(message||'Não foi possível excluir o cadastro.');
      if(button?.isConnected){
        button.disabled=false;
        button.innerHTML='<i class="fa-solid fa-trash"></i>Excluir definitivamente';
      }
    }
  };
})();
