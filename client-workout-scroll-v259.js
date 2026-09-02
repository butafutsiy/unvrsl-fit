'use strict';
(()=>{
  const W=window,D=document,ROOT_CLASS='unvrsl-client-workout-scroll-v266';
  if(W.__unvrslClientWorkoutScrollV266)return;
  W.__unvrslClientWorkoutScrollV266=true;
  W.__unvrslClientWorkoutScrollV265=true;
  W.__unvrslClientWorkoutScrollV264=true;
  W.__unvrslClientWorkoutScrollV263=true;
  W.__unvrslClientWorkoutScrollV261=true;
  W.__unvrslClientWorkoutScrollV259=true;

  ['259','261','263','264','265'].forEach(v=>D.getElementById(`unvrsl-client-workout-scroll-v${v}-style`)?.remove());
  const oldClasses=['unvrsl-client-workout-scroll-v259','unvrsl-client-workout-scroll-v261','unvrsl-client-workout-scroll-v263','unvrsl-client-workout-scroll-v264','unvrsl-client-workout-scroll-v265'];
  D.documentElement?.classList?.remove(...oldClasses);
  D.body?.classList?.remove(...oldClasses);

  const style=D.createElement('style');
  style.id='unvrsl-client-workout-scroll-v266-style';
  style.textContent=`
    html.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;touch-action:auto!important;overscroll-behavior-y:auto!important}
    body.${ROOT_CLASS}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active{overflow:visible!important;overflow-anchor:none!important;touch-action:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${ROOT_CLASS} #start.page.active *{touch-action:auto!important}
    body.${ROOT_CLASS} #timer.show{touch-action:auto!important}
    body.${ROOT_CLASS} #modal:not(.show){display:none!important;pointer-events:none!important}
    #start .te200-readiness{width:100%!important;min-height:58px!important;box-sizing:border-box!important;margin:10px 0 4px!important}
    #start .exercise .te200-rec,#start .exercise .te200-auto{grid-column:1 / -1!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important}
    #start .exercise .te200-auto{min-height:42px!important}
    #start .exercise .te200-rec{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:12px!important;min-height:84px!important;margin:9px 0 4px!important;padding:13px 14px!important;border-radius:18px!important;overflow:visible!important}
    #start .exercise .te200-rec .te200-rec-main{min-width:0!important;width:100%!important}
    #start .exercise .te200-rec b{font-size:13.5px!important;line-height:1.25!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
    #start .exercise .te200-rec span{font-size:11.5px!important;line-height:1.3!important;margin-top:5px!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere!important}
    #start .exercise .te200-rec button{min-width:104px!important;min-height:46px!important;padding:10px 13px!important;border-radius:14px!important;white-space:nowrap!important;align-self:center!important}
    @media(max-width:380px){#start .exercise .te200-rec{grid-template-columns:minmax(0,1fr) 96px!important;gap:9px!important;padding:12px!important}#start .exercise .te200-rec button{min-width:96px!important;padding:9px 10px!important;font-size:11.5px!important}}
  `;
  D.head?.appendChild(style);

  function isClient(){
    if(!W.cloud?.user)return false;
    if(typeof W.unvrslTrainerMode==='function')return !W.unvrslTrainerMode();
    return W.cloud?.profile?.role!=='trainer';
  }
  function workoutActive(){return !!D.getElementById('start')?.classList?.contains('active')}
  function active(){return isClient()&&workoutActive()}

  function currentWorkout(){
    try{return typeof st!=='undefined'?st?.current:null}catch(_){return null}
  }

  function removeExerciseHeaderRpe(){
    const root=D.getElementById('start');
    if(!root)return;
    root.querySelectorAll('.exercise .chip').forEach(ch=>{
      if(ch.closest('.setrow,.sethead'))return;
      const text=(ch.textContent||'').trim().replace(/\s+/g,' ');
      if(/^RPE(?:\s|:|$)/i.test(text))ch.remove();
    });
  }

  function cleanupEmptyWorkoutArtifacts(){
    const root=D.getElementById('start');
    if(!root||root.querySelector('.exercise'))return;
    const title=[...root.querySelectorAll('.title')].find(el=>(el.textContent||'').includes('Нет активной тренировки'));
    if(!title)return;
    root.querySelectorAll('.te200-readiness,.te200-rec,.te200-auto').forEach(el=>el.remove());
  }

  let cleanupQueued=false;
  function queueCleanup(){
    if(cleanupQueued)return;
    cleanupQueued=true;
    requestAnimationFrame(()=>{cleanupQueued=false;removeExerciseHeaderRpe();cleanupEmptyWorkoutArtifacts()});
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

  function patchSetUi(ei,si){
    const cur=currentWorkout();
    if(!cur)return;
    const ex=cur.ex?.[Number(ei)],set=ex?.set?.[Number(si)];
    const cards=[...D.querySelectorAll('#start .exercise')];
    const card=cards[Number(ei)];
    const btn=card?.querySelectorAll('.check')?.[Number(si)];
    if(btn&&set){
      btn.classList.toggle('done',!!set.ok);
      btn.textContent=set.ok?'✓':'○';
    }
    let doneCount=0,totalCount=0;
    (cur.ex||[]).forEach(e=>(e.set||[]).forEach(s=>{totalCount++;if(s?.ok)doneCount++}));
    const pct=totalCount?Math.round(doneCount/totalCount*100):0;
    const head=D.querySelector('#start .workout-head');
    const pctChip=head?.querySelector('.chip');
    if(pctChip)pctChip.textContent=`${pct}%`;
    const bar=head?.querySelector('.progress i');
    if(bar)bar.style.width=`${pct}%`;
  }

  /* Set completion used to call startPage(), rebuilding the entire workout and
     physically removing readiness/recommendation nodes for ~300-700 ms. Keep
     the existing toggleSet behavior (including timer/toasts from wrappers), but
     temporarily suppress only that full render. Then patch the changed button
     and progress in-place. */
  function installStableToggleSet(){
    const current=W.toggleSet;
    if(typeof current!=='function'||current.__unvrslNoWorkoutRebuildV266)return false;
    const wrapped=function(ei,si){
      const winStart=W.startPage;
      let lexicalStart=winStart;
      try{if(typeof startPage==='function')lexicalStart=startPage}catch(_){ }
      const noRender=function(){};
      try{W.startPage=noRender}catch(_){ }
      try{startPage=noRender}catch(_){ }
      try{
        return current.apply(this,arguments);
      }finally{
        try{W.startPage=winStart}catch(_){ }
        try{startPage=lexicalStart}catch(_){ }
        patchSetUi(ei,si);
        removeExerciseHeaderRpe();
      }
    };
    wrapped.__unvrslNoWorkoutRebuildV266=true;
    wrapped.__unvrslNoWorkoutRebuildBase=current;
    try{W.toggleSet=wrapped}catch(_){ }
    try{toggleSet=wrapped}catch(_){ }
    return true;
  }

  const start=D.getElementById('start'),modal=D.getElementById('modal');
  const classObserver=typeof MutationObserver==='function'&&start?new MutationObserver(muts=>{
    if(muts.some(m=>m.type==='attributes'))sync();
    if(muts.some(m=>m.type==='childList'))queueCleanup();
  }):null;
  classObserver?.observe(start,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});

  const modalObserver=typeof MutationObserver==='function'&&modal?new MutationObserver(sync):null;
  modalObserver?.observe(modal,{attributes:true,attributeFilter:['class']});

  W.addEventListener?.('unvrsl:cloud-modules-settled',()=>{installStableToggleSet();sync()});
  W.addEventListener?.('unvrsl:modules-ready',()=>{installStableToggleSet();sync()});
  W.addEventListener?.('unvrsl:training-engine-ready',()=>{installStableToggleSet();sync()});
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden){installStableToggleSet();sync()}},{passive:true});

  installStableToggleSet();
  sync();
  [100,400,900,1600,3000].forEach(ms=>setTimeout(()=>{installStableToggleSet();sync()},ms));
})();
