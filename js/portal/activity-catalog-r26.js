/* Round 26 — catálogo de atividades no formulário do voluntário, sem Firestore. */
(function portalActivityCatalogR26(){
  const catalog=window.OleiroActivityCatalog;if(!catalog||typeof openActivityModal!=='function')return;
  function ensureOption(select,value,label){if(!select||!value)return;if([...select.options].some(option=>option.value===value))return;const option=document.createElement('option');option.value=value;option.textContent=label||value;select.append(option)}
  function applySuggestion(item){
    if(!item)return;
    const name=document.getElementById('actName'),duration=document.getElementById('actDuration'),participation=document.getElementById('actParticipation'),period=document.getElementById('actPeriod'),meta=document.getElementById('activityCatalogMeta');
    if(name)name.value=catalog.text(item.name);
    if(duration){ensureOption(duration,String(item.defaultDuration),`${item.defaultDuration} min`);duration.value=String(item.defaultDuration)}
    if(participation){ensureOption(participation,item.participation,item.participation);participation.value=item.participation}
    if(period){ensureOption(period,item.formPeriod,item.formPeriod);period.value=item.formPeriod}
    if(meta)meta.innerHTML=catalog.metaHtml(item);
  }
  function inject(){
    const form=modalRoot?.querySelector?.('.activity-modal-form');if(!form||form.querySelector('.activity-catalog-field'))return;
    const labels=catalog.labels(),field=document.createElement('div');field.className='field activity-catalog-field';field.innerHTML=`<label for="activityCatalogSelect">${escapeHtml(labels.label)}</label><select id="activityCatalogSelect" class="select"><option value="">${escapeHtml(labels.placeholder)}</option>${catalog.optionHtml()}</select><div id="activityCatalogMeta"></div>`;
    const warning=form.querySelector('.notice.warning');if(warning)warning.insertAdjacentElement('afterend',field);else form.prepend(field);
    field.querySelector('select')?.addEventListener('change',event=>applySuggestion(catalog.get(event.target.value)));
  }
  const baseOpenActivityModal=openActivityModal;
  openActivityModal=function(date=null,id=null){const result=baseOpenActivityModal(date,id);if(!id)inject();return result};
  window.openActivityModal=openActivityModal;
})();
