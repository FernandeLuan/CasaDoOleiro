/* Round 54 — ações contextuais para planejamento aprovado enquanto aguarda reunião. */
(function adminMeetingActivityR54(){
  const baseRenderPersonModal=window.renderPersonModal||renderPersonModal;
  const baseAdminPlanningDayCard=window.adminPlanningDayCard||adminPlanningDayCard;
  const safe=value=>encodeURIComponent(String(value??''));

  function meetingCandidate(p){return !!p&&!p.inactive&&p.status==='meeting'}
  function eligibleDates(p){
    const start=String(p?.stayStart||p?.from||'').slice(0,10),end=String(p?.stayEnd||p?.to||'').slice(0,10);
    return typeof planningEligibleDates==='function'?planningEligibleDates(start,end):[];
  }
  function findSession(applicationId,sessionId){
    const direct=(state.sessions||[]).find(row=>String(row.id)===String(sessionId)&&String(row.applicationId||applicationId)===String(applicationId));if(direct)return direct;
    for(const [key,cache] of Object.entries(state.adminPlanPageCache||{})){
      if(!key.startsWith(`${applicationId}|`))continue;
      const row=(cache?.sessions||[]).find(item=>String(item.id)===String(sessionId));if(row)return row;
    }
    return null;
  }
  function approvedSource(session){return !!session&&session.postApprovalProposal!==true&&!['rejected','change_requested'].includes(String(session.status||''))}
  function inlineActions(p,session,date){
    if(!meetingCandidate(p)||!approvedSource(session)||!session?.id)return '';
    const app=safe(p.id),sid=safe(session.id),day=safe(date);
    return `<div class="admin-session-manage-actions admin-meeting-creation-actions"><button class="btn btn-outline btn-xs" type="button" onclick="openAdminReplicateActivity('${app}','${sid}','${day}')"><i class="fa-solid fa-copy"></i>Replicar atividade</button><button class="btn btn-soft btn-xs" type="button" onclick="openAdminPlanningActivity('${app}','${day}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button></div>`;
  }

  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day);if(!meetingCandidate(p))return html;
    const template=document.createElement('template');template.innerHTML=html;
    const rows=[...template.content.querySelectorAll('.planning-session-row')];
    rows.forEach((row,index)=>{const actions=inlineActions(p,(day.sessions||[])[index],day.date);if(actions&&!row.querySelector('.admin-meeting-creation-actions'))(row.firstElementChild||row).insertAdjacentHTML('beforeend',actions)});
    return template.innerHTML;
  };

  function removeRedundantMeetingActions(p,tab){
    if(!meetingCandidate(p))return;
    modalRoot.querySelectorAll('.admin-meeting-add-activity').forEach(node=>node.remove());
    if(tab!=='plan'&&modalRoot.dataset.personTab!=='plan')return;
    modalRoot.querySelectorAll('details.planning-day-card').forEach(card=>{
      if(card.querySelector('.planning-session-row'))card.querySelectorAll('.admin-create-activity-action').forEach(node=>node.remove());
    });
  }

  window.openAdminReplicateActivity=function(encodedId,encodedSessionId,encodedDate){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),sourceDate=decodeURIComponent(encodedDate),p=candidateById(id),session=findSession(id,sessionId);
    if(!meetingCandidate(p)||!approvedSource(session))return showToast('Esta atividade não pode ser replicada agora.');
    const dates=eligibleDates(p);if(!dates.length)return showToast('Não há dias disponíveis para replicar a atividade.');
    const options=dates.map(date=>`<option value="${escapeHtml(date)}" ${date===sourceDate?'selected':''}>${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date,true))}</option>`).join('');
    const name=session.activityName||session.activity?.name||'Atividade';
    openModal('Replicar atividade',`Uma cópia de ${escapeHtml(name)} será criada como atividade independente.`,`<div class="field"><label for="adminReplicateActivityDate">Novo dia</label><select id="adminReplicateActivityDate" class="select">${options}</select></div>`,`<button class="btn btn-primary btn-block" type="button" onclick="continueAdminReplicateActivity('${safe(id)}','${safe(sessionId)}')"><i class="fa-solid fa-copy"></i>Continuar</button>`);
  };

  window.continueAdminReplicateActivity=function(encodedId,encodedSessionId){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),p=candidateById(id),session=findSession(id,sessionId),date=document.getElementById('adminReplicateActivityDate')?.value||'';
    if(!meetingCandidate(p)||!approvedSource(session))return showToast('Esta atividade não pode ser replicada agora.');
    if(!eligibleDates(p).includes(date))return showToast('Escolha um dia disponível.');
    window.openAdminPlanningActivity(safe(id),safe(date));
    const activity=session.activity||{};
    const values={managerActName:session.activityName||activity.name||'',managerActDesc:session.activityDescription||activity.description||'',managerActDuration:Number(session.duration||activity.duration)||60,managerActGroup:session.groupId||'Livre',managerActPeriod:typeof activityPeriodValue==='function'?activityPeriodValue(session,activity):(session.period||activity.period||'Sem preferência'),managerActMaterials:session.materials||activity.materials||'',managerActNotes:session.notes||activity.notes||''};
    Object.entries(values).forEach(([field,value])=>{const input=document.getElementById(field);if(input)input.value=String(value)});
  };

  renderPersonModal=function(p,tab='overview'){
    const result=baseRenderPersonModal(p,tab);removeRedundantMeetingActions(p,tab);return result;
  };

  window.renderPersonModal=renderPersonModal;
  window.adminPlanningDayCard=adminPlanningDayCard;
})();