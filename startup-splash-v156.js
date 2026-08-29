'use strict';
(()=>{
  if(window.__unvrslStartupComplete)return;
  window.__unvrslStartupSplashV156=true;
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();

  const id='unvrsl-startup-splash';
  if(document.getElementById(id))return;

  let style=document.getElementById(id+'-style');
  if(!style){
    style=document.createElement('style');
    style.id=id+'-style';
    style.textContent=`#unvrsl-startup-splash{position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .28s ease;pointer-events:auto}#unvrsl-startup-splash.ready{opacity:0;pointer-events:none}#unvrsl-startup-splash .startup-inner{display:flex;flex-direction:column;align-items:center;transform:translateY(-1vh)}#unvrsl-startup-splash .startup-logo{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;font-size:clamp(34px,10vw,48px);font-weight:900;letter-spacing:-2.2px;line-height:1;color:#f7f7f8;white-space:nowrap}#unvrsl-startup-splash .startup-dot{width:8px;height:8px;border-radius:50%;background:#0a84ff;margin-top:22px;animation:unvrslStartupPulse .9s ease-in-out infinite alternate}@keyframes unvrslStartupPulse{from{opacity:.35;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){#unvrsl-startup-splash .startup-dot{animation:none}#unvrsl-startup-splash{transition:none}}`;
    document.head.appendChild(style);
  }

  const splash=document.createElement('div');
  splash.id=id;
  splash.setAttribute('aria-hidden','true');
  splash.innerHTML='<div class="startup-inner"><div class="startup-logo">UNVRSL FIT</div><div class="startup-dot"></div></div>';
  document.body.prepend(splash);
})();
