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
    @media(max-width:760px){
      .occupancy-v2{
        width:100%!important;
        max-width:100%!important;
        gap:10px!important;
      }
      .occupancy-v2-head{margin-bottom:2px!important}
      .occupancy-v2-copy h1{font-size:1.22rem!important;margin:2px 0 3px!important}
      .occupancy-v2-copy>p{font-size:.66rem!important;line-height:1.4!important}

      /* 3 indicadores compactos na primeira linha; controles abaixo. */
      .occupancy-v2-toolbar{
        display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        gap:8px!important;
        align-items:stretch!important;
      }
      .occupancy-v2-metric{
        min-width:0!important;
        min-height:64px!important;
        padding:8px!important;
        border-radius:15px!important;
        grid-template-columns:30px minmax(0,1fr)!important;
        gap:7px!important;
      }
      .occupancy-v2-metric-icon{
        width:30px!important;
        height:30px!important;
        border-radius:9px!important;
      }
      .occupancy-v2-metric-icon i{font-size:.68rem!important}
      .occupancy-v2-metric strong{font-size:.9rem!important;line-height:1!important}
      .occupancy-v2-metric p{
        margin:3px 0 0!important;
        font-size:.52rem!important;
        line-height:1.2!important;
        overflow-wrap:anywhere;
      }
      .occupancy-v2-unit-options,
      .occupancy-v2-month{
        grid-column:1/-1!important;
        width:100%!important;
        min-height:48px!important;
        border-radius:15px!important;
      }
      .occupancy-v2-unit-options{padding:4px!important}
      .occupancy-v2-unit{min-height:40px!important;padding:7px 10px!important;font-size:.65rem!important;border-radius:11px!important}
      .occupancy-v2-month{padding:4px 6px!important;gap:4px!important}
      .occupancy-v2-month strong{font-size:.68rem!important}
      .occupancy-v2-month .icon-btn{width:40px!important;height:40px!important;flex-basis:40px!important;border-radius:11px!important;box-shadow:none!important}

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
      /* Chegadas/saídas permanecem disponíveis ao tocar no dia; não espremem a célula. */
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
      .occupancy-v2-metric{grid-template-columns:26px minmax(0,1fr)!important;gap:5px!important;padding:7px 6px!important;min-height:60px!important}
      .occupancy-v2-metric-icon{width:26px!important;height:26px!important;border-radius:8px!important}
      .occupancy-v2-metric strong{font-size:.82rem!important}
      .occupancy-v2-metric p{font-size:.48rem!important}
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
})();
