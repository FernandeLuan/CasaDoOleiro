function managerGroups(){
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Organização</span><h2>Grupos</h2><p>Composição operacional da unidade</p></div></div>
  ${state.groups.map(g=>`<details class="group-details"><summary><div class="avatar">${g.id}</div><div class="group-summary-copy"><strong>Grupo ${g.id}</strong><span>${g.members.length} integrantes • capacidade de referência ${g.capacity}</span></div><i class="fa-solid fa-chevron-down" style="color:var(--muted)"></i></summary><div class="group-members">${g.members.map(m=>`<div class="member-row"><span class="member-name"><span class="member-dot"></span>${m}</span></div>`).join('')||'<div class="empty">Nenhum nome cadastrado.</div>'}<button class="btn btn-outline btn-block" style="margin-top:10px" onclick="editGroup('${g.id}')"><i class="fa-solid fa-pen"></i>Editar grupo</button></div></details>`).join('')}</section>`;
}

function editGroup(id){
  const g=state.groups.find(x=>x.id===id);
  openModal('Editar Grupo '+id,'Nomes visíveis somente na área de gestão.',`<div class="form-grid"><div class="field"><label>Capacidade de referência</label><input id="gCap" class="input" type="number" value="${g.capacity}"></div><div class="field"><label>Observação</label><input id="gNote" class="input" value="${g.note}"></div><div class="field"><label>Integrantes</label><div id="groupMemberList">${g.members.map((m,i)=>`<div class="member-row"><span class="member-name"><span class="member-dot"></span>${m}</span><button class="btn btn-danger" style="min-height:30px;padding:5px 8px" onclick="removeGroupMember('${id}',${i})"><i class="fa-solid fa-trash"></i></button></div>`).join('')}</div></div><div class="field-row"><div class="field"><label>Novo nome</label><input id="gMember" class="input" placeholder="Nome"></div><div style="display:flex;align-items:end"><button class="btn btn-soft btn-block" onclick="addGroupMember('${id}')"><i class="fa-solid fa-plus"></i>Adicionar</button></div></div><button class="btn btn-primary" onclick="saveGroupConfig('${id}')">Salvar grupo</button></div>`)
}

function addGroupMember(id){const el=document.getElementById('gMember');const name=el.value.trim();if(!name)return showToast('Informe um nome.');const g=state.groups.find(x=>x.id===id);g.members.push(name);editGroup(id)}

function removeGroupMember(id,index){const g=state.groups.find(x=>x.id===id);g.members.splice(index,1);editGroup(id)}

function saveGroupConfig(id){const g=state.groups.find(x=>x.id===id);g.capacity=+document.getElementById('gCap').value||g.capacity;g.note=document.getElementById('gNote').value;closeModal();render();showToast('Grupo atualizado.')}
