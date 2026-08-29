'use strict';
(()=>{
  if(window.__trainerClientCanonicalGuardV119)return;
  window.__trainerClientCanonicalGuardV119=true;

  const style=document.createElement('style');
  style.id='trainer-client-canonical-v119-style';
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
    if(f.__profileStats||f.__clientV2||f.__cleanV113)return null;
    canonicalDetail=f;
    window.__trainerClientDetailCanonicalV119=f;
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
    if(!sh||!tabs||!metrics)return false;

    let changed=false;
    let n=tabs.previousElementSibling;
    while(n&&n!==metrics){
      const prev=n.previousElementSibling;
      n.remove();
      changed=true;
      n=prev;
    }

    sh.querySelectorAll('.trainer-live-programs,.trainer-remove-programs-block,.trainer-program-control-v2,.online-client-body-progress,.trainer-client-profile-card,.trainer-profile-card').forEach(x=>{x.remove();changed=true});

    const add=sh.querySelector('.tcv3-add');
    if(add){
      if(add.textContent!=='＋ Отправить программу'){add.textContent='＋ Отправить программу';changed=true}
      if(!add.classList.contains('primary')){add.classList.add('primary');changed=true}
    }
    return changed;
  }

  const sheet=document.getElementById('sheet');
  if(sheet){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;normalizeClientSheet()});
    }).observe(sheet,{childList:true,subtree:true});
  }

  async function openCanonical(id){
    if(!id||opening)return;
    opening=true;
    try{
      const fn=await waitForCanonical();
      if(!fn){
        if(typeof window.toast==='function')window.toast('Карточка клиента ещё загружается');
        return;
      }
      await fn(id);
      normalizeClientSheet();
      [30,100,300,800,1800,3200].forEach(t=>setTimeout(normalizeClientSheet,t));
    }catch(e){
      console.warn('trainer client open',e);
      if(typeof window.modal==='function')window.modal('<div class="sheet-grabber"></div><div class="card muted">Не удалось загрузить клиента. Попробуй открыть ещё раз.</div>');
    }finally{
      opening=false;
    }
  }

  document.addEventListener('click',e=>{
    const card=e.target.closest?.('#clients .client-card');
    if(!card)return;
    const id=clientIdFromCard(card);
    if(!id)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openCanonical(id);
  },true);

  const captureTimer=setInterval(()=>{if(captureCanonical())clearInterval(captureTimer)},25);
  setTimeout(()=>clearInterval(captureTimer),12000);

  window.openTrainerClientCanonicalV119=openCanonical;
})();

(()=>{
  if(document.querySelector('script[data-unvrsl-anatome-local]'))return;
  const s=document.createElement('script');
  s.src='anatome-local-v2.js';
  s.async=false;
  s.dataset.unvrslAnatomeLocal='1';
  document.body.appendChild(s);
})();

(()=>{
  if(document.querySelector('script[data-unvrsl-exercise-detail-rules]'))return;
  const s=document.createElement('script');
  s.src='exercise-detail-rules-v156.js';
  s.async=false;
  s.dataset.unvrslExerciseDetailRules='1';
  document.body.appendChild(s);
})();

(()=>{
  if(document.querySelector('script[data-unvrsl-body-sex-sync]'))return;
  const s=document.createElement('script');
  s.src='body-sex-sync-v166.js';
  s.async=false;
  s.dataset.unvrslBodySexSync='1';
  document.body.appendChild(s);
})();

(()=>{
  if(document.querySelector('script[data-unvrsl-adaptive-effort-safety-v170]'))return;
  const s=document.createElement('script');
  s.src='adaptive-effort-safety-v170.js';
  s.async=false;
  s.dataset.unvrslAdaptiveEffortSafetyV170='1';
  document.body.appendChild(s);
})();