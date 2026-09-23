"use strict";
(() => {
  const W = window,
    A = WorkoutDomain,
    D = document;
  const report = (s) =>
    A.summary(s, st.sessions || [], workoutRegistry, st.bw || []);
  const duration = (ms) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
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
      ]
        .map(([label, v]) => `<div><small>${label}</small><b>${v}</b></div>`)
        .join(
          "",
        )}</div>${r.unknownVolumeSets ? '<p class="muted small">Объём включает только подходы с известной эффективной нагрузкой.</p>' : ""}${r.comparison ? `<p class="muted small">По сравнению с ${esc(r.comparison.date)}: подходы ${r.comparison.setDelta > 0 ? "+" : ""}${r.comparison.setDelta}${r.comparison.volumeDelta == null ? "" : `, объём ${r.comparison.volumeDelta > 0 ? "+" : ""}${r.comparison.volumeDelta} кг`}</p>` : ""}${r.exercises.map((e) => `<div class="listline"><b>${esc(e.name)}</b>${e.sets.map((x) => `<p class="small">${esc(x.label)}</p>`).join("")}<p class="muted small">Лучший подход: ${esc(e.best.label)}</p>${nextWeight(s,e)?`<p class="small green">${esc(nextWeight(s,e))}</p>`:""}${e.records.length ? '<span class="chip">Новый рекорд</span>' : ""}</div>`).join("")}<button class="btn primary full" onclick="previewWorkoutShare()">Поделиться результатом</button><button class="btn full" onclick="closeModal();nav('stats')">К статистике</button></div>`,
    );
  };
  W.completeWorkout = async function () {
    const s = st.current;
    if (!s || W.__workoutFinishing) return;
    if (
      !(s.ex || []).some((e) =>
        (e.set || []).some((x) => A.complete(e, x, workoutRegistry)),
      )
    ) {
      toast("Нет завершённых рабочих подходов");
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
      toast(
        st.current
          ? "Результаты сохранены в черновике. Повторите завершение после восстановления связи."
          : "Тренировка сохранена. Откройте результат из истории.",
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
    requestAnimationFrame(() => scrollTo(0, y));
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
    currentSession = s || st.sessions.at(-1);
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
  W.addEventListener("unvrsl:workout-rendered", () => {
    if (st.current?.pendingCompletion) {
      const b = D.querySelector("[data-workout-finish]");
      if (b) b.textContent = "Повторить сохранение";
    }
  });
})();
