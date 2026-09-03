/* R66 — Planejamento individual como agenda semanal, sempre de segunda a sexta. */
(function planningPersonAgendaR66(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_PERSON_AGENDA_R66__)return;
  window.__OLEIRO_PLANNING_PERSON_AGENDA_R66__=true;

  if(!document.querySelector('link[data-planning-person-agenda-r66]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='../css/planning-person-agenda-r66.css?v=20260903-r66';
    link.dataset.planningPersonAgendaR66='1';
    document.head.appendChild(link);
  }

  const baseRenderManager=window.renderManager||renderManager;
  const cache=new Map();
  const inflight=new Map();
  const CACHE_MS=60*1000;

  function safe(value){return encodeURIComponent(String(value??''))}
  function iso(value){return String(value||'').slice(0,10)}
  function addDays(value,days){const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function isWeekday(value){const date=iso(value);if(!date)return false;const day=new Date(`${date}T12:00:00`).getDay();return day>=1&&day<=5}
  function mondayOf(value){const date=iso(value),d=new Date(`${date}T12:00:00`),day=d.getDay(),offset=(day+6)%7;d.setDate(d.getDate()-offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function shortDate(value){const raw=iso(value),parts=raw.split('-');return parts.length===3?`${parts[2]}/${parts[1]}`:raw}
  function weekdayParts(value){
    const date=new Date(`${iso(value)}T12:00:00`),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
    let full=new Intl.DateTimeFormat(locale,{weekday:'long'}).format(date);full=full.charAt(0).toUpperCase()+full.slice(1);
    const short=new Intl.DateTimeFormat(locale,{weekday:'short'}).format(date).replace('.','').slice(0,3).toUpperCase();
    return {full,short};
  }
  function minutesLabel(value){const total=Math.max(0,Number(value)||0),h=Math.floor(total/60),m=total%60;if(!h)return `${m}min`;return m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`}
  function rowMinutes(row){return Number(row?.duration)||Number(row?.activity?.duration)||60}
  function planningPerson(){return typeof candidateById==='function'?candidateById(state.managerPlanningPersonId):null}
  function eligibleDates(p){
    const start=iso(p?.stayStart||p?.from),end=iso(p?.stayEnd||p?.to);
    const dates=typeof planningEligibleDates==='function'?planningEligibleDates(start,end):[];
    return dates.filter(date=>isWeekday(date));
  }
  function normalizeSession(row,p){
    const activity=row?.activity||{
      id:String(row?.activityId||''),name:row?.activityName||'Atividade',description:row?.activityDescription||'',duration:Number(row?.duration)||60,
      participation:row?.participation||'Livre',materials:row?.materials||'',notes:row?.notes||'',period:row?.period||'Sem preferência',ownerName:row?.ownerName||p?.name||'Voluntário'
    };
    return {...row,applicationId:String(row?.applicationId||p?.id||''),activity};
  }
  function bodyVersion(){return String(state.managerPlanningBody||'')}

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

  function dayCardHtml(p,date,sessions){
    let generated='';
    try{generated=typeof adminPlanningDayCard==='function'?adminPlanningDayCard(p,{date,sessions}):''}catch(error){console.warn('Falha ao reutilizar card de planejamento:',error)}
    const template=document.createElement('template');template.innerHTML=generated;
    const oldCard=template.content.querySelector('details.planning-day-card'),content=oldCard?.querySelector('.planning-day-content');
    const signals=oldCard?.querySelector('.r31-day-signals')?.innerHTML||'';
    if(content){content.querySelectorAll('.admin-create-activity-action').forEach(node=>node.remove())}
    const total=sessions.reduce((sum,row)=>sum+rowMinutes(row),0),parts=weekdayParts(date),count=sessions.length;
    const summary=count?`${count} ${count===1?'atividade':'atividades'} · ${minutesLabel(total)}`:'Nenhuma atividade planejada';
    let inner=content?.innerHTML||'';
    if(!count)inner=`<div class="planning-person-empty"><i class="fa-regular fa-calendar"></i><span>Nenhuma atividade planejada</span></div>`;
    const plus=`<button class="planning-person-add" type="button" title="Adicionar atividade em ${escapeHtml(shortDate(date))}" aria-label="Adicionar atividade em ${escapeHtml(shortDate(date))}" onclick="event.preventDefault();event.stopPropagation();openAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-plus"></i></button>`;
    return `<article class="planning-person-day ${count?'has-activities':'is-empty'}" data-plan-date="${escapeHtml(date)}">
      <header class="planning-person-day-head"><div class="planning-person-day-copy"><div class="planning-person-day-title"><strong>${escapeHtml(parts.short)} ${escapeHtml(shortDate(date))}</strong><span>${escapeHtml(parts.full)}</span></div><div class="planning-person-day-summary">${escapeHtml(summary)}${signals?`<span class="planning-person-day-signals">${signals}</span>`:''}</div></div>${plus}</header>
      <div class="planning-person-day-body">${inner}</div>
    </article>`;
  }

  function agendaHtml(p,data){
    if(!data.dates.length)return '<div class="empty planning-person-no-days"><i class="fa-regular fa-calendar-xmark"></i>Não há dias úteis de atividade entre chegada e saída.</div>';
    const byDate=new Map();data.sessions.forEach(row=>{const date=iso(row.date);if(!byDate.has(date))byDate.set(date,[]);byDate.get(date).push(row)});
    const weeks=groupWeeks(data.dates);
    return `<div class="planning-person-weeks">${weeks.map(week=>`<section class="planning-person-week"><header class="planning-person-week-head"><div><span>SEMANA ${week.index}</span><strong>${escapeHtml(shortDate(week.monday))} → ${escapeHtml(shortDate(week.friday))}</strong></div></header><div class="planning-person-week-days">${week.days.map(date=>dayCardHtml(p,date,(byDate.get(date)||[]))).join('')}</div></section>`).join('')}</div>`;
  }

  function ensurePlanningContainer(root){
    const content=root.querySelector('.planning-page-content');if(!content)return null;
    content.querySelectorAll('.admin-plan-page-nav').forEach(node=>node.classList.add('planning-person-hidden-nav'));
    content.querySelectorAll('.admin-plan-loading').forEach(node=>node.remove());
    let planning=content.querySelector('.planning-by-day');
    if(!planning){planning=document.createElement('div');planning.className='planning-by-day admin-refactor-planning';const footer=content.querySelector('.admin-plan-review-footer');if(footer)content.insertBefore(planning,footer);else content.appendChild(planning)}
    planning.classList.add('planning-person-agenda');return planning;
  }

  function mountAgenda(root,p,data){
    const planning=ensurePlanningContainer(root);if(!planning)return;
    planning.innerHTML=agendaHtml(p,data);
    root.classList.add('planning-person-agenda-page');
    const eyebrow=root.querySelector('.planning-profile-copy>.eyebrow');if(eyebrow)eyebrow.textContent='Planejamento do voluntário';
    if(typeof applyI18n==='function')applyI18n(planning);
  }
  function mountLoading(root){
    const planning=ensurePlanningContainer(root);if(!planning)return;
    planning.innerHTML='<div class="empty compact-loading planning-person-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando agenda individual...</div>';
  }
  function mountError(root,error){
    const planning=ensurePlanningContainer(root);if(!planning)return;
    planning.innerHTML=`<div class="notice danger planning-person-error"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(error?.message||'Não foi possível carregar a agenda individual.')}</div></div>`;
  }

  function enhancePlanningPerson(){
    if(state.managerPage!=='planning'||!state.managerPlanningPersonId||String(state.managerPlanningTab||'plan')!=='plan')return;
    const root=app.querySelector('.planning-detail-page');if(!root)return;
    const p=planningPerson();if(!p)return;
    const tabs=root.querySelector('.person-refactor-tabs'),head=root.querySelector('.planning-profile-head');
    if(tabs&&head&&!tabs.classList.contains('planning-profile-tabs')){tabs.classList.add('planning-profile-tabs');head.appendChild(tabs)}
    const id=String(p.id),version=bodyVersion(),current=cache.get(id);
    if(current&&current.version===version&&Date.now()-current.at<CACHE_MS){mountAgenda(root,p,current);return}
    mountLoading(root);
    loadAgenda(p).then(data=>{
      if(state.managerPage!=='planning'||String(state.managerPlanningPersonId)!==id||String(state.managerPlanningTab||'plan')!=='plan')return;
      const activeRoot=app.querySelector('.planning-detail-page');if(activeRoot)mountAgenda(activeRoot,planningPerson()||p,data);
    }).catch(error=>{console.error('Falha ao carregar agenda individual:',error);const activeRoot=app.querySelector('.planning-detail-page');if(activeRoot&&String(state.managerPlanningPersonId)===id)mountError(activeRoot,error)});
  }

  window.refreshPlanningPersonAgenda=function(applicationId=''){
    const id=String(applicationId||state.managerPlanningPersonId||'');if(id)cache.delete(id);
    const p=id&&typeof candidateById==='function'?candidateById(id):null;
    if(p)return loadAgenda(p,{force:true}).then(data=>{const root=app.querySelector('.planning-detail-page');if(root&&String(state.managerPlanningPersonId)===id)mountAgenda(root,p,data);return data});
    return Promise.resolve(null);
  };

  renderManager=function(){const result=baseRenderManager();queueMicrotask(enhancePlanningPerson);return result};
  window.renderManager=renderManager;
  render=function(){return renderManager()};window.render=render;

  requestAnimationFrame(enhancePlanningPerson);
})();
