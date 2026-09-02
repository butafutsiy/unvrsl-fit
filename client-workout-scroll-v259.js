'use strict';
(()=>{
  const W=window,D=document,ROOT_CLASS='unvrsl-client-workout-scroll-v263';
  if(W.__unvrslClientWorkoutScrollV263)return;
  W.__unvrslClientWorkoutScrollV263=true;
  W.__unvrslClientWorkoutScrollV261=true;
  W.__unvrslClientWorkoutScrollV259=true;

  D.getElementById('unvrsl-client-workout-scroll-v259-style')?.remove();
  D.getElementById('unvrsl-client-workout-scroll-v261-style')?.remove();
  D.documentElement?.classList?.remove('unvrsl-client-workout-scroll-v259','unvrsl-client-workout-scroll-v261');
  D.body?.classList?.remove('unvrsl-client-workout-scroll-v259','unvrsl-client-workout-scroll-v261');

  const style=D.createElement('style');
  style.id='unvrsl-client-workout-scroll-v263-style';
  style.textContent=`
    html.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;touch-action:auto!important;overscroll-behavior-y:auto!important}
    body.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active{overflow:visible!important;overflow-anchor:none!important;touch-action:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active *{touch-action:auto!important}
    body.${ROOT_CLASS} #timer.show{touch-action:auto!important}
    body.${ROOT_CLASS} #modal:not(.show){display:none!important;pointer-events:none!important}

    /* Stable recommendation geometry. No JS moves these nodes after a set click. */
    #start .exercise .te200-rec,
    #start .exercise .te200-auto{
      grid-column:1 / -1!important;
      width:100%!important;
      max-width:none!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }
    #start .exercise .te200-rec{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto!important;
      align-items:center!important;
      gap:12px!important;
      min-height:84px!important;
      margin:9px 0 4px!important;
      padding:13px 14px!important;
      border-radius:18px!important;
      overflow:visible!important;
    }
    #start .exercise .te200-rec .te200-rec-main{min-width:0!important;width:100%!important}
    #start .exercise .te200-rec b{font-size:13.5px!important;line-height:1.25!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
    #start .exercise .te200-rec span{font-size:11.5px!important;line-height:1.3!important;margin-top:5px!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere!important}
    #start .exercise .te200-rec button{min-width:104px!important;min-height:46px!important;padding:10px 13px!important;border-radius:14px!important;white-space:nowrap!important;align-self:center!important}
    @media(max-width:380px){
      #start .exercise .te200-rec{grid-template-columns:minmax(0,1fr) 96px!important;gap:9px!important;padding:12px!important}
      #start .exercise .te200-rec button{min-width:96px!important;padding:9px 10px!important;font-size:11.5px!important}
    }
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

  let cleanupQueued=false;
  function queueCleanup(){
    if(cleanupQueued)return;
    cleanupQueued=true;
    requestAnimationFrame(()=>{cleanupQueued=false;removeExerciseHeaderRpe()});
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
    queueCleanup();
    return on;
  }

  /* v263 intentionally has NO click-time scrollTo/scrollBy correction.
     The browser keeps the finger/viewport position natively. Repeated manual
     corrections were the remaining source of the visible bounce on set taps. */

  const start=D.getElementById('start'),modal=D.getElementById('modal');
  const classObserver=typeof MutationObserver==='function'&&start?new MutationObserver(muts=>{
    if(muts.some(m=>m.type==='attributes'))sync();
    if(muts.some(m=>m.type==='childList'))queueCleanup();
  }):null;
  classObserver?.observe(start,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});

  const modalObserver=typeof MutationObserver==='function'&&modal?new MutationObserver(sync):null;
  modalObserver?.observe(modal,{attributes:true,attributeFilter:['class']});

  W.addEventListener?.('unvrsl:cloud-modules-settled',sync);
  W.addEventListener?.('unvrsl:modules-ready',sync);
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)sync()},{passive:true});
  sync();
  [100,400,1200,3000].forEach(ms=>setTimeout(sync,ms));
})();
