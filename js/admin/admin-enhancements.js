const OLEIRO_GENDER_BY_NAME={
  'Thomas Miller':'male',
  'Maria Gómez':'female',
  'Daniel Costa':'male',
  'Sophie Martin':'female',
  'Lucas García':'male',
  'Alex Brown':'male'
};

function managerMenu(){
  return `<section class="section menu-page-clean"><div class="menu-list">
    ${menuLink('fa-language','Idioma','Português, English ou Español',"openLanguageModal()")}
    ${menuLink('fa-calendar-days','Ocupação mensal','Próximos 30 dias por voluntário',"openOccupancyCalendar()")}
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
function occupancyPeopleOnDate(iso){
  return state.candidates.filter(p=>p.status==='approved'&&!p.inactive&&p.from<=iso&&p.to>=iso);
}
function occupancyDayLabel(iso){
  const d=occupancyDate(iso);
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d).replace('.','').toUpperCase();
}
function occupancyMonthLabel(iso){
  const d=occupancyDate(iso);
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  return new Intl.DateTimeFormat(locale,{day:'numeric',month:'long'}).format(d);
}
function occupancyDots(people){
  if(!people.length)return '<span class="occupancy-empty-dot">—</span>';
  return people.map(p=>`<span class="occupancy-dot ${occupancyGender(p)}" title="${p.name}"><i></i></span>`).join('');
}
function openOccupancyCalendar(){
  const start=occupancyDate(_oleiroToday);
  const days=Array.from({length:30},(_,i)=>{
    const d=new Date(start);d.setDate(start.getDate()+i);return occupancyIso(d);
  });
  const cells=days.map(iso=>{
    const people=occupancyPeopleOnDate(iso);
    const d=occupancyDate(iso);
    return `<button class="occupancy-day ${iso===_oleiroToday?'today':''} ${people.length?'has-people':''}" type="button" onclick="openOccupancyDay('${iso}')">
      <span class="occupancy-week">${occupancyDayLabel(iso)}</span>
      <strong>${d.getDate()}</strong>
      <span class="occupancy-dots">${occupancyDots(people)}</span>
    </button>`;
  }).join('');
  openModal('Ocupação • próximos 30 dias','Voluntários com estadia aprovada em cada data.',`
    <div class="occupancy-section">
      <div class="occupancy-legend"><span><i class="legend-dot male"></i>Homens</span><span><i class="legend-dot female"></i>Mulheres</span></div>
      <div class="occupancy-calendar">${cells}</div>
    </div>`);
  modalRoot.querySelector('.modal')?.classList.add('occupancy-modal');
}
function openOccupancyDay(iso){
  const people=occupancyPeopleOnDate(iso);
  const list=people.length?people.map(p=>`<div class="occupancy-person"><span class="occupancy-person-dot ${occupancyGender(p)}"></span><div><strong>${p.name}</strong><small>${p.country} • ${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</small></div></div>`).join(''):'<div class="empty">Nenhum voluntário hospedado nesta data.</div>';
  openModal(occupancyMonthLabel(iso),'Voluntários hospedados',`<div class="occupancy-person-list">${list}</div><button class="btn btn-outline btn-block" style="margin-top:12px" type="button" onclick="openOccupancyCalendar()"><i class="fa-solid fa-arrow-left"></i>Voltar ao calendário</button>`);
  modalRoot.querySelector('.modal')?.classList.add('occupancy-modal');
}
