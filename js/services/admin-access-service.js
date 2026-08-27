(function initAdminAccessService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  function appRootUrl(){const marker='/CasaDoOleiro/';const index=location.pathname.indexOf(marker);const path=index>=0?location.pathname.slice(0,index+marker.length):'/';return `${location.origin}${path}`}

  services.adminAccess={
    async sendPasswordSetup(email,language='pt'){
      return services.run(async()=>{
        const context=await services.firebase(),authModule=context.modules?.auth;
        if(!context.auth||!authModule?.sendPasswordResetEmail)throw new Error('Serviço de convite indisponível.');
        context.auth.languageCode=String(language||'pt').toLowerCase();
        await authModule.sendPasswordResetEmail(context.auth,String(email||'').trim().toLowerCase(),{url:appRootUrl(),handleCodeInApp:false});
        return true;
      },{loading:false});
    }
  };
})();
