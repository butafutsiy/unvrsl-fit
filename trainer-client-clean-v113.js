'use strict';
(()=>{
  if(window.__trainerClientCleanV113)return;
  window.__trainerClientCleanV113=true;

  let observer=null;
  let activeClient=null;

  function isClientSheet(){
    const sh=document.getElementById('sheet');
    return !!(sh&&activeClient&&sh.querySelector('.tcv3-tabs'));
  }

  function cleanup(){
    const sh=document.getElementById('sheet');
    if(!sh||!activeClient)return;
    const tabs=sh.querySelector('.tcv3-tabs');
    if(!tabs)return;

    // Удаляем старые добавки, которые прежние тренерские патчи
    // продолжают подмешивать в новый экран клиента.
    sh.querySelectorAll('.trainer-live-programs,.trainer-remove-programs-block,.trainer-client-profile-card,.trainer-profile-card').forEach(x=>x.remove());

    // Старые карточки «Профиль / Рост · возраст / Не указан».
    [...sh.querySelectorAll('.card,.rule-card,.listline')].forEach(x=>{
      if(x.closest('.tcv3-program-head')||x.closest('#trainerClientTabBodyV3'))return;
      const t=(x.textContent||'').replace(/\s+/g,' ').trim();
      if(/^Профиль\b/i.test(t)&&/Рост\s*·\s*возраст/i.test(t))x.remove();
    });

    // Должен остаться только один блок программ — тот, что ниже вкладок.
    const sections=[...sh.querySelectorAll('.section')].filter(x=>/^ПРОГРАММЫ$/i.test((x.textContent||'').trim()));
    sections.forEach(sec=>{
      if(sec.closest('.tcv3-program-head'))return;
      let n=sec.nextElementSibling;
      sec.remove();
      while(n&&!n.classList.contains('section')&&!n.classList.contains('tcv3-tabs')){
        const next=n.nextElementSibling;n.remove();n=next;
      }
    });
  }

  function watch(){
    observer?.disconnect();
    const sh=document.getElementById('sheet');if(!sh)return;
    observer=new MutationObserver(()=>cleanup());
    observer.observe(sh,{childList:true,subtree:true});
    cleanup();
  }

  function install(){
    const base=window.trainerClientDetail;
    if(typeof base!=='function'||base.__cleanV113)return;
    const wrapped=async function(id){
      activeClient=id;
      const r=await base.apply(this,arguments);
      setTimeout(watch,0);
      setTimeout(cleanup,80);
      setTimeout(cleanup,250);
      setTimeout(cleanup,700);
      return r;
    };
    wrapped.__cleanV113=true;
    window.trainerClientDetail=wrapped;
    try{trainerClientDetail=wrapped}catch(e){}
  }

  install();
  [100,400,900,1600,3000].forEach(t=>setTimeout(install,t));

  const close=window.closeModal;
  if(typeof close==='function'&&!close.__clientCleanV113){
    const w=function(){activeClient=null;observer?.disconnect();observer=null;return close.apply(this,arguments)};
    w.__clientCleanV113=true;window.closeModal=w;try{closeModal=w}catch(e){}
  }
})();
