/* Round 3 — login: mostrar senha, feedback visual e transição mais curta. */
(function round3Login(){
  function fieldFor(id){return document.getElementById(id)?.closest('.field')||null}
  function clearInvalid(){['email','password'].forEach(id=>fieldFor(id)?.classList.remove('is-invalid'));const message=document.getElementById('loginMessage');message?.classList.remove('login-error')}
  function markInvalid(ids){ids.forEach(id=>fieldFor(id)?.classList.add('is-invalid'))}

  const password=document.getElementById('password');
  if(password&&!password.parentElement?.classList.contains('password-input-wrap')){
    const wrap=document.createElement('div');wrap.className='password-input-wrap';password.parentNode.insertBefore(wrap,password);wrap.appendChild(password);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='password-visibility';toggle.setAttribute('aria-label','Mostrar senha');toggle.innerHTML='<i class="fa-regular fa-eye"></i>';
    toggle.addEventListener('click',()=>{const visible=password.type==='text';password.type=visible?'password':'text';toggle.setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha');toggle.innerHTML=`<i class="fa-regular ${visible?'fa-eye':'fa-eye-slash'}"></i>`;password.focus()});wrap.appendChild(toggle);
  }
  document.getElementById('email')?.addEventListener('input',clearInvalid);
  document.getElementById('password')?.addEventListener('input',clearInvalid);

  destinationFor=function(role){if(role==='manager')return 'admin/';if(role==='volunteer')return 'portal/';return 'index.html'};
  startLoginTransition=function(role){if(loginTransitionTimer)return;const overlay=document.getElementById('loginLoading'),button=document.getElementById('loginButton');if(button)button.disabled=true;if(overlay)overlay.hidden=false;loginTransitionTimer=setTimeout(()=>{location.href=destinationFor(role)},120)};

  showLoginMessage=function(text,options={}){const el=document.getElementById('loginMessage');if(!el)return;el.textContent=typeof translateText==='function'?translateText(text):text;el.hidden=false;el.classList.toggle('login-error',options.error===true)};

  handleLogin=async function(){
    clearInvalid();const email=document.getElementById('email')?.value.trim()||'',passwordValue=document.getElementById('password')?.value||'';
    if(!email||!passwordValue){const missing=[];if(!email)missing.push('email');if(!passwordValue)missing.push('password');markInvalid(missing);return showLoginMessage('Informe e-mail e senha.',{error:true})}
    if(!window.OleiroAuth||typeof window.OleiroAuth.signIn!=='function')return showLoginMessage('Autenticação indisponível. Atualize a página e tente novamente.',{error:true});
    try{const session=await window.OleiroAuth.signIn({email,password:passwordValue});if(!session?.role)throw new Error('Sessão inválida.');return startLoginTransition(session.role)}catch(error){if(error?.code==='oleiro/invalid-credential')markInvalid(['email','password']);return showLoginMessage(error?.message||'Não foi possível entrar.',{error:true})}
  };

  handleForgotPassword=async function(){
    clearInvalid();const email=document.getElementById('email')?.value.trim()||'',button=document.getElementById('forgotPasswordButton');
    if(!email){markInvalid(['email']);return showLoginMessage('Informe seu e-mail para recuperar a senha.',{error:true})}
    if(!window.OleiroAuth||typeof window.OleiroAuth.sendPasswordReset!=='function')return showLoginMessage('Recuperação de senha indisponível. Atualize a página e tente novamente.',{error:true});
    try{if(button)button.disabled=true;await window.OleiroAuth.sendPasswordReset(email);showLoginMessage('Se este e-mail estiver cadastrado, você receberá uma mensagem para definir uma nova senha.')}catch(error){showLoginMessage(error?.message||'Não foi possível enviar o e-mail de recuperação.',{error:true})}finally{if(button)button.disabled=false}
  };
})();
