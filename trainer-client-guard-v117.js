'use strict';
(()=>{
  if(window.__trainerClientGuardV117)return;
  window.__trainerClientGuardV117=true;

  let opening=false;

  function clientIdFromCard(card){
    if(card?.dataset?.clientId)return card.dataset.clientId;
    const raw=card?.getAttribute?.('onclick')||'';
    const m=raw.match(/trainerClientDetail\(['\"]([^'\"]+)['\"]\)/);
    return m?.[1]||'';
  }

  async function waitForCanonical(){
    for(let i=0;i<160;i++){
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
        const sheet=document.getElementById('sheet');
        if(!sheet?.querySelector('.tcv3-tabs'))return;
        const add=sheet.querySelector('.tcv3-add');
        if(add){add.textContent='＋ Отправить программу';add.classList.add('primary');}
        sheet.querySelectorAll('.trainer-live-programs,.trainer-remove-programs-block,.trainer-client-profile-card,.trainer-profile-card').forEach(x=>x.remove());
      };
      normalize();
      [40,120,300,700].forEach(t=>setTimeout(normalize,t));
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

  window.openTrainerClientCanonicalV117=openCanonical;
})();
