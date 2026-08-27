(function initOleiroFirebase(){
  const SDK_VERSION='12.17.1';
  let readyPromise=null;

  function hasConfig(config){
    return !!config&&['apiKey','authDomain','projectId','appId'].every(key=>typeof config[key]==='string'&&config[key].trim());
  }

  async function initialize(){
    const config=window.OLEIRO_FIREBASE_CONFIG;
    if(!hasConfig(config))return {configured:false};

    /* Auth e Firestore são críticos para o bootstrap. Functions é administrativo e fica lazy. */
    const [appModule,authModule,firestoreModule]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
    ]);

    const app=appModule.getApps().length?appModule.getApp():appModule.initializeApp(config);
    const auth=authModule.getAuth(app);
    const db=firestoreModule.getFirestore(app);
    const context={configured:true,app,auth,db,functions:null,modules:{app:appModule,auth:authModule,firestore:firestoreModule,functions:null}};
    let functionsPromise=null;
    context.ensureFunctions=async function(){
      if(context.functions&&context.modules.functions)return {functions:context.functions,module:context.modules.functions};
      if(!functionsPromise){
        functionsPromise=import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-functions.js`).then(functionsModule=>{
          context.modules.functions=functionsModule;
          context.functions=functionsModule.getFunctions(app,'southamerica-east1');
          return {functions:context.functions,module:functionsModule};
        }).catch(error=>{functionsPromise=null;throw error});
      }
      return functionsPromise;
    };
    return context;
  }

  window.OleiroFirebase={
    sdkVersion:SDK_VERSION,
    isConfigured(){return hasConfig(window.OLEIRO_FIREBASE_CONFIG)},
    get ready(){if(!readyPromise)readyPromise=initialize();return readyPromise;}
  };
})();
