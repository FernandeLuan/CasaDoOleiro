/* Login */
(function registerLoginTranslations(){
  if(typeof OLEIRO_TRANSLATIONS==='undefined')return;
  Object.assign(OLEIRO_TRANSLATIONS.en,{
    'Acesso à Casa do Oleiro':'Access to Casa do Oleiro',
    'SEU ESPAÇO NA CASA':'YOUR PLACE AT THE HOUSE',
    'Servir começa com cuidado.':'Serving starts with care.',
    'Planejamento, estadia e rotina em um único lugar.':'Planning, stay and routine in one place.',
    'Pode entrar. Estou de olho por aqui.':'Come in. I am keeping an eye on things here.',
    'Acompanhando seu e-mail…':'Following your email…',
    'Prometo não olhar.':'I promise I will not look.',
    'Só uma espiadinha.':'Just a quick peek.',
    'Bem-vindo de volta':'Welcome back',
    'Entre com seu e-mail e senha para continuar.':'Enter your email and password to continue.',
    'Email':'Email',
    'seuemail@exemplo.com':'youremail@example.com',
    'É segredo':'It is a secret',
    'Esqueci minha senha':'Forgot my password',
    'Acesso protegido':'Protected access',
    'Entrando...':'Signing in...',
    'Carregando informações':'Loading information',
    'Mostrar senha':'Show password',
    'Ocultar senha':'Hide password',
    'Informe seu e-mail para recuperar a senha.':'Enter your email to recover your password.',
    'Recuperação de senha indisponível. Atualize a página e tente novamente.':'Password recovery is unavailable. Refresh the page and try again.',
    'Se este e-mail estiver cadastrado, você receberá uma mensagem para definir uma nova senha.':'If this email is registered, you will receive a message to set a new password.',
    'Não foi possível enviar o e-mail de recuperação.':'The recovery email could not be sent.',
    'Autenticação indisponível. Atualize a página e tente novamente.':'Authentication is unavailable. Refresh the page and try again.',
    'Sessão inválida.':'Invalid session.',
    'Não foi possível entrar.':'Unable to sign in.'
  });
  Object.assign(OLEIRO_TRANSLATIONS.es,{
    'Acesso à Casa do Oleiro':'Acceso a Casa do Oleiro',
    'SEU ESPAÇO NA CASA':'TU ESPACIO EN LA CASA',
    'Servir começa com cuidado.':'Servir empieza con cuidado.',
    'Planejamento, estadia e rotina em um único lugar.':'Planificación, estadía y rutina en un solo lugar.',
    'Pode entrar. Estou de olho por aqui.':'Adelante. Estoy pendiente por aquí.',
    'Acompanhando seu e-mail…':'Siguiendo tu correo…',
    'Prometo não olhar.':'Prometo no mirar.',
    'Só uma espiadinha.':'Solo un vistazo.',
    'Bem-vindo de volta':'Bienvenido de nuevo',
    'Entre com seu e-mail e senha para continuar.':'Ingresa tu correo y contraseña para continuar.',
    'Email':'Correo electrónico',
    'seuemail@exemplo.com':'tucorreo@ejemplo.com',
    'É segredo':'Es secreto',
    'Esqueci minha senha':'Olvidé mi contraseña',
    'Acesso protegido':'Acceso protegido',
    'Entrando...':'Ingresando...',
    'Carregando informações':'Cargando información',
    'Mostrar senha':'Mostrar contraseña',
    'Ocultar senha':'Ocultar contraseña',
    'Informe seu e-mail para recuperar a senha.':'Ingresa tu correo para recuperar la contraseña.',
    'Recuperação de senha indisponível. Atualize a página e tente novamente.':'La recuperación de contraseña no está disponible. Actualiza la página e inténtalo de nuevo.',
    'Se este e-mail estiver cadastrado, você receberá uma mensagem para definir uma nova senha.':'Si este correo está registrado, recibirás un mensaje para definir una nueva contraseña.',
    'Não foi possível enviar o e-mail de recuperação.':'No fue posible enviar el correo de recuperación.',
    'Autenticação indisponível. Atualize a página e tente novamente.':'La autenticación no está disponible. Actualiza la página e inténtalo de nuevo.',
    'Sessão inválida.':'Sesión inválida.',
    'Não foi possível entrar.':'No fue posible ingresar.'
  });
})();

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

/* Vaso de barro: olhos seguem o ponteiro no desktop e os campos no touch. */
(function interactiveClayLogin(){
  const mascot=document.getElementById('loginMascot');
  const caption=document.getElementById('loginMascotCaption');
  const email=document.getElementById('email');
  const password=document.getElementById('password');
  if(!mascot||!email||!password)return;

  const finePointer=!!window.matchMedia?.('(hover:hover) and (pointer:fine)').matches;
  const tr=value=>typeof translateText==='function'?translateText(value):value;
  const captions={idle:'Pode entrar. Estou de olho por aqui.',email:'Acompanhando seu e-mail…',secret:'Prometo não olhar.',peek:'Só uma espiadinha.'};

  function setCaption(key){if(caption)caption.textContent=tr(captions[key]||captions.idle)}
  function setEyes(x=0,y=0){mascot.style.setProperty('--look-x',`${x.toFixed(2)}px`);mascot.style.setProperty('--look-y',`${y.toFixed(2)}px`)}
  function resetEyes(){setEyes(0,0)}
  function clearModes(){mascot.classList.remove('is-email','is-secret','is-peeking')}

  function trackPointer(event){
    if(!finePointer||mascot.classList.contains('is-secret'))return;
    const face=mascot.querySelector('.pot-face')||mascot;
    const rect=face.getBoundingClientRect();
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const dx=event.clientX-cx,dy=event.clientY-cy;
    const distance=Math.max(1,Math.hypot(dx,dy));
    const strength=Math.min(1,distance/230);
    setEyes((dx/distance)*5.5*strength,(dy/distance)*4*strength);
  }

  function trackEmailTouch(){
    if(finePointer)return;
    const value=String(email.value||'');
    const caret=Number.isFinite(email.selectionStart)?email.selectionStart:value.length;
    const denominator=Math.max(8,Math.min(30,value.length+6));
    const ratio=Math.max(0,Math.min(1,caret/denominator));
    setEyes(-4+(ratio*8),value.length>18?1:0);
  }

  function emailMode(){
    clearModes();mascot.classList.add('is-email');
    if(!finePointer)trackEmailTouch();
    setCaption('email');
  }
  function passwordMode(){
    clearModes();
    const visible=password.type==='text';
    mascot.classList.add(visible?'is-peeking':'is-secret');
    if(!visible)resetEyes();
    setCaption(visible?'peek':'secret');
  }
  function idleMode(){
    clearModes();
    if(!finePointer)resetEyes();
    setCaption('idle');
  }
  function syncFocus(){
    if(document.activeElement===email)return emailMode();
    if(document.activeElement===password)return passwordMode();
    idleMode();
  }

  if(finePointer)window.addEventListener('pointermove',trackPointer,{passive:true});
  email.addEventListener('focus',emailMode);
  email.addEventListener('input',()=>{emailMode();trackEmailTouch()});
  email.addEventListener('keyup',trackEmailTouch);
  email.addEventListener('click',trackEmailTouch);
  email.addEventListener('blur',()=>setTimeout(syncFocus,0));
  password.addEventListener('focus',passwordMode);
  password.addEventListener('input',passwordMode);
  password.addEventListener('blur',()=>setTimeout(syncFocus,0));

  document.addEventListener('click',event=>{if(event.target.closest?.('.password-visibility'))requestAnimationFrame(passwordMode)});
  [email,password].forEach(input=>input.addEventListener('keydown',event=>{if(event.key!=='Enter')return;event.preventDefault();document.getElementById('loginButton')?.click()}));

  idleMode();
})();
