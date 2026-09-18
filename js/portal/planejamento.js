function candidatePlanningEditable(status=state.volunteerPlanStatus||'draft'){
  return window.OleiroRules?.candidatePlanningEditable?.(status)??['draft','submitted','adjustments'].includes(String(status||'draft'));
}
function activeCandidateSessions(){
  return (state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected');
}
function portalPlanningShareAllowed(){const application=state.currentApplication||{};return application.status!=='rejected'&&!application.inactive}
function portalPlanningShareStatus(){
  const application=state.currentApplication||{},status=String(application.status||''),plan=String(state.volunteerPlanStatus||'draft');
  if(state.volunteerMode==='approved'||status==='approved')return t('portal.profile.approved');
  if(status==='meeting'||status==='plan_approved')return t('portal.meeting.planApproved');
  if(plan==='submitted'||status==='analysis')return t('portal.profile.analysis');
  if(plan==='adjustments'||status==='adjustments')return t('portal.profile.adjustments');
  return t('portal.profile.preparing');
}
function portalPlanningShareHeading(){
  const status=String(state.currentApplication?.status||'');
  if(state.volunteerMode==='approved'||status==='approved')return t('planning.share.confirmedHeading');
  if(status==='meeting'||status==='plan_approved')return t('planning.share.approvedHeading');
  return t('planning.share.heading');
}
function portalPlanningShareBar(){
  if(!portalPlanningShareAllowed()||!activeCandidateSessions().length)return '';
  return `<div class="planning-share-bar portal-planning-share-bar"><button class="planning-share-action" type="button" onclick="sharePortalPlanningWhatsApp()"><i class="fa-brands fa-whatsapp"></i><span>${escapeHtml(t('planning.share.whatsapp'))}</span></button></div>`;
}
window.sharePortalPlanningWhatsApp=function(){
  const sessions=(state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected');
  if(!sessions.length)return showToast(t('planning.share.none'));
  const application=state.currentApplication||{},profile=state.currentSession?.profile||{},name=typeof volunteerProfileName==='function'?volunteerProfileName():(profile.name||state.currentSession?.email||t('role.volunteer'));
  const unit=application.unitName||String(application.unitId||'').replace(/^./,c=>c.toUpperCase());
  const text=window.OleiroPlanningShare?.buildText({heading:portalPlanningShareHeading(),name,statusLabel:portalPlanningShareStatus(),unit,start:application.stayStart,end:application.stayEnd,sessions,labels:{status:t('planning.share.status'),unit:t('planning.share.unit'),period:t('planning.share.period'),observation:t('planning.share.observation')}})||'';
  if(!text)return showToast(t('planning.share.none'));
  closeModal();window.OleiroPlanningShare.openWhatsApp(text);
};

function volunteerPlan(){
  const acts=volunteerActivities(),status=state.volunteerPlanStatus||'draft',approved=state.volunteerMode==='approved',editable=!approved&&candidatePlanningEditable(status);
  const dates=volunteerStayDates(),periodLabel=dates.length?`${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}`:t('portal.home.periodConfirm');
  const hours=((state.sessions||[]).reduce((sum,row)=>sum+(Number(row.duration)||60),0)/60).toFixed(1).replace('.',',');

  if(!approved){
    const active=activeCandidateSessions();
    let submitButton='';
    if(status==='submitted'){
      submitButton=`<div class="notice candidate-plan-sync-state"><i class="fa-solid fa-cloud-arrow-up"></i><div><strong>${escapeHtml(t('portal.profile.analysis'))}</strong><br>${escapeHtml(t('portal.home.submittedBody'))}</div></div>`;
    }else if(status!=='rejected'&&active.length){
      submitButton=`<button class="btn btn-primary btn-block candidate-plan-submit" type="button" onclick="submitPlan()"><i class="fa-solid fa-paper-plane"></i>${escapeHtml(status==='adjustments'?t('portal.plan.resendButton'):t('portal.plan.sendButton'))}</button>`;
    }else if(status!=='rejected'){
      submitButton=`<button class="btn btn-soft btn-block candidate-plan-submit" type="button" disabled><i class="fa-solid fa-circle-info"></i>${escapeHtml(t('portal.plan.addBeforeSend'))}</button>`;
    }
    return `<section class="section candidate-plan-refactor compact-page-top"><div class="candidate-plan-content">${volunteerAgendaContent(editable)}${portalPlanningShareBar()}</div>${submitButton}</section>`;
  }

  const notice=t('portal.plan.approvedNotice');
  const submitButton=`<button class="btn btn-soft btn-block" style="margin-top:12px" disabled><i class="fa-solid fa-circle-check"></i>${escapeHtml(t('portal.plan.approvedButton'))}</button>`;
  return `<section class="section volunteer-plan-page"><div class="plan-title-row"><div><h2>${escapeHtml(t('portal.plan.title'))}</h2><p>${escapeHtml(t('portal.plan.subtitle'))}</p></div><strong>${periodLabel}</strong></div><div class="notice"><i class="fa-solid fa-circle-info"></i><div>${escapeHtml(notice)}</div></div><div style="margin-top:14px">${volunteerAgendaContent(false)}${portalPlanningShareBar()}</div><div class="card plan-summary" style="margin-top:14px"><span class="eyebrow">${escapeHtml(t('portal.plan.summary'))}</span><div class="stat-row"><span class="stat-pill">${escapeHtml(t('portal.home.activitiesCount',{count:acts.length}))}</span><span class="stat-pill">${escapeHtml(t('portal.home.sessionsCount',{count:(state.sessions||[]).length}))}</span><span class="stat-pill">${escapeHtml(t('portal.plan.hoursPlanned',{hours}))}</span></div>${submitButton}</div></section>`;
}
function calendarMonthLabel(date){const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{month:'short'}).format(new Date(date+'T12:00:00')).replace('.','').toUpperCase()}
function volunteerDayAdjustment(date){const rows=state.currentApplication?.dayAdjustments;return rows&&typeof rows==='object'?rows[date]||null:null}
function openVolunteerDayAdjustment(date){const item=volunteerDayAdjustment(date);if(!item)return;openModal(t('portal.plan.adjustTitle',{date:fmtDate(date,true)}),t('portal.plan.guidance'),`<div class="notice warning"><i class="fa-solid fa-circle-info"></i><div data-no-i18n>${escapeHtml(item.note||t('portal.plan.adjustFallback'))}</div></div>`)}
function scrollToVolunteerDay(date){const target=document.getElementById(`vday-${date}`);if(!target)return;const header=document.querySelector('.app-header');const offset=(header?.getBoundingClientRect().height||70)+14;const top=window.scrollY+target.getBoundingClientRect().top-offset;window.scrollTo({top:Math.max(0,top),behavior:'smooth'})}
function volunteerAgendaContent(editable=false){
  const dates=volunteerStayDates();if(!dates.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>${escapeHtml(t('portal.plan.noPeriod'))}</div>`;
  return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="scrollToVolunteerDay('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${calendarMonthLabel(d)}</span></button>`).join('')}</div><div class="volunteer-plan-days">${dates.map(d=>{const ss=getSessions(d,true),adjustment=volunteerDayAdjustment(d);return `<div class="day-block" id="vday-${d}"><div class="day-title volunteer-day-title"><div><h3>${dayName(d)}, ${fmtDate(d)}</h3>${adjustment?`<span class="badge warning">${escapeHtml(t('portal.plan.adjust'))}</span>`:''}</div><div class="day-title-actions">${adjustment?`<button class="day-info-button" type="button" onclick="openVolunteerDayAdjustment('${d}')" aria-label="${escapeHtml(t('portal.plan.viewGuidance'))}"><i class="fa-solid fa-circle-info"></i></button>`:''}<span>${ss.length?`${(ss.reduce((x,s)=>x+(Number(s.activity.duration)||0),0)/60).toFixed(1).replace('.0','')}h`:''}</span></div></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')||`<div class="empty">${escapeHtml(t('portal.plan.noActivity'))}</div>`}${editable&&state.volunteerMode!=='approved'?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>${escapeHtml(t('action.addActivity'))}</button>`:''}</div>`}).join('')}</div>`;
}
function sessionCardVolunteer(s,editable){
  const [l,tone]=statusMeta(s.status);const candidateEdit=editable&&state.volunteerMode!=='approved';const approvedMove=editable&&state.volunteerMode==='approved';
  const actions=candidateEdit?`<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(s.activity.id)})'>${escapeHtml(t('action.edit'))}</button><button class="btn btn-outline" onclick='moveSession(${JSON.stringify(s.activity.id)},${JSON.stringify(s.date)},true)'>${escapeHtml(t('action.move'))}</button><button class="btn btn-danger-soft" onclick='requestDeletePlanningSession(${JSON.stringify(s.activity.id)},${JSON.stringify(s.date)})'>${escapeHtml(t('action.delete'))}</button></div>`:approvedMove?`<div class="activity-actions"><button class="btn btn-outline" onclick='moveSession(${JSON.stringify(s.activity.id)},${JSON.stringify(s.date)},true)'>${escapeHtml(t('action.requestChange'))}</button></div>`:'';
  const statusBadge=s.status==='proposed'&&state.volunteerMode!=='approved'?'':badge(l,tone);
  return `<div class="activity-card"><div class="activity-row"><div><h4 data-no-i18n>${escapeHtml(s.activity.name||'Atividade')}</h4><p>${Number(s.activity.duration)||0} min • ${escapeHtml(tValue(activityPeriodValue(s.raw||{},s.activity)))}</p></div>${statusBadge}</div>${actions}</div>`;
}
function syncVolunteerApplicationCounts(){if(!state.currentApplication)return;state.currentApplication.sessionCount=(state.sessions||[]).length;state.currentApplication.activityCount=(state.activities||[]).length}
function applySavedActivityResult(result,dates){
  if(!result)return;const activityId=String(result.activityId);state.sessions=(state.sessions||[]).filter(s=>String(s.activityId)!==activityId).concat(result.sessions||[]).sort(activityScheduleCompare);
  const activity={...(result.activity||{}),id:activityId,dates:[...dates]};const index=(state.activities||[]).findIndex(a=>String(a.id)===activityId);if(index>=0)state.activities[index]=activity;else state.activities.push(activity);if(state.volunteerMode!=='approved')syncVolunteerApplicationCounts();
}
function planningOwnerName(application,session){
  const names=Array.isArray(application?.participantNames)?application.participantNames.filter(Boolean):[];
  if((application?.type==='couple'||Number(application?.participantCount)===2)&&names.length)return names.join(' + ');
  return typeof volunteerProfileName==='function'?volunteerProfileName():(session?.profile?.name||session?.email||t('role.volunteer'));
}
async function saveActivity(id){
  const approved=state.volunteerMode==='approved',existing=id?(state.activities||[]).find(a=>String(a.id)===String(id)):null,postApprovalProposal=approved&&(!id||(existing?.postApprovalProposal===true&&existing?.reviewStatus==='adjustments'));
  if(approved&&!postApprovalProposal)return showToast(t('portal.activity.adjustLocked'));
  if(!approved&&!candidatePlanningEditable(state.volunteerPlanStatus||'draft'))return showToast(t('portal.activity.locked'));
  const dates=[...document.querySelectorAll('input[name="actDate"]:checked')].map(x=>x.value);const data={name:document.getElementById('actName')?.value.trim()||'',description:document.getElementById('actDesc')?.value.trim()||'',duration:+document.getElementById('actDuration')?.value||60,participation:document.getElementById('actParticipation')?.value||'Livre',materials:document.getElementById('actMaterials')?.value.trim()||'Nenhum',notes:document.getElementById('actNotes')?.value.trim()||'',period:document.getElementById('actPeriod')?.value||'Sem preferência'};
  if(!data.name)return showToast(t('portal.activity.nameRequired'));if(!dates.length)return showToast(t('portal.activity.dateRequired'));const application=state.currentApplication,session=state.currentSession;if(!application?.id||!session?.uid)return showToast(t('portal.plan.invalidSession'));const ownerName=planningOwnerName(application,session);
  try{const result=await window.OleiroServices.planning.saveActivity({activityId:id,applicationId:application.id,unitId:application.unitId,createdByUid:session.uid,ownerName,data,dates,existingSessions:state.sessions||[],postApprovalProposal});applySavedActivityResult(result,dates);closeModal();render();showToast(approved?(id?t('portal.activity.adjusted'):t('portal.activity.proposed')):(id?t('portal.activity.updated'):t('portal.activity.saved')))}catch(error){console.error(error);showToast(error?.message||t('portal.activity.saveError'))}
}
function requestDeletePlanningSession(activityId,date){const session=realSessionFor(activityId,date);const activity=(state.activities||[]).find(a=>String(a.id)===String(activityId));if(!session)return showToast(t('portal.activity.deleteError'));const postAdjustment=state.volunteerMode==='approved'&&activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments';if(state.volunteerMode==='approved'&&!postAdjustment)return showToast(t('portal.activity.adjustLocked'));openModal(t('portal.activity.deleteTitle'),`${escapeHtml(activity?.name||'Atividade')} • ${fmtDate(date,true)}`,`<div class="notice warning"><i class="fa-solid fa-trash"></i><div>${escapeHtml(t('portal.activity.deleteBody'))}</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" onclick="closeModal()">${escapeHtml(t('common.cancel'))}</button><button class="btn btn-danger" onclick='deletePlanningSession(${JSON.stringify(activityId)},${JSON.stringify(date)})'>${escapeHtml(t('action.delete'))}</button></div>`)}
async function deletePlanningSession(activityId,date){const session=realSessionFor(activityId,date),application=state.currentApplication;if(!session||!application?.id)return showToast(t('portal.activity.deleteError'));try{const result=await window.OleiroServices.planning.deleteSession(session.id,{applicationId:application.id,activityId});state.sessions=(state.sessions||[]).filter(s=>String(s.id)!==String(session.id));if(result.deletedActivity)state.activities=(state.activities||[]).filter(a=>String(a.id)!==String(activityId));else{const activity=(state.activities||[]).find(a=>String(a.id)===String(activityId));if(activity)activity.dates=(activity.dates||[]).filter(d=>d!==date)}if(state.volunteerMode!=='approved')syncVolunteerApplicationCounts();closeModal();render();showToast(t('portal.activity.deleted'))}catch(error){console.error(error);showToast(error?.message||t('portal.activity.deleteError'))}}
async function submitPlan(){
  const acts=volunteerActivities();if(!acts.length||(state.sessions||[]).length===0)return showToast(t('portal.plan.addBeforeSend'));const application=state.currentApplication;if(!application?.id)return showToast(t('portal.plan.applicationMissing'));const wasAdjustment=state.volunteerPlanStatus==='adjustments';
  try{await window.OleiroServices.applications.submitPlanning(application.id,{wasAdjustment});application.status='analysis';application.planningSubmittedAt=new Date().toISOString();if(state.currentSession)state.currentSession.application=application;state.volunteerPlanStatus='submitted';render();showToast(wasAdjustment?t('portal.plan.resentToast'):t('portal.plan.sentToast'))}catch(error){console.error(error);showToast(error?.message||t('portal.plan.sendError'))}
}
function openQuickSession(date=null){openActivityModal(date||volunteerStayDates()[0]||null)}
