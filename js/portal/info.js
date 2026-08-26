function volunteerInfo(){return `<section class="section"><div class="section-head"><div><span class="eyebrow">Portal</span><h2>Informações da Casa</h2><p>Consulte antes e durante sua experiência</p></div></div>${infoAccordion()}</section>`}

function volunteerProfileName(){
  const profile=state.currentSession?.profile||{};
  const application=state.currentApplication||{};
  return profile.name||profile.fullName||(Array.isArray(application.participantNames)?application.participantNames[0]:null)||state.currentSession?.email||'Voluntário';
}
function volunteerProfileInitials(name){return String(name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'V'}
function volunteerApplicationDate(value){const iso=typeof portalIsoDate==='function'?portalIsoDate(value):String(value||'').slice(0,10);return iso?fmtDate(iso,true):'—'}
function volunteerProfile(){
  const session=state.currentSession||{};
  const profile=session.profile||{};
  const application=state.currentApplication||{};
  const name=volunteerProfileName();
  const country=profile.country||profile.nationality||(Array.isArray(application.participantCountries)?application.participantCountries[0]:null)||'—';
  const unit=application.unitName||String(application.unitId||'—').replace(/^./,c=>c.toUpperCase());
  const email=profile.email||session.email||'—';
  const phone=profile.phone||profile.whatsapp||'—';
  const status=state.volunteerMode==='approved'?'Aprovado':state.volunteerPlanStatus==='submitted'?'Planejamento em análise':state.volunteerPlanStatus==='adjustments'?'Ajustes solicitados':application.status==='rejected'?'Perfil inativo':'Em preparação';
  return `<section class="section volunteer-profile-page"><div class="section-head"><div><span class="eyebrow">Conta</span><h2>Meu perfil</h2><p>Dados pessoais e do acesso</p></div></div><div class="profile-card"><div class="profile-avatar">${volunteerProfileInitials(name)}</div><div><strong>${escapeHtml(name)}</strong><p>${escapeHtml(country)} • ${escapeHtml(unit)}</p></div></div><div class="card profile-details" style="margin-top:12px"><div><span>E-mail</span><strong>${escapeHtml(email)}</strong></div><div><span>WhatsApp</span><strong>${escapeHtml(phone)}</strong></div><div><span>Período</span><strong>${volunteerApplicationDate(application.stayStart)}–${volunteerApplicationDate(application.stayEnd)}</strong></div><div><span>Status</span><strong>${status}</strong></div></div><button class="btn btn-danger btn-block" type="button" style="margin-top:18px" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>Sair</button></section>`;
}
