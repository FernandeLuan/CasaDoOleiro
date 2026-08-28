/* Volunteer emergency contact: uses the profile already loaded at sign-in, so opening Profile adds no Firestore read. */
(function portalEmergencyContact(){
  const text=key=>typeof t==='function'?t(key):key;
  const normalize=value=>window.OleiroServices?.profiles?.normalizeEmergencyContact?.(value)||{name:String(value?.name||'').trim(),relationship:String(value?.relationship||'').trim(),phone:String(value?.phone||'').trim()};
  const hasContact=value=>{const row=normalize(value);return !!(row.name||row.relationship||row.phone)};

  function cardHtml(){
    const row=normalize(state.currentSession?.profile?.emergencyContact),has=hasContact(row);
    const details=has?`<div class="profile-details volunteer-profile-details emergency-profile-details"><div><span>${escapeHtml(text('emergency.name'))}</span><strong>${escapeHtml(row.name||text('emergency.none'))}</strong></div><div><span>${escapeHtml(text('emergency.relationship'))}</span><strong>${escapeHtml(row.relationship||text('emergency.none'))}</strong></div><div><span>${escapeHtml(text('emergency.phone'))}</span><strong>${escapeHtml(row.phone||text('emergency.none'))}</strong></div></div>`:`<div class="empty">${escapeHtml(text('emergency.none'))}</div>`;
    const action=has?`<button class="btn btn-outline btn-xs emergency-edit-icon" type="button" onclick="openMyEmergencyContactEditor()" aria-label="${escapeHtml(text('emergency.edit'))}" title="${escapeHtml(text('emergency.edit'))}"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>`:`<button class="btn btn-outline btn-xs" type="button" onclick="openMyEmergencyContactEditor()"><i class="fa-solid fa-pen" aria-hidden="true"></i>${escapeHtml(text('emergency.add'))}</button>`;
    return `<div class="card volunteer-emergency-card"><div class="account-card-head"><div><span class="eyebrow">${escapeHtml(text('emergency.title'))}</span></div>${action}</div>${details}</div>`;
  }

  const baseVolunteerProfile=volunteerProfile;
  volunteerProfile=function(){const html=baseVolunteerProfile();return html.replace(/<\/section>\s*$/,`${cardHtml()}</section>`)};

  window.openMyEmergencyContactEditor=function(){
    const row=normalize(state.currentSession?.profile?.emergencyContact),has=hasContact(row);
    const body=`<div class="form-grid"><div class="field"><label for="myEmergencyName">${escapeHtml(text('emergency.name'))}</label><input id="myEmergencyName" class="input" value="${escapeHtml(row.name)}" placeholder="${escapeHtml(text('emergency.namePlaceholder'))}"></div><div class="field"><label for="myEmergencyRelationship">${escapeHtml(text('emergency.relationship'))}</label><input id="myEmergencyRelationship" class="input" value="${escapeHtml(row.relationship)}" placeholder="${escapeHtml(text('emergency.relationshipPlaceholder'))}"></div><div class="field"><label for="myEmergencyPhone">${escapeHtml(text('emergency.phone'))}</label><input id="myEmergencyPhone" class="input" type="tel" value="${escapeHtml(row.phone)}" placeholder="${escapeHtml(text('emergency.phonePlaceholder'))}"></div></div>`;
    const footer=`<div class="confirm-actions emergency-contact-actions">${has?`<button class="btn btn-danger-soft" type="button" onclick="clearMyEmergencyContact()">${escapeHtml(text('emergency.clear'))}</button>`:'<span class="emergency-action-placeholder" aria-hidden="true"></span>'}<button class="btn btn-outline" type="button" onclick="closeModal()">${escapeHtml(typeof t==='function'?t('common.cancel'):'Cancelar')}</button><button id="saveMyEmergencyButton" class="btn btn-primary" type="button" onclick="saveMyEmergencyContact()" aria-label="${escapeHtml(text('emergency.saveAria'))}">${escapeHtml(text('emergency.save'))}</button></div>`;
    openModal(text('emergency.title'),'',body,footer);
  };

  window.saveMyEmergencyContact=async function(){
    const uid=state.currentSession?.uid,button=document.getElementById('saveMyEmergencyButton');if(!uid)return showToast(text('emergency.error'));
    const row={name:document.getElementById('myEmergencyName')?.value.trim()||'',relationship:document.getElementById('myEmergencyRelationship')?.value.trim()||'',phone:document.getElementById('myEmergencyPhone')?.value.trim()||''};if(hasContact(row)&&(!row.name||!row.phone))return showToast(text('emergency.required'));
    if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(typeof t==='function'?t('action.saving'):'Salvando...')}`}
    try{const saved=await window.OleiroServices.profiles.updateEmergencyContact(uid,row);state.currentSession.profile={...(state.currentSession.profile||{}),emergencyContact:saved};closeModal();render();showToast(text('emergency.saved'))}catch(error){console.error(error);showToast(error?.message||text('emergency.error'));if(button?.isConnected){button.disabled=false;button.textContent=text('emergency.save')}}
  };

  window.clearMyEmergencyContact=async function(){
    const uid=state.currentSession?.uid;if(!uid)return;
    try{const saved=await window.OleiroServices.profiles.updateEmergencyContact(uid,{name:'',relationship:'',phone:''});state.currentSession.profile={...(state.currentSession.profile||{}),emergencyContact:saved};closeModal();render();showToast(text('emergency.saved'))}catch(error){console.error(error);showToast(error?.message||text('emergency.error'))}
  };

  window.volunteerProfile=volunteerProfile;if(state.role==='volunteer'&&state.volunteerPage==='profile'&&typeof render==='function')render();
})();