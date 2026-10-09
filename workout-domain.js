"use strict";
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkoutDomain = api;
})(typeof window === "undefined" ? null : window, () => {
  const SCHEMA_VERSION = 4;
  const weekProfiles={
    1:{pct:[70,75],rpe:[7,8],tempo:'3-1-2',baseRest:[120,180],isoRest:[60,90],focus:'Техника, базовый объём'},
    2:{pct:[75,80],rpe:[7,8],tempo:'3-1-2',baseRest:[120,180],isoRest:[60,90],focus:'Рабочий объём'},
    3:{pct:[80,85],rpe:[8,9],tempo:'2-0-2',baseRest:[90,150],isoRest:[45,75],focus:'Интенсификация'},
    4:{pct:[60,65],rpe:[4,6],tempo:'2-0-2',baseRest:[60,90],isoRest:[30,60],focus:'Разгрузка'},
    5:{pct:[85,88],rpe:[8,9],tempo:'2-0-2',baseRest:[120,180],isoRest:[60,90],focus:'Тяжёлый стимул'},
    6:{pct:[65,70],rpe:[4,6],tempo:'3-1-2',baseRest:[60,90],isoRest:[30,60],focus:'Восстановление'},
    7:{pct:[88,90],rpe:[8,9],tempo:'2-0-1 / 2-0-X',baseRest:[180,240],isoRest:[90,120],focus:'Сила'},
    8:{pct:[90,100],rpe:[9,10],tempo:'2-0-X',baseRest:[240,360],isoRest:[90,120],focus:'Контроль результатов',test:true}
  };
  // Weekly prescriptions live here. UI adapters must not maintain their own tables.
  const loadBands = [
    [60,65,4,15,20,6,8,80,85,3,6,8,8,9],
    [65,70,4,12,15,6,8,75,80,3,8,10,8,9],
    [70,75,4,10,12,7,8,70,75,3,10,12,7,8],
    [75,80,4,8,10,7,8,65,70,3,12,15,7,8],
    [80,85,3,6,8,8,9,65,70,4,12,15,7,8],
    [85,88,3,5,7,8,9,60,65,4,15,20,6,8],
    [88,90,3,4,6,8,9,60,65,4,12,15,6,8],
    [90,95,2,2,4,9,9.5,60,65,5,15,20,6,7],
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
    if(p.deload){p.base={pct:p.pct,sets:3,reps:[12,15],rpe:[4,6],rir:[4,6]};p.isolation={pct:[60,70],sets:2,reps:[15,20],rpe:[4,6],rir:[4,6]};}
    if(p.test){p.base={pct:[90,100],sets:3,reps:[2,4],rpe:[9,9.5],rir:[.5,1]};p.isolation={pct:[0,0],sets:0,reps:[0,0],rpe:[0,0],rir:[0,0]};}
  }
  const cloneProfile=p=>JSON.parse(JSON.stringify(p));
  function cycleProfiles(total,{testWeek=true,priority='strength'}={}) {
    const templates={3:[1,3,8],4:[1,2,4,8],6:[1,2,3,4,7,8],8:[1,2,3,4,5,6,7,8],10:[1,2,3,4,1,2,3,6,7,8],11:[1,2,3,4,1,2,3,5,6,7,8],12:[1,2,3,4,1,2,3,4,5,6,7,8]};
    if(!templates[total])throw new Error('Поддерживаются циклы на 3, 4, 6, 8, 10, 11 или 12 недель');
    return templates[total].map((n,i)=>{
      if(!testWeek&&n===8)n=priority==='hypertrophy'?3:7;
      const p=cloneProfile(weekProfiles[n]);p.week=i+1;
      // The canonical eight-week sequence is preserved; priority controls the
      // position inside each compatible load corridor, never a second engine.
      p.priority=priority;return p;
    });
  }
  function dayRoles(days) {
    const roles={1:['Middle'],2:['Heavy','Light'],3:['Heavy','Middle','Light'],4:['Heavy','Middle','Light','Middle'],5:['Heavy','Middle','Light','Middle','Light']};
    if(!roles[days])throw new Error('Выбери от 1 до 5 тренировочных дней');
    return roles[days].slice();
  }
  function validatePrescription(p) {
    if(!p||!p.sets)return {valid:true,warnings:[],corridor:null};
    const warnings=[];
    if(!p.reps||p.reps[0]<1||p.reps[1]<p.reps[0]||!p.rpe||p.rpe[0]<1||p.rpe[1]>10||p.rpe[1]<p.rpe[0])return {valid:false,warnings:['Некорректные повторы или RPE'],corridor:null};
    if(p.rir&&(Math.abs(p.rir[0]-(10-p.rpe[1]))>.01||Math.abs(p.rir[1]-(10-p.rpe[0]))>.01))warnings.push('RIR должен равняться 10 − RPE');
    const effort=[100/(1+(p.reps[1]+10-p.rpe[0])/30),100/(1+(p.reps[0]+10-p.rpe[1])/30)];
    const intersection=[Math.max(p.pct[0],effort[0]),Math.min(p.pct[1],effort[1])];
    const conflict=intersection[0]>intersection[1]+.01;
    if(conflict)warnings.push('Проценты конфликтуют с повторами и RPE: расчёт по повторам и RIR');
    return {valid:!warnings.length,warnings,corridor:conflict?effort:intersection,effortCorridor:effort};
  }
  function exerciseKind(e,reg) {
    const kind=e.kind||e.type||reg?.resolve(e)?.type;
    if(kind)return /isol/i.test(kind)?'isolation':'base';
    return /разгибан|сгибан|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|мах[и ]/i.test(e.n||'')?'isolation':'base';
  }
  function applyWeekProfile(week,p) {
    Object.assign(week,{weeklyLoadProfile:cloneProfile(p),phase:p.phase,deload:p.deload,testWeek:!!p.test,intensityMin:p.pct[0],intensityMax:p.pct[1],rpeMin:p.rpe[0],rpeMax:p.rpe[1],rirMin:10-p.rpe[1],rirMax:10-p.rpe[0],baseRepMin:p.base.reps[0],baseRepMax:p.base.reps[1],isolationRepMin:p.isolation.reps[0],isolationRepMax:p.isolation.reps[1],focus:p.focus,useIntensity:true,loadProfileRevision:465});
    return week;
  }
  function generateCycle(options) {
    const {weeks,daysPerWeek=3,startDate,targetDate,testWeek=true,priority='strength',goal='',exercises=[]}=options;
    const roles=dayRoles(daysPerWeek),profiles=cycleProfiles(weeks,{testWeek,priority});
    const parse=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d||''))throw new Error('Укажи дату в формате ГГГГ-ММ-ДД');const x=Date.parse(d+'T12:00:00Z');if(!Number.isFinite(x)||new Date(x).toISOString().slice(0,10)!==d)throw new Error('Некорректная дата');return x;};
    const start=parse(startDate),end=targetDate?parse(targetDate):start+(weeks*7-1)*86400000;
    if(end<start+((weeks-1)*7+daysPerWeek-1)*86400000||end>start+(weeks*7-1)*86400000)throw new Error('Целевая дата должна попадать в последнюю неделю цикла');
    const result={cycleSources:cloneProfile(exercises),cycleOptions:{weeks,daysPerWeek,startDate,targetDate:new Date(end).toISOString().slice(0,10),testWeek,priority,goal},weeks:profiles.map((p,i)=>applyWeekProfile({n:i+1,days:roles.map((role,di)=>({id:`cycle-${i}-${di}`,name:`День ${di+1}`,role,date:new Date(start+i*7*86400000+(daysPerWeek===1?(i===weeks-1?(end-start-i*7*86400000)/86400000:0):Math.floor(di*(i===weeks-1?(end-start-i*7*86400000)/86400000:6)/(daysPerWeek-1)))*86400000).toISOString().slice(0,10),ex:[]}))},p))};
    for(const week of result.weeks)week.days=allocateWeek(week.weeklyLoadProfile,week.days,exercises);
    return result;
  }
  function allocateWeek(p,days,exercises) {
    const week={days:days.map(d=>({...d,ex:[]}))},daysPerWeek=days.length;
      exercises.forEach((source,index)=>{
        const kind=exerciseKind(source),spec=p[kind];if(!spec.sets)return;
        let selected=(source.dayIndices||[index%daysPerWeek]).filter((x,i,a)=>Number.isInteger(x)&&x>=0&&x<daysPerWeek&&a.indexOf(x)===i);
        if(!selected.length)selected=[index%daysPerWeek];
        if(p.test)selected=[selected.at(-1)];
        else if(!p.deload&&method(source)!=='STANDARD')selected=[selected[0]];
        const budget=p.test?3:p.deload?spec.sets:Math.max(0,Math.round(number(source.weeklySetsOverride)??spec.sets));
        selected.forEach((di,j)=>{
          const count=Math.floor(budget/selected.length)+(j<budget%selected.length?1:0);if(!count)return;
          const e=cloneProfile(source);e.kind=kind;e.cycleOriginalMethod=source.cycleOriginalMethod||source.method||'STANDARD';e.cycleOriginalSets=cloneProfile(source.cycleOriginalSets||source.sets||[]);e.method=p.deload?'STANDARD':e.cycleOriginalMethod;e.weeklySets=budget;e.cycleManaged=true;
          e.reps={mode:'auto',min:null,max:null};e.parameterOverrides={...e.parameterOverrides,reps:{mode:'auto'},effort:{mode:'auto'}};
          e.sets=Array.from({length:count},(_,k)=>({...source.sets?.[k],w:number(source.sets?.[k]?.w??source.sets?.[0]?.w)??0,r:spec.reps[0],targetRepMin:spec.reps[0],targetRepMax:spec.reps[1],targetRpeMin:spec.rpe[0],targetRpeMax:spec.rpe[1],allowFailure:false}));
          if(!p.deload&&!p.test&&e.method!=='STANDARD'){e.sets=cloneProfile(e.cycleOriginalSets);e.cycleManaged=false;}
          if(p.test){e.method='STANDARD';e.sets.forEach((s,k)=>Object.assign(s,k===count-1?{role:'test_attempt',targetRepMin:1,targetRepMax:1,r:1,targetRpeMin:9.5,targetRpeMax:10,allowFailure:true}:{role:'test_preparation',targetRepMin:2,targetRepMax:4}));}
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
    if (v == null || String(v).trim() === "") return null;
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
    if (eq === "dumbbell") return "per_dumbbell";
    if (eq === "cable") return "machine_stack";
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
    const type = loadType(e, reg);
    if (type === "time")
      return (
        (number(
          s.seconds ??
            s.workSeconds ??
            (number(s.min) == null ? null : number(s.min) * 60),
        ) ?? 0) > 0
      );
    if (type === "distance") return (number(s.distance ?? s.km) ?? 0) > 0;
    const r = number(s.actualReps ?? s.r ?? s.reps);
    if (!(r > 0) || !Number.isInteger(r)) return false;
    if (["bodyweight_only", "repetitions_only"].includes(type)) return true;
    const raw = s.w ?? s.weight;
    const w = number(raw);
    if (type === "bodyweight_added")
      return w == null ? raw == null || String(raw).trim() === "" : w >= 0;
    return w != null && w >= 0;
  }
  const complete = (e, s, reg) =>
    (s?.ok === true || s?.ok === 1 || s?.ok === 'true') &&
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
  function setLabel(e, s, reg) {
    const type = loadType(e, reg),
      w = number(s.w) ?? 0,
      r = number(s.actualReps ?? s.r),
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
        ? `${number(s.seconds ?? s.workSeconds) ?? (number(s.min) || 0) * 60} сек`
        : type === "distance"
          ? `${number(s.distance ?? s.km)} ${s.distanceUnit || "км"}`
          : type === "repetitions_only"
            ? `${r} повторений`
            : `${weight} × ${r}`;
    return (
      text +
      (effort != null ? ` · RPE ${effort}` : rir != null ? ` · RIR ${rir}` : "")
    );
  }
  function e1rm(e, s, session, reg, weights = []) {
    if (
      !complete(e, s, reg) ||
      !strengthEligible(e,s) || s.partial === true || s.fullROM === false || s.incomplete === true || s.techniqueFailed === true ||
      reg?.resolve(e)?.resultRule?.e1rm === false
    )
      return null;
    const type = loadType(e, reg);
    if (
      ["time", "distance", "repetitions_only", "bodyweight_only"].includes(type)
    )
      return null;
    const r = number(s.actualReps ?? s.r);
    if (!(r >= 1 && r <= 20)) return null;
    const w =
      ["per_dumbbell","bodyweight_added"].includes(type)
        ? number(s.w)
        : effectiveLoad(e, s, session, reg, weights);
    if(s.partial||s.fullROM===false||s.incomplete||s.techniqueFailed)return null;
    const estimated=estimateMaxFromSet({...s,w})??(w>0?w*(r===1?1:1+r/30):null);
    return estimated>0?Math.round(estimated*10)/10:null;
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
    const equipmentA=String(sa?.equipmentProfileId||a?.equipmentProfileId||a?.equipmentProfile?.id||a?.machineId||"");
    const equipmentB=String(sb?.equipmentProfileId||b?.equipmentProfileId||b?.equipmentProfile?.id||b?.machineId||"");
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
  function loadForEstimate(e,s,session,reg,weights=[]) {
    // A dumbbell estimate uses one dumbbell; a plate-loaded implement uses total load.
    return ['per_dumbbell','bodyweight_added'].includes(loadType(e,reg))?number(s.w):effectiveLoad(e,s,session,reg,weights);
  }
  function fromEstimateLoad(value,e,session,reg) {
    const type=loadType(e,reg);
    if(type==='bodyweight_added')return value;
    if (type==='bodyweight_assisted') {
      const bw=number(session.bodyWeight);if (!(bw>0)) return null;
      return Math.max(0,type==='bodyweight_assisted'?bw-value:value-bw);
    }
    if(type==='per_side') {
      const sides=number(e.loadedSides??e.equipmentProfile?.loadedSides),base=number(e.implementWeight??e.equipmentProfile?.implementWeight);
      return sides>0&&base!=null?Math.max(0,(value-base)/sides):null;
    }
    return value;
  }
  function strengthEstimate(e,rows,reg,weights=[],set={}) {
    const compatible=rows.filter(x=>loadComparable(e,x.exercise,reg,set,x.set)&&method(e,set)===method(x.exercise,x.set));
    const points=[];
    const newest=Math.max(0,...compatible.map(x=>sessionTime(x.session)));
    for(const x of compatible) {
      const value=e1rm(x.exercise,x.set,x.session,reg,weights);
      if(!(value>0))continue;
      const m=method(x.exercise,x.set),role=setRole(x.exercise,x.set),rpe=effortRpe(x.set);
      const reps=number(x.set.actualReps??x.set.r);
      const position=Math.max(0,(x.exercise.set||[]).indexOf(x.set));
      const methodWeight=m==='STANDARD'?1:m==='UNVRSL'?({heavy:1,middle:.7,light:.3}[role]??.15):m==='DS'?(position===0?.55:.025):m==='FST-7'?(position===0?.3:.02):.12;
      const age=Math.max(0,(newest-sessionTime(x.session))/86400000);
      const deload=x.session.deload||x.session.isDeload||(intensityBand(x.session)?.hi<=.7&&rpe!=null&&rpe<6);
      const confidenceWeight=methodWeight*(reps<=5?1:reps<=8?.8:.45)*(rpe==null?.4:rpe<6?.04:1)*Math.pow(.5,age/35)*(deload?.02:1)/(1+position*.05);
      points.push({...x,value,confidenceWeight});
    }
    points.sort((a,b)=>sessionTime(b.session)-sessionTime(a.session));
    // One workout is one observation, regardless of its number of mini-sets.
    const groups=new Map();
    for(const x of points){const key=x.session.id??x.session;const group=groups.get(key)||[];group.push(x);groups.set(key,group)}
    const sessions=[...groups.values()].map(group=>{
      if(group.length>=3){
        const mid=median(group.map(x=>x.value));
        const spread=Math.max(mid*.06,3*median(group.map(x=>Math.abs(x.value-mid))));
        for(const x of group)if(Math.abs(x.value-mid)>spread)x.confidenceWeight=0;
      }
      const sum=group.reduce((n,x)=>n+x.confidenceWeight,0);
      return {value:group.reduce((n,x)=>n+x.value*x.confidenceWeight,0)/sum,weight:Math.max(...group.map(x=>x.confidenceWeight)),group};
    });
    const weightedMedian=rows=>{const sorted=[...rows].sort((a,b)=>a.value-b.value);const half=sorted.reduce((n,x)=>n+x.weight,0)/2;let acc=0;for(const x of sorted){acc+=x.weight;if(acc>=half)return x.value}return null};
    const center=weightedMedian(sessions);
    const deviations=sessions.map(x=>({value:Math.abs(x.value-center),weight:x.weight}));
    const tolerance=Math.max((center||0)*.04,3*(weightedMedian(deviations)||0));
    // A lone exceptional session has bounded influence in both directions.
    const adjusted=sessions.map((x,i)=>({...x,weight:x.weight*(sessions.length>=3&&Math.abs(x.value-center)>tolerance?0:sessions.length===2&&i===0&&Math.abs(x.value-sessions[1].value)>sessions[1].value*.08?.2:1)}));
    const sum=adjusted.reduce((n,x)=>n+x.weight,0);
    const estimate=sum?adjusted.reduce((n,x)=>n+x.value*x.weight,0)/sum:null;
    const spread=estimate==null?null:Math.max(estimate*.02,Math.sqrt(adjusted.reduce((n,x)=>n+x.weight*(x.value-estimate)**2,0)/sum));
    const actualSingles=points.filter(x=>x.confidenceWeight>0&&number(x.set.actualReps??x.set.r)===1);
    const source=points.find(x=>x.confidenceWeight>=.2)??points[0]??null;
    const latestGroup=(sessions[0]?.group||[]).filter(x=>x.confidenceWeight>0);
    // Partition final evidence weights; each set contributes exactly once.
    const protocols={};
    for(const observation of adjusted){
      const total=observation.group.reduce((n,x)=>n+x.confidenceWeight,0);
      for(const x of observation.group){
        const key=method(x.exercise,x.set)+':'+setRole(x.exercise,x.set);
        const bucket=protocols[key]||(protocols[key]={weight:0,total:0,sets:0});
        const weight=observation.weight*x.confidenceWeight/total;
        bucket.weight+=weight;bucket.total+=weight*x.value;bucket.sets++;
      }
    }
    for(const bucket of Object.values(protocols)){bucket.estimate=bucket.total/bucket.weight;delete bucket.total;}
    return {estimate,stableMean:estimate,best:points.length?Math.max(...points.map(x=>x.value)):null,lastPerformed:points[0]?sessionDate(points[0].session):null,lastWorkingSets:latestGroup.map(x=>({weight:number(x.set.w),reps:number(x.set.actualReps??x.set.r),rpe:effortRpe(x.set),rir:effortRpe(x.set)==null?null:10-effortRpe(x.set)})),protocols,sessionCount:sessions.length,setCount:points.length,latest:latestGroup.length?Math.max(...latestGroup.map(x=>x.value)):null,points,source,
      confidenceLow:estimate==null?null:estimate-spread,confidenceHigh:estimate==null?null:estimate+spread,
      confirmed:actualSingles.length?Math.max(...actualSingles.map(x=>loadForEstimate(x.exercise,x.set,x.session,reg,weights)||0)):null,
      confidence:sessions.filter(x=>x.weight>=.4).length>=3?'высокая':sessions.filter(x=>x.weight>=.3).length>=2?'средняя':'низкая'};
  }
  function setDecision(e,s,session,p,targetSet=s) {
    const range=repRange(e,targetSet),target=effortTarget(e,targetSet,session);
    const reps=number(s.actualReps??s.r),felt=effortRpe(s),used=number(s.w);
    if(felt==null)return {state:'UNKNOWN',weight:used,action:'hold',reason:'Укажи RPE или RIR: без оценки усилия вес сохранён'};
    const hard=reps<range.lo||s.techniqueFailed===true||(method(e,targetSet)!=='STANDARD'&&felt>target.hi+.5);
    const easy=!hard&&reps>=range.hi&&felt!=null&&felt<target.lo-.5;
    const state=hard?'TOO_HARD':easy?'TOO_EASY':'TARGET';
    const severity=hard?Math.max((range.lo-reps)/Math.max(1,range.lo),(felt==null?0:felt-target.hi)/4):0;
    const count=hard&&severity>=.4?2:1;
    const direction=(hard?-1:easy?1:0)*(p.loadType==='bodyweight_assisted'?-1:1);
    let weight=used;for(let i=0;i<count&&direction;i++)weight=moveWeight(weight,direction,p);
    weight=boundedProgression(weight,used,p).weight;
    return {state,weight,action:weight===used?'hold':hard?'down':easy?'up':'hold',reason:hard?'Ниже диапазона или тяжелее целевого усилия':easy?'Повторы выполнены с запасом больше цели':'Повторы и усилие в целевом диапазоне'};
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
  function methodRows(e,session,reg) {
    const result=[];
    for(const ex of session.ex||[])for(const s of ex.set||[])
      if(loadComparable(e,ex,reg,{},s)&&method(e)===method(ex,s))result.push({exercise:ex,set:s});
    return result;
  }
  function plannedWeight(s) {return [s.programW,s.launchW,s.baselineW,s.plannedW,s.w].map(number).find(x=>x>0)??0}
  // One method prescription drives every stage; no separate legacy autoweight owner.
  function methodPrescription(e,set,session,allHistory,reg,p,strength) {
    const m=method(e,set);if(m==='STANDARD'||['time','distance','bodyweight_only','repetitions_only'].includes(p.loadType))return null;
    const current=methodRows(e,session,reg),index=current.findIndex(x=>x.set===set);
    if(index<0)return null;
    const role=setRole(e,set),target=effortTarget(e,set,session),range=repRange(e,set);
    const same=allHistory.filter(x=>loadComparable(e,x.exercise,reg,set,x.set)&&method(x.exercise,x.set)===m);
    const lastId=same[0]?.session.id,lastSession=same[0]?.session;
    const last=same.filter(x=>lastId!=null?x.session.id===lastId:x.session===lastSession);
    const first=current[0],firstRange=repRange(first.exercise,first.set);
    const base=strength.estimate;
    const band=intensityBand(session,e,set);
    const units=value=>fromEstimateLoad(value,e,session,reg);
    const formula=(r,rpe)=>base>0?units(base/(1+(r+10-rpe)/30)):null;
    const average=(a,b)=>(a+b)/2;
    const harder=p.loadType==='bodyweight_assisted'?-1:1;
    const reduce=value=>moveWeight(value,-harder,p);
    const easier=(a,b)=>harder===1?Math.min(a,b):Math.max(a,b);
    const anchorFor=(reference,reps)=>{
      let candidate=formula(reps,Math.max(6,target.lo));
      if(band&&base>0){const pct=units(base*average(band.lo,band.hi));if(pct!=null)candidate=candidate==null?pct:easier(candidate,pct)}
      if(reference==null)return candidate??plannedWeight(first.set);
      const oldBand=intensityBand(lastSession);
      if(oldBand&&band&&base>0){
        const previousEffective=loadForEstimate(last[0].exercise,last[0].set,lastSession,reg);
        const scaled=units(previousEffective*average(band.lo,band.hi)/average(oldBand.lo,oldBand.hi));
        if(scaled!=null)candidate=scaled;
      }
      if(candidate==null)return reference;
      // New week changes the start; method history bounds uncertain upward jumps.
      return harder===1?Math.max(reference*.85,Math.min(reference+2*p.step,candidate)):
        Math.max(reference-2*p.step,Math.min(reference+p.step*4,candidate));
    };
    let raw=null,reference=null,reason='',live=false;
    if(m==='UNVRSL') {
      if(!['heavy','light','middle'].includes(role))return null;
      const heavy=current.find(x=>setRole(x.exercise,x.set)==='heavy');if(!heavy)return null;
      const hr=repRange(heavy.exercise,heavy.set),ht=effortTarget(heavy.exercise,heavy.set,session);
      let heavyWeight=formula(average(hr.lo,hr.hi),average(ht.lo,ht.hi));
      if(heavyWeight!=null&&band) {
        const min=units(base*band.lo),max=units(base*band.hi);
        if(min!=null&&max!=null)heavyWeight=(harder===1?Math.min(heavyWeight,Math.max(min,max)):Math.max(heavyWeight,Math.min(min,max)));
      }
      const priorRole=last.filter(x=>setRole(x.exercise,x.set)===role);
      reference=priorRole.length?median(priorRole.map(x=>number(x.set.w))):null;
      if(heavyWeight==null)heavyWeight=last.find(x=>setRole(x.exercise,x.set)==='heavy')?.set.w??plannedWeight(heavy.set);
      const priorHeavy=number(last.find(x=>setRole(x.exercise,x.set)==='heavy')?.set.w);
      const previousBlock=lastSession?methodRows(e,lastSession,reg):[];
      const blockLimited=last.length>0&&(last.length<current.length||previousBlock.some(x=>!complete(x.exercise,x.set,reg))||
        last.some(x=>effortRpe(x.set)==null||effortRpe(x.set)>effortTarget(x.exercise,x.set,lastSession).hi||
          number(x.set.actualReps??x.set.r)<repRange(x.exercise,x.set).lo));
      if(priorHeavy!=null){
        heavyWeight=boundedProgression(heavyWeight,priorHeavy,p).weight;
        if(blockLimited)heavyWeight=easier(heavyWeight,priorHeavy);
      }
      const ratio=number(set.methodPercent)!=null&&set.percentBase==='anchor'?number(set.methodPercent)/100:
        plannedWeight(heavy.set)>0&&plannedWeight(set)>0?loadForEstimate(e,{w:plannedWeight(set)},session,reg)/loadForEstimate(e,{w:plannedWeight(heavy.set)},session,reg):null;
      const previousHeavy=current.slice(0,index).filter(x=>setRole(x.exercise,x.set)==='heavy'&&complete(x.exercise,x.set,reg)).at(-1);
      if(previousHeavy){heavyWeight=number(previousHeavy.set.w);live=true;
        if(effortRpe(previousHeavy.set)>ht.hi+.5||number(previousHeavy.set.actualReps??previousHeavy.set.r)<hr.lo)heavyWeight=reduce(heavyWeight);}
      raw=role==='heavy'?heavyWeight:formula(average(range.lo,range.hi),average(target.lo,target.hi));
      if(role!=='heavy'&&ratio!=null){
        const anchorEffective=loadForEstimate(e,{w:heavyWeight},session,reg);
        const linked=['bodyweight_added','bodyweight_assisted','per_side'].includes(p.loadType)
          ? units(anchorEffective*ratio):heavyWeight*ratio;
        if(linked!=null)raw=raw==null?linked:easier(raw,linked);
      }
      // A method with no strength estimate still has its own stage history.
      if(raw==null)raw=reference??plannedWeight(set);
      const previousRole=current.slice(0,index).filter(x=>setRole(x.exercise,x.set)===role&&complete(x.exercise,x.set,reg)).at(-1);
      if(previousRole){const decision=setDecision(e,previousRole.set,session,p,set);raw=decision.weight;live=true;}
      reason=`UNVRSL: ${role==='heavy'?'тяжёлая часть':role==='light'?'лёгкая часть':'средняя часть'}; общая оценка силы, цель этапа и соотношение весов из плана`;
    } else if(m==='SLDR') {
      const roundStart=Math.floor(index/3)*3;
      const inRound=current.slice(roundStart,index).find(x=>complete(x.exercise,x.set,reg));
      if(inRound){raw=number(inRound.set.w);live=true;reason='SLDR: один вес внутри полного круга, 15 секунд между мини-подходами'}
      else {
        reference=number(last[0]?.set.w);
        raw=anchorFor(reference,firstRange.hi);
        const completed=current.slice(0,roundStart).filter(x=>complete(x.exercise,x.set,reg));
        const prev=completed.slice(-3);
        const evidence=prev.length===3?prev:last;
        if(prev.length===3){raw=number(prev[0].set.w);live=true}
        if(evidence.length){
          const hard=evidence.some((x,i)=>number(x.set.actualReps??x.set.r)<repRange(current[i%3]?.exercise||x.exercise,current[i%3]?.set||x.set).lo||effortRpe(x.set)>effortTarget(x.exercise,x.set,session).hi+.5);
          const easy=evidence.length>=3&&evidence.every((x,i)=>number(x.set.actualReps??x.set.r)>=repRange(current[i%3]?.exercise||x.exercise,current[i%3]?.set||x.set).hi&&effortRpe(x.set)!=null&&effortRpe(x.set)<effortTarget(x.exercise,x.set,session).lo-.5);
          if(hard)raw=reduce(raw);
          else if(easy&&(live||reference!=null&&(raw-reference)*harder<=0))raw=moveWeight(live?raw:reference,harder,p);
        }
        reason='SLDR: вес на полный круг; оцениваются все мини-подходы, изменение веса между кругами';
      }
    } else if(m==='DS'||m==='FST-7') {
      reference=number(last[index]?.set.w);
      let anchor=anchorFor(number(last[0]?.set.w),firstRange.hi);
      if(complete(first.exercise,first.set,reg)){anchor=number(first.set.w);live=true}
      const ratio=plannedWeight(first.set)>0&&plannedWeight(set)>0?loadForEstimate(e,{w:plannedWeight(set)},session,reg)/loadForEstimate(e,{w:plannedWeight(first.set)},session,reg):Math.pow(.8,index);
      raw=m==='DS'?units(loadForEstimate(e,{w:anchor},session,reg)*ratio):anchor;
      const prev=current.slice(0,index).filter(x=>complete(x.exercise,x.set,reg)).at(-1);
      if(prev){live=true;const hard=effortRpe(prev.set)>target.hi+.5||number(prev.set.actualReps??prev.set.r)<repRange(prev.exercise,prev.set).lo;
        if(m==='FST-7')raw=hard?reduce(number(prev.set.w)):number(prev.set.w);
        else {raw=easier(raw,number(prev.set.w));if(hard)raw=reduce(raw)}
      } else if(last.length) {
        const hard=last.some((x,i)=>effortRpe(x.set)>effortTarget(x.exercise,x.set,session).hi+.5||number(x.set.actualReps??x.set.r)<repRange(current[i]?.exercise||x.exercise,current[i]?.set||x.set).lo);
        const easy=last.length>=current.length&&last.every((x,i)=>effortRpe(x.set)!=null&&effortRpe(x.set)<effortTarget(x.exercise,x.set,session).lo-.5&&number(x.set.actualReps??x.set.r)>=repRange(current[i]?.exercise||x.exercise,current[i]?.set||x.set).hi);
        if(hard)raw=reduce(raw);else if(easy&&reference!=null&&(raw-reference)*harder<=0)raw=moveWeight(reference,harder,p);
      }
      reason=m==='DS'?'DS: стартовый вес и соотношение ступеней из плана; учтена предыдущая ступень':'FST-7: общий стартовый вес, повторы и утомление при коротком отдыхе';
    } else return null;
    // A partial/unevaluated previous method cannot authorise a heavier stage.
    const priorBlock=lastSession?methodRows(e,lastSession,reg):[];
    if(!live&&reference!=null&&priorBlock.length&&
      (last.length<priorBlock.length||last.length<current.length||last.some(x=>effortRpe(x.set)==null)))raw=easier(raw,reference);
    if(raw==null||!Number.isFinite(raw)||raw<0)return null;
    if(!strength.source&&!last.length&&!live)return null;
    return {weight:live?raw:roundWeight(raw,p,p.loadType==='bodyweight_assisted'?'up':'down'),raw,reference,reason,live,role,
      sessionIds:[...new Set([...last,...strength.points].map(x=>x.session.id).filter(x=>x!=null))]};
  }
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
  function history(e, sessions, reg, { userId, excludeId, before } = {}) {
    const out = [],
      seen = new Set();
    for (const session of [...sessions].sort((a, b) => sessionTime(b) - sessionTime(a))) {
      if (
        before != null &&
        sessionTime(session) >= before
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
  function repRange(e, s = {}) {
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
  function effortRpe(s) {
    const rpe = number(s?.actualRpe ?? s?.rpe);
    if (rpe != null && rpe>=1 && rpe<=10) return rpe;
    const rir = number(s?.actualRir ?? s?.rir);
    return rir == null || rir<0 || rir>9 ? null : 10 - rir;
  }
  function estimateMaxFromSet(s) {
    const weight = number(s?.w ?? s?.weight), reps = number(s?.actualReps ?? s?.r), rpe = effortRpe(s);
    if (!(weight > 0) || !(reps >= 1 && reps <= 20) || !(rpe >= 4 && rpe <= 10)) return null;
    return weight * (1 + (reps + 10 - rpe) / 30);
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
  function explicitRepTarget(e,s) {
    return !!s.targetRepLabel || [s.targetRepMin,s.targetRepMax,s.rMin,s.rMax,e.repMin,e.repMax,e.reps]
      .some(v=>v!=null&&String(v).trim()!=='');
  }
  function sameTarget(e,s,old,session) {
    if(session.dayRole&&old.session?.dayRole&&session.dayRole!==old.session.dayRole)return false;
    const range=repRange(e,s),previous=repRange(old.exercise,old.set);
    const reps=number(old.set.actualReps??old.set.r);
    const sameReps=explicitRepTarget(old.exercise,old.set)
      ? range.lo===previous.lo&&range.hi===previous.hi : reps>=range.lo&&reps<=range.hi;
    const a=effortTarget(e,s,session),b=effortTarget(old.exercise,old.set,old.session);
    return sameReps&&a.lo===b.lo&&a.hi===b.hi;
  }
  function seriesEvidence(e,s,current,previous,reg) {
    if(!previous||method(e,s)!=='STANDARD')return null;
    const role=setRole(e,s),matches=(ex,x)=>loadComparable(e,ex,reg,s,x)&&method(ex,x)==='STANDARD'&&setRole(ex,x)===role&&!warmup(x);
    const rows=(previous.ex||[]).flatMap(ex=>(ex.set||[]).filter(x=>matches(ex,x)).map(set=>({exercise:ex,set,session:previous})));
    if(!rows.length)return null;
    const expected=(current.ex||[]).flatMap(ex=>(ex.set||[]).filter(x=>matches(ex,x))).length||1;
    const done=rows.filter(x=>complete(x.exercise,x.set,reg));
    const effortKnown=done.every(x=>effortRpe(x.set)!=null);
    const range=repRange(e,s),effort=effortTarget(e,s,current);
    const same=done.length>0&&done.every(x=>sameTarget(e,s,x,current));
    const bad=done.filter(x=>number(x.set.actualReps??x.set.r)<range.lo||effortRpe(x.set)>effort.hi||x.set.techniqueFailed||x.set.incomplete||x.set.partial);
    const full=done.length===rows.length&&done.length>=expected;
    const uniform=done.length>0&&done.every(x=>number(x.set.w)===number(done[0].set.w));
    return {sessionId:previous.id,expected,planned:rows.length,completed:done.length,full,effortKnown,sameTarget:same,uniform,
      failed:bad.length,allInRange:full&&effortKnown&&bad.length===0&&done.every(x=>number(x.set.actualReps??x.set.r)<=range.hi),
      easier:full&&effortKnown&&bad.length===0&&done.every(x=>number(x.set.actualReps??x.set.r)>=range.lo&&effortRpe(x.set)<effort.lo),
      mastered:full&&effortKnown&&bad.length===0&&done.every(x=>number(x.set.actualReps??x.set.r)>=range.hi),
      reps:done.map(x=>number(x.set.actualReps??x.set.r))};
  }
  // Replay one-step forecasts using only earlier sessions. The bounded
  // correction is specific to this equipment, role and target, not a global
  // "strength coefficient". No target session leaks into its own forecast.
  function forecastCalibration(e,s,current,rows,reg) {
    const result={factor:1,samples:0,applied:false};
    if(method(e,s)!=='STANDARD'||!['external_total','per_dumbbell','machine_stack'].includes(loadType(e,reg)))return result;
    const groups=new Map();
    for(const x of rows){
      const r=number(x.set.actualReps??x.set.r),felt=effortRpe(x.set);
      if(method(x.exercise,x.set)!=='STANDARD'||setRole(x.exercise,x.set)!==setRole(e,s)||!sameTarget(e,s,x,current)||
        !(r>=3&&r<=10&&felt>=7&&felt<=10)||x.session.deload||x.session.isDeload||x.session.readinessAdjusted)continue;
      const age=sessionTime(current)-sessionTime(x.session);
      if(sessionTime(current)>1e11&&(age<0||age>56*86400000))continue;
      if((e.tempo||'')!==(x.exercise.tempo||'')||(e.rest||'')!==(x.exercise.rest||''))continue;
      const key=x.session.id??x.session,group=groups.get(key)||[];group.push(x);groups.set(key,group);
    }
    const samples=[...groups.values()].filter(g=>{
      const series=seriesEvidence(e,s,current,g[0].session,reg);
      return series?.full&&series.effortKnown&&series.failed===0&&series.uniform;
    }).sort((a,b)=>sessionTime(a[0].session)-sessionTime(b[0].session)).slice(-7)
      .map(g=>median(g.map(x=>estimateMaxFromSet(x.set))));
    const errors=[];
    for(let i=2;i<samples.length;i++){
      const predicted=median(samples.slice(Math.max(0,i-3),i));
      if(predicted>0)errors.push(samples[i]/predicted-1);
    }
    result.samples=errors.length;
    if(errors.length<3)return result;
    const center=median(errors),spread=median(errors.map(x=>Math.abs(x-center)));
    if(spread>.02||Math.abs(center)>.08||errors.filter(x=>Math.sign(x)===Math.sign(center)).length/errors.length<.8)return result;
    result.factor=1+Math.max(-.025,Math.min(.025,center*.5));
    result.applied=Math.abs(result.factor-1)>=.005;
    if(!result.applied)result.factor=1;
    return result;
  }
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
    const p = profile(e, reg, overrides),
      range = repRange(e, set),
      allHistory = history(e, sessions, reg, {
        userId: session.userId,
        excludeId: session.id,
        before: sessionTime(session)>1e11?sessionTime(session):undefined,
      }),
      strengthRows=method(e,set)==='STANDARD'&&setRole(e,set)==='standard'?allHistory:
        [...allHistory,...(session.ex||[]).flatMap(ex=>(ex.set||[]).filter(s=>complete(ex,s,reg)).map(s=>({exercise:ex,set:s,session})))],
      strength=strengthEstimate(e,strengthRows,reg,[],set),
      rows=allHistory.filter((x) => method(e,set)==='STANDARD'
        ? loadComparable(e,x.exercise,reg,set,x.set)&&method(x.exercise,x.set)==='STANDARD'
        : comparable(e, x.exercise, reg, set, x.set));
    const ids = [...new Set(rows.map((x) => x.session.id))].slice(0, 5),
      recent = rows.filter((x) => ids.includes(x.session.id));
    const latest = recent.filter((x) => x.session.id === ids[0]);
    const excludedHistory=allHistory
      .find(x=>sessionTime(x.session)>sessionTime(latest[0]?.session)&&!loadComparable(e,x.exercise,reg,set,x.set));
    const excluded=excludedHistory?(()=>{
      const x=excludedHistory,oldEquipment=x.set.equipmentProfileId||x.exercise.equipmentProfileId||x.exercise.equipmentProfile?.id||x.exercise.machineId||'',newEquipment=set.equipmentProfileId||e.equipmentProfileId||e.equipmentProfile?.id||e.machineId||'';
      const reason=String(oldEquipment)!==String(newEquipment)?'другое оборудование':loadType(e,reg)!==loadType(x.exercise,reg)?'другой тип нагрузки':method(e,set)!==method(x.exercise,x.set)?'другой метод':phase(e,set)!==phase(x.exercise,x.set)?'другая фаза метода':'другая настройка снаряда';
      return{id:String(x.session.id||''),date:sessionDate(x.session),reason};
    })():null;
    const latestWeights=latest.map((x) => number(x.set.w)).filter((x) => x != null);
    // A standard exercise has one top working load. Back-off sets must not
    // pull its next-session recommendation down to their median.
    const prior=latestWeights.length?(method(e,set)==="STANDARD"?Math.max(...latestWeights):median(latestWeights)):null;
    const seed=[set.programW,set.recommendationOriginalWeight,set.launchW,set.plannedW,set.w].map(number).find(x=>x>0)??0;
    const effortBand=effortTarget(e,set,session),targetMin=effortBand.lo,target=effortBand.hi;
    const groups = ids
      .slice(0, 2)
      .map((id) => recent.filter((x) => x.session.id === id));
    const series=seriesEvidence(e,set,session,latest[0]?.session,reg);
    const previousSeries=seriesEvidence(e,set,session,groups[1]?.[0]?.session,reg);
    const calibration=forecastCalibration(e,set,session,rows,reg);
    const effort = (x) => effortRpe(x.set);
    // Each completed workout updates the estimate. The latest one carries most
    // weight; earlier comparable workouts dampen a single unusually good set.
    const top=latest.find(x=>number(x.set.w)===prior),oldReps=number(top?.set.actualReps??top?.set.r),oldRpe=top?effort(top):null;
    const targetReps=(range.lo+range.hi)/2,kind=String(e.type||reg?.resolve(e)?.type||"").toLowerCase();
    const explicitRange=[set.targetRepMin,set.targetRepMax,set.rMin,set.rMax,e.repMin,e.repMax,e.reps].some(v=>v!=null&&String(v).trim()!=="");
    const compound=exerciseKind(e,reg)!=="isolation";
    const bodyLoad=p.loadType==="bodyweight_assisted";
    const currentBodyWeight=number(session.bodyWeight),latestBodyWeight=number(latest[0]?.session.bodyWeight);
    const eligible=method(e,set)==="STANDARD"&&
      ["external_total","machine_stack","per_dumbbell","per_side","bodyweight_added","bodyweight_assisted"].includes(p.loadType)&&
      strength.points.some(x=>effortRpe(x.set)>=6&&effortRpe(x.set)<=10)&&
      targetReps>=1&&targetReps<=20&&targetMin>=4&&target<=10&&targetMin<=target&&
      (bodyLoad?currentBodyWeight>0&&latestBodyWeight>0:prior>0);
    const sessionMaxes=strength.points.map(x=>x.value);
    const latestOneRepMax=strength.latest;
    const stableOneRepMax=strength.estimate;
    const estimatedOneRepMax=eligible?stableOneRepMax:null;
    const analogous=eligible?groups.find(g=>{
      const evidence=seriesEvidence(e,set,session,g[0]?.session,reg);
      return evidence?.full&&evidence.effortKnown&&evidence.sameTarget&&evidence.uniform&&evidence.failed===0&&
        !g[0].session.deload&&!g[0].session.isDeload&&!g[0].session.readinessAdjusted&&
        g.every(x=>(e.tempo||'')===(x.exercise.tempo||'')&&(e.rest||'')===(x.exercise.rest||''));
    }):null;
    const analogousMax=analogous?median(analogous.map(x=>e1rm(x.exercise,x.set,x.session,reg)).filter(x=>x>0)):null;
    const prescriptionMax=estimatedOneRepMax==null?null:analogousMax>0?analogousMax*.7+estimatedOneRepMax*.3:estimatedOneRepMax;
    const projectedEffective=prescriptionMax==null?null:prescriptionMax*calibration.factor/(1+(targetReps+10-(targetMin+target)/2)/30);
    const effectivePrior=top?loadForEstimate(top.exercise,top.set,top.session,reg):prior;
    const projectedRaw=projectedEffective==null?null:fromEstimateLoad(projectedEffective,e,session,reg);
    let projected=projectedEffective!=null&&projectedEffective>=effectivePrior*.72&&projectedEffective<=effectivePrior*1.32?projectedRaw:null;
    // When reps and effort have not changed, increase at most two implement
    // increments. A genuine change from 12 reps to 6 can require a larger jump.
    if(projected!=null&&Math.abs(oldReps-targetReps)<2)
      projected=Math.max(prior-2*p.step,Math.min(prior+2*p.step,projected));
    // A set already inside both target bands is evidence that the current
    // implement load works. A hard top set cannot justify a heavier one.
    if(projected!=null&&oldReps>=range.lo&&oldReps<=range.hi&&oldRpe>=targetMin&&oldRpe<=target)
      projected=p.loadType==="bodyweight_assisted"?Math.min(prior,projected):Math.max(prior,projected);
    if(projected!=null&&oldRpe>target&&oldReps>=range.hi+2)projected=prior;
    if(projected!=null&&oldRpe>target)projected=p.loadType==="bodyweight_assisted"?Math.max(prior,projected):Math.min(prior,projected);
    const lastWorking=latest.filter(x=>number(x.set.w)===prior);
    const lastSet=lastWorking.at(-1);
    const fatigueLimited=projected!=null&&lastWorking.length>=2&&oldReps>=range.lo&&oldReps<=range.hi&&lastSet&&(
      number(lastSet.set.actualReps??lastSet.set.r)<range.lo||effort(lastSet)>target
    );
    // A single late miss limits progression; it does not lower the next
    // session's starting load. Repeated comparable misses are separate evidence.
    const repeatedFatigue=series?.sameTarget&&series.full&&series.effortKnown&&series.failed>0&&
      previousSeries?.sameTarget&&previousSeries.full&&previousSeries.effortKnown&&previousSeries.failed>0;
    if(fatigueLimited)projected=p.loadType==="bodyweight_assisted"?Math.max(prior,projected):Math.min(prior,projected);
    // The test percentage belongs to test attempts, not every compound or
    // accessory performed during week eight.
    const weekEight=Number(session.w)===8&&!session.programId&&!session.planId&&!session.programName;
    const testAttempt=compound&&setRole(e,set)==='test_attempt';
    const isolationTest=setRole(e,set)==='isolation_test';
    const band=((weekEight||session.testWeek)&&!testAttempt)||isolationTest?null:intensityBand(session,e,set),weekMid=band?((band.lo+band.hi)/2):null;
    const weeklyRaw=stableOneRepMax!=null&&weekMid!=null?fromEstimateLoad(stableOneRepMax*weekMid,e,session,reg):null;
    const weeklyCorridor=stableOneRepMax!=null&&band?{min:fromEstimateLoad(stableOneRepMax*band.lo,e,session,reg),max:fromEstimateLoad(stableOneRepMax*band.hi,e,session,reg)}:null;
    let weeklyApplied=false;
    if(compound&&weeklyRaw!=null&&projected==null&&band.hi<=.70&&targetMin<6){
      projected=weeklyRaw;weeklyApplied=true;
    }else if(compound&&weeklyRaw!=null&&projected==null&&seed===0&&prior>0&&!explicitRange){
      projected=weeklyRaw;weeklyApplied=true;
    }else if(projected!=null&&weeklyCorridor&&projected>=weeklyCorridor.min-p.step&&projected<=weeklyCorridor.max+p.step){
      projected=Math.max(weeklyCorridor.min,Math.min(weeklyCorridor.max,projected));weeklyApplied=true;
    }
    const prescription=validatePrescription({sets:1,pct:band?[band.lo*100,band.hi*100]:[0,100],reps:[range.lo,range.hi],rpe:[targetMin,target]});
    const corridor=stableOneRepMax>0&&prescription.corridor?prescription.corridor.map(x=>fromEstimateLoad(stableOneRepMax*x/100,e,session,reg)):null;
    if(eligible&&corridor&&corridor.every(x=>x!=null)){
      const role=session.dayRole||session.role||'Middle',bias=session.weeklyLoadProfile?.priority==='hypertrophy'?-.1:0,position=(role==='Heavy'?.85:role==='Light'?.15:.5)+bias;
      projected=Math.max(corridor[0],Math.min(corridor[1],(corridor[0]+(corridor[1]-corridor[0])*position)*calibration.factor));
      weeklyApplied=!!band&&prescription.valid;
    }
    const reference=projected??prior;
    const changedRepBand=top?!sameTarget(e,set,top,session):false;
    let anomalous=seed>0&&reference>0&&Math.abs(seed-reference)>Math.max(2*p.step,seed*(projected!=null&&changedRepBand?.25:.1));
    if(seed===prior&&series?.full&&series.effortKnown)anomalous=false;
    // Week eight offers an updated weight for every base exercise with
    // comparable history. A stale prescribed seed is not a reason to hide it.
    if(weekEight&&compound&&projected!=null&&ids.length)anomalous=false;
    let raw=anomalous?seed:(projected??prior??seed??0),
      reason = "Недостаточно сопоставимой истории: текущий вес сохранён",
      action = projected!=null&&!anomalous&&Math.abs(projected-prior)>=p.step/2?"range_adjust":"hold";
    const effortKnown = recent.filter((x) => effort(x) != null).length;
    const strong=groups.length>=2&&groups.every(g=>g.length>0&&g.every(x=>effort(x)!=null&&effort(x)<=target)&&g.every(x=>number(x.set.actualReps??x.set.r)>=range.hi))&&
      (!series||(series.full&&previousSeries?.full));
    const weak =
      latest.length > 0 &&
      latest.every(x=>number(x.set.actualReps??x.set.r)<range.lo&&effort(x)!=null&&effort(x)>target);
    if(strong&&projected!=null&&projected<=prior+p.step/2&&!anomalous){projected=null;raw=prior;action="hold"}
    if(ids.length){
      reason=anomalous?`План ${seed} кг далеко от ${projected!=null?`оценки для нового диапазона ${Number(projected.toFixed(1))}`:`прошлой рабочей нагрузки ${prior}`} кг: нужна ручная проверка`:projected!=null?`Последний лучший сет ${prior} кг × ${oldReps} при RPE ${oldRpe}; его 1ПМ ≈ ${Number(latestOneRepMax.toFixed(1))} кг. Оценка по ${strength.setCount} подходам из ${strength.sessionCount} тренировок ≈ ${Number(stableOneRepMax.toFixed(1))} кг; для ${range.lo}–${range.hi} повторений при RPE ${targetMin}–${target} ориентир ${Number(projected.toFixed(1))} кг${weeklyApplied?` с учётом недели ${Number((band.lo*100).toFixed(1))}–${Number((band.hi*100).toFixed(1))}%`:""}`:"Сохранить вес последнего тяжёлого рабочего сета";
      if(fatigueLimited&&!anomalous)reason+=`. Последний из ${lastWorking.length} подходов вышел за диапазон: повышение ограничено; коррекция сегодня считается отдельно`;
      if(action==="hold"&&projected!=null&&!anomalous)reason=`Повторы в целевом диапазоне: сохранить вес. ${reason}`;
      if (strong&&!anomalous&&projected==null) {
        action = "up";
        reason =
          "В двух последних тренировках достигнута верхняя граница повторений";
        raw = p.available?.length
          ? moveWeight(raw, p.loadType === "bodyweight_assisted" ? -1 : 1, p)
          : raw + (p.loadType === "bodyweight_assisted" ? -1 : 1) * p.step;
      } else if (weak&&!anomalous&&projected==null) {
        action = "down";
        reason =
          "Последние рабочие подходы ниже диапазона или тяжелее целевого RPE";
        raw = p.available?.length
          ? moveWeight(raw, p.loadType === "bodyweight_assisted" ? 1 : -1, p)
          : raw + (p.loadType === "bodyweight_assisted" ? 1 : -1) * p.step;
      }
    }
    if(method(e,set)!=="STANDARD"&&strong&&!anomalous){raw=prior??raw;action="hold";reason="Метод оценивается целиком: отдельные стадии не повышаются"}
    if (p.loadType === "bodyweight_only" || p.loadType === "repetitions_only") {
      raw = 0;
      action = "reps";
      reason = strong
        ? "Верх диапазона достигнут: можно выбрать вариант с дополнительным весом"
        : "Сначала увеличивай повторы в заданном диапазоне";
    }
    const deload =
      session.deload === true || session.isDeload === true;
    if (
      prior != null &&
      deload && !anomalous &&
      !["bodyweight_only", "repetitions_only"].includes(p.loadType)
    ) {
      raw = projected!=null ? projected : weeklyRaw!=null ? weeklyRaw :
        p.loadType === "bodyweight_assisted" ? prior + p.step : (projected??prior) * 0.925;
      if(weeklyRaw!=null)weeklyApplied=true;
      reason = "Разгрузочная неделя";
      action = "down";
    }
    if (ids.length >= 2 && prior != null && !deload && !anomalous && projected==null) {
      const cap = p.step * (p.maxChangeSteps || 1);
      raw = Math.min(prior + cap, Math.max(0, prior - cap, raw));
    }
    let trend =
      anomalous||ids.length < 2
        ? "insufficient"
        : strong
          ? "progress"
          : weak
            ? "regress"
            : "stable";
    if (ids.length >= 3 && action === "hold" && !anomalous) {
      const scores = ids.slice(0,3).map((id) => {
        const a = recent.filter((x) => x.session.id === id);
        return [
          median(a.map((x) => number(x.set.w) || 0)),
          median(a.map((x) => number(x.set.actualReps ?? x.set.r) || 0)),
          median(a.map(effort).filter(x=>x!=null)),
        ].join(":");
      });
      if (new Set(scores).size === 1) {
        trend = "plateau";
        reason =
          "Три сопоставимые тренировки без прироста: сохранить вес и проверить восстановление";
      }
    }
    const currentRows = [];
    if (!session.ended) {
      let stop = false;
      for (const ex of session.ex || []) {
        for (const s of ex.set || []) {
          if (s === set) {
            stop = true;
            break;
          }
          if ((complete(ex, s, reg)||(s.ok&&number(s.actualReps??s.r)===0&&setRole(ex,s)==="test_attempt")) && comparable(e, ex, reg, set, s))
            currentRows.push({ exercise: ex, set: s });
        }
        if (stop) break;
      }
    }
    const lastToday = currentRows.at(-1);
    let nextSetSuggestion=null;
    if (
      lastToday && method(e,set)==="STANDARD" && !testAttempt && !isolationTest && setRole(e,set)!=="backoff" &&
      !["time", "distance", "bodyweight_only", "repetitions_only"].includes(
        p.loadType,
      )
    ) {
      const used = number(lastToday.set.w);
      if (used != null) nextSetSuggestion=setDecision(e,lastToday.set,session,p,set);
    }

    let testWeekSuggestion=false;
    const backoff=setRole(e,set)==="backoff";
    let backoffPreview=false;
    if(backoff){
      const completedTest=currentRows.filter(x=>['test_attempt','isolation_test'].includes(setRole(x.exercise,x.set))&&number(x.set.actualReps??x.set.r)>0);
      let best=completedTest.length?Math.max(...completedTest.map(x=>number(x.set.w)||0)):0;
      if(!best){
        const plannedTest=(session.ex||[]).flatMap(ex=>(ex.set||[]).map(s=>({ex,s}))).find(x=>loadComparable(e,x.ex,reg,set,x.s)&&setRole(x.ex,x.s)==='test_attempt');
        if(plannedTest){const preview=recommend(plannedTest.ex,plannedTest.s,session,sessions,reg,overrides);best=preview.weight;backoffPreview=best>0;}
      }
      if(best>0&&!bodyLoad){
        const fraction=number(set.backoffPercent)!=null?Math.max(.1,Math.min(1,number(set.backoffPercent)/100)):/70%/.test(String(e.n||""))?.70:.72;
        const repCap=stableOneRepMax>0?fromEstimateLoad(stableOneRepMax/(1+(targetReps+10-(targetMin+target)/2)/30),e,session,reg):null;
        const suggested=roundWeight(Math.min(best*fraction,repCap??Infinity),p,"down");
        if(suggested>0){
          raw=suggested;projected=suggested;anomalous=false;nextSetSuggestion=null;testWeekSuggestion=true;
          action="backoff";reason=`Back-off: ${Math.round(fraction*100)}% ${backoffPreview?'от предполагаемой тестовой попытки':'от лучшей выполненной тестовой попытки'} ${best} кг, с учётом шага ${p.step} кг`;
        }
      }
    }
    if(backoff){
      const previousBackoff=currentRows.filter(x=>setRole(x.exercise,x.set)==='backoff').at(-1);
      if(previousBackoff){nextSetSuggestion=setDecision(e,previousBackoff.set,session,p,set);raw=nextSetSuggestion.weight;anomalous=false;}
    }
    if(testAttempt){
      const previousTest=currentRows.filter(x=>setRole(x.exercise,x.set)==="test_attempt").at(-1);
      const todayReps=number(previousTest?.set?.actualReps??previousTest?.set?.r);
      const todayWeight=number(previousTest?.set?.w);
      const todayMax=previousTest?e1rm(previousTest.exercise,previousTest.set,session,reg):null;
      const referenceMax=todayMax??stableOneRepMax;
      if(referenceMax>0&&["external_total","machine_stack","per_dumbbell","per_side"].includes(p.loadType)){
        const name=String(e.n||"");
        const attempt=number(set.attempt??set.attemptNumber)??Number(name.match(/попытка\s*(\d+)/i)?.[1]||0);
        const stageFraction=[.5,.75,1][Math.min(2,Math.max(0,attempt-1))];
        const factor=range.lo>=5?.85:range.lo>=2?.925:attempt>0&&band?band.lo+(band.hi-band.lo)*stageFraction:attempt===1?.95:attempt===2?.975:attempt>=3?1:.975;
        let suggested=roundWeight(fromEstimateLoad(referenceMax*factor,e,session,reg),p,"down");
        if(previousTest){
          const used=number(previousTest.set.w),felt=effortRpe(previousTest.set);
          if(used>0){
            if((felt!=null&&felt>=9.5)||todayReps===0)suggested=Math.min(suggested,used);
            else {
              const futureStages=Math.max(0,attempt-(number(previousTest.set.attemptNumber)||1)-1);
              const increments=(felt==null?1:felt<=7?3:felt<=8?2:1)+futureStages;
              suggested=used;for(let i=0;i<increments;i++)suggested=moveWeight(suggested,1,p);
            }
          }
        }
        if(suggested>0){
          raw=suggested;projected=suggested;anomalous=false;testWeekSuggestion=true;
          action=previousTest&&(effortRpe(previousTest.set)>=9.5||todayReps===0)?"stop":"test_attempt";
          reason=`Тест: оценка 1ПМ ≈ ${Number(referenceMax.toFixed(1))} кг; ${Math.round(factor*1000)/10}% с округлением по шагу ${p.step} кг${previousTest?". Учтена выполненная попытка":""}. Следующую попытку выполняй только после оценки предыдущей`;
        }
      }
    }
    if(isolationTest){
      const previous=currentRows.filter(x=>setRole(x.exercise,x.set)==='isolation_test').at(-1);
      const workingMax=strength.estimate>0?fromEstimateLoad(strength.estimate/(1+(targetReps+10-target)/30),e,session,reg):seed;
      const fraction=[.9,.95,1][Math.min(2,Math.max(0,(number(set.attemptNumber)||1)-1))];
      raw=roundWeight(workingMax*fraction,p,'down');
      action='isolation_test';reason='Проверка рабочего веса в заданном диапазоне повторений; процент от рабочего веса, а не от 1ПМ';
      if(previous){const decision=setDecision(e,previous.set,session,p,set);raw=decision.weight;reason=decision.reason;if(effortRpe(previous.set)>=9.5||number(previous.set.actualReps??previous.set.r)===0)action='stop';}
      projected=raw;anomalous=false;nextSetSuggestion=null;testWeekSuggestion=true;
    }
    if(testAttempt&&currentRows.some(x=>setRole(x.exercise,x.set)==='test_attempt'&&number(x.set.actualReps??x.set.r)===0))action='stop';
    if(action==='stop')reason='Тест завершён: предыдущая попытка достигла RPE 9,5–10. Перейди к back-off';
    const methodRec=methodPrescription(e,set,session,allHistory,reg,p,strength);
    if(methodRec) {
      raw=methodRec.weight;projected=methodRec.raw;anomalous=false;
      reason=methodRec.reason;action='method';
      for(const id of methodRec.sessionIds)if(!ids.includes(id))ids.push(id);
      if(methodRec.live)nextSetSuggestion={weight:methodRec.weight,action:'method',reason:methodRec.reason};
    }
    const ordinary=method(e,set)==='STANDARD'&&!testAttempt&&!isolationTest&&!backoff;
    const reasonCodes=[];
    let repetitionGoal=null;
    if(ordinary&&prior!=null&&!anomalous&&!deload){
      if(series&&!series.full){
        raw=prior;action='hold';trend='insufficient';reasonCodes.push('INCOMPLETE_SERIES');
        reason='Серия записана не полностью или содержит меньше подходов, чем новое задание: рабочий вес сохранён';
      }else if(series&&!changedRepBand&&!series.effortKnown){
        raw=prior;action='hold';reasonCodes.push('MISSING_SERIES_EFFORT');
        reason='Не для всех подходов указано усилие: повышение отложено, рабочий вес сохранён';
      }else if(fatigueLimited||(series?.sameTarget&&series.failed>0&&!weak)){
        raw=repeatedFatigue?moveWeight(prior,p.loadType==='bodyweight_assisted'?1:-1,p):prior;
        action=repeatedFatigue?'down':'hold';reasonCodes.push(repeatedFatigue?'REPEATED_SERIES_MISS':'SERIES_MISS');
        reason=repeatedFatigue?'Две сопоставимые полные серии с недобором: уменьшить стартовый вес на один шаг':
          'Поздние подходы вышли за цель: сохранить стартовый вес; сегодняшняя коррекция рассчитывается отдельно';
      }else if(series?.sameTarget&&series.uniform&&series.easier){
        raw=moveWeight(prior,p.loadType==='bodyweight_assisted'?-1:1,p);action='up';reasonCodes.push('EASY_SERIES');reason='Полная серия выполнена легче цели: увеличить на один доступный шаг';
      }else if(series?.sameTarget&&series.uniform&&series.allInRange&&!series.easier){
        raw=prior;action='hold';reasonCodes.push('SERIES_ON_TARGET');
        repetitionGoal=series.reps.some(r=>r<range.hi)?series.reps.reduce((n,r)=>n+r,0)+1:null;
        reason=repetitionGoal!=null?'Серия выполнена в целевом усилии: оставить вес, попробовать добавить одно повторение суммарно':
          'Серия соответствует заданию: сохранить вес и целевое усилие';
      }
      if(oldReps>=range.lo&&oldRpe>target&&!weak){raw=prior;action='hold';reason='Минимум повторений выполнен, но тяжело: сохранить вес';}
      if(oldRpe==null&&effortKnown>0&&!changedRepBand){raw=prior;action='hold';reason='Последнее усилие не указано: сохранить вес, оценка силы использует прошлую историю';}
      if(trend==='plateau')reason+='; три сопоставимые тренировки без прироста';
      if(changedRepBand)reasonCodes.push('TARGET_REBASE');
      if(calibration.applied)reason+=`; поправка по прошлым прогнозам ${Math.round((calibration.factor-1)*1000)/10}%`;
    }
    // The completed series informs strength, but cannot replace this week's target.
    const weeklyCalculated=ordinary&&eligible&&weeklyApplied&&weeklyRaw!=null;
    if(weeklyCalculated){
      raw=weeklyRaw;anomalous=false;reasonCodes.length=0;
      action='range_adjust';reason='Среднее недельного диапазона округлено до ближайшего доступного веса';
    }
    const wellbeingFactor=number(session.wellbeing?.factor)!=null?Math.max(.9,Math.min(1,number(session.wellbeing.factor))):session.trainingReadinessDone&&session.readinessAdjusted
      ?Math.min(1,Math.max(.9,number(session.readiness?.factor)??1)):1;
    const hasActual=(session.ex||[]).some(ex=>(ex.set||[]).some(s=>complete(ex,s,reg)&&loadComparable(e,ex,reg,set,s)));
    const wellbeingApplied=wellbeingFactor!==1&&!hasActual&&!anomalous&&!backoffPreview&&raw>0;
    if(wellbeingApplied){
      const effective=loadForEstimate(e,{w:raw},session,reg);
      const adjusted=effective!=null?fromEstimateLoad(effective*wellbeingFactor,e,session,reg):null;
      if(adjusted!=null){raw=roundWeight(adjusted,p,p.loadType==='bodyweight_assisted'?'up':'down');reason+='; учтено самочувствие перед первым подходом'}
    }
    let conflict=weeklyCorridor && !weeklyApplied && !testWeekSuggestion && !methodRec &&
      (raw<Math.min(weeklyCorridor.min,weeklyCorridor.max)-p.step||raw>Math.max(weeklyCorridor.min,weeklyCorridor.max)+p.step)
      ? 'Процент недели расходится с повторами и целевым усилием; вес подобран по повторам и RPE/RIR' : null;
    if(conflict)reason+=`. ${conflict}`;
    let weight=(ids.length||testWeekSuggestion)&&!anomalous?roundWeight(raw,p,ids.length===1&&projected==null?"down":undefined):raw;
    if(ordinary&&!weeklyCalculated&&!anomalous&&!deload&&prior!=null){
      const bounded=boundedProgression(weight,prior,p,changedRepBand);
      if(bounded.limited){weight=bounded.weight;reasonCodes.push('STEP_LIMIT');reason+='; прибавка ограничена доступным шагом и размером изменения';}
      // A rounded sub-step estimate is not itself evidence of progression.
      if(!wellbeingApplied&&!strong&&!changedRepBand&&!series?.easier&&Math.abs(raw-prior)<p.step*.5){weight=prior;}
      if(weight===prior&&action!=='reps')action='hold';
    }
    if(ordinary&&nextSetSuggestion){
      const bounded=boundedProgression(nextSetSuggestion.weight,number(lastToday?.set.w),p);
      if(bounded.limited){nextSetSuggestion={...nextSetSuggestion,weight:bounded.weight,action:bounded.weight===number(lastToday.set.w)?'hold':nextSetSuggestion.action,
        reason:nextSetSuggestion.reason+'; прибавка ограничена шагом оборудования'};reasonCodes.push('NEXT_SET_STEP_LIMIT');}
    }
    if(weeklyCalculated){
      // Equipment increments may not fit the narrow percentage/effort intersection.
      // Round the weekly midpoint instead of rejecting a usable adjacent load.
      weight=roundWeight(nextSetSuggestion?.weight??raw,p,'nearest');
      if(weight!==prior)repetitionGoal=null;
      if(nextSetSuggestion)nextSetSuggestion={...nextSetSuggestion,weight};
      conflict=null;
      reasonCodes.push('WEEKLY_CALCULATED_WEIGHT');
      if(!nextSetSuggestion)action='range_adjust';
    }
    if(ordinary&&!weeklyCalculated&&corridor&&weight!=null&&(weight<Math.min(...corridor)-p.step/2||weight>Math.max(...corridor)+p.step/2)){conflict='Лимит коррекции или сохранённый рабочий вес выходит за расчётный коридор: проверь цель по повторам и усилию';if(!reason.includes(conflict))reason+='. '+conflict;}
    const requiresEffort=ordinary&&ids.length>0&&effortKnown===0&&(!lastToday||effortRpe(lastToday.set)==null);
    if(requiresEffort){weight=seed;action='hold';reasonCodes.push('EFFORT_REQUIRED');reason='Укажи RPE или RIR: история сохранена, вес по усилию пока не рассчитывается';}
    if(ordinary&&ids.length>=3&&action==='hold'&&!strong&&!weak&&new Set(ids.slice(0,3).map(id=>JSON.stringify(recent.filter(x=>x.session.id===id).map(x=>[x.set.w,x.set.actualReps??x.set.r,effortRpe(x.set)])))).size===1){trend='plateau';reason+='; три сопоставимые тренировки без прироста';}
    const confidence =
        anomalous||effortKnown===0?"низкая":ids.length >= 3 && effortKnown === recent.length
          ? projected!=null?"средняя":"высокая"
          : ids.length >= 2 && effortKnown
            ? "средняя"
            : latestOneRepMax!=null?"средняя":"низкая";
    return {
      weight,
      series,calibration,reasonCodes,repetitionGoal,
      analogousSessionId:analogous?.[0]?.session.id??null,
      calculationVersion:469,
      canApply:(!weeklyCalculated||weight!=null)&&!requiresEffort&&!['AMRAP','EMOM','AFAP','HIIT'].includes(method(e,set)),
      allowedWeightRange:corridor?{min:Math.min(...corridor),max:Math.max(...corridor)}:null,
      calculatedWeight:weeklyCalculated?weight:projected,
      weeklyCalculated:!!weeklyCalculated,
      profileWarnings:prescription.warnings,
      scope:nextSetSuggestion?'next_set':'next_session',
      proposalKey:proposalFingerprint([469,session.id,setRole(e,set),range,effortBand,band,set.programW,p,session.readiness,session.readinessAdjusted,series,calibration,currentRows.map(x=>[x.set.w,x.set.actualReps??x.set.r,effortRpe(x.set)]),strength.points.map(x=>[x.session.id,x.value]),set.attemptNumber]),
      raw,
      previous: prior,
      basis:ids.length?{date:sessionDate(latest[0]?.session??strength.source?.session),weight:prior??number(strength.source?.set.w),planned:seed||null,estimatedOneRepMax:latestOneRepMax!=null?Number(latestOneRepMax.toFixed(1)):null,sets:latest.map(x=>({weight:number(x.set.w),reps:number(x.set.actualReps??x.set.r),rpe:effort(x)}))}:null,
      delta: prior == null ? 0 : Number((weight - prior).toFixed(6)),
      step: p.step,
      action,
      planPreserved: anomalous,
      testWeekSuggestion,
      backoffPreview,
      wellbeingApplied,
      wellbeingResolved:true,
      nextSetSuggestion,
      trend,
      reason,
      confidence,
      sessionIds: ids,
      excludedHistory: excluded,
      evidence: [
        ...latest.map((x) => `${sessionDate(x.session)}: ${setLabel(x.exercise, x.set, reg)}`),
        ...(lastToday
          ? ["Сегодня: " + setLabel(lastToday.exercise, lastToday.set, reg)]
          : []),
      ],
      rounding:
        anomalous?"Плановый вес сохранён без округления: старая нагрузка не соответствует текущему плану":ids.length>0
          ? `Расчётное значение: ${Number(raw.toFixed(2))} кг. Рекомендация округлена до ${weight} кг с учётом шага ${p.step} кг`
          : "Исходный вес сохранён без округления: истории пока недостаточно",
      repRange: range,
      weeklyIntensity: band?{
        min:Number((band.lo*100).toFixed(1)),max:Number((band.hi*100).toFixed(1)),
        estimatedMin:weeklyCorridor?Number(weeklyCorridor.min.toFixed(1)):null,
        estimatedMax:weeklyCorridor?Number(weeklyCorridor.max.toFixed(1)):null,
        applied:weeklyApplied
      }:null,
      strength: {stableMean:strength.stableMean,best:strength.best,lastPerformed:strength.lastPerformed,lastWorkingSets:strength.lastWorkingSets,protocols:strength.protocols,sessionCount:strength.sessionCount,setCount:strength.setCount,estimate:strength.estimate==null?null:Number(strength.estimate.toFixed(1)),confirmed:strength.confirmed,
        confidenceLow:strength.confidenceLow,confidenceHigh:strength.confidenceHigh,confidence:strength.confidence,sources:strength.points.slice(0,12).map(x=>({date:sessionDate(x.session),method:method(x.exercise,x.set),role:setRole(x.exercise,x.set),weight:number(x.set.w),reps:number(x.set.actualReps??x.set.r),rpe:effortRpe(x.set)}))},
      methodStage:methodRec?.role??setRole(e,set),
      targetEffort:effortBand,
      conflict,
      exerciseKind:compound?"base":"isolation",
      equipmentId:String(e?.equipmentProfileId||e?.equipmentProfile?.id||""),
      equipmentName:String(e?.equipmentProfile?.name||""),
    };
  }
  function proposalFingerprint(value) {
    const text=JSON.stringify(value);let a=2166136261,b=2246822519;
    for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822507)}
    return `v440:${(a>>>0).toString(16)}:${(b>>>0).toString(16)}`;
  }
  function acceptRecommendation(set,result) {
    const weight=recommendationWeight(result);
    if(set.ok||set.skipped||result.canApply===false||result.action==='stop'||weight==null)return false;
    if(!set.recommendationRestore)set.recommendationRestore={w:set.w,plannedW:set.plannedW,weightSource:set.weightSource,manualOverride:set.manualOverride};
    set.w=weight;set.plannedW=weight;set.weightSource='recommendation';set.manualOverride=false;
    set.recommendationDecision={status:'applied',proposalKey:result.proposalKey,weight,at:Date.now()};
    delete set.dismissedRecommendation;return true;
  }
  function dismissRecommendation(set,result) {
    if(set.ok||set.skipped)return false;
    if(set.recommendationRestore&&set.weightSource==='recommendation'&&set.w===set.recommendationDecision?.weight)Object.assign(set,set.recommendationRestore);
    delete set.recommendationRestore;
    set.dismissedRecommendation=result.proposalKey;
    set.recommendationDecision={status:'dismissed',proposalKey:result.proposalKey,at:Date.now()};return true;
  }
  function applyAuto(set, result) {
    if (set.ok || set.skipped || set.manualOverride || set.weightSource === "manual" || result.canApply===false || result.planPreserved || result.action === "stop" || (result.proposalKey&&set.dismissedRecommendation===result.proposalKey))
      return false;
    if(set.recommendationOriginalWeight===undefined)set.recommendationOriginalWeight=set.w;
    const weight=recommendationWeight(result);
    if(weight==null)return false;
    set.w = weight;
    set.weightSource = "auto";
    return true;
  }
  function prepareTestBlocks(session,reg) {
    if(!session||session.ended||!reg||session.weeklyLoadProfile?.test)return false;
    let changed=false;
    const groups=[];
    for(const ex of session.ex||[]){
      let group=groups.find(g=>loadComparable(g[0],ex,reg));
      if(!group){group=[];groups.push(group)}group.push(ex);
    }
    const fresh=(template,role,ordinal)=>({w:number(template.programW??template.plannedW??template.w)||0,r:'',ok:false,role,setRole:role,attemptNumber:ordinal,plannedReps:template.plannedReps??template.r??1,targetRepMin:template.targetRepMin,targetRepMax:template.targetRepMax,targetRepLabel:template.targetRepLabel,programW:template.programW,testGenerated:true});
    for(const group of groups){
      if(['time','distance','bodyweight_only','repetitions_only'].includes(loadType(group[0],reg)))continue;
      const entries=()=>group.flatMap(ex=>(ex.set||[]).map(s=>({ex,s})));
      let tests=entries().filter(x=>['test_attempt','isolation_test'].includes(setRole(x.ex,x.s)));
      const isolation=group.length===1&&String(group[0].type||reg?.resolve(group[0])?.type).toLowerCase()==='isolation';
      const builtin=Number(session.w)===8&&!session.programId&&!session.planId&&!session.programName;
      if(!tests.length&&isolation&&(builtin||group[0].testMode==='isolation')){
        const ex=group[0];
        if((ex.set||[]).some(s=>s.ok||s.manualOverride||s.weightSource==='manual'))continue;
        for(const s of ex.set||[]){s.role=s.setRole='isolation_test';s.targetRpeMin=8;s.targetRpeMax=9;}
        tests=entries();changed=true;
      }
      if(!tests.length)continue;
      // A completed workout block is immutable. Migrate only pending stages.
      const desired=Math.max(1,Math.min(5,number(group[0].testAttempts)||3));
      const role=setRole(tests[0].ex,tests[0].s);
      if(tests.length<desired&&tests.some(x=>!x.s.ok)){
        const last=tests.at(-1),at=last.ex.set.indexOf(last.s)+1;
        last.ex.set.splice(at,0,...Array.from({length:desired-tests.length},(_,i)=>fresh(last.s,role,tests.length+i+1)));changed=true;
      }
      tests=entries().filter(x=>['test_attempt','isolation_test'].includes(setRole(x.ex,x.s)));
      tests.forEach(({s},i)=>{if(s.attemptNumber!==i+1){s.attemptNumber=i+1;changed=true}if(!s.ok&&role==='test_attempt'&&number(s.plannedReps??s.r)===1){const lo=[7,8,9][Math.min(i,2)];if(s.targetRpeMin!==lo||s.targetRpeMax!==lo+1){s.targetRpeMin=lo;s.targetRpeMax=lo+1;changed=true}}});
      let backoffs=entries().filter(x=>setRole(x.ex,x.s)==='backoff');
      if(!backoffs.length&&role==='isolation_test'){
        const last=tests.at(-1);for(let i=0;i<desired;i++){const s=fresh(last.s,'backoff',i+1);s.backoffPercent=90;s.targetRpeMin=7;s.targetRpeMax=8;last.ex.set.push(s)}changed=true;
      }else if(backoffs.length&&backoffs.length<desired&&tests.some(x=>!x.s.ok)){
        const last=backoffs.at(-1);for(let i=backoffs.length;i<desired;i++){const s=fresh(last.s,'backoff',i+1);s.backoffPercent=last.s.backoffPercent;s.targetRpeMin=7;s.targetRpeMax=8;last.ex.set.push(s)}changed=true;
      }
      backoffs=entries().filter(x=>setRole(x.ex,x.s)==='backoff');
      const completed=tests.filter(x=>x.s.ok);
      const stopped=completed.some(x=>number(x.s.actualReps??x.s.r)<repRange(x.ex,x.s).lo||effortRpe(x.s)>=9.5||x.s.techniqueFailed||x.s.stopTest);
      const successful=completed.filter(x=>number(x.s.actualReps??x.s.r)>=repRange(x.ex,x.s).lo&&!x.s.techniqueFailed).length;
      for(const [i,x] of backoffs.entries()){
        const omit=stopped&&i>=successful;
        if(!x.s.ok&&!x.s.manualOverride&&x.s.weightSource!=='manual'&&Boolean(x.s.testOmitted)!==omit){x.s.testOmitted=omit;x.s.skipped=omit;changed=true}
      }
      for(const x of tests){const omit=stopped&&!x.s.ok;if(!x.s.ok&&!x.s.manualOverride&&x.s.weightSource!=='manual'&&Boolean(x.s.testOmitted)!==omit){x.s.testOmitted=omit;x.s.skipped=omit;changed=true}}
    }
    return changed;
  }
  function recordScore(e, s, reg) {
    const type = loadType(e, reg),
      w = number(s.w) || 0,
      r = number(s.actualReps ?? s.r) || 0;
    if (type === "time")
      return [number(s.seconds ?? s.workSeconds) ?? (number(s.min) || 0) * 60];
    if (type === "distance") return [number(s.distance ?? s.km) || 0];
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
        const load = effectiveLoad(e, s, session, reg, weights);
        if (load == null) unknownVolumeSets++;
        else volume += load * number(s.actualReps ?? s.r);
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
        if (method(e, s) !== "STANDARD") continue;
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
          if (number(s.actualReps ?? s.r) === 5)
            point.best5 = Math.max(point.best5, number(s.w) || 0);
          point.sets++;
          point.volume +=
            (effectiveLoad(e, s, session, reg, weights) || 0) *
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
    strengthSeries,
    bestResults,
    number,
    norm,
    registry,
    loadType,
    profile,
    roundWeight,
    moveWeight,
    method,
    warmup,
    validSet,
    complete,
    bodyWeightAt,
    effectiveLoad,
    setLabel,
    e1rm,
    manualOneRepMax,
    history,
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
