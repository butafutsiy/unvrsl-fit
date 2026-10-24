'use strict';
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./exercise-profiles'):root.UNVRSLExerciseProfiles);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.UNVRSLRecommendationEngine=api;
})(typeof window==='undefined'?globalThis:window,P=>{
 const CONFIG=Object.freeze({engineVersion:3,sameTargetGapTolerance:1,liveGapThreshold:2,downDampingSmall:.66,downDampingLarge:.76,upDamping:.60,historySessionLimit:5,historyWindowDays:90,estimateSessionLimit:3,estimateWeights:[.5,.3,.2],proxyPrimaryRepRange:[3,12],proxyLowConfidenceRepRange:[13,15],proxyOutlierFraction:.10,phaseChangeReviewFraction:.20,calibrationMaxLoadedTrials:3,successFractionDefault:1,effortConflictTolerance:.5});
 for(const value of Object.values(CONFIG))if(Array.isArray(value))Object.freeze(value);
 const num=v=>v==null||typeof v==='boolean'||typeof v==='object'||String(v).trim()===''?null:Number.isFinite(Number(String(v).replace(',','.')))?Number(String(v).replace(',','.')):null;
 const round=x=>Number.isFinite(x)?Number(x.toFixed(6)):null;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const clone=x=>JSON.parse(JSON.stringify(x));
 function stable(x){if(Array.isArray(x))return x.map(stable);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().filter(k=>x[k]!==undefined).map(k=>[k,stable(x[k])]));return x;}
 function fingerprint(x){let h=2166136261;const s=JSON.stringify(stable(x));for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return 'v3:'+((h>>>0).toString(16));}
 function normalizeTempo(value){if(value==null)return null;if(typeof value==='object')return {eccentric:value.eccentric??null,bottomPause:value.bottomPause??null,concentric:value.concentric??null,topPause:value.topPause??null};const parts=String(value).split('-');if(parts.length===3||parts.length===4)return {eccentric:parts[0],bottomPause:parts[1],concentric:parts[2],topPause:parts[3]??null,legacyUnknown:parts.length===3};return {protocol:String(value)};}
 const first=(...xs)=>xs.find(x=>x!==null&&x!==undefined&&x!=='');
 function effort(s={},domain='strength'){
  if(domain!=='strength')return {actualRir:null,actualRpe:null,effortKnown:num(s.cardioRpe??s.holdEffort??s.rpe)!=null,effortPrecision:'qualitative',censored:false,conflict:false,uncertain:s.effortUncertain===true,rirLabel:null};
  const q=num(first(s.actualRir,s.rir)),rpe=num(first(s.actualRpe,s.rpe));
  const validQ=q!=null&&q>=0&&q<=9;
  const censored=s.effortUpperCensored===true||s.effortCensored===true||/\+/.test(String(first(s.actualRir,s.rir)||''));
  const conflict=validQ&&rpe>=6&&rpe<=10&&Math.abs(q-(10-rpe))>CONFIG.effortConflictTolerance+1e-6||censored&&rpe>=6&&rpe<=10;
  const known=validQ||rpe>0&&rpe<=10||censored;
  const coarse=censored||q>=5||rpe>0&&rpe<6;
  return {actualRir:validQ?q:rpe>=6&&rpe<=10?10-rpe:null,actualRpe:rpe,effortKnown:known,
   effortPrecision:coarse?'coarse':known?'estimated':'unknown',censored,conflict,
   uncertain:s.effortUncertain===true,rirLabel:rpe===9.5?'0–1':censored?'5+':validQ?String(q):null};
 }
 function repetitions(s={},ex={}){
  const side=s.sideResults;
  if(side){const left=num(side.left?.actualReps??side.left?.reps??side.left),right=num(side.right?.actualReps??side.right?.reps??side.right);return left!=null&&right!=null&&[left,right].every(x=>Number.isInteger(x)&&x>=0)?{reps:Math.min(left,right),sideResults:side}: {reps:null,warning:'unknown_sides'};}
  const left=num(s.repsLeft),right=num(s.repsRight);
  if(left!=null&&right!=null)return {reps:Math.min(left,right)};
  const r=num(first(s.actualReps,s.r,s.reps));
  if(!Number.isInteger(r)||r<0)return {reps:null};
  if(['per_leg','per_side','per_arm','per_implement'].includes(s.repCounting))return {reps:r};
  if(s.repCounting==='total'||ex.repCounting==='total'||ex.repsPerLeg===true||ex.sd===1)
   return r%2===0?{reps:r/2}:{reps:null,warning:'ambiguous_total_reps'};
  if(ex.requiresSideCounting)return {reps:null,warning:'ambiguous_side_counting'};
  return {reps:r};
 }
 const normalizeRole=r=>({standard:'ordinary',work:'ordinary',working:'ordinary','unvrsl-heavy':'heavy','unvrsl-light':'light','unvrsl-middle':'middle','back-off':'back_off',backoff:'back_off'}[String(r||'ordinary').toLowerCase()]||r||'ordinary');
 function resolvePrescription({exercise:e={},set:s={},session={},profile}){
  const p=profile||P.resolve(e);const f=P.families[p.family];
  const explicit=(key,aliases=[])=>first(s[key],...aliases.map(k=>s[k]),e[key],...aliases.map(k=>e[k]));
  const a=num(explicit('targetRepMin',['repMin','rMin']))??num(e.reps?.min)??num(s.programR)??num(s.plannedReps)??f.reps[0];
  const b=num(explicit('targetRepMax',['repMax','rMax']))??num(e.reps?.max)??a;
  const methodDefaults=s.rolePrescription||e.methodProfile?.roles?.[s.setRole||s.role]||e.methodProfile||{};
  const week={targetRpeMin:session.programWeekRpeMin??session.targetRpeMin,targetRpeMax:session.programWeekRpeMax??session.targetRpeMax,targetRpe:session.target};
  let effortTarget=null;
  for(const [source,obj] of [['set',s],['exercise',e],['method',methodDefaults],['week',week]]){
   const qlo=num(obj.targetRirMin),qhi=num(obj.targetRirMax),plo=num(obj.targetRpeMin),phi=num(obj.targetRpeMax);
   const q=num(obj.targetRir??obj.targetRIR),rp=num(obj.targetRpe??obj.rpeTarget??obj.targetRpeResolved??(source==='exercise'?obj.rpe:null));
   if(qlo!=null||qhi!=null){const lo=qlo??qhi,hi=qhi??qlo;effortTarget={lo,hi,source,conflict:plo!=null&&Math.abs(hi-(10-plo))>1e-6||phi!=null&&Math.abs(lo-(10-phi))>1e-6};break;}
   if(plo!=null||phi!=null){effortTarget={lo:10-(phi??plo),hi:10-(plo??phi),source,conflict:false};break;}
   if(q!=null||rp!=null){effortTarget={lo:q??10-rp,hi:q??10-rp,source,conflict:false};break;}
  }
  effortTarget??={lo:f.rir[0],hi:f.rir[1],source:'family',conflict:false};
  const qmin=effortTarget.lo,qmax=effortTarget.hi;
  return {repMin:a,repMax:b,targetConflict:effortTarget.conflict,targetRirMin:qmin,targetRirMax:qmax,setCount:num(s.setCount??e.setCount)??(e.set||e.sets||[]).length,
   plannedWeight:num(first(s.assignedW,s.plannedWeight,s.programW,s.originalPrescription?.plannedWeight,s.plannedW)),
   weightMode:s.weightMode||e.weightMode||(e.programWeightMode==='prescribed'?'prescribed':'auto'),
   strategyId:s.strategyId||e.strategyId||session.strategyId||p.strategyId,
   setRole:normalizeRole(s.setRole||s.role||e.phaseRole||e.phase||'ordinary'),methodId:s.methodId||s.method||e.methodId||e.method||'STANDARD',
   phaseId:s.phaseId||e.phaseId||session.phaseId||null,groupId:e.groupId||e.superGroup||null,
   groupPosition:s.groupPosition??e.groupPosition??e.superPos??null,roundIndex:s.roundIndex??s.round??null,
   plannedDeload:s.plannedDeload??e.plannedDeload??session.plannedDeload??session.deload??session.isDeload??false,
   plannedTest:s.plannedTest??e.plannedTest??false,allowLoadIncrease:s.allowLoadIncrease??e.allowLoadIncrease??true,
   restTargetSec:num(s.restTargetSec??s.rest??e.restTargetSec??e.rest),tempo:normalizeTempo(s.tempo??e.tempo??methodDefaults.tempo??session.weeklyLoadProfile?.tempo??null),
   preferredRepTarget:num(s.selectedRepTarget),secondsMin:num(s.targetSecondsMin??e.targetSecondsMin)??(p.movementKind==='isometric'?f.reps[0]:null),secondsMax:num(s.targetSecondsMax??e.targetSecondsMax)??(p.movementKind==='isometric'?f.reps[1]:null),durationTargetSec:num(s.selectedDurationSec??s.targetSeconds??s.plannedSeconds??s.workSeconds??(!s.ok?s.seconds:null)??e.durationSec??e.workSeconds??(!s.ok&&num(s.min)!=null?num(s.min)*60:null)),distanceTarget:num(s.targetDistance??e.targetDistance??(!s.ok?s.distance??s.km:null)),allowMetricProgression:s.allowMetricProgression??e.allowMetricProgression??false,metricProgression:e.metricProgression||'duration',
   percent:num(s.plannedPercent??e.plannedPercent),referenceType:s.referenceType??e.referenceType??null,
   referenceValue:num(s.referenceValue??e.referenceValue),successFraction:num(e.successFraction)??1,
   sourceExplicitness:{reps:explicit('targetRepMin')!=null?'explicit':'family',rir:effortTarget.source,weight:first(s.programW,s.assignedW,s.plannedWeight)!=null?'explicit':'unknown'}};
 }
 function normalizeRecommendationInput(raw={},registry,overrides={}){
  const ex=raw.exercise||{},provided=raw.actual||raw.set||{},session=raw.session||{};
  const segment=Array.isArray(provided.segments)?provided.segments[0]:null;
  const s=segment?{...provided,...segment,actualWeight:first(segment.actualWeight,segment.w,provided.initialWeight,provided.w),
   actualReps:first(segment.actualReps,segment.reps,segment.r),r:first(segment.actualReps,segment.reps,segment.r),
   actualRir:first(segment.actualRir,segment.rir),rir:first(segment.actualRir,segment.rir),actualRpe:first(segment.actualRpe,segment.rpe),rpe:first(segment.actualRpe,segment.rpe),
   segmentIndex:0,totalReps:provided.totalReps??provided.segments.reduce((n,x)=>n+(num(x.actualReps??x.reps??x.r)||0),0)}:provided;
  const profile=raw.profile||P.resolve(ex,registry,overrides);
  const prescription={...(raw.prescription||resolvePrescription({exercise:ex,set:raw.targetSet||raw.set||{},session,profile}))};
  for(const key of ['repMin','repMax','targetRirMin','targetRirMax','percent','referenceValue','restTargetSec'])if(prescription[key]!=null)prescription[key]=num(prescription[key]);
  prescription.repMax??=prescription.repMin;prescription.targetRirMax??=prescription.targetRirMin;
  const eq={...(ex.weightProfile||{}),...(raw.equipment||ex.equipmentProfile||s.equipmentSnapshot||{})};
  const e=effort(s,['cardio','isometric','ballistic','mobility'].includes(profile.movementKind)?profile.movementKind:'strength'),r=repetitions(s,{...ex,requiresSideCounting:profile.family==='F12'||profile.unilateral===true||ex.repSide==='leg'});
  const actual={...e,...r,weight:num(first(s.actualWeight,s.w,s.weight)),
   status:s.skipped?'skipped':s.status||(s.ok?(r.reps===0&&!['cardio','isometric'].includes(profile.movementKind)?'failed_attempt':'completed'):'pending'),
   technique:s.technique|| (s.techniqueFailed?'invalid':s.techniqueClean===true?'clean':'unknown'),
   rom:s.rom||(s.fullROM===false||s.partial?'unplanned_partial':s.fullROM===true?'full':'unknown'),
   pain:provided.segments?.some(x=>x.painFlag||x.pain||x.stopReason==='pain')||s.painFlag===true||s.pain===true||s.stopReason==='pain'||!!(s.sideResults&&(s.sideResults.left?.painFlag||s.sideResults.right?.painFlag)),
   stopReason:s.stopReason||'unknown',assistedByPartner:s.assistedByPartner===true,
   warmup:s.warmup===true||s.isWarmup===true||s.setRole==='warmup',
   seconds:num(s.actualSeconds??s.seconds),distance:num(s.actualDistance??s.distance??s.km),cardioRpe:num(s.cardioRpe),holdEffort:num(s.holdEffort),actualRestSec:num(s.actualRestSec),roundIndex:s.roundIndex??s.round??null,segmentIndex:num(s.segmentIndex??raw.set?.segmentIndex)??(num(s.mini)!=null?num(s.mini)-1:null),totalReps:num(s.totalReps),excludesFromStrength:s.excludesFromStrength===true,
   bodyWeight:num(first(s.bodyWeightSnapshot,session.bodyWeight)),performedAt:s.performedAt!=null?date(s.performedAt):null};
  const sides=s.sideResults;
  if(sides&&sides.left!=null&&sides.right!=null){
   const points=['left','right'].map(side=>{const x=sides[side],reps=num(typeof x==='object'?x.actualReps??x.reps:x),own=typeof x==='object'?effort(x):null;return {side,reps,effort:own?.effortKnown?own:e,raw:typeof x==='object'?x:{}};});
   actual.conflict=actual.conflict||points.some(x=>x.effort.conflict);actual.uncertain=actual.uncertain||points.some(x=>x.effort.uncertain);
   if(points.some(x=>x.effort.censored||x.effort.effortPrecision==='coarse')){actual.censored=true;actual.effortPrecision='coarse';}
   const eligible=points.filter(x=>x.reps!=null&&x.effort.actualRir!=null).sort((a,b)=>(a.reps+a.effort.actualRir)-(b.reps+b.effort.actualRir)||a.reps-b.reps||a.side.localeCompare(b.side));
   if(eligible.length===2){const limiting=eligible[0];actual.reps=limiting.reps;actual.actualRir=limiting.effort.actualRir;actual.actualRpe=limiting.effort.actualRpe;actual.effortKnown=true;if(!actual.censored)actual.effortPrecision='estimated';actual.limitingSide=limiting.side;}
   const weights=points.map(x=>num(x.raw.actualWeight??x.raw.weight)).filter(x=>x!=null);actual.sideWeightConflict=weights.length===2&&weights[0]!==weights[1];
   if(points.some(x=>x.raw.technique==='invalid'))actual.technique='invalid';else if(points.some(x=>x.raw.technique==='degraded'))actual.technique='degraded';
   if(points.some(x=>x.raw.rom==='unplanned_partial'))actual.rom='unplanned_partial';
  }
  if(actual.status==='pending')Object.assign(actual,{weight:null,reps:null,actualRir:null,actualRpe:null,effortKnown:false,effortPrecision:'unknown',conflict:false,seconds:null,distance:null,performedAt:null});
  return {engineVersion:3,scope:raw.scope||'START',exercise:ex,set:raw.set||{},targetSet:raw.targetSet||raw.set||{},
   session,profile,prescription,equipment:eq,actual,now:num(raw.now)??num(session.started)??(Date.parse(session.date||'')||0),
   history:raw.history||[],attempts:raw.attempts||[],familiar:raw.familiar??null,targetSetId:raw.targetSetId||raw.targetSet?.id||raw.set?.id||raw.targetSetKey||null};
 }
 function modelLoad(w,c){const value=modelLoadValue(num(w),c);return Number.isFinite(value)&&value>0?value:null;}
 function modelLoadValue(w,c){
  if(w==null||w<0)return null;
  const kind=c.profile.loadAccounting,eq=c.equipment,bw=c.actual.bodyWeight;
  if(kind==='per_side'){const sides=num(eq.loadedSides??c.exercise.loadedSides),base=num(eq.implementWeight??c.exercise.implementWeight);return Number.isInteger(sides)&&sides>0&&base!=null&&base>=0?w*sides+base:null;}
  if(kind==='bodyweight_added')return bw>0?bw+w:null;
  if(kind==='bodyweight_assisted')return (eq.id||c.exercise.equipmentProfileId)&&bw>w?bw-w:null;
  return ['external_total','per_implement','stack_display'].includes(kind)&&w>0?w:null;
 }
 function fromModel(w,c){
  if(!Number.isFinite(w))return null;
  const kind=c.profile.loadAccounting;
  if(kind==='per_side'){const sides=num(c.equipment.loadedSides??c.exercise.loadedSides),base=num(c.equipment.implementWeight??c.exercise.implementWeight);return sides>0&&base!=null?round((w-base)/sides):null;}
  if(kind==='bodyweight_added')return c.actual.bodyWeight>0?round(w-c.actual.bodyWeight):null;
  if(kind==='bodyweight_assisted')return c.actual.bodyWeight>0?round(c.actual.bodyWeight-w):null;
  return w;
 }
 function equipmentKnown(c){const e=c.equipment,loads=e.availableLoads??e.available;return Array.isArray(loads)&&loads.some(x=>num(x)!=null)||num(e.min)!=null&&num(e.max)!=null&&num(e.max)>=num(e.min)&&(num(e.weightStep??e.step)>0||e.pairedPlates===true&&num(e.plateIncrement)>0);}
 function candidates(c,current=c.actual.weight){
  const eq=c.equipment,min=num(eq.min)??0,max=num(eq.max)??Infinity;
  const explicit=eq.availableLoads??eq.available;
  if(Array.isArray(explicit)&&explicit.length)return [...new Set(explicit.map(num).filter(x=>x!=null&&x>=min&&x<=max))].sort((a,b)=>a-b);
  const step=num(eq.weightStep??eq.step)??(eq.pairedPlates===true&&num(eq.plateIncrement)>0?round(num(eq.plateIncrement)*2):null);
  if(!(step>0)||num(eq.min)==null||num(eq.max)==null)return c.actual.weight!=null?[c.actual.weight]:[];
  // Only generate a bounded neighbourhood; never loop over an unbounded max.
  const center=Math.floor(((current??min)-min)/step),range=200;
  return Array.from({length:range*2+1},(_,i)=>round(min+(center+i-range)*step)).filter(x=>x>=min&&x<=max);
 }
 function nearest(values,target,current){return values.reduce((best,x)=>best==null||Math.abs(x-target)<Math.abs(best-target)-1e-6||Math.abs(Math.abs(x-target)-Math.abs(best-target))<1e-6&&(Math.abs(x-current)<Math.abs(best-current)-1e-6||Math.abs(x-current)===Math.abs(best-current)&&x<best)?x:best,null);}
 function output(c,action,code,text,weight=null,extra={}){
  const current=c.referenceWeight??c.actual.weight,kind=c.profile.loadAccounting;
  const delta=weight!=null&&current!=null?round(weight-current):null;
  const displayAction=action==='harder'?(kind==='bodyweight_assisted'?'decrease_assistance':'increase_weight'):action==='easier'?(kind==='bodyweight_assisted'?'increase_assistance':'decrease_weight'):action;
  const inputFingerprint=fingerprint({engineVersion:3,actorId:c.session.userId||null,scope:c.scope,profile:c.profile,readiness:c.session.readinessAdjusted?c.session.readiness:null,exercise:c.profile.canonicalId,variant:c.exercise.variantId,prescription:c.prescription,provisionalBaseline:c.set.provisionalBaseline,clusterInitialWeight:c.clusterInitialWeight,actual:c.actual,equipment:c.equipment,targetSetId:c.targetSetId,evidence:getComparableEvidence(c).map(s=>[s.sessionId,s.performedAt,s.rows.map(r=>[r.setId,r.context.actual,r.context.prescription])])});
  return {id:inputFingerprint,applicationFingerprint:applicationFingerprint(c.targetSet),engineVersion:3,scope:c.scope,inputFingerprint,targetSetId:c.targetSetId,
   effortAction:action,displayAction,suggestedWeight:weight,suggestedReps:null,suggestedSeconds:null,suggestedDistance:null,targetSeconds:c.prescription.durationTargetSec??c.prescription.secondsMin,targetDistance:c.prescription.distanceTarget,deltaDisplayed:delta,deltaRelative:weight!=null&&modelLoad(current,c)>0?round((modelLoad(weight,c)/modelLoad(current,c)-1)*100):null,
   targetRirRange:[c.prescription.targetRirMin,c.prescription.targetRirMax],confidence:'low',reasonCode:code,reasonText:text,warnings:[],
   evidenceSessionIds:[],evidenceSetIds:[],rawTargetLoad:null,chosenCandidate:weight,blockedByEquipment:false,fallback:null,needsAcknowledgement:['review','calibrate'].includes(action),appliedAt:null,dismissedAt:null,...extra};
 }
 const hold=(c,code,text,extra={})=>output(c,'hold',code,text,['load','assistance'].includes(c.profile.progressionMetric)?c.actual.weight:null,extra);
 function guards(c,{precise=true}={}){
  const a=c.actual,p=c.profile;
  if(a.pain)return output(c,'stop','pain','Отмечена боль: останови упражнение',null);
  if(a.weight!=null&&a.weight<0)return output(c,'review','negative_load','Нагрузка не может быть отрицательной');
  if(c.profile.movementKind==='ballistic'&&['degraded','invalid'].includes(a.technique))return output(c,'stop','ballistic_quality','Качество взрывной работы снизилось: останови серию');
  if(a.sideWeightConflict)return output(c,'review','asymmetric_weight','Разный вес сторон требует отдельной проверки, автоматическая коррекция общего веса отключена');
  if(a.rom==='planned_partial'&&!c.exercise.variantId)return output(c,'review','partial_variant_required','Для плановой частичной амплитуды нужен отдельный вариант');
  if(a.technique==='invalid'||a.rom==='unplanned_partial'||a.assistedByPartner)return output(c,'review','invalid_execution','Проверь технику, амплитуду и помощь партнёра; точный расчёт отключён');
  if(a.status==='failed_attempt'||a.status==='completed'&&a.reps===0)return output(c,'review','failed_attempt','Неудачная попытка: отдых и ручная проверка облегчения');
  if(a.warmup||a.status==='skipped')return hold(c,'not_working_set','Разминка или пропуск не меняют рабочую нагрузку');
  if(p.family==='F00'||p.profileStatus==='manual_only')return output(c,'review','manual_only',p.reviewReason||'Уточни упражнение и оборудование');
  if(c.prescription.targetConflict)return output(c,'review','conflicting_prescription','Назначенные RIR и RPE противоречат друг другу; проверь исходную цель');
  if(a.conflict)return output(c,'review','conflicting_effort','Фактические RIR и RPE противоречат друг другу');
  if(['interruption','balance','breathlessness','grip'].includes(a.stopReason))return hold(c,'non_muscular_limit','Подход ограничен не мышечным усилием; проверь причину остановки');
  if(precise&&(!a.effortKnown||a.uncertain))return hold(c,'unknown_effort','Укажи фактический RIR: точный расчёт пока недоступен');
  if(precise&&(a.effortPrecision==='coarse'||a.censored))return hold(c,'coarse_effort','Приблизительный запас: без точного прогноза килограммов');
  return null;
 }
 function validTarget(p){return Number.isInteger(p.repMin)&&Number.isInteger(p.repMax)&&p.repMin>0&&p.repMax>=p.repMin&&p.repMax<=1000&&p.targetRirMin>=0&&p.targetRirMax>=p.targetRirMin&&p.targetRirMax<=9;}
 function recommendNextSet(raw){
  const c=raw.engineVersion===3&&raw.profile?{...raw}:normalizeRecommendationInput({...raw,scope:'LIVE'},raw.registry);c.scope='LIVE';
  const g=guards(c,{precise:['load','assistance'].includes(c.profile.progressionMetric)});if(g)return g;
  const a=c.actual,p=c.prescription,profile=c.profile;
  if(!['load','assistance'].includes(profile.progressionMetric))return nonStrength(c);
  if(['SLDR','REST_PAUSE','DS','DROP_SET'].includes(p.methodId)&&a.segmentIndex==null)return output(c,'review','missing_method_segments','Уточни отдельные сегменты метода; суммарные повторы не дают точного прогноза');
  if(!validTarget(p)||a.reps==null||a.weight==null||a.weight<0)return output(c,'review','invalid_input','Уточни фактические данные и цель');
  if(a.reps>30||p.repMax>30)return hold(c,'high_rep_no_projection','Для этого числа повторений сохраняем вес и оцениваем выполнение без формулы нагрузки');
  if(['SLDR','REST_PAUSE','DS','DROP_SET'].includes(p.methodId)&&(a.segmentIndex>0||a.totalReps!=null))return hold(c,'method_segment','Сегмент кластера или дроп-сета не является свежим ordinary подходом');
  if(['SLDR','REST_PAUSE'].includes(p.methodId)&&a.roundIndex!=null&&a.roundIndex===p.roundIndex)return hold(c,'cluster_weight','Внутри одного кластера сохраняется исходный вес',{suggestedWeight:c.clusterInitialWeight??a.weight,suggestedReps:p.repMin});
  if(p.methodId==='FST-7')return hold(c,'block_progression','FST-7 оценивается полным блоком; ранний сет не повышает вес');
  if(num(c.equipment.max)!=null&&a.weight>num(c.equipment.max)||num(c.equipment.min)!=null&&a.weight<num(c.equipment.min))return output(c,'review','outside_equipment_bounds','Факт выходит за границы профиля оборудования: проверь единицы и настройки');
  const load=modelLoad(a.weight,c);if(!(load>0))return output(c,'review','unknown_model_load','Неизвестна масса тела или конфигурация нагрузки');
  const Pactual=a.reps+a.actualRir,low=p.repMin+p.targetRirMin,high=p.repMax+p.targetRirMax;
  if(a.reps<p.repMin&&a.actualRir>p.targetRirMax)return hold(c,'early_stop','Запас сохранён: сначала выполни минимальные повторы',{suggestedReps:p.repMin});
  const feasible=Array.from({length:p.repMax-p.repMin+1},(_,i)=>p.repMin+i).filter(r=>Pactual-r>=p.targetRirMin&&Pactual-r<=p.targetRirMax);
  if(feasible.length)return hold(c,'adjust_repetitions','Вес подходит: остановись в целевых повторах с нужным запасом',{suggestedReps:nearest(feasible,p.preferredRepTarget??clamp(a.reps,p.repMin,p.repMax),a.reps)});
  const harder=Pactual>high,gap=harder?Pactual-high:low-Pactual;
  if(gap<2)return hold(c,'within_estimation_tolerance','Отклонение в пределах погрешности; проверь следующий подход');
  if(harder&&a.technique==='degraded')return hold(c,'degraded_technique','Сначала восстанови качество техники; прибавка отложена');
  if(harder&&(p.plannedDeload||!p.allowLoadIncrease))return hold(c,'increase_not_allowed','Плановая лёгкая работа: повышение запрещено назначением');
  const cap=harder?profile.liveUpCap:profile.liveDownCap;
  const fraction=Math.min(cap,gap/(30+(harder?high:low))*(harder?CONFIG.upDamping:gap>=3?CONFIG.downDampingLarge:CONFIG.downDampingSmall));
  const wanted=load*(1+(harder?fraction:-fraction));
  const all=[...new Set([a.weight,...candidates(c),...candidates(c,fromModel(wanted,c))])].map(w=>({w,m:modelLoad(w,c)})).filter(x=>x.m>0);
  const legal=all.filter(x=>(harder?x.m>=load:x.m<=load)&&Math.abs(x.m/load-1)<=cap+1e-6);
  const chosen=legal.reduce((best,x)=>!best||Math.abs(x.m-wanted)<Math.abs(best.m-wanted)-1e-6||Math.abs(Math.abs(x.m-wanted)-Math.abs(best.m-wanted))<1e-6&&(Math.abs(x.w-a.weight)<Math.abs(best.w-a.weight)||Math.abs(x.w-a.weight)===Math.abs(best.w-a.weight)&&x.m<best.m)?x:best,null);
  const fallback=!harder&&gap>=3?all.filter(x=>x.m<load).sort((x,y)=>y.m-x.m)[0]:null;
  if((!chosen||chosen.w===a.weight)&&!harder&&gap>=3&&!fallback)return output(c,'review','no_lighter_candidate','Нагрузка чрезмерна, но подходящей лёгкой ступени в профиле нет: проверь оборудование и облегчение вручную',null,{blockedByEquipment:true,rawTargetLoad:round(wanted)});
  if(!chosen||chosen.w===a.weight)return hold(c,'blocked_by_equipment','Следующая ступень слишком велика; сохраняем вес и уточняем повторы',{
   rawTargetLoad:round(wanted),blockedByEquipment:true,fallback:fallback?{suggestedWeight:fallback.w,effortAction:'easier',needsAcknowledgement:true,confidence:'low',reasonCode:'recovery_fallback'}:null,
   needsAcknowledgement:!!fallback});
  const direction=harder?'harder':'easier';
  return output(c,direction,'capacity_gap',`${kindLabel(c,direction)}: факт ${a.reps} / RIR ${a.rirLabel??a.actualRir}, цель ${p.repMin}–${p.repMax} / RIR ${p.targetRirMin}–${p.targetRirMax}`,chosen.w,{
   rawTargetLoad:round(wanted),confidence:profile.profileStatus==='resolved'&&a.technique==='clean'&&a.actualRestSec!=null?'medium':'low',
   warnings:a.actualRestSec!=null&&p.restTargetSec>0&&a.actualRestSec<p.restTargetSec*.8?['short_rest']:[]});
 }
 function kindLabel(c,d){return c.profile.loadAccounting==='bodyweight_assisted'?(d==='harder'?'Уменьшить помощь':'Увеличить помощь'):(d==='harder'?'Увеличить вес':'Снизить вес');}
 function nonStrength(c){
  const metric=c.profile.progressionMetric,p=c.prescription;
  const texts={seconds:'Удержание: длительность и качество по назначению',duration:'Кардио: отдельные время, дистанция и субъективная нагрузка',quality:'Взрывная работа: качество и техника по протоколу',protocol:'Следуй назначенному протоколу; килограммы не рассчитываются',mixed:'Смешанные метрики: вес, дистанция и время по протоколу',reps:'Осваивай повторы и объём; смена варианта требует подтверждения'};
  if(c.scope!=='LIVE'&&p.allowMetricProgression&&['seconds','duration','reps'].includes(metric)){
   const evidence=getComparableEvidence(c).slice(0,2),distance=metric==='duration'&&p.metricProgression==='distance';
   const goal=metric==='reps'?p.preferredRepTarget??p.repMin:distance?p.distanceTarget:p.durationTargetSec??p.secondsMin;
   const value=a=>metric==='reps'?a.reps:distance?a.distance:a.seconds;
   const met=evidence.length>=2&&goal>0&&evidence.every(s=>s.rows.length>=Math.max(1,p.setCount||s.expected)&&s.rows.every(r=>{const a=r.context.actual;const old=r.context.prescription,oldGoal=metric==='reps'?old.preferredRepTarget??old.repMin:distance?old.distanceTarget:old.durationTargetSec??old.secondsMin;return oldGoal===goal&&value(a)>=goal&&!a.pain&&a.technique!=='invalid'&&a.rom!=='unplanned_partial'&&(!['reps'].includes(metric)||!a.effortKnown||a.actualRir>=p.targetRirMin);}));
   if(met){
    const upper=metric==='reps'?p.repMax:p.secondsMax;
    if(metric!=='duration'&&upper!=null&&goal>=upper)return output(c,'review','variant_mastered','Верхняя граница освоена: обсуди усложнение или новый вариант',null,{evidenceSessionIds:evidence.map(s=>s.sessionId)});
    const next=metric==='reps'?Math.min(p.repMax,goal+1):metric==='seconds'?Math.min(p.secondsMax??goal+5,goal+5):round(goal*1.05);
    return output(c,'harder','metric_goal_met_twice','Две полные серии выполнены: меняется один согласованный параметр',null,{displayAction:metric==='reps'?'increase_reps':distance?'increase_distance':'increase_duration',suggestedReps:metric==='reps'?next:null,suggestedSeconds:metric!=='reps'&&!distance?next:null,suggestedDistance:distance?next:null,evidenceSessionIds:evidence.map(s=>s.sessionId),confidence:'low'});
   }
  }
  return hold(c,'progress_'+metric,texts[metric]||'Ручной протокол',{suggestedWeight:null});
 }

 const evidenceSnapshot=Symbol('recommendationEvidenceSnapshot');
 function withComparableEvidence(c){return {...c,[evidenceSnapshot]:{sessions:c.history,now:c.now,key:comparableKey(c),value:getComparableEvidence(c)}};}
 const date=v=>num(v)??(Date.parse(v||'')||0);
 const ordinary=role=>['ordinary','standard','work','working',''].includes(String(role||'ordinary').toLowerCase());
 function comparableKey(c){const p=c.prescription,e=c.exercise,s=c.set,eq=c.equipment;
  return fingerprint([c.session.userId||c.session.athleteId||c.session.recommendationActorId||null,c.profile.canonicalId,e.variantId||null,eq.id||e.equipmentProfileId||null,c.profile.loadAccounting,
   s.romProtocol||e.romProtocol||(c.actual.rom==='planned_partial'?'planned_partial':'full_or_unknown'),p.tempo,p.methodId,p.setRole,p.phaseId,p.groupId?true:false,p.groupPosition,c.profile.loadAccounting==='per_side'?[eq.loadedSides??e.loadedSides,eq.implementWeight??e.implementWeight]:c.profile.loadAccounting==='per_implement'?[eq.implementCount??e.implementCount]:null,eq.cableConfiguration||null,eq.loadConvention||null,p.roundIndex??s.roundIndex??s.round??null,s.segmentIndex??(num(s.mini)!=null?num(s.mini)-1:null),e.assistanceProtocol||null,c.profile.movementKind==='cardio'?c.exercise.cardioProtocol||[c.exercise.paceTarget,c.exercise.incline,c.exercise.powerTarget,c.exercise.resistanceLevel,c.exercise.intervalProtocol]:null]);
 }
 function getComparableEvidence(c,sessions=c.history){
  const key=comparableKey(c),snapshot=c[evidenceSnapshot];
  if(snapshot&&snapshot.sessions===sessions&&snapshot.now===c.now&&snapshot.key===key)return snapshot.value;
  const dedup=new Map(),earliest=c.now-CONFIG.historyWindowDays*86400000;
  for(const session of sessions||[]){
   const at=date(session.ended||session.started||session.date);
   if(session.id===c.session.id||session.pendingCompletion||at>c.now||at<earliest||c.session.userId&&(session.userId||session.recommendationActorId)&&(session.userId||session.recommendationActorId)!==c.session.userId)continue;
   const old=dedup.get(String(session.id));
   if(!old||date(session.revision??session.updatedAt)>date(old.revision??old.updatedAt)||date(session.revision??session.updatedAt)===date(old.revision??old.updatedAt)&&fingerprint(session)>fingerprint(old))dedup.set(String(session.id),session);
  }
  const result=[];
  for(const session of [...dedup.values()].sort((a,b)=>date(b.ended||b.started||b.date)-date(a.ended||a.started||a.date)||String(a.id).localeCompare(String(b.id)))){
   const rows=[];
   for(const ex of session.ex||[]){
    const profile=P.resolve(ex);
    if(profile.canonicalId!==c.profile.canonicalId)continue;
    for(const [i,set] of (ex.set||[]).entries()){
     const old=normalizeRecommendationInput({exercise:ex,set,actual:set,session,now:c.now,profile,equipment:set.equipmentSnapshot||ex.equipmentProfile||{},scope:c.scope});
     if(comparableKey(old)!==key||old.actual.status!=='completed'||old.actual.warmup||date(set.performedAt)>c.now)continue;
     if(set.equipmentSnapshot?.id&&c.equipment.id&&set.equipmentSnapshot.id!==c.equipment.id)continue;
     rows.push({context:old,setId:set.id||`${session.id}:${rows.length}`,index:i});
    }
   }
   if(rows.length)result.push({sessionId:String(session.id),performedAt:date(session.ended||session.started||session.date),rows,expected:Math.max(...(session.ex||[]).filter(e=>rows.some(r=>r.context.exercise===e)).map(e=>(e.set||[]).filter(s=>!s.warmup).length),rows.length)});
   if(result.length>=CONFIG.historySessionLimit)break;
  }
  return result;
 }
 function estimateSet(c){
  const a=c.actual,policy=c.profile.e1rmPolicy;
  if(a.rom==='planned_partial'&&!c.exercise.variantId)return null;
  if(c.profile.family==='F12'&&a.technique!=='clean')return null;
  if(policy==='disabled'||!['completed'].includes(a.status)||a.excludesFromStrength||a.warmup||a.pain||a.technique==='invalid'||a.rom==='unplanned_partial'||a.assistedByPartner||a.censored||a.conflict||a.uncertain||a.effortPrecision!=='estimated'||a.actualRir==null||a.actualRir>4||!(a.reps>=1&&a.reps<=15)||a.actualRestSec!=null&&c.prescription.restTargetSec>0&&a.actualRestSec<c.prescription.restTargetSec*.8)return null;
  if(!(['SLDR','REST_PAUSE'].includes(c.prescription.methodId)&&a.segmentIndex===0)&&!ordinary(c.prescription.setRole)&&c.prescription.setRole!=='top_set'&&c.prescription.setRole!=='test_attempt')return null;
  if(['SLDR','REST_PAUSE','DS','DROP_SET'].includes(c.prescription.methodId)&&a.segmentIndex>0)return null;
  if(['SLDR','REST_PAUSE','DS','DROP_SET'].includes(c.prescription.methodId)&&a.segmentIndex==null)return null;
  const model=modelLoad(a.weight,c);return model>0?round(model*(1+(a.reps+a.actualRir)/30)):null;
 }
 function median(xs){const a=xs.filter(x=>x!=null&&Number.isFinite(x)).slice().sort((a,b)=>a-b);return a.length?round((a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2):null;}
 function weightedMedian(points){
  const a=points.filter(x=>Number.isFinite(x.value)&&x.weight>0).slice().sort((x,y)=>x.value-y.value),total=a.reduce((s,x)=>s+x.weight,0);let acc=0;
  for(let i=0;i<a.length;i++){acc+=a[i].weight;if(Math.abs(acc-total/2)<1e-9&&a[i+1])return round((a[i].value+a[i+1].value)/2);if(acc>=total/2)return a[i].value;}
  return null;
 }
 function estimateLocalCapacity(evidence,profile){
  if(profile.e1rmPolicy==='disabled')return {estimate:null,confidence:'none',sessions:[],outliers:[]};
  let sessions=evidence.map(s=>({...s,value:median(s.rows.slice(0,2).map(r=>estimateSet(r.context))),validSets:s.rows.slice(0,2).filter(r=>estimateSet(r.context)!=null).length})).filter(s=>s.value!=null).slice(0,3);
  const outliers=[];
  if(sessions.length>=3){const previous=median(sessions.slice(1).map(x=>x.value));if(Math.abs(sessions[0].value/previous-1)>.10&&Math.abs(sessions[0].value/sessions[1].value-1)>.10){outliers.push(sessions[0].sessionId);sessions=sessions.slice(1);}}
  return {estimate:weightedMedian(sessions.map((s,i)=>({value:s.value,weight:CONFIG.estimateWeights[i]}))),sessions,outliers,
   confidence:profile.profileStatus==='resolved'&&sessions.length>=3&&sessions.every(s=>s.validSets>=2&&s.rows.slice(0,2).every(r=>r.context.actual.technique==='clean'&&r.context.actual.rom==='full'&&r.context.actual.actualRestSec!=null))?'high':sessions.length>=1?'medium':'low'};
 }
 function evidenceMeta(evidence,estimate,c){
  const age=evidence[0]?(c.now-evidence[0].performedAt)/86400000:Infinity;
  return {evidenceSessionIds:evidence.map(s=>s.sessionId),evidenceSetIds:evidence.flatMap(s=>s.rows.map(r=>r.setId)),
   confidence:c.profile.profileStatus!=='resolved'||age>21||evidence.length===1&&evidence[0].rows.length<2||evidence.some(s=>s.rows.some(r=>r.context.actual.reps>12||r.context.actual.actualRestSec==null||r.context.actual.effortPrecision==='coarse'))?'low':estimate.confidence==='high'&&evidence.reduce((n,s)=>n+s.rows.length,0)>=6?'high':evidence.length?'medium':'low',
   warnings:[...(age>=14?['stale_history']:[]),...(estimate.outliers.length?['provisional_outlier']:[])]};
 }
 function recommendPhaseChange(raw){
  const c=raw.engineVersion===3?{...raw,scope:'PHASE_CHANGE'}:normalizeRecommendationInput({...raw,scope:'PHASE_CHANGE'},raw.registry);
  const evidence=getComparableEvidence(c),estimate=estimateLocalCapacity(evidence,c.profile),meta=evidenceMeta(evidence,estimate,c);
  if(c.profile.e1rmPolicy==='disabled'||estimate.estimate==null)return output(c,'calibrate','no_phase_proxy','Для смены диапазона нужен подбор в новой цели',null,meta);
  const p=c.prescription;if(!equipmentKnown(c))return output(c,'review','unknown_equipment','Уточни реальные ступени оборудования перед сменой диапазона',null,meta);
  if(!validTarget(p))return output(c,'review','invalid_target','Проверь диапазон повторений и RIR');
  const last=evidence[0]?.rows[0]?.context.actual.weight;c.referenceWeight=last;
  const bounds=[estimate.estimate/(1+(p.repMax+p.targetRirMax)/30),estimate.estimate/(1+(p.repMin+p.targetRirMin)/30)];
  const pool=[...new Set([...candidates(c,last),...candidates(c,fromModel(bounds[0],c)),...candidates(c,fromModel(bounds[1],c))])];
  const legal=pool.filter(w=>{const m=modelLoad(w,c);return m!=null&&m>=bounds[0]-1e-6&&m<=bounds[1]+1e-6;});
  const anchor=last??fromModel((bounds[0]+bounds[1])/2,c),weight=nearest(legal,anchor,anchor);
  if(weight==null)return output(c,'review','equipment_corridor_conflict','В расчётном коридоре нет доступной ступени',null,{...meta,rawTargetLoad:bounds,blockedByEquipment:true});
  const lastReps=evidence[0]?.rows[0]?.context.actual.reps;
  if(last!=null&&Math.abs(modelLoad(weight,c)/modelLoad(last,c)-1)>.2||lastReps>=13&&p.repMin<=3)
   return output(c,'review','large_phase_change','Большая смена нагрузки или тяжёлый диапазон: требуется подтверждение и подбор',null,{...meta,rawTargetLoad:bounds,fallback:{suggestedWeight:weight,needsAcknowledgement:true}});
  return output(c,'hold','phase_projection','Предварительный вес под новый диапазон; проверь его по факту',weight,{...meta,confidence:meta.confidence==='high'?'medium':meta.confidence,rawTargetLoad:bounds});
 }
 function percentPrescription(c){
  const p=c.prescription;if(p.strategyId!=='PERCENT_PERIODIZED')return null;
  const reference=p.referenceValue??num(c.exercise[p.referenceType])??(p.referenceType==='estimated1RM'?estimateLocalCapacity(getComparableEvidence(c),c.profile).estimate:null);
  if(!['measured1RM','estimated1RM','trainingMax'].includes(p.referenceType)||!(reference>0)||!(p.percent>0))return output(c,'calibrate','missing_percent_reference','Уточни базу процентов: измеренный 1ПМ, оценка или training max');
  const fraction=p.percent>1?p.percent/100:p.percent;
  if(fraction>1.1||p.referenceType==='measured1RM'&&fraction>1)return output(c,'review','above_measured_reference','Повышенный процент требует проверки протокола и актуальности базы');
  if(p.referenceType==='measured1RM'&&fraction>=1&&p.repMax>1)return output(c,'review','percent_repetition_conflict','100% измеренного 1ПМ конфликтует с назначением нескольких повторений');
  if(p.referenceType==='measured1RM'&&fraction>=1&&!p.plannedTest)return output(c,'review','test_role_required','Работа на измеренном максимуме требует явного тестового протокола');
  const target=reference*fraction;
  if(fromModel(target,c)==null)return output(c,'review','missing_load_configuration','Уточни массу тела или конфигурацию нагрузки для обратного перевода');
  if(fromModel(target,c)<0)return output(c,'review','bodyweight_boundary','Для такой нагрузки нужен согласованный вариант с помощью, а не отрицательное отягощение');
  const weight=nearest(candidates(c,fromModel(target,c)),fromModel(target,c),c.actual.weight);
  return weight==null?output(c,'review','missing_equipment','Нет доступных весов для процентного назначения'):output(c,'hold','percent_prescription','Сохранён главный процентный план; RIR служит обратной связью',weight,{rawTargetLoad:target});
 }
 function methodBlockAssessment(c,session){
  const relax=x=>comparableKey({...x,set:{...x.set,roundIndex:null,round:null,segmentIndex:null,mini:null},prescription:{...x.prescription,roundIndex:null}});
  const key=relax(c),rows=[];
  for(const ex of session.ex||[])for(const set of ex.set||[]){
   const x=normalizeRecommendationInput({exercise:ex,set,session,now:c.now,scope:'NEXT_SESSION',equipment:set.equipmentSnapshot||ex.equipmentProfile||{},profile:P.resolve(ex)});
   if(relax(x)!==key||x.actual.warmup)continue;
   if(Array.isArray(set.segments)&&set.segments.length){
    set.segments.forEach((segment,i)=>rows.push(normalizeRecommendationInput({exercise:ex,set:{...set,...segment,segments:undefined,segmentIndex:i,status:set.status||'completed'},session,now:c.now,profile:x.profile,equipment:x.equipment})));}
   else rows.push(x);
  }
  const expected=(c.exercise.set||c.exercise.sets||[]).filter(s=>!s.warmup&&normalizeRole(s.setRole||s.role||c.exercise.phaseRole||c.exercise.phase||'ordinary')===c.prescription.setRole).reduce((n,s)=>n+(s.segments?.length||1),0)||c.prescription.setCount;
  const complete=rows.length>=expected&&rows.every(x=>x.actual.status==='completed');
  const mastered=complete&&rows.every(x=>{const a=x.actual,p=x.prescription;return a.reps>=p.repMax&&!a.pain&&a.technique!=='invalid'&&a.technique!=='degraded'&&a.rom!=='unplanned_partial'&&!a.assistedByPartner&&a.effortKnown&&!a.conflict&&!a.censored&&a.actualRir>=p.targetRirMin;});
  return {complete,mastered,rows,expected};
 }
 function recommendMethodBlock(c,evidence,baseline,up,meta){
  const blocks=evidence.slice(0,2).map(s=>methodBlockAssessment(c,s.rows[0].context.session));
  const model=modelLoad(baseline,c),fraction=up!=null&&model>0?modelLoad(up,c)/model-1:Infinity;
  const count=c.profile.profileStatus==='resolved'&&meta.confidence!=='low'&&fraction<=.05?1:2;
  if(up!=null&&fraction<=.05&&blocks.length>=count&&blocks.slice(0,count).every(b=>b.mastered))
   return output(c,'harder','method_block_mastered','Сопоставимый полный блок освоен: одна ступень для этой роли или начальной части кластера',up,{...meta,suggestedReps:c.prescription.repMin});
  return output(c,'hold','method_protocol','Сохрани вес этой роли; прогресс оценивается по полному сопоставимому блоку',baseline,{...meta,methodEvidence:blocks.map(b=>({complete:b.complete,mastered:b.mastered,expected:b.expected}))});
 }
 function recommendNextSession(raw){
  const c=raw.engineVersion===3?{...raw,scope:raw.scope||'NEXT_SESSION'}:normalizeRecommendationInput({...raw,scope:'NEXT_SESSION'},raw.registry);
  const g=guards(c,{precise:false});if(g&&['stop','review'].includes(g.effortAction))return g;
  if(!['load','assistance'].includes(c.profile.progressionMetric))return nonStrength(c);
  const percent=percentPrescription(c);if(percent)return percent;
  const evidence=getComparableEvidence(c),estimate=estimateLocalCapacity(evidence,c.profile),meta=evidenceMeta(evidence,estimate,c);
  const provisional=c.set.provisionalBaseline;
  if(!evidence.length&&provisional&&provisional.equipmentId===(c.equipment.id||null)&&provisional.variantId===(c.exercise.variantId||null)&&num(provisional.weight)!=null)
   return output(c,'hold','calibration_baseline','Сохранён предварительный старт после пробы; подтверди рабочим подходом',num(provisional.weight),{confidence:'low'});
  if(!evidence.length&&c.prescription.weightMode==='prescribed'&&c.prescription.plannedWeight!=null){const w=c.prescription.plannedWeight;if(w>0||w===0&&['bodyweight_added','bodyweight_assisted'].includes(c.profile.loadAccounting))return output(c,'hold','prescribed_no_history','Сохранено назначение тренера; первая рабочая серия уточнит рекомендацию',w,{confidence:'low'});return output(c,'review','invalid_prescribed_weight','Проверь назначенный вес и единицы');}
  if(!evidence.length)return output(c,'calibrate','no_comparable_history','Нет сопоставимой истории: подбери вес в текущем диапазоне',null,meta);
  if(c.now-evidence[0].performedAt>=28*86400000)return output(c,'calibrate','provisional_restart','После длительного перерыва проверь предварительный старт',null,{...meta,fallback:{suggestedWeight:evidence[0].rows[0].context.actual.weight,needsAcknowledgement:true}});
  const cleanEarly=evidence[0].rows.slice(0,2).find(r=>{const a=r.context.actual;return !a.pain&&!a.assistedByPartner&&!a.excludesFromStrength&&a.technique!=='invalid'&&a.rom!=='unplanned_partial'&&a.weight!=null;});
  if(!cleanEarly)return output(c,'review','no_valid_early_weight','В ранних подходах нет пригодного стартового веса; проверь выполнение',null,meta);
  if(evidence[0].rows.some(r=>r.context.actual.pain))return output(c,'review','history_pain','В последней серии отмечена боль: нужна проверка перед новым назначением',null,meta);
  if(evidence.every(s=>s.rows.every(r=>r.context.actual.reps==null)))return output(c,'review','ambiguous_repetition_units','Уточни повторы и способ счёта на сторону',null,meta);
  if(evidence.every(s=>s.rows.every(r=>r.context.actual.conflict)))return output(c,'review','historical_effort_conflict','Фактические RIR и RPE истории противоречат друг другу',null,meta);
  const firstRow=cleanEarly.context,last=firstRow.actual.weight,p=c.prescription;c.referenceWeight=last;
  const changed=firstRow.prescription.repMin!==p.repMin||firstRow.prescription.repMax!==p.repMax||firstRow.prescription.targetRirMin!==p.targetRirMin||firstRow.prescription.targetRirMax!==p.targetRirMax;
  if(changed)return recommendPhaseChange(c);
  const success=(session,top)=>session.rows.length>=Math.max(p.setCount||1,session.expected)*p.successFraction&&session.rows.every(({context:x})=>{
   const a=x.actual;return a.reps>=(top?p.repMax:p.repMin)&&(!a.sideResults||Object.values(a.sideResults).every(x=>{const q=typeof x==='object'?effort(x):null;return num(typeof x==='object'?x.actualReps??x.reps:x)>=(top?p.repMax:p.repMin)&&(!q?.effortKnown||q.actualRir>=p.targetRirMin&&!q.conflict&&!q.censored);}))&&!a.pain&&!a.assistedByPartner&&a.technique!=='invalid'&&a.rom!=='unplanned_partial'&&(!top||a.effortKnown&&!a.censored&&!a.conflict&&!a.uncertain&&a.actualRir>=p.targetRirMin);});
  const start=normalizeRecommendationInput({...c,actual:{w:last},profile:c.profile,prescription:p,equipment:c.equipment,now:c.now});
  start.actual.bodyWeight=c.actual.bodyWeight??firstRow.actual.bodyWeight;
  const available=candidates(start,last);
  const knownEquipment=equipmentKnown(c);
  if(!knownEquipment)return output(c,'review','unknown_equipment','Укажи доступные веса либо минимум, максимум и шаг оборудования',null,meta);
  const baseline=nearest(available,last,last);
  if(baseline==null)return output(c,'review','equipment_empty','Нет доступной ступени для старта',null,meta);
  const model=modelLoad(last,start);if(!(model>0))return output(c,'review','unknown_model_load','Уточни конфигурацию и массу тела',null,meta);
  const weights=candidates(start,last).filter(w=>modelLoad(w,start)>model).sort((a,b)=>modelLoad(a,start)-modelLoad(b,start)),up=weights[0];
  if(p.strategyId!=='LINEAR_SETS'&&evidence.every(s=>s.rows.every(r=>!r.context.actual.effortKnown)))return output(c,'hold','unknown_effort_history','В истории нет фактического RIR: повтори известный вес и укажи усилие',baseline,{...meta,confidence:'low',needsAcknowledgement:true});
  if(p.plannedDeload||!p.allowLoadIncrease)return output(c,'hold','planned_deload','Сохранена плановая лёгкая нагрузка',baseline,meta);
  if(['FST-7','SLDR','DS','UNVRSL','REST_PAUSE','DROP_SET'].includes(p.methodId))return recommendMethodBlock(c,evidence,baseline,up,meta);
  if(!ordinary(p.setRole))return output(c,'hold','method_role','Сохрани отдельное назначение этой роли',baseline,meta);
  const strategy=p.strategyId;
  if(['MANUAL','COACH_PRESCRIBED','AMRAP'].includes(strategy))return output(c,'hold','prescribed_plan','Сохрани назначение; изменение области только по явному выбору',p.plannedWeight??baseline,meta);
  const mastered=evidence.slice(0,2).map(s=>success(s,strategy!=='LINEAR_SETS'));
  const stepFraction=up!=null?modelLoad(up,start)/model-1:Infinity;
  const enough=p.setCount>0&&(strategy==='LINEAR_SETS'?mastered[0]:stepFraction<=.05&&meta.confidence!=='low'&&c.profile.profileStatus==='resolved'?mastered[0]:mastered.length>=2&&mastered.every(Boolean));
  const prediction=up!=null&&estimate.estimate!=null?estimate.estimate/modelLoad(up,start)*30-30-p.targetRirMin:null;
  if(up!=null&&enough&&(strategy==='LINEAR_SETS'||stepFraction<=.05||prediction!=null&&prediction>=p.repMin)&&c.now-evidence[0].performedAt<14*86400000)
   return output(c,'harder','series_mastered','Полная серия освоена: одна доступная ступень вверх',up,{...meta,suggestedReps:p.repMin});
  const earlyMiss=s=>s.rows.slice(0,2).some(({context:x})=>x.actual.reps!=null&&x.actual.reps<p.repMin&&x.actual.effortKnown&&x.actual.actualRir<p.targetRirMin&&x.actual.technique==='clean'&&x.actual.actualRestSec!=null&&x.actual.actualRestSec>=(p.restTargetSec||0)*.8);
  if(strategy==='LINEAR_SETS'&&p.setCount>0&&evidence.length>=3&&evidence.slice(0,3).every(s=>!success(s,false)))return output(c,'review','linear_reset','Три последовательных неудачи: предложение reset по правилам программы',null,{...meta,fallback:{suggestedWeight:nearest(candidates(start,last),last*.9,last),needsAcknowledgement:true}});
  if(strategy!=='LINEAR_SETS'&&evidence.length>=2&&evidence.slice(0,2).every(earlyMiss)){
   const down=candidates(start,last).filter(w=>modelLoad(w,start)<model).sort((a,b)=>modelLoad(b,start)-modelLoad(a,start))[0];
   if(down!=null)return output(c,'easier','repeated_early_miss','Два ранних недобора при соблюдённом отдыхе: одна ступень вниз',down,meta);
  }
  return output(c,'hold','develop_repetitions',up==null?'Нет следующей ступени: сохраняем назначение':'Сначала освой полную серию; одиночный поздний недобор не меняет старт',baseline,{...meta,suggestedReps:p.repMax,blockedByEquipment:up==null});
 }
 function recommendStart(raw){
  const c=raw.engineVersion===3?{...raw,scope:'START'}:normalizeRecommendationInput({...raw,scope:'START'},raw.registry);
  const r=recommendNextSession(c),factor=num(c.session.readiness?.factor);
  if(c.session.readinessAdjusted&&factor>0&&factor<1&&r.suggestedWeight!=null&&!['review','calibrate','stop'].includes(r.effortAction)){
   const model=modelLoad(r.suggestedWeight,c),target=model*clamp(factor,.85,1);
   const weights=candidates(c,r.suggestedWeight).filter(w=>modelLoad(w,c)<=target&&modelLoad(w,c)>0);
   const chosen=nearest(weights,fromModel(target,c),r.suggestedWeight);
   c.referenceWeight=r.suggestedWeight;
   if(chosen!=null)return output(c,'hold','readiness_start','Самочувствие учтено один раз при старте; проверь фактическое усилие',chosen,{confidence:r.confidence,evidenceSessionIds:r.evidenceSessionIds,evidenceSetIds:r.evidenceSetIds,warnings:r.warnings});
  }
  return r;
 }
 function recommendCalibration(raw){
  const c=raw.engineVersion===3?{...raw,scope:'CALIBRATION'}:normalizeRecommendationInput({...raw,scope:'CALIBRATION'},raw.registry),a=c.actual;
  const g=guards(c,{precise:false});if(g)return g;
  if((raw.attempts||[]).length>=3)return output(c,'review','calibration_trial_limit','Три пробы выполнены: сохрани предварительный результат и продолжи подбор в другой день');
  if(!['load','assistance'].includes(c.profile.progressionMetric))return nonStrength(c);
  const w=a.weight;if(w==null)return output(c,'calibrate','choose_first_load','Выбери лёгкую реальную ступень после разминки');
  if(raw.familiar===false&&['F01','F02','F03'].includes(c.profile.family))return output(c,'review','learn_technique','Незнакомое технически сложное упражнение: сначала техника и ручной лёгкий старт');
  const p=c.prescription,hard=a.reps<p.repMin||a.actualRir!=null&&a.actualRir<2,easy=a.censored||a.actualRir>=5||a.effortPrecision==='coarse'&&a.actualRpe>0&&a.actualRpe<6;
  if(!a.effortKnown||a.technique!=='clean')return hold(c,'calibration_unknown','Уточни усилие и технику; прибавка пока недоступна');
  const current=modelLoad(w,c),direction=hard?-1:easy?1:0;
  const available=candidates(c,w).filter(x=>direction<0?modelLoad(x,c)<current:modelLoad(x,c)>current).sort((x,y)=>Math.abs(modelLoad(x,c)-current)-Math.abs(modelLoad(y,c)-current));
  if(direction&&available.length){const next=available[0];if(direction>0&&modelLoad(next,c)/current-1>.10)return hold(c,'calibration_coarse_step','Ступень больше 10%: сохрани лёгкий вес и подбирай повторения');return output(c,direction>0?'harder':'easier','calibration_step','Одна реальная ступень; не более трёх проб',next,{needsAcknowledgement:true});}
  return hold(c,'provisional_baseline','Предварительный рабочий вес: подтверди следующим подходом или тренировкой',{confidence:'low'});
 }
 function recommendTestAttempt(raw){
  const c=raw.engineVersion===3?{...raw,scope:'TEST'}:normalizeRecommendationInput({...raw,scope:'TEST'},raw.registry);
  const g=guards(c,{precise:false});if(g)return g;
  if(!c.prescription.plannedTest||!['test_attempt','top_set'].includes(c.prescription.setRole)||!['F01','F02','F04','F05'].includes(c.profile.family))return output(c,'review','test_not_authorized','Тест требует явной роли, подходящего упражнения и подтверждённого протокола');
  if(c.actual.status==='failed_attempt'||(raw.attempts||[]).some(x=>x.status==='failed_attempt'||x.painFlag||x.technique==='invalid'))return output(c,'stop','failed_test','После неудачной попытки автоприбавка заблокирована');
  const evidence=getComparableEvidence(c),estimate=estimateLocalCapacity(evidence,c.profile);
  if(evidence[0]&&c.now-evidence[0].performedAt>=28*86400000)return output(c,'review','test_stale_history','После перерыва сначала проверь текущий рабочий вес');
  if(evidence.length<3||c.profile.profileStatus!=='resolved')return output(c,'calibrate','test_insufficient_evidence','Нет подтверждённой тяжёлой истории для автоматической тестовой попытки');
  const last=evidence[0].rows[0].context.actual.weight;
  const current=c.actual;
  if(current.status==='completed'&&current.technique==='clean'&&current.reps>=c.prescription.repMin&&current.actualRir>=1&&!current.uncertain){
   const m=modelLoad(current.weight,c),up=candidates(c,current.weight).filter(w=>modelLoad(w,c)>m&&modelLoad(w,c)/m-1<=.025+1e-6).sort((a,b)=>modelLoad(a,c)-modelLoad(b,c))[0];
   if(up!=null)return output(c,'harder','successful_test_step','Предыдущая попытка выполнена: следующая малая ступень по явному протоколу',up,{confidence:'medium',evidenceSessionIds:evidence.map(s=>s.sessionId)});
  }
  return output(c,'review','test_coach_confirmation','Подтверди консервативную попытку по успешным тяжёлым результатам',null,{fallback:{suggestedWeight:last,needsAcknowledgement:true},evidenceSessionIds:evidence.map(s=>s.sessionId)});
 }
 function recommend(raw){const c=raw.engineVersion===3&&raw.profile?raw:normalizeRecommendationInput(raw,raw.registry,raw.overrides);
  if(c.prescription.plannedTest&&['START','LIVE'].includes(c.scope))return recommendTestAttempt(c);
  return ({LIVE:recommendNextSet,START:recommendStart,NEXT_SESSION:recommendNextSession,PHASE_CHANGE:recommendPhaseChange,CALIBRATION:recommendCalibration,TEST:recommendTestAttempt}[c.scope]||recommendStart)(c);
 }
 function validatePrescription(p) {
    if(!p||!p.sets)return {valid:true,warnings:[],corridor:null};
    const warnings=[];
    if(!p.reps||p.reps[0]<1||p.reps[1]<p.reps[0]||!p.rpe||p.rpe[0]<1||p.rpe[1]>10||p.rpe[1]<p.rpe[0])return {valid:false,warnings:['Некорректные повторы или RPE'],corridor:null};
    if(p.rir&&(Math.abs(p.rir[0]-(10-p.rpe[1]))>.01||Math.abs(p.rir[1]-(10-p.rpe[0]))>.01))warnings.push('RIR должен равняться 10 − RPE');
    const effort=[100/(1+(p.reps[1]+10-p.rpe[0])/30),100/(1+(p.reps[0]+10-p.rpe[1])/30)];
    const intersection=[Math.max(p.pct[0],effort[0]),Math.min(p.pct[1],effort[1])];
    const conflict=intersection[0]>intersection[1]+.01;
    if(conflict)warnings.push('Проценты расходятся с повторами и RIR: проверь стратегию и базу процентов');
    return {valid:!warnings.length,warnings,corridor:conflict?effort:intersection,effortCorridor:effort};
  }
 function applicationFingerprint(set){const copy={...set};for(const k of ['recommendation','recommendedW','recommendationDecision','recommendationRestore','trainingIntensity292','dismissedRecommendation'])delete copy[k];return fingerprint(copy);}
 function applyRecommendation(state,r,options={}){
  if(typeof options==='string')options={scope:options};
  const {targetSetId=r.targetSetId,now=0,scope='next_set'}=options;
  if(!['next_set','selected_set'].includes(scope))return {applied:false,reason:'unsupported_scope'};
  let set=state;
  if(state.current?.ex||state.ex){
   const session=state.current||state,path=r.targetPath;
   if(path&&path.sessionId!==session.id)return {applied:false,reason:'stale_target'};
   set=path?session.ex[path.exerciseIndex]?.set?.[path.setIndex]:(session.ex||[]).flatMap(e=>e.set||[]).find(s=>(s.recommendationTargetId||s.id)===r.targetSetId);
   if(!set)return {applied:false,reason:'target_not_found'};
  }
  const identity=set.recommendationTargetId||set.id;
  if(identity&&r.targetSetId&&identity!==r.targetSetId)return {applied:false,reason:'stale_target'};
  if(set.recommendationDecision?.id===r.id&&set.recommendationDecision.status==='applied')return {applied:false,reason:'already_applied'};
  if(set.ok||set.skipped||['completed','skipped','failed_attempt'].includes(set.status))return {applied:false,reason:'not_pending'};
  if(r.targetSetId!==targetSetId||r.applicationFingerprint&&applicationFingerprint(set)!==r.applicationFingerprint)return {applied:false,reason:'stale_input'};
  const quantity=r.suggestedReps??r.suggestedSeconds??r.suggestedDistance;
  if(r.suggestedWeight==null&&quantity==null||r.suggestedWeight!=null&&!Number.isFinite(r.suggestedWeight)||quantity!=null&&!Number.isFinite(quantity)||['stop','review','calibrate'].includes(r.effortAction)||r.needsAcknowledgement)return {applied:false,reason:'not_applicable'};
  if(!set.originalPrescription)set.originalPrescription={plannedWeight:num(first(set.programW,set.assignedW,set.plannedWeight,set.plannedW)),workSeconds:set.workSeconds??null,targetRepMin:set.targetRepMin??null,targetRepMax:set.targetRepMax??null,provenance:'recommendation-v3'};
  const keys=['w','selectedW','plannedW','weightSource','manualOverride','selectedRepTarget','selectedDurationSec','workSeconds','selectedDistanceTarget','targetDistance'];
  set.recommendationRestore={id:r.id,values:Object.fromEntries(keys.filter(k=>Object.hasOwn(set,k)).map(k=>[k,set[k]])),absent:keys.filter(k=>!Object.hasOwn(set,k))};
  if(r.suggestedWeight!=null){set.w=set.selectedW=r.suggestedWeight;set.weightSource='recommendation';set.manualOverride=false;}
  if(r.suggestedReps!=null)set.selectedRepTarget=r.suggestedReps;
  if(r.suggestedSeconds!=null)set.selectedDurationSec=set.workSeconds=r.suggestedSeconds;
  if(r.suggestedDistance!=null)set.selectedDistanceTarget=set.targetDistance=r.suggestedDistance;
  set.recommendationDecision={id:r.id,proposalKey:r.inputFingerprint,status:'applied',weight:r.suggestedWeight,at:now};
  return {applied:true};
 }
 function undoRecommendation(set){
  if(set.ok||set.skipped||['completed','skipped','failed_attempt'].includes(set.status)||!set.recommendationRestore)return false;
  const restore=set.recommendationRestore;Object.assign(set,restore.values||restore);for(const key of restore.absent||[])delete set[key];
  delete set.recommendationRestore;set.recommendationDecision={...set.recommendationDecision,id:restore.id||set.recommendationDecision?.id,status:'undone'};return true;
 }

 function migrate(state){const out=clone(state);if(out.recommendationSchemaVersion===3)return out;
  for(const session of [...(out.sessions||[]),out.current].filter(Boolean))for(const ex of session.ex||[])for(const s of ex.set||[]){
   // Preserve completed facts byte-for-byte. Legacy ambiguity is recorded separately.
   if(!s.ok&&!s.skipped&&!['completed','skipped','failed_attempt'].includes(s.status)){if(s.recommendation?.engineVersion!==3){delete s.recommendation;delete s.recommendedW;}s.recommendationSchemaVersion=3;}
  }
  out.recommendationSchemaVersion=3;return out;
 }
 return {validatePrescription,CONFIG,num,effort,repetitions,normalizeTempo,fingerprint,normalizeRecommendationInput,resolveExerciseProfile:P.resolve,resolvePrescription,
  modelLoad,fromModel,candidates,equipmentKnown,comparableKey,getComparableEvidence,withComparableEvidence,estimateSet,estimateLocalCapacity,methodBlockAssessment,weightedMedian,median,
  recommend,recommendStart,recommendNextSet,recommendNextSession,recommendPhaseChange,recommendCalibration,recommendTestAttempt,
  applyRecommendation,undoRecommendation,applicationFingerprint,buildExerciseCoverage:P.coverage,migrate};
});
