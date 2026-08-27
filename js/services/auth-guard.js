(function initAuthGuard(){
  function rootUrl(){return document.body?.dataset?.root||'../index.html'}
  function redirectTo(path){location.replace(path)}
  function showOfflineState(message){
    const app=document.getElementById('app'),nav=document.getElementById('navRoot');
    if(nav)nav.innerHTML='';
    if(app)app.innerHTML=`<main class="offline-page"><section class="offline-state" role="status" aria-live="polite"><div class="offline-center"><span class="offline-icon"><i class="fa-solid fa-wifi"></i></span><div><h1>Sem conexão</h1><p>${String(message||'Verifique sua internet e tente novamente.')}</p></div></div><div class="offline-action"><button class="btn btn-primary btn-block" type="button" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i>Tentar novamente</button></div></section></main>`;
  }
  async function requireRole(expectedRole){
    if(!window.OleiroAuth?.currentSession){redirectTo(rootUrl());return null}
    let session;try{session=await window.OleiroAuth.currentSession()}catch(error){if(error?.code==='oleiro/offline'){showOfflineState(error.message);return null}console.error('Falha ao validar sessão:',error);redirectTo(rootUrl());return null}
    if(!session){redirectTo(rootUrl());return null}
    if(session.role!==expectedRole){redirectTo(session.role==='manager'?'../admin/':'../portal/');return null}
    return session;
  }
  window.OleiroAuthGuard={requireRole};
})();
