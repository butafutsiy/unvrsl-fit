'use strict';
(()=>{
  // v567 keeps the established workout layout. Only polish existing surfaces.
  if(window.__unvrslWorkoutUiV567)return;
  window.__unvrslWorkoutUiV567=true;
  const s=document.createElement('style');
  s.id='unvrsl-workout-ui-v567';
  s.textContent=`
    /* Cardio's main element must inherit the exact same canvas as strength focus.
       A legacy white main/surface rule otherwise paints a full-height rectangle. */
    html[data-theme="light"] body #workout-focus[data-cardio=true],
    html[data-theme="light"] body #workout-focus[data-cardio=true] .wf-shell{
      background-color:var(--bg)!important;
      background-image:none!important;
    }
    html[data-theme="light"] body #workout-focus[data-cardio=true] main.wf-cardio-screen{
      background:transparent!important;
      background-color:transparent!important;
      background-image:none!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    /* Keep the timer and collapsible metrics as genuine raised cards. */
        /* Clean up the focus screen without changing its element order or behaviour. */
    #workout-focus{font-variant-numeric:tabular-nums}
    #workout-focus .wf-close{display:grid;place-items:center;min-width:44px;width:44px;height:44px;border-radius:14px;background:var(--panel2);border:1px solid var(--line)}
    #workout-focus[data-cardio=true] .wf-cardio-screen{gap:12px!important;padding:8px 0 14px!important}
    #workout-focus[data-cardio=true] .wf-cardio-heading h2{font-size:clamp(27px,7vw,34px)!important;margin:8px 0 6px!important}
    #workout-focus[data-cardio=true] .wf-cardio-clock-card{display:block;background:var(--panel)!important;border:1px solid var(--line)!important;border-radius:22px!important;padding:18px 17px!important;margin:0!important;box-shadow:none!important}
    #workout-focus[data-cardio=true] .wf-cardio-countdown{font-size:clamp(59px,16vw,75px)!important;line-height:1.08!important;padding:12px 0 0!important;letter-spacing:-.06em!important}
    #workout-focus[data-cardio=true] .wf-cardio-caption{margin:4px 0 14px!important;font-size:11px!important;letter-spacing:0!important}
    #workout-focus[data-cardio=true] .wf-cardio-controls{margin-top:14px!important;grid-template-columns:minmax(0,1fr) minmax(91px,.48fr)!important;gap:8px!important}
    #workout-focus[data-cardio=true] .wf-cardio-controls button{min-height:46px!important;border-radius:13px!important;font-size:13px!important}
    #workout-focus[data-cardio=true] .wf-cardio-main-btn{background:var(--action)!important;color:var(--action-text)!important;font-weight:800!important}
    #workout-focus[data-cardio=true] .wf-cardio-reset{border:1px solid var(--line)!important;background:var(--panel2)!important;color:var(--text)!important}
    #workout-focus[data-cardio=true] .wf-cardio-more{border:1px solid var(--line)!important;border-radius:15px!important;padding:0 13px 12px!important;background:var(--panel)!important}
    #workout-focus[data-cardio=true] .wf-cardio-more:not([open]){padding-bottom:0!important}
    #workout-focus[data-cardio=true] .wf-cardio-more>summary{min-height:48px!important;padding:0!important;font-size:12px!important}
    #workout-focus[data-cardio=true] .wf-cardio-more>summary span{font-size:10px!important;color:var(--muted)!important;max-width:59%!important}
    #workout-focus[data-cardio=true] .wf-cardio-plan-label{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;padding:7px 0 0}
    #workout-focus[data-cardio=true] .wf-cardio-more .wf-cardio-metrics{display:flex!important;flex-wrap:wrap!important;gap:7px 15px!important;padding:10px 0!important;margin:0 0 9px!important;border:0!important;border-bottom:1px solid var(--line)!important;background:transparent!important}
    #workout-focus[data-cardio=true] .wf-cardio-more .wf-cardio-metrics>div{display:inline-flex!important;align-items:baseline!important;gap:5px!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
    #workout-focus[data-cardio=true] .wf-cardio-more .wf-cardio-metrics small{display:inline!important;margin:0!important;font-size:10px!important}
    #workout-focus[data-cardio=true] .wf-cardio-more .wf-cardio-metrics b{display:inline!important;font-size:12px!important}
    #workout-focus[data-cardio=true] .wf-cardio-save{min-height:49px!important;border-radius:14px!important;margin-top:11px!important}
    #workout-focus[data-cardio=true] .wf-cardio-links{justify-content:space-between!important}
    /* Preserve the familiar strength focus cards and full-width record button. */
    #workout-focus[data-compact=true] .wf-current h2{letter-spacing:-.035em;line-height:1.16!important}
    #workout-focus[data-compact=true] .wf-stage>.wf-load{border-radius:19px!important}
    #workout-focus[data-compact=true] .wf-rir button[aria-pressed=true]{background:var(--action)!important;color:var(--action-text)!important}
    #workout-focus[data-compact=true] .wf-toolbar button{border-radius:14px!important}
    /* Normal training: the existing cardio card owns its timer and the extra facts. */
    #start .cardio-compact-ex{min-width:0!important;overflow:hidden!important}
    #start .cardio-compact-ex .cardio-compact-body{gap:10px!important}
    #start .cardio-compact-ex .uw-cardio-brief{background:transparent!important;box-shadow:none!important}
    @media(max-width:365px){
      #workout-focus[data-cardio=true] .wf-cardio-countdown{font-size:58px!important}
      #workout-focus[data-cardio=true] .wf-cardio-clock-card{padding:14px!important}
      #workout-focus[data-cardio=true] .wf-cardio-controls{grid-template-columns:minmax(0,1fr) 89px!important}
      #workout-focus[data-cardio=true] .wf-cardio-controls button{font-size:12px!important}
    }
    @media(prefers-reduced-motion:reduce){#workout-focus .wf-cardio-track i{transition:none!important}}
  `;
  document.head.appendChild(s);
})();
