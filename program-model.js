'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.unvrslProgramModelV386=api;
})(typeof window!=='undefined'?window:globalThis,function(){
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
      for(const key of ['rMin','rMax','repsMin','repsMax','targetRepMin','targetRepMax','targetRepLabel','repMode'])delete set[key]
    });
    return exercise
  }
  const fallbackId=prefix=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  function normalizeProgram(program,idFactory=fallbackId){
    if(!program||typeof program!=='object')program={};
    program.id=program.id==null||program.id===''?idFactory('prog'):String(program.id);
    program.name=String(program.name||'Программа');
    if(!Array.isArray(program.weeks))program.weeks=[];
    program.weeks.forEach((week,weekIndex)=>{
      if(!week||typeof week!=='object')week=program.weeks[weekIndex]={};
      week.n=Number(week.n)||weekIndex+1;
      if(!Array.isArray(week.days))week.days=[];
      week.days.forEach((day,dayIndex)=>{
        if(!day||typeof day!=='object')day=week.days[dayIndex]={};
        day.id=day.id==null||day.id===''?idFactory('day'):String(day.id);
        day.name=String(day.name||`День ${dayIndex+1}`);
        if(!Array.isArray(day.ex))day.ex=[];
        day.ex=day.ex.filter(Boolean).map(normalizeExercise)
      })
    });
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
