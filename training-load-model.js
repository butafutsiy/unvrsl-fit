"use strict";
(() => {
  const W = window,
    A = WorkoutDomain;
  let running = false;
  function run() {
    if (running) return false;
    const cur = st.current;
    if (!cur || cur.pendingCompletion) return false;
    running = true;
    let changed = false;
    try {
      for (const ex of cur.ex || []) {
        if (["time","distance"].includes(A.loadType(ex,workoutRegistry))) {
          for (const set of ex.set || []) {
            if (set.recommendation || set.recommendedW != null) changed = true;
            delete set.recommendation; delete set.recommendedW;
          }
          continue;
        }
        const row = workoutRegistry.resolve(ex);
        if (row) {
          ex.exerciseId = row.id;
          ex.loadType = ex.loadType || row.loadType;
          ex.implementCount = ex.implementCount || row.implementCount;
        }
        for (const set of ex.set || []) {
          if (set.ok) continue;
          const rec = A.recommend(
            ex,
            set,
            cur,
            st.sessions,
            workoutRegistry,
            st.exerciseWeightProfiles || {},
          );
          if (JSON.stringify(set.recommendation) !== JSON.stringify(rec)) {
            set.recommendation = rec;
            set.recommendedW = rec.weight;
            set.trainingIntensity292 = { owner: "workout-domain" };
            changed = true;
          }
          if (
            ex.programWeightMode === "adaptive" &&
            rec.sessionIds.length>0 &&
            !rec.planPreserved &&
            !set.manualOverride &&
            set.weightSource !== "manual"
          ) {
            const before = set.w;
            A.applyAuto(set, rec);
            set.plannedW = set.w;
            changed = changed || before !== set.w;
          }
          ex.trainingProgression292 = {
            actualEffort: rec.sessionIds.length>0,
            action: rec.action,
            reason: rec.reason,
          };
          ex.weightDecision =
            ex.programWeightMode === "adaptive"
              ? "adaptive_auto"
              : ex.weightDecision;
        }
      }
      cur.trainingLoadModelRevision = 292;
      cur.trainingMathOwner = "workout-domain";
      if (changed) save({ draftOnly: true });
      return changed;
    } finally {
      running = false;
    }
  }
  const readinessWeight = (v, ex, cur) => {
    const factor = cur?.trainingReadinessDone && cur?.readinessAdjusted
      ? (A.number(cur?.readiness?.factor) || 1)
      : 1;
    return A.roundWeight(
      (A.number(v) || 0) * Math.min(1, Math.max(.85, factor)),
      A.profile(ex, workoutRegistry, st.exerciseWeightProfiles || {}),
      factor < 1 ? "down" : undefined,
    );
  };
  const api = { run, readinessWeight, version: 392 };
  W.trainingLoadModel292 = api;
  W.trainingLoadModel258 = api;
  W.unvrslTrainingReadinessWeightV292 = readinessWeight;
  W.__unvrslCanonicalRecommendationOwner = "workout-domain";
  W.__unvrslRecommendationMathOwner = "workout-domain";
  [
    "unvrsl:workout-set-changed",
    "unvrsl:training-engine-ready",
    "unvrsl:readiness-ready",
    "unvrsl:cloud-ready",
  ].forEach((name) => W.addEventListener(name, () => run()));
})();
