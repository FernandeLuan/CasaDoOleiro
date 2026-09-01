/* Volunteer activity flow: same-day repetitions and inline activity information. */
(function volunteerActivityFlow(){
  const baseOpenActivityModal=window.openActivityModal||openActivityModal;
  const baseSaveActivity=window.saveActivity||saveActivity;
  const baseSessionCardVolunteer=window.sessionCardVolunteer||sessionCardVolunteer;
  let repeatIndex=0;
  const text=key=>typeof t==='function'?t(key):key;

  function repeatBlock(){
    return `<div class="activity-repeat-block" id="volunteerRepeatBlock"><div class="activity-repeat-head"><div class="activity-repeat-copy"><strong>${escapeHtml(text('activity.repeat.title'))}</strong><small>${escapeHtml(text('activity.repeat.help'))}</small></div><button class="btn btn-outline activity-repeat-add" type="button" onclick="addVolunteerRepeatSession()"><i class="fa-solid fa-plus"></i>${escapeHtml(text('activity.repeat.add'))}</button></div><div class="activity-repeat-list" id="volunteerRepeatList"></div></div>`;
  }
  window.addVolunteerRepeatSession=function(value='Sem preferência'){
    const list=document.getElementById('volunteerRepeatList');if(!list)return;const id=`volunteerRepeatPeriod${++repeatIndex}`,row=document.createElement('div');row.className='activity-repeat-row';row.innerHTML=`<div class="activity-repeat-row-head"><div class="field"><label for="${id}">${escapeHtml(text('activity.repeat.period'))}</label><select id="${id}" class="select" data-repeat-period>${['Sem preferência','Manhã','Tarde','Noite'].map(period=>`<option value="${escapeHtml(period)}" ${period===value?'selected':''}>${escapeHtml(tValue(period))}</option>`).join('')}</select></div><button class="icon-btn" type="button" aria-label="${escapeHtml(text('activity.repeat.remove'))}" title="${escapeHtml(text('activity.repeat.remove'))}" onclick="this.closest('.activity-repeat-row').remove()"><i class="fa-solid fa-trash"></i></button></div>`;list.appendChild(row);
  };
  window.addVolunteerRepeatTime=window.addVolunteerRepeatSession;

  openActivityModal=function(date=null,id=null){
    const result=baseOpenActivityModal(date,id);if(id)return result;
    const period=document.getElementById('actPeriod'),row=period?.closest('.field');if(row&&!document.getElementById('volunteerRepeatBlock'))row.insertAdjacentHTML('afterend',repeatBlock());return result;
  };

  function seriesData(){return {name:document.getElementById('actName')?.value.trim()||'',description:document.getElementById('actDesc')?.value.trim()||'',duration:+document.getElementById('actDuration')?.value||60,participation:document.getElementById('actParticipation')?.value||'Livre',materials:document.getElementById('actMaterials')?.value.trim()||'Nenhum',notes:document.getElementById('actNotes')?.value.trim()||'',period:document.getElementById('actPeriod')?.value||'Sem preferência'}}
  function applySeriesResult(result,date){
    const activities=(result?.activities||[]).map(activity=>({...activity,id:String(activity.id),dates:[date]}));
    const byId=new Map(activities.map(activity=>[String(activity.id),activity]));
    const sessions=(result?.sessions||[]).map(session=>({...session,activity:byId.get(String(session.activityId))||session.activity}));
    state.activities=(state.activities||[]).concat(activities);
    state.sessions=(state.sessions||[]).concat(sessions).sort(activityScheduleCompare);
    if(state.volunteerMode!=='approved'&&typeof syncVolunteerApplicationCounts==='function')syncVolunteerApplicationCounts();
  }

  saveActivity=async function(id){
    const repeatInputs=[...document.querySelectorAll('#volunteerRepeatList select[data-repeat-period]')];if(id||!repeatInputs.length)return baseSaveActivity(id);
    const approved=state.volunteerMode==='approved';if(!approved&&!['draft','adjustments'].includes(state.volunteerPlanStatus||'draft'))return showToast(text('portal.activity.locked'));
    const dates=[...document.querySelectorAll('input[name="actDate"]:checked')].map(input=>input.value);if(dates.length!==1)return showToast(text('activity.repeat.singleDate'));
    const data=seriesData();if(!data.name)return showToast(text('portal.activity.nameRequired'));
    const extraPeriods=repeatInputs.map(input=>activityPeriodValue({period:input.value})),periods=[activityPeriodValue(data),...extraPeriods];if(new Set(periods).size!==periods.length)return showToast(text('activity.repeat.duplicatePeriod'));
    const application=state.currentApplication,session=state.currentSession;if(!application?.id||!session?.uid)return showToast(text('portal.plan.invalidSession'));
    const ownerName=typeof planningOwnerName==='function'?planningOwnerName(application,session):(session.profile?.name||session.email||text('role.volunteer'));
    const button=modalRoot.querySelector('.modal .btn-primary:last-child');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(text('action.saving'))}`}
    try{
      const result=await window.OleiroServices.planning.createActivitySeries({applicationId:application.id,unitId:application.unitId,createdByUid:session.uid,ownerName,data,date:dates[0],occurrences:periods.map(period=>({period,participation:data.participation})),postApprovalProposal:approved,sessionStatus:'proposed',managerCreated:false,updateApplicationCounts:false});
      applySeriesResult(result,dates[0]);closeModal();render();showToast(approved?text('portal.activity.proposed'):text('portal.activity.saved'));
    }catch(error){console.error(error);showToast(error?.message||text('portal.activity.saveError'));if(button?.isConnected){button.disabled=false;button.textContent=approved?text('action.sendReview'):text('action.addActivity')}}
  };

  function meaningfulMaterials(value){const normalized=String(value||'').trim();return normalized&&!['Nenhum','None','Ninguno','Ningún'].includes(normalized)}
  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCardVolunteer(s,editable),template=document.createElement('template');template.innerHTML=html;template.content.querySelectorAll('.volunteer-info-button,.planning-note-button').forEach(button=>button.remove());
    const main=template.content.querySelector('.volunteer-session-main')||template.content.querySelector('.activity-row>div');if(!main)return template.innerHTML;
    const raw=s?.raw||{},activity=s?.activity||{},description=raw.activityDescription||activity.description||'',notes=raw.notes||activity.notes||'',materials=raw.materials||activity.materials||'';
    if(description&&!main.querySelector('.volunteer-session-description'))main.insertAdjacentHTML('beforeend',`<p class="volunteer-session-description"><strong>${escapeHtml(text('portal.activity.descriptionLabel'))}</strong> <span data-no-i18n>${escapeHtml(description)}</span></p>`);
    const details=[];if(notes)details.push(`<p class="activity-inline-detail"><strong>${escapeHtml(text('activity.details.notes'))}:</strong> <span data-no-i18n>${escapeHtml(notes)}</span></p>`);if(meaningfulMaterials(materials))details.push(`<p class="activity-inline-detail"><strong>${escapeHtml(text('activity.details.materials'))}:</strong> <span data-no-i18n>${escapeHtml(materials)}</span></p>`);if(details.length)main.insertAdjacentHTML('beforeend',`<div class="activity-inline-details">${details.join('')}</div>`);return template.innerHTML;
  };

  window.openActivityModal=openActivityModal;window.saveActivity=saveActivity;window.sessionCardVolunteer=sessionCardVolunteer;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
