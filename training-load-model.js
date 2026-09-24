"use strict";
(() => {
  const W = window,
    A = WorkoutDomain;
  let running = false;
  let cloudHistory = { userId: null, sessions: [], loadedAt: 0 };
  let historyRequest = null;
  const completedCount = (session) => (session?.ex || []).reduce(
    (total, ex) => total + (ex.set || []).filter((set) => set?.ok === true).length, 0,
  );
  function recommendationHistory() {
    const userId = W.cloud?.user?.id;
    const local = Array.isArray(st.sessions) ? st.sessions : [];
    if (!userId || cloudHistory.userId !== userId) return local;
    const deleted = new Set((st.deletedSessionIds || []).map(String));
    const byId = new Map();
    for (const session of cloudHistory.sessions) {
      if (session?.id != null && !deleted.has(String(session.id))) byId.set(String(session.id), session);
    }
    for (const session of local) {
      if (!session?.id || deleted.has(String(session.id))) continue;
      const previous = byId.get(String(session.id));
      if (!previous || (session.userId === userId || !session.userId) && completedCount(session) > completedCount(previous))
        byId.set(String(session.id), session);
    }
    return [...byId.values()];
  }
  async function refreshOwnedHistory(force = false) {
    const userId = W.cloud?.user?.id, client = W.cloud?.client;
    if (!userId || !client) return;
    if (historyRequest) return historyRequest;
    if (!force && cloudHistory.userId === userId && Date.now() - cloudHistory.loadedAt < 60000) return;
    historyRequest = (async () => {
      const rows = [], pageSize = 500;
      for (let offset = 0; offset < 2500; offset += pageSize) {
        const response = await client.from('workouts').select('payload,external_id')
          .eq('user_id', userId).order('id', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (response.error) throw response.error;
        rows.push(...(response.data || []));
        if ((response.data || []).length < pageSize) break;
      }
      if (W.cloud?.user?.id !== userId) return;
      cloudHistory = {
        userId,
        loadedAt: Date.now(),
        // The query is scoped to the authenticated owner. An old payload may
        // have a stale userId from a migration, even though the cloud row is
        // owned by this account.
        sessions: rows.map(row => row.payload && {
          ...row.payload, id: row.payload.id || row.external_id,
          userId, pendingCompletion: false,
        }).filter(Boolean),
      };
      run();
    })().catch(error => { console.warn('Recommendation history', error); })
      .finally(() => { historyRequest = null; });
    return historyRequest;
  }
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
            recommendationHistory(),
            workoutRegistry,
            st.exerciseWeightProfiles || {},
          );
          const suggested=rec.nextSetSuggestion?.weight??rec.weight;
          if (JSON.stringify(set.recommendation) !== JSON.stringify(rec) || set.recommendedW !== suggested) {
            set.recommendation = rec;
            set.recommendedW = suggested;
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
            A.applyAuto(set, {...rec,weight:suggested});
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
      if (changed) {
        save({ draftOnly: true });
        W.trainingEngine200Tick?.();
      }
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
    "unvrsl:history-updated",
    "unvrsl:prescription-updated",
  ].forEach((name) => W.addEventListener(name, () => {
    run();
    if (name === 'unvrsl:cloud-ready' || name === 'unvrsl:history-updated')
      refreshOwnedHistory(name === 'unvrsl:history-updated');
  }));
  // A restored workout can already contain yesterday's recommendation. The
  // engine's initial ready event may have fired before this module loaded.
  Promise.resolve().then(() => { run(); refreshOwnedHistory(); });
})();
