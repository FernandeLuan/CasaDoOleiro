(()=>{
  function enhanceAdminPlanning(){
    if(document.body.dataset.previewRole!=='admin')return;
    document.querySelectorAll('.workspace .activity').forEach(activity=>{
      if(activity.querySelector('.activity-actions'))return;
      const title=activity.querySelector('h4')?.textContent?.trim()||'Atividade';
      const day=activity.closest('.day-card')?.querySelector('[data-day]')?.dataset.day||'11/09';
      const actions=document.createElement('div');
      actions.className='activity-actions';
      actions.innerHTML=`<button class="btn soft small" data-replicate="${escapeAttr(title)}" data-date="${escapeAttr(day)}">⧉ Replicar atividade</button><button class="btn small" data-add-activity="${escapeAttr(day)}">＋ Adicionar atividade</button>`;
      activity.appendChild(actions);
    });
  }
  function escapeAttr(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function closeOverlay(){const root=document.getElementById('overlayRoot');if(root)root.innerHTML='';}
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-close-overlay]')){event.preventDefault();event.stopImmediatePropagation();closeOverlay();}
  },true);
  const observer=new MutationObserver(enhanceAdminPlanning);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  enhanceAdminPlanning();
})();
