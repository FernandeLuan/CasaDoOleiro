function managerVolunteers(){
  const filter=state.candidateFilter||'all';
  let filtered=state.candidates;
  if(filter==='all') filtered=filtered.filter(p=>['pending','analysis','adjustments'].includes(p.status));
  else if(['pending','analysis','adjustments','approved','rejected'].includes(filter)) filtered=filtered.filter(p=>p.status===filter);
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Gestão</span><h2>Voluntariado</h2><p>Candidatos e experiências da Casa</p></div><button class="btn btn-primary" onclick="openNewCandidate()"><i class="fa-solid fa-plus"></i>Novo</button></div>
    <div class="filter-panel"><select class="select" aria-label="Filtrar voluntariado" onchange="state.candidateFilter=this.value;render()">
      ${[['all','Todos os candidatos'],['pending','Planejamento pendente'],['analysis','Em análise'],['adjustments','Ajustes solicitados'],['approved','Aprovados'],['rejected','Rejeitados']].map(([id,l])=>`<option value="${id}" ${filter===id?'selected':''}>${l} (${countFilter(id)})</option>`).join('')}
    </select></div>
    <div class="list">${filtered.length?filtered.map(personCompact).join(''):`<div class="empty"><i class="fa-regular fa-folder-open"></i>Nenhum perfil neste filtro.</div>`}</div>
  </section>`;
}

function countFilter(id){
  if(id==='all')return state.candidates.filter(p=>['pending','analysis','adjustments'].includes(p.status)).length;
  return state.candidates.filter(p=>p.status===id).length;
}

function countTab(id){if(id==='candidates')return state.candidates.filter(p=>['pending','analysis','adjustments'].includes(p.status)).length;return state.candidates.filter(p=>p.status===id).length}
