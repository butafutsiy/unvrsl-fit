'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslRepRangeStatePlaceholderV286)return;
  W.__unvrslRepRangeStatePlaceholderV286=true;

  const baseName=n=>String(n||'').split(' — ')[0].split('#')[0].trim();
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const routines=()=>W.UNVRSL_ROUTINES||[];
  const manualRep=set=>!!(set?.ok||set?.manualFields?.r||set?.__repManualV272||set?.__repManualV283||set?.__repGhostManualV284);
  const sameNumber=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<0.0001;

  function sourceRoutine(s){
    return routines().find(r=>Number(r?.w)===Number(s?.w)&&String(r?.c)===String(s?.c))||null;
  }

  function syncGhostState(){
    const root=D.getElementById('start'),s=state()?.current;
    if(!root||!s?.ex)return;
    const routine=sourceRoutine(s);
    let changed=false;

    root.querySelectorAll('input[data-rep-ghost-final-v285="1"]').forEach(inp=>{
      const row=inp.closest('.setrow'),card=inp.closest('.exercise');
      if(!row||!card)return;
      const name=baseName(card.querySelector('.exname')?.textContent);
      if(!name)return;

      const ex=(s.ex||[]).find(e=>baseName(e?.n)===name);
      if(!ex)return;
      const rows=[...card.querySelectorAll('.setrow')],si=rows.indexOf(row);
      const set=ex.set?.[si];
      if(!set||manualRep(set))return;

      const label=String(inp.placeholder||'').trim();
      if(!label||!/[–-]/.test(label))return;
      const lo=Number(label.split(/[–-]/)[0]);
      const src=(routine?.e||[]).find(e=>baseName(e?.n)===name);
      const rawPlan=src?.sd?Number(src?.r)/2:Number(src?.r);
      const current=set.r;
      const isPlanValue=current===''||current==null||Number(current)===0||sameNumber(current,lo)||sameNumber(current,rawPlan);
      if(!isPlanValue)return;

      if(current!==''){
        set.r='';
        changed=true;
      }
      inp.value='';
      inp.classList.add('unvrsl-rep-ghost-v285');
    });

    if(changed){
      s.repRangeInputMode='ghost-v286';
      try{if(typeof save==='function')save();else W.save?.()}catch(_){ }
    }
  }

  const root=D.getElementById('start');
  if(root){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;syncGhostState()});
    }).observe(root,{childList:true,subtree:true});
  }

  syncGhostState();
  [0,50,150,350,700,1200].forEach(ms=>setTimeout(syncGhostState,ms));
})();
