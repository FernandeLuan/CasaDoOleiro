/* Ocupação mobile: adaptação responsiva real do calendário e dos controles. */
(function occupancyMobile(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_OCCUPANCY_MOBILE__)return;
  window.__OLEIRO_OCCUPANCY_MOBILE__=true;

  if(document.getElementById('occupancyMobileStyles'))return;
  const style=document.createElement('style');
  style.id='occupancyMobileStyles';
  style.textContent=`
    .occupancy-v2-unit-mobile-select{display:none}
    @media(max-width:760px){
      .occupancy-v2{
        width:100%!important;
        max-width:100%!important;
        gap:10px!important;
      }

      /* No mobile a tela começa direto pelos controles. */
      .occupancy-v2-head{display:none!important}

      /* Ordem mobile: mês > Na casa | Chegadas | Saídas | Unidade. */
      .occupancy-v2-toolbar{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:7px!important;
        align-items:stretch!important;
      }
      .occupancy-v2-month{
        order:1!important;
        grid-column:1/-1!important;
        width:100%!important;
        min-height:48px!important;
        padding:4px 6px!important;
        gap:4px!important;
        border-radius:15px!important;
      }
      .occupancy-v2-month strong{font-size:.7rem!important}
      .occupancy-v2-month .icon-btn{
        width:40px!important;
        height:40px!important;
        flex-basis:40px!important;
        border-radius:11px!important;
        box-shadow:none!important;
      }

      .occupancy-v2-metric{
        order:2!important;
        min-width:0!important;
        min-height:46px!important;
        padding:7px 4px!important;
        border-radius:14px!important;
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
        gap:3px!important;
      }
      .occupancy-v2-metric strong{
        display:block!important;
        font-size:.82rem!important;
        line-height:1!important;
        white-space:nowrap!important;
      }
      .occupancy-v2-metric p{
        display:block!important;
        margin:0!important;
        font-size:.52rem!important;
        line-height:1.05!important;
        white-space:nowrap!important;
        color:var(--muted)!important;
      }
      .occupancy-v2-metric:nth-of-type(1) p,
      .occupancy-v2-metric:nth-of-type(2) p,
      .occupancy-v2-metric:nth-of-type(3) p{font-size:0!important}
      .occupancy-v2-metric:nth-of-type(1) p::after{content:'Na casa';font-size:.52rem}
      .occupancy-v2-metric:nth-of-type(2) p::after{content:'Chegadas';font-size:.52rem}
      .occupancy-v2-metric:nth-of-type(3) p::after{content:'Saídas';font-size:.52rem}

      .occupancy-v2-unit-options{
        order:2!important;
        grid-column:auto!important;
        width:100%!important;
        min-width:0!important;
        min-height:46px!important;
        padding:0!important;
        border-radius:14px!important;
        position:relative!important;
        overflow:hidden!important;
      }
      .occupancy-v2-unit-options>.occupancy-v2-unit{display:none!important}
      .occupancy-v2-unit-mobile-select{
        display:block!important;
        width:100%!important;
        min-width:0!important;
        height:44px!important;
        border:0!important;
        outline:0!important;
        background:var(--surface)!important;
        color:var(--text)!important;
        padding:0 20px 0 8px!important;
        font:inherit!important;
        font-size:.51rem!important;
        font-weight:700!important;
        text-align:center!important;
        text-align-last:center!important;
        appearance:auto!important;
      }

      /* Calendário ocupa a largura do aparelho, sem herdar os 860px do desktop. */
      .occupancy-v2-calendar-card{
        width:100%!important;
        min-width:0!important;
        padding:8px!important;
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
        font-size:.48rem!important;
        letter-spacing:.03em!important;
        text-align:center!important;
      }
      .occupancy-v2-day,
      .occupancy-v2-blank{
        min-width:0!important;
        min-height:58px!important;
        border-radius:10px!important;
      }
      .occupancy-v2-day{
        padding:6px 4px 5px!important;
        overflow:hidden!important;
      }
      .occupancy-v2-day-top{
        min-height:13px!important;
        gap:2px!important;
      }
      .occupancy-v2-day-top strong{font-size:.66rem!important;line-height:1!important}
      .occupancy-v2-today{display:none!important}
      .occupancy-v2-markers{
        min-height:14px!important;
        flex:1!important;
        padding:7px 0 2px!important;
        gap:2px!important;
        justify-content:center!important;
        align-content:center!important;
      }
      .occupancy-v2-markers small{font-size:.42rem!important;margin-left:1px!important}
      .occupancy-v2-dot{
        width:6px!important;
        height:6px!important;
        box-shadow:none!important;
      }
      .occupancy-v2-dot.couple{width:12px!important;height:6px!important}
      .occupancy-v2-dot.couple::before,
      .occupancy-v2-dot.couple::after{width:6px!important;height:6px!important}
      .occupancy-v2-dot.couple::after{left:6px!important}
      .occupancy-v2-flows{display:none!important}
      button.occupancy-v2-day:hover{transform:none!important;box-shadow:none!important}
      .occupancy-v2-loading{min-height:220px!important}

      /* Detalhe do dia vira bottom sheet no celular. */
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
      .occupancy-v2-toolbar{gap:6px!important}
      .occupancy-v2-metric{min-height:44px!important;padding:6px 3px!important}
      .occupancy-v2-metric strong{font-size:.78rem!important}
      .occupancy-v2-metric:nth-of-type(1) p::after,
      .occupancy-v2-metric:nth-of-type(2) p::after,
      .occupancy-v2-metric:nth-of-type(3) p::after{font-size:.49rem!important}
      .occupancy-v2-unit-options{min-height:44px!important}
      .occupancy-v2-unit-mobile-select{height:42px!important;font-size:.49rem!important;padding-inline:5px!important}
      .occupancy-v2-calendar-card{padding:6px!important}
      .occupancy-v2-weekdays,.occupancy-v2-calendar{gap:2px!important}
      .occupancy-v2-day,.occupancy-v2-blank{min-height:52px!important}
      .occupancy-v2-day{padding:5px 3px 4px!important}
      .occupancy-v2-day-top strong{font-size:.61rem!important}
      .occupancy-v2-dot{width:5px!important;height:5px!important}
      .occupancy-v2-dot.couple{width:10px!important;height:5px!important}
      .occupancy-v2-dot.couple::before,.occupancy-v2-dot.couple::after{width:5px!important;height:5px!important}
      .occupancy-v2-dot.couple::after{left:5px!important}
    }
  `;
  document.head.appendChild(style);

  function ensureMobileUnitSelect(){
    const root=document.querySelector('.occupancy-v2-unit-options');if(!root)return;
    const buttons=[...root.querySelectorAll('.occupancy-v2-unit')];if(!buttons.length)return;
    let select=root.querySelector('.occupancy-v2-unit-mobile-select');
    if(!select){
      select=document.createElement('select');select.className='occupancy-v2-unit-mobile-select';select.setAttribute('aria-label','Selecionar unidade');
      select.addEventListener('change',()=>{if(typeof window.selectOccupancyUnit==='function')window.selectOccupancyUnit(select.value)});
      root.appendChild(select);
    }
    const options=buttons.map(button=>{
      const action=String(button.getAttribute('onclick')||''),match=action.match(/selectOccupancyUnit\('([^']+)'\)/),value=match?.[1]||String(button.textContent||'').trim(),label=String(button.textContent||'').trim();
      return {value,label,selected:button.classList.contains('active')};
    });
    const signature=options.map(option=>`${option.value}:${option.label}:${option.selected?'1':'0'}`).join('|');
    if(select.dataset.signature!==signature){
      select.innerHTML=options.map(option=>`<option value="${String(option.value).replaceAll('"','&quot;')}" ${option.selected?'selected':''}>${String(option.label).replaceAll('<','&lt;').replaceAll('>','&gt;')}</option>`).join('');
      select.dataset.signature=signature;
    }
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){
    renderManager=function(){const result=baseRenderManager();queueMicrotask(ensureMobileUnitSelect);requestAnimationFrame(ensureMobileUnitSelect);return result};
    window.renderManager=renderManager;render=function(){return renderManager()};window.render=render;
  }
  requestAnimationFrame(ensureMobileUnitSelect);
})();
