/* Preferência de aparência compartilhada: Sistema, Claro ou Escuro. */
(function(){
 const valid=['system','light','dark'];let preference=valid.includes(state.themePreference)?state.themePreference:'system';
 const media=window.matchMedia?.('(prefers-color-scheme: dark)');
 function apply(){const dark=preference==='dark'||(preference==='system'&&!!media?.matches);state.themePreference=preference;state.theme=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark);document.documentElement.dataset.themePreference=preference;}
 window.setThemePreference=function(value){if(!valid.includes(value))return;preference=value;try{localStorage.setItem('oleiro-theme',value)}catch{}apply();};
 media?.addEventListener?.('change',()=>{if(preference==='system')apply()});apply();
})();