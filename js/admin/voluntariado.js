function managerVolunteers(){
  const search=state.candidateSearch||'';
  const filtered=getFilteredCandidates();
  const activeFilters=(state.candidateFilter||'approved')!=='approved'||(state.candidateUnit||'all')!=='all';
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Gestão</span><h2>Voluntariado</h2><p>Candidatos e experiências da Casa</p></div><button class="btn btn-primary" onclick="openNewCandidate()"><i class="fa-solid fa-plus"></i>Novo</button></div>
    <div class="candidate-tools">
      <div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="candidateSearch" class="input" type="search" value="${escapeHtml(search)}" placeholder="Buscar voluntário por nome" oninput="updateCandidateSearch(this.value)"></div>
      <button class="candidate-filter-button ${activeFilters?'active':''}" type="button" onclick="openCandidateFilters()" aria-label="Filtros"><i class="fa-solid fa-sliders"></i>${activeFilters?'<span class="filter-dot"></span>':''}</button>
    </div>
    <div class="candidate-filter-summary">${candidateFilterSummary()}</div>
    <div id="candidateList" class="list">${candidateListHtml(filtered)}</div>
  </section>`;
}

function escapeHtml(value){return String(value||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function getFilteredCandidates(){
  const filter=state.candidateFilter||'approved';
  const search=(state.candidateSearch||'').trim().toLocaleLowerCase(typeof currentLocale==='function'?currentLocale():'pt-BR');
  const unit=state.candidateUnit||'all';
  return state.candidates.filter(p=>{
    const byStatus=filter==='all'||(filter==='process'&&['pending','analysis','adjustments'].includes(p.status))||p.status===filter;
    const byUnit=unit==='all'||p.unit===unit;
    const bySearch=!search||p.name.toLocaleLowerCase(typeof currentLocale==='function'?currentLocale():'pt-BR').includes(search);
    return byStatus&&byUnit&&bySearch;
  });
}

function candidateListHtml(list){return list.length?list.map(personCompact).join(''):`<div class="empty"><i class="fa-regular fa-folder-open"></i>Nenhum perfil encontrado com esses filtros.</div>`}

function updateCandidateSearch(value){
  state.candidateSearch=value;
  const list=document.getElementById('candidateList');
  if(list){list.innerHTML=candidateListHtml(getFilteredCandidates());if(typeof applyI18n==='function')applyI18n(list)}
}

function candidateFilterSummary(){
  const filter=state.candidateFilter||'approved';
  const unit=state.candidateUnit||'all';
  const labels={approved:'Aprovados',process:'Em processo',pending:'Planejamento pendente',analysis:'Em análise',adjustments:'Ajustes solicitados',rejected:'Rejeitados',all:'Todos'};
  const parts=[labels[filter]||'Aprovados'];
  if(unit!=='all')parts.push(unit);
  return `<span><i class="fa-solid fa-filter"></i>${parts.join(' • ')}</span><strong>${getFilteredCandidates().length}</strong>`;
}

function openCandidateFilters(){
  const filter=state.candidateFilter||'approved';
  const unit=state.candidateUnit||'all';
  openModal('Filtros','Refine os perfis exibidos.',`<div class="filter-modal-content">
    <div class="field"><label>Status do perfil</label><select id="candidateStatusFilter" class="select">
      ${[['approved','Aprovados'],['process','Em processo'],['pending','Planejamento pendente'],['analysis','Em análise'],['adjustments','Ajustes solicitados'],['rejected','Rejeitados'],['all','Todos']].map(([id,l])=>`<option value="${id}" ${filter===id?'selected':''}>${l} (${countFilter(id)})</option>`).join('')}
    </select></div>
    <div class="field"><label>Unidade</label><select id="candidateUnitFilter" class="select">
      ${[['all','Todas as unidades'],['Rodeio','Rodeio'],['Indaial','Indaial']].map(([id,l])=>`<option value="${id}" ${unit===id?'selected':''}>${l}</option>`).join('')}
    </select></div>
    <div class="filter-modal-actions"><button class="btn btn-outline" type="button" onclick="clearCandidateFilters()">Limpar filtros</button><button class="btn btn-primary" type="button" onclick="applyCandidateFilters()">Aplicar filtros</button></div>
  </div>`);
  modalRoot.querySelector('.modal')?.classList.add('filter-modal');
}

function applyCandidateFilters(){
  state.candidateFilter=document.getElementById('candidateStatusFilter')?.value||'approved';
  state.candidateUnit=document.getElementById('candidateUnitFilter')?.value||'all';
  closeModal();render();
}

function clearCandidateFilters(){
  state.candidateFilter='approved';
  state.candidateUnit='all';
  closeModal();render();
}

function countFilter(id){
  if(id==='all')return state.candidates.length;
  if(id==='process')return state.candidates.filter(p=>['pending','analysis','adjustments'].includes(p.status)).length;
  return state.candidates.filter(p=>p.status===id).length;
}

function countTab(id){if(id==='candidates')return state.candidates.filter(p=>['pending','analysis','adjustments'].includes(p.status)).length;return state.candidates.filter(p=>p.status===id).length}
