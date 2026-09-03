/* Página de Informações da Casa: rotina e unidades primeiro, portal em cards compactos. */
(function houseInfoPage(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_HOUSE_INFO_PAGE__)return;
  window.__OLEIRO_HOUSE_INFO_PAGE__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const tx=(key,fallback)=>{try{const value=typeof t==='function'?t(key):'';return value&&value!==key?value:fallback}catch{return fallback}};
  state.houseInfoUnitUpdating=state.houseInfoUnitUpdating||{};

  function installStyles(){
    if(document.getElementById('houseInfoPageStyles'))return;
    const style=document.createElement('style');
    style.id='houseInfoPageStyles';
    style.textContent=`
      .house-info-page{width:100%;max-width:1320px;margin:0 auto;display:grid;gap:15px;padding-bottom:32px}
      .house-info-top{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.55fr);gap:14px;align-items:stretch}
      .house-info-top>.house-info-card{height:100%}
      .house-info-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:14px 16px;box-shadow:var(--shadow);min-width:0}
      .house-info-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:10px}
      .house-info-card-copy{min-width:0;display:grid;gap:4px}
      .house-info-card-copy strong{font-size:.86rem;color:var(--text)}
      .house-info-card-copy p{margin:0;color:var(--muted);font-size:.72rem;line-height:1.42}

      .house-info-routine-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .house-info-routine-block{min-width:0;border:1px solid var(--border);border-radius:13px;overflow:hidden;background:var(--surface)}
      .house-info-routine-label{display:block;padding:8px 10px;background:var(--surface-2);border-bottom:1px solid var(--border);font-size:.66rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
      .house-info-routine-row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;align-items:center;padding:7px 10px;border-bottom:1px solid var(--border)}
      .house-info-routine-row:last-child{border-bottom:0}
      .house-info-routine-row time{font-size:.72rem;font-weight:700;color:var(--primary);white-space:nowrap}
      .house-info-routine-row span{font-size:.72rem;color:var(--text);line-height:1.36}

      .house-info-units{display:grid;gap:8px;align-content:start}
      .house-info-unit{display:grid;gap:9px;padding:10px 11px 11px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
      .house-info-unit-copy{min-width:0;display:grid;gap:3px}
      .house-info-unit-copy strong{font-size:.78rem;color:var(--text)}
      .house-info-unit-copy small{font-size:.68rem;color:var(--muted)}
      .house-info-unit-toggle{display:grid;grid-template-columns:1fr 1fr;gap:3px;width:100%;padding:3px;border:1px solid var(--border);border-radius:11px;background:var(--surface-2)}
      .house-info-unit-toggle button{min-width:0;min-height:32px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-size:.68rem;font-weight:700;cursor:pointer;transition:.15s ease}
      .house-info-unit-toggle button:hover:not(:disabled){background:var(--surface);color:var(--text)}
      .house-info-unit-toggle button.selected-active{background:var(--primary);color:#fff;box-shadow:0 2px 8px rgba(30,95,67,.16)}
      .house-info-unit-toggle button.selected-inactive{background:var(--danger);color:#fff;box-shadow:0 2px 8px color-mix(in srgb,var(--danger) 20%,transparent)}
      .house-info-unit-toggle button.selected-inactive:hover:not(:disabled){background:var(--danger);color:#fff;filter:brightness(.96)}
      .house-info-unit-toggle button:disabled{cursor:wait;opacity:.6}
      .house-info-unit-updating{display:inline-flex;align-items:center;gap:5px;color:var(--muted);font-size:.64rem}

      .house-info-portal-section{display:grid;gap:10px;padding-top:2px}
      .house-info-portal-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:0 2px}
      .house-info-portal-head>div{display:grid;gap:4px}
      .house-info-portal-head strong{font-size:.86rem;color:var(--text)}
      .house-info-portal-head p{margin:0;color:var(--muted);font-size:.72rem;line-height:1.42}
      .house-info-portal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,290px));gap:10px;justify-content:start;align-items:stretch}
      .house-info-topic{width:100%;min-width:0;min-height:82px;border:1px solid var(--border);border-radius:15px;background:var(--surface);box-shadow:0 3px 14px rgba(30,48,38,.035);padding:11px 12px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:start;text-align:left;color:var(--text);cursor:pointer;transition:.16s ease}
      .house-info-topic:hover{border-color:color-mix(in srgb,var(--primary) 35%,var(--border));transform:translateY(-1px);box-shadow:0 8px 22px rgba(20,43,31,.06)}
      .house-info-topic-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:.76rem}
      .house-info-topic-copy{min-width:0;display:grid;gap:4px;padding-top:1px}
      .house-info-topic-copy strong{font-size:.78rem;color:var(--text)}
      .house-info-topic-copy span{font-size:.68rem;line-height:1.42;color:var(--muted)}
      .house-info-topic>i{align-self:center;color:var(--muted);font-size:.68rem}

      .house-info-topic-modal .modal-body{padding:15px 16px 17px!important}
      .house-info-topic-modal-body{display:grid;gap:10px;color:var(--text);font-size:.74rem;line-height:1.55}
      .house-info-topic-modal-body p{margin:0}
      .house-info-topic-modal-body .info-action-link{justify-self:start;margin-top:2px}
      .house-info-topic-modal-body .info-routine{display:grid;gap:0;border:1px solid var(--border);border-radius:13px;overflow:hidden}
      .house-info-topic-modal-body .info-routine p{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.72rem}
      .house-info-topic-modal-body .info-routine p:last-child{border-bottom:0}

      @media(max-width:1023px){
        .house-info-top{grid-template-columns:1fr}
        .house-info-portal-grid{grid-template-columns:repeat(2,minmax(230px,290px))}
      }
      @media(max-width:720px){
        .house-info-routine-columns{grid-template-columns:1fr}
        .house-info-card{padding:12px}
      }
      @media(max-width:620px){
        .house-info-portal-grid{grid-template-columns:1fr}
        .house-info-topic{min-height:76px}
      }
    `;
    document.head.appendChild(style);
  }

  function pageTitle(){
    return `<header class="admin-page-title"><span class="eyebrow">Informações</span><h1>Informações da Casa</h1><p>Centralize orientações do portal, rotina e dados gerais das unidades.</p></header>`;
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

  function unitToggle(unit){
    const unitId=String(unit.id),active=unit.active!==false,busy=!!state.houseInfoUnitUpdating[unitId],encoded=encodeURIComponent(unitId);
    return `<div class="house-info-unit-toggle" role="group" aria-label="Status da unidade ${esc(unit.name||unitId)}"><button class="${active?'selected-active':''}" type="button" aria-pressed="${active?'true':'false'}" onclick="setHouseUnitActive('${encoded}',true)" ${busy?'disabled':''}>Ativo</button><button class="${!active?'selected-inactive':''}" type="button" aria-pressed="${!active?'true':'false'}" onclick="setHouseUnitActive('${encoded}',false)" ${busy?'disabled':''}>Inativo</button></div>`;
  }

  function unitsHtml(){
    const rows=Array.isArray(state.units)?state.units:[];
    if(!rows.length)return '<div class="empty">Nenhuma unidade cadastrada.</div>';
    return `<div class="house-info-units">${rows.map(unit=>{const busy=!!state.houseInfoUnitUpdating[String(unit.id)];return `<div class="house-info-unit"><div class="house-info-unit-copy"><strong>${esc(unit.name||unit.id)}</strong>${busy?'<small class="house-info-unit-updating"><i class="fa-solid fa-circle-notch fa-spin"></i>Atualizando status...</small>':'<small>Disponibilidade da unidade</small>'}</div>${unitToggle(unit)}</div>`}).join('')}</div>`;
  }

  window.setHouseUnitActive=async function(encodedId,nextValue){
    const unitId=decodeURIComponent(String(encodedId||'')),next=nextValue===true;
    const current=(state.units||[]).find(unit=>String(unit.id)===unitId);
    if(!current||current.active===next||state.houseInfoUnitUpdating[unitId])return;
    if(!window.OleiroServices?.units?.update){showToast?.('Serviço de unidades indisponível.');return}
    state.houseInfoUnitUpdating[unitId]=true;
    window.render?.();
    try{
      await window.OleiroServices.units.update(unitId,{active:next});
      state.units=(state.units||[]).map(unit=>String(unit.id)===unitId?{...unit,active:next}:unit);
      window.OleiroServices.units.invalidate?.();
    }catch(error){
      console.error('Falha ao atualizar status da unidade:',error);
      showToast?.('Não foi possível atualizar a unidade.');
    }finally{
      delete state.houseInfoUnitUpdating[unitId];
      if(state.managerPage==='houseInfo')window.render?.();
    }
  };

  function portalTopics(){
    return [
      {id:'arrival',icon:'fa-location-dot',title:tx('portal.info.arrivalTitle','Como chegar'),preview:'Endereço, transporte e orientações para chegada.'},
      {id:'accommodation',icon:'fa-bed',title:tx('portal.info.accommodationTitle','Acomodação'),preview:'Orientações sobre quartos, itens e hospedagem.'},
      {id:'meals',icon:'fa-utensils',title:tx('portal.info.mealsTitle','Refeições'),preview:'Informações sobre alimentação durante a estadia.'},
      {id:'routine',icon:'fa-clock',title:tx('portal.info.routineTitle','Rotina'),preview:'Usa os mesmos horários da Rotina da Casa exibida acima.'},
      {id:'principles',icon:'fa-hands-praying',title:tx('portal.info.principlesTitle','Princípios e religião'),preview:'Princípios, espiritualidade e orientações da Casa.'},
      {id:'safety',icon:'fa-shield-heart',title:tx('portal.info.safetyTitle','Convivência e segurança'),preview:'Regras de convivência, cuidado e segurança.'}
    ];
  }

  function topicBody(id){
    if(id==='arrival')return `<p><strong>${esc(tx('portal.info.address','Endereço:'))}</strong> ${esc(typeof OLEIRO_ADDRESS!=='undefined'?OLEIRO_ADDRESS:'R. São Pedro Novo, 1999, Rodeio - SC')}</p><p>${esc(tx('portal.info.arrivalBody','Consulte as orientações para chegar à Casa.'))}</p>${typeof OLEIRO_MAPS_URL!=='undefined'?`<a class="info-action-link" href="${esc(OLEIRO_MAPS_URL)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-map-location-dot"></i>${esc(tx('portal.info.openMaps','Abrir no mapa'))}</a>`:''}`;
    if(id==='accommodation')return `<p>${esc(tx('portal.info.accommodationBody','Orientações de acomodação indisponíveis.'))}</p>`;
    if(id==='meals')return `<p>${esc(tx('portal.info.mealsBody','Orientações de refeições indisponíveis.'))}</p>`;
    if(id==='routine')return typeof routineInformationHtml==='function'?routineInformationHtml():`<p>A rotina do Portal utiliza os mesmos horários apresentados nesta tela.</p>`;
    if(id==='principles')return `<p>${esc(tx('portal.info.principlesBody','Orientações de princípios e religião indisponíveis.'))}</p>`;
    if(id==='safety')return `<p>${esc(tx('portal.info.safetyBody','Orientações de convivência e segurança indisponíveis.'))}</p>`;
    return '<p>Informação indisponível.</p>';
  }

  window.openHousePortalTopic=function(id){
    const topic=portalTopics().find(row=>row.id===id);if(!topic)return;
    openModal(topic.title,'Conteúdo apresentado no Portal do voluntário.',`<div class="modal-body"><div class="house-info-topic-modal-body">${topicBody(id)}</div></div>`);
    modalRoot?.querySelector?.('.modal')?.classList.add('house-info-topic-modal');
  };

  function portalHtml(){
    const topics=portalTopics();
    return `<section class="house-info-portal-section"><header class="house-info-portal-head"><div><strong>Portal do voluntário</strong><p>Informações consultadas antes e durante a estadia.</p></div></header><div class="house-info-portal-grid">${topics.map(topic=>`<button class="house-info-topic" type="button" onclick="openHousePortalTopic('${esc(topic.id)}')"><span class="house-info-topic-icon"><i class="fa-solid ${esc(topic.icon)}"></i></span><span class="house-info-topic-copy"><strong>${esc(topic.title)}</strong><span>${esc(topic.preview)}</span></span><i class="fa-solid fa-chevron-right"></i></button>`).join('')}</div></section>`;
  }

  function pageHtml(){
    return `<section class="house-info-page compact-page-top">${pageTitle()}<div class="house-info-top"><article class="house-info-card"><div class="house-info-card-head"><div class="house-info-card-copy"><strong>Rotina da Casa</strong><p>Horários de referência usados na comunidade e no Portal.</p></div></div>${routineHtml()}</article><article class="house-info-card"><div class="house-info-card-head"><div class="house-info-card-copy"><strong>Unidades</strong><p>Ative ou inative cada unidade diretamente.</p></div></div>${unitsHtml()}</article></div>${portalHtml()}</section>`;
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