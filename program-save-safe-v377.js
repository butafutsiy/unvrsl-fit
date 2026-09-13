'use strict';
(()=>{
  const W=window,D=document,REV=377;
  if(W.__unvrslProgramSaveSafeV377)return;
  W.__unvrslProgramSaveSafeV377=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const PRE=[
    {h:65,b:[12,15],i:[15,20]},
    {h:70,b:[10,12],i:[12,15]},
    {h:75,b:[8,10],i:[12,15]},
    {h:80,b:[6,8],i:[10,12]},
    {h:85,b:[4,6],i:[8,10]},
    {h:88,b:[4,6],i:[8,10]},
    {h:90,b:[3,5],i:[6,10]},
    {h:95,b:[2,4],i:[6,8]},
    {h:101,b:[1,3],i:[4,6]}
  ];
  const program=id=>{try{return typeof programById==='function'?programById(id):(W.st?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const kindOf=(name,kind)=>{
    if(kind==='compound'||kind==='isolation')return kind;
    return /(разгиб|сгиб|мах|развед|свед|бицеп|трицеп|кроссов|икр|дельт|канат|отвед|привед)/i.test(name||'')?'isolation':'compound'
  };
  function weekRange(p,wi,kind){
    const w=p?.weeks?.[Number(wi)];if(!w)return[8,10];
    const direct=kind==='isolation'?[N(w.isolationRepMin),N(w.isolationRepMax)]:[N(w.baseRepMin),N(w.baseRepMax)];
    if(direct[0]!=null&&direct[1]!=null)return[Math.min(...direct),Math.max(...direct)];
    let lo=N(w.intensityMin??w.weekIntensityMin??w.intensity?.min),hi=N(w.intensityMax??w.weekIntensityMax??w.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    const mid=lo!=null&&hi!=null?(lo+hi)/2:72.5,x=PRE.find(x=>mid<=x.h)||PRE.at(-1);
    return(kind==='isolation'?x.i:x.b).slice()
  }
  const roundLoad=v=>{try{return typeof W.roundLoad==='function'?W.roundLoad(v,2.5):Math.round(v/2.5)*2.5}catch(_){return Math.round(v/2.5)*2.5}};
  const restFor=(kind,method)=>{try{return typeof W.programAutoRest==='function'?W.programAutoRest(kind,method):(kind==='compound'?150:75)}catch(_){return kind==='compound'?150:75}};
  function dsPattern(range){
    const end=clamp(Math.round(range[1]??10),8,12),start=clamp(end+5,12,15);
    return Array.from({length:5},(_,i)=>Math.round(start+(end-start)*(i/4)))
  }
  const sldrPattern=range=>Number(range?.[1]||10)>=12?[15,12,10]:Number(range?.[1]||10)>=10?[12,10,8]:[10,8,6];
  function manualSldr(fallback){
    const preset=D.getElementById('pmSldrPreset376')?.value;
    if(preset==='10-8-6')return[10,8,6];
    if(preset==='12-10-8')return[12,10,8];
    if(preset==='15-12-10')return[15,12,10];
    const a=[N(D.getElementById('pmSldr1_376')?.value),N(D.getElementById('pmSldr2_376')?.value),N(D.getElementById('pmSldr3_376')?.value)];
    return a.every(x=>x!=null&&x>0)?a.map(x=>clamp(Math.round(x),1,50)):fallback.slice()
  }
  function manualDs(fallback){
    const a=N(D.getElementById('pmReps')?.value),b=N(D.getElementById('pmRepsMax')?.value);
    const start=a??fallback[0],end=b??fallback.at(-1);
    return Array.from({length:5},(_,i)=>Math.max(1,Math.round(start+(end-start)*(i/4))))
  }
  function target(set,min,max){
    set.rMin=set.targetRepMin=min;set.rMax=set.targetRepMax=max;set.targetRepLabel=min===max?String(min):`${min}–${max}`;return set
  }
  function setBusy(on){
    const b=D.querySelector('.px-save-exercise');if(!b)return;
    b.disabled=!!on;b.style.opacity=on?'.65':'';if(on)b.dataset.oldText=b.textContent||'';b.textContent=on?'Сохраняю…':(b.dataset.oldText||b.textContent||'Сохранить')
  }

  function safeSave(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,existingIndex){
    if(W.__programSave377Busy)return false;
    W.__programSave377Busy=true;setBusy(true);
    try{
      const p=program(pid),d=p?.weeks?.[Number(wi)]?.days?.[Number(di)];
      if(!p||!d||!Array.isArray(d.ex))throw new Error('Не найден день программы');
      const idx=existingIndex==null||String(existingIndex)==='null'||Number.isNaN(Number(existingIndex))?null:Number(existingIndex);
      const old=idx==null?null:d.ex[idx];
      const name=decodeURIComponent(nameToken||''),method=String(D.getElementById('pmMethod')?.value||'STANDARD').toUpperCase();
      const kind=kindOf(name,D.getElementById('pmKind')?.value||old?.kind),mode=method==='UNVRSL'?'method':(D.getElementById('pr374mode')?.dataset.mode==='manual'?'manual':'auto');
      const range=weekRange(p,wi,kind),weight=Math.max(0,N(D.getElementById('pmWeight')?.value)??0),rpe=N(D.getElementById('pmRpe')?.value)??8;
      const restMode=D.getElementById('pmRestMode')?.value||'auto',rest=restMode==='auto'?restFor(kind,method):Math.max(0,N(D.getElementById('pmRest')?.value)??90);
      const tempo=(method==='UNVRSL'?D.getElementById('pmTempoHeavy'):D.getElementById('pmTempo'))?.value?.trim()||(kind==='compound'?'2-1-1':'3-1-2');
      const note=D.getElementById('pmNote')?.value?.trim()||'';
      let sets=[],extra={};

      if(method==='UNVRSL'){
        const heavyReps=Math.max(1,N(D.getElementById('pmHeavyReps')?.value)??3),lightReps=Math.max(1,N(D.getElementById('pmLightReps')?.value)??9),lightWeight=Math.max(0,N(D.getElementById('pmLightWeight')?.value)??roundLoad(weight*.85));
        const middleSets=clamp(Math.round(N(D.getElementById('pmMiddleSets')?.value)??2),0,5),middleReps=Math.max(1,N(D.getElementById('pmMiddleReps')?.value)??6),middleWeight=Math.max(0,N(D.getElementById('pmMiddleWeight')?.value)??roundLoad((weight+lightWeight)/2));
        const tempoLight=D.getElementById('pmTempoLight')?.value?.trim()||'3-1-2';
        sets=Array.from({length:3},(_,round)=>[
          target({label:`${round+1}/3 тяжёлая`,role:'heavy',round:round+1,w:weight,r:heavyReps,rest:30,tempo},heavyReps,heavyReps),
          target({label:`${round+1}/3 лёгкая`,role:'light',round:round+1,w:lightWeight,r:lightReps,rest,tempo:tempoLight},lightReps,lightReps)
        ]).flat();
        sets.push(...Array.from({length:middleSets},(_,i)=>target({label:`Средний ${i+1}/${middleSets}`,role:'middle',w:middleWeight,r:middleReps,rest,tempo},middleReps,middleReps)));
        extra={tempoLight,heavyReps,lightReps,lightWeight,middleSets,middleReps,middleWeight,innerRest:30,repMode:'method'}
      }else if(method==='SLDR'){
        const auto=sldrPattern(range),pat=mode==='manual'?manualSldr(auto):auto;
        sets=Array.from({length:3},(_,round)=>pat.map((q,mini)=>target({label:`Круг ${round+1}/3 · ${mini+1}/3`,role:'sldr-mini',round:round+1,mini:mini+1,w:weight,r:q,rest:mini<2?15:rest,tempo},q,q))).flat();
        extra={repMode:mode,repPattern:pat.slice(),sldrPattern:pat.join('/'),sldrRounds:3,miniSets:3,innerRest:15,repMin:Math.min(...pat),repMax:Math.max(...pat)}
      }else if(method==='DS'){
        const auto=dsPattern(range),pat=mode==='manual'?manualDs(auto):auto;
        sets=pat.map((q,i)=>target({label:`DS${i+1}`,role:'drop',w:roundLoad(weight*Math.pow(.8,i)),r:q,rest:i<pat.length-1?0:rest,tempo},q,q));
        extra={repMode:mode,dsRepStart:pat[0],dsRepEnd:pat.at(-1),dsRepPattern:pat.slice(),repMin:Math.min(...pat),repMax:Math.max(...pat),innerRest:0}
      }else{
        let min=range[0],max=range[1];
        if(mode==='manual'){
          min=N(D.getElementById('pmReps')?.value)??range[0];max=N(D.getElementById('pmRepsMax')?.value)??range[1];
          if(min>max){W.toast?.('Повторы: «от» не может быть больше «до»');W.__programSave377Busy=false;setBusy(false);return false}
        }
        const count=method==='FST-7'?7:clamp(Math.round(N(D.getElementById('pmSets')?.value)??3),1,10);
        const inner=method==='FST-7'?30:null;
        sets=Array.from({length:count},(_,i)=>target({label:method==='FST-7'?`${i+1}/7`:String(i+1),w:weight,r:min,rest:method==='FST-7'&&i<count-1?30:rest,tempo},min,max));
        extra={repMode:mode,repMin:min,repMax:max,innerRest:inner}
      }

      const obj={...(old||{}),id:old?.id||(typeof uid==='function'?uid('pex'):`pex-${Date.now()}`),n:name,sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||''),kind,method,rpe,tempo,restMode,rest,note,repPolicyRevision:REV,...extra,sets};
      if(idx==null)d.ex.push(obj);else d.ex[idx]=obj;
      p.updated=Date.now();
      try{typeof save==='function'?save():W.save?.()}catch(e){console.error('program save v377',e)}
      W.__programSave377Busy=false;setBusy(false);
      setTimeout(()=>{try{if(typeof openProgramEditor==='function')openProgramEditor(pid,Number(wi),Number(di));else W.openProgramEditor?.(pid,Number(wi),Number(di))}catch(e){console.error('program reopen v377',e);W.toast?.('Упражнение сохранено. Открой программу ещё раз.')}},0);
      return false
    }catch(e){
      console.error('saveProgramExercise v377',e);
      W.__programSave377Busy=false;setBusy(false);
      W.toast?.(`Не удалось добавить: ${e?.message||'ошибка сохранения'}`);
      return false
    }
  }

  safeSave.__pr376=true;
  safeSave.__pr374=true;
  safeSave.__pr377=true;
  W.saveProgramExercise=safeSave;
  try{saveProgramExercise=safeSave}catch(_){ }
})();
