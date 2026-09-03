/* Página de Informações da Casa da homologação: composição compacta e equilibrada. */
(function houseInfoPage(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_HOUSE_INFO_PAGE__)return;
  window.__OLEIRO_HOUSE_INFO_PAGE__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));

  function installStyles(){
    if(document.getElementById('houseInfoPageStyles'))return;
    const style=document.createElement('style');
    style.id='houseInfoPageStyles';
    style.textContent=`
      .house-info-page{width:100%;max-width:1320px;margin:0 auto;display:grid;gap:14px;padding-bottom:32px}
      .house-info-portal,.house-info-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);min-width:0}
      .house-info-portal{padding:14px 16px 16px}
      .house-info-bottom{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.55fr);gap:14px;align-items:start}
      .house-info-card{padding:14px 16px}
      .house-info-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:10px}
      .house-info-card-copy{min-width:0;display:grid;gap:3px}
      .house-info-card-copy strong{font-size:.76rem;color:var(--text)}
      .house-info-card-copy p{margin:0;color:var(--muted);font-size:.6rem;line-height:1.4}
      .house-info-portal-content{min-width:0}
      .house-info-portal-content details{box-shadow:none!important}
      .house-info-portal-content details+details{margin-top:6px!important}

      .house-info-routine-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .house-info-routine-block{min-width:0;border:1px solid var(--border);border-radius:13px;overflow:hidden;background:var(--surface)}
      .house-info-routine-label{display:block;padding:8px 10px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:.54rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
      .house-info-routine-row{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;align-items:center;padding:7px 10px;border-bottom:1px solid var(--border)}
      .house-info-routine-row:last-child{border-bottom:0}
      .house-info-routine-row time{font-size:.56rem;font-weight:700;color:var(--primary);white-space:nowrap}
      .house-info-routine-row span{font-size:.59rem;color:var(--text);line-height:1.3}

      .house-info-units{display:grid;gap:7px}
      .house-info-unit{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
      .house-info-unit-copy{min-width:0;display:grid;gap:2px}
      .house-info-unit-copy strong{font-size:.65rem;color:var(--text)}
      .house-info-unit-copy small{font-size:.54rem;color:var(--muted)}
      .house-info-unit-status{border-radius:999px;padding:5px 7px;font-size:.49rem;font-weight:700;background:var(--surface-2);color:var(--muted);white-space:nowrap}
      .house-info-unit-status.active{background:var(--primary-soft);color:var(--primary)}
      .house-info-manage{min-height:34px!important;padding:6px 10px!important;font-size:.57rem!important;white-space:nowrap}

      @media(max-width:1023px){
        .house-info-bottom{grid-template-columns:1fr}
      }
      @media(max-width:720px){
        .house-info-routine-columns{grid-template-columns:1fr}
        .house-info-portal,.house-info-card{padding:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function pageTitle(){
    return `<header class="admin-page-title"><span class="eyebrow">Informações</span><h1>Informações da Casa</h1><p>Centralize orientações do portal, rotina e dados gerais das unidades.</p></header>`;
  }

  function portalHtml(){
    try{return typeof infoAccordion==='function'?infoAccordion():'<div class="empty">Informações do portal indisponíveis.</div>'}
    catch(error){console.warn('Informações do portal indisponíveis:',error);return '<div class="empty">Informações do portal indisponíveis.</div>'}
  }

  function routineRows(rows){
    return rows.map(([time,label])=>`<div class="house-info-routine-row"><time>${esc(time)}</time><span>${esc(label)}</span></div>`).join('');
  }

  function routineHtml(){
    const morning=[
      ['06:00','Despertar e higiene'],['06:15–07:30','Devocional'],['07:30–08:15','Café da manhã'],['08:15–11:15','Atividades práticas'],['11:15–12:00','Reunião de sentimentos'],['12:00–13:30','Almoço e descanso']
    ];
    const later=[
      ['13:45–15:00','Atividades'],['15:00–15:15','Café da tarde'],['15:15–16:30','Atividades'],['16:30 em diante','Banho, lazer e jantar'],['19:30–21:00','Filme, palestra, documentário ou outras atividades'],['21:00','Alojamento'],['21:30','Silêncio total']
    ];
    return `<div class="house-info-routine-columns"><div class="house-info-routine-block"><span class="house-info-routine-label">Manhã</span>${routineRows(morning)}</div><div class="house-info-routine-block"><span class="house-info-routine-label">Tarde e noite</span>${routineRows(later)}</div></div>`;
  }

  function unitsHtml(){
    const rows=Array.isArray(state.units)?state.units:[];
    if(!rows.length)return '<div class="empty">Nenhuma unidade cadastrada.</div>';
    return `<div class="house-info-units">${rows.map(unit=>{const active=unit.active!==false;return `<div class="house-info-unit"><div class="house-info-unit-copy"><strong>${esc(unit.name||unit.id)}</strong><small>${unit.acceptingVolunteers===true?'Aceitando voluntários':active?'Unidade ativa':'Unidade inativa'}</small></div><span class="house-info-unit-status ${active?'active':''}">${active?'Ativa':'Inativa'}</span></div>`}).join('')}</div>`;
  }

  function pageHtml(){
    return `<section class="house-info-page compact-page-top">${pageTitle()}<article class="house-info-portal"><div class="house-info-card-head"><div class="house-info-card-copy"><strong>Portal do voluntário</strong><p>Conteúdo e orientações apresentados aos candidatos e voluntários.</p></div></div><div class="house-info-portal-content">${portalHtml()}</div></article><div class="house-info-bottom"><article class="house-info-card"><div class="house-info-card-head"><div class="house-info-card-copy"><strong>Rotina da Casa</strong><p>Horários de referência usados na comunidade.</p></div></div>${routineHtml()}</article><article class="house-info-card"><div class="house-info-card-head"><div class="house-info-card-copy"><strong>Unidades</strong><p>Visão rápida das unidades cadastradas.</p></div><button class="btn btn-soft house-info-manage" type="button" onclick="openUnits()"><i class="fa-solid fa-gear"></i>Gerenciar</button></div>${unitsHtml()}</article></div></section>`;
  }

  installStyles();

  const baseRenderManager=window.renderManager;
  if(typeof baseRenderManager!=='function')return;
  window.renderManager=renderManager=function(){
    const requested=state.managerPage;
    const result=baseRenderManager();
    if(requested==='houseInfo'){
      const main=document.querySelector('.admin-content-r62 main.page');
      if(main)main.innerHTML=pageHtml();
    }
    return result;
  };
  window.render=render=function(){return window.renderManager()};

  if(state.role==='manager'&&state.managerPage==='houseInfo')window.render();
})();
