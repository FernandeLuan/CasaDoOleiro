const _v3VolunteerHomeBase=volunteerHome;
volunteerHome=function(){
  let html=_v3VolunteerHomeBase();
  html=html.replace(/onclick="state\.volunteerPage='([^']+)';render\(\)"/g,(_m,page)=>`onclick="navigateVolunteer('${page}')"`);
  html=html.replace('<span style="font-size:.62rem;color:var(--muted)">Rodeio</span>','<span style="font-size:.62rem;color:var(--muted)">Dia sem atividade</span>');
  return html;
};

volunteerStayDates=function(){return dateRange('2026-09-04',14)};

volunteerHomeActivityCard=function(s){
  return `<button class="list-item clickable volunteer-home-activity" onclick="navigateVolunteer('agenda')"><div class="time-box single"><strong>${s.activity.time}</strong></div><div class="item-main"><h3>${s.activity.name}</h3><p>${fmtDate(s.date)} • ${s.group}</p><div class="item-meta">${badge('Confirmada','success')}</div></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);align-self:center"></i></button>`;
};

openActivityModal=function(date=null,id=null){
  if(state.volunteerMode!=='approved'&&!['draft','adjustments'].includes(state.volunteerPlanStatus||'draft'))return showToast('O planejamento já foi enviado. Aguarde a análise da Casa.');
  const a=id?state.activities.find(x=>x.id===id):null,defaultDate=date||'2026-09-08',availableDates=volunteerStayDates();
  const body=`<div class="form-grid activity-modal-form"><div class="field"><label for="actName">Nome da atividade</label><input id="actName" class="input" value="${a?a.name:''}" placeholder="Ex.: Conversação em inglês"></div><div class="field"><label for="actDesc">Descrição</label><textarea id="actDesc" class="textarea" placeholder="Como a atividade funciona?">${a?a.description:''}</textarea></div><div class="field-row"><div class="field"><label for="actDuration">Duração</label><select id="actDuration" class="select">${[30,60,90,120].map(v=>`<option value="${v}" ${a&&a.duration===v?'selected':''}>${v===90?'1h30':v===120?'2h':v+' min'}</option>`).join('')}</select></div><div class="field"><label for="actParticipation">Participação</label><select id="actParticipation" class="select">${['Até 5','Até 10','Livre','Outro'].map(v=>`<option ${a&&a.participation===v?'selected':''}>${v}</option>`).join('')}</select></div></div><div class="field"><label for="actMaterials">Materiais necessários</label><input id="actMaterials" class="input" value="${a?a.materials:''}" placeholder="Nenhum, quadro, bola..."></div><div class="field"><label for="actNotes">Observações</label><textarea id="actNotes" class="textarea" placeholder="Opcional">${a?a.notes:''}</textarea></div><div class="field-row"><div class="field"><label for="actPeriod">Período preferido</label><select id="actPeriod" class="select">${['Manhã','Tarde','Noite','Sem preferência'].map(v=>`<option ${a&&a.period===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label for="actTime">Horário sugerido</label><input id="actTime" class="input" type="time" value="${a?a.time:'15:15'}"><small>Opcional na versão final.</small></div></div><div class="field"><label>Datas em que deseja realizar</label><div class="check-grid activity-date-grid">${availableDates.map(d=>`<label class="check-card"><input type="checkbox" name="actDate" value="${d}" ${(a&&a.dates.includes(d))||(!a&&d===defaultDate)?'checked':''}><span>${dayName(d)} ${fmtDate(d,true)}</span></label>`).join('')}</div></div></div>`;
  const footer=`<button class="btn btn-primary btn-block" type="button" onclick="saveActivity(${a?a.id:'null'})">${a?'Salvar alterações':'Adicionar atividade'}</button>`;
  openModal(a?'Editar atividade':'Nova atividade',a?'A descrição é compartilhada entre todas as sessões.':'Cadastre uma vez e selecione quantas datas precisar.',body,footer);
  modalRoot.querySelector('.modal')?.classList.add('activity-modal');
};

window.volunteerHome=volunteerHome;
window.volunteerPlan=volunteerPlan;
