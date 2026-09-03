/* R72 — acabamento do perfil: semana única em largura total, Histórico no cabeçalho e emergência editável. */
(function profilePolishR72(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PROFILE_POLISH_R72__)return;
  window.__OLEIRO_PROFILE_POLISH_R72__=true;

  function installStyles(){
    if(document.getElementById('profilePolishR72Styles'))return;
    const style=document.createElement('style');
    style.id='profilePolishR72Styles';
    style.textContent=`
      /* Se houver somente uma semana, ela ocupa toda a largura disponível. */
      .planning-person-weeks>.planning-person-week:only-child{
        grid-column:1/-1!important;
        width:100%!important;
        max-width:none!important;
        margin-inline:0!important;
      }

      /* O Histórico usa as mesmas abas do cabeçalho de Planejamento/Conta. */
      .planning-detail-page .planning-profile-head>.planning-profile-tabs{
        grid-column:1/-1;
      }
      .planning-detail-page .planning-page-content>.planning-profile-tabs,
      .planning-detail-page .planning-page-content>.person-history-tabs{
        display:none!important;
      }

      /* Ação de contato de emergência permanece visível mesmo quando ainda não há contato. */
      .account-emergency-action-r72{
        border:0;
        background:transparent;
        color:var(--primary);
        padding:2px 0;
        min-height:auto;
        display:inline-flex;
        align-items:center;
        gap:5px;
        font-size:.58rem;
        font-weight:700;
        white-space:nowrap;
      }
      .account-emergency-action-r72:hover{text-decoration:underline}
      .account-emergency-action-r72 i{font-size:.57rem}
      .planning-detail-page .account-person-emergency-inline-r71 .account-person-section-head-r70{
        align-items:center!important;
      }
    `;
    document.head.appendChild(style);
  }

  function currentPerson(){
    if(typeof candidateById!=='function')return null;
    return candidateById(state.managerPlanningPersonId);
  }

  function moveHistoryTabsToHeader(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='history')return;
    const root=document.querySelector('.planning-detail-page');
    const head=root?.querySelector('.planning-profile-head');
    const content=root?.querySelector('.planning-page-content');
    if(!root||!head||!content)return;

    const candidates=[...content.querySelectorAll(':scope > .person-refactor-tabs, :scope > .planning-profile-tabs, :scope > .person-history-tabs')];
    let tabs=head.querySelector(':scope > .planning-profile-tabs');
    if(!tabs&&candidates.length){
      tabs=candidates.shift();
      tabs.classList.add('planning-profile-tabs','person-history-tabs');
      head.appendChild(tabs);
    }
    candidates.forEach(node=>node.remove());
    if(!tabs)return;

    [...tabs.querySelectorAll('button')].forEach(button=>{
      const label=String(button.textContent||'').trim().toLowerCase();
      button.classList.toggle('active',label==='histórico');
    });
  }

  function ensureEmergencyActions(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='account')return;
    const p=currentPerson();
    if(!p||typeof window.openVolunteerEmergencyEditor!=='function')return;

    const rows=[...document.querySelectorAll('.planning-detail-page .account-person-inline-r71')];
    rows.forEach((row,index)=>{
      const emergency=row.querySelector('.account-person-emergency-inline-r71');
      const head=emergency?.querySelector('.account-person-section-head-r70');
      if(!emergency||!head)return;

      const existing=head.querySelector('button');
      if(existing){
        existing.style.removeProperty('display');
        return;
      }

      const body=emergency.querySelector('.account-person-emergency-body-r70');
      const text=String(body?.textContent||'').trim();
      const empty=!text||/não informado|carregando/i.test(text);
      const button=document.createElement('button');
      button.type='button';
      button.className='account-emergency-action-r72';
      button.innerHTML=`<i class="fa-solid ${empty?'fa-plus':'fa-pen'}"></i>${empty?'Adicionar':'Editar'}`;
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        window.openVolunteerEmergencyEditor(encodeURIComponent(String(p.id)),index);
      });
      head.appendChild(button);
    });
  }

  function polish(){
    moveHistoryTabsToHeader();
    ensureEmergencyActions();
  }

  let attempts=0;
  function settle(){
    polish();attempts+=1;
    if(attempts<12)setTimeout(settle,90);
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){
    renderManager=function(){
      const result=baseRenderManager();
      queueMicrotask(polish);
      requestAnimationFrame(polish);
      setTimeout(polish,60);
      return result;
    };
    window.renderManager=renderManager;
    render=function(){return renderManager()};window.render=render;
  }

  installStyles();
  requestAnimationFrame(settle);
})();

/* R73/R74: primeiro sincroniza emergência; depois centraliza consistência das demais mutações da Conta. */
(function loadAccountConsistencyChain(){
  if(document.querySelector('script[data-r73-emergency-contact-sync]'))return;
  const current=document.currentScript?.src;if(!current)return;
  const emergency=document.createElement('script');
  emergency.dataset.r73EmergencyContactSync='true';
  emergency.src=new URL('./emergency-contact-sync-r73.js?v=20260903-r73',current).href;
  emergency.onload=()=>{
    if(document.querySelector('script[data-r74-account-consistency]'))return;
    const consistency=document.createElement('script');
    consistency.dataset.r74AccountConsistency='true';
    consistency.src=new URL('./account-consistency-r74.js?v=20260903-r74',current).href;
    document.body.appendChild(consistency);
  };
  document.body.appendChild(emergency);
})();
