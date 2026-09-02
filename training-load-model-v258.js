'use strict';
(()=>{
  const W=window,D=document,REV=258,LAMBDA=.65;
  if(W.__unvrslTrainingLoadModelV258)return;
  W.__unvrslTrainingLoadModelV258=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const num=v=>N(v)??0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
  const median=a=>{a=(a||[]).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const sd=a=>{a=(a||[]).filter(Number.isFinite);if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const key=e=>e?.sourceId?`id:${e.sourceId}`:`n:${base(e?.n).toLowerCase()}`;
  const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===base(n).toLowerCase();
  const target=(ex,set,cur)=>[N(set?.targetRpe),N(ex?.targetRpe),N(ex?.rpeTarget),N(ex?.target),N(ex?.rpe),N(cur?.target),8].find(x=>x!=null&&x>0)||8;
  const method=ex=>String(ex?.trainingEstimate200?.method||ex?.method||(/UNVRSL/i.test(ex?.n||'')?'UNVRSL':/FST-?7/i.test(ex?.n||'')?'FST-7':/SLDR/i.test(ex?.n||'')?'SLDR':/\bDS\b|DROP/i.test(ex?.n||'')?'DS':'STANDARD')).toUpperCase();
  const WEEK=Object.freeze({1:[.70,.75],2:[.75,.80],3:[.80,.85],4:[.60,.65],5:[.85,.88],6:[.60,.65],7:[.88,.90],8:[.90,1.00]});

  function equipmentStep(ex,rows=[]){
    let s=2.5;
    try{s=Number(W.loadStepFor?.(base(ex?.n),ex?.sourceId||null))||s}catch(_){}
    const m=median((rows||[]).map(x=>x.w).filter(x=>x>0))||median((ex?.set||[]).map(x=>num(x.w)).filter(x=>x>0))||0;
    if(m>0&&m<=6)s=Math.min(s,.5);else if(m>0&&m<=12)s=Math.min(s,1);else if(m>0&&m<=22)s=Math.min(s,2);
    return s
  }
  const round=(v,s)=>v==null||!Number.isFinite(v)?null:Math.max(0,Math.round(v/s)*s);

  function exerciseKind(ex){
    const n=base(ex?.n).toLowerCase(),m=method(ex);
    if(m!=='STANDARD')return'method';
    if(/подтяг|брусь|отжиман.*брусь|гравитрон/.test(n))return'bodyweight';
    if(/развед|сведен|мах|под[ъь]ем.*бицеп|сгибан.*рук|разгибан.*рук|трицеп|бицеп|француз|икр|носок|разгибан.*ног|сгибан.*ног|отведен|приведен|кикбэк|скручив|пуловер/.test(n))return'isolation';
    return'compound'
  }
  function isAssisted(ex){return /гравитрон|assisted|помощ/.test(base(ex?.n).toLowerCase())}
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
  function systemLoad(w,ex,date){
    if(exerciseKind(ex)!=='bodyweight')return w;
    const bw=bodyWeightAt(date);if(!(bw>0))return w;
    return isAssisted(ex)?Math.max(1,bw-w):bw+w
  }
  function externalLoad(load,ex,date){
    if(exerciseKind(ex)!=='bodyweight')return load;
    const bw=bodyWeightAt(date);if(!(bw>0))return load;
    return isAssisted(ex)?Math.max(0,bw-load):Math.max(0,load-bw)
  }

  function rowsFromSession(s,ex){
    const out=[];
    (s?.ex||[]).forEach(e=>{
      if(!same(e,ex?.n,ex?.sourceId))return;
      (e.set||[]).forEach(x=>{
        if(!x?.ok)return;const w=N(x.w),r=N(x.r);if(!(w>=0)||!(r>0))return;
        let rpe=N(x.rpe),rir=N(x.rir),estimated=false;
        if(rir==null&&rpe!=null)rir=10-rpe;
        if(rpe==null&&rir!=null)rpe=10-rir;
        if(rpe==null){rpe=target(e,x,s);rir=clamp(10-rpe,0,10);estimated=true}
        rir=clamp(rir??(10-rpe),0,10);
        out.push({w,r,rpe,rir,date:s.date||s.workout_date||'',estimatedRpe:estimated,sessionId:String(s.id||s.sessionId||s.date||s.workout_date||'')})
      })
    });
    return out
  }

  function localSessions(ex,cur,limit=5){
    const found=[];
    const list=Array.isArray(W.st?.sessions)?W.st.sessions:[];
    for(let i=list.length-1;i>=0&&found.length<limit;i--){const s=list[i];if(!s?.ended||String(s.id||'')===String(cur?.id||''))continue;const rows=rowsFromSession(s,ex);if(rows.length)found.push({session:s,rows})}
    return found
  }
  async function cloudSessions(ex,cur,limit=5){
    try{
      if(!W.cloud?.client||!W.cloud?.user?.id)return[];
      const q=await W.cloud.client.from('workouts').select('payload,workout_date').eq('user_id',W.cloud.user.id).order('workout_date',{ascending:false}).limit(50);
      if(q.error)return[];const out=[];
      for(const row of q.data||[]){const p=row.payload||{};if(String(p.id||'')===String(cur?.id||''))continue;const rows=rowsFromSession({...p,date:p.date||row.workout_date,workout_date:row.workout_date},ex);if(rows.length)out.push({session:{...p,date:p.date||row.workout_date},rows});if(out.length>=limit)break}
      return out
    }catch(e){console.warn('UNVRSL load model cloud history',e);return[]}
  }
  async function sessionHistory(ex,cur){
    const local=localSessions(ex,cur,5);
    if(local.length>=3)return local;
    const cloud=await cloudSessions(ex,cur,5);
    const seen=new Set(local.map(x=>String(x.session?.id||x.session?.date||''))),out=[...local];
    for(const item of cloud){const id=String(item.session?.id||item.session?.date||'');if(id&&seen.has(id))continue;seen.add(id);out.push(item);if(out.length>=5)break}
    return out
  }

  function rowE1rm(row,ex){const load=systemLoad(num(row.w),ex,row.date);return load>0?load*(1+(num(row.r)+clamp(num(row.rir),0,10))/30):null}
  function robustEstimate(history,ex){
    const sessions=[];
    (history||[]).forEach((item,index)=>{
      const vals=item.rows.map(r=>rowE1rm(r,ex)).filter(x=>x>0),e=median(vals);if(!(e>0))return;
      const actual=item.rows.filter(r=>!r.estimatedRpe).length/item.rows.length;
      sessions.push({e,quality:.55+.45*actual,recency:LAMBDA**index,rows:item.rows})
    });
    if(!sessions.length)return null;
    let es=sessions.map(x=>x.e),m=median(es);
    let kept=sessions.filter(x=>x.e>=m*.82&&x.e<=m*1.18);if(!kept.length)kept=sessions;
    const den=kept.reduce((s,x)=>s+x.quality*x.recency,0),cap=kept.reduce((s,x)=>s+x.e*x.quality*x.recency,0)/(den||1);
    const cv=cap>0?sd(kept.map(x=>x.e))/cap:1,actualRatio=mean(kept.map(x=>x.quality))||0;
    let confidence='низкая';if(kept.length>=3&&cv<=.07&&actualRatio>=.75)confidence='высокая';else if(kept.length>=2&&cv<=.12)confidence='средняя';
    return{e1rm:cap,sessions:kept.length,cv,confidence,rows:kept.flatMap(x=>x.rows),lastRows:history?.[0]?.rows||[]}
  }

  function ownerCycle(cur){
    if(cur?.programId||cur?.planId||cur?.programName)return false;
    const w=N(cur?.w);if(!(w>=1&&w<=8)||!cur?.c)return false;
    try{return (W.UNVRSL_ROUTINES||[]).some(r=>Number(r?.w)===w&&String(r?.c||'')===String(cur.c||''))}catch(_){return false}
  }
  function previousWeight(est){return median((est?.lastRows||est?.rows||[]).map(x=>x.w).filter(x=>x>0))}
  function previousRpe(est){const actual=(est?.lastRows||[]).filter(x=>!x.estimatedRpe&&N(x.rpe)!=null);return mean((actual.length?actual:(est?.lastRows||[])).map(x=>N(x.rpe)).filter(Number.isFinite))}
  function previousReps(est){return mean((est?.lastRows||[]).map(x=>N(x.r)).filter(Number.isFinite))}

  function compoundWeight(ex,set,cur,est,programW,stp){
    const reps=Math.max(1,num(set?.r)||previousReps(est)||8),rpe=target(ex,set,cur),rir=clamp(10-rpe,0,10);
    let raw=est.e1rm/(1+(reps+rir)/30);
    const prev=previousWeight(est);
    if(prev>0)raw=clamp(raw,prev*.925,prev*1.05);
    if(programW>0){raw=clamp(raw,programW*.925,programW*1.05);if(ownerCycle(cur)&&(Number(cur.w)===4||Number(cur.w)===6))raw=Math.min(raw,programW)}
    if(ownerCycle(cur)&&WEEK[Number(cur.w)]){const [,hi]=WEEK[Number(cur.w)],cap=est.e1rm*hi;raw=Math.min(raw,cap)}
    return round(raw,stp)
  }
  function isolationWeight(ex,set,cur,est,programW,stp){
    const prev=previousWeight(est)||programW||num(set?.w),pr=previousRpe(est),reps=previousReps(est),goal=target(ex,set,cur),goalReps=num(set?.r)||reps||10;
    if(!(prev>0))return null;let raw=prev;
    if(pr!=null&&pr<=goal-.75&&reps>=goalReps)raw=prev+stp;
    else if(pr!=null&&pr>=goal+1)raw=Math.max(stp,prev-stp);
    if(programW>0)raw=clamp(raw,programW-stp,programW+stp);
    if(ownerCycle(cur)&&(Number(cur.w)===4||Number(cur.w)===6)&&programW>0)raw=Math.min(raw,programW);
    return round(raw,stp)
  }
  function bodyweightWeight(ex,set,cur,est,programW,stp){
    const reps=Math.max(1,num(set?.r)||previousReps(est)||6),rpe=target(ex,set,cur),rir=clamp(10-rpe,0,10),today=cur?.date||new Date().toISOString().slice(0,10);
    const sys=est.e1rm/(1+(reps+rir)/30),extra=externalLoad(sys,ex,today),prev=previousWeight(est);
    let raw=extra;if(prev>=0)raw=clamp(raw,Math.max(0,prev-2*stp),prev+2*stp);if(programW>0)raw=clamp(raw,Math.max(0,programW-2*stp),programW+2*stp);
    return round(raw,stp)
  }
  function blockMethodWeights(ex,sets,cur,est,programWeights,stp){
    const last=est?.lastRows||[],prev=median(last.map(x=>x.w).filter(x=>x>0)),pr=mean(last.filter(x=>!x.estimatedRpe).map(x=>x.rpe).filter(Number.isFinite)),goal=mean(sets.map(s=>target(ex,s,cur)))||8;
    if(!(prev>0))return null;let factor=1;if(pr!=null&&pr<=goal-.75)factor=(prev+stp)/prev;else if(pr!=null&&pr>=goal+1)factor=Math.max(stp,prev-stp)/prev;
    return sets.map((s,i)=>{const p=num(programWeights[i])||num(s.w)||prev;let raw=p*factor;if(num(programWeights[i])>0)raw=clamp(raw,Math.max(stp,p-stp),p+stp);return round(raw,stp)})
  }

  function confidenceMeta(ex,cur,est){
    const band=ownerCycle(cur)&&WEEK[Number(cur.w)]?`${Math.round(WEEK[Number(cur.w)][0]*100)}–${Math.round(WEEK[Number(cur.w)][1]*100)}%`:null;
    return{modelVersion:REV,kind:exerciseKind(ex),confidence:est?.confidence||'низкая',historySessions:est?.sessions||0,historyCv:est?.cv!=null?+est.cv.toFixed(3):null,weekBand:band}
  }

  function exerciseGroups(cur){
    const map=new Map();
    (cur?.ex||[]).forEach((ex,i)=>{const k=key(ex);if(!map.has(k))map.set(k,{k,items:[]});map.get(k).items.push({ex,i})});
    return[...map.values()]
  }
  async function calculateGroup(group,cur){
    const first=group?.items?.[0]?.ex;if(!first||first?.mode==='cardio')return false;
    const hist=await sessionHistory(first,cur),est=robustEstimate(hist,first);if(!est)return false;
    const flat=group.items.flatMap(({ex,i})=>(ex.set||[]).map((set,si)=>({ex,set,ei:i,si}))),stp=equipmentStep(first,est.rows),m=method(first);
    const programWeights=flat.map(x=>num(x.set.programW));
    let values=null;
    if(m==='UNVRSL'&&W.UNVRSL_METHOD_V211?.aggregateRecommendation){
      const result=W.UNVRSL_METHOD_V211.aggregateRecommendation(est.rows,flat.map(x=>num(x.set.programW)||num(x.set.plannedW)||num(x.set.w)),flat.map(x=>num(x.set.r)),flat.map(x=>target(x.ex,x.set,cur)),stp);
      if(result?.weights?.length){values=result.weights.map((v,i)=>{let raw=num(v),p=programWeights[i];if(p>0){raw=clamp(raw,p*.925,p*1.05);if(ownerCycle(cur)&&(Number(cur.w)===4||Number(cur.w)===6))raw=Math.min(raw,p)}return round(raw,stp)})}
    }else if(m!=='STANDARD')values=blockMethodWeights(first,flat.map(x=>x.set),cur,est,programWeights,stp);
    else values=flat.map((x,i)=>{const p=programWeights[i],kind=exerciseKind(x.ex);if(kind==='isolation')return isolationWeight(x.ex,x.set,cur,est,p,stp);if(kind==='bodyweight')return bodyweightWeight(x.ex,x.set,cur,est,p,stp);return compoundWeight(x.ex,x.set,cur,est,p,stp)});
    if(!values?.some(v=>v!=null&&v>=0))return false;

    flat.forEach((x,i)=>{
      const v=N(values[i]);if(v==null||v<0)return;const prescribed=x.ex.programWeightMode==='prescribed';x.set.recommendedW=v;
      if(!prescribed&&!x.set.ok&&!x.set.manualOverride){x.set.plannedW=v;x.set.baselineW=v;x.set.baselineSource='adaptive_load_model_v258';const f=cur?.trainingReadinessDone&&cur?.readinessAdjusted?num(cur?.readiness?.factor)||1:1;x.set.w=round(v*f,stp)}
    });
    group.items.forEach(({ex})=>{if(ex.programWeightMode!=='prescribed')ex.weightDecision=values.some(v=>v!=null)?'adaptive_auto':'calibration';ex.trainingEstimate200={...(ex.trainingEstimate200||{}),e1rm:+est.e1rm.toFixed(1),previousWeight:previousWeight(est),...confidenceMeta(ex,cur,est)}});
    return true
  }

  function patchWorkoutInputs(cur){
    const cards=[...D.querySelectorAll('#start .exercise')];
    (cur?.ex||[]).forEach((ex,ei)=>{const card=cards[ei];if(!card)return;const rows=[...card.querySelectorAll('.setrow')];(ex.set||[]).forEach((s,si)=>{const input=rows[si]?.querySelector('input');if(!input||D.activeElement===input)return;const v=N(s.w);if(v!=null&&String(input.value)!==String(v))input.value=v})})
  }
  function invalidateUi(cur){const root=D.getElementById('start');if(root)delete root.dataset.te200Sig;patchWorkoutInputs(cur);try{W.trainingEngine200Tick?.()}catch(_){} }

  let running=false,lastSig='',lastId='';
  function signature(cur){return JSON.stringify([cur?.id||'',cur?.trainingPreparedAt||'',cur?.trainingReadinessDone?num(cur?.readiness?.factor)||1:1,(cur?.ex||[]).map(ex=>[key(ex),ex.programWeightMode,(ex.set||[]).map(s=>[num(s.programW),num(s.r),target(ex,s,cur)])]),(W.st?.sessions||[]).length])}
  async function run(force=false){
    const cur=W.st?.current;if(!cur?.id||cur.ended||!W.__unvrslTrainingEngineV257)return false;
    const sig=signature(cur);if(!force&&sig===lastSig&&String(cur.id)===lastId)return false;if(running)return false;running=true;
    try{
      const groups=exerciseGroups(cur);let changed=false;
      for(const group of groups){if(await calculateGroup(group,cur))changed=true}
      if(changed){cur.trainingLoadModelRevision=REV;cur.trainingLoadModelAt=new Date().toISOString();try{W.save?.()}catch(_){}invalidateUi(cur)}
      lastSig=sig;lastId=String(cur.id);return changed
    }catch(e){console.warn('UNVRSL load model v258',e);return false}finally{running=false}
  }

  function wrapReadinessConfirm(){const fn=W.trainingConfirmReadiness200;if(typeof fn!=='function'||fn.__unvrslLoadModelV258)return;const wrapped=async function(){const r=await fn.apply(this,arguments);await run(true);return r};wrapped.__unvrslLoadModelV258=true;wrapped.__unvrslLoadModelBase=fn;W.trainingConfirmReadiness200=wrapped;try{trainingConfirmReadiness200=wrapped}catch(_){}}
  function boot(){wrapReadinessConfirm();run(false)}
  W.trainingLoadModel258={run,exerciseKind,version:REV};
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled'].forEach(name=>W.addEventListener?.(name,boot,{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)boot()},{passive:true});
  setInterval(boot,1200);[0,200,600,1500,3000].forEach(ms=>setTimeout(boot,ms));
})();
