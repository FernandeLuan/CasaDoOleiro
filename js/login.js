/* Login */
setLanguage=function(lang){const next=typeof normalizeOleiroLanguage==='function'?(normalizeOleiroLanguage(lang)||'pt'):lang;localStorage.setItem('oleiro-language',next);if(typeof closeLanguageModal==='function')closeLanguageModal();location.reload();};

let loginTransitionTimer=null;
function destinationFor(role){if(role==='manager')return 'admin/';if(role==='volunteer')return 'portal/';return 'index.html'}
function startLoginTransition(role){if(loginTransitionTimer)return;const overlay=document.getElementById('loginLoading');const button=document.getElementById('loginButton');if(button)button.disabled=true;if(overlay)overlay.hidden=false;loginTransitionTimer=setTimeout(()=>{location.href=destinationFor(role)},850)}
async function handleLogin(){
  const email=document.getElementById('email')?.value.trim()||'';
  const password=document.getElementById('password')?.value||'';
  if(!window.OleiroAuth||typeof window.OleiroAuth.signIn!=='function')return showLoginMessage('Autenticação indisponível. Atualize a página e tente novamente.');
  try{
    const session=await window.OleiroAuth.signIn({email,password});
    if(!session?.role)throw new Error('Sessão inválida.');
    return startLoginTransition(session.role);
  }catch(error){return showLoginMessage(error?.message||'Não foi possível entrar.')}
}
async function handleForgotPassword(){
  const email=document.getElementById('email')?.value.trim()||'';const button=document.getElementById('forgotPasswordButton');
  if(!email)return showLoginMessage('Informe seu e-mail para recuperar a senha.');
  if(!window.OleiroAuth||typeof window.OleiroAuth.sendPasswordReset!=='function')return showLoginMessage('Recuperação de senha indisponível. Atualize a página e tente novamente.');
  try{
    if(button)button.disabled=true;
    await window.OleiroAuth.sendPasswordReset(email);
    showLoginMessage('Se este e-mail estiver cadastrado, você receberá uma mensagem para definir uma nova senha.');
  }catch(error){showLoginMessage(error?.message||'Não foi possível enviar o e-mail de recuperação.')}finally{if(button)button.disabled=false}
}
function showLoginMessage(text){const el=document.getElementById('loginMessage');if(!el)return;el.textContent=typeof translateText==='function'?translateText(text):text;el.hidden=false}

/* Personagem de barro: reage aos campos sem interferir na autenticação. */
(function interactiveClayLogin(){
  const mascot=document.getElementById('loginMascot');
  const caption=document.getElementById('loginMascotCaption');
  const email=document.getElementById('email');
  const password=document.getElementById('password');
  if(!mascot||!email||!password)return;

  const captions={
    idle:'Pode entrar. Estou de olho por aqui.',
    email:'Acompanhando seu e-mail…',
    secret:'Prometo não olhar.',
    peek:'Só uma espiadinha.'
  };

  function setCaption(key){if(caption)caption.textContent=captions[key]||captions.idle}
  function resetEyes(){mascot.style.setProperty('--look-x','0px');mascot.style.setProperty('--look-y','0px')}
  function clearModes(){mascot.classList.remove('is-email','is-secret','is-peeking')}
  function trackEmail(){
    const value=String(email.value||'');
    const caret=Number.isFinite(email.selectionStart)?email.selectionStart:value.length;
    const denominator=Math.max(8,Math.min(30,value.length+6));
    const ratio=Math.max(0,Math.min(1,caret/denominator));
    const x=-4+(ratio*8);
    const y=value.length>18?1:0;
    mascot.style.setProperty('--look-x',`${x.toFixed(2)}px`);
    mascot.style.setProperty('--look-y',`${y}px`);
  }
  function emailMode(){
    clearModes();
    mascot.classList.add('is-email');
    trackEmail();
    setCaption('email');
  }
  function passwordMode(){
    clearModes();
    resetEyes();
    const visible=password.type==='text';
    mascot.classList.add(visible?'is-peeking':'is-secret');
    setCaption(visible?'peek':'secret');
  }
  function idleMode(){
    clearModes();
    resetEyes();
    setCaption('idle');
  }
  function syncFocus(){
    if(document.activeElement===email)return emailMode();
    if(document.activeElement===password)return passwordMode();
    idleMode();
  }

  email.addEventListener('focus',emailMode);
  email.addEventListener('input',()=>{emailMode();trackEmail()});
  email.addEventListener('keyup',trackEmail);
  email.addEventListener('click',trackEmail);
  email.addEventListener('blur',()=>setTimeout(syncFocus,0));

  password.addEventListener('focus',passwordMode);
  password.addEventListener('input',passwordMode);
  password.addEventListener('blur',()=>setTimeout(syncFocus,0));

  document.addEventListener('click',event=>{
    if(event.target.closest?.('.password-visibility'))requestAnimationFrame(passwordMode);
  });

  [email,password].forEach(input=>input.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    event.preventDefault();
    document.getElementById('loginButton')?.click();
  }));

  idleMode();
})();
