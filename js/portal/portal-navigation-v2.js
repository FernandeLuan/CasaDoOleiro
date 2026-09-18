/* Navegação unificada do portal: candidato e voluntário seguem o mesmo padrão do Admin. */
(function portalNavigationV2(){
  if(!/\/portal\//.test(location.pathname))return;
  if(window.__OLEIRO_PORTAL_NAV_V2__)return;
  window.__OLEIRO_PORTAL_NAV_V2__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function accountName(){
    const profile=state.currentSession?.profile||{},application=state.currentApplication||{};
    return profile.name||profile.fullName||(Array.isArray(application.participantNames)?application.participantNames[0]:null)||state.currentSession?.email||'Voluntário';
  }
  function initials(name){
    return String(name||'V').split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase()||'V';
  }
  function applicationDate(value){
    const iso=typeof portalIsoDate==='function'?portalIsoDate(value):String(value||'').slice(0,10);
    return iso&&typeof fmtDate==='function'?fmtDate(iso,true):'—';
  }
  function accountStatus(){
    const application=state.currentApplication||{};
    if(state.volunteerMode==='approved')return ['Voluntário aprovado','success'];
    if(state.volunteerPlanStatus==='submitted')return ['Em análise','info'];
    if(state.volunteerPlanStatus==='adjustments')return ['Ajustes solicitados','warning'];
    if(application.status==='rejected')return ['Não aprovado','danger'];
    return ['Candidatura em preparação','warning'];
  }

  window.setPortalTheme=function(target){
    const desired=target==='dark'?'dark':'light';
    if(String(state.theme||'light')===desired)return;
    if(typeof toggleTheme==='function')toggleTheme();
    setTimeout(()=>{if(state.role==='volunteer'&&typeof render==='function')render()},0);
  };

  window.header=header=function(){
    return `<header class="app-header simplified-header portal-header-v2">
      <div class="brand-row">
        <div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}">
          <div class="brand-mark"><i class="fa-solid fa-seedling"></i></div>
          <div class="brand-copy"><strong>Casa do Oleiro</strong></div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" type="button" onclick="navigateVolunteer('profile')" aria-label="Minha conta" title="Minha conta"><i class="fa-solid fa-user"></i></button>
          <button class="icon-btn" type="button" onclick="navigateVolunteer('info')" aria-label="Informações da Casa" title="Informações da Casa"><i class="fa-solid fa-circle-info"></i></button>
        </div>
      </div>
    </header>`;
  };

  window.volunteerNav=volunteerNav=function(){
    const approved=state.volunteerMode==='approved';
    if(approved&&state.volunteerPage==='plan')state.volunteerPage='agenda';
    const items=approved
      ?[['home','fa-house','Início'],['agenda','fa-calendar-check','Agenda'],['project','fa-seedling','Projeto'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações']]
      :[['home','fa-house','Início'],['plan','fa-calendar-plus','Planejamento'],['project','fa-seedling','Projeto'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações']];
    return `<nav class="bottom-nav volunteer-nav-current portal-nav-v2">${items.map(([id,icon,label])=>
      `<button class="nav-btn ${state.volunteerPage===id?'active':''}" type="button" onclick="navigateVolunteer('${id}')"><i class="fa-solid ${icon}"></i><span>${esc(label)}</span></button>`
    ).join('')}</nav>`;
  };

  window.volunteerProfile=volunteerProfile=function(){
    const session=state.currentSession||{},profile=session.profile||{},application=state.currentApplication||{};
    const name=accountName(),country=profile.country||profile.nationality||(Array.isArray(application.participantCountries)?application.participantCountries[0]:null)||'—';
    const unit=application.unitName||String(application.unitId||'—').replace(/^./,char=>char.toUpperCase());
    const email=profile.email||session.email||'—',phone=profile.phone||profile.whatsapp||'—',status=accountStatus();
    const dark=String(state.theme||'light')==='dark';
    const language=typeof currentLanguageCode==='function'?currentLanguageCode():'PT';
    return `<section class="section portal-account-page">
      <div class="section-head"><div><span class="eyebrow">Conta</span><h2>Minha conta</h2><p>Dados da sua estadia e preferências do portal.</p></div></div>
      <div class="card portal-account-card">
        <div class="volunteer-profile-identity portal-account-identity">
          <div class="profile-avatar">${esc(initials(name))}</div>
          <div><strong>${esc(name)}</strong><span>${esc(country)} • ${esc(unit)}</span></div>
        </div>
        <div class="profile-details portal-account-details">
          <div><span>Email</span><strong>${esc(email)}</strong></div>
          <div><span>WhatsApp</span><strong>${esc(phone)}</strong></div>
          <div><span>Período</span><strong>${applicationDate(application.stayStart)}–${applicationDate(application.stayEnd)}</strong></div>
          <div><span>Status</span><strong class="profile-status ${status[1]}">${esc(status[0])}</strong></div>
        </div>
      </div>
      <div class="card portal-account-preferences">
        <div class="portal-account-section-head"><small>Preferências</small><strong>Personalize o portal</strong></div>
        <button class="portal-account-row-button" type="button" onclick="openLanguageModal()">
          <span class="portal-account-row-icon"><i class="fa-solid fa-language"></i></span>
          <span><strong>Idioma</strong><small>${esc(language)}</small></span>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <div class="portal-theme-block">
          <div class="portal-theme-copy">
            <span class="portal-account-row-icon"><i class="fa-solid fa-circle-half-stroke"></i></span>
            <span><strong>Aparência</strong><small>Escolha entre claro e escuro.</small></span>
          </div>
          <div class="portal-theme-switch" role="group" aria-label="Aparência">
            <button type="button" class="${!dark?'active':''}" onclick="setPortalTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button>
            <button type="button" class="${dark?'active':''}" onclick="setPortalTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button>
          </div>
        </div>
      </div>
      <button class="btn btn-danger btn-block portal-account-signout" type="button" onclick="confirmVolunteerLogout()"><i class="fa-solid fa-right-from-bracket"></i>Sair</button>
    </section>`;
  };

  function sidebarButton(active,icon,label,page){
    return `<button class="portal-sidebar-item ${active?'active':''}" type="button" onclick="navigateVolunteer('${page}')"><i class="fa-solid ${icon}"></i><span>${esc(label)}</span></button>`;
  }

  function normalizeDesktopSidebar(){
    const sidebar=document.querySelector('.portal-sidebar-desktop');
    if(!sidebar)return;
    const approved=state.volunteerMode==='approved';
    const nav=sidebar.querySelector('.portal-sidebar-nav');
    if(nav){
      const items=approved
        ?[['home','fa-house','Início'],['agenda','fa-calendar-check','Agenda'],['project','fa-seedling','Projeto'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações']]
        :[['home','fa-house','Início'],['plan','fa-calendar-plus','Planejamento'],['project','fa-seedling','Projeto'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações']];
      nav.innerHTML=items.map(([page,icon,label])=>sidebarButton(state.volunteerPage===page,icon,label,page)).join('');
    }
    sidebar.querySelector('.portal-sidebar-tools')?.remove();
    const account=sidebar.querySelector('.portal-sidebar-account');
    if(account){
      account.innerHTML=`<button class="portal-sidebar-item ${state.volunteerPage==='profile'?'active':''}" type="button" onclick="navigateVolunteer('profile')"><i class="fa-solid fa-user"></i><span>Minha conta</span></button>
        <button class="portal-sidebar-item portal-sidebar-signout" type="button" onclick="confirmVolunteerLogout()"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></button>`;
    }
  }

  const baseVolunteerHome=typeof window.volunteerHome==='function'?window.volunteerHome:null;
  if(baseVolunteerHome){
    window.volunteerHome=volunteerHome=function(){
      let html=baseVolunteerHome();
      if(html.includes('legacy-home-callout'))return html;
      let callout='';
      if(typeof window.legacyProjectHomeNoticeHtml==='function')callout=window.legacyProjectHomeNoticeHtml()||'';
      if(!callout&&state.volunteerMode!=='approved'){
        callout=`<section class="legacy-home-callout portal-project-teaser">
          <span class="legacy-home-callout-icon"><i class="fa-solid fa-seedling"></i></span>
          <div><strong>Projeto de legado</strong><p>Conheça como funciona a contribuição que você poderá deixar para a comunidade.</p></div>
          <button class="btn btn-soft" type="button" onclick="navigateVolunteer('project')">Conhecer</button>
        </section>`;
      }
      if(!callout)return html;
      const heroEnd=html.indexOf('</section>');
      return heroEnd>=0?html.slice(0,heroEnd+10)+callout+html.slice(heroEnd+10):callout+html;
    };
  }

  const baseRenderVolunteer=typeof window.renderVolunteer==='function'?window.renderVolunteer:null;
  if(baseRenderVolunteer){
    window.renderVolunteer=renderVolunteer=function(){
      const result=baseRenderVolunteer();
      normalizeDesktopSidebar();
      return result;
    };
    window.render=render=function(){return renderVolunteer()};
  }

  normalizeDesktopSidebar();
  if(state.role==='volunteer'&&typeof render==='function')render();
})();