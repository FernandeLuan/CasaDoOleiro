(function initAuthService(){
  async function firebaseContext(){
    if(!window.OleiroFirebase)throw new Error('Backend indisponível.');
    const context=await window.OleiroFirebase.ready;
    if(!context?.configured)throw new Error('Firebase ainda não foi configurado.');
    return context;
  }

  function normalizeRole(role){
    if(role==='admin'||role==='coordinator')return 'manager';
    if(role==='volunteer')return 'volunteer';
    return 'inactive';
  }

  async function activeApplication(context,uid){
    const {firestore}=context.modules;
    // A consulta por participante usa apenas o índice automático. O filtro de ativo é
    // aplicado em memória porque cada usuário possui pouquíssimas candidaturas.
    const q=firestore.query(
      firestore.collection(context.db,'applications'),
      firestore.where('participantUids','array-contains',uid),
      firestore.limit(10)
    );
    const snapshot=await firestore.getDocs(q);
    const doc=snapshot.docs.find(item=>item.data().active===true);
    return doc?{id:doc.id,...doc.data()}:null;
  }

  async function volunteerProfile(context,uid){
    const {firestore}=context.modules;
    const snapshot=await firestore.getDoc(firestore.doc(context.db,'volunteer_profiles',uid));
    return snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null;
  }

  async function sessionFromUser(context,user){
    const {firestore,auth}=context.modules;
    const userSnapshot=await firestore.getDoc(firestore.doc(context.db,'users',user.uid));
    if(!userSnapshot.exists()){
      await auth.signOut(context.auth);
      throw new Error('Este acesso ainda não foi liberado pela Casa do Oleiro.');
    }

    const access=userSnapshot.data();
    if(access.active!==true){
      await auth.signOut(context.auth);
      return {role:'inactive',mode:null,uid:user.uid,email:user.email||null};
    }

    const role=normalizeRole(access.role);
    if(role==='manager')return {role,mode:null,uid:user.uid,email:user.email||null,user:access};
    if(role!=='volunteer'){
      await auth.signOut(context.auth);
      return {role:'inactive',mode:null,uid:user.uid,email:user.email||null};
    }

    const [application,profile]=await Promise.all([activeApplication(context,user.uid),volunteerProfile(context,user.uid)]);
    if(!application){
      await auth.signOut(context.auth);
      return {role:'inactive',mode:null,uid:user.uid,email:user.email||null};
    }

    const mode=application.status==='approved'?'approved':'candidate';
    return {role:'volunteer',mode,uid:user.uid,email:user.email||null,user:access,profile,application};
  }

  window.OleiroAuth={
    async signIn({email,password}){
      if(!email||!password)throw new Error('Informe e-mail e senha.');
      const context=await firebaseContext();
      const {auth}=context.modules;
      try{
        const credential=await auth.signInWithEmailAndPassword(context.auth,email,password);
        return await sessionFromUser(context,credential.user);
      }catch(error){
        if(error?.code==='auth/invalid-credential'||error?.code==='auth/user-not-found'||error?.code==='auth/wrong-password')throw new Error('E-mail ou senha inválidos.');
        if(error?.code==='auth/too-many-requests')throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        if(error?.message)throw error;
        throw new Error('Não foi possível entrar.');
      }
    },
    async currentSession(){
      const context=await firebaseContext();
      if(typeof context.auth.authStateReady==='function')await context.auth.authStateReady();
      const user=context.auth.currentUser;
      return user?sessionFromUser(context,user):null;
    },
    async signOut(){
      const context=await firebaseContext();
      await context.modules.auth.signOut(context.auth);
    }
  };
})();
