'use strict';
(()=>{
  const W=window,D=document,ROOT_CLASS='unvrsl-client-workout-scroll-v261';
  if(W.__unvrslClientWorkoutScrollV261)return;
  W.__unvrslClientWorkoutScrollV261=true;
  W.__unvrslClientWorkoutScrollV259=true;

  D.getElementById('unvrsl-client-workout-scroll-v259-style')?.remove();
  D.documentElement?.classList?.remove('unvrsl-client-workout-scroll-v259');
  D.body?.classList?.remove('unvrsl-client-workout-scroll-v259');

  const style=D.createElement('style');
  style.id='unvrsl-client-workout-scroll-v261-style';
  style.textContent=`
    html.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;touch-action:auto!important;overscroll-behavior-y:auto!important}
    body.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active{overflow:visible!important;overflow-anchor:none!important;touch-action:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active *{touch-action:auto!important}
    body.${ROOT_CLASS} #timer.show{touch-action:auto!important}
    body.${ROOT_CLASS} #modal:not(.show){display:none!important;pointer-events:none!important}
  `;
  D.head?.appendChild(style);

  function isClient(){
    if(!W.cloud?.user)return false;
    if(typeof W.unvrslTrainerMode==='function')return !W.unvrslTrainerMode();
    return W.cloud?.profile?.role!=='trainer';
  }
  function workoutActive(){return !!D.getElementById('start')?.classList?.contains('active')}
  function active(){return isClient()&&workoutActive()}

  function removeExerciseHeaderRpe(){
    const root=D.getElementById('start');
    if(!root)return;
    root.querySelectorAll('.exercise .chip').forEach(ch=>{
      if(ch.closest('.setrow,.sethead'))return;
      const text=(ch.textContent||'').trim().replace(/\s+/g,' ');
      if(/^RPE(?:\s|:|$)/i.test(text))ch.remove();
    });
  }

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
    removeExerciseHeaderRpe();
    return on;
  }

  let restoreSeq=0;
  function currentScrollY(){return W.scrollY||D.documentElement?.scrollTop||D.body?.scrollTop||0}
  function preserveScrollAfterSetToggle(button){
    if(!workoutActive())return;
    const y=currentScrollY(),seq=++restoreSeq;
    button?.blur?.();
    const restore=()=>{
      if(seq!==restoreSeq||!workoutActive())return;
      const now=currentScrollY();
      if(Math.abs(now-y)>1)W.scrollTo(0,y);
    };
    queueMicrotask(restore);
    requestAnimationFrame(()=>{restore();requestAnimationFrame(restore)});
    setTimeout(restore,40);
    setTimeout(restore,100);
  }

  D.addEventListener('click',event=>{
    const button=event.target?.closest?.('#start .check');
    if(button)preserveScrollAfterSetToggle(button);
  },true);

  const observer=typeof MutationObserver==='function'?new MutationObserver(sync):null;
  const start=D.getElementById('start'),modal=D.getElementById('modal');
  if(start)observer?.observe(start,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  if(modal)observer?.observe(modal,{attributes:true,attributeFilter:['class']});
  W.addEventListener?.('unvrsl:cloud-modules-settled',sync);
  W.addEventListener?.('unvrsl:modules-ready',sync);
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)sync()},{passive:true});
  sync();[100,400,1200,3000].forEach(ms=>setTimeout(sync,ms));
})();
