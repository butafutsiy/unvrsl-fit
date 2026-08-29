'use strict';
(()=>{
  window.__unvrslStartupManaged=true;
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();
  document.getElementById('unvrsl-boot-cover')?.remove();

  // This invisible blocker prevents the preserved legacy styles from creating their old large cover.
  const blocker=document.createElement('div');
  blocker.id='unvrsl-boot-cover';
  blocker.style.cssText='display:none!important;position:fixed;width:0;height:0;overflow:hidden;pointer-events:none';
  document.body.appendChild(blocker);

  // Adopt the single compact screen already rendered before the base interface.
  const id='unvrsl-startup-splash';
  let style=document.getElementById(id+'-style');
  if(!style){
    style=document.createElement('style');
    style.id=id+'-style';
    style.textContent=`#unvrsl-startup-splash{position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .28s ease;pointer-events:auto}#unvrsl-startup-splash.ready{opacity:0;pointer-events:none}#unvrsl-startup-splash .startup-inner{display:flex;flex-direction:column;align-items:center;transform:translateY(-1vh)}#unvrsl-startup-splash .startup-logo{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;font-size:clamp(34px,10vw,48px);font-weight:900;letter-spacing:-2.2px;line-height:1;color:#f7f7f8;white-space:nowrap}#unvrsl-startup-splash .startup-dot{width:8px;height:8px;border-radius:50%;background:#0a84ff;margin-top:22px;animation:unvrslStartupPulse .9s ease-in-out infinite alternate}@keyframes unvrslStartupPulse{from{opacity:.35;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){#unvrsl-startup-splash .startup-dot{animation:none}#unvrsl-startup-splash{transition:none}}`;
    document.head.appendChild(style);
  }
  let splash=document.getElementById(id);
  if(!splash){
    splash=document.createElement('div');
    splash.id=id;
    splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="startup-inner"><div class="startup-logo">UNVRSL FIT</div><div class="startup-dot"></div></div>';
    document.body.prepend(splash);
  }

  // Load all the existing OG enhancement styles, while the blocker prevents their old large cover.
  const legacy=document.createElement('script');
  legacy.src='og-style-legacy-v157.js';
  legacy.async=false;
  legacy.onload=()=>blocker.remove();
  legacy.onerror=()=>blocker.remove();
  document.head.appendChild(legacy);

  const started=performance.now();
  let done=false;
  const required=['unvrsl-premium-stable','unvrsl-stable-ui','unvrsl-mockup-ui','unvrsl-density-ui','unvrsl-mobile-final-fix'];
  function check(){
    if(done)return;
    const minTime=performance.now()-started>=2800;
    const stylesReady=required.every(x=>document.getElementById(x));
    const active=document.querySelector('.page.active');
    const appReady=!!document.querySelector('.nav')&&!!active&&active.childElementCount>0;
    if(minTime&&stylesReady&&appReady){
      done=true;window.__unvrslStartupComplete=true;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash.classList.add('ready');
        setTimeout(()=>{splash.remove();style?.remove()},320);
      }));
      return;
    }
    requestAnimationFrame(check);
  }
  requestAnimationFrame(check);
  setTimeout(()=>{
    if(done)return;
    done=true;window.__unvrslStartupComplete=true;
    splash.classList.add('ready');
    setTimeout(()=>{splash.remove();style?.remove()},320);
  },9000);
})();