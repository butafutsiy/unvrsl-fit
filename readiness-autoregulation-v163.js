'use strict';

(()=>{
  const root=window;
  if(!Array.isArray(root.st?.readinessLog))root.st.readinessLog=[];

  const css=document.createElement('style');
  css.textContent=`.readiness-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.readiness-item{background:#202023;border:1px solid #303034;border-radius:18px;padding:13px}.readiness-item b{display:flex;justify-content:space-between;gap:8px;margin-bottom:9px}.readiness-item input{width:100%;accent-color:var(--green)}.readiness-result{margin:2px 0 14px;padding:12px 14px;border-radius:16px;background:#171719;border:1px solid #303034}.readiness-result b{display:block;margin-bottom:3px}.readiness-result .small{line-height:1.35}@media(max-width:390px){.readiness-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const number=v=>N(v)??0;
  const mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const base=n=>{try{return typeof root.baseExerciseName==='function'?root.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===base(n).toLowerCase();
  const roundLoad=(v,step=2.5)=>typeof root.advRound==='function'?root.advRound(v,step):Math.max(step,Math.round(number(v)/step)*step);
  const get=id=>number(document.getElementById(id)?.value||3);

  function readinessData(){
    const sleep=get('advSleep'),energy=get('advEnergy'),soreness=get('advSore'),stress=get('advStress');
    const positive=v=>(v-1)/4,negative=v=>(5-v)/4;
    const score=Math.round(positive(sleep)*25+positive(energy)*30+negative(soreness)*30+negative(stress)*15);
    let factor=1,volumeFactor=1,dropSets=0,advice='Базовый вес без изменений';
    if(score<20){factor=.90;volumeFactor=.70;advice='−10% к весу и −30% рабочего объёма'}
    else if(score<35){factor=.925;dropSets=1;advice='−7,5% к весу и на один подход меньше'}
    else if(score<50){factor=.95;advice='−5% к рабочему весу'}
    else if(score>=92){factor=1.025;advice='+2,5% к базовому рабочему весу'}
    else if(score<65){advice='Базовый вес без изменений, проверь первый подход по RPE'}
    return{sleep,energy,soreness,stress,score,factor,volumeFactor,dropSets,advice,at:new Date().toISOString()};
  }

  function range(id,label,desc){return `<div class="readiness-item"><b><span>${label}</span><span id="${id}Val">3</span></b><input id="${id}" type="range" min="1" max="5" value="3" step="1" oninput="document.getElementById('${id}Val').textContent=this.value;advReadinessPreview()"><div class="muted small">${desc}</div></div>`}
  function readinessPreview(){const d=readinessData(),el=document.getElementById('advReadinessResult');if(el)el.innerHTML=`<b>Готовность ${d.score}/100</b><div class="muted small">${d.advice}</div>`}
  function askReadiness(){
    const s=root.st?.current;if(!s)return;
    s.readinessAsked=true;
    modal(`<div class="sheet-grabber"></div><h2>Готовность к тренировке</h2><div class="muted">Базовые рабочие веса уже рассчитаны по предыдущей фактической тренировке. Чек-ин только корректирует их на сегодня.</div><div class="readiness-grid">${range('advSleep','Сон','1 – плохо · 5 – отлично')}${range('advEnergy','Энергия','1 – нет сил · 5 – отлично')}${range('advSore','Крепатура рабочих мышц','1 – нет · 5 – сильная')}${range('advStress','Стресс','1 – низкий · 5 – высокий')}</div><div id="advReadinessResult" class="readiness-result"></div><button class="btn primary full" onclick="advConfirmReadiness(true)">Скорректировать по самочувствию</button><button class="btn full" style="margin-top:10px" onclick="advConfirmReadiness(false)">Оставить рассчитанные веса</button>`);
    readinessPreview();
  }

  function effort(x){let rpe=N(x?.rpe),rir=N(x?.rir);if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;return rpe==null?null:{rpe,rir:clamp(rir,0,10)}}
  function rowsFromSession(s,n,id){const out=[];(s?.ex||[]).forEach(e=>{if(!same(e,n,id))return;(e.set||[]).forEach(x=>{const ef=effort(x),w=N(x?.w),r=N(x?.r);if(x?.ok&&w>0&&r>0&&ef)out.push({w,r,rpe:ef.rpe,rir:ef.rir,date:s.date||''})})});return out}
  function localRows(n,id,exclude){const ss=root.st?.sessions||[];for(let i=ss.length-1;i>=0;i--){const s=ss[i];if(String(s?.id||'')===String(exclude||''))continue;const r=rowsFromSession(s,n,id);if(r.length)return r}return[]}
  async function cloudRows(n,id,exclude){
    try{
      if(!root.cloud?.client||!root.cloud?.user?.id)return[];
      const q=await root.cloud.client.from('workouts').select('payload,workout_date').eq('user_id',root.cloud.user.id).order('workout_date',{ascending:false}).limit(50);
      if(q.error)return[];
      for(const row of q.data||[]){const p=row.payload||{};if(String(p?.id||'')===String(exclude||''))continue;const r=rowsFromSession(p,n,id);if(r.length)return r}
    }catch(e){console.warn('readiness history cloud',e)}
    return[];
  }
  async function historyRows(exercise,session){const n=base(exercise?.n),id=exercise?.sourceId||null;let r=localRows(n,id,session?.id);if(r.length)return r;return await cloudRows(n,id,session?.id)}
  function capacity(rows){let vals=(rows||[]).map(x=>x.w*(1+(x.r+x.rir)/30)).filter(x=>x>0);if(!vals.length)return null;const raw=mean(vals);if(vals.length>=3){const kept=vals.filter(x=>x>=raw*.82&&x<=raw*1.18);if(kept.length>=2)vals=kept}return mean(vals)}
  function loadStep(exercise,rows){let s=2.5;try{s=Number(root.loadStepFor?.(base(exercise?.n),exercise?.sourceId||null))||s}catch(_){}const w=mean((rows||[]).map(x=>x.w))||0;if(w<=6)return Math.min(s,.5);if(w<=12)return Math.min(s,1);if(w<=22)return Math.min(s,2);return s}
  function targetRpe(exercise,set,session){return [N(set?.targetRpe),N(exercise?.targetRpe),N(exercise?.rpeTarget),N(exercise?.target),N(exercise?.rpe),N(session?.target),8].find(v=>v!=null&&v>0)||8}

  async function computeBaselines(session){
    if(!session)return false;
    let changed=false;
    for(const exercise of session.ex||[]){
      if(exercise?.mode==='cardio')continue;
      const sets=exercise.set||[];
      sets.forEach(set=>{if(set.programW==null&&number(set.w)>0)set.programW=number(set.w)});
      const rows=await historyRows(exercise,session),e1=capacity(rows);
      if(e1>0){
        const step=loadStep(exercise,rows),calculated=[];
        sets.forEach(set=>{
          if(set.ok||set.manualOverride)return;
          const reps=N(set.r);if(!(reps>0))return;
          const target=targetRpe(exercise,set,session),rir=clamp(10-target,0,10),w=roundLoad(e1/(1+(reps+rir)/30),step);
          if(!(w>0))return;
          set.w=w;set.plannedW=w;set.baselineW=w;set.baselineSource='history';calculated.push(w);changed=true;
        });
        exercise.calculatedBaseline={weight:calculated.length?mean(calculated):null,e1rm:Math.round(e1*10)/10,target:targetRpe(exercise,sets[0],session),source:'previous_workout',sourceDate:rows[0]?.date||''};
      }else{
        sets.forEach(set=>{if(set.plannedW==null&&number(set.w)>0)set.plannedW=number(set.w);if(set.baselineW==null&&number(set.w)>0)set.baselineW=number(set.w);set.baselineSource='program'});
        exercise.calculatedBaseline={weight:mean(sets.map(x=>N(x.w)).filter(x=>x>0)),e1rm:null,target:targetRpe(exercise,sets[0],session),source:'program_no_history'};
      }
    }
    session.baselineWeightsCalculated=true;session.baselineCalculatedAt=new Date().toISOString();
    try{root.save?.()}catch(e){}
    try{root.startPage?.()}catch(e){}
    return changed;
  }

  async function prepareAndAsk(){
    const session=root.st?.current;if(!session)return;
    const id=String(session.id||'');
    if(session.readinessAsked||root.__readinessPreparingId===id)return;
    root.__readinessPreparingId=id;
    try{await computeBaselines(session);if(root.st?.current?.id===session.id&&!session.readinessAsked)askReadiness()}finally{if(root.__readinessPreparingId===id)root.__readinessPreparingId=null}
  }

  function trimVolume(exercise,d){const sets=Array.isArray(exercise?.set)?exercise.set:null;if(!sets?.length)return;let keep=sets.length;if(d.volumeFactor<1)keep=Math.max(1,Math.ceil(sets.length*d.volumeFactor));else if(d.dropSets)keep=Math.max(1,sets.length-d.dropSets);if(keep<sets.length){exercise.readinessRemovedSets=sets.slice(keep);exercise.set=sets.slice(0,keep)}}
  function applyReadiness(d,useAdjust){
    const session=root.st?.current;if(!session)return;
    session.readiness=d;session.keepPlannedWeights=!useAdjust;
    root.st.readinessLog.push({date:session.date,sessionId:session.id,...d});root.st.readinessLog=root.st.readinessLog.slice(-120);
    (session.ex||[]).forEach(exercise=>{
      const step=loadStep(exercise,[]);
      (exercise.set||[]).forEach(set=>{
        if(set.ok||set.manualOverride||!(number(set.plannedW)>0))return;
        set.w=useAdjust?roundLoad(number(set.plannedW)*d.factor,step):number(set.plannedW);
      });
      if(useAdjust&&d.factor<1)trimVolume(exercise,d);
    });
    try{root.save?.()}catch(e){};try{root.startPage?.()}catch(e){};root.toast?.(useAdjust?d.advice:'Оставлены рассчитанные рабочие веса');
  }
  function confirmReadiness(useAdjust){if(!root.st?.current)return root.closeModal?.();const data=readinessData();root.closeModal?.();applyReadiness(data,useAdjust)}

  function firstCompletedSetIndex(exercise){return (exercise?.set||[]).findIndex(set=>set?.ok)}
  function reviewFirstSet(ei,si){const exercise=root.st?.current?.ex?.[ei],set=exercise?.set?.[si];if(!exercise||!set?.ok||exercise.readinessRpeReviewed||firstCompletedSetIndex(exercise)!==si)return;if(set.rpe===''||!Number.isFinite(Number(set.rpe))){root.toast?.('Укажи RPE первого подхода для проверки веса');return}const target=targetRpe(exercise,set,root.st?.current),actual=number(set.rpe),difference=actual-target;if(difference<1){exercise.readinessRpeReviewed=true;try{root.save?.()}catch(e){};return}const reduction=difference>=2?10:5;exercise.readinessPendingReduction=reduction;root.modal?.(`<div class="sheet-grabber"></div><h2>Вес выше готовности</h2><div class="muted">Первый подход: RPE ${actual}. Цель: RPE ${target}.</div><div class="readiness-result" style="margin-top:14px"><b>Снизить оставшиеся веса на ${reduction}%?</b><div class="muted small">Выполненный подход не изменится.</div></div><button class="btn primary full" onclick="advApplyRpeCorrection(${ei},${si},${reduction})">Снизить на ${reduction}%</button><button class="btn full" style="margin-top:10px" onclick="advKeepRpeWeight(${ei})">Оставить вес</button>`)}
  function applyRpeCorrection(ei,si,reduction){const exercise=root.st?.current?.ex?.[ei];if(!exercise)return root.closeModal?.();const step=loadStep(exercise,[]);(exercise.set||[]).forEach((set,index)=>{if(index===si||set.ok||number(set.w)<=0)return;if(set.plannedW==null)set.plannedW=number(set.w);set.w=roundLoad(number(set.w)*(1-number(reduction)/100),step)});exercise.readinessRpeReviewed=true;delete exercise.readinessPendingReduction;try{root.save?.()}catch(e){};root.closeModal?.();try{root.startPage?.()}catch(e){};root.toast?.(`Оставшиеся веса снижены на ${reduction}%`)}
  function keepRpeWeight(ei){const exercise=root.st?.current?.ex?.[ei];if(exercise){exercise.readinessRpeReviewed=true;delete exercise.readinessPendingReduction;try{root.save?.()}catch(e){}}root.closeModal?.();root.toast?.('Вес оставлен')}

  root.advReadinessData=readinessData;root.advReadinessPreview=readinessPreview;root.advAskReadiness=askReadiness;root.advApplyReadinessToCurrent=applyReadiness;root.advConfirmReadiness=confirmReadiness;root.advApplyRpeCorrection=applyRpeCorrection;root.advKeepRpeWeight=keepRpeWeight;root.advComputeBaselines=computeBaselines;root.advPrepareBaseline=prepareAndAsk;

  function wrapStart(name){
    const fn=root[name];if(typeof fn!=='function'||fn.__readinessV193)return;
    const wrapped=function(){const r=fn.apply(this,arguments);Promise.resolve(r).finally(()=>setTimeout(prepareAndAsk,0));return r};
    wrapped.__readinessV193=true;wrapped.__readinessInner=fn;root[name]=wrapped;
    try{if(name==='beginProgramDay')beginProgramDay=wrapped;else if(name==='begin')begin=wrapped;else if(name==='beginRemotePlan')beginRemotePlan=wrapped}catch(_){}
  }
  function wrapToggle(){const fn=root.toggleSet;if(typeof fn!=='function'||fn.__readinessRpeV193)return;const wrapped=function(ei,si){const exercise=root.st?.current?.ex?.[ei],set=exercise?.set?.[si],was=!!set?.ok;const result=fn.apply(this,arguments);if(!was&&set?.ok)setTimeout(()=>reviewFirstSet(ei,si),0);return result};wrapped.__readinessRpeV193=true;root.toggleSet=wrapped;try{toggleSet=wrapped}catch(_){}}
  function wrapEditSet(){const fn=root.editSet;if(typeof fn!=='function'||fn.__readinessRpeV193)return;const wrapped=function(ei,si,key,value){const result=fn.apply(this,arguments);if(key==='rpe')setTimeout(()=>reviewFirstSet(ei,si),0);return result};wrapped.__readinessRpeV193=true;root.editSet=wrapped;try{editSet=wrapped}catch(_){}}
  function install(){['begin','beginProgramDay','beginRemotePlan'].forEach(wrapStart);wrapToggle();wrapEditSet()}
  install();[300,900,1800,3500,6000,10000].forEach(t=>setTimeout(install,t));
})();
