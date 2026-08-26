'use strict';
(()=>{
  if(window.__unvrslTrainerTapFix)return;window.__unvrslTrainerTapFix=true;

  const style=document.createElement('style');style.id='trainer-tap-fix-style';style.textContent=`
    #clients .client-card,#clients [data-trainer-action="sent-plans"]{pointer-events:auto!important;touch-action:manipulation!important;position:relative!important;z-index:2!important}
    #clients #clientList,#clients #onlineClientsPane{pointer-events:auto!important}
  `;document.head.appendChild(style);

  function extractClientId(el){
    if(el?.dataset?.clientId)return el.dataset.clientId;
    const raw=el?.getAttribute?.('onclick')||'';
    const m=raw.match(/trainerClientDetail\(['\"]([^'\"]+)['\"]\)/);
    return m?.[1]||'';
  }

  function decorateTrainerClients(){
    const root=document.getElementById('clients');if(!root)return;
    root.querySelectorAll('.client-card').forEach(card=>{
      const id=extractClientId(card);if(!id)return;
      card.dataset.clientId=id;
      card.removeAttribute('onclick');
      card.type='button';
    });
    [...root.querySelectorAll('button')].forEach(btn=>{
      if(/мои отправленные планы/i.test((btn.textContent||'').trim())){
        btn.dataset.trainerAction='sent-plans';
        btn.removeAttribute('onclick');
        btn.type='button';
      }
    });
  }

  document.addEventListener('click',e=>{
    const root=e.target.closest?.('#clients');if(!root)return;
    const card=e.target.closest?.('.client-card[data-client-id]');
    if(card){
      e.preventDefault();e.stopPropagation();
      const id=card.dataset.clientId;
      if(typeof window.trainerClientDetail==='function')window.trainerClientDetail(id);
      else if(typeof window.toast==='function')toast('Карточка клиента ещё загружается');
      return;
    }
    const plans=e.target.closest?.('[data-trainer-action="sent-plans"]');
    if(plans){
      e.preventDefault();e.stopPropagation();
      if(typeof window.trainerPlansSheet==='function')window.trainerPlansSheet();
      else if(typeof window.toast==='function')toast('Планы ещё загружаются');
    }
  },true);

  const baseClients=window.clientsPage;
  if(typeof baseClients==='function'&&!baseClients.__tapFix){
    const wrapped=async function(){
      const r=await baseClients.apply(this,arguments);
      decorateTrainerClients();
      setTimeout(decorateTrainerClients,80);
      return r;
    };
    wrapped.__tapFix=true;window.clientsPage=wrapped;try{clientsPage=wrapped}catch(e){}
  }

  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__trainerTapFix){
    const wrapped=function(p){const r=baseNav.apply(this,arguments);if(p==='clients'){setTimeout(decorateTrainerClients,0);setTimeout(decorateTrainerClients,180)}return r};
    wrapped.__trainerTapFix=true;window.nav=wrapped;try{nav=wrapped}catch(e){}
  }

  [0,200,800,1800].forEach(t=>setTimeout(decorateTrainerClients,t));
})();
