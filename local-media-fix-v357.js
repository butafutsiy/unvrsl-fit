'use strict';
(()=>{
  if(window.__unvrslLocalMediaV357)return;
  window.__unvrslLocalMediaV357=true;
  let base=null;
  try{base=window.mediaUrl||mediaUrl}catch(_){base=window.mediaUrl}
  const wrapped=function(path=''){
    const p=String(path||'').trim();
    if(!p)return'';
    if(/^https?:/i.test(p)||/^data:/i.test(p)||/^blob:/i.test(p))return p;
    if(/^(?:\.\/)?assets\//i.test(p)||p.startsWith('/')){
      try{return new URL(p.replace(/^\.\//,''),document.baseURI).href}catch(_){return p}
    }
    return typeof base==='function'?base(path):p;
  };
  window.mediaUrl=wrapped;
  try{mediaUrl=wrapped}catch(_){ }
  try{if(document.querySelector('#exercises.page.active')&&typeof renderExerciseResults==='function')renderExerciseResults()}catch(_){ }
})();
