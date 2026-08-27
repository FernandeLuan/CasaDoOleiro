/* Ocupação mensal independente da página atual de voluntários. */
(function occupancyData(){
  const baseOpenOccupancyCalendar=openOccupancyCalendar;
  state.occupancyCandidates=state.occupancyCandidates||[];
  state.occupancyLoadedMonth=state.occupancyLoadedMonth||null;
  state.occupancyLoading=false;

  occupancyPeopleOnDate=function(iso){return (state.occupancyCandidates||[]).filter(p=>p.status==='approved'&&!p.inactive&&p.from&&p.to&&p.from<=iso&&p.to>=iso)};
  openOccupancyCalendar=async function(){
    const anchor=occupancyMonthAnchor(),month=`${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`;
    if(state.occupancyLoadedMonth===month&&!state.occupancyLoading)return baseOpenOccupancyCalendar();
    if(state.occupancyLoading)return;
    state.occupancyLoading=true;
    openModal('Ocupação mensal','Voluntários hospedados por dia.',`<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando ocupação...</div>`);
    try{state.occupancyCandidates=await window.OleiroServices.applications.listOccupancyMonth(month);state.occupancyLoadedMonth=month;baseOpenOccupancyCalendar()}
    catch(error){console.error(error);showToast(error?.message||'Não foi possível carregar a ocupação do mês.');closeModal()}
    finally{state.occupancyLoading=false}
  };
  window.occupancyPeopleOnDate=occupancyPeopleOnDate;window.openOccupancyCalendar=openOccupancyCalendar;
})();
