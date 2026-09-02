/* Activity flow translations shared by Admin and Volunteer Portal. */
(function activityFlowI18n(){
  const messages={
    pt:{
      'activity.groups':'Grupos','activity.groupsHelp':'Selecione um ou mais grupos. Participação livre não pode ser combinada com grupos.',
      'activity.groupRequired':'Selecione pelo menos um grupo ou participação livre.',
      'activity.repeat.title':'Outras sessões neste dia','activity.repeat.help':'Adicione outra sessão da mesma atividade em um período ou grupo diferente.','activity.repeat.add':'Adicionar sessão','activity.repeat.period':'Período da sessão','activity.repeat.remove':'Remover sessão','activity.repeat.singleDate':'Para usar sessões adicionais, selecione somente uma data.','activity.repeat.duplicatePeriod':'Use períodos diferentes para cada sessão.','activity.repeat.duplicatePeriodGroup':'Use uma combinação diferente de período e grupos para cada sessão.',
      'activity.details.notes':'Observações','activity.details.materials':'Materiais'
    },
    en:{
      'activity.groups':'Groups','activity.groupsHelp':'Select one or more groups. Open participation cannot be combined with groups.',
      'activity.groupRequired':'Select at least one group or open participation.',
      'activity.repeat.title':'Other sessions on this day','activity.repeat.help':'Add another session of the same activity in a different period or group.','activity.repeat.add':'Add session','activity.repeat.period':'Session period','activity.repeat.remove':'Remove session','activity.repeat.singleDate':'To use additional sessions, select only one date.','activity.repeat.duplicatePeriod':'Use different periods for each session.','activity.repeat.duplicatePeriodGroup':'Use a different period and group combination for each session.',
      'activity.details.notes':'Notes','activity.details.materials':'Materials'
    },
    es:{
      'activity.groups':'Grupos','activity.groupsHelp':'Selecciona uno o más grupos. La participación libre no puede combinarse con grupos.',
      'activity.groupRequired':'Selecciona al menos un grupo o participación libre.',
      'activity.repeat.title':'Otras sesiones este día','activity.repeat.help':'Agrega otra sesión de la misma actividad en un período o grupo diferente.','activity.repeat.add':'Agregar sesión','activity.repeat.period':'Período de la sesión','activity.repeat.remove':'Eliminar sesión','activity.repeat.singleDate':'Para usar sesiones adicionales, selecciona solo una fecha.','activity.repeat.duplicatePeriod':'Usa períodos diferentes para cada sesión.','activity.repeat.duplicatePeriodGroup':'Usa una combinación diferente de período y grupos para cada sesión.',
      'activity.details.notes':'Observaciones','activity.details.materials':'Materiales'
    }
  };
  Object.entries(messages).forEach(([lang,rows])=>{if(window.OleiroI18nMessages?.[lang])Object.assign(window.OleiroI18nMessages[lang],rows)});
})();
