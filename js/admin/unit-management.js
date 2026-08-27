/* Gestão operacional das unidades. */
(function unitManagement(){
  function unitById(id){return (state.units||[]).find(unit=>String(unit.id)===String(id))||null}
  function unitStatus(unit){
    if(unit.active!==true)return ['Inativa','danger'];
    if(unit.acceptingVolunteers===false)return ['Ativa • cadastros pausados','warning'];
    return ['Ativa • aceitando voluntários','success'];
  }
  function unitActions(unit){
    const id=encodeURIComponent(String(unit.id));
    if(unit.active!==true)return `<button class="btn btn-primary" type="button" onclick="setUnitMode('${id}','activate')"><i class="fa-solid fa-play"></i>Ativar unidade</button>`;
    const intake=unit.acceptingVolunteers===false
      ?`<button class="btn btn-soft" type="button" onclick="setUnitMode('${id}','open')"><i class="fa-solid fa-user-plus"></i>Aceitar voluntários</button>`
      :`<button class="btn btn-outline" type="button" onclick="setUnitMode('${id}','pause-intake')"><i class="fa-solid fa-pause"></i>Pausar cadastros</button>`;
    return `${intake}<button class="btn btn-danger-soft" type="button" onclick="confirmPauseUnit('${id}')"><i class="fa-solid fa-circle-pause"></i>Pausar unidade</button>`;
  }

  window.openUnits=function(){
    const rows=state.units||[];
    const html=rows.length?rows.map(unit=>{const [label,type]=unitStatus(unit);return `<div class="card unit-admin-card"><div class="unit-admin-head"><span class="metric-icon"><i class="fa-solid fa-house"></i></span><div><h3>${escapeHtml(unit.name||unit.id)}</h3><div class="item-meta">${badge(label,type)}</div></div></div><div class="unit-admin-actions">${unitActions(unit)}</div></div>`}).join(''):'<div class="empty">Nenhuma unidade cadastrada.</div>';
    openModal('Unidades','Ative, pause ou controle novos cadastros por unidade.',`<div class="unit-admin-list">${html}</div>`);
    modalRoot.querySelector('.modal')?.classList.add('units-admin-modal');
  };

  window.confirmPauseUnit=function(encodedId){
    const id=decodeURIComponent(encodedId),unit=unitById(id);if(!unit)return;
    openModal('Pausar unidade',`${escapeHtml(unit.name||unit.id)} deixará de aparecer em novos cadastros. Perfis e estadias já existentes não são apagados.`,`<div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div>Você poderá reativar esta unidade depois pelo mesmo menu.</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="openUnits()">Voltar</button><button class="btn btn-danger" type="button" onclick="setUnitMode('${encodeURIComponent(id)}','pause')">Pausar unidade</button></div>`);
  };

  window.setUnitMode=async function(encodedId,mode){
    const id=decodeURIComponent(encodedId),unit=unitById(id);if(!unit||!window.OleiroServices?.units?.update)return showToast('Gestão da unidade indisponível.');
    let patch={},message='Unidade atualizada.';
    if(mode==='activate'){patch={active:true,acceptingVolunteers:true};message='Unidade ativada e aberta para novos cadastros.'}
    else if(mode==='open'){patch={acceptingVolunteers:true};message='Novos cadastros liberados para esta unidade.'}
    else if(mode==='pause-intake'){patch={acceptingVolunteers:false};message='Novos cadastros pausados para esta unidade.'}
    else if(mode==='pause'){patch={active:false,acceptingVolunteers:false};message='Unidade pausada.'}
    else return;
    try{
      await window.OleiroServices.units.update(id,patch);Object.assign(unit,patch);openUnits();showToast(message);
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar a unidade.')}
  };
})();
