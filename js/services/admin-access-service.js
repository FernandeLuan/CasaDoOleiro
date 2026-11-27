(function initAdminAccessService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  function appRootUrl(){const marker='/CasaDoOleiro/';const index=location.pathname.indexOf(marker);const path=index>=0?location.pathname.slice(0,index+marker.length):'/';return location.origin+path}
  function normalizeEmail(email){return String(email||'').trim().toLowerCase()}
  function validatePermissions(role,unitIds){
    if(!['admin','coordinator'].includes(role))throw new Error('Nível de acesso inválido.');
    const units=[...new Set((unitIds||[]).map(String).filter(Boolean))];
    if(role==='coordinator'&&!units.length)throw new Error('Selecione ao menos uma unidade para o coordenador.');
    return units;
  }
  services.adminAccess={
    async sendPasswordSetup(email,language='pt'){
      return services.run(async()=>{
        const context=await services.firebase(),authModule=context.modules?.auth;
        if(!context.auth||!authModule?.sendPasswordResetEmail)throw new Error('Serviço de convite indisponível.');
        context.auth.languageCode=String(language||'pt').toLowerCase();
        await authModule.sendPasswordResetEmail(context.auth,normalizeEmail(email),{url:appRootUrl(),handleCodeInApp:false});
        return true;
      },{loading:false});
    },
    async createAccount({name,email,role,unitIds=[],createdBy}={}){
      return services.run(async()=>{
        const cleanName=String(name||'').trim(),cleanEmail=normalizeEmail(email),units=validatePermissions(role,unitIds);
        if(!cleanName||!cleanEmail||!createdBy)throw new Error('Informe nome, e-mail e administrador responsável.');
        const context=await services.firebase(),{app:appModule,auth:authModule,firestore}=context.modules||{};
        if(!appModule?.initializeApp||!authModule?.getAuth||!authModule?.createUserWithEmailAndPassword||!firestore?.setDoc)throw new Error('Provisionamento de contas indisponível.');
        const secondaryApp=appModule.initializeApp(window.OLEIRO_FIREBASE_CONFIG,'oleiro-admin-provision-'+Date.now());
        const secondaryAuth=authModule.getAuth(secondaryApp);let credential=null;
        try{
          const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
          const password=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')+'aA1!';
          credential=await authModule.createUserWithEmailAndPassword(secondaryAuth,cleanEmail,password);
          await firestore.setDoc(firestore.doc(context.db,'users',credential.user.uid),{displayName:cleanName,name:cleanName,email:cleanEmail,role,active:true,unitIds:role==='coordinator'?units:[],createdAt:firestore.serverTimestamp(),updatedAt:firestore.serverTimestamp(),createdBy});
          let emailSent=true;
          try{await this.sendPasswordSetup(cleanEmail)}catch(error){emailSent=false;console.warn('Conta criada, mas o e-mail de definição de senha falhou:',error)}
          services.users?.invalidateManagers?.();
          return {uid:credential.user.uid,email:cleanEmail,emailSent};
        }catch(error){
          if(credential?.user&&authModule.deleteUser)await authModule.deleteUser(credential.user).catch(()=>{});
          if(error?.code==='auth/email-already-in-use')throw new Error('Já existe uma conta de autenticação com esse e-mail.');
          if(error?.code==='permission-denied')throw new Error('O Firebase bloqueou a gravação do perfil. Verifique suas permissões.');
          throw error;
        }finally{if(appModule.deleteApp)await appModule.deleteApp(secondaryApp).catch(()=>{})}
      },{loading:false});
    },
    async updatePermissions(uid,{role,unitIds=[]}={}){
      return services.run(async()=>{
        if(!uid)throw new Error('Administrador não informado.');
        const units=validatePermissions(role,unitIds),context=await services.firebase(),{firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'users',uid),{role,unitIds:role==='coordinator'?units:[],updatedAt:firestore.serverTimestamp()});
        services.users?.invalidateManagers?.();return true;
      },{loading:false});
    },
    async setActive(uid,active){
      return services.run(async()=>{
        if(!uid)throw new Error('Administrador não informado.');
        const context=await services.firebase(),{firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'users',uid),{active:!!active,updatedAt:firestore.serverTimestamp()});
        services.users?.invalidateManagers?.();return true;
      },{loading:false});
    }
  };
})();