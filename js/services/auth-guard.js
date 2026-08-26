(function initAuthGuard(){
  const isDev=new URLSearchParams(location.search).get('dev')==='1';

  function rootUrl(){return document.body?.dataset?.root||'../index.html'}
  function redirectTo(path){location.replace(path)}

  async function requireRole(expectedRole){
    if(isDev){
      const mode=sessionStorage.getItem('oleiro-volunteer-mode')||'candidate';
      return {role:expectedRole,mode,dev:true};
    }

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

    sessionStorage.setItem('oleiro-role',session.role);
    if(session.mode)sessionStorage.setItem('oleiro-volunteer-mode',session.mode);
    return session;
  }

  window.OleiroAuthGuard={requireRole,isDev};
})();
