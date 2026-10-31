'use strict';
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./workout-domain.js'):root?.WorkoutDomain);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.unvrslProgramModelV386=api;
})(typeof window!=='undefined'?window:globalThis,function(domain){
  const SCHEMA_VERSION=386;
  const MANUAL='manual',AUTO='auto',METHOD='method';
  const number=value=>{
    if(value===''||value==null)return null;
    const parsed=Number(String(value).replace(',','.'));
    return Number.isFinite(parsed)&&parsed>0?parsed:null
  };
  const ordered=(a,b)=>{
    const first=number(a),second=number(b);
    if(first==null&&second==null)return null;
    const lo=first??second,hi=second??first;
    return{min:Math.min(lo,hi),max:Math.max(lo,hi)}
  };
  function parseRange(value){
    if(value==null||value==='')return null;
    if(typeof value==='number')return ordered(value,value);
    if(typeof value==='object'){
      return ordered(
        value.min??value.lo??value.from??value.repsMin??value.minReps,
        value.max??value.hi??value.to??value.repsMax??value.maxReps
      )
    }
    const text=String(value).trim().replace(/,/g,'.');
    const match=text.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/);
    if(match)return ordered(match[1],match[2]);
    const single=text.match(/\d+(?:\.\d+)?/);
    return single?ordered(single[0],single[0]):null
  }
  function legacyRange(exercise){
    const override=exercise?.parameterOverrides?.reps;
    const overrideMode=String(override?.mode||'').toLowerCase();
    if(overrideMode===MANUAL){
      const range=ordered(override.min,override.max);
      if(range)return{...range,mode:MANUAL}
    }
    if(overrideMode===AUTO)return{min:null,max:null,mode:AUTO};
    if(overrideMode===METHOD)return{min:null,max:null,mode:METHOD};
    const canonical=exercise?.reps;
    if(canonical&&typeof canonical==='object'&&!Array.isArray(canonical)){
      const mode=[MANUAL,AUTO,METHOD].includes(String(canonical.mode))?String(canonical.mode):MANUAL;
      const range=parseRange(canonical);
      return range?{...range,mode}:{min:null,max:null,mode}
    }
    const explicit=[
      exercise?.repRange,
      exercise?.targetReps,
      exercise?.repLabel,
      ordered(exercise?.repMin??exercise?.repsMin??exercise?.minReps,exercise?.repMax??exercise?.repsMax??exercise?.maxReps),
      typeof canonical!=='object'?canonical:null
    ];
    for(const value of explicit){
      const range=parseRange(value);
      if(range)return{...range,mode:MANUAL}
    }
    const declared=String(exercise?.repMode||overrideMode||'').toLowerCase();
    const method=String(exercise?.method||'STANDARD').toUpperCase();
    if(declared===AUTO)return{min:null,max:null,mode:AUTO};
    if(declared===METHOD||method==='UNVRSL'||method==='SLDR')return{min:null,max:null,mode:METHOD};
    const first=exercise?.sets?.[0];
    const setRange=ordered(
      first?.targetRepMin??first?.rMin??first?.repsMin,
      first?.targetRepMax??first?.rMax??first?.repsMax
    );
    if(setRange)return{...setRange,mode:MANUAL};
    const single=parseRange(first?.r);
    return single?{...single,mode:MANUAL}:{min:null,max:null,mode:AUTO}
  }
  function normalizeExercise(exercise){
    if(!exercise||typeof exercise!=='object')return exercise;
    const method=String(exercise.method||'STANDARD').toUpperCase();
    exercise.method=method;
    const reps=legacyRange(exercise);
    exercise.reps={
      mode:method==='UNVRSL'||method==='SLDR'?METHOD:reps.mode,
      min:reps.mode===AUTO||reps.mode===METHOD?null:reps.min,
      max:reps.mode===AUTO||reps.mode===METHOD?null:reps.max
    };
    if(exercise.parameterOverrides&&typeof exercise.parameterOverrides==='object'){
      delete exercise.parameterOverrides.reps;
      if(!Object.keys(exercise.parameterOverrides).length)delete exercise.parameterOverrides
    }
    for(const key of ['repMode','repMin','repMax','repRange','repsMin','repsMax','minReps','maxReps','targetReps'])delete exercise[key];
    if(Array.isArray(exercise.sets))exercise.sets.forEach(set=>{
      if(!set||typeof set!=='object')return;
      if(!exercise.cycleManaged)for(const key of ['rMin','rMax','repsMin','repsMax','targetRepMin','targetRepMax','targetRepLabel','repMode'])delete set[key]
    });
    return exercise
  }
  const fallbackId=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  // Legacy independent copies of the five-day builtin cycle do not have
  // cycleOptions/cycleManaged markers, so the cycle-template migration misses
  // them. Repair only inherited STANDARD prescriptions, never user-edited
  // settings, specialist methods, historical sessions or assigned plans.
  function upgradeLegacyIndependentCopy(program){
    if(!domain||!program||program.legacyCopyLoadRevision>=550||
       program.weeks?.length!==8||program.assignedUserId||program.clientId||
       program.cloudPlanId||program.trainerId)return false;
    // Automatically generated cycles can have cycleOptions too.
    if(program.cycleOptions?.periodizationMode==='manual')return false;
    const titles=(program.weeks[0]?.days||[]).map(d=>String(d?.name||''));
    const builtinDayCodes=titles.map(name=>name.match(/^(A1|A2|B|C|D)\s*[·.]/i)?.[1]).filter(Boolean);
    if(builtinDayCodes.length<3||(!program.independentCopy&&builtinDayCodes.length<5))return false;
    const oldSets={1:[4,4],2:[4,4],3:[3,3],4:[4,4],5:[3,3],6:[4,4],7:[3,3]};
    const clone=x=>JSON.parse(JSON.stringify(x));
    const permitted=(exercise,spec,oldCount)=>{
      if(exercise.setCountManual===true||exercise.manualSetCount===true||
         exercise.repsManual===true||exercise.parameterOverrides?.reps?.mode==='manual'||
         exercise.effortSourceMode==='manual'||exercise.parameterOverrides?.effort?.mode==='manual')return false;
      // Older builders accidentally marked an inherited preset as manual
      // when only the kilogram value was explicitly edited. A matching old
      // preset can migrate; a distinct authored repetition range cannot.
      const count=exercise.sets?.length||0;
      if(count!==oldCount&&count!==spec.sets)return false;
      const manual=exercise.reps?.mode==='manual'?exercise.reps:null;
      if(manual?.min!=null&&manual?.max!=null&&Number(manual.min)!==Number(manual.max)){
        // A hand-entered range may be different from the obsolete profile.
        const knownOld={
          1:{base:[12,15],isolation:[10,12]},2:{base:[10,12],isolation:[12,15]},
          3:{base:[8,10],isolation:[15,20]},4:{base:[15,20],isolation:[6,8]},
          5:{base:[6,8],isolation:[15,20]},6:{base:[12,15],isolation:[8,10]},
          7:{base:[4,6],isolation:[15,20]}
        }[spec.week]?.[spec.kind];
        if(!knownOld||Number(manual.min)!==knownOld[0]||Number(manual.max)!==knownOld[1])return false;
      }
      return true;
    };
    let changed=false;
    for(let wi=0;wi<7;wi++){
      const week=program.weeks[wi],profile=domain.weekProfiles[wi+1];
      if(!week||!profile||week.loadProfileManual||week.repGuidanceManual)continue;
      if(week.intensityMin!=null&&week.intensityMax!=null&&
         (Number(week.intensityMin)!==profile.pct[0]||Number(week.intensityMax)!==profile.pct[1]))continue;
      const groups=new Map();
      for(const day of week.days||[])for(const ex of day.ex||[]){
        if(!ex||!Array.isArray(ex.sets)||!ex.sets.length||
           String(ex.method||'STANDARD').toUpperCase()!=='STANDARD'||
           ex.kind==='cardio'||ex.workMode==='timer'||ex.loadType==='time')continue;
        const kind=domain.exerciseKind(ex)==='isolation'?'isolation':'base';
        const key=[ex.sourceId||ex.exerciseId||ex.n,ex.equipmentProfileId||'',ex.techniqueId||'',kind].join('|');
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push({ex,kind});
      }
      for(const occurrences of groups.values()){
        const kind=occurrences[0].kind,spec=profile[kind],index=kind==='isolation'?1:0;
        if(!spec?.sets||occurrences.length>spec.sets||
           occurrences.some(({ex})=>!permitted(ex,{...spec,kind,week:wi+1},oldSets[wi+1][index])))continue;
        for(let i=0;i<occurrences.length;i++){
          const ex=occurrences[i].ex,existing=ex.sets;
          const count=Math.floor(spec.sets/occurrences.length)+(i<spec.sets%occurrences.length?1:0);
          ex.sets=Array.from({length:count},(_,j)=>{
            const set=clone(existing[j]||existing.at(-1));
            set.r=spec.reps[0];set.targetRepMin=spec.reps[0];set.targetRepMax=spec.reps[1];
            set.targetRpeMin=spec.rpe[0];set.targetRpeMax=spec.rpe[1];
            return set;
          });
          ex.weeklySets=spec.sets;
          ex.reps={mode:'auto',min:null,max:null};
          ex.effortSourceMode='auto';
          ex.rpe=(spec.rpe[0]+spec.rpe[1])/2;
          ex.targetIntensityMin=spec.pct[0];ex.targetIntensityMax=spec.pct[1];
          changed=true;
        }
      }
      // Preview and constructor read this profile too. Skip unchanged weeks.
      if(JSON.stringify(week.weeklyLoadProfile)!==JSON.stringify(profile)){
        domain.applyWeekProfile(week,clone(profile));
        changed=true;
      }
    }
    program.legacyCopyLoadRevision=550;
    if(changed)program.updated=Date.now();
    return changed;
  }
  function normalizeProgram(program,idFactory=fallbackId){
    if(!program||typeof program!=='object')program={};
    if(typeof window!=='undefined')window.upgradeBuiltinEngineCycleV502?.(program,idFactory);
    program.id=program.id==null||program.id===''?idFactory('prog'):String(program.id);
    program.name=String(program.name||'Программа');
    if(!Array.isArray(program.weeks))program.weeks=[];
    upgradeLegacyIndependentCopy(program);
    program.weeks.forEach((week,weekIndex)=>{
      if(!week||typeof week!=='object')week=program.weeks[weekIndex]={};
      week.n=Number(week.n)||weekIndex+1;
      if(!Array.isArray(week.days))week.days=[];
      week.days.forEach((day,dayIndex)=>{
        if(!day||typeof day!=='object')day=week.days[dayIndex]={};
        day.id=day.id==null||day.id===''?idFactory('day'):String(day.id);
        day.name=String(day.name||`День ${dayIndex+1}`);
        if(!Array.isArray(day.ex))day.ex=[];
        day.ex=day.ex.filter(Boolean).map(exercise=>{
          // Older women's templates stored the week's suggested point RPE and
          // repetitions as bare numbers. v386 interpreted those suggestions
          // as manual overrides, pinning every client to that one number.
          // An exercise edited in the program editor has an explicit mode;
          // keep that choice, including a deliberately fixed rep target.
          if(program.femaleTemplate===true){
            const first=exercise.sets?.[0];
            const unedited=exercise.parameterOverrides?.version==null;
            const fromLegacySets=unedited&&first&&number(first.r)!=null&&
              (!exercise.reps||exercise.reps.mode===MANUAL&&
                Number(exercise.reps.min)===Number(first.r)&&Number(exercise.reps.max)===Number(first.r))&&
              !exercise.parameterOverrides?.reps&&
              !exercise.repRange&&!exercise.targetReps&&!exercise.repLabel&&
              exercise.repMin==null&&exercise.repMax==null;
            if(fromLegacySets)exercise.reps={mode:AUTO,min:null,max:null};
            if(unedited&&!exercise.effortSourceMode&&!exercise.rpeMode&&
               !exercise.parameterOverrides?.effort&&exercise.rpeMin==null&&exercise.rpeMax==null&&
               number(exercise.rpe)!=null){
              exercise.effortSourceMode=AUTO;
            }
          }
          return normalizeExercise(exercise)
        })
      })
    });
    // Re-sync saved automatic cycle templates, not manual weeks or workout history.
    domain?.upgradeSessionVolume?.(program);
    program.schemaVersion=SCHEMA_VERSION;
    return program
  }
  function normalizePrograms(programs,idFactory=fallbackId){
    const input=Array.isArray(programs)?programs:[];
    const before=JSON.stringify(input);
    const seen=new Set();
    const normalized=input.filter(Boolean).map(program=>{
      normalizeProgram(program,idFactory);
      if(seen.has(program.id))program.id=idFactory('prog');
      seen.add(program.id);
      return program
    });
    return{programs:normalized,changed:before!==JSON.stringify(normalized)}
  }
  const findProgram=(programs,id)=>(Array.isArray(programs)?programs:[]).find(program=>String(program?.id)===String(id))||null;
  const range=exercise=>{
    const reps=exercise?.reps;
    if(!reps||reps.mode===AUTO||reps.mode===METHOD)return null;
    return ordered(reps.min,reps.max)
  };
  const formatRange=value=>{
    const pair=value?.min!=null||value?.max!=null?ordered(value.min,value.max):parseRange(value);
    if(!pair)return'';
    const fmt=n=>Number(n).toFixed(1).replace('.0','').replace('.',',');
    return Math.abs(pair.min-pair.max)<.001?fmt(pair.min):`${fmt(pair.min)}–${fmt(pair.max)}`
  };
  return Object.freeze({SCHEMA_VERSION,MANUAL,AUTO,METHOD,number,ordered,parseRange,normalizeExercise,normalizeProgram,normalizePrograms,findProgram,range,formatRange})
});
