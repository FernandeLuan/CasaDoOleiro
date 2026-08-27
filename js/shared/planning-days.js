/* Regra única de dias elegíveis para atividades: somente dias úteis entre chegada e saída. */
(function initPlanningDays(){
  function iso(value){
    if(!value)return '';
    if(typeof value==='string')return value.slice(0,10);
    if(typeof value?.toDate==='function')return value.toDate().toISOString().slice(0,10);
    return '';
  }
  function add(value,days){const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
  function weekday(value){const date=iso(value);if(!date)return false;const day=new Date(`${date}T12:00:00`).getDay();return day!==0&&day!==6}

  window.isPlanningWeekday=weekday;
  window.isPlanningEligibleDate=function(date,start,end){
    const value=iso(date),from=iso(start),to=iso(end);
    return !!value&&!!from&&!!to&&value>from&&value<to&&weekday(value);
  };
  window.planningEligibleDates=function(start,end){
    const from=iso(start),to=iso(end),rows=[];
    if(!from||!to||from>=to)return rows;
    for(let current=add(from,1),guard=0;current<to&&guard<370;current=add(current,1),guard++)if(weekday(current))rows.push(current);
    return rows;
  };
  window.planningEligibleDatesFor=function(record={}){
    return window.planningEligibleDates(record.stayStart||record.from||'',record.stayEnd||record.to||'');
  };
  window.nextPlanningWeekday=function(date,direction=1){
    let current=iso(date),step=Number(direction)<0?-1:1;if(!current)return '';
    for(let i=0;i<14;i++){current=add(current,step);if(weekday(current))return current}
    return current;
  };
})();
