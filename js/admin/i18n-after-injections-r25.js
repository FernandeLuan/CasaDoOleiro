/* Round 25 — reaplica i18n após camadas que injetam conteúdo no modal. */
(function i18nAfterAdminInjectionsR25(){
  if(typeof renderPersonModal!=='function')return;
  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(...args){const result=baseRenderPersonModal(...args);if(typeof applyI18n==='function')applyI18n(modalRoot);return result};
  window.renderPersonModal=renderPersonModal;
})();
