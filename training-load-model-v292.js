'use strict';
(()=>{
  const W=window,D=document,REV=292,LAMBDA=.65;
  if(W.__unvrslTrainingLoadModelV292)return;
  W.__unvrslTrainingLoadModelV292=true;
  W.__unvrslTrainingLoadModelV260=true;
  W.__unvrslTrainingLoadModelV258=true;
  W.__unvrslTrainingProgressionGateV291=true;
  W.__unvrslTrainingProgressionGateV290=true;
  W.__unvrslCanonicalRecommendationOwner='training-load-model-v292';
  W.__unvrslRecommendationMathOwner='training-load-model-v292';

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const num=v=>N(v)??0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mean=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
  const median=a=>{a=(a||[]).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const sd=a=>{a=(a||[]).filter(Number.isFinite);if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};
  const key=e=>e?.sourceId?`id:${e.sourceId}`:`n:${base(e?.n).toLowerCase()}`;
  const same=(e,n,id)=>(id&&String(e?.sourceId||'')===String(id))||base(e?.n).toLowerCase()===base(n).toLowerCase();
  const round=(v,s)=>v==null||!Number.isFinite(v)?null:Math.max(0,Math.round(v/s)*s);
  const WEEK=Object.freeze({1:[.70,.75],2:[.75,.80],3:[.80,.85],4:[.60,.65],5:[.85,.88],6:[.60,.65],7:[.88,.90],8:[.90,1.00]});
  let cloudCache={at:0,user:'',rows:null};

  function targetRpe(ex,set,cur){return [N(set?.targetRpeResolved),N(set?.targetRpe),N(ex?.targetRpe),N(ex?.rpeTarget),N(ex?.target),N(ex?.rpe),N(cur?.target),8].find(x=>x!=null&&x>0)||8}
  function method(ex){return String(ex?.trainingEstimate200?.method||ex?.method||(/UNVRSL/i.test(ex?.n||'')?'UNVRSL':/FST-?7/i.test(ex?.n||'')?'FST-7':/SLDR/i.test(ex?.n||'')?'SLDR':/\bDS\b|DROP/i.test(ex?.n||'')?'DS':'STANDARD')).toUpperCase()}
  function exerciseClass(ex){
    if(method(ex)!=='STANDARD')return'method';
    const n=base(ex?.n).toLowerCase(),meta=`${ex?.equipment||''} ${ex?.type||''} ${ex?.kind||''}`.toLowerCase();
    if(/подтяг|брусь|отжиман.*брусь|гравитрон/.test(n))return'bodyweight';
    if(/развед|сведен|мах|под[ъь]ем.*бицеп|сгибан.*рук|разгибан.*рук|трицеп|бицеп|француз|икр|носок|разгибан.*ног|сгибан.*ног|отведен|приведен|кикбэк|скручив|пуловер/.test(n))return'isolation';
    if(/тренаж|хаммер|hammer|жим ногами|гакк|hack|машин|блок|вертикальн.*тяг|горизонтальн.*тяг|верхн.*тяг|нижн.*тяг|смита|smith/.test(`${n} ${meta}`))return'machine';
    return'compound'
  }
  function assisted(ex){return /гравитрон|assisted|помощ/.test(base(ex?.n).toLowerCase())}
  function equipmentStep(ex,rows=[]){
    let s=2.5;try{s=Number(W.loadStepFor?.(base(ex?.n),ex?.sourceId||null))||s}catch(_){}
    const m=median((rows||[]).map(x=>num(x.w)).filter(x=>x>0))||median((ex?.set||[]).map(x=>num(x.w)).filter(x=>x>0))||0;
    if(m>0&&m<=6)s=Math.min(s,.5);else if(m>0&&m<=12)s=Math.min(s,1);else if(m>0&&m<=22)s=Math.min(s,2);return s
  }
  function targetRange(ex,set=null){
    const sets=set?[set]:(ex?.set||[]),mins=sets.map(s=>N(s?.targetRepMin??s?.rMin)).filter(x=>x>0),maxs=sets.map(s=>N(s?.targetRepMax??s?.rMax)).filter(x=>x>0),single=median(sets.map(s=>N(s?.r)).filter(x=>x>0));
    const lo=median(mins)||single||null,hi0=median(maxs)||lo;return lo>0?{lo,hi:Math.max(lo,hi0||lo)}:null
  }
  function bodyWeightAt(date){
    const list=Array.isArray(W.st?.bw)?W.st.bw:[];if(!list.length)return N(W.st?.bodyWeight)||N(W.st?.weight)||null;
    const t=date?new Date(`${String(date).slice(0,10)}T23:59:59`).getTime():Date.now();let best=null,bestT=-Infinity;
    for(const item of list){const w=N(item?.w??item?.weight),d=new Date(`${String(item?.date||item?.d||'').slice(0,10)}T12:00:00`).getTime();if(w>0&&Number.isFinite(d)&&d<=t&&d>bestT){best=w;bestT=d}}
    if(best>0)return best;for(let i=list.length-1;i>=0;i--){const w=N(list[i]?.w??list[i]?.weight);if(w>0)return w}return null
  }
  function systemLoad(w,ex,date){if(exerciseClass(ex)!=='bodyweight')return w;const bw=bodyWeightAt(date);if(!(bw>0))return w;return assisted(ex)?Math.max(1,bw-w):bw+w}
  function externalLoad(load,ex,date){if(exerciseClass(ex)!=='bodyweight')return load;const bw=bodyWeightAt(date);if(!(bw>0))return load;return assisted(ex)?Math.max(0,bw-load):Math.max(0,load-bw)}
  function readinessWeight(v,ex,cur,stp=equipmentStep(ex)){
    const value=N(v);if(!(value>=0))return null;const f=cur?.trainingReadinessDone&&cur?.readinessAdjusted?N(cur?.readiness?.factor)||1:1;if(Math.abs(f-1)<.001)return round(value,stp);
    if(exerciseClass(ex)==='bodyweight'){const bw=bodyWeightAt(cur?.date);if(bw>0){const sys=assisted(ex)?Math.max(1,bw-value):bw+value,todaySys=sys*f;return round(assisted(ex)?Math.max(0,bw-todaySys):Math.max(0,todaySys-bw),stp)}}
    return round(value*f,stp)
  }

  function migrateActualFields(){
    let changed=false;const all=[];if(W.st?.current)all.push(W.st.current);all.push(...(Array.isArray(W.st?.sessions)?W.st.sessions.slice(-12):[]));
    all.forEach(s=>(s?.ex||[]).forEach(ex=>(ex?.set||[]).forEach(set=>{if(!set?.ok)return;const r=N(set.actualReps??set.r),rp=N(set.actualRpe??set.rpe),ri=N(set.actualRir??set.rir);if(r>0&&N(set.actualReps)!==r){set.actualReps=r;changed=true}if(rp!=null&&N(set.actualRpe)!==rp){set.actualRpe=rp;changed=true}if(ri!=null&&N(set.actualRir)!==ri){set.actualRir=ri;changed=true}if(N(set.actualRir)==null&&rp!=null){set.actualRir=clamp(10-rp,0,10);changed=true}if(N(set.actualRpe)==null&&ri!=null){set.actualRpe=clamp(10-ri,1,10);changed=true}})));return changed
  }
  function repsReliability(v){const r=Math.max(1,num(v)||1);if(r<=5)return 1;if(r<=8)return .95;if(r<=12)return .85;if(r<=15)return .72;if(r<=20)return .58;return .45}
  function repRpeIntensity(reps,rpe){const r=Math.max(1,num(reps)||1),rp=N(rpe)??8,rir=clamp(10-rp,0,10);return 1/(1+(r+rir)/30)}
  function rowsFromSession(s,ex,cur){
    const out=[],fallback=targetRange(ex);(s?.ex||[]).forEach(e=>{if(!same(e,ex?.n,ex?.sourceId))return;(e.set||[]).forEach(x=>{if(!x?.ok)return;const w=N(x.w),r=N(x.actualReps??x.r);if(!(w>=0)||!(r>0))return;let rpe=N(x.actualRpe??x.rpe),rir=N(x.actualRir??x.rir),estimated=false;if(rir==null&&rpe!=null)rir=10-rpe;if(rpe==null&&rir!=null)rpe=10-rir;if(rpe==null){rpe=targetRpe(e,x,s)||targetRpe(ex,null,cur);rir=clamp(10-rpe,0,10);estimated=true}const lo=N(x.targetRepMin??x.rMin)??fallback?.lo??null,hi0=N(x.targetRepMax??x.rMax)??fallback?.hi??lo;out.push({w,r,rpe,rir:clamp(rir??(10-rpe),0,10),lo,hi:lo>0?Math.max(lo,hi0||lo):null,date:s.date||s.workout_date||'',week:N(s?.w),estimatedRpe:estimated,sessionId:String(s.id||s.sessionId||s.date||s.workout_date||'')})})});return out
  }
  function localSessions(ex,cur,limit=5){const found=[],list=Array.isArray(W.st?.sessions)?W.st.sessions:[];for(let i=list.length-1;i>=0&&found.length<limit;i--){const s=list[i];if(!s?.ended||String(s.id||'')===String(cur?.id||''))continue;const rows=rowsFromSession(s,ex,cur);if(rows.length)found.push({session:s,rows})}return found}
  async function cloudWorkoutRows(){
    try{const uid=String(W.cloud?.user?.id||'');if(!W.cloud?.client||!uid)return[];if(cloudCache.rows&&cloudCache.user===uid&&Date.now()-cloudCache.at<20000)return cloudCache.rows;const q=await W.cloud.client.from('workouts').select('payload,workout_date').eq('user_id',uid).order('workout_date',{ascending:false}).limit(50);if(q.error)return[];cloudCache={at:Date.now(),user:uid,rows:q.data||[]};return cloudCache.rows}catch(e){console.warn('UNVRSL v292 cloud history',e);return[]}
  }
  async function cloudSessions(ex,cur,limit=5){const data=await cloudWorkoutRows(),out=[];for(const row of data){const p=row.payload||{};if(String(p.id||'')===String(cur?.id||''))continue;const s={...p,date:p.date||row.workout_date,workout_date:row.workout_date},rows=rowsFromSession(s,ex,cur);if(rows.length)out.push({session:s,rows});if(out.length>=limit)break}return out}
  async function sessionHistory(ex,cur){const local=localSessions(ex,cur,5);if(local.length>=3)return local;const cloud=await cloudSessions(ex,cur,5),seen=new Set(local.map(x=>String(x.session?.id||x.session?.date||''))),out=[...local];for(const item of cloud){const id=String(item.session?.id||item.session?.date||'');if(id&&seen.has(id))continue;seen.add(id);out.push(item);if(out.length>=5)break}return out}
  function rowE1rm(row,ex){const load=systemLoad(num(row.w),ex,row.date);return load>0?load*(1+(num(row.r)+clamp(num(row.rir),0,10))/30):null}
  function robustEstimate(history,ex){
    const sessions=[];(history||[]).forEach((item,index)=>{const vals=item.rows.map(r=>rowE1rm(r,ex)).filter(x=>x>0),e=median(vals);if(!(e>0))return;const actual=item.rows.filter(r=>!r.estimatedRpe).length/item.rows.length,repQuality=mean(item.rows.map(r=>repsReliability(r.r)))||.5,quality=(.55+.45*actual)*(.72+.28*repQuality);sessions.push({e,quality,recency:LAMBDA**index,rows:item.rows})});if(!sessions.length)return null;
    const m=median(sessions.map(x=>x.e));let kept=sessions.filter(x=>x.e>=m*.82&&x.e<=m*1.18);if(!kept.length)kept=sessions;const den=kept.reduce((s,x)=>s+x.quality*x.recency,0),cap=kept.reduce((s,x)=>s+x.e*x.quality*x.recency,0)/(den||1),cv=cap>0?sd(kept.map(x=>x.e))/cap:1,actualRatio=mean(kept.map(x=>x.quality))||0;let confidence='низкая';if(kept.length>=3&&cv<=.07&&actualRatio>=.72)confidence='высокая';else if(kept.length>=2&&cv<=.12)confidence='средняя';return{e1rm:cap,sessions:kept.length,cv,confidence,rows:kept.flatMap(x=>x.rows),lastRows:history?.[0]?.rows||[]}
  }
  function ownerCycle(cur){if(cur?.programId||cur?.planId||cur?.programName)return false;const w=N(cur?.w);if(!(w>=1&&w<=8)||!cur?.c)return false;try{return (W.UNVRSL_ROUTINES||[]).some(r=>Number(r?.w)===w&&String(r?.c||'')===String(cur.c||''))}catch(_){return false}}
  function weekBand(cur){if(cur?.programWeekUseIntensity!==false){let lo=N(cur?.programWeekIntensityMin),hi=N(cur?.programWeekIntensityMax);if(lo>0&&hi>0){if(lo>1)lo/=100;if(hi>1)hi/=100;return[clamp(Math.min(lo,hi),.3,1),clamp(Math.max(lo,hi),.3,1)]}}return ownerCycle(cur)&&WEEK[Number(cur?.w)]?WEEK[Number(cur.w)]:null}
  const previousWeight=est=>median((est?.lastRows||est?.rows||[]).map(x=>x.w).filter(x=>x>0));
  const previousRpe=est=>{const a=(est?.lastRows||[]).filter(x=>!x.estimatedRpe&&N(x.rpe)!=null);return mean((a.length?a:(est?.lastRows||[])).map(x=>N(x.rpe)).filter(Number.isFinite))};
  const previousReps=est=>mean((est?.lastRows||[]).map(x=>N(x.r)).filter(Number.isFinite));
  function isDeload(cur){const band=weekBand(cur);return !!(band&&band[1]<=.67)}
  function effectiveIntensity(ex,set,cur,est){
    const range=targetRange(ex,set),reps=Math.max(1,range?.lo||num(set?.r)||previousReps(est)||8),rpe=targetRpe(ex,set,cur),repPct=repRpeIntensity(reps,rpe),band=weekBand(cur);if(!band)return{reps,rpe,repPct,effectivePct:repPct,band:null,compatible:true,weekWeight:0};const[lo,hi]=band,compatible=repPct>=lo&&repPct<=hi;if(compatible)return{reps,rpe,repPct,effectivePct:repPct,band,compatible:true,weekWeight:1};let weekWeight=reps<=3?.80:reps<=5?.65:reps<=8?.40:reps<=12?.20:.10;if(hi<=.67)weekWeight=Math.max(weekWeight,.70);const weekAnchor=clamp(repPct,lo,hi),effectivePct=repPct*(1-weekWeight)+weekAnchor*weekWeight;return{reps,rpe,repPct,effectivePct,band,compatible:false,weekWeight}
  }
  function modelCandidate(ex,set,cur,est,programW,stp){
    const cls=exerciseClass(ex),prev=previousWeight(est),profile=effectiveIntensity(ex,set,cur,est);if(cls==='isolation')return round(prev||programW||num(set?.w),stp);
    if(cls==='bodyweight'){const today=cur?.date||new Date().toISOString().slice(0,10),sys=est.e1rm*profile.effectivePct;let raw=externalLoad(sys,ex,today);if(prev>=0)raw=clamp(raw,Math.max(0,prev-2*stp),prev+2*stp);if(programW>0)raw=clamp(raw,Math.max(0,programW-2*stp),programW+2*stp);return round(raw,stp)}
    let raw=est.e1rm*profile.effectivePct;const lower=cls==='machine'?.94:.925,upper=cls==='machine'?1.04:1.05;if(prev>0)raw=clamp(raw,prev*lower,prev*upper);if(programW>0){raw=clamp(raw,programW*.925,programW*1.05);if(isDeload(cur))raw=Math.min(raw,programW)}if(profile.band){const[lo,hi]=profile.band;raw=Math.min(raw,est.e1rm*hi);if(profile.reps<=5&&!isDeload(cur))raw=Math.max(raw,est.e1rm*lo*.97)}return round(raw,stp)
  }
  function evaluateGate(ex,cur,rows){
    const cls=exerciseClass(ex);if(cls==='method'||!rows?.length)return null;const current=targetRange(ex),normalized=rows.map(r=>{const lo=N(r.lo)??current?.lo,hi0=N(r.hi)??current?.hi??lo;return{...r,lo,hi:lo>0?Math.max(lo,hi0||lo):null}}).filter(r=>r.lo>0&&r.hi>=r.lo);if(!normalized.length)return null;
    const target=mean((ex.set||[]).map(s=>targetRpe(ex,s,cur)))||8,actualRpes=normalized.filter(r=>!r.estimatedRpe).map(r=>r.rpe).filter(Number.isFinite),avgRpe=mean(actualRpes.length?actualRpes:normalized.map(r=>r.rpe))??target,avgReps=mean(normalized.map(r=>r.r))||0,avgMin=mean(normalized.map(r=>r.lo))||0,avgMax=mean(normalized.map(r=>r.hi))||avgMin,positions=normalized.map(r=>r.hi>r.lo?(r.r-r.lo)/(r.hi-r.lo):(r.r>=r.lo?1:-1)),avgPosition=mean(positions)||0,topCount=normalized.filter(r=>r.r>=r.hi).length,belowCount=normalized.filter(r=>r.r<r.lo).length,topNeed=Math.max(1,Math.ceil(normalized.length*.75)),topReady=topCount>=topNeed,rpeDelta=avgRpe-target,hasActualEffort=actualRpes.length>0;
    let status='HOLD',code='range_progress',reason=`${fmt1(avgReps)}/${fmt1(avgMax)} повт. · сначала добери диапазон`;
    if((belowCount>0&&rpeDelta>=1)||(avgReps<avgMin-.5&&rpeDelta>=.5)){status='DOWN';code='below_range_high_rpe';reason=`повторы ниже ${fmt1(avgMin)} · RPE ${fmt1(avgRpe)} выше цели ${fmt1(target)}`}
    else if(topReady&&rpeDelta<=.5){status='UP';code='top_range_target_rpe';reason=`верх диапазона выполнен · RPE ${fmt1(avgRpe)} в цели`}
    else if(topReady&&rpeDelta>.5){status='HOLD';code='top_range_high_rpe';reason=`верх диапазона есть · RPE ${fmt1(avgRpe)} выше цели ${fmt1(target)}`}
    else if(cls==='compound'&&hasActualEffort&&avgReps>=avgMin&&rpeDelta<=-1.25){status='EARLY_UP';code='compound_easy';reason=`${fmt1(avgReps)} повт. · RPE ${fmt1(avgRpe)} заметно ниже цели`}
    else if(cls==='machine'&&hasActualEffort&&avgPosition>=.5&&rpeDelta<=-1){status='EARLY_UP';code='machine_easy_midrange';reason=`диапазон освоен больше чем наполовину · RPE ${fmt1(avgRpe)} ниже цели`}
    else if(cls==='isolation'){status='HOLD';code='isolation_double_progression';reason=`${fmt1(avgReps)}/${fmt1(avgMax)} повт. · вес после верхней границы`}
    else if(cls==='bodyweight'&&hasActualEffort&&avgReps>=avgMin&&rpeDelta<=-1.25){status='EARLY_UP';code='bodyweight_easy';reason=`${fmt1(avgReps)} повт. · запас выше цели`}
    return{status,code,reason,class:cls,targetRpe:+target.toFixed(1),avgRpe:+avgRpe.toFixed(1),avgReps:+avgReps.toFixed(1),repMin:+avgMin.toFixed(1),repMax:+avgMax.toFixed(1),topCount,topNeed,belowCount,actualEffort:hasActualEffort,revision:REV}
  }
  function fmt1(v){const n=Number(v);return Number.isFinite(n)?String(Math.round(n*10)/10).replace('.',','):'—'}
  function harder(v,prev,isAssist){return isAssist?v<prev-.001:v>prev+.001}
  function oneHarder(prev,stp,isAssist){return isAssist?Math.max(0,prev-stp):prev+stp}
  function oneEasier(prev,stp,isAssist){return isAssist?prev+stp:Math.max(0,prev-stp)}
  function gateCandidate(candidate,prev,gate,ex,cur,stp){let rec=N(candidate);if(!(rec>=0)||!(prev>=0)||!gate||isDeload(cur))return rec;const isAssist=assisted(ex);if(gate.status==='HOLD')return harder(rec,prev,isAssist)?prev:rec;if(gate.status==='DOWN')return oneEasier(prev,stp,isAssist);if(gate.status==='UP')return oneHarder(prev,stp,isAssist);if(gate.status==='EARLY_UP')return harder(rec,prev,isAssist)?oneHarder(prev,stp,isAssist):rec;return rec}
  function methodWeights(ex,sets,cur,est,programWeights,stp){
    const m=method(ex),last=est?.lastRows||[],prev=median(last.map(x=>x.w).filter(x=>x>0)),pr=mean(last.filter(x=>!x.estimatedRpe).map(x=>x.rpe).filter(Number.isFinite)),goal=mean(sets.map(s=>targetRpe(ex,s,cur)))||8;
    if(m==='UNVRSL'&&W.UNVRSL_METHOD_V211?.aggregateRecommendation){const res=W.UNVRSL_METHOD_V211.aggregateRecommendation(est.rows,sets.map((s,i)=>num(programWeights[i])||num(s.plannedW)||num(s.w)),sets.map(s=>num(s.r)),sets.map(s=>targetRpe(ex,s,cur)),stp);if(res?.weights?.length)return res.weights.map((v,i)=>{let raw=num(v),p=num(programWeights[i]);if(p>0){raw=clamp(raw,p*.925,p*1.05);if(isDeload(cur))raw=Math.min(raw,p)}return round(raw,stp)})}
    if(!(prev>0))return null;let factor=1;if(pr!=null&&pr<=goal-.75)factor=(prev+stp)/prev;else if(pr!=null&&pr>=goal+1)factor=Math.max(stp,prev-stp)/prev;return sets.map((s,i)=>{const p=num(programWeights[i])||num(s.w)||prev;return round(num(programWeights[i])>0?clamp(p*factor,Math.max(stp,p-stp),p+stp):p*factor,stp)})
  }
  function confidenceMeta(ex,cur,est){const band=weekBand(cur);return{modelVersion:REV,kind:exerciseClass(ex),confidence:est?.confidence||'низкая',historySessions:est?.sessions||0,historyCv:est?.cv!=null?+est.cv.toFixed(3):null,weekBand:band?band.map(v=>Math.round(v*100)):null,intensityAware:true,mathOwner:'training-load-model-v292'}}
  function exerciseGroups(cur){const map=new Map();(cur?.ex||[]).forEach((ex,i)=>{const k=key(ex);if(!map.has(k))map.set(k,{k,items:[]});map.get(k).items.push({ex,i})});return[...map.values()]}
  async function calculateGroup(group,cur){
    const first=group?.items?.[0]?.ex;if(!first||first.mode==='cardio')return false;const hist=await sessionHistory(first,cur),est=robustEstimate(hist,first);if(!est)return false;
    const flat=group.items.flatMap(({ex,i})=>(ex.set||[]).map((set,si)=>({ex,set,ei:i,si}))),stp=equipmentStep(first,est.rows),m=method(first),programWeights=flat.map(x=>num(x.set.programW));let values=null,gate=null,prev=previousWeight(est);
    if(m!=='STANDARD')values=methodWeights(first,flat.map(x=>x.set),cur,est,programWeights,stp);else{gate=evaluateGate(first,cur,est.lastRows||[]);values=flat.map((x,i)=>round(gateCandidate(modelCandidate(x.ex,x.set,cur,est,programWeights[i],stp),prev,gate,x.ex,cur,stp),stp))}
    if(!values?.some(v=>v!=null&&v>=0))return false;
    flat.forEach((x,i)=>{const v=N(values[i]);if(v==null||v<0)return;const prescribed=x.ex.programWeightMode==='prescribed';x.set.recommendedW=v;if(gate)x.set.progressionGateV292={...gate,finalRecommendedW:v};const cls=exerciseClass(x.ex),profile=(cls==='compound'||cls==='machine'||cls==='bodyweight')?effectiveIntensity(x.ex,x.set,cur,est):null;x.set.trainingIntensity292=profile?{reps:profile.reps,targetRpe:profile.rpe,repRpePct:+(profile.repPct*100).toFixed(1),effectivePct:+(profile.effectivePct*100).toFixed(1),weekBand:profile.band?profile.band.map(v=>Math.round(v*100)):null,compatible:profile.compatible,weekWeight:+profile.weekWeight.toFixed(2)}:{reps:num(x.set.r),targetRpe:targetRpe(x.ex,x.set,cur),model:cls==='isolation'?'double_progression':'method'};if(!prescribed&&!x.set.ok&&!x.set.manualOverride){x.set.plannedW=v;x.set.baselineW=v;x.set.baselineSource='training_load_model_v292';x.set.w=readinessWeight(v,x.ex,cur,stp)}});
    group.items.forEach(({ex})=>{if(ex.programWeightMode!=='prescribed')ex.weightDecision=values.some(v=>v!=null)?'adaptive_auto':'calibration';if(gate){ex.trainingProgression292={...gate,previousWeight:prev,step:stp,deload:isDeload(cur)};ex.trainingProgression291=ex.trainingProgression292;ex.trainingProgression290=ex.trainingProgression292}ex.trainingEstimate200={...(ex.trainingEstimate200||{}),e1rm:+est.e1rm.toFixed(1),previousWeight:prev,...confidenceMeta(ex,cur,est)}});return true
  }
  function fmtWeights(a){const vals=(a||[]).map(N).filter(x=>x!=null&&x>=0),u=[];vals.forEach(x=>{if(!u.some(y=>Math.abs(y-x)<.001))u.push(x)});return u.length?u.map(v=>String(v).replace('.',',')).join(' / '):'—'}
  function readinessPercent(cur){if(!cur?.trainingReadinessDone||!cur?.readinessAdjusted)return'';const p=Math.round(((N(cur?.readiness?.factor)||1)-1)*1000)/10;return`${p>0?'+':''}${String(p).replace('.',',')}%`}
  function refreshDom(cur){
    const root=D.getElementById('start');if(!root||!cur)return;const cards=[...root.querySelectorAll('.exercise')],seen=new Set();(cur.ex||[]).forEach((ex,i)=>{if(ex?.mode==='cardio'||method(ex)!=='STANDARD')return;const k=key(ex);if(seen.has(k))return;seen.add(k);const group=(cur.ex||[]).filter(x=>key(x)===k),meta=group.map(x=>x.trainingProgression292).find(Boolean),card=cards[i];if(!meta||!card)return;const rp=readinessPercent(cur),rec=card.querySelector('.te200-rec');if(rec){const today=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(N(s.recommendedW)!=null)today.push(readinessWeight(s.recommendedW,g,cur,equipmentStep(g)))}));const b=rec.querySelector('b'),sp=rec.querySelector('span');if(b&&today.length)b.textContent=`Рекомендация · ${fmtWeights(today)} кг`;if(sp)sp.textContent=`${meta.reason}${rp?` · самочувствие ${rp}`:''}`}const auto=card.querySelector('.te200-auto');if(auto){const today=[];group.forEach(g=>(g.set||[]).forEach(s=>{if(N(s.w)!=null)today.push(N(s.w))}));if(today.length)auto.textContent=`Автовес · ${fmtWeights(today)} кг · ${meta.reason}${rp?` · самочувствие ${rp}`:''}`}})
  }
  function patchWorkoutInputs(cur){const cards=[...D.querySelectorAll('#start .exercise')];(cur?.ex||[]).forEach((ex,ei)=>{const rows=[...(cards[ei]?.querySelectorAll('.setrow')||[])];(ex.set||[]).forEach((s,si)=>{const input=rows[si]?.querySelector('input');if(!input||D.activeElement===input)return;const v=N(s.w);if(v!=null&&String(input.value)!==String(v))input.value=v})})}
  function invalidateUi(cur){const root=D.getElementById('start');if(root)delete root.dataset.te200Sig;patchWorkoutInputs(cur);try{W.trainingEngine200Tick?.()}catch(_){}queueMicrotask(()=>refreshDom(cur))}
  let running=false,lastSig='',lastId='';
  function signature(cur){return JSON.stringify([cur?.id||'',cur?.trainingPreparedAt||'',cur?.trainingPrescriptionRevision||'',cur?.trainingReadinessDone?num(cur?.readiness?.factor)||1:1,Number(cur?.w)||0,(cur?.ex||[]).map(ex=>[key(ex),ex.programWeightMode,(ex.set||[]).map(s=>[num(s.programW),N(s.targetRepMin),N(s.targetRepMax),N(s.targetRpeResolved),num(s.r)])]),(W.st?.sessions||[]).length])}
  async function run(force=false){
    const cur=W.st?.current;if(!cur?.id||cur.ended||!W.__unvrslTrainingEngineV257)return false;const sig=signature(cur);if(!force&&sig===lastSig&&String(cur.id)===lastId)return false;if(running)return false;running=true;
    try{migrateActualFields();let changed=false;for(const group of exerciseGroups(cur)){if(await calculateGroup(group,cur))changed=true}if(changed){cur.trainingLoadModelRevision=REV;cur.trainingProgressionRevision=REV;cur.trainingLoadModelAt=new Date().toISOString();cur.trainingProgressionAt=cur.trainingLoadModelAt;cur.trainingMathOwner='training-load-model-v292';try{W.save?.()}catch(_){}invalidateUi(cur)}lastSig=signature(cur);lastId=String(cur.id);return changed}catch(e){console.warn('UNVRSL load model v292',e);return false}finally{running=false}
  }
  function wrapReadinessConfirm(){const fn=W.trainingConfirmReadiness200;if(typeof fn!=='function'||fn.__unvrslLoadModelV292)return;const wrapped=async function(){const r=await fn.apply(this,arguments);await run(true);return r};wrapped.__unvrslLoadModelV292=true;wrapped.__unvrslLoadModelV260=true;wrapped.__unvrslLoadModelV258=true;wrapped.__unvrslLoadModelBase=fn;W.trainingConfirmReadiness200=wrapped;try{trainingConfirmReadiness200=wrapped}catch(_){}}
  function boot(force=false){wrapReadinessConfirm();run(force)}
  const api={run,exerciseKind:exerciseClass,exerciseClass,repRpeIntensity,effectiveIntensity,evaluateGate,readinessWeight,version:REV};W.trainingLoadModel292=api;W.trainingLoadModel258=api;W.unvrslTrainingProgressionSyncV292=run;W.unvrslTrainingProgressionSyncV291=run;W.unvrslTrainingProgressionSyncV290=run;W.unvrslTrainingEvaluateRepGateV292=evaluateGate;W.unvrslTrainingEvaluateRepGateV291=evaluateGate;W.unvrslTrainingEvaluateRepGateV290=evaluateGate;W.unvrslTrainingReadinessWeightV292=readinessWeight;W.unvrslTrainingReadinessWeightV291=readinessWeight;W.unvrslTrainingReadinessWeightV290=readinessWeight;
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled','unvrsl:readiness-ready'].forEach(name=>W.addEventListener?.(name,()=>boot(name==='unvrsl:training-engine-ready'||name==='unvrsl:readiness-ready'),{passive:true}));D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)boot(false)},{passive:true});[0,120,400,900].forEach(ms=>setTimeout(()=>boot(ms===400),ms));
})();
