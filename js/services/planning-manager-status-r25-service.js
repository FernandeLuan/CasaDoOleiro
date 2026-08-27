/* Round 25 — confirmação da gestão durante candidatura não entra na Agenda antes da decisão final. */
(function planningManagerStatusR25(){
  const planning=window.OleiroServices?.planning;if(!planning?.saveActivity)return;
  const base=planning.saveActivity.bind(planning);
  planning.saveActivity=function(args={}){
    if(args.managerCreated===true&&args.sessionStatus==='confirmed')return base({...args,sessionStatus:'proposed'});
    return base(args);
  };
})();
