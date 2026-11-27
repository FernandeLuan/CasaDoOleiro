/* Gestão dos Projetos/Legados — preview de homologação. */
(function legacyProjectsAdmin(){
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'');
  const status={
    draft:['Rascunho',''],
    analysis:['Em análise','info'],
    adjustments:['Ajustes','warning'],
    approved:['Aprovado','success'],
    in_progress:['Em execução','primary'],
    completed:['Concluído','success']
  };
  const PROJECT_STATUS_OPTIONS=[
    ['all','Todos os status'],
    ['analysis','Em análise'],
    ['adjustments','Ajustes'],
    ['approved','Aprovados'],
    ['in_progress','Em execução'],
    ['completed','Concluídos']
  ];
  function projectUnitOptions(){return [['all','Todas as unidades'],...(state.units||[]).filter(unit=>unit?.id).map(unit=>[String(unit.id),String(unit.name||unit.id)])]}
  function normalizeProjectFilter(value){
    return PROJECT_STATUS_OPTIONS.some(([id])=>id===String(value))?String(value):'all';
  }
  function normalizeProjectUnit(value){
    return projectUnitOptions().some(([id])=>id===String(value))?String(value):'all';
  }
  function projectSearchValue(){return String(state.projectSearch||'').trim().toLowerCase()}
  function ensureProjectsLoaded({force=false}={}){
    if(!window.OleiroProjects?.loadAll){state.projectError='Serviço de projetos indisponível.';return Promise.resolve([])}
    if(state.projectLoadPromise&&!force)return state.projectLoadPromise;
    if(state.projectLoaded&&!force)return Promise.resolve(window.OleiroProjects.list?.()||[]);
    state.projectLoading=true;state.projectError='';
    const task=Promise.resolve().then(()=>window.OleiroProjects.loadAll({force})).then(rows=>{state.projectLoaded=true;state.projectError='';return rows||[]}).catch(error=>{console.error('Falha ao carregar projetos do Firestore:',error);state.projectLoaded=false;state.projectError=error?.message||'Verifique as permissões do Firestore.';throw error}).finally(()=>{state.projectLoading=false;state.projectLoadPromise=null;if(state.managerPage==='projects')render()});
    state.projectLoadPromise=task;return task;
  }
  window.refreshLegacyProjects=function(){state.projectLoaded=false;return ensureProjectsLoaded({force:true}).catch(()=>[])};
  function rows(){
    const all=window.OleiroProjects?.list?.()||[],filter=normalizeProjectFilter(state.projectFilter),unit=normalizeProjectUnit(state.projectUnit),search=projectSearchValue();
    return all.filter(p=>{
      if(filter!=='all'&&p.status!==filter)return false;
      const projectUnit=String(p.unitId||p.unitName||'');
      if(unit!=='all'&&projectUnit!==unit)return false;
      if(!search)return true;
      const haystack=[p.title,p.ownerName,p.unitName,p.unitId,p.category].map(v=>String(v||'').toLowerCase()).join(' ');
      return haystack.includes(search);
    });
  }
  function fmtProjectDate(value){
    if(!value)return '';
    try{
      const date=new Date(value);
      if(Number.isNaN(date.getTime()))return '';
      const d=String(date.getDate()).padStart(2,'0');
      const m=String(date.getMonth()+1).padStart(2,'0');
      const y=date.getFullYear();
      const h=String(date.getHours()).padStart(2,'0');
      const min=String(date.getMinutes()).padStart(2,'0');
      return `${d}/${m}/${y} - ${h}:${min}`;
    }catch{return ''}
  }
  function projectProgressEntries(p){
    return Array.isArray(p?.progressEntries)?p.progressEntries.filter(item=>item&&String(item.text||'').trim()):[];
  }
  function projectTimelineRows(p){
    const rows=[];
    if(p?.startedAt)rows.push({type:'start',at:p.startedAt,title:'Iniciado',text:'Projeto iniciado.'});
    projectProgressEntries(p).forEach(item=>rows.push({
      type:'progress',
      at:item.at||item.createdAt||p.updatedAt,
      title:'Progresso',
      text:String(item.text||'').trim()
    }));
    if(p?.completedAt)rows.push({
      type:'complete',
      at:p.completedAt,
      title:'Concluído',
      text:p.result?String(p.result):'O projeto foi concluído.'
    });
    return rows.sort((a,b)=>new Date(a.at||0)-new Date(b.at||0));
  }
  function projectTimelineHtml(p){
    const rows=projectTimelineRows(p);
    if(!rows.length)return '';
    const icon=type=>type==='start'?'fa-play':type==='complete'?'fa-flag-checkered':'fa-message';
    return `<section class="legacy-admin-tracking">
      <div class="legacy-admin-tracking-head">
        <h3>${p.status==='completed'?'Histórico':'Andamento'}</h3>
      </div>
      <div class="legacy-admin-timeline">
        ${rows.map(item=>`<article class="legacy-admin-timeline-item ${esc(item.type)}">
          <span><i class="fa-solid ${icon(item.type)}"></i></span>
          <div class="legacy-admin-timeline-content">
            <strong class="legacy-admin-timeline-title">${esc(item.title)}</strong>
            <p>${esc(item.text)}</p>
            <time class="legacy-admin-timeline-time">${esc(fmtProjectDate(item.at))}</time>
          </div>
        </article>`).join('')}
      </div>
    </section>`;
  }
  function projectOriginalHtml(p){
    return `<details class="legacy-admin-original" ${['analysis','adjustments','approved'].includes(p.status)?'open':''}>
      <summary>
        <span><i class="fa-solid fa-seedling"></i></span>
        <div><strong>Projeto original</strong><small>Ver proposta</small></div>
        <i class="fa-solid fa-chevron-down"></i>
      </summary>
      <div class="legacy-admin-project-content legacy-admin-original-body">
        <div class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-seedling"></i></span>
          <div><small>O legado</small><p>${esc(p.description||'—')}</p></div>
        </div>
        <div class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-heart"></i></span>
          <div><small>Por que importa</small><p>${esc(p.why||'—')}</p></div>
        </div>
        <div class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-bullseye"></i></span>
          <div><small>Resultado esperado</small><p>${esc(p.expectedResult||'—')}</p></div>
        </div>
        ${p.materials?`<div class="legacy-admin-project-section"><span class="legacy-admin-section-icon"><i class="fa-solid fa-box-open"></i></span><div><small>Materiais / apoio</small><p>${esc(p.materials)}</p></div></div>`:''}
      </div>
    </details>`;
  }
  function statusBadge(value){const [label,tone]=status[value]||['Rascunho',''];return `<span class="badge ${tone}">${esc(label)}</span>`}
  function projectMetaExpandedHtml(p){
    return `<div class="legacy-admin-meta-expanded">
      <div class="legacy-admin-meta-expanded-head">
        <span>Projeto original</span>
      </div>
      <div class="legacy-admin-project-content legacy-admin-meta-expanded-content">
        <div class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-seedling"></i></span>
          <div><small>O legado</small><p>${esc(p.description||'—')}</p></div>
        </div>
        <div class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-heart"></i></span>
          <div><small>Por que importa</small><p>${esc(p.why||'—')}</p></div>
        </div>
        <div class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-bullseye"></i></span>
          <div><small>Resultado esperado</small><p>${esc(p.expectedResult||'—')}</p></div>
        </div>
        ${p.materials?`<div class="legacy-admin-project-section"><span class="legacy-admin-section-icon"><i class="fa-solid fa-box-open"></i></span><div><small>Materiais / apoio</small><p>${esc(p.materials)}</p></div></div>`:''}
      </div>
      ${p.driveUrl?`<a class="legacy-admin-meta-drive" href="${esc(p.driveUrl)}" target="_blank" rel="noopener noreferrer"><span><i class="fa-brands fa-google-drive"></i></span><div><strong>Drive</strong><small>Fotos e arquivos do projeto</small></div><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`:''}
    </div>`;
  }

  function projectCard(p){
    return `<button class="list-item clickable project-ui-row project-ui-list-row" type="button" onclick="openLegacyProjectAdmin('${esc(p.id)}')">
      <span class="avatar project-ui-avatar"><i class="fa-solid fa-seedling"></i></span>
      <div class="item-main">
        <h3>${esc(p.title||'Projeto sem título')}</h3>
        <p>${esc(p.ownerName||'Voluntário')} • ${esc(p.unitName||p.unitId||'Unidade')}${p.category?` • ${esc(p.category)}`:''}</p>
        <div class="item-meta">${statusBadge(p.status)}</div>
      </div>
      <i class="fa-solid fa-chevron-right project-ui-chevron"></i>
    </button>`;
  }
  window.managerProjects=function(){
    if(!state.projectLoaded&&!state.projectLoading)ensureProjectsLoaded().catch(()=>{});
    if(state.projectError)return '<section class="section legacy-admin-page compact-page-top"><div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Não foi possível carregar os projetos.</strong><br>'+esc(state.projectError)+'</div></div><button class="btn btn-primary btn-block" type="button" onclick="refreshLegacyProjects()">Tentar novamente</button></section>';
    if(state.projectLoading)return `<section class="section legacy-admin-page legacy-admin-page-clean compact-page-top" aria-busy="true" aria-live="polite"><div class="oleiro-skeleton projects-loading-skeleton" aria-label="Carregando projetos"><div class="oleiro-skeleton-grid">${Array.from({length:3},()=>'<section class="oleiro-skeleton-card"><div class="oleiro-skeleton-row"><span class="oleiro-skeleton-circle"></span><span class="oleiro-skeleton-line medium"></span></div><span class="oleiro-skeleton-line"></span><span class="oleiro-skeleton-line short"></span></section>').join('')}</div></div></section>`;
    state.projectFilter=normalizeProjectFilter(state.projectFilter);
    state.projectUnit=normalizeProjectUnit(state.projectUnit);
    const list=rows(),activeFilter=state.projectFilter!=='all'||state.projectUnit!=='all';
    return `<section class="section legacy-admin-page legacy-admin-page-clean compact-page-top">
      <div class="admin-filter-toolbar">
        <div class="filter-search admin-filter-search"><i class="fa-solid fa-magnifying-glass"></i><input id="projectSearch" class="input" type="search" value="${esc(state.projectSearch||'')}" placeholder="Buscar projeto ou voluntário" oninput="updateLegacyProjectSearch(this.value)"></div>
        <button class="admin-filter-button ${activeFilter?'active':''}" type="button" onclick="openLegacyProjectFilters()" aria-label="Filtros"><i class="fa-solid fa-sliders"></i>${activeFilter?'<span class="filter-dot"></span>':''}</button>
      </div>
      <div class="list project-ui-list">${list.length?list.map(projectCard).join(''):`<div class="planning-board-empty project-ui-empty" role="status"><div><i class="fa-solid fa-seedling" aria-hidden="true"></i><strong>${activeFilter||projectSearchValue()?'Nenhum projeto corresponde aos filtros.':'Ainda não há projetos cadastrados.'}</strong><span>${activeFilter||projectSearchValue()?'Ajuste ou limpe os filtros para ver outros projetos.':'Os projetos enviados pelos voluntários aparecerão aqui.'}</span>${activeFilter||projectSearchValue()?'<button class="btn btn-outline" type="button" onclick="clearLegacyProjectFilters()">Limpar filtros</button>':''}</div></div>`}</div>
    </section>`;
  };
  window.updateLegacyProjectSearch=function(value){state.projectSearch=String(value||'');render();afterNavigation?.()};
  window.openLegacyProjectFilters=function(){
    const filter=normalizeProjectFilter(state.projectFilter),unit=normalizeProjectUnit(state.projectUnit);
    openModal('Filtros','Refine os projetos exibidos.',`<div class="filter-modal-content"><div class="field"><label>Status</label><select id="legacyProjectStatusFilter" class="select">${PROJECT_STATUS_OPTIONS.map(([id,label])=>`<option value="${id}" ${filter===id?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label>Unidade</label><select id="legacyProjectUnitFilter" class="select">${projectUnitOptions().map(([id,label])=>`<option value="${id}" ${unit===id?'selected':''}>${label}</option>`).join('')}</select></div><div class="filter-modal-actions"><button class="btn btn-outline" type="button" onclick="clearLegacyProjectFilters()">Limpar filtros</button><button class="btn btn-primary" type="button" onclick="applyLegacyProjectFilters()">Aplicar</button></div></div>`);
    modalRoot.querySelector('.modal')?.classList.add('filter-modal');
  };
  window.applyLegacyProjectFilters=function(){
    state.projectFilter=normalizeProjectFilter(document.getElementById('legacyProjectStatusFilter')?.value);
    state.projectUnit=normalizeProjectUnit(document.getElementById('legacyProjectUnitFilter')?.value);
    closeModal();render();afterNavigation?.();
  };
  window.clearLegacyProjectFilters=function(){state.projectFilter='all';state.projectUnit='all';state.projectSearch='';closeModal();render();afterNavigation?.()};
  window.setLegacyProjectFilter=function(value){state.projectFilter=normalizeProjectFilter(value);render();afterNavigation?.()};
  window.openLegacyProjectAdmin=function(id){
    const p=(window.OleiroProjects?.list?.()||[]).find(x=>String(x.id)===String(id));if(!p)return;
    const tracking=['in_progress','completed'].includes(p.status);
    const body=`<div class="legacy-admin-detail legacy-admin-detail-v4 ${tracking?'has-tracking':''}">
      <details class="project-ui-expandable">
        <summary class="list-item project-ui-row project-ui-summary">
          <span class="avatar project-ui-avatar"><i class="fa-solid fa-seedling"></i></span>
          <div class="item-main">
            <div class="project-ui-summary-name-row">
              <h3>${esc(p.ownerName||'Voluntário')}</h3>
              ${statusBadge(p.status)}
            </div>
            <p>${esc(p.unitName||p.unitId||'Unidade')}${p.category?` • ${esc(p.category)}`:''}</p>
          </div>
          <i class="fa-solid fa-chevron-down project-ui-chevron project-ui-expand-chevron" aria-hidden="true"></i>
        </summary>
        ${projectMetaExpandedHtml(p)}
      </details>

      ${projectTimelineHtml(p)}
      ${p.status!=='completed'&&p.result?`<div class="legacy-admin-result legacy-admin-result-v2"><span><i class="fa-solid fa-circle-check"></i></span><div><small>Resultado final</small><p>${esc(p.result)}</p></div></div>`:''}
    </div>`;
    let footer='';
    if(p.status==='analysis')footer='<div class="legacy-admin-review-actions"><button class="btn btn-outline" onclick="openLegacyAdjustment(\''+esc(p.id)+'\')">Pedir ajuste</button><button class="btn btn-primary" onclick="approveLegacyProject(\''+esc(p.id)+'\')">Aprovar projeto</button></div>';
    const modalSubtitle=p.status==='analysis'
      ?'Revise a proposta enviada pelo voluntário.'
      :p.status==='in_progress'
        ?''
        :p.status==='completed'
          ?''
          :'Informações do projeto.';
    openModal(p.title||'Projeto de legado',modalSubtitle,body,footer);
    modalRoot.querySelector('.modal')?.classList.add('modal-wide');
  };
  window.approveLegacyProject=async function(id){try{await window.OleiroProjects.update(id,{status:'approved',reviewNote:'',approvedAt:new Date().toISOString()});closeModal();render();showToast('Projeto aprovado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível aprovar o projeto.')}};
  window.openLegacyAdjustment=function(id){
    closeModal();
    openModal('Pedir ajuste','Explique de forma clara o que precisa ser revisto.',`<div class="field"><label for="legacyReviewNote">Orientação para o voluntário</label><textarea id="legacyReviewNote" class="textarea" maxlength="600" placeholder="Ex.: detalhe melhor os materiais necessários e como a composteira será mantida."></textarea></div>`,`<button class="btn btn-primary btn-block" onclick="requestLegacyAdjustment('${esc(id)}')">Enviar ajuste</button>`);
  };
  window.requestLegacyAdjustment=async function(id){const note=document.getElementById('legacyReviewNote')?.value.trim()||'';if(!note)return showToast('Escreva a orientação do ajuste.');try{await window.OleiroProjects.update(id,{status:'adjustments',reviewNote:note,reviewedAt:new Date().toISOString()});closeModal();render();showToast('Ajuste solicitado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível solicitar o ajuste.')}};
})();