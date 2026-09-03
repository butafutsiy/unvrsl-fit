'use strict';
(()=>{
  const W=window,D=document,REV=266;
  if(W.__unvrslProgramRepRangeV266)return;
  W.__unvrslProgramRepRangeV266=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=v=>v==null?'–':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};

  function existingExercise(x){
    if(x?.existingIndex===null||x?.existingIndex===undefined)return null;
    return program(x.pid)?.weeks?.[Number(x.wi)]?.days?.[Number(x.di)]?.ex?.[Number(x.existingIndex)]||null
  }
  function pair(a,b,fallback=10){
    let x=N(a),y=N(b);if(x==null)x=fallback;if(y==null)y=x;
    x=clamp(Math.round(x),1,50);y=clamp(Math.round(y),1,50);
    return [Math.min(x,y),Math.max(x,y)]
  }
  function intensityFor(reps,rpe){
    const rir=Math.max(0,10-clamp(N(rpe)??8,1,10));
    return 100/(1+(Math.max(1,reps)+rir)/30)
  }
  function relationText(){
    const minEl=D.getElementById('pmReps'),maxEl=D.getElementById('pmRepsMax'),rpeEl=D.getElementById('pmRpe');
    const host=D.getElementById('wr264ExerciseRelation');if(!minEl||!host)return;
    const [lo,hi]=pair(minEl.value,maxEl?.value,minEl.value||10),rpe=clamp(N(rpeEl?.value)??8,1,10),rir=Math.max(0,10-rpe);
    const pLo=intensityFor(lo,rpe),pHi=intensityFor(hi,rpe),pctMin=Math.min(pLo,pHi),pctMax=Math.max(pLo,pHi);
    host.innerHTML=`RPE <b>${fmt(rpe)}</b> · RIR <b>${fmt(rir)}</b> · ${lo===hi?`${lo} повт.`:`${lo}–${hi} повт.`} ≈ <b>${fmt(pctMin)}–${fmt(pctMax)}%</b> e1RM`
  }
  function ensureStyle(){
    if(D.getElementById('program-rep-range-v266-style'))return;
    const s=D.createElement('style');s.id='program-rep-range-v266-style';s.textContent=`
      .pr266-range-note{margin:-2px 0 10px;color:#85858b;font-size:11px;line-height:1.35}
      #pmRepsMax{touch-action:manipulation}
    `;D.head?.appendChild(s)
  }
  function decorateForm(x){
    ensureStyle();const minEl=D.getElementById('pmReps');if(!minEl)return false;
    const e=existingExercise(x),first=e?.sets?.[0]||{},fallback=N(minEl.value)||10;
    const [lo,hi]=pair(e?.repMin??first?.rMin??first?.targetRepMin??first?.r,e?.repMax??first?.rMax??first?.targetRepMax??e?.repMin??first?.r,fallback);
    minEl.value=lo;
    const minField=minEl.closest('.field');if(minField){const label=minField.querySelector('label');if(label)label.textContent='Повторы от'}
    let maxEl=D.getElementById('pmRepsMax');
    if(!maxEl&&minField){
      const f=D.createElement('div');f.className='field pr266-max-field';f.innerHTML=`<label>Повторы до</label><input id="pmRepsMax" type="number" min="1" max="50" value="${hi}">`;
      minField.insertAdjacentElement('afterend',f);maxEl=f.querySelector('#pmRepsMax')
    }else if(maxEl)maxEl.value=hi;
    if(!D.querySelector('.pr266-range-note')&&maxEl?.closest('.field')){
      const n=D.createElement('div');n.className='pr266-range-note';n.textContent='Например 8–10. Для автовеса стартовая нагрузка рассчитывается по нижней границе, а диапазон сохраняется как цель подхода.';
      maxEl.closest('.field').insertAdjacentElement('afterend',n)
    }
    const onInput=()=>{const [a,b]=pair(minEl.value,maxEl?.value,minEl.value||10);if(N(minEl.value)!==a)minEl.value=a;if(maxEl&&N(maxEl.value)!==b)maxEl.value=b;relationText()};
    if(minEl.dataset.pr266Bound!=='1'){minEl.dataset.pr266Bound='1';minEl.addEventListener('input',()=>setTimeout(relationText,0),{passive:true});minEl.addEventListener('change',onInput)}
    if(maxEl&&maxEl.dataset.pr266Bound!=='1'){maxEl.dataset.pr266Bound='1';maxEl.addEventListener('input',()=>setTimeout(relationText,0),{passive:true});maxEl.addEventListener('change',onInput)}
    const rpe=D.getElementById('pmRpe');if(rpe&&rpe.dataset.pr266Bound!=='1'){rpe.dataset.pr266Bound='1';rpe.addEventListener('input',()=>setTimeout(relationText,0),{passive:true})}
    relationText();return true
  }

  function patchExerciseForm(){
    let cur=null;try{cur=typeof programExerciseForm==='function'?programExerciseForm:W.programExerciseForm}catch(_){cur=W.programExerciseForm}
    if(typeof cur!=='function'||cur.__pr266)return false;
    const wrapped=function(x){const r=cur.apply(this,arguments);setTimeout(()=>decorateForm(x),0);return r};wrapped.__pr266=true;wrapped.__pr266Base=cur;
    W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){ }return true
  }
  function patchSaveExercise(){
    let cur=null;try{cur=typeof saveProgramExercise==='function'?saveProgramExercise:W.saveProgramExercise}catch(_){cur=W.saveProgramExercise}
    if(typeof cur!=='function'||cur.__pr266)return false;
    const wrapped=function(pid,wi,di,nameToken,sourceId,bp,tg,eq,existingIndex){
      const minEl=D.getElementById('pmReps'),maxEl=D.getElementById('pmRepsMax');
      const [lo,hi]=pair(minEl?.value,maxEl?.value,minEl?.value||10);if(minEl)minEl.value=lo;
      const method=String(D.getElementById('pmMethod')?.value||'STANDARD');
      const r=cur.apply(this,arguments);
      const p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)];if(!d)return r;
      const idx=existingIndex===null||existingIndex===undefined||Number.isNaN(Number(existingIndex))?d.ex.length-1:Number(existingIndex),ex=d.ex?.[idx];if(!ex)return r;
      ex.repMin=lo;ex.repMax=hi;ex.repRange=lo===hi?String(lo):`${lo}-${hi}`;ex.repRangeRevision=REV;
      (ex.sets||[]).forEach(set=>{
        const current=Math.max(1,N(set?.r)||lo);
        if(method==='STANDARD'){set.r=lo;set.rMin=lo;set.rMax=hi}
        else{
          const ratio=lo>0?current/lo:1;
          set.rMin=current;set.rMax=Math.max(current,Math.round(hi*ratio))
        }
        set.targetRepMin=set.rMin;set.targetRepMax=set.rMax
      });
      p.updated=Date.now();saveState();
      try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){ }
      return r
    };wrapped.__pr266=true;wrapped.__pr266Base=cur;W.saveProgramExercise=wrapped;try{saveProgramExercise=wrapped}catch(_){ }return true
  }
  function patchPrescription(){
    let cur=null;try{cur=typeof prescriptionText==='function'?prescriptionText:W.prescriptionText}catch(_){cur=W.prescriptionText}
    if(typeof cur!=='function'||cur.__pr266)return false;
    const wrapped=function(e){
      if(e?.method==='STANDARD'){
        const s=e.sets||[],first=s[0]||{},[lo,hi]=pair(e.repMin??first.rMin??first.r,e.repMax??first.rMax??e.repMin??first.r,first.r||10);
        if(s.length)return `${s.length}×${lo===hi?lo:`${lo}–${hi}`} · ${first.w||0} кг · RPE ${e.rpe||8}`
      }
      return cur.apply(this,arguments)
    };wrapped.__pr266=true;wrapped.__pr266Base=cur;W.prescriptionText=wrapped;try{prescriptionText=wrapped}catch(_){ }return true
  }
  function patchBeginProgramDay(){
    let cur=null;try{cur=typeof beginProgramDay==='function'?beginProgramDay:W.beginProgramDay}catch(_){cur=W.beginProgramDay}
    if(typeof cur!=='function'||cur.__pr266)return false;
    const wrapped=function(pid,wi,di){
      const p=program(pid),blocks=p?.weeks?.[Number(wi)]?.days?.[Number(di)]?.ex||[];
      const r=cur.apply(this,arguments),s=state(),current=s?.current;if(!current||String(current.programId)!==String(pid))return r;
      let cursor=0;
      blocks.forEach(block=>{
        const sourceSets=block.sets||[];
        if(block.method==='STANDARD'||block.method==='FST-7'){
          const ex=current.ex?.[cursor++];if(!ex)return;
          (ex.set||[]).forEach((set,i)=>{const src=sourceSets[i]||sourceSets[0]||{};const lo=N(src.rMin??src.targetRepMin??block.repMin??src.r),hi=N(src.rMax??src.targetRepMax??block.repMax??src.r);if(lo!=null)set.targetRepMin=lo;if(hi!=null)set.targetRepMax=hi})
        }else{
          sourceSets.forEach(src=>{const ex=current.ex?.[cursor++],set=ex?.set?.[0];if(!set)return;const lo=N(src.rMin??src.targetRepMin??src.r),hi=N(src.rMax??src.targetRepMax??src.r);if(lo!=null)set.targetRepMin=lo;if(hi!=null)set.targetRepMax=hi})
        }
      });
      current.repRangeRevision=REV;saveState();
      return r
    };wrapped.__pr266=true;wrapped.__pr266Base=cur;W.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(_){ }return true
  }
  function decorateCurrentForm(){
    const min=D.getElementById('pmReps');if(!min)return;
    if(!D.getElementById('pmRepsMax')){
      const u=(()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}})();
      if(!u?.pid)return;const p=program(u.pid),d=p?.weeks?.[Number(u.week)]?.days?.[Number(u.day)],name=D.querySelector('#sheet h2')?.textContent?.trim(),idx=d?.ex?.findIndex(e=>String(e.n).trim()===String(name).trim());
      decorateForm({pid:u.pid,wi:u.week,di:u.day,n:name,existingIndex:idx>=0?idx:null})
    }else relationText()
  }
  function install(){patchExerciseForm();patchSaveExercise();patchPrescription();patchBeginProgramDay();decorateCurrentForm()}
  let q=false;function queue(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;install()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(queue):null;mo?.observe(D.documentElement,{childList:true,subtree:true});
  for(const e of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:training-engine-ready'])W.addEventListener?.(e,queue,{passive:true});
  [0,100,300,700,1400,2600].forEach(ms=>setTimeout(queue,ms));setInterval(install,1200)
})();
