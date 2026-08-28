/* Round 27 — i18n por chave para componentes dinâmicos. Novos componentes devem usar t(),
   sem depender de observador de DOM ou tradução de texto já renderizado. */
(function keyedI18nR27(){
  const messages={
    pt:{
      'common.loading':'Carregando...','common.loadMore':'Carregar mais','common.notDefined':'Não definido',
      'action.save':'Salvar','action.saving':'Salvando...','action.delete':'Excluir','action.deleting':'Excluindo...','action.approve':'Aprovar','action.approving':'Aprovando...','action.reject':'Recusar','action.send':'Enviar','action.sending':'Enviando...','action.move':'Mover',
      'meeting.waiting':'Aguardando reunião','meeting.scheduled':'Reunião agendada','meeting.completed':'Reunião realizada','meeting.note':'Observação:',
      'candidate.reason':'Motivo:','role.admin':'Administrador','role.coordinator':'Coordenador','role.volunteer':'Voluntário',
      'history.tab':'Histórico','history.title':'Histórico do candidato','history.subtitle':'Ações e mudanças registradas neste processo.','history.loading':'Carregando histórico...','history.empty':'Nenhum evento registrado ainda.','history.error':'Não foi possível carregar o histórico.','history.more':'Carregar mais eventos',
      'history.candidate_created':'Candidato cadastrado','history.planning_submitted':'Planejamento enviado','history.planning_resent':'Planejamento reenviado','history.adjustment_requested':'Ajuste solicitado','history.planning_reset':'Planejamento reiniciado','history.planning_approved':'Planejamento aprovado','history.meeting_scheduled':'Reunião agendada','history.meeting_completed':'Reunião realizada','history.candidate_approved':'Candidato aprovado','history.candidate_rejected':'Candidato recusado','history.candidate_reactivated':'Candidato reativado','history.stay_dates_changed':'Período da estadia alterado','history.activity_created':'Atividade criada','history.activity_updated':'Atividade atualizada','history.activity_deleted':'Atividade excluída','history.session_moved':'Atividade movida','history.post_proposal_reviewed':'Proposta pós-aprovação revisada','history.unit_changed':'Unidade alterada'
    },
    en:{
      'common.loading':'Loading...','common.loadMore':'Load more','common.notDefined':'Not set',
      'action.save':'Save','action.saving':'Saving...','action.delete':'Delete','action.deleting':'Deleting...','action.approve':'Approve','action.approving':'Approving...','action.reject':'Reject','action.send':'Send','action.sending':'Sending...','action.move':'Move',
      'meeting.waiting':'Waiting for meeting','meeting.scheduled':'Meeting scheduled','meeting.completed':'Meeting completed','meeting.note':'Note:',
      'candidate.reason':'Reason:','role.admin':'Administrator','role.coordinator':'Coordinator','role.volunteer':'Volunteer',
      'history.tab':'History','history.title':'Candidate history','history.subtitle':'Actions and changes recorded in this process.','history.loading':'Loading history...','history.empty':'No events recorded yet.','history.error':'Could not load history.','history.more':'Load more events',
      'history.candidate_created':'Candidate registered','history.planning_submitted':'Plan submitted','history.planning_resent':'Plan resubmitted','history.adjustment_requested':'Change requested','history.planning_reset':'Plan reset','history.planning_approved':'Plan approved','history.meeting_scheduled':'Meeting scheduled','history.meeting_completed':'Meeting completed','history.candidate_approved':'Candidate approved','history.candidate_rejected':'Candidate rejected','history.candidate_reactivated':'Candidate reactivated','history.stay_dates_changed':'Stay period changed','history.activity_created':'Activity created','history.activity_updated':'Activity updated','history.activity_deleted':'Activity deleted','history.session_moved':'Activity moved','history.post_proposal_reviewed':'Post-approval proposal reviewed','history.unit_changed':'Unit changed'
    },
    es:{
      'common.loading':'Cargando...','common.loadMore':'Cargar más','common.notDefined':'No definido',
      'action.save':'Guardar','action.saving':'Guardando...','action.delete':'Eliminar','action.deleting':'Eliminando...','action.approve':'Aprobar','action.approving':'Aprobando...','action.reject':'Rechazar','action.send':'Enviar','action.sending':'Enviando...','action.move':'Mover',
      'meeting.waiting':'Esperando reunión','meeting.scheduled':'Reunión programada','meeting.completed':'Reunión realizada','meeting.note':'Observación:',
      'candidate.reason':'Motivo:','role.admin':'Administrador','role.coordinator':'Coordinador','role.volunteer':'Voluntario',
      'history.tab':'Historial','history.title':'Historial del candidato','history.subtitle':'Acciones y cambios registrados en este proceso.','history.loading':'Cargando historial...','history.empty':'Todavía no hay eventos registrados.','history.error':'No se pudo cargar el historial.','history.more':'Cargar más eventos',
      'history.candidate_created':'Candidato registrado','history.planning_submitted':'Planificación enviada','history.planning_resent':'Planificación reenviada','history.adjustment_requested':'Ajuste solicitado','history.planning_reset':'Planificación reiniciada','history.planning_approved':'Planificación aprobada','history.meeting_scheduled':'Reunión programada','history.meeting_completed':'Reunión realizada','history.candidate_approved':'Candidato aprobado','history.candidate_rejected':'Candidato rechazado','history.candidate_reactivated':'Candidato reactivado','history.stay_dates_changed':'Período de estadía modificado','history.activity_created':'Actividad creada','history.activity_updated':'Actividad actualizada','history.activity_deleted':'Actividad eliminada','history.session_moved':'Actividad movida','history.post_proposal_reviewed':'Propuesta posterior a la aprobación revisada','history.unit_changed':'Unidad modificada'
    }
  };
  function interpolate(text,params){return String(text||'').replace(/\{(\w+)\}/g,(_,key)=>Object.prototype.hasOwnProperty.call(params,key)?String(params[key]):`{${key}}`)}
  function t(key,params={},lang=typeof currentLanguage==='function'?currentLanguage():'pt'){
    const code=['pt','en','es'].includes(lang)?lang:'pt';const value=messages[code]?.[key]??messages.pt?.[key]??String(key||'');return interpolate(value,params||{});
  }
  window.OleiroI18nMessages=messages;window.t=t;
})();
