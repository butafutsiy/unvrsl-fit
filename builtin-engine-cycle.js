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
        // These are explicit authored recipes, including SLDR/FST-7 in W4/W6.
        if(exercise.method!=='STANDARD')exercise.preserveMethodOnDeload=true;
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

  W.buildBuiltinEngineCycle=function(startDate=iso(),_legacyPriority=null,testWeek=true,total=8){
    const firstDays=ROUTINES.filter(r=>r.w===1);
    if(!firstDays.length)throw new Error('Встроенный план ещё загружается');
    const profiles=WorkoutDomain.cycleProfiles(total,{testWeek});
    const recipes=profiles.map(profile=>sourcesForWeek(profile.sourceWeek,firstDays));
    // W8 uses W1 exercise identities; old test/back-off labels are not recipes
    // for the new two-preparation-plus-single test protocol.
    if(profiles.at(-1).test)recipes.at(-1).exercises=copy(recipes[0].exercises);
    const cycle=WorkoutDomain.generateCycle({weeks:total,daysPerWeek:firstDays.length,startDate,
      testWeek,goal:'',
      exercises:recipes[0].exercises,weekExercises:recipes.map(x=>x.exercises)});
    cycle.weeks.forEach((week,wi)=>week.days.forEach((day,di)=>{
      day.id=uid('day');day.name=`${firstDays[di].c} · ${firstDays[di].t}`;
      day.ex.push(...copy(recipes[wi].cardio[di]));
      day.ex.sort((a,b)=>(a.builtinOrderByDay?.[di]??999)-(b.builtinOrderByDay?.[di]??999));
      day.ex.forEach(e=>{
        e.id=uid('pex');
        if(e.kind==='cardio'){e.rpe=5;e.tempo='равномерный';e.rest=0;delete e.displayPrescription;return;}
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
    return {id:uid('prog'),name:`Мой ${total}-недельный цикл · новый движок`,created:Date.now(),updated:Date.now(),builtinEngineTemplate:true,engineCycleRevision:502,...cycle};
  };
  // Upgrade only copies explicitly created by this adapter. Persisted IDs and
  // performed sessions remain stable; repeated source weeks receive fresh IDs.
  W.upgradeBuiltinEngineCycleV502=function(program,idFactory=uid){
    if(!program?.builtinEngineTemplate||program.engineCycleRevision>=502||![8,10].includes(program.weeks?.length)||program.assignedUserId||program.clientId)return false;
    const candidates=(st.programs||[]).filter(p=>p.builtinEngineTemplate&&!p.assignedUserId&&!p.clientId);
    const latest=candidates.reduce((a,p)=>!a||Number(p.created||0)>=Number(a.created||0)?p:a,null);
    if(latest&&String(latest.id)!==String(program.id))return false;
    const before=copy(program),options=before.cycleOptions||{},first=before.weeks[0];
    if(!first?.days?.length)return false;
    const profiles=WorkoutDomain.cycleProfiles(8,{testWeek:options.testWeek!==false});
    // Ten-week v501 inserted repeated source weeks. Match authored source weeks,
    // taking the latest edited occurrence instead of shifting by array index.
    const oldFor=profile=>before.weeks.findLast(w=>(w.weeklyLoadProfile?.sourceWeek||WorkoutDomain.weekProfiles[Number(w.n)]?.sourceWeek||Number(w.n))===profile.sourceWeek)||before.weeks.findLast(w=>w.phase===profile.phase)||before.weeks[Math.min(profile.sourceWeek-1,before.weeks.length-1)];
    const collect=week=>{
      const sources=new Map();
      week.days.forEach((day,di)=>(day.ex||[]).forEach((item,order)=>{
        const e=copy(item),key=identity(e),existing=sources.get(key);
        if(existing){existing.dayIndices.push(di);existing.builtinOrderByDay[di]=order;return;}
        e.dayIndices=[di];e.builtinOrderByDay={[di]:order};
        sources.set(key,e);
      }));
      return [...sources.values()];
    };
    const recipes=profiles.map(pr=>collect(pr.test?before.weeks[0]:oldFor(pr)));
    const cycle=WorkoutDomain.generateCycle({weeks:8,daysPerWeek:first.days.length,
      startDate:options.startDate||iso(),testWeek:options.testWeek!==false,
      goal:options.goal==='Прогресс силы и мышечной массы'?'':options.goal||'',exercises:recipes[0],weekExercises:recipes});
    const used=new Set();
    cycle.weeks.forEach((week,wi)=>{
      const oldWeek=oldFor(profiles[wi]),repeat=used.has(profiles[wi].sourceWeek);
      used.add(profiles[wi].sourceWeek);
      week.days.forEach((day,di)=>{
        const oldDay=oldWeek.days[di];day.name=oldDay?.name||first.days[di]?.name||day.name;
        day.id=!repeat&&oldDay?.id?oldDay.id:idFactory('day');
        if(oldDay?.conditioning)day.conditioning=copy(oldDay.conditioning);
        day.ex.sort((a,b)=>(a.builtinOrderByDay?.[di]??999)-(b.builtinOrderByDay?.[di]??999));
        day.ex.forEach(e=>{
          const original=oldDay?.ex?.find(x=>identity(x)===identity(e));
          e.id=!repeat&&original?.id?original.id:idFactory('pex');
          // Each placement retains its authored or edited kilogram values.
          if(original){
            e.sets.forEach((set,i)=>{set.w=original.sets?.[i]?.w??original.sets?.[0]?.w??set.w;});
            if(original.parameterOverrides?.version){
              e.parameterOverrides=copy(original.parameterOverrides);e.reps=copy(original.reps||e.reps);
              for(const key of ['effortSourceMode','effortType','rpeMin','rpeMax','tempoMode','tempo','restMode','rest','weightMode'])if(original[key]!=null)e[key]=original[key];
            }
          }
          if(e.kind==='cardio'){
            if(!e.parameterOverrides?.version){e.rpe=5;e.tempo='равномерный';e.rest=0;delete e.displayPrescription;}
            return;
          }
          const spec=week.weeklyLoadProfile[e.kind==='isolation'?'isolation':'base'];
          e.targetIntensityMin=spec.pct[0];e.targetIntensityMax=spec.pct[1];
          if(e.method==='STANDARD'){
            if(e.parameterOverrides?.tempo?.mode!=='manual')e.tempo=week.weeklyLoadProfile.tempo;
            if(e.parameterOverrides?.rest?.mode!=='manual'){
              const rest=e.kind==='isolation'?week.weeklyLoadProfile.isoRest:week.weeklyLoadProfile.baseRest;
              e.rest=(rest[0]+rest[1])/2;e.sets.forEach(set=>set.rest=e.rest);
            }
          }
        });
      });
    });
    program.previousCycle={weeks:before.weeks,cycleOptions:options,cycleSources:before.cycleSources||[],cycleWeekSources:before.cycleWeekSources||[],name:before.name};
    Object.assign(program,cycle,{engineCycleRevision:502,updated:Date.now(),updatedAt:Date.now()});
    if(!program.nameEdited&&/^Мой (8|10)-недельный цикл/.test(program.name))program.name=program.name.replace('10-недельный','8-недельный');
    for(const key of ['primaryProgramWeeks','startProgramWeeks'])if(st[key]?.[program.id]){const priorWeek=before.weeks[Number(st[key][program.id])-1];const mapped=program.weeks.findIndex(w=>w.weeklyLoadProfile.sourceWeek===priorWeek?.weeklyLoadProfile?.sourceWeek);st[key][program.id]=mapped>=0?mapped+1:Math.min(8,Math.max(1,Number(st[key][program.id])));}
    if(typeof programUi!=='undefined'&&programUi.pid===program.id)programUi.week=Math.min(programUi.week,7);
    queueMicrotask(()=>{try{save()}catch(error){console.warn('Personal cycle migration',error)}});
    return true;
  };
  const upgradeSaved=()=>{let changed=false;for(const p of st.programs||[]){W.upgradeBuiltinEngineCycleV502(p);changed=WorkoutDomain.upgradePercentageWeeks(p)||changed;changed=WorkoutDomain.upgradeSessionVolume(p)||changed;}if(changed){try{save()}catch(error){console.warn('Percentage table migration',error)}}};
  ['unvrsl:storage-hydrated','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:history-updated'].forEach(event=>W.addEventListener(event,upgradeSaved));
  setTimeout(upgradeSaved,0);

  W.builtinEngineWeekRecipes=function(program,firstSources){
    if(!program.builtinEngineTemplate||program.cycleWeekSources?.length!==program.weeks.length)return undefined;
    const movement=e=>[e.exerciseId||e.sourceId||e.n,e.equipmentProfileId||'',e.techniqueId||'',e.loadType||''].join('|');
    return program.cycleWeekSources.map(week=>firstSources.map(source=>{
      const recipe=week.find(e=>movement(e)===movement(source));
      if(!recipe||recipe.method==='STANDARD'||source.kind==='cardio')return copy(source);
      return {...copy(source),method:recipe.method,sets:copy(recipe.sets),cycleOriginalMethod:recipe.method,
        cycleOriginalSets:copy(recipe.sets),preserveMethodOnDeload:recipe.preserveMethodOnDeload===true,targetIntensityMin:recipe.targetIntensityMin,targetIntensityMax:recipe.targetIntensityMax};
    }));
  };
  W.createBuiltinEngineCycle=function(){
    try{
      const field=id=>document.querySelector(`#modal.show #${id}`);
      const program=ensureProgramShape(W.buildBuiltinEngineCycle(field('npStart')?.value||iso(),
        null,field('npTest')?.checked!==false,8));
      st.programs.push(program);save();closeModal();openProgramEditor(program.id,0,0);
      toast('Создан цикл по новому движку');return program;
    }catch(error){toast(error.message);return null;}
  };
  // Opt-in recovery link for the personal five-day cycle authored on Oct 11.
  const linkedId='semen-five-day-8-oct11';
  let addingLinked=false,linkedShown=false;
  W.addOctober11Cycle=async function(){
    if(addingLinked)return null;
    addingLinked=true;
    const backup=copy(st),deletedKey='unvrsl-fit-deleted-programs-v2',deletedBackup=localStorage.getItem(deletedKey);
    try{
      st.programs=Array.isArray(st.programs)?st.programs:[];
      let program=st.programs.find(p=>p.seedId===linkedId);
      if(!program){
        const trashed=(st.programTrash||[]).find(x=>x.program?.seedId===linkedId);
        program=trashed?copy(trashed.program):ensureProgramShape(W.buildBuiltinEngineCycle(iso(),null,true,8));
        program.seedId=linkedId;program.archived=false;
        program.name='Мой цикл · 8 недель · новый движок';
        st.programs.push(program);
      }
      program.importedFromLink=true;program.updated=program.updatedAt=Date.now();
      W.unvrslRestoreProgramKeys?.(program);
      st.primaryProgramId=program.id;st.startProgramId=program.id;
      st.startProgramWeeks=st.startProgramWeeks||{};
      if(st.startProgramWeeks[program.id]==null)st.startProgramWeeks[program.id]=0;
      const client=typeof W.unvrslTrainerMode==='function'&&!W.unvrslTrainerMode();
      if(client)st.clientPrimaryProgramKey=st.clientPlanViewKey='coach:'+program.id;
      const ok=W.persistWorkoutState?await W.persistWorkoutState():save();
      if(ok===false)throw Error('Не удалось сохранить план. Повтори добавление.');
      W.accountSyncNow?.({quiet:true});
      if(client){closeModal();W.nav?.('plan');W.clientCleanPlanPage?.();}
      else openProgramEditor(program.id,st.startProgramWeeks[program.id],0);
      const url=new URL(W.location.href);url.searchParams.delete('addPlan');W.history.replaceState(null,'',url);
      toast('План от 11 октября добавлен');return program;
    }catch(error){
      Object.keys(st).forEach(key=>delete st[key]);Object.assign(st,backup);
      if(deletedBackup==null)localStorage.removeItem(deletedKey);else localStorage.setItem(deletedKey,deletedBackup);
      toast(error.message);return null;
    }finally{addingLinked=false;}
  };
  W.showOctober11CycleLink=function(){
    if(linkedShown||new URL(W.location.href).searchParams.get('addPlan')!==linkedId||typeof modal!=='function')return;
    linkedShown=true;
    modal(`<div class="sheet-grabber"></div><h2>Твой план от 11 октября</h2><div class="card"><b>Мой цикл · 8 недель · новый движок</b><p class="muted">Пять тренировок: A1 / B / C / A2 / D. Разные нагрузки для базы и изоляции, UNVRSL и дроп-сеты. Разгрузка на 4-й и 6-й неделях, тест на 8-й.</p><button class="btn primary full" onclick="addOctober11Cycle()">Добавить в мои программы</button></div><p class="muted small">Добавь в нужном аккаунте. История и текущая тренировка сохранятся. Повторное нажатие откроет уже добавленный план.</p>`);
  };
  W.addEventListener('unvrsl:app-ready',W.showOctober11CycleLink);
})();
