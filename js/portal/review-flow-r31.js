/* Round 31 — session-specific adjustments and preserved existing-change proposals in the volunteer portal. */
(function reviewFlowR31Portal(){
  const baseSessionCard=window.sessionCardVolunteer||sessionCardVolunteer;
  const baseSubmitPlan=window.submitPlan||submitPlan;
  const baseSaveMove=window.saveMoveBySessionId;
  const text=key=>typeof t==='function'?t(key):key;
  const safe=value=>encodeURIComponent(String(value??''));
  function sessionById(id){return (state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id))||null}
  function sessionValue(row,key,fallback=''){if(row?.[key]!==undefined&&row?.[key]!==null&&row?.[key]!=='')return row[key];return row?.activity?.[key]??fallback}
  function proposalValue(row,key){const proposal=row?.changeProposal||{};return proposal[key]!==undefined?proposal[key]:sessionValue(row,key,'')}
  function eligibleDates(){
    const app=state.currentApplication||{};
    if(typeof planningEligibleDatesFor==='function')return planningEligibleDatesFor(app);
    const all=typeof volunteerStayDates==='function'?volunteerStayDates():[];
    return all.filter((date,index)=>index>0&&index<all.length-1).filter(date=>{const day=new Date(`${date}T12:00:00`).getDay();return day!==0&&day!==6});
  }
  function snapshot(row){return {date:String(row?.date||''),time:String(sessionValue(row,'time','')),duration:Number(sessionValue(row,'duration',60))||60,period:String(sessionValue(row,'period','Sem preferência')),activityName:String(row?.activityName||row?.activity?.name||'Atividade'),activityDescription:String(row?.activityDescription||row?.activity?.description||''),participation:String(sessionValue(row,'participation','Livre')),materials:String(sessionValue(row,'materials','')),notes:String(sessionValue(row,'notes',''))}}
  function diff(base,next){
    const from=[],to=[],push=(label,a,b)=>{if(String(a??'')===String(b??''))return;from.push(`${label} ${a||'—'}`);to.push(`${label} ${b||'—'}`)};
    const fmt=value=>value?fmtDate(String(value).slice(0,10),true):'—';
    push(text('review.date'),fmt(base.date),fmt(next.date));push(text('review.time'),base.time,next.time);push(text('review.duration'),base.duration?`${base.duration} min`:'—',next.duration?`${next.duration} min`:'—');push(text('review.period'),tValue(base.period),tValue(next.period));push(text('review.activity'),base.activityName,next.activityName);push(text('review.description'),base.activityDescription,next.activityDescription);push(text('review.participation'),tValue(base.participation),tValue(next.participation));push(text('review.materials'),base.materials,next.materials);push(text('review.notes'),base.notes,next.notes);
    return {from:from.join(' • ')||'—',to:to.join(' • ')||'—'};
  }
  function reviewBlock(label,note,{baseline=null,current=null,tone='warning'}={}){
    const pair=baseline&&current?diff(baseline,current):null;
    return `<div class="r31-review-block ${tone}"><strong>${escapeHtml(label)}</strong>${note?`<p data-no-i18n>${escapeHtml(note)}</p>`:''}${pair?`<div class="r31-change-pair"><span><b>${escapeHtml(text('review.from'))}</b> ${escapeHtml(pair.from)}</span><span><b>${escapeHtml(text('review.to'))}</b> ${escapeHtml(pair.to)}</span></div>`:''}</div>`;
  }
  function addBadge(card,label,tone){const row=card.querySelector('.activity-row');if(!row)return;const badges=[...row.children].filter(node=>node.classList?.contains('badge'));badges.forEach(node=>node.remove());row.insertAdjacentHTML('beforeend',badge(label,tone))}
  function insertReview(card,html){if(!html)return;card.querySelector('.r31-review-details')?.remove();const details=document.createElement('div');details.className='r31-review-details';details.innerHTML=html;const divider=document.createElement('div');divider.className='admin-portal-detail-divider r31-review-divider';divider.setAttribute('aria-hidden','true');const actions=card.querySelector('.activity-actions');card.insertBefore(divider,actions||null);card.insertBefore(details,actions||null)}
  function setActions(card,html){card.querySelectorAll(':scope > .activity-actions').forEach(node=>node.remove());if(html)card.insertAdjacentHTML('beforeend',html)}
  function statusCard(s,editable){
    const raw=s?.raw||sessionById(s?.sessionId)||{},html=baseSessionCard(s,editable),root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;if(!card)return html;card.classList.add('volunteer-session-card');
    const current=snapshot(raw),baseline=raw.adminAdjustmentBaseline||null,proposal=raw.changeProposal||null;
    if(raw.postApprovalProposal===true){
      const review=raw.reviewStatus||s.activity?.reviewStatus||'';
      if(review==='analysis'){card.classList.add('r31-card-info');addBadge(card,raw.reviewBaseline?text('review.adjustSent'):text('review.newActivity'),'info');if(raw.reviewBaseline)insertReview(card,reviewBlock(text('review.readjustReason'),raw.reviewRequestNote||'',{baseline:raw.reviewBaseline,current,tone:''}))}
      else if(review==='adjustments'){card.classList.add('r31-card-warning');addBadge(card,text('portal.session.adjust'),'warning');card.querySelector('.proposal-review-note')?.remove();insertReview(card,reviewBlock(text('review.readjustReason'),raw.reviewNote||s.activity?.reviewNote||'',{tone:'warning'}))}
      else if(review==='rejected'){card.classList.add('r31-card-danger');addBadge(card,text('review.rejected'),'danger')}
      return root.innerHTML;
    }
    if(raw.changeReviewStatus==='rejected'){
      card.classList.add('r31-card-danger');addBadge(card,text('review.rejected'),'danger');
      if(raw.changeReviewNote)insertReview(card,reviewBlock(text('review.changeReason'),raw.changeReviewNote,{tone:''}));
      return root.innerHTML;
    }
    if(raw.status==='change_requested'){
      const adminOrigin=raw.adminAdjustmentStatus==='analysis'||raw.adminAdjustmentStatus==='requested';
      if(raw.changeReviewStatus==='adjustments'){
        card.classList.add('r31-card-warning');addBadge(card,text('portal.session.adjust'),'warning');
        const blocks=[];if(adminOrigin&&raw.adminAdjustmentNote)blocks.push(reviewBlock(text('review.adjustReason'),raw.adminAdjustmentNote,{baseline:raw.adminAdjustmentBaseline||baseline,current:proposal?{...current,...proposal}:current,tone:'warning'}));else if(raw.changeNote)blocks.push(reviewBlock(text('review.changeReason'),raw.changeNote,{baseline:current,current:{...current,...proposal},tone:''}));
        blocks.push(reviewBlock(text('review.readjustReason'),raw.changeReviewNote||raw.changeReviewRequestNote||'',{tone:'warning'}));insertReview(card,blocks.join(''));
        setActions(card,`<div class="activity-actions approved-card-actions"><button class="btn btn-outline review-action-warning" type="button" onclick="openR31VolunteerSessionEditor('${safe(raw.id)}')"><i class="fa-solid fa-pen"></i>${escapeHtml(text('review.readjustActivity'))}</button></div>`);return root.innerHTML;
      }
      card.classList.add(adminOrigin?'r31-card-info':'r31-card-warning');addBadge(card,adminOrigin?text('review.adjustSent'):text('review.changeRequested'),adminOrigin?'info':'warning');
      const proposed={...current,...proposal};insertReview(card,adminOrigin?reviewBlock(text('review.adjustReason'),raw.adminAdjustmentNote||raw.changeNote||'',{baseline:raw.adminAdjustmentBaseline||current,current:proposed,tone:''}):reviewBlock(text('review.changeReason'),raw.changeNote||'',{baseline:current,current:proposed,tone:''}));
      setActions(card,`<div class="activity-actions"><button class="btn btn-soft" type="button" disabled><i class="fa-solid fa-clock"></i>${escapeHtml(text('review.awaiting'))}</button></div>`);return root.innerHTML;
    }
    if(raw.adminAdjustmentStatus==='requested'){
      card.classList.add('r31-card-warning');addBadge(card,text('portal.activity.adjustRequested'),'warning');insertReview(card,reviewBlock(text('review.adjustReason'),raw.adminAdjustmentNote||text('review.sessionAdjustment'),{tone:'warning'}));
      setActions(card,`<div class="activity-actions candidate-session-actions"><button class="btn btn-outline review-action-warning" type="button" onclick="openR31VolunteerSessionEditor('${safe(raw.id)}')"><i class="fa-solid fa-pen"></i>${escapeHtml(text('review.adjustActivity'))}</button></div>`);return root.innerHTML;
    }
    if(raw.adminAdjustmentStatus==='analysis'){
      card.classList.add('r31-card-info');addBadge(card,text('review.adjustSent'),'info');insertReview(card,reviewBlock(text('review.adjustReason'),raw.adminAdjustmentNote||'',{baseline:raw.adminAdjustmentBaseline||null,current,tone:''}));return root.innerHTML;
    }
    return root.innerHTML;
  }
  sessionCardVolunteer=function(s,editable){return statusCard(s,editable)};

  function editorBody(row){
    const useProposal=row.status==='change_requested'&&row.changeReviewStatus==='adjustments',dates=eligibleDates(),date=useProposal?proposalValue(row,'date'):row.date,time=useProposal?proposalValue(row,'time'):sessionValue(row,'time',''),duration=useProposal?Number(proposalValue(row,'duration')):Number(sessionValue(row,'duration',60)),period=useProposal?proposalValue(row,'period'):sessionValue(row,'period','Sem preferência'),participation=useProposal?proposalValue(row,'participation'):sessionValue(row,'participation','Livre'),name=useProposal?proposalValue(row,'activityName'):(row.activityName||row.activity?.name||'Atividade'),description=useProposal?proposalValue(row,'activityDescription'):(row.activityDescription||row.activity?.description||''),materials=useProposal?proposalValue(row,'materials'):sessionValue(row,'materials',''),notes=useProposal?proposalValue(row,'notes'):sessionValue(row,'notes','');
    return `<div class="form-grid activity-modal-form"><div class="field"><label>${escapeHtml(text('portal.activity.name'))}</label><input id="r31ActName" class="input" value="${escapeHtml(name)}"></div><div class="field"><label>${escapeHtml(text('portal.activity.description'))}</label><textarea id="r31ActDesc" class="textarea">${escapeHtml(description)}</textarea></div><div class="field-row"><div class="field"><label>${escapeHtml(text('portal.activity.duration'))}</label><input id="r31ActDuration" class="input" type="number" min="15" max="240" step="15" value="${duration||60}"></div><div class="field"><label>${escapeHtml(text('portal.activity.participation'))}</label><select id="r31ActParticipation" class="select">${['Até 5','Até 10','Livre','Outro'].map(value=>`<option value="${escapeHtml(value)}" ${String(participation)===value?'selected':''}>${escapeHtml(tValue(value))}</option>`).join('')}</select></div></div><div class="field"><label>${escapeHtml(text('portal.activity.materials'))}</label><input id="r31ActMaterials" class="input" value="${escapeHtml(materials)}"></div><div class="field"><label>${escapeHtml(text('portal.activity.notes'))}</label><textarea id="r31ActNotes" class="textarea">${escapeHtml(notes)}</textarea></div><div class="field-row"><div class="field"><label>${escapeHtml(text('portal.activity.period'))}</label><select id="r31ActPeriod" class="select">${['Manhã','Tarde','Noite','Sem preferência'].map(value=>`<option value="${escapeHtml(value)}" ${String(period)===value?'selected':''}>${escapeHtml(tValue(value))}</option>`).join('')}</select></div><div class="field"><label>${escapeHtml(text('portal.activity.time'))}</label><input id="r31ActTime" class="input" type="time" value="${escapeHtml(time)}"></div></div><div class="field"><label>${escapeHtml(text('review.date'))}</label><select id="r31ActDate" class="select">${dates.map(value=>`<option value="${value}" ${String(date)===value?'selected':''}>${dayName(value)} • ${fmtDate(value,true)}</option>`).join('')}</select></div>${useProposal&&!row.adminAdjustmentNote?`<div class="field"><label>${escapeHtml(text('portal.move.reason'))}</label><input id="r31ChangeReason" class="input" value="${escapeHtml(row.changeNote||'')}"></div>`:''}</div>`;
  }
  window.openR31VolunteerSessionEditor=function(encodedId){const id=decodeURIComponent(encodedId),row=sessionById(id);if(!row)return showToast(text('portal.activity.deleteError'));const note=row.changeReviewStatus==='adjustments'?(row.changeReviewNote||''):(row.adminAdjustmentNote||'');openModal(row.changeReviewStatus==='adjustments'?text('review.readjustActivity'):text('review.adjustActivity'),note?`${text('review.teamGuidance')}: ${escapeHtml(note)}`:'',editorBody(row),`<button id="r31VolunteerAdjustSave" class="btn btn-primary btn-block" type="button" onclick="saveR31VolunteerSessionEditor('${safe(id)}')">${escapeHtml(text('action.saveChanges'))}</button>`);modalRoot.querySelector('.modal')?.classList.add('activity-modal')};
  window.saveR31VolunteerSessionEditor=async function(encodedId){
    const id=decodeURIComponent(encodedId),row=sessionById(id);if(!row)return;const proposal={date:document.getElementById('r31ActDate')?.value||row.date,time:document.getElementById('r31ActTime')?.value||'',duration:Number(document.getElementById('r31ActDuration')?.value)||60,period:document.getElementById('r31ActPeriod')?.value||'Sem preferência',activityName:document.getElementById('r31ActName')?.value.trim()||'Atividade',activityDescription:document.getElementById('r31ActDesc')?.value||'',participation:document.getElementById('r31ActParticipation')?.value||'Livre',materials:document.getElementById('r31ActMaterials')?.value||'',notes:document.getElementById('r31ActNotes')?.value||''},button=document.getElementById('r31VolunteerAdjustSave');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(text('action.saving'))}`}
    try{
      if(row.status==='change_requested'&&row.changeReviewStatus==='adjustments'){
        const reason=document.getElementById('r31ChangeReason')?.value.trim()||row.changeNote||'';const patch=await window.OleiroServices.planning.resubmitExistingChange({sessionId:id,proposal,reason});Object.assign(row,patch,proposal?{}:{});row.changeProposal=proposal;
      }else if(state.volunteerMode==='approved'){
        const patch=await window.OleiroServices.planning.requestExistingChange({sessionId:id,proposal,reason:'',fromAdminAdjustment:true});Object.assign(row,patch);row.changeProposal=proposal;
      }else{
        await window.OleiroServices.planning.updateSession(id,proposal);Object.assign(row,proposal);
      }
      closeModal();render();showToast(state.volunteerMode==='approved'?text('review.changeSent'):text('review.adjustmentSaved'));
    }catch(error){console.error(error);showToast(error?.message||text('review.adjustmentError'));if(button?.isConnected){button.disabled=false;button.textContent=text('action.saveChanges')}}
  };

  if(typeof baseSaveMove==='function')window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    if(!(state.volunteerMode==='approved'&&byVolunteer))return baseSaveMove(encodedId,byVolunteer);
    const id=decodeURIComponent(String(encodedId||'')),row=sessionById(id);if(!row)return showToast(text('portal.activity.deleteError'));const old=snapshot(row),newDate=document.getElementById('moveDate')?.value||old.date,newTime=document.getElementById('moveTime')?.value||old.time,reason=document.getElementById('moveReason')?.value.trim()||'';if(newDate===old.date&&newTime===old.time)return showToast(text('portal.move.changeRequired'));if(!reason)return showToast(text('review.reasonRequired'));const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(text('action.saving'))}`}
    try{const patch=await window.OleiroServices.planning.requestExistingChange({sessionId:id,proposal:{date:newDate,time:newTime},reason});Object.assign(row,patch);row.changeProposal={date:newDate,time:newTime};closeModal();render();showToast(text('portal.session.changeSent'))}catch(error){console.error(error);showToast(error?.message||text('portal.move.error'));if(button?.isConnected){button.disabled=false;button.textContent=text('action.sendReview')}}
  };

  submitPlan=async function(){
    const adjusted=(state.sessions||[]).filter(row=>row.adminAdjustmentStatus==='requested').map(row=>String(row.id)).filter(Boolean);
    if(!adjusted.length)return baseSubmitPlan();const acts=typeof volunteerActivities==='function'?volunteerActivities():state.activities||[];if(!acts.length||(state.sessions||[]).length===0)return showToast(text('portal.plan.addBeforeSend'));const app=state.currentApplication;if(!app?.id)return showToast(text('portal.plan.applicationMissing'));
    try{await window.OleiroServices.applications.submitPlanningWithSessionAdjustments(app.id,{sessionIds:adjusted});app.status='analysis';app.planningSubmittedAt=new Date().toISOString();state.volunteerPlanStatus='submitted';(state.sessions||[]).forEach(row=>{if(adjusted.includes(String(row.id))){row.adminAdjustmentStatus='analysis';row.adminAdjustmentSubmittedAt=new Date().toISOString()}});render();showToast(text('portal.plan.resentToast'))}catch(error){console.error(error);showToast(error?.message||text('portal.plan.sendError'))}
  };

  window.sessionCardVolunteer=sessionCardVolunteer;window.submitPlan=submitPlan;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
