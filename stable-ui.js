'use strict';
(()=>{
  if(window.__unvrslStableUi)return;window.__unvrslStableUi=true;
  const s=document.createElement('style');s.id='unvrsl-stable-ui';s.textContent=`
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{overflow-x:hidden;touch-action:manipulation}
  button,[onclick],input,select,a{touch-action:manipulation;pointer-events:auto}
  button{cursor:pointer}
  svg,.dash-muscle-visual,.dash-muscle-visual *{pointer-events:none}
  .modal:not(.show){display:none!important;pointer-events:none!important}
  .modal.show{pointer-events:auto}
  .page,.card,.metric,.settings-card,.exercise{min-width:0;max-width:100%}
  .row>*{min-width:0}

  /* Stable home styling: visual only, no DOM replacement */
  #home .dash-weight-card{padding:22px 22px 17px;overflow:hidden}
  #home .dash-weight-card .weight-top{align-items:flex-start;gap:14px}
  #home .dash-weight-card .weight-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  #home .dash-weight-card .weight-actions button{min-height:40px;padding:8px 11px;border-radius:14px;border:1px solid #38383d;background:#28282b;color:var(--green);font-size:14px;font-weight:720}
  #home .dash-weight-card .big{font-size:54px;margin-top:6px}
  #home .dash-weight-card .spark{height:175px;margin-top:18px}
  #home .dash-streak{min-height:112px;padding:20px 21px;gap:16px}
  #home .dash-streak .fire{width:58px;height:58px;flex:0 0 58px;display:grid;place-items:center;border-radius:50%;background:#252528;border:1px solid #39393d;font-size:31px}
  #home .dash-streak b{font-size:23px;letter-spacing:-.45px}
  #home .dash-streak .streak-meta{font-size:14px;line-height:1.35;margin-top:4px}
  #home .next-workout-card{position:relative;overflow:hidden;padding:24px 22px;background:radial-gradient(circle at 95% 40%,color-mix(in srgb,var(--green),transparent 91%),transparent 38%),linear-gradient(145deg,#1d1d1f,#19191b)}
  #home .next-workout-card>.muted:first-child{color:var(--green);font-size:13px;font-weight:720;text-transform:uppercase;letter-spacing:.045em}
  #home .next-workout-card .title{font-size:27px;margin-top:9px;max-width:82%}
  #home .next-workout-card .btn.primary{margin-top:18px;min-width:190px}

  /* Stats never overflow */
  #stats .profile-overview,#stats .strength-summary{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;width:100%}
  #stats .profile-overview>* ,#stats .strength-summary>*{min-width:0;max-width:100%;overflow:hidden}
  #stats .metric{min-width:0;padding:14px 10px!important;border-radius:20px}
  #stats .metric span,#stats .metric b{max-width:100%;overflow-wrap:anywhere;word-break:normal}
  #stats .strength-item{min-width:0;max-width:100%}
  #stats .strength-item>div:first-child{min-width:0}
  #stats .strength-item-meta{white-space:normal;overflow-wrap:anywhere;line-height:1.3}
  #stats .strength-delta{white-space:nowrap}

  /* Trainer/client pages */
  #clients .card .row,#programs .card .row{gap:12px}
  #clients .coach-actions,#programs .coach-actions{display:flex;gap:8px;flex-wrap:wrap}
  #clients .btn,#programs .btn{max-width:100%}

  /* Navigation: number of columns is set once from visible buttons */
  .nav{grid-template-columns:repeat(var(--nav-cols,5),minmax(0,1fr))!important;overflow:visible!important;pointer-events:auto!important}
  .nav button{min-width:0!important;width:100%;max-width:100%;overflow:visible!important;text-align:center;white-space:nowrap;pointer-events:auto!important}
  .nav .ico{pointer-events:none}

  @media(max-width:430px){
    body{padding-bottom:126px!important}
    .page{padding-left:17px!important;padding-right:17px!important}
    #home .dash-weight-card{padding:19px 17px 15px}#home .dash-weight-card .big{font-size:49px}#home .dash-weight-card .weight-actions button{font-size:13px;padding:7px 9px}
    #home .dash-streak{padding:17px!important;gap:12px!important}#home .dash-streak .fire{width:52px;height:52px;flex-basis:52px;font-size:28px}#home .dash-streak b{font-size:20px}#home .dash-streak .streak-meta{font-size:13px}
    #home .next-workout-card{padding:21px 18px}#home .next-workout-card .title{font-size:24px;max-width:100%}
    #stats .card{padding-left:16px!important;padding-right:16px!important;overflow:hidden}
    #stats .strength-summary .metric span,#stats .profile-overview .metric span{font-size:10.8px!important;line-height:1.12!important}
    #stats .strength-summary .metric b,#stats .profile-overview .metric b{font-size:17px!important;line-height:1.05!important;margin-top:7px!important}
    #stats .strength-item-title{font-size:16px}#stats .strength-item-meta{font-size:11px}
    #clients .card>.row.between,#programs .card>.row.between{align-items:flex-start}
  }
  `;document.head.appendChild(s);

  function decorateHomeSafe(){
    const root=document.getElementById('home');if(!root)return;
    const weight=root.querySelector('.weight-top')?.closest('.card');if(weight)weight.classList.add('dash-weight-card');
    const streak=root.querySelector('.streak');if(streak)streak.classList.add('dash-streak');
    const cards=[...root.querySelectorAll(':scope > .card')];const next=cards.find(c=>/Ближайшая тренировка/i.test(c.textContent||''));if(next)next.classList.add('next-workout-card');
  }
  function setNavColumns(){
    const nav=document.querySelector('.nav');if(!nav)return;
    const visible=[...nav.querySelectorAll('button[data-p]')].filter(b=>getComputedStyle(b).display!=='none');
    const n=Math.max(1,visible.length);nav.style.setProperty('--nav-cols',String(n));
  }
  function wrapHome(){
    const cur=window.home;if(typeof cur!=='function'||cur.__stableUi)return;
    const base=cur;const wrapped=function(){const r=base.apply(this,arguments);decorateHomeSafe();return r};wrapped.__stableUi=true;window.home=wrapped;try{home=wrapped}catch(e){}
  }
  function refreshSafe(){wrapHome();decorateHomeSafe();setNavColumns()}
  refreshSafe();
  [200,600,1400,3000,6000].forEach(t=>setTimeout(refreshSafe,t));
  window.addEventListener('pageshow',refreshSafe,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSafe()},{passive:true});
})();
