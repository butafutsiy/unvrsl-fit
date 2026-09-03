'use strict';
(()=>{
  const W=window,D=document,REV=271;
  if(W.__unvrslBuiltInPlanRepUiV271)return;
  W.__unvrslBuiltInPlanRepUiV271=true;
  W.__unvrslBuiltInPlanRepUiV270=true;
  W.__unvrslBuiltInPlanRepUiV269=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const label=(lo,hi)=>lo===hi?String(lo):`${lo}–${hi}`;
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const allRoutines=()=>{try{return typeof ROUTINES!=='undefined'?ROUTINES:(W.UNVRSL_ROUTINES||[])}catch(_){return W.UNVRSL_ROUTINES||[]}};
  const routineFor=(w,c)=>{try{if(typeof rmap!=='undefined'&&rmap?.get){const r=rmap.get(`${w}-${c}`);if(r)return r}}catch(_){ }return allRoutines().find(r=>Number(r?.w)===Number(w)&&String(r?.c||'')===String(c||''))||null};
  const rangeOf=src=>{const lo=num(src?.rMin??src?.targetRepMin),hi=num(src?.rMax??src?.targetRepMax);return lo!=null&&hi!=null&&hi>=lo?[lo,hi]:null};
  const displayRange=src=>{const a=rangeOf(src);if(!a)return null;let[lo,hi]=a;if(src?.sd){lo/=2;hi/=2}return label(lo,hi)};
  const cleanName=n=>String(n||'').replace(/\s+—\s+.*$/,'').trim();

  function normalizeRoutineData(){
    for(const r of allRoutines())for(const src of r?.e||[]){
      if(src?.m||SPECIAL.test(String(src?.n||'')))continue;
      const rg=rangeOf(src);if(!rg)continue;
      const[lo]=rg;
      if(!Number.isFinite(Number(src.r)))src.r=lo;
      src.targetRepMin=rg[0];src.targetRepMax=rg[1]
    }
  }

  function matchesBuiltIn(s,r){
    if(!s||!r||s?.antonPlan)return false;
    const cur=(s.ex||[]).filter(e=>e?.mode!=='timer').map(e=>cleanName(e?.n));
    const src=(r.e||[]).filter(e=>!e?.m).map(e=>cleanName(e?.n));
    if(!cur.length||!src.length)return false;
    let hits=0;cur.forEach(n=>{if(src.includes(n))hits++});
    return hits>=Math.max(1,Math.ceil(Math.min(cur.length,src.length)*.6))
  }

  function hydrateCurrent(){
    const s=state()?.current;if(!s)return false;
    const r=routineFor(s.w,s.c);if(!matchesBuiltIn(s,r))return false;
    let changed=false,used=new Set();
    (r.e||[]).forEach((src,si)=>{
      if(src?.m||SPECIAL.test(String(src?.n||'')))return;
      const rg=rangeOf(src);if(!rg)return;
      let ei=s.ex?.findIndex((e,i)=>!used.has(i)&&cleanName(e?.n)===cleanName(src?.n));
      if(ei<0&&s.ex?.[si])ei=si;if(ei<0)return;used.add(ei);
      const ex=s.ex[ei],[lo,hi]=rg;ex.targetRepMin=lo;ex.targetRepMax=hi;
      (ex.set||[]).forEach(set=>{set.targetRepMin=lo;set.targetRepMax=hi;if(set.repManual==null)set.repManual=false;if(!Number.isFinite(Number(set.r)))set.r=lo});
      changed=true
    });
    if(changed){s.repRangeRevision=REV;try{W.save?.()}catch(_){try{save()}catch(__){}}}
    return changed
  }

  function installEditSet(){
    let base=W.editSet;try{if(typeof editSet==='function')base=editSet}catch(_){ }
    if(typeof base!=='function'||base.__bir271)return false;
    const wrapped=function(ei,si,k,v){
      if(k==='r'){
        const set=state()?.current?.ex?.[ei]?.set?.[si];
        if(set)set.repManual=true
      }
      return base.apply(this,arguments)
    };
    wrapped.__bir271=true;wrapped.__bir270=true;wrapped.__bir269=true;wrapped.__bir271Base=base;W.editSet=wrapped;try{editSet=wrapped}catch(_){ }return true
  }

  function previewRoot(){
    const sheet=D.getElementById('sheet');if(sheet&&sheet.offsetParent!==null)return sheet;
    const modal=D.getElementById('modal');if(modal&&modal.offsetParent!==null)return modal;
    return sheet||modal||D.body
  }

  function decoratePreview(r){
    if(!r)return;
    const root=previewRoot(),rows=[...root.querySelectorAll('.listline')];
    if(!rows.length)return;
    (r.e||[]).forEach((src,i)=>{
      const row=rows[i];if(!row||src?.m||SPECIAL.test(String(src?.n||'')))return;
      const shown=displayRange(src);if(!shown)return;
      const sub=row.querySelector('.muted.small,.muted');if(!sub)return;
      const count=src.s||1,txt=String(sub.textContent||'').trim();
      const next=txt.match(/^\d+\s*×\s*[^·]+/)?txt.replace(/^\d+\s*×\s*[^·]+/,`${count}×${shown}`):`${count}×${shown}${txt?` · ${txt}`:''}`;
      if(sub.textContent!==next)sub.textContent=next
    })
  }

  function installPreview(){
    let current=W.preview;try{if(typeof preview==='function')current=preview}catch(_){ }
    if(typeof current!=='function')return false;
    if(current.__bir271)return true;
    const base=current.__bir270Base||current.__bir269Base||current.__bir268Base||current;
    const wrapped=function(w,c){
      const r=routineFor(w,c),out=base.apply(this,arguments);
      if(r){requestAnimationFrame(()=>decoratePreview(r));setTimeout(()=>decoratePreview(r),60)}
      return out
    };
    wrapped.__bir271=true;wrapped.__bir270=true;wrapped.__bir269=true;wrapped.__bir268=true;wrapped.__bir271Base=base;wrapped.__bir268Base=base;
    W.preview=wrapped;try{preview=wrapped}catch(_){ }return true
  }

  function findRepInput(row){const inputs=[...row.querySelectorAll('input')];return inputs[1]||null}

  function bindRangeInput(input,set,lo,hi){
    if(!input||hi<=lo)return;
    const shown=label(lo,hi);input.dataset.bir271Range=shown;input.dataset.bir271Lo=String(lo);input.type='text';input.inputMode='numeric';
    if(!input.__bir271Bound){
      input.__bir271Bound=true;
      input.addEventListener('focus',()=>{const rg=input.dataset.bir271Range;if(rg&&input.value===rg){input.value=String(Number.isFinite(Number(set?.r))?set.r:input.dataset.bir271Lo||'');setTimeout(()=>input.select?.(),0)}});
      input.addEventListener('blur',()=>setTimeout(()=>{if(!set?.repManual&&!set?.ok&&input.dataset.bir271Range&&D.activeElement!==input)input.value=input.dataset.bir271Range},0))
    }
    if(!set?.repManual&&!set?.ok&&D.activeElement!==input&&input.value!==shown)input.value=shown
  }

  function decorateWorkout(){
    normalizeRoutineData();hydrateCurrent();installEditSet();installPreview();
    const s=state()?.current,r=routineFor(s?.w,s?.c);if(!matchesBuiltIn(s,r))return;
    const cards=[...D.querySelectorAll('#start .exercise')],used=new Set();
    cards.forEach(card=>{
      const title=cleanName(card.querySelector('.exname')?.textContent);if(!title||SPECIAL.test(title))return;
      let si=(r.e||[]).findIndex((src,i)=>!used.has(i)&&cleanName(src?.n)===title&&!!rangeOf(src));if(si<0)return;used.add(si);
      const src=r.e[si],rg=rangeOf(src);if(!rg)return;const[rawLo,rawHi]=rg;
      let lo=rawLo,hi=rawHi;if(src?.sd){lo/=2;hi/=2}if(hi<=lo)return;
      const shown=label(lo,hi);
      const ex=(s.ex||[]).find(e=>cleanName(e?.n)===title)||s.ex?.[si];
      let subtitle=[...card.querySelectorAll('.muted,.rest-label')].find(el=>el.children.length===0&&/^Рабочие подходы\b/i.test(String(el.textContent||'').trim()));
      if(subtitle){
        const t=String(subtitle.textContent||'').trim();
        const rest=t.match(/отдых\s+.*$/i)?.[0]||'';
        const next=`Рабочие подходы · ${shown} повт.${rest?` · ${rest}`:''}`;
        if(subtitle.textContent!==next)subtitle.textContent=next
      }else{
        let tag=card.querySelector('.bir271-target');if(!tag){tag=D.createElement('div');tag.className='bir271-target muted';tag.style.cssText='margin-top:4px;font-size:14px';card.querySelector('.exname')?.insertAdjacentElement('afterend',tag)}if(tag&&tag.textContent!==`Цель ${shown} повт.`)tag.textContent=`Цель ${shown} повт.`
      }
      const head=card.querySelector('.sethead');if(head){const col=head.children?.[2];if(col&&col.textContent!==`повт. ${shown}`)col.textContent=`повт. ${shown}`}
      [...card.querySelectorAll('.setrow')].forEach((row,ri)=>{const set=ex?.set?.[ri];if(!set)return;bindRangeInput(findRepInput(row),set,rawLo,rawHi)})
    })
  }

  function releaseStartupIfStuck(){
    if(W.__unvrslStartupComplete)return;
    const splash=D.getElementById('unvrsl-startup-v258');if(!splash)return;
    try{
      const gated=W.render,base=gated?.__unvrslBootRenderBaseV260;
      if(typeof base==='function')base.call(W);else if(typeof gated==='function')gated.call(W)
    }catch(e){console.warn('UNVRSL startup failsafe render',e)}
    D.documentElement?.classList.add('unvrsl-app-ready-v260');
    D.body?.classList.add('unvrsl-app-ready-v260');
    W.__unvrslStartupReleaseReasonV260='failsafe';
    splash.classList.add('out');
    setTimeout(()=>{splash.remove();D.getElementById('unvrsl-startup-v258-style')?.remove()},180)
  }

  let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;decorateWorkout()})};
  function install(){normalizeRoutineData();hydrateCurrent();installEditSet();installPreview();schedule()}
  install();[50,120,250,500,900,1600,2800].forEach(ms=>setTimeout(install,ms));
  setTimeout(releaseStartupIfStuck,3200);
  new MutationObserver(schedule).observe(D.documentElement,{subtree:true,childList:true});
  for(const ev of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready'])W.addEventListener?.(ev,install,{passive:true});
})();
