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
    if (!userId || cloudHistory.userId !== userId) {
      const base=W.unvrslCalibrationLibrary?.sessions(st,local,st.current,userId)||local;
      return A.recommendationSessions(base,st.current);
    }
    const deleted = new Set((st.deletedSessionIds || []).map(String));
    const byId = new Map();
    for (const session of cloudHistory.sessions) {
      if (session?.id != null && !deleted.has(String(session.id))) byId.set(String(session.id), session);
    }
    for (const session of local) {
      if (!session?.id || deleted.has(String(session.id))) continue;
      const previous = byId.get(String(session.id));
      if (!previous || (session.userId === userId || !session.userId) && completedCount(session) >= completedCount(previous))
        byId.set(String(session.id), session);
    }
    const base=W.unvrslCalibrationLibrary?.sessions(st,[...byId.values()],st.current,userId)||[...byId.values()];
    return A.recommendationSessions(base,st.current);
  }
  async function refreshOwnedHistory(force = false) {
    const userId = W.cloud?.user?.id, client = W.cloud?.client;
    if (!userId || !client) return;
    if (historyRequest) return historyRequest;
    if (!force && cloudHistory.userId === userId && Date.now() - cloudHistory.loadedAt < 60000) return;
    historyRequest = (async () => {
      const rows = [], pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        if(W.cloud?.user?.id!==userId)return;
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
      schedule();
    })().catch(error => { console.warn('Recommendation history', error); })
      .finally(() => { historyRequest = null; });
    return historyRequest;
  }
  function* calculate(options = {}) {
    const cur = st.current;
    if (!cur || cur.pendingCompletion) return false;
    let changed = false, weightsChanged = false;
    let scope = Array.isArray(options?.exerciseIndices) ? new Set(options.exerciseIndices) : null;
    {
      // Build the scoped history once for the entire calculation, not twice
      // for every individual set. Repeated large JSON/history scans can lock
      // the iPhone main thread before the workout becomes interactive.
      const sessionHistory = recommendationHistory();
      const eligibleHistory = sessionHistory.filter(x=>
        !A.isRecoveryForAutoweight(x)&&!x.isLoadCalibration&&
        x.id!==cur.id&&!x.pendingCompletion&&
        (!cur.userId||!x.userId||x.userId===cur.userId)&&
        (!cur.date||!x.date||x.date<=cur.date)
      ).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      changed=A.repairLegacyEffortTargets(cur)||changed;
      changed=A.prepareTestBlocks(cur,workoutRegistry)||changed;
      if(changed)scope=null;
      W.equipmentAttachDefaults405?.(cur);
      W.trainingInitializeSetWeights?.(cur);
      for (const [exerciseIndex, ex] of (cur.ex || []).entries()) {
        if(scope&&!scope.has(exerciseIndex))continue;
        const fatigueCache=new Map();
        if (["time","distance"].includes(A.loadType(ex,workoutRegistry))) {
          for (const set of ex.set || []) {
            if (set.recommendation || set.recommendedW != null) changed = true;
            delete set.recommendation; delete set.recommendedW;
          }
          continue;
        }
        const row = workoutRegistry.resolve(ex);
        if (row) {
          ex.exerciseId = ex.exerciseId || row.id;
          ex.loadType = ex.loadType || row.loadType;
          ex.implementCount = ex.implementCount || row.implementCount;
        }
        for (const set of ex.set || []) {
          if(st.current!==cur||cur.ended||cur.pendingCompletion)return false;
          if (set.ok || set.skipped) continue;
          const rec = A.recommend(
            ex,
            set,
            cur,
            sessionHistory,
            workoutRegistry,
            st.exerciseWeightProfiles || {},
          );
          // This evidence is identical for sets with the same load context.
          // Keep the cache inside this calculation, never across user edits.
          const fatigueKey=JSON.stringify([A.method(ex,set),set.equipmentProfileId,set.equipmentSnapshot,set.loadUnit,set.loadType,set.techniqueId,set.setRole,set.role]);
          if(!fatigueCache.has(fatigueKey)){
            const observations=eligibleHistory.flatMap(old=>{
              const match=(old.ex||[]).find(x=>A.loadComparable(ex,x,workoutRegistry,set,x.set?.[0]||{})&&A.method(ex,set)===A.method(x,x.set?.[0]||{}));if(!match)return [];
              const done=(match.set||[]).filter(x=>A.complete(match,x,workoutRegistry)),target=A.effortTarget(match,done[0]||{},old),range=A.repRange(match,done[0]||{});
              const estimate=A.strengthEstimate(ex,A.history(ex,[old],workoutRegistry),workoutRegistry,[],set).estimate;
              return [{e1rm:estimate,actualRpe:done.length?Math.max(...done.map(x=>A.effortRpe(x)||0)):null,targetRpe:target.hi,actualReps:done.length?Math.min(...done.map(x=>A.number(x.actualReps??x.r)||0)):null,minReps:range.lo,techniqueFailed:(match.set||[]).some(x=>x.techniqueFailed),skippedSets:(match.set||[]).filter(x=>x.skipped).length,wellbeing:old.wellbeing?.status||old.wellbeing,fatigueHigh:old.wellbeing?.fatigueHigh===true}];
            });
            observations.forEach((x,i)=>{x.previousE1rm=observations[i-1]?.e1rm;});
            fatigueCache.set(fatigueKey,A.fatigueSignals(observations));
          }
          rec.fatigue={...fatigueCache.get(fatigueKey)};
          if(rec.fatigue.suggestDeload)rec.reason+='; несколько признаков усталости: предложена ранняя разгрузка';
          const suggested=A.recommendationWeight(rec);
          if (JSON.stringify(set.recommendation) !== JSON.stringify(rec) || set.recommendedW !== suggested) {
            set.recommendation = rec;
            set.recommendedW = suggested;
            set.trainingIntensity292 = { owner: "workout-domain" };
            changed = true;
          }
          // Auto mode fills pending loads; prescribed and manually edited loads
          // still require the explicit recommendation button.
          // Live W8 sessions may have cached an old auto-generated 120 kg.
          // Rebase each untouched pending AUTO load once when the new peak
          // maths becomes available. Completed/manual/accepted weights stay.
          const livePeakUpgrade=rec.peakRebase===true&&set.weightSource==='auto'&&
            set.peakAutoRevision!==575&&!set.manualOverride&&!set.ok&&!set.skipped;
          const rollingUpgrade=rec.currentOneRepMax>0&&set.weightSource==='auto'&&
            set.rollingAutoRevision!==584&&!set.manualOverride&&!set.ok&&!set.skipped;
          const recoveryUpgrade=rec.recoveryEvidenceExcluded>0&&set.weightSource==='auto'&&
            set.recoveryAutoRevision!==577&&!set.manualOverride&&!set.ok&&!set.skipped;
          const liveBackoffUpdate=A.setRole(ex,set)==='backoff'&&set.weightSource==='auto'&&
            !rec.backoffPending&&rec.canApply!==false&&
            rec.proposalKey!==set.backoffAutoKey&&!set.ok&&!set.skipped&&!set.manualOverride;
          if ((set.weightMode==='auto'||(!set.weightMode&&ex.programWeightMode === "adaptive")) &&
              suggested > 0 && (rec.sessionIds.length > 0 || rec.nextSetSuggestion || rec.strength?.estimate > 0) &&
              set.recommendationDecision?.status !== 'applied' &&
              !set.dismissedRecommendation && !rec.planPreserved &&
              (!set.autoInitialApplied||livePeakUpgrade||liveBackoffUpdate||recoveryUpgrade||rollingUpgrade)) {
            const before = set.w;
            const initialBase=rec.nextSetSuggestion?(ex.set||[]).filter(s=>s.ok&&!s.warmup).at(-1)?.w:null;
            const initialRec=rec.nextSetSuggestion&&rec.nextSetSuggestion.policyVersion!==541&&A.setRole(ex,set)!=='backoff'?{...rec,weeklyCalculated:false,nextSetSuggestion:null,weight:initialBase}:rec;
            if ((!rec.nextSetSuggestion||A.number(initialBase)>0)&&A.applyAuto(set, initialRec)) {
              set.plannedW = set.w;
              set.selectedW=set.w;set.autoInitialWeight=set.w;set.autoInitialApplied=true;
              if(rec.peakRebase)set.peakAutoRevision=575;
              if(rec.currentOneRepMax>0)set.rollingAutoRevision=584;
              if(rec.recoveryEvidenceExcluded>0)set.recoveryAutoRevision=577;
              if(A.setRole(ex,set)==='backoff')set.backoffAutoKey=rec.proposalKey;
              if (before !== set.w) changed = weightsChanged = true;
            }
          }
          ex.trainingProgression292 = {
            actualEffort: rec.sessionIds.length>0,
            action: rec.action,
            reason: rec.reason,
          };
          ex.weightDecision =
            ex.programWeightMode === "adaptive"
              ? (set.weightSource === 'auto' ? 'adaptive_auto' : 'recommendation_pending')
              : ex.weightDecision;
          // Yield between sets so the rest timer, touch and input can run.
          yield;
        }
      }
      if(st.current!==cur||cur.ended||cur.pendingCompletion)return false;
      cur.trainingLoadModelRevision = 292;
      cur.trainingMathOwner = "workout-domain";
      if (changed) {
        save({ draftOnly: true });
        if (weightsChanged) W.startPage?.();
        W.trainingEngine200Tick?.();
      }
      return changed;
    }
  }
  function run(options = {}) {
    if(running)return false;
    running=true;
    try{
      const work=calculate(options);let next;
      do{next=work.next()}while(!next.done);
      return next.value;
    }finally{running=false}
  }
  let pendingCalculation=null,resolveCalculation=null,allRequested=false;
  const requestedIndices=new Set();
  async function drain(){
    if(W.document?.visibilityState==='hidden')return;
    if(running){setTimeout(drain,0);return}
    running=true;let changed=false;
    try{
      while(allRequested||requestedIndices.size){
        const options=allRequested?{}:{exerciseIndices:[...requestedIndices]};
        allRequested=false;requestedIndices.clear();
        W.unvrslTrainingPrescriptionPrepareV292?.(st.current);
        const work=calculate(options);let next;
        do{
          next=work.next();
          if(!next.done)await new Promise(resolve=>setTimeout(resolve,0));
        }while(!next.done);
        changed=!!next.value||changed;
      }
    }catch(error){console.warn('Recommendation calculation',error)}
    finally{
      running=false;
      const resolve=resolveCalculation;
      pendingCalculation=null;resolveCalculation=null;
      resolve?.(changed);
      if(typeof W.CustomEvent==='function')W.dispatchEvent?.(new W.CustomEvent('unvrsl:recommendations-updated'));
    }
  }
  function schedule(options = {}){
    if(typeof setTimeout!=='function')return Promise.resolve(run(options));
    if(Array.isArray(options?.exerciseIndices)){
      const ex=st.current?.ex||[];
      const keys=new Set(options.exerciseIndices.map(i=>ex[i]).filter(Boolean).map(e=>workoutRegistry.identity(e)));
      ex.forEach((e,i)=>{if(keys.has(workoutRegistry.identity(e)))requestedIndices.add(i)});
    }else allRequested=true;
    if(!pendingCalculation){
      pendingCalculation=new Promise(resolve=>{resolveCalculation=resolve});
      setTimeout(drain,0);
    }
    return pendingCalculation;
  }
  W.document?.addEventListener?.('visibilitychange',()=>{
    if(W.document.visibilityState!=='hidden'&&pendingCalculation&&!running)setTimeout(drain,0);
  });
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
  const api = { run, schedule, whenIdle:()=>pendingCalculation||Promise.resolve(false), readinessWeight, history: recommendationHistory, version: 603 };
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
  ].forEach((name) => W.addEventListener(name, event => {
    const index=event?.detail?.exerciseIndex;
    schedule(name==='unvrsl:workout-set-changed'&&Number.isInteger(index)?{exerciseIndices:[index]}:{});
    if (name === 'unvrsl:cloud-ready')refreshOwnedHistory();
    if(name==='unvrsl:history-updated'&&event?.detail?.refreshCloud===true)refreshOwnedHistory(true);
  }));
  // A restored workout can already contain yesterday's recommendation. The
  // engine's initial ready event may have fired before this module loaded.
  Promise.resolve().then(() => { schedule(); refreshOwnedHistory(); });
})();
