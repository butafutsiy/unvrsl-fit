export const SCHEMA_VERSION=11;
export const STORAGE_KEY='unvrsl-fit-v11';
export const LEGACY_KEYS=['unvrsl-fit-v3','unvrsl-fit-v2'];

const asArray=value=>Array.isArray(value)?value:[];
const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const stamp=value=>number(value?.updatedAt||value?.t||value?.ended||value?.createdAt||0);
const clone=value=>JSON.parse(JSON.stringify(value));

export function isoDate(value=new Date()){
  const date=value instanceof Date?value:new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function canonicalExerciseName(value=''){
  return String(value)
    .toLocaleLowerCase('ru-RU')
    .replace(/\s+[–—-]\s+(unvrsl|sldr|ds|fst-?7).*$/i,'')
    .replace(/\s+[–—-]\s+w\d+$/i,'')
    .replace(/\s+/g,' ')
    .trim();
}

export function emptyState(now=Date.now()){
  return {
    schemaVersion:SCHEMA_VERSION,
    migratedAt:now,
    updatedAt:now,
    profile:{name:'',role:'client',sex:'male',bio:'',accent:'#30d158'},
    preferences:{week:1,keepAwake:false},
    bodyweights:[],
    deletedBodyweights:[],
    measurements:[],
    deletedMeasurements:[],
    workouts:[],
    deletedWorkoutIds:[],
    activeWorkout:null,
    programs:[],
    assignedPrograms:[],
    clients:[],
    learnedWeights:{},
    readinessLog:[]
  };
}

function uniqueBy(items,keyOf){
  const map=new Map();
  for(const item of items){
    const key=keyOf(item);
    if(!key)continue;
    const current=map.get(key);
    if(!current||stamp(item)>=stamp(current))map.set(key,item);
  }
  return [...map.values()];
}

function normalizeBodyweights(source){
  return uniqueBy(asArray(source).map(item=>({
    date:String(item?.date||item?.d||'').slice(0,10),
    value:number(item?.value??item?.w),
    updatedAt:stamp(item)||Date.now()
  })).filter(item=>item.date&&item.value>=20&&item.value<=400),item=>item.date)
    .sort((a,b)=>a.date.localeCompare(b.date));
}

function normalizeSets(source){
  return asArray(source).map((set,index)=>({
    id:String(set?.id||`set-${index+1}`),
    weight:set?.weight===''||set?.w===''?'':number(set?.weight??set?.w,''),
    reps:set?.reps===''||set?.r===''?'':number(set?.reps??set?.r,''),
    rpe:set?.rpe===''||set?.rpe==null?'':number(set.rpe,''),
    done:Boolean(set?.done??set?.ok)
  }));
}

function normalizeExercises(source){
  return asArray(source).map((exercise,index)=>({
    id:String(exercise?.id||`exercise-${index+1}`),
    name:String(exercise?.name||exercise?.n||'Упражнение'),
    note:String(exercise?.note||exercise?.d||''),
    restSeconds:number(exercise?.restSeconds??exercise?.rest,90),
    targetReps:number(exercise?.targetReps??exercise?.r,0),
    targetRpe:number(exercise?.targetRpe,0),
    planWeight:exercise?.planWeight==null?null:number(exercise.planWeight),
    sourceHasWeight:Boolean(exercise?.sourceHasWeight??exercise?.planWeight!=null),
    group:exercise?.group||exercise?.g||null,
    sets:normalizeSets(exercise?.sets||exercise?.set)
  }));
}

export function normalizeWorkout(source={}){
  return {
    id:String(source.id||`workout-${Date.now()}-${Math.random().toString(36).slice(2,7)}`),
    date:String(source.date||isoDate()).slice(0,10),
    week:number(source.week??source.w,1),
    code:String(source.code||source.c||''),
    name:String(source.name||source.title||'Тренировка'),
    targetRpe:number(source.targetRpe??source.target,8),
    startedAt:number(source.startedAt??source.started,Date.now()),
    endedAt:source.endedAt||source.ended?number(source.endedAt??source.ended):null,
    readiness:source.readiness||null,
    exercises:normalizeExercises(source.exercises||source.ex),
    updatedAt:number(source.updatedAt??source.endedAt??source.ended??source.startedAt??source.started,Date.now())
  };
}

function normalizeTombstones(source,key='id'){
  return uniqueBy(asArray(source).map(item=>typeof item==='string'
    ?{[key]:item,deletedAt:Date.now()}
    :{[key]:String(item?.[key]||item?.d||''),deletedAt:number(item?.deletedAt??item?.at??item?.t,Date.now())}
  ).filter(item=>item[key]),item=>item[key]);
}

export function migrateLegacy(legacy,now=Date.now()){
  if(!legacy||typeof legacy!=='object')return emptyState(now);
  if(number(legacy.schemaVersion)===SCHEMA_VERSION)return normalizeState(legacy,now);
  const state=emptyState(now);
  state.profile={
    name:String(legacy.profile?.name||legacy.displayName||''),
    role:String(legacy.profile?.role||legacy.role||'client')==='trainer'?'trainer':'client',
    sex:String(legacy.profile?.sex||legacy.body||'male')==='female'?'female':'male',
    bio:String(legacy.profile?.bio||legacy.profileBio||''),
    accent:String(legacy.profile?.accent||legacy.accent||'#30d158')
  };
  state.preferences={week:number(legacy.preferences?.week??legacy.week,1),keepAwake:Boolean(legacy.keepAwake)};
  state.bodyweights=normalizeBodyweights(legacy.bodyweights||legacy.bw);
  state.deletedBodyweights=normalizeTombstones(legacy.deletedBodyweights,'date');
  const deletedDates=new Set(state.deletedBodyweights.map(item=>item.date));
  state.bodyweights=state.bodyweights.filter(item=>!deletedDates.has(item.date));
  state.measurements=asArray(legacy.measurements).map(item=>({...clone(item),date:String(item.date||item.d||isoDate()).slice(0,10)}));
  state.deletedMeasurements=normalizeTombstones(legacy.deletedMeasurements,'date');
  const deletedMeasurementDates=new Set(state.deletedMeasurements.map(item=>item.date));
  state.measurements=state.measurements.filter(item=>!deletedMeasurementDates.has(String(item.date||item.d||'').slice(0,10)));
  state.workouts=uniqueBy(asArray(legacy.workouts||legacy.sessions).map(normalizeWorkout),item=>item.id);
  state.deletedWorkoutIds=normalizeTombstones(legacy.deletedWorkoutIds,'id');
  const deletedIds=new Set(state.deletedWorkoutIds.map(item=>item.id));
  state.workouts=state.workouts.filter(item=>!deletedIds.has(item.id));
  state.activeWorkout=legacy.activeWorkout||legacy.current?normalizeWorkout(legacy.activeWorkout||legacy.current):null;
  if(state.activeWorkout&&deletedIds.has(state.activeWorkout.id))state.activeWorkout=null;
  state.programs=clone(asArray(legacy.programs));
  state.assignedPrograms=clone(asArray(legacy.assignedPrograms||legacy.remotePlans));
  state.clients=clone(asArray(legacy.clients));
  state.learnedWeights={...(legacy.learnedWeights||{})};
  state.readinessLog=clone(asArray(legacy.readinessLog));
  state.updatedAt=now;
  return learnFromHistory(state);
}

export function normalizeState(source,now=Date.now()){
  const base={...emptyState(now),...clone(source||{})};
  base.schemaVersion=SCHEMA_VERSION;
  base.profile={...emptyState(now).profile,...(source?.profile||{})};
  base.preferences={...emptyState(now).preferences,...(source?.preferences||{})};
  base.bodyweights=normalizeBodyweights(source?.bodyweights);
  base.deletedBodyweights=normalizeTombstones(source?.deletedBodyweights,'date');
  base.measurements=asArray(source?.measurements).map(item=>clone(item));
  base.deletedMeasurements=normalizeTombstones(source?.deletedMeasurements,'date');
  base.workouts=uniqueBy(asArray(source?.workouts).map(normalizeWorkout),item=>item.id);
  base.deletedWorkoutIds=normalizeTombstones(source?.deletedWorkoutIds,'id');
  const deletedDates=new Set(base.deletedBodyweights.map(item=>item.date));
  const deletedIds=new Set(base.deletedWorkoutIds.map(item=>item.id));
  const deletedMeasurementDates=new Set(base.deletedMeasurements.map(item=>item.date));
  base.bodyweights=base.bodyweights.filter(item=>!deletedDates.has(item.date));
  base.workouts=base.workouts.filter(item=>!deletedIds.has(item.id));
  base.measurements=base.measurements.filter(item=>!deletedMeasurementDates.has(String(item.date||item.d||'').slice(0,10)));
  base.activeWorkout=source?.activeWorkout?normalizeWorkout(source.activeWorkout):null;
  base.programs=asArray(source?.programs);
  base.assignedPrograms=asArray(source?.assignedPrograms);
  base.clients=asArray(source?.clients);
  base.learnedWeights={...(source?.learnedWeights||{})};
  base.readinessLog=asArray(source?.readinessLog);
  return base;
}

export function mergeStates(localSource,remoteSource){
  const normalizeAny=source=>number(source?.schemaVersion)===SCHEMA_VERSION?normalizeState(source):migrateLegacy(source,stamp(source));
  const local=normalizeAny(localSource),remote=normalizeAny(remoteSource);
  const merged=normalizeState(stamp(remote)>=stamp(local)?{...local,...remote}:{...remote,...local});
  merged.deletedBodyweights=normalizeTombstones([...local.deletedBodyweights,...remote.deletedBodyweights],'date');
  merged.deletedWorkoutIds=normalizeTombstones([...local.deletedWorkoutIds,...remote.deletedWorkoutIds],'id');
  merged.deletedMeasurements=normalizeTombstones([...local.deletedMeasurements,...remote.deletedMeasurements],'date');
  merged.bodyweights=normalizeBodyweights([...local.bodyweights,...remote.bodyweights]);
  merged.workouts=uniqueBy([...local.workouts,...remote.workouts],item=>item.id);
  const deletedDates=new Set(merged.deletedBodyweights.map(item=>item.date));
  const deletedIds=new Set(merged.deletedWorkoutIds.map(item=>item.id));
  const deletedMeasurementDates=new Set(merged.deletedMeasurements.map(item=>item.date));
  merged.bodyweights=merged.bodyweights.filter(item=>!deletedDates.has(item.date));
  merged.workouts=merged.workouts.filter(item=>!deletedIds.has(item.id));
  merged.measurements=uniqueBy([...local.measurements,...remote.measurements],item=>String(item.id||item.date||item.d||''));
  merged.measurements=merged.measurements.filter(item=>!deletedMeasurementDates.has(String(item.date||item.d||'').slice(0,10)));
  merged.programs=uniqueBy([...local.programs,...remote.programs],item=>String(item.id||item.title||item.name||''));
  merged.assignedPrograms=uniqueBy([...local.assignedPrograms,...remote.assignedPrograms],item=>String(item.id||item.plan_id||item.title||''));
  merged.clients=uniqueBy([...local.clients,...remote.clients],item=>String(item.id||item.user_id||item.email||''));
  merged.learnedWeights={...remote.learnedWeights,...local.learnedWeights};
  merged.updatedAt=Math.max(stamp(local),stamp(remote),Date.now());
  return learnFromHistory(merged);
}

export function replaceProgramExercise(program,weekIndex,dayId,exerciseIndex,replacement={}){
  const day=asArray(program?.weeks?.[weekIndex]?.days).find(item=>String(item.id)===String(dayId));
  const current=day?.ex?.[exerciseIndex];
  if(!current)return false;
  day.ex[exerciseIndex]={
    ...current,
    n:String(replacement.name||replacement.n||current.n||'Упражнение'),
    sourceId:replacement.sourceId??null,
    bp:replacement.bp??current.bp,
    tg:replacement.tg??current.tg,
    eq:replacement.eq??current.eq
  };
  program.updated=Date.now();
  return true;
}

export function readinessAdjustment(answers={}){
  const scores=['sleep','energy','stress','soreness'].map(key=>Math.min(5,Math.max(1,number(answers[key],5))));
  const deficit=scores.reduce((sum,value)=>sum+(5-value),0);
  if(deficit===0)return 0;
  return -Math.min(10,Math.round((deficit/16*10)/2.5)*2.5);
}

export function roundWeight(value,increment){
  if(!Number.isFinite(Number(value))||Number(value)<=0)return 0;
  const step=number(increment,value<20?1:value<50?2:2.5);
  return Math.max(step,Math.round(Number(value)/step)*step);
}

export function completedSets(exercise){
  return asArray(exercise?.sets).filter(set=>set.done&&number(set.weight)>0&&number(set.reps)>0);
}

export function averageRpe(exercise){
  const values=completedSets(exercise).map(set=>number(set.rpe,NaN)).filter(Number.isFinite);
  return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
}

export function estimateOneRepMax(set){
  const weight=number(set?.weight),reps=number(set?.reps),rpe=number(set?.rpe,8);
  if(weight<=0||reps<=0)return 0;
  const effectiveReps=reps+Math.max(0,10-Math.min(10,Math.max(5,rpe)));
  return weight*(1+effectiveReps/30);
}

export function exerciseRecommendation(history,name,targetReps,targetRpe=8){
  const key=canonicalExerciseName(name);
  const workouts=asArray(history).filter(item=>item.endedAt).sort((a,b)=>number(b.endedAt)-number(a.endedAt));
  for(const workout of workouts){
    const matches=asArray(workout.exercises).filter(exercise=>canonicalExerciseName(exercise.name)===key);
    const sets=matches.flatMap(completedSets).filter(set=>Number.isFinite(number(set.rpe,NaN)));
    if(!sets.length)continue;
    const e1rms=sets.map(estimateOneRepMax).filter(Boolean);
    if(!e1rms.length)continue;
    const e1rm=e1rms.reduce((sum,value)=>sum+value,0)/e1rms.length;
    const reps=Math.max(1,number(targetReps,sets[sets.length-1].reps));
    const rpe=Math.min(10,Math.max(5,number(targetRpe,8)));
    const raw=e1rm/(1+(reps+(10-rpe))/30);
    const recommended=roundWeight(raw);
    return {
      weight:recommended,
      averageRpe:Number((sets.reduce((sum,set)=>sum+number(set.rpe),0)/sets.length).toFixed(1)),
      sourceDate:workout.date,
      sourceSets:sets.map(set=>({weight:number(set.weight),reps:number(set.reps),rpe:number(set.rpe)})),
      e1rm:Number(e1rm.toFixed(1))
    };
  }
  return null;
}

export function adjustedWeight(weight,percent){
  const value=number(weight);
  if(value<=0)return 0;
  return roundWeight(value*(1+Math.min(10,Math.max(-10,number(percent)))/100));
}

export function learnFromHistory(source){
  const state=source;
  const learned={...(state.learnedWeights||{})};
  const ordered=asArray(state.workouts).filter(item=>item.endedAt).sort((a,b)=>number(a.endedAt)-number(b.endedAt));
  for(const workout of ordered){
    for(const exercise of asArray(workout.exercises)){
      const sets=completedSets(exercise);
      if(!sets.length)continue;
      const key=canonicalExerciseName(exercise.name);
      const working=sets.reduce((sum,set)=>sum+number(set.weight),0)/sets.length;
      learned[key]={weight:roundWeight(working),date:workout.date,workoutId:workout.id,updatedAt:workout.endedAt};
    }
  }
  state.learnedWeights=learned;
  return state;
}

export function createWorkout(routine,{targetRpe=8,readiness=null,manualPercent=null,state=emptyState()}={}){
  const percent=manualPercent==null?readinessAdjustment(readiness?.answers||{}):Math.min(10,Math.max(-10,number(manualPercent)));
  const workout={
    id:`workout-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    date:isoDate(),
    week:number(routine.w,1),
    code:String(routine.c||''),
    name:String(routine.t||'Тренировка'),
    targetRpe:number(targetRpe,8),
    startedAt:Date.now(),
    endedAt:null,
    readiness:{...(readiness||{}),adjustmentPercent:percent},
    exercises:[],
    updatedAt:Date.now()
  };
  workout.exercises=asArray(routine.e).map((source,index)=>{
    const name=String(source.n||'Упражнение');
    const key=canonicalExerciseName(name);
    const planWeight=source.w==null?null:number(source.w);
    const learned=state.learnedWeights?.[key]?.weight||0;
    const baseline=planWeight||learned||0;
    const working=adjustedWeight(baseline,percent);
    const rawRecommendation=exerciseRecommendation(state.workouts,name,source.r||0,targetRpe);
    const recommendation=rawRecommendation?{
      ...rawRecommendation,
      baseWeight:rawRecommendation.weight,
      weight:adjustedWeight(rawRecommendation.weight,percent)
    }:null;
    return {
      id:`exercise-${index+1}`,
      name,
      note:String(source.d||''),
      restSeconds:number(source.restSeconds,90),
      targetReps:number(source.r||0),
      targetRpe:number(targetRpe,8),
      planWeight,
      sourceHasWeight:planWeight!=null&&planWeight>0,
      learnedWeight:learned||null,
      recommendation,
      recommendationApplied:false,
      baselinePercent:percent,
      group:source.g||null,
      sets:Array.from({length:Math.max(1,number(source.s,1))},(_,setIndex)=>({
        id:`set-${setIndex+1}`,
        weight:working||'',
        reps:number(source.r||0)||'',
        rpe:number(targetRpe,8),
        done:false
      }))
    };
  });
  return workout;
}

export function applyRecommendation(workout,exerciseId){
  const exercise=workout?.exercises?.find(item=>item.id===exerciseId);
  if(!exercise?.recommendation?.weight)return workout;
  exercise.sets.forEach(set=>{if(!set.done)set.weight=exercise.recommendation.weight});
  exercise.recommendationApplied=true;
  workout.updatedAt=Date.now();
  return workout;
}

export function applyPlanWeight(workout,exerciseId){
  const exercise=workout?.exercises?.find(item=>item.id===exerciseId);
  if(!exercise)return workout;
  const baseline=exercise.planWeight||exercise.learnedWeight||0;
  const value=adjustedWeight(baseline,workout.readiness?.adjustmentPercent||0);
  exercise.sets.forEach(set=>{if(!set.done)set.weight=value||''});
  exercise.recommendationApplied=false;
  workout.updatedAt=Date.now();
  return workout;
}

const MUSCLES=[
  ['Квадрицепс',/присед|жим ногами|разгибан.*ног|выпад|зашаг/i,1],
  ['Ягодицы',/ягод|выпад|зашаг|румын|присед|гиперэкст/i,.75],
  ['Бицепс бедра',/румын|сгибан.*ног|гиперэкст|станов/i,1],
  ['Приводящие',/сведен.*ног|присед|сумо/i,1],
  ['Отводящие',/разведен.*ног/i,1],
  ['Икры',/икр|голен/i,1],
  ['Грудь',/жим лёжа|жим гантел.*наклон|развод|бабоч|кроссовер|отжим/i,1],
  ['Передняя дельта',/армей|жим гантел.*сидя|жим плеч|жим лёжа/i,.75],
  ['Средняя дельта',/махи.*сторон|средн.*дельт|жим плеч|армей/i,1],
  ['Задняя дельта',/задн.*дельт|face pull|обратн.*бабоч|тяга.*лиц/i,1],
  ['Широчайшие',/подтяг|верхн.*блок|нижн.*блок|т-гриф|тяга штанги|пуловер/i,1],
  ['Трапеции',/шраг|тяга штанги|т-гриф|задн.*дельт/i,.6],
  ['Разгибатели спины',/румын|станов|гиперэкст|тяга штанги/i,.65],
  ['Бицепс',/бицеп|сгибан.*рук|молотк|скотт|подтяг/i,1],
  ['Трицепс',/трицеп|француз|разгибан.*голов|канат|жим лёжа|отжим/i,1],
  ['Предплечья',/молотк|сгибан|подтяг|тяга/i,.35],
  ['Кор',/планк|скручив|пресс|подъ.м ног|присед|станов/i,.5]
];

export function muscleLoad(workouts,days=7,now=Date.now()){
  const from=now-days*86400000;
  const result=Object.fromEntries(MUSCLES.map(([name])=>[name,0]));
  for(const workout of asArray(workouts)){
    const time=workout.endedAt||new Date(`${workout.date}T12:00:00`).getTime();
    if(!workout.endedAt||time<from)continue;
    for(const exercise of asArray(workout.exercises)){
      const volume=completedSets(exercise).reduce((sum,set)=>sum+number(set.weight)*number(set.reps),0);
      for(const [name,pattern,factor] of MUSCLES)if(pattern.test(exercise.name))result[name]+=volume*factor;
    }
  }
  return Object.entries(result).map(([name,volume])=>({name,volume:Math.round(volume)})).sort((a,b)=>b.volume-a.volume);
}

export function workoutWeightHistory(workouts,name){
  const key=canonicalExerciseName(name);
  return asArray(workouts).filter(item=>item.endedAt).flatMap(workout=>
    asArray(workout.exercises)
      .filter(exercise=>canonicalExerciseName(exercise.name)===key)
      .map(exercise=>({
        workoutId:workout.id,
        date:workout.date,
        sets:completedSets(exercise),
        averageRpe:averageRpe(exercise),
        maxWeight:Math.max(0,...completedSets(exercise).map(set=>number(set.weight)))
      }))
  ).filter(item=>item.sets.length).sort((a,b)=>b.date.localeCompare(a.date));
}
