/* Round 16/28 — portal compacto, cache de agenda e movimentação sem dependência de texto. */
(function uxR16Portal(){
  const AGENDA_CACHE_MS=5*60*1000;
  const baseVolunteerAgendaContent=volunteerAgendaContent;
  const baseVolunteerInfo=volunteerInfo;
  const baseVolunteerProfile=volunteerProfile;
  const baseSessionCardVolunteer=sessionCardVolunteer;
  const baseLoadVolunteerAgendaPage=window.loadVolunteerAgendaPage;

  state.volunteerAgendaPageCache=state.volunteerAgendaPageCache||{};

  function safe(value){return encodeURIComponent(String(value??''))}
  function stripSectionHead(html){
    const root=document.createElement('div');root.innerHTML=html;
    root.querySelector('.section-head')?.remove();
    root.querySelector('section')?.classList.add('portal-compact-page');
    return root.innerHTML;
  }
  function applyLoadedSessions(application,sessions){
    state.sessions=sessions||[];
    state.activities=portalPlanActivities(application,state.sessions);
    state.sessionStatus={};state.sessionGroups={};
    state.sessions.forEach(session=>{if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}});
    state.volunteerPlanningLoadedFor=String(application.id);state.volunteerPlanningFailedFor=null;
  }
  function cacheCurrentAgendaPage(){
    const application=state.currentApplication;if(!application?.id||state.volunteerPlanningLoadedFor!==String(application.id)||state.volunteerAgendaLoading)return;
    const index=Math.max(0,Number(state.volunteerAgendaPageIndex)||0),key=`${application.id}|${index}`;
    state.volunteerAgendaPageCache[key]={at:Date.now(),sessions:(state.sessions||[]).map(row=>({...row}))};
  }

  volunteerAgendaContent=function(editable=false){
    const html=baseVolunteerAgendaContent(editable),root=document.createElement('div');root.innerHTML=html;
    if(state.volunteerMode==='approved'){
      const nav=root.querySelector('.agenda-page-nav'),strip=root.querySelector('.calendar-strip');
      if(nav&&strip&&nav.parentNode===strip.parentNode)nav.parentNode.insertBefore(strip,nav);
    }
    return root.innerHTML;
  };

  volunteerAgenda=function(){return `<section class="section portal-compact-page portal-agenda-compact">${volunteerAgendaContent(true)}</section>`};
  volunteerInfo=function(){return stripSectionHead(baseVolunteerInfo())};
  volunteerProfile=function(){return stripSectionHead(baseVolunteerProfile())};

  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCardVolunteer(s,editable);if(state.volunteerMode!=='approved')return html;
    const root=document.createElement('div');root.innerHTML=html;
    const card=root.firstElementChild;if(!card)return html;
    card.querySelectorAll('.activity-actions').forEach(actions=>actions.classList.add('approved-card-actions'));
    card.querySelectorAll('.activity-actions > .btn').forEach(button=>{
      const action=String(button.getAttribute('onclick')||'');
      if(action.includes('moveSessionById'))button.classList.add('review-action-neutral');
      if(card.classList.contains('post-approval-proposal')&&action.includes('openActivityModal'))button.classList.add('review-action-warning');
    });
    return root.innerHTML;
  };

  window.loadVolunteerAgendaPage=async function(targetIndex){
    const application=state.currentApplication,all=volunteerStayDates();if(!application?.id||!all.length||state.volunteerAgendaLoading)return;
    cacheCurrentAgendaPage();
    const pages=Math.max(1,Math.ceil(all.length/7)),index=Math.max(0,Math.min(Number(targetIndex)||0,pages-1)),key=`${application.id}|${index}`,cached=state.volunteerAgendaPageCache[key];
    state.volunteerAgendaPageIndex=index;
    if(cached&&Date.now()-cached.at<AGENDA_CACHE_MS){applyLoadedSessions(application,cached.sessions);render();return}
    await baseLoadVolunteerAgendaPage(index);
    if(state.volunteerPlanningLoadedFor===String(application.id)&&!state.volunteerPlanningFailedFor){state.volunteerAgendaPageCache[key]={at:Date.now(),sessions:(state.sessions||[]).map(row=>({...row}))}}
  };

  window.moveSessionById=function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(String(encodedId||'')),session=(state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id));if(!session)return showToast(t('portal.activity.deleteError'));
    const a=session.activity||(state.activities||[]).find(row=>String(row.id)===String(session.activityId))||{},currentDate=String(session.date||''),dates=volunteerStayDates().filter((date,index,all)=>index>0&&index<all.length-1).filter(date=>{const day=new Date(`${date}T12:00:00`).getDay();return day!==0&&day!==6}).sort();
    if(!dates.length)return showToast(t('portal.move.noOtherDate'));
    const approved=state.volunteerMode==='approved'&&byVolunteer,title=approved?t('portal.move.requestTitle'):t('portal.move.title');
    const currentPeriod=activityPeriodValue(session,a);openModal(title,`${escapeHtml(a.name||session.activityName||'Atividade')} • ${escapeHtml(t('portal.move.current'))}: ${fmtDate(currentDate,true)}`,`<div class="change-request-card"><div class="field"><label>${escapeHtml(t('portal.move.newDate'))}</label><select id="moveDate" class="select move-date-select">${dates.map(date=>`<option value="${date}" ${date===currentDate?'selected':''}>${dayName(date)} • ${fmtDate(date,true)}${date===currentDate?` — ${escapeHtml(t('portal.move.current'))}`:''}</option>`).join('')}</select></div><div class="field"><label>${escapeHtml(t('portal.move.newPeriod'))}</label><select id="movePeriod" class="select">${['Sem preferência','Manhã','Tarde','Noite'].map(period=>`<option value="${escapeHtml(period)}" ${period===currentPeriod?'selected':''}>${escapeHtml(tValue(period))}</option>`).join('')}</select></div>${approved?`<div class="field"><label>${escapeHtml(t('portal.move.reason'))}</label><input id="moveReason" class="input" type="text" placeholder="${escapeHtml(t('portal.move.reasonPlaceholder'))}"></div>`:''}</div>`,`<button id="moveSessionSave" class="btn btn-primary btn-block" type="button" onclick="saveMoveBySessionId('${safe(id)}',${byVolunteer})">${escapeHtml(approved?t('action.sendReview'):t('action.saveChange'))}</button>`);
  };

  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(String(encodedId||'')),session=(state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id));if(!session)return showToast(t('portal.activity.deleteError'));
    const a=session.activity||(state.activities||[]).find(row=>String(row.id)===String(session.activityId))||{},oldDate=String(session.date||''),oldPeriod=activityPeriodValue(session,a),newDate=document.getElementById('moveDate')?.value||'',newPeriod=document.getElementById('movePeriod')?.value||oldPeriod,reason=document.getElementById('moveReason')?.value.trim()||'';
    if(!newDate)return showToast(t('portal.move.chooseDate'));if(newDate===oldDate&&newPeriod===oldPeriod)return showToast(t('portal.move.changeRequired'));
    const approved=state.volunteerMode==='approved'&&byVolunteer,patch={date:newDate,period:newPeriod};if(approved){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote=reason||'Mudança de período solicitada pelo voluntário.'}
    const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(t('action.saving'))}`}
    try{await window.OleiroServices.planning.updateSession(session.id,patch);Object.assign(session,patch);cacheCurrentAgendaPage();closeModal();render();showToast(approved?t('portal.session.changeSent'):t('portal.move.updated'))}catch(error){console.error(error);showToast(error?.message||t('portal.move.error'));if(button?.isConnected){button.disabled=false;button.textContent=approved?t('action.sendReview'):t('action.saveChange')}}
  };

  window.volunteerAgendaContent=volunteerAgendaContent;window.volunteerAgenda=volunteerAgenda;window.volunteerInfo=volunteerInfo;window.volunteerProfile=volunteerProfile;window.sessionCardVolunteer=sessionCardVolunteer;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
