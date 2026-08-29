/* Round 31/32 — keyed strings for session-specific review UX. */
(function i18nR31(){
  const messages=window.OleiroI18nMessages;if(!messages)return;
  const add=(lang,rows)=>Object.assign(messages[lang]||(messages[lang]={}),rows);
  add('pt',{
    'review.adjustReason':'Motivo do ajuste:','review.changeReason':'Motivo da alteração:','review.readjustReason':'Motivo do reajuste:','review.from':'De:','review.to':'Para:',
    'review.awaiting':'Aguardando análise','review.adjustSent':'Ajuste reenviado','review.adjusted':'Ajustado','review.sent':'Enviado','review.newActivity':'Nova atividade','review.changeRequested':'Mudança solicitada','review.rejected':'Recusada',
    'review.adjustActivity':'Ajustar atividade','review.adjustAgain':'Editar novamente','review.readjustActivity':'Reajustar atividade','review.reasonRequired':'Informe o motivo da alteração.','review.changeSent':'Alteração enviada para análise.','review.adjustmentSaved':'Ajuste salvo. Reenvie o planejamento para análise.','review.adjustmentError':'Não foi possível salvar o ajuste.','review.adjustBeforeResend':'Ajuste todas as atividades sinalizadas antes de reenviar o planejamento.',
    'review.currentProposal':'Proposta atual','review.teamGuidance':'Orientação da equipe','review.dayAdjustment':'Existe um ajuste solicitado nesta atividade.','review.sessionAdjustment':'Ajuste solicitado nesta atividade.','review.newActivityInfo':'Nova atividade proposta por você. Aguardando análise da equipe.',
    'review.date':'Data','review.time':'Horário','review.duration':'Duração','review.period':'Período','review.activity':'Atividade','review.description':'Descrição','review.participation':'Participação','review.materials':'Materiais','review.notes':'Observações',
    'role.activityAssistant':'Assistente de atividades'
  });
  add('en',{
    'review.adjustReason':'Adjustment reason:','review.changeReason':'Change reason:','review.readjustReason':'Readjustment reason:','review.from':'From:','review.to':'To:',
    'review.awaiting':'Awaiting review','review.adjustSent':'Adjustment resubmitted','review.adjusted':'Adjusted','review.sent':'Sent','review.newActivity':'New activity','review.changeRequested':'Change requested','review.rejected':'Rejected',
    'review.adjustActivity':'Adjust activity','review.adjustAgain':'Edit again','review.readjustActivity':'Readjust activity','review.reasonRequired':'Enter the reason for the change.','review.changeSent':'Change sent for review.','review.adjustmentSaved':'Adjustment saved. Resend the plan for review.','review.adjustmentError':'Could not save the adjustment.','review.adjustBeforeResend':'Adjust every flagged activity before resending the plan.',
    'review.currentProposal':'Current proposal','review.teamGuidance':'Team guidance','review.dayAdjustment':'An adjustment was requested for this activity.','review.sessionAdjustment':'Adjustment requested for this activity.','review.newActivityInfo':'New activity proposed by you. Awaiting team review.',
    'review.date':'Date','review.time':'Time','review.duration':'Duration','review.period':'Period','review.activity':'Activity','review.description':'Description','review.participation':'Participation','review.materials':'Materials','review.notes':'Notes',
    'role.activityAssistant':'Activity assistant'
  });
  add('es',{
    'review.adjustReason':'Motivo del ajuste:','review.changeReason':'Motivo del cambio:','review.readjustReason':'Motivo del reajuste:','review.from':'De:','review.to':'Para:',
    'review.awaiting':'Esperando análisis','review.adjustSent':'Ajuste reenviado','review.adjusted':'Ajustado','review.sent':'Enviado','review.newActivity':'Nueva actividad','review.changeRequested':'Cambio solicitado','review.rejected':'Rechazada',
    'review.adjustActivity':'Ajustar actividad','review.adjustAgain':'Editar de nuevo','review.readjustActivity':'Reajustar actividad','review.reasonRequired':'Indica el motivo del cambio.','review.changeSent':'Cambio enviado para análisis.','review.adjustmentSaved':'Ajuste guardado. Reenvía la planificación para análisis.','review.adjustmentError':'No fue posible guardar el ajuste.','review.adjustBeforeResend':'Ajusta todas las actividades señaladas antes de reenviar la planificación.',
    'review.currentProposal':'Propuesta actual','review.teamGuidance':'Orientación del equipo','review.dayAdjustment':'Hay un ajuste solicitado en esta actividad.','review.sessionAdjustment':'Ajuste solicitado en esta actividad.','review.newActivityInfo':'Nueva actividad propuesta por ti. Esperando análisis del equipo.',
    'review.date':'Fecha','review.time':'Horario','review.duration':'Duración','review.period':'Período','review.activity':'Actividad','review.description':'Descripción','review.participation':'Participación','review.materials':'Materiales','review.notes':'Observaciones',
    'role.activityAssistant':'Asistente de actividades'
  });
})();
