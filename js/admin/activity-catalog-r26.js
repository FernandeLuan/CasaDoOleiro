/* Round 26 — catálogo de atividades no formulário administrativo, sem Firestore. */
(function adminActivityCatalogR26(){
  const catalog=window.OleiroActivityCatalog;if(!catalog||typeof window.openAdminPlanningActivity!=='function')return;
  function ensureOption(select,value,label){if(!select||!value)return;if([...select.options].some(option=>option.value===value))return;const option=document.createElement('option');option.value=value;option.textContent=label||value;select.append(option)}
  function applySuggestion(item){
    if(!item)return;
    const name=document.getElementById('managerActName'),duration=document.getElementById('managerActDuration'),period=document.getElementById('managerActPeriod'),meta=document.getElementById('adminActivityCatalogMeta');
    if(name)name.value=catalog.text(item.name);
    if(duration)duration.value=String(item.defaultDuration);
    if(period){ensureOption(period,item.formPeriod,item.formPeriod);period.value=item.formPeriod}
    if(meta)meta.innerHTML=catalog.metaHtml(item);
  }
  function inject(){
    const form=modalRoot?.querySelector?.('.manager-activity-form');if(!form||form.querySelector('.activity-catalog-field'))return;
    const labels=catalog.labels(),field=document.createElement('div');field.className='field activity-catalog-field';field.innerHTML=`<label for="adminActivityCatalogSelect">${escapeHtml(labels.label)}</label><select id="adminActivityCatalogSelect" class="select"><option value="">${escapeHtml(labels.placeholder)}</option>${catalog.optionHtml()}</select><div id="adminActivityCatalogMeta"></div>`;
    form.prepend(field);field.querySelector('select')?.addEventListener('change',event=>applySuggestion(catalog.get(event.target.value)));
  }
  const baseOpenAdminPlanningActivity=window.openAdminPlanningActivity;
  window.openAdminPlanningActivity=function(...args){const result=baseOpenAdminPlanningActivity(...args);inject();return result};
})();
