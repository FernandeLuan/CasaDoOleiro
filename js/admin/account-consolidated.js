/* Conta consolidada: cada participante reúne contato, emergência e status de acesso. */
(function accountConsolidated(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ACCOUNT_CONSOLIDATED__)return;
  window.__OLEIRO_ACCOUNT_CONSOLIDATED__=true;

  const baseOpenVolunteerUnitEditor=window.openVolunteerUnitEditor;

  function installStyles(){
    if(document.getElementById('accountConsolidatedStyles'))return;
    const style=document.createElement('style');style.id='accountConsolidatedStyles';style.textContent=`
      .planning-detail-page .admin-account-refactor.account-consolidated-r70{display:grid!important;grid-template-columns:1fr!important;gap:16px!important}
      .planning-detail-page .account-overview-r70{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(340px,.88fr);gap:18px;align-items:start}
      .planning-detail-page .account-side-r70{display:grid;gap:14px;align-content:start}
      .planning-detail-page .account-contact-card-r70{display:grid;gap:0!important;padding:0!important;overflow:hidden}
      .planning-detail-page .account-contact-card-r70>.account-person-row{display:block!important;width:100%!important;padding:14px!important;margin:0!important;border:0!important;text-align:left!important}
      .planning-detail-page .account-contact-card-r70>.account-person-row+.account-person-row{border-top:1px solid var(--border)!important}
      .planning-detail-page .account-contact-card-r70>.account-person-row>.avatar,
      .planning-detail-page .account-emergency-card .avatar,
      .planning-detail-page .emergency-person-row>.avatar{display:none!important}
      .planning-detail-page .account-contact-card-r70>.account-person-row>div:last-child{display:grid!important;width:100%!important;min-width:0;gap:3px;margin:0!important;padding:0!important;justify-items:start!important;text-align:left!important}
      .planning-detail-page .account-person-sections-r70{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.72fr);gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);width:100%;text-align:left}
      .planning-detail-page .account-person-section-r70{min-width:0;display:grid;gap:4px;align-content:start;justify-items:start;text-align:left}
      .planning-detail-page .account-person-section-head-r70{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:26px;width:100%;text-align:left}
      .planning-detail-page .account-person-section-head-r70>span{font-size:.57rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--primary)}
      .planning-detail-page .account-person-section-head-r70 .account-inline-edit{flex:0 0 auto;margin:0}
      .planning-detail-page .account-person-emergency-r70 strong{font-size:.68rem!important;line-height:1.35}
      .planning-detail-page .account-person-emergency-r70 span{font-size:.6rem!important;line-height:1.4;color:var(--muted)}
      .planning-detail-page .account-person-access-r70{padding:9px 10px;border-radius:11px;background:var(--surface-2);align-self:start}
      .planning-detail-page .account-access-status-r70{display:flex;align-items:center;gap:7px;font-size:.62rem;color:var(--muted);line-height:1.35}.planning-detail-page .account-access-status-r70 i{color:var(--primary);font-size:.7rem}
      .planning-detail-page .account-side-r70>.card{margin:0!important;width:100%;height:auto!important}.planning-detail-page .account-registration-card{margin:0!important}.planning-detail-page .account-status-line{margin:0!important}.planning-detail-page .account-empty-value-r70{font-size:.61rem;color:var(--muted)}
      .planning-detail-page .account-overview-r70+.notice,.planning-detail-page .account-overview-r70+.selection-flow-card{margin-top:0!important}

      .account-unit-source{display:none!important}
      .account-unit-segment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;width:100%;padding:4px;border:1px solid var(--border);border-radius:13px;background:var(--surface-2)}
      .account-unit-segment button{min-width:0;min-height:38px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;white-space:nowrap}
      .account-unit-segment button.active{background:var(--primary);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06)}

      @media(max-width:1050px){.planning-detail-page .account-overview-r70{grid-template-columns:1fr}.planning-detail-page .account-side-r70{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){
        .planning-detail-page .account-person-sections-r70{grid-template-columns:1fr}
        .planning-detail-page .account-side-r70{grid-template-columns:1fr}
        .planning-detail-page .account-contact-card-r70>.account-person-row{padding:14px!important}
        .account-unit-segment button{min-height:42px;font-size:.72rem}
      }
    `;document.head.appendChild(style);
  }

  function emergencyContent(row){if(!row)return {html:'<span class="account-empty-value-r70">Não informado</span>',button:null};const detail=row.querySelector(':scope > div'),button=row.querySelector('.account-inline-edit')||row.querySelector('button');if(!detail)return {html:'<span class="account-empty-value-r70">Não informado</span>',button};const nodes=[...detail.children].filter(node=>node.tagName!=='SMALL'),hasMeaningful=nodes.some(node=>String(node.textContent||'').trim());return {html:hasMeaningful?nodes.map(node=>node.outerHTML).join(''):'<span class="account-empty-value-r70">Não informado</span>',button}}
  function accessStatus(row){if(!row)return {text:'Carregando status de acesso...',done:false};const small=row.querySelector('small'),text=String(small?.textContent||'').trim()||'Status de acesso indisponível',done=/realizado|já realizou|acessou/i.test(text)&&!/ainda não/i.test(text);return {text,done}}

  function consolidateAccount(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||String(state.managerPlanningTab||'')!=='account')return;
    const root=document.querySelector('.planning-detail-page'),account=root?.querySelector('.admin-account-refactor');if(!account||account.classList.contains('account-consolidated-r70'))return;
    const contactCard=account.querySelector('.account-contact-card'),emergencyCard=account.querySelector('.account-emergency-card'),accessCard=account.querySelector('.account-access-card'),stayCard=account.querySelector('.account-stay-card'),registrationCard=account.querySelector('.account-registration-card');if(!contactCard)return;
    const contactRows=[...contactCard.querySelectorAll(':scope > .account-person-row')],emergencyRows=emergencyCard?[...emergencyCard.querySelectorAll('.emergency-person-row')]:[],accessRows=accessCard?[...accessCard.querySelectorAll('.account-access-row')]:[];
    contactCard.classList.add('account-contact-card-r70');
    contactRows.forEach((row,index)=>{if(row.querySelector('.account-person-sections-r70'))return;const detail=row.querySelector(':scope > div:last-child');if(!detail)return;const emergency=emergencyContent(emergencyRows[index]),access=accessStatus(accessRows[index]),sections=document.createElement('div');sections.className='account-person-sections-r70';sections.innerHTML=`<section class="account-person-section-r70 account-person-emergency-r70"><div class="account-person-section-head-r70"><span>Contato de emergência</span></div><div class="account-person-emergency-body-r70">${emergency.html}</div></section><section class="account-person-section-r70 account-person-access-r70"><div class="account-person-section-head-r70"><span>Acesso ao portal</span></div><div class="account-access-status-r70"><i class="fa-solid ${access.done?'fa-circle-check':'fa-clock'}"></i><span>${escapeHtml(access.text)}</span></div></section>`;if(emergency.button)sections.querySelector('.account-person-emergency-r70 .account-person-section-head-r70')?.appendChild(emergency.button);detail.appendChild(sections)});
    emergencyCard?.remove();accessCard?.remove();
    const statusLine=account.querySelector(':scope > .account-status-line'),overview=document.createElement('div');overview.className='account-overview-r70';const side=document.createElement('div');side.className='account-side-r70';const insertBefore=statusLine?.nextSibling||account.firstChild;account.insertBefore(overview,insertBefore);overview.appendChild(contactCard);overview.appendChild(side);if(stayCard)side.appendChild(stayCard);if(registrationCard)side.appendChild(registrationCard);account.classList.add('account-consolidated-r70');
  }

  function currentPerson(){
    const id=String(state?.managerPlanningPersonId||'');
    return id&&typeof candidateById==='function'?candidateById(id):null;
  }
  function unitChoices(select){
    const person=currentPerson(),currentId=String(person?.unitId||''),currentName=String(person?.unit||person?.unitName||'').trim().toLocaleLowerCase('pt-BR');
    let rows=(state?.units||[]).filter(unit=>unit&&unit.id&&unit.active!==false).map(unit=>({value:String(unit.id),label:String(unit.name||unit.id)}));
    if(rows.length<2)rows=[...select.options].filter(option=>option.value).map(option=>({value:String(option.value),label:String(option.textContent||option.value).trim()}));
    const unique=new Map();rows.forEach(row=>unique.set(row.value,row));rows=[...unique.values()];
    if(rows.length<2)return {rows:[],selected:''};
    let selected=rows.find(row=>row.value===currentId)?.value||rows.find(row=>row.label.trim().toLocaleLowerCase('pt-BR')===currentName)?.value||String(select.value||'');
    if(!rows.some(row=>row.value===selected))selected=rows[0].value;
    return {rows,selected};
  }
  function enhanceUnitEditor(){
    const modal=typeof modalRoot!=='undefined'?modalRoot?.querySelector?.('.modal'):document.querySelector('#modalRoot .modal');if(!modal)return;
    const select=[...modal.querySelectorAll('select')].find(node=>{const labels=[...node.options].map(option=>String(option.textContent||'').toLocaleLowerCase('pt-BR')).join(' ');return /rodeio|indaial|unidade/.test(labels)||/unit/i.test(node.id||node.name||'')});
    if(!select||select.dataset.accountUnitSegmented==='1')return;
    const {rows,selected}=unitChoices(select);if(rows.length<2)return;
    select.dataset.accountUnitSegmented='1';select.classList.add('account-unit-source');
    select.innerHTML=rows.map(row=>`<option value="${escapeHtml(row.value)}">${escapeHtml(row.label)}</option>`).join('');select.value=selected;
    const segment=document.createElement('div');segment.className='account-unit-segment';segment.setAttribute('role','group');segment.setAttribute('aria-label','Unidade do voluntário');
    const sync=value=>{select.value=value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));segment.querySelectorAll('button').forEach(button=>{const active=button.dataset.value===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))})};
    rows.slice(0,2).forEach(row=>{const button=document.createElement('button');button.type='button';button.dataset.value=row.value;button.textContent=row.label;button.classList.toggle('active',row.value===selected);button.setAttribute('aria-pressed',String(row.value===selected));button.addEventListener('click',()=>sync(row.value));segment.appendChild(button)});
    select.insertAdjacentElement('afterend',segment);
  }

  if(typeof baseOpenVolunteerUnitEditor==='function'){
    const wrapped=function(...args){const result=baseOpenVolunteerUnitEditor.apply(this,args);requestAnimationFrame(()=>requestAnimationFrame(enhanceUnitEditor));return result};
    window.openVolunteerUnitEditor=wrapped;
    try{openVolunteerUnitEditor=wrapped}catch{}
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:(typeof renderManager==='function'?renderManager:null);
  if(baseRenderManager){renderManager=function(){const result=baseRenderManager();queueMicrotask(consolidateAccount);return result};window.renderManager=renderManager;render=function(){return renderManager()};window.render=render}
  installStyles();requestAnimationFrame(consolidateAccount);
})();
