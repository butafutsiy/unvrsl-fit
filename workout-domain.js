"use strict";
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkoutDomain = api;
})(typeof window === "undefined" ? null : window, () => {
  const SCHEMA_VERSION = 4;
  const V3=typeof require==='function'?require('./recommendation-engine'):globalThis.UNVRSLRecommendationEngine;
  const V3Adapter=typeof require==='function'?require('./recommendation-adapter'):globalThis.UNVRSLRecommendationAdapter;
  const weekProfiles={
    1:{pct:[70,75],rpe:[7,8],tempo:'3-1-2',baseRest:[120,180],isoRest:[60,90],focus:'Техника, базовый объём'},
    2:{pct:[75,80],rpe:[7,8],tempo:'3-1-2',baseRest:[120,180],isoRest:[60,90],focus:'Рабочий объём'},
    3:{pct:[80,85],rpe:[8,9],tempo:'2-0-2',baseRest:[90,150],isoRest:[45,75],focus:'Интенсификация'},
    4:{pct:[60,65],rpe:[4,6],tempo:'2-0-2',baseRest:[60,90],isoRest:[30,60],focus:'Разгрузка'},
    5:{pct:[85,88],rpe:[8,9],tempo:'2-0-2',baseRest:[120,180],isoRest:[60,90],focus:'Тяжёлый стимул'},
    6:{pct:[65,70],rpe:[4,6],tempo:'3-1-2',baseRest:[60,90],isoRest:[30,60],focus:'Восстановление'},
    7:{pct:[88,90],rpe:[8.5,9.5],tempo:'2-0-1 / 2-0-X',baseRest:[180,240],isoRest:[90,120],focus:'Силовая неделя'},
    8:{pct:[90,100],rpe:[9,10],tempo:'2-0-X',baseRest:[240,360],isoRest:[90,120],focus:'Контроль результатов',test:true}
  };
  // Weekly prescriptions live here. UI adapters must not maintain their own tables.
  const loadBands = [
    [60,65,4,10,12,6,8,80,85,3,6,8,8,9],
    [65,70,4,10,12,6,8,75,80,3,8,10,8,9],
    [70,75,4,10,12,7,8,70,75,3,10,12,8,9],
    [75,80,4,8,10,7,8,65,70,3,12,15,8,9],
    [80,85,3,6,8,8,9,60,65,4,15,20,7,8],
    [85,88,3,4,6,8,9,60,65,4,15,20,7,8],
    [88,90,3,3,5,8.5,9.5,60,65,4,15,20,7,8],
    [90,95,2,2,3,9,9.5,60,65,5,15,20,6,7],
    [95,100,2,1,2,9.5,10,60,65,5,15,20,5,6],
    [100,105,1,1,1,10,10,0,0,0,0,0,0,0]
  ];
  function bandPrescription(pct, isolation=false) {
    const midpoint=(pct[0]+pct[1])/2;
    const row=loadBands.find(x=>midpoint<=(x[0]+x[1])/2)||loadBands.at(-1);
    const a=isolation?row.slice(7):row.slice(0,7);
    return {pct:a.slice(0,2),sets:a[2],reps:a.slice(3,5),rpe:a.slice(5,7),rir:[10-a[6],10-a[5]]};
  }
  const phaseNames=['volume','work','intensification','deload','heavy','recovery','strength','test'];
  for(const [i,p] of Object.entries(weekProfiles)) {
    p.phase=phaseNames[Number(i)-1];p.deload=[4,6].includes(Number(i));
    p.base=bandPrescription(p.pct);p.isolation=bandPrescription(p.pct,true);
    if(p.deload){p.base={pct:p.pct,sets:3,reps:[10,12],rpe:[4,6],rir:[4,6]};p.isolation={pct:[60,70],sets:2,reps:[15,20],rpe:[4,6],rir:[4,6]};}
    if(p.test){p.base={pct:[90,100],sets:3,reps:[2,3],rpe:[9,9.5],rir:[.5,1]};p.isolation={pct:[0,0],sets:0,reps:[0,0],rpe:[0,0],rir:[0,0]};}
  }
  const cloneProfile=p=>JSON.parse(JSON.stringify(p));
  function cycleProfiles(total,{testWeek=true,periodizationMode='auto',phaseSchedule,weekProfiles:manualProfiles}={}) {
    if(!Number.isInteger(total)||total<1||total>52)throw new Error('Укажи от 1 до 52 недель');
    const templates={3:[1,3,8],4:[1,2,4,8],6:[1,2,3,4,7,8],8:[1,2,3,4,5,6,7,8],10:[1,2,3,4,2,3,5,6,7,8],11:[1,2,3,4,1,2,3,5,6,7,8],12:[1,2,3,4,1,2,3,4,5,6,7,8]};
    const short={1:[8],2:[1,8],5:[1,2,4,7,8],7:[1,2,3,4,5,7,8]};
    const sequence=templates[total]||short[total]||Array.from({length:total-8},(_,i)=>[1,2,3,4][i%4]).concat(templates[8]);
    if(!['auto','manual'].includes(periodizationMode))throw new Error('Выбери автоматическую или ручную периодизацию');
    if(periodizationMode==='manual'&&phaseSchedule&&(!Array.isArray(phaseSchedule)||phaseSchedule.length!==total))throw new Error('Задай фазу для каждой недели');
    if(periodizationMode==='manual'&&manualProfiles&&(!Array.isArray(manualProfiles)||manualProfiles.length!==total))throw new Error('Задай профиль для каждой недели');
    if(periodizationMode==='manual'&&!phaseSchedule&&!manualProfiles)throw new Error('Задай фазу для каждой недели');
    return sequence.map((n,i)=>{
      if(periodizationMode==='manual'&&manualProfiles?.[i]){
        const p=cloneProfile(manualProfiles[i]);
        const pair=(v,min,max)=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=min&&n<=max)&&v[0]<=v[1];
        if(!pair(p.pct,0,110)||!pair(p.rpe,1,10)||!['base','isolation'].every(k=>p[k]&&Number.isInteger(p[k].sets)&&p[k].sets>=0&&p[k].sets<=20&&pair(p[k].pct,0,110)&&pair(p[k].reps,0,100)&&pair(p[k].rpe,p[k].sets?1:0,10)))throw new Error('Некорректный профиль недели');
        for(const k of ['base','isolation'])p[k].rir=[10-p[k].rpe[1],10-p[k].rpe[0]];
        p.week=i+1;delete p.priority;return p;
      }
      if(periodizationMode==='manual'&&phaseSchedule){
        const chosen=Object.entries(weekProfiles).find(([,p])=>p.phase===phaseSchedule[i]);
        if(!chosen)throw new Error('Неизвестная фаза недели');
        n=Number(chosen[0]);
      }else if(!testWeek&&n===8)n=7;
      const p=cloneProfile(weekProfiles[n]);p.week=i+1;p.sourceWeek=n;
      return p;
    });
  }
  function dayRoles(days) {
    const roles={1:['Middle'],2:['Heavy','Light'],3:['Heavy','Middle','Light'],4:['Heavy','Middle','Light','Middle'],5:['Heavy','Middle','Light','Middle','Light']};
    if(!Number.isInteger(days)||days<1||days>7)throw new Error('Укажи от 1 до 7 тренировочных дней');
    return (roles[days]||['Heavy','Middle','Light','Middle','Light','Middle','Light'].slice(0,days)).slice();
  }
  function validatePrescription(p) {return V3.validatePrescription(p);}
  function exerciseKind(e,reg) {
    const kind=e.kind||e.type;
    if(/^(isolation|compound|base)$/i.test(kind||''))return /isol/i.test(kind)?'isolation':'base';
    // Legacy "reps" describes the result, not whether a movement is compound.
    if(/разгибан|сгибан|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|мах[и ]|французск|скотта|на носки/i.test(e.n||''))return 'isolation';
    return /isol/i.test(reg?.resolve(e)?.type||'')?'isolation':'base';
  }
  function applyWeekProfile(week,p) {
    Object.assign(week,{weeklyLoadProfile:cloneProfile(p),phase:p.phase,deload:p.deload,testWeek:!!p.test,intensityMin:p.pct[0],intensityMax:p.pct[1],rpeMin:p.rpe[0],rpeMax:p.rpe[1],rirMin:10-p.rpe[1],rirMax:10-p.rpe[0],baseRepMin:p.base.reps[0],baseRepMax:p.base.reps[1],isolationRepMin:p.isolation.reps[0],isolationRepMax:p.isolation.reps[1],focus:p.focus,useIntensity:true,loadProfileRevision:465});
    return week;
  }
  function generateCycle(options) {
    const {weeks,daysPerWeek=3,startDate,targetDate,testWeek=true,periodizationMode='auto',phaseSchedule,weekProfiles:manualProfiles,goal='',exercises=[],weekExercises}=options;
    if(weekExercises&&(!Array.isArray(weekExercises)||weekExercises.length!==weeks||weekExercises.some(x=>!Array.isArray(x))))throw new Error('Рецепты упражнений должны быть заданы для каждой недели');
    const roles=dayRoles(daysPerWeek),profiles=cycleProfiles(weeks,{testWeek,periodizationMode,phaseSchedule,weekProfiles:manualProfiles});
    const parse=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d||''))throw new Error('Укажи дату в формате ГГГГ-ММ-ДД');const x=Date.parse(d+'T12:00:00Z');if(!Number.isFinite(x)||new Date(x).toISOString().slice(0,10)!==d)throw new Error('Некорректная дата');return x;};
    const start=parse(startDate),end=targetDate?parse(targetDate):start+(weeks*7-1)*86400000;
    if(end<start+((weeks-1)*7+daysPerWeek-1)*86400000||end>start+(weeks*7-1)*86400000)throw new Error('Целевая дата должна попадать в последнюю неделю цикла');
    const result={cycleSources:cloneProfile(exercises),cycleOptions:{weeks,daysPerWeek,startDate,targetDate:new Date(end).toISOString().slice(0,10),testWeek:profiles.some(p=>p.test),periodizationMode,goal,...(periodizationMode==='manual'?{weekProfiles:cloneProfile(profiles),phaseSchedule:profiles.map(p=>p.phase)}:{})},weeks:profiles.map((p,i)=>applyWeekProfile({n:i+1,days:roles.map((role,di)=>({id:`cycle-${i}-${di}`,name:`День ${di+1}`,role,date:new Date(start+i*7*86400000+(daysPerWeek===1?(i===weeks-1?(end-start-i*7*86400000)/86400000:0):Math.floor(di*(i===weeks-1?(end-start-i*7*86400000)/86400000:6)/(daysPerWeek-1)))*86400000).toISOString().slice(0,10),ex:[]}))},p))};
    if(weekExercises)result.cycleWeekSources=cloneProfile(weekExercises);
    for(const [i,week] of result.weeks.entries())week.days=allocateWeek(week.weeklyLoadProfile,week.days,weekExercises?.[i]||exercises);
    return result;
  }
  function allocateWeek(p,days,exercises) {
    const week={days:days.map(d=>({...d,ex:[]}))},daysPerWeek=days.length;
      exercises.forEach((source,index)=>{
        let selected=(source.dayIndices||[index%daysPerWeek]).filter((x,i,a)=>Number.isInteger(x)&&x>=0&&x<daysPerWeek&&a.indexOf(x)===i);
        if(!selected.length)selected=[index%daysPerWeek];
        if(source.kind==='cardio'||source.workMode==='timer'||source.loadType==='time'){
          selected.forEach(di=>week.days[di].ex.push({...cloneProfile(source),cycleManaged:false}));return;
        }
        const kind=exerciseKind(source),spec=p[kind];if(!spec.sets)return;
        if(p.test)selected=[selected.at(-1)];
        else if(!p.deload&&method(source)!=='STANDARD')selected=[selected[0]];
        const budget=p.test?3:p.deload?spec.sets:Math.max(0,Math.round(number(source.weeklySetsOverride)??spec.sets));
        selected.forEach((di,j)=>{
          const count=Math.floor(budget/selected.length)+(j<budget%selected.length?1:0);if(!count)return;
          const e=cloneProfile(source);e.kind=kind;e.cycleOriginalMethod=source.cycleOriginalMethod||source.method||'STANDARD';e.cycleOriginalSets=cloneProfile(source.cycleOriginalSets||source.sets||[]);e.method=p.deload?'STANDARD':e.cycleOriginalMethod;e.weeklySets=budget;e.cycleManaged=true;
          e.reps=source.reps?.mode==='manual'?cloneProfile(source.reps):{mode:'auto',min:null,max:null};e.parameterOverrides={...e.parameterOverrides,reps:source.parameterOverrides?.reps?.mode==='manual'?cloneProfile(source.parameterOverrides.reps):{mode:'auto'},effort:source.parameterOverrides?.effort?.mode==='manual'?cloneProfile(source.parameterOverrides.effort):{mode:'auto'}};
          e.targetIntensityMin=spec.pct[0];e.targetIntensityMax=spec.pct[1];
          e.rpe=(spec.rpe[0]+spec.rpe[1])/2;
          delete e.repLabel;delete e.rpeLabel;delete e.displayPrescription;
          e.sets=Array.from({length:count},(_,k)=>({...source.sets?.[k],w:number(source.sets?.[k]?.w??source.sets?.[0]?.w)??0,r:spec.reps[0],targetRepMin:spec.reps[0],targetRepMax:spec.reps[1],targetRpeMin:spec.rpe[0],targetRpeMax:spec.rpe[1],allowFailure:false}));
           if(!p.deload&&!p.test&&e.method!=='STANDARD'){e.sets=cloneProfile(e.cycleOriginalSets);e.cycleManaged=false;e.reps={mode:'method',min:null,max:null};}
          if(p.test){e.method='STANDARD';e.sets.forEach((s,k)=>Object.assign(s,k===count-1?{role:'test_attempt',targetRepMin:1,targetRepMax:1,r:1,targetRpeMin:9.5,targetRpeMax:10,allowFailure:true}:{role:'test_preparation',targetRepMin:2,targetRepMax:3}));}
          week.days[di].ex.push(e);
        });
      });
    return week.days;
  }
  function fatigueSignals(rows) {
    const recent=rows.slice(-2),signals=new Set();
    for(const x of recent){if(x.actualRpe>x.targetRpe+.5)signals.add('effort');if(x.actualReps!=null&&x.actualReps<x.minReps)signals.add('reps');if(x.e1rm>0&&x.previousE1rm>0&&x.e1rm<x.previousE1rm*.95)signals.add('strength');if(x.techniqueFailed)signals.add('technique');if(x.fatigueHigh)signals.add('fatigue');if(x.wellbeing==='poor')signals.add('wellbeing');}
    if(recent.length===2&&recent.every(x=>x.skippedSets>0))signals.add('skipped');
    return {suggestDeload:signals.size>=2,signals:[...signals]};
  }
  Object.values(weekProfiles).forEach(p=>{Object.values(p).filter(Array.isArray).forEach(Object.freeze);Object.freeze(p)});Object.freeze(weekProfiles);
  const types = new Set([
    "external_total",
    "per_dumbbell",
    "per_side",
    "bodyweight_only",
    "bodyweight_added",
    "bodyweight_assisted",
    "machine_stack",
    "time",
    "distance",
    "repetitions_only",
  ]);
  const number = (v) => {
    if (v == null || typeof v==='boolean' || String(v).trim() === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const norm = (v) =>
    String(v || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(
        /\s+[–—]\s+(?:UNVRSL|SLDR|DS|FST|тест|back-off|тяж|легк|субмакс|W\d).*$/i,
        "",
      )
      .replace(/[–—_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  function registry(rows = []) {
    const ids = new Map(),
      aliases = new Map();
    for (const row of rows) {
      ids.set(String(row.id), row);
      for (const id of [row.rawId, ...(row.legacyIds || [])].filter(Boolean)) {
        const key = String(id);
        if (!ids.has(key)) ids.set(key, row);
      }
      for (const name of [row.n, row.sourceName, ...(row.aliases || [])].filter(
        Boolean,
      )) {
        const key = norm(name);
        if (!aliases.has(key)) aliases.set(key, row);
      }
    }
    return {
      rows,
      resolve(e) {
        if (typeof e === "string")
          return ids.get(e) || aliases.get(norm(e)) || null;
        for (const id of [e?.exerciseId, e?.id].filter(Boolean)) {
          if (ids.has(String(id))) return ids.get(String(id));
        }
        const byName = aliases.get(norm(e?.n || e?.name));
        if (byName) return byName;
        for (const id of [e?.sourceId, e?.rawId].filter(Boolean)) {
          if (ids.has(String(id))) return ids.get(String(id));
        }
        return null;
      },
      identity(e) {
        return (
          this.resolve(e)?.id ||
          String(
            e?.exerciseId ||
              e?.sourceId ||
              e?.id ||
              `legacy:${norm(e?.n || e?.name || e)}`,
          )
        );
      },
    };
  }
  function loadType(e, reg) {
    if(V3){const p=V3.resolveExerciseProfile(e,reg);if(p.movementKind==='isometric')return 'time';if(p.movementKind==='cardio')return [e.loadType,e.mode,e.kind].includes('distance')?'distance':'time';}
    if (["timer", "time", "cardio"].includes(e?.mode) ||
        ["timer", "time", "cardio"].includes(e?.kind)) return "time";
    if (e?.mode === "distance" || e?.kind === "distance") return "distance";
    const unit=e?.equipmentProfile?.loadUnit;
    const profileType={TOTAL:"external_total",PER_HAND:"per_dumbbell",PER_SIDE:"per_side",ADDED_LOAD:"bodyweight_added",ASSISTANCE:"bodyweight_assisted",NONE:"bodyweight_only"}[unit];
    if(profileType)return profileType;
    if (types.has(e?.loadType)) return e.loadType;
    const row = reg?.resolve(e);
    if (types.has(row?.loadType)) return row.loadType;
    const n = norm(e?.n),
      eq = e?.eq || e?.equipment;
    if (/гравитрон/.test(n) || eq === "assisted") return "bodyweight_assisted";
    if (/подтяг|отжиман|брусь/.test(n)) return "bodyweight_added";
    if (eq === "body weight") return "bodyweight_only";
    if (eq === "dumbbell" || /гантел|dumbbell/.test(n)) return "per_dumbbell";
    if (eq === "cable" || /кроссовер|crossover/.test(n)) return "machine_stack";
    return "external_total";
  }
  function profile(e, reg, overrides = {}) {
    const row = reg?.resolve(e),
      type = loadType(e, reg),
      eq = e?.eq || row?.eq;
    const noWeight=["bodyweight_only","time","distance","repetitions_only"].includes(type);
    const inferredStep=noWeight?0:type==="per_dumbbell"?2:type==="bodyweight_added"?2.5:
      type==="bodyweight_assisted"?5:eq==="kettlebell"?4:
      ["cable","leverage machine","sled machine"].includes(eq)?5:2.5;
    const defaults = {
      step: inferredStep,
      min: 0,
      maxChangeSteps: 1,
      rounding: "nearest",
      units: type,
    };
    const equipment=e?.equipmentProfile||{},available=(equipment.availableLoads||[]).map(number).filter(x=>x!=null&&x>=0).sort((a,b)=>a-b);
    return {
      ...defaults,
      ...row?.weightProfile,
      ...e?.weightProfile,
      ...overrides[reg?.identity(e)],
      ...(number(equipment.weightStep)>0?{step:number(equipment.weightStep),available:[]}:{}),
      ...(available.length?{available}:{}),
      ...(equipment.loadUnit==="TOTAL"&&number(equipment.implementWeight)>0?{min:number(equipment.implementWeight)}:{}),
      ...(noWeight?{step:0,available:[],min:0}:{}),
      loadType: type,
    };
  }
  function roundWeight(value, p, direction) {
    const n = number(value);
    if (n == null) return null;
    const min = number(p.min) ?? 0;
    const available = (p.available || [])
      .map(number)
      .filter((x) => x != null && x >= min)
      .sort((a, b) => a - b);
    if (available.length) {
      const mode = direction || p.rounding;
      return mode === "down"
        ? ([...available].reverse().find((x) => x <= n) ?? available[0])
        : mode === "up"
          ? (available.find((x) => x >= n) ?? available.at(-1))
          : available.reduce((a, b) =>
              Math.abs(b - n) < Math.abs(a - n) ? b : a,
            );
    }
    const step = number(p.step);
    if (!(step > 0)) return Math.max(min, n);
    const fn =
      (direction || p.rounding) === "up"
        ? Math.ceil
        : (direction || p.rounding) === "down"
          ? Math.floor
          : Math.round;
    return Math.max(
      min,
      Number((min + fn((n - min) / step) * step).toFixed(6)),
    );
  }
  function recommendationWeight(result) {
    return result.weeklyCalculated ? number(result.calculatedWeight) : number(result.nextSetSuggestion?.weight??result.weight);
  }
  // Repair only pending generated loads. Recorded history and manual inputs are
  // authoritative, including deliberately entered fractional weights.
  function normalizePendingWeights(session, reg, overrides = {}) {
    if (!session || session.ended || session.pendingCompletion) return false;
    let changed = false;
    for (const e of session.ex || []) for (const s of e.set || []) {
      if (s.ok || s.skipped || s.manualOverride || s.weightSource === 'manual') continue;
      const recorded = s.equipmentSnapshot ? {...e, equipmentProfile:s.equipmentSnapshot} : e;
      const p = profile(recorded, reg, overrides);
      if (!(p.step > 0) && !p.available?.length) continue;
      const generated = ['auto','recommendation'].includes(s.weightSource);
      const repair = (obj, keys) => {
        if (!obj) return;
        for (const key of keys) {
          const n = number(obj[key]);
          if (n == null || (!generated && Math.abs(n - Number(n.toFixed(6))) < 1e-9)) continue;
          const rounded = roundWeight(n, p);
          if (Math.abs(n - rounded) > 1e-9) { obj[key] = rounded; changed = true; }
        }
      };
      repair(s, ['w','selectedW','plannedW','baselineW','launchW','recommendedW']);
      repair(s.recommendationDecision, ['weight']);
      // Restore is also used by “dismiss recommendation”; do not restore an
      // old floating-point calculation on the next render.
      if (!s.recommendationRestore?.manualOverride && s.recommendationRestore?.weightSource !== 'manual')
        repair(s.recommendationRestore, ['w','plannedW']);
    }
    return changed;
  }
  function moveWeight(value, delta, p) {
    if (p.available?.length) {
      const current = roundWeight(value, p),
        a = [...p.available].sort((a, b) => a - b);
      return a[
        Math.max(
          0,
          Math.min(a.length - 1, a.indexOf(current) + Math.sign(delta)),
        )
      ];
    }
    return roundWeight(
      (number(value) ?? p.min ?? 0) + Math.sign(delta) * p.step,
      p,
    );
  }
  function method(e, s = {}) {
    const v = String(
      s.method || e.method || e.trainingEstimate200?.method || e.n || "",
    ).toUpperCase();
    if (/AMRAP|EMOM|AFAP|HIIT/.test(v)) return v.match(/AMRAP|EMOM|AFAP|HIIT/)[0];
    return /UNVRSL/.test(v)
      ? "UNVRSL"
      : /SLDR/.test(v)
        ? "SLDR"
        : /FST-?7/.test(v)
          ? "FST-7"
          : /\bDS\b|DROP/.test(v)
            ? "DS"
            : "STANDARD";
  }
  const warmup = (s) =>
    s.warmup === true ||
    s.isWarmup === true ||
    /warmup|warm-up|размин/i.test(String(s.type || s.kind || s.setRole || s.role || ""));
  function validSet(e, s, reg) {
    if(s.status==='failed_attempt'&&number(s.actualReps??s.r)===0&&number(s.actualWeight??s.w)!=null&&number(s.actualWeight??s.w)>=0)return true;
    const type = loadType(e, reg);
    if (type === "time")
      return (
        (number(
          s.actualSeconds ?? s.seconds ??
            s.workSeconds ??
            (number(s.min) == null ? null : number(s.min) * 60),
        ) ?? 0) > 0
      );
    if (type === "distance") return (number(s.actualDistance ?? s.distance ?? s.km) ?? 0) > 0;
    const r = number(s.actualReps ?? s.r ?? s.reps);
    if (!(r > 0) || !Number.isInteger(r)) return false;
    if (["bodyweight_only", "repetitions_only"].includes(type)) return true;
    const raw = s.w ?? s.weight;
    const w = number(raw);
    if (type === "bodyweight_added")
      return w == null ? raw == null || String(raw).trim() === "" : w >= 0;
    if(['external_total','per_dumbbell','machine_stack'].includes(type)&&!['partial_bodyweight','external_only_proxy'].includes(V3?.resolveExerciseProfile(e,reg).loadAccounting))return w!=null&&w>0;
    return w != null && w >= 0;
  }
  const complete = (e, s, reg) =>
    (s?.ok === true || s?.ok === 1 || s?.ok === 'true' || ['completed','failed_attempt'].includes(s?.status)) &&
    !s.skipped && !warmup(s) && validSet(e, s, reg);
  function bodyWeightAt(session, weights = []) {
    const direct = number(session.bodyWeight);
    if (direct > 0) return direct;
    const date = String(session.date || "").slice(0, 10);
    const rows = weights
      .filter(
        (x) =>
          String(x.d || x.date || "").slice(0, 10) <= date &&
          number(x.w ?? x.weight) > 0,
      )
      .sort((a, b) =>
        String(a.d || a.date).localeCompare(String(b.d || b.date)),
      );
    return rows.length ? number(rows.at(-1).w ?? rows.at(-1).weight) : null;
  }
  function effectiveLoad(e, s, session, reg, weights = []) {
    const type = loadType(e, reg),
      w = number(s.w ?? s.weight) ?? 0;
    if (
      type === "bodyweight_only" ||
      type === "bodyweight_added" ||
      type === "bodyweight_assisted"
    ) {
      const bw = bodyWeightAt(session, weights);
      if (bw == null) return null;
      return Math.max(
        0,
        bw +
          (type === "bodyweight_assisted"
            ? -w
            : type === "bodyweight_added"
              ? w
              : 0),
      );
    }
    if (["time", "distance", "repetitions_only"].includes(type)) return null;
    if (type === "per_side") {
      const sides = number(e.loadedSides??e.equipmentProfile?.loadedSides),
        base = number(e.implementWeight??e.equipmentProfile?.implementWeight);
      return sides > 0 && base != null ? w * sides + base : null;
    }
    if (type === "per_dumbbell") {
      const count = number(e.implementCount ?? reg?.resolve(e)?.implementCount);
      return count > 0 ? w * count : null;
    }
    return w;
  }
  // Tonnage is external load. Body mass and assistance belong to strength
  // estimates, and must not change an otherwise identical workout's tonnage.
  function tonnageLoad(e, s, reg) {
    const snapshot = s?.equipmentSnapshot;
    const differentEquipment = snapshot && snapshot.id &&
      snapshot.id !== (e?.equipmentProfileId || e?.equipmentProfile?.id);
    const recorded = snapshot ? { ...e, equipmentProfile: snapshot,
      ...(differentEquipment ? { implementCount: undefined, stackCount: undefined, loadedSides: undefined, implementWeight: undefined } : {}) } : e;
    const type = loadType(recorded, reg), row = reg?.resolve(e);
    const w = number(s?.w ?? s?.weight) ?? 0;
    if (type === "bodyweight_added") return w;
    if (type === "bodyweight_only") return 0;
    if (["bodyweight_assisted", "time", "distance", "repetitions_only"].includes(type)) return null;
    if (type === "per_side") return effectiveLoad({ ...recorded,
      loadedSides: s?.loadedSides ?? snapshot?.loadedSides ?? recorded?.loadedSides,
      implementWeight: s?.implementWeight ?? snapshot?.implementWeight ?? recorded?.implementWeight }, s, {}, reg);
    if (type === "per_dumbbell") {
      const n = norm(row?.n || e?.n);
      const explicit = number(s?.implementCount ?? snapshot?.implementCount ?? recorded?.implementCount ?? row?.implementCount);
      const count = explicit ?? (/одной|одна |одноруч|one arm|single arm|гантелью/.test(n) ? 1 : /гантел|dumbbell/.test(n) ? 2 : null);
      return count > 0 ? w * count : null;
    }
    if (type === "machine_stack") {
      const n = norm(row?.n || e?.n);
      const explicit = number(s?.stackCount ?? s?.implementCount ?? snapshot?.stackCount ?? snapshot?.implementCount ?? recorded?.stackCount ?? recorded?.implementCount ?? row?.stackCount);
      const count = explicit ?? (/кроссовер|crossover|cable.*fly/.test(n) && !/одной|одна |одноруч|one arm|single arm/.test(n) ? 2 : 1);
      return count > 0 ? w * count : null;
    }
    return w;
  }
  function tonnage(session, reg) {
    if (!Array.isArray(session?.ex)) {
      return Math.round(number(session?.advancedMetrics?.tonnage ?? session?.tonnage) ?? 0);
    }
    let volume = 0;
    for (const e of session.ex) for (const s of e.set || []) {
      const snapshot = s?.equipmentSnapshot;
      if (!complete(snapshot ? { ...e, equipmentProfile: snapshot } : e, s, reg)) continue;
      const load = tonnageLoad(e, s, reg);
      if (load != null) volume += load * number(s.actualReps ?? s.r ?? s.reps);
    }
    return Math.round(volume);
  }
  function pairedLoad(e, reg, s = {}) {
    const recorded = s?.equipmentSnapshot ? { ...e, equipmentProfile: s.equipmentSnapshot } : e;
    const type = loadType(recorded, reg);
    const cable = /кроссовер|crossover|cable/.test(norm(e?.n || reg?.resolve(e)?.n)) ||
      (e?.eq || reg?.resolve(e)?.eq) === "cable";
    if (!["per_dumbbell", "machine_stack"].includes(type) && !(type === "per_side" && cable)) return false;
    const zero = tonnageLoad(e, { ...s, w: 0 }, reg), one = tonnageLoad(e, { ...s, w: 1 }, reg);
    return zero != null && one != null && Math.abs(one - zero - 2) < .000001;
  }
  function weightText(e, value, reg, s = {}) {
    const w = number(value);
    if (w == null) return "";
    const text = String(w).replace(".", ",");
    return pairedLoad(e, reg, s) ? `${text} / ${text}` : text;
  }
  // Actual repetitions remain a total so existing journals and tonnage keep their units.
  function legReps(e = {}) {
    if (e.repSide === 'none') return false;
    return e.repSide === 'arm' || V3?.resolveExerciseProfile(e).repSide==='arm' || e.repSide === 'leg' || !!e.sd || /выпад|зашаг|болгар|(?:одн(?:ой|у|а)|кажд(?:ую|ой))\s+ног|single[- ]leg|lunge|step[- ]?up|split squat/i.test(e.n || '');
  }
  function planRepDivisor(e = {}) {
    if (!legReps(e)) return 1;
    if (e.repCounting === 'total' || e.totalReps || e.sd) return 2;
    return e.repCounting === 'per_leg' || /на (?:каждую )?ногу/i.test(e.note || e.d || e.repLabel || '') ? 1 : 2;
  }
  function repPair(e, value, perLeg = false, s = {}) {
    const r = number(value);
    if (r == null) return null;
    if (!legReps(e)) return [r];
    if((e.repSide==='arm'||V3?.resolveExerciseProfile(e).repSide==='arm')&&!['total','per_arm','per_side','per_leg'].includes(s.repCounting)&&number(s.repsLeft)==null&&number(s.repsRight)==null)return [r];
    if (!perLeg && number(s.repsLeft) != null && number(s.repsRight) != null && s.repsLeft + s.repsRight === r)
      return [s.repsLeft, s.repsRight];
    return perLeg ? [r, r] : [Math.floor(r / 2), Math.ceil(r / 2)];
  }
  function repsText(e, value, perLeg = false, s = {}) {
    return repPair(e, value, perLeg, s)?.join(' / ') || '';
  }
  function parseReps(e, value) {
    const raw = String(value ?? '').trim();
    if (!raw) return { total: '', left: null, right: null };
    const parts = raw.split(/\s*\/\s*/);
    if (parts.some(x => !/^\d+$/.test(x))) return null;
    const nums = parts.map(Number);
    if (nums.some(n => !Number.isSafeInteger(n) || n < 0 || n > 1000)) return null;
    if (!legReps(e)) return nums.length === 1 ? { total: nums[0] } : null;
    if (nums.length > 2) return null;
    const [left, right = left] = nums;
    return { total: left + right, left, right };
  }
  function performedReps(e, s = {}) {
    const r = number(s.actualReps ?? s.r ?? s.reps);
    if (r == null || !legReps(e)) return r;
    const pair = repPair(e, r, s.repCounting === 'per_leg', s);
    return Math.min(...pair);
  }
  function repRangeText(e, range) {
    const text = range.lo === range.hi ? String(range.lo) : `${range.lo}–${range.hi}`;
    return legReps(e) ? `${text} / ${text}` : text;
  }
  function setLabel(e, s, reg) {
    const type = loadType(e, reg),
      w = number(s.w) ?? 0,
      r = repsText(e, s.actualReps ?? s.r, false, s),
      effort = number(s.actualRpe ?? s.rpe),
      rir = number(s.actualRir ?? s.rir);
    const weight =
      type === "bodyweight_only" || type === "bodyweight_added"
        ? `Собственный вес${w > 0 ? ` + ${w} кг` : ""}`
        : type === "bodyweight_assisted"
          ? `Помощь ${w} кг`
          : `${w} кг${type === "per_dumbbell" ? " / гантель" : type === "per_side" ? " / сторону" : ""}`;
    let text =
      type === "time"
        ? `${number(s.actualSeconds ?? s.seconds ?? s.workSeconds) ?? (number(s.min) || 0) * 60} сек`
        : type === "distance"
          ? `${number(s.actualDistance ?? s.distance ?? s.km)} ${s.distanceUnit || "км"}`
          : type === "repetitions_only"
            ? `${r} повторений`
            : `${weight} × ${r}`;
    return (
      text +
      (effort != null ? ` · RPE ${effort}` : rir != null ? ` · RIR ${rir}` : "")
    );
  }
  function e1rm(e, s, session, reg, weights = []) {
const c=V3Adapter.context(e,s,session||{},[],reg);c.actual=V3.normalizeRecommendationInput({exercise:e,set:s,session:session||{},profile:c.profile,equipment:s.equipmentSnapshot||c.equipment}).actual;return V3.estimateSet(c);
  }
  function manualOneRepMax(e, weight, reps, reg, bodyWeight = null) {
    const r = number(reps), w = number(weight), bw = number(bodyWeight);
    if (!Number.isInteger(r) || r < 1 || r > 12 || w == null || w < 0)
      return null;
    const session = bw > 0 ? { bodyWeight: bw } : {};
    return e1rm(e, { w, r, ok: true, method: "STANDARD" }, session, reg);
  }
  function phase(e, s) {
    if (method(e, s) === "STANDARD") return "";
    return String(
      s.phase ||
        s.role ||
        e.phase ||
        e.phaseLabel ||
        String(e.n || "").match(
          /(?:UNVRSL|SLDR)\s+(\d+\/\d+)|DS\s+(DS?\d+)/i,
        )?.[0] ||
        "",
    );
  }
  function sameExercise(a, b, reg) {
    if(a?.exerciseId && b?.exerciseId)return String(a.exerciseId)===String(b.exerciseId);
    if (reg.identity(a) === reg.identity(b)) return true;
    const nameA = norm(a?.n || a?.name), nameB = norm(b?.n || b?.name);
    if (nameA && nameA === nameB) return true;
    // An old session may carry a stale exerciseId while its saved name is a
    // known alias of the current exercise. Resolve the names independently.
    const canonicalA = nameA && reg.resolve(a?.n || a?.name)?.id;
    const canonicalB = nameB && reg.resolve(b?.n || b?.name)?.id;
    return !!(canonicalA && canonicalA === canonicalB);
  }
  function loadComparable(a, b, reg, sa = {}, sb = {}) {
    const equipmentA=String(sa?.equipmentSnapshot?.id??(sa?.equipmentProfileId||a?.equipmentProfileId||a?.equipmentProfile?.id||a?.machineId||""));
    const equipmentB=String(sb?.equipmentSnapshot?.id??(sb?.equipmentProfileId||b?.equipmentProfileId||b?.equipmentProfile?.id||b?.machineId||""));
    const typeA=loadType(a,reg),typeB=loadType(b,reg);
    const matchingExercise=sameExercise(a,b,reg);
    return (
      matchingExercise &&
      typeA === typeB &&
      equipmentA === equipmentB &&
      String(sa.techniqueId??a.techniqueId??a.techniqueVariant??"")===String(sb.techniqueId??b.techniqueId??b.techniqueVariant??"") &&
      (typeA!=="per_dumbbell"||String(a.implementCount??reg.resolve(a)?.implementCount??2)===String(b.implementCount??reg.resolve(b)?.implementCount??2)) &&
      (typeA!=="per_side"||(
        String(a.loadedSides??a.equipmentProfile?.loadedSides??2)===String(b.loadedSides??b.equipmentProfile?.loadedSides??2) &&
        String(a.implementWeight??a.equipmentProfile?.implementWeight??0)===String(b.implementWeight??b.equipmentProfile?.implementWeight??0)
      ))
    );
  }
  function comparable(a, b, reg, sa = {}, sb = {}) {
    return loadComparable(a,b,reg,sa,sb) && method(a,sa)===method(b,sb) && phase(a,sa)===phase(b,sb);
  }
  // Roles are data, with legacy labels used only during normalization.
  function setRole(e, s = {}) {
    if(s.setRole==='isolation_test'||s.role==='isolation_test')return 'isolation_test';
    const label=[s.setRole,s.role,s.phase,s.phaseLabel,s.label,e.phaseRole,e.phaseLabel,e.n].filter(Boolean).join(' ');
    if (/back.?off/i.test(label)) return 'backoff';
    if (/test_attempt|тест|попытка/i.test(label)) return 'test_attempt';
    if (method(e,s)==='UNVRSL') {
      if (/heavy|тяж/i.test(label)) return 'heavy';
      if (/light|л[её]г/i.test(label)) return 'light';
      if (/middle|medium|сред/i.test(label)) return 'middle';
    }
    return method(e,s)==='STANDARD'?'standard':label;
  }
  function strengthEligible(e,s) {
    return ['STANDARD','UNVRSL','SLDR','DS','FST-7'].includes(method(e,s));
  }


  function strengthEstimate(e,rows,reg,weights=[],set={}) {
const sessions=[...new Map(rows.map(x=>[x.session.id,x.session])).values()];const now=Math.max(0,...sessions.map(s=>Number(s.ended||s.started)||Date.parse(s.date)||0))+1;
      const c=V3Adapter.context(e,set,{id:'estimate-only',started:now,bodyWeight:sessions[0]?.bodyWeight,userId:sessions[0]?.userId},sessions,reg);
      const evidence=V3.getComparableEvidence(c),v=V3.estimateLocalCapacity(evidence,c.profile);
      return {estimate:v.estimate,stableMean:v.estimate,best:null,lastPerformed:evidence[0]?.performedAt||null,lastWorkingSets:[],protocols:{},sessionCount:v.sessions.length,setCount:v.sessions.reduce((a,s)=>a+s.validSets,0),latest:v.sessions[0]?.value||null,points:[],source:null,confidence:v.confidence,confidenceLow:null,confidenceHigh:null,confirmed:null};

  }
  function setDecision(e,s,session,p,targetSet=s) {
return V3Adapter.decision(e,s,session,p,targetSet);
  }

  function effortTarget(e,s,session) {
    const rirLo=number(s.targetRirMin??e.targetRirMin),rirHi=number(s.targetRirMax??e.targetRirMax);
    const builtinBackoff=setRole(e,s)==='backoff'&&Number(session.w)===8&&!session.programId&&!session.planId&&!session.programName;
    if(builtinBackoff)return {lo:7,hi:8};
    const explicit=number(s.targetRpe??e.targetRpe??e.rpeTarget)??(number(s.targetRIR??e.targetRIR)!=null?10-number(s.targetRIR??e.targetRIR):null);
    const lo=number(s.targetRpeMin??e.targetRpeMin)??(rirHi!=null?10-rirHi:null)??explicit??number(session.programWeekRpeMin??session.target)??7;
    const hi=number(s.targetRpeMax??e.targetRpeMax)??(rirLo!=null?10-rirLo:null)??explicit??number(session.programWeekRpeMax??session.target)??8;
    return {lo:Math.max(1,Math.min(lo,hi,10)),hi:Math.max(1,Math.min(10,Math.max(lo,hi)))};
  }


  // One method prescription drives every stage; no separate legacy autoweight owner.

  function sessionTime(s) {
    for (const value of [s?.started, s?.startedAt, s?.date, s?.ended, s?.endedAt]) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      const n = number(value);
      if (n != null && n > 1e11) return n;
      const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }
  // Keep calibration in the parent workout payload, rather than adding fake
  // workouts to the journal. Consumers deduplicate these evidence sessions.
  function recommendationSessions(sessions, current = null) {
    const out = [], seen = new Set();
    const add = s => {
      if (!s || seen.has(s.id ? String(s.id) : s)) return;
      seen.add(s.id ? String(s.id) : s); out.push(s);
    };
    for (const parent of sessions || []) {
      add(parent);
      for (const child of parent.calibrationSessions || [])
        if (child.isLoadCalibration) add({...child, userId:parent.userId || child.userId});
    }
    for (const child of current?.calibrationSessions || [])
      if (child.isLoadCalibration) add({...child, userId:current.userId || child.userId});
    return out;
  }
  function calibrationSession(e, targetSet, attempts, current, reg, {id, now = Date.now()} = {}) {
    if (!id || !current?.id || !['external_total','per_dumbbell','machine_stack','per_side','bodyweight_added','bodyweight_assisted'].includes(loadType(e,reg)) || !strengthEligible(e,targetSet))
      return null;
    const sets = [];
    for (const attempt of (attempts || []).slice(0,3)) {
      const rir = number(attempt.rir), reps = parseReps(e,attempt.reps), w = number(attempt.weight);
      if (!reps || !(w > 0||w===0&&['bodyweight_added','bodyweight_assisted'].includes(loadType(e,reg))) || rir == null || rir < 0 || rir > 4 || attempt.pain || attempt.credited || attempt.technique !== true) continue;
      const set = {n:sets.length+1,w,r:reps.total,actualReps:reps.total,
        rpe:10-rir,rir,actualRpe:10-rir,actualRir:rir,ok:true,
        method:method(e,targetSet),setRole:setRole(e,targetSet),
        targetRepMin:number(attempt.targetRepMin??attempt.targetReps),targetRepMax:number(attempt.targetRepMax??attempt.targetReps),
        calibrationAttemptId:attempt.id,loadContext:'isolated_probe',
        equipmentProfileId:targetSet?.equipmentProfileId || e.equipmentProfileId,
        equipmentSnapshot:targetSet?.equipmentSnapshot || e.equipmentProfile,
        techniqueId:targetSet?.techniqueId || e.techniqueId,source:'load_calibration'};
      if (legReps(e)) Object.assign(set,{repsLeft:reps.left,repsRight:reps.right,repCounting:'total'});
      if (!(performedReps(e,set)>=1 && performedReps(e,set)<=20)) continue;
      sets.push(set);
    }
    if (!sets.length) return null;
    return {id,calibrationParentId:current.id,isLoadCalibration:true,
      userId:current.userId,date:current.date,started:now,ended:now+1,
      calibrationAttempts:JSON.parse(JSON.stringify(attempts)),
      ex:[{...JSON.parse(JSON.stringify(e)),set:sets}]};
  }
  function history(e, sessions, reg, { userId, excludeId, before } = {}) {
    const out = [],
      seen = new Set();
    for (const session of recommendationSessions(sessions).sort((a, b) => sessionTime(b) - sessionTime(a))) {
      if (
        before != null &&
        sessionTime(session) >= before &&
        !(session.isLoadCalibration && session.calibrationParentId === excludeId)
      )
        continue;
      if (
        // Imported and older history rows can omit `ended` even though their
        // completed working sets are saved in the sessions collection.
        (!session.ended && !(session.ex || []).some((ex) =>
          (ex.set || []).some((set) => complete(ex, set, reg)))) ||
        session.pendingCompletion ||
        (excludeId != null && String(session.id) === String(excludeId)) ||
        seen.has(session.id ? String(session.id) : session)
      )
        continue;
      if (userId && session.userId && session.userId !== userId) continue;
      seen.add(session.id ? String(session.id) : session);
      for (const ex of session.ex || []) {
        if (!sameExercise(ex,e,reg)) continue;
        for (const set of ex.set || [])
          if (complete(ex, set, reg)) out.push({ exercise: ex, set, session });
      }
    }
    return out;
  }
  function rawRepRange(e, s = {}) {
    if(setRole(e,s)==='test_attempt') {
      const fixed=number(s.plannedReps??s.programReps??s.r??e.r);
      if(fixed>=1&&fixed<=5)return {lo:fixed,hi:fixed};
    }
    if(method(e,s)!=='STANDARD'&&number(s.plannedReps)>0)return {lo:number(s.plannedReps),hi:number(s.plannedReps)};
    const label=String(s.targetRepLabel||"").trim();
    const explicit=label.match(/^(\d+)\s*[–—-]\s*(\d+)(?:\s+на\s+ногу)?$/i);
    if(explicit)return{lo:Math.min(+explicit[1],+explicit[2]),hi:Math.max(+explicit[1],+explicit[2])};
    if(/^\d+(?:\s+на\s+ногу)?$/i.test(label))return{lo:parseInt(label,10),hi:parseInt(label,10)};
    const raw = String(e.reps || e.r || s.r || "").match(
      /^(\d+)\s*[–—-]\s*(\d+)$/,
    );
    const lo =
        number(s.targetRepMin ?? s.rMin ?? e.repMin) ??
        (raw ? +raw[1] : number(s.r)) ??
        8,
      hi = number(s.targetRepMax ?? s.rMax ?? e.repMax) ?? (raw ? +raw[2] : lo);
    return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
  }
  function repRange(e, s = {}) {
    const range = rawRepRange(e, s);
    if (legReps(e) && !s.targetRepLabel && s.targetRepMin == null && s.rMin == null && e.repMin == null && s.plannedReps == null)
      return { lo: Math.floor(range.lo / 2), hi: Math.ceil(range.hi / 2) };
    return range;
  }
  function effortRpe(s) {
    if(V3){const a=V3.effort(s);return a.conflict||a.uncertain||!a.effortKnown||a.effortPrecision==='coarse'?null:a.actualRir==null?null:10-a.actualRir;}
    if(s?.effortUncertain||s?.effortCensored)return null;
    const rpe = number(s?.actualRpe ?? s?.rpe);
    if (rpe != null && rpe>=1 && rpe<=10) return rpe;
    const rir = number(s?.actualRir ?? s?.rir);
    return rir == null || rir<0 || rir>9 ? null : 10 - rir;
  }
  function estimateMaxFromSet(s, e = {}) {
return V3.estimateSet(V3.normalizeRecommendationInput({exercise:e,set:s,session:{},scope:'START'}));
  }
  function intensityBand(session,e={},s={}) {
    const explicit=number(s.targetPercentage??e.targetPercentage);
    if (session?.programWeekUseIntensity === false && explicit==null) return null;
    let lo = explicit??number(s.targetIntensityMin??e.targetIntensityMin??session?.programWeekIntensityMin), hi = explicit??number(s.targetIntensityMax??e.targetIntensityMax??session?.programWeekIntensityMax);
    if (!(lo > 0) || !(hi > 0)) return null;
    if (lo > 1) lo /= 100;
    if (hi > 1) hi /= 100;
    lo = Math.max(.4, Math.min(1, lo)); hi = Math.max(.4, Math.min(1, hi));
    return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
  }
  const median = (a) => {
    if (!a.length) return null;
    const b = [...a].sort((a, b) => a - b),
      i = Math.floor(b.length / 2);
    return b.length % 2 ? b[i] : (b[i - 1] + b[i]) / 2;
  };
  const sessionDate = (s) =>
    s?.date || (sessionTime(s) ? new Date(sessionTime(s)).toISOString().slice(0, 10) : "");

  // Programme goals and observed reps are different data. A failed set must
  // never look like a request to rebase the programme to a new rep range.



  // Replay one-step forecasts using only earlier sessions. The bounded
  // correction is specific to this equipment, role and target, not a global
  // "strength coefficient". No target session leaks into its own forecast.

  function boundedProgression(weight,previous,p,rebase=false) {
    if(previous==null||weight==null)return {weight,limited:false};
    const inverse=p.loadType==='bodyweight_assisted',harder=inverse?weight<previous:weight>previous;
    const fraction=harder?Math.min(.075,number(p.maxIncreaseFraction)??.05):.10;
    const cap=previous*fraction;
    if(Math.abs(weight-previous)<=cap+1e-6)return {weight,limited:false};
    const limit=previous+Math.sign(weight-previous)*cap;
    const bounded=roundWeight(limit,p,weight>previous?'down':'up');
    return {weight:weight>previous?Math.max(previous,bounded):Math.min(previous,bounded),limited:true};
  }

  function recommend(e, set, session, sessions, reg, overrides = {}) {
return V3Adapter.recommend(e,set,session,sessions,reg,overrides);
  }

  function acceptRecommendation(set,result) {
    if(result.engineVersion===3)return V3.applyRecommendation(set,result,{targetSetId:result.targetSetId,now:Date.now()}).applied;
    const weight=recommendationWeight(result);
    if(set.ok||set.skipped||result.canApply===false||result.action==='stop'||weight==null)return false;
    if(!set.recommendationRestore)set.recommendationRestore={w:set.w,selectedW:set.selectedW,plannedW:set.plannedW,weightSource:set.weightSource,manualOverride:set.manualOverride};
    set.w=weight;set.selectedW=weight;set.plannedW=weight;set.weightSource='recommendation';set.manualOverride=false;
    set.recommendationDecision={status:'applied',proposalKey:result.proposalKey,weight,at:Date.now()};
    delete set.dismissedRecommendation;return true;
  }
  function dismissRecommendation(set,result) {
    if(result.engineVersion===3){if(set.ok||set.skipped||['completed','skipped','failed_attempt'].includes(set.status))return false;if(set.recommendationDecision?.status==='applied'&&set.recommendationDecision.id===result.id)V3.undoRecommendation(set);set.dismissedRecommendation=result.inputFingerprint;set.recommendationDecision={id:result.id,status:'dismissed',at:Date.now()};return true;}
    if(set.ok||set.skipped)return false;
    if(set.recommendationRestore&&set.weightSource==='recommendation'&&set.w===set.recommendationDecision?.weight)Object.assign(set,set.recommendationRestore);
    delete set.recommendationRestore;
    set.selectedW=set.w;
    set.dismissedRecommendation=result.proposalKey;
    set.recommendationDecision={status:'dismissed',proposalKey:result.proposalKey,at:Date.now()};return true;
  }
  function applyAuto(set, result) {
    if(result.engineVersion===3){if(set.manualOverride||set.weightSource==='manual'||set.recommendationDecision?.status==='applied'||set.dismissedRecommendation===result.proposalKey)return false;const applied=V3.applyRecommendation(set,result,{targetSetId:result.targetSetId,now:Date.now()}).applied;if(applied)set.weightSource='auto';return applied;}
    if (set.ok || set.skipped || set.manualOverride || set.weightSource === "manual" || result.canApply===false || result.planPreserved || result.action === "stop" || (result.proposalKey&&set.dismissedRecommendation===result.proposalKey))
      return false;
    if(set.recommendationOriginalWeight===undefined)set.recommendationOriginalWeight=set.w;
    const weight=recommendationWeight(result);
    if(weight==null)return false;
    set.w = weight;
    set.selectedW=weight;
    set.weightSource = "auto";
    return true;
  }
  function prepareTestBlocks() {
    // Preserve the authored protocol. Tests never imply extra attempts or backoffs.
    return false;
  }
  function recordScore(e, s, reg) {
    if(s.status==='failed_attempt')return [-Infinity];
    const type = loadType(e, reg),
      w = number(s.w) || 0,
      r = number(s.actualReps ?? s.r) || 0;
    if (type === "time")
      return [number(s.actualSeconds ?? s.seconds ?? s.workSeconds) ?? (number(s.min) || 0) * 60];
    if (type === "distance") return [number(s.actualDistance ?? s.distance ?? s.km) || 0];
    if (
      type === "bodyweight_only" ||
      type === "repetitions_only" ||
      (type === "bodyweight_added" && w === 0)
    )
      return [r];
    return [type === "bodyweight_assisted" ? -w : w, r];
  }
  function greater(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
    }
    return false;
  }
  function summary(session, sessions, reg, weights = [], options = {}) {
    const groups = new Map();
    let volume = 0,
      unknownVolumeSets = 0,
      setCount = 0;
    for (const e of session.ex || []) {
      const sets = (e.set || []).filter((s) => complete(e, s, reg));
      if (!sets.length) continue;
      const id = reg.identity(e),
        past =
          options.records === false
            ? []
            : history(e, sessions, reg, {
                userId: session.userId,
                excludeId: session.id,
                before: session.started || Date.parse(session.date),
              });
      if (!groups.has(id))
        groups.set(id, {
          id,
          name: reg.resolve(e)?.n || e.n,
          sets: [],
          records: [],
          best: null,
        });
      const group = groups.get(id);
      for (const s of sets) {
        setCount++;
        const load = tonnageLoad(e, s, reg);
        if (load == null) unknownVolumeSets++;
        else volume += load * number(s.actualReps ?? s.r ?? s.reps);
        const entry = {
          exercise: e,
          set: s,
          label: setLabel(e, s, reg),
          e1rm: e1rm(e, s, session, reg, weights),
        };
        group.sets.push(entry);
        if (
          !group.best ||
          greater(
            recordScore(e, s, reg),
            recordScore(group.best.exercise, group.best.set, reg),
          )
        )
          group.best = entry;
        if (s.status==='failed_attempt'||s.pain||s.painFlag||s.technique==='invalid'||s.rom==='unplanned_partial'||method(e, s) !== "STANDARD") continue;
        const previous = past.filter(
          (x) =>
            comparable(e, x.exercise, reg, s, x.set) &&
            ((number(x.set.w) || 0) === 0) === ((number(s.w) || 0) === 0),
        );
        if (
          previous.length &&
          previous.every((x) =>
            greater(
              recordScore(e, s, reg),
              recordScore(x.exercise, x.set, reg),
            ),
          )
        )
          group.records.push(entry);
      }
    }
    const signature = (s) =>
      (s.ex || [])
        .filter((e) => (e.set || []).some((x) => complete(e, x, reg)))
        .map((e) => reg.identity(e) + ":" + loadType(e, reg) + ":" + method(e))
        .sort()
        .join("|");
    const previousSession =
      options.comparison === false
        ? null
        : [...sessions]
            .filter(
              (s) =>
                s.ended &&
                !s.pendingCompletion &&
                s.id !== session.id &&
                (!session.userId || !s.userId || session.userId === s.userId) &&
                (s.started || Date.parse(s.date)) <
                  (session.started || Date.parse(session.date)) &&
                signature(s) === signature(session),
            )
            .sort(
              (a, b) =>
                (b.started || Date.parse(b.date)) -
                (a.started || Date.parse(a.date)),
            )[0];
    const previousSummary = previousSession
      ? summary(previousSession, [], reg, weights, {
          records: false,
          comparison: false,
        })
      : null;
    for (const group of groups.values())
      if (group.records.length)
        group.records = [
          group.records.reduce((a, b) =>
            greater(
              recordScore(b.exercise, b.set, reg),
              recordScore(a.exercise, a.set, reg),
            )
              ? b
              : a,
          ),
        ];
    return {
      id: session.id,
      name: session.name || session.c || "Тренировка",
      date: session.date,
      durationMs: Math.max(
        0,
        (session.ended || Date.now()) - (session.started || Date.now()),
      ),
      comparison: previousSummary
        ? {
            id: previousSession.id,
            date: previousSession.date,
            setDelta: setCount - previousSummary.setCount,
            volumeDelta:
              unknownVolumeSets || previousSummary.unknownVolumeSets
                ? null
                : Math.round(volume) - previousSummary.volume,
          }
        : null,
      exercises: [...groups.values()],
      exerciseCount: groups.size,
      setCount,
      volume: Math.round(volume),
      unknownVolumeSets,
      records: [...groups.values()].flatMap((x) =>
        x.records.map((r) => ({ name: x.name, label: r.label })),
      ),
    };
  }
  function strengthSeries(sessions, reg, weights = []) {
    const map = new Map(),
      seen = new Set(), processed=[];
    for (const session of [...sessions].sort(
      (a, b) =>
        (a.started || Date.parse(a.date) || 0) -
        (b.started || Date.parse(b.date) || 0),
    )) {
      if (!session.ended || session.pendingCompletion || seen.has(session.id))
        continue;
      seen.add(session.id);
      processed.push(session);
      const per = new Map();
      for (const e of session.ex || [])
        for (const s of e.set || []) {
          const one = e1rm(e, s, session, reg, weights);
          if (one == null) continue;
          const key = reg.identity(e),
            point = per.get(key) || {
              date: session.date,
              started: session.started,
              e1: 0,
              maxWeight: 0,
              best5: 0,
              sets: 0,
              volume: 0,
              base: reg.resolve(e)?.n || e.n,
              sourceId: key,
            };
          point.e1 = Math.max(point.e1, one);
          point.maxWeight = Math.max(point.maxWeight, number(s.w) || 0);
          if (performedReps(e,s) === 5)
            point.best5 = Math.max(point.best5, number(s.w) || 0);
          point.sets++;
          point.volume +=
            (tonnageLoad(e, s, reg) || 0) *
            number(s.actualReps ?? s.r);
          per.set(key, point);
        }
      for (const [key, point] of per) {
        const ex=(session.ex||[]).find(e=>reg.identity(e)===key);
        const strength=strengthEstimate(ex,history(ex,processed,reg),reg,weights);
        if(strength.estimate!=null)point.e1=strength.estimate;
        const row = map.get(key) || {
          key,
          base: point.base,
          sourceId: key,
          points: [],
          sets: 0,
        };
        row.points.push(point);
        row.sets += point.sets;
        map.set(key, row);
      }
    }
    return [...map.values()]
      .map((row) => {
        const first = row.points[0],
          last = row.points.at(-1),
          best = Math.max(...row.points.map((x) => x.e1));
        return {
          ...row,
          first,
          last,
          best,
          bestWeight: Math.max(...row.points.map((x) => x.maxWeight)),
          best5: Math.max(...row.points.map((x) => x.best5)),
          workouts: row.points.length,
          growth:
            first.e1 > 0
              ? Math.round(((best - first.e1) / first.e1) * 1000) / 10
              : 0,
        };
      })
      .sort((a, b) => (b.last.started || 0) - (a.last.started || 0));
  }
  function bestResults(e, rows, reg) {
    const groups = new Map();
    for (const x of rows) {
      if(x.set.status==='failed_attempt')continue;
      const type = loadType(x.exercise, reg),
        w = number(x.set.w) || 0,
        key =
          type === "bodyweight_added"
            ? w === 0
              ? "Без отягощения"
              : "С дополнительным весом"
            : type === "bodyweight_only"
              ? "Без отягощения"
              : type === "bodyweight_assisted"
                ? "С помощью"
                : "Лучший результат";
      const old = groups.get(key);
      if (
        !old ||
        greater(
          recordScore(x.exercise, x.set, reg),
          recordScore(old.exercise, old.set, reg),
        )
      )
        groups.set(key, x);
    }
    return [...groups].map(([label, x]) => ({
      label,
      result: setLabel(x.exercise, x.set, reg),
      ...x,
    }));
  }
  function migrate(state, reg) {
    if(V3&&state.recommendationSchemaVersion!==3)Object.assign(state,V3.migrate(state));
    if ((state.schemaVersion || 0) >= SCHEMA_VERSION) return state;
    for (const s of [...(state.sessions || []), state.current].filter(
      Boolean,
    )) {
      s.activeWorkoutId = s.activeWorkoutId || s.id;
      for (const e of s.ex || []) {
        const row = reg.resolve(e);
        if (row) {
          e.exerciseId = e.exerciseId || row.id;
          e.loadType = e.loadType || row.loadType;
        }
        for (const set of e.set || []) {
          if (set.ok && number(set.actualReps) == null && number(set.r) != null)
            set.actualReps = number(set.r);
        }
      }
    }
    state.schemaVersion = SCHEMA_VERSION;
    return state;
  }
  return {
    SCHEMA_VERSION,
    recommendationEngine:V3,
    undoRecommendation:V3?.undoRecommendation,
    strengthSeries,
    bestResults,
    number,
    norm,
    registry,
    loadType,
    profile,
    roundWeight,
    normalizePendingWeights,
    moveWeight,
    method,
    warmup,
    validSet,
    complete,
    bodyWeightAt,
    effectiveLoad,
    tonnageLoad,
    tonnage,
    pairedLoad,
    weightText,
    legReps,
    planRepDivisor,
    repPair,
    repsText,
    parseReps,
    performedReps,
    repRangeText,
    setLabel,
    e1rm,
    manualOneRepMax,
    history,
    recommendationSessions,calibrationSession,
    repRange,
    effortRpe,
    estimateMaxFromSet,
    intensityBand,
    setRole,
    loadComparable,
    weekProfiles,
    allocateWeek,bandPrescription,cycleProfiles,dayRoles,validatePrescription,exerciseKind,applyWeekProfile,generateCycle,fatigueSignals,boundedProgression,
    strengthEstimate,
    setDecision,
    effortTarget,
    recommend,
    acceptRecommendation,dismissRecommendation,recommendationWeight,
    applyAuto,
    prepareTestBlocks,
    summary,
    migrate,
  };
});
