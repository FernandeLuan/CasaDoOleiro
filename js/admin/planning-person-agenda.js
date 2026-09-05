/* Planejamento individual consolidado: agenda semanal + ações contextuais por atividade. */
(function planningPersonAgenda(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_PERSON_AGENDA_R66__)return;
  window.__OLEIRO_PLANNING_PERSON_AGENDA_R66__=true;

  if(!document.querySelector('link[data-planning-person-agenda-r66]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='../css/planning-person-agenda-r66.css?v=20260903-consolidated';
    link.dataset.planningPersonAgendaR66='1';
    document.head.appendChild(link);
  }

  const baseRenderManager=window.renderManager||renderManager;
  const cache=new Map();
  const inflight=new Map();
  const sessionRegistry=new Map();
  const CACHE_MS=60*1000;

  const safe=value=>encodeURIComponent(String(value??''));
  const iso=value=>String(value||'').slice(0,10);
  const addDays=(value,days)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const isWeekday=value=>{const date=iso(value);if(!date)return false;const day=new Date(`${date}T12:00:00`).getDay();return day>=1&&day<=5};
  const mondayOf=value=>{const date=iso(value),d=new Date(`${date}T12:00:00`),day=d.getDay(),offset=(day+6)%7;d.setDate(d.getDate()-offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const shortDate=value=>{const parts=iso(value).split('-');return parts.length===3?`${parts[2]}/${parts[1]}`:iso(value)};
  const minutesLabel=value=>{const total=Math.max(0,Number(value)||0),h=Math.floor(total/60),m=total%60;if(!h)return `${m}min`;return m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`};
  const rowMinutes=row=>Number(row?.duration)||Number(row?.activity?.duration)||60;
  const planningPerson=()=>typeof candidateById==='function'?candidateById(state.managerPlanningPersonId):null;
  const sessionName=s=>s?.activityName||s?.activity?.name||'Atividade';
  const sessionPeriod=s=>typeof activityPeriodValue==='function'?activityPeriodValue(s||{},s?.activity||{}):(s?.period||s?.activity?.period||'Sem preferência');

  function weekdayParts(value){
    const date=new Date(`${iso(value)}T12:00:00`),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
    let full=new Intl.DateTimeFormat(locale,{weekday:'long'}).format(date);full=full.charAt(0).toUpperCase()+full.slice(1);
    const short=new Intl.DateTimeFormat(locale,{weekday:'short'}).format(date).replace('.','').slice(0,3).toUpperCase();
    return {full,short};
  }

  function groupLabel(s){
    const raw=String(s?.groupId||s?.activity?.groupId||s?.participation||s?.activity?.participation||'').trim();
    if(!raw||raw==='A definir')return 'Grupo a definir';
    if(raw==='Livre'||/^participação livre$/i.test(raw))return 'Livre';
    if(/^Grupos?\s/i.test(raw))return raw;
    return raw.includes('+')?`Grupos ${raw}`:`Grupo ${raw}`;
  }

  function eligibleDates(p){
    const start=iso(p?.stayStart||p?.from),end=iso(p?.stayEnd||p?.to);
    const dates=typeof planningEligibleDates==='function'?planningEligibleDates(start,end):[];
    return (dates||[]).filter(isWeekday);
  }

  function normalizeSession(row,p){
    const activity=row?.activity||{
      id:String(row?.activityId||''),name:row?.activityName||'Atividade',description:row?.activityDescription||'',duration:Number(row?.duration)||60,
      participation:row?.participation||'Livre',materials:row?.materials||'',notes:row?.notes||'',period:row?.period||'Sem preferência',ownerName:row?.ownerName||p?.name||'Voluntário'
    };
    return {...row,applicationId:String(row?.applicationId||p?.id||''),activity};
  }

  const bodyVersion=()=>String(state.managerPlanningBody||'');

  async function loadAgenda(p,{force=false}={}){
    if(!p?.id)return null;
    const id=String(p.id),dates=eligibleDates(p),version=bodyVersion(),current=cache.get(id);
    if(!force&&current&&current.version===version&&Date.now()-current.at<CACHE_MS)return current;
    if(inflight.has(id))return inflight.get(id);
    const task=(async()=>{
      if(!dates.length){const empty={at:Date.now(),version,dates:[],sessions:[]};cache.set(id,empty);return empty}
      if(!window.OleiroServices?.planning?.listSessions)throw new Error('Serviço de planejamento indisponível.');
      const allowed=new Set(dates),rows=await window.OleiroServices.planning.listSessions({applicationId:p.id,from:dates[0],to:dates[dates.length-1]});
      const sessions=(rows||[]).filter(row=>allowed.has(iso(row.date))&&isWeekday(row.date)&&row.status!=='rejected'&&row.reviewStatus!=='rejected').map(row=>normalizeSession(row,p));
      const result={at:Date.now(),version,dates,sessions};cache.set(id,result);return result;
    })().finally(()=>inflight.delete(id));
    inflight.set(id,task);return task;
  }

  function groupWeeks(dates){
    const map=new Map();dates.forEach(date=>{const monday=mondayOf(date),list=map.get(monday)||[];list.push(date);map.set(monday,list)});
    return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([monday,days],index)=>({index:index+1,monday,friday:addDays(monday,4),days:days.sort()}));
  }

  function iconAction(label,icon,handler,tone=''){
    return `<button class="planning-activity-action ${tone}" type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" onclick="${handler}"><i class="fa-solid ${icon}" aria-hidden="true"></i></button>`;
  }

  function activityActionsHtml(p,s){
    const app=safe(p.id),sid=safe(s.id),date=safe(iso(s.date)),activity=safe(s.activityId||''),status=String(s.status||'proposed'),review=String(s.reviewStatus||''),changeReview=String(s.changeReviewStatus||'analysis');
    const out=[];
    if(s.postApprovalProposal===true&&review==='analysis'){
      out.push(iconAction('Aprovar','fa-check',`planningReviewPostApproval('${app}','${activity}','approve')`,'primary'));
      out.push(iconAction('Reajustar','fa-rotate',`planningOpenPostApprovalAdjustment('${app}','${activity}')`,'warning'));
      out.push(iconAction('Recusar','fa-xmark',`planningOpenPostApprovalReject('${app}','${activity}')`,'danger'));
      return out.join('');
    }
    if(s.postApprovalProposal===true&&review==='adjustments')return '';
    if(['change_requested','change'].includes(status)){
      if(changeReview==='analysis'||!changeReview){
        out.push(iconAction('Aprovar alteração','fa-check',`planningReviewExistingChange('${app}','${sid}','approve')`,'primary'));
        out.push(iconAction('Reajustar','fa-rotate',`planningOpenExistingAdjustment('${app}','${sid}')`,'warning'));
        out.push(iconAction('Recusar alteração','fa-xmark',`planningOpenExistingReject('${app}','${sid}')`,'danger'));
      }
      return out.join('');
    }
    if(status==='proposed')out.push(iconAction('Confirmar','fa-check',`planningConfirmSession('${app}','${sid}')`,'primary'));
    if(status!=='rejected'&&review!=='rejected'){
      out.push(iconAction('Editar','fa-pen',`planningOpenEdit('${app}','${sid}','${date}')`));
      out.push(iconAction('Duplicar','fa-copy',`planningOpenDuplicate('${app}','${sid}')`));
      out.push(iconAction('Mover','fa-arrows-up-down-left-right',`planningOpenMove('${app}','${sid}')`));
      out.push(iconAction('Grupo','fa-people-group',`planningOpenGroup('${app}','${sid}')`));
    }
    return out.join('');
  }

  function decorateActivityCard(card,p,s){
    if(!card||!s)return;
    sessionRegistry.set(String(s.id),s);card.dataset.sessionId=String(s.id);card.classList.add('planning-person-activity-card');
    card.querySelectorAll('.admin-portal-actions,.admin-session-review-action,.post-approval-admin-actions,.r31-awaiting-action').forEach(node=>node.remove());
    if(s.postApprovalProposal===true&&String(s.reviewStatus||'analysis')==='analysis')card.querySelectorAll('.r32-session-signal-wrap').forEach(node=>node.remove());
    const meta=card.querySelector('.admin-portal-activity-title>p');if(meta)meta.textContent=`${Number(s.duration||s.activity?.duration)||60} min · ${sessionPeriod(s)} · ${groupLabel(s)}`;
    card.querySelectorAll('.admin-portal-group').forEach(node=>node.remove());
    const actions=activityActionsHtml(p,s),head=card.querySelector('.admin-portal-activity-head');if(!head)return;
    const status=head.querySelector(':scope > .admin-portal-status');let tools=head.querySelector(':scope > .planning-activity-tools');
    if(!tools){tools=document.createElement('div');tools.className='planning-activity-tools';head.appendChild(tools)}
    if(status)tools.appendChild(status);tools.querySelectorAll('.planning-activity-trigger,.planning-activity-menu').forEach(node=>node.remove());
    if(!actions)return;
    const button=document.createElement('button');button.type='button';button.className='planning-activity-trigger';button.title=`Ações de ${sessionName(s)}`;button.setAttribute('aria-label',button.title);button.setAttribute('aria-expanded','false');button.innerHTML='<i class="fa-solid fa-plus" aria-hidden="true"></i>';button.setAttribute('onclick','togglePlanningActivityActions(this,event)');
    const menu=document.createElement('div');menu.className='planning-activity-menu';menu.hidden=true;menu.setAttribute('role','menu');menu.innerHTML=actions;tools.append(button,menu);
  }

  function prepareDayContent(content,p,sessions){
    if(!content)return '';
    const byId=new Map((sessions||[]).map(s=>[String(s.id),s]));content.querySelectorAll('.admin-create-activity-action').forEach(node=>node.remove());
    const cards=[...content.querySelectorAll('.admin-portal-activity-card')];cards.forEach((card,index)=>{const session=byId.get(String(card.dataset.sessionId||''))||sessions[index];if(session)decorateActivityCard(card,p,session)});
    const sessionsRoot=content.querySelector('.planning-day-sessions');if(sessionsRoot&&cards.length){const list=document.createElement('div');list.className='planning-person-activities';cards.forEach(card=>list.appendChild(card));sessionsRoot.replaceChildren(list)}
    return content.innerHTML;
  }

  function dayCardHtml(p,date,sessions){
    let generated='';try{generated=typeof adminPlanningDayCard==='function'?adminPlanningDayCard(p,{date,sessions}):''}catch(error){console.warn('Falha ao reutilizar card de planejamento:',error)}
    const template=document.createElement('template');template.innerHTML=generated;const oldCard=template.content.querySelector('details.planning-day-card'),content=oldCard?.querySelector('.planning-day-content');const signals=oldCard?.querySelector('.r31-day-signals')?.innerHTML||'';
    const total=sessions.reduce((sum,row)=>sum+rowMinutes(row),0),count=sessions.length;const summary=count?`${count} ${count===1?'atividade':'atividades'} · ${minutesLabel(total)}`:'Sem atividade';let inner=prepareDayContent(content,p,sessions);
    if(!count)inner=`<div class="planning-person-empty"><i class="fa-regular fa-calendar"></i><span>Nenhuma atividade planejada</span></div>`;
    const plus=`<button class="planning-person-add" type="button" title="Adicionar atividade em ${escapeHtml(shortDate(date))}" aria-label="Adicionar atividade em ${escapeHtml(shortDate(date))}" onclick="event.preventDefault();event.stopPropagation();closePlanningActivityActions();openAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-plus"></i></button>`;
    return `<article class="planning-person-day ${count?'has-activities':'is-empty'}" data-plan-date="${escapeHtml(date)}"><header class="planning-person-day-head"><div class="planning-person-day-copy"><div class="planning-person-day-title"><strong>${escapeHtml(shortDate(date))}</strong><span class="planning-person-day-summary">${escapeHtml(summary)}${signals?`<span class="planning-person-day-signals">${signals}</span>`:''}</span></div></div>${plus}</header><div class="planning-person-day-body">${inner}</div></article>`;
  }

  function agendaHtml(p,data){
    if(!data.dates.length)return '<div class="empty planning-person-no-days"><i class="fa-regular fa-calendar-xmark"></i>Não há dias úteis de atividade entre chegada e saída.</div>';
    sessionRegistry.clear();const byDate=new Map();data.sessions.forEach(row=>{const date=iso(row.date);if(!byDate.has(date))byDate.set(date,[]);byDate.get(date).push(row)});const weeks=groupWeeks(data.dates);
    return `<div class="planning-person-weeks">${weeks.map(week=>`<section class="planning-person-week"><header class="planning-person-week-head"><div><span>SEMANA ${week.index}</span><strong>${escapeHtml(shortDate(week.monday))} → ${escapeHtml(shortDate(week.friday))}</strong></div></header><div class="planning-person-week-days">${week.days.map(date=>dayCardHtml(p,date,(byDate.get(date)||[]))).join('')}</div></section>`).join('')}</div>`;
  }

  function ensurePlanningContainer(root){
    const content=root.querySelector('.planning-page-content');if(!content)return null;content.querySelectorAll('.admin-plan-page-nav').forEach(node=>node.classList.add('planning-person-hidden-nav'));content.querySelectorAll('.admin-plan-loading').forEach(node=>node.remove());let planning=content.querySelector('.planning-by-day');
    if(!planning){planning=document.createElement('div');planning.className='planning-by-day admin-refactor-planning';const footer=content.querySelector('.admin-plan-review-footer');if(footer)content.insertBefore(planning,footer);else content.appendChild(planning)}planning.classList.add('planning-person-agenda');return planning;
  }
  function mountAgenda(root,p,data){const planning=ensurePlanningContainer(root);if(!planning)return;closePlanningActivityActions();planning.innerHTML=agendaHtml(p,data);root.classList.add('planning-person-agenda-page');const eyebrow=root.querySelector('.planning-profile-copy>.eyebrow');if(eyebrow)eyebrow.textContent='Planejamento do voluntário';if(typeof applyI18n==='function')applyI18n(planning)}
  function mountLoading(root){const planning=ensurePlanningContainer(root);if(planning)planning.innerHTML='<div class="empty compact-loading planning-person-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>'}
  function mountError(root,error){const planning=ensurePlanningContainer(root);if(planning)planning.innerHTML=`<div class="notice danger planning-person-error"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(error?.message||'Não foi possível carregar o planejamento.')}</div></div>`}

  function enhancePlanningPerson(){
    if(state.managerPage!=='planning'||!state.managerPlanningPersonId||String(state.managerPlanningTab||'plan')!=='plan')return;const root=app.querySelector('.planning-detail-page');if(!root)return;const p=planningPerson();if(!p)return;
    const tabs=root.querySelector('.person-refactor-tabs'),head=root.querySelector('.planning-profile-head');if(tabs&&head&&!tabs.classList.contains('planning-profile-tabs')){tabs.classList.add('planning-profile-tabs');head.appendChild(tabs)}
    const id=String(p.id),version=bodyVersion(),current=cache.get(id);if(current&&current.version===version&&Date.now()-current.at<CACHE_MS){mountAgenda(root,p,current);return}mountLoading(root);
    loadAgenda(p).then(data=>{if(state.managerPage!=='planning'||String(state.managerPlanningPersonId)!==id||String(state.managerPlanningTab||'plan')!=='plan')return;const activeRoot=app.querySelector('.planning-detail-page');if(activeRoot)mountAgenda(activeRoot,planningPerson()||p,data)}).catch(error=>{console.error('Falha ao carregar planejamento individual:',error);const activeRoot=app.querySelector('.planning-detail-page');if(activeRoot&&String(state.managerPlanningPersonId)===id)mountError(activeRoot,error)});
  }

  async function refreshPlanning(applicationId){
    const id=String(applicationId||state.managerPlanningPersonId||'');if(id)cache.delete(id);if(typeof invalidateManagerScheduleCache==='function')invalidateManagerScheduleCache();if(typeof invalidateManagerPendingChanges==='function')invalidateManagerPendingChanges();if(state.planningBoardLoadedRange!==undefined)state.planningBoardLoadedRange='';
    const p=id&&typeof candidateById==='function'?candidateById(id):null;if(!p)return null;const data=await loadAgenda(p,{force:true});const root=app.querySelector('.planning-detail-page');if(root&&String(state.managerPlanningPersonId)===id&&String(state.managerPlanningTab||'plan')==='plan')mountAgenda(root,p,data);return data;
  }
  window.refreshPlanningPersonAgenda=refreshPlanning;

  window.closePlanningActivityActions=function(){document.querySelectorAll('.planning-activity-menu:not([hidden])').forEach(menu=>{menu.hidden=true;menu.closest('.planning-activity-tools')?.querySelector('.planning-activity-trigger')?.setAttribute('aria-expanded','false')})};
  window.togglePlanningActivityActions=function(button,event){event?.preventDefault?.();event?.stopPropagation?.();const menu=button?.closest('.planning-activity-tools')?.querySelector('.planning-activity-menu');if(!menu)return;const open=menu.hidden;closePlanningActivityActions();menu.hidden=!open;button.setAttribute('aria-expanded',String(open))};

  async function getSession(applicationId,sessionId){const cached=sessionRegistry.get(String(sessionId));if(cached)return cached;const rows=await window.OleiroServices?.planning?.listSessions?.({applicationId});return (rows||[]).find(row=>String(row.id)===String(sessionId))||null}

  window.planningConfirmSession=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);closePlanningActivityActions();try{await window.OleiroServices.planning.updateSession(sessionId,{status:'confirmed',confirmedAt:new Date()});await refreshPlanning(applicationId);showToast('Atividade confirmada.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível confirmar a atividade.')}};
  window.planningReviewPostApproval=async function(encodedApplicationId,encodedActivityId,decision,note=''){const applicationId=decodeURIComponent(encodedApplicationId),activityId=decodeURIComponent(encodedActivityId);closePlanningActivityActions();if(decision==='adjustments'&&!String(note||'').trim())return showToast('Informe o reajuste solicitado.');try{await window.OleiroServices.planning.reviewPostApprovalProposal({applicationId,activityId,decision,note:String(note||'').trim()});if(typeof closeModal==='function')closeModal();await refreshPlanning(applicationId);showToast(decision==='approve'?'Atividade aprovada.':decision==='reject'?'Atividade recusada.':'Reajuste enviado ao voluntário.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível revisar a atividade.')}};
  window.planningOpenPostApprovalAdjustment=function(encodedApplicationId,encodedActivityId){closePlanningActivityActions();openModal('Solicitar reajuste','Explique o que precisa ser alterado nesta nova atividade.','<div class="field"><label for="planningPostAdjustment">Orientação ao voluntário</label><textarea id="planningPostAdjustment" class="textarea" placeholder="Ex.: reduzir a duração para 60 minutos."></textarea></div>',`<button class="btn btn-primary btn-block" type="button" onclick="planningReviewPostApproval('${encodedApplicationId}','${encodedActivityId}','adjustments',document.getElementById('planningPostAdjustment').value.trim())">Enviar reajuste</button>`)};
  window.planningOpenPostApprovalReject=function(encodedApplicationId,encodedActivityId){closePlanningActivityActions();openModal('Recusar atividade','A atividade nova não será adicionada ao planejamento.','<div class="field"><label for="planningPostReject">Motivo da recusa <small>(opcional)</small></label><textarea id="planningPostReject" class="textarea"></textarea></div>',`<button class="btn btn-danger btn-block" type="button" onclick="planningReviewPostApproval('${encodedApplicationId}','${encodedActivityId}','reject',document.getElementById('planningPostReject').value.trim())">Recusar atividade</button>`)};

  window.planningReviewExistingChange=async function(encodedApplicationId,encodedSessionId,decision,note=''){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);closePlanningActivityActions();if(decision==='adjustments'&&!String(note||'').trim())return showToast('Informe o reajuste solicitado.');try{await window.OleiroServices.planning.reviewExistingChange({sessionId,decision,note:String(note||'').trim()});if(typeof closeModal==='function')closeModal();await refreshPlanning(applicationId);showToast(decision==='approve'?'Mudança aprovada.':decision==='reject'?'Mudança recusada.':'Reajuste enviado ao voluntário.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível revisar a alteração.')}};
  window.planningOpenExistingAdjustment=function(encodedApplicationId,encodedSessionId){closePlanningActivityActions();openModal('Solicitar reajuste','Explique o que o voluntário precisa alterar nesta proposta.','<div class="field"><label for="planningExistingAdjustment">Orientação ao voluntário</label><textarea id="planningExistingAdjustment" class="textarea" placeholder="Ex.: manter a data e alterar apenas o período."></textarea></div>',`<button class="btn btn-primary btn-block" type="button" onclick="planningReviewExistingChange('${encodedApplicationId}','${encodedSessionId}','adjustments',document.getElementById('planningExistingAdjustment').value.trim())">Enviar reajuste</button>`)};
  window.planningOpenExistingReject=function(encodedApplicationId,encodedSessionId){closePlanningActivityActions();openModal('Recusar alteração','A atividade será mantida como estava antes da solicitação.','<div class="field"><label for="planningExistingReject">Motivo da recusa <small>(opcional)</small></label><textarea id="planningExistingReject" class="textarea"></textarea></div>',`<button class="btn btn-danger btn-block" type="button" onclick="planningReviewExistingChange('${encodedApplicationId}','${encodedSessionId}','reject',document.getElementById('planningExistingReject').value.trim())">Recusar alteração</button>`)};
  window.planningOpenEdit=function(encodedApplicationId,encodedSessionId,encodedDate){closePlanningActivityActions();if(typeof openAdminEditPlanningSession!=='function')return showToast('Edição indisponível.');openAdminEditPlanningSession(encodedApplicationId,encodedSessionId,encodedDate)};

  function selectGroupChoices(groupId){const groups=String(groupId||'Livre').split('+').map(v=>v.trim()).filter(Boolean);document.querySelectorAll('input[data-group-choice="manager-primary"]').forEach(box=>{box.checked=groups.includes(box.value)||(groups.length===0&&box.value==='Livre');box.dispatchEvent(new Event('change',{bubbles:true}))})}
  window.planningOpenDuplicate=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),s=await getSession(applicationId,sessionId);closePlanningActivityActions();if(!s)return showToast('Atividade não encontrada.');openAdminPlanningActivity(safe(applicationId),safe(iso(s.date)));requestAnimationFrame(()=>setTimeout(()=>{const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value??''};set('managerActName',sessionName(s));set('managerActDesc',s.activityDescription||s.activity?.description||'');set('managerActDuration',Number(s.duration||s.activity?.duration)||60);set('managerActMaterials',s.materials||s.activity?.materials||'');set('managerActNotes',s.notes||s.activity?.notes||'');set('managerActPeriod',sessionPeriod(s));selectGroupChoices(s.groupId||'Livre');const title=document.querySelector('#modalRoot .modal-title,.modal h2');if(title&&/adicionar/i.test(title.textContent||''))title.textContent='Duplicar atividade'},0))};

  window.planningOpenMove=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=typeof candidateById==='function'?candidateById(applicationId):null,s=await getSession(applicationId,sessionId);closePlanningActivityActions();if(!p||!s)return showToast('Atividade não encontrada.');const dates=eligibleDates(p);if(!dates.length)return showToast('Não há dia útil disponível no período da estadia.');const current=iso(s.date),period=sessionPeriod(s);openModal('Mover atividade',escapeHtml(sessionName(s)),`<div class="field"><label for="planningMoveDate">Nova data</label><select id="planningMoveDate" class="select">${dates.map(date=>`<option value="${escapeHtml(date)}" ${date===current?'selected':''}>${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date))}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label for="planningMovePeriod">Período</label><select id="planningMovePeriod" class="select">${['Sem preferência','Manhã','Tarde','Noite'].map(v=>`<option value="${escapeHtml(v)}" ${v===period?'selected':''}>${escapeHtml(v)}</option>`).join('')}</select></div>`,`<button class="btn btn-primary btn-block" type="button" onclick="planningSaveMove('${safe(applicationId)}','${safe(sessionId)}')">Mover</button>`)};
  window.planningSaveMove=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),date=document.getElementById('planningMoveDate')?.value||'',period=document.getElementById('planningMovePeriod')?.value||'Sem preferência';if(!date)return;try{await window.OleiroServices.planning.updateSession(sessionId,{date,period});closeModal();await refreshPlanning(applicationId);showToast('Atividade movida.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a atividade.')}};

  window.planningOpenGroup=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=typeof candidateById==='function'?candidateById(applicationId):null,s=await getSession(applicationId,sessionId);closePlanningActivityActions();if(!p||!s)return showToast('Atividade não encontrada.');let rows=[];try{rows=await window.OleiroServices.groups.list({unitId:p.unitId||String(p.unit||'').toLowerCase()})}catch{}const codes=[...new Set([...(rows||[]).map(r=>String(r.code||r.id||'').trim()).filter(Boolean),'A','B','C','D'])],selected=String(s.groupId||'Livre').split('+').map(v=>v.trim()),options=[...codes,'Livre'];openModal('Definir grupo',escapeHtml(sessionName(s)),`<div class="check-grid">${options.map(group=>`<label class="check-card"><input type="checkbox" data-planning-group value="${escapeHtml(group)}" ${selected.includes(group)?'checked':''}><span>${group==='Livre'?'Participação livre':`Grupo ${escapeHtml(group)}`}</span></label>`).join('')}</div>`,`<button class="btn btn-primary btn-block" type="button" onclick="planningSaveGroup('${safe(applicationId)}','${safe(sessionId)}')">Salvar grupo</button>`);requestAnimationFrame(()=>document.querySelectorAll('input[data-planning-group]').forEach(input=>input.addEventListener('change',()=>{const boxes=[...document.querySelectorAll('input[data-planning-group]')];if(input.checked&&input.value==='Livre')boxes.forEach(b=>{if(b!==input)b.checked=false});else if(input.checked)boxes.filter(b=>b.value==='Livre').forEach(b=>b.checked=false)})))};
  window.planningSaveGroup=async function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);let groups=[...document.querySelectorAll('input[data-planning-group]:checked')].map(i=>i.value);if(!groups.length)return showToast('Selecione um grupo ou participação livre.');if(groups.includes('Livre'))groups=['Livre'];const groupId=groups[0]==='Livre'?'Livre':groups.join(' + '),participation=groups[0]==='Livre'?'Livre':groups.length>1?`Grupos ${groups.join(' + ')}`:`Grupo ${groups[0]}`;try{await window.OleiroServices.planning.updateSession(sessionId,{groupId,participation});closeModal();await refreshPlanning(applicationId);showToast('Grupo atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o grupo.')}};

  document.addEventListener('click',event=>{if(!event.target.closest?.('.planning-activity-tools'))closePlanningActivityActions()},true);
  renderManager=function(){const result=baseRenderManager();queueMicrotask(enhancePlanningPerson);return result};window.renderManager=renderManager;render=function(){return renderManager()};window.render=render;
  requestAnimationFrame(enhancePlanningPerson);
})();