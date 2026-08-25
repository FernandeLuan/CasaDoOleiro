(function initOleiroLoading(){
  let active=0;
  function element(){return document.getElementById('globalLoading')}
  function show(){const el=element();if(el)el.hidden=false}
  function hide(){const el=element();if(el)el.hidden=true}
  async function run(task,delay=600){
    active+=1;
    let shown=false;
    const timer=setTimeout(()=>{if(active>0){shown=true;show()}},Math.max(0,Number(delay)||0));
    try{return await Promise.resolve().then(()=>typeof task==='function'?task():task)}
    finally{
      clearTimeout(timer);active=Math.max(0,active-1);
      if(active===0){if(shown)hide();else hide()}
    }
  }
  window.OleiroLoading={run,show,hide};
})();
