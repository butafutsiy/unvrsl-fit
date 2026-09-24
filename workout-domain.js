"use strict";
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkoutDomain = api;
})(typeof window === "undefined" ? null : window, () => {
  const SCHEMA_VERSION = 4;
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
    /warmup|warm-up|размин/i.test(String(s.type || s.kind || s.role || ""));
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
    s?.ok === true && !warmup(s) && validSet(e, s, reg);
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
      const sides = number(e.loadedSides),
        base = number(e.implementWeight);
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
      method(e, s) !== "STANDARD" ||
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
    return w > 0 ? Math.round(w * (r === 1 ? 1 : 1 + r / 30) * 10) / 10 : null;
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
  function comparable(a, b, reg, sa = {}, sb = {}) {
    const equipmentA=String(sa?.equipmentProfileId||a?.equipmentProfileId||a?.equipmentProfile?.id||a?.machineId||"");
    const equipmentB=String(sb?.equipmentProfileId||b?.equipmentProfileId||b?.equipmentProfile?.id||b?.machineId||"");
    const typeA=loadType(a,reg),typeB=loadType(b,reg);
    const sameExercise=reg.identity(a)===reg.identity(b)||(
      norm(a?.n||a?.name)&&norm(a?.n||a?.name)===norm(b?.n||b?.name)
    );
    return (
      sameExercise &&
      typeA === typeB &&
      method(a, sa) === method(b, sb) &&
      phase(a, sa) === phase(b, sb) &&
      equipmentA === equipmentB &&
      (typeA!=="per_dumbbell"||String(a.implementCount??reg.resolve(a)?.implementCount??2)===String(b.implementCount??reg.resolve(b)?.implementCount??2)) &&
      (typeA!=="per_side"||(
        String(a.loadedSides??a.equipmentProfile?.loadedSides??2)===String(b.loadedSides??b.equipmentProfile?.loadedSides??2) &&
        String(a.implementWeight??a.equipmentProfile?.implementWeight??0)===String(b.implementWeight??b.equipmentProfile?.implementWeight??0)
      ))
    );
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
        !session.ended ||
        session.pendingCompletion ||
        (excludeId != null && String(session.id) === String(excludeId)) ||
        seen.has(session.id ? String(session.id) : session)
      )
        continue;
      if (userId && session.userId && session.userId !== userId) continue;
      seen.add(session.id ? String(session.id) : session);
      for (const ex of session.ex || []) {
        if (reg.identity(ex) !== reg.identity(e) && norm(ex?.n||ex?.name)!==norm(e?.n||e?.name)) continue;
        for (const set of ex.set || [])
          if (complete(ex, set, reg)) out.push({ exercise: ex, set, session });
      }
    }
    return out;
  }
  function repRange(e, s = {}) {
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
    if (rpe != null) return rpe;
    const rir = number(s?.actualRir ?? s?.rir);
    return rir == null ? null : 10 - rir;
  }
  function estimateMaxFromSet(s) {
    const weight = number(s?.w ?? s?.weight), reps = number(s?.actualReps ?? s?.r), rpe = effortRpe(s);
    if (!(weight > 0) || !(reps >= 1 && reps <= 12) || !(rpe >= 6 && rpe <= 10)) return null;
    return weight * (1 + (reps + 10 - rpe) / 30);
  }
  function intensityBand(session) {
    if (session?.programWeekUseIntensity === false) return null;
    let lo = number(session?.programWeekIntensityMin), hi = number(session?.programWeekIntensityMax);
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
      }),
      rows=allHistory.filter((x) => comparable(e, x.exercise, reg, set, x.set));
    const ids = [...new Set(rows.map((x) => x.session.id))].slice(0, 5),
      recent = rows.filter((x) => ids.includes(x.session.id));
    const latest = recent.filter((x) => x.session.id === ids[0]);
    const excludedHistory=allHistory
      .find(x=>sessionTime(x.session)>sessionTime(latest[0]?.session)&&!comparable(e,x.exercise,reg,set,x.set));
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
    const targetMin=number(set.targetRpeMin??e.targetRpeMin??session.programWeekRpeMin)??number(set.targetRpeMax??e.targetRpeMax??session.target)??7;
    const target=number(set.targetRpeMax??e.targetRpeMax??session.programWeekRpeMax)??number(session.target)??8;
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
    const sessionMaxes=ids.map(id=>{
      const values=recent.filter(x=>x.session.id===id).map(x=>{
        const effective=bodyLoad?effectiveLoad(x.exercise,x.set,x.session,reg):number(x.set.w);
        return estimateMaxFromSet({...x.set,w:effective});
      }).filter(x=>x>0);
      return values.length?Math.max(...values):null;
    }).filter(x=>x>0).slice(0,3);
    const latestOneRepMax=sessionMaxes[0]??null;
    const stableOneRepMax=compound&&method(e,set)==="STANDARD"&&sessionMaxes.length?
      sessionMaxes.length===1?sessionMaxes[0]:
      sessionMaxes.length===2?sessionMaxes[0]*.8+sessionMaxes[1]*.2:
      sessionMaxes[0]*.7+sessionMaxes[1]*.2+sessionMaxes[2]*.1:null;
    const estimatedOneRepMax=eligible?stableOneRepMax:null;
    const projectedEffective=estimatedOneRepMax==null?null:estimatedOneRepMax/(1+(targetReps+10-(targetMin+target)/2)/30);
    const effectivePrior=bodyLoad?latestBodyWeight+(p.loadType==="bodyweight_assisted"?-prior:prior):prior;
    const projectedRaw=projectedEffective==null?null:bodyLoad?
      p.loadType==="bodyweight_assisted"?Math.max(0,currentBodyWeight-projectedEffective):Math.max(0,projectedEffective-currentBodyWeight):projectedEffective;
    let projected=projectedEffective!=null&&projectedEffective>=effectivePrior*.72&&projectedEffective<=effectivePrior*1.32?projectedRaw:null;
    // When reps and effort have not changed, increase at most two implement
    // increments. A genuine change from 12 reps to 6 can require a larger jump.
    if(projected!=null&&Math.abs(oldReps-targetReps)<2)
      projected=Math.max(prior-2*p.step,Math.min(prior+2*p.step,projected));
    // A set already inside both target bands is evidence that the current
    // implement load works. A hard top set cannot justify a heavier one.
    if(projected!=null&&oldReps>=range.lo&&oldReps<=range.hi&&oldRpe>=targetMin&&oldRpe<=target)
      projected=p.loadType==="bodyweight_assisted"?Math.min(prior,projected):Math.max(prior,projected);
    if(projected!=null&&oldRpe>target)projected=p.loadType==="bodyweight_assisted"?Math.max(prior,projected):Math.min(prior,projected);
    const lastWorking=latest.filter(x=>number(x.set.w)===prior);
    const lastSet=lastWorking.at(-1);
    const fatigueLimited=projected!=null&&lastWorking.length>=2&&oldReps>=range.lo&&oldReps<=range.hi&&lastSet&&(
      number(lastSet.set.actualReps??lastSet.set.r)<range.lo||effort(lastSet)>target
    );
    if(fatigueLimited)projected=p.loadType==="bodyweight_assisted"?Math.max(prior+p.step,projected):Math.min(prior-p.step,projected);
    const band=intensityBand(session),weekMid=band?((band.lo+band.hi)/2):null;
    const weeklyRaw=!bodyLoad&&stableOneRepMax!=null&&weekMid!=null?stableOneRepMax*weekMid:null;
    const weeklyCorridor=!bodyLoad&&stableOneRepMax!=null&&band?{min:stableOneRepMax*band.lo,max:stableOneRepMax*band.hi}:null;
    let weeklyApplied=false;
    if(compound&&weeklyRaw!=null&&projected==null&&seed===0&&prior>0&&!explicitRange){
      projected=weeklyRaw;weeklyApplied=true;
    }else if(projected!=null&&weeklyCorridor&&projected>=weeklyCorridor.min-p.step&&projected<=weeklyCorridor.max+p.step){
      projected=(projected+weeklyRaw)/2;weeklyApplied=true;
    }
    const reference=projected??prior;
    const changedRepBand=Math.abs(oldReps-targetReps)>=2;
    const anomalous=seed>0&&reference>0&&Math.abs(seed-reference)>Math.max(2*p.step,seed*(projected!=null&&changedRepBand?.25:.1));
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
      raw =
        p.loadType === "bodyweight_assisted"
          ? prior + p.step
          : (projected??prior) * 0.925;
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
          if (complete(ex, s, reg) && comparable(e, ex, reg, set, s))
            currentRows.push({ exercise: ex, set: s });
        }
        if (stop) break;
      }
    }
    const lastToday = currentRows.at(-1);
    let nextSetSuggestion=null;
    if (
      lastToday && method(e,set)==="STANDARD" &&
      !["time", "distance", "bodyweight_only", "repetitions_only"].includes(
        p.loadType,
      )
    ) {
      const used = number(lastToday.set.w);
      if (used != null&&effort(lastToday)!=null) {
        const hard =
          number(lastToday.set.actualReps ?? lastToday.set.r) < range.lo ||
          effort(lastToday)>target;
        const easy=number(lastToday.set.actualReps??lastToday.set.r)>=range.hi&&effort(lastToday)<targetMin;
        const prev=currentRows.at(-2),confirmedEasy=easy&&prev&&number(prev.set.actualReps??prev.set.r)>=range.hi&&effort(prev)!=null&&effort(prev)<targetMin;
        const direction=hard?(p.loadType==="bodyweight_assisted"?1:-1):confirmedEasy?(p.loadType==="bodyweight_assisted"?-1:1):0;
        nextSetSuggestion={weight:direction?moveWeight(used,direction,p):used,action:hard?"down":confirmedEasy?"up":"hold",reason:hard?"Ниже диапазона или тяжелее целевого RPE":confirmedEasy?"Два подхода подряд легче цели":"Подход в целевом диапазоне"};
      }
    }
    const weight=ids.length&&!anomalous?roundWeight(raw,p,ids.length===1&&projected==null?"down":undefined):raw,
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
      basis:ids.length?{date:sessionDate(latest[0]?.session),weight:prior,planned:seed||null,estimatedOneRepMax:latestOneRepMax!=null?Number(latestOneRepMax.toFixed(1)):null,sets:latest.map(x=>({weight:number(x.set.w),reps:number(x.set.actualReps??x.set.r),rpe:effort(x)}))}:null,
      delta: prior == null ? 0 : Number((weight - prior).toFixed(6)),
      step: p.step,
      action,
      planPreserved: anomalous,
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
      exerciseKind:compound?"base":"isolation",
      equipmentId:String(e?.equipmentProfileId||e?.equipmentProfile?.id||""),
      equipmentName:String(e?.equipmentProfile?.name||""),
    };
  }
  function applyAuto(set, result) {
    if (set.ok || set.manualOverride || set.weightSource === "manual")
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
      seen = new Set();
    for (const session of [...sessions].sort(
      (a, b) =>
        (a.started || Date.parse(a.date) || 0) -
        (b.started || Date.parse(b.date) || 0),
    )) {
      if (!session.ended || session.pendingCompletion || seen.has(session.id))
        continue;
      seen.add(session.id);
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
    recommend,
    applyAuto,
    summary,
    migrate,
  };
});
