function managerVolunteers(){
  const filter=state.candidateFilter||'approved';
  const search=state.candidateSearch||'';
  const unit=state.candidateUnit||'all';
  const filtered=getFilteredCandidates();
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Gestão</span><h2>Voluntariado</h2><p>Candidatos e experiências da Casa</p></div><button class="btn btn-primary" onclick="openNewCandidate()"><i class="fa-solid fa-plus"></i>Novo</button></div>
    <div class="filter-panel">
      <div class="filter-search"><i class="fa-solid fa-magnifying-glass"></i><input id="candidateSearch" class="input" type="search" value="${escapeHtml(search)}" placeholder="Buscar por nome, país ou e-mail" oninput="updateCandidateSearch(this.value)"></div>
      <div class="filter-grid">
        <select class="select" aria-label="Filtrar por status" onchange="state.candidateFilter=this.value;render()">
          ${[['approved','Aprovados'],['process','Em processo'],['pending','Planejamento pendente'],['analysis','Em análise'],['adjustments','Ajustes solicitados'],['rejected','Rejeitados'],['all','Todos']].map(([id,l])=>`<option value="${id}" ${filter===id?'selected':''}>${l} (${countFilter(id)})</option>`).join('')}
        </select>
        <select class="select" aria-label="Filtrar por unidade" onchange="state.candidateUnit=this.value;render()">
          ${[['all','Todas as unidades'],['Rodeio','Rodeio'],['Indaial','Indaial']].map(([id,l])=>`<option value="${id}" ${unit===id?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="filter-caption">Por padrão, a lista abre em aprovados. Você pode combinar busca, status e unidade.</div>
    </div>
    <div id="candidateList" class="list">${candidateListHtml(filtered)}</div>
  </section>`;
}

function escapeHtml(value){return String(value||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function getFilteredCandidates(){
  const filter=state.candidateFilter||'approved';
  const search=(state.candidateSearch||'').trim().toLocaleLowerCase('pt-BR');
  const unit=state.candidateUnit||'all';
  return state.candidates.filter(p=>{
    const byStatus=filter==='all'||(filter==='process'&&['pending','analysis','adjustments'].includes(p.status))||p.status===filter;
    const byUnit=unit==='all'||p.unit===unit;
    const haystack=`${p.name} ${p.country} ${p.email||''}`.toLocaleLowerCase('pt-BR');
    const bySearch=!search||haystack.includes(search);
    return byStatus&&byUnit&&bySearch;
  });
}

function candidateListHtml(list){return list.length?list.map(personCompact).join(''):`<div class="empty"><i class="fa-regular fa-folder-open"></i>Nenhum perfil encontrado com esses filtros.</div>`}

function updateCandidateSearch(value){
  state.candidateSearch=value;
  const list=document.getElementById('candidateList');
  if(list){list.innerHTML=candidateListHtml(getFilteredCandidates());if(typeof applyI18n==='function')applyI18n(list)}
}

function countFilter(id){
  if(id==='all')return state.candidates.length;
  if(id==='process')return state.candidates.filter(p=>['pending','analysis','adjustments'].includes(p.status)).length;
  return state.candidates.filter(p=>p.status===id).length;
}

function countTab(id){if(id==='candidates')return state.candidates.filter(p=>['pending','analysis','adjustments'].includes(p.status)).length;return state.candidates.filter(p=>p.status===id).length}