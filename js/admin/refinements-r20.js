/* Round 20 — acabamento da lista, Conta, Agenda e revisão de planejamento sem leituras adicionais. */
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

  /* Usa somente as sessões já carregadas da página atual para definir o estado visual do dia. */
  const baseAdminPlanningDayCard=adminPlanningDayCard;
  function reviewState(day){
    const sessions=day?.sessions||[];
    return {
      hasChange:sessions.some(session=>session.status==='change_requested'),
      hasProposal:sessions.some(session=>session.postApprovalProposal===true&&session.reviewStatus==='analysis')
    };
  }
  function reviewBadges(hasProposal,hasChange){
    const parts=[];
    if(hasProposal)parts.push('<span class="badge info day-review-badge">Nova atividade</span>');
    if(hasChange)parts.push('<span class="badge warning day-review-badge">Mudança solicitada</span>');
    return parts.length===2?`${parts[0]}<span class="day-review-plus" aria-hidden="true">+</span>${parts[1]}`:parts.join('');
  }
  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day);
    const {hasChange,hasProposal}=reviewState(day);
    if(!hasChange&&!hasProposal)return html;
    const tone=hasChange?'review-day-warning':'review-day-info';
    if(!html.includes(tone))html=html.replace('class="card planning-day-card','class="card planning-day-card '+tone);
    const tags=reviewBadges(hasProposal,hasChange),marker='<div class="planning-day-date">',start=html.indexOf(marker);
    if(start>=0&&!html.includes('day-review-summary')){
      const strongEnd=html.indexOf('</strong>',start);
      if(strongEnd>=0){const at=strongEnd+'</strong>'.length;html=`${html.slice(0,at)}<span class="day-review-summary">${tags}</span>${html.slice(at)}`}
    }
    return html;
  };

  window.personCompact=personCompact;
  window.renderPersonModal=renderPersonModal;
  window.adminPlanningDayCard=adminPlanningDayCard;
})();