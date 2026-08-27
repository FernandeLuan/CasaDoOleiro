/* Round 18 — detalhe do voluntário em Planejamento/Conta, planejamento lazy e Ocupação como tela. */
(function refactorR18Admin(){
  const PLAN_PAGE_SIZE=10;
  const PLAN_CACHE_MS=5*60*1000;
  const ACCOUNT_CACHE_MS=2*60*1000;
  const OCCUPANCY_CACHE_MS=5*60*1000;
  const baseNavigateManager=navigateManager;
  const baseInvalidateCandidatePlanning=invalidateCandidatePlanning;

  state.adminPlanPageIndex=state.adminPlanPageIndex||{};
  state.adminPlanPageCache=state.adminPlanPageCache||{};
  state.adminPlanLoading=state.adminPlanLoading||{};
  state.adminAccountReadAt=state.adminAccountReadAt||{};
  state.participantAccessCache=state.participantAccessCache||{};
  state.occupancyScreenCache=state.occupancyScreenCache||{};
  state.occupancyScreenLoading=false;
  state.occupancyScreenError='';
  state.occupancyScreenMonth=state.occupancyScreenMonth||String(_oleiroToday||new Date().toISOString().slice(0,10)).slice(0,7);

  function safe(value){return encodeURIComponent(String(value??''))}
  function personStatus(p){const [label,type]=statusMeta(p.status);return {label,type}}
  function personDates(p){return {start:String(p?.stayStart||p?.from||'').slice(0,10),end:String(p?.stayEnd||p?.to||'').slice(0,10)}}
  function eligibleDates(p){const {start,end}=personDates(p);return typeof planningEligibleDates==='function'?planningEligibleDates(start,end):[]}
  function pageCount(p){return Math.max(1,Math.ceil(eligibleDates(p).length/PLAN_PAGE_SIZE))}
  function pageIndex(p){const max=pageCount(p)-1,key=String(p.id),value=Number(state.adminPlanPageIndex[key])||0;return Math.max(0,Math.min(value,max))}
  function pageDates(p,index=pageIndex(p)){const dates=eligibleDates(p),start=index*PLAN_PAGE_SIZE;return dates.slice(start,start+PLAN_PAGE_SIZE)}
  function pageKey(p,index=pageIndex(p)){const dates=pageDates(p,index);return `${p.id}|${index}|${dates[0]||''}|${dates[dates.length-1]||''}`}
  function accessCache(p){return state.participantAccessCache[String(p.id)]||null}

  function activityFromSession(p,row){return {
    id:String(row.activityId||''),applicationId:String(p.id),name:row.activityName||'Atividade',description:row.activityDescription||'',
    duration:Number(row.duration)||60,participation:row.participation||'Livre',materials:row.materials||'',notes:row.notes||'',
    period:row.period||'Sem preferência',time:row.time||'',ownerName:row.ownerName||p.name||'Voluntário',createdByUid:row.createdByUid||'',
    postApprovalProposal:row.postApprovalProposal===true,reviewStatus:row.reviewStatus||'',reviewNote:row.reviewNote||'',dates:[]
  }}
  function normalizePlanRows(p,rows){
    const activities=new Map();
    const sessions=(rows||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected').map(row=>{
      const id=String(row.activityId||'');let activity=activities.get(id);
      if(!activity){activity=activityFromSession(p,row);activities.set(id,activity)}
      if(row.date&&!activity.dates.includes(row.date))activity.dates.push(row.date);
      return {...row,activity};
    }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
    activities.forEach(activity=>activity.dates.sort());
    return {sessions,activities:[...activities.values()]};
  }
  function applyPageCache(p,cache){
    state.currentPlanningApplicationId=String(p.id);state.sessions=cache?.sessions||[];state.activities=cache?.activities||[];
    state.sessionStatus={};state.sessionGroups={};
    state.sessions.forEach(session=>{if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}});
    state.candidatePlanningCache[String(p.id)]={activities:state.activities,sessions:state.sessions,at:cache?.at||Date.now(),partial:true,pageIndex:cache?.pageIndex||0};
  }
  function clearPlanPages(id){Object.keys(state.adminPlanPageCache).forEach(key=>{if(key.startsWith(`${id}|`))delete state.adminPlanPageCache[key]});delete state.adminPlanLoading[String(id)]}
  invalidateCandidatePlanning=function(id){clearPlanPages(String(id));return baseInvalidateCandidatePlanning(id)};

  async function hydrateAdminPlanPage(p,index=pageIndex(p),{force=false}={}){
    if(!p?.id||!window.OleiroServices?.planning?.listSessions)return null;
    const dates=pageDates(p,index),key=pageKey(p,index),cached=state.adminPlanPageCache[key];
    state.adminPlanPageIndex[String(p.id)]=index;
    if(!force&&cached&&Date.now()-cached.at<PLAN_CACHE_MS){applyPageCache(p,cached);return cached}
    if(state.adminPlanLoading[String(p.id)])return state.adminPlanLoading[String(p.id)];
    if(!dates.length){const empty={at:Date.now(),pageIndex:index,dates:[],sessions:[],activities:[]};state.adminPlanPageCache[key]=empty;applyPageCache(p,empty);return empty}
    state.adminPlanLoading[String(p.id)]=window.OleiroServices.planning.listSessions({applicationId:p.id,from:dates[0],to:dates[dates.length-1]}).then(rows=>{
      const normalized=normalizePlanRows(p,rows),cache={...normalized,at:Date.now(),pageIndex:index,dates:[...dates]};state.adminPlanPageCache[key]=cache;applyPageCache(p,cache);return cache;
    }).finally(()=>{delete state.adminPlanLoading[String(p.id)]});
    return state.adminPlanLoading[String(p.id)];
  }

  hydrateCandidatePlanning=async function(applicationId,{force=false}={}){
    const p=candidateById(applicationId);if(!p)return null;return hydrateAdminPlanPage(p,pageIndex(p),{force});
  };

  function planHeader(p){
    const {start,end}=personDates(p),status=personStatus(p),deadline=p.status==='pending'&&typeof candidateDeadlineMeta==='function'?candidateDeadlineMeta(p):null;
    const parts=[start&&end?`${fmtDate(start,true)}–${fmtDate(end,true)}`:'Período não informado',p.unit||p.unitName||'Unidade não informada',status.label];
    if(deadline)parts.push(deadline.label);
    return `<div class="person-plan-summary"><span>${parts.map(escapeHtml).join(' <b>·</b> ')}</span></div>`;
  }
  function planPageNav(p){
    const dates=pageDates(p),index=pageIndex(p),pages=pageCount(p);if(pages<=1||!dates.length)return '';
    return `<div class="admin-plan-page-nav"><button class="icon-btn" type="button" onclick="loadAdminPlanningPage('${safe(p.id)}',${index-1})" ${index<=0?'disabled':''} aria-label="Dias anteriores"><i class="fa-solid fa-chevron-left"></i></button><strong>${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}</strong><span>${index+1}/${pages}</span><button class="icon-btn" type="button" onclick="loadAdminPlanningPage('${safe(p.id)}',${index+1})" ${index>=pages-1?'disabled':''} aria-label="Próximos dias"><i class="fa-solid fa-chevron-right"></i></button></div>`;
  }
  function emptyPlanningDay(p,date){
    const adjustment=candidateDayAdjustment(p,date),id=safe(p.id),dateArg=safe(date),canAdjust=['analysis','adjustments'].includes(p.status);
    return `<details class="card planning-day-card" data-plan-date="${escapeHtml(date)}"><summary class="planning-day-head"><div class="planning-day-date"><strong>${fmtDate(date,true)} ${String(dayName(date)||'').slice(0,3).toLowerCase()}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>0min</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="empty admin-empty-planning-day">Nenhuma atividade neste dia.</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  }
  function reviewFooter(p){
    if(!['analysis','adjustments'].includes(p.status))return '';
    const id=safe(p.id);
    return `<div class="admin-plan-review-footer"><button class="btn btn-primary" type="button" onclick="approveCandidate(decodeURIComponent('${id}'))"><i class="fa-solid fa-check"></i>Aprovar planejamento</button><button class="btn btn-soft" type="button" onclick="openGeneralPlanningAdjustment('${id}')"><i class="fa-solid fa-rotate"></i>Solicitar ajustes</button><button class="btn btn-danger-soft" type="button" onclick="rejectCandidate(decodeURIComponent('${id}'))"><i class="fa-solid fa-xmark"></i>Recusar</button></div>`;
  }
  function planningContent(p){
    const dates=pageDates(p),key=pageKey(p),cache=state.adminPlanPageCache[key],loading=!!state.adminPlanLoading[String(p.id)];
    if(!eligibleDates(p).length)return `${planHeader(p)}<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Não há dias úteis de atividade entre chegada e saída.</div>`;
    if(!cache||loading)return `${planHeader(p)}${planPageNav(p)}<div class="empty compact-loading admin-plan-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>`;
    applyPageCache(p,cache);
    const byDate=new Map();cache.sessions.forEach(session=>{const rows=byDate.get(session.date)||[];rows.push(session);byDate.set(session.date,rows)});
    const dayCards=dates.map(date=>{const sessions=(byDate.get(date)||[]).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));return sessions.length?adminPlanningDayCard(p,{date,sessions}):emptyPlanningDay(p,date)}).join('');
    return `${planHeader(p)}${planPageNav(p)}<div class="planning-by-day admin-refactor-planning">${dayCards}</div>${reviewFooter(p)}`;
  }

  function contactRows(p){
    const names=Array.isArray(p.participantNames)&&p.participantNames.length?p.participantNames:[p.name||'Voluntário'];
    const emails=Array.isArray(p.participantEmails)&&p.participantEmails.length?p.participantEmails:String(p.email||'').split(',').map(v=>v.trim()).filter(Boolean);
    const phones=Array.isArray(p.participantPhones)&&p.participantPhones.length?p.participantPhones:String(p.phone||'').split('/').map(v=>v.trim()).filter(Boolean);
    const countries=Array.isArray(p.participantCountries)&&p.participantCountries.length?p.participantCountries:[p.country||'—'];
    return names.map((name,index)=>({name,email:emails[index]||'—',phone:phones[index]||'—',country:countries[index]||'—'}));
  }
  function accessRows(p){
    const uids=Array.isArray(p.participantUids)?p.participantUids:[],names=Array.isArray(p.participantNames)?p.participantNames:[],emails=Array.isArray(p.participantEmails)?p.participantEmails:[],cache=accessCache(p);
    if(!uids.length)return '<div class="empty">Nenhum acesso vinculado.</div>';
    if(!cache)return '<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando acessos...</div>';
    return uids.map((uid,index)=>{const access=cache[String(uid)]||{},email=emails[index]||access.email||'',name=names[index]||p.name||'Voluntário',first=access.firstPortalAccessAt;return `<div class="account-access-row"><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(email||'—')}</span><small>${first?'Primeiro acesso realizado':'Ainda não acessou o portal'}</small></div>${!first?`<button class="btn btn-outline btn-xs" type="button" onclick="requestVolunteerEmailEdit('${safe(p.id)}','${safe(uid)}')"><i class="fa-solid fa-pen"></i>Editar e-mail</button>`:''}</div>`}).join('');
  }
  function accountLifecycle(p){
    const id=safe(p.id);
    if(p.status==='rejected')return `<button class="btn btn-soft btn-block" type="button" onclick="reactivateCandidate(decodeURIComponent('${id}'))"><i class="fa-solid fa-rotate-left"></i>Reativar perfil</button>`;
    if(p.status==='pending')return `<button class="btn btn-danger-soft btn-block" type="button" onclick="requestRejectPendingCandidate(decodeURIComponent('${id}'))"><i class="fa-solid fa-user-slash"></i>Inativar perfil</button>`;
    if(['analysis','adjustments'].includes(p.status))return `<button class="btn btn-danger-soft btn-block" type="button" onclick="rejectCandidate(decodeURIComponent('${id}'))"><i class="fa-solid fa-user-slash"></i>Inativar perfil</button>`;
    if(p.status==='approved')return `<button class="btn btn-danger-soft btn-block" type="button" onclick="requestInactivateApprovedVolunteer('${id}')"><i class="fa-solid fa-user-slash"></i>Inativar perfil</button>`;
    return '';
  }
  function accountContent(p){
    const status=personStatus(p),contacts=contactRows(p),{start,end}=personDates(p),unit=p.unit||p.unitName||'—';
    return `<div class="admin-account-refactor"><div class="account-status-line"><span class="badge ${status.type}">${escapeHtml(status.label)}</span>${p.inactive&&p.status!=='rejected'?'<span class="badge danger">Inativo</span>':''}</div><div class="card account-contact-card">${contacts.map(person=>`<div class="account-person-row"><div class="avatar">${String(person.name||'V').split(/\s+/).filter(Boolean).map(v=>v[0]).slice(0,2).join('').toUpperCase()}</div><div><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.country)}</span><span>${escapeHtml(person.email)}</span><span>${escapeHtml(person.phone)}</span></div></div>`).join('')}</div><div class="card account-stay-card"><div class="account-card-head"><div><span class="eyebrow">Período</span><strong>${start&&end?`${fmtDate(start,true)}–${fmtDate(end,true)}`:'Não informado'}</strong></div><button class="btn btn-outline btn-xs" type="button" onclick="openStayDateEditor(decodeURIComponent('${safe(p.id)}'))"><i class="fa-regular fa-calendar"></i>Editar</button></div><div class="account-card-head account-unit-row"><div><span class="eyebrow">Unidade</span><strong>${escapeHtml(unit)}</strong></div><button class="btn btn-outline btn-xs" type="button" onclick="openVolunteerUnitEditor('${safe(p.id)}')"><i class="fa-solid fa-building"></i>Alterar</button></div></div>${p.rejectedReason?`<div class="notice danger account-reason"><i class="fa-solid fa-circle-info"></i><div>${escapeHtml(p.rejectedReason)}</div></div>`:''}<div class="card account-access-card"><div class="account-section-title"><div><span class="eyebrow">Acesso</span><strong>Portal do voluntário</strong></div></div><div class="account-access-list">${accessRows(p)}</div></div><div class="account-lifecycle-actions">${accountLifecycle(p)}</div><div class="card account-danger-zone"><span class="eyebrow">Área de risco</span><button class="btn btn-danger btn-block" type="button" onclick="requestDeleteVolunteerApplication('${safe(p.id)}')"><i class="fa-solid fa-trash"></i>Excluir cadastro</button><small>Remove definitivamente candidatura, perfil, atividades, sessões e acesso.</small></div></div>`;
  }

  function detailTabs(p,tab){const id=safe(p.id);return `<div class="person-refactor-tabs"><button class="${tab==='plan'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'plan')"><i class="fa-regular fa-calendar-check"></i>Planejamento</button><button class="${tab==='account'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'account')"><i class="fa-regular fa-user"></i>Conta</button></div>`}
  renderPersonModal=function(p,tab='plan'){
    if(!p)return;tab=tab==='plan'?'plan':'account';state.personModalTab=tab;const body=`${detailTabs(p,tab)}${tab==='plan'?planningContent(p):accountContent(p)}`;
    openModal(p.name,`${escapeHtml(p.country||'—')} • ${escapeHtml(p.unit||p.unitName||'—')}`,body);modalRoot.dataset.personId=String(p.id);modalRoot.dataset.personTab=tab;modalRoot.querySelector('.modal')?.classList.add('person-modal','person-refactor-modal');
  };
  refreshOpenPersonModal=function(id){const p=candidateById(id);if(!p||modalRoot.dataset.personId!==String(id))return;renderPersonModal(p,modalRoot.dataset.personTab||state.personModalTab||'plan')};

  async function ensureAccountData(p,{force=false}={}){
    if(!p?.id)return;const key=String(p.id),freshEnough=!force&&Date.now()-(state.adminAccountReadAt[key]||0)<ACCOUNT_CACHE_MS;
    if(freshEnough&&accessCache(p))return;
    const tasks=[];
    if(window.OleiroServices?.applications?.getById)tasks.push(window.OleiroServices.applications.getById(p.id).then(fresh=>{if(!fresh)return;const index=(state.candidates||[]).findIndex(row=>String(row.id)===key);if(index>=0)state.candidates[index]=fresh;Object.assign(p,fresh)}));
    if(window.OleiroServices?.users?.getByIds&&Array.isArray(p.participantUids)&&p.participantUids.length)tasks.push(window.OleiroServices.users.getByIds(p.participantUids).then(rows=>{const map={};(rows||[]).forEach(row=>map[String(row.id)]=row);state.participantAccessCache[key]=map}));
    await Promise.allSettled(tasks);state.adminAccountReadAt[key]=Date.now();
  }
  openPerson=async function(id,tab='plan'){
    let p=candidateById(id);if(!p)return;tab=tab==='plan'?'plan':'account';renderPersonModal(p,tab);
    if(tab==='plan'){
      try{await hydrateAdminPlanPage(p,pageIndex(p));if(modalRoot.dataset.personId===String(p.id)&&modalRoot.dataset.personTab==='plan')renderPersonModal(candidateById(p.id)||p,'plan')}catch(error){console.error(error);showToast('Não foi possível carregar o planejamento.')}
    }else{
      try{await ensureAccountData(p);if(modalRoot.dataset.personId===String(p.id)&&modalRoot.dataset.personTab==='account')renderPersonModal(candidateById(p.id)||p,'account')}catch(error){console.error(error);showToast('Não foi possível atualizar os dados da conta.')}
    }
  };
  window.loadAdminPlanningPage=async function(encodedId,index){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;const max=pageCount(p)-1,next=Math.max(0,Math.min(Number(index)||0,max));state.adminPlanPageIndex[String(p.id)]=next;renderPersonModal(p,'plan');
    try{await hydrateAdminPlanPage(p,next);if(modalRoot.dataset.personId===String(p.id)&&modalRoot.dataset.personTab==='plan')renderPersonModal(p,'plan')}catch(error){console.error(error);showToast('Não foi possível carregar estes dias.')}
  };

  window.openCandidateAdjustmentAt=async function(id,date=''){
    const p=candidateById(id);if(!p)return;const dates=eligibleDates(p),target=String(date||''),index=dates.indexOf(target);if(index>=0)state.adminPlanPageIndex[String(p.id)]=Math.floor(index/PLAN_PAGE_SIZE);return openPerson(id,'plan');
  };

  window.openGeneralPlanningAdjustment=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;const dates=eligibleDates(p);if(!dates.length)return showToast('Não há dia disponível para solicitar ajuste.');
    openModal('Solicitar ajustes','Indique o dia e a orientação que o voluntário deve revisar.',`<div class="form-grid"><div class="field"><label for="generalAdjustDate">Dia</label><select id="generalAdjustDate" class="select">${dates.map(date=>`<option value="${date}">${dayName(date)} • ${fmtDate(date,true)}</option>`).join('')}</select></div><div class="field"><label for="generalAdjustNote">Orientação</label><textarea id="generalAdjustNote" class="textarea" placeholder="Ex.: reduzir a duração e alterar o horário."></textarea></div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(p.id))}'),'plan')">Cancelar</button><button id="generalAdjustSave" class="btn btn-primary" type="button" onclick="saveGeneralPlanningAdjustment('${safe(p.id)}')">Enviar ajuste</button></div>`);
  };
  window.saveGeneralPlanningAdjustment=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),date=document.getElementById('generalAdjustDate')?.value||'',note=document.getElementById('generalAdjustNote')?.value.trim()||'',button=document.getElementById('generalAdjustSave');if(!p||!date||!note)return showToast('Informe o dia e a orientação.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...'}
    try{await window.OleiroServices.applications.requestDayAdjustment(p.id,date,note);p.status='adjustments';p.dayAdjustments=p.dayAdjustments||{};p.dayAdjustments[date]={note,status:'requested'};p.pendingUntil=candidateDeadlineFrom(new Date(),7);const dates=eligibleDates(p),idx=dates.indexOf(date);if(idx>=0)state.adminPlanPageIndex[String(p.id)]=Math.floor(idx/PLAN_PAGE_SIZE);renderPersonModal(p,'plan');showToast('Ajuste solicitado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível solicitar o ajuste.');if(button?.isConnected){button.disabled=false;button.textContent='Enviar ajuste'}}
  };

  window.requestInactivateApprovedVolunteer=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p||p.status!=='approved')return;openModal('Inativar perfil?',`O acesso de ${escapeHtml(p.name)} será bloqueado.`,`<div class="notice warning"><i class="fa-solid fa-user-slash"></i><div>O planejamento já confirmado permanece registrado, mas o perfil deixa de ficar ativo até uma reativação manual.</div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(p.id))}'),'account')">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmInactivateApprovedVolunteer('${safe(p.id)}')">Inativar</button></div>`)};
  window.confirmInactivateApprovedVolunteer=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;try{await rejectCandidateRecord(p.id,'Perfil inativado pela gestão.',false);renderPersonModal(p,'account');showToast('Perfil inativado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível inativar o perfil.')}
  };

  function occupancyMonthParts(){const [year,month]=String(state.occupancyScreenMonth||_oleiroToday.slice(0,7)).split('-').map(Number);return {year,monthIndex:Math.max(0,(month||1)-1)}}
  function occupancyMonthTitleR18(){const {year,monthIndex}=occupancyMonthParts(),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(new Date(year,monthIndex,1,12)).replace(/^./,c=>c.toUpperCase())}
  function occupancyWeekdaysR18(){const locale=typeof currentLocale==='function'?currentLocale():'pt-BR',base=new Date(2026,7,23,12);return Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(base.getFullYear(),base.getMonth(),base.getDate()+i,12)).replace('.','').slice(0,3))}
  function occupancyPeople(iso){return (state.occupancyCandidates||[]).filter(p=>p.status==='approved'&&!p.inactive&&p.from&&p.to&&p.from<=iso&&p.to>=iso)}
  function occupancyDotsR18(people){if(typeof occupancyDots==='function')return occupancyDots(people);return people.length?`<span class="occupancy-count-dot">${people.length}</span>`:''}
  function occupancyCalendarR18(){
    const {year,monthIndex}=occupancyMonthParts(),first=new Date(year,monthIndex,1,12),last=new Date(year,monthIndex+1,0,12),cells=[];
    for(let i=0;i<first.getDay();i++)cells.push('<span class="occupancy-day occupancy-blank" aria-hidden="true"></span>');
    for(let day=1;day<=last.getDate();day++){const iso=`${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,people=occupancyPeople(iso);cells.push(`<button class="occupancy-day ${iso===_oleiroToday?'today':''} ${people.length?'has-people':''}" type="button" onclick="openOccupancyDay('${iso}')"><strong>${day}</strong><span class="occupancy-dots">${occupancyDotsR18(people)}</span></button>`)}
    return cells.join('');
  }
  function managerOccupancy(){
    if(state.occupancyScreenLoading&&!state.occupancyCandidates?.length)return `<section class="section occupancy-page-screen compact-page-top"><div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando ocupação...</div></section>`;
    return `<section class="section occupancy-page-screen compact-page-top"><div class="occupancy-screen-nav"><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(-1)" aria-label="Mês anterior"><i class="fa-solid fa-chevron-left"></i></button><strong>${escapeHtml(occupancyMonthTitleR18())}</strong><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(1)" aria-label="Próximo mês"><i class="fa-solid fa-chevron-right"></i></button></div>${state.occupancyScreenError?`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(state.occupancyScreenError)}</div></div>`:''}<div class="occupancy-legend occupancy-screen-legend"><span><i class="legend-dot male"></i>Homem</span><span><i class="legend-dot female"></i>Mulher</span><span><i class="legend-dot couple"></i>Casal / não informado</span></div><div class="occupancy-weekdays">${occupancyWeekdaysR18().map(label=>`<span>${escapeHtml(label)}</span>`).join('')}</div><div class="occupancy-calendar occupancy-screen-calendar">${occupancyCalendarR18()}</div></section>`;
  }
  async function loadOccupancyScreenMonth({force=false}={}){
    const month=String(state.occupancyScreenMonth),cached=state.occupancyScreenCache[month];if(!force&&cached&&Date.now()-cached.at<OCCUPANCY_CACHE_MS){state.occupancyCandidates=cached.rows;state.occupancyScreenError='';if(state.managerPage==='occupancy')render();return cached.rows}
    if(state.occupancyScreenLoading)return;state.occupancyScreenLoading=true;state.occupancyScreenError='';if(state.managerPage==='occupancy')render();
    try{const rows=await window.OleiroServices.applications.listOccupancyMonth(month);state.occupancyCandidates=rows||[];state.occupancyScreenCache[month]={at:Date.now(),rows:state.occupancyCandidates};return state.occupancyCandidates}catch(error){console.error(error);state.occupancyScreenError=error?.message||'Não foi possível carregar a ocupação deste mês.';return []}finally{state.occupancyScreenLoading=false;if(state.managerPage==='occupancy')render()}
  }
  window.shiftOccupancyMonth=function(direction){const {year,monthIndex}=occupancyMonthParts(),next=new Date(year,monthIndex+Number(direction||0),1,12);state.occupancyScreenMonth=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`;state.occupancyCandidates=[];loadOccupancyScreenMonth()};
  window.openOccupancyCalendar=function(){navigateManager('occupancy')};

  managerNav=function(){const item=(id,icon,label)=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="navigateManager('${id}')"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;return `<nav class="bottom-nav">${item('home','fa-house','Início')}${item('volunteer','fa-users','Voluntariado')}${item('agenda','fa-calendar-days','Agenda')}${item('occupancy','fa-bed','Ocupação')}${item('menu','fa-bars','Menu')}</nav>`};
  renderManager=function(){const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,occupancy:managerOccupancy,groups:managerGroups,menu:managerMenu},pageFn=pages[state.managerPage]||managerHome;app.innerHTML=header()+`<main class="page">${pageFn()}</main>`;navRoot.innerHTML=managerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}};
  render=function(){renderManager()};
  navigateManager=function(page){
    if(page==='occupancy'){state.managerPage='occupancy';render();afterNavigation();loadOccupancyScreenMonth().catch(console.error);return}
    return baseNavigateManager(page);
  };

  window.renderPersonModal=renderPersonModal;window.refreshOpenPersonModal=refreshOpenPersonModal;window.openPerson=openPerson;window.hydrateCandidatePlanning=hydrateCandidatePlanning;window.invalidateCandidatePlanning=invalidateCandidatePlanning;window.managerNav=managerNav;window.renderManager=renderManager;window.navigateManager=navigateManager;
  if(state.role==='manager'&&typeof render==='function')render();
})();
