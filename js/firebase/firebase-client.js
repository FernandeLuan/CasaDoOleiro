(function initOleiroFirebase(){
  const SDK_VERSION='12.17.1';
  let readyPromise=null;

  function hasConfig(config){
    return !!config&&['apiKey','authDomain','projectId','appId'].every(key=>typeof config[key]==='string'&&config[key].trim());
  }

  async function initialize(){
    const config=window.OLEIRO_FIREBASE_CONFIG;
    if(!hasConfig(config))return {configured:false};

    const [appModule,authModule,firestoreModule]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
    ]);

    const app=appModule.getApps().length?appModule.getApp():appModule.initializeApp(config);
    const auth=authModule.getAuth(app);
    const db=firestoreModule.getFirestore(app);
    return {configured:true,app,auth,db,modules:{app:appModule,auth:authModule,firestore:firestoreModule}};
  }

  window.OleiroFirebase={
    sdkVersion:SDK_VERSION,
    isConfigured(){return hasConfig(window.OLEIRO_FIREBASE_CONFIG)},
    get ready(){if(!readyPromise)readyPromise=initialize();return readyPromise;}
  };
})();
