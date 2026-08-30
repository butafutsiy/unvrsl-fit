'use strict';
(()=>{
  window.__unvrslStartupComplete=true;
  document.getElementById('unvrsl-startup-splash')?.remove();
  document.getElementById('unvrsl-startup-splash-style')?.remove();
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();
  document.getElementById('unvrsl-boot-cover')?.remove();

  // Keep one visible startup splash while the final UI finishes loading.
  if(!document.getElementById('unvrsl-startup-splash-final')){
    const style=document.createElement('style');
    style.id='unvrsl-startup-splash-final-style';
    style.textContent=`
      #unvrsl-startup-splash-final{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;visibility:visible;pointer-events:auto;transition:opacity .28s ease,visibility 0s linear .28s}
      #unvrsl-startup-splash-final.out{opacity:0;visibility:hidden;pointer-events:none}
      #unvrsl-startup-splash-final .u-inner{display:flex;flex-direction:column;align-items:center;transform:translateY(-1vh)}
      #unvrsl-startup-splash-final .u-brand{font:900 clamp(42px,11vw,68px)/.95 -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;letter-spacing:-2.2px;color:#f7f7f8;white-space:nowrap}
      #unvrsl-startup-splash-final .u-dot{width:16px;height:16px;margin-top:30px;border-radius:50%;background:#b44cff;box-shadow:0 0 18px rgba(180,76,255,.42);animation:unvrslFinalPulse 1s ease-in-out infinite alternate}
      @keyframes unvrslFinalPulse{from{opacity:.5;transform:scale(.86)}to{opacity:1;transform:scale(1.08)}}
      @media (prefers-reduced-motion:reduce){#unvrsl-startup-splash-final .u-dot{animation:none}#unvrsl-startup-splash-final{transition:none}}
    `;
    document.head.appendChild(style);
    const splash=document.createElement('div');
    splash.id='unvrsl-startup-splash-final';
    splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="u-inner"><div class="u-brand">UNVRSL FIT</div><div class="u-dot"></div></div>';
    document.body.appendChild(splash);

    const started=performance.now();
    let released=false;
    const release=()=>{
      if(released)return;
      released=true;
      const wait=Math.max(0,1100-(performance.now()-started));
      setTimeout(()=>{
        splash.classList.add('out');
        setTimeout(()=>{splash.remove();style.remove()},320);
      },wait);
    };
    window.addEventListener('load',release,{once:true});
    window.addEventListener('unvrsl:ready',release,{once:true});
    setTimeout(release,2500);
  }

  // Preserve the legacy OG visual styles without creating a second loading cover.
  window.__unvrslSkipLegacyBootCover=true;

  const legacy=document.createElement('script');
  legacy.src='og-style-legacy-v157.js';
  legacy.async=false;
  document.head.appendChild(legacy);
})();
