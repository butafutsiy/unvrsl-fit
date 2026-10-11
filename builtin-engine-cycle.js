'use strict';
(() => {
  const W=window;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const identity=e=>[e.exerciseId||e.sourceId||e.n,e.equipmentProfileId||'',e.techniqueId||'',e.loadType||'',e.method||'STANDARD'].join('|');

  // Convert authored recipes to data for the existing domain allocator.
  // Combine all rounds of a method before allocating, not one block per round.
  function sourcesForWeek(number,firstDays){
    const sources=new Map(),cardio=firstDays.map(()=>[]);
    firstDays.forEach((first,di)=>{
      const routine=ROUTINES.find(r=>r.w===number&&r.c===first.c)||first;
      const groups=new Map();
      routineEntries(routine).forEach((entry,index)=>{
        const base=baseExerciseName(String(entry.n||'').split(' — ')[0]),key=base.toLowerCase();
        let group=groups.get(key);
        if(!group){group={base,entries:[],indices:[]};groups.set(key,group);}
        group.entries.push(entry);group.indices.push(index);
      });
      [...groups.values()].forEach((group,order)=>{
        const exercise=builtInGroupToProgramExercise(routine,group);
        exercise.builtinOrderByDay={[di]:order};
        if(exercise.kind==='cardio'){cardio[di].push(exercise);return;}
        const record=workoutRegistry.resolve(exercise);
        exercise.exerciseId=record?.id||null;
        exercise.kind=WorkoutDomain.exerciseKind({n:exercise.n},workoutRegistry)==='isolation'?'isolation':'compound';
        exercise.loadType=record?.loadType||null;
        const profile=WorkoutDomain.weekProfiles[number],spec=profile[exercise.kind==='isolation'?'isolation':'base'];
        exercise.parameterOverrides={effort:{mode:'auto'},tempo:{mode:'auto'},rest:{mode:'auto'},weight:{mode:'manual'}};
        exercise.reps={mode:exercise.method==='STANDARD'?'auto':'method',min:null,max:null};
        // Preserve technique notes, but never show obsolete numeric prescriptions.
        exercise.note=[...new Set(group.entries.map(e=>e.d||''))].join(' · ')
          .replace(/План:\s*\d+\s*[–-]?\s*\d*\s*повторений(?: на ногу)?\.?/gi,'').trim();
        let setIndex=0;
        for(const entry of group.entries)for(let i=0;i<Math.max(1,entry.s||1);i++){
          const set=exercise.sets[setIndex++];
          if(!set)continue;
          if(exercise.method==='UNVRSL'){
            set.role=/тяж/i.test(entry.n)?'heavy':/л[её]г/i.test(entry.n)?'light':'middle';
            set.label=/тяж/i.test(entry.n)?'Тяжёлый':/л[её]г/i.test(entry.n)?'Лёгкий':'Средний';
          }
        }
        exercise.targetIntensityMin=spec.pct[0];exercise.targetIntensityMax=spec.pct[1];
        const key=identity(exercise),old=sources.get(key);
        if(old){old.dayIndices.push(di);old.builtinOrderByDay[di]=order;}
        else sources.set(key,{...exercise,dayIndices:[di]});
      });
    });
    return {exercises:[...sources.values()],cardio};
  }

  W.buildBuiltinEngineCycle=function(startDate=iso(),priority='strength',testWeek=true){
    const firstDays=ROUTINES.filter(r=>r.w===1);
    if(!firstDays.length)throw new Error('Встроенный план ещё загружается');
    const recipes=Array.from({length:8},(_,i)=>sourcesForWeek(i+1,firstDays));
    // W8 uses W1 exercise identities; old test/back-off labels are not recipes
    // for the new two-preparation-plus-single test protocol.
    recipes[7].exercises=copy(recipes[0].exercises);
    const cycle=WorkoutDomain.generateCycle({weeks:8,daysPerWeek:firstDays.length,startDate,
      priority,testWeek,goal:'Прогресс силы и мышечной массы',
      exercises:recipes[0].exercises,weekExercises:recipes.map(x=>x.exercises)});
    cycle.weeks.forEach((week,wi)=>week.days.forEach((day,di)=>{
      day.id=uid('day');day.name=`${firstDays[di].c} · ${firstDays[di].t}`;
      day.ex.push(...copy(recipes[wi].cardio[di]));
      day.ex.sort((a,b)=>(a.builtinOrderByDay?.[di]??999)-(b.builtinOrderByDay?.[di]??999));
      day.ex.forEach(e=>{
        e.id=uid('pex');
        if(e.kind==='cardio')return;
        if(e.kind==='base')e.kind='compound';
        const profile=week.weeklyLoadProfile,spec=profile[e.kind==='isolation'?'isolation':'base'];
        e.targetIntensityMin=spec.pct[0];e.targetIntensityMax=spec.pct[1];
        if(e.method==='STANDARD'){
          e.note=e.note.replace(/(?:UNVRSL|SLDR|FST-7|\bDS\b|После \d+ раундов)[^.]*\.?/gi,'').trim();
          e.tempo=profile.tempo;
          const rest=e.kind==='isolation'?profile.isoRest:profile.baseRest;
          e.rest=(rest[0]+rest[1])/2;
          e.sets.forEach(s=>{s.rest=e.rest;s.label=s.role==='test_attempt'?'Тест':profile.test?'Подготовка':null;});
        }
      });
    }));
    return {id:uid('prog'),name:'Мой 8-недельный цикл · новый движок',created:Date.now(),updated:Date.now(),builtinEngineTemplate:true,...cycle};
  };
  W.builtinEngineWeekRecipes=function(program,firstSources){
    if(!program.builtinEngineTemplate||program.cycleWeekSources?.length!==program.weeks.length)return undefined;
    const movement=e=>[e.exerciseId||e.sourceId||e.n,e.equipmentProfileId||'',e.techniqueId||'',e.loadType||''].join('|');
    return program.cycleWeekSources.map(week=>firstSources.map(source=>{
      const recipe=week.find(e=>movement(e)===movement(source));
      if(!recipe||recipe.method==='STANDARD'||source.kind==='cardio')return copy(source);
      return {...copy(source),method:recipe.method,sets:copy(recipe.sets),cycleOriginalMethod:recipe.method,
        cycleOriginalSets:copy(recipe.sets),targetIntensityMin:recipe.targetIntensityMin,targetIntensityMax:recipe.targetIntensityMax};
    }));
  };
  W.createBuiltinEngineCycle=function(){
    try{
      const field=id=>document.querySelector(`#modal.show #${id}`);
      const program=ensureProgramShape(W.buildBuiltinEngineCycle(field('npStart')?.value||iso(),
        field('npPriority')?.value||'strength',field('npTest')?.checked!==false));
      st.programs.push(program);save();closeModal();openProgramEditor(program.id,0,0);
      toast('Создан цикл по новому движку');return program;
    }catch(error){toast(error.message);return null;}
  };
})();
