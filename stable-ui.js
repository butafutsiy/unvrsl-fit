'use strict';
(()=>{
  if(window.__unvrslStableUi)return;window.__unvrslStableUi=true;
  const s=document.createElement('style');s.id='unvrsl-stable-ui';s.textContent=`
  html,body{overflow-x:hidden;touch-action:manipulation}
  button,[onclick],input,select,a{touch-action:manipulation;-webkit-user-select:none;pointer-events:auto}
  svg,.dash-muscle-visual,.dash-muscle-visual *{pointer-events:none}
  .modal:not(.show){display:none!important;pointer-events:none!important}
  .modal.show{pointer-events:auto}
  .page,.card,.metric,.settings-card{min-width:0;max-width:100%}
  .row>*{min-width:0}
  #stats .profile-overview,#stats .strength-summary{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;width:100%}
  #stats .profile-overview>* ,#stats .strength-summary>*{min-width:0;max-width:100%;overflow:hidden}
  #stats .metric{min-width:0;padding:14px 10px!important;border-radius:20px}
  #stats .metric span,#stats .metric b{max-width:100%;overflow-wrap:anywhere;word-break:normal}
  #stats .strength-item{min-width:0;max-width:100%}
  #stats .strength-item>div:first-child{min-width:0}
  #stats .strength-item-meta{white-space:normal;overflow-wrap:anywhere;line-height:1.3}
  #stats .strength-delta{white-space:nowrap}
  .nav{grid-template-columns:repeat(7,minmax(0,1fr))!important;overflow:visible!important;pointer-events:auto!important}
  .nav button{min-width:0!important;width:100%;max-width:100%;overflow:visible!important;text-align:center;white-space:nowrap;pointer-events:auto!important}
  .nav .ico{pointer-events:none}
  @media(max-width:430px){
    body{padding-bottom:126px!important}
    .page{padding-left:18px!important;padding-right:18px!important}
    .nav{left:6px!important;right:6px!important;bottom:6px!important;padding:9px 2px calc(8px + env(safe-area-inset-bottom))!important;border-radius:23px!important}
    .nav button{font-size:8px!important;line-height:1!important;padding:5px 0!important;letter-spacing:-.35px!important}
    .nav .ico{height:22px!important;margin-bottom:5px!important}
    .nav .ico svg{width:21px!important;height:21px!important}
    .nav .start .ico{width:56px!important;height:56px!important;margin:-31px auto 5px!important}
    .nav .start .ico svg{width:27px!important;height:27px!important}
    #stats .card{padding-left:17px!important;padding-right:17px!important;overflow:hidden}
    #stats .strength-summary .metric span,#stats .profile-overview .metric span{font-size:11px!important;line-height:1.12!important}
    #stats .strength-summary .metric b,#stats .profile-overview .metric b{font-size:18px!important;line-height:1.05!important;margin-top:7px!important}
    #stats .strength-item-title{font-size:16px}
    #stats .strength-item-meta{font-size:11px}
  }
  `;document.head.appendChild(s);

  function decorateHomeSafe(){
    const root=document.getElementById('home');if(!root)return;
    const weight=root.querySelector('.weight-top')?.closest('.card');
    if(weight)weight.classList.add('dash-weight-card');
    const streak=root.querySelector('.streak');if(streak)streak.classList.add('dash-streak');
    const cards=[...root.querySelectorAll(':scope > .card')];
    const next=cards.find(c=>/Ближайшая тренировка/i.test(c.textContent||''));if(next)next.classList.add('next-workout-card');
  }
  function wrapHome(){
    const cur=window.home;if(typeof cur!=='function'||cur.__stableUi)return;
    const base=cur;const wrapped=function(){const r=base.apply(this,arguments);decorateHomeSafe();return r};wrapped.__stableUi=true;window.home=wrapped;try{home=wrapped}catch(e){}
  }
  wrapHome();decorateHomeSafe();
  setTimeout(()=>{wrapHome();decorateHomeSafe()},250);
  setTimeout(()=>{wrapHome();decorateHomeSafe()},1200);
})();
