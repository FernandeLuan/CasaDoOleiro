/* Rascunhos automáticos para formulários modais.
   Não armazena senhas, arquivos, tokens ou campos marcados com data-no-draft. */
(function draftManager(){
  if(window.__OLEIRO_DRAFT_MANAGER__)return;
  window.__OLEIRO_DRAFT_MANAGER__=true;
  const root=document.getElementById('modalRoot');if(!root)return;

  const PREFIX='oleiro.draft.v1.';
  const TTL=24*60*60*1000;
  let activeModal=null,activeKey='',activeInitial='',saveTimer=0,lastSubmitKey='';

  const safeStorage={
    get(key){try{return JSON.parse(sessionStorage.getItem(PREFIX+key)||'null')}catch{return null}},
    set(key,value){try{sessionStorage.setItem(PREFIX+key,JSON.stringify(value))}catch{}},
    remove(key){try{sessionStorage.removeItem(PREFIX+key)}catch{}}
  };
  const hash=value=>{let h=2166136261;for(const char of String(value||'')){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const sensitive=field=>{
    const type=String(field.type||'').toLowerCase(),token=(String(field.id||'')+' '+String(field.name||'')+' '+String(field.autocomplete||'')).toLowerCase();
    return field.hasAttribute('data-no-draft')||['password','file','hidden','submit','button','reset'].includes(type)||/password|senha|secret|token|otp|one-time|cc-number|cvc|cvv/.test(token);
  };
  const fields=modal=>[...modal.querySelectorAll('input,textarea,select')].filter(field=>!field.disabled&&!sensitive(field));
  const supportsDraft=modal=>fields(modal).some(field=>field.matches('textarea,input[type="text"],input:not([type]),input[type="email"],input[type="tel"],input[type="number"],input[type="date"],input[type="time"]'));
  function serialize(modal){
    return fields(modal).map((field,index)=>{
      const key=field.id||field.name||('field-'+index),type=String(field.type||field.tagName).toLowerCase();
      if(type==='checkbox'||type==='radio')return {key,type,checked:!!field.checked,value:String(field.value||'')};
      if(field.tagName==='SELECT'&&field.multiple)return {key,type:'select-multiple',value:[...field.selectedOptions].map(option=>option.value)};
      return {key,type,value:String(field.value??'')};
    });
  }
  const snapshot=modal=>JSON.stringify(serialize(modal));
  function fingerprint(modal){
    const title=modal.querySelector('.modal-head h2')?.textContent?.trim()||'modal';
    const action=[...modal.querySelectorAll('button[onclick]')].map(button=>button.getAttribute('onclick')||'').join('|');
    const ids=fields(modal).map((field,index)=>field.id||field.name||('field-'+index)).join('|');
    const view=window.OleiroUI?.viewKey?.()||location.pathname;
    return hash(view+'|'+title+'|'+action+'|'+ids);
  }
  function findField(modal,item,index){
    const list=fields(modal),byId=item.key&&modal.querySelector('#'+CSS.escape(item.key));if(byId&&!sensitive(byId))return byId;
    const byName=item.key&&modal.querySelector('[name="'+CSS.escape(item.key)+'"]');return byName&&!sensitive(byName)?byName:list[index]||null;
  }
  function applyDraft(modal,items){
    (items||[]).forEach((item,index)=>{
      const field=findField(modal,item,index);if(!field)return;
      if(item.type==='checkbox'||item.type==='radio')field.checked=!!item.checked;
      else if(item.type==='select-multiple'&&Array.isArray(item.value))[...field.options].forEach(option=>option.selected=item.value.includes(option.value));
      else field.value=item.value??'';
      field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }
  function meaningfulDifference(record,initial){
    if(!record?.values||Date.now()-Number(record.savedAt||0)>TTL)return false;
    return JSON.stringify(record.values)!==initial;
  }
  function removeBanner(modal){modal.querySelector('.ui-draft-banner')?.remove()}
  function showBanner(modal,key,record,initial){
    removeBanner(modal);
    if(!meaningfulDifference(record,initial))return;
    const body=modal.querySelector('.modal-body');if(!body)return;
    const banner=document.createElement('div');banner.className='ui-draft-banner';
    banner.innerHTML='<div class="ui-draft-copy"><i class="fa-regular fa-pen-to-square"></i><span><strong>Rascunho salvo</strong><small>Há alterações não concluídas desta tela.</small></span></div><div class="ui-draft-actions"><button class="ui-draft-restore" type="button">Restaurar</button><button class="ui-draft-discard" type="button">Descartar</button></div>';
    banner.querySelector('.ui-draft-restore').addEventListener('click',()=>{applyDraft(modal,record.values);removeBanner(modal);queueSave(modal,key);typeof showToast==='function'&&showToast('Rascunho restaurado.')});
    banner.querySelector('.ui-draft-discard').addEventListener('click',()=>{safeStorage.remove(key);removeBanner(modal);typeof showToast==='function'&&showToast('Rascunho descartado.')});
    body.prepend(banner);
  }
  function save(modal,key){
    if(!modal?.isConnected||!supportsDraft(modal))return;
    const current=snapshot(modal);if(current===activeInitial){safeStorage.remove(key);return}
    safeStorage.set(key,{savedAt:Date.now(),values:serialize(modal)});
  }
  function queueSave(modal,key){window.clearTimeout(saveTimer);saveTimer=window.setTimeout(()=>save(modal,key),260)}
  function isSubmitAction(button){
    if(!button)return false;
    const token=(String(button.id||'')+' '+String(button.className||'')+' '+String(button.textContent||'')+' '+String(button.getAttribute('onclick')||'')).toLowerCase();
    if(/cancelar|fechar|voltar|descartar/.test(token))return false;
    return button.classList.contains('btn-primary')||/save|salvar|adicionar|criar|enviar|confirmar|mover|alterar|aprovar|finalizar|submit/.test(token);
  }
  function bind(modal){
    if(!modal||modal===activeModal||!supportsDraft(modal))return;
    activeModal=modal;activeKey=fingerprint(modal);activeInitial=snapshot(modal);
    const record=safeStorage.get(activeKey);if(record&&Date.now()-Number(record.savedAt||0)>TTL)safeStorage.remove(activeKey);else showBanner(modal,activeKey,record,activeInitial);
    modal.addEventListener('input',event=>{if(event.target instanceof Element&&fields(modal).includes(event.target))queueSave(modal,activeKey)});
    modal.addEventListener('change',event=>{if(event.target instanceof Element&&fields(modal).includes(event.target))queueSave(modal,activeKey)});
    modal.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!isSubmitAction(button))return;
      lastSubmitKey=activeKey;
      requestAnimationFrame(()=>{if(button.disabled)modal.dataset.uiDraftSubmitting='1'});
    },true);
  }
  function successMessage(message){
    const value=String(message||'').toLowerCase();
    if(/não foi|nao foi|erro|falha|inválid|invalido|informe|selecione|confira|obrigat/.test(value))return false;
    return /salv|adicion|criad|atualiz|alterad|movid|enviad|confirmad|aprovad|conclu/.test(value);
  }

  const baseToast=typeof window.showToast==='function'?window.showToast:null;
  if(baseToast&&!baseToast.__draftWrapped){
    const wrapped=function(message,...rest){if(lastSubmitKey&&successMessage(message)){safeStorage.remove(lastSubmitKey);lastSubmitKey=''}return baseToast.call(this,message,...rest)};
    wrapped.__draftWrapped=true;window.showToast=wrapped;
  }

  const observer=new MutationObserver(()=>{
    const current=root.querySelector('.modal');
    if(activeModal&&!activeModal.isConnected){
      if(activeModal.dataset.uiDraftSubmitting==='1'&&activeKey)safeStorage.remove(activeKey);
      activeModal=null;activeKey='';activeInitial='';
    }
    if(current&&current!==activeModal)bind(current);
  });
  observer.observe(root,{childList:true,subtree:true});
  bind(root.querySelector('.modal'));

  window.OleiroUI=window.OleiroUI||{};
  window.OleiroUI.clearCurrentDraft=()=>{if(activeKey)safeStorage.remove(activeKey);removeBanner(activeModal)};
})();