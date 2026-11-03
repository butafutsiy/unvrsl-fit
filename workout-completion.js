"use strict";
(() => {
  const W = window,
    A = WorkoutDomain,
    D = document;
  const report = (s) =>
    A.summary(s, st.sessions || [], workoutRegistry, st.bw || []);
  const duration = (ms) => {
    const seconds=Math.max(0,Math.floor(Number(ms)/1000)||0),minutes=Math.floor(seconds/60),tail=String(seconds%60).padStart(2,"0");
    return minutes>=60?`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,"0")}:${tail}`:`${minutes}:${tail}`;
  };
  const nextWeight=(s,entry)=>{
    const ex=entry.best.exercise,set=entry.best.set;
    if(ex.mode==='cardio')return null;
    const future={...s,id:`next-${s.id}`,started:(Number(s.ended)||Date.now())+1,ended:null,ex:[]};
    const rec=A.recommend(ex,{...set,ok:false},future,st.sessions||[],workoutRegistry,st.exerciseWeightProfiles||{});
    return rec.sessionIds.length&&rec.action!=='reps'?`В следующий раз: ${String(rec.weight).replace('.',',')} кг · ${rec.reason}`:null;
  };
  let currentReport = null,
    currentSession = null;
  W.renderWorkoutSummary = function (s) {
    currentSession = s;
    const r = (currentReport = report(s));
    const volume =
      r.unknownVolumeSets && r.volume === 0
        ? "Не рассчитан"
        : r.unknownVolumeSets
          ? `${r.volume.toLocaleString("ru-RU")} кг · частичный`
          : `${r.volume.toLocaleString("ru-RU")} кг`;
    modal(
      `<div class="wc392"><div class="row between"><h2>Тренировка завершена</h2><button class="btn" onclick="closeModal()" aria-label="Закрыть">✕</button></div><p class="muted">${esc(r.name)} · ${esc(r.date)}</p><div class="wc392-grid">${[
        ["Время", duration(r.durationMs)],
        ["Упражнения", r.exerciseCount],
        ["Рабочие подходы", r.setCount],
        ["Объём", volume],
        ...(W.UNVRSLCardio?.sessionCalories(s)?[["Кардио, ккал",`${W.UNVRSLCardio.sessionCalories(s).estimated?'≈ ':''}${W.UNVRSLCardio.sessionCalories(s).kcal}`]]:[]),
      ]
        .map(([label, v]) => `<div><small>${label}</small><b>${v}</b></div>`)
        .join(
          "",
        )}</div>${r.unknownVolumeSets ? '<p class="muted small">Объём включает только подходы с известной эффективной нагрузкой.</p>' : ""}${r.comparison ? `<p class="muted small">По сравнению с ${esc(r.comparison.date)}: подходы ${r.comparison.setDelta > 0 ? "+" : ""}${r.comparison.setDelta}${r.comparison.volumeDelta == null ? "" : `, объём ${r.comparison.volumeDelta > 0 ? "+" : ""}${r.comparison.volumeDelta} кг`}</p>` : ""}${r.exercises.map((e) => `<div class="listline"><b>${esc(e.name)}</b>${e.sets.map((x) => `<p class="small">${esc(x.label)}</p>`).join("")}<p class="muted small">Лучший подход: ${esc(e.best.label)}</p>${nextWeight(s,e)?`<p class="small green">${esc(nextWeight(s,e))}</p>`:""}${e.records.length ? '<span class="chip">Новый рекорд</span>' : ""}</div>`).join("")}${W.conditioningSummaryHtml?.(s)||''}<button class="btn primary full" onclick="previewWorkoutShare()">Поделиться результатом</button><button class="btn full" onclick="closeModal();nav('stats')">К статистике</button></div>`,
    );
  };
  // A successful cloud upload can outlive a failed local draft close on iOS.
  // Verify that the archived workout is the same as the current draft before
  // recovering it. Never silently replace locally edited sets with older data.
  const workoutSetSignature = (session) =>
    JSON.stringify((session?.ex || []).map((exercise) =>
      (exercise?.set || []).map((set) => [
        !!set.ok, String(set.w ?? ""), String(set.r ?? ""),
        String(set.rpe ?? ""), String(set.rir ?? ""),
      ]),
    ));
  const sameCloudSets = (local, remote) =>
    (local?.ex || []).length === (remote?.ex || []).length &&
    workoutSetSignature(local) === workoutSetSignature(remote);

  async function confirmedCloudWorkout(active) {
    const cloud = W.cloud, uid = cloud?.user?.id;
    if (!active?.pendingCompletion || !active.id || !uid || !cloud?.client) return null;
    if (active.userId && String(active.userId) !== String(uid)) return null;
    try {
      const { data, error } = await cloud.client.from("workouts")
        .select("payload").eq("user_id", uid)
        .eq("external_id", String(active.id)).maybeSingle();
      const remote = !error ? data?.payload : null;
      if (!remote || String(remote.id) !== String(active.id) || !remote.ended ||
          remote.pendingCompletion || !sameCloudSets(active, remote)) return null;
      return remote;
    } catch (error) {
      console.warn("Could not verify finished workout in cloud", error);
      return null;
    }
  }

  let recoveringCloudWorkout = false;
  async function recoverSyncedWorkout(active, showSummary = true) {
    if (recoveringCloudWorkout || !active?.pendingCompletion) return false;
    recoveringCloudWorkout = true;
    try {
      const remote = await confirmedCloudWorkout(active);
      if (!remote || st.current?.id !== active.id) return false;
      const result = { ...remote, syncStatus: "synced" };
      const history = st.sessions || (st.sessions = []);
      const index = history.findIndex((entry) => String(entry.id) === String(result.id));
      if (index < 0) history.push(result);
      else history[index] = result;
      let closed = false;
      try {
        closed = (await W.closeWorkoutDraft?.(st, active, "completed")) === true;
      } catch (error) {
        console.warn("Cloud workout saved; IndexedDB draft close failed", error);
      }
      if (!closed) {
        try { workoutStore.close(st, active, "completed"); closed = true; }
        catch (error) { console.warn("Cloud workout saved; local draft close failed", error); }
      }
      if (!closed) {
        // Remote copy was verified, so do not trap the user behind a stale
        // pendingCompletion flag if Safari local storage is full.
        st.current = null;
      }
      try { save(); } catch (error) { console.warn("Cloud workout saved; local save unavailable", error); }
      try { stopTimer(); } catch (_) {}
      try { W.showWorkoutDraft(); } catch (_) {}
      if (showSummary) {
        try { W.renderWorkoutSummary(result); }
        catch (error) { console.warn("Saved workout summary unavailable", error); toast("Тренировка сохранена в облаке"); }
      } else {
        toast("Тренировка восстановлена из облака");
        if (D.getElementById("start")?.classList.contains("active")) {
          try { W.renderWorkoutSummary(result); } catch (_) {}
        }
      }
      W.dispatchEvent?.(new CustomEvent("unvrsl:workout-completed", { detail: { sessionId: result.id, recovered: true } }));
      return true;
    } finally {
      recoveringCloudWorkout = false;
    }
  }
  W.completeWorkout = async function () {
    const s = st.current;
    if (!s || W.__workoutFinishing) return;
    if (s.pendingCompletion) {
      W.__workoutFinishing = true;
      try { if (await recoverSyncedWorkout(s)) return; }
      finally { W.__workoutFinishing = false; }
    }
    if(W.conditioningIsBusy?.(s)){toast('Сначала останови блок и сохрани его результат');return}
    if (
      !W.conditioningHasWork?.(s)&&!(s.ex || []).some((e) =>
        (e.set || []).some((x) => A.complete(e, x, workoutRegistry)),
      )
    ) {
      modal(
        '<div class="wc392"><h2>Нет выполненных подходов</h2><p class="muted">Чтобы завершить тренировку, отметь хотя бы один выполненный рабочий подход. Если передумал тренироваться, отмени тренировку. Она не попадёт в статистику.</p><button type="button" class="btn primary full" onclick="closeModal()">Вернуться к тренировке</button><button type="button" class="btn danger full" onclick="closeModal();cancelWorkout()">Отменить тренировку</button></div>',
      );
      return;
    }
    W.__workoutFinishing = true;
    const button = D.querySelector("[data-workout-finish]");
    if (button) button.disabled = true;
    try {
      const userId = W.cloud?.user?.id || s.userId;
      const mustSync = !!userId;
      const result = await workoutStore.finish(st, {
        persist: () =>
          W.persistWorkoutState ? W.persistWorkoutState() : save(),
        closeDraft: W.closeWorkoutDraft,
        userId,
        sync: mustSync
          ? async (result) => {
              if (!W.cloud?.user || W.cloud.user.id !== userId) return false;
              return await W.cloudSyncSession?.(result);
            }
          : null,
      });
      if (result) {
        stopTimer();
        W.showWorkoutDraft();
        W.renderWorkoutSummary(result);
        W.dispatchEvent(
          new CustomEvent("unvrsl:workout-completed", {
            detail: { sessionId: result.id },
          }),
        );
        save();
      }
    } catch (error) {
      if (st.current?.id === s.id && await recoverSyncedWorkout(s)) return;
      toast(
        st.current
          ? "Черновик сохранён. Если облако недоступно, повтори завершение позже."
          : "Тренировка сохранена. Открой результат из истории.",
      );
      console.warn("Workout completion retained draft", error);
    } finally {
      W.__workoutFinishing = false;
      if (button) button.disabled = false;
    }
  };
  W.completeWorkoutV385 = W.completeWorkout;
  W.completeWorkoutV384 = W.completeWorkout;
  W.showWorkoutDraft = function () {
    if (!st.current) {
      D.querySelectorAll("[data-workout-draft]").forEach((x) => x.remove());
      return;
    }
    const root = D.querySelector(".page.active");
    if (
      !root ||
      root.id === "start" ||
      root.querySelector("[data-workout-draft]")
    )
      return;
    const block = D.createElement("div");
    block.className = "card";
    block.dataset.workoutDraft = "1";
    block.innerHTML = `<b>У вас есть незавершённая тренировка</b><p class="muted">${esc(st.current.name || st.current.c || "Тренировка")}${st.current.pendingCompletion ? " · ожидает сохранения" : ""}</p><div class="chips"><button class="btn primary" onclick="resumeWorkoutDraft()">Продолжить</button><button class="btn" onclick="inspectWorkoutDraft()">Посмотреть</button><button class="btn danger" onclick="cancelWorkout()">Удалить черновик</button></div>`;
    root.prepend(block);
  };
  W.resumeWorkoutDraft = () => {
    if (st.current?.pendingCompletion && !W.__workoutFinishing) {
      delete st.current.pendingCompletion;
      delete st.current.ended;
      delete st.current.syncError;
      save();
    }
    const y = st.current?.scrollY || 0;
    closeModal();
    nav("start");
    requestAnimationFrame(() => (W.unvrslScrollTo || W.scrollTo)(0, y));
  };
  W.inspectWorkoutDraft = () => {
    const s = st.current;
    if (!s) return;
    modal(
      `<h2>Незавершённая тренировка</h2><p>${esc(s.name || s.c)}</p>${(s.ex || []).map((e) => `<div class="listline"><b>${esc(e.n)}</b>${(e.set || []).map((x) => `<p>${x.ok ? "✓" : "○"} ${esc(A.setLabel(e, x, workoutRegistry))}</p>`).join("")}</div>`).join("")}<button class="btn primary full" onclick="resumeWorkoutDraft()">Продолжить</button>`,
    );
  };
  W.previewWorkoutShare = () => { if (currentSession) W.openShareProgressV264?.(currentSession); };
  W.sendWorkoutShare = () => W.shareProgressNativeV264?.();
  // Reuse the canonical summary for the old share entry points, without the old canvas renderer.
  W.advShareWorkout = (s) => {
    const id = typeof s === "string" ? decodeURIComponent(s) : null;
    currentSession = id ? (st.sessions || []).find(x => String(x.id) === id) : s || st.sessions.at(-1);
    if (currentSession) {
      currentReport = report(currentSession);
      W.previewWorkoutShare();
    }
  };
  const css = D.createElement("style");
  css.textContent =
    ".weight392{min-width:0}.weight392>div{display:flex;justify-content:space-between;gap:4px}.weight392 button{min-height:24px;flex:1;background:#302734;border-radius:6px;font-size:16px} .wc392-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.wc392-grid>div{background:#242127;border:1px solid #39303f;border-radius:18px;padding:18px;min-width:0}.wc392-grid small{display:block;color:#aaa}.wc392-grid b{display:block;font-size:26px;margin-top:10px}.wc392 .primary{background:#bf5af2;color:#120918}.wc392-preview{display:block;width:100%;height:auto;border-radius:18px;margin-bottom:16px}.wc392 .listline p{margin:8px 0}";
  D.head.append(css);
  W.addEventListener("unvrsl:app-ready", W.showWorkoutDraft);
  // Recover a cloud-committed session on next launch without asking the user
  // to upload the exact same workout again.
  const autoRecover = async () => {
    if (W.__workoutFinishing || !st.current?.pendingCompletion || !W.cloud?.user) return;
    W.__workoutFinishing = true;
    try { await recoverSyncedWorkout(st.current); }
    finally { W.__workoutFinishing = false; }
  };
  for (const event of ["unvrsl:app-ready", "unvrsl:cloud-modules-settled", "unvrsl:storage-hydrated"])
    W.addEventListener(event, () => { if (typeof setTimeout === "function") setTimeout(autoRecover, 150); });
  if (typeof setTimeout === "function") setTimeout(autoRecover, 1800);
  W.addEventListener("unvrsl:workout-rendered", () => {
    if (st.current?.pendingCompletion) {
      const b = D.querySelector("[data-workout-finish]");
      if (b) b.textContent = "Повторить сохранение";
    }
  });
})();
