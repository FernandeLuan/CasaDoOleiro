/* Ocupação compacta na Home do Admin.
   Consulta somente o mês/unidade visíveis e reutiliza o cache do application-service. */
(function managerHomeOccupancy(){
  if(!/\/admin\//.test(location.pathname))return;

  const UNIT_KEY='oleiro.admin.home-occupancy-unit.v1';
  const allowedUnits=['rodeio','indaial'];
  function visibleUnits(){
    const scope=window.OleiroServices?.accessScope;
    if(scope?.isActivityAssistant?.()){
      const unit=String(scope.unitId?.()||'rodeio').toLowerCase();
      return [allowedUnits.includes(unit)?unit:'rodeio'];
    }
    return allowedUnits;
  }
  let requestSerial=0;
  let swipeStart=null;

  function storedUnit(){
    try{
      const value=String(localStorage.getItem(UNIT_KEY)||'').toLowerCase();
      const units=visibleUnits();return units.includes(value)?value:units[0];
    }catch{return visibleUnits()[0]}
  }
  function ensureState(){
    if(!window.state)return;
    const units=visibleUnits();if(!units.includes(String(state.homeOccupancyUnit||'').toLowerCase()))state.homeOccupancyUnit=storedUnit();
    if(!/^\d{4}-\d{2}$/.test(String(state.homeOccupancyMonth||'')))state.homeOccupancyMonth=String(_oleiroToday).slice(0,7);
    if(!Array.isArray(state.homeOccupancyRows))state.homeOccupancyRows=[];
    if(typeof state.homeOccupancyLoading!=='boolean')state.homeOccupancyLoading=true;
    if(typeof state.homeOccupancyError!=='string')state.homeOccupancyError='';
    if(typeof state.homeOccupancyLoadedKey!=='string')state.homeOccupancyLoadedKey='';
  }
  function monthParts(value=state.homeOccupancyMonth){
    const [year,month]=String(value||'').split('-').map(Number);
    return {year:year||new Date().getFullYear(),monthIndex:Math.max(0,Math.min(11,(month||1)-1))};
  }
  function isoMonth(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
  function shiftMonthValue(value,delta){
    const {year,monthIndex}=monthParts(value),date=new Date(year,monthIndex+Number(delta||0),1,12);
    return isoMonth(date);
  }
  function monthLabel(value){
    const {year,monthIndex}=monthParts(value),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
    const month=new Intl.DateTimeFormat(locale,{month:'long'}).format(new Date(year,monthIndex,1,12));
    const text=`${month} ${year}`;
    return text.charAt(0).toUpperCase()+text.slice(1);
  }
  function monthOptions(){
    const selected=state.homeOccupancyMonth,{year,monthIndex}=monthParts(selected),rows=[];
    for(let offset=-12;offset<=12;offset++){
      const date=new Date(year,monthIndex+offset,1,12),value=isoMonth(date);
      rows.push(`<option value="${value}" ${value===selected?'selected':''}>${monthLabel(value)}</option>`);
    }
    return rows.join('');
  }
  function weekdayLabels(){
    const locale=typeof currentLocale==='function'?currentLocale():'pt-BR',sunday=new Date(2021,7,1,12);
    return Array.from({length:7},(_,i)=>{
      const date=new Date(sunday);date.setDate(sunday.getDate()+i);
      return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(date).replace('.','').slice(0,3).toUpperCase();
    });
  }
  function peopleForDate(iso,source=state.homeOccupancyRows||[]){
    return source.filter(row=>row?.status==='approved'&&!row?.inactive&&row?.from&&row?.to&&String(row.from).slice(0,10)<=iso&&String(row.to).slice(0,10)>=iso);
  }
  function guestCount(rows){
    return (rows||[]).reduce((sum,row)=>sum+Math.max(1,Number(row.participantCount)||row.participantNames?.length||1),0);
  }
  function markerClass(row){
    const count=Math.max(1,Number(row?.participantCount)||row?.participantNames?.length||1);
    if(row?.type==='couple'||count>1)return 'couple';
    const gender=String(row?.participantGenders?.[0]||row?.gender||'').toLowerCase();
    return gender==='female'?'female':'male';
  }
  function markers(rows){
    const dots=[];
    (rows||[]).forEach(row=>{
      const count=Math.max(1,Number(row?.participantCount)||row?.participantNames?.length||1);
      if(row?.type==='couple'||count>1){dots.push('<i class="home-occ-dot couple"></i>');return}
      dots.push(`<i class="home-occ-dot ${markerClass(row)}"></i>`);
    });
    const shown=dots.slice(0,5),extra=Math.max(0,dots.length-shown.length);
    return shown.join('')+(extra?`<small>+${extra}</small>`:'');
  }
  function dayCells(){
    const {year,monthIndex}=monthParts(),first=new Date(year,monthIndex,1,12),last=new Date(year,monthIndex+1,0,12),cells=[];
    for(let i=0;i<first.getDay();i++)cells.push('<span class="home-occ-day blank" aria-hidden="true"></span>');
    for(let day=1;day<=last.getDate();day++){
      const iso=`${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const people=peopleForDate(iso),count=guestCount(people);
      cells.push(`<button class="home-occ-day ${iso===_oleiroToday?'today':''} ${count?'occupied':''}" type="button" onclick="openHomeOccupancyDay('${iso}')" aria-label="${count} ${count===1?'pessoa':'pessoas'} em ${iso}">
        <span class="home-occ-day-number">${day}</span>
        <span class="home-occ-markers">${count?markers(people):''}</span>
      </button>`);
    }
    return cells.join('');
  }
  function loadingCalendar(){
    return '<div class="home-occ-loading"><i class="fa-solid fa-circle-notch fa-spin"></i></div>';
  }
  function errorCalendar(){
    return '<div class="home-occ-loading"><span>Não foi possível carregar a ocupação.</span><button class="btn btn-soft" type="button" onclick="hydrateManagerHomeOccupancy({force:true})">Tentar novamente</button></div>';
  }
  function controls(){
    const unit=String(state.homeOccupancyUnit||visibleUnits()[0]),unitButtons=visibleUnits().map(id=>`<button type="button" class="${unit===id?'active':''}" aria-pressed="${unit===id}" onclick="setHomeOccupancyUnit('${id}')">${id.charAt(0).toUpperCase()+id.slice(1)}</button>`).join('');
    return `<div class="home-occ-controls">
      <div class="home-occ-units" role="group" aria-label="Unidade">${unitButtons}</div>
      <label class="home-occ-month" aria-label="Mês da ocupação">
        <span class="home-occ-month-label" aria-hidden="true">${monthLabel(state.homeOccupancyMonth)}</span>
        <select onchange="setHomeOccupancyMonth(this.value)" aria-label="Selecionar mês">${monthOptions()}</select>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </label>
    </div>`;
  }

  window.managerHomeOccupancyHtml=function(){
    ensureState();
    return `<section class="manager-home-card home-occ-card" data-home-occupancy>
      <div class="home-occ-head"><div><h2>Ocupação da Casa</h2></div>${controls()}</div>
      <div class="home-occ-weekdays">${weekdayLabels().map(label=>`<span>${label}</span>`).join('')}</div>
      <div class="home-occ-calendar" data-home-occ-swipe>
        ${state.homeOccupancyLoading?loadingCalendar():state.homeOccupancyError?errorCalendar():dayCells()}
      </div>
    </section>`;
  };

  window.hydrateManagerHomeOccupancy=async function({force=false}={}){
    ensureState();
    const key=`${state.homeOccupancyUnit}|${state.homeOccupancyMonth}`;
    if(!force&&state.homeOccupancyLoadedKey===key&&!state.homeOccupancyError)return state.homeOccupancyRows;
    const service=window.OleiroServices?.applications?.listOccupancyMonth;
    if(typeof service!=='function')return [];
    const serial=++requestSerial;
    state.homeOccupancyLoading=true;state.homeOccupancyError='';
    if(state.managerPage==='home'&&typeof render==='function')render();
    try{
      const rows=await service(state.homeOccupancyMonth,{unitId:state.homeOccupancyUnit});
      if(serial!==requestSerial)return rows;
      state.homeOccupancyRows=rows||[];state.homeOccupancyLoadedKey=key;state.homeOccupancyError='';
      return state.homeOccupancyRows;
    }catch(error){
      if(serial!==requestSerial)return [];
      console.error('Falha ao carregar ocupação da Home:',error);
      state.homeOccupancyRows=[];state.homeOccupancyError=error?.message||'Falha ao carregar ocupação.';
      return [];
    }finally{
      if(serial===requestSerial){
        state.homeOccupancyLoading=false;
        if(state.managerPage==='home'&&typeof render==='function')render();
      }
    }
  };

  window.setHomeOccupancyUnit=function(unit){
    ensureState();
    const normalized=String(unit||'').toLowerCase();
    if(!visibleUnits().includes(normalized)||normalized===state.homeOccupancyUnit)return;
    state.homeOccupancyUnit=normalized;state.homeOccupancyLoadedKey='';state.homeOccupancyRows=[];state.homeOccupancyError='';
    try{localStorage.setItem(UNIT_KEY,normalized)}catch{}
    window.hydrateManagerHomeOccupancy({force:true});
  };
  window.setHomeOccupancyMonth=function(month){
    ensureState();
    const normalized=String(month||'');
    if(!/^\d{4}-\d{2}$/.test(normalized)||normalized===state.homeOccupancyMonth)return;
    state.homeOccupancyMonth=normalized;state.homeOccupancyLoadedKey='';state.homeOccupancyRows=[];state.homeOccupancyError='';
    window.hydrateManagerHomeOccupancy({force:true});
  };
  window.shiftHomeOccupancyMonth=function(delta){
    ensureState();
    window.setHomeOccupancyMonth(shiftMonthValue(state.homeOccupancyMonth,delta));
  };
  window.openHomeOccupancyDay=function(iso){
    ensureState();
    const rows=peopleForDate(String(iso||'')),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
    const date=new Date(String(iso)+'T12:00:00');
    let title=new Intl.DateTimeFormat(locale,{weekday:'long',day:'2-digit',month:'long'}).format(date);
    title=title.charAt(0).toUpperCase()+title.slice(1);
    const body=rows.length?rows.map(row=>{
      const names=(row.participantNames||[]).filter(Boolean),name=names.join(' + ')||row.name||'Voluntário';
      const period=row.from&&row.to?`${fmtDate(String(row.from).slice(0,10),true)} → ${fmtDate(String(row.to).slice(0,10),true)}`:'Período não informado';
      const arrives=String(row.from||'').slice(0,10)===iso,departs=String(row.to||'').slice(0,10)===iso;
      return `<div class="home-occ-person"><span class="home-occ-person-dot ${markerClass(row)}"></span><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(period)}</small></div><div class="home-occ-person-flows">${arrives?'<span class="arrival">Chegada</span>':''}${departs?'<span>Saída</span>':''}</div></div>`;
    }).join(''):'<div class="empty">Nenhum voluntário hospedado neste dia.</div>';
    openModal(title,`${state.homeOccupancyUnit==='indaial'?'Indaial':'Rodeio'} · ${guestCount(rows)} ${guestCount(rows)===1?'pessoa':'pessoas'} hospedadas`,`<div class="home-occ-people">${body}</div>`);
  };

  document.addEventListener('touchstart',event=>{
    const calendar=event.target.closest?.('[data-home-occ-swipe]');
    if(!calendar)return;
    const touch=event.changedTouches?.[0];if(!touch)return;
    swipeStart={x:touch.clientX,y:touch.clientY};
  },{passive:true});
  document.addEventListener('touchend',event=>{
    if(!swipeStart)return;
    const calendar=event.target.closest?.('[data-home-occ-swipe]');
    const touch=event.changedTouches?.[0],start=swipeStart;swipeStart=null;
    if(!calendar||!touch)return;
    const dx=touch.clientX-start.x,dy=touch.clientY-start.y;
    if(Math.abs(dx)<55||Math.abs(dx)<=Math.abs(dy)*1.15)return;
    window.shiftHomeOccupancyMonth(dx<0?1:-1);
  },{passive:true});

  ensureState();
})();