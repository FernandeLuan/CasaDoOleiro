(function initOleiroFirebase(){
  const SDK_VERSION='12.17.1';
  let readyPromise=null;

  function hasConfig(config){
    return !!config&&['apiKey','authDomain','projectId','appId'].every(key=>typeof config[key]==='string'&&config[key].trim());
  }

  function shouldUseEmulators(){
    const local=['localhost','127.0.0.1'].includes(location.hostname);
    if(!local)return false;
    const requested=new URLSearchParams(location.search).get('emulator')==='1';
    if(requested){try{sessionStorage.setItem('oleiro-use-emulators','1')}catch{}}
    try{return requested||sessionStorage.getItem('oleiro-use-emulators')==='1'}catch{return requested}
  }

  async function initialize(){
    const config=window.OLEIRO_FIREBASE_CONFIG;
    if(!hasConfig(config))return {configured:false};

    /* O portal roda somente com Auth + Firestore. Operações administrativas
       excepcionais ficam nos utilitários do Cloud Shell (Admin SDK), sem Functions/Blaze. */
    const [appModule,authModule,firestoreModule]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
    ]);

    const app=appModule.getApps().length?appModule.getApp():appModule.initializeApp(config);
    const auth=authModule.getAuth(app);
    const useEmulators=shouldUseEmulators();
    /* O WebChannel padrão do Firestore pode ficar pendente no WebKit contra o emulator
       local. Long polling é forçado somente em modo emulator; produção continua usando
       a configuração padrão do SDK. */
    const db=useEmulators
      ?firestoreModule.initializeFirestore(app,{experimentalForceLongPolling:true})
      :firestoreModule.getFirestore(app);

    if(useEmulators){
      authModule.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
      firestoreModule.connectFirestoreEmulator(db,'127.0.0.1',8080);
    }

    return {configured:true,app,auth,db,modules:{app:appModule,auth:authModule,firestore:firestoreModule},emulated:useEmulators};
  }

  window.OleiroFirebase={
    sdkVersion:SDK_VERSION,
    isConfigured(){return hasConfig(window.OLEIRO_FIREBASE_CONFIG)},
    get ready(){if(!readyPromise)readyPromise=initialize();return readyPromise;}
  };
})();
