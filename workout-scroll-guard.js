'use strict';
(()=>{
  const W=window,D=document,START=D.getElementById('start');
  if(!START||W.__unvrslWorkoutScrollGuardV594)return;
  W.__unvrslWorkoutScrollGuardV594=true;
  let navOffset=0,navFrame=0;

  const workoutOpen=()=>START.classList.contains('active')&&!!W.st?.current;
  const scroller=()=>D.scrollingElement||D.documentElement;
  const scrollY=()=>Math.max(0,Number(W.scrollY||scroller()?.scrollTop||D.body?.scrollTop||0));
  const nav=()=>D.querySelector('body > .nav');
  const editing=()=>{
    const a=D.activeElement;
    return !!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  };
  const keyboardOpen=()=>{
    const v=W.visualViewport;
    return editing()&&!!v&&v.height<W.innerHeight*.78;
  };
  function clearNav(){
    const el=nav();
    if(el)el.style.removeProperty('translate');
    navOffset=0;
  }
  function alignNav(){
    navFrame=0;
    const el=nav();
    if(!el)return;
    if(!workoutOpen()){if(navOffset)clearNav();return}
    if(keyboardOpen()||editing()||D.getElementById('modal')?.classList.contains('show'))return;
    let css=W.getComputedStyle(el);
    if(css.display==='none'||css.visibility==='hidden')return;
    if(css.position!=='fixed'){
      el.style.setProperty('position','fixed','important');
      css=W.getComputedStyle(el);
    }
    const rect=el.getBoundingClientRect();
    if(!rect.height)return;
    const v=W.visualViewport;
    const visibleBottom=(v?v.offsetTop+v.height:W.innerHeight);
    const desiredBottom=visibleBottom-Math.max(0,parseFloat(css.bottom)||0);
    const delta=desiredBottom-rect.bottom;
    // Do not disturb healthy fixed bars for ordinary Safari toolbar changes.
    if(Math.abs(delta)<(navOffset?2:34))return;
    navOffset+=delta;
    if(Math.abs(navOffset)<2){clearNav();return}
    // 'translate' is independent of transform!important applied by the mobile theme.
    el.style.translate=`0px ${Math.round(navOffset*10)/10}px`;
  }
  function scheduleNav(){
    if(!navFrame)navFrame=W.requestAnimationFrame(alignNav);
  }

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
    scheduleNav();
  }

  function install(){
    const base=W.startPage;
    if(typeof base!=='function'||base.__unvrslScrollGuardV594)return;
    const wrapped=function(){
      const snap=snapshot();
      try{return base.apply(this,arguments)}
      finally{
        if(snap){
          restore(snap);
          W.requestAnimationFrame(()=>restore(snap));
        }
        scheduleNav();
      }
    };
    wrapped.__unvrslScrollGuardV594=true;
    W.startPage=wrapped;
    try{startPage=wrapped}catch(_){}
  }

  W.addEventListener('scroll',scheduleNav,{passive:true});
  D.addEventListener('scroll',scheduleNav,{capture:true,passive:true});
  ['resize','pageshow','orientationchange','unvrsl:modules-ready','unvrsl:cloud-modules-settled','unvrsl:deferred-modules-ready'].forEach(event=>{
    W.addEventListener(event,()=>{install();scheduleNav()},{passive:true});
  });
  W.visualViewport?.addEventListener('resize',scheduleNav,{passive:true});
  W.visualViewport?.addEventListener('scroll',scheduleNav,{passive:true});
  D.addEventListener('focusin',scheduleNav,{passive:true});
  D.addEventListener('focusout',scheduleNav,{passive:true});
  new MutationObserver(scheduleNav).observe(START,{attributes:true,attributeFilter:['class'],childList:true});
  install();scheduleNav();
  [200,700,1600,3200].forEach(ms=>setTimeout(()=>{install();scheduleNav()},ms));
})();