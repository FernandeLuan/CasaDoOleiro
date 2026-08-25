function openModal(title,subtitle,body,footer=''){
  document.body.classList.add('modal-open');
  modalRoot.innerHTML=`<div class="modal-backdrop" role="presentation" onclick="if(event.target===this)closeModal()">
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-head">
        <div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div>
        <button class="modal-close" type="button" onclick="closeModal()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer?`<div class="modal-footer">${footer}</div>`:''}
    </div>
  </div>`;
  if(typeof applyI18n==='function')applyI18n(modalRoot);
  requestAnimationFrame(()=>{
    const bodyEl=modalRoot.querySelector('.modal-body');
    if(bodyEl)bodyEl.scrollTop=0;
  });
}

function closeModal(){
  document.body.classList.remove('modal-open');
  modalRoot.innerHTML='';
}
