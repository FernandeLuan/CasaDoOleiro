/* Acabamento do perfil: semana única em largura total, Histórico no cabeçalho e emergência editável. */
(function profilePolish(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PROFILE_POLISH__)return;
  window.__OLEIRO_PROFILE_POLISH__=true;

  function installStyles(){
    if(document.getElementById('profilePolishStyles'))return;
    const style=document.createElement('style');
    style.id='profilePolishStyles';
    style.textContent=`
      .planning-detail-page .planning-profile-copy>.eyebrow{display:none!important}
      .planning-person-weeks>.planning-person-week:only-child{grid-column:1/-1!important;width:100%!important;max-width:none!important;margin-inline:0!important}
      .planning-detail-page .planning-profile-head>.planning-profile-tabs{grid-column:1/-1}
      .planning-detail-page .planning-page-content>.planning-profile-tabs,.planning-detail-page .planning-page-content>.person-history-tabs{display:none!important}
      .account-emergency-action-r72{border:0;background:transparent;color:var(--primary);padding:2px 0;min-height:auto;display:inline-flex;align-items:center;gap:5px;font-size:.58rem;font-weight:700;white-space:nowrap}
      .account-emergency-action-r72:hover{text-decoration:underline}.account-emergency-action-r72 i{font-size:.57rem}
      .planning-detail-page .account-person-emergency-inline-r71 .account-person-section-head-r70{align-items:center!important}
    `;
    document.head.appendChild(style);
  }

  function currentPerson(){if(typeof candidateById!=='function')return null;return candidateById(state.managerPlanningPersonId)}

  function moveHistoryTabsToHeader(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='history')return;
    const root=document.querySelector('.planning-detail-page'),head=root?.querySelector('.planning-profile-head'),content=root?.querySelector('.planning-page-content');
    if(!root||!head||!content)return;
    const candidates=[...content.querySelectorAll(':scope > .person-refactor-tabs, :scope > .planning-profile-tabs, :scope > .person-history-tabs')];
    let tabs=head.querySelector(':scope > .planning-profile-tabs');
    if(!tabs&&candidates.length){tabs=candidates.shift();tabs.classList.add('planning-profile-tabs','person-history-tabs');head.appendChild(tabs)}
    candidates.forEach(node=>node.remove());if(!tabs)return;
    [...tabs.querySelectorAll('button')].forEach(button=>{const label=String(button.textContent||'').trim().toLowerCase();button.classList.toggle('active',label==='histórico')});
  }

  function ensureEmergencyActions(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='account')return;
    const p=currentPerson();if(!p||typeof window.openVolunteerEmergencyEditor!=='function')return;
    const rows=[...document.querySelectorAll('.planning-detail-page .account-person-inline-r71')];
    rows.forEach((row,index)=>{
      const emergency=row.querySelector('.account-person-emergency-inline-r71'),head=emergency?.querySelector('.account-person-section-head-r70');if(!emergency||!head)return;
      const existing=head.querySelector('button');if(existing){existing.style.removeProperty('display');return}
      const body=emergency.querySelector('.account-person-emergency-body-r70'),text=String(body?.textContent||'').trim(),empty=!text||/não informado|carregando/i.test(text);
      const button=document.createElement('button');button.type='button';button.className='account-emergency-action-r72';button.innerHTML=`<i class="fa-solid ${empty?'fa-plus':'fa-pen'}"></i>${empty?'Adicionar':'Editar'}`;
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.openVolunteerEmergencyEditor(encodeURIComponent(String(p.id)),index)});head.appendChild(button);
    });
  }

  function polish(){moveHistoryTabsToHeader();ensureEmergencyActions()}
  let attempts=0;function settle(){polish();attempts+=1;if(attempts<12)setTimeout(settle,90)}
  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){renderManager=function(){const result=baseRenderManager();queueMicrotask(polish);requestAnimationFrame(polish);setTimeout(polish,60);return result};window.renderManager=renderManager;render=function(){return renderManager()};window.render=render}
  installStyles();requestAnimationFrame(settle);
})();
