/* Round 16 — correções de navegação/filtro e revisão administrativa sem ampliar leituras. */
(function uxR16Admin(){
  const baseNavigateManager=navigateManager;
  const basePersonTabContent=personTabContent;
  const baseAdminPlanningDayCard=adminPlanningDayCard;

  function scheduleVolunteerQueryCheck(attempt=0){
    if(state.managerPage!=='volunteer'||attempt>40)return;
    if(state.candidateLoading){setTimeout(()=>scheduleVolunteerQueryCheck(attempt+1),75);return}
    const expected=typeof managerCandidateQueryKey==='function'?managerCandidateQueryKey():'';
    if(expected&&expected!==state.candidateQueryKey&&typeof loadManagerCandidates==='function'){
      loadManagerCandidates({force:true}).catch(error=>{console.error('Não foi possível carregar o filtro selecionado:',error);showToast('Não foi possível carregar este filtro.')});
    }
  }

  navigateManager=function(page){
    const result=baseNavigateManager(page);
    if(page==='volunteer')scheduleVolunteerQueryCheck();
    return result;
  };

  function removeOverviewReviewActions(html){
    const root=document.createElement('div');root.innerHTML=html;
    root.querySelectorAll('button').forEach(button=>{
      const action=String(button.getAttribute('onclick')||'');
      if(/approveCandidate\(/.test(action)||/rejectCandidate\(/.test(action)||(/openPerson\(/.test(action)&&/["']plan["']/.test(action)))button.remove();
    });
    root.querySelectorAll('.activity-actions').forEach(actions=>{if(!actions.querySelector('button'))actions.remove()});
    return root.innerHTML;
  }

  personTabContent=function(p,tab){
    let html=basePersonTabContent(p,tab);
    if(tab==='overview')html=removeOverviewReviewActions(html);
    return html;
  };

  function moveReason(note){
    const parts=String(note||'').split('|');if(parts[0]!=='move'||parts.length<6)return '';
    try{return decodeURIComponent(parts.slice(5).join('|')||'')}catch{return parts.slice(5).join('|')||''}
  }

  adminPlanningDayCard=function(p,day){
    const html=baseAdminPlanningDayCard(p,day),root=document.createElement('div');root.innerHTML=html;
    const reviewRows=[...root.querySelectorAll('.review-admin-row')];
    const reviewSessions=(day.sessions||[]).filter(session=>(session.postApprovalProposal===true&&session.reviewStatus==='analysis')||session.status==='change_requested');
    reviewRows.forEach((row,index)=>{
      const session=reviewSessions[index];if(!session||session.status!=='change_requested')return;
      const reason=moveReason(session.changeNote);if(!reason)return;
      const block=document.createElement('div');block.className='change-reason-card';block.innerHTML=`<small>Descrição da mudança</small><p>${escapeHtml(reason)}</p>`;
      const actions=row.querySelector('.review-admin-actions');if(actions)actions.before(block);else row.querySelector('div')?.append(block);
    });
    return root.innerHTML;
  };

  window.navigateManager=navigateManager;window.personTabContent=personTabContent;window.adminPlanningDayCard=adminPlanningDayCard;
  if(state.role==='manager'&&typeof render==='function')render();
})();