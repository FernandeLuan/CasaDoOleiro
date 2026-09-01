/* Production error monitoring. The public Sentry DSN is injected at deploy time. */
(function initOleiroMonitoring(){
  const config=window.OLEIRO_SENTRY_CONFIG||{};
  const sdkUrl='https://browser.sentry-cdn.com/10.53.1/bundle.min.js';
  const criticalCodes=new Set(['permission-denied','failed-precondition','unauthenticated','unavailable','resource-exhausted','internal','deadline-exceeded','aborted','data-loss']);
  const sensitiveKey=/(email|phone|password|passwd|token|authorization|cookie|contact|secret|name|messageText)/i;
  const queue=[];
  const reported=typeof WeakSet==='function'?new WeakSet():null;
  let initialized=false;
  let loading=false;

  function codeOf(error){
    const raw=String(error?.code||'').toLowerCase();
    return raw.includes('/')?raw.split('/').pop():raw;
  }
  function cleanUrl(value){
    try{const url=new URL(String(value||''),location.href);return `${url.origin}${url.pathname}`}
    catch{return String(value||'').split('?')[0].split('#')[0]}
  }
  function scrub(value,depth=0){
    if(depth>4)return '[truncated]';
    if(value===null||value===undefined||typeof value==='boolean'||typeof value==='number')return value;
    if(typeof value==='string'){
      if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return '[redacted-email]';
      return value.length>500?`${value.slice(0,500)}…`:value;
    }
    if(Array.isArray(value))return value.slice(0,20).map(item=>scrub(item,depth+1));
    if(typeof value==='object'){
      const out={};
      Object.entries(value).slice(0,40).forEach(([key,item])=>{out[key]=sensitiveKey.test(key)?'[redacted]':scrub(item,depth+1)});
      return out;
    }
    return String(value);
  }
  function beforeSend(event){
    if(event.user)delete event.user;
    if(event.request)event.request={url:cleanUrl(event.request.url||location.href)};
    if(event.extra)event.extra=scrub(event.extra);
    if(event.tags)event.tags=scrub(event.tags);
    return event;
  }
  function beforeBreadcrumb(breadcrumb){
    const category=String(breadcrumb?.category||'');
    if(category.startsWith('ui.'))return null;
    const next={...breadcrumb};
    if(next.data&&typeof next.data==='object'){
      next.data=scrub(next.data);
      if(next.data.url)next.data.url=cleanUrl(next.data.url);
    }
    if(next.message)next.message=scrub(next.message);
    return next;
  }
  function baseTags(meta={}){
    const role=String(window.state?.currentSession?.user?.role||'anonymous');
    const path=location.pathname.includes('/admin/')?'admin':location.pathname.includes('/portal/')?'portal':'login';
    return {area:meta.area||path,action:meta.action||'runtime',firebaseCode:meta.firebaseCode||'',role};
  }
  function alreadyReported(error){
    if(!reported||!error||typeof error!=='object')return false;
    if(reported.has(error))return true;
    reported.add(error);return false;
  }
  function sendException(error,meta={}){
    if(!initialized||!window.Sentry?.captureException)return null;
    if(alreadyReported(error))return null;
    let eventId=null;
    window.Sentry.withScope(scope=>{
      const tags=baseTags(meta);Object.entries(tags).forEach(([key,value])=>value&&scope.setTag(key,String(value)));
      if(meta.applicationId)scope.setTag('applicationId',String(meta.applicationId));
      if(meta.sessionId)scope.setTag('sessionId',String(meta.sessionId));
      if(meta.status)scope.setTag('recordStatus',String(meta.status));
      if(meta.extra)scope.setExtras(scrub(meta.extra));
      eventId=window.Sentry.captureException(error instanceof Error?error:new Error(String(error||'Unknown error')));
    });
    return eventId;
  }
  function captureException(error,meta={}){
    if(!config.enabled||!config.dsn)return null;
    if(!initialized){queue.push({error,meta});if(queue.length>30)queue.shift();return null}
    return sendException(error,meta);
  }
  function captureServiceError(error,meta={}){
    const code=codeOf(error);
    const message=String(error?.message||'');
    const permissionMessage=/missing or insufficient permissions|permission[- ]denied/i.test(message);
    if(!criticalCodes.has(code)&&!permissionMessage)return null;
    return captureException(error,{...meta,firebaseCode:code||'permission-denied'});
  }
  function flushQueue(){while(queue.length){const item=queue.shift();sendException(item.error,item.meta)}}
  function load(){
    if(loading||initialized||!config.enabled||!config.dsn)return;
    loading=true;
    const script=document.createElement('script');
    script.src=sdkUrl;script.crossOrigin='anonymous';script.referrerPolicy='origin';
    script.onload=()=>{
      try{
        window.Sentry.init({
          dsn:String(config.dsn),
          environment:String(config.environment||'production'),
          release:String(config.release||''),
          sendDefaultPii:false,
          tracesSampleRate:0,
          beforeSend,
          beforeBreadcrumb
        });
        initialized=true;flushQueue();
      }catch(error){console.warn('[Monitoring] Sentry init failed',error)}
    };
    script.onerror=()=>console.warn('[Monitoring] Sentry SDK unavailable');
    document.head.appendChild(script);
  }

  window.addEventListener('error',event=>{if(!initialized&&event.error)captureException(event.error,{area:'browser',action:'unhandled_error'})});
  window.addEventListener('unhandledrejection',event=>{if(!initialized)captureException(event.reason instanceof Error?event.reason:new Error(String(event.reason||'Unhandled rejection')),{area:'browser',action:'unhandled_rejection'})});

  window.OleiroMonitoring={
    captureException,
    captureServiceError,
    addBreadcrumb(message,data={}){if(initialized&&window.Sentry?.addBreadcrumb)window.Sentry.addBreadcrumb({category:'oleiro',message:String(message||''),level:'info',data:scrub(data)})},
    isEnabled(){return Boolean(config.enabled&&config.dsn)},
    sdkVersion:'10.53.1'
  };
  load();
})();
