/* R79 — + do dia cria atividade; + da atividade concentra ações contextuais. */
(function planningActivityActionsR79(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_ACTIVITY_ACTIONS_R79__)return;
  window.__OLEIRO_PLANNING_ACTIVITY_ACTIONS_R79__=true;

  const registry=new Map();
  let activeMenu=null;
  let patchTimer=0;
  const safe=value=>encodeURIComponent(String(value??''));
  const iso=value=>String(value||'').slice(0,10);
  const currentPerson=()=>typeof candidateById==='function'?candidateById(state?.managerPlanningPersonId):null;
  const sessionName=s=>s?.activityName||s?.activity?.name||'Atividade';
  const sessionPeriod=s=>typeof activityPeriodValue==='function'?activityPeriodValue(s||{},s?.activity||{}):(s?.period||'Sem preferência');
  const groupLabel=s=>{const raw=String(s?.groupId||s?.activity?.groupId||s?.participation||s?.activity?.participation||'').trim();if(!raw||raw==='A definir')return 'Grupo a definir';if(raw==='Livre')return 'Livre';if(/^Grupo\s/i.test(raw)||/^Grupos\s/i.test(raw))return raw;return raw.includes('+')?`Grupos ${raw}`:`Grupo ${raw}`};

  function installStyles(){
    if(document.getElementById('planningActivityActionsR79Styles'))return;
    const style=document.createElement('style');style.id='planningActivityActionsR79Styles';style.textContent=`
      .planning-person-day .planning-day-add-r79{width:42px;height:42px;border:1px solid var(--border);border-radius:11px;background:var(--surface);color:var(--primary);display:grid;place-items:center;cursor:pointer;font-size:.86rem;flex:0 0 auto}
      .planning-person-day .planning-day-add-r79:hover{background:var(--primary-soft)}
      .planning-person-agenda .admin-portal-actions,.planning-person-agenda .admin-session-review-action,.planning-person-agenda .r31-awaiting-action{display:none!important}
      .planning-person-agenda .admin-period-activities{display:grid;gap:9px}
      .planning-person-agenda .admin-portal-activity-card{position:relative!important;border:1px solid color-mix(in srgb,var(--border) 86%,transparent)!important;border-radius:12px!important;background:var(--surface)!important;margin:0!important;overflow:visible!important;box-shadow:0 1px 0 rgba(20,40,30,.02)}
      .planning-person-agenda .admin-portal-activity-card+.admin-portal-activity-card{border-top:1px solid color-mix(in srgb,var(--border) 86%,transparent)!important}
      .planning-person-agenda .admin-portal-activity-main{padding:13px 48px 13px 14px!important}
      .planning-person-agenda .admin-portal-activity-title>p{display:flex;align-items:center;gap:0;font-size:.64rem!important;color:var(--muted);line-height:1.35}
      .planning-person-agenda .admin-portal-group{display:none!important}
      .planning-activity-add-r79{position:absolute;right:11px;top:11px;width:30px;height:30px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--primary);display:grid;place-items:center;cursor:pointer;z-index:3}
      .planning-activity-add-r79:hover,.planning-activity-add-r79[aria-expanded="true"]{background:var(--primary-soft);border-color:color-mix(in srgb,var(--primary) 28%,var(--border))}
      .planning-activity-menu-r79{position:absolute;right:9px;top:46px;z-index:120;display:flex;gap:5px;flex-wrap:wrap;max-width:260px;padding:7px;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:0 14px 32px rgba(24,42,32,.18)}
      .planning-activity-action-r79{width:34px;height:34px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);display:grid;place-items:center;cursor:pointer;font-size:.72rem}
      .planning-activity-action-r79:hover{background:var(--surface-soft)}
      .planning-activity-action-r79.primary{background:var(--primary);color:#fff;border-color:transparent}
      .planning-activity-action-r79.warning{background:var(--primary-soft);color:var(--primary);border-color:transparent}
      .planning-activity-action-r79.danger{background:var(--danger-soft);color:var(--danger);border-color:transparent}
      .planning-person-agenda .r32-session-signal-wrap.r79-remove-signal{display:none!important}
      @media(max-width:720px){.planning-person-agenda .admin-portal-activity-main{padding-right:46px!important}.planning-activity-menu-r79{right:6px;max-width:220px}}
    `;document.head.appendChild(style);
  }

  function closeMenu(){
    activeMenu?.button?.setAttribute('aria-expanded','false');activeMenu?.menu?.remove();activeMenu=null;
  }
  window.closePlanningActivityMenuR79=closeMenu;

  function iconButton(label,icon,handler,tone=''){
    return `<button class="planning-activity-action-r79 ${tone}" type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" onclick="${handler}"><i class="fa-solid ${icon}" aria-hidden="true"></i></button>`;
  }

  function hasPendingReview(s){
    if(['change_requested','change'].includes(String(s?.status||'')))return ['analysis',''].includes(String(s?.changeReviewStatus||'analysis'));
    if(s?.postApprovalProposal===true)return ['analysis','adjustments'].includes(String(s?.reviewStatus||'analysis'));
    return false;
  }

  function actionsHtml(p,s){
    const app=safe(p.id),sid=safe(s.id),date=safe(iso(s.date)),activity=safe(s.activityId||''),status=String(s.status||'proposed'),review=String(s.reviewStatus||'analysis'),changeReview=String(s.changeReviewStatus||'analysis');
    const out=[];
    if(s.postApprovalProposal===true){
      if(review==='analysis'){
        out.push(iconButton('Aprovar','fa-check',`closePlanningActivityMenuR79();reviewPlanningProposalR76('${app}','${activity}','approve')`,'primary'));
        out.push(iconButton('Reajustar','fa-rotate',`closePlanningActivityMenuR79();reviewPlanningProposalR76('${app}','${activity}','adjustments')`,'warning'));
        out.push(iconButton('Recusar','fa-xmark',`closePlanningActivityMenuR79();reviewPlanningProposalR76('${app}','${activity}','reject')`,'danger'));
      }
      return out.join('');
    }
    if(['change_requested','change'].includes(status)){
      if(changeReview==='analysis'||!changeReview){
        out.push(iconButton('Aprovar alteração','fa-check',`closePlanningActivityMenuR79();reviewPlanningExistingChangeR78('${app}','${sid}','approve')`,'primary'));
        out.push(iconButton('Reajustar','fa-rotate',`closePlanningActivityMenuR79();openPlanningExistingReajustR78('${app}','${sid}')`,'warning'));
        out.push(iconButton('Recusar alteração','fa-xmark',`closePlanningActivityMenuR79();openPlanningExistingRejectR78('${app}','${sid}')`,'danger'));
      }
      return out.join('');
    }
    if(status==='proposed')out.push(iconButton('Confirmar','fa-check',`confirmPlanningSessionR76('${app}','${sid}')`,'primary'));
    if(!hasPendingReview(s)&&status!=='rejected'&&review!=='rejected'){
      out.push(iconButton('Editar','fa-pen',`openPlanningEditR79('${app}','${sid}','${date}')`));
      out.push(iconButton('Duplicar','fa-copy',`openPlanningDuplicateR79('${app}','${sid}')`));
      out.push(iconButton('Mover','fa-arrows-up-down-left-right',`openPlanningMoveR79('${app}','${sid}')`));
      out.push(iconButton('Grupo','fa-people-group',`openPlanningGroupR79('${app}','${sid}')`));
    }
    return out.join('');
  }

  async function getSession(applicationId,sessionId){
    const cached=registry.get(String(sessionId));if(cached)return cached;
    if(!window.OleiroServices?.planning?.listSessions)return null;
    const rows=await window.OleiroServices.planning.listSessions({applicationId});const row=(rows||[]).find(item=>String(item.id)===String(sessionId));if(row)registry.set(String(row.id),row);return row||null;
  }

  function patchDayAdd(day){
    const old=day.querySelector('.planning-person-add,.planning-day-add-r79');if(!old)return;
    if(old.classList.contains('planning-person-add'))old.classList.remove('planning-person-add');
    old.classList.add('planning-day-add-r79');old.removeAttribute('aria-expanded');
    old.title='Adicionar atividade';old.setAttribute('aria-label','Adicionar atividade');
    const date=day.dataset.planDate,p=currentPerson();if(p&&date)old.onclick=event=>{event.preventDefault();event.stopPropagation();closeMenu();openAdminPlanningActivity(safe(p.id),safe(date))};
  }

  function patchMeta(card,s){
    const meta=card.querySelector('.admin-portal-activity-title>p');if(meta){
      const duration=Number(s?.duration||s?.activity?.duration)||60,period=sessionPeriod(s),group=groupLabel(s);const text=`${duration} min · ${period} · ${group}`;if(meta.textContent.trim()!==text)meta.textContent=text;
    }
    card.querySelector('.admin-portal-group')?.remove();
    const statusText=[...card.querySelectorAll('.admin-portal-status .badge')].map(node=>node.textContent.trim()).join(' ');
    if(/nova atividade/i.test(statusText))card.querySelectorAll('.r32-session-signal-wrap').forEach(node=>node.classList.add('r79-remove-signal'));
  }

  function patchActivityCard(card,p,s){
    if(!card||!s)return;registry.set(String(s.id),s);patchMeta(card,s);
    const html=actionsHtml(p,s);let button=card.querySelector('.planning-activity-add-r79');
    if(!html){button?.remove();if(activeMenu?.card===card)closeMenu();return}
    if(!button){button=document.createElement('button');button.type='button';button.className='planning-activity-add-r79';button.innerHTML='<i class="fa-solid fa-plus" aria-hidden="true"></i>';button.setAttribute('aria-expanded','false');card.appendChild(button)}
    button.title=`Ações de ${sessionName(s)}`;button.setAttribute('aria-label',`Ações de ${sessionName(s)}`);button.onclick=event=>{event.preventDefault();event.stopPropagation();
      if(activeMenu?.button===button){closeMenu();return}closeMenu();const menu=document.createElement('div');menu.className='planning-activity-menu-r79';menu.setAttribute('role','menu');menu.innerHTML=actionsHtml(p,s);card.appendChild(menu);button.setAttribute('aria-expanded','true');activeMenu={button,menu,card};
    };
  }

  async function patchDay(day,p){
    patchDayAdd(day);const date=day.dataset.planDate;if(!date)return;
    const cards=[...day.querySelectorAll('.admin-portal-activity-card[data-session-id]')];if(!cards.length)return;
    let rows=[];try{rows=await window.OleiroServices.planning.listSessions({applicationId:p.id,from:date,to:date})}catch(error){console.warn('Não foi possível carregar ações das atividades:',error);return}
    const byId=new Map((rows||[]).map(row=>[String(row.id),row]));cards.forEach(card=>{const s=byId.get(String(card.dataset.sessionId||''));if(s)patchActivityCard(card,p,s)});
  }

  async function patchPlanning(){
    if(state?.managerPage!=='planning'||state?.managerPlanningTab!=='plan')return;const p=currentPerson();if(!p)return;
    document.querySelectorAll('.planning-day-menu-r76').forEach(node=>node.remove());
    const days=[...document.querySelectorAll('.planning-person-agenda .planning-person-day')];for(const day of days)await patchDay(day,p);
  }
  function schedulePatch(){clearTimeout(patchTimer);patchTimer=setTimeout(()=>patchPlanning().catch(console.error),30)}

  async function refresh(applicationId){
    closeMenu();if(typeof invalidateManagerScheduleCache==='function')invalidateManagerScheduleCache();if(typeof invalidateManagerPendingChanges==='function')invalidateManagerPendingChanges();
    registry.clear();if(typeof window.refreshPlanningPersonAgenda==='function')await window.refreshPlanningPersonAgenda(applicationId);else if(typeof render==='function')render();schedulePatch();
  }

  window.openPlanningEditR79=async function(encodedApplicationId,encodedSessionId,encodedDate){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),date=decodeURIComponent(encodedDate);closeMenu();
    if(typeof openAdminEditPlanningSession!=='function')return showToast('Edição indisponível.');openAdminEditPlanningSession(safe(applicationId),safe(sessionId),safe(date));
  };

  function selectGroupChoices(groupId){
    const groups=String(groupId||'Livre').split('+').map(v=>v.trim()).filter(Boolean);document.querySelectorAll('input[data-group-choice="manager-primary"]').forEach(box=>{box.checked=groups.includes(box.value)||(groups.length===0&&box.value==='Livre');box.dispatchEvent(new Event('change',{bubbles:true}))});
  }
  window.openPlanningDuplicateR79=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),s=await getSession(applicationId,sessionId);closeMenu();if(!s)return showToast('Atividade não encontrada.');
    openAdminPlanningActivity(safe(applicationId),safe(iso(s.date)));requestAnimationFrame(()=>{setTimeout(()=>{
      const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value??''};set('managerActName',sessionName(s));set('managerActDesc',s.activityDescription||s.activity?.description||'');set('managerActDuration',Number(s.duration||s.activity?.duration)||60);set('managerActMaterials',s.materials||s.activity?.materials||'');set('managerActNotes',s.notes||s.activity?.notes||'');set('managerActPeriod',sessionPeriod(s));selectGroupChoices(s.groupId||'Livre');
      const title=document.querySelector('#modalRoot .modal-title,.modal h2');if(title&&/adicionar/i.test(title.textContent||''))title.textContent='Duplicar atividade';
    },0)})};
  };

  function businessDates(p){const from=iso(p?.stayStart||p?.from),to=iso(p?.stayEnd||p?.to),dates=typeof planningEligibleDates==='function'?planningEligibleDates(from,to):[];return (dates||[]).filter(value=>{const d=new Date(`${iso(value)}T12:00:00`).getDay();return d>=1&&d<=5})}
  window.openPlanningMoveR79=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=typeof candidateById==='function'?candidateById(applicationId):null,s=await getSession(applicationId,sessionId);closeMenu();if(!p||!s)return showToast('Atividade não encontrada.');
    const dates=businessDates(p);if(!dates.length)return showToast('Não há dia útil disponível no período da estadia.');const current=iso(s.date),period=sessionPeriod(s);
    openModal('Mover atividade',escapeHtml(sessionName(s)),`<div class="field"><label for="planningMoveDateR79">Nova data</label><select id="planningMoveDateR79" class="select">${dates.map(date=>`<option value="${escapeHtml(date)}" ${date===current?'selected':''}>${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date))}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label for="planningMovePeriodR79">Período</label><select id="planningMovePeriodR79" class="select">${['Sem preferência','Manhã','Tarde','Noite'].map(v=>`<option value="${escapeHtml(v)}" ${v===period?'selected':''}>${escapeHtml(v)}</option>`).join('')}</select></div>`,`<button class="btn btn-primary btn-block" type="button" onclick="savePlanningMoveR79('${safe(applicationId)}','${safe(sessionId)}')">Mover</button>`);
  };
  window.savePlanningMoveR79=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),date=document.getElementById('planningMoveDateR79')?.value||'',period=document.getElementById('planningMovePeriodR79')?.value||'Sem preferência';if(!date)return;try{await window.OleiroServices.planning.updateSession(sessionId,{date,period});closeModal();await refresh(applicationId);showToast('Atividade movida.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a atividade.')}};

  window.openPlanningGroupR79=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=typeof candidateById==='function'?candidateById(applicationId):null,s=await getSession(applicationId,sessionId);closeMenu();if(!p||!s)return showToast('Atividade não encontrada.');let rows=[];try{rows=await window.OleiroServices.groups.list({unitId:p.unitId||String(p.unit||'').toLowerCase()})}catch{}
    const codes=[...new Set([...(rows||[]).map(r=>String(r.code||r.id||'').trim()).filter(Boolean),'A','B','C','D'])],selected=String(s.groupId||'Livre').split('+').map(v=>v.trim()),options=[...codes,'Livre'];
    openModal('Definir grupo',escapeHtml(sessionName(s)),`<div class="check-grid">${options.map(group=>`<label class="check-card"><input type="checkbox" data-r79-group value="${escapeHtml(group)}" ${selected.includes(group)?'checked':''}><span>${group==='Livre'?'Participação livre':`Grupo ${escapeHtml(group)}`}</span></label>`).join('')}</div>`,`<button class="btn btn-primary btn-block" type="button" onclick="savePlanningGroupR79('${safe(applicationId)}','${safe(sessionId)}')">Salvar grupo</button>`);
    requestAnimationFrame(()=>document.querySelectorAll('input[data-r79-group]').forEach(input=>input.addEventListener('change',()=>{const boxes=[...document.querySelectorAll('input[data-r79-group]')];if(input.checked&&input.value==='Livre')boxes.forEach(b=>{if(b!==input)b.checked=false});else if(input.checked)boxes.filter(b=>b.value==='Livre').forEach(b=>b.checked=false)})));
  };
  window.savePlanningGroupR79=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);let groups=[...document.querySelectorAll('input[data-r79-group]:checked')].map(i=>i.value);if(!groups.length)return showToast('Selecione um grupo ou participação livre.');if(groups.includes('Livre'))groups=['Livre'];const groupId=groups[0]==='Livre'?'Livre':groups.join(' + '),participation=groups[0]==='Livre'?'Livre':groups.length>1?`Grupos ${groups.join(' + ')}`:`Grupo ${groups[0]}`;try{await window.OleiroServices.planning.updateSession(sessionId,{groupId,participation});closeModal();await refresh(applicationId);showToast('Grupo atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o grupo.')}};

  document.addEventListener('click',event=>{if(activeMenu&&!event.target.closest?.('.planning-activity-menu-r79')&&!event.target.closest?.('.planning-activity-add-r79'))closeMenu()},true);
  const observer=new MutationObserver(schedulePatch);observer.observe(document.body,{childList:true,subtree:true});
  installStyles();requestAnimationFrame(schedulePatch);
})();
