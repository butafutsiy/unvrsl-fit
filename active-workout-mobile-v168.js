'use strict';
(()=>{
  if(window.__unvrslActiveWorkoutMobileV168)return;
  window.__unvrslActiveWorkoutMobileV168=true;

  const style=document.createElement('style');
  style.id='active-workout-mobile-v168-style';
  style.textContent=`
    @media(max-width:520px){
      #start.page{padding-left:10px!important;padding-right:10px!important;padding-bottom:150px!important;overflow-x:hidden!important}
      #start .exercise:not(.anton-superset):not(.anton-single){padding:14px 13px!important;overflow:hidden!important}

      /* Exercise header: content and controls no longer fight for one row. */
      #start .exercise:not(.anton-superset):not(.anton-single)>.row.between{
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        grid-template-areas:'name' 'rule' 'chips' 'actions'!important;
        gap:6px!important;
        align-items:center!important;
        min-width:0!important;
        width:100%!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single)>.row.between>.grow{display:contents!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .exname{grid-area:name!important;min-width:0!important;max-width:100%!important;font-size:18px!important;line-height:1.14!important;overflow-wrap:anywhere!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .rule-line{grid-area:rule!important;min-width:0!important;max-width:100%!important;font-size:12.5px!important;line-height:1.25!important;margin:0!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact{
        grid-area:chips!important;
        display:flex!important;
        flex-wrap:nowrap!important;
        gap:5px!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        overflow-x:auto!important;
        overflow-y:hidden!important;
        overscroll-behavior-x:contain!important;
        -webkit-overflow-scrolling:touch!important;
        scrollbar-width:none!important;
        padding:2px 0 3px!important;
        margin:0!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact::-webkit-scrollbar{display:none!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .chips.compact .chip{
        flex:0 0 auto!important;
        min-width:max-content!important;
        max-width:none!important;
        padding:5px 8px!important;
        font-size:11.5px!important;
        line-height:1.05!important;
        white-space:nowrap!important;
        overflow:visible!important;
        text-overflow:clip!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions{
        grid-area:actions!important;
        display:flex!important;
        flex-flow:row nowrap!important;
        gap:6px!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        align-items:center!important;
        justify-content:flex-start!important;
        margin:0!important;
        padding-top:1px!important;
        overflow-x:auto!important;
        scrollbar-width:none!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions::-webkit-scrollbar{display:none!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny{
        flex:0 0 auto!important;
        width:38px!important;
        min-width:38px!important;
        height:38px!important;
        min-height:38px!important;
        padding:0!important;
        border-radius:12px!important;
        display:grid!important;
        place-items:center!important;
        font-size:15px!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .head-actions .btn.tiny[onclick*="openAutoWarmup"]{
        width:auto!important;
        min-width:92px!important;
        padding:0 12px!important;
        font-size:12px!important;
        white-space:nowrap!important
      }

      /* RPE + RIR adds a sixth cell. Keep all six cells on one line. */
      #start .exercise:not(.anton-superset):not(.anton-single) .sethead.effort-head,
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row{
        display:grid!important;
        grid-template-columns:26px minmax(62px,1.12fr) minmax(58px,1fr) minmax(50px,.80fr) minmax(46px,.72fr) 38px!important;
        column-gap:5px!important;
        row-gap:0!important;
        align-items:center!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .sethead.effort-head{margin:12px 0 3px!important;font-size:10.5px!important;line-height:1!important;text-align:center!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .sethead.effort-head>*{min-width:0!important;text-align:center!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row{margin-top:7px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row>*{min-width:0!important;max-width:100%!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row input{
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        min-height:44px!important;
        padding:8px 3px!important;
        border-radius:12px!important;
        font-size:15px!important;
        text-align:center!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row .check{
        width:38px!important;
        min-width:38px!important;
        height:38px!important;
        min-height:38px!important;
        justify-self:end!important;
        border-radius:12px!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .set-wrap .prev-set{
        margin:5px 0 2px 31px!important;
        padding:0!important;
        max-width:calc(100% - 31px)!important;
        font-size:11px!important;
        line-height:1.22!important;
        text-align:center!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important
      }
    }

    @media(max-width:390px){
      #start.page{padding-left:8px!important;padding-right:8px!important}
      #start .exercise:not(.anton-superset):not(.anton-single){padding:13px 11px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .sethead.effort-head,
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row{
        grid-template-columns:24px minmax(54px,1.10fr) minmax(50px,.96fr) minmax(43px,.76fr) minmax(40px,.70fr) 34px!important;
        column-gap:4px!important
      }
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row input{min-height:42px!important;padding:7px 2px!important;font-size:14px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .setrow.effort-row .check{width:34px!important;min-width:34px!important;height:34px!important;min-height:34px!important}
      #start .exercise:not(.anton-superset):not(.anton-single) .set-wrap .prev-set{margin-left:28px!important;max-width:calc(100% - 28px)!important;font-size:10.5px!important}
    }
  `;
  document.head.appendChild(style);

  function compactClean(root=document){
    root.querySelectorAll?.('#start .exercise .chips.compact').forEach(chips=>{
      let rirSeen=false;
      const exact=new Set();
      [...chips.querySelectorAll('.chip')].forEach(chip=>{
        const text=String(chip.textContent||'').replace(/\s+/g,' ').trim();
        const key=text.toLowerCase();
        if(/^rir\b/i.test(text)){
          if(rirSeen){chip.remove();return}
          rirSeen=true;
        }
        if(key&&exact.has(key)){chip.remove();return}
        if(key)exact.add(key);
      });
    });
  }

  const start=document.getElementById('start');
  if(start){
    let queued=false;
    const run=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;compactClean(start)});
    };
    new MutationObserver(run).observe(start,{childList:true,subtree:true});
    run();
  }
})();
