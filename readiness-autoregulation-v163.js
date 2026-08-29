'use strict';

(()=>{
  const root=window;
  if(!Array.isArray(root.st?.readinessLog))root.st.readinessLog=[];

  const css=document.createElement('style');
  css.textContent=`
.readiness-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.readiness-item{background:#202023;border:1px solid #303034;border-radius:18px;padding:13px}.readiness-item b{display:flex;justify-content:space-between;gap:8px;margin-bottom:9px}.readiness-item input{width:100%;accent-color:var(--green)}.readiness-result{margin:2px 0 14px;padding:12px 14px;border-radius:16px;background:#171719;border:1px solid #303034}.readiness-result b{display:block;margin-bottom:3px}.readiness-result .small{line-height:1.35}@media(max-width:390px){.readiness-grid{grid-template-columns:1fr}}
`;
  document.head.appendChild(css);

  const number=v=>Number.isFinite(Number(v))?Number(v):0;
  const roundLoad=(v,step=2.5)=>typeof root.advRound==='function'?root.advRound(v,step):Math.max(0,Math.round(number(v)/step)*step);
  const get=id=>number(document.getElementById(id)?.value||3);

  function readinessData(){
    const sleep=get('advSleep'),energy=get('advEnergy'),soreness=get('advSore'),stress=get('advStress');
    const positive=v=>(v-1)/4,negative=v=>(5-v)/4;
    const score=Math.round(positive(sleep)*25+positive(energy)*30+negative(soreness)*30+negative(stress)*15);
    let factor=1,volumeFactor=1,dropSets=0,advice='Вес по плану';
    if(score<20){factor=.90;volumeFactor=.70;advice='−10% к весу и −30% рабочего объёма'}
    else if(score<35){factor=.925;dropSets=1;advice='−7,5% к весу и на один подход меньше'}
    else if(score<50){factor=.95;advice='−5% к рабочему весу'}
    else if(score<65){advice='Вес по плану, проверь первый подход по RPE'}
    else if(score>=82){advice='Вес по плану, прибавляй только если RPE ниже цели'}
    return{sleep,energy,soreness,stress,score,factor,volumeFactor,dropSets,advice,at:new Date().toISOString()};
  }

  function range(id,label,desc){
    return `<div class="readiness-item"><b><span>${label}</span><span id="${id}Val">3</span></b><input id="${id}" type="range" min="1" max="5" value="3" step="1" oninput="document.getElementById('${id}Val').textContent=this.value;advReadinessPreview()"><div class="muted small">${desc}</div></div>`;
  }

  function readinessPreview(){
    const d=readinessData(),el=document.getElementById('advReadinessResult');
    if(el)el.innerHTML=`<b>Готовность ${d.score}/100</b><div class="muted small">${d.advice}</div>`;
  }

  function askReadiness(fn,args){
    root.__advReadinessPending={fn,args};
    modal(`<div class="sheet-grabber"></div><h2>Готовность к тренировке</h2><div class="muted">Оцени состояние перед стартом. Итог можно уточнить после первого подхода.</div><div class="readiness-grid">${range('advSleep','Сон','1 – плохо · 5 – отлично')}${range('advEnergy','Энергия','1 – нет сил · 5 – отлично')}${range('advSore','Крепатура рабочих мышц','1 – нет · 5 – сильная')}${range('advStress','Стресс','1 – низкий · 5 – высокий')}</div><div id="advReadinessResult" class="readiness-result"></div><button class="btn primary full" onclick="advConfirmReadiness(true)">Начать по рекомендации</button><button class="btn full" style="margin-top:10px" onclick="advConfirmReadiness(false)">Оставить веса по плану</button>`);
    readinessPreview();
  }

  function trimVolume(exercise,d){
    const sets=Array.isArray(exercise?.set)?exercise.set:null;
    if(!sets?.length)return;
    let keep=sets.length;
    if(d.volumeFactor<1)keep=Math.max(1,Math.ceil(sets.length*d.volumeFactor));
    else if(d.dropSets)keep=Math.max(1,sets.length-d.dropSets);
    if(keep<sets.length){
      exercise.readinessRemovedSets=sets.slice(keep);
      exercise.set=sets.slice(0,keep);
    }
  }

  function applyReadiness(d,useAdjust){
    const session=root.st?.current;
    if(!session)return;
    session.readiness=d;
    session.keepPlannedWeights=!useAdjust;
    root.st.readinessLog.push({date:session.date,sessionId:session.id,...d});
    root.st.readinessLog=root.st.readinessLog.slice(-120);

    (session.ex||[]).forEach(exercise=>{
      (exercise.set||[]).forEach(set=>{
        if(set.plannedW==null&&number(set.w)>0)set.plannedW=number(set.w);
        if(!useAdjust&&set.plannedW!=null)set.w=number(set.plannedW);
      });
      if(!useAdjust||d.factor>=1)return;
      const base=typeof root.baseExerciseName==='function'?root.baseExerciseName(exercise.n):exercise.n;
      const step=typeof root.loadStepFor==='function'?root.loadStepFor(base,exercise.sourceId||null):2.5;
      (exercise.set||[]).forEach(set=>{if(number(set.w)>0)set.w=roundLoad(number(set.w)*d.factor,step)});
      trimVolume(exercise,d);
    });

    try{save()}catch(e){}
    try{startPage()}catch(e){}
    toast(useAdjust?d.advice:'Веса оставлены по плану');
  }

  function confirmReadiness(useAdjust){
    const pending=root.__advReadinessPending;
    if(!pending)return closeModal();
    const data=readinessData();
    root.__advReadinessPending=null;
    closeModal();
    pending.fn.apply(root,pending.args||[]);
    setTimeout(()=>applyReadiness(data,useAdjust),0);
  }

  function targetRpe(exercise,set){
    const values=[set?.targetRpe,exercise?.targetRpe,exercise?.rpeTarget,exercise?.rpe,root.st?.current?.target,8];
    return values.map(number).find(v=>v>0)||8;
  }

  function firstCompletedSetIndex(exercise){
    return (exercise?.set||[]).findIndex(set=>set?.ok);
  }

  function reviewFirstSet(ei,si){
    const exercise=root.st?.current?.ex?.[ei],set=exercise?.set?.[si];
    if(!exercise||!set?.ok||exercise.readinessRpeReviewed)return;
    if(firstCompletedSetIndex(exercise)!==si)return;
    if(set.rpe===''||!Number.isFinite(Number(set.rpe))){
      toast('Укажи RPE первого подхода для проверки веса');
      return;
    }
    const target=targetRpe(exercise,set),actual=number(set.rpe),difference=actual-target;
    if(difference<1){exercise.readinessRpeReviewed=true;try{save()}catch(e){};return}
    const reduction=difference>=2?10:5;
    exercise.readinessPendingReduction=reduction;
    modal(`<div class="sheet-grabber"></div><h2>Вес выше готовности</h2><div class="muted">Первый подход: RPE ${actual}. Цель: RPE ${target}.</div><div class="readiness-result" style="margin-top:14px"><b>Снизить оставшиеся веса на ${reduction}%?</b><div class="muted small">Выполненный подход не изменится.</div></div><button class="btn primary full" onclick="advApplyRpeCorrection(${ei},${si},${reduction})">Снизить на ${reduction}%</button><button class="btn full" style="margin-top:10px" onclick="advKeepRpeWeight(${ei})">Оставить вес</button>`);
  }

  function applyRpeCorrection(ei,si,reduction){
    const exercise=root.st?.current?.ex?.[ei];
    if(!exercise)return closeModal();
    const base=typeof root.baseExerciseName==='function'?root.baseExerciseName(exercise.n):exercise.n;
    const step=typeof root.loadStepFor==='function'?root.loadStepFor(base,exercise.sourceId||null):2.5;
    (exercise.set||[]).forEach((set,index)=>{
      if(index===si||set.ok||number(set.w)<=0)return;
      if(set.plannedW==null)set.plannedW=number(set.w);
      set.w=roundLoad(number(set.w)*(1-number(reduction)/100),step);
    });
    exercise.readinessRpeReviewed=true;
    delete exercise.readinessPendingReduction;
    try{save()}catch(e){}
    closeModal();
    try{startPage()}catch(e){}
    toast(`Оставшиеся веса снижены на ${reduction}%`);
  }

  function keepRpeWeight(ei){
    const exercise=root.st?.current?.ex?.[ei];
    if(exercise){exercise.readinessRpeReviewed=true;delete exercise.readinessPendingReduction;try{save()}catch(e){}}
    closeModal();
    toast('Вес оставлен');
  }

  root.advReadinessData=readinessData;
  root.advReadinessPreview=readinessPreview;
  root.advAskReadiness=askReadiness;
  root.advApplyReadinessToCurrent=applyReadiness;
  root.advConfirmReadiness=confirmReadiness;
  root.advApplyRpeCorrection=applyRpeCorrection;
  root.advKeepRpeWeight=keepRpeWeight;

  function wrapStart(name){
    const fn=root[name];
    if(typeof fn!=='function'||fn.__readinessV163)return;
    if(fn.__advReadiness||String(fn).includes('advAskReadiness'))return;
    const wrapped=function(){return askReadiness(fn,[...arguments])};
    wrapped.__readinessV163=true;
    root[name]=wrapped;
  }

  function wrapToggle(){
    const fn=root.toggleSet;
    if(typeof fn!=='function'||fn.__readinessRpeV163)return;
    const wrapped=function(ei,si){
      const exercise=root.st?.current?.ex?.[ei],set=exercise?.set?.[si],was=!!set?.ok;
      const result=fn.apply(this,arguments);
      if(!was&&set?.ok)setTimeout(()=>reviewFirstSet(ei,si),0);
      return result;
    };
    wrapped.__readinessRpeV163=true;
    root.toggleSet=wrapped;
  }

  function wrapEditSet(){
    const fn=root.editSet;
    if(typeof fn!=='function'||fn.__readinessRpeV163)return;
    const wrapped=function(ei,si,key,value){
      const result=fn.apply(this,arguments);
      if(key==='rpe')setTimeout(()=>reviewFirstSet(ei,si),0);
      return result;
    };
    wrapped.__readinessRpeV163=true;
    root.editSet=wrapped;
  }

  function install(){
    ['begin','beginProgramDay','beginRemotePlan'].forEach(wrapStart);
    wrapToggle();
    wrapEditSet();
  }

  install();
  setTimeout(install,500);
  setTimeout(install,1500);
})();
