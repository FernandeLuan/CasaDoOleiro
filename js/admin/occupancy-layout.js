/* Refinamento visual da Ocupação na homologação. Mantém a lógica no shell e apenas organiza a apresentação. */
(function occupancyLayout(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(document.getElementById('occupancyLayoutStyles'))return;

  const style=document.createElement('style');
  style.id='occupancyLayoutStyles';
  style.textContent=`
    .occupancy-month-nav strong{text-transform:none!important}

    @media(min-width:1024px){
      .occupancy-page-screen{position:relative}
      .occupancy-page-head{align-items:flex-start!important;padding-bottom:22px}
      .occupancy-calendar-toolbar{
        position:absolute!important;
        top:72px;
        right:4px;
        z-index:2;
        display:block!important;
        margin:0!important;
        pointer-events:none;
      }
      .occupancy-calendar-toolbar>strong{display:none!important}
      .occupancy-calendar-toolbar .occupancy-legend{
        display:flex!important;
        align-items:center;
        justify-content:flex-end;
        gap:12px!important;
        color:var(--muted);
        font-size:.58rem!important;
        padding:0 4px;
      }
      .occupancy-calendar-toolbar .occupancy-legend span{gap:5px!important}
    }

    @media(max-width:1023px){
      .occupancy-calendar-toolbar{display:flex!important;justify-content:flex-start!important;margin-bottom:10px!important}
      .occupancy-calendar-toolbar>strong{display:none!important}
      .occupancy-calendar-toolbar .occupancy-legend{justify-content:flex-start!important;font-size:.58rem!important}
    }
  `;
  document.head.appendChild(style);
})();
