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
    .offline-client-delete-v366{margin:24px 0 4px;padding-top:16px;border-top:1px solid #2d2d31}
    .offline-client-delete-v366 .btn{min-height:48px;font-size:15px}
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

  function injectOfflineClientDelete(id){
    const clientId=String(id||'').replace(/[^a-zA-Z0-9-]/g,'');if(!clientId)return;
    const root=document.querySelector('#sheet .ofp-root');
    if(!root||!root.querySelector('.ofp-hero')||root.querySelector('.offline-client-delete-v366'))return;
    const section=document.createElement('section');section.className='offline-client-delete-v366';
    const button=document.createElement('button');button.type='button';button.className='btn danger full';button.textContent='Удалить клиента';button.dataset.offlineDeleteClient='1';
    button.addEventListener('click',()=>window.offlineDeleteClientV366?.(clientId));section.appendChild(button);root.appendChild(section)
  }

  window.offlineDeleteClientV366=async function(id){
    const clientId=String(id||'').replace(/[^a-zA-Z0-9-]/g,'');if(!clientId)return;
    const name=(document.querySelector('#sheet .ofp-hero h2')?.textContent||'этого клиента').trim();
    const ok=window.confirm(`Удалить офлайн-клиента «${name}»?\n\nБудут удалены его замеры, силовые записи и ссылка на прогресс. Это действие нельзя отменить.`);if(!ok)return;
    const button=document.querySelector('#sheet [data-offline-delete-client]');if(button){button.disabled=true;button.textContent='Удаляю…'}
    try{
      const c=window.cloud;if(!c?.client||!c?.user)throw new Error('Нет подключения к аккаунту тренера');
      const result=await c.client.from('offline_clients').delete().eq('id',clientId).eq('trainer_id',c.user.id).select('id');
      if(result.error)throw result.error;if(!(result.data||[]).length)throw new Error('Клиент не найден или уже удалён');
      if(typeof window.closeModal==='function')window.closeModal();else if(typeof closeModal==='function')closeModal();
      if(typeof window.renderOfflineClients==='function')await window.renderOfflineClients();
      if(typeof window.toast==='function')window.toast('Офлайн-клиент удалён');else if(typeof toast==='function')toast('Офлайн-клиент удалён')
    }catch(error){
      if(typeof window.alert==='function')window.alert(error?.message||'Не удалось удалить клиента');
      if(button){button.disabled=false;button.textContent='Удалить клиента'}
    }
  };

  function patchOfflineClientDetail(){
    const f=window.offlineClientDetail;
    if(typeof f!=='function'||!f.__offlineProgressV321||f.__offlineClientDeleteV366)return false;
    const wrapped=async function(){const id=arguments[0],r=await f.apply(this,arguments);setTimeout(()=>injectOfflineClientDelete(id),0);return r};
    for(const key of ['__offlineProgressV328','__offlineProgressV324','__offlineProgressV323','__offlineProgressV322','__offlineProgressV321'])if(f[key])wrapped[key]=f[key];
    wrapped.__offlineClientDeleteV366=true;wrapped.__offlineClientDeleteBaseV366=f;window.offlineClientDetail=wrapped;try{offlineClientDetail=wrapped}catch(e){}
    return true
  }

  const root=document.getElementById('clients');
  if(root)new MutationObserver(()=>{removeOldOfflineAdd();setTimeout(apply,0)}).observe(root,{childList:true,subtree:true});
  function install(){patchTabSwitch();patchClientsPage();patchOfflineClientDetail();apply()}
  [0,100,350,900,1800,3200,6000,10000].forEach(t=>setTimeout(install,t));
  window.addEventListener?.('unvrsl:deferred-modules-ready',()=>{install();setTimeout(install,80)},{passive:true});
})();