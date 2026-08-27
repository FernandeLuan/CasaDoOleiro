/* Ocupação mensal independente da página atual de voluntários. */
(function occupancyData(){
  const OCCUPANCY_CACHE_MS=5*60*1000;
  const baseOpenOccupancyCalendar=openOccupancyCalendar;
  state.occupancyCandidates=state.occupancyCandidates||[];
  state.occupancyLoadedMonth=state.occupancyLoadedMonth||null;
  state.occupancyMonthCache=state.occupancyMonthCache||{};
  state.occupancyLoading=false;

  occupancyPeopleOnDate=function(iso){return (state.occupancyCandidates||[]).filter(p=>p.status==='approved'&&!p.inactive&&p.from&&p.to&&p.from<=iso&&p.to>=iso)};
  window.invalidateOccupancyCache=function(month=null){
    if(month)delete state.occupancyMonthCache[String(month)];else state.occupancyMonthCache={};
    if(!month||state.occupancyLoadedMonth===String(month)){state.occupancyLoadedMonth=null;state.occupancyCandidates=[]}
  };
  openOccupancyCalendar=async function(){
    const anchor=occupancyMonthAnchor(),month=`${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`,cached=state.occupancyMonthCache[month];
    if(cached&&Date.now()-cached.at<OCCUPANCY_CACHE_MS){state.occupancyCandidates=cached.rows||[];state.occupancyLoadedMonth=month;return baseOpenOccupancyCalendar()}
    if(state.occupancyLoading)return;
    state.occupancyLoading=true;
    openModal('Ocupação mensal','Voluntários hospedados por dia.',`<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando ocupação...</div>`);
    try{
      const rows=await window.OleiroServices.applications.listOccupancyMonth(month);
      state.occupancyCandidates=rows||[];state.occupancyLoadedMonth=month;state.occupancyMonthCache[month]={at:Date.now(),rows:state.occupancyCandidates};
      baseOpenOccupancyCalendar();
    }
    catch(error){console.error(error);showToast(error?.message||'Não foi possível carregar a ocupação do mês.');closeModal()}
    finally{state.occupancyLoading=false}
  };
  window.occupancyPeopleOnDate=occupancyPeopleOnDate;window.openOccupancyCalendar=openOccupancyCalendar;
})();
