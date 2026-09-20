'use strict';
function removeLegacyCloudSettings(sh){
  if(!sh)return;
  [...sh.querySelectorAll('.settings-card')].forEach(card=>{
    const text=String(card.textContent||'').replace(/\s+/g,' ').trim();
    if(!/UNVRSL\s*Cloud|Облачная копия/i.test(text))return;
    const prev=card.previousElementSibling;
    if(prev?.classList?.contains('section')&&/АККАУНТ|ОБЛАК/i.test(String(prev.textContent||'')))prev.remove();
    card.remove();
  });
}
function cloudSettingsSheet(){
  settingsSheet();
  const sh=$('#sheet');if(!sh)return;
  removeLegacyCloudSettings(sh);
  const block=document.createElement('div');block.innerHTML=`<div class="section">АККАУНТ И ОБЛАКО</div><div class="settings-card"><div class="setting"><div><b>${esc(cloudStatusLabel())}</b><div class="muted small">${cloudConfigured()?(cloud.user?'Синхронизация включена':'Войдите для синхронизации'):'Подключите Supabase'}</div></div><button class="btn tiny" onclick="cloudAccountSheet()">${cloud.user?'Открыть':'Настроить'}</button></div>${cloud.user?`<div class="setting"><div><b>Синхронизировать сейчас</b><div class="muted small">Тренировки и вес</div></div><button class="btn tiny" onclick="cloudSyncAll()">Синхр.</button></div>`:''}</div>`;sh.prepend(...block.childNodes);
  removeLegacyCloudSettings(sh);
  if(!sh.__unvrslCloudDedupObserver){
    const o=new MutationObserver(()=>removeLegacyCloudSettings(sh));
    o.observe(sh,{childList:true,subtree:true});
    sh.__unvrslCloudDedupObserver=o;
  }
}
setTimeout(()=>{const gear=$('#gear');if(gear&&!gear.dataset.cloudCapture){gear.dataset.cloudCapture='1';gear.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();cloudSettingsSheet()},true)}},0);
