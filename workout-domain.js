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
    if (types.has(e?.loadType)) return e.loadType;
    const row = reg?.resolve(e);
    if (types.has(row?.loadType)) return row.loadType;
    const n = norm(e?.n),
      eq = e?.eq || e?.equipment;
    if (e?.mode === "timer" || e?.mode === "cardio" || e?.kind === "cardio")
      return "time";
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
    const defaults = {
      step:
        eq === "dumbbell"
          ? 2
          : ["cable", "leverage machine", "sled machine"].includes(eq)
            ? 5
            : 2.5,
      min: 0,
      maxChangeSteps: 1,
      rounding: "nearest",
      units: type,
    };
    return {
      ...defaults,
      ...row?.weightProfile,
      ...e?.weightProfile,
      ...overrides[reg?.identity(e)],
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
    return (
      reg.identity(a) === reg.identity(b) &&
      loadType(a, reg) === loadType(b, reg) &&
      method(a, sa) === method(b, sb) &&
      phase(a, sa) === phase(b, sb) &&
      String(a.tempo || "") === String(b.tempo || "") &&
      String(a.machineId || "") === String(b.machineId || "") &&
      String(a.implementCount ?? reg.resolve(a)?.implementCount ?? "") ===
        String(b.implementCount ?? reg.resolve(b)?.implementCount ?? "") &&
      String(a.loadedSides ?? "") === String(b.loadedSides ?? "") &&
      String(a.implementWeight ?? "") === String(b.implementWeight ?? "")
    );
  }
  function history(e, sessions, reg, { userId, excludeId, before } = {}) {
    const out = [],
      seen = new Set();
    for (const session of [...sessions].sort(
      (a, b) =>
        (b.started || Date.parse(b.date) || 0) -
        (a.started || Date.parse(a.date) || 0),
    )) {
      if (
        before != null &&
        (session.started || Date.parse(session.date) || 0) >= before
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
        if (reg.identity(ex) !== reg.identity(e)) continue;
        for (const set of ex.set || [])
          if (complete(ex, set, reg)) out.push({ exercise: ex, set, session });
      }
    }
    return out;
  }
  function repRange(e, s = {}) {
    const raw = String(s.targetRepLabel || e.reps || e.r || s.r || "").match(
      /^(\d+)\s*[–—-]\s*(\d+)$/,
    );
    const lo =
        number(s.targetRepMin ?? s.rMin ?? e.repMin) ??
        (raw ? +raw[1] : number(s.r)) ??
        8,
      hi = number(s.targetRepMax ?? s.rMax ?? e.repMax) ?? (raw ? +raw[2] : lo);
    return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
  }
  const median = (a) => {
    if (!a.length) return null;
    const b = [...a].sort((a, b) => a - b),
      i = Math.floor(b.length / 2);
    return b.length % 2 ? b[i] : (b[i - 1] + b[i]) / 2;
  };
  function recommend(e, set, session, sessions, reg, overrides = {}) {
    const p = profile(e, reg, overrides),
      range = repRange(e, set),
      rows = history(e, sessions, reg, {
        userId: session.userId,
        excludeId: session.id,
      }).filter((x) => comparable(e, x.exercise, reg, set, x.set));
    const ids = [...new Set(rows.map((x) => x.session.id))].slice(0, 3),
      recent = rows.filter((x) => ids.includes(x.session.id));
    const latest = recent.filter((x) => x.session.id === ids[0]);
    const prior = median(
      latest.map((x) => number(x.set.w)).filter((x) => x != null),
    );
    let raw =
        ids.length >= 2
          ? (prior ?? number(set.w) ?? 0)
          : (number(set.w) ?? prior ?? 0),
      reason = "Недостаточно сопоставимой истории: текущий вес сохранён",
      action = "hold";
    const target =
      number(set.targetRpeMax ?? e.targetRpeMax ?? session.target) ?? 8;
    const groups = ids
      .slice(0, 2)
      .map((id) => recent.filter((x) => x.session.id === id));
    const effort = (x) =>
      number(x.set.actualRpe ?? x.set.rpe) ??
      (number(x.set.actualRir ?? x.set.rir) == null
        ? null
        : 10 - number(x.set.actualRir ?? x.set.rir));
    const effortKnown = recent.filter((x) => effort(x) != null).length;
    const strong =
      groups.length >= 2 &&
      groups.every((g) =>
        g.every(
          (x) =>
            number(x.set.actualReps ?? x.set.r) >= range.hi &&
            (effort(x) == null || effort(x) < target),
        ),
      );
    const weak =
      latest.length > 0 &&
      latest.every(
        (x) =>
          number(x.set.actualReps ?? x.set.r) < range.lo ||
          (effort(x) != null && effort(x) > target + 1),
      );
    if (ids.length >= 2) {
      reason = "Повторы в целевом диапазоне: сохранить вес";
      if (strong) {
        action = "up";
        reason =
          "В двух последних тренировках достигнута верхняя граница повторений";
        raw = p.available?.length
          ? moveWeight(raw, p.loadType === "bodyweight_assisted" ? -1 : 1, p)
          : raw + (p.loadType === "bodyweight_assisted" ? -1 : 1) * p.step;
      } else if (weak) {
        action = "down";
        reason =
          "Последние рабочие подходы ниже диапазона или тяжелее целевого RPE";
        raw = p.available?.length
          ? moveWeight(raw, p.loadType === "bodyweight_assisted" ? 1 : -1, p)
          : raw + (p.loadType === "bodyweight_assisted" ? 1 : -1) * p.step;
      }
    }
    if (p.loadType === "bodyweight_only" || p.loadType === "repetitions_only") {
      raw = 0;
      action = "reps";
      reason = strong
        ? "Верх диапазона достигнут: можно выбрать вариант с дополнительным весом"
        : "Сначала увеличивай повторы в заданном диапазоне";
    }
    const f = number(session.readiness?.factor) ?? 1;
    const deload =
      session.deload === true ||
      (number(session.programWeekIntensityMax) > 0 &&
        number(session.programWeekIntensityMax) <= 67);
    if (
      prior != null &&
      (f < 1 || deload) &&
      !["bodyweight_only", "repetitions_only"].includes(p.loadType)
    ) {
      raw =
        p.loadType === "bodyweight_assisted"
          ? prior + p.step
          : prior * Math.max(0.8, Math.min(f, deload ? 0.9 : 1));
      reason = deload ? "Разгрузочная неделя" : "Снижение по самочувствию";
      action = "down";
    }
    if (ids.length >= 2 && prior != null && !deload && f >= 1) {
      const cap = p.step * (p.maxChangeSteps || 1);
      raw = Math.min(prior + cap, Math.max(0, prior - cap, raw));
    }
    let trend =
      ids.length < 2
        ? "insufficient"
        : strong
          ? "progress"
          : weak
            ? "regress"
            : "stable";
    if (ids.length === 3 && action === "hold") {
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
    let nextSet = false;
    if (
      lastToday &&
      !["time", "distance", "bodyweight_only", "repetitions_only"].includes(
        p.loadType,
      )
    ) {
      const used = number(lastToday.set.w);
      if (used != null) {
        nextSet = true;
        const hard =
          number(lastToday.set.actualReps ?? lastToday.set.r) < range.lo ||
          (effort(lastToday) != null && effort(lastToday) > target + 1);
        raw = hard
          ? used + (p.loadType === "bodyweight_assisted" ? 1 : -1) * p.step
          : used;
        raw = Math.max(0, raw);
        action = hard ? "down" : "hold";
        reason = hard
          ? "Последний подход сегодня был тяжелее цели: снизить нагрузку на один шаг"
          : "Для следующего подхода сохранить фактически использованную нагрузку";
      }
    }
    const weight = ids.length >= 2 || nextSet ? roundWeight(raw, p) : raw,
      confidence =
        ids.length >= 3 && effortKnown === recent.length
          ? "высокая"
          : ids.length >= 2 && effortKnown
            ? "средняя"
            : "низкая";
    return {
      weight,
      raw,
      previous: prior,
      delta: prior == null ? 0 : Number((weight - prior).toFixed(6)),
      step: p.step,
      action,
      trend,
      reason,
      confidence,
      sessionIds: ids,
      evidence: [
        ...latest.map((x) => setLabel(x.exercise, x.set, reg)),
        ...(lastToday
          ? ["Сегодня: " + setLabel(lastToday.exercise, lastToday.set, reg)]
          : []),
      ],
      rounding:
        ids.length >= 2 || nextSet
          ? `Расчётное значение: ${Number(raw.toFixed(2))} кг. Рекомендация округлена до ${weight} кг с учётом шага ${p.step} кг`
          : "Исходный вес сохранён без округления: истории пока недостаточно",
      repRange: range,
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
    history,
    repRange,
    recommend,
    applyAuto,
    summary,
    migrate,
  };
});
