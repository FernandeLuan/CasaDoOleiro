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
  function rows(){
    const all=window.OleiroProjects?.list?.()||[],filter=String(state.projectFilter||'all');
    return filter==='all'?all:all.filter(x=>x.status===filter);
  }
  function statusBadge(value){const [label,tone]=status[value]||['Rascunho',''];return `<span class="badge ${tone}">${esc(label)}</span>`}
  function projectCard(p){
    return `<button class="legacy-admin-card" type="button" onclick="openLegacyProjectAdmin('${esc(p.id)}')"><span class="legacy-admin-card-icon"><i class="fa-solid fa-seedling"></i></span><div class="legacy-admin-card-main"><div><strong>${esc(p.title||'Projeto sem título')}</strong>${statusBadge(p.status)}</div><p>${esc(p.ownerName||'Voluntário')} · ${esc(p.unitName||p.unitId||'Unidade')}</p><small>${esc(p.category||'Sem categoria')}</small></div><i class="fa-solid fa-chevron-right"></i></button>`;
  }
  window.managerProjects=function(){
    const list=rows(),all=window.OleiroProjects?.list?.()||[];
    const count=s=>all.filter(p=>p.status===s).length;
    return `<section class="section legacy-admin-page compact-page-top">
      <header class="admin-page-title"><span class="eyebrow">Legados</span><h1>Projetos</h1><p>Acompanhe as contribuições que os voluntários estão deixando para a comunidade.</p></header>
      <div class="legacy-admin-metrics"><button onclick="setLegacyProjectFilter('analysis')"><strong>${count('analysis')}</strong><span>Em análise</span></button><button onclick="setLegacyProjectFilter('adjustments')"><strong>${count('adjustments')}</strong><span>Ajustes</span></button><button onclick="setLegacyProjectFilter('in_progress')"><strong>${count('in_progress')}</strong><span>Em execução</span></button><button onclick="setLegacyProjectFilter('completed')"><strong>${count('completed')}</strong><span>Concluídos</span></button></div>
      <div class="tabs legacy-admin-tabs">${[['all','Todos'],['analysis','Em análise'],['adjustments','Ajustes'],['approved','Aprovados'],['in_progress','Em execução'],['completed','Concluídos']].map(([id,label])=>`<button class="tab ${String(state.projectFilter||'all')===id?'active':''}" onclick="setLegacyProjectFilter('${id}')">${label}</button>`).join('')}</div>
      <div class="legacy-admin-list">${list.length?list.map(projectCard).join(''):'<div class="empty"><i class="fa-solid fa-seedling"></i>Nenhum projeto neste status.</div>'}</div>
      <div class="notice legacy-preview-note"><i class="fa-solid fa-flask"></i><div><strong>Homologação</strong><br>Os projetos desta versão ficam somente neste navegador enquanto validamos o fluxo.</div></div>
    </section>`;
  };
  window.setLegacyProjectFilter=function(value){state.projectFilter=String(value||'all');render();afterNavigation?.()};
  window.openLegacyProjectAdmin=function(id){
    const p=(window.OleiroProjects?.list?.()||[]).find(x=>String(x.id)===String(id));if(!p)return;
    const body=`<div class="legacy-admin-detail">
      <div class="legacy-admin-person"><span><i class="fa-solid fa-user"></i></span><div><strong>${esc(p.ownerName||'Voluntário')}</strong><small>${esc(p.unitName||p.unitId||'Unidade')}</small></div>${statusBadge(p.status)}</div>
      <div class="legacy-admin-detail-grid"><article><small>Projeto</small><strong>${esc(p.title||'—')}</strong></article><article><small>Categoria</small><strong>${esc(p.category||'—')}</strong></article></div>
      <article><small>O legado</small><p>${esc(p.description||'—')}</p></article>
      <article><small>Por que importa</small><p>${esc(p.why||'—')}</p></article>
      <article><small>Resultado esperado</small><p>${esc(p.expectedResult||'—')}</p></article>
      ${p.materials?`<article><small>Materiais / apoio</small><p>${esc(p.materials)}</p></article>`:''}
      ${p.result?`<article class="legacy-admin-result"><small>Resultado final</small><p>${esc(p.result)}</p></article>`:''}
      ${p.driveUrl?`<a class="legacy-drive-card" href="${esc(p.driveUrl)}" target="_blank" rel="noopener noreferrer"><span><i class="fa-brands fa-google-drive"></i></span><div><strong>Abrir registros no Drive</strong><small>Fotos, vídeos e documentos</small></div><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`:''}
    </div>`;
    let footer='<button class="btn btn-outline" onclick="closeModal()">Fechar</button>';
    if(p.status==='analysis')footer='<button class="btn btn-outline" onclick="openLegacyAdjustment(\''+esc(p.id)+'\')">Pedir ajuste</button><button class="btn btn-primary" onclick="approveLegacyProject(\''+esc(p.id)+'\')">Aprovar projeto</button>';
    openModal('Projeto de legado','Analise a proposta e ajude o voluntário a transformar a ideia em algo possível.',body,footer);
    modalRoot.querySelector('.modal')?.classList.add('legacy-admin-modal');
  };
  window.approveLegacyProject=function(id){window.OleiroProjects.update(id,{status:'approved',reviewNote:'',approvedAt:new Date().toISOString()});closeModal();render();showToast('Projeto aprovado.')};
  window.openLegacyAdjustment=function(id){
    closeModal();
    openModal('Pedir ajuste','Explique de forma clara o que precisa ser revisto.',`<div class="field"><label for="legacyReviewNote">Orientação para o voluntário</label><textarea id="legacyReviewNote" class="textarea" maxlength="600" placeholder="Ex.: detalhe melhor os materiais necessários e como a composteira será mantida."></textarea></div>`,`<button class="btn btn-primary btn-block" onclick="requestLegacyAdjustment('${esc(id)}')">Enviar ajuste</button>`);
  };
  window.requestLegacyAdjustment=function(id){const note=document.getElementById('legacyReviewNote')?.value.trim()||'';if(!note)return showToast('Escreva a orientação do ajuste.');window.OleiroProjects.update(id,{status:'adjustments',reviewNote:note,reviewedAt:new Date().toISOString()});closeModal();render();showToast('Ajuste solicitado.')};
})();