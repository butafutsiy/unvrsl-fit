'use strict';
(()=>{
  if(window.__trainerClientCanonicalGuardV117)return;
  window.__trainerClientCanonicalGuardV117=true;

  const style=document.createElement('style');
  style.id='trainer-client-canonical-v117-style';
  style.textContent=`
    .trainer-self-profile-v111>.card>.row.between>.btn{display:none!important}
    .tcv3-add.primary{background:var(--accent,#30d158)!important;color:#07110a!important;border-color:transparent!important}
  `;
  document.head.appendChild(style);

  let opening=false;

  function clientIdFromCard(card){
    if(card?.dataset?.clientId)return card.dataset.clientId;
    const raw=card?.getAttribute?.('onclick')||'';
    const m=raw.match(/trainerClientDetail\(['\"]([^'\"]+)['\"]\)/);
    return m?.[1]||'';
  }

  async function waitForCanonical(){
    for(let i=0;i<200;i++){
      if(window.__unvrslTrainerDirectUIV3&&typeof window.trainerClientDetail==='function')return true;
      await new Promise(r=>setTimeout(r,50));
    }
    return false;
  }

  async function openCanonical(id){
    if(!id||opening)return;
    opening=true;
    try{
      if(typeof window.toast==='function')window.toast('Открываю клиента…');
      const ready=await waitForCanonical();
      if(!ready){
        if(typeof window.toast==='function')window.toast('Карточка клиента ещё загружается');
        return;
      }
      await window.trainerClientDetail(id);
      const normalize=()=>{
        const sh=document.getElementById('sheet');
        if(!sh?.querySelector('.tcv3-tabs'))return;
        const add=sh.querySelector('.tcv3-add');
        if(add){add.textContent='＋ Отправить программу';add.classList.add('primary');}
      };
      normalize();
      [40,120,300,700].forEach(t=>setTimeout(normalize,t));
    }finally{
      opening=false;
    }
  }

  // Единственная точка входа в карточку клиента. Старые onclick и старые
  // обработчики trainer.js / trainer-client-detail-v2 до пользователя не доходят.
  document.addEventListener('click',e=>{
    const card=e.target.closest?.('#clients .client-card');
    if(!card)return;
    const id=clientIdFromCard(card);
    if(!id)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openCanonical(id);
  },true);

  window.openTrainerClientCanonicalV117=openCanonical;
})();
