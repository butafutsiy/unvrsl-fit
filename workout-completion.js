"use strict";
(() => {
  const W = window,
    A = WorkoutDomain,
    D = document;
  const report = (s) =>
    A.summary(s, st.sessions || [], workoutRegistry, st.bw || []);
  const duration = (ms) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
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
        )}</div>${r.unknownVolumeSets ? '<p class="muted small">Объём включает только подходы с известной эффективной нагрузкой.</p>' : ""}${r.comparison ? `<p class="muted small">По сравнению с ${esc(r.comparison.date)}: подходы ${r.comparison.setDelta > 0 ? "+" : ""}${r.comparison.setDelta}${r.comparison.volumeDelta == null ? "" : `, объём ${r.comparison.volumeDelta > 0 ? "+" : ""}${r.comparison.volumeDelta} кг`}</p>` : ""}${r.exercises.map((e) => `<div class="listline"><b>${esc(e.name)}</b>${e.sets.map((x) => `<p class="small">${esc(x.label)}</p>`).join("")}<p class="muted small">Лучший подход: ${esc(e.best.label)}</p>${e.records.length ? '<span class="chip">Новый рекорд</span>' : ""}</div>`).join("")}<button class="btn primary full" onclick="previewWorkoutShare()">Поделиться результатом</button><button class="btn full" onclick="closeModal();nav('stats')">К статистике</button></div>`,
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
  W.previewWorkoutShare = function () {
    if (!currentReport) return;
    const r = currentReport,
      c = D.createElement("canvas");
    c.width = 1080;
    c.height = 1350;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0c0b10";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#bf5af2";
    ctx.fillRect(64, 64, 96, 8);
    ctx.font = "bold 38px Arial, sans-serif";
    ctx.fillText("UNVRSL FIT", 64, 140);
    ctx.fillStyle = "#f5f5f7";
    ctx.font = "bold 64px Arial, sans-serif";
    const fit = (text, width) => {
      text = String(text);
      if (ctx.measureText(text).width <= width) return text;
      while (text && ctx.measureText(text + "…").width > width)
        text = text.slice(0, -1);
      return text + "…";
    };
    const words = r.name.split(" "),
      lines = [];
    let line = "";
    for (const word of words) {
      const next = (line ? line + " " : "") + word;
      if (line && ctx.measureText(next).width > 920) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    let y = 250;
    for (const [i, title] of lines.slice(0, 2).entries()) {
      ctx.fillText(
        fit(title + (i === 1 && lines.length > 2 ? "…" : ""), 920),
        64,
        y,
      );
      if (i === 0 && lines.length > 1) y += 76;
    }
    ctx.fillStyle = "#96909f";
    ctx.font = "28px Arial, sans-serif";
    ctx.fillText(r.date, 64, y + 54);
    let by = Math.max(450, y + 150);
    for (const [i, [value, label]] of [
      [duration(r.durationMs), "Время"],
      [String(r.exerciseCount), "Упражнения"],
      [String(r.setCount), "Рабочие подходы"],
      [
        r.unknownVolumeSets && r.volume === 0
          ? "—"
          : `${r.volume.toLocaleString("ru-RU")} кг`,
        r.unknownVolumeSets ? "Объём с известной нагрузкой" : "Объём",
      ],
    ].entries()) {
      const x = i % 2 ? 570 : 64,
        yy = by + Math.floor(i / 2) * 170;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 60px Arial, sans-serif";
      ctx.fillText(fit(value, 440), x, yy);
      ctx.fillStyle = "#96909f";
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText(label, x, yy + 48);
    }
    by += 380;
    const highlights = r.records.length
      ? r.records.slice(0, 2)
      : r.exercises
          .slice(0, 2)
          .map((e) => ({ name: e.name, label: e.best.label }));
    if (r.records.length) {
      ctx.fillStyle = "#bf5af2";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText(`НОВЫЕ РЕКОРДЫ · ${r.records.length}`, 64, by);
      by += 55;
    }
    ctx.font = "28px Arial, sans-serif";
    for (const h of highlights) {
      ctx.fillStyle = "#c6c1cc";
      ctx.fillText(fit(h.name, 940), 64, by);
      ctx.fillStyle = "#fff";
      ctx.fillText(fit(h.label, 940), 64, by + 44);
      by += 114;
    }
    const data = c.toDataURL("image/png");
    W.__workoutShareCanvas = c;
    modal(
      `<h2>Поделиться результатом</h2><img class="wc392-preview" src="${data}" alt="Точный предпросмотр результата"><a class="btn primary full" download="UNVRSL-FIT-${esc(r.date)}.png" href="${data}">Сохранить изображение</a><button class="btn full" onclick="sendWorkoutShare()">Отправить</button>`,
    );
  };
  W.sendWorkoutShare = async () => {
    const c = W.__workoutShareCanvas;
    if (!c) return;
    const blob = await new Promise((resolve) => c.toBlob(resolve, "image/png")),
      file = new File([blob], "UNVRSL-FIT.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "UNVRSL FIT" });
      } catch (e) {
        if (e.name !== "AbortError") toast("Не удалось открыть отправку");
      }
    } else toast("Сохраните изображение и отправьте его из галереи");
  };
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
