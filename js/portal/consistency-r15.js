/* Round 15 — agenda paginada e estados de revisão padronizados. */
(function consistencyR15Portal(){
  const AGENDA_PAGE_SIZE=7;
  const baseSessionCard=sessionCardVolunteer;

  function safe(value){return encodeURIComponent(String(value??''))}
  function blockedReason(date){
    const dates=volunteerStayDates(),first=dates[0],last=dates[dates.length-1];
    if(date===first)return 'Chegada — dia sem atividade';
    if(date===last)return 'Saída — dia sem atividade';
    const day=new Date(`${date}T12:00:00`).getDay();if(day===0||day===6)return 'Fim de semana — dia sem atividade';return '';
  }
  function parseChangeNote(note){
    const parts=String(note||'').split('|'),kind=parts[0]||'';
    if(!['move','rejected','adjustments'].includes(kind))return {kind:'',text:String(note||'')};
    return {kind,oldDate:parts[1]||'',oldTime:parts[2]||'',newDate:parts[3]||'',newTime:parts[4]||'',note:kind==='adjustments'?decodeURIComponent(parts.slice(5).join('|')||''):''};
  }
  function pageIndex(){
    const dates=volunteerStayDates();if(!dates.length)return 0;const max=Math.max(0,Math.ceil(dates.length/AGENDA_PAGE_SIZE)-1);
    return Math.max(0,Math.min(Number(state.volunteerAgendaPageIndex)||0,max));
  }
  function pageDates(){const dates=volunteerStayDates(),start=pageIndex()*AGENDA_PAGE_SIZE;return dates.slice(start,start+AGENDA_PAGE_SIZE)}
  function pageNav(){
    const all=volunteerStayDates(),dates=pageDates(),index=pageIndex(),pages=Math.max(1,Math.ceil(all.length/AGENDA_PAGE_SIZE));if(!dates.length)return '';
    return `<div class="agenda-page-nav"><button class="icon-btn" type="button" onclick="loadVolunteerAgendaPage(${index-1})" ${index<=0?'disabled':''} aria-label="Dias anteriores"><i class="fa-solid fa-chevron-left"></i></button><strong>${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}</strong><span>${index+1}/${pages}</span><button class="icon-btn" type="button" onclick="loadVolunteerAgendaPage(${index+1})" ${index>=pages-1?'disabled':''} aria-label="Próximos dias"><i class="fa-solid fa-chevron-right"></i></button></div>`;
  }
  function loadingState(label='Carregando atividades...'){return `<div class="empty compact-loading agenda-inline-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>${label}</div>`}
  function proposalMeta(s){const raw=s?.raw||{},activity=s?.activity||{};if(raw.postApprovalProposal!==true&&activity.postApprovalProposal!==true)return null;return {status:raw.reviewStatus||activity.reviewStatus||'',note:raw.reviewNote||activity.reviewNote||''}}
  function sessionInfoButton(a,raw){const notes=raw.notes||a.notes||'',materials=raw.materials||a.materials||'';if(!notes&&(!materials||materials==='Nenhum'))return '';return `<button class="planning-note-button volunteer-info-button" type="button" aria-label="Ver informações" onclick="openVolunteerActivityInfo('${safe(a.name||raw.activityName||'Atividade')}','${safe(notes)}','${safe(materials)}')"><i class="fa-solid fa-circle-info"></i></button>`}
  function stateButton(text,tone,icon='fa-clock'){return `<div class="activity-actions review-state-actions"><button class="btn review-state-button ${tone}" type="button" disabled><i class="fa-solid ${icon}"></i>${text}</button></div>`}

  sessionCardVolunteer=function(s,editable){
    const a=s.activity||{},raw=s.raw||{},approved=state.volunteerMode==='approved';if(!approved)return baseSessionCard(s,editable);
    const description=raw.activityDescription||a.description||'',proposal=proposalMeta(s),change=parseChangeNote(raw.changeNote),activityId=a.id||raw.activityId||'',sessionId=s.sessionId||raw.id||'',info=sessionInfoButton(a,raw);
    let actions='';
    if(proposal&&proposal.status!=='approved'){
      if(proposal.status==='analysis')actions=stateButton('Aguardando análise','info');
      else if(proposal.status==='adjustments')actions=`${proposal.note?`<div class="notice warning proposal-review-note"><i class="fa-solid fa-rotate"></i><div>${escapeHtml(proposal.note)}</div></div>`:''}<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" type="button" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(String(activityId))})'><i class="fa-solid fa-pen"></i>Reajustar</button><button class="btn btn-danger-soft" type="button" onclick='requestDeletePlanningSession(${JSON.stringify(String(activityId))},${JSON.stringify(s.date)})'>Excluir</button></div>`;
      else if(proposal.status==='rejected')actions=stateButton('Recusada','danger','fa-xmark');
    }else if(s.status==='change_requested')actions=stateButton('Aguardando análise','warning');
    else if(change.kind==='adjustments')actions=`${change.note?`<div class="notice warning proposal-review-note"><i class="fa-solid fa-rotate"></i><div>${escapeHtml(change.note)}</div></div>`:''}<div class="activity-actions"><button class="btn btn-outline" type="button" onclick="moveSessionById('${safe(sessionId)}',true)"><i class="fa-solid fa-pen"></i>Reajustar mudança</button></div>`;
    else if(change.kind==='rejected')actions=stateButton('Mudança recusada','danger','fa-xmark');
    else actions=`<div class="activity-actions"><button class="btn btn-outline" type="button" onclick="moveSessionById('${safe(sessionId)}',true)">Solicitar mudança</button></div>`;
    return `<div class="activity-card volunteer-session-card"><div class="activity-row"><div class="volunteer-session-main"><div class="volunteer-session-title"><h4>${escapeHtml(a.time||raw.time||'—')} • ${escapeHtml(a.name||raw.activityName||'Atividade')}</h4>${info}</div><p>${Number(a.duration||raw.duration)||0} min • ${escapeHtml(a.period||raw.period||'Sem preferência')}</p>${description?`<p class="volunteer-session-description"><strong>Descrição:</strong> ${escapeHtml(description)}</p>`:''}</div></div>${actions}</div>`;
  };

  volunteerAgendaContent=function(editable=false){
    const all=volunteerStayDates();if(!all.length)return '<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>O período da estadia ainda não foi definido.</div>';
    const approved=state.volunteerMode==='approved';if((state.volunteerAgendaLoading===true)||(approved&&state.volunteerPlanningLoadedFor!==String(state.currentApplication?.id||'')))return pageNav()+loadingState();
    const dates=approved?pageDates():all;
    return `${approved?pageNav():''}<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="scrollToVolunteerDay('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${calendarMonthLabel(d)}</span></button>`).join('')}</div><div class="volunteer-plan-days">${dates.map(d=>{const ss=getSessions(d,true),adjustment=volunteerDayAdjustment(d),blocked=blockedReason(d);return `<div class="day-block" id="vday-${d}"><div class="day-title volunteer-day-title"><div><h3>${dayName(d)}, ${fmtDate(d)}</h3>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="day-title-actions">${adjustment?`<button class="day-info-button" type="button" onclick="openVolunteerDayAdjustment('${d}')" aria-label="Ver orientação"><i class="fa-solid fa-circle-info"></i></button>`:''}<span>${ss.length?`${(ss.reduce((x,s)=>x+(Number(s.activity.duration)||0),0)/60).toFixed(1).replace('.0','')}h`:''}</span></div></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')}${blocked?`<div class="no-activity-day"><i class="fa-regular fa-calendar-xmark"></i><span>${blocked}</span></div>`:(!ss.length?'<div class="empty">Nenhuma atividade planejada.</div>':'')}${editable&&!blocked?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button>`:''}</div>`}).join('')}</div>`;
  };

  volunteerAgenda=function(){return `<section class="section"><div class="section-head"><div><span class="eyebrow">Estadia confirmada</span><h2>Minha agenda</h2><p>Cronograma operacional atualizado</p></div></div><div class="notice approved-idea-notice"><div>Teve uma nova ideia? Você pode propor outra atividade. Ela entra na agenda somente depois da análise da Casa.</div><i class="fa-solid fa-lightbulb"></i></div><div style="margin-top:14px">${volunteerAgendaContent(true)}</div></section>`};

  window.loadVolunteerAgendaPage=async function(targetIndex){
    const all=volunteerStayDates(),pages=Math.max(1,Math.ceil(all.length/AGENDA_PAGE_SIZE)),index=Math.max(0,Math.min(Number(targetIndex)||0,pages-1)),dates=all.slice(index*AGENDA_PAGE_SIZE,index*AGENDA_PAGE_SIZE+AGENDA_PAGE_SIZE),application=state.currentApplication;
    if(!application?.id||!dates.length||state.volunteerAgendaLoading)return;state.volunteerAgendaPageIndex=index;state.volunteerAgendaLoading=true;render();
    try{
      const sessions=await window.OleiroServices.planning.listSessions({applicationId:application.id,from:dates[0],to:dates[dates.length-1]});state.sessions=sessions||[];state.activities=portalPlanActivities(application,state.sessions);state.sessionStatus={};state.sessionGroups={};state.sessions.forEach(session=>{if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}});state.volunteerPlanningLoadedFor=String(application.id);state.volunteerPlanningFailedFor=null;
    }catch(error){console.error(error);state.volunteerPlanningFailedFor=String(application.id);showToast('Não foi possível carregar esta parte da agenda.')}finally{state.volunteerAgendaLoading=false;render()}
  };

  window.moveSessionById=function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(String(encodedId||'')),session=(state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id));if(!session)return showToast('Sessão não encontrada.');
    const a=session.activity||(state.activities||[]).find(row=>String(row.id)===String(session.activityId))||{},currentDate=String(session.date||''),dates=volunteerStayDates().filter((date,index,all)=>index>0&&index<all.length-1).filter(date=>{const day=new Date(`${date}T12:00:00`).getDay();return day!==0&&day!==6}).sort();
    if(!dates.length)return showToast('Não há outra data disponível no período da estadia.');
    openModal('Solicitar mudança',`${escapeHtml(a.name||session.activityName||'Atividade')} • atual: ${fmtDate(currentDate,true)}`,`<div class="field"><label>Nova data</label><select id="moveDate" class="select move-date-select">${dates.map(date=>`<option value="${date}" ${date===currentDate?'selected':''}>${dayName(date)} • ${fmtDate(date,true)}${date===currentDate?' — atual':''}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label>Novo horário sugerido</label><input id="moveTime" class="input" type="time" value="${escapeHtml(session.time||a.time||'')}"></div>`,`<button id="moveSessionSave" class="btn btn-primary btn-block" type="button" onclick="saveMoveBySessionId('${safe(id)}',${byVolunteer})">Enviar para análise</button>`);
  };

  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(String(encodedId||'')),session=(state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id));if(!session)return showToast('Sessão não encontrada.');
    const a=session.activity||(state.activities||[]).find(row=>String(row.id)===String(session.activityId))||{},oldDate=String(session.date||''),oldTime=String(session.time||a.time||''),newDate=document.getElementById('moveDate')?.value||'',newTime=document.getElementById('moveTime')?.value||oldTime;
    if(!newDate)return showToast('Escolha a nova data.');if(newDate===oldDate&&newTime===oldTime)return showToast('Altere a data ou o horário antes de enviar.');
    const approved=state.volunteerMode==='approved'&&byVolunteer,patch={date:newDate,time:newTime};if(approved){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote=`move|${oldDate}|${oldTime}|${newDate}|${newTime}`}
    const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...'}
    try{await window.OleiroServices.planning.updateSession(session.id,patch);Object.assign(session,patch);closeModal();render();showToast(approved?'Mudança enviada para análise.':'Cronograma atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível solicitar a mudança.');if(button?.isConnected){button.disabled=false;button.textContent='Enviar para análise'}}
  };

  window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerAgendaContent=volunteerAgendaContent;window.volunteerAgenda=volunteerAgenda;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
