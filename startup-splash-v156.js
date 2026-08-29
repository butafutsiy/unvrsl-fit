'use strict';
(()=>{
  if(window.__unvrslStartupSplashV156)return;
  window.__unvrslStartupSplashV156=true;
  const id='unvrsl-startup-splash-v156';
  document.querySelectorAll('[id*="splash"],[class*="splash"],[id*="loader"],[class*="loader"]').forEach(el=>{if(el.id!==id&&/UNVRSL\s*FIT/i.test(el.textContent||''))el.remove()});
  const style=document.createElement('style');
  style.id=id+'-style';
  style.textContent=`#${id}{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .28s ease}#${id} .usv156-inner{display:flex;flex-direction:column;align-items:center;transform:translateY(-1vh)}#${id} .usv156-logo{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;font-size:clamp(34px,10vw,48px);font-weight:900;letter-spacing:-2.2px;color:#f7f7f8;white-space:nowrap}#${id} .usv156-dot{width:8px;height:8px;border-radius:50%;background:#0a84ff;margin-top:22px;animation:usv156pulse .9s ease-in-out infinite alternate}@keyframes usv156pulse{from{opacity:.35;transform:scale(.8)}to{opacity:1;transform:scale(1)}}`;
  document.head.appendChild(style);
  const splash=document.createElement('div');
  splash.id=id;
  splash.innerHTML='<div class="usv156-inner"><div class="usv156-logo">UNVRSL FIT</div><div class="usv156-dot"></div></div>';
  document.body.appendChild(splash);
  const observer=new MutationObserver(()=>{
    document.querySelectorAll('[id*="splash"],[class*="splash"],[id*="loader"],[class*="loader"]').forEach(el=>{if(el!==splash&&!splash.contains(el)&&/UNVRSL\s*FIT/i.test(el.textContent||''))el.remove()});
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{observer.disconnect();splash.style.opacity='0';setTimeout(()=>{splash.remove();style.remove()},300)},2400);
})();
