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
      .planning-detail-page{--ui-text-sm:.68rem;--ui-text-xs:.68rem}

      /* Busca do Voluntariado e Planejamento: exatamente a mesma caixa tipográfica. */
      .candidate-search .input,.planning-board-search .input{
        font-family:var(--font-body)!important;
        font-size:14px!important;
        line-height:1.25!important;
        font-weight:400!important;
        letter-spacing:normal!important;
      }
      .candidate-search .input::placeholder,.planning-board-search .input::placeholder{
        font-family:var(--font-body)!important;
        font-size:14px!important;
        line-height:1.25!important;
        font-weight:400!important;
        letter-spacing:normal!important;
        color:var(--muted)!important;
        opacity:.78!important;
      }

      .planning-detail-page .planning-profile-copy>.eyebrow{display:none!important}
      .planning-detail-page .planning-profile-head>.planning-profile-tabs{margin-top:3px!important;padding-top:2px!important}
      .planning-person-weeks>.planning-person-week:only-child{grid-column:1/-1!important;width:100%!important;max-width:none!important;margin-inline:0!important}
      .planning-detail-page .planning-profile-head>.planning-profile-tabs{grid-column:1/-1}
      .planning-detail-page .planning-page-content>.planning-profile-tabs,.planning-detail-page .planning-page-content>.person-history-tabs{display:none!important}
      .planning-person-day-title .planning-person-day-summary{display:inline-flex!important;align-items:center!important;gap:7px!important;margin:0!important;font-size:.68rem!important;line-height:1.35!important;color:var(--muted)!important}
      .planning-person-day-title .planning-person-day-summary::before{content:'·';display:inline-block;color:var(--muted);font-weight:700}

      /* Planejamento individual: data/resumo próximos do conteúdo, sem alturas artificiais. */
      .planning-detail-page .planning-person-day-head{
        min-height:48px!important;
        padding:8px 13px!important;
        align-items:center!important;
      }
      .planning-detail-page .planning-person-day-copy{display:block!important;min-width:0!important}
      .planning-detail-page .planning-person-day-title{min-height:28px;align-items:center!important;gap:8px!important}
      .planning-detail-page .planning-person-add{align-self:center!important}
      .planning-detail-page .planning-person-agenda .planning-day-sessions{padding-top:6px!important}
      .planning-detail-page .planning-person-day.is-empty .planning-person-day-head{
        border-bottom:0!important;
        border-radius:16px!important;
      }
      .planning-detail-page .planning-person-day.is-empty .planning-person-day-body{display:none!important}
      .planning-detail-page .planning-person-empty{display:none!important}
      .planning-detail-page.planning-person-agenda-page .admin-plan-review-footer{
        position:static!important;
        bottom:auto!important;
        z-index:auto!important;
        margin:9px 0 0!important;
      }

      /* O texto real de descrição/detalhe está nos spans internos dos cards antigos. */
      .planning-detail-page .planning-person-agenda .admin-portal-description,
      .planning-detail-page .planning-person-agenda .admin-portal-description span,
      .planning-detail-page .planning-person-agenda .admin-portal-detail,
      .planning-detail-page .planning-person-agenda .admin-portal-detail span{
        font-size:.68rem!important;
        line-height:1.45!important;
      }

      @media(max-width:1023px){
        html,body,#app,.admin-shell-r62,.admin-content-r62{overscroll-behavior:none!important}
        html,body,#app{max-width:100%!important;overflow-x:hidden!important}
        .admin-content-r62>.page{padding-bottom:calc(68px + env(safe-area-inset-bottom))!important}
      }
      @media(max-width:640px){
        .planning-detail-page .planning-person-day-head{min-height:44px!important;padding:7px 12px!important}
        .planning-detail-page .planning-person-agenda .planning-day-sessions{padding:6px 9px 9px!important}
        .planning-detail-page .planning-person-add{position:relative!important;right:8px!important}
        .planning-detail-page .planning-profile-head{
          grid-template-columns:minmax(0,1fr) 36px!important;
          column-gap:6px!important;
        }
        .planning-detail-page .planning-close-button{
          width:36px!important;
          height:36px!important;
          flex:0 0 36px!important;
          border-radius:11px!important;
          font-size:.86rem!important;
        }
        .planning-detail-page .planning-profile-period-status{
          display:inline-flex!important;
          align-items:center!important;
          flex-wrap:nowrap!important;
          gap:6px!important;
          white-space:nowrap!important;
          min-width:0!important;
        }
        .planning-detail-page .planning-profile-period-status>.badge{
          flex:0 0 auto!important;
          white-space:nowrap!important;
          padding:4px 7px!important;
        }
      }

      /* Desktop: o avatar foi removido; não reservar a antiga coluna de 44px. */
      @media(min-width:901px){
        .planning-detail-page .account-contact-card-r70>.account-person-row.account-person-inline-r71{
          grid-template-columns:minmax(0,1fr) minmax(210px,.72fr)!important;
          gap:14px 18px!important;
          padding:14px!important;
          align-items:start!important;
        }
        .planning-detail-page .account-person-inline-r71>.avatar{display:none!important}
        .planning-detail-page .account-person-inline-r71>.account-person-main-r71{
          grid-column:1!important;
          grid-row:1!important;
          width:100%!important;
          margin:0!important;
          padding:0!important;
          justify-items:start!important;
          text-align:left!important;
        }
        .planning-detail-page .account-person-inline-r71>.account-person-emergency-inline-r71{
          grid-column:2!important;
          grid-row:1!important;
          width:100%!important;
          margin:0!important;
          padding-left:18px!important;
          border-left:1px solid var(--border)!important;
        }
      }

      /* No mobile não sobra coluna do avatar removido: conteúdo começa no mesmo eixo de Período. */
      @media(max-width:900px){
        .planning-detail-page .account-contact-card-r70>.account-person-row.account-person-inline-r71{
          grid-template-columns:minmax(0,1fr)!important;
          gap:0!important;
          padding:14px!important;
          align-items:start!important;
        }
        .planning-detail-page .account-person-inline-r71>.account-person-main-r71{
          grid-column:1!important;
          grid-row:auto!important;
          width:100%!important;
          gap:2px!important;
          justify-items:start!important;
          text-align:left!important;
        }
        .planning-detail-page .account-person-inline-r71>.account-person-emergency-inline-r71{
          grid-column:1!important;
          grid-row:auto!important;
          width:100%!important;
          margin-top:10px!important;
          padding:10px 0 0!important;
          border-left:0!important;
          border-top:1px solid var(--border)!important;
        }
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
      .planning-detail-page .planning-person-day-summary,
      .planning-detail-page .planning-person-day-signals .badge,
      .planning-detail-page .planning-activity-tools .admin-portal-status .badge,
      .planning-detail-page .planning-person-agenda .admin-portal-activity-title p,
      .planning-detail-page .planning-person-agenda .admin-portal-description,
      .planning-detail-page .planning-person-agenda .admin-portal-description span,
      .planning-detail-page .planning-person-agenda .admin-portal-detail,
      .planning-detail-page .planning-person-agenda .admin-portal-detail span,
      .planning-detail-page .planning-person-agenda .day-adjustment-note,
      .planning-detail-page .account-emergency-action-r72{
        font-size:.68rem!important;
      }

      .account-emergency-action-r72{border:0;background:transparent;color:var(--primary);padding:2px 0;min-height:auto;display:inline-flex;align-items:center;gap:5px;font-size:.68rem;font-weight:700;white-space:nowrap}
      .account-emergency-action-r72:hover{text-decoration:underline}.account-emergency-action-r72 i{font-size:.68rem}
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
      const weekday=title.querySelector(':scope > span:not(.planning-person-day-summary)');if(weekday)weekday.remove();
      let summary=title.querySelector('.planning-person-day-summary')||day.querySelector('.planning-person-day-summary');
      if(!summary){summary=document.createElement('span');summary.className='planning-person-day-summary'}
      const hasActivity=!!day.querySelector('.planning-person-activity-card,.admin-portal-activity-card,.planning-day-sessions .activity-card');
      if(!hasActivity)summary.textContent='Sem atividade';
      if(!title.contains(summary))title.appendChild(summary);
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
  let polishQueued=false;
  function queuePolish(){if(polishQueued)return;polishQueued=true;queueMicrotask(()=>{polishQueued=false;polish()})}
  let attempts=0;function settle(){polish();attempts+=1;if(attempts<12)setTimeout(settle,90)}
  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){renderManager=function(){const result=baseRenderManager();queuePolish();requestAnimationFrame(polish);setTimeout(polish,60);return result};window.renderManager=renderManager;render=function(){return renderManager()};window.render=render}
  installStyles();
  const appRoot=document.getElementById('app');
  if(appRoot)new MutationObserver(()=>queuePolish()).observe(appRoot,{childList:true,subtree:true});
  requestAnimationFrame(settle);
})();
