'use strict';
(()=>{
  const W=window,D=document,START=D.getElementById('start');
  if(!START||W.__unvrslWorkoutScrollGuardV598)return;
  W.__unvrslWorkoutScrollGuardV598=true;

  // Do not move the fixed navigation with visualViewport measurements.
  // On iOS its height/offset changes during toolbar animation and keyboard
  // transitions. The old v594 accumulating style.translate moved the bar
  // into the middle of the workout and competed with compositor scrolling.
  const nav=D.querySelector('body > .nav');
  if(nav)nav.style.removeProperty('translate');

  const workoutOpen=()=>START.classList.contains('active')&&!!W.st?.current;
  const scroller=()=>D.scrollingElement||D.documentElement;
  const scrollY=()=>Math.max(0,Number(W.scrollY??scroller()?.scrollTop??D.body?.scrollTop??0));
  let scrollRevision=0;
  W.addEventListener('scroll',()=>{scrollRevision++},{passive:true});

  function snapshot(){
    if(!workoutOpen()||!START.querySelector('.exercise'))return null;
    const cards=[...START.querySelectorAll('.exercise')];
    let cardIndex=-1,cardTop=0;
    for(let i=0;i<cards.length;i++){
      const rect=cards[i].getBoundingClientRect();
      if(rect.bottom>86&&rect.top<W.innerHeight-80){
        cardIndex=i;cardTop=rect.top;break;
      }
    }
    const active=D.activeElement;
    const inputs=[...START.querySelectorAll('input')];
    const inputIndex=active&&START.contains(active)?inputs.indexOf(active):-1;
    let selection=null;
    if(inputIndex>=0){
      try{selection=[active.selectionStart,active.selectionEnd]}catch(_){}
    }
    return {id:String(W.st.current.id||''),y:scrollY(),cardIndex,cardTop,inputIndex,selection};
  }
  function restore(snap){
    if(!snap||!workoutOpen()||String(W.st.current.id||'')!==snap.id)return;
    if(snap.inputIndex>=0&&(!D.activeElement||D.activeElement===D.body)){
      const fresh=START.querySelectorAll('input')[snap.inputIndex];
      if(fresh){
        try{fresh.focus({preventScroll:true})}catch(_){}
        try{if(snap.selection)fresh.setSelectionRange(...snap.selection)}catch(_){}
      }
    }
    let y=snap.y;
    if(snap.cardIndex>=0){
      const card=START.querySelectorAll('.exercise')[snap.cardIndex];
      if(card){
        const pos=card.getBoundingClientRect();
        y=Math.max(0,scrollY()+pos.top-snap.cardTop);
      }
    }
    if(Math.abs(scrollY()-y)>1){
      const root=scroller();
      if(root)root.scrollTop=y;
      try{W.scrollTo(0,y)}catch(_){}
    }
  }
  function install(){
    const base=W.startPage;
    if(typeof base!=='function'||base.__unvrslScrollGuardV598)return;
    const wrapped=function(){
      const snap=snapshot();
      try{return base.apply(this,arguments)}
      finally{
        if(snap){
          restore(snap);
          const revision=scrollRevision;
          W.requestAnimationFrame(()=>{
            // Do not yank the page back when the user began a new gesture.
            if(scrollRevision===revision)restore(snap);
          });
        }
      }
    };
    wrapped.__unvrslScrollGuardV598=true;
    W.startPage=wrapped;
    try{startPage=wrapped}catch(_){}
  }
  ['pageshow','unvrsl:modules-ready','unvrsl:cloud-modules-settled','unvrsl:deferred-modules-ready'].forEach(event=>{
    W.addEventListener(event,install,{passive:true});
  });
  install();
  [200,700,1600].forEach(ms=>setTimeout(install,ms));
})();
