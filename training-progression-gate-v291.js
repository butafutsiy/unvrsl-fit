'use strict';
(()=>{
  const W=window,D=document,REV=291;
  if(W.__unvrslTrainingProgressionGateV291)return;
  W.__unvrslTrainingProgressionGateV291=true;
  // Compatibility flag: old loaders must not start v290 beside this finalizer.
  W.__unvrslTrainingProgressionGateV290=true;
  W.__unvrslCanonicalRecommendationOwner='training-load-model-v258+progression-finalizer-v291';

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const num=v=>N(v)??0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
  const median=a=>{a=(a||[]).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const key=e=>e?.sourceId?`id:${e.sourceId}`:`n:${base(e?.n).toLowerCase()}`;
  const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===base(n).toLowerCase();
  const round=(v,s)=>v==null||!Number.isFinite(v)?null:Math.max(0,Math.round(v/s)*s);

  function method(ex){return String(ex?.trainingEstimate200?.method||ex?.method||(/UNVRSL/i.test(ex?.n||'')?'UNVRSL':/FST-?7/i.test(ex?.n||'')?'FST-7':/SLDR/i.test(ex?.n||'')?'SLDR':/\bDS\b|DROP/i.test(ex?.n||'')?'DS':'STANDARD')).toUpperCase()}
  function assisted(ex){return /гравитрон|assisted|помощ/.test(base(ex?.n).toLowerCase())}
  function exerciseClass(ex){
    if(method(ex)!=='STANDARD')return'method';
    const n=base(ex?.n).toLowerCase(),meta=`${ex?.equipment||''} ${ex?.type||''} ${ex?.kind||''}`.toLowerCase();
    if(/подтяг|брусь|отжиман.*брусь|гравитрон/.test(n))return'bodyweight';
    if(/развед|сведен|мах|под[ъь]ем.*бицеп|сгибан.*рук|разгибан.*рук|трицеп|бицеп|француз|икр|носок|разгибан.*ног|сгибан.*ног|отведен|приведен|кикбэк|скручив|пуловер/.test(n))return'isolation';
    if(/тренаж|хаммер|hammer|жим ногами|гакк|hack|машин|блок|вертикальн.*тяг|горизонтальн.*тяг|верхн.*тяг|нижн.*тяг|смита|smith/.test(`${n} ${meta}`))return'machine';
    return'compound'
  }
  function equipmentStep(ex,rows=[]){
    let s=2.5;
    try{s=Number(W.loadStepFor?.(base(ex?.n),ex?.sourceId||null))||s}catch(_){}
    const m=median(rows.map(x=>num(x.w)).filter(x=>x>0))||median((ex?.set||[]).map(x=>num(x.w)).filter(x=>x>0))||0;
    if(m>0&&m<=6)s=Math.min(s,.5);else if(m>0&&m<=12)s=Math.min(s,1);else if(m>0&&m<=22)s=Math.min(s,2);
    return s
  }
  function targetRpe(ex,set,cur){return [N(set?.targetRpeResolved),N(set?.targetRpe),N(ex?.targetRpe),N(ex?.rpeTarget),N(ex?.target),N(cur?.target),8].find(x=>x!=null&&x>0)||8}
  function fallbackRange(ex){
    const sets=ex?.set||[],mins=sets.map(s=>N(s?.targetRepMin??s?.rMin)).filter(x=>x>0),maxs=sets.map(s=>N(s?.targetRepMax??s?.rMax)).filter(x=>x>0);
    const single=median(sets.map(s=>N(s?.r)).filter(x=>x>0));
    const lo=median(mins)||single||null,hi=median(maxs)||lo;
    return lo>0?{lo,hi:hi>=lo?hi:lo}:null
  }
  function bodyWeightAt(date){
    const list=Array.isArray(W.st?.bw)?W.st.bw:[];
    if(!list.length)return N(W.st?.bodyWeight)||N(W.st?.weight)||null;
    const t=date?new Date(`${String(date).slice(0,10)}T23:59:59`).getTime():Date.now();
    let best=null,bestT=-Infinity;
    for(const item of list){const w=N(item?.w??item?.weight),d=new Date(`${String(item?.date||item?.d||'').slice(0,10)}T12:00:00`).getTime();if(w>0&&Number.isFinite(d)&&d<=t&&d>bestT){best=w;bestT=d}}
    if(best>0)return best;
    for(let i=list.length-1;i>=0;i--){const w=N(list[i]?.w??list[i]?.weight);if(w>0)return w}
    return null
  }
  function readinessWeight(v,ex,cur,stp=equipmentStep(ex)){
    const value=N(v);if(!(value>=0))return null;
    const f=cur?.trainingReadinessDone&&cur?.readinessAdjusted?N(cur?.readiness?.factor)||1:1;
    if(Math.abs(f-1)<.001)return round(value,stp);
    if(exerciseClass(ex)==='bodyweight'){
      const bw=bodyWeightAt(cur?.date);if(bw>0){
        const sys=assisted(ex)?Math.max(1,bw-value):bw+value;
        const todaySys=sys*f;
        const external=assisted(ex)?Math.max(0,bw-todaySys):Math.max(0,todaySys-bw);
        return round(external,stp)
      }
    }
    return round(value*f,stp)
  }

  function migrateActualFields(){
    let changed=false;
    const all=[];
    if(W.st?.current)all.push(W.st.current);
    if(Array.isArray(W.st?.sessions))all.push(...W.st.sessions.slice(-12));
    all.forEach(s=>(s?.ex||[]).forEach(ex=>(ex?.set||[]).forEach(set=>{
      if(!set?.ok)return;
      const r=N(set.actualReps??set.r),rp=N(set.actualRpe??set.rpe),ri=N(set.actualRir??set.rir);
      if(r>0&&N(set.actualReps)!==r){set.actualReps=r;changed=true}
      if(rp!=null&&N(set.actualRpe)!==rp){set.actualRpe=rp;changed=true}
      if(ri!=null&&N(set.actualRir)!==ri){set.actualRir=ri;changed=true}
      if(N(set.actualRir)==null&&rp!=null){set.actualRir=clamp(10-rp,0,10);changed=true}
      if(N(set.actualRpe)==null&&ri!=null){set.actualRpe=clamp(10-ri,1,10);changed=true}
    })));
    return changed
  }

  function rowsFromSession(s,ex,currentRange,cur){
    const out=[];
    (s?.ex||[]).forEach(e=>{
      if(!same(e,ex?.n,ex?.sourceId))return;
      (e.set||[]).forEach(x=>{
        if(!x?.ok)return;
        const w=N(x.w),r=N(x.actualReps??x.r);if(!(w>=0)||!(r>0))return;
        let rpe=N(x.actualRpe??x.rpe),rir=N(x.actualRir??x.rir),estimated=false;
        if(rir==null&&rpe!=null)rir=10-rpe;
        if(rpe==null&&rir!=null)rpe=10-rir;
        if(rpe==null){rpe=targetRpe(e,x,s)||targetRpe(ex,null,cur);rir=clamp(10-rpe,0,10);estimated=true}
        const lo=N(x.targetRepMin??x.rMin)??currentRange?.lo??null;
        const hi0=N(x.targetRepMax??x.rMax)??currentRange?.hi??lo;
        const hi=lo>0?Math.max(lo,hi0||lo):null;
        out.push({w,r,rpe,rir:clamp(rir??(10-rpe),0,10),lo,hi,estimatedRpe:estimated,date:s.date||s.workout_date||''})
      })
    });
    return out
  }
  function localLatest(ex,cur,currentRange){
    const list=Array.isArray(W.st?.sessions)?W.st.sessions:[];
    for(let i=list.length-1;i>=0;i--){const s=list[i];if(!s?.ended||String(s.id||'')===String(cur?.id||''))continue;const rows=rowsFromSession(s,ex,currentRange,cur);if(rows.length)return rows}
    return[]
  }
  const cloudCache=new Map();
  async function cloudLatest(ex,cur,currentRange){
    try{
      if(!W.cloud?.client||!W.cloud?.user?.id)return[];
      const ck=`${W.cloud.user.id}:${key(ex)}:${(W.st?.sessions||[]).length}`;
      if(cloudCache.has(ck))return cloudCache.get(ck);
      const q=await W.cloud.client.from('workouts').select('payload,workout_date').eq('user_id',W.cloud.user.id).order('workout_date',{ascending:false}).limit(20);
      if(q.error)return[];
      for(const row of q.data||[]){const p=row.payload||{};if(String(p.id||'')===String(cur?.id||''))continue;const rows=rowsFromSession({...p,date:p.date||row.workout_date,workout_date:row.workout_date},ex,currentRange,cur);if(rows.length){cloudCache.set(ck,rows);return rows}}
    }catch(e){console.warn('UNVRSL progression finalizer v291 cloud history',e)}
    return[]
  }
  async function latestRows(ex,cur){const range=fallbackRange(ex),local=localLatest(ex,cur,range);return local.length?local:cloudLatest(ex,cur,range)}

  function fmt1(v){const n=Number(v);if(!Number.isFinite(n))return'—';return String(Math.round(n*10)/10).replace('.',',')}
  function evaluateGate(ex,cur,rows){
    const cls=exerciseClass(ex);if(cls==='method'||!rows?.length)return null;
    const currentRange=fallbackRange(ex),fallbackLo=currentRange?.lo,fallbackHi=currentRange?.hi;
    const normalized=rows.map(r=>{const lo=N(r.lo)??fallbackLo,hi0=N(r.hi)??fallbackHi??lo,hi=lo>0?Math.max(lo,hi0||lo):null;return{...r,lo,hi}}).filter(r=>r.lo>0&&r.hi>=r.lo);
    if(!normalized.length)return null;
    const target=mean((ex.set||[]).map(s=>targetRpe(ex,s,cur)))||8;
    const actualRpes=normalized.filter(r=>!r.estimatedRpe).map(r=>r.rpe).filter(Number.isFinite);
    const avgRpe=mean(actualRpes.length?actualRpes:normalized.map(r=>r.rpe))??target;
    const avgReps=mean(normalized.map(r=>r.r))||0,avgMin=mean(normalized.map(r=>r.lo))||0,avgMax=mean(normalized.map(r=>r.hi))||avgMin;
    const positions=normalized.map(r=>r.hi>r.lo?(r.r-r.lo)/(r.hi-r.lo):(r.r>=r.lo?1:-1));
    const avgPosition=mean(positions)||0;
    const topCount=normalized.filter(r=>r.r>=r.hi).length,belowCount=normalized.filter(r=>r.r<r.lo).length;
    const topNeed=Math.max(1,Math.ceil(normalized.length*.75)),topReady=topCount>=topNeed,rpeDelta=avgRpe-target,hasActualEffort=actualRpes.length>0;
    let status='HOLD',code='range_progress',reason=`${fmt1(avgReps)}/${fmt1(avgMax)} повт. · сначала добери диапазон`;
    if((belowCount>0&&rpeDelta>=1)||(avgReps<avgMin-.5&&rpeDelta>=.5)){
      status='DOWN';code='below_range_high_rpe';reason=`повторы ниже ${fmt1(avgMin)} · RPE ${fmt1(avgRpe)} выше цели ${fmt1(target)}`;
    }else if(topReady&&rpeDelta<=.5){
      status='UP';code='top_range_target_rpe';reason=`верх диапазона выполнен · RPE ${fmt1(avgRpe)} в цели`;
    }else if(topReady&&rpeDelta>.5){
      status='HOLD';code='top_range_high_rpe';reason=`верх диапазона есть · RPE ${fmt1(avgRpe)} выше цели ${fmt1(target)}`;
    }else if(cls==='compound'&&hasActualEffort&&avgReps>=avgMin&&rpeDelta<=-1.25){
      status='EARLY_UP';code='compound_easy';reason=`${fmt1(avgReps)} повт. · RPE ${fmt1(avgRpe)} заметно ниже цели`;
    }else if(cls==='machine'&&hasActualEffort&&avgPosition>=.5&&rpeDelta<=-1){
      status='EARLY_UP';code='machine_easy_midrange';reason=`диапазон освоен больше чем наполовину · RPE ${fmt1(avgRpe)} ниже цели`;
    }else if(cls==='isolation'){
      status='HOLD';code='isolation_double_progression';reason=`${fmt1(avgReps)}/${fmt1(avgMax)} повт. · вес после верхней границы`;
    }else if(cls==='bodyweight'&&hasActualEffort&&avgReps>=avgMin&&rpeDelta<=-1.25){
      status='EARLY_UP';code='bodyweight_easy';reason=`${fmt1(avgReps)} повт. · запас выше цели`;
    }
    return{status,code,reason,class:cls,targetRpe:+target.toFixed(1),avgRpe:+avgRpe.toFixed(1),avgReps:+avgReps.toFixed(1),repMin:+avgMin.toFixed(1),repMax:+avgMax.toFixed(1),topCount,topNeed,belowCount,actualEffort:hasActualEffort,revision:REV}
  }
  function isDeload(cur){const max=N(cur?.programWeekIntensityMax);if(max>0&&max<=67)return true;if(!(cur?.programId||cur?.planId||cur?.programName)&&[4,6].includes(Number(cur?.w)))return true;return false}
  function harder(v,prev,isAssist){return isAssist?v<prev-.001:v>prev+.001}
  function oneHarder(prev,stp,isAssist){return isAssist?Math.max(0,prev-stp):prev+stp}
  function oneEasier(prev,stp,isAssist){return isAssist?prev+stp:Math.max(0,prev-stp)}
  function gateWeight(modelRec,prev,gate,ex,cur,stp){
    let rec=N(modelRec);if(!(rec>=0)||!(prev>=0)||!gate)return rec;if(isDeload(cur))return rec;
    const isAssist=assisted(ex);
    if(gate.status==='HOLD')return harder(rec,prev,isAssist)?prev:rec;
    if(gate.status==='DOWN')return oneEasier(prev,stp,isAssist);
    if(gate.status==='UP')return oneHarder(prev,stp,isAssist);
    if(gate.status==='EARLY_UP')return harder(rec,prev,isAssist)?oneHarder(prev,stp,isAssist):rec;
    return rec
  }

  function exerciseGroups(cur){const map=new Map();(cur?.ex||[]).forEach(ex=>{const k=key(ex);if(!map.has(k))map.set(k,[]);map.get(k).push(ex)});return[...map.values()]}
  async function applyGroup(group,cur){
    const first=group[0];if(!first||first.mode==='cardio'||method(first)!=='STANDARD')return false;
    const rows=await latestRows(first,cur);if(!rows.length)return false;
    const gate=evaluateGate(first,cur,rows);if(!gate)return false;
    const prev=median(rows.map(r=>r.w).filter(x=>x>=0));if(prev==null)return false;
    const stp=equipmentStep(first,rows);let changed=false;
    group.forEach(ex=>{
      ex.trainingProgression291={...gate,previousWeight:prev,step:stp,deload:isDeload(cur)};
      ex.trainingProgression290=ex.trainingProgression291;
      (ex.set||[]).forEach(set=>{
        if(set.ok||set.manualOverride)return;
        const raw=N(set.recommendedW);if(raw==null)return;
        const after=round(gateWeight(raw,prev,gate,ex,cur,stp),stp);
        set.progressionGateV291={...gate,modelRecommendedW:raw,finalRecommendedW:after};
        set.progressionGateV290=set.progressionGateV291;
        if(after!=null&&N(set.recommendedW)!==after){set.recommendedW=after;changed=true}
        if(ex.programWeightMode!=='prescribed'&&after!=null){
          if(N(set.plannedW)!==after){set.plannedW=after;set.baselineW=after;set.baselineSource='adaptive_load_model+rep_gate_v291';changed=true}
          const today=readinessWeight(after,ex,cur,stp);if(today!=null&&N(set.w)!==today){set.w=today;changed=true}
        }
      });
      if(ex.programWeightMode!=='prescribed')ex.weightDecision='adaptive_auto';
    });
    return changed
  }
  async function applyFinal(cur=W.st?.current){
    if(!cur?.id||cur.ended)return false;
    let changed=migrateActualFields();
    for(const group of exerciseGroups(cur)){if(await applyGroup(group,cur))changed=true}
    if(changed){cur.trainingProgressionRevision=REV;cur.trainingProgressionAt=new Date().toISOString();try{W.save?.()}catch(_){}}
    return changed
  }

  function fmtWeights(a){const vals=(a||[]).map(N).filter(x=>x!=null&&x>=0),unique=[];vals.forEach(x=>{if(!unique.some(y=>Math.abs(y-x)<.001))unique.push(x)});return unique.length?unique.map(v=>String(v).replace('.',',')).join(' / '):'—'}
  function readinessPercent(cur){if(!cur?.trainingReadinessDone||!cur?.readinessAdjusted)return'';const p=Math.round(((N(cur?.readiness?.factor)||1)-1)*1000)/10;return`${p>0?'+':''}${String(p).replace('.',',')}%`}
  function refreshDom(cur=W.st?.current){
    const root=D.getElementById('start');if(!cur||!root)return;
    const cards=[...root.querySelectorAll('.exercise')],seen=new Set();
    (cur.ex||[]).forEach((ex,i)=>{
      if(ex?.mode==='cardio'||method(ex)!=='STANDARD')return;
      const k=key(ex);if(seen.has(k))return;seen.add(k);
      const group=(cur.ex||[]).filter(x=>key(x)===k),meta=group.map(x=>x.trainingProgression291||x.trainingProgression290).find(Boolean);if(!meta)return;
      const card=cards[i];if(!card)return;const rp=readinessPercent(cur),rec=card.querySelector('.te200-rec');
      if(rec){
        const today=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(N(s.recommendedW)!=null)today.push(readinessWeight(s.recommendedW,g,cur,equipmentStep(g)))}));
        const b=rec.querySelector('b'),sp=rec.querySelector('span');if(b&&today.length)b.textContent=`Рекомендация · ${fmtWeights(today)} кг`;if(sp)sp.textContent=`${meta.reason}${rp?` · самочувствие ${rp}`:''}`;
      }
      const auto=card.querySelector('.te200-auto');if(auto){const today=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(N(s.w)!=null)today.push(N(s.w))}));if(today.length)auto.textContent=`Автовес · ${fmtWeights(today)} кг · ${meta.reason}${rp?` · самочувствие ${rp}`:''}`}
    })
  }

  let wrapping=false;
  function wrapLoadModel(){
    const model=W.trainingLoadModel258;if(!model||typeof model.run!=='function')return false;
    const current=model.run;if(current.__unvrslFinalRecommendationV291)return true;
    // Preserve prescription bridge order whichever module loaded first.
    const wrapped=async function(){
      const tick=W.trainingEngine200Tick;
      let result;
      try{
        // The raw model may write an intermediate recommendation. Do not render it.
        if(typeof tick==='function')W.trainingEngine200Tick=function(){};
        result=await current.apply(this,arguments);
      }finally{
        if(typeof tick==='function')W.trainingEngine200Tick=tick;
      }
      const cur=W.st?.current;
      if(cur?.id&&!cur.ended)await applyFinal(cur);
      try{tick?.()}catch(_){ }
      queueMicrotask(()=>refreshDom(cur));
      return result
    };
    wrapped.__unvrslFinalRecommendationV291=true;
    wrapped.__unvrslFinalRecommendationBase=current;
    // Preserve bridge markers so it does not wrap the same chain endlessly.
    if(current.__prescriptionBridgeV288)wrapped.__prescriptionBridgeV288=true;
    model.run=wrapped;
    return true
  }

  let syncing=false;
  async function sync(force=false){
    if(syncing)return false;syncing=true;
    try{
      wrapLoadModel();
      const model=W.trainingLoadModel258,cur=W.st?.current;
      if(force&&model?.run&&cur?.id&&!cur.ended)await model.run(true);
      else if(cur?.id&&!cur.ended){await applyFinal(cur);try{W.trainingEngine200Tick?.()}catch(_){ }refreshDom(cur)}
      return true
    }catch(e){console.warn('UNVRSL progression finalizer v291',e);return false}finally{syncing=false}
  }

  W.unvrslTrainingProgressionApplyV291=applyFinal;
  W.unvrslTrainingProgressionSyncV291=sync;
  W.unvrslTrainingProgressionSyncV290=sync;
  W.unvrslTrainingReadinessWeightV291=readinessWeight;
  W.unvrslTrainingReadinessWeightV290=readinessWeight;
  W.unvrslTrainingEvaluateRepGateV291=evaluateGate;
  W.unvrslTrainingEvaluateRepGateV290=evaluateGate;

  // Event driven only: no 700 ms permanent polling loop.
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled','unvrsl:readiness-ready'].forEach(ev=>W.addEventListener?.(ev,()=>{wrapLoadModel();if(ev==='unvrsl:training-engine-ready'||ev==='unvrsl:readiness-ready')sync(true)}, {passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden){wrapLoadModel();sync(false)}},{passive:true});
  [0,80,220,600,1400].forEach(ms=>setTimeout(()=>{wrapLoadModel();if(ms===600)sync(true)},ms));
})();