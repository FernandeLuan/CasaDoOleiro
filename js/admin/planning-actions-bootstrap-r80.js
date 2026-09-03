/* R80 — garante o carregamento final das ações do Planejamento após a cadeia legada. */
(function planningActionsBootstrapR80(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_ACTIONS_BOOTSTRAP_R80__)return;
  window.__OLEIRO_PLANNING_ACTIONS_BOOTSTRAP_R80__=true;

  const current=document.currentScript?.src;
  if(!current)return;
  let attempts=0;

  function ensureR79(){
    if(window.__OLEIRO_PLANNING_ACTIVITY_ACTIONS_R79__||document.querySelector('script[data-r79-planning-activity-actions-r80]'))return;
    const script=document.createElement('script');
    script.dataset.r79PlanningActivityActionsR80='true';
    script.src=new URL('./planning-activity-actions-r79.js?v=20260903-r80',current).href;
    document.body.appendChild(script);
  }

  function ensureR78(){
    if(window.__OLEIRO_PLANNING_DAY_ACTIONS_R78__){ensureR79();return}
    if(document.querySelector('script[data-r78-planning-day-actions-r80]'))return;
    const script=document.createElement('script');
    script.dataset.r78PlanningDayActionsR80='true';
    script.src=new URL('./planning-day-actions-r78.js?v=20260903-r80',current).href;
    script.onload=ensureR79;
    document.body.appendChild(script);
  }

  function waitForR76(){
    if(window.__OLEIRO_PLANNING_DAY_ACTIONS_R76__){ensureR78();return}
    attempts+=1;
    if(attempts<120){setTimeout(waitForR76,50);return}
    console.error('R80: R76 não ficou disponível para inicializar as ações do Planejamento.');
  }

  waitForR76();
})();
