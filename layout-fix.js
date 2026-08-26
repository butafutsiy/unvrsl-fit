'use strict';
(()=>{
  if(document.getElementById('unvrsl-layout-fix'))return;
  const s=document.createElement('style');s.id='unvrsl-layout-fix';s.textContent=`
  /* Prevent grid children and long Russian labels from pushing cards outside viewport */
  #stats .profile-overview,#stats .strength-summary{grid-template-columns:repeat(3,minmax(0,1fr));width:100%}
  #stats .profile-overview>* ,#stats .strength-summary>*{min-width:0;max-width:100%;overflow:hidden}
  #stats .metric span,#stats .metric b{max-width:100%;overflow-wrap:anywhere;word-break:normal}
  #stats .strength-item{min-width:0;max-width:100%}
  #stats .strength-item>div:first-child{min-width:0}
  #stats .strength-item-meta{white-space:normal;overflow-wrap:anywhere;line-height:1.35}
  #stats .strength-delta{white-space:nowrap}
  #stats .card{max-width:100%;overflow:hidden}

  /* 7-item trainer nav: keep every item inside its own column */
  .nav{grid-template-columns:repeat(7,minmax(0,1fr))!important;box-sizing:border-box}
  .nav button{min-width:0!important;max-width:100%;text-align:center;white-space:nowrap;letter-spacing:-.18px}
  .nav button:not(.start){overflow:hidden;text-overflow:clip}
  .nav .ico{flex:none}

  /* Cards and trainer controls should never exceed viewport */
  .page,.card,.metric,.settings-card{max-width:100%}
  .coach-actions{max-width:100%;flex-wrap:wrap}
  .row.between>div{min-width:0}

  @media(max-width:430px){
    body{padding-bottom:132px}
    .nav{left:7px!important;right:7px!important;bottom:7px!important;padding:9px 3px calc(8px + env(safe-area-inset-bottom))!important;border-radius:24px!important}
    .nav button{font-size:8.35px!important;line-height:1!important;padding:5px 0!important;font-weight:600!important;letter-spacing:-.3px!important}
    .nav .ico{height:23px!important;margin-bottom:5px!important}
    .nav .ico svg{width:22px!important;height:22px!important}
    .nav .start .ico{width:58px!important;height:58px!important;margin:-32px auto 5px!important}
    .nav .start .ico svg{width:28px!important;height:28px!important}
    #stats .card{padding-left:18px;padding-right:18px}
    #stats .strength-summary,#stats .profile-overview{gap:7px}
    #stats .strength-summary .metric,#stats .profile-overview .metric{padding:13px 10px;border-radius:20px}
    #stats .strength-summary .metric span,#stats .profile-overview .metric span{font-size:11.5px;line-height:1.15}
    #stats .strength-summary .metric b,#stats .profile-overview .metric b{font-size:19px;line-height:1.05;margin-top:7px}
    #stats .strength-item-title{font-size:16px}
    #stats .strength-item-meta{font-size:11px}
  }
  @media(max-width:370px){
    .nav button{font-size:7.7px!important;letter-spacing:-.45px!important}
    .nav .ico svg{width:21px!important;height:21px!important}
    #stats .strength-summary .metric span,#stats .profile-overview .metric span{font-size:10.5px}
    #stats .strength-summary .metric b,#stats .profile-overview .metric b{font-size:17px}
  }
  `;document.head.appendChild(s);

  function normalize(){
    const nav=document.querySelector('.nav');
    if(nav)nav.style.gridTemplateColumns='repeat(7,minmax(0,1fr))';
    document.querySelectorAll('.nav button[data-p]').forEach(b=>{
      b.setAttribute('aria-label',(b.textContent||'').trim());
      b.title=(b.textContent||'').trim();
    });
  }
  const obs=new MutationObserver(normalize);obs.observe(document.body,{childList:true,subtree:true});normalize();
})();
