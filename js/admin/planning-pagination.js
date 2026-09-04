/* Planejamento: leitura incremental em blocos de 7 dias. */
(function planningPagination(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_PAGINATION__)return;
  window.__OLEIRO_PLANNING_PAGINATION__=true;

  const DAYS=7,CACHE_MS=120000,services=window.OleiroServices||{},planning=services.planning||{};
  const baseList=typeof planning.listSessions==='function'?planning.listSessions.bind(planning):null;
  const cache=new Map();
  window.__OLEIRO_PLANNING_PAGE_DAYS__=DAYS;

  function addDays(value,days){const d=new Date(`${String(value||'')}T12:00:00`);if(Number.isNaN(d.getTime()))return String(value||'');d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function today(){return String(typeof _oleiroToday!=='undefined'&&_oleiroToday?_oleiroToday:new Date().toISOString().slice(0,10))}
  function from(){return String(state.planningBoardFrom||today())}
  function target(){return String(state.planningBoardTo||addDays(from(),30))}
  function minDate(a,b){return a<b?a:b}
  function firstPage(start=from(),end=target()){return minDate(end,addDays(start,DAYS-1))}
  function pageTo(){const start=from(),end=target();let value=String(state.planningBoardPageTo||'');if(!value||value<start||value>end){value=firstPage(start,end);state.planningBoardPageTo=value}return value}
  function more(){return pageTo()<target()}
  function format(value){return typeof fmtDate==='function'?fmtDate(value,true):value}
  state.planningBoardPageTo=state.planningBoardPageTo||firstPage();

  function slices(start,end){const out=[];let cursor=start;while(cursor<=end){const last=minDate(end,addDays(cursor,DAYS-1));out.push([cursor,last]);cursor=addDays(last,1)}return out}
  function unique(rows){const map=new Map();(rows||[]).forEach((row,index)=>map.set(String(row?.id||row?.sessionId||`${row?.applicationId||''}-${row?.date||''}-${index}`),row));return [...map.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')))}
  async function readSlice(applicationId,start,end){const key=`${applicationId}|${start}|${end}`,hit=cache.get(key);if(hit&&Date.now()-hit.at<CACHE_MS)return hit.rows;let rows;if(Array.isArray(window.OleiroDemoDB?.sessions)){rows=window.OleiroDemoDB.sessions.filter(row=>String(row.applicationId)===String(applicationId)&&String(row.date||'')>=start&&String(row.date||'')<=end)}else rows=baseList?await baseList({applicationId,from:start,to:end}):[];rows=unique(rows);cache.set(key,{at:Date.now(),rows});return rows}

  if(baseList){planning.listSessions=async function({applicationId,from:start,to:end}={}){if(!applicationId)return [];start=String(start||from());end=String(end||target());const visibleTo=minDate(end,pageTo());if(visibleTo<start)return [];const chunks=[];for(const [a,b] of slices(start,visibleTo))chunks.push(await readSlice(applicationId,a,b));return unique(chunks.flat())};services.planning=planning}

  function styles(){if(document.getElementById('planningPaginationStyles'))return;const el=document.createElement('style');el.id='planningPaginationStyles';el.textContent='.planning-board-pagination{display:flex;justify-content:center;margin-top:12px}.planning-board-pagination button{width:min(100%,420px);min-height:44px;border:1px solid var(--border);border-radius:13px;background:var(--surface);color:var(--primary);font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px}.planning-board-pagination small{color:var(--muted);font-size:.57rem;font-weight:500}@media(max-width:700px){.planning-board-pagination button{width:100%;min-height:46px}}';document.head.appendChild(el)}

  function patch(){if(window.__OLEIRO_PLANNING_PAGINATION_PATCHED__||typeof window.updatePlanningBoardFilter!=='function'||typeof window.resetPlanningBoardFilters!=='function')return;window.__OLEIRO_PLANNING_PAGINATION_PATCHED__=true;const update=window.updatePlanningBoardFilter,reset=window.resetPlanningBoardFilters;window.updatePlanningBoardFilter=function(field,value){if(field==='from'||field==='to'){const start=field==='from'?String(value||from()):from(),end=field==='to'?String(value||target()):target();state.planningBoardPageTo=firstPage(start,end)}return update(field,value)};window.resetPlanningBoardFilters=function(){state.planningBoardPageTo=firstPage(today(),addDays(today(),30));return reset()}}
  function enhance(){patch();if(state.managerPage!=='planning'||state.managerPlanningPersonId)return;const page=document.querySelector('.planning-board-page');if(!page)return;page.querySelector('.planning-board-pagination')?.remove();if(!more())return;const wrap=document.createElement('div');wrap.className='planning-board-pagination';wrap.innerHTML=`<button type="button" onclick="loadMorePlanningBoardPage()"><i class="fa-solid fa-chevron-down"></i><span>Ver mais 7 dias</span><small>carregado até ${format(pageTo())}</small></button>`;page.appendChild(wrap)}
  window.loadMorePlanningBoardPage=async function(){if(state.planningBoardLoading||!more())return;state.planningBoardPageTo=minDate(target(),addDays(pageTo(),DAYS));state.planningBoardLoadedRange='';const y=window.scrollY;if(typeof window.refreshPlanningBoard==='function')await window.refreshPlanningBoard();requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}))};

  styles();const observer=new MutationObserver(()=>requestAnimationFrame(enhance));const root=document.getElementById('app');if(root)observer.observe(root,{childList:true,subtree:true});requestAnimationFrame(enhance);
})();
