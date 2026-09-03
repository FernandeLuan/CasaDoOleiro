/* R60 homologation late loader.
   Loads the visual layer only after the real application modules are available. */
(function loadR60Late(){
  const params=new URLSearchParams(location.search);
  const demo=params.has('demo')||/--visual-redesign-|--realbase-/.test(location.hostname);
  if(!demo)return;

  const current=document.currentScript?.src;
  if(!current)return;
  const sharedBase=new URL('./',current);

  if(!document.querySelector('link[data-r60-style]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.dataset.r60Style='true';
    link.href=new URL('../../css/redesign-r60.css?v=20260902-r60-late',sharedBase).href;
    document.head.appendChild(link);
  }

  const script=document.createElement('script');
  script.src=new URL('redesign-r60.js?v=20260902-r60-late',sharedBase).href;
  script.dataset.r60Late='true';
  script.onload=()=>{
    document.documentElement.classList.add('redesign-r60');
    const rerender=()=>{try{if(typeof render==='function')render()}catch(error){console.error('R60 late render:',error)}};
    queueMicrotask(rerender);
    setTimeout(rerender,60);
  };
  script.onerror=()=>console.error('Não foi possível carregar a camada visual R60. A interface original foi mantida.');
  document.body.appendChild(script);
})();
