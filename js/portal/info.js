function volunteerInfo(){return `<section class="section"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t('portal.info.eyebrow'))}</span><h2>${escapeHtml(t('portal.info.title'))}</h2><p>${escapeHtml(t('portal.info.subtitle'))}</p></div></div>${infoAccordion()}</section>`}

function volunteerProfileName(){
  const profile=state.currentSession?.profile||{};
  const application=state.currentApplication||{};
  return profile.name||profile.fullName||(Array.isArray(application.participantNames)?application.participantNames[0]:null)||state.currentSession?.email||t('role.volunteer');
}
function volunteerProfileInitials(name){return String(name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'V'}
function volunteerApplicationDate(value){const iso=typeof portalIsoDate==='function'?portalIsoDate(value):String(value||'').slice(0,10);return iso?fmtDate(iso,true):'—'}
window.setVolunteerTheme=function(target){window.setThemePreference?.(target);render();};
function volunteerProfile(){
  const session=state.currentSession||{};
  const profile=session.profile||{};
  const application=state.currentApplication||{};
  const name=volunteerProfileName();
  const country=profile.country||profile.nationality||(Array.isArray(application.participantCountries)?application.participantCountries[0]:null)||'—';
  const unit=application.unitName||String(application.unitId||'—').replace(/^./,c=>c.toUpperCase());
  const email=profile.email||session.email||'—';
  const phone=profile.phone||profile.whatsapp||'—';
  const status=state.volunteerMode==='approved'?t('portal.profile.approved'):state.volunteerPlanStatus==='submitted'?t('portal.profile.analysis'):state.volunteerPlanStatus==='adjustments'?t('portal.profile.adjustments'):application.status==='rejected'?t('portal.profile.rejected'):t('portal.profile.preparing');
  return `<section class="section volunteer-profile-page"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t('portal.profile.eyebrow'))}</span><h2>${escapeHtml(t('portal.profile.title'))}</h2><p>${escapeHtml(t('portal.profile.subtitle'))}</p></div></div><div class="profile-card"><div class="profile-avatar">${volunteerProfileInitials(name)}</div><div><strong>${escapeHtml(name)}</strong><p>${escapeHtml(country)} • ${escapeHtml(unit)}</p></div></div><div class="card profile-details" style="margin-top:12px"><div><span>${escapeHtml(t('portal.profile.email'))}</span><strong>${escapeHtml(email)}</strong></div><div><span>WhatsApp</span><strong>${escapeHtml(phone)}</strong></div><div><span>${escapeHtml(t('portal.profile.period'))}</span><strong>${volunteerApplicationDate(application.stayStart)}–${volunteerApplicationDate(application.stayEnd)}</strong></div><div><span>${escapeHtml(t('portal.profile.status'))}</span><strong>${escapeHtml(status)}</strong></div></div><section class="card portal-account-preferences" aria-labelledby="volunteerAppearanceTitle"><div class="portal-account-section-head"><small>Preferências</small><strong id="volunteerAppearanceTitle">Aparência do aplicativo</strong></div><div class="portal-theme-block"><div class="portal-theme-copy"><span class="portal-account-row-icon"><i class="fa-solid fa-circle-half-stroke"></i></span><div><strong>Tema</strong><small>Escolha como o Portal aparece neste dispositivo.</small></div></div><div class="portal-theme-switch" role="group" aria-label="Tema do Portal"><button class="${(state.themePreference||'system')==='system'?'active':''}" type="button" aria-pressed="${(state.themePreference||'system')==='system'}" onclick="setVolunteerTheme('system')"><i class="fa-solid fa-circle-half-stroke"></i>Sistema</button><button class="${state.themePreference==='light'?'active':''}" type="button" aria-pressed="${state.themePreference==='light'}" onclick="setVolunteerTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button><button class="${state.themePreference==='dark'?'active':''}" type="button" aria-pressed="${state.themePreference==='dark'}" onclick="setVolunteerTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button></div></div></section><button class="btn btn-danger btn-block" type="button" style="margin-top:18px" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>${escapeHtml(t('action.signOut'))}</button></section>`;
}
