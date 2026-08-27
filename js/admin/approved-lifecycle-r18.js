/* Round 18 — inativação de aprovado preserva o planejamento e o status aprovado. */
(function approvedLifecycleR18(){
  const baseRenderPersonModal=renderPersonModal;

  function safe(value){return encodeURIComponent(String(value??''))}
  function patchApprovedLifecycleButton(p,tab){
    if(tab!=='account'||p?.status!=='approved'||!p?.inactive)return;
    const actions=modalRoot.querySelector('.account-lifecycle-actions');if(!actions)return;
    actions.innerHTML=`<button class="btn btn-soft btn-block" type="button" onclick="reactivateApprovedVolunteer('${safe(p.id)}')"><i class="fa-solid fa-rotate-left"></i>Reativar perfil</button>`;
  }

  renderPersonModal=function(p,tab='plan'){const result=baseRenderPersonModal(p,tab);patchApprovedLifecycleButton(p,tab==='plan'?'plan':'account');return result};

  window.requestInactivateApprovedVolunteer=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p||p.status!=='approved')return;
    openModal('Inativar perfil?',`O acesso de ${escapeHtml(p.name)} será bloqueado.`,`<div class="notice warning"><i class="fa-solid fa-user-slash"></i><div>O planejamento aprovado permanece intacto. Somente o acesso ao portal e a presença ativa ficam bloqueados até a reativação.</div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(p.id))}'),'account')">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmInactivateApprovedVolunteer('${safe(p.id)}')">Inativar</button></div>`);
  };
  window.confirmInactivateApprovedVolunteer=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    try{await window.OleiroServices.applications.updateLifecycle(p.id,{applicationPatch:{active:false,needsAdminAttention:false},participantUids:p.participantUids||[],participantActive:false});p.active=false;p.inactive=true;renderPersonModal(p,'account');showToast('Perfil inativado. O planejamento aprovado foi mantido.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível inativar o perfil.')}
  };
  window.reactivateApprovedVolunteer=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p||p.status!=='approved')return;
    try{await window.OleiroServices.applications.updateLifecycle(p.id,{applicationPatch:{active:true,needsAdminAttention:false},participantUids:p.participantUids||[],participantActive:true});p.active=true;p.inactive=false;renderPersonModal(p,'account');showToast('Perfil reativado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível reativar o perfil.')}
  };

  window.renderPersonModal=renderPersonModal;
})();
