(function initAuthService(){
  if(new URLSearchParams(location.search).get('dev')==='1')return;

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
    const q=firestore.query(
      firestore.collection(context.db,'applications'),
      firestore.where('participantUids','array-contains',uid),
      firestore.where('active','==',true),
      firestore.limit(1)
    );
    const snapshot=await firestore.getDocs(q);
    if(snapshot.empty)return null;
    const doc=snapshot.docs[0];
    return {id:doc.id,...doc.data()};
  }

  async function sessionFromUser(context,user){
    const {firestore,auth}=context.modules;
    const userSnapshot=await firestore.getDoc(firestore.doc(context.db,'users',user.uid));
    if(!userSnapshot.exists()){
      await auth.signOut(context.auth);
      throw new Error('Este acesso ainda não foi liberado pela Casa do Oleiro.');
    }

    const profile=userSnapshot.data();
    if(profile.active!==true){
      await auth.signOut(context.auth);
      return {role:'inactive',mode:null,uid:user.uid};
    }

    const role=normalizeRole(profile.role);
    if(role==='manager')return {role,mode:null,uid:user.uid,user:profile};
    if(role!=='volunteer'){
      await auth.signOut(context.auth);
      return {role:'inactive',mode:null,uid:user.uid};
    }

    const application=await activeApplication(context,user.uid);
    if(!application){
      await auth.signOut(context.auth);
      return {role:'inactive',mode:null,uid:user.uid};
    }

    const mode=application.status==='approved'?'approved':'candidate';
    return {role:'volunteer',mode,uid:user.uid,user:profile,application};
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
      const user=context.auth.currentUser;
      return user?sessionFromUser(context,user):null;
    },
    async signOut(){
      const context=await firebaseContext();
      await context.modules.auth.signOut(context.auth);
      sessionStorage.removeItem('oleiro-role');
      sessionStorage.removeItem('oleiro-volunteer-mode');
    }
  };
})();
