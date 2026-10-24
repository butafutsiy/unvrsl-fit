'use strict';
(()=>{
 const W=window,D=document,app=D.querySelector('body>.app');
 if(!app||W.UNVRSLViewport)return;
 const root=D.documentElement,nav=D.querySelector('body>.nav'),timer=D.getElementById('timer');
 root.classList.add('unvrsl-docked-viewport');
 const scrollRoot=()=>app.clientHeight>0?app:W;
 W.unvrslScrollTop=()=>scrollRoot()===app?app.scrollTop:W.scrollY||0;
 W.unvrslScrollTo=(...args)=>scrollRoot().scrollTo(...args);
 W.unvrslScrollBy=(...args)=>scrollRoot().scrollBy(...args);
 let queued=false;
 function visible(element){
  if(!element)return false;
  const css=W.getComputedStyle(element),r=element.getBoundingClientRect();
  return css.display!=='none'&&css.visibility!=='hidden'&&Number(css.opacity)!==0&&r.width>0&&r.height>0;
 }
 function measure(){
  queued=false;
  const height=W.visualViewport?.height||W.innerHeight;
  root.style.setProperty('--app-viewport-height',height+'px');
  // A modal owns its own scroll pane; keep the underlying page stationary.
  if(D.getElementById('modal')?.classList.contains('show'))return;
  const controls=[nav,timer].filter(visible);
  if(visible(nav))controls.push(...[...nav.querySelectorAll('.ico')].filter(visible));
  const edge=controls.reduce((top,el)=>Math.min(top,el.getBoundingClientRect().top),height);
  root.style.setProperty('--app-dock-space',Math.max(0,Math.ceil(height-edge)+(controls.length?12:0))+'px');
 }
 function refresh(){if(!queued){queued=true;W.requestAnimationFrame(measure)}}
 W.UNVRSLViewport={scrollRoot,refresh};
 W.addEventListener('resize',refresh,{passive:true});
 W.visualViewport?.addEventListener('resize',refresh,{passive:true});
 D.addEventListener('focusin',refresh);D.addEventListener('focusout',refresh);
 for(const event of ['unvrsl:app-ready','unvrsl:modules-ready','unvrsl:cloud-modules-settled','unvrsl:deferred-modules-ready'])W.addEventListener(event,refresh);
 const observer=new MutationObserver(refresh);
 for(const element of [nav,timer,D.getElementById('modal')])if(element)observer.observe(element,{attributes:true,attributeFilter:['class','style'],childList:true,subtree:element===nav});
 observer.observe(D.body,{attributes:true,attributeFilter:['class']});
 if(typeof ResizeObserver==='function'){
  const sizes=new ResizeObserver(refresh);
  for(const element of [nav,timer,nav?.querySelector('.start .ico')])if(element)sizes.observe(element);
 }
 measure();
})();
