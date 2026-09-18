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
  function normalizeProjectFilter(value){
    return PROJECT_STATUS_OPTIONS.some(([id])=>id===String(value))?String(value):'all';
  }
  function projectSearchValue(){return String(state.projectSearch||'').trim().toLowerCase()}
  function rows(){
    const all=window.OleiroProjects?.list?.()||[],filter=normalizeProjectFilter(state.projectFilter),search=projectSearchValue();
    return all.filter(p=>{
      if(filter!=='all'&&p.status!==filter)return false;
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
      return new Intl.DateTimeFormat('pt-BR',{
        day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'
      }).format(date).replace('.', '');
    }catch{return ''}
  }
  function projectProgressEntries(p){
    return Array.isArray(p?.progressEntries)?p.progressEntries.filter(item=>item&&String(item.text||'').trim()):[];
  }
  function projectTimelineRows(p){
    const rows=[];
    if(p?.startedAt)rows.push({type:'start',at:p.startedAt,title:'Execução iniciada',text:'O voluntário iniciou a execução do projeto.'});
    projectProgressEntries(p).forEach(item=>rows.push({
      type:'progress',
      at:item.at||item.createdAt||p.updatedAt,
      title:'Atualização de progresso',
      text:String(item.text||'').trim()
    }));
    if(p?.completedAt)rows.push({
      type:'complete',
      at:p.completedAt,
      title:'Legado concluído',
      text:p.result?String(p.result):'O projeto foi concluído.'
    });
    return rows.sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
  }
  function projectTimelineHtml(p){
    const rows=projectTimelineRows(p);
    if(!rows.length)return '';
    const icon=type=>type==='start'?'fa-play':type==='complete'?'fa-flag-checkered':'fa-message';
    return `<section class="legacy-admin-tracking">
      <div class="legacy-admin-tracking-head">
        <span class="eyebrow">Acompanhamento</span>
        <h3>${p.status==='completed'?'Histórico do legado':'Execução do projeto'}</h3>
        <p>${p.status==='completed'?'Veja como o voluntário desenvolveu e concluiu o legado.':'Comentários e avanços registrados pelo voluntário.'}</p>
      </div>
      <div class="legacy-admin-timeline">
        ${rows.map(item=>`<article class="legacy-admin-timeline-item ${esc(item.type)}">
          <span><i class="fa-solid ${icon(item.type)}"></i></span>
          <div>
            <div class="legacy-admin-timeline-meta"><strong>${esc(item.title)}</strong><time>${esc(fmtProjectDate(item.at))}</time></div>
            <p>${esc(item.text)}</p>
          </div>
        </article>`).join('')}
      </div>
    </section>`;
  }
  function projectOriginalHtml(p){
    return `<details class="legacy-admin-original" ${['analysis','adjustments','approved'].includes(p.status)?'open':''}>
      <summary>
        <span><i class="fa-solid fa-seedling"></i></span>
        <div><small>Projeto original</small><strong>Ver proposta e informações</strong></div>
        <i class="fa-solid fa-chevron-down"></i>
      </summary>
      <div class="legacy-admin-project-content legacy-admin-original-body">
        <article class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-seedling"></i></span>
          <div><small>O legado</small><p>${esc(p.description||'—')}</p></div>
        </article>
        <article class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-heart"></i></span>
          <div><small>Por que importa</small><p>${esc(p.why||'—')}</p></div>
        </article>
        <article class="legacy-admin-project-section">
          <span class="legacy-admin-section-icon"><i class="fa-solid fa-bullseye"></i></span>
          <div><small>Resultado esperado</small><p>${esc(p.expectedResult||'—')}</p></div>
        </article>
        ${p.materials?`<article class="legacy-admin-project-section"><span class="legacy-admin-section-icon"><i class="fa-solid fa-box-open"></i></span><div><small>Materiais / apoio</small><p>${esc(p.materials)}</p></div></article>`:''}
      </div>
    </details>`;
  }
  function statusBadge(value){const [label,tone]=status[value]||['Rascunho',''];return `<span class="badge ${tone}">${esc(label)}</span>`}
  function projectCard(p){
    const [label,tone]=status[p.status]||['Rascunho',''];
    return `<button class="legacy-admin-card legacy-admin-card-v2" type="button" onclick="openLegacyProjectAdmin('${esc(p.id)}')">
      <span class="legacy-admin-card-icon"><i class="fa-solid fa-seedling"></i></span>
      <div class="legacy-admin-card-main">
        <strong>${esc(p.title||'Projeto sem título')}</strong>
        <p>${esc(p.ownerName||'Voluntário')} · ${esc(p.unitName||p.unitId||'Unidade')}${p.category?` · ${esc(p.category)}`:''}</p>
      </div>
      <span class="legacy-admin-card-status ${esc(tone)}">${esc(label)}</span>
      <i class="fa-solid fa-chevron-right legacy-admin-card-chevron"></i>
    </button>`;
  }
  window.managerProjects=function(){
    state.projectFilter=normalizeProjectFilter(state.projectFilter);
    const list=rows(),all=window.OleiroProjects?.list?.()||[],activeFilter=state.projectFilter!=='all';
    const activeLabel=PROJECT_STATUS_OPTIONS.find(([id])=>id===state.projectFilter)?.[1]||'Todos os status';
    return `<section class="section legacy-admin-page compact-page-top">
      <header class="admin-page-title"><span class="eyebrow">Legados</span><h1>Projetos</h1><p>Acompanhe as contribuições que os voluntários estão deixando para a comunidade.</p></header>
      <div class="candidate-tools candidate-tools-compact legacy-project-tools">
        <div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="projectSearch" class="input" type="search" value="${esc(state.projectSearch||'')}" placeholder="Buscar projeto ou voluntário" oninput="updateLegacyProjectSearch(this.value)"></div>
        <button class="candidate-filter-button ${activeFilter?'active':''}" type="button" onclick="openLegacyProjectFilters()" aria-label="Filtros"><i class="fa-solid fa-sliders"></i>${activeFilter?'<span class="filter-dot"></span>':''}</button>
      </div>
      <div class="legacy-project-list-head"><span>${list.length} ${list.length===1?'projeto':'projetos'}</span>${activeFilter?`<button type="button" onclick="clearLegacyProjectFilters()">${esc(activeLabel)} <i class="fa-solid fa-xmark"></i></button>`:''}</div>
      <div class="legacy-admin-list">${list.length?list.map(projectCard).join(''):'<div class="empty"><i class="fa-solid fa-seedling"></i>Nenhum projeto encontrado.</div>'}</div>
      ${all.length?'<div class="legacy-preview-caption"><i class="fa-solid fa-flask"></i><span>Ambiente de homologação</span></div>':''}
    </section>`;
  };
  window.updateLegacyProjectSearch=function(value){state.projectSearch=String(value||'');render();afterNavigation?.()};
  window.openLegacyProjectFilters=function(){
    const filter=normalizeProjectFilter(state.projectFilter);
    openModal('Filtros','Refine os projetos exibidos.',`<div class="filter-modal-content"><div class="field"><label>Status</label><select id="legacyProjectStatusFilter" class="select">${PROJECT_STATUS_OPTIONS.map(([id,label])=>`<option value="${id}" ${filter===id?'selected':''}>${label}</option>`).join('')}</select></div><div class="filter-modal-actions"><button class="btn btn-outline" type="button" onclick="clearLegacyProjectFilters()">Limpar filtros</button><button class="btn btn-primary" type="button" onclick="applyLegacyProjectFilters()">Aplicar</button></div></div>`);
    modalRoot.querySelector('.modal')?.classList.add('filter-modal');
  };
  window.applyLegacyProjectFilters=function(){
    state.projectFilter=normalizeProjectFilter(document.getElementById('legacyProjectStatusFilter')?.value);
    closeModal();render();afterNavigation?.();
  };
  window.clearLegacyProjectFilters=function(){state.projectFilter='all';closeModal();render();afterNavigation?.()};
  window.setLegacyProjectFilter=function(value){state.projectFilter=normalizeProjectFilter(value);render();afterNavigation?.()};
  window.openLegacyProjectAdmin=function(id){
    const p=(window.OleiroProjects?.list?.()||[]).find(x=>String(x.id)===String(id));if(!p)return;
    const body=`<div class="legacy-admin-detail legacy-admin-detail-v2 ${['in_progress','completed'].includes(p.status)?'has-tracking':''}">
      <div class="legacy-admin-person legacy-admin-person-v2">
        <span class="legacy-admin-avatar"><i class="fa-solid fa-user"></i></span>
        <div class="legacy-admin-identity"><strong>${esc(p.ownerName||'Voluntário')}</strong><small>${esc(p.unitName||p.unitId||'Unidade')}</small></div>
        <div class="legacy-admin-person-status">${statusBadge(p.status)}</div>
      </div>

      <section class="legacy-admin-project-overview">
        <span class="legacy-admin-overview-label">Projeto</span>
        <strong class="legacy-admin-overview-title">${esc(p.title||'Projeto sem título')}</strong>
        <span class="legacy-admin-overview-sub">${esc(p.category||'Sem categoria')}</span>
      </section>

      ${p.status==='completed'&&p.result?`<section class="legacy-admin-outcome"><span><i class="fa-solid fa-heart"></i></span><div><small>O que ficou para a comunidade</small><strong>${esc(p.result)}</strong></div></section>`:''}
      ${projectTimelineHtml(p)}
      ${projectOriginalHtml(p)}
      ${p.status!=='completed'&&p.result?`<div class="legacy-admin-result legacy-admin-result-v2"><span><i class="fa-solid fa-circle-check"></i></span><div><small>Resultado final</small><p>${esc(p.result)}</p></div></div>`:''}
      ${p.driveUrl?`<a class="legacy-drive-card legacy-admin-drive-v2" href="${esc(p.driveUrl)}" target="_blank" rel="noopener noreferrer"><span><i class="fa-brands fa-google-drive"></i></span><div><strong>Abrir registros no Drive</strong><small>Fotos, vídeos e documentos</small></div><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`:''}
    </div>`;
    let footer='';
    if(p.status==='analysis')footer='<button class="btn btn-outline" onclick="openLegacyAdjustment(\''+esc(p.id)+'\')">Pedir ajuste</button><button class="btn btn-primary" onclick="approveLegacyProject(\''+esc(p.id)+'\')">Aprovar projeto</button>';
    const modalSubtitle=p.status==='analysis'
      ?'Analise a proposta e decida se ela pode seguir para execução.'
      :p.status==='in_progress'
        ?'Acompanhe os comentários e o andamento registrado pelo voluntário.'
        :p.status==='completed'
          ?'Consulte o resultado e o histórico completo deste legado.'
          :'Consulte as informações deste projeto.';
    openModal('Projeto de legado',modalSubtitle,body,footer);
    modalRoot.querySelector('.modal')?.classList.add('legacy-admin-modal');
  };
  window.approveLegacyProject=function(id){window.OleiroProjects.update(id,{status:'approved',reviewNote:'',approvedAt:new Date().toISOString()});closeModal();render();showToast('Projeto aprovado.')};
  window.openLegacyAdjustment=function(id){
    closeModal();
    openModal('Pedir ajuste','Explique de forma clara o que precisa ser revisto.',`<div class="field"><label for="legacyReviewNote">Orientação para o voluntário</label><textarea id="legacyReviewNote" class="textarea" maxlength="600" placeholder="Ex.: detalhe melhor os materiais necessários e como a composteira será mantida."></textarea></div>`,`<button class="btn btn-primary btn-block" onclick="requestLegacyAdjustment('${esc(id)}')">Enviar ajuste</button>`);
  };
  window.requestLegacyAdjustment=function(id){const note=document.getElementById('legacyReviewNote')?.value.trim()||'';if(!note)return showToast('Escreva a orientação do ajuste.');window.OleiroProjects.update(id,{status:'adjustments',reviewNote:note,reviewedAt:new Date().toISOString()});closeModal();render();showToast('Ajuste solicitado.')};
})();