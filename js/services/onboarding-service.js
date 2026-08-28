(function initOnboardingService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  function normalizeEmail(value){return String(value||'').trim().toLowerCase()}
  function normalizeText(value){return String(value||'').trim()}
  function normalizeGender(value){const gender=String(value||'').toLowerCase();return ['male','female'].includes(gender)?gender:''}
  function normalizeEmergencyContact(value){
    const row=value&&typeof value==='object'?value:{};
    return {name:normalizeText(row.name).slice(0,120),relationship:normalizeText(row.relationship).slice(0,80),phone:normalizeText(row.phone).slice(0,40)};
  }
  function normalizeRegistrationLink(value){
    const link=normalizeText(value);if(!link)return '';
    try{const url=new URL(link);if(!['http:','https:'].includes(url.protocol))throw new Error();return url.toString()}
    catch{throw new Error('Informe um link válido do cadastro no Worldpackers.')}
  }
  function randomPassword(){
    const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);
    return `Aa1!${Array.from(bytes,b=>b.toString(36).padStart(2,'0')).join('')}`;
  }
  function appRootUrl(){
    const marker='/CasaDoOleiro/';const index=location.pathname.indexOf(marker);
    const path=index>=0?location.pathname.slice(0,index+marker.length):'/';
    return `${location.origin}${path}`;
  }
  function stayMonths(start,end){
    if(!start||!end)return [];
    const from=new Date(`${start}T12:00:00`),to=new Date(`${end}T12:00:00`);const out=[];
    let y=from.getFullYear(),m=from.getMonth();const ey=to.getFullYear(),em=to.getMonth();
    while(y<ey||(y===ey&&m<=em)){out.push(`${y}-${String(m+1).padStart(2,'0')}`);m+=1;if(m===12){m=0;y+=1}}
    return out;
  }
  function searchTokens(participants){
    const values=participants.flatMap(p=>[p.name,p.email,p.country]).map(v=>normalizeText(v).toLocaleLowerCase('pt-BR')).filter(Boolean);
    const tokens=new Set();
    values.forEach(value=>{
      value.split(/\s+/).filter(Boolean).forEach(part=>{for(let i=1;i<=Math.min(part.length,24);i++)tokens.add(part.slice(0,i))});
      tokens.add(value.slice(0,60));
    });
    return [...tokens].slice(0,200);
  }
  function validatePayload(payload){
    const participants=(payload?.participants||[]).map(p=>({...p,name:normalizeText(p.name),email:normalizeEmail(p.email),country:normalizeText(p.country),phone:normalizeText(p.phone),language:String(p.language||'en').toLowerCase(),gender:normalizeGender(p.gender),emergencyContact:normalizeEmergencyContact(p.emergencyContact)}));
    if(![1,2].includes(participants.length))throw new Error('Escolha uma candidatura individual ou em dupla.');
    if(participants.some(p=>!p.name||!p.email||!p.email.includes('@')))throw new Error('Informe nome e e-mail de todos os participantes.');
    if(participants.some(p=>!p.gender))throw new Error('Informe o gênero de todos os participantes.');
    if(participants.some(p=>(p.emergencyContact.name||p.emergencyContact.relationship||p.emergencyContact.phone)&&(!p.emergencyContact.name||!p.emergencyContact.phone)))throw new Error('Se informar um contato de emergência, preencha pelo menos o nome e o telefone.');
    if(new Set(participants.map(p=>p.email)).size!==participants.length)throw new Error('Os participantes precisam usar e-mails diferentes.');
    const stayStart=String(payload.stayStart||'');const stayEnd=String(payload.stayEnd||'');
    if(!stayStart||!stayEnd)throw new Error('Informe chegada e saída.');
    if(stayEnd<stayStart)throw new Error('A saída deve ser igual ou posterior à chegada.');
    const unitId=String(payload.unitId||'').trim().toLowerCase();if(!unitId)throw new Error('Selecione a unidade.');
    return {participants,stayStart,stayEnd,unitId,unitName:normalizeText(payload.unitName)||unitId.replace(/^./,c=>c.toUpperCase()),note:normalizeText(payload.note),registrationLink:normalizeRegistrationLink(payload.registrationLink)};
  }

  async function createAuthAccount(context,participant,index){
    const {app:appModule,auth:authModule}=context.modules;
    const appName=`onboarding-${Date.now()}-${index}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;
    const secondaryApp=appModule.initializeApp(window.OLEIRO_FIREBASE_CONFIG,appName);
    const secondaryAuth=authModule.getAuth(secondaryApp);
    secondaryAuth.languageCode=participant.language||'en';
    try{
      const credential=await authModule.createUserWithEmailAndPassword(secondaryAuth,participant.email,randomPassword());
      await authModule.updateProfile(credential.user,{displayName:participant.name});
      return {uid:credential.user.uid,user:credential.user,secondaryAuth,secondaryApp,participant};
    }catch(error){
      try{await appModule.deleteApp(secondaryApp)}catch{}
      if(error?.code==='auth/email-already-in-use')throw new Error(`O e-mail ${participant.email} já possui uma conta. Use a reativação do perfil existente ou outro e-mail.`);
      if(error?.code==='auth/invalid-email')throw new Error(`O e-mail ${participant.email} é inválido.`);
      if(error?.code==='auth/operation-not-allowed')throw new Error('Cadastro por e-mail e senha não está habilitado no Firebase Authentication.');
      throw new Error(`Não foi possível criar o acesso de ${participant.name}.`);
    }
  }

  async function cleanupAccounts(context,accounts,{deleteUsers=false}={}){
    const {app:appModule,auth:authModule}=context.modules;
    for(const account of accounts){
      if(deleteUsers){try{await authModule.deleteUser(account.user)}catch(error){console.error('Falha ao remover conta incompleta:',error)}}
      try{await authModule.signOut(account.secondaryAuth)}catch{}
      try{await appModule.deleteApp(account.secondaryApp)}catch{}
    }
  }

  services.onboarding={
    async createCandidate(payload){
      const data=validatePayload(payload);
      return services.run(async()=>{
        const context=await services.firebase();const {firestore,auth:authModule}=context.modules;
        const accounts=[];
        try{
          for(let i=0;i<data.participants.length;i++)accounts.push(await createAuthAccount(context,data.participants[i],i));

          const applicationRef=firestore.doc(firestore.collection(context.db,'applications'));
          const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
          const deadlineDate=new Date();deadlineDate.setDate(deadlineDate.getDate()+7);
          const participantUids=accounts.map(a=>a.uid);
          const participantStatus=Object.fromEntries(participantUids.map(uid=>[uid,'active']));
          const participantGenders=accounts.map(a=>a.participant.gender||'');

          accounts.forEach(account=>{
            const p=account.participant;const uid=account.uid;
            batch.set(firestore.doc(context.db,'users',uid),{
              role:'volunteer',active:true,language:p.language||'en',unitIds:[data.unitId],email:p.email,firstPortalAccessAt:null,createdAt:now,updatedAt:now
            });
            batch.set(firestore.doc(context.db,'volunteer_profiles',uid),{
              name:p.name,fullName:p.name,email:p.email,phone:p.phone||'',whatsapp:p.phone||'',country:p.country||'',nationality:p.country||'',language:p.language||'en',gender:p.gender||'',emergencyContact:p.emergencyContact||{name:'',relationship:'',phone:''},createdAt:now,updatedAt:now
            });
          });

          batch.set(applicationRef,{
            type:accounts.length===2?'couple':'individual',participantUids,
            participantNames:accounts.map(a=>a.participant.name),participantEmails:accounts.map(a=>a.participant.email),participantCountries:accounts.map(a=>a.participant.country||''),participantPhones:accounts.map(a=>a.participant.phone||''),participantGenders,
            gender:accounts.length===1?participantGenders[0]:'',participantCount:accounts.length,participantStatus,unitId:data.unitId,unitName:data.unitName,
            status:'pending',active:true,stayStart:data.stayStart,stayEnd:data.stayEnd,stayMonths:stayMonths(data.stayStart,data.stayEnd),
            planningDeadlineAt:firestore.Timestamp.fromDate(deadlineDate),planningSubmittedAt:null,
            activityCount:0,sessionCount:0,source:'portal',registrationLink:data.registrationLink||'',internalNote:data.note||'',
            searchTokens:searchTokens(data.participants),createdAt:now,updatedAt:now
          });

          try{await batch.commit()}catch(error){await cleanupAccounts(context,accounts,{deleteUsers:true});throw error}
          await cleanupAccounts(context,accounts,{deleteUsers:false});

          const invitationFailures=[];
          for(const account of accounts){
            try{
              context.auth.languageCode=account.participant.language||'en';
              await authModule.sendPasswordResetEmail(context.auth,account.participant.email,{url:appRootUrl(),handleCodeInApp:false});
            }catch(error){console.error('Falha ao enviar definição de senha:',error);invitationFailures.push(account.participant.email)}
          }
          return {applicationId:applicationRef.id,participantUids,invitationFailures};
        }catch(error){
          if(accounts.length)await cleanupAccounts(context,accounts,{deleteUsers:true});
          if(error?.message)throw error;
          throw new Error('Não foi possível cadastrar o voluntário.');
        }
      });
    }
  };
})();