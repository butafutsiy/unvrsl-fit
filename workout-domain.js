"use strict";
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkoutDomain = api;
})(typeof window === "undefined" ? null : window, () => {
  const SCHEMA_VERSION = 4;
  const weekProfiles={
    1:{pct:[70,75],rpe:[6,8],tempo:'3-1-2',baseRest:[120,180],isoRest:[60,90],focus:'Техника, базовый объём'},
    2:{pct:[75,80],rpe:[7,8],tempo:'3-1-2',baseRest:[120,180],isoRest:[60,90],focus:'Рабочий объём'},
    3:{pct:[80,85],rpe:[8,9],tempo:'2-0-2',baseRest:[90,150],isoRest:[45,75],focus:'Механика и метаболика'},
    4:{pct:[60,65],rpe:[4,6],tempo:'2-0-2',baseRest:[60,90],isoRest:[30,60],focus:'Плотность и памп'},
    5:{pct:[85,88],rpe:[8,9],tempo:'2-0-2',baseRest:[120,180],isoRest:[60,90],focus:'Тяжёлый стимул'},
    6:{pct:[60,70],rpe:[4,6],tempo:'3-1-2',baseRest:[60,90],isoRest:[30,60],focus:'Разгрузка и памп'},
    7:{pct:[88,90],rpe:[8.5,9.5],tempo:'2-0-1 / 2-0-X',baseRest:[180,240],isoRest:[90,120],focus:'Сила'},
    8:{pct:[90,100],rpe:[9,10],tempo:'2-0-X',baseRest:[240,360],isoRest:[90,120],focus:'Контроль результатов',test:true}
  };
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
    const kind = String(e?.type || row?.type || "compound").toLowerCase();
    const muscle = norm(e?.tg || row?.tg || e?.bp || row?.bp);
    const inferredStep =
      type === "per_dumbbell"
        ? 2
        : type === "bodyweight_assisted"
          ? 5
          : kind === "isolation" && /delt|shoulder|biceps|triceps|предплеч|дельт|плеч|бицеп|трицеп/.test(muscle)
            ? 1
            : kind === "isolation"
              ? 2.5
              : ["cable", "leverage machine", "sled machine"].includes(eq)
                ? 5
                : 2.5;
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
      ...(number(equipment.weightStep)>0?{step:number(equipment.weightStep)}:{}),
      ...(available.length?{available}:{}),
      ...(equipment.loadUnit==="TOTAL"&&number(equipment.implementWeight)>0?{min:number(equipment.implementWeight)}:{}),
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
      !strengthEligible(e,s) ||
      reg?.resolve(e)?.resultRule?.e1rm === false
    )
      return null;
    const type = loadType(e, reg);
    if (
      ["time", "distance", "repetitions_only", "bodyweight_only"].includes(type)
    )
      return null;
    const r = number(s.actualReps ?? s.r);
    if (!(r >= 1 && r <= 12)) return null;
    const w =
      type === "per_dumbbell"
        ? number(s.w)
        : effectiveLoad(e, s, session, reg, weights);
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
    return loadType(e,reg)==='per_dumbbell'?number(s.w):effectiveLoad(e,s,session,reg,weights);
  }
  function fromEstimateLoad(value,e,session,reg) {
    const type=loadType(e,reg);
    if (['bodyweight_added','bodyweight_assisted'].includes(type)) {
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
    const compatible=rows.filter(x=>loadComparable(e,x.exercise,reg,set,x.set));
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
        for(const x of group)if(Math.abs(x.value-mid)>spread&&x.value>mid)x.confidenceWeight*=.05;
      }
      const sum=group.reduce((n,x)=>n+x.confidenceWeight,0);
      return {value:group.reduce((n,x)=>n+x.value*x.confidenceWeight,0)/sum,weight:Math.max(...group.map(x=>x.confidenceWeight)),group};
    });
    const weightedMedian=rows=>{const sorted=[...rows].sort((a,b)=>a.value-b.value);const half=sorted.reduce((n,x)=>n+x.weight,0)/2;let acc=0;for(const x of sorted){acc+=x.weight;if(acc>=half)return x.value}return null};
    const center=weightedMedian(sessions);
    const deviations=sessions.map(x=>({value:Math.abs(x.value-center),weight:x.weight}));
    const tolerance=Math.max((center||0)*.04,3*(weightedMedian(deviations)||0));
    // A lone exceptional session has bounded influence in both directions.
    const adjusted=sessions.map((x,i)=>({...x,weight:x.weight*(sessions.length>=3&&Math.abs(x.value-center)>tolerance?.1:sessions.length===2&&i===0&&Math.abs(x.value-sessions[1].value)>sessions[1].value*.08?.2:1)}));
    const sum=adjusted.reduce((n,x)=>n+x.weight,0);
    const estimate=sum?adjusted.reduce((n,x)=>n+x.value*x.weight,0)/sum:null;
    const spread=estimate==null?null:Math.max(estimate*.02,Math.sqrt(adjusted.reduce((n,x)=>n+x.weight*(x.value-estimate)**2,0)/sum));
    const actualSingles=compatible.filter(x=>complete(x.exercise,x.set,reg)&&number(x.set.actualReps??x.set.r)===1);
    const source=points.find(x=>x.confidenceWeight>=.2)??points[0]??null;
    const latestGroup=sessions[0]?.group||[];
    return {estimate,latest:latestGroup.length?Math.max(...latestGroup.map(x=>x.value)):null,points,source,
      confidenceLow:estimate==null?null:estimate-spread,confidenceHigh:estimate==null?null:estimate+spread,
      confirmed:actualSingles.length?Math.max(...actualSingles.map(x=>loadForEstimate(x.exercise,x.set,x.session,reg,weights)||0)):null,
      confidence:sessions.filter(x=>x.weight>=.4).length>=3?'высокая':sessions.filter(x=>x.weight>=.3).length>=2?'средняя':'низкая'};
  }
  function setDecision(e,s,session,p,targetSet=s) {
    const range=repRange(e,targetSet),target=effortTarget(e,targetSet,session);
    const reps=number(s.actualReps??s.r),felt=effortRpe(s),used=number(s.w);
    const hard=reps<range.lo||(felt!=null&&felt>target.hi+.5);
    const easy=!hard&&reps>=range.hi&&felt!=null&&felt<target.lo-.5;
    const state=hard?'TOO_HARD':easy?'TOO_EASY':'TARGET';
    const severity=hard?Math.max((range.lo-reps)/Math.max(1,range.lo),(felt==null?0:felt-target.hi)/4):0;
    const count=hard&&severity>=.4?2:1;
    const direction=(hard?-1:easy?1:0)*(p.loadType==='bodyweight_assisted'?-1:1);
    let weight=used;for(let i=0;i<count&&direction;i++)weight=moveWeight(weight,direction,p);
    return {state,weight,action:hard?'down':easy?'up':'hold',reason:hard?'Ниже диапазона или тяжелее целевого усилия':easy?'Повторы выполнены с запасом больше цели':'Повторы и усилие в целевом диапазоне'};
  }

  function effortTarget(e,s,session) {
    const rirLo=number(s.targetRirMin??e.targetRirMin),rirHi=number(s.targetRirMax??e.targetRirMax);
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
          else if(easy)raw=moveWeight(raw,harder,p);
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
        if(hard)raw=reduce(raw);else if(easy)raw=moveWeight(raw,harder,p);
      }
      reason=m==='DS'?'DS: стартовый вес и соотношение ступеней из плана; учтена предыдущая ступень':'FST-7: общий стартовый вес, повторы и утомление при коротком отдыхе';
    } else return null;
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
    if (!(weight > 0) || !(reps >= 1 && reps <= 12) || !(rpe >= 6 && rpe <= 10)) return null;
    return weight * (reps===1 && rpe===10 ? 1 : 1 + (reps + 10 - rpe) / 30);
  }
  function intensityBand(session,e={},s={}) {
    const explicit=number(s.targetPercentage??e.targetPercentage);
    if (session?.programWeekUseIntensity === false && explicit==null) return null;
    let lo = explicit??number(session?.programWeekIntensityMin), hi = explicit??number(session?.programWeekIntensityMax);
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
  function recommend(e, set, session, sessions, reg, overrides = {}) {
    const p = profile(e, reg, overrides),
      range = repRange(e, set),
      allHistory = history(e, sessions, reg, {
        userId: session.userId,
        excludeId: session.id,
        before: sessionTime(session)>1e11?sessionTime(session):undefined,
      }),
      strengthRows=[...allHistory,...(session.ex||[]).flatMap(ex=>(ex.set||[]).filter(s=>complete(ex,s,reg)).map(s=>({exercise:ex,set:s,session})))],
      strength=strengthEstimate(e,strengthRows,reg,[],set),
      rows=allHistory.filter((x) => method(e,set)==='STANDARD'
        ? loadComparable(e,x.exercise,reg,set,x.set)&&strengthEligible(x.exercise,x.set)
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
    const seed=[set.programW,set.plannedW,set.w].map(number).find(x=>x>0)??0;
    const effortBand=effortTarget(e,set,session),targetMin=effortBand.lo,target=effortBand.hi;
    const groups = ids
      .slice(0, 2)
      .map((id) => recent.filter((x) => x.session.id === id));
    const effort = (x) => effortRpe(x.set);
    // Each completed workout updates the estimate. The latest one carries most
    // weight; earlier comparable workouts dampen a single unusually good set.
    const top=latest.find(x=>number(x.set.w)===prior),oldReps=number(top?.set.actualReps??top?.set.r),oldRpe=top?effort(top):null;
    const targetReps=(range.lo+range.hi)/2,kind=String(e.type||reg?.resolve(e)?.type||"").toLowerCase();
    const explicitRange=[set.targetRepMin,set.targetRepMax,set.rMin,set.rMax,e.repMin,e.repMax,e.reps].some(v=>v!=null&&String(v).trim()!=="");
    const compound=kind!=="isolation";
    const bodyLoad=["bodyweight_added","bodyweight_assisted"].includes(p.loadType);
    const currentBodyWeight=number(session.bodyWeight),latestBodyWeight=number(latest[0]?.session.bodyWeight);
    const eligible=method(e,set)==="STANDARD"&&compound&&
      ["external_total","machine_stack","per_dumbbell","per_side","bodyweight_added","bodyweight_assisted"].includes(p.loadType)&&
      oldReps>=1&&oldReps<=12&&oldRpe>=6&&oldRpe<=10&&
      targetReps>=1&&targetReps<=12&&targetMin>=6&&target<=10&&targetMin<=target&&
      (bodyLoad?currentBodyWeight>0&&latestBodyWeight>0:prior>0);
    const sessionMaxes=strength.points.map(x=>x.value);
    const latestOneRepMax=strength.latest;
    const stableOneRepMax=compound?strength.estimate:null;
    const estimatedOneRepMax=eligible?stableOneRepMax:null;
    const projectedEffective=estimatedOneRepMax==null?null:estimatedOneRepMax/(1+(targetReps+10-(targetMin+target)/2)/30);
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
    if(fatigueLimited)projected=p.loadType==="bodyweight_assisted"?Math.max(prior+p.step,projected):Math.min(prior-p.step,projected);
    // The test percentage belongs to test attempts, not every compound or
    // accessory performed during week eight.
    const weekEight=Number(session.w)===8&&!session.programId&&!session.planId&&!session.programName;
    const testAttempt=compound&&setRole(e,set)==='test_attempt';
    const band=(weekEight||session.testWeek)&&!testAttempt?null:intensityBand(session,e,set),weekMid=band?((band.lo+band.hi)/2):null;
    const weeklyRaw=stableOneRepMax!=null&&weekMid!=null?fromEstimateLoad(stableOneRepMax*weekMid,e,session,reg):null;
    const weeklyCorridor=stableOneRepMax!=null&&band?{min:fromEstimateLoad(stableOneRepMax*band.lo,e,session,reg),max:fromEstimateLoad(stableOneRepMax*band.hi,e,session,reg)}:null;
    let weeklyApplied=false;
    if(compound&&weeklyRaw!=null&&projected==null&&band.hi<=.70&&targetMin<6){
      projected=weeklyRaw;weeklyApplied=true;
    }else if(compound&&weeklyRaw!=null&&projected==null&&seed===0&&prior>0&&!explicitRange){
      projected=weeklyRaw;weeklyApplied=true;
    }else if(projected!=null&&weeklyCorridor&&projected>=weeklyCorridor.min-p.step&&projected<=weeklyCorridor.max+p.step){
      projected=(projected+weeklyRaw)/2;weeklyApplied=true;
    }
    const reference=projected??prior;
    const changedRepBand=Math.abs(oldReps-targetReps)>=2;
    let anomalous=seed>0&&reference>0&&Math.abs(seed-reference)>Math.max(2*p.step,seed*(projected!=null&&changedRepBand?.25:.1));
    // Week eight offers an updated weight for every base exercise with
    // comparable history. A stale prescribed seed is not a reason to hide it.
    if(weekEight&&compound&&projected!=null&&ids.length)anomalous=false;
    let raw=anomalous?seed:(projected??prior??seed??0),
      reason = "Недостаточно сопоставимой истории: текущий вес сохранён",
      action = projected!=null&&!anomalous&&Math.abs(projected-prior)>=p.step/2?"range_adjust":"hold";
    const effortKnown = recent.filter((x) => effort(x) != null).length;
    const strong=groups.length>=2&&groups.every(g=>g.length>0&&g.every(x=>effort(x)!=null&&effort(x)<=target)&&g.filter(x=>number(x.set.actualReps??x.set.r)>=range.hi).length/g.length>=.75);
    const weak =
      latest.length > 0 &&
      latest.every(x=>number(x.set.actualReps??x.set.r)<range.lo&&effort(x)!=null&&effort(x)>target);
    if(strong&&projected!=null&&projected<=prior+p.step/2&&!anomalous){projected=null;raw=prior;action="hold"}
    if(ids.length){
      reason=anomalous?`План ${seed} кг далеко от ${projected!=null?`оценки для нового диапазона ${Number(projected.toFixed(1))}`:`прошлой рабочей нагрузки ${prior}`} кг: нужна ручная проверка`:projected!=null?`Последний лучший сет ${prior} кг × ${oldReps} при RPE ${oldRpe}; его 1ПМ ≈ ${Number(latestOneRepMax.toFixed(1))} кг. Оценка по ${sessionMaxes.length} тренировкам ≈ ${Number(stableOneRepMax.toFixed(1))} кг; для ${range.lo}–${range.hi} повторений при RPE ${targetMin}–${target} ориентир ${Number(projected.toFixed(1))} кг${weeklyApplied?` с учётом недели ${Number((band.lo*100).toFixed(1))}–${Number((band.hi*100).toFixed(1))}%`:""}`:"Сохранить вес последнего тяжёлого рабочего сета";
      if(fatigueLimited&&!anomalous)reason+=`. Последний из ${lastWorking.length} подходов вышел за целевой диапазон: уменьшить вес на один шаг`;
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
      session.deload === true ||
      (number(session.programWeekIntensityMax) > 0 &&
        number(session.programWeekIntensityMax) <= 70);
    if (
      prior != null &&
      deload && !anomalous &&
      !["bodyweight_only", "repetitions_only"].includes(p.loadType)
    ) {
      raw = weeklyRaw!=null ? weeklyRaw :
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
    if (ids.length === 3 && action === "hold" && !anomalous) {
      const scores = ids.map((id) => {
        const a = recent.filter((x) => x.session.id === id);
        return [
          median(a.map((x) => number(x.set.w) || 0)),
          median(a.map((x) => number(x.set.actualReps ?? x.set.r) || 0)),
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
      lastToday && method(e,set)==="STANDARD" && !testAttempt && setRole(e,set)!=="backoff" &&
      !["time", "distance", "bodyweight_only", "repetitions_only"].includes(
        p.loadType,
      )
    ) {
      const used = number(lastToday.set.w);
      if (used != null) nextSetSuggestion=setDecision(e,lastToday.set,session,p,set);
    }

    let testWeekSuggestion=false;
    const backoff=compound&&setRole(e,set)==="backoff";
    if(backoff){
      const completedTest=currentRows.filter(x=>setRole(x.exercise,x.set)==="test_attempt");
      const best=completedTest.length?Math.max(...completedTest.map(x=>number(x.set.w)||0)):0;
      if(best>0&&!bodyLoad){
        const fraction=number(set.backoffPercent)!=null?Math.max(.1,Math.min(1,number(set.backoffPercent)/100)):/70%/.test(String(e.n||""))?.70:.72;
        const repCap=stableOneRepMax>0?fromEstimateLoad(stableOneRepMax/(1+(targetReps+10-(targetMin+target)/2)/30),e,session,reg):null;
        const suggested=roundWeight(Math.min(best*fraction,repCap??Infinity),p,"down");
        if(suggested>0){
          raw=suggested;projected=suggested;anomalous=false;nextSetSuggestion=null;testWeekSuggestion=true;
          action="backoff";reason=`Back-off: ${Math.round(fraction*100)}% от лучшей выполненной тестовой попытки ${best} кг, с учётом шага ${p.step} кг`;
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
        const factor=range.lo>=5?.85:range.lo>=2?.925:attempt===1?.90:attempt===2?.95:attempt>=3?.985:.925;
        let suggested=roundWeight(fromEstimateLoad(referenceMax*factor,e,session,reg),p,"down");
        if(previousTest){
          const used=number(previousTest.set.w),felt=effortRpe(previousTest.set);
          if(used>0){
            if((felt!=null&&felt>=9.5)||todayReps===0)suggested=Math.min(suggested,used);
            else {
              const increments=felt==null?1:felt<=7?3:felt<=8?2:1;
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
    if(testAttempt&&currentRows.some(x=>setRole(x.exercise,x.set)==='test_attempt'&&number(x.set.actualReps??x.set.r)===0))action='stop';
    if(action==='stop')reason='Тест завершён: предыдущая попытка достигла RPE 9,5–10. Перейди к back-off';
    const methodRec=methodPrescription(e,set,session,allHistory,reg,p,strength);
    if(methodRec) {
      raw=methodRec.weight;projected=methodRec.raw;anomalous=false;
      reason=methodRec.reason;action='method';
      for(const id of methodRec.sessionIds)if(!ids.includes(id))ids.push(id);
      if(methodRec.live)nextSetSuggestion={weight:methodRec.weight,action:'method',reason:methodRec.reason};
    }
    const wellbeingFactor=session.trainingReadinessDone&&session.readinessAdjusted
      ?Math.min(1,Math.max(.85,number(session.readiness?.factor)??1)):1;
    const hasActual=(session.ex||[]).some(ex=>(ex.set||[]).some(s=>complete(ex,s,reg)&&loadComparable(e,ex,reg,set,s)));
    const wellbeingApplied=wellbeingFactor<1&&!hasActual&&!anomalous&&raw>0;
    if(wellbeingApplied){
      const effective=loadForEstimate(e,{w:raw},session,reg);
      const adjusted=effective!=null?fromEstimateLoad(effective*wellbeingFactor,e,session,reg):null;
      if(adjusted!=null){raw=roundWeight(adjusted,p,p.loadType==='bodyweight_assisted'?'up':'down');reason+='; учтено самочувствие перед первым подходом'}
    }
    const conflict=weeklyCorridor && !weeklyApplied && !testWeekSuggestion && !methodRec &&
      (raw<Math.min(weeklyCorridor.min,weeklyCorridor.max)-p.step||raw>Math.max(weeklyCorridor.min,weeklyCorridor.max)+p.step)
      ? 'Процент недели расходится с повторами и целевым усилием; вес подобран по повторам и RPE/RIR' : null;
    if(conflict)reason+=`. ${conflict}`;
    const weight=(ids.length||testWeekSuggestion)&&!anomalous?roundWeight(raw,p,ids.length===1&&projected==null?"down":undefined):raw,
      confidence =
        anomalous?"низкая":ids.length >= 3 && effortKnown === recent.length
          ? projected!=null?"средняя":"высокая"
          : ids.length >= 2 && effortKnown
            ? "средняя"
            : latestOneRepMax!=null?"средняя":"низкая";
    return {
      weight,
      raw,
      previous: prior,
      basis:ids.length?{date:sessionDate(latest[0]?.session??strength.source?.session),weight:prior??number(strength.source?.set.w),planned:seed||null,estimatedOneRepMax:latestOneRepMax!=null?Number(latestOneRepMax.toFixed(1)):null,sets:latest.map(x=>({weight:number(x.set.w),reps:number(x.set.actualReps??x.set.r),rpe:effort(x)}))}:null,
      delta: prior == null ? 0 : Number((weight - prior).toFixed(6)),
      step: p.step,
      action,
      planPreserved: anomalous,
      testWeekSuggestion,
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
      strength: {estimate:strength.estimate==null?null:Number(strength.estimate.toFixed(1)),confirmed:strength.confirmed,
        confidenceLow:strength.confidenceLow,confidenceHigh:strength.confidenceHigh,confidence:strength.confidence,sources:strength.points.slice(0,12).map(x=>({date:sessionDate(x.session),method:method(x.exercise,x.set),role:setRole(x.exercise,x.set),weight:number(x.set.w),reps:number(x.set.actualReps??x.set.r),rpe:effortRpe(x.set)}))},
      methodStage:methodRec?.role??setRole(e,set),
      targetEffort:effortBand,
      conflict,
      exerciseKind:compound?"base":"isolation",
      equipmentId:String(e?.equipmentProfileId||e?.equipmentProfile?.id||""),
      equipmentName:String(e?.equipmentProfile?.name||""),
    };
  }
  function applyAuto(set, result) {
    if (set.ok || set.manualOverride || set.weightSource === "manual" || result.action === "stop")
      return false;
    set.w = result.weight;
    set.weightSource = "auto";
    return true;
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
    strengthEstimate,
    setDecision,
    effortTarget,
    recommend,
    applyAuto,
    summary,
    migrate,
  };
});
