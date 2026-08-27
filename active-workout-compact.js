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

    /* Header layout: full-width title/rule, metrics + actions share one compact row. */
    #start .exercise:not(.anton-superset):not(.anton-single)>.row.between{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto!important;
      grid-template-areas:'name name' 'rule rule' 'chips actions'!important;
      column-gap:8px!important;
      row-gap:4px!important;
      align-items:center!important;
      min-width:0!important;
    }
    #start .exercise:not(.anton-superset):not(.anton-single)>.row.between>.grow{display:contents!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .exname{grid-area:name!important;font-size:18px!important;line-height:1.12!important;min-width:0!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .rule-line{grid-area:rule!important;font-size:12.5px!important;line-height:1.22!important;margin:0!important;min-width:0!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact{grid-area:chips!important;gap:5px!important;margin:2px 0 0!important;align-self:center!important;min-width:0!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact .chip{padding:5px 8px!important;font-size:11.5px!important;line-height:1.05!important;white-space:nowrap!important}

    #start .exercise:not(.anton-superset):not(.anton-single) .head-actions{
      grid-area:actions!important;
      display:flex!important;
      flex-direction:row!important;
      gap:4px!important;
      flex:0 0 auto!important;
      width:auto!important;
      max-width:none!important;
      align-items:center!important;
      justify-content:flex-end!important;
      align-self:center!important;
      margin-top:2px!important;
    }
    #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny{
      width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;
      padding:0!important;border-radius:11px!important;font-size:14px!important;display:grid!important;place-items:center!important
    }
    #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny[onclick*="openAutoWarmup"]{
      width:auto!important;min-width:66px!important;max-width:none!important;height:34px!important;min-height:34px!important;
      padding:0 9px!important;font-size:10.5px!important;line-height:1!important;white-space:nowrap!important
    }

    #start .exercise:not(.anton-superset):not(.anton-single) .method-strip{margin:7px 0 0!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .sethead{margin:10px 0 0!important;font-size:10.5px!important;line-height:1!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow{margin-top:6px!important;gap:6px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{min-height:40px!important;padding:8px 5px!important;border-radius:12px!important;font-size:15px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .check{width:36px!important;height:36px!important;border-radius:12px!important;font-size:16px!important}
    #start .exercise:not(.anton-superset):not(.anton-single) .prev-set{font-size:10.5px!important;margin:4px 0 0 34px!important;line-height:1.15!important}

    /* Cardio keeps the same compact visual rhythm. */
    #start .cardio-compact-ex{padding:12px 14px!important;margin:8px 0!important}
    #start .cardio-compact-ex .cardio-compact-row{margin-top:8px!important}

    @media(max-width:430px){
      .topbar{padding-top:max(calc(env(safe-area-inset-top) + 12px),56px)!important}
      #start .workout-head{padding:13px!important}
      #start .workout-head .title{font-size:20px!important}
      #start .exercise:not(.anton-superset):not(.anton-single){padding:12px!important;border-radius:19px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .exname{font-size:17px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .rule-line{font-size:12px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact{gap:4px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact .chip{padding:4px 7px!important;font-size:11px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions{gap:3px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;font-size:13px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny[onclick*="openAutoWarmup"]{min-width:62px!important;height:32px!important;min-height:32px!important;padding:0 7px!important;font-size:10px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow{gap:5px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow input{min-height:39px!important;padding:7px 4px!important;font-size:14px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .check{width:35px!important;height:35px!important}
    }

    @media(max-width:365px){
      #start .exercise:not(.anton-superset):not(.anton-single)>.row.between{
        grid-template-columns:1fr!important;
        grid-template-areas:'name' 'rule' 'chips' 'actions'!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions{justify-content:flex-start!important;margin-top:1px!important}
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