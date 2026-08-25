function managerGroups(){
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Organização</span><h2>Grupos</h2><p>Composição operacional da unidade</p></div></div>
  ${state.groups.map(g=>`<details class="group-details"><summary><div class="avatar">${g.id}</div><div class="group-summary-copy"><strong>Grupo ${g.id}</strong><span>${g.members.length} integrantes • capacidade de referência ${g.capacity}</span></div><i class="fa-solid fa-chevron-down" style="color:var(--muted)"></i></summary><div class="group-members">${g.members.map(m=>`<div class="member-row"><span class="member-name"><span class="member-dot"></span>${m}</span></div>`).join('')||'<div class="empty">Nenhum nome cadastrado.</div>'}<button class="btn btn-outline btn-block" style="margin-top:10px" onclick="editGroup('${g.id}')"><i class="fa-solid fa-pen"></i>Editar grupo</button></div></details>`).join('')}</section>`;
}

function editGroup(id){
  const g=state.groups.find(x=>x.id===id);
  openModal('Editar Grupo '+id,'Nomes visíveis somente na área de gestão.',`<div class="form-grid group-edit-form">
    <div class="field"><label>Capacidade de referência</label><input id="gCap" class="input" type="number" value="${g.capacity}"></div>
    <div class="field"><label>Observação</label><input id="gNote" class="input" value="${g.note}"></div>
    <div class="field"><label>Integrantes</label><div id="groupMemberList" class="group-member-list">${g.members.map((m,i)=>`<div class="member-row group-member-edit-row"><span class="member-name"><span class="member-dot"></span>${m}</span><button class="group-delete-button" type="button" onclick="requestRemoveGroupMember('${id}',${i})" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button></div>`).join('')}</div></div>
    <div class="field group-new-member"><label>Novo nome</label><div class="group-add-row"><input id="gMember" class="input" placeholder="Nome"><button class="btn btn-soft" type="button" onclick="addGroupMember('${id}')"><i class="fa-solid fa-plus"></i>Adicionar</button></div></div>
    <button class="btn btn-primary btn-block" onclick="saveGroupConfig('${id}')">Salvar grupo</button>
  </div>`);
  modalRoot.querySelector('.modal')?.classList.add('group-edit-modal');
}

function persistGroupDraft(id){
  const g=state.groups.find(x=>x.id===id);
  const cap=document.getElementById('gCap');
  const note=document.getElementById('gNote');
  if(cap)g.capacity=+cap.value||g.capacity;
  if(note)g.note=note.value;
}

function requestRemoveGroupMember(id,index){
  persistGroupDraft(id);
  const g=state.groups.find(x=>x.id===id);
  const member=g.members[index];
  openModal('Excluir integrante?','Confirme a remoção deste integrante do grupo.',`<div class="confirm-delete-content">
    <div class="confirm-person"><span class="member-dot"></span><strong>${member}</strong></div>
    <div class="confirm-delete-actions">
      <button class="btn btn-outline" type="button" onclick="editGroup('${id}')">Cancelar</button>
      <button class="btn btn-danger" type="button" onclick="confirmRemoveGroupMember('${id}',${index})"><i class="fa-solid fa-trash"></i>Excluir</button>
    </div>
  </div>`);
  modalRoot.querySelector('.modal')?.classList.add('confirm-delete-modal');
}

function confirmRemoveGroupMember(id,index){
  const g=state.groups.find(x=>x.id===id);
  g.members.splice(index,1);
  editGroup(id);
  showToast('Integrante removido.');
}

function addGroupMember(id){
  const el=document.getElementById('gMember');
  const name=el.value.trim();
  if(!name)return showToast('Informe um nome.');
  persistGroupDraft(id);
  const g=state.groups.find(x=>x.id===id);
  g.members.push(name);
  editGroup(id);
}

function removeGroupMember(id,index){requestRemoveGroupMember(id,index)}

function saveGroupConfig(id){
  persistGroupDraft(id);
  closeModal();
  render();
  showToast('Grupo atualizado.');
}
