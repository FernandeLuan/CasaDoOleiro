/* Ocupação mobile: calendário compacto e controles em uma única linha útil. */
(function occupancyMobile(){
  if(!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_OCCUPANCY_MOBILE__)return;
  window.__OLEIRO_OCCUPANCY_MOBILE__=true;

  const fallbackUnits=[{id:'rodeio',name:'Rodeio',active:true},{id:'indaial',name:'Indaial',active:true}];

  function ensureUnitState(){
    if(typeof state==='undefined')return fallbackUnits;
    if(!Array.isArray(state.occupancyUnits)||!state.occupancyUnits.length)state.occupancyUnits=fallbackUnits.map(unit=>({...unit}));
    return state.occupancyUnits;
  }

  function ensureUnitButtons(){
    const root=document.querySelector('.occupancy-v2-unit-options');
    if(!root)return;
    const units=ensureUnitState();
    const current=String(state?.occupancyUnitId||'rodeio');
    const existing=[...root.querySelectorAll('.occupancy-v2-unit')];
    if(existing.length){
      existing.forEach(button=>{
        const action=String(button.getAttribute('onclick')||''),match=action.match(/selectOccupancyUnit\('([^']+)'\)/),id=match?.[1]||'';
        const active=id===current;
        button.classList.toggle('active',active);
        button.setAttribute('aria-pressed',active?'true':'false');
      });
      return;
    }
    root.innerHTML=units.filter(unit=>unit&&unit.active!==false).map(unit=>{
      const id=String(unit.id||'').replaceAll("'","\\'");
      const label=String(unit.name||unit.id||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
      const active=String(unit.id)===current;
      return `<button class="occupancy-v2-unit ${active?'active':''}" type="button" aria-pressed="${active?'true':'false'}" onclick="selectOccupancyUnit('${id}')">${label}</button>`;
    }).join('');
  }

  if(document.getElementById('occupancyMobileStyles'))return;
  const style=document.createElement('style');
  style.id='occupancyMobileStyles';
  style.textContent=`
    .occupancy-v2-unit-mobile-select{display:none!important}
    @media(max-width:760px){
      html:has(body .occupancy-page-screen),
      body:has(.occupancy-page-screen){
        min-height:0!important;
        overscroll-behavior-y:none!important;
      }
      body:has(.occupancy-page-screen){padding-bottom:0!important}
      body:has(.occupancy-page-screen) #app{
        min-height:0!important;
        height:auto!important;
      }
      body:has(.occupancy-page-screen) .page{
        min-height:0!important;
        padding-bottom:calc(68px + env(safe-area-inset-bottom))!important;
      }

      .occupancy-v2{
        width:100%!important;
        max-width:100%!important;
        gap:9px!important;
        margin-bottom:0!important;
      }

      .occupancy-v2-head{display:none!important}

      /* Mês em cima; abaixo: três métricas compactas + seletor duplo de unidade. */
      .occupancy-v2-toolbar{
        display:grid!important;
        grid-template-columns:repeat(3,minmax(0,.78fr)) minmax(0,1.7fr)!important;
        gap:6px!important;
        align-items:stretch!important;
      }
      .occupancy-v2-month{
        order:1!important;
        grid-column:1/-1!important;
        width:100%!important;
        min-height:46px!important;
        padding:3px 6px!important;
        gap:4px!important;
        border-radius:15px!important;
      }
      .occupancy-v2-month strong{font-size:.69rem!important}
      .occupancy-v2-month .icon-btn{
        width:38px!important;
        height:38px!important;
        flex-basis:38px!important;
        border-radius:11px!important;
        box-shadow:none!important;
      }

      .occupancy-v2-metric{
        order:2!important;
        min-width:0!important;
        min-height:43px!important;
        padding:5px 2px!important;
        border-radius:13px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
      }
      .occupancy-v2-metric-icon{display:none!important}
      .occupancy-v2-metric>div:last-child{
        min-width:0!important;
        display:grid!important;
        justify-items:center!important;
        align-content:center!important;
        gap:2px!important;
      }
      .occupancy-v2-metric strong{
        display:block!important;
        font-size:.76rem!important;
        line-height:1!important;
        white-space:nowrap!important;
      }
      .occupancy-v2-metric p{
        display:block!important;
        margin:0!important;
        font-size:0!important;
        line-height:1!important;
        white-space:nowrap!important;
        color:var(--muted)!important;
      }
      .occupancy-v2-metric:nth-of-type(1) p::after{content:'Na casa';font-size:.47rem}
      .occupancy-v2-metric:nth-of-type(2) p::after{content:'Chegadas';font-size:.47rem}
      .occupancy-v2-metric:nth-of-type(3) p::after{content:'Saídas';font-size:.47rem}

      .occupancy-v2-unit-options{
        order:2!important;
        grid-column:auto!important;
        width:100%!important;
        min-width:0!important;
        min-height:43px!important;
        padding:3px!important;
        border-radius:13px!important;
        display:flex!important;
        align-items:stretch!important;
        gap:2px!important;
        overflow:hidden!important;
      }
      .occupancy-v2-unit-options>.occupancy-v2-unit{
        display:flex!important;
        flex:1 1 0!important;
        min-width:0!important;
        min-height:35px!important;
        padding:4px 2px!important;
        align-items:center!important;
        justify-content:center!important;
        border-radius:9px!important;
        font-size:.47rem!important;
        line-height:1!important;
        white-space:nowrap!important;
      }

      .occupancy-v2-calendar-card{
        width:100%!important;
        min-width:0!important;
        padding:7px!important;
        margin-bottom:0!important;
        border-radius:18px!important;
        overflow:hidden!important;
      }
      .occupancy-v2-scroll{
        width:100%!important;
        min-width:0!important;
        overflow-x:hidden!important;
        padding-bottom:0!important;
      }
      .occupancy-v2-weekdays,
      .occupancy-v2-calendar{
        width:100%!important;
        min-width:0!important;
        grid-template-columns:repeat(7,minmax(0,1fr))!important;
        gap:3px!important;
      }
      .occupancy-v2-weekdays{margin-bottom:4px!important}
      .occupancy-v2-weekdays span{
        min-width:0!important;
        padding:0!important;
        font-size:.47rem!important;
        letter-spacing:.03em!important;
        text-align:center!important;
      }
      .occupancy-v2-day,
      .occupancy-v2-blank{
        min-width:0!important;
        min-height:54px!important;
        border-radius:10px!important;
      }
      .occupancy-v2-day{
        padding:6px 4px 5px!important;
        overflow:hidden!important;
      }
      .occupancy-v2-day-top{min-height:13px!important;gap:2px!important}
      .occupancy-v2-day-top strong{font-size:.64rem!important;line-height:1!important}
      .occupancy-v2-today{display:none!important}
      .occupancy-v2-markers{
        min-height:13px!important;
        flex:1!important;
        padding:6px 0 2px!important;
        gap:2px!important;
        justify-content:center!important;
        align-content:center!important;
      }
      .occupancy-v2-markers small{font-size:.4rem!important;margin-left:1px!important}
      .occupancy-v2-dot{width:6px!important;height:6px!important;box-shadow:none!important}
      .occupancy-v2-dot.couple{width:12px!important;height:6px!important}
      .occupancy-v2-dot.couple::before,.occupancy-v2-dot.couple::after{width:6px!important;height:6px!important}
      .occupancy-v2-dot.couple::after{left:6px!important}
      .occupancy-v2-flows{display:none!important}
      button.occupancy-v2-day:hover{transform:none!important;box-shadow:none!important}
      .occupancy-v2-loading{min-height:210px!important}

      .occupancy-day-modal-backdrop{
        align-items:end!important;
        place-items:end center!important;
        padding:0!important;
      }
      .occupancy-day-modal{
        width:100%!important;
        max-width:none!important;
        max-height:82dvh!important;
        border-radius:22px 22px 0 0!important;
        border-bottom:0!important;
      }
      .occupancy-day-modal-head{padding:16px 16px 13px!important;gap:12px!important}
      .occupancy-day-modal-head h2{font-size:1rem!important}
      .occupancy-day-modal-head p{font-size:.63rem!important}
      .occupancy-day-modal-close{width:38px!important;height:38px!important;flex-basis:38px!important}
      .occupancy-day-modal-body{
        padding:12px 16px calc(18px + env(safe-area-inset-bottom))!important;
        gap:8px!important;
      }
      .occupancy-day-modal-guest{padding:12px!important;gap:8px!important;border-radius:14px!important}
    }

    @media(max-width:390px){
      .occupancy-v2-toolbar{grid-template-columns:repeat(3,minmax(0,.74fr)) minmax(0,1.78fr)!important;gap:5px!important}
      .occupancy-v2-metric{min-height:41px!important;padding:4px 1px!important}
      .occupancy-v2-metric strong{font-size:.72rem!important}
      .occupancy-v2-metric:nth-of-type(1) p::after,
      .occupancy-v2-metric:nth-of-type(2) p::after,
      .occupancy-v2-metric:nth-of-type(3) p::after{font-size:.44rem!important}
      .occupancy-v2-unit-options{min-height:41px!important}
      .occupancy-v2-unit-options>.occupancy-v2-unit{min-height:33px!important;font-size:.44rem!important}
      .occupancy-v2-calendar-card{padding:6px!important}
      .occupancy-v2-weekdays,.occupancy-v2-calendar{gap:2px!important}
      .occupancy-v2-day,.occupancy-v2-blank{min-height:50px!important}
      .occupancy-v2-day{padding:5px 3px 4px!important}
      .occupancy-v2-day-top strong{font-size:.6rem!important}
      .occupancy-v2-dot{width:5px!important;height:5px!important}
      .occupancy-v2-dot.couple{width:10px!important;height:5px!important}
      .occupancy-v2-dot.couple::before,.occupancy-v2-dot.couple::after{width:5px!important;height:5px!important}
      .occupancy-v2-dot.couple::after{left:5px!important}
    }
  `;
  document.head.appendChild(style);

  const baseSelectOccupancyUnit=window.selectOccupancyUnit;
  if(typeof baseSelectOccupancyUnit==='function'){
    window.selectOccupancyUnit=function(next){ensureUnitState();return baseSelectOccupancyUnit(next)};
    selectOccupancyUnit=window.selectOccupancyUnit;
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){
    window.renderManager=function(){
      ensureUnitState();
      const result=baseRenderManager();
      queueMicrotask(ensureUnitButtons);
      requestAnimationFrame(ensureUnitButtons);
      return result;
    };
    renderManager=window.renderManager;
    window.render=function(){return window.renderManager()};
    render=window.render;
  }

  ensureUnitState();
  requestAnimationFrame(ensureUnitButtons);
})();
