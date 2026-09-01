/* Portal — feedback de carregamento e detalhes da atividade. */
(function portalPlanningUx(){
  window.retryVolunteerPlanning=async function(){
    const application=state.currentApplication;if(!application?.id)return;
    state.volunteerPlanningFailedFor=null;state.volunteerPlanningLoadedFor=null;render();
    try{await hydrateVolunteerPlanning(application,{force:true});render()}catch(error){console.error(error);render()}
  };

  const baseVolunteerAgendaContent=volunteerAgendaContent;
  volunteerAgendaContent=function(editable=false){
    const applicationId=String(state.currentApplication?.id||'');
    if(applicationId&&state.volunteerPlanningLoadedFor!==applicationId){
      if(state.volunteerPlanningFailedFor===applicationId){
        return `<div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Não foi possível carregar as atividades.</strong><br><button class="btn btn-soft" type="button" style="margin-top:8px" onclick="retryVolunteerPlanning()">Tentar novamente</button></div></div>`;
      }
      return `<div class="volunteer-inline-loading"><i class="fa-solid fa-circle-notch fa-spin"></i><span>Carregando atividades...</span></div>`;
    }
    return baseVolunteerAgendaContent(editable);
  };

  window.openVolunteerActivityInfo=function(name,description,notes,materials){
    const n=decodeURIComponent(name||''),d=decodeURIComponent(description||''),o=decodeURIComponent(notes||''),m=decodeURIComponent(materials||'');
    const sections=[];
    if(d)sections.push(`<div class="activity-info-block"><strong>Descrição</strong><p>${escapeHtml(d)}</p></div>`);
    if(o)sections.push(`<div class="activity-info-block"><strong>Observações</strong><p>${escapeHtml(o)}</p></div>`);
    if(m&&m!=='Nenhum')sections.push(`<div class="activity-info-block"><strong>Materiais</strong><p>${escapeHtml(m)}</p></div>`);
    openModal(n||'Informações da atividade','',sections.join('')||'<div class="empty">Sem informações adicionais.</div>');
  };

  function safe(value){return encodeURIComponent(String(value??''))}
  sessionCardVolunteer=function(s,editable){
    const [label,type]=statusMeta(s.status),candidateEdit=editable&&state.volunteerMode!=='approved',approvedMove=editable&&state.volunteerMode==='approved';
    const a=s.activity||{},description=s.activityDescription||a.description||'',notes=s.notes||a.notes||'',materials=s.materials||a.materials||'',hasInfo=!!(description||notes||(materials&&materials!=='Nenhum'));
    const actions=candidateEdit?`<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(a.id||s.activityId)})'>Editar</button><button class="btn btn-outline" onclick='moveSession(${JSON.stringify(a.id||s.activityId)},${JSON.stringify(s.date)},true)'>Mover</button><button class="btn btn-danger-soft" onclick='requestDeletePlanningSession(${JSON.stringify(a.id||s.activityId)},${JSON.stringify(s.date)})'>Excluir</button></div>`:approvedMove?`<div class="activity-actions"><button class="btn btn-outline" onclick='moveSession(${JSON.stringify(a.id||s.activityId)},${JSON.stringify(s.date)},true)'>Solicitar mudança</button></div>`:'';
    const statusBadge=(s.status==='proposed'&&state.volunteerMode!=='approved')||s.status==='confirmed'?'':badge(label,type);
    return `<div class="activity-card"><div class="activity-row"><div class="volunteer-activity-main"><div class="volunteer-activity-title"><h4 data-no-i18n>${escapeHtml(a.name||s.activityName||'Atividade')}</h4>${hasInfo?`<button class="planning-note-button" type="button" aria-label="Ver informações da atividade" onclick="openVolunteerActivityInfo('${safe(a.name||s.activityName||'Atividade')}','${safe(description)}','${safe(notes)}','${safe(materials)}')"><i class="fa-solid fa-circle-info"></i></button>`:''}</div><p>${Number(a.duration||s.duration)||0} min • ${escapeHtml(activityPeriodValue(s,a))}</p></div>${statusBadge}</div>${actions}</div>`;
  };

  if(state.role==='volunteer'&&typeof render==='function')render();
})();
