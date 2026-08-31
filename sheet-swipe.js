'use strict';
(()=>{
  if(window.__unvrslSheetSwipe)return;window.__unvrslSheetSwipe=true;
  const modal=document.getElementById('modal'),sheet=document.getElementById('sheet');
  if(!modal||!sheet)return;

  const style=document.createElement('style');
  style.id='unvrsl-sheet-swipe-style';
  style.textContent=`
    .sheet{overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;transform:translate3d(0,0,0)}
    .sheet.sheet-dragging{transition:none!important;will-change:transform;user-select:none;-webkit-user-select:none}
    .sheet.sheet-snapping{transition:transform .24s cubic-bezier(.2,.8,.2,1)!important;will-change:transform}
    .sheet-grabber{touch-action:none;cursor:grab;position:relative;z-index:2}
    .sheet-grabber:before{content:'';position:absolute;left:-28px;right:-28px;top:-22px;bottom:-22px}
  `;
  document.head.appendChild(style);

  let active=false,startY=0,startX=0,lastY=0,lastT=0,dy=0,velocity=0,dragging=false,verticalIntent=false;
  const interactive='input,textarea,select,button,a,[contenteditable="true"],label';
  const now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();

  function clearClasses(){sheet.classList.remove('sheet-dragging','sheet-snapping')}
  function resetVisual(){
    sheet.classList.remove('sheet-dragging');
    sheet.classList.add('sheet-snapping');
    sheet.style.transform='translate3d(0,0,0)';
    modal.style.background='';
    setTimeout(()=>sheet.classList.remove('sheet-snapping'),260);
  }
  function finishClose(){
    clearClasses();
    sheet.style.transform='';modal.style.background='';
    active=false;dragging=false;verticalIntent=false;dy=0;velocity=0;
    if(typeof window.closeModal==='function')window.closeModal();
    else modal.classList.remove('show');
  }
  function closeAnimated(){
    const h=Math.max(sheet.getBoundingClientRect().height,window.innerHeight*.45);
    sheet.classList.remove('sheet-dragging');sheet.classList.add('sheet-snapping');
    sheet.style.transform=`translate3d(0,${h+60}px,0)`;
    modal.style.background='rgba(0,0,0,0)';
    setTimeout(finishClose,210);
  }
  function inDragZone(target,y){
    const rect=sheet.getBoundingClientRect(),localY=y-rect.top;
    return !!target.closest?.('.sheet-grabber')||localY<=132;
  }
  function canStart(target,y){
    if(!modal.classList.contains('show'))return false;
    if(sheet.scrollTop>1)return false;
    if(target.closest?.(interactive))return false;
    return inDragZone(target,y);
  }
  function begin(x,y,target){
    if(!canStart(target,y))return;
    active=true;dragging=false;verticalIntent=false;startX=x;startY=lastY=y;lastT=now();dy=0;velocity=0;
  }
  function move(x,y,e){
    if(!active)return;
    const totalY=y-startY,totalX=x-startX;
    if(!verticalIntent){
      if(Math.abs(totalY)<5&&Math.abs(totalX)<5)return;
      if(Math.abs(totalX)>Math.abs(totalY)){active=false;return}
      verticalIntent=true;
    }
    if(totalY<=0){dy=0;return}
    if(sheet.scrollTop>1){active=false;dragging=false;return}

    const t=now(),step=y-lastY,dt=Math.max(1,t-lastT);
    velocity=step/dt;lastY=y;lastT=t;dy=totalY;
    if(!dragging&&dy>5){dragging=true;sheet.classList.add('sheet-dragging');sheet.classList.remove('sheet-snapping')}
    if(!dragging)return;

    e?.preventDefault?.();
    const resistance=dy>340?340+(dy-340)*.28:dy;
    sheet.style.transform=`translate3d(0,${resistance}px,0)`;
    const progress=Math.min(1,resistance/Math.max(420,window.innerHeight*.55));
    const fade=Math.max(.08,.72*(1-progress));
    modal.style.background=`rgba(0,0,0,${fade})`;
  }
  function end(){
    if(!active&&!dragging)return;
    const threshold=Math.min(155,Math.max(92,sheet.getBoundingClientRect().height*.16));
    const shouldClose=dragging&&(dy>threshold||(dy>42&&velocity>.62));
    active=false;verticalIntent=false;
    if(shouldClose)closeAnimated();else if(dragging)resetVisual();
    dragging=false;dy=0;velocity=0;
  }

  sheet.addEventListener('touchstart',e=>{if(e.touches.length===1){const t=e.touches[0];begin(t.clientX,t.clientY,e.target)}},{passive:true});
  sheet.addEventListener('touchmove',e=>{if(e.touches.length===1){const t=e.touches[0];move(t.clientX,t.clientY,e)}},{passive:false});
  sheet.addEventListener('touchend',end,{passive:true});
  sheet.addEventListener('touchcancel',end,{passive:true});

  // Pointer fallback for desktop/iPad testing.
  sheet.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;begin(e.clientX,e.clientY,e.target)});
  window.addEventListener('pointermove',e=>{if(active&&e.pointerType!=='touch')move(e.clientX,e.clientY,e)},{passive:false});
  window.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')end()});

  const baseClose=window.closeModal;
  if(typeof baseClose==='function'){
    window.closeModal=function(){sheet.style.transform='';modal.style.background='';clearClasses();active=false;dragging=false;verticalIntent=false;return baseClose.apply(this,arguments)};
    try{closeModal=window.closeModal}catch(e){}
  }
})();
