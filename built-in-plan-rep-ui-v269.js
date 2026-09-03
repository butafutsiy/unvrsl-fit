'use strict';
(()=>{
  const W=window,D=document,REV=269;
  if(W.__unvrslBuiltInPlanRepUiV269)return;
  W.__unvrslBuiltInPlanRepUiV269=true;
  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const label=(lo,hi)=>lo===hi?String(lo):`${lo}–${hi}`;
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const allRoutines=()=>{try{return typeof ROUTINES!=='undefined'?ROUTINES:(W.UNVRSL_ROUTINES||[])}catch(_){return W.UNVRSL_ROUTINES||[]}};
  const routineFor=(w,c)=>{try{if(typeof rmap!=='undefined'&&rmap?.get){const r=rmap.get(`${w}-${c}`);if(r)return r}}catch(_){ }return allRoutines().find(r=>Number(r?.w)===Number(w)&&String(r?.c||'')===String(c||''))||null};
  const rangeOf=src=>{const lo=num(src?.rMin??src?.targetRepMin),hi=num(src?.rMax??src?.targetRepMax);return lo!=null&&hi!=null&&hi>=lo?[lo,hi]:null};
  const displayRange=src=>{const a=rangeOf(src);if(!a)return null;let[lo,hi]=a;if(src?.sd){lo/=2;hi/=2}return label(lo,hi)};

  function hydrateCurrent(){
    const s=state()?.current;if(!s||s.programId||s.planId||s.programName)return false;
    const r=routineFor(s.w,s.c);if(!r)return false;
    let found=false;
    (r.e||[]).forEach((src,ei)=>{
      if(src?.m||SPECIAL.test(String(src?.n||'')))return;
      const rg=rangeOf(src),ex=s.ex?.[ei];if(!rg||!ex)return;
      const[lo,hi]=rg;ex.targetRepMin=lo;ex.targetRepMax=hi;
      (ex.set||[]).forEach(set=>{set.targetRepMin=lo;set.targetRepMax=hi;if(set.repManual==null)set.repManual=false});found=true
    });
    if(found)s.repRangeRevision=REV;
    return found
  }

  function installEditSet(){
    let base=W.editSet;try{if(typeof editSet==='function')base=editSet}catch(_){ }
    if(typeof base!=='function'||base.__bir269)return false;
    const wrapped=function(ei,si,k,v){
      if(k==='r'){
        const set=state()?.current?.ex?.[ei]?.set?.[si];
        if(set)set.repManual=true
      }
      return base.apply(this,arguments)
    };
    wrapped.__bir269=true;wrapped.__bir269Base=base;W.editSet=wrapped;try{editSet=wrapped}catch(_){ }return true
  }

  function installPreview(){
    let current=W.preview;try{if(typeof preview==='function')current=preview}catch(_){ }
    if(typeof current!=='function')return false;
    if(current.__bir269)return true;
    const base=current.__bir268Base||current.__bir267Base||current;
    const wrapped=function(w,c){
      const r=routineFor(w,c);if(!r)return base.apply(this,arguments);
      const restore=[];
      try{
        (r.e||[]).forEach(src=>{
          if(src?.m||SPECIAL.test(String(src?.n||'')))return;
          const shown=displayRange(src);if(!shown)return;
          restore.push([src,src.r]);src.r=shown
        });
        return base.apply(this,arguments)
      }finally{restore.forEach(([src,old])=>{src.r=old})}
    };
    // v268 polls preview every 500 ms. Mark this as its final replacement so it
    // cannot wrap the preview again and recreate the oversized modal.
    wrapped.__bir269=true;wrapped.__bir268=true;wrapped.__bir268Base=base;
    W.preview=wrapped;try{preview=wrapped}catch(_){ }return true
  }

  function findRepInput(row){
    const inputs=[...row.querySelectorAll('input')];
    return inputs.find(i=>{const a=String(i.getAttribute('onchange')||'');return a.includes(",'r',")||a.includes(',\"r\",')})||inputs[1]||null
  }
  function bindRangeInput(input,set,lo,hi){
    if(!input||lo===hi)return;
    const shown=label(lo,hi);input.dataset.bir269Range=shown;input.dataset.bir269Lo=String(lo);input.type='text';input.inputMode='numeric';
    if(!input.__bir269Bound){
      input.__bir269Bound=true;
      input.addEventListener('focus',()=>{const rg=input.dataset.bir269Range;if(rg&&input.value===rg){input.value=String(state()?.current?.ex?.find(e=>(e.set||[]).includes(set))?.set?.find(x=>x===set)?.r||input.dataset.bir269Lo||'');setTimeout(()=>input.select?.(),0)}});
      input.addEventListener('blur',()=>setTimeout(()=>{if(!set.repManual&&!set.ok&&input.dataset.bir269Range&&D.activeElement!==input)input.value=input.dataset.bir269Range},0))
    }
    if(!set.repManual&&!set.ok&&D.activeElement!==input)input.value=shown
  }

  function decorateWorkout(){
    hydrateCurrent();installEditSet();installPreview();
    const s=state()?.current;if(!s?.ex?.length||Number(s.repRangeRevision)!==REV)return;
    const cards=[...D.querySelectorAll('#start .exercise')],used=new Set();
    cards.forEach(card=>{
      const title=String(card.querySelector('.exname')?.textContent||'').trim();if(!title||SPECIAL.test(title))return;
      const ei=s.ex.findIndex((e,i)=>!used.has(i)&&String(e?.n||'').trim()===title);if(ei<0)return;used.add(ei);
      const ex=s.ex[ei],lo=num(ex.targetRepMin??ex.set?.[0]?.targetRepMin),hi=num(ex.targetRepMax??ex.set?.[0]?.targetRepMax);if(lo==null||hi==null||hi<=lo)return;
      const shown=label(lo,hi);
      let subtitle=[...card.querySelectorAll('.muted,.rest-label')].find(el=>el.children.length===0&&/^Рабочие подходы\b/i.test(String(el.textContent||'').trim()));
      if(subtitle){
        const t=String(subtitle.textContent||'').trim(),rest=t.match(/отдых\s+.*$/i)?.[0]||'';
        const next=`Рабочие подходы · ${shown} повт.${rest?` · ${rest}`:''}`;if(subtitle.textContent!==next)subtitle.textContent=next
      }else{
        let tag=card.querySelector('.bir269-target');if(!tag){tag=D.createElement('div');tag.className='bir269-target muted';tag.style.cssText='margin-top:4px;font-size:14px';card.querySelector('.exname')?.insertAdjacentElement('afterend',tag)}if(tag&&tag.textContent!==`Цель ${shown} повт.`)tag.textContent=`Цель ${shown} повт.`
      }
      const head=card.querySelector('.sethead');if(head){const col=head.children?.[2];if(col&&col.textContent!==`повт. ${shown}`)col.textContent=`повт. ${shown}`}
      [...card.querySelectorAll('.setrow')].forEach((row,si)=>{const set=ex.set?.[si];if(!set)return;bindRangeInput(findRepInput(row),set,lo,hi)})
    })
  }

  let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;decorateWorkout()})};
  function install(){hydrateCurrent();installEditSet();installPreview();schedule()}
  install();[50,150,350,700,1400,2600].forEach(ms=>setTimeout(install,ms));
  new MutationObserver(schedule).observe(D.documentElement,{subtree:true,childList:true});
  for(const ev of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready'])W.addEventListener?.(ev,install,{passive:true});
})();
