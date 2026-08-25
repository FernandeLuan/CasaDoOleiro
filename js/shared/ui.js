function showToast(msg){toastEl.textContent=typeof translateText==='function'?translateText(msg):msg;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),2200)}
function toggleTheme(){state.theme=state.theme==='dark'?'light':'dark';localStorage.setItem('oleiro-theme',state.theme);document.documentElement.classList.toggle('dark',state.theme==='dark');render()}
function menuLink(icon,title,desc,action){return `<button class="menu-link" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${title}<small>${desc}</small></span><i class="fa-solid fa-chevron-right" style="color:var(--muted)"></i></button>`}
function openModal(title,subtitle,body,footer=''){document.body.classList.add('modal-open');modalRoot.innerHTML=`<div class="modal-backdrop" role="presentation" onclick="if(event.target===this)closeModal()"><div class="modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-head"><div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div><button class="modal-close" onclick="closeModal()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></div>${body}${footer}</div></div>`;if(typeof applyI18n==='function')applyI18n(modalRoot);requestAnimationFrame(()=>{const modal=modalRoot.querySelector('.modal');if(modal)modal.scrollTop=0})}
function closeModal(){document.body.classList.remove('modal-open');modalRoot.innerHTML=''}

const OLEIRO_LOADING_DELAY_MS=600;
let _oleiroLoadingDepth=0;
let _oleiroLoadingTimer=null;
function ensureGlobalLoading(){
  let el=document.getElementById('globalLoading');
  if(el)return el;
  el=document.createElement('div');
  el.id='globalLoading';
  el.className='global-loading';
  el.hidden=true;
  el.innerHTML='<div class="global-loading-card"><span class="global-loading-spinner" aria-hidden="true"></span><strong>Carregando...</strong><small>Aguarde um instante</small></div>';
  document.body.appendChild(el);
  return el;
}
function beginGlobalLoading(delay=OLEIRO_LOADING_DELAY_MS){
  _oleiroLoadingDepth+=1;
  if(_oleiroLoadingDepth!==1)return;
  clearTimeout(_oleiroLoadingTimer);
  _oleiroLoadingTimer=setTimeout(()=>{const el=ensureGlobalLoading();el.hidden=false},delay);
}
function endGlobalLoading(){
  _oleiroLoadingDepth=Math.max(0,_oleiroLoadingDepth-1);
  if(_oleiroLoadingDepth)return;
  clearTimeout(_oleiroLoadingTimer);
  _oleiroLoadingTimer=null;
  const el=document.getElementById('globalLoading');
  if(el)el.hidden=true;
}
async function withGlobalLoading(task,delay=OLEIRO_LOADING_DELAY_MS){
  beginGlobalLoading(delay);
  try{return await (typeof task==='function'?task():task)}finally{endGlobalLoading()}
}
window.OleiroLoading={begin:beginGlobalLoading,end:endGlobalLoading,run:withGlobalLoading,delay:OLEIRO_LOADING_DELAY_MS};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureGlobalLoading,{once:true});else ensureGlobalLoading();

function infoAccordion(){return `<div class="info-accordion"><details><summary>Como chegar <i class="fa-solid fa-chevron-down"></i></summary><p>A unidade fica em Rodeio/SC. Antes da chegada, confirme com a equipe o melhor transporte e o horário previsto. Dependendo do horário pode haver possibilidade de apoio na chegada.</p></details><details><summary>Acomodação <i class="fa-solid fa-chevron-down"></i></summary><p>Homens utilizam quartos e banheiros compartilhados. Mulheres ficam em quarto e banheiro separados. Wi-Fi, cozinha e lavanderia estão disponíveis.</p></details><details><summary>Refeições <i class="fa-solid fa-chevron-down"></i></summary><p>Todas as refeições são oferecidas na unidade de Rodeio. Avise previamente caso possua alguma restrição alimentar importante.</p></details><details><summary>Rotina da comunidade <i class="fa-solid fa-chevron-down"></i></summary><p>A rotina começa às 06:00 e possui momentos de atividades práticas, reuniões, refeições e atividades noturnas. Ela é flexível devido aos atendimentos terapêuticos e profissionais.</p></details><details><summary>Princípios e religião <i class="fa-solid fa-chevron-down"></i></summary><p>A Casa possui princípios cristãos e momentos de oração. O voluntário não precisa ser cristão nem participar das atividades religiosas.</p></details><details><summary>Convivência e segurança <i class="fa-solid fa-chevron-down"></i></summary><p>Álcool, drogas e cigarros são proibidos. Fotos e vídeos dos acolhidos exigem autorização prévia. Voluntários não exercem funções clínicas, medicamentosas ou terapêuticas.</p></details></div>`}
function logout(){sessionStorage.removeItem('oleiro-role');sessionStorage.removeItem('oleiro-volunteer-mode');sessionStorage.removeItem('oleiro-volunteer-plan-status');location.href=document.body.dataset.root||'../index.html'}
