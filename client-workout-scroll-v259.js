'use strict';
(()=>{
  const W=window,D=document,ROOT_CLASS='unvrsl-client-workout-scroll-v259';
  if(W.__unvrslClientWorkoutScrollV259)return;W.__unvrslClientWorkoutScrollV259=true;

  const style=D.createElement('style');
  style.id='unvrsl-client-workout-scroll-v259-style';
  style.textContent=`
    html.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;touch-action:pan-y pinch-zoom!important;overscroll-behavior-y:auto!important}
    body.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:pan-y pinch-zoom!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active,
    body.${ROOT_CLASS} #start.page.active .workout-head,
    body.${ROOT_CLASS} #start.page.active .exercise,
    body.${ROOT_CLASS} #start.page.active .setrow,
    body.${ROOT_CLASS} #start.page.active input,
    body.${ROOT_CLASS} #start.page.active button{touch-action:pan-y pinch-zoom!important}
    body.${ROOT_CLASS} #start.page.active{overflow:visible!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #modal:not(.show){display:none!important;pointer-events:none!important}
  `;
  D.head?.appendChild(style);

  function isClient(){
    if(!W.cloud?.user)return false;
    if(typeof W.unvrslTrainerMode==='function')return !W.unvrslTrainerMode();
    return W.cloud?.profile?.role!=='trainer';
  }
  function active(){return isClient()&&!!D.getElementById('start')?.classList?.contains('active')}
  function sync(){
    const on=active();
    D.documentElement?.classList?.toggle(ROOT_CLASS,on);
    D.body?.classList?.toggle(ROOT_CLASS,on);
    if(on){
      const modal=D.getElementById('modal');
      if(modal&&!modal.classList.contains('show')){
        modal.style.pointerEvents='none';
        modal.style.background='';
        const sheet=D.getElementById('sheet');
        if(sheet)sheet.style.transform='';
      }
    }
    return on;
  }

  // A passive capture listener neutralizes cached legacy document handlers
  // that call preventDefault(), while leaving the browser's native pan intact.
  D.addEventListener?.('touchmove',event=>{
    if(!active()||!event.target?.closest?.('#start.page.active'))return;
    event.stopImmediatePropagation?.();
  },{capture:true,passive:true});

  const observer=typeof MutationObserver==='function'?new MutationObserver(sync):null;
  const start=D.getElementById('start'),modal=D.getElementById('modal');
  if(start)observer?.observe(start,{attributes:true,attributeFilter:['class']});
  if(modal)observer?.observe(modal,{attributes:true,attributeFilter:['class']});
  W.addEventListener?.('unvrsl:cloud-modules-settled',sync);
  W.addEventListener?.('unvrsl:modules-ready',sync);
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)sync()},{passive:true});
  sync();[100,400,1200,3000].forEach(ms=>setTimeout(sync,ms));
})();
