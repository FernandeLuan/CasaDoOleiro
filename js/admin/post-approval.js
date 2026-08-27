/* Revisão administrativa de atividades propostas após a aprovação da estadia. */
(function postApprovalAdmin(){
  const baseLoadManagerCandidates=loadManagerCandidates;
  const basePersonCompact=personCompact;
  const baseAdminPlanningDayCard=adminPlanningDayCard;

  function safe(value){return encodeURIComponent(String(value??''))}
  function proposalForApplication(id){return (state.pendingChangeRequests||[]).find(row=>String(row.applicationId)===String(id)&&row.reviewKind==='post_approval')||null}
  function matchesCurrentFilters(p){
    const unit=state.candidateUnit||'all',search=String(state.candidateSearch||'').trim().toLocaleLowerCase('pt-BR');
    return (unit==='all'||String(p.unit||'').toLocaleLowerCase('pt-BR')===String(unit).toLocaleLowerCase('pt-BR')||String(p.unitId||'').toLocaleLowerCase('pt-BR')===String(unit).toLocaleLowerCase('pt-BR'))&&(!search||String(p.name||'').toLocaleLowerCase('pt-BR').includes(search));
  }
  async function mergePendingAdjustmentApplications(){
    if(state.candidateFilter!=='adjustments'||!window.OleiroServices?.applications?.getById)return state.candidates||[];
    const ids=[...new Set((state.pendingChangeRequests||[]).map(row=>String(row.applicationId||'')).filter(Boolean))];
    const missing=ids.filter(id=>!(state.candidates||[]).some(row=>String(row.id)===id));
    if(missing.length){const rows=await Promise.all(missing.map(id=>window.OleiroServices.applications.getById(id,{enrichProfiles:false}).catch(()=>null)));const byId=new Map((state.candidates||[]).map(row=>[String(row.id),row]));rows.filter(Boolean).filter(matchesCurrentFilters).forEach(row=>byId.set(String(row.id),row));state.candidates=[...byId.values()]}
    if(state.managerPage==='volunteer')render();return state.candidates;
  }
  loadManagerCandidates=async function(options={}){const rows=await baseLoadManagerCandidates(options);if(state.candidateFilter==='adjustments'){await hydrateManagerPendingChanges({force:!options.append});await mergePendingAdjustmentApplications()}return rows};
  window.openManagerAdjustments=async function(){state.candidateFilter='adjustments';state.candidateSearch='';navigateManager('volunteer');try{await hydrateManagerPendingChanges({force:true});await baseLoadManagerCandidates({force:true});await mergePendingAdjustmentApplications()}catch(error){console.error(error);showToast('Não foi possível carregar os ajustes.')}};

  personCompact=function(p){let html=basePersonCompact(p);if(state.candidateFilter!=='adjustments')return html;const proposal=proposalForApplication(p.id);if(proposal){html=html.replace(/Mudança solicitada/g,'Nova atividade');html=html.replace(/badge warning/g,'badge info')}return html};

  function proposalButtons(p,session){
    const app=safe(p.id),activity=safe(session.activityId),review=session.reviewStatus||'';
    if(session.postApprovalProposal!==true||review!=='analysis')return '';
    return `<div class="post-approval-admin-actions"><button class="btn btn-primary btn-xs" type="button" onclick="reviewPostApprovalProposal('${app}','${activity}','approve')"><i class="fa-solid fa-check"></i>Aprovar</button><button class="btn btn-soft btn-xs" type="button" onclick="requestPostApprovalReajust('${app}','${activity}')"><i class="fa-solid fa-rotate"></i>Reajustar</button><button class="btn btn-danger-soft btn-xs" type="button" onclick="reviewPostApprovalProposal('${app}','${activity}','reject')"><i class="fa-solid fa-xmark"></i>Recusar</button></div>`;
  }
  adminPlanningDayCard=function(p,day){
    const hasProposal=(day.sessions||[]).some(session=>session.postApprovalProposal===true);
    if(!hasProposal)return baseAdminPlanningDayCard(p,day);
    const adjustment=candidateDayAdjustment(p,day.date),canAdjust=['analysis','adjustments'].includes(p.status),id=safe(p.id),dateArg=safe(day.date);
    const minutes=(day.sessions||[]).reduce((sum,row)=>sum+(Number(row.duration||row.activity?.duration)||0),0),hours=Math.floor(minutes/60),rest=minutes%60,dayHours=hours?(rest?`${hours}h${String(rest).padStart(2,'0')}`:`${hours}h`):`${rest}min`;
    const compactDay=new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${day.date}T12:00:00`));
    const weekday=new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{weekday:'short'}).format(new Date(`${day.date}T12:00:00`)).replace('.','').toLowerCase();
    const rows=day.sessions.map(session=>{const a=session.activity||{},description=session.activityDescription||a.description||'',notes=session.notes||a.notes||'',group=session.groupId&&session.groupId!=='A definir'?` • Grupo ${escapeHtml(session.groupId)}`:'',change=session.status==='change_requested',proposal=session.postApprovalProposal===true,review=session.reviewStatus||'';const info=notes?`<button class="planning-note-button" type="button" aria-label="Ver observações" onclick="openAdminActivityInfo('${safe(a.name||session.activityName||'Atividade')}','','${safe(notes)}','${dateArg}')"><i class="fa-solid fa-circle-info"></i></button>`:'';const proposalBadge=proposal?`<span class="badge ${review==='analysis'?'info':review==='adjustments'?'warning':review==='rejected'?'danger':'success'}">${review==='analysis'?'Nova atividade':review==='adjustments'?'Reajuste solicitado':review==='rejected'?'Recusada':'Aprovada'}</span>`:'';return `<div class="planning-session-row ${proposal?'post-approval-admin-row':''}"><div><div class="planning-session-title"><strong>${escapeHtml(a.name||session.activityName||'Atividade')}</strong>${proposalBadge}${info}</div><span>${escapeHtml(session.time||a.time||'—')} • ${Number(session.duration||a.duration)||0} min${group}</span>${description?`<p class="admin-session-description"><strong>Descrição:</strong> ${escapeHtml(description)}</p>`:''}${proposal&&session.reviewNote?`<p class="admin-session-description"><strong>Orientação:</strong> ${escapeHtml(session.reviewNote)}</p>`:''}${change?`<button class="btn btn-soft approve-change-button" type="button" onclick="approveVolunteerChange('${safe(session.id)}','${safe(p.id)}')"><i class="fa-solid fa-check"></i>Aprovar mudança</button>`:''}${proposalButtons(p,session)}</div></div>`}).join('');
    return `<details class="card planning-day-card" data-plan-date="${escapeHtml(day.date)}"><summary class="planning-day-head"><div class="planning-day-date"><strong>${compactDay} ${weekday}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>${dayHours}</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="planning-day-sessions">${rows}</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  };

  window.requestPostApprovalReajust=function(encodedApplicationId,encodedActivityId){const applicationId=decodeURIComponent(encodedApplicationId),activityId=decodeURIComponent(encodedActivityId),p=candidateById(applicationId);if(!p)return;openModal('Solicitar reajuste','Explique o que o voluntário precisa alterar nesta nova atividade.',`<div class="field"><label for="postApprovalReajustNote">Orientação ao voluntário</label><textarea id="postApprovalReajustNote" class="textarea" placeholder="Ex.: reduzir a duração e trocar o horário."></textarea></div>`,`<button class="btn btn-primary btn-block" type="button" onclick="reviewPostApprovalProposal('${safe(applicationId)}','${safe(activityId)}','adjustments')">Enviar reajuste</button>`)};
  window.reviewPostApprovalProposal=async function(encodedApplicationId,encodedActivityId,decision){
    const applicationId=decodeURIComponent(encodedApplicationId),activityId=decodeURIComponent(encodedActivityId),p=candidateById(applicationId),note=decision==='adjustments'?(document.getElementById('postApprovalReajustNote')?.value.trim()||''):'';if(!p)return;if(decision==='adjustments'&&!note)return showToast('Informe o reajuste solicitado.');
    try{const result=await window.OleiroServices.planning.reviewPostApprovalProposal({applicationId,activityId,decision,note});invalidateCandidatePlanning?.(applicationId);invalidateManagerPendingChanges?.();invalidateManagerScheduleCache?.();await hydrateManagerPendingChanges({force:true});await hydrateCandidatePlanning(applicationId,{force:true});if(result?.counts){p.sessions=result.counts.sessionCount;p.activities=result.counts.activityCount}renderPersonModal(p,'plan');if(decision==='approve')showToast('Nova atividade aprovada.');else if(decision==='reject')showToast('Nova atividade recusada.');else showToast('Reajuste enviado ao voluntário.');hydrateManagerDashboardData?.().catch(console.error)}catch(error){console.error(error);showToast(error?.message||'Não foi possível revisar a atividade.')}
  };

  window.loadManagerCandidates=loadManagerCandidates;window.personCompact=personCompact;window.adminPlanningDayCard=adminPlanningDayCard;
})();
