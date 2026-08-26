(function initAuthGuard(){
  function rootUrl(){return document.body?.dataset?.root||'../index.html'}
  function redirectTo(path){location.replace(path)}

  async function requireRole(expectedRole){
    if(!window.OleiroAuth?.currentSession){
      redirectTo(rootUrl());
      return null;
    }

    let session;
    try{
      const load=()=>window.OleiroAuth.currentSession();
      session=window.OleiroLoading?.run?await window.OleiroLoading.run(load):await load();
    }catch(error){
      console.error('Falha ao validar sessão:',error);
      redirectTo(rootUrl());
      return null;
    }

    if(!session){redirectTo(rootUrl());return null}
    if(session.role==='inactive'){redirectTo('../inactive.html');return null}
    if(session.role!==expectedRole){
      redirectTo(session.role==='manager'?'../admin/':'../portal/');
      return null;
    }

    return session;
  }

  window.OleiroAuthGuard={requireRole};
})();
