'use strict';
(()=>{
  const css=document.createElement('style');
  css.textContent=`
  :root{--radius:30px;--panel:#1c1c1e;--panel2:#242426;--line:#303034}
  html,body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;background:#000}
  body{padding-bottom:118px}
  .app{max-width:760px}
  .topbar{padding:54px 30px 14px;background:linear-gradient(#000 78%,rgba(0,0,0,0));align-items:flex-start}
  .brand{font-size:39px;line-height:1;font-weight:900;letter-spacing:-1.9px;color:#f7f7f8}
  .date{font-size:18px;line-height:1.3;margin-top:12px;color:#8e8e93}
  .gear{width:64px;height:64px;font-size:26px;background:#1c1c1e;border:1px solid #343438;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
  .page{padding:0 30px 34px}
  .card{background:linear-gradient(145deg,#1d1d1f,#1a1a1c);border:1px solid #2b2b2f;border-radius:30px;padding:22px;margin:16px 0;box-shadow:0 12px 34px rgba(0,0,0,.18)}
  .title{font-size:25px;font-weight:800;letter-spacing:-.7px;line-height:1.16}
  .big{font-size:52px;line-height:1;font-weight:850;letter-spacing:-2px}
  .muted{color:#8e8e93}
  .weight-top{gap:16px}.weight-actions{gap:22px;color:var(--green);font-size:17px;font-weight:700;white-space:nowrap}
  .weight-actions button{padding:4px 0}
  .spark{height:190px;margin-top:20px}
  .streak{min-height:126px;padding:24px 26px;gap:20px}.fire{font-size:42px}.streak b{font-size:25px;font-weight:820}.streak-meta{font-size:17px;line-height:1.35}
  .btn{border-radius:18px;padding:13px 18px;font-weight:780;letter-spacing:-.2px;background:#303034}
  .btn.primary{background:linear-gradient(180deg,color-mix(in srgb,var(--green),white 8%),var(--green));color:#020609;box-shadow:0 8px 22px color-mix(in srgb,var(--green),transparent 76%)}
  .btn.tiny{border-radius:14px}
  .card .btn.primary:not(.tiny){min-height:54px;padding-left:28px;padding-right:28px;font-size:18px}
  .next-workout-card .btn.primary{min-width:245px}
  .section{margin:26px 8px 10px;letter-spacing:.04em}
  .weekbtn{border-radius:16px}.weekbtn.on{background:var(--green);color:#020609}
  .exercise,.metric,.settings-card{border-color:#2c2c30}
  .nav{left:22px;right:22px;bottom:10px;border:1px solid #2a2a2e;border-radius:28px;padding:11px 7px calc(10px + env(safe-area-inset-bottom));background:rgba(24,24,26,.92);box-shadow:0 18px 55px rgba(0,0,0,.5);overflow:visible}
  .nav button{min-width:0;color:#8e8e93;font-size:10.5px;line-height:1.05;padding:5px 1px;font-weight:560;transition:color .18s,transform .18s}
  .nav button.active{color:var(--green)}
  .nav .ico{height:25px;font-size:0;display:flex;align-items:center;justify-content:center;margin:0 auto 6px}
  .nav .ico svg{width:25px;height:25px;display:block;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  .nav .start{position:relative;z-index:2}
  .nav .start .ico{width:66px;height:66px;margin:-39px auto 5px;border-radius:50%;background:linear-gradient(160deg,color-mix(in srgb,var(--green),white 12%),var(--green));color:white;border:1px solid color-mix(in srgb,var(--green),white 28%);box-shadow:0 0 0 7px rgba(14,14,16,.92),0 8px 25px color-mix(in srgb,var(--green),transparent 58%)}
  .nav .start .ico svg{width:31px;height:31px;stroke-width:2.3}
  .nav .start.active .ico{transform:scale(1.035)}
  .nav .start{color:#a5a5aa}
  .nav .start.active{color:var(--green)}
  .toast{top:66px;background:#2c2c2f;border-color:#45454a;font-size:15px}
  @media(max-width:430px){
    .topbar{padding-left:20px;padding-right:20px}.page{padding-left:18px;padding-right:18px}.brand{font-size:36px}.gear{width:60px;height:60px}
    .card{padding:20px;border-radius:28px}.weight-actions{gap:16px;font-size:16px}.big{font-size:50px}.nav{left:8px;right:8px;border-radius:25px}.nav button{font-size:9.5px}.nav .start .ico{width:62px;height:62px;margin-top:-36px}
  }
  @media(min-width:760px){.nav{max-width:716px;left:50%;right:auto;transform:translateX(-50%);width:calc(100% - 44px);border-radius:28px}}
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
  function polishNav(){
    document.querySelectorAll('.nav button[data-p]').forEach(b=>{
      const key=b.dataset.p,ico=b.querySelector('.ico');if(ico&&icons[key]&&ico.dataset.premium!=='1'){ico.innerHTML=icons[key];ico.dataset.premium='1'}
      if(key==='start')b.classList.add('start');
    });
  }
  function polishHome(){
    const home=document.getElementById('home');if(!home)return;
    const cards=[...home.querySelectorAll(':scope > .card')];
    cards.forEach(c=>c.classList.remove('next-workout-card'));
    const next=cards.find(c=>/Ближайшая тренировка/i.test(c.textContent||''));if(next)next.classList.add('next-workout-card');
  }
  const obs=new MutationObserver(()=>{polishNav();polishHome()});
  obs.observe(document.body,{subtree:true,childList:true});
  polishNav();polishHome();
})();
