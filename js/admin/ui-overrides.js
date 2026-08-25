function openNewCandidate(){
  openModal('Novo candidato','Cadastre somente quem já está no processo real de avaliação.',`<div class="form-grid new-candidate-form">
    <div class="field"><label>Nome</label><input id="ncName" class="input" autocomplete="name" placeholder="Nome completo"></div>
    <div class="field"><label>E-mail</label><input id="ncEmail" class="input" type="email" autocomplete="email" placeholder="email@exemplo.com"></div>
    <div class="field-row"><div class="field"><label>WhatsApp</label><input id="ncPhone" class="input" type="tel" autocomplete="tel" placeholder="+55 ..."></div><div class="field"><label>Nacionalidade</label><input id="ncCountry" class="input" placeholder="País"></div></div>
    <div class="field"><label>Unidade</label><select id="ncUnit" class="select"><option>Rodeio</option><option>Indaial</option></select></div>
    <div class="field-row"><div class="field"><label>Chegada proposta</label><input id="ncFrom" class="input" type="date"></div><div class="field"><label>Saída proposta</label><input id="ncTo" class="input" type="date"></div></div>
    <div class="field"><label>Observação interna</label><textarea id="ncNote" class="textarea" placeholder="Opcional"></textarea></div>
    <button class="btn btn-primary btn-block" onclick="saveCandidate()"><i class="fa-solid fa-user-plus"></i>Cadastrar e liberar acesso</button>
  </div>`);
  modalRoot.querySelector('.modal')?.classList.add('new-candidate-modal');
}

function managerNav(){
  const items=[['home','fa-house','Início'],['volunteer','fa-users','Voluntariado'],['agenda','fa-calendar-days','Agenda'],['groups','fa-people-group','Grupos'],['menu','fa-bars','Menu']];
  return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>{
    const action=id==='agenda'
      ?`state.managerPage='agenda';state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;render()`
      :`state.managerPage='${id}';render()`;
    return `<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="${action}"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`;
  }).join('')}</nav>`;
}
