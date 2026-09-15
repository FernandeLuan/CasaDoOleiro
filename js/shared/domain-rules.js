/* Regras de negócio puras compartilhadas entre telas.
   Este arquivo não renderiza UI e não acessa Firebase. */
(function installOleiroDomainRules(){
  if(window.OleiroRules)return;
  const candidatePlanningEditableStatuses=Object.freeze(['draft','submitted','adjustments']);
  const candidateApplicationEditableStatuses=Object.freeze(['pending','analysis','adjustments']);

  window.OleiroRules=Object.freeze({
    candidatePlanningEditableStatuses,
    candidateApplicationEditableStatuses,
    candidatePlanningEditable(status='draft'){
      return candidatePlanningEditableStatuses.includes(String(status||'draft'));
    },
    candidateApplicationEditable(status=''){
      return candidateApplicationEditableStatuses.includes(String(status||''));
    }
  });
})();
