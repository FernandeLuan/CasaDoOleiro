/* Página de Ocupação da homologação: calendário mensal, unidade e detalhe do dia. */
(function occupancyPage(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_OCCUPANCY_PAGE__)return;
  window.__OLEIRO_OCCUPANCY_PAGE__=true;

  const baseRenderManager=window.renderManager;
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const formatDate=value=>typeof fmtDate==='function'?fmtDate(value,true):String(value||'').slice(0,10);

  function installStyles(){
    if(document.getElementById('occupancyPageStyles'))return;
    const style=document.createElement('style');
    style.id='occupancyPageStyles';
    style.textContent=`
      .occupancy-v2{max-width:1320px;margin:0 auto;display:grid;gap:14px}
      .occupancy-v2-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:32px;margin-bottom:2px}
      .occupancy-v2-copy{min-width:0}
      .occupancy-v2-copy .eyebrow{display:block;margin:0 0 4px;color:var(--primary);font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
      .occupancy-v2-copy h1{margin:4px 0 6px;color:var(--text);font-size:clamp(1.55rem,2vw,2.15rem);line-height:1.15;letter-spacing:-.025em}
      .occupancy-v2-copy>p{margin:0;color:var(--muted);font-size:.76rem}

      .occupancy-v2-controls{display:grid;grid-template-columns:auto auto;grid-template-areas:"unit month" ". legend";align-items:start;gap:7px 14px}
      .occupancy-v2-unit-options{grid-area:unit;display:flex;align-items:center;gap:4px;padding:4px;background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow)}
      .occupancy-v2-unit{min-width:98px;min-height:44px;border:0;border-radius:13px;background:transparent;color:var(--muted);padding:8px 14px;font-size:.66rem;font-weight:700;cursor:pointer;transition:.16s ease}
      .occupancy-v2-unit:hover{background:var(--surface-2);color:var(--text)}
      .occupancy-v2-unit.active{background:var(--primary);color:#fff;box-shadow:0 4px 12px rgba(31,91,63,.14)}
      .occupancy-v2-month{grid-area:month;display:flex;align-items:center;justify-content:center;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:4px 8px;box-shadow:var(--shadow)}
      .occupancy-v2-month strong{min-width:170px;text-align:center;font-size:.78rem;color:var(--text)}
      .occupancy-v2-month .icon-btn{width:44px;height:44px;border-radius:13px}
      .occupancy-v2-legend{grid-area:legend;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:.58rem;padding-top:1px}
      .occupancy-v2-legend span{display:inline-flex;align-items:center;gap:5px}
      .occupancy-v2-dot{display:inline-block;width:9px;height:9px;border-radius:999px;background:#4da3ff;flex:0 0 auto;box-shadow:0 0 0 1px rgba(77,163,255,.12)}
      .occupancy-v2-dot.female{background:#f064a6;box-shadow:0 0 0 1px rgba(240,100,166,.12)}
      .occupancy-v2-dot.couple{width:18px;height:9px;background:transparent;border-radius:0;position:relative;box-shadow:none}
      .occupancy-v2-dot.couple::before,.occupancy-v2-dot.couple::after{content:"";position:absolute;top:0;width:9px;height:9px;border-radius:999px;background:#8d9693}
      .occupancy-v2-dot.couple::before{left:0}.occupancy-v2-dot.couple::after{left:9px}

      .occupancy-v2-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .occupancy-v2-metric{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:8px 14px;min-height:68px;display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:11px;box-shadow:var(--shadow)}
      .occupancy-v2-metric-icon{width:38px!important;height:38px!important;margin:0!important;border-radius:12px;display:grid!important;place-items:center!important;background:var(--primary-soft);color:var(--primary);line-height:1!important}
      .occupancy-v2-metric-icon i{display:block!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;line-height:1!important;font-size:.78rem!important;transform:none!important}
      .occupancy-v2-metric strong{display:block;font-size:1.02rem;line-height:1.05}
      .occupancy-v2-metric p{margin:3px 0 0;color:var(--muted);font-size:.63rem}

      .occupancy-v2-calendar-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:16px;box-shadow:var(--shadow)}
      .occupancy-v2-scroll{overflow-x:auto;padding-bottom:2px}
      .occupancy-v2-weekdays,.occupancy-v2-calendar{min-width:860px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
      .occupancy-v2-weekdays{margin-bottom:7px}
      .occupancy-v2-weekdays span{padding:0 8px;color:var(--muted);font-size:.59rem;font-weight:700;letter-spacing:.08em;text-align:center}
      .occupancy-v2-calendar{min-height:0}
      .occupancy-v2-day{box-sizing:border-box;min-height:88px;border:1px solid var(--border);border-radius:15px;background:var(--surface);color:var(--text);padding:10px 12px 9px;display:flex;flex-direction:column;align-items:stretch;text-align:left;overflow:hidden;transition:.16s ease}
      button.occupancy-v2-day{cursor:pointer}
      button.occupancy-v2-day:hover{border-color:color-mix(in srgb,var(--primary) 45%,var(--border));transform:translateY(-1px);box-shadow:0 8px 22px rgba(20,43,31,.07)}
      .occupancy-v2-day.weekend{background:color-mix(in srgb,var(--surface-2) 72%,var(--surface))}
      .occupancy-v2-day.today{border-color:var(--primary);box-shadow:inset 0 0 0 1px var(--primary)}
      .occupancy-v2-day.selected{background:var(--primary-soft);border-color:var(--primary)}
      .occupancy-v2-day-top{min-height:16px;display:flex;align-items:center;justify-content:space-between;gap:8px}
      .occupancy-v2-day-top strong{font-size:.76rem;line-height:1}
      .occupancy-v2-today{font-size:.48rem;font-weight:700;letter-spacing:.06em;color:var(--primary);text-transform:uppercase}
      .occupancy-v2-markers{flex:1;min-height:18px;padding:10px 0 5px;display:flex;align-items:center;align-content:center;gap:4px;flex-wrap:wrap}
      .occupancy-v2-markers small{font-size:.48rem;color:var(--muted);margin-left:2px}
      .occupancy-v2-flows{min-height:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .occupancy-v2-flow{display:inline-flex;align-items:center;gap:3px;font-size:.48rem;font-weight:600;color:var(--muted);line-height:1.2}
      .occupancy-v2-flow i{font-size:.45rem}.occupancy-v2-flow.arrival{color:var(--primary)}
      .occupancy-v2-blank{min-height:88px;border:1px dashed transparent;background:transparent}
      .occupancy-v2-loading{grid-column:1/-1;min-height:350px;display:grid;place-items:center}

      body.occupancy-day-modal-open{overflow:hidden!important}
      .occupancy-day-modal-backdrop{position:fixed;z-index:220;inset:0;background:rgba(22,31,26,.36);backdrop-filter:blur(3px);display:grid;place-items:center;padding:24px}
      .occupancy-day-modal{width:min(720px,calc(100vw - 32px));max-height:min(78vh,720px);overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:24px;box-shadow:0 26px 70px rgba(22,31,26,.2)}
      .occupancy-day-modal-head{position:sticky;top:0;z-index:2;background:var(--surface);display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:20px 22px 16px;border-bottom:1px solid var(--border)}
      .occupancy-day-modal-head .eyebrow{display:block;margin-bottom:5px;color:var(--primary);font-size:.64rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
      .occupancy-day-modal-head h2{margin:0;font-size:1.2rem;line-height:1.2;color:var(--text)}
      .occupancy-day-modal-head p{margin:5px 0 0;color:var(--muted);font-size:.67rem}
      .occupancy-day-modal-close{width:40px;height:40px;flex:0 0 40px;border:1px solid var(--border);border-radius:13px;background:var(--surface);color:var(--text);display:grid;place-items:center;cursor:pointer}
      .occupancy-day-modal-close:hover{background:var(--surface-2)}
      .occupancy-day-modal-body{padding:16px 22px 22px;display:grid;gap:9px}
      .occupancy-day-modal-guest{border:1px solid var(--border);border-radius:16px;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--surface)}
      .occupancy-day-modal-main{min-width:0}
      .occupancy-day-modal-main strong{display:block;font-size:.74rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .occupancy-day-modal-main span{display:block;margin-top:4px;color:var(--muted);font-size:.6rem;line-height:1.45}
      .occupancy-day-modal-badges{display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap}
      .occupancy-day-modal-badge{border-radius:999px;padding:5px 8px;font-size:.5rem;font-weight:700;background:var(--surface-2);color:var(--muted);white-space:nowrap}
      .occupancy-day-modal-badge.arrival{background:var(--primary-soft);color:var(--primary)}
      .occupancy-day-modal-badge.departure{color:var(--text)}
      .occupancy-day-modal-empty{min-height:110px;display:grid;place-items:center;color:var(--muted);font-size:.68rem;text-align:center}

      @media(max-width:1023px){
        .occupancy-v2-head{grid-template-columns:1fr;align-items:start;gap:16px}
        .occupancy-v2-controls{grid-template-columns:1fr;grid-template-areas:"unit" "month" "legend";gap:8px}
        .occupancy-v2-unit-options,.occupancy-v2-month{width:100%;box-sizing:border-box}
        .occupancy-v2-unit{flex:1}.occupancy-v2-month strong{flex:1}.occupancy-v2-legend{justify-content:center}
        .occupancy-v2-metrics{grid-template-columns:1fr}
        .occupancy-day-modal-backdrop{padding:12px}
        .occupancy-day-modal{width:min(100%,680px);max-height:84vh}
        .occupancy-day-modal-head{padding:18px}.occupancy-day-modal-body{padding:14px 18px 18px}
        .occupancy-day-modal-guest{align-items:flex-start;flex-direction:column}.occupancy-day-modal-badges{justify-content:flex-start}
      }
    `;
    document.head.appendChild(style);
  }

  function month(){return String(state.occupancyScreenMonth||_oleiroToday.slice(0,7))}
  function monthParts(){const [year,value]=month().split('-').map(Number);return {year,monthIndex:Math.max(0,(value||1)-1)}}
  function monthTitle(){const {year,monthIndex}=monthParts(),locale=typeof currentLocale==='function'?currentLocale():'pt-BR',text=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(new Date(year,monthIndex,1,12));return text.charAt(0).toUpperCase()+text.slice(1)}
  function weekdays(){const locale=typeof currentLocale==='function'?currentLocale():'pt-BR',sunday=new Date(2021,7,1,12);return Array.from({length:7},(_,i)=>{const d=new Date(sunday);d.setDate(sunday.getDate()+i);return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d).replace('.','').slice(0,3).toUpperCase()})}
  function units(){const rows=Array.isArray(state.occupancyUnits)&&state.occupancyUnits.length?state.occupancyUnits:(window.OleiroDemoDB?.units||[]);return rows.filter(row=>row&&row.active!==false)}
  function unitId(){const rows=units(),current=String(state.occupancyUnitId||'rodeio');return rows.some(row=>String(row.id)===current)?current:String(rows[0]?.id||'rodeio')}
  function source(){return Array.isArray(state.occupancyCandidates)?state.occupancyCandidates:[]}
  function peopleCount(rows){return (rows||[]).reduce((sum,row)=>sum+Math.max(1,Number(row.participantCount)||row.participantNames?.length||1),0)}
  function peopleForDate(iso,rows=source()){return (rows||[]).filter(row=>row.status==='approved'&&!row.inactive&&row.from&&row.to&&row.from<=iso&&row.to>=iso)}
  function flowCount(rows,field,iso){return peopleCount((rows||[]).filter(row=>String(row?.[field]||'').slice(0,10)===iso))}
  function selectedDate(){const currentMonth=month(),selected=String(state.occupancySelectedDate||'').slice(0,10);if(selected.startsWith(currentMonth))return selected;if(String(_oleiroToday).startsWith(currentMonth))return _oleiroToday;return `${currentMonth}-01`}

  function markers(rows){
    const out=[];
    (rows||[]).forEach(row=>{
      const count=Math.max(1,Number(row.participantCount)||row.participantNames?.length||1),genders=Array.isArray(row.participantGenders)&&row.participantGenders.length?row.participantGenders:['male'];
      if(row.type==='couple'||count>1){out.push('<span class="occupancy-v2-dot couple" title="Casal"></span>');return}
      genders.forEach(gender=>out.push(`<span class="occupancy-v2-dot ${String(gender)==='female'?'female':'male'}" title="${String(gender)==='female'?'Mulher':'Homem'}"></span>`));
    });
    const visible=out.slice(0,9),extra=Math.max(0,out.length-visible.length);
    return visible.join('')+(extra?`<small>+${extra}</small>`:'');
  }

  function cells(){
    const {year,monthIndex}=monthParts(),first=new Date(year,monthIndex,1,12),last=new Date(year,monthIndex+1,0,12),rows=source(),selected=selectedDate(),out=[];
    for(let i=0;i<first.getDay();i++)out.push('<span class="occupancy-v2-day occupancy-v2-blank" aria-hidden="true"></span>');
    for(let day=1;day<=last.getDate();day++){
      const iso=`${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,people=peopleForDate(iso,rows),count=peopleCount(people),arrivals=flowCount(rows,'from',iso),departures=flowCount(rows,'to',iso),weekday=new Date(`${iso}T12:00:00`).getDay(),weekend=weekday===0||weekday===6;
      out.push(`<button class="occupancy-v2-day ${weekend?'weekend':''} ${iso===_oleiroToday?'today':''} ${iso===selected?'selected':''}" type="button" onclick="selectOccupancyDay('${iso}')" aria-label="${count} ${count===1?'pessoa':'pessoas'} em ${iso}"><div class="occupancy-v2-day-top"><strong>${day}</strong>${iso===_oleiroToday?'<span class="occupancy-v2-today">Hoje</span>':''}</div><div class="occupancy-v2-markers">${count?markers(people):''}</div><div class="occupancy-v2-flows">${arrivals?`<span class="occupancy-v2-flow arrival" title="${arrivals} ${arrivals===1?'chegada':'chegadas'}"><i class="fa-solid fa-arrow-right-to-bracket"></i>${arrivals} ${arrivals===1?'chega':'chegam'}</span>`:''}${departures?`<span class="occupancy-v2-flow departure" title="${departures} ${departures===1?'saída':'saídas'}"><i class="fa-solid fa-arrow-right-from-bracket"></i>${departures} ${departures===1?'sai':'saem'}</span>`:''}</div></button>`);
    }
    return out.join('');
  }

  function metric(icon,value,label){return `<div class="occupancy-v2-metric"><span class="occupancy-v2-metric-icon"><i class="fa-solid ${icon}"></i></span><div><strong>${value}</strong><p>${label}</p></div></div>`}
  function metrics(){
    const rows=source(),todayRows=Array.isArray(state.occupancyTodayCandidates)?state.occupancyTodayCandidates:rows,currentMonth=month();
    return {
      today:peopleCount(peopleForDate(_oleiroToday,todayRows)),
      arrivals:peopleCount(rows.filter(row=>String(row.from||'').slice(0,7)===currentMonth)),
      departures:peopleCount(rows.filter(row=>String(row.to||'').slice(0,7)===currentMonth))
    };
  }
  function longDate(iso){const date=new Date(`${iso}T12:00:00`),locale=typeof currentLocale==='function'?currentLocale():'pt-BR',text=new Intl.DateTimeFormat(locale,{weekday:'long',day:'2-digit',month:'long'}).format(date);return text.charAt(0).toUpperCase()+text.slice(1)}
  function guest(row,iso){
    const names=(row.participantNames||[]).filter(Boolean),name=names.join(' + ')||row.name||'Voluntário',count=Math.max(1,Number(row.participantCount)||names.length||1),meta=[row.unitName||row.unit||'Unidade não informada',`${formatDate(row.from)} → ${formatDate(row.to)}`];
    if(count>1)meta.push(`${count} pessoas`);
    const arrival=String(row.from||'').slice(0,10)===iso,departure=String(row.to||'').slice(0,10)===iso;
    return `<div class="occupancy-day-modal-guest"><div class="occupancy-day-modal-main"><strong>${esc(name)}</strong><span>${esc(meta.join(' · '))}</span></div><div class="occupancy-day-modal-badges">${arrival?'<span class="occupancy-day-modal-badge arrival"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegada</span>':''}${departure?'<span class="occupancy-day-modal-badge departure"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saída</span>':''}</div></div>`;
  }
  function unitSelector(){
    const current=unitId(),rows=units();
    return `<div class="occupancy-v2-unit-options" role="group" aria-label="Unidade">${rows.map(row=>`<button class="occupancy-v2-unit ${String(row.id)===current?'active':''}" type="button" aria-pressed="${String(row.id)===current?'true':'false'}" onclick="selectOccupancyUnit('${esc(String(row.id))}')">${esc(row.name||row.id)}</button>`).join('')}</div>`;
  }
  function legend(){return `<div class="occupancy-v2-legend"><span><i class="occupancy-v2-dot"></i>Homem</span><span><i class="occupancy-v2-dot female"></i>Mulher</span><span><i class="occupancy-v2-dot couple"></i>Casal</span></div>`}

  function html(){
    const loading=state.occupancyScreenLoading===true,data=metrics();
    return `<section class="occupancy-page-screen occupancy-v2 compact-page-top">
      <header class="occupancy-v2-head">
        <div class="occupancy-v2-copy"><span class="eyebrow">Ocupação</span><h1>Ocupação da Casa</h1><p>Veja rapidamente quantas pessoas estarão hospedadas, quem chega e quem sai.</p></div>
        <div class="occupancy-v2-controls">
          ${unitSelector()}
          <div class="occupancy-v2-month"><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(-1)" aria-label="Mês anterior"><i class="fa-solid fa-chevron-left"></i></button><strong>${esc(monthTitle())}</strong><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(1)" aria-label="Próximo mês"><i class="fa-solid fa-chevron-right"></i></button></div>
          ${legend()}
        </div>
      </header>
      ${state.occupancyScreenError?`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${esc(state.occupancyScreenError)}</div></div>`:''}
      <div class="occupancy-v2-metrics">${metric('fa-house-user',data.today,'Hospedados hoje')}${metric('fa-arrow-right-to-bracket',data.arrivals,'Chegadas no mês')}${metric('fa-arrow-right-from-bracket',data.departures,'Saídas no mês')}</div>
      <section class="occupancy-v2-calendar-card"><div class="occupancy-v2-scroll"><div class="occupancy-v2-weekdays">${weekdays().map(day=>`<span>${esc(day)}</span>`).join('')}</div><div class="occupancy-v2-calendar">${loading?'<div class="empty occupancy-v2-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando ocupação...</div>':cells()}</div></div></section>
    </section>`;
  }

  function renderPage(){
    const old=document.querySelector('.occupancy-page-screen');
    if(!old)return;
    const holder=document.createElement('div');holder.innerHTML=html();old.replaceWith(holder.firstElementChild);
    if(typeof applyI18n==='function')applyI18n(document.querySelector('.occupancy-v2'));
  }

  function closeDayPopup(){
    document.getElementById('occupancyDayModal')?.remove();
    document.body.classList.remove('occupancy-day-modal-open');
  }
  function openDayPopup(iso){
    closeDayPopup();
    const rows=peopleForDate(iso),count=peopleCount(rows),root=document.createElement('div');
    root.id='occupancyDayModal';
    root.className='occupancy-day-modal-backdrop';
    root.setAttribute('role','presentation');
    root.onclick=event=>{if(event.target===root)closeDayPopup()};
    root.innerHTML=`<section class="occupancy-day-modal" role="dialog" aria-modal="true" aria-labelledby="occupancyDayModalTitle">
      <header class="occupancy-day-modal-head"><div><span class="eyebrow">Detalhes do dia</span><h2 id="occupancyDayModalTitle">${esc(longDate(iso))}</h2><p>${count} ${count===1?'pessoa hospedada':'pessoas hospedadas'}</p></div><button class="occupancy-day-modal-close" type="button" onclick="closeOccupancyDayPopup()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></header>
      <div class="occupancy-day-modal-body">${rows.length?rows.map(row=>guest(row,iso)).join(''):'<div class="occupancy-day-modal-empty">Nenhum voluntário hospedado neste dia.</div>'}</div>
    </section>`;
    document.body.appendChild(root);
    document.body.classList.add('occupancy-day-modal-open');
    requestAnimationFrame(()=>root.querySelector('.occupancy-day-modal-close')?.focus());
  }

  async function loadData(){
    const services=window.OleiroServices;
    if(!services?.applications?.listOccupancyMonth)throw new Error('Serviço de ocupação indisponível.');
    let rows=units();
    if(services.units?.list){try{rows=await services.units.list({includeInactive:false})||rows}catch(error){console.warn('Não foi possível atualizar as unidades da ocupação:',error)}}
    state.occupancyUnits=rows;state.occupancyUnitId=unitId();
    const currentMonth=month(),todayMonth=String(_oleiroToday).slice(0,7),currentUnit=state.occupancyUnitId;
    const monthPromise=services.applications.listOccupancyMonth(currentMonth,{unitId:currentUnit});
    const todayPromise=todayMonth===currentMonth?monthPromise:services.applications.listOccupancyMonth(todayMonth,{unitId:currentUnit});
    const [monthRows,todayRows]=await Promise.all([monthPromise,todayPromise]);
    state.occupancyCandidates=monthRows||[];state.occupancyTodayCandidates=todayRows||[];
  }
  async function refresh(){
    closeDayPopup();
    state.occupancyScreenError='';state.occupancyScreenLoading=true;window.render();
    try{await loadData()}catch(error){console.error('Falha ao carregar ocupação:',error);state.occupancyCandidates=[];state.occupancyTodayCandidates=[];state.occupancyScreenError=error?.message||'Não foi possível carregar a ocupação.'}
    finally{state.occupancyScreenLoading=false;window.render()}
  }

  window.closeOccupancyDayPopup=closeDayPopup;
  window.selectOccupancyDay=function(iso){
    iso=String(iso||'').slice(0,10);if(!iso)return;
    state.occupancySelectedDate=iso;
    window.render();
    openDayPopup(iso);
  };
  window.selectOccupancyUnit=function(next){next=String(next||'');if(!next||next===unitId())return;state.occupancyUnitId=next;return refresh()};
  window.openManagerOccupancy=function(){state.managerPage='occupancy';state.occupancyScreenMonth=month();state.occupancySelectedDate=selectedDate();if(typeof afterNavigation==='function')afterNavigation();return refresh()};
  window.shiftOccupancyMonth=function(delta){const {year,monthIndex}=monthParts(),date=new Date(year,monthIndex+Number(delta||0),1,12);state.occupancyScreenMonth=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;state.occupancySelectedDate=String(_oleiroToday).startsWith(state.occupancyScreenMonth)?_oleiroToday:`${state.occupancyScreenMonth}-01`;return refresh()};

  window.renderManager=function(){
    const result=baseRenderManager();
    if(state.role==='manager'&&state.managerPage==='occupancy')renderPage();
    else closeDayPopup();
    return result;
  };
  window.render=function(){return window.renderManager()};

  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById('occupancyDayModal'))closeDayPopup()});
  installStyles();
  if(state.role==='manager'&&state.managerPage==='occupancy')window.render();
})();
