/* Shared progress uses the same appearance preference without opening account data. */
(function(W,D){
  'use strict';
  const key='unvrsl-public-theme-v1',media=W.matchMedia?.('(prefers-color-scheme: light)');
  let mode='dark';
  try{
    const explicit=W.localStorage.getItem(key),state=JSON.parse(W.localStorage.getItem('unvrsl-fit-v3')||W.localStorage.getItem('unvrsl-fit-v2')||'{}'),appearance=JSON.parse(W.localStorage.getItem('unvrsl-appearance-v1')||'{}');
    mode=explicit||appearance[state.accountOwnerId||'local']?.theme||state.theme||'dark';
  }catch(_){}
  if(!['dark','light','system'].includes(mode))mode='dark';
  function apply(){
    const theme=mode==='system'?(media?.matches?'light':'dark'):mode;
    D.documentElement.dataset.theme=theme;
    D.documentElement.style.colorScheme=theme;
    const palette=D.querySelector('meta[name="theme-color"]'),scheme=D.querySelector('meta[name="color-scheme"]');
    if(palette)palette.content=theme==='light'?'#f4f5f8':'#050505';if(scheme)scheme.content=theme;
    const select=D.getElementById('pp-theme-mode');if(select)select.value=mode;
  }
  apply();
  const changed=()=>{if(mode==='system')apply();};
  if(media?.addEventListener)media.addEventListener('change',changed);else media?.addListener?.(changed);
  D.addEventListener('DOMContentLoaded',apply,{once:true});
  D.addEventListener('change',e=>{
    if(e.target.id!=='pp-theme-mode'||!['dark','light','system'].includes(e.target.value))return;
    mode=e.target.value;try{W.localStorage.setItem(key,mode);}catch(_){}apply();
  });
})(window,document);
