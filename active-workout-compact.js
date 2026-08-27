'use strict';
(()=>{
  if(window.__unvrslActiveWorkoutCompact)return;window.__unvrslActiveWorkoutCompact=true;
  const s=document.createElement('style');
  s.id='unvrsl-active-workout-compact';
  s.textContent=`
    /* Compact active workout on phones without changing workout logic */
    #start .workout-head{padding:14px 15px!important;margin:8px 0!important;border-radius:21px!important}
    #start .workout-head .title{font-size:22px!important;line-height:1.1!important;letter-spacing:-.45px!important}
    #start .workout-head>.row{gap:9px!important;align-items:flex-start!important}
    #start .workout-head .muted{font-size:13px!important;line-height:1.2!important}
    #start .workout-head .progress{height:6px!important;margin-top:10px!important}
    #start .workout-duration-row{margin-top:8px!important;padding-top:8px!important}
    #start .workout-duration-row .muted.small{font-size:12px!important}
    #start #workoutDuration{font-size:18px!important}
    #start .rest-v2-live{margin-top:7px!important;padding:8px 10px!important;border-radius:13px!important;font-size:13px!important}

    #start .exercise:not(.anton-superset):not(.anton-single){padding:13px 14px!important;margin:8px 0!important;border-radius:20px!important;overflow:hidden!important}
    #start .exercise:not(.anton-superset):not(.anton-single)>.row.between{gap:9px!important;align-items:flex-start!important;min-width:0!important}
    #start .exercise:not(.anton-superset):not(.anton-single)>.row.between>.grow{min-width:0!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .exname{font-size:18px!important;line-height:1.12!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .rule-line{font-size:12.5px!important;line-height:1.25!important;margin-top:3px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact{gap:5px!important;margin-top:7px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact .chip{padding:5px 8px!important;font-size:11.5px!important;line-height:1.05!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .head-actions{display:flex!important;flex-direction:column!important;gap:5px!important;flex:0 0 76px!important;width:76px!important;max-width:76px!important;align-items:center!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny{width:42px!important;height:38px!important;min-height:38px!important;padding:0!important;border-radius:12px!important;font-size:15px!important;display:grid!important;place-items:center!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny[onclick*="openAutoWarmup"]{width:76px!important;min-width:76px!important;max-width:76px!important;height:36px!important;min-height:36px!important;padding:0 8px!important;font-size:11px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .method-strip{margin:7px 0 0!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .sethead{margin:9px 0 0!important;font-size:10.5px!important;line-height:1!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow{margin-top:6px!important;gap:6px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{min-height:42px!important;padding:9px 5px!important;border-radius:12px!important;font-size:15px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .check{width:38px!important;height:38px!important;border-radius:12px!important;font-size:16px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .prev-set{font-size:10.5px!important;margin:4px 0 0 34px!important;line-height:1.15!important}

    /* Cardio has its own row layout, just keep it visually aligned with strength cards. */
    #start .cardio-compact-ex{padding:12px 14px!important;margin:8px 0!important}
    #start .cardio-compact-ex .cardio-compact-row{margin-top:8px!important}

    @media(max-width:430px){
      /* iOS standalone mode can occasionally report safe-area-inset-top as 0. */
      .topbar{padding-top:max(calc(env(safe-area-inset-top) + 12px),56px)!important}
      #start .workout-head{padding:13px!important}
      #start .workout-head .title{font-size:20px!important}
      #start .exercise:not(.anton-superset):not(.anton-single){padding:12px!important;border-radius:19px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .exname{font-size:17px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .rule-line{font-size:12px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions{flex-basis:72px!important;width:72px!important;max-width:72px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny{width:39px!important;height:36px!important;min-height:36px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny[onclick*="openAutoWarmup"]{width:72px!important;min-width:72px!important;max-width:72px!important;height:34px!important;min-height:34px!important;font-size:10.5px!important;padding:0 6px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow{gap:5px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{min-height:40px!important;padding:8px 4px!important;font-size:14px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .check{width:36px!important;height:36px!important}
    }
  `;
  document.head.appendChild(s);

  function dedupeCardioEffort(){
    document.querySelectorAll('#start .cardio-compact-ex').forEach(card=>{
      const seen=new Set();
      card.querySelectorAll('.chip').forEach(ch=>{
        const t=(ch.textContent||'').trim().replace(/\s+/g,' ');
        if(!/^RIR\s/i.test(t))return;
        if(seen.has(t))ch.remove();else seen.add(t);
      });
    });
  }
  const oldStart=window.startPage;
  if(typeof oldStart==='function'&&!oldStart.__activeWorkoutCompact){
    const wrapped=function(){const r=oldStart.apply(this,arguments);requestAnimationFrame(dedupeCardioEffort);return r};
    wrapped.__activeWorkoutCompact=true;window.startPage=wrapped;try{startPage=wrapped}catch(e){}
  }
  setTimeout(dedupeCardioEffort,0);
})();