const OLEIRO_GENDER_BY_NAME={
  'Thomas Miller':'male','Maria Gómez':'female','Daniel Costa':'male','Sophie Martin':'female','Lucas García':'male','Alex Brown':'male'
};

function managerMenu(){
  return `<section class="section menu-page-clean"><div class="menu-list">
    ${menuLink('fa-language','Idioma','Português, English ou Español',"openLanguageModal()")}
    ${menuLink('fa-calendar-days','Ocupação mensal','Voluntários hospedados por mês',"openOccupancyCalendar()")}
    ${menuLink('fa-circle-info','Informações do portal','Conteúdo que candidatos e voluntários consultam',"openInfoEditor()")}
    ${menuLink('fa-building','Unidades','Rodeio ativa • Indaial preparada',"openUnits()")}
    ${menuLink('fa-user-shield','Gestores e acessos','Administradores e coordenadores',"openManagers()")}
    ${menuLink('fa-clock','Rotina-base','Horários de referência da comunidade',"openRoutine()")}
    ${menuLink('fa-user','Minha conta','Preferências e sessão',"showToast('Tela de conta entra na próxima etapa de backend.')")}
    ${menuLink('fa-right-from-bracket','Sair','Encerrar sessão neste dispositivo','logout()')}
  </div></section>`;
}

function occupancyDate(value){return new Date(`${value}T12:00:00`)}
function occupancyIso(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function occupancyGender(p){return p.gender||OLEIRO_GENDER_BY_NAME[p.name]||'other'}
function occupancyPeopleOnDate(iso){return state.candidates.filter(p=>p.status==='approved'&&!p.inactive&&p.from<=iso&&p.to>=iso)}
function occupancyMonthAnchor(){
  if(!state.occupancyMonthAnchor){
    const d=occupancyDate(_oleiroToday);d.setDate(1);state.occupancyMonthAnchor=occupancyIso(d);
  }
  return occupancyDate(state.occupancyMonthAnchor);
}
function occupancyMonthTitle(){
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  const text=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(occupancyMonthAnchor());
  return text.charAt(0).toUpperCase()+text.slice(1);
}
function occupancyWeekdayLabels(){
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  const sunday=new Date(2026,7,23,12);
  return Array.from({length:7},(_,i)=>{
    const d=new Date(sunday);d.setDate(sunday.getDate()+i);
    return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d).replace('.','').slice(0,3).toUpperCase();
  });
}
function shiftOccupancyMonth(delta){
  const d=occupancyMonthAnchor();d.setMonth(d.getMonth()+delta,1);state.occupancyMonthAnchor=occupancyIso(d);openOccupancyCalendar();
}
function occupancyDots(people){
  if(!people.length)return '';
  const max=5,shown=people.slice(0,max);
  return shown.map(p=>`<i class="occupancy-person-dot ${occupancyGender(p)}" title="${p.name}"></i>`).join('')+(people.length>max?`<small>+${people.length-max}</small>`:'');
}
function openOccupancyCalendar(){
  const month=occupancyMonthAnchor();
  const year=month.getFullYear(),monthIndex=month.getMonth();
  const first=new Date(year,monthIndex,1,12),last=new Date(year,monthIndex+1,0,12);
  const leading=first.getDay();
  const cells=[];
  for(let i=0;i<leading;i++)cells.push('<span class="occupancy-day occupancy-blank" aria-hidden="true"></span>');
  for(let day=1;day<=last.getDate();day++){
    const d=new Date(year,monthIndex,day,12),iso=occupancyIso(d),people=occupancyPeopleOnDate(iso);
    cells.push(`<button class="occupancy-day ${iso===_oleiroToday?'today':''} ${people.length?'has-people':''}" type="button" onclick="openOccupancyDay('${iso}')"><strong>${day}</strong><span class="occupancy-dots">${occupancyDots(people)}</span></button>`);
  }
  openModal('Ocupação mensal','Voluntários hospedados por dia.',`<div class="occupancy-section">
    <div class="occupancy-month-nav"><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(-1)" aria-label="Mês anterior"><i class="fa-solid fa-chevron-left"></i></button><strong>${occupancyMonthTitle()}</strong><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(1)" aria-label="Próximo mês"><i class="fa-solid fa-chevron-right"></i></button></div>
    <div class="occupancy-legend"><span><i class="legend-dot male"></i>Homens</span><span><i class="legend-dot female"></i>Mulheres</span></div>
    <div class="occupancy-weekdays">${occupancyWeekdayLabels().map(x=>`<span>${x}</span>`).join('')}</div>
    <div class="occupancy-calendar">${cells.join('')}</div>
  </div>`);
  modalRoot.querySelector('.modal')?.classList.add('occupancy-modal');
}
function occupancyDayTitle(iso){
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  return new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric'}).format(occupancyDate(iso));
}
function openOccupancyDay(iso){
  const people=occupancyPeopleOnDate(iso);
  const list=people.length?people.map(p=>`<div class="occupancy-person"><span class="occupancy-person-dot ${occupancyGender(p)}"></span><div><strong>${p.name}</strong><small>${p.country} • ${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</small></div></div>`).join(''):'<div class="empty">Nenhum voluntário hospedado nesta data.</div>';
  openModal(occupancyDayTitle(iso),'Voluntários hospedados',`<div class="occupancy-person-list">${list}</div>`,`<button class="btn btn-outline btn-block" type="button" onclick="openOccupancyCalendar()"><i class="fa-solid fa-arrow-left"></i>Voltar ao calendário</button>`);
  modalRoot.querySelector('.modal')?.classList.add('occupancy-modal');
}
