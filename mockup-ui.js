'use strict';
(()=>{
  if(window.__unvrslMockupUi)return;window.__unvrslMockupUi=true;
  const s=document.createElement('style');s.id='unvrsl-mockup-ui';s.textContent=`
  :root{--ui-bg:#070708;--ui-card:#171719;--ui-card2:#1f2023;--ui-line:#2d2f34;--ui-text:#f7f7f8;--ui-sub:#91939a;--ui-accent:var(--green)}
  html,body{background:var(--ui-bg)!important;color:var(--ui-text)!important}
  body{background-image:radial-gradient(circle at 70% -10%,color-mix(in srgb,var(--ui-accent),transparent 93%),transparent 34%)!important}
  .topbar{background:linear-gradient(180deg,#080809 0,#070708 88%,transparent)!important;padding-bottom:12px!important}
  .brand{font-weight:950!important;letter-spacing:-2.2px!important;font-size:39px!important}
  .date{color:var(--ui-sub)!important;font-weight:560!important}
  .gear{border-radius:18px!important;background:#171719!important;border:1px solid #2b2d31!important}
  .page{max-width:680px;margin:0 auto}
  .card{background:linear-gradient(180deg,#1b1b1e,#151517)!important;border:1px solid var(--ui-line)!important;border-radius:24px!important;box-shadow:0 12px 32px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.025)!important}
  .title,.detail-title,h2,h3{letter-spacing:-.7px}
  .title{font-weight:850!important}
  .muted,.catalog-meta{color:var(--ui-sub)!important}
  .section{font-size:11px!important;letter-spacing:.12em!important;color:#777a82!important;margin-top:28px!important}
  .btn{border:1px solid #32343a!important;background:#25262a!important;color:#f4f4f6!important;border-radius:15px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important}
  .btn.primary{border-color:color-mix(in srgb,var(--ui-accent),white 12%)!important;background:linear-gradient(180deg,color-mix(in srgb,var(--ui-accent),white 8%),var(--ui-accent))!important;color:#fff!important;box-shadow:0 10px 24px color-mix(in srgb,var(--ui-accent),transparent 72%)!important}
  .btn:active,.nav button:active,.client-tabs button:active{transform:scale(.98)}
  .chip{border-radius:999px!important;background:#25262a!important;border:1px solid #32343a!important}
  .chip.green,.weekbtn.on,.filterchip.on{background:color-mix(in srgb,var(--ui-accent),transparent 84%)!important;color:color-mix(in srgb,var(--ui-accent),white 25%)!important;border-color:color-mix(in srgb,var(--ui-accent),transparent 48%)!important}
  .metrics{gap:9px!important}.metric{background:#1d1e21!important;border:1px solid #2d2f34!important;border-radius:20px!important;padding:15px 13px!important}.metric span{font-size:11px!important;color:#8b8d94!important}.metric b{font-size:21px!important;letter-spacing:-.7px!important;margin-top:6px!important}
  .client-tabs{background:#111214!important;border:1px solid #282a2f!important;border-radius:17px!important;padding:4px!important}.client-tabs button{min-height:40px!important;border-radius:13px!important}.client-tabs button.on{background:#292b30!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important}
  .offline-client-card,.client-card,.exlib-btn{transition:transform .12s ease,border-color .12s ease}.offline-client-card:active,.client-card:active,.exlib-btn:active{transform:scale(.985)}
  .offline-session-chip{background:color-mix(in srgb,var(--ui-accent),transparent 86%)!important;color:color-mix(in srgb,var(--ui-accent),white 24%)!important}
  input,select,textarea{background:#17181b!important;border:1px solid #303238!important;border-radius:14px!important;color:#f6f6f7!important;min-height:46px!important}textarea{padding:13px!important}
  .field label{color:#8f9198!important;font-size:12px!important}
  .rule-card,.history-row,.listline,.exercise{background:#1a1b1e!important;border-color:#2c2e33!important;border-radius:18px!important}
  .nav{background:rgba(18,19,22,.94)!important;border:1px solid #303238!important;box-shadow:0 18px 45px rgba(0,0,0,.58)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important}
  .nav button{color:#7f828a!important;transition:color .12s ease,transform .12s ease}.nav button.active{color:var(--ui-accent)!important}.nav .start .ico{box-shadow:0 0 0 7px rgba(13,14,16,.96),0 9px 28px color-mix(in srgb,var(--ui-accent),transparent 60%)!important}
  #home .card:first-of-type,#stats .card:first-of-type,#clients .card:first-of-type{background:linear-gradient(145deg,#202126,#17181b)!important}
  #stats .strength-item{background:#1a1b1e!important;border:1px solid #2d2f34!important;border-radius:18px!important;padding:14px!important;margin:8px 0!important}
  #stats canvas,#stats svg{max-width:100%!important}
  .sheet{background:#111214!important;border:1px solid #2b2d31!important;border-radius:28px 28px 0 0!important;box-shadow:0 -20px 60px rgba(0,0,0,.5)!important}
  .sheet-grabber{background:#4b4e55!important;width:42px!important;height:5px!important;border-radius:999px!important}
  @media(max-width:430px){
    .brand{font-size:36px!important}.page{padding-left:16px!important;padding-right:16px!important}.card{border-radius:22px!important;padding:18px!important;margin:12px 0!important}.title{font-size:22px!important}.metrics{gap:7px!important}.metric{padding:13px 9px!important}.metric b{font-size:18px!important}.metric span{font-size:10.5px!important}.nav{left:7px!important;right:7px!important;border-radius:23px!important}
  }
  `;document.head.appendChild(s);
})();
