'use strict';
(()=>{
  if(window.__trainerClientCleanV116)return;
  window.__trainerClientCleanV116=true;

  const selfStyle=document.createElement('style');
  selfStyle.id='trainer-client-clean-v116-style';
  selfStyle.textContent=`
    .trainer-self-profile-v111>.card>.row.between>.btn{display:none!important}
    #sheet .trainer-live-programs,#sheet .trainer-remove-programs-block,#sheet .trainer-client-profile-card,#sheet .trainer-profile-card{display:none!important}
  `;
  document.head.appendChild(selfStyle);

  let busy=false;

  function cleanup(){
    if(busy)return;
    busy=true;
    try{
      const sh=document.getElementById('sheet');
      if(!sh||!sh.querySelector('.tcv3-tabs'))return;

      // Старые патчи не должны ничего добавлять поверх финального экрана клиента.
      sh.querySelectorAll('.trainer-live-programs,.trainer-remove-programs-block,.trainer-client-profile-card,.trainer-profile-card').forEach(x=>x.remove());

      // Удаляем любые старые карточки «Профиль / Рост · возраст», даже если у них нет специального класса.
      [...sh.querySelectorAll('.card,.rule-card,.listline')].forEach(x=>{
        if(x.closest('#trainerClientTabBodyV3'))return;
        const t=(x.textContent||'').replace(/\s+/g,' ').trim();
        if(/^Профиль\b/i.test(t)&&(/Рост\s*·\s*возраст/i.test(t)||/Не указан/i.test(t)))x.remove();
      });

      // Оставляем только финальный блок программ, который принадлежит tcv3.
      const programHeads=[...sh.querySelectorAll('.tcv3-program-head')];
      const canonicalHead=programHeads[0]||null;
      programHeads.slice(1).forEach(x=>x.remove());
      [...sh.querySelectorAll('.section')].forEach(sec=>{
        if(!/^ПРОГРАММЫ$/i.test((sec.textContent||'').trim()))return;
        if(canonicalHead&&sec.closest('.tcv3-program-head')===canonicalHead)return;
        let n=sec.nextElementSibling;
        sec.remove();
        while(n&&!n.classList.contains('section')&&!n.classList.contains('tcv3-tabs')){
          const next=n.nextElementSibling;
          n.remove();
          n=next;
        }
      });

      // Единое название кнопки назначения программы.
      const add=sh.querySelector('.tcv3-program-head .tcv3-add');
      if(add) add.textContent='＋ Отправить программу';
    }finally{
      busy=false;
    }
  }

  // Наблюдаем за всем документом: это не зависит от порядка загрузки trainer-direct-ui и старых патчей.
  const observer=new MutationObserver(()=>queueMicrotask(cleanup));
  observer.observe(document.documentElement,{childList:true,subtree:true});

  // Страховка для очень поздних вставок старых модулей.
  [0,50,120,250,500,900,1500,2500,4000,7000].forEach(t=>setTimeout(cleanup,t));

  document.addEventListener('click',()=>setTimeout(cleanup,0),true);
})();
