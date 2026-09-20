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
            !set.manualOverride &&
            set.weightSource !== "manual"
          ) {
            const before = set.w;
            A.applyAuto(set, rec);
            set.plannedW = set.w;
            changed = changed || before !== set.w;
          }
          ex.trainingProgression292 = {
            actualEffort: true,
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
  const readinessWeight = (v, ex, cur) =>
    A.roundWeight(
      v,
      A.profile(ex, workoutRegistry, st.exerciseWeightProfiles || {}),
    );
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
