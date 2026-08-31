'use strict';
(()=>{
  window.__unvrslStartupComplete=true;
  document.getElementById('unvrsl-startup-splash')?.remove();
  document.getElementById('unvrsl-startup-splash-style')?.remove();
  document.getElementById('unvrsl-startup-splash-v156')?.remove();
  document.getElementById('unvrsl-startup-splash-v156-style')?.remove();
  document.getElementById('unvrsl-boot-cover')?.remove();

  // Keep one visible startup splash until the final UI has actually settled.
  if(!document.getElementById('unvrsl-startup-splash-final')){
    let splashAccent='#30d158';
    try{
      const saved=JSON.parse(localStorage.getItem('unvrsl-fit-v3')||'null');
      if(saved&&/^#[0-9a-f]{6}$/i.test(saved.accent||''))splashAccent=saved.accent;
    }catch(e){}
    const accentGlow=`${splashAccent}66`;

    const style=document.createElement('style');
    style.id='unvrsl-startup-splash-final-style';
    style.textContent=`
      #unvrsl-startup-splash-final{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;visibility:visible;pointer-events:auto;transition:opacity .28s ease,visibility 0s linear .28s}
      #unvrsl-startup-splash-final.out{opacity:0;visibility:hidden;pointer-events:none}
      #unvrsl-startup-splash-final .u-inner{display:flex;flex-direction:column;align-items:center;transform:translateY(-1vh)}
      #unvrsl-startup-splash-final .u-brand{font:900 clamp(42px,11vw,68px)/.95 -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;letter-spacing:-2.2px;color:#f7f7f8;white-space:nowrap}
      #unvrsl-startup-splash-final .u-dot{width:16px;height:16px;margin-top:30px;border-radius:50%;background:${splashAccent};box-shadow:0 0 18px ${accentGlow};animation:unvrslFinalPulse 1s ease-in-out infinite alternate}
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
    let quietTimer=0;
    let loadDone=document.readyState==='complete';
    let fontsDone=!document.fonts;

    const release=()=>{
      if(released)return;
      released=true;
      clearTimeout(quietTimer);
      observer.disconnect();
      const wait=Math.max(0,900-(performance.now()-started));
      setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash.classList.add('out');
        setTimeout(()=>{splash.remove();style.remove()},320);
      })),wait);
    };

    const maybeRelease=()=>{
      if(released||!loadDone||!fontsDone)return;
      clearTimeout(quietTimer);
      quietTimer=setTimeout(release,700);
    };

    const observer=new MutationObserver(()=>maybeRelease());
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true});

    if(!loadDone)window.addEventListener('load',()=>{loadDone=true;maybeRelease()},{once:true});
    if(document.fonts){
      document.fonts.ready.catch(()=>{}).then(()=>{fontsDone=true;maybeRelease()});
    }
    maybeRelease();

    // Emergency fallback only: never leave the app blocked forever.
    setTimeout(release,8000);
  }

  // All legacy purple accents follow the user's selected accent color.
  if(!document.getElementById('unvrsl-user-accent-bridge')){
    const accentStyle=document.createElement('style');
    accentStyle.id='unvrsl-user-accent-bridge';
    accentStyle.textContent=`
      :root{--purple:var(--green)!important}
      .sd2-write,.bw190-all,.bw190-chip.on b,.bw190-point-info b{color:var(--green)!important}
      .bw190-chip.on{border-color:var(--green)!important;background:color-mix(in srgb,var(--green) 12%,transparent)!important}
      .bw190-point-info{background:color-mix(in srgb,var(--green) 10%,transparent)!important;border-color:color-mix(in srgb,var(--green) 28%,transparent)!important}
      .sd2-chart .bw190-point{fill:var(--green)!important}
      .sd2-chart .bw190-point:hover,.sd2-chart .bw190-point:focus,.sd2-chart .bw190-point.is-selected{stroke:color-mix(in srgb,var(--green) 38%,transparent)!important}
      .sd2-chart polyline{stroke:var(--green)!important}
      .sd2-chart polygon{fill:color-mix(in srgb,var(--green) 10%,transparent)!important}
      .sd2-cell.l1{background:color-mix(in srgb,var(--green) 28%,#2c2c31)!important}
      .sd2-cell.l2{background:color-mix(in srgb,var(--green) 46%,#2c2c31)!important}
      .sd2-cell.l3{background:color-mix(in srgb,var(--green) 68%,#2c2c31)!important}
      .sd2-cell.l4{background:var(--green)!important}
      .sd2-legend i:nth-of-type(2){background:color-mix(in srgb,var(--green) 28%,#2c2c31)!important}
      .sd2-legend i:nth-of-type(3){background:color-mix(in srgb,var(--green) 46%,#2c2c31)!important}
      .sd2-legend i:nth-of-type(4){background:color-mix(in srgb,var(--green) 68%,#2c2c31)!important}
      .sd2-legend i:nth-of-type(5){background:var(--green)!important}
    `;
    document.head.appendChild(accentStyle);
  }

  // Final client guard is loaded on every startup. It stays dormant for the trainer account.
  if(!document.querySelector('script[data-unvrsl-client-final-v222]')){
    const clientFinal=document.createElement('script');
    clientFinal.src='client-final-runtime-v222.js?v=237';
    clientFinal.async=false;
    clientFinal.dataset.unvrslClientFinalV222='1';
    document.body.appendChild(clientFinal);
  }

  // Preserve the legacy OG visual styles without creating a second loading cover.
  window.__unvrslSkipLegacyBootCover=true;

  const legacy=document.createElement('script');
  legacy.src='og-style-legacy-v157.js';
  legacy.async=false;
  document.head.appendChild(legacy);
})();
