(()=>{
  'use strict';

  const STYLE_ID='unvrsl-startup-splash-style';
  const SPLASH_ID='unvrsl-startup-splash';

  if(document.getElementById(SPLASH_ID)) return;

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    #${SPLASH_ID}{
      position:fixed;
      inset:0;
      z-index:2147483647;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#000;
      opacity:1;
      visibility:visible;
      pointer-events:auto;
      transition:opacity .32s ease,visibility 0s linear .32s;
    }
    #${SPLASH_ID}.is-hidden{
      opacity:0;
      visibility:hidden;
      pointer-events:none;
    }
    #${SPLASH_ID} .unvrsl-startup-splash__inner{
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      transform:translateY(-1.5vh);
      padding:24px;
      text-align:center;
    }
    #${SPLASH_ID} .unvrsl-startup-splash__title{
      color:#f7f7f7;
      font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;
      font-size:clamp(42px,11vw,68px);
      line-height:.95;
      font-weight:900;
      letter-spacing:-.055em;
      white-space:nowrap;
    }
    #${SPLASH_ID} .unvrsl-startup-splash__dot{
      width:16px;
      height:16px;
      margin-top:30px;
      border-radius:999px;
      background:#b44cff;
      box-shadow:0 0 18px rgba(180,76,255,.42);
      animation:unvrslStartupDot 1.05s ease-in-out infinite;
    }
    @keyframes unvrslStartupDot{
      0%,100%{transform:scale(.88);opacity:.72}
      50%{transform:scale(1.08);opacity:1}
    }
    @media (prefers-reduced-motion:reduce){
      #${SPLASH_ID} .unvrsl-startup-splash__dot{animation:none}
      #${SPLASH_ID}{transition:none}
    }
  `;
  document.head.appendChild(style);

  const splash=document.createElement('div');
  splash.id=SPLASH_ID;
  splash.setAttribute('aria-hidden','true');
  splash.innerHTML='<div class="unvrsl-startup-splash__inner"><div class="unvrsl-startup-splash__title">UNVRSL FIT</div><div class="unvrsl-startup-splash__dot"></div></div>';

  const mount=()=>{
    if(!splash.isConnected) (document.body||document.documentElement).prepend(splash);
  };
  if(document.body) mount();
  else document.addEventListener('DOMContentLoaded',mount,{once:true});

  let hidden=false;
  const ready=()=>!!(
    document.querySelector('.app') &&
    document.querySelector('.nav') &&
    document.querySelector('.page.active')
  );

  const hide=()=>{
    if(hidden) return;
    hidden=true;
    splash.classList.add('is-hidden');
    setTimeout(()=>{
      splash.remove();
      style.remove();
    },420);
  };

  const started=performance.now();
  const check=()=>{
    if(ready() && performance.now()-started>350){
      hide();
      return;
    }
    if(performance.now()-started>3000){
      hide();
      return;
    }
    requestAnimationFrame(check);
  };

  window.addEventListener('unvrsl:ready',hide,{once:true});
  window.addEventListener('load',()=>setTimeout(hide,180),{once:true});
  requestAnimationFrame(check);
})();
