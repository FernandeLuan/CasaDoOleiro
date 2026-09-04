/* Round 18/28 — planejamento do candidato direto ao conteúdo operacional. */
(function candidateRefactorR18(){
  const baseVolunteerPlan=volunteerPlan;

  function installCandidateStatusStyles(){
    if(document.getElementById('candidateStatusThemeStyles'))return;
    const style=document.createElement('style');
    style.id='candidateStatusThemeStyles';
    style.textContent=`
      .candidate-plan-compact-head{
        background:var(--surface-2)!important;
        border-color:var(--border)!important;
      }
      .candidate-plan-compact-head .candidate-plan-status{
        flex:0 0 auto!important;
        font-size:.61rem!important;
        line-height:1!important;
        white-space:nowrap!important;
        text-align:center!important;
      }
    `;
    document.head.appendChild(style);
  }

  function remainingLabel(days){return days===1?t('portal.profile.remainingOne'):t('portal.profile.remainingMany',{days})}
  function statusMetaCandidate(){
    const status=state.volunteerPlanStatus||'draft',application=state.currentApplication||{};
    if(status==='submitted')return {label:t('portal.profile.analysis'),tone:'info'};
    if(status==='adjustments'){
      let label=t('portal.activity.adjustRequested');
      const deadline=application.planningDeadlineAt||application.pendingUntil;
      if(deadline){try{const date=typeof deadline?.toDate==='function'?deadline.toDate():new Date(deadline),days=Math.max(0,Math.ceil((date.getTime()-Date.now())/86400000));label=`${remainingLabel(days)} · ${t('portal.activity.adjustRequested')}`}catch{}}
      return {label,tone:'warning'};
    }
    const deadline=application.planningDeadlineAt||application.pendingUntil;
    if(deadline){try{const date=typeof deadline?.toDate==='function'?deadline.toDate():new Date(deadline),days=Math.max(0,Math.ceil((date.getTime()-Date.now())/86400000));return {label:remainingLabel(days),tone:'warning'}}catch{}}
    return {label:t('portal.profile.preparing'),tone:'warning'};
  }
  function compactHeader(){
    const app=state.currentApplication||{},start=portalIsoDate(app.stayStart),end=portalIsoDate(app.stayEnd),meta=statusMetaCandidate(),period=start&&end?`${fmtDate(start,true)}–${fmtDate(end,true)}`:t('portal.home.periodConfirm');
    return `<div class="candidate-plan-compact-head"><strong>${escapeHtml(period)}</strong><span class="badge ${escapeHtml(meta.tone)} candidate-plan-status">${escapeHtml(meta.label)}</span></div>`;
  }
  function submitControl(){
    const status=state.volunteerPlanStatus||'draft';
    if(status==='submitted')return `<button class="btn btn-soft btn-block candidate-plan-submit" type="button" disabled><i class="fa-solid fa-paper-plane"></i>${escapeHtml(t('portal.plan.sentButton'))}</button>`;
    if(status==='rejected')return '';
    return `<button class="btn btn-primary btn-block candidate-plan-submit" type="button" onclick="submitPlan()"><i class="fa-solid fa-paper-plane"></i>${escapeHtml(status==='adjustments'?t('portal.plan.resendButton'):t('portal.plan.sendButton'))}</button>`;
  }

  volunteerPlan=function(){
    if(state.volunteerMode==='approved')return baseVolunteerPlan();
    const editable=['draft','adjustments'].includes(state.volunteerPlanStatus||'draft');
    return `<section class="section candidate-plan-refactor compact-page-top">${compactHeader()}<div class="candidate-plan-content">${volunteerAgendaContent(editable)}</div>${submitControl()}</section>`;
  };

  installCandidateStatusStyles();
  window.volunteerPlan=volunteerPlan;
  if(state.role==='volunteer'&&state.volunteerMode!=='approved'&&state.volunteerPage==='plan'&&typeof render==='function')render();
})();
