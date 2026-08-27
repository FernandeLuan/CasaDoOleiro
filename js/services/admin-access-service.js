(function initAdminAccessService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  function appRootUrl(){const marker='/CasaDoOleiro/';const index=location.pathname.indexOf(marker);const path=index>=0?location.pathname.slice(0,index+marker.length):'/';return `${location.origin}${path}`}
  async function callable(name,payload){
    return services.run(async()=>{
      const context=await services.firebase();
      const functionsModule=context.modules?.functions;if(!context.functions||!functionsModule?.httpsCallable)throw new Error('Serviço administrativo indisponível.');
      try{const response=await functionsModule.httpsCallable(context.functions,name)(payload||{});return response?.data||null}
      catch(error){
        const message=String(error?.message||'').replace(/^FirebaseError:\s*/,'');
        if(/first access|primeiro acesso|failed-precondition/i.test(message))throw new Error('O e-mail só pode ser alterado antes do primeiro acesso do voluntário.');
        if(/already exists|email-already-exists|already in use/i.test(message))throw new Error('Este e-mail já está vinculado a outra conta.');
        if(/permission-denied|permission denied/i.test(message))throw new Error('Sua conta não possui permissão para esta operação.');
        throw new Error(message||'Não foi possível concluir a operação administrativa.');
      }
    });
  }
  services.adminAccess={
    updateVolunteerEmail({applicationId,uid,email}){return callable('adminUpdateVolunteerEmail',{applicationId,uid,email})},
    deleteVolunteerApplication(applicationId){return callable('adminDeleteVolunteerApplication',{applicationId})},
    async sendPasswordSetup(email,language='pt'){
      return services.run(async()=>{const context=await services.firebase(),authModule=context.modules?.auth;if(!context.auth||!authModule?.sendPasswordResetEmail)throw new Error('Serviço de convite indisponível.');context.auth.languageCode=String(language||'pt').toLowerCase();await authModule.sendPasswordResetEmail(context.auth,String(email||'').trim().toLowerCase(),{url:appRootUrl(),handleCodeInApp:false});return true},{loading:false});
    }
  };
})();
