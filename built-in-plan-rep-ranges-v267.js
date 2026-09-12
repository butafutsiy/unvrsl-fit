'use strict';
(()=>{
  const W=window,D=document;
  W.__unvrslBuiltInPlanRepRangesV267=true;
  W.__unvrslBuiltInPlanRepRangesAppliedV267=false;
  if(W.__unvrslProgramRepClarityV370)return;
  W.__unvrslProgramRepClarityV370=true;
  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
  function sync(changed=false){
    const m=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();
    const lo=D.getElementById('pmReps'),hi=D.getElementById('pmRepsMax');
    if(!lo)return;
    const lf=lo.closest('.field'),hf=hi?.closest('.field'),note=D.querySelector('#sheet .pr266-range-note');
    const own=m==='UNVRSL'||m==='SLDR';
    if(lf)lf.style.display=own?'none':'';
    if(hf)hf.style.display=own?'none':'';
    if(note)note.style.display=own?'none':'';
    if(own)return;
    if(lf?.querySelector('label'))lf.querySelector('label').textContent='Мин. повторов';
    if(hf?.querySelector('label'))hf.querySelector('label').textContent='Макс. повторов';
    if(m==='FST-7'&&hi){
      const a=num(lo.value),b=num(hi.value);
      if(changed||a==null||b==null||a>b){lo.value='12';hi.value='15'}
      const r=D.getElementById('wr264ExerciseRelation');
      if(r)r.textContent='FST-7: 7 подходов по 12–15 повторений. Схема метода важнее общего диапазона недели.';
    }
  }
  function install(){
    let f=W.programExerciseForm;try{if(typeof programExerciseForm==='function')f=programExerciseForm}catch(_){ }
    if(typeof f==='function'&&!f.__repClarity370){
      const base=f,w=function(){const out=base.apply(this,arguments);setTimeout(()=>sync(false),0);return out};
      w.__repClarity370=true;W.programExerciseForm=w;try{programExerciseForm=w}catch(_){ }
    }
    let d=W.programMethodDefaults;try{if(typeof programMethodDefaults==='function')d=programMethodDefaults}catch(_){ }
    if(typeof d==='function'&&!d.__repClarity370){
      const base=d,w=function(){const out=base.apply(this,arguments);setTimeout(()=>sync(true),0);return out};
      w.__repClarity370=true;W.programMethodDefaults=w;try{programMethodDefaults=w}catch(_){ }
    }
    sync(false)
  }
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready'].forEach(e=>W.addEventListener?.(e,install,{passive:true}));
  [0,120,400,900,1800,3200].forEach(ms=>setTimeout(install,ms));
})();
