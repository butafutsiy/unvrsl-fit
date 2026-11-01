'use strict';
(()=>{
  if(window.__unvrslPwaRefreshUiV563)return;
  window.__unvrslPwaRefreshUiV563=true;
  const current=String(window.__unvrslRelease||'').trim();
  const version=x=>Number(String(x||'').replace(/^v/,''))||0;
  let alertNode=null,lastPrompted='';
  function show(release){
    if(!release||version(release)<=version(current)||lastPrompted===release)return;
    lastPrompted=release;
    if(!document.body)return;
    if(!document.getElementById('unvrsl-refresh-ui-style')){
      const style=document.createElement('style');
      style.id='unvrsl-refresh-ui-style';
      style.textContent='.unvrsl-pwa-update{position:fixed;left:max(16px,env(safe-area-inset-left));right:max(16px,env(safe-area-inset-right));bottom:calc(86px + env(safe-area-inset-bottom));z-index:3900;display:flex;align-items:center;justify-content:space-between;gap:14px;max-width:480px;margin:auto;background:var(--panel,#171a1f);color:var(--text,#fff);border:1px solid var(--line,#353940);box-shadow:0 8px 28px #0002;border-radius:18px;padding:13px 14px;font-family:inherit}.unvrsl-pwa-update strong{display:block;font-size:13px}.unvrsl-pwa-update small{display:block;color:var(--muted,#8e8e93);font-size:11px;margin-top:3px}.unvrsl-pwa-update button{flex:0 0 auto;background:var(--action,#bd51e0);color:var(--action-text,#fff);border:0;border-radius:12px;min-height:40px;padding:0 14px;font-size:13px;font-weight:750}@media(max-width:375px){.unvrsl-pwa-update{gap:7px;padding:11px}.unvrsl-pwa-update button{padding:0 9px}}';
      document.head.appendChild(style);
    }
    alertNode=document.createElement('aside');
    alertNode.className='unvrsl-pwa-update';
    alertNode.setAttribute('role','status');
    alertNode.innerHTML='<div><strong>Доступно обновление '+String(release).replace(/[<>&"']/g,'')+'</strong><small>Тренировочные данные останутся на устройстве</small></div><button type="button">Обновить</button>';
    alertNode.querySelector('button').addEventListener('click',()=>{
      try{
        if(window.st?.current&&typeof window.save==='function'){
          if(window.save({draftOnly:true})===false){window.toast?.('Не удалось сохранить тренировку. Повтори попытку.');return;}
        }
      }catch(e){window.toast?.('Не удалось сохранить тренировку. Повтори попытку.');return;}
      window.location.reload();
    });
    document.body.appendChild(alertNode);
  }
  async function check(){
    if(!navigator.onLine)return;
    try{
      const r=await fetch('./sw.js?release-check='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const match=(await r.text()).match(/SW_RELEASE\s*=\s*["'](v\d+)["']/);
      if(match)show(match[1]);
    }catch(_){}
  }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('message',event=>{
      if(event.data?.type==='UNVRSL_RELEASE_READY')show(event.data.release);
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{check();});
  }
  window.addEventListener('pageshow',()=>{check();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
})();