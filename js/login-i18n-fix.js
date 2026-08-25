setLanguage=function(lang){
  const next=typeof normalizeOleiroLanguage==='function'?(normalizeOleiroLanguage(lang)||'pt'):lang;
  localStorage.setItem('oleiro-language',next);
  if(typeof closeLanguageModal==='function')closeLanguageModal();
  location.reload();
};
