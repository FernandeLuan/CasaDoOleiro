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
      .planning-detail-page{--ui-text-xs:var(--ui-text-sm)}
      .planning-detail-page .planning-profile-copy>.eyebrow{display:none!important}
      .planning-detail-page .planning-profile-head>.planning-profile-tabs{margin-top:3px!important;padding-top:2px!important}
      .planning-person-weeks>.planning-person-week:only-child{grid-column:1/-1!important;width:100%!important;max-width:none!important;margin-inline:0!important}
      .planning-detail-page .planning-profile-head>.planning-profile-tabs{grid-column:1/-1}
      .planning-detail-page .planning-page-content>.planning-profile-tabs,.planning-detail-page .planning-page-content>.person-history-tabs{display:none!important}
      .planning-person-day-title .planning-person-day-summary{display:inline-flex!important;align-items:center!important;gap:7px!important;margin:0!important;font-size:var(--ui-text-sm)!important;line-height:1.35!important;color:var(--muted)!important}

      /* Planejamento individual: aproxima data/resumo do conteúdo e elimina alturas herdadas. */
      .planning-detail-page .planning-person-day-head{
        min-height:52px!important;
        padding:9px 13px!important;
        align-items:center!important;
      }
      .planning-detail-page .planning-person-day-copy{display:block!important;min-width:0!important}
      .planning-detail-page .planning-person-day-title{min-height:29px;align-items:center!important;gap:8px!important}
      .planning-detail-page .planning-person-add{align-self:center!important}
      .planning-detail-page .planning-person-agenda .planning-day-sessions{padding-top:8px!important}
      .planning-detail-page .planning-person-day.is-empty .planning-person-day-head{
        border-bottom:1px solid var(--border)!important;
        border-radius:16px 16px 0 0!important;
      }
      .planning-detail-page .planning-person-day.is-empty .planning-person-day-body{
        display:block!important;
        min-height:0!important;
        height:auto!important;
        padding:6px 12px 8px!important;
      }
      .planning-detail-page .planning-person-empty{
        min-height:38px!important;
        height:auto!important;
        margin:0!important;
        padding:7px 8px!important;
        justify-content:center!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .planning-detail-page .planning-person-empty i{display:none!important}
      @media(max-width:640px){
        .planning-detail-page .planning-person-day-head{min-height:48px!important;padding:8px 12px!important}
        .planning-detail-page .planning-person-day.is-empty .planning-person-day-body{padding:5px 10px 7px!important}
        .planning-detail-page .planning-person-empty{min-height:34px!important;padding:5px 8px!important}
        .planning-detail-page .planning-person-agenda .planning-day-sessions{padding:7px 9px 9px!important}
      }

      /* Detalhe do voluntário: nenhum texto funcional abaixo de .68rem. */
      .planning-detail-page .person-refactor-tabs button,
      .planning-detail-page .planning-profile-tabs button,
      .planning-detail-page .badge,
      .planning-detail-page .eyebrow,
      .planning-detail-page small,
      .planning-detail-page time,
      .planning-detail-page .compact-hint,
      .planning-detail-page .person-plan-summary,
      .planning-detail-page .admin-plan-page-nav strong,
      .planning-detail-page .admin-plan-page-nav span,
      .planning-detail-page .admin-plan-review-footer .btn,
      .planning-detail-page .account-person-row span,
      .planning-detail-page .account-access-row span,
      .planning-detail-page .account-access-row small,
      .planning-detail-page .account-danger-zone small,
      .planning-detail-page .candidate-plan-compact-head strong,
      .planning-detail-page .candidate-plan-compact-head span,
      .planning-detail-page .account-person-section-head-r70>span,
      .planning-detail-page .account-person-emergency-r70 span,
      .planning-detail-page .account-person-emergency-inline-r71 .account-person-section-head-r70>span,
      .planning-detail-page .account-person-emergency-inline-r71 strong,
      .planning-detail-page .account-person-emergency-inline-r71 span,
      .planning-detail-page .account-access-status-r70,
      .planning-detail-page .account-access-plain-r71,
      .planning-detail-page .account-empty-value-r70,
      .planning-detail-page .planning-history-r69-head time,
      .planning-detail-page .planning-history-r69-body p,
      .planning-detail-page .planning-history-r69-body span,
      .planning-detail-page .planning-history-r71-head time,
      .planning-detail-page .planning-history-r71-body p,
      .planning-detail-page .planning-history-r71-body span,
      .planning-detail-page .planning-person-day-signals .badge,
      .planning-detail-page .planning-activity-tools .admin-portal-status .badge,
      .planning-detail-page .account-emergency-action-r72{
        font-size:var(--ui-text-sm)!important;
      }

      .account-emergency-action-r72{border:0;background:transparent;color:var(--primary);padding:2px 0;min-height:auto;display:inline-flex;align-items:center;gap:5px;font-size:var(--ui-text-sm);font-weight:700;white-space:nowrap}
      .account-emergency-action-r72:hover{text-decoration:underline}.account-emergency-action-r72 i{font-size:var(--ui-text-sm)}
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

  function simplifyPlanningDayHeaders(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||String(state.managerPlanningTab||'plan')!=='plan')return;
    const root=document.querySelector('.planning-detail-page');if(!root)return;
    root.querySelectorAll('.planning-person-day[data-plan-date]').forEach(day=>{
      const raw=String(day.dataset.planDate||''),parts=raw.split('-'),date=parts.length===3?`${parts[2]}/${parts[1]}`:raw;
      const title=day.querySelector('.planning-person-day-title'),strong=title?.querySelector(':scope > strong');if(!title||!strong)return;
      strong.textContent=date||strong.textContent;
      const weekday=title.querySelector(':scope > span');if(weekday)weekday.remove();
      const summary=day.querySelector('.planning-person-day-copy > .planning-person-day-summary');
      if(summary&&!title.contains(summary)){
        if(day.classList.contains('is-empty'))summary.textContent='0 atividades · 0min';
        title.appendChild(summary);
      }
    });
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

  function polish(){moveHistoryTabsToHeader();simplifyPlanningDayHeaders();ensureEmergencyActions()}
  let attempts=0;function settle(){polish();attempts+=1;if(attempts<12)setTimeout(settle,90)}
  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){renderManager=function(){const result=baseRenderManager();queueMicrotask(polish);requestAnimationFrame(polish);setTimeout(polish,60);return result};window.renderManager=renderManager;render=function(){return renderManager()};window.render=render}
  installStyles();requestAnimationFrame(settle);
})();
