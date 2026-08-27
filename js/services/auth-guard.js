(function initAuthGuard(){
  function rootUrl(){return document.body?.dataset?.root||'../index.html'}
  function redirectTo(path){location.replace(path)}
  function showOfflineState(message){const app=document.getElementById('app'),nav=document.getElementById('navRoot');if(nav)nav.innerHTML='';if(app)app.innerHTML=`<main class="page"><section class="section"><div class="notice warning"><i class="fa-solid fa-wifi"></i><div><strong>Sem conexão</strong><br>${String(message||'Verifique sua internet e tente novamente.')}</div></div><button class="btn btn-primary btn-block" style="margin-top:12px" type="button" onclick="location.reload()">Tentar novamente</button></section></main>`}
  async function requireRole(expectedRole){
    if(!window.OleiroAuth?.currentSession){redirectTo(rootUrl());return null}
    let session;try{session=await window.OleiroAuth.currentSession()}catch(error){if(error?.code==='oleiro/offline'){showOfflineState(error.message);return null}console.error('Falha ao validar sessão:',error);redirectTo(rootUrl());return null}
    if(!session){redirectTo(rootUrl());return null}
    if(session.role!==expectedRole){redirectTo(session.role==='manager'?'../admin/':'../portal/');return null}
    return session;
  }
  window.OleiroAuthGuard={requireRole};
})();
