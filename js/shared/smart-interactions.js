/* Smart Interactions — continuidade de navegação sem alterar regras de negócio. */
(function smartInteractions(){
  if(window.__OLEIRO_SMART_INTERACTIONS__)return;
  window.__OLEIRO_SMART_INTERACTIONS__=true;
  document.body.classList.add('ui-smart-interactions');
  window.OleiroUI=window.OleiroUI||{};

  const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  const scrollStorageKey='oleiro.ui.scroll.v1';
  const detailsStorageKey='oleiro.ui.details.v1';
  const parseStore=key=>{try{return JSON.parse(sessionStorage.getItem(key)||'{}')||{}}catch{return {}}};
  const saveStore=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
  let scrollStore=parseStore(scrollStorageKey);
  let detailsStore=parseStore(detailsStorageKey);
  let pendingMotion=null;
  let motionTimer=0;
  let modalGeneration=0;
  let previousFocus=null;
  const horizontalStorageKey='oleiro.ui.horizontal.v1';
  let horizontalStore=parseStore(horizontalStorageKey);

  function viewKey(){
    try{
      if(typeof state==='undefined')return location.pathname;
      if(state.role==='manager'){
        const page=String(state.managerPage||'home');
        if(page==='planning'&&state.managerPlanningPersonId)return 'manager:planning:'+String(state.managerPlanningPersonId)+':'+String(state.managerPlanningTab||'plan');
        return 'manager:'+page;
      }
      if(state.role==='volunteer')return 'volunteer:'+String(state.volunteerPage||'home')+':'+String(state.volunteerMode||'candidate');
    }catch{}
    return location.pathname;
  }

  function captureViewAnchor(){
    const selectors=['[data-session-id]','[data-plan-date]','[data-person-id]','.planning-candidate-list .list-item','.candidate-list .list-item'];
    const nodes=[...document.querySelectorAll(selectors.join(','))].filter(node=>{
      const rect=node.getBoundingClientRect();return rect.bottom>0&&rect.top<window.innerHeight;
    });
    if(!nodes.length)return null;
    nodes.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-92)-Math.abs(b.getBoundingClientRect().top-92));
    const node=nodes[0],rect=node.getBoundingClientRect();
    if(node.dataset.sessionId)return {type:'session',value:node.dataset.sessionId,offset:rect.top};
    if(node.dataset.planDate)return {type:'date',value:node.dataset.planDate,offset:rect.top};
    if(node.dataset.personId)return {type:'person',value:node.dataset.personId,offset:rect.top};
    return null;
  }
  function anchorNode(anchor){
    if(!anchor?.value)return null;
    if(anchor.type==='session')return document.querySelector(`[data-session-id="${CSS.escape(String(anchor.value))}"]`);
    if(anchor.type==='date')return document.querySelector(`[data-plan-date="${CSS.escape(String(anchor.value))}"]`);
    if(anchor.type==='person')return document.querySelector(`[data-person-id="${CSS.escape(String(anchor.value))}"]`);
    return null;
  }
  function restoreViewAnchor(anchor){
    if(!anchor)return false;
    const node=anchorNode(anchor);if(!node)return false;
    requestAnimationFrame(()=>{const delta=node.getBoundingClientRect().top-Number(anchor.offset||0);if(Math.abs(delta)>1)window.scrollBy({top:delta,left:0,behavior:'auto'})});
    return true;
  }
  function currentScroll(){
    const page=document.querySelector('#app main.page');
    return {windowY:Math.max(window.scrollY||0,document.documentElement.scrollTop||0,document.body.scrollTop||0),pageY:page?.scrollTop||0,anchor:captureViewAnchor()};
  }
  function saveCurrentScroll(key=viewKey()){
    scrollStore[key]=currentScroll();
    saveStore(scrollStorageKey,scrollStore);
  }
  function restoreScroll(key=viewKey()){
    const saved=scrollStore[key];if(!saved)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(saved.anchor&&restoreViewAnchor(saved.anchor))return;
      const page=document.querySelector('#app main.page');
      if(page&&saved.pageY>0)page.scrollTop=saved.pageY;
      window.scrollTo({top:saved.windowY||0,left:0,behavior:'auto'});
      document.documentElement.scrollTop=saved.windowY||0;
      document.body.scrollTop=saved.windowY||0;
    }));
  }

  const horizontalSelector='.tabs,.calendar-strip,.planning-profile-tabs,.bottom-nav';
  function horizontalKey(node,index=0){const cls=[...node.classList].filter(Boolean).slice(0,3).join('.');return viewKey()+'::'+node.tagName.toLowerCase()+'.'+cls+'::'+index}
  function rememberHorizontalScrolls(){
    [...document.querySelectorAll(horizontalSelector)].forEach((node,index)=>{if(node.scrollLeft>0)horizontalStore[horizontalKey(node,index)]=node.scrollLeft});
    saveStore(horizontalStorageKey,horizontalStore);
  }
  function restoreHorizontalScrolls(){
    requestAnimationFrame(()=>[...document.querySelectorAll(horizontalSelector)].forEach((node,index)=>{const value=Number(horizontalStore[horizontalKey(node,index)]||0);if(value>0)node.scrollLeft=value}));
  }

  function animationTarget(scope){
    if(scope==='content')return document.querySelector('.planning-page-content');
    return document.querySelector('#app main.page>.section')||document.querySelector('#app main.page')||document.querySelector('#app .page');
  }
  function playMotion(direction='forward',scope='page'){
    if(reducedMotion())return;
    const target=animationTarget(scope);if(!target)return;
    target.classList.remove('ui-page-motion','ui-enter-forward','ui-enter-back','ui-enter-tab-forward','ui-enter-tab-back');
    void target.offsetWidth;
    const cls=scope==='content'?(direction==='back'?'ui-enter-tab-back':'ui-enter-tab-forward'):(direction==='back'?'ui-enter-back':'ui-enter-forward');
    target.classList.add('ui-page-motion',cls);
    window.clearTimeout(motionTimer);
    motionTimer=window.setTimeout(()=>target.classList.remove('ui-page-motion',cls),540);
  }
  function scheduleMotion(){
    const snapshot=pendingMotion;if(!snapshot)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(pendingMotion!==snapshot)return;
      pendingMotion=null;
      playMotion(snapshot.direction,snapshot.scope);
      restoreScroll(viewKey());
    }));
  }
  function beginNavigation(direction='forward',scope='page'){
    saveCurrentScroll();
    pendingMotion={direction,scope,started:Date.now()};
  }

  function wrap(name,planner){
    const base=window[name];if(typeof base!=='function'||base.__smartWrapped)return;
    const wrapped=function(...args){
      const plan=planner?.(...args)||{direction:'forward',scope:'page'};
      if(plan.noop)return;
      if(plan.skipMotion){
        pendingMotion=null;
        return base.apply(this,args);
      }
      beginNavigation(plan.direction||'forward',plan.scope||'page');
      let result;
      try{result=base.apply(this,args)}catch(error){pendingMotion=null;throw error}
      if(plan.waitForSettle&&result&&typeof result.then==='function'){
        return Promise.resolve(result).then(value=>{scheduleMotion();return value},error=>{pendingMotion=null;throw error});
      }
      scheduleMotion();
      return result;
    };
    wrapped.__smartWrapped=true;wrapped.__smartBase=base;window[name]=wrapped;
  }

  const managerOrder=['home','volunteer','planning','agenda','occupancy','groups','houseInfo','menu'];
  const volunteerOrder=['home','plan','agenda','stay','info','profile','menu'];
  const directionFor=(order,current,next)=>{
    const a=order.indexOf(String(current||'')),b=order.indexOf(String(next||''));
    if(a<0||b<0)return 'forward';return b<a?'back':'forward';
  };

  wrap('navigateManager',page=>{
    const current=typeof state!=='undefined'?String(state.managerPage||'home'):'';return current===String(page||'home')?{noop:true}:{direction:directionFor(managerOrder,current,page),scope:'page'}
  });
  wrap('navigateVolunteer',page=>{
    const current=typeof state!=='undefined'?String(state.volunteerPage||'home'):'';return current===String(page||'home')?{noop:true}:{direction:directionFor(volunteerOrder,current,page),scope:'page'}
  });
  wrap('goHome',()=>((state.role==='manager'?state.managerPage:state.volunteerPage)==='home'?{noop:true}:{direction:'back',scope:'page'}));
  wrap('openManagerOccupancy',()=>{
    const current=typeof state!=='undefined'?String(state.managerPage||''):'';
    return current==='occupancy'?{noop:true}:{direction:'forward',scope:'page'};
  });
  wrap('openHouseInfo',()=>({direction:'forward',scope:'page'}));
  wrap('closePlanningDetail',()=>({direction:'back',scope:'page'}));
  const profileTabOrder=['plan','account','history'];
  const profileTabDirection=(from,to)=>{
    const a=profileTabOrder.indexOf(String(from||'plan')),b=profileTabOrder.indexOf(String(to||'plan'));
    return b<a?'back':'forward';
  };
  let preparedTabMotion=null;
  window.OleiroUI.prepareTabTransition=(from,to)=>{
    if(String(from||'')===String(to||'')){preparedTabMotion=null;return false}
    saveCurrentScroll();
    preparedTabMotion={direction:profileTabDirection(from,to),scope:'content'};
    return true;
  };
  window.OleiroUI.finishTabTransition=()=>{
    const motion=preparedTabMotion;preparedTabMotion=null;if(!motion)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{playMotion(motion.direction,motion.scope);restoreScroll(viewKey())}));
  };

  wrap('openPerson',(id,tab='plan')=>{
    const same=typeof state!=='undefined'&&String(state.managerPlanningPersonId||'')===String(id)&&state.managerPage==='planning';
    if(!same)return {direction:'forward',scope:'page'};
    const current=String(state.managerPlanningTab||'plan'),next=String(tab||'plan');
    if(current===next)return {noop:true};
    return {direction:profileTabDirection(current,next),scope:'content',waitForSettle:true};
  });

  /* Modais: bottom sheet no mobile e drawer lateral para ações contextuais no desktop. */
  const originalOpenModal=typeof window.openModal==='function'?window.openModal:null;
  const originalCloseModal=typeof window.closeModal==='function'?window.closeModal:null;
  const modalRootEl=()=>document.getElementById('modalRoot');
  const contextualTitle=title=>{
    const value=String(title||'').toLowerCase();
    if(/novo candidato|nova candidatura|criar candidato|cadastrar candidato|adicionar atividade|duplicar atividade/.test(value))return false;
    return /feedback|grupo|mover|filtro|filtr|reajuste|recusar|alterar|editar|detalhes|informações|informacoes|período|periodo|ajuste|confirmar/.test(value);
  };
  function modalPresentation(title,modal){
    const controls=[...modal.querySelectorAll('input:not([type="hidden"]),textarea,select')].filter(el=>!el.disabled);
    const textControls=controls.filter(el=>el.matches('textarea,input:not([type="checkbox"]):not([type="radio"])')).length;
    const largeWorkflow=/novo candidato|nova candidatura|criar candidato|cadastrar candidato|adicionar atividade|duplicar atividade/i.test(String(title||''));
    if(largeWorkflow||controls.length>8||textControls>6)return 'dialog';
    if(contextualTitle(title)||controls.length<=6)return 'contextual';
    return 'dialog';
  }
  function focusModal(modal){
    const target=modal?.querySelector('input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled])');
    requestAnimationFrame(()=>target?.focus?.({preventScroll:true}));
  }
  function bindSheetDrag(modal){
    if(!modal||modal.dataset.smartDragBound==='1')return;
    modal.dataset.smartDragBound='1';
    const head=modal.querySelector('.modal-head');if(!head)return;
    let startY=0,lastY=0,dragging=false;
    const reset=()=>{modal.style.transition='transform 160ms ease';modal.style.transform='';setTimeout(()=>{if(modal.isConnected)modal.style.transition=''},170)};
    head.addEventListener('pointerdown',event=>{
      if(window.innerWidth>=760||event.target.closest('button,input,textarea,select,a'))return;
      startY=event.clientY;lastY=startY;dragging=true;modal.style.transition='none';
      try{head.setPointerCapture(event.pointerId)}catch{}
    });
    head.addEventListener('pointermove',event=>{
      if(!dragging)return;lastY=event.clientY;const delta=Math.max(0,lastY-startY);if(delta>0)modal.style.transform='translate3d(0,'+Math.min(delta,110)+'px,0)';
    });
    const finish=()=>{if(!dragging)return;dragging=false;const delta=Math.max(0,lastY-startY);if(delta>72)window.closeModal?.();else reset()};
    head.addEventListener('pointerup',finish);head.addEventListener('pointercancel',finish);
  }
  function enhanceModal(title,forceContextual=false){
    const root=modalRootEl(),backdrop=root?.querySelector('.modal-backdrop'),modal=backdrop?.querySelector('.modal');if(!backdrop||!modal)return;
    backdrop.classList.add('ui-smart-backdrop');
    const presentation=forceContextual?'contextual':modalPresentation(title,modal);
    modal.dataset.uiPresentation=window.innerWidth<760?'sheet':presentation;
    backdrop.dataset.uiPresentation=modal.dataset.uiPresentation;
    if(presentation==='contextual'){backdrop.classList.add('ui-contextual-backdrop');modal.classList.add('ui-contextual-modal')}
    bindSheetDrag(modal);focusModal(modal);
  }
  function smartOpenModal(title,subtitle,body,footer=''){
    if(!originalOpenModal)return;
    modalGeneration+=1;previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    originalOpenModal(title,subtitle,body,footer);
    enhanceModal(title,false);
  }
  function smartCloseModal(){
    if(!originalCloseModal)return;
    const root=modalRootEl(),backdrop=root?.querySelector('.modal-backdrop'),modal=backdrop?.querySelector('.modal');
    if(!backdrop||!modal||reducedMotion()){originalCloseModal();previousFocus?.focus?.({preventScroll:true});return}
    const generation=modalGeneration;
    backdrop.classList.add('is-closing');modal.classList.add('is-closing');
    window.setTimeout(()=>{
      if(generation!==modalGeneration)return;
      originalCloseModal();
      previousFocus?.focus?.({preventScroll:true});
      previousFocus=null;
    },310);
  }
  if(originalOpenModal){window.openModal=smartOpenModal}
  if(originalCloseModal){window.closeModal=smartCloseModal}
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('modal-open'))window.closeModal?.()});

  /* API única de interação/estado para os outros módulos. */
  window.OleiroUI.viewKey=viewKey;
  window.OleiroUI.captureViewAnchor=captureViewAnchor;
  window.OleiroUI.restoreViewAnchor=restoreViewAnchor;
  window.OleiroUI.saveViewState=()=>{saveCurrentScroll();rememberHorizontalScrolls()};
  window.OleiroUI.restoreViewState=()=>{restoreScroll(viewKey());restoreHorizontalScrolls()};

  /* Drawer público reutilizável para novos fluxos sem criar outro padrão visual. */
  window.OleiroUI.openDrawer=function({title='',subtitle='',body='',footer=''}={}){
    window.OleiroUI.closeDrawer();
    const host=document.createElement('div');host.id='uiSmartDrawerRoot';
    host.innerHTML='<div class="ui-smart-drawer-backdrop" role="presentation"><aside class="ui-smart-drawer" role="dialog" aria-modal="true" aria-label="'+String(title).replace(/"/g,'&quot;')+'"><div class="ui-smart-drawer-head"><div><h2>'+title+'</h2>'+(subtitle?'<p>'+subtitle+'</p>':'')+'</div><button class="ui-smart-drawer-close" type="button" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></div><div class="ui-smart-drawer-body">'+body+'</div>'+(footer?'<div class="ui-smart-drawer-footer">'+footer+'</div>':'')+'</aside></div>';
    document.body.appendChild(host);document.body.classList.add('modal-open');
    host.querySelector('.ui-smart-drawer-close')?.addEventListener('click',window.OleiroUI.closeDrawer);
    host.querySelector('.ui-smart-drawer-backdrop')?.addEventListener('click',event=>{if(event.target===event.currentTarget)window.OleiroUI.closeDrawer()});
    return host;
  };
  window.OleiroUI.closeDrawer=function(){
    document.getElementById('uiSmartDrawerRoot')?.remove();
    if(!modalRootEl()?.querySelector('.modal-backdrop'))document.body.classList.remove('modal-open');
  };
  window.OleiroUI.transition=function(direction='forward',scope='page'){beginNavigation(direction,scope);scheduleMotion()};

  /* Acordeões/grupos mantêm o estado ao voltar para a tela. */
  function enhanceDetails(root=document){
    root.querySelectorAll?.('.info-accordion details,.group-details').forEach(details=>{
      if(details.dataset.smartDetailsBound==='1')return;details.dataset.smartDetailsBound='1';
      const summary=details.querySelector('summary'),label=summary?.textContent?.trim().replace(/\s+/g,' ').slice(0,80)||'item';
      const key=viewKey()+'::'+label;
      if(Object.prototype.hasOwnProperty.call(detailsStore,key))details.open=detailsStore[key]===1;
      details.addEventListener('toggle',()=>{detailsStore[key]=details.open?1:0;saveStore(detailsStorageKey,detailsStore)});
    });
  }

  /* Se o app renderizar outra tela, só melhoramos os componentes novos; não alteramos dados. */
  const app=document.getElementById('app');
  if(app){
    const observer=new MutationObserver(()=>{enhanceDetails(app);restoreHorizontalScrolls()});
    observer.observe(app,{childList:true,subtree:true});
  }
  let horizontalTimer=0;
  document.addEventListener('scroll',event=>{const target=event.target;if(!(target instanceof Element)||!target.matches(horizontalSelector))return;window.clearTimeout(horizontalTimer);horizontalTimer=window.setTimeout(rememberHorizontalScrolls,90)},true);
  window.addEventListener('pagehide',()=>{saveCurrentScroll();rememberHorizontalScrolls()});
  enhanceDetails(document);restoreHorizontalScrolls();
})();
