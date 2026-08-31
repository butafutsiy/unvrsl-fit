'use strict';
(()=>{
  if(window.__unvrslSheetSwipe)return;window.__unvrslSheetSwipe=true;
  const modal=document.getElementById('modal'),sheet=document.getElementById('sheet');
  if(!modal||!sheet)return;

  const style=document.createElement('style');
  style.id='unvrsl-sheet-swipe-style';
  style.textContent=`
    .sheet{overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}
    .sheet.sheet-dragging{transition:none!important;will-change:transform}
    .sheet.sheet-snapping{transition:transform .22s cubic-bezier(.2,.8,.2,1)!important;will-change:transform}
    .sheet-grabber{touch-action:none;cursor:grab}
  `;
  document.head.appendChild(style);

  let active=false,startY=0,lastY=0,lastT=0,dy=0,velocity=0,dragging=false;
  const interactive='input,textarea,select,button,a,[contenteditable="true"]';

  function resetVisual(){
    sheet.classList.remove('sheet-dragging');
    sheet.classList.add('sheet-snapping');
    sheet.style.transform='translateY(0)';
    modal.style.background='';
    setTimeout(()=>sheet.classList.remove('sheet-snapping'),240);
  }
  function finishClose(){
    sheet.classList.remove('sheet-dragging','sheet-snapping');
    sheet.style.transform='';modal.style.background='';
    if(typeof window.closeModal==='function')window.closeModal();
    else modal.classList.remove('show');
  }
  function closeAnimated(){
    const h=Math.max(sheet.getBoundingClientRect().height,window.innerHeight*.45);
    sheet.classList.remove('sheet-dragging');sheet.classList.add('sheet-snapping');
    sheet.style.transform=`translateY(${h+40}px)`;
    modal.style.background='rgba(0,0,0,0)';
    setTimeout(finishClose,190);
  }
  function canStart(target,y){
    if(!modal.classList.contains('show'))return false;
    if(sheet.scrollTop>1)return false;
    const onGrabber=!!target.closest?.('.sheet-grabber');
    if(!onGrabber||target.closest?.(interactive))return false;
    return true;
  }
  function begin(y,target){
    if(!canStart(target,y))return;
    active=true;dragging=false;startY=lastY=y;lastT=performance.now();dy=0;velocity=0;
  }
  function move(y,e){
    if(!active)return;
    const now=performance.now(),next=y-startY,step=y-lastY,dt=Math.max(1,now-lastT);
    velocity=step/dt;lastY=y;lastT=now;
    if(next<=0){dy=0;return}
    if(sheet.scrollTop>1){active=false;return}
    dy=next;
    if(!dragging&&dy>6){dragging=true;sheet.classList.add('sheet-dragging');sheet.classList.remove('sheet-snapping')}
    if(!dragging)return;
    e?.preventDefault?.();
    const resistance=dy>260?260+(dy-260)*.35:dy;
    sheet.style.transform=`translateY(${resistance}px)`;
    const fade=Math.max(.12,.72*(1-Math.min(resistance/520,.82)));
    modal.style.background=`rgba(0,0,0,${fade})`;
  }
  function end(){
    if(!active&&!dragging)return;
    const shouldClose=dragging&&(dy>105||(dy>45&&velocity>.55));
    active=false;
    if(shouldClose)closeAnimated();else if(dragging)resetVisual();
    dragging=false;dy=0;velocity=0;
  }

  sheet.addEventListener('touchstart',e=>{if(e.touches.length===1)begin(e.touches[0].clientY,e.target)},{passive:true});
  sheet.addEventListener('touchmove',e=>{if(e.touches.length===1)move(e.touches[0].clientY,e)},{passive:false});
  sheet.addEventListener('touchend',end,{passive:true});
  sheet.addEventListener('touchcancel',end,{passive:true});

  // Pointer fallback for desktop/iPad trackpad testing.
  sheet.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;begin(e.clientY,e.target)});
  window.addEventListener('pointermove',e=>{if(active&&e.pointerType!=='touch')move(e.clientY,e)},{passive:false});
  window.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')end()});

  // Tapping the visible grabber also gives a quick way out on devices where a drag is interrupted.
  sheet.addEventListener('dblclick',e=>{if(e.target.closest?.('.sheet-grabber'))closeAnimated()});

  const baseClose=window.closeModal;
  if(typeof baseClose==='function'){
    window.closeModal=function(){sheet.style.transform='';modal.style.background='';sheet.classList.remove('sheet-dragging','sheet-snapping');return baseClose.apply(this,arguments)};
    try{closeModal=window.closeModal}catch(e){}
  }
})();
