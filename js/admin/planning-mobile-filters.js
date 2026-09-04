/* Planejamento mobile: busca + um único painel de filtros, seguindo o padrão do Voluntariado. */
(function planningMobileFilters(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_MOBILE_FILTERS__)return;
  window.__OLEIRO_PLANNING_MOBILE_FILTERS__=true;

  function addDaysIso(value,days){
    const d=new Date(`${String(value||'')}T12:00:00`);
    if(Number.isNaN(d.getTime()))return String(value||'');
    d.setDate(d.getDate()+Number(days||0));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function defaultRange(){
    const from=String(window._oleiroToday||new Date().toISOString().slice(0,10));
    return {from,to:addDaysIso(from,30)};
  }
  function activeFilters(){
    const defaults=defaultRange();
    return String(state.planningBoardView||'day')!=='day'||
      String(state.planningBoardStatus||'all')!=='all'||
      String(state.planningBoardUnit||'all')!=='all'||
      String(state.planningBoardFrom||defaults.from)!==defaults.from||
      String(state.planningBoardTo||defaults.to)!==defaults.to;
  }
  function unitOptions(){
    const map=new Map();
    (state.units||[]).forEach(unit=>map.set(String(unit.id),unit.name||unit.id));
    (state.planningBoardCandidates||[]).forEach(person=>{
      const id=String(person.unitId||'').trim();
      if(id&&!map.has(id))map.set(id,person.unit||person.unitName||id);
    });
    return [...map.entries()]
      .sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR'))
      .map(([id,name])=>`<option value="${escapeHtml(id)}" ${String(state.planningBoardUnit||'all')===id?'selected':''}>${escapeHtml(name)}</option>`)
      .join('');
  }
  function statusOptions(){
    const rows=[['all','Todos os status'],['pending','Em preparação'],['analysis','Em análise'],['adjustments','Ajustes'],['meeting','Reunião'],['approved','Aprovado']];
    return rows.map(([value,label])=>`<option value="${value}" ${String(state.planningBoardStatus||'all')===value?'selected':''}>${label}</option>`).join('');
  }

  function installStyles(){
    if(document.getElementById('planningMobileFiltersStyles'))return;
    const style=document.createElement('style');
    style.id='planningMobileFiltersStyles';
    style.textContent=`
      .planning-board-mobile-filter-button{display:none}
      @media(max-width:700px){
        .planning-board-title>.eyebrow,
        .planning-board-title>p,
        .planning-board-filter-caption{display:none!important}
        .planning-board-title h1{margin:0!important}
        .planning-board-top{margin-bottom:10px!important}
        .planning-board-view-switch{display:none!important}
        .planning-board-filters{
          display:grid!important;
          grid-template-columns:minmax(0,1fr) 46px!important;
          gap:8px!important;
          align-items:center!important;
          margin-bottom:12px!important;
        }
        .planning-board-filters>.planning-board-search{grid-column:auto!important;min-width:0}
        .planning-board-filters>select,
        .planning-board-filters>input[type="date"],
        .planning-board-filters>.planning-board-clear{display:none!important}
        .planning-board-mobile-filter-button{
          position:relative;
          width:46px;
          height:42px;
          display:grid!important;
          place-items:center;
          border:1px solid var(--border);
          border-radius:12px;
          background:var(--surface);
          color:var(--text);
          font-size:.76rem;
          box-shadow:0 3px 16px rgba(0,0,0,.035);
        }
        .planning-board-mobile-filter-button.active{
          border-color:var(--primary);
          background:var(--primary-soft);
          color:var(--primary);
        }
        .planning-board-mobile-filter-button .filter-dot{
          position:absolute;
          top:7px;
          right:7px;
          width:7px;
          height:7px;
          border-radius:50%;
          background:var(--primary);
          box-shadow:0 0 0 2px var(--surface);
        }
      }
      .planning-mobile-filter-modal{display:grid;gap:12px}
      .planning-mobile-filter-modal .field{margin:0}
      .planning-mobile-filter-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
    `;
    document.head.appendChild(style);
  }

  function enhance(){
    const page=document.querySelector('.planning-board-page');
    if(!page)return;
    const filters=page.querySelector('.planning-board-filters');
    if(!filters)return;
    let button=filters.querySelector('.planning-board-mobile-filter-button');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='planning-board-mobile-filter-button';
      button.setAttribute('aria-label','Filtros do planejamento');
      button.setAttribute('title','Filtros');
      button.setAttribute('onclick','openPlanningMobileFilters()');
      filters.appendChild(button);
    }
    const active=activeFilters();
    button.classList.toggle('active',active);
    button.innerHTML=`<i class="fa-solid fa-sliders" aria-hidden="true"></i>${active?'<span class="filter-dot" aria-hidden="true"></span>':''}`;
  }

  window.openPlanningMobileFilters=function(){
    const view=String(state.planningBoardView||'day');
    const from=String(state.planningBoardFrom||defaultRange().from);
    const to=String(state.planningBoardTo||defaultRange().to);
    const body=`<div class="filter-modal-content planning-mobile-filter-modal">
      <div class="field"><label>Visualização</label><select id="planningMobileView" class="select"><option value="day" ${view==='day'?'selected':''}>Por dia</option><option value="volunteer" ${view==='volunteer'?'selected':''}>Por voluntário</option></select></div>
      <div class="field"><label>Status</label><select id="planningMobileStatus" class="select">${statusOptions()}</select></div>
      <div class="field"><label>Unidade</label><select id="planningMobileUnit" class="select"><option value="all">Todas as unidades</option>${unitOptions()}</select></div>
      <div class="field-row"><div class="field"><label>Data inicial</label><input id="planningMobileFrom" class="input" type="date" value="${escapeHtml(from)}"></div><div class="field"><label>Data final</label><input id="planningMobileTo" class="input" type="date" value="${escapeHtml(to)}"></div></div>
      <div class="planning-mobile-filter-actions"><button class="btn btn-outline" type="button" onclick="clearPlanningMobileFilters()">Limpar filtros</button><button class="btn btn-primary" type="button" onclick="applyPlanningMobileFilters()">Aplicar</button></div>
    </div>`;
    openModal('Filtros','Refine a visualização do planejamento.',body);
    modalRoot.querySelector('.modal')?.classList.add('filter-modal');
  };

  window.applyPlanningMobileFilters=function(){
    const view=document.getElementById('planningMobileView')?.value||'day';
    const status=document.getElementById('planningMobileStatus')?.value||'all';
    const unit=document.getElementById('planningMobileUnit')?.value||'all';
    const from=document.getElementById('planningMobileFrom')?.value||state.planningBoardFrom;
    const to=document.getElementById('planningMobileTo')?.value||state.planningBoardTo;
    if(from&&to&&from>to)return showToast('A data inicial não pode ser posterior à data final.');
    state.planningBoardView=view==='volunteer'?'volunteer':'day';
    state.planningBoardStatus=status;
    state.planningBoardUnit=unit;
    state.planningBoardFrom=from;
    state.planningBoardTo=to;
    state.planningBoardLoadedRange='';
    closeModal();
    if(typeof updatePlanningBoardFilter==='function')updatePlanningBoardFilter('from',from);
    else if(typeof render==='function')render();
  };

  window.clearPlanningMobileFilters=function(){
    state.planningBoardView='day';
    closeModal();
    if(typeof resetPlanningBoardFilters==='function')resetPlanningBoardFilters();
    else if(typeof render==='function')render();
  };

  installStyles();
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  const root=document.getElementById('app');
  if(root)observer.observe(root,{childList:true,subtree:true});
  requestAnimationFrame(enhance);
})();
