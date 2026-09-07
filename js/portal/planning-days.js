/* Round 17/28 — candidato e voluntário veem somente dias elegíveis; 10 dias úteis por página. */
(function planningDaysR17Portal(){
  const PAGE_SIZE=10;
  const CACHE_MS=5*60*1000;
  const baseOpenActivityModal=openActivityModal;

  state.volunteerAgendaPageCache=state.volunteerAgendaPageCache||{};

  function planningDates(){return typeof planningEligibleDatesFor==='function'?planningEligibleDatesFor(state.currentApplication||{}):[]}
  function pageCount(){return Math.max(1,Math.ceil(planningDates().length/PAGE_SIZE))}
  function pageIndex(){return Math.max(0,Math.min(Number(state.volunteerAgendaPageIndex)||0,pageCount()-1))}
  function currentDates(){const rows=planningDates(),start=pageIndex()*PAGE_SIZE;return rows.slice(start,start+PAGE_SIZE)}
  function cacheKey(index=pageIndex()){return `${String(state.currentApplication?.id||'')}|eligible|${index}`}
  function pageNav(){
    const rows=planningDates(),pages=Math.ceil(rows.length/PAGE_SIZE),index=pageIndex(),dates=currentDates();
    if(pages<=1||!dates.length)return '';
    return `<div class="agenda-page-nav"><button class="icon-btn" type="button" onclick="changeVolunteerPlanPage(${index-1})" ${index<=0?'disabled':''} aria-label="${escapeHtml(t('portal.nav.planning'))} ${Math.max(1,index)}"><i class="fa-solid fa-chevron-left"></i></button><strong>${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}</strong><span>${index+1}/${pages}</span><button class="icon-btn" type="button" onclick="changeVolunteerPlanPage(${index+1})" ${index>=pages-1?'disabled':''} aria-label="${escapeHtml(t('portal.nav.planning'))} ${Math.min(pages,index+2)}"><i class="fa-solid fa-chevron-right"></i></button></div>`;
  }
  function calendarStrip(dates){return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="scrollToVolunteerDay('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${calendarMonthLabel(d)}</span></button>`).join('')}</div>`}
  function loadingState(){return `<div class="empty compact-loading agenda-inline-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>${escapeHtml(t('common.loadingActivities'))}</div>`}
  function applyLoadedSessions(application,sessions){
    state.sessions=sessions||[];state.activities=portalPlanActivities(application,state.sessions);state.sessionStatus={};state.sessionGroups={};
    state.sessions.forEach(session=>{if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}});
    state.volunteerPlanningLoadedFor=String(application.id);state.volunteerPlanningFailedFor=null;
  }

  volunteerAgendaContent=function(editable=false){
    const stay=volunteerStayDates();if(!stay.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>${escapeHtml(t('portal.plan.noPeriod'))}</div>`;
    const all=planningDates();if(!all.length)return `<div class="empty"><i class="fa-regular fa-calendar-check"></i>${escapeHtml(t('portal.plan.noActivity'))}</div>`;
    const dates=currentDates(),applicationId=String(state.currentApplication?.id||''),top=`${calendarStrip(dates)}${pageNav()}`;
    if(state.volunteerAgendaLoading===true||(!state.volunteerPlanningFailedFor&&state.volunteerPlanningLoadedFor!==applicationId))return top+loadingState();
    if(state.volunteerPlanningFailedFor===applicationId)return `${top}<div class="empty"><i class="fa-solid fa-triangle-exclamation"></i>${escapeHtml(t('portal.agenda.loadError'))}<button class="btn btn-soft" style="margin-top:10px" type="button" onclick="hydrateVolunteerPlanning(state.currentApplication,{force:true}).then(()=>render()).catch(()=>showToast(t('portal.agenda.loadError')))">${escapeHtml(t('common.retry'))}</button></div>`;
    return `${top}<div class="volunteer-plan-days">${dates.map(d=>{const ss=getSessions(d,true),adjustment=volunteerDayAdjustment(d);return `<div class="day-block" id="vday-${d}"><div class="day-title volunteer-day-title"><div><h3>${dayName(d)}, ${fmtDate(d)}</h3>${adjustment?`<span class="badge warning">${escapeHtml(t('portal.plan.adjust'))}</span>`:''}</div><div class="day-title-actions">${adjustment?`<button class="day-info-button" type="button" onclick="openVolunteerDayAdjustment('${d}')" aria-label="${escapeHtml(t('portal.plan.viewGuidance'))}"><i class="fa-solid fa-circle-info"></i></button>`:''}<span>${ss.length?`${(ss.reduce((x,s)=>x+(Number(s.activity.duration)||0),0)/60).toFixed(1).replace('.0','')}h`:''}</span></div></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')||`<div class="empty">${escapeHtml(t('portal.plan.noActivity'))}</div>`}${editable?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>${escapeHtml(t('action.addActivity'))}</button>`:''}</div>`}).join('')}</div>`;
  };

  window.changeVolunteerPlanPage=async function(targetIndex){
    const pages=pageCount(),index=Math.max(0,Math.min(Number(targetIndex)||0,pages-1));
    if(index===pageIndex())return;
    if(state.volunteerMode==='approved')return window.loadVolunteerAgendaPage(index);
    state.volunteerAgendaPageIndex=index;render();scrollPageTop?.();
  };

  window.loadVolunteerAgendaPage=async function(targetIndex){
    const application=state.currentApplication,all=planningDates(),pages=Math.max(1,Math.ceil(all.length/PAGE_SIZE)),index=Math.max(0,Math.min(Number(targetIndex)||0,pages-1)),dates=all.slice(index*PAGE_SIZE,index*PAGE_SIZE+PAGE_SIZE);
    if(!application?.id||!dates.length||state.volunteerAgendaLoading)return;
    state.volunteerAgendaPageIndex=index;
    const cached=state.volunteerAgendaPageCache[cacheKey(index)];
    if(cached&&Date.now()-cached.at<CACHE_MS){applyLoadedSessions(application,cached.sessions);render();scrollPageTop?.();return}
    state.volunteerAgendaLoading=true;render();
    try{
      const sessions=await window.OleiroServices.planning.listSessions({applicationId:application.id,from:dates[0],to:dates[dates.length-1]});
      applyLoadedSessions(application,sessions||[]);state.volunteerAgendaPageCache[cacheKey(index)]={at:Date.now(),sessions:(sessions||[]).map(row=>({...row}))};
    }catch(error){console.error(error);state.volunteerPlanningFailedFor=String(application.id);showToast(t('portal.agenda.loadError'))}
    finally{state.volunteerAgendaLoading=false;render();scrollPageTop?.()}
  };

  openActivityModal=function(date=null,id=null){
    const eligible=planningDates();if(!eligible.length)return showToast(t('portal.move.noOtherDate'));
    const safeDate=eligible.includes(String(date||''))?String(date):eligible[0],result=baseOpenActivityModal(safeDate,id);
    modalRoot.querySelectorAll('input[name="actDate"]').forEach(input=>{if(!eligible.includes(input.value))input.closest('label')?.remove()});
    const grid=modalRoot.querySelector('.activity-date-grid');if(grid&&!grid.querySelector('input[name="actDate"]'))grid.innerHTML=`<div class="empty">${escapeHtml(t('portal.move.noOtherDate'))}</div>`;
    return result;
  };

  window.openActivityModal=openActivityModal;window.volunteerAgendaContent=volunteerAgendaContent;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();