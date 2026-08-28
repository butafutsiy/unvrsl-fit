'use strict';
(()=>{
  if(window.__trainerClientCanonicalGuardV118)return;
  window.__trainerClientCanonicalGuardV118=true;

  const style=document.createElement('style');
  style.id='trainer-client-canonical-v118-style';
  style.textContent=`
    .trainer-self-profile-v111>.card>.row.between>.btn{display:none!important}
    .tcv3-add.primary{background:var(--accent,#30d158)!important;color:#07110a!important;border-color:transparent!important}
  `;
  document.head.appendChild(style);

  let opening=false;
  let canonicalDetail=null;

  function clientIdFromCard(card){
    if(card?.dataset?.clientId)return card.dataset.clientId;
    const raw=card?.getAttribute?.('onclick')||'';
    const m=raw.match(/trainerClientDetail\(['\"]([^'\"]+)['\"]\)/);
    return m?.[1]||'';
  }

  function captureCanonical(){
    const f=window.trainerClientDetail;
    if(!window.__unvrslTrainerDirectUIV3||typeof f!=='function')return null;
    // profile-stats.js and older client patches wrap trainerClientDetail later.
    // Capture the clean trainer-direct-ui implementation before those wrappers.
    if(f.__profileStats||f.__clientV2||f.__cleanV113)return null;
    canonicalDetail=f;
    window.__trainerClientDetailCanonicalV118=f;
    return f;
  }

  async function waitForCanonical(){
    if(canonicalDetail)return canonicalDetail;
    for(let i=0;i<240;i++){
      const f=captureCanonical();
      if(f)return f;
      await new Promise(r=>setTimeout(r,25));
    }
    return null;
  }

  function normalizeClientSheet(){
    const sh=document.getElementById('sheet');
    const tabs=sh?.querySelector('.tcv3-tabs');
    const metrics=sh?.querySelector('.metrics');
    if(!sh||!tabs||!metrics)return;

    // Nothing from legacy client-detail patches is allowed between the
    // canonical metrics and the canonical Workouts / Measurements tabs.
    let n=tabs.previousElementSibling;
    while(n&&n!==metrics){
      const prev=n.previousElementSibling;
      n.remove();
      n=prev;
    }

    sh.querySelectorAll('.trainer-live-programs,.trainer-remove-programs-block,.trainer-program-control-v2,.online-client-body-progress,.trainer-client-profile-card,.trainer-profile-card').forEach(x=>x.remove());

    const add=sh.querySelector('.tcv3-add');
    if(add){add.textContent='＋ Отправить программу';add.classList.add('primary');}
  }

  const observer=new MutationObserver(()=>queueMicrotask(normalizeClientSheet));
  observer.observe(document.documentElement,{childList:true,subtree:true});

  async function openCanonical(id){
    if(!id||opening)return;
    opening=true;
    try{
      if(typeof window.toast==='function')window.toast('Открываю клиента…');
      const fn=await waitForCanonical();
      if(!fn){
        if(typeof window.toast==='function')window.toast('Карточка клиента ещё загружается');
        return;
      }
      await fn(id);
      normalizeClientSheet();
      [30,80,160,300,600,1200,2200,4000].forEach(t=>setTimeout(normalizeClientSheet,t));
    }finally{
      opening=false;
    }
  }

  // The client card has one entry point. Legacy onclick handlers never run.
  document.addEventListener('click',e=>{
    const card=e.target.closest?.('#clients .client-card');
    if(!card)return;
    const id=clientIdFromCard(card);
    if(!id)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openCanonical(id);
  },true);

  // Start capturing as soon as trainer-direct-ui finishes loading.
  const captureTimer=setInterval(()=>{if(captureCanonical())clearInterval(captureTimer)},25);
  setTimeout(()=>clearInterval(captureTimer),12000);

  window.openTrainerClientCanonicalV118=openCanonical;
})();
