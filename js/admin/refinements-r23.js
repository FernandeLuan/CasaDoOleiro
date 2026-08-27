/* Round 23/24 — revisão inicial padronizada, destaque estritamente por dia e limpeza do planejamento. */
(function refinementsR23Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}

  function reviewActions(p){
    const id=safe(p.id);
    return `<button class="btn btn-plan-clear-warning" type="button" onclick="requestClearCandidatePlanning('${id}')"><i class="fa-solid fa-broom"></i>Limpar</button><button class="btn btn-primary" type="button" onclick="approveCandidate(decodeURIComponent('${id}'))"><i class="fa-solid fa-check"></i>Aprovar</button>`;
  }

  function standardizeReviewFooter(p){
    modalRoot.querySelectorAll('.admin-plan-clear-r23').forEach(node=>node.remove());
    const footer=modalRoot.querySelector('.admin-plan-review-footer');
    if(!p||['approved','rejected'].includes(p.status))return;

    if(footer&&['analysis','adjustments'].includes(p.status)){
      footer.classList.add('admin-review-actions-r24');
      footer.innerHTML=reviewActions(p);
      return;
    }

    /* Em preparação, mantém a limpeza disponível somente quando há algo carregado para limpar. */
    const hasLoadedSessions=modalRoot.querySelector('.planning-session-row');
    if(!hasLoadedSessions)return;
    const anchor=modalRoot.querySelector('.admin-refactor-planning');if(!anchor)return;
    anchor.insertAdjacentHTML('afterend',`<div class="admin-plan-clear-r23"><button class="btn btn-plan-clear-warning btn-block" type="button" onclick="requestClearCandidatePlanning('${safe(p.id)}')"><i class="fa-solid fa-broom"></i>Limpar planejamento</button></div>`);
  }

  window.requestClearCandidatePlanning=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    openModal('Limpar planejamento?',`O planejamento de ${escapeHtml(p.name)} será zerado.`,`<div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Todas as atividades e sessões serão removidas.</strong><br>O cadastro, o acesso e o período da estadia serão mantidos. O candidato voltará para Em preparação.</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(id))}'),'plan')">Cancelar</button><button id="resetPlanningConfirm" class="btn btn-danger" type="button" onclick="confirmResetPlanning('${escapeHtml(String(id))}')">Limpar</button></div>`);
  };

  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);
    if(tab==='plan'&&p)standardizeReviewFooter(p);
    return result;
  };

  const baseAdminPlanningDayCard=adminPlanningDayCard;
  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day),sessions=day?.sessions||[];
    const adjustment=typeof candidateDayAdjustment==='function'?candidateDayAdjustment(p,day.date):null;
    const candidateSubmitted=['analysis','adjustments'].includes(p?.status)&&sessions.some(session=>session.status==='proposed'&&session.postApprovalProposal!==true);

    /* Ajuste é sempre por data. O status global "adjustments" nunca pinta os outros dias de amarelo. */
    if(adjustment){
      html=html.replace(/review-day-info/g,'review-day-warning');
      if(!html.includes('review-day-warning'))html=html.replace('class="card planning-day-card','class="card planning-day-card review-day-warning');
    }else if(candidateSubmitted&&!html.includes('review-day-info')&&!html.includes('review-day-warning')){
      html=html.replace('class="card planning-day-card','class="card planning-day-card review-day-info');
      const marker='<div class="planning-day-date">',start=html.indexOf(marker);
      if(start>=0&&!html.includes('day-initial-analysis')){
        const strongEnd=html.indexOf('</strong>',start);
        if(strongEnd>=0){const at=strongEnd+'</strong>'.length;html=`${html.slice(0,at)}<span class="day-review-summary day-initial-analysis"><span class="badge info day-review-badge">Em análise</span></span>${html.slice(at)}`}
      }
    }
    return html;
  };

  window.renderPersonModal=renderPersonModal;
  window.adminPlanningDayCard=adminPlanningDayCard;
})();
