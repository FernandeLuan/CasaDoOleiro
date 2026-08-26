/* Round 4 — feedback temporário de login e estado de entrada imediato. */
(function round4Login(){
  let messageTimer=null;
  const loginButton=document.getElementById('loginButton');
  const originalButtonHtml=loginButton?.innerHTML||'Entrar';

  function fieldFor(id){return document.getElementById(id)?.closest('.field')||null}
  function hideLoginMessage(){
    clearTimeout(messageTimer);messageTimer=null;
    const el=document.getElementById('loginMessage');if(!el)return;
    el.hidden=true;el.textContent='';el.classList.remove('login-error');
  }
  function clearInvalidAndMessage(){
    ['email','password'].forEach(id=>fieldFor(id)?.classList.remove('is-invalid'));
    hideLoginMessage();
  }
  function markInvalid(ids){ids.forEach(id=>fieldFor(id)?.classList.add('is-invalid'))}
  function setLoginBusy(busy){
    const button=document.getElementById('loginButton');if(!button)return;
    button.disabled=!!busy;button.classList.toggle('is-loading',!!busy);
    button.innerHTML=busy?'<i class="fa-solid fa-circle-notch"></i>Entrando...':originalButtonHtml;
  }

  document.getElementById('email')?.addEventListener('input',clearInvalidAndMessage);
  document.getElementById('password')?.addEventListener('input',clearInvalidAndMessage);

  showLoginMessage=function(text,options={}){
    const el=document.getElementById('loginMessage');if(!el)return;
    clearTimeout(messageTimer);
    el.textContent=typeof translateText==='function'?translateText(text):text;
    el.hidden=false;el.classList.toggle('login-error',options.error===true);
    if(options.error===true)messageTimer=setTimeout(hideLoginMessage,3000);
  };

  handleLogin=async function(){
    clearInvalidAndMessage();
    const email=document.getElementById('email')?.value.trim()||'';
    const passwordValue=document.getElementById('password')?.value||'';
    if(!email||!passwordValue){const missing=[];if(!email)missing.push('email');if(!passwordValue)missing.push('password');markInvalid(missing);return showLoginMessage('Informe e-mail e senha.',{error:true})}
    if(!window.OleiroAuth||typeof window.OleiroAuth.signIn!=='function')return showLoginMessage('Autenticação indisponível. Atualize a página e tente novamente.',{error:true});
    setLoginBusy(true);
    try{
      const session=await window.OleiroAuth.signIn({email,password:passwordValue});
      if(!session?.role)throw new Error('Sessão inválida.');
      return startLoginTransition(session.role);
    }catch(error){
      setLoginBusy(false);
      if(error?.code==='oleiro/invalid-credential')markInvalid(['email','password']);
      return showLoginMessage(error?.message||'Não foi possível entrar.',{error:true});
    }
  };
})();
