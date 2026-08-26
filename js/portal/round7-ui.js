/* Round 7 — feedback de carregamento e agenda com menos ruído visual. */
(function round7Portal(){
  const baseHydrateVolunteerPlanning=hydrateVolunteerPlanning;
  hydrateVolunteerPlanning=async function(application,options={}){
    try{
      const result=await baseHydrateVolunteerPlanning(application,options);
      state.volunteerPlanningFailedFor=null;
      return result;
    }catch(error){
      state.volunteerPlanningFailedFor=String(application?.id||'');
      throw error;
    }
  };

  window.retryVolunteerPlanning=async function(){
    const application=state.currentApplication;if(!application?.id)return;
    state.volunteerPlanningFailedFor=null;render();
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

  /* Em uma agenda aprovada, “Confirmada” é implícito; só exceções ficam sinalizadas. */
  const baseSessionCardVolunteer=sessionCardVolunteer;
  sessionCardVolunteer=function(session,editable){
    return baseSessionCardVolunteer(session,editable).replace(/<span class="badge success">Confirmada<\/span>/g,'');
  };

  if(state.role==='volunteer'&&typeof render==='function')render();
})();
