'use strict';
(()=>{
  const W=window,D=document,VERSION=316,READY='unvrsl-shell-ready-v316';
  if(W.__unvrslUiStabilityV316)return;
  W.__unvrslUiStabilityV316=true;
  W.__unvrslUiStabilityV313=true;

  const oldCoverSelector=[
    '#unvrsl-stability-v313',
    '#unvrsl-startup-splash',
    '#unvrsl-startup-splash-v156',
    '#unvrsl-startup-splash-final',
    '#unvrsl-startup-v256',
    '#unvrslBoot',
    '#unvrsl-boot-cover'
  ].join(',');
  const oldStyleIds=[
    'unvrsl-ui-stability-v313-style',
    'unvrsl-startup-splash-style',
    'unvrsl-startup-splash-v156-style',
    'unvrsl-startup-splash-final-style',
    'unvrsl-startup-v256-style',
    'unvrsl-boot-style',
    'unvrsl-boot-cover-style'
  ];
  D.querySelectorAll(oldCoverSelector).forEach(el=>el.remove());
  oldStyleIds.forEach(id=>D.getElementById(id)?.remove());

  const style=D.createElement('style');
  style.id='unvrsl-ui-stability-v316-style';
  style.textContent=`
    html:not(.${READY}),body:not(.${READY}){overflow:hidden!important;overscroll-behavior:none!important}
    html:not(.${READY}) .app,
    html:not(.${READY}) body>.nav,
    html:not(.${READY}) body>.timer,
    html:not(.${READY}) body>.modal,
    html:not(.${READY}) body>.toast{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    html.${READY}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important}
    body.${READY}{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch}
    body.${READY}.unvrsl-modal-open{overflow:hidden!important;overscroll-behavior:none!important}
    html.${READY} .app,html.${READY} body>.nav{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
    .page:not(.active){display:none!important;visibility:hidden!important;pointer-events:none!important}
    .page.active{display:block!important;visibility:visible!important;pointer-events:auto!important;overflow:visible!important;touch-action:auto!important}
    .modal:not(.show),.toast:not(.show),.timer:not(.show){display:none!important;visibility:hidden!important;pointer-events:none!important}
    .modal.show{display:flex!important;visibility:visible!important;pointer-events:auto!important}
    .sheet{overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch;touch-action:pan-y}
    html.${READY} .nav{z-index:2000!important;touch-action:manipulation!important}
    html.${READY} .nav button,
    html.${READY} button,
    html.${READY} [onclick],
    html.${READY} input,
    html.${READY} select,
    html.${READY} textarea,
    html.${READY} a{pointer-events:auto;touch-action:manipulation}
    html.${READY} .weekbar,
    html.${READY} [data-horizontal-scroll]{touch-action:pan-x!important;-webkit-overflow-scrolling:touch}
  `;
  D.head.appendChild(style);

  function clearInlineScrollLock(node){
    if(!node?.style)return;
    if(['hidden','clip'].includes(node.style.overflow))node.style.removeProperty('overflow');
    if(['hidden','clip'].includes(node.style.overflowY))node.style.removeProperty('overflow-y');
    if(node.style.touchAction==='none')node.style.removeProperty('touch-action');
    if(node.style.position==='fixed'){
      node.style.removeProperty('position');
      node.style.removeProperty('top');
      node.style.removeProperty('left');
      node.style.removeProperty('right');
      node.style.removeProperty('width')
    }
  }
  function prepare(){
    D.querySelectorAll(oldCoverSelector).forEach(el=>el.remove());
    const modal=D.getElementById('modal'),sheet=D.getElementById('sheet'),open=!!modal?.classList.contains('show');
    D.body?.classList.toggle('unvrsl-modal-open',open);
    if(!open){
      clearInlineScrollLock(D.documentElement);
      clearInlineScrollLock(D.body);
      if(modal){
        modal.style.removeProperty('pointer-events');
        modal.style.removeProperty('background')
      }
      if(sheet){
        sheet.style.removeProperty('transform');
        sheet.classList.remove('sheet-dragging','sheet-snapping')
      }
    }
    return true
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;prepare()})
  }
  W.unvrslUiStabilityPrepareV316=prepare;
  W.unvrslUiStabilityPrepareV313=prepare;
  const modal=D.getElementById('modal');
  if(modal)new MutationObserver(schedule).observe(modal,{attributes:true,attributeFilter:['class']});
  if(D.body)new MutationObserver(schedule).observe(D.body,{childList:true,subtree:false});
  ['pageshow','unvrsl:modules-ready','unvrsl:cloud-modules-settled','unvrsl:client-ready','unvrsl:client-settled','unvrsl:app-ready'].forEach(name=>W.addEventListener?.(name,schedule,{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)schedule()},{passive:true});
  D.addEventListener?.('click',()=>setTimeout(schedule,0),true);
  prepare();
  W.dispatchEvent?.(new CustomEvent('unvrsl:ui-stability-ready',{detail:{release:VERSION}}));
})();
