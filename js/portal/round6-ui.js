/* Round 6 — Portal: grupo sugerido, estadia sem redundância e e-mails neutros no iOS. */
(function round6Portal(){
  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();
    /* No resumo da estadia, chegada e saída são dias sem atividade. */
    const marker='<h2>Minha estadia</h2>',markerIndex=html.indexOf(marker);
    if(markerIndex>=0){
      const token='<span style="font-size:.62rem;color:var(--muted)">',start=html.indexOf(token,markerIndex);
      if(start>=0){const contentStart=start+token.length,end=html.indexOf('</span>',contentStart);if(end>=0)html=html.slice(0,contentStart)+'Dia sem atividade'+html.slice(end)}
    }
    return html;
  };

  const baseVolunteerProfile=volunteerProfile;
  volunteerProfile=function(){return baseVolunteerProfile().replace(/E-mail/g,'Email')};

  function groupPreferenceOptions(current='A definir'){
    const rows=[['A definir','A definir pela Casa'],['A','Grupo A'],['B','Grupo B'],['C','Grupo C'],['D','Grupo D'],['Livre','Livre']];
    return rows.map(([value,label])=>`<option value="${value}" ${String(current||'A definir')===value?'selected':''}>${label}</option>`).join('');
  }

  /* O voluntário informa uma preferência; groupId continua sendo decisão do Admin. */
  openActivityModal=function(date=null,id=null){
    if(state.volunteerMode==='approved')return showToast('Após a aprovação, mudanças devem ser solicitadas pela agenda.');
    if(!['draft','adjustments'].includes(state.volunteerPlanStatus||'draft'))return showToast('O planejamento já foi enviado. Aguarde a análise da Casa.');
    const a=id?state.activities.find(x=>String(x.id)===String(id)):null,availableDates=volunteerStayDates(),defaultDate=date||availableDates[0]||'';
    const body=`<div class="form-grid activity-modal-form"><div class="field"><label for="actName">Nome da atividade</label><input id="actName" class="input" value="${escapeHtml(a?.name||'')}" placeholder="Ex.: Conversação em inglês"></div><div class="field"><label for="actDesc">Descrição</label><textarea id="actDesc" class="textarea" placeholder="Como a atividade funciona?">${escapeHtml(a?.description||'')}</textarea></div><div class="field-row"><div class="field"><label for="actDuration">Duração</label><select id="actDuration" class="select">${[30,60,90,120].map(v=>`<option value="${v}" ${a&&Number(a.duration)===v?'selected':''}>${v===90?'1h30':v===120?'2h':v+' min'}</option>`).join('')}</select></div><div class="field"><label for="actParticipation">Participação</label><select id="actParticipation" class="select">${['Até 5','Até 10','Livre','Outro'].map(v=>`<option ${a&&a.participation===v?'selected':''}>${v}</option>`).join('')}</select></div></div><div class="field"><label for="actGroupPreference">Grupo sugerido</label><select id="actGroupPreference" class="select">${groupPreferenceOptions(a?.groupPreference||'A definir')}</select><small class="group-preference-hint">É apenas uma sugestão. A equipe da Casa confirma o grupo final conforme a rotina da comunidade.</small></div><div class="field"><label for="actMaterials">Materiais necessários</label><input id="actMaterials" class="input" value="${escapeHtml(a?.materials||'')}" placeholder="Nenhum, quadro, bola..."></div><div class="field"><label for="actNotes">Observações</label><textarea id="actNotes" class="textarea" placeholder="Opcional">${escapeHtml(a?.notes||'')}</textarea></div><div class="field-row"><div class="field"><label for="actPeriod">Período preferido</label><select id="actPeriod" class="select">${['Manhã','Tarde','Noite','Sem preferência'].map(v=>`<option ${a&&a.period===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label for="actTime">Horário sugerido</label><input id="actTime" class="input" type="time" value="${a?.time||'15:15'}"><small>Opcional.</small></div></div><div class="field"><label>Datas em que deseja realizar</label><div class="check-grid activity-date-grid">${availableDates.length?availableDates.map(d=>`<label class="check-card"><input type="checkbox" name="actDate" value="${d}" ${(a&&Array.isArray(a.dates)&&a.dates.includes(d))||(!a&&d===defaultDate)?'checked':''}><span>${dayName(d)} ${fmtDate(d,true)}</span></label>`).join(''):'<div class="empty">Período de estadia ainda não definido.</div>'}</div></div></div>`;
    const footer=`<button class="btn btn-primary btn-block" type="button" onclick='saveActivity(${a?JSON.stringify(a.id):'null'})'>${a?'Salvar alterações':'Adicionar atividade'}</button>`;
    openModal(a?'Editar atividade':'Nova atividade',a?'A descrição é compartilhada entre todas as sessões.':'Cadastre uma vez e selecione quantas datas precisar.',body,footer);modalRoot.querySelector('.modal')?.classList.add('activity-modal');
  };

  saveActivity=async function(id){
    if(state.volunteerMode==='approved')return showToast('Após a aprovação, mudanças devem ser solicitadas pela agenda.');
    if(!['draft','adjustments'].includes(state.volunteerPlanStatus||'draft'))return showToast('O planejamento está bloqueado para edição.');
    const dates=[...document.querySelectorAll('input[name="actDate"]:checked')].map(x=>x.value);
    const data={name:document.getElementById('actName')?.value.trim()||'',description:document.getElementById('actDesc')?.value.trim()||'',duration:+document.getElementById('actDuration')?.value||60,participation:document.getElementById('actParticipation')?.value||'Livre',groupPreference:document.getElementById('actGroupPreference')?.value||'A definir',materials:document.getElementById('actMaterials')?.value.trim()||'Nenhum',notes:document.getElementById('actNotes')?.value.trim()||'',period:document.getElementById('actPeriod')?.value||'Sem preferência',time:document.getElementById('actTime')?.value||'15:15'};
    if(!data.name)return showToast('Informe o nome da atividade.');if(!dates.length)return showToast('Selecione pelo menos uma data.');
    const application=state.currentApplication,session=state.currentSession;if(!application?.id||!session?.uid)return showToast('Sessão de voluntariado inválida.');
    const ownerName=typeof volunteerProfileName==='function'?volunteerProfileName():(session.profile?.name||session.email||'Voluntário');
    try{const result=await window.OleiroServices.planning.saveActivity({activityId:id,applicationId:application.id,unitId:application.unitId,createdByUid:session.uid,ownerName,data,dates,existingSessions:state.sessions||[]});applySavedActivityResult(result,dates);closeModal();render();showToast(id?'Atividade atualizada.':'Atividade adicionada ao planejamento.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível salvar a atividade.')}
  };

  sessionCardVolunteer=function(s,editable){
    const [l,t]=statusMeta(s.status),candidateEdit=editable&&state.volunteerMode!=='approved',approvedMove=editable&&state.volunteerMode==='approved';
    const actions=candidateEdit?`<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(s.activity.id)})'>Editar</button><button class="btn btn-outline" onclick='moveSession(${JSON.stringify(s.activity.id)},${JSON.stringify(s.date)},true)'>Mover</button><button class="btn btn-danger-soft" onclick='requestDeletePlanningSession(${JSON.stringify(s.activity.id)},${JSON.stringify(s.date)})'>Excluir</button></div>`:approvedMove?`<div class="activity-actions"><button class="btn btn-outline" onclick='moveSession(${JSON.stringify(s.activity.id)},${JSON.stringify(s.date)},true)'>Solicitar mudança</button></div>`:'';
    const statusBadge=s.status==='proposed'&&state.volunteerMode!=='approved'?'':badge(l,t),preference=s.activity?.groupPreference||s.raw?.groupPreference||'',groupText=s.group&&s.group!=='A definir'?`Grupo ${escapeHtml(s.group)}`:(preference&&preference!=='A definir'?(preference==='Livre'?'Livre':'Grupo '+escapeHtml(preference)):'');
    return `<div class="activity-card"><div class="activity-row"><div><h4>${escapeHtml(s.activity.time||'—')} • ${escapeHtml(s.activity.name||'Atividade')}</h4><p>${Number(s.activity.duration)||0} min • ${escapeHtml(s.activity.period||'Sem preferência')}${groupText?` • ${groupText}${s.group&&s.group!=='A definir'?'':' (sugerido)'}`:''}</p></div>${statusBadge}</div>${actions}</div>`;
  };

  if(state.role==='volunteer'&&typeof render==='function')render();
})();
