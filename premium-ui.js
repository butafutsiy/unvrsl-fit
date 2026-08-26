'use strict';
(()=>{
  if(window.__unvrslPremiumStable)return;window.__unvrslPremiumStable=true;
  const css=document.createElement('style');
  css.id='unvrsl-premium-stable';
  css.textContent=`
  :root{--radius:26px;--panel:#1c1c1e;--panel2:#232326;--line:#343438}
  html,body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;background:#000;color:#f5f5f7}
  body{padding-bottom:126px}
  .app{max-width:760px;margin:0 auto}
  .topbar{padding:48px 24px 14px;background:#000;align-items:flex-start}
  .brand{font-size:38px;line-height:1;font-weight:900;letter-spacing:-1.8px;color:#f7f7f8}
  .date{font-size:18px;line-height:1.3;margin-top:12px;color:#8e8e93}
  .gear{width:60px;height:60px;font-size:25px;background:#1c1c1e;border:1px solid #38383d;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
  .page{padding:0 20px 38px}
  .card{background:linear-gradient(145deg,#1d1d1f,#19191b);border:1px solid #303034;border-radius:26px;padding:21px;margin:15px 0;box-shadow:0 10px 30px rgba(0,0,0,.17)}
  .title{font-size:24px;font-weight:820;letter-spacing:-.65px;line-height:1.15}
  .big{font-size:50px;line-height:1;font-weight:870;letter-spacing:-2px}
  .muted{color:#8e8e93}
  .section{margin:24px 6px 10px;color:#8e8e93;font-size:12px;font-weight:760;letter-spacing:.08em}
  .btn{border-radius:16px;padding:13px 17px;font-weight:760;background:#303034;min-height:46px}
  .btn.primary{background:linear-gradient(180deg,color-mix(in srgb,var(--green),white 8%),var(--green));color:#05070a;box-shadow:0 7px 20px color-mix(in srgb,var(--green),transparent 78%)}
  .btn.tiny{border-radius:13px;min-height:38px;padding:9px 13px}
  .metric,.settings-card,.exercise{border-color:#303034}
  .weekbtn{border-radius:14px}.weekbtn.on{background:var(--green);color:#05070a}
  .nav{position:fixed;left:10px;right:10px;bottom:8px;z-index:1000;display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;align-items:end;gap:0;padding:10px 3px calc(9px + env(safe-area-inset-bottom));border:1px solid #343438;border-radius:26px;background:rgba(25,25,27,.96);box-shadow:0 16px 50px rgba(0,0,0,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);overflow:visible!important}
  .nav button{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0!important;width:100%;max-width:100%;padding:5px 0 2px;color:#8e8e93;background:transparent;font-size:8px;line-height:1;font-weight:650;letter-spacing:-.25px;white-space:nowrap;overflow:visible!important;touch-action:manipulation;pointer-events:auto!important}
  .nav button.active{color:var(--green)}
  .nav .ico{height:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 5px;pointer-events:none}
  .nav .ico svg{width:23px;height:23px;display:block;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
  .nav .start{z-index:3}
  .nav .start .ico{width:58px;height:58px;margin:-34px auto 5px;border-radius:50%;background:linear-gradient(160deg,color-mix(in srgb,var(--green),white 14%),var(--green));color:#fff;border:1px solid color-mix(in srgb,var(--green),white 28%);box-shadow:0 0 0 7px rgba(20,20,22,.96),0 8px 24px color-mix(in srgb,var(--green),transparent 62%)}
  .nav .start .ico svg{width:29px;height:29px;stroke-width:2.2}
  .toast{top:62px;background:#2c2c2f;border-color:#45454a;font-size:15px}
  .modal{z-index:3000}.sheet{z-index:3001}
  @media(max-width:430px){
    .topbar{padding:44px 20px 12px}.brand{font-size:36px}.gear{width:58px;height:58px}.page{padding-left:17px;padding-right:17px}.card{padding:19px;border-radius:24px}.title{font-size:23px}.big{font-size:48px}
    .nav{left:6px;right:6px;bottom:6px;border-radius:24px;padding-left:2px;padding-right:2px}
    .nav button{font-size:7.45px;letter-spacing:-.38px}
    .nav .ico svg{width:21px;height:21px}.nav .start .ico{width:56px;height:56px;margin-top:-32px}
  }
  `;
  document.head.appendChild(css);

  const icons={
    home:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
    plan:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 2v4M16 2v4M7 10h10"/></svg>',
    programs:'<svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>',
    start:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    stats:'<svg viewBox="0 0 24 24"><path d="M4 20V12M10 20V7M16 20V10M22 20V4"/></svg>',
    exercises:'<svg viewBox="0 0 24 24"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/></svg>',
    clients:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15 15c3.8-.7 6 1.2 6 5"/></svg>'
  };
  const labels={home:'Главная',plan:'План',programs:'Программы',start:'Старт',stats:'Статистика',exercises:'Упражнения',clients:'Клиенты'};
  function setupNav(){
    document.querySelectorAll('.nav button[data-p]').forEach(b=>{
      const key=b.dataset.p,ico=b.querySelector('.ico');
      if(ico&&icons[key])ico.innerHTML=icons[key];
      if(key==='start')b.classList.add('start');
      if(labels[key])b.setAttribute('aria-label',labels[key]);
    });
  }
  setupNav();
  [150,500,1200,2500,5000].forEach(t=>setTimeout(setupNav,t));
})();
