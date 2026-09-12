'use strict';
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.UNVRSL_METHOD_V211=api;
})(typeof window!=='undefined'?window:globalThis,()=>{
  const value=input=>{
    if(input===''||input==null)return null;
    const parsed=Number(String(input).replace(',','.'));
    return Number.isFinite(parsed)?parsed:null;
  };
  const mean=items=>{
    const values=(items||[]).map(value).filter(item=>item!=null);
    return values.length?values.reduce((sum,item)=>sum+item,0)/values.length:null;
  };
  const round=(input,step=2.5)=>{
    const number=value(input),increment=value(step)||2.5;
    return number==null?null:Math.max(increment,Math.round(number/increment)*increment);
  };
  const entrySets=entry=>{
    if(Array.isArray(entry?.sets)&&entry.sets.length)return entry.sets.map(set=>({...set,w:value(set?.w??set?.weight)||0,r:value(set?.r??set?.reps)||0}));
    return Array.from({length:Math.max(1,value(entry?.s)||1)},()=>({w:value(entry?.w)||0,r:value(entry?.r)||0,rest:value(entry?.rest)}));
  };
  function expandPlanEntries(entries=[]){
    const source=entries.filter(Boolean),flat=source.flatMap(entrySets);
    const names=source.map(entry=>String(entry?.n||entry?.name||''));
    const isUnvrsl=names.some(name=>/UNVRSL/i.test(name))||source.some(entry=>String(entry?.method||'').toUpperCase()==='UNVRSL');
    if(!isUnvrsl)return{method:String(source[0]?.method||'STANDARD').toUpperCase(),sets:flat};
    const compressedPair=source.length===2&&source.every(entry=>(value(entry?.s)||1)===1);
    const compressedWithFinish=source.length===3&&(value(source[0]?.s)||1)===1&&(value(source[1]?.s)||1)===1;
    if(!compressedPair&&!compressedWithFinish)return{method:'UNVRSL',sets:flat};
    const heavy=entrySets(source[0])[0],light=entrySets(source[1])[0];
    const rounds=Array.from({length:3},()=>[{...heavy},{...light}]).flat();
    const finish=compressedWithFinish?entrySets(source[2]):[];
    return{method:'UNVRSL',sets:[...rounds,...finish]};
  }
  function aggregateRecommendation(rows=[],currentWeights=[],currentReps=[],targetRpes=[],step=2.5){
    const valid=rows.map(row=>({
      w:value(row?.w??row?.weight),
      r:value(row?.r??row?.reps),
      rpe:value(row?.rpe),
      rir:value(row?.rir)
    })).filter(row=>row.w>0&&row.r>0);
    if(!valid.length)return null;
    const averageWeight=mean(valid.map(row=>row.w));
    const averageReps=mean(valid.map(row=>row.r));
    const averageRpe=mean(valid.map(row=>row.rpe));
    const averageRir=mean(valid.map(row=>row.rir!=null?row.rir:(row.rpe!=null?Math.max(0,10-row.rpe):2)))??2;
    const targetAverageReps=mean(currentReps)||averageReps;
    const targetAverageRpe=mean(targetRpes)||8;
    const targetRir=Math.max(0,10-targetAverageRpe);
    const estimatedMax=averageWeight*(1+(averageReps+averageRir)/30);
    const rawAverage=estimatedMax/(1+(targetAverageReps+targetRir)/30);
    const desiredAverage=round(Math.max(averageWeight*.9,Math.min(averageWeight*1.075,rawAverage)),step);
    const pattern=currentWeights.map(value).map(item=>item>0?item:null);
    const patternAverage=mean(pattern)||averageWeight;
    const ratio=desiredAverage/patternAverage;
    const weights=pattern.map(item=>item==null?desiredAverage:round(item*ratio,step));
    return{
      weights,
      averageWeight:Number(averageWeight.toFixed(1)),
      averageReps:Number(averageReps.toFixed(1)),
      averageRpe:averageRpe==null?null:Number(averageRpe.toFixed(1)),
      desiredAverage,
      estimatedMax:Number(estimatedMax.toFixed(1))
    };
  }
  return{aggregateRecommendation,expandPlanEntries,mean,round};
});

// Custom-program SLDR builder: 3 full working rounds, each with 3 mini-sets.
((root)=>{
  if(!root||root.__unvrslSldrBuilderV212)return;
  root.__unvrslSldrBuilderV212=true;

  const baseForm=root.programExerciseForm;
  const baseRefresh=root.programRefreshMethodUi;
  const baseSave=root.saveProgramExercise;
  const basePrescription=root.prescriptionText;
  const baseBegin=root.beginProgramDay;

  const num=(id,fallback=0)=>{
    const el=document.getElementById(id);
    if(!el)return fallback;
    const n=Number(String(el.value??'').replace(',','.'));
    return Number.isFinite(n)?n:fallback
  };
  const sldrPattern=start=>{
    const first=Math.max(1,Math.round(Number(start)||12));
    return first>=15
      ?[first,Math.max(1,first-3),Math.max(1,first-5)]
      :[first,Math.max(1,first-2),Math.max(1,first-4)]
  };
  const decorateSldr=applyDefaults=>{
    if(document.getElementById('pmMethod')?.value!=='SLDR')return;
    const reps=document.getElementById('pmReps');
    if(applyDefaults&&reps)reps.value='12';
    const box=document.getElementById('pmSldrFields');
    if(box)box.innerHTML=`<div class="px-method-subtitle">3 полных рабочих подхода</div><div class="field"><label>Рабочих подходов</label><input value="3" disabled></div><div class="field"><label>Мини-подходов в каждом</label><input value="3" disabled></div><div class="px-method-info px-span-2">Повторы задаются первым числом выше. 12 = 12 → 10 → 8. 15 = 15 → 12 → 10. Вес внутри каждого SLDR-подхода не меняется.</div>`;
    const hint=document.getElementById('methodHint');
    if(hint)hint.textContent='SLDR — 3 полноценных рабочих подхода. Каждый: первый мини-подход → 15 сек → второй → 15 сек → третий; затем обычный отдых и следующий полный подход.';
    const inner=document.getElementById('pmInnerRest');
    if(inner)inner.textContent='Внутри каждого SLDR-подхода: 15 сек между мини-подходами. После третьего — полный отдых.'
  };

  if(typeof baseRefresh==='function'){
    root.programRefreshMethodUi=function(applyDefaults=false){
      const result=baseRefresh.apply(this,arguments);
      decorateSldr(!!applyDefaults);
      return result
    };
    try{programRefreshMethodUi=root.programRefreshMethodUi}catch(_){ }
  }

  if(typeof baseForm==='function'){
    root.programExerciseForm=function(){
      const result=baseForm.apply(this,arguments);
      setTimeout(()=>decorateSldr(false),0);
      return result
    };
    try{programExerciseForm=root.programExerciseForm}catch(_){ }
  }

  if(typeof baseSave==='function'){
    root.saveProgramExercise=function(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,existingIndex){
      const method=document.getElementById('pmMethod')?.value||'STANDARD';
      if(method!=='SLDR')return baseSave.apply(this,arguments);
      const p=typeof programById==='function'?programById(pid):null,d=p?.weeks?.[wi]?.days?.[di];
      if(!p||!d)return;
      const old=existingIndex===null||Number.isNaN(existingIndex)?null:d.ex?.[existingIndex];
      const n=decodeURIComponent(nameToken||''),kind=document.getElementById('pmKind')?.value||(typeof root.programInferExerciseKind==='function'?root.programInferExerciseKind(n):'compound');
      const restMode=document.getElementById('pmRestMode')?.value||'auto';
      const fullRest=restMode==='auto'&&typeof root.programAutoRest==='function'?root.programAutoRest(kind,'SLDR'):Math.max(0,num('pmRest',90));
      const firstReps=Math.max(1,num('pmReps',12)),weight=Math.max(0,num('pmWeight',0)),rpe=num('pmRpe',8),tempo=document.getElementById('pmTempo')?.value.trim()||(kind==='compound'?'2-1-1':'3-1-2');
      const reps=sldrPattern(firstReps);
      const sets=Array.from({length:3},(_,round)=>reps.map((r,mini)=>({
        label:`Круг ${round+1}/3 · ${mini+1}/3`,
        role:'sldr-mini',round:round+1,mini:mini+1,w:weight,r,
        rest:mini<2?15:fullRest,tempo
      }))).flat();
      const obj={...(old||{}),id:old?.id||(typeof uid==='function'?uid('pex'):`pex-${Date.now()}`),n,
        sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||''),
        kind,method:'SLDR',rpe,tempo,tempoLight:null,restMode,rest:fullRest,innerRest:15,
        heavyReps:null,lightReps:null,lightWeight:null,middleSets:null,middleReps:null,middleWeight:null,
        sldrRounds:3,miniSets:3,repPattern:reps,repDrop:null,note:document.getElementById('pmNote')?.value.trim()||'',sets};
      if(old)d.ex[existingIndex]=obj;else d.ex.push(obj);
      p.updated=Date.now();
      try{save()}catch(_){ }
      if(typeof openProgramEditor==='function')openProgramEditor(pid,wi,di)
    };
    try{saveProgramExercise=root.saveProgramExercise}catch(_){ }
  }

  if(typeof basePrescription==='function'){
    root.prescriptionText=function(e){
      if(e?.method!=='SLDR')return basePrescription.apply(this,arguments);
      const sets=Array.isArray(e.sets)?e.sets:[],firstRound=sets.filter(x=>(x?.round||1)===1).slice(0,3),source=firstRound.length?firstRound:sets.slice(0,3);
      const reps=source.map(x=>x?.r||'—').join('/'),weight=source[0]?.w??sets[0]?.w??0,rest=e?.rest??source[2]?.rest??90;
      return `3×(${reps}) · ${weight} кг · 15с внутри · отдых ${rest}с`
    };
    try{prescriptionText=root.prescriptionText}catch(_){ }
  }

  if(typeof baseBegin==='function'){
    root.beginProgramDay=function(pid,wi,di){
      const result=baseBegin.apply(this,arguments);
      try{
        const p=typeof programById==='function'?programById(pid):null,d=p?.weeks?.[wi]?.days?.[di],s=typeof st!=='undefined'?st.current:null;
        if(d&&s?.programId===pid){
          (d.ex||[]).filter(b=>b.method==='SLDR'&&Array.isArray(b.sets)&&b.sets.length===9).forEach(b=>{
            const rows=(s.ex||[]).filter(e=>e.method==='SLDR'&&String(e.n||'').startsWith(`${b.n} — SLDR`));
            rows.forEach((e,i)=>{const x=b.sets[i];if(!x)return;e.phaseLabel=x.label;e.phaseRole='sldr-mini';e.rest=+x.rest||0;e.n=`${b.n} — SLDR ${x.label}`})
          });
          try{save()}catch(_){ }
          if(document.getElementById('start')?.classList.contains('active')&&typeof startPage==='function')startPage()
        }
      }catch(_){ }
      return result
    };
    try{beginProgramDay=root.beginProgramDay}catch(_){ }
  }
})(typeof window!=='undefined'?window:null);
