/* Round 52/53 — ação explícita no perfil Admin enquanto o candidato aguarda reunião. */
(function adminMeetingActivityR52(){
  const baseRenderPersonModal=window.renderPersonModal||renderPersonModal;
  const safe=value=>encodeURIComponent(String(value??''));

  function meetingCandidate(p){return !!p&&!p.inactive&&p.status==='meeting'}
  function eligibleDates(p){
    const start=String(p?.stayStart||p?.from||'').slice(0,10),end=String(p?.stayEnd||p?.to||'').slice(0,10);
    return typeof planningEligibleDates==='function'?planningEligibleDates(start,end):[];
  }

  function injectMeetingAction(p,tab){
    if(!meetingCandidate(p)||!['overview','plan'].includes(tab))return;
    const body=modalRoot.querySelector('.modal-body');if(!body||body.querySelector('.admin-meeting-add-activity'))return;
    const tabs=body.querySelector('.person-refactor-tabs,.person-tabs');
    const action=document.createElement('div');action.className='card admin-meeting-add-activity';
    action.innerHTML=`<div class="account-card-head"><div><span class="eyebrow">Planejamento aprovado</span><strong>Aguardando reunião</strong></div><button class="btn btn-primary" type="button" onclick="openAdminMeetingActivityPicker('${safe(p.id)}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button></div><small>Inclua uma nova atividade sem reabrir o planejamento já aprovado.</small>`;
    if(tabs?.nextSibling)body.insertBefore(action,tabs.nextSibling);else if(tabs)tabs.insertAdjacentElement('afterend',action);else body.prepend(action);
  }

  window.openAdminMeetingActivityPicker=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!meetingCandidate(p))return showToast('Este perfil não está aguardando reunião.');
    const dates=eligibleDates(p);if(!dates.length)return showToast('Não há dias disponíveis para nova atividade.');
    const options=dates.map(date=>`<option value="${escapeHtml(date)}">${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date,true))}</option>`).join('');
    openModal('Adicionar atividade','Escolha o dia da nova atividade.',`<div class="field"><label for="adminMeetingActivityDate">Dia</label><select id="adminMeetingActivityDate" class="select">${options}</select></div>`,`<button class="btn btn-primary btn-block" type="button" onclick="openAdminMeetingActivityForDate('${safe(id)}')"><i class="fa-solid fa-arrow-right"></i>Continuar</button>`);
  };

  window.openAdminMeetingActivityForDate=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),date=document.getElementById('adminMeetingActivityDate')?.value||'';if(!meetingCandidate(p))return showToast('Este perfil não está aguardando reunião.');
    if(!eligibleDates(p).includes(date))return showToast('Escolha um dia disponível.');
    return window.openAdminPlanningActivity(safe(id),safe(date));
  };

  renderPersonModal=function(p,tab='overview'){
    const result=baseRenderPersonModal(p,tab);injectMeetingAction(p,tab);return result;
  };
  window.renderPersonModal=renderPersonModal;
})();
