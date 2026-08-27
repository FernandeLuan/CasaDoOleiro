/* Round 20 — acabamento da lista, Conta e ações da Agenda sem leituras adicionais. */
(function refinementsR20Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}

  /* Lista: prazo fica ao lado de Em preparação. Mudanças e ajustes permanecem amarelos. */
  personCompact=function(p){
    const meta=p.status==='pending'&&typeof candidateDeadlineMeta==='function'?candidateDeadlineMeta(p):null;
    const changeIds=typeof adjustmentCandidateIds==='function'?adjustmentCandidateIds():new Set();
    const hasPendingChange=changeIds.has(String(p.id));
    let [label,type]=statusMeta(p.status);
    if(hasPendingChange&&p.status==='approved'){label='Mudança solicitada';type='warning'}
    else if(p.status==='adjustments')type='warning';
    const inactive=p.inactive&&p.status!=='rejected'?badge('Inativo','danger'):'';
    const deadline=meta?`<span class="candidate-deadline-inline"><i class="fa-regular fa-clock"></i>${escapeHtml(meta.label)}</span>`:'';
    const period=p.from&&p.to?`${fmtDate(p.from,true)}–${fmtDate(p.to,true)}`:'Período não informado';
    const id=typeof candidateActionArg==='function'?candidateActionArg(p.id):safe(p.id);
    const initials=String(p.name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('');
    return `<div class="list-item clickable" onclick="openPerson(decodeURIComponent('${id}'))"><div class="avatar">${escapeHtml(initials)}</div><div class="item-main"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.country||'—')} • ${escapeHtml(p.unit||'—')} • ${period}</p><div class="item-meta candidate-status-row">${badge(label,type)}${deadline}${inactive}</div></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);margin-top:11px"></i></div>`;
  };

  /* Conta: exclusão é feita pelo utilitário administrativo do Cloud Shell.
     Editar e-mail também sai da interface enquanto não há backend privilegiado publicado. */
  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);
    if((tab==='account'||modalRoot.dataset.personTab==='account')&&p){
      modalRoot.querySelector('.account-danger-zone')?.remove();
      modalRoot.querySelectorAll('button[onclick*="requestVolunteerEmailEdit"]').forEach(button=>button.remove());
    }
    return result;
  };

  window.personCompact=personCompact;
  window.renderPersonModal=renderPersonModal;

  /* Carrega o acabamento da revisão sem adicionar nenhuma consulta de dados. */
  if(!document.querySelector('script[data-oleiro-r21-admin]')){
    const script=document.createElement('script');
    script.src='../js/admin/refinements-r21.js?v=20260827-r21';
    script.dataset.oleiroR21Admin='1';
    document.head.appendChild(script);
  }
})();
