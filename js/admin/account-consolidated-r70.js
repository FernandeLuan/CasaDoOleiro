/* R70 — Conta consolidada: cada participante reúne contato, emergência e status de acesso. */
(function accountConsolidatedR70(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ACCOUNT_CONSOLIDATED_R70__)return;
  window.__OLEIRO_ACCOUNT_CONSOLIDATED_R70__=true;

  function installStyles(){
    if(document.getElementById('accountConsolidatedR70Styles'))return;
    const style=document.createElement('style');
    style.id='accountConsolidatedR70Styles';
    style.textContent=`
      .planning-detail-page .admin-account-refactor.account-consolidated-r70{display:grid!important;grid-template-columns:1fr!important;gap:16px!important}
      .planning-detail-page .account-overview-r70{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(340px,.88fr);gap:18px;align-items:start}
      .planning-detail-page .account-side-r70{display:grid;gap:14px;align-content:start}
      .planning-detail-page .account-contact-card-r70{display:grid;gap:0!important;padding:0!important;overflow:hidden}
      .planning-detail-page .account-contact-card-r70>.account-person-row{padding:18px!important;margin:0!important;border:0!important;gap:14px!important}
      .planning-detail-page .account-contact-card-r70>.account-person-row+.account-person-row{border-top:1px solid var(--border)!important}
      .planning-detail-page .account-contact-card-r70>.account-person-row>.avatar{width:44px;height:44px;flex-basis:44px}
      .planning-detail-page .account-contact-card-r70>.account-person-row>div:last-child{width:100%;gap:3px}
      .planning-detail-page .account-person-sections-r70{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.72fr);gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
      .planning-detail-page .account-person-section-r70{min-width:0;display:grid;gap:4px;align-content:start}
      .planning-detail-page .account-person-section-head-r70{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:26px}
      .planning-detail-page .account-person-section-head-r70>span{font-size:.57rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--primary)}
      .planning-detail-page .account-person-section-head-r70 .account-inline-edit{flex:0 0 auto;margin:0}
      .planning-detail-page .account-person-emergency-r70 strong{font-size:.68rem!important;line-height:1.35}
      .planning-detail-page .account-person-emergency-r70 span{font-size:.6rem!important;line-height:1.4;color:var(--muted)}
      .planning-detail-page .account-person-access-r70{padding:9px 10px;border-radius:11px;background:var(--surface-2);align-self:start}
      .planning-detail-page .account-access-status-r70{display:flex;align-items:center;gap:7px;font-size:.62rem;color:var(--muted);line-height:1.35}
      .planning-detail-page .account-access-status-r70 i{color:var(--primary);font-size:.7rem}
      .planning-detail-page .account-side-r70>.card{margin:0!important;width:100%;height:auto!important}
      .planning-detail-page .account-registration-card{margin:0!important}
      .planning-detail-page .account-status-line{margin:0!important}
      .planning-detail-page .account-empty-value-r70{font-size:.61rem;color:var(--muted)}
      .planning-detail-page .account-overview-r70+.notice,
      .planning-detail-page .account-overview-r70+.selection-flow-card{margin-top:0!important}
      @media(max-width:1050px){
        .planning-detail-page .account-overview-r70{grid-template-columns:1fr}
        .planning-detail-page .account-side-r70{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:720px){
        .planning-detail-page .account-person-sections-r70{grid-template-columns:1fr}
        .planning-detail-page .account-side-r70{grid-template-columns:1fr}
        .planning-detail-page .account-contact-card-r70>.account-person-row{padding:15px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function emergencyContent(row){
    if(!row)return {html:'<span class="account-empty-value-r70">Não informado</span>',button:null};
    const detail=row.querySelector(':scope > div');
    const button=row.querySelector('.account-inline-edit')||row.querySelector('button');
    if(!detail)return {html:'<span class="account-empty-value-r70">Não informado</span>',button};
    const nodes=[...detail.children].filter(node=>node.tagName!=='SMALL');
    const hasMeaningful=nodes.some(node=>String(node.textContent||'').trim());
    return {html:hasMeaningful?nodes.map(node=>node.outerHTML).join(''):'<span class="account-empty-value-r70">Não informado</span>',button};
  }

  function accessStatus(row){
    if(!row)return {text:'Carregando status de acesso...',done:false};
    const small=row.querySelector('small');
    const text=String(small?.textContent||'').trim()||'Status de acesso indisponível';
    const done=/realizado|já realizou|acessou/i.test(text)&&!/ainda não/i.test(text);
    return {text,done};
  }

  function consolidateAccount(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||String(state.managerPlanningTab||'')!=='account')return;
    const root=document.querySelector('.planning-detail-page');
    const account=root?.querySelector('.admin-account-refactor');
    if(!account||account.classList.contains('account-consolidated-r70'))return;

    const contactCard=account.querySelector('.account-contact-card');
    const emergencyCard=account.querySelector('.account-emergency-card');
    const accessCard=account.querySelector('.account-access-card');
    const stayCard=account.querySelector('.account-stay-card');
    const registrationCard=account.querySelector('.account-registration-card');
    if(!contactCard)return;

    const contactRows=[...contactCard.querySelectorAll(':scope > .account-person-row')];
    const emergencyRows=emergencyCard?[...emergencyCard.querySelectorAll('.emergency-person-row')]:[];
    const accessRows=accessCard?[...accessCard.querySelectorAll('.account-access-row')]:[];

    contactCard.classList.add('account-contact-card-r70');
    contactRows.forEach((row,index)=>{
      if(row.querySelector('.account-person-sections-r70'))return;
      const detail=row.querySelector(':scope > div:last-child');
      if(!detail)return;
      const emergency=emergencyContent(emergencyRows[index]);
      const access=accessStatus(accessRows[index]);
      const sections=document.createElement('div');
      sections.className='account-person-sections-r70';
      sections.innerHTML=`<section class="account-person-section-r70 account-person-emergency-r70"><div class="account-person-section-head-r70"><span>Contato de emergência</span></div><div class="account-person-emergency-body-r70">${emergency.html}</div></section><section class="account-person-section-r70 account-person-access-r70"><div class="account-person-section-head-r70"><span>Acesso ao portal</span></div><div class="account-access-status-r70"><i class="fa-solid ${access.done?'fa-circle-check':'fa-clock'}"></i><span>${escapeHtml(access.text)}</span></div></section>`;
      if(emergency.button){
        const head=sections.querySelector('.account-person-emergency-r70 .account-person-section-head-r70');
        head?.appendChild(emergency.button);
      }
      detail.appendChild(sections);
    });

    emergencyCard?.remove();
    accessCard?.remove();

    const statusLine=account.querySelector(':scope > .account-status-line');
    const overview=document.createElement('div');overview.className='account-overview-r70';
    const side=document.createElement('div');side.className='account-side-r70';
    const insertBefore=statusLine?.nextSibling||account.firstChild;
    account.insertBefore(overview,insertBefore);
    overview.appendChild(contactCard);
    overview.appendChild(side);
    if(stayCard)side.appendChild(stayCard);
    if(registrationCard)side.appendChild(registrationCard);

    account.classList.add('account-consolidated-r70');
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:(typeof renderManager==='function'?renderManager:null);
  if(baseRenderManager){
    renderManager=function(){const result=baseRenderManager();queueMicrotask(consolidateAccount);return result};
    window.renderManager=renderManager;
    render=function(){return renderManager()};window.render=render;
  }

  installStyles();
  requestAnimationFrame(consolidateAccount);
})();

/* R71 é carregada somente depois da consolidação da Conta, preservando a ordem das camadas. */
(function loadAccountHistoryScrollR71(){
  if(document.querySelector('script[data-r71-account-history-scroll]'))return;
  const current=document.currentScript?.src;if(!current)return;
  const script=document.createElement('script');
  script.dataset.r71AccountHistoryScroll='true';
  script.src=new URL('./account-history-scroll-r71.js?v=20260903-r71',current).href;
  document.body.appendChild(script);
})();
