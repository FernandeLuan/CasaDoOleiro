function candidatePlanningEditable(status=state.volunteerPlanStatus||'draft'){
  return window.OleiroRules?.candidatePlanningEditable?.(status)??['draft','submitted','adjustments'].includes(String(status||'draft'));
}

function portalStoredOption(value,current){return `<option value="${escapeHtml(value)}" ${current===value?'selected':''}>${escapeHtml(typeof tValue==='function'?tValue(value):value)}</option>`}
function openActivityModal(date=null,id=null){
  const approved=state.volunteerMode==='approved',a=id?state.activities.find(x=>String(x.id)===String(id)):null,postApprovalEdit=approved&&a?.postApprovalProposal===true&&a?.reviewStatus==='adjustments';
  if(approved&&id&&!postApprovalEdit)return showToast(t('portal.activity.adjustLocked'));
  const candidateEditable=window.OleiroRules?.candidatePlanningEditable?.(state.volunteerPlanStatus||'draft')??['draft','submitted','adjustments'].includes(state.volunteerPlanStatus||'draft');
  if(!approved&&!candidateEditable)return showToast(t('portal.activity.locked'));
  const availableDates=volunteerStayDates(),defaultDate=date||availableDates[0]||'',participation=a?.participation||'',period=activityPeriodValue(a||{});
  const body=`<div class="form-grid activity-modal-form">${postApprovalEdit&&a?.reviewNote?`<div class="notice warning"><i class="fa-solid fa-rotate"></i><div><strong>${escapeHtml(t('portal.activity.adjustRequested'))}</strong><br><span data-no-i18n>${escapeHtml(a.reviewNote)}</span></div></div>`:''}<div class="field"><label for="actName">${escapeHtml(t('portal.activity.name'))}</label><input id="actName" class="input" value="${escapeHtml(a?.name||'')}" placeholder="${escapeHtml(t('portal.activity.namePlaceholder'))}"></div><div class="field"><label for="actDesc">${escapeHtml(t('portal.activity.description'))}</label><textarea id="actDesc" class="textarea" placeholder="${escapeHtml(t('portal.activity.descriptionPlaceholder'))}">${escapeHtml(a?.description||'')}</textarea></div><div class="field-row"><div class="field"><label for="actDuration">${escapeHtml(t('portal.activity.duration'))}</label><select id="actDuration" class="select">${[30,60,90,120].map(v=>`<option value="${v}" ${a&&Number(a.duration)===v?'selected':''}>${v===90?'1h30':v===120?'2h':v+' min'}</option>`).join('')}</select></div><div class="field"><label for="actParticipation">${escapeHtml(t('portal.activity.participation'))}</label><select id="actParticipation" class="select">${['Até 5','Até 10','Livre','Outro'].map(v=>portalStoredOption(v,participation)).join('')}</select></div></div><div class="field"><label for="actMaterials">${escapeHtml(t('portal.activity.materials'))}</label><input id="actMaterials" class="input" value="${escapeHtml(a?.materials||'')}" placeholder="${escapeHtml(t('portal.activity.materialsPlaceholder'))}"></div><div class="field"><label for="actNotes">${escapeHtml(t('portal.activity.notes'))}</label><textarea id="actNotes" class="textarea" placeholder="${escapeHtml(t('portal.activity.notesPlaceholder'))}">${escapeHtml(a?.notes||'')}</textarea></div><div class="field"><label for="actPeriod">${escapeHtml(t('portal.activity.period'))}</label><select id="actPeriod" class="select">${['Sem preferência','Manhã','Tarde','Noite'].map(v=>portalStoredOption(v,period)).join('')}</select></div><div class="field"><label>${escapeHtml(t('portal.activity.dates'))}</label><div class="check-grid activity-date-grid">${availableDates.length?availableDates.map(d=>`<label class="check-card"><input type="checkbox" name="actDate" value="${d}" ${(a&&Array.isArray(a.dates)&&a.dates.includes(d))||(!a&&d===defaultDate)?'checked':''}><span>${dayName(d)} ${fmtDate(d,true)}</span></label>`).join(''):`<div class="empty">${escapeHtml(t('portal.activity.noStayPeriod'))}</div>`}</div></div></div>`;
  const label=approved?(a?t('action.resendReview'):t('action.sendReview')):(a?t('action.saveChanges'):t('action.addActivity'));
  const title=approved?(a?t('portal.activity.adjustTitle'):t('portal.activity.newProposal')):(a?t('portal.activity.editTitle'):t('portal.activity.newTitle'));
  const subtitle=approved?t('portal.activity.proposalSubtitle'):a?t('portal.activity.editSubtitle'):t('portal.activity.baseSubtitle');
  const footer=`<button class="btn btn-primary btn-block" type="button" onclick='saveActivity(${a?JSON.stringify(a.id):'null'})'>${escapeHtml(label)}</button>`;openModal(escapeHtml(title),escapeHtml(subtitle),body,footer);modalRoot.querySelector('.modal')?.classList.add('activity-modal');
}
const PORTAL_SHARE_COOLDOWN_MS=60*1000;
function portalShareCooldownKey(){return 'oleiro.portal.whatsapp.'+String(state.currentApplication?.id||'no-application')}
function portalShareCooldownUntil(){
  try{return Number(sessionStorage.getItem(portalShareCooldownKey())||0)||0}catch{return 0}
}
function portalShareableSession(row){
  if(!row||!String(row.activityId||'').trim()||!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date||'')))return false;
  const status=String(row.status||'proposed').toLowerCase(),review=String(row.reviewStatus||'').toLowerCase();
  return !['rejected','cancelled','canceled','deleted','inactive','removed'].includes(status)
    && !['rejected','cancelled','canceled','deleted','inactive','removed'].includes(review);
}
function activeCandidateSessions(){
  const rows=Array.isArray(state.sessions)?state.sessions:[];
  return rows.filter(portalShareableSession);
}
function portalPlanningShareAllowed(){const application=state.currentApplication||{};return application.status!=='rejected'&&application.active!==false&&!application.inactive}
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
function portalShareButtonState(){
  const hasActive=activeCandidateSessions().length>0;
  const remaining=Math.max(0,portalShareCooldownUntil()-Date.now());
  if(!hasActive)return {disabled:true,label:t('planning.share.whatsapp'),hint:'Adicione pelo menos uma atividade válida para habilitar o compartilhamento.'};
  if(remaining<=0)return {disabled:false,label:t('planning.share.whatsapp'),hint:''};
  const seconds=Math.ceil(remaining/1000),minutes=Math.floor(seconds/60),rest=String(seconds%60).padStart(2,'0');
  return {disabled:true,label:'Compartilhado',hint:`Você poderá compartilhar novamente em ${minutes}:${rest}.`};
}
function portalPlanningShareBar(){
  if(!portalPlanningShareAllowed()||activeCandidateSessions().length===0)return '';
  const button=portalShareButtonState(),disabled=button.disabled;
  const label=button.label;
  const hint=button.hint;
  /* O HTML é inserido depois desta função; sincronizar no próximo ciclo evita
     perder o cooldown quando a tela é reconstruída ou restaurada pelo BFCache. */
  setTimeout(syncPortalShareCooldownTimer,0);
  return `<div class="planning-share-bar portal-planning-share-bar"><button id="portalPlanningShareButton" class="planning-share-action ${button.disabled?'is-complete':''}" type="button" onclick="sharePortalPlanningWhatsApp()" ${disabled?'disabled aria-disabled="true"':''}><i class="fa-brands fa-whatsapp"></i><span>${escapeHtml(label)}</span></button>${hint?`<small class="planning-share-disabled-hint">${escapeHtml(hint)}</small>`:''}</div>`;
}
function syncPortalShareCooldownTimer(){
  if(window.__oleiroPortalShareTimer){clearInterval(window.__oleiroPortalShareTimer);window.__oleiroPortalShareTimer=null}
  const update=()=>{
    const button=document.getElementById('portalPlanningShareButton');
    if(!button)return false;
    const status=portalShareButtonState();
    button.disabled=status.disabled;button.setAttribute('aria-disabled',String(status.disabled));
    const label=button.querySelector('span');if(label)label.textContent=status.label;
    let hint=button.parentElement?.querySelector('.planning-share-disabled-hint');
    if(status.hint){if(!hint){hint=document.createElement('small');hint.className='planning-share-disabled-hint';button.parentElement.appendChild(hint)}hint.textContent=status.hint}
    else if(hint)hint.remove();
    button.classList.toggle('is-complete',status.disabled&&activeCandidateSessions().length>0);
    return true;
  };
  /* Sempre recalcula imediatamente: ao voltar do WhatsApp/Safari, o navegador
     pode ter congelado o interval e o prazo pode já ter expirado. */
  if(!update())return;
  if(portalShareCooldownUntil()>Date.now())window.__oleiroPortalShareTimer=setInterval(()=>{
    if(!update()||portalShareCooldownUntil()<=Date.now()){
      if(window.__oleiroPortalShareTimer)clearInterval(window.__oleiroPortalShareTimer);
      window.__oleiroPortalShareTimer=null;
    }
  },1000);
}
function startPortalShareCooldown(){
  const until=Date.now()+PORTAL_SHARE_COOLDOWN_MS;
  try{sessionStorage.setItem(portalShareCooldownKey(),String(until))}catch{}
  syncPortalShareCooldownTimer();
}
window.syncPortalShareCooldownTimer=syncPortalShareCooldownTimer;
/* Retorno de app externo, troca de aba e restauração de página congelada. */
window.addEventListener('pageshow',syncPortalShareCooldownTimer);
window.addEventListener('focus',syncPortalShareCooldownTimer);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPortalShareCooldownTimer()});
window.sharePortalPlanningWhatsApp=function(){
  if(!portalPlanningShareAllowed())return showToast(t('planning.share.none'));
  const sessions=activeCandidateSessions();
  if(!sessions.length)return showToast(t('planning.share.none'));
  if(portalShareCooldownUntil()>Date.now())return showToast('Aguarde um minuto para compartilhar novamente.');
  const application=state.currentApplication||{},profile=state.currentSession?.profile||{},name=typeof volunteerProfileName==='function'?volunteerProfileName():(profile.name||state.currentSession?.email||t('role.volunteer'));
  const unit=application.unitName||String(application.unitId||'').replace(/^./,c=>c.toUpperCase());
  const text=window.OleiroPlanningShare?.buildText({heading:portalPlanningShareHeading(),name,statusLabel:portalPlanningShareStatus(),unit,start:application.stayStart,end:application.stayEnd,sessions,labels:{status:t('planning.share.status'),unit:t('planning.share.unit'),period:t('planning.share.period'),observation:t('planning.share.observation')}})||'';
  if(!text)return showToast(t('planning.share.none'));
  const popup=window.OleiroPlanningShare?.reservePopup?.()||null;
  let opened=false;
  try{opened=window.OleiroPlanningShare?.openWhatsApp?.(text,{popup})===true}catch(error){console.error('Falha ao abrir WhatsApp:',error)}
  if(!opened){window.OleiroPlanningShare?.closePopup?.(popup);return showToast('O navegador bloqueou a abertura do WhatsApp. Permita pop-ups ou tente novamente.')}
  startPortalShareCooldown();
};

function volunteerPlan(){
  const acts=volunteerActivities(),status=state.volunteerPlanStatus||'draft',approved=state.volunteerMode==='approved',editable=approved||candidatePlanningEditable(status);
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
  return `<section class="section volunteer-plan-page"><div class="plan-title-row"><div><h2>${escapeHtml(t('portal.plan.title'))}</h2><p>${escapeHtml(t('portal.plan.subtitle'))}</p></div><strong>${periodLabel}</strong></div><div class="notice"><i class="fa-solid fa-circle-info"></i><div>${escapeHtml(notice)}</div></div><div style="margin-top:14px">${volunteerAgendaContent(true)}${portalPlanningShareBar()}</div><div class="card plan-summary" style="margin-top:14px"><span class="eyebrow">${escapeHtml(t('portal.plan.summary'))}</span><div class="stat-row"><span class="stat-pill">${escapeHtml(t('portal.home.activitiesCount',{count:acts.length}))}</span><span class="stat-pill">${escapeHtml(t('portal.home.sessionsCount',{count:(state.sessions||[]).length}))}</span><span class="stat-pill">${escapeHtml(t('portal.plan.hoursPlanned',{hours}))}</span></div>${submitButton}</div></section>`;
}
function calendarMonthLabel(date){const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{month:'short'}).format(new Date(date+'T12:00:00')).replace('.','').toUpperCase()}
function volunteerDayAdjustment(date){const rows=state.currentApplication?.dayAdjustments;return rows&&typeof rows==='object'?rows[date]||null:null}
function openVolunteerDayAdjustment(date){const item=volunteerDayAdjustment(date);if(!item)return;openModal(t('portal.plan.adjustTitle',{date:fmtDate(date,true)}),t('portal.plan.guidance'),`<div class="notice warning"><i class="fa-solid fa-circle-info"></i><div data-no-i18n>${escapeHtml(item.note||t('portal.plan.adjustFallback'))}</div></div>`)}
function scrollToVolunteerDay(date){const target=document.getElementById(`vday-${date}`);if(!target)return;const header=document.querySelector('.app-header');const offset=(header?.getBoundingClientRect().height||70)+14;const top=window.scrollY+target.getBoundingClientRect().top-offset;window.scrollTo({top:Math.max(0,top),behavior:'smooth'})}
function volunteerAgendaContent(editable=false){
  const dates=volunteerStayDates();if(!dates.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>${escapeHtml(t('portal.plan.noPeriod'))}</div>`;
  return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="scrollToVolunteerDay('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${calendarMonthLabel(d)}</span></button>`).join('')}</div><div class="volunteer-plan-days">${dates.map(d=>{const ss=getSessions(d,true),adjustment=volunteerDayAdjustment(d);return `<div class="day-block" id="vday-${d}"><div class="day-title volunteer-day-title"><div><h3>${dayName(d)}, ${fmtDate(d)}</h3>${adjustment?`<span class="badge warning">${escapeHtml(t('portal.plan.adjust'))}</span>`:''}</div><div class="day-title-actions">${adjustment?`<button class="day-info-button" type="button" onclick="openVolunteerDayAdjustment('${d}')" aria-label="${escapeHtml(t('portal.plan.viewGuidance'))}"><i class="fa-solid fa-circle-info"></i></button>`:''}<span>${ss.length?`${(ss.reduce((x,s)=>x+(Number(s.activity.duration)||0),0)/60).toFixed(1).replace('.0','')}h`:''}</span></div></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')||`<div class="empty">${escapeHtml(t('portal.plan.noActivity'))}</div>`}${editable?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>${escapeHtml(t('action.addActivity'))}</button>`:''}</div>`}).join('')}</div>`;
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
