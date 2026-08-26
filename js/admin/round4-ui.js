/* Round 4 — Admin: handlers seguros, planejamento compacto e contatos de dupla. */
(function round4AdminUi(){
  function safeId(value){return encodeURIComponent(String(value??''))}
  function compactDate(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${date}T12:00:00`))}catch{return fmtDate(date)}}
  function compactWeekday(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{weekday:'short'}).format(new Date(`${date}T12:00:00`)).replace('.','').toLowerCase()}catch{return String(dayName(date)||'').slice(0,3).toLowerCase()}}
  function dayHours(day){const minutes=(day.sessions||[]).reduce((sum,s)=>sum+(Number(s.duration||s.activity?.duration)||0),0);const h=Math.floor(minutes/60),m=minutes%60;if(!h)return `${m}min`;return m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`}
  function formatHistoryDate(value){if(!value||value==='—')return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d).replace(',',' às')}

  /* iPhone: preservar a chegada ao escolher a saída. */
  syncCandidateDateField=function(id){
    syncVisualDateField(id);const from=document.getElementById('ncFrom'),to=document.getElementById('ncTo');
    if(from&&to){to.min=from.value||'';from.removeAttribute('max');if(from.value&&to.value&&to.value<from.value){to.value='';syncVisualDateField('ncTo');showToast('A saída deve ser posterior à chegada.')}}
    syncNewCandidateSubmit();
  };

  /* Grupos: teclado numérico no iPhone e handler de salvar sem conflito de aspas. */
  editGroup=function(id){
    const g=(state.groups||[]).find(x=>String(x.id)===String(id));if(!g)return showToast('Grupo não encontrado.');const members=[...(g.members||[])];const groupId=String(g.id);
    openModal(`Grupo ${escapeHtml(g.code||g.id)}`,'Edite capacidade, observação e integrantes.',`<div class="form-grid group-edit-form"><div class="field"><label for="gCap">Capacidade</label><input id="gCap" class="input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" step="1" value="${Number(g.capacity||5)}"></div><div class="field"><label for="gNote">Observação</label><input id="gNote" class="input" value="${escapeHtml(g.note||'')}" placeholder="Opcional"></div><div class="field"><label>Integrantes</label><div id="groupMemberList" class="group-member-list">${members.map((m,i)=>`<div class="member-row group-member-edit-row"><span class="member-name"><span class="member-dot"></span>${escapeHtml(m)}</span><button class="group-delete-button" type="button" onclick="removeGroupMemberDraft(${i})" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button></div>`).join('')||'<div class="empty">Nenhum nome cadastrado.</div>'}</div></div><div class="field group-new-member"><label for="gMember">Novo nome</label><div class="group-add-row"><input id="gMember" class="input" placeholder="Nome"><button class="btn btn-soft" type="button" onclick="addGroupMemberDraft()"><i class="fa-solid fa-plus"></i>Adicionar</button></div></div></div>`,`<button id="r4GroupSave" class="btn btn-primary btn-block" type="button" onclick='saveGroupConfig(${JSON.stringify(groupId)})'>Salvar</button>`);
    modalRoot.dataset.groupId=groupId;modalRoot.dataset.groupMembers=JSON.stringify(members);modalRoot.querySelector('.modal')?.classList.add('group-edit-modal');
  };

  const baseSaveGroup=saveGroupConfig;
  saveGroupConfig=async function(id){const button=document.getElementById('r4GroupSave');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>Salvando...'}try{return await baseSaveGroup(id)}finally{if(document.body.contains(button)){button.disabled=false;button.textContent='Salvar'}}};

  /* Contadores aprovados: atualizar a Visão geral assim que o cache real chegar. */
  const baseHydrate=hydrateCandidatePlanning;
  hydrateCandidatePlanning=async function(applicationId,opts={}){
    const cache=await baseHydrate(applicationId,opts);const p=candidateById(applicationId);
    if(p&&cache){p.activities=(cache.activities||[]).length;p.sessions=(cache.sessions||[]).length;if(modalRoot.dataset.personId===String(applicationId)&&modalRoot.dataset.personTab==='overview')requestAnimationFrame(()=>refreshOpenPersonModal(applicationId));}
    return cache;
  };

  function contactPeople(p){
    const names=Array.isArray(p.participantNames)&&p.participantNames.length?p.participantNames:[p.name||'Voluntário'];
    const emails=Array.isArray(p.participantEmails)&&p.participantEmails.length?p.participantEmails:String(p.email||'').split(',').map(x=>x.trim()).filter(Boolean);
    const phones=Array.isArray(p.participantPhones)&&p.participantPhones.length?p.participantPhones:String(p.phone||'').split('/').map(x=>x.trim()).filter(Boolean);
    return names.map((name,i)=>({name,email:emails[i]||'—',phone:phones[i]||'—'}));
  }
  function overviewContent(p){
    const [label]=statusMeta(p.status),arg=candidateActionArg(p.id),contacts=contactPeople(p);
    const note=p.internalNote?`<div class="candidate-internal-note"><strong>Observação interna</strong><p>${escapeHtml(p.internalNote)}</p></div>`:'';
    const actions=['analysis','adjustments'].includes(p.status)?`<div class="activity-actions" style="margin-top:12px"><button class="btn btn-primary" onclick="approveCandidate(decodeURIComponent('${arg}'))">Aprovar</button><button class="btn btn-outline" onclick="openPerson(decodeURIComponent('${arg}'),'plan')">Revisar planejamento</button><button class="btn btn-danger" onclick="rejectCandidate(decodeURIComponent('${arg}'))">Recusar</button></div>`:p.status==='rejected'?`<button class="btn btn-soft btn-block" style="margin-top:12px" onclick="reactivateCandidate(decodeURIComponent('${arg}'))">Reativar perfil</button>`:'';
    return `<div class="card"><div><span class="eyebrow">Status</span><h3 style="font-size:.88rem;margin-top:5px">${label}</h3></div><div class="stat-row"><span class="stat-pill">${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</span><span class="stat-pill">${Number(p.activities||0)} atividades</span><span class="stat-pill">${Number(p.sessions||0)} sessões</span></div></div><div class="card candidate-contact-card"><div class="candidate-contact-title">Contato</div>${contacts.map(person=>`<div class="candidate-contact-person"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.email)}</span><span>${escapeHtml(person.phone)}</span></div>`).join('')}</div>${note}${actions}`;
  }
  function historyContent(p){const [label]=statusMeta(p.status);return `<div class="list"><div class="list-item"><div class="metric-icon"><i class="fa-solid fa-user-plus"></i></div><div class="item-main"><h3>Perfil criado</h3><p>Acesso liberado para o processo de planejamento.</p></div></div>${p.submitted&&p.submitted!=='—'?`<div class="list-item"><div class="metric-icon"><i class="fa-solid fa-paper-plane"></i></div><div class="item-main"><h3>Planejamento enviado</h3><p>${formatHistoryDate(p.submitted)}</p></div></div>`:''}<div class="list-item"><div class="metric-icon"><i class="fa-solid fa-circle-info"></i></div><div class="item-main"><h3>Status atual</h3><p>${label}</p></div></div></div>${p.rejectedReason?`<div class="candidate-internal-note"><strong>Motivo da inativação</strong><p>${escapeHtml(p.rejectedReason)}</p></div>`:''}`}
  const basePersonTab=personTabContent;
  personTabContent=function(p,tab){if(tab==='overview')return overviewContent(p);if(tab==='history')return historyContent(p);return basePersonTab(p,tab)};

  /* Planejamento: resumo por dia recolhível, data curta e total de horas à direita. */
  adminPlanningDayCard=function(p,day){
    const adjustment=candidateDayAdjustment(p,day.date),canAdjust=['analysis','adjustments'].includes(p.status),id=safeId(p.id),dateArg=safeId(day.date),open=adjustment||day._index===0?' open':'';
    return `<details class="card planning-day-card"${open}><summary class="planning-day-head"><div class="planning-day-date"><strong>${compactDate(day.date)} ${compactWeekday(day.date)}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>${dayHours(day)}</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="planning-day-sessions">${day.sessions.map(session=>{const a=session.activity||{},note=session.notes||a.notes||'',group=session.groupId&&session.groupId!=='A definir'?` • Grupo ${escapeHtml(session.groupId)}`:'';return `<div class="planning-session-row"><div><strong>${escapeHtml(a.name||session.activityName||'Atividade')}</strong><span>${escapeHtml(session.time||a.time||'—')} • ${Number(session.duration||a.duration)||0} min${group}</span>${note?`<p>${escapeHtml(note)}</p>`:''}</div></div>`}).join('')}</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  };
  candidatePlanContent=function(p){
    const cache=candidatePlanningCache(p.id);if(!cache)return `<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>`;
    const days=candidatePlanningDays(p);if(!days.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhuma atividade cadastrada ainda.</div>`;
    const visible=Math.max(CANDIDATE_PLAN_PAGE_SIZE,state.candidatePlanVisible[String(p.id)]||CANDIDATE_PLAN_PAGE_SIZE),shown=days.slice(0,visible),remaining=days.length-shown.length,arg=candidateActionArg(p.id);
    return `<div class="planning-by-day">${shown.map((day,index)=>adminPlanningDayCard(p,{...day,_index:index})).join('')}</div>${remaining>0?`<button class="btn btn-soft btn-block" type="button" style="margin-top:10px" onclick="loadMoreCandidatePlan(decodeURIComponent('${arg}'))"><i class="fa-solid fa-chevron-down"></i>Ver mais ${Math.min(CANDIDATE_PLAN_PAGE_SIZE,remaining)}</button>`:''}<div class="planning-admin-footer"><button class="btn btn-outline planning-whatsapp" type="button" onclick="exportCandidatePlanning(decodeURIComponent('${arg}'))"><i class="fa-brands fa-whatsapp"></i>Compartilhar no WhatsApp</button>${['analysis','adjustments'].includes(p.status)?`<button class="btn btn-primary" type="button" onclick="approveCandidate(decodeURIComponent('${arg}'))">Aprovar planejamento</button>`:''}</div>`;
  };

  function restorePlan(id){const p=candidateById(id);if(p)renderPersonModal(p,'plan');else closeModal()}
  requestDayAdjust=function(id,date){
    const p=candidateById(id);if(!p)return;const existing=candidateDayAdjustment(p,date)?.note||'',idArg=safeId(id),dateArg=safeId(date);
    openModal(`Ajuste em ${fmtDate(date,true)}`,'Explique somente o que precisa ser revisto neste dia.',`<div class="field"><label for="dayAdjustNote">Orientação ao voluntário</label><textarea id="dayAdjustNote" class="textarea" placeholder="Ex.: ajustar o horário e reduzir a duração.">${escapeHtml(existing)}</textarea></div>`,`<button id="r4DayAdjustSave" class="btn btn-primary btn-block" type="button" onclick="saveDayAdjustment(decodeURIComponent('${idArg}'),decodeURIComponent('${dateArg}'))">Solicitar ajuste</button>`);
    const close=modalRoot.querySelector('.modal-close');if(close)close.onclick=()=>restorePlan(id);const backdrop=modalRoot.querySelector('.modal-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop)restorePlan(id)};
  };
  saveDayAdjustment=async function(id,date){
    const p=candidateById(id),note=document.getElementById('dayAdjustNote')?.value.trim()||'',button=document.getElementById('r4DayAdjustSave');if(!p||!note)return showToast('Informe o ajuste solicitado.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>Salvando...'}
    try{await window.OleiroServices.applications.requestDayAdjustment(p.id,date,note);p.status='adjustments';p.dayAdjustments=p.dayAdjustments||{};p.dayAdjustments[date]={note,status:'requested'};p.pendingUntil=candidateDeadlineFrom(new Date(),7);renderPersonModal(p,'plan');showToast('Ajuste solicitado para este dia.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível solicitar o ajuste.');if(button){button.disabled=false;button.textContent='Solicitar ajuste'}}
  };

  /* Confirmação de alteração de datas: todos os botões usam argumentos seguros. */
  saveStayDates=async function(id){
    const p=candidateById(id),from=document.getElementById('editStayFrom')?.value||'',to=document.getElementById('editStayTo')?.value||'';if(!p||!from||!to||to<from)return showToast('Confira as datas informadas.');
    try{const preview=await window.OleiroServices.applications.previewStayDateChange(p.id,{stayStart:from,stayEnd:to});if(preview.outsideCount){const idArg=safeId(id),fromArg=safeId(from),toArg=safeId(to);openModal('Confirmar alteração',`${preview.outsideCount} ${preview.outsideCount===1?'sessão ficará':'sessões ficarão'} fora do novo período.`,`<div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div>As atividades dos dias ${preview.outsideDates.map(d=>fmtDate(d,true)).join(', ')} serão removidas do planejamento.</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="openStayDateEditor(decodeURIComponent('${idArg}'))">Voltar</button><button class="btn btn-danger" type="button" onclick="confirmStayDates(decodeURIComponent('${idArg}'),decodeURIComponent('${fromArg}'),decodeURIComponent('${toArg}'))">Alterar e remover</button></div>`);const close=modalRoot.querySelector('.modal-close');if(close)close.onclick=()=>openStayDateEditor(id);return}await confirmStayDates(id,from,to)}catch(error){console.error(error);showToast(error?.message||'Não foi possível verificar o novo período.')}
  };
  confirmStayDates=async function(id,from,to){
    const p=candidateById(id);if(!p)return;const buttons=[...modalRoot.querySelectorAll('.confirm-delete-actions .btn')];buttons.forEach(b=>b.disabled=true);
    try{const result=await window.OleiroServices.applications.changeStayDates(p.id,{stayStart:from,stayEnd:to,removeOutside:true});p.from=from;p.to=to;p.stayStart=from;p.stayEnd=to;p.sessions=result.sessionCount;p.activities=result.activityCount;invalidateCandidatePlanning(p.id);invalidateManagerScheduleCache?.();renderPersonModal(p,'stay');showToast(result.removedSessions?`Datas alteradas. ${result.removedSessions} sessão(ões) fora do período foram removidas.`:'Datas alteradas.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível alterar as datas.');buttons.forEach(b=>b.disabled=false)}
  };
})();
