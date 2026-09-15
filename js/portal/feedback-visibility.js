/* Feedback externo: exibe ao voluntário somente quando não estiver marcado como interno. */
(function feedbackVisibilityPortal(){
  if(window.__OLEIRO_PORTAL_FEEDBACK_VISIBILITY__)return;window.__OLEIRO_PORTAL_FEEDBACK_VISIBILITY__=true;
  const baseSessionCard=window.sessionCardVolunteer||sessionCardVolunteer;
  function raw(value){return value?.raw||value||{}}
  function asDate(value){if(!value)return null;if(typeof value?.toDate==='function')return value.toDate();const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?null:d}
  function when(value){const d=asDate(value);if(!d)return '';const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
  function author(value){const rawName=String(value||'').trim(),lower=rawName.toLowerCase();if(lower==='ctcasadooleirorodeio@gmail.com')return 'Luan';if(!rawName||rawName.includes('@')||rawName==='Autor não registrado')return '';return rawName}
  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCard(s,editable),row=raw(s),value=String(row.feedback||'').trim();if(!value||row.feedbackInternal===true)return html;
    const template=document.createElement('template');template.innerHTML=html;const card=template.content.querySelector('.activity-card');if(!card||card.querySelector('.volunteer-feedback'))return template.innerHTML;
    const by=author(row.feedbackAuthorName),date=when(row.feedbackUpdatedAt),meta=[by,date].filter(Boolean).join(' · '),block=document.createElement('div');block.className='volunteer-feedback';block.innerHTML='<strong>Feedback:</strong><p data-no-i18n>'+escapeHtml(value)+'</p>'+(meta?'<span>'+escapeHtml(meta)+'</span>':'');
    const actions=card.querySelector(':scope > .activity-actions');if(actions)card.insertBefore(block,actions);else card.appendChild(block);return template.innerHTML;
  };
  window.sessionCardVolunteer=sessionCardVolunteer;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
