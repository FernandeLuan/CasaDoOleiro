/* Round 16/28 — somente wrappers visuais e abertura do modal de mudança ainda são ativos. */
(function uxR16Portal(){
  const baseVolunteerInfo=volunteerInfo;
  const baseVolunteerProfile=volunteerProfile;
  const baseSessionCardVolunteer=sessionCardVolunteer;

  function safe(value){return encodeURIComponent(String(value??''))}
  function stripSectionHead(html){
    const root=document.createElement('div');root.innerHTML=html;
    root.querySelector('.section-head')?.remove();
    root.querySelector('section')?.classList.add('portal-compact-page');
    return root.innerHTML;
  }

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

  window.moveSessionById=function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(String(encodedId||'')),session=(state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id));if(!session)return showToast(t('portal.move.error'));
    const a=session.activity||(state.activities||[]).find(row=>String(row.id)===String(session.activityId))||{},currentDate=String(session.date||''),dates=volunteerStayDates().filter((date,index,all)=>index>0&&index<all.length-1).filter(date=>{const day=new Date(`${date}T12:00:00`).getDay();return day!==0&&day!==6}).sort();
    if(!dates.length)return showToast(t('portal.move.noOtherDate'));
    const approved=state.volunteerMode==='approved'&&byVolunteer,title=approved?t('portal.move.requestTitle'):t('portal.move.title');
    openModal(title,`${escapeHtml(a.name||session.activityName||translateText('Atividade'))} • ${escapeHtml(t('portal.move.current'))}: ${fmtDate(currentDate,true)}`,`<div class="change-request-card"><div class="field"><label>${escapeHtml(t('portal.move.newDate'))}</label><select id="moveDate" class="select move-date-select">${dates.map(date=>`<option value="${date}" ${date===currentDate?'selected':''}>${dayName(date)} • ${fmtDate(date,true)}${date===currentDate?` — ${escapeHtml(t('portal.move.current'))}`:''}</option>`).join('')}</select></div><div class="field"><label>${escapeHtml(t('portal.move.newTime'))}</label><input id="moveTime" class="input" type="time" value="${escapeHtml(session.time||a.time||'')}"></div>${approved?`<div class="field"><label>${escapeHtml(t('portal.move.reason'))}</label><input id="moveReason" class="input" type="text" placeholder="${escapeHtml(t('portal.move.reasonPlaceholder'))}"></div>`:''}</div>`,`<button id="moveSessionSave" class="btn btn-primary btn-block" type="button" onclick="saveMoveBySessionId('${safe(id)}',${byVolunteer})">${escapeHtml(approved?t('action.sendReview'):t('action.saveChange'))}</button>`);
  };

  window.volunteerAgenda=volunteerAgenda;window.volunteerInfo=volunteerInfo;window.volunteerProfile=volunteerProfile;window.sessionCardVolunteer=sessionCardVolunteer;
})();
