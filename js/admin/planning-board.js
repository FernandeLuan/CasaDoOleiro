/* R65 — Planejamento deixa de ser uma segunda lista de voluntários e vira quadro por dia/voluntário. */
(function planningBoardR65(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_BOARD_R65__)return;
  window.__OLEIRO_PLANNING_BOARD_R65__=true;

  if(!document.querySelector('link[data-planning-board-r65]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='../css/planning-board-r65.css?v=20260903-r65';link.dataset.planningBoardR65='1';document.head.appendChild(link);
  }

  const baseRenderManager=window.renderManager||renderManager;
  const baseNavigateManager=window.navigateManager||navigateManager;
  const BOARD_CACHE_MS=2*60*1000;
  const MAX_APPLICATION_PAGES=3;
  const SESSION_CONCURRENCY=4;

  function addDaysIso(iso,days){const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function normalized(value){return String(value||'').trim().toLocaleLowerCase('pt-BR')}
  function safe(value){return encodeURIComponent(String(value??''))}
  function minutesText(value){const minutes=Math.max(0,Number(value)||0),h=Math.floor(minutes/60),m=minutes%60;if(!h)return `${m}min`;return m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`}
  function rowMinutes(row){return Number(row.duration)||Number(row.activity?.duration)||60}
  function personPeriod(p){const from=String(p?.from||p?.stayStart||'').slice(0,10),to=String(p?.to||p?.stayEnd||'').slice(0,10);return from&&to?`${fmtDate(from,true)}–${fmtDate(to,true)}`:'Período não informado'}
  function dateParts(iso){
    const raw=String(iso||''),match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return {day:'—',short:'—',weekday:'Dia',weekdayShort:'—'};
    const locale=typeof currentLocale==='function'?currentLocale():'pt-BR',date=new Date(`${raw}T12:00:00`);let weekday=new Intl.DateTimeFormat(locale,{weekday:'long'}).format(date).replace(/-feira$/i,'');weekday=weekday.charAt(0).toUpperCase()+weekday.slice(1);return {day:match[3],short:`${match[3]}/${match[2]}`,weekday,weekdayShort:weekday.slice(0,3).toUpperCase()};
  }
  function statusBadge(p){const meta=typeof statusMeta==='function'?statusMeta(p?.status):[p?.status||'Status',''];return `<span class="badge ${escapeHtml(meta?.[1]||'')}">${escapeHtml(meta?.[0]||'Status')}</span>`}
  function initials(name){return String(name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase()}
  function sessionName(row){return row.activityName||row.activity?.name||'Atividade'}
  function sessionPeriod(row){return typeof activityPeriodValue==='function'?activityPeriodValue(row,row.activity||{}):(row.period||row.activity?.period||'Sem preferência')}
  function sessionGroup(row){const group=String(row.groupId||'').trim();return group&&group!=='A definir'?group:''}

  state.planningBoardView=state.planningBoardView||'day';
  state.planningBoardSearch=state.planningBoardSearch||'';
  state.planningBoardStatus=state.planningBoardStatus||'all';
  state.planningBoardUnit=state.planningBoardUnit||'all';
  state.planningBoardFrom=state.planningBoardFrom||String(_oleiroToday||new Date().toISOString().slice(0,10));
  state.planningBoardTo=state.planningBoardTo||addDaysIso(state.planningBoardFrom,30);
  state.planningBoardCandidates=state.planningBoardCandidates||[];
  state.planningBoardSessions=state.planningBoardSessions||[];
  state.planningBoardCandidatesAt=state.planningBoardCandidatesAt||0;
  state.planningBoardLoadedRange=state.planningBoardLoadedRange||'';
  state.planningBoardLoading=false;
  state.planningBoardError='';

  function boardCandidatesFiltered(){
    const term=normalized(state.planningBoardSearch),status=String(state.planningBoardStatus||'all'),unit=String(state.planningBoardUnit||'all');
    return (state.planningBoardCandidates||[]).filter(p=>{
      if(p.status==='rejected'||p.inactive)return false;
      if(status!=='all'&&String(p.status)!==status)return false;
      if(unit!=='all'&&String(p.unitId||'')!==unit)return false;
      if(term&&!`${p.name||''} ${p.country||''} ${p.unit||p.unitName||''}`.toLocaleLowerCase('pt-BR').includes(term))return false;
      return true;
    });
  }
  function filteredIds(){return new Set(boardCandidatesFiltered().map(p=>String(p.id)))}
  function boardSessionsFiltered(){
    const ids=filteredIds();return (state.planningBoardSessions||[]).filter(row=>ids.has(String(row.applicationId))&&row.status!=='rejected'&&row.reviewStatus!=='rejected');
  }
  function personByBoardId(id){return (state.planningBoardCandidates||[]).find(p=>String(p.id)===String(id))||null}
  function unitOptions(){
    const map=new Map();(state.units||[]).forEach(u=>map.set(String(u.id),u.name||u.id));(state.planningBoardCandidates||[]).forEach(p=>{if(p.unitId&&!map.has(String(p.unitId)))map.set(String(p.unitId),p.unit||p.unitName||p.unitId)});
    return [...map.entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR')).map(([id,name])=>`<option value="${escapeHtml(id)}" ${String(state.planningBoardUnit)===String(id)?'selected':''}>${escapeHtml(name)}</option>`).join('');
  }
  function statusOptions(){
    const rows=[['all','Todos os status'],['pending','Em preparação'],['analysis','Em análise'],['adjustments','Ajustes'],['meeting','Reunião'],['approved','Aprovado']];
    return rows.map(([value,label])=>`<option value="${value}" ${state.planningBoardStatus===value?'selected':''}>${label}</option>`).join('');
  }

  function planningFiltersHtml(){
    return `<div class="planning-board-filters">
      <div class="planning-board-search"><i class="fa-solid fa-magnifying-glass"></i><input class="input" type="search" value="${escapeHtml(state.planningBoardSearch||'')}" placeholder="Buscar voluntário por nome" oninput="updatePlanningBoardSearch(this.value)"></div>
      <select class="select" aria-label="Status" onchange="updatePlanningBoardFilter('status',this.value)">${statusOptions()}</select>
      <select class="select" aria-label="Unidade" onchange="updatePlanningBoardFilter('unit',this.value)"><option value="all">Todas as unidades</option>${unitOptions()}</select>
      <input class="input" type="date" aria-label="Data inicial" value="${escapeHtml(state.planningBoardFrom)}" onchange="updatePlanningBoardFilter('from',this.value)">
      <input class="input" type="date" aria-label="Data final" value="${escapeHtml(state.planningBoardTo)}" onchange="updatePlanningBoardFilter('to',this.value)">
      <button class="planning-board-clear" type="button" onclick="resetPlanningBoardFilters()" title="Limpar filtros" aria-label="Limpar filtros"><i class="fa-solid fa-rotate-left"></i></button>
    </div>`;
  }

  function dayGroups(){
    const map=new Map();boardSessionsFiltered().forEach(row=>{const date=String(row.date||'');if(!date)return;const list=map.get(date)||[];list.push(row);map.set(date,list)});
    return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>({date,rows:rows.sort((a,b)=>{const order={'Manhã':1,'Tarde':2,'Noite':3,'Sem preferência':4};const p=(order[sessionPeriod(a)]||9)-(order[sessionPeriod(b)]||9);if(p)return p;return String(a.person?.name||'').localeCompare(String(b.person?.name||''),'pt-BR')})}));
  }
  function personGroups(){
    const sessions=boardSessionsFiltered(),byPerson=new Map();sessions.forEach(row=>{const key=String(row.applicationId),list=byPerson.get(key)||[];list.push(row);byPerson.set(key,list)});
    return boardCandidatesFiltered().map(person=>({person,rows:(byPerson.get(String(person.id))||[]).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')))}));
  }

  function activityRow(row){
    const person=row.person||personByBoardId(row.applicationId)||{},group=sessionGroup(row),meta=[`${rowMinutes(row)} min`,sessionPeriod(row),group?`Grupo ${group}`:'Livre'].filter(Boolean).join(' · ');
    return `<button class="planning-board-activity" type="button" onclick="openPlanningBoardPerson('${safe(person.id||row.applicationId)}')"><div class="planning-board-activity-copy"><strong>${escapeHtml(sessionName(row))}</strong><span>${escapeHtml(person.name||'Voluntário')} · ${escapeHtml(meta)}</span></div><div class="planning-board-activity-side">${statusBadge(person)}<i class="fa-solid fa-chevron-right"></i></div></button>`;
  }
  function dayCard(group){
    const parts=dateParts(group.date),total=group.rows.reduce((sum,row)=>sum+rowMinutes(row),0),visible=group.rows.slice(0,5),extra=group.rows.length-visible.length;
    return `<article class="planning-board-day"><header class="planning-board-day-head"><div class="planning-board-datebox"><strong>${escapeHtml(parts.day)}</strong><span>${escapeHtml(parts.weekdayShort)}</span></div><div class="planning-board-day-copy"><strong>${escapeHtml(parts.weekday)} · ${escapeHtml(parts.short)}</strong><span>${group.rows.length} ${group.rows.length===1?'atividade planejada':'atividades planejadas'}</span></div><div class="planning-board-day-total"><strong>${escapeHtml(minutesText(total))}</strong><span>Total</span></div></header><div class="planning-board-activities">${visible.map(activityRow).join('')}</div>${extra?`<button class="planning-board-more" type="button" onclick="setPlanningBoardView('volunteer')">+ ${extra} ${extra===1?'atividade':'atividades'} neste dia</button>`:''}</article>`;
  }
  function personDayRows(rows){
    const map=new Map();rows.forEach(row=>{const date=String(row.date||'');if(!date)return;const list=map.get(date)||[];list.push(row);map.set(date,list)});
    return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,list])=>({date,rows:list}));
  }
  function personCard(group){
    const p=group.person,days=personDayRows(group.rows),visible=days.slice(0,7),total=group.rows.reduce((sum,row)=>sum+rowMinutes(row),0);
    const dayHtml=visible.length?visible.map(day=>{const parts=dateParts(day.date),minutes=day.rows.reduce((sum,row)=>sum+rowMinutes(row),0);return `<button class="planning-board-person-day" type="button" onclick="openPlanningBoardPerson('${safe(p.id)}')"><div class="planning-board-person-day-date"><strong>${escapeHtml(parts.short)}</strong><span>${escapeHtml(parts.weekdayShort)}</span></div><div class="planning-board-person-day-copy"><strong>${day.rows.length} ${day.rows.length===1?'atividade':'atividades'}</strong><span>${escapeHtml(day.rows.slice(0,2).map(sessionName).join(' · '))}${day.rows.length>2?' · …':''}</span></div><span class="planning-board-person-day-total">${escapeHtml(minutesText(minutes))}</span></button>`}).join(''):'<div class="empty" style="margin:10px">Nenhuma atividade no período selecionado.</div>';
    return `<article class="planning-board-person-card"><header class="planning-board-person-head"><div class="avatar">${escapeHtml(initials(p.name))}</div><div class="planning-board-person-copy"><strong>${escapeHtml(p.name||'Voluntário')}</strong><span>${escapeHtml(p.country||'—')} · ${escapeHtml(p.unit||p.unitName||'—')} · ${escapeHtml(personPeriod(p))}</span></div>${statusBadge(p)}</header><div class="planning-board-person-days">${dayHtml}</div><button class="planning-board-person-open" type="button" onclick="openPlanningBoardPerson('${safe(p.id)}')">Abrir planejamento · ${escapeHtml(minutesText(total))}</button></article>`;
  }

  function boardBodyHtml(){
    if(state.planningBoardLoading&&!state.planningBoardSessions.length)return '<div class="empty planning-board-loading"><div><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamentos...</div></div>';
    if(state.planningBoardError&&!state.planningBoardSessions.length)return `<div class="empty planning-board-empty"><div><i class="fa-solid fa-triangle-exclamation"></i>${escapeHtml(state.planningBoardError)}</div></div>`;
    if(state.planningBoardView==='volunteer'){
      const groups=personGroups();if(!groups.length)return '<div class="empty planning-board-empty"><div><i class="fa-regular fa-calendar-xmark"></i>Nenhum voluntário encontrado com estes filtros.</div></div>';
      return `<div class="planning-board-volunteer-grid">${groups.map(personCard).join('')}</div>`;
    }
    const groups=dayGroups();if(!groups.length)return '<div class="empty planning-board-empty"><div><i class="fa-regular fa-calendar-xmark"></i>Nenhuma atividade planejada neste período.</div></div>';
    return `<div class="planning-board-grid">${groups.map(dayCard).join('')}</div>`;
  }

  function planningBoardHtml(){
    const people=boardCandidatesFiltered(),sessions=boardSessionsFiltered(),single=state.planningBoardSearch&&people.length===1?people[0]:null;
    const singleHtml=single?`<div class="planning-board-selected"><div><strong>${escapeHtml(single.name)}</strong><span>${escapeHtml(single.country||'—')} · ${escapeHtml(single.unit||single.unitName||'—')} · ${escapeHtml(personPeriod(single))}</span>${statusBadge(single)}</div><button class="btn btn-outline btn-xs" type="button" onclick="openPlanningBoardPerson('${safe(single.id)}')">Abrir perfil</button></div>`:'';
    return `<section class="section planning-board-page compact-page-top"><div class="planning-board-top"><div class="planning-board-title"><span class="eyebrow">Planejamento</span><h1>Quadro de planejamento</h1><p>Organize e revise o que foi planejado por dia ou por voluntário.</p></div><div class="planning-board-view-switch" role="group" aria-label="Organização do planejamento"><button class="${state.planningBoardView==='day'?'active':''}" type="button" onclick="setPlanningBoardView('day')">Por dia</button><button class="${state.planningBoardView==='volunteer'?'active':''}" type="button" onclick="setPlanningBoardView('volunteer')">Por voluntário</button></div></div>${planningFiltersHtml()}<div class="planning-board-filter-caption"><span><strong>${people.length}</strong> ${people.length===1?'voluntário':'voluntários'} · <strong>${sessions.length}</strong> ${sessions.length===1?'atividade':'atividades'}</span><span>${escapeHtml(fmtDate(state.planningBoardFrom,true))} → ${escapeHtml(fmtDate(state.planningBoardTo,true))}${state.planningBoardLoading?' · atualizando…':''}</span></div>${state.planningBoardError?`<div class="notice warning" style="margin-bottom:10px"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(state.planningBoardError)}</div></div>`:''}${singleHtml}${boardBodyHtml()}</section>`;
  }

  function replacePlanningIndex(){
    if(state.managerPage!=='planning'||state.managerPlanningPersonId)return;
    const main=app.querySelector('.admin-content-r62 > main.page')||app.querySelector('main.page');if(!main)return;main.innerHTML=planningBoardHtml();if(typeof applyI18n==='function')applyI18n(main);
  }

  async function fetchCandidates(){
    if(!window.OleiroServices?.applications?.list)throw new Error('Serviço de voluntariado indisponível.');
    const rows=[],known=new Set();let cursor=null,hasMore=true,page=0;
    while(hasMore&&page<MAX_APPLICATION_PAGES){const result=await window.OleiroServices.applications.list({status:'all',unit:'all',search:'',cursor,limit:50});(result?.items||[]).forEach(item=>{const id=String(item.id);if(!known.has(id)){known.add(id);rows.push(item)}});cursor=result?.nextCursor||null;hasMore=!!result?.hasMore&&!!cursor;page+=1}
    return rows;
  }
  async function mapLimited(items,limit,worker){
    const out=new Array(items.length),next={value:0};async function run(){while(next.value<items.length){const index=next.value++;try{out[index]=await worker(items[index],index)}catch(error){out[index]={error,item:items[index]}}}}await Promise.all(Array.from({length:Math.min(limit,items.length)},run));return out;
  }
  async function loadPlanningBoardData({force=false}={}){
    if(state.planningBoardLoading)return;
    const from=String(state.planningBoardFrom||''),to=String(state.planningBoardTo||'');if(!from||!to||to<from){state.planningBoardError='O período selecionado é inválido.';render();return}
    const rangeKey=`${from}|${to}`;if(!force&&state.planningBoardLoadedRange===rangeKey&&Date.now()-(state.planningBoardLoadedAt||0)<BOARD_CACHE_MS){render();return}
    state.planningBoardLoading=true;state.planningBoardError='';render();
    try{
      if(force||!state.planningBoardCandidates.length||Date.now()-state.planningBoardCandidatesAt>BOARD_CACHE_MS){state.planningBoardCandidates=await fetchCandidates();state.planningBoardCandidatesAt=Date.now()}
      const relevant=(state.planningBoardCandidates||[]).filter(p=>p.status!=='rejected'&&!p.inactive&&(!p.from||p.from<=to)&&(!p.to||p.to>=from));
      if(!window.OleiroServices?.planning?.listSessions)throw new Error('Serviço de planejamento indisponível.');
      const results=await mapLimited(relevant,SESSION_CONCURRENCY,async person=>{const rows=await window.OleiroServices.planning.listSessions({applicationId:person.id,from,to});return (rows||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected').map(row=>({...row,applicationId:String(person.id),person}))});
      const sessions=[],failures=[];results.forEach(result=>{if(Array.isArray(result))sessions.push(...result);else if(result?.error)failures.push(result)});state.planningBoardSessions=sessions;state.planningBoardLoadedRange=rangeKey;state.planningBoardLoadedAt=Date.now();if(failures.length)state.planningBoardError=`${failures.length} planejamento(s) não puderam ser carregados nesta atualização.`;
    }catch(error){console.error('Falha ao carregar quadro de planejamento:',error);state.planningBoardError=error?.message||'Não foi possível carregar os planejamentos.'}
    finally{state.planningBoardLoading=false;if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render()}
  }

  window.setPlanningBoardView=function(view){state.planningBoardView=view==='volunteer'?'volunteer':'day';render()};
  window.updatePlanningBoardSearch=function(value){state.planningBoardSearch=String(value||'');clearTimeout(state._planningBoardSearchTimer);state._planningBoardSearchTimer=setTimeout(()=>{if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render()},90)};
  window.updatePlanningBoardFilter=function(field,value){
    if(field==='status')state.planningBoardStatus=String(value||'all');else if(field==='unit')state.planningBoardUnit=String(value||'all');else if(field==='from')state.planningBoardFrom=String(value||state.planningBoardFrom);else if(field==='to')state.planningBoardTo=String(value||state.planningBoardTo);
    if(field==='from'||field==='to'){state.planningBoardLoadedRange='';render();loadPlanningBoardData({force:true})}else render();
  };
  window.resetPlanningBoardFilters=function(){state.planningBoardSearch='';state.planningBoardStatus='all';state.planningBoardUnit='all';state.planningBoardFrom=String(_oleiroToday||new Date().toISOString().slice(0,10));state.planningBoardTo=addDaysIso(state.planningBoardFrom,30);state.planningBoardLoadedRange='';render();loadPlanningBoardData({force:true})};
  window.openPlanningBoardPerson=function(encodedId){
    const id=decodeURIComponent(encodedId),p=personByBoardId(id);if(!p)return;
    const byId=new Map((state.candidates||[]).map(row=>[String(row.id),row]));byId.set(String(p.id),p);state.candidates=[...byId.values()];state.managerPlanningOrigin='planning';return openPerson(String(p.id),'plan');
  };
  window.refreshPlanningBoard=function(){return loadPlanningBoardData({force:true})};

  renderManager=function(){const result=baseRenderManager();replacePlanningIndex();return result};window.renderManager=renderManager;
  render=function(){return renderManager()};window.render=render;
  navigateManager=function(page){
    if(page!=='planning')return baseNavigateManager(page);
    state.managerPage='planning';state.managerPlanningPersonId='';state.managerPlanningBody='';state.managerPlanningTab='plan';state.managerPlanningOrigin='planning';render();if(typeof afterNavigation==='function')afterNavigation();loadPlanningBoardData().catch(console.error);
  };
  window.navigateManager=navigateManager;

  if(state.role==='manager'&&state.managerPage==='planning'&&!state.managerPlanningPersonId){render();loadPlanningBoardData().catch(console.error)}
})();
