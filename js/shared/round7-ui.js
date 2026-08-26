/* Round 7 — rótulos de status simplificados sem alterar os valores internos. */
(function round7SharedUi(){
  const baseStatusMeta=statusMeta;
  statusMeta=function(status){
    const simple={
      pending:['Em preparação','warning'],
      analysis:['Em análise','info'],
      adjustments:['Ajustes','warning'],
      approved:['Aprovado','success'],
      rejected:['Recusado','danger']
    };
    return simple[status]||baseStatusMeta(status);
  };

  if(typeof OLEIRO_TRANSLATIONS!=='undefined'){
    Object.assign(OLEIRO_TRANSLATIONS.en,{
      'Em preparação':'Preparing',
      'Em análise':'Under review',
      'Ajustes':'Adjustments',
      'Aprovado':'Approved',
      'Recusado':'Declined',
      'Carregando atividades...':'Loading activities...',
      'Não foi possível carregar as atividades.':'Could not load the activities.',
      'Tentar novamente':'Try again',
      'Reiniciar planejamento':'Reset planning',
      'Reiniciar planejamento?':'Reset planning?',
      'Todas as atividades e sessões serão apagadas. A conta, o e-mail e as datas da estadia serão mantidos.':'All activities and sessions will be deleted. The account, email and stay dates will be kept.',
      'O voluntário voltará para Em preparação com um novo prazo de 7 dias.':'The volunteer will return to Preparing with a new 7-day deadline.',
      'Planejamento reiniciado.':'Planning reset.'
    });
    Object.assign(OLEIRO_TRANSLATIONS.es,{
      'Em preparação':'En preparación',
      'Em análise':'En análisis',
      'Ajustes':'Ajustes',
      'Aprovado':'Aprobado',
      'Recusado':'Rechazado',
      'Carregando atividades...':'Cargando actividades...',
      'Não foi possível carregar as atividades.':'No fue posible cargar las actividades.',
      'Tentar novamente':'Intentar de nuevo',
      'Reiniciar planejamento':'Reiniciar planificación',
      'Reiniciar planejamento?':'¿Reiniciar planificación?',
      'Todas as atividades e sessões serão apagadas. A conta, o e-mail e as datas da estadia serão mantidos.':'Se eliminarán todas las actividades y sesiones. Se mantendrán la cuenta, el correo y las fechas de la estadía.',
      'O voluntário voltará para Em preparação com um novo prazo de 7 dias.':'El voluntario volverá a En preparación con un nuevo plazo de 7 días.',
      'Planejamento reiniciado.':'Planificación reiniciada.'
    });
  }
})();
