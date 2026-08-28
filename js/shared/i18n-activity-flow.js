/* Activity flow translations shared by Admin and Volunteer Portal. */
(function activityFlowI18n(){
  const messages={
    pt:{
      'activity.groups':'Grupos','activity.groupsHelp':'Selecione um ou mais grupos. Participação livre não pode ser combinada com grupos.',
      'activity.groupRequired':'Selecione pelo menos um grupo ou participação livre.',
      'activity.repeat.title':'Outros horários neste dia','activity.repeat.help':'Adicione quando esta mesma atividade acontecer novamente no mesmo dia.','activity.repeat.add':'Adicionar horário','activity.repeat.time':'Horário adicional','activity.repeat.remove':'Remover horário','activity.repeat.singleDate':'Para usar horários adicionais, selecione somente uma data.','activity.repeat.duplicateTime':'Informe horários diferentes para cada ocorrência.','activity.repeat.timeRequired':'Informe todos os horários adicionais.',
      'activity.details.notes':'Observações','activity.details.materials':'Materiais'
    },
    en:{
      'activity.groups':'Groups','activity.groupsHelp':'Select one or more groups. Open participation cannot be combined with groups.',
      'activity.groupRequired':'Select at least one group or open participation.',
      'activity.repeat.title':'Other times on this day','activity.repeat.help':'Add another time when the same activity will happen again on the same day.','activity.repeat.add':'Add time','activity.repeat.time':'Additional time','activity.repeat.remove':'Remove time','activity.repeat.singleDate':'To use additional times, select only one date.','activity.repeat.duplicateTime':'Use a different time for each occurrence.','activity.repeat.timeRequired':'Enter all additional times.',
      'activity.details.notes':'Notes','activity.details.materials':'Materials'
    },
    es:{
      'activity.groups':'Grupos','activity.groupsHelp':'Selecciona uno o más grupos. La participación libre no puede combinarse con grupos.',
      'activity.groupRequired':'Selecciona al menos un grupo o participación libre.',
      'activity.repeat.title':'Otros horarios este día','activity.repeat.help':'Agrega otro horario cuando la misma actividad vuelva a realizarse el mismo día.','activity.repeat.add':'Agregar horario','activity.repeat.time':'Horario adicional','activity.repeat.remove':'Eliminar horario','activity.repeat.singleDate':'Para usar horarios adicionales, selecciona solo una fecha.','activity.repeat.duplicateTime':'Usa un horario diferente para cada realización.','activity.repeat.timeRequired':'Completa todos los horarios adicionales.',
      'activity.details.notes':'Observaciones','activity.details.materials':'Materiales'
    }
  };
  Object.entries(messages).forEach(([lang,rows])=>{if(window.OleiroI18nMessages?.[lang])Object.assign(window.OleiroI18nMessages[lang],rows)});
})();
