/* Round 31 — defense-in-depth UI guard for the activity assistant role. */
(function activityAssistantHardeningR31(){
  const isAssistant=()=>String(state.currentSession?.user?.role||'')==='activity_assistant';
  const blocked=/approveCandidate|confirmApprovePlanningR25|requestClearCandidatePlanning|confirmResetPlanning|rejectCandidate|reactivateCandidate|openStayDateEditor|saveStayDates|confirmStayDates|requestVolunteerEmailEdit|confirmInactivate|openNewCandidate|openSelectionMeetingEditor|requestCompleteSelectionMeeting|requestFinalSelectionDecision|confirmFinalSelectionDecision|openUnits/;
  const baseRender=window.renderPersonModal||renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRender(p,tab);if(!isAssistant())return result;
    modalRoot.querySelectorAll('button,a').forEach(node=>{const action=String(node.getAttribute('onclick')||'');if(blocked.test(action))node.remove()});
    modalRoot.querySelectorAll('.admin-review-actions-r24').forEach(root=>{if(!root.querySelector('button'))root.remove()});
    return result;
  };
  const deny=name=>{const base=window[name];if(typeof base!=='function')return;window[name]=function(...args){if(isAssistant())return showToast('Esta ação é exclusiva do administrador.');return base(...args)}};
  ['approveCandidate','confirmApprovePlanningR25','requestClearCandidatePlanning','confirmResetPlanning','rejectCandidate','reactivateCandidate','openStayDateEditor','saveStayDates','confirmStayDates','requestVolunteerEmailEdit','confirmInactivateApprovedVolunteer','openNewCandidate','openSelectionMeetingEditor','requestCompleteSelectionMeeting','confirmCompleteSelectionMeeting','requestFinalSelectionDecision','confirmFinalSelectionDecision','openUnits'].forEach(deny);

  /* A listagem de Voluntariado deve abrir sempre em Planejamento. A camada anterior usava
     "overview" como padrão e o refactor legado convertia esse valor para Conta. */
  const baseOpenPerson=window.openPerson||openPerson;
  openPerson=function(id,tab='plan'){
    const target=!tab||tab==='overview'?'plan':tab;
    return baseOpenPerson(id,target);
  };

  window.renderPersonModal=renderPersonModal;
  window.openPerson=openPerson;
})();
