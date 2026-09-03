/* R76 — ações operacionais da Agenda passam para o + de cada dia do Planejamento. */
(function planningDayActionsR76(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_DAY_ACTIONS_R76__)return;
  window.__OLEIRO_PLANNING_DAY_ACTIONS_R76__=true;

  const registry=new Map();
  let activeMenu=null;

  const safe=value=>encodeURIComponent(String(value??''));
  const iso=value=>String(value||'').slice(0,10);
  const isWeekday=value=>{const raw=iso(value);if(!raw)return false;const day=new Date(`${raw}T12:00:00`).getDay();return day>=1&&day<=5};
  const sessionName=session=>session?.activityName||session?.activity?.name||'Atividade';
  const sessionPeriod=session=>typeof activityPeriodValue==='function'?activityPeriodValue(session||{},session?.activity||{}):(session?.period||'Sem preferência');

  function installStyles(){
    if(document.getElementById('planningDayActionsR76Styles'))return;
    const style=document.createElement('style');
    style.id='planningDayActionsR76Styles';
    style.textContent=`
      .planning-person-day.has-r76-menu{position:relative!important;overflow:visible!important;z-index:45}
      .planning-person-add[aria-expanded="true"]{background:var(--primary-soft);border-color:color-mix(in srgb,var(--primary) 34%,var(--border));transform:none!important}
      .planning-day-menu-r76{position:absolute;z-index:80;top:54px;right:10px;width:min(340px,calc(100vw - 42px));max-height:410px;overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:15px;box-shadow:0 16px 36px rgba(24,42,32,.18);padding:8px}
      .planning-day-menu-r76-loading{min-height:88px;display:grid;place-items:center;color:var(--muted);font-size:.68rem}
      .planning-day-menu-r76-add{width:100%;min-height:38px;border:0;border-radius:10px;background:var(--primary-soft);color:var(--primary);display:flex;align-items:center;gap:9px;padding:9px 11px;font:inherit;font-size:.68rem;font-weight:750;cursor:pointer;text-align:left}
      .planning-day-menu-r76-add:hover{filter:brightness(.985)}
      .planning-day-menu-r76-empty{padding:10px 8px 4px;color:var(--muted);font-size:.64rem;line-height:1.4}
      .planning-day-menu-r76-session{padding:10px 7px 7px;border-top:1px solid var(--border);margin-top:7px}
      .planning-day-menu-r76-session-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
      .planning-day-menu-r76-session-copy{min-width:0;display:grid;gap:2px}
      .planning-day-menu-r76-session-copy strong{font-size:.69rem;line-height:1.3;color:var(--text);overflow-wrap:anywhere}
      .planning-day-menu-r76-session-copy span{font-size:.59rem;color:var(--muted)}
      .planning-day-menu-r76-session-head>.badge{font-size:.55rem;padding:3px 6px;white-space:nowrap}
      .planning-day-menu-r76-actions{display:flex;gap:6px;flex-wrap:wrap}
      .planning-day-menu-r76-action{min-height:31px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);padding:6px 9px;display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:.61rem;font-weight:700;cursor:pointer}
      .planning-day-menu-r76-action:hover{background:var(--surface-soft)}
      .planning-day-menu-r76-action.primary{border-color:transparent;background:var(--primary);color:white}
      .planning-day-menu-r76-action.warning{background:var(--primary-soft);color:var(--primary);border-color:transparent}
      .planning-day-menu-r76-action.danger{color:var(--danger);background:var(--danger-soft);border-color:transparent}
      .planning-day-menu-r76-waiting{font-size:.61rem;color:var(--muted);padding:2px 0}
      @media(max-width:640px){.planning-day-menu-r76{right:4px;top:51px;width:min(330px,calc(100vw - 34px));max-height:55vh}}
    `;
    document.head.appendChild(style);
  }

  function currentPerson(id=''){
    if(typeof candidateById!=='function')return null;
    return candidateById(id||state.managerPlanningPersonId);
  }

  function proposalMeta(session){
    if(session?.postApprovalProposal!==true)return null;
    const review=String(session.reviewStatus||'analysis');
    if(review==='analysis')return ['Nova atividade','info'];
    if(review==='adjustments')return ['Reajuste solicitado','warning'];
    if(review==='rejected')return ['Recusada','danger'];
    return ['Aprovada','success'];
  }

  function sessionMeta(session){
    const proposal=proposalMeta(session);if(proposal)return proposal;
    if(typeof statusMeta==='function')return statusMeta(session?.status||'proposed');
    return [String(session?.status||'Proposta'),''];
  }

  function canOperationallyEdit(session){
    if(!session||session.status==='rejected'||session.reviewStatus==='rejected')return false;
    if(session.postApprovalProposal===true&&['analysis','adjustments'].includes(String(session.reviewStatus||'analysis')))return false;
    return true;
  }

  function actionButton(label,icon,handler,tone=''){
    return `<button class="planning-day-menu-r76-action ${tone}" type="button" onclick="${handler}"><i class="fa-solid ${icon}"></i>${escapeHtml(label)}</button>`;
  }

  function actionHtml(p,session){
    const app=safe(p.id),sid=safe(session.id),activity=safe(session.activityId),status=String(session.status||'proposed'),review=String(session.reviewStatus||''),actions=[];

    if(session.postApprovalProposal===true&&review==='analysis'){
      actions.push(actionButton('Aprovar','fa-check',`reviewPlanningProposalR76('${app}','${activity}','approve')`,'primary'));
      actions.push(actionButton('Reajustar','fa-rotate',`reviewPlanningProposalR76('${app}','${activity}','adjustments')`,'warning'));
      actions.push(actionButton('Recusar','fa-xmark',`reviewPlanningProposalR76('${app}','${activity}','reject')`,'danger'));
      return actions.join('');
    }
    if(session.postApprovalProposal===true&&review==='adjustments')return '<span class="planning-day-menu-r76-waiting">Aguardando reajuste do voluntário.</span>';
    if(session.postApprovalProposal===true&&review==='rejected')return '<span class="planning-day-menu-r76-waiting">Atividade recusada.</span>';

    /* Confirmar existe apenas enquanto a sessão é proposta. Confirmada/manager_confirmed e
       plan_approved são estados deliberados e não recebem uma confirmação redundante. */
    if(status==='proposed')actions.push(actionButton('Confirmar','fa-check',`confirmPlanningSessionR76('${app}','${sid}')`,'primary'));
    if(status==='change_requested'||status==='change')actions.push(actionButton('Aprovar mudança','fa-check',`approvePlanningChangeR76('${app}','${sid}')`,'primary'));

    if(canOperationallyEdit(session)){
      actions.push(actionButton('Mover','fa-arrows-up-down-left-right',`openPlanningMoveR76('${app}','${sid}')`));
      actions.push(actionButton('Grupo','fa-people-group',`openPlanningGroupR76('${app}','${sid}')`));
    }
    return actions.join('')||'<span class="planning-day-menu-r76-waiting">Nenhuma ação operacional disponível.</span>';
  }

  function menuHtml(p,date,sessions){
    const addAllowed=!p.inactive&&p.status!=='rejected';
    const add=addAllowed?`<button class="planning-day-menu-r76-add" type="button" onclick="closePlanningDayMenuR76();openAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-plus"></i><span>Adicionar atividade</span></button>`:'';
    const rows=sessions.length?sessions.map(session=>{
      registry.set(String(session.id),session);
      const [label,type]=sessionMeta(session),group=String(session.groupId||'').trim(),meta=[`${Number(session.duration||session.activity?.duration)||60} min`,sessionPeriod(session),group&&group!=='A definir'?(group==='Livre'?'Livre':`Grupo ${group}`):'Grupo a definir'].join(' · ');
      return `<section class="planning-day-menu-r76-session"><div class="planning-day-menu-r76-session-head"><div class="planning-day-menu-r76-session-copy"><strong>${escapeHtml(sessionName(session))}</strong><span>${escapeHtml(meta)}</span></div><span class="badge ${escapeHtml(type||'')}">${escapeHtml(label||'Status')}</span></div><div class="planning-day-menu-r76-actions">${actionHtml(p,session)}</div></section>`;
    }).join(''):'<div class="planning-day-menu-r76-empty">Nenhuma atividade neste dia.</div>';
    return `${add}${rows}`;
  }

  function closeMenu(){
    if(!activeMenu)return;
    activeMenu.button?.setAttribute('aria-expanded','false');
    activeMenu.day?.classList.remove('has-r76-menu');
    activeMenu.menu?.remove();
    activeMenu=null;
  }
  window.closePlanningDayMenuR76=closeMenu;

  async function openMenu(button){
    const day=button.closest('.planning-person-day'),date=day?.dataset.planDate,p=currentPerson();
    if(!day||!date||!p)return;
    if(activeMenu?.button===button){closeMenu();return}
    closeMenu();
    day.classList.add('has-r76-menu');button.setAttribute('aria-expanded','true');
    const menu=document.createElement('div');menu.className='planning-day-menu-r76';menu.setAttribute('role','menu');menu.innerHTML='<div class="planning-day-menu-r76-loading"><span><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando ações...</span></div>';day.appendChild(menu);activeMenu={button,day,menu};
    try{
      const rows=window.OleiroServices?.planning?.listSessions?await window.OleiroServices.planning.listSessions({applicationId:p.id,from:date,to:date}):[];
      if(!activeMenu||activeMenu.menu!==menu)return;
      const sessions=(rows||[]).filter(row=>iso(row.date)===date&&row.status!=='rejected'&&row.reviewStatus!=='rejected').sort(typeof activityScheduleCompare==='function'?activityScheduleCompare:undefined);
      menu.innerHTML=menuHtml(p,date,sessions);
    }catch(error){
      console.error('Falha ao carregar ações do dia:',error);
      if(activeMenu?.menu===menu)menu.innerHTML='<div class="planning-day-menu-r76-empty">Não foi possível carregar as ações deste dia.</div>';
    }
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.planning-person-add');
    if(button&&state.managerPage==='planning'&&state.managerPlanningTab==='plan'){
      event.preventDefault();event.stopImmediatePropagation();openMenu(button);return;
    }
    if(activeMenu&&!event.target.closest?.('.planning-day-menu-r76'))closeMenu();
  },true);

  function patchSessionEverywhere(applicationId,sessionId,patch){
    const apply=row=>{if(String(row?.id)===String(sessionId)){Object.assign(row,patch);if(row.raw)Object.assign(row.raw,patch)}};
    (state.sessions||[]).forEach(apply);
    (state.planningBoardSessions||[]).forEach(apply);
    Object.entries(state.adminPlanPageCache||{}).forEach(([key,cache])=>{if(key.startsWith(`${applicationId}|`))(cache?.sessions||[]).forEach(apply)});
    try{const cache=typeof candidatePlanningCache==='function'?candidatePlanningCache(applicationId):null;(cache?.sessions||[]).forEach(apply)}catch{}
    const stored=registry.get(String(sessionId));if(stored)Object.assign(stored,patch);
  }

  async function refreshAfterMutation(applicationId){
    invalidateManagerScheduleCache?.();
    invalidateManagerPendingChanges?.();
    if(state.planningBoardLoadedRange!==undefined)state.planningBoardLoadedRange='';
    if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(applicationId)&&typeof window.refreshPlanningPersonAgenda==='function'){
      await window.refreshPlanningPersonAgenda(applicationId);return;
    }
    if(state.managerPage==='agenda'&&typeof reloadManagerAgenda==='function'){await reloadManagerAgenda();return}
    if(typeof render==='function')render();
  }

  window.confirmPlanningSessionR76=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);closeMenu();
    try{
      await window.OleiroServices.planning.updateSession(sessionId,{status:'confirmed',confirmedAt:new Date()});
      patchSessionEverywhere(applicationId,sessionId,{status:'confirmed',confirmedAt:new Date()});
      await refreshAfterMutation(applicationId);showToast('Atividade confirmada.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível confirmar a atividade.')}
  };

  window.approvePlanningChangeR76=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);closeMenu();
    try{
      const patch={status:'confirmed',confirmedAt:new Date(),changeNote:'',changeRequestedAt:null};
      await window.OleiroServices.planning.updateSession(sessionId,patch);patchSessionEverywhere(applicationId,sessionId,patch);
      state.pendingChangeRequests=(state.pendingChangeRequests||[]).filter(row=>String(row.id)!==String(sessionId));
      await refreshAfterMutation(applicationId);showToast('Mudança aprovada.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível aprovar a mudança.')}
  };

  function businessDates(p){
    const from=iso(p?.stayStart||p?.from),to=iso(p?.stayEnd||p?.to);if(!from||!to)return [];
    let dates=[];
    if(typeof planningEligibleDates==='function')dates=planningEligibleDates(from,to)||[];
    else{for(let date=from,i=0;i<370&&date<=to;i++,date=addDays(date,1))dates.push(date)}
    return dates.filter(isWeekday);
  }

  window.openPlanningMoveR76=function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=currentPerson(applicationId),session=registry.get(String(sessionId));closeMenu();
    if(!p||!session)return showToast('Atividade não encontrada.');
    const dates=businessDates(p);if(!dates.length)return showToast('Não há dia útil disponível no período da estadia.');
    const currentDate=iso(session.date),currentPeriod=sessionPeriod(session);
    const options=dates.map(date=>`<option value="${escapeHtml(date)}" ${date===currentDate?'selected':''}>${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date))}</option>`).join('');
    openModal('Mover atividade',`${escapeHtml(sessionName(session))} • somente segunda a sexta`, `<div class="field"><label for="planningMoveDateR76">Nova data</label><select id="planningMoveDateR76" class="select">${options}</select></div><div class="field" style="margin-top:10px"><label for="planningMovePeriodR76">Novo período</label><select id="planningMovePeriodR76" class="select">${['Sem preferência','Manhã','Tarde','Noite'].map(period=>`<option value="${escapeHtml(period)}" ${period===currentPeriod?'selected':''}>${escapeHtml(period)}</option>`).join('')}</select></div>`, `<button class="btn btn-primary btn-block" type="button" onclick="savePlanningMoveR76('${safe(applicationId)}','${safe(sessionId)}')">Mover</button>`);
  };

  window.savePlanningMoveR76=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),date=document.getElementById('planningMoveDateR76')?.value||'',period=document.getElementById('planningMovePeriodR76')?.value||'Sem preferência';
    if(!date||!isWeekday(date))return showToast('Escolha um dia útil de segunda a sexta.');
    try{
      const patch={date,period};await window.OleiroServices.planning.updateSession(sessionId,patch);patchSessionEverywhere(applicationId,sessionId,patch);closeModal();await refreshAfterMutation(applicationId);showToast('Atividade movida.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a atividade.')}
  };

  function parseGroups(value){const parts=String(value||'').split('+').map(item=>item.trim()).filter(Boolean);return parts.includes('Livre')?['Livre']:[...new Set(parts.filter(Boolean))]}
  function groupParticipation(groups){if(groups.includes('Livre'))return 'Livre';return groups.length>1?`Grupos ${groups.join(' + ')}`:groups.length?`Grupo ${groups[0]}`:'Livre'}
  function bindGroupChoices(){
    document.querySelectorAll('input[data-r76-group-choice]').forEach(input=>input.addEventListener('change',()=>{
      const boxes=[...document.querySelectorAll('input[data-r76-group-choice]')];
      if(input.checked&&input.value==='Livre')boxes.forEach(box=>{if(box!==input)box.checked=false});
      else if(input.checked)boxes.filter(box=>box.value==='Livre').forEach(box=>box.checked=false);
    }));
  }

  window.openPlanningGroupR76=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=currentPerson(applicationId),session=registry.get(String(sessionId));closeMenu();
    if(!p||!session)return showToast('Atividade não encontrada.');
    let groups=[];try{groups=window.OleiroServices?.groups?.list?await window.OleiroServices.groups.list({unitId:p.unitId||String(p.unit||'').toLowerCase()}):[]}catch(error){console.warn('Não foi possível carregar grupos:',error)}
    const codes=[...new Set([...(groups||[]).map(row=>String(row.code||row.id||'').trim()).filter(Boolean),'A','B','C','D'])],selected=parseGroups(session.groupId||'Livre'),options=[...codes,'Livre'];
    openModal('Definir grupo',escapeHtml(sessionName(session)),`<div class="check-grid">${options.map(group=>`<label class="check-card"><input type="checkbox" data-r76-group-choice value="${escapeHtml(group)}" ${selected.includes(group)?'checked':''}><span>${group==='Livre'?'Participação livre':`Grupo ${escapeHtml(group)}`}</span></label>`).join('')}</div>`,`<button class="btn btn-primary btn-block" type="button" onclick="savePlanningGroupR76('${safe(applicationId)}','${safe(sessionId)}')">Salvar grupo</button>`);requestAnimationFrame(bindGroupChoices);
  };

  window.savePlanningGroupR76=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);let groups=[...document.querySelectorAll('input[data-r76-group-choice]:checked')].map(input=>input.value);
    if(!groups.length)return showToast('Selecione um grupo ou participação livre.');if(groups.includes('Livre'))groups=['Livre'];
    const groupId=groups.includes('Livre')?'Livre':groups.join(' + '),patch={groupId,participation:groupParticipation(groups)};
    try{await window.OleiroServices.planning.updateSession(sessionId,patch);patchSessionEverywhere(applicationId,sessionId,patch);closeModal();await refreshAfterMutation(applicationId);showToast('Grupo atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o grupo.')}
  };

  window.reviewPlanningProposalR76=async function(encodedApplicationId,encodedActivityId,decision){
    const applicationId=decodeURIComponent(encodedApplicationId);closeMenu();
    try{
      if(decision==='adjustments')return window.requestPostApprovalReajust?.(encodedApplicationId,encodedActivityId);
      if(typeof window.reviewPostApprovalProposal!=='function')return showToast('Revisão da atividade indisponível.');
      await window.reviewPostApprovalProposal(encodedApplicationId,encodedActivityId,decision);await refreshAfterMutation(applicationId);
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível revisar a atividade.')}
  };

  /* Corrige também o detalhe da Agenda legada: Confirmar nunca aparece para confirmed,
     manager_confirmed ou plan_approved. A Agenda fica disponível durante a homologação. */
  const baseOpenManagerSession=window.openManagerSession;
  if(typeof baseOpenManagerSession==='function'&&typeof window.managerSessionById==='function'){
    window.openManagerSession=function(id){
      const s=window.managerSessionById(id);if(!s)return showToast('Sessão não encontrada.');const a=s.activity||{},[label,type]=statusMeta(s.status||'proposed'),group=s.groupId||'A definir',actions=[],applicationId=s.applicationId||'';
      if(s.status==='proposed')actions.push(`<button class="btn btn-soft" onclick="confirmPlanningSessionR76('${safe(applicationId)}','${safe(s.id)}')">Confirmar</button>`);
      if(s.status==='change_requested'||s.status==='change')actions.push(`<button class="btn btn-soft" onclick="approvePlanningChangeR76('${safe(applicationId)}','${safe(s.id)}')">Aprovar mudança</button>`);
      actions.push(`<button class="btn btn-outline" onclick='closeModal();moveSession(${JSON.stringify(s.activityId)},${JSON.stringify(s.date)},false)'>Mover</button>`);
      actions.push(`<button class="btn btn-outline" onclick='openManagerGroupPicker(${JSON.stringify(s.id)})'>Grupo</button>`);
      openModal(a.name||'Atividade',`${a.owner||'Voluntário'} • ${dayName(s.date)}, ${fmtDate(s.date)}`,`<div class="card"><div class="activity-row"><div><h3 style="font-size:.85rem">${Number(s.duration||a.duration)||0} min • ${escapeHtml(activityPeriodValue(s,a))}</h3><p style="font-size:.65rem;color:var(--muted);margin-top:4px">${escapeHtml(a.description||'')}</p></div>${badge(label,type)}</div><div class="item-meta">${badge(group,'primary')}${badge(a.participation||'Livre')}</div>${a.materials?`<p class="compact-hint" style="margin-top:10px"><strong>Materiais:</strong> ${escapeHtml(a.materials)}</p>`:''}</div>`,`<div class="activity-actions modal-action-row">${actions.join('')}</div>`);modalRoot.querySelector('.modal')?.classList.add('session-detail-modal');
    };
    openManagerSession=window.openManagerSession;
  }

  installStyles();
})();
