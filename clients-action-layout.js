'use strict';
(()=>{
  if(window.__unvrslClientsActionLayout)return;
  window.__unvrslClientsActionLayout=true;

  const style=document.createElement('style');
  style.id='unvrsl-clients-action-layout';
  style.textContent=`
    #clients .clients-add-action{margin:10px 0 12px}
    #clients .clients-add-action .btn{width:100%!important;min-height:48px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:16px!important;font-weight:780!important;background:#2c2c2f!important;color:#f5f5f7!important;border:1px solid #3a3a3f!important;box-shadow:none!important}
    #clients .clients-add-action .btn:active{background:#38383d!important}
    #clients .clients-add-action .btn[hidden]{display:none!important}
    #clients>.card:first-child>.row.between{display:block!important}
    #clients>.card:first-child>.row.between>div:first-child{width:100%!important}
  `;
  document.head.appendChild(style);

  let busy=false;
  function activeTab(){
    const on=document.querySelector('#clients .client-tabs button.on');
    return on?.dataset?.tab==='offline'?'offline':'online';
  }

  function headerActions(){
    const root=document.getElementById('clients');if(!root)return null;
    const card=root.querySelector(':scope > .card:first-child');if(!card)return null;
    const buttons=[...card.querySelectorAll('button')];
    const plan=buttons.find(b=>/^\s*[＋+]?\s*план\s*$/i.test((b.textContent||'').trim()));
    if(plan)plan.remove();
    return buttons.find(b=>/^\s*[＋+]?\s*клиент\s*$/i.test((b.textContent||'').trim()))||null;
  }

  function neutralize(b){if(!b)return;b.classList.remove('primary');b.classList.add('full');b.style.removeProperty('background');b.style.removeProperty('color');return b}

  function ensureSlot(){
    const root=document.getElementById('clients'),tabs=root?.querySelector('.client-tabs');
    if(!root||!tabs)return null;
    let slot=root.querySelector('.clients-add-action');
    if(!slot){slot=document.createElement('div');slot.className='clients-add-action';tabs.after(slot)}
    return slot;
  }

  function ensureOfflineButton(slot){
    let b=slot.querySelector('[data-client-add-offline]');
    if(!b){
      b=document.createElement('button');b.type='button';b.className='btn full';b.dataset.clientAddOffline='1';b.textContent='＋ Клиент';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(typeof window.offlineNewClientSheet==='function')window.offlineNewClientSheet();else if(typeof offlineNewClientSheet==='function')offlineNewClientSheet();else if(typeof toast==='function')toast('Форма клиента ещё загружается')});
      slot.appendChild(b);
    }
    return neutralize(b);
  }

  function removeOldOfflineAdd(){
    document.querySelectorAll('#offlineClientsPane button').forEach(b=>{
      if(/добавить\s+офлайн[-‑ ]клиента/i.test((b.textContent||'').trim()))b.remove();
    });
  }

  function apply(){
    if(busy)return;busy=true;
    try{
      const root=document.getElementById('clients');if(!root)return;
      const slot=ensureSlot();
      if(!slot){headerActions();removeOldOfflineAdd();return}
      let online=slot.querySelector('[data-client-add-online]');
      const source=headerActions();
      if(source&&source!==online){
        source.dataset.clientAddOnline='1';neutralize(source);source.textContent='＋ Клиент';slot.prepend(source);online=source;
      }
      neutralize(online);
      const offline=ensureOfflineButton(slot),tab=activeTab();
      if(online)online.hidden=tab!=='online';
      offline.hidden=tab!=='offline';
      removeOldOfflineAdd();
    }finally{busy=false}
  }

  function patchTabSwitch(){
    const f=window.offlineSwitchTab;
    if(typeof f==='function'&&!f.__clientActionLayout){
      const wrapped=function(){const r=f.apply(this,arguments);setTimeout(apply,0);setTimeout(apply,80);return r};
      wrapped.__clientActionLayout=true;window.offlineSwitchTab=wrapped;try{offlineSwitchTab=wrapped}catch(e){}
    }
  }

  function patchClientsPage(){
    const f=window.clientsPage;
    if(typeof f==='function'&&!f.__clientActionLayout){
      const wrapped=async function(){const r=await f.apply(this,arguments);setTimeout(apply,0);setTimeout(apply,120);return r};
      wrapped.__clientActionLayout=true;window.clientsPage=wrapped;try{clientsPage=wrapped}catch(e){}
    }
  }

  const root=document.getElementById('clients');
  if(root)new MutationObserver(()=>{removeOldOfflineAdd();setTimeout(apply,0)}).observe(root,{childList:true,subtree:true});
  function install(){patchTabSwitch();patchClientsPage();apply()}
  [0,100,350,900,1800,3200].forEach(t=>setTimeout(install,t));
})();

// Trainer gets the same personal workout journal/profile layer in their own Plan tab.
try{if(typeof loadExternalScript==='function')loadExternalScript('trainer-self-plan-v110.js').catch(e=>console.warn('trainer self plan',e))}catch(e){}
