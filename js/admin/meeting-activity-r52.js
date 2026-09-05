/* Round 55 — ações de reunião são injetadas após a limpeza do fluxo de seleção. */
(function adminMeetingActivityR55(){
  const baseRenderPersonModal=window.renderPersonModal||renderPersonModal;
  const safe=value=>encodeURIComponent(String(value??''));

  function meetingCandidate(p){return !!p&&!p.inactive&&p.status==='meeting'}
  function eligibleDates(p){
    const start=String(p?.stayStart||p?.from||'').slice(0,10),end=String(p?.stayEnd||p?.to||'').slice(0,10);
    return typeof planningEligibleDates==='function'?planningEligibleDates(start,end):[];
  }
  function sessionsForDate(p,date){
    return (state.sessions||[])
      .filter(row=>String(row.applicationId||p.id)===String(p.id)&&String(row.date||'')===String(date))
      .sort(typeof activityScheduleCompare==='function'?activityScheduleCompare:(a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
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

  /* selection-flow-r25 remove as ações administrativas durante meeting. Por isso esta camada
     roda DEPOIS do render base e recoloca apenas as duas ações permitidas nesta etapa. */
  function injectMeetingActions(p,tab){
    modalRoot.querySelectorAll('.admin-meeting-add-activity').forEach(node=>node.remove());
    if(!meetingCandidate(p)||(tab!=='plan'&&modalRoot.dataset.personTab!=='plan'))return;

    modalRoot.querySelectorAll('details.planning-day-card[data-plan-date]').forEach(card=>{
      const date=card.dataset.planDate,content=card.querySelector('.planning-day-content');if(!date||!content)return;
      content.querySelectorAll('.admin-meeting-creation-actions,.admin-meeting-empty-action').forEach(node=>node.remove());
      const rows=[...card.querySelectorAll('.planning-session-row')];

      if(rows.length){
        content.querySelectorAll('.admin-create-activity-action').forEach(node=>node.remove());
        const sessions=sessionsForDate(p,date);
        rows.forEach((row,index)=>{
          const actions=inlineActions(p,sessions[index],date);
          if(actions)(row.firstElementChild||row).insertAdjacentHTML('beforeend',actions);
        });
        return;
      }

      if(eligibleDates(p).includes(date)){
        content.insertAdjacentHTML('beforeend',`<div class="admin-create-activity-action admin-meeting-empty-action"><button class="btn btn-soft btn-block" type="button" onclick="openAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button></div>`);
      }
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
    const result=baseRenderPersonModal(p,tab);
    injectMeetingActions(p,tab);
    return result;
  };

  window.renderPersonModal=renderPersonModal;
})();

/* Homologação r62: carrega a nova página dedicada de Planejamento por último,
   preservando todas as camadas já existentes neste ambiente de teste. */
(function loadPlanningPageR53(){
  if(document.querySelector('script[data-planning-page-r53]'))return;
  const script=document.createElement('script');
  script.src='../js/admin/planning-page-r53.js?v=20260903-r53';
  script.dataset.planningPageR53='1';
  document.body.appendChild(script);
})();
