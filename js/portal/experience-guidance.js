/* Portal — refinamento de rótulo no perfil do voluntário. */
(function experienceGuidancePortal(){
  const baseVolunteerProfile=volunteerProfile;
  volunteerProfile=function(){return baseVolunteerProfile().replace(/E-mail/g,'Email')};
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
