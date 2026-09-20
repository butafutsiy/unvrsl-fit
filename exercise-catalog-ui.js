"use strict";
(() => {
  const W = window,
    D = document,
    A = WorkoutDomain,
    rows = W.UNVRSL_EXERCISES,
    esc = W.esc;
  let query = "",
    body = "all",
    equipment = "all",
    limit = 24,
    searchTimer,
    usageCache = null,
    usageSignature = "",
    listSignature = "";
  const normalized = rows.map((e) => ({
    e,
    search: A.norm(
      [
        e.n,
        e.sourceName,
        ...(e.aliases || []),
        BP_RU[e.bp],
        EQ_RU[e.eq],
        ruTarget(e.tg),
      ].join(" "),
    ),
  }));
  function usage() {
    const signature = st.sessions
      .map((s) => `${s.id}:${s.updatedAt || s.ended}`)
      .join("|");
    if (signature === usageSignature && usageCache) return usageCache;
    usageSignature = signature;
    const map = new Map();
    for (const s of (st.sessions || []).filter(
      (x) => x.ended && !x.pendingCompletion,
    ))
      for (const e of s.ex || []) {
        const count = (e.set || []).filter((x) =>
          A.complete(e, x, workoutRegistry),
        ).length;
        if (count) {
          const key = workoutRegistry.identity(e),
            old = map.get(key) || { count: 0, date: 0 };
          old.count += count;
          old.date = Math.max(old.date, s.ended || s.started || 0);
          map.set(key, old);
        }
      }
    return (usageCache = map);
  }
  function favorite(e) {
    return (st.favorites || []).some((id) => id === e.id || id === e.rawId);
  }
  const media = (e) =>
    e.image || (e.gif && !/\.gif(?:\?|$)/i.test(e.gif) ? e.gif : "");
  const url = (path) =>
    !path
      ? ""
      : /^(https?:|data:)/.test(path)
        ? path
        : path.startsWith("assets/")
          ? path
          : mediaUrl(path);
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (target.dataset.failed) return;
        if (isIntersecting) {
          if (target.dataset.src && !target.getAttribute("src"))
            target.src = target.dataset.src;
        } else if (target.dataset.animated === "1")
          target.removeAttribute("src");
      }),
    { rootMargin: "100px" },
  );
  function observe() {
    for (const image of D.querySelectorAll("img[data-exercise-media]")) {
      if (image.dataset.observed) continue;
      image.dataset.observed = "1";
      image.addEventListener(
        "error",
        () => {
          image.dataset.failed = "1";
          image.removeAttribute("src");
          image.style.visibility = "hidden";
          observer.unobserve(image);
        },
        { once: true },
      );
      observer.observe(image);
    }
  }
  function card(e) {
    return `<article class="card exlib catalog392-row" data-id="${esc(e.id)}"><button class="catalog392-open" onclick="openExerciseDetail('${encodeURIComponent(e.id)}')"><span class="catalog392-thumb">${media(e) ? `<img data-exercise-media data-src="${esc(url(media(e)))}" alt="" width="72" height="72" loading="lazy" decoding="async">` : '<span aria-label="Изображение пока отсутствует">◇</span>'}</span><span><b>${esc(e.n)}</b><small>${esc(BP_RU[e.bp] || e.bp)} · ${esc(EQ_RU[e.eq] || e.eq)}</small></span></button><button class="star-btn ${favorite(e) ? "on" : ""}" aria-label="Избранное: ${esc(e.n)}" onclick="toggleFavorite('${esc(e.id)}')">★</button></article>`;
  }
  function filtered() {
    const u = usage(),
      q = A.norm(query);
    return normalized
      .filter(
        ({ e, search }) =>
          (!q || search.includes(q)) &&
          (equipment === "all" || e.eq === equipment) &&
          (body === "all" ||
            (body === "favorites" && favorite(e)) ||
            (body === "frequent" && u.has(e.id)) ||
            (body === "recent" &&
              ((st.recentExercises || []).includes(e.id) || u.has(e.id))) ||
            e.bp === body),
      )
      .map((x) => x.e)
      .sort((a, b) =>
        body === "frequent"
          ? (u.get(b.id)?.count || 0) - (u.get(a.id)?.count || 0)
          : body === "recent"
            ? (u.get(b.id)?.date || 0) - (u.get(a.id)?.date || 0)
            : a.n.localeCompare(b.n, "ru"),
      );
  }
  function renderList() {
    const el = D.getElementById("exList");
    if (!el) return;
    const f = filtered(),
      sig = JSON.stringify([
        query,
        body,
        equipment,
        limit,
        st.favorites,
        usageSignature,
      ]);
    if (listSignature === sig && el.childElementCount) return;
    listSignature = sig;
    observer.disconnect();
    D.querySelectorAll("img[data-exercise-media]").forEach(
      (x) => delete x.dataset.observed,
    );
    el.innerHTML =
      f.slice(0, limit).map(card).join("") +
      (f.length > limit
        ? '<button class="btn full" onclick="showMoreExercises()">Показать ещё</button>'
        : "") +
      (!f.length ? '<p class="muted">Ничего не найдено.</p>' : "");
    D.getElementById("catalogCount").textContent =
      `${rows.length} упражнений · найдено ${f.length}`;
    observe();
  }
  W.catalogRecords = catalogRecords = () => rows;
  W.UNVRSL_FINAL_EXERCISES = () => rows;
  W.renderExerciseResults = renderExerciseResults = renderList;
  W.exercisesPage = exercisesPage = function () {
    const root = D.getElementById("exercises");
    if (!root) return;
    if (root.dataset.canonicalCatalog !== "392") {
      root.dataset.canonicalCatalog = "392";
      root.innerHTML = `<div class="card"><h2>Упражнения</h2><p class="muted" id="catalogCount"></p></div><input id="exSearch" class="search" aria-label="Поиск упражнений" placeholder="Название или другое название" value="${esc(query)}"><div class="filterbar" id="bodyFilters">${["all", "favorites", "frequent", "recent", ...new Set(rows.map((x) => x.bp))].map((v) => `<button class="filterchip ${body === v ? "on" : ""}" data-filter="${esc(v)}">${esc({ all: "Все", favorites: "★ Избранные", frequent: "Частые", recent: "Недавние" }[v] || BP_RU[v] || v)}</button>`).join("")}</div><div class="section">ОБОРУДОВАНИЕ</div><div class="filterbar" id="catalogEquipment" aria-label="Оборудование">${["all", ...new Set(rows.map((x) => x.eq))].map((v) => `<button class="filterchip ${equipment === v ? "on" : ""}" data-equipment="${esc(v)}">${v === "all" ? "Все" : esc(EQ_RU[v] || v)}</button>`).join("")}</div><div id="exList"></div>`;
      root.querySelector("#exSearch").addEventListener("input", (e) => {
        query = e.target.value;
        limit = 24;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(renderList, 90);
      });
      root.querySelector("#bodyFilters").addEventListener("click", (e) => {
        const b = e.target.closest("[data-filter]");
        if (b) {
          body = b.dataset.filter;
          limit = 24;
          root
            .querySelectorAll("[data-filter]")
            .forEach((x) => x.classList.toggle("on", x === b));
          renderList();
        }
      });
      root.querySelector("#catalogEquipment").addEventListener("click", (e) => {
        const b = e.target.closest("[data-equipment]");
        if (!b) return;
        equipment = b.dataset.equipment;
        limit = 24;
        root
          .querySelectorAll("[data-equipment]")
          .forEach((x) => x.classList.toggle("on", x === b));
        renderList();
      });
    }
    renderList();
  };
  W.showMoreExercises = () => {
    limit += 24;
    renderList();
  };
  W.toggleFavorite = toggleFavorite = (id) => {
    const row = workoutRegistry.resolve(id);
    if (!row) return;
    const was = favorite(row);
    st.favorites = (st.favorites || []).filter(
      (x) => x !== row.id && x !== row.rawId,
    );
    if (!was) st.favorites.push(row.id);
    save();
    renderList();
  };
  W.findExercise = findExercise = (token) =>
    workoutRegistry.resolve(decodeURIComponent(token || ""));
  W.openExerciseDetail = openExerciseDetail = (token) => {
    const e = findExercise(token);
    if (!e) return;
    st.recentExercises = [
      e.id,
      ...(st.recentExercises || []).filter((x) => x !== e.id),
    ].slice(0, 30);
    save();
    renderExerciseDetail(e);
  };
  W.openExerciseDetailByName = openExerciseDetailByName = (token) => {
    const e = workoutRegistry.resolve(decodeURIComponent(token || ""));
    if (e) renderExerciseDetail(e);
    else toast("Карточка упражнения не найдена");
  };
  const list = (items) =>
    `<ul>${(items || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  W.renderExerciseDetail = renderExerciseDetail = function (input) {
    const e = workoutRegistry.resolve(input) || input,
      c = e.coaching || {},
      hist = A.history(e, st.sessions, workoutRegistry, {
        userId: W.cloud?.user?.id,
      }),
      p = A.profile(e, workoutRegistry, st.exerciseWeightProfiles || {}),
      est = hist
        .map((x) =>
          A.e1rm(x.exercise, x.set, x.session, workoutRegistry, st.bw),
        )
        .filter((x) => x != null),
      gif = url(e.gif || e.image);
    modal(
      `<div class="row between"><h2>${esc(e.n)}</h2><button class="btn" onclick="closeModal()" aria-label="Закрыть">✕</button></div><div class="exercise-media catalog392-media">${gif ? `<img data-exercise-media data-animated="${/\.gif(?:\?|$)/i.test(gif) ? 1 : 0}" data-src="${esc(gif)}" alt="${esc(e.n)}" width="400" height="400" decoding="async">` : "<span>Для этого упражнения ещё нет проверенного изображения</span>"}</div><p>${esc(ruTarget(e.tg))} · ${esc(EQ_RU[e.eq] || e.eq)}</p><p class="muted small">Дополнительные мышцы: ${esc((e.secondary || []).map(ruTarget).join(", "))}</p><p class="muted small">${e.type === "isolation" ? "Изолирующее" : "Многосуставное"} · ${esc({ external_total: "Общий внешний вес", per_dumbbell: "Вес одной гантели", per_side: "Вес на сторону", bodyweight_only: "Собственный вес", bodyweight_added: "Собственный вес и дополнительное отягощение", bodyweight_assisted: "Величина помощи", machine_stack: "Вес тренажёра", time: "Время", distance: "Дистанция", repetitions_only: "Повторения" }[e.loadType] || e.loadType)}</p><p>${esc(e.description || "Описание пока не заполнено")}</p><h3>Исходное положение</h3><p>${esc(c.start || "Не заполнено")}</p><h3>Движение</h3>${list(c.sequence)}<h3>Дыхание</h3><p>${esc(c.breathing || "Не заполнено")}</p><h3>Технические акценты</h3>${list(c.cues)}<h3>Частые ошибки</h3>${list(c.mistakes)}<h3>Безопасность</h3>${list(c.safety)}<div class="field"><label for="exerciseStep">Шаг веса, кг</label><input id="exerciseStep" type="number" min="0.1" step="0.1" value="${p.step}"></div><button class="btn" onclick="saveExerciseStep('${esc(e.id)}')">Сохранить шаг оборудования</button>${est.length ? `<h3>Расчётный 1ПМ</h3><b>${Math.max(...est).toFixed(1)} кг${e.loadType === "per_dumbbell" ? " / гантель" : ""}</b><p class="muted small">Только завершённые обычные рабочие подходы до 12 повторений.</p>` : ""}${
        hist.length
          ? "<h3>Лучшие результаты</h3>" +
            A.bestResults(e, hist, workoutRegistry)
              .map((x) => `<p>${esc(x.label)}: <b>${esc(x.result)}</b></p>`)
              .join("")
          : ""
      }<h3>История рабочих подходов</h3>${
        hist.length
          ? hist
              .slice(0, 30)
              .map(
                (x) =>
                  `<div class="listline"><span class="muted">${esc(x.session.date)}</span><p>${esc(A.setLabel(x.exercise, x.set, workoutRegistry))}</p></div>`,
              )
              .join("")
          : '<p class="muted">Завершённых рабочих подходов пока нет.</p>'
      }<button class="btn primary full" onclick="addToPlanSheet('${encodeURIComponent(e.id)}')">Добавить в план</button><p class="muted small">Медиа © Gym visual. Источник: ExerciseDB dataset.</p>`,
    );
    observe();
  };
  W.saveExerciseStep = (id) => {
    const step = A.number(D.getElementById("exerciseStep")?.value);
    if (!(step > 0)) return toast("Шаг должен быть больше нуля");
    (st.exerciseWeightProfiles || (st.exerciseWeightProfiles = {}))[id] = {
      ...(st.exerciseWeightProfiles?.[id] || {}),
      step,
    };
    save();
    toast("Шаг сохранён");
  };
  W.historySetsFor = historySetsFor = (n, sourceId) =>
    A.history({ n, sourceId }, st.sessions, workoutRegistry).map((x) => ({
      date: x.session.date,
      w: A.number(x.set.w) ?? 0,
      r: A.number(x.set.r),
      rpe: x.set.rpe ?? "",
      exercise: x.exercise,
      set: x.set,
      session: x.session,
    }));
  W.bestEstimateFor = bestEstimateFor = (n, sourceId) => {
    const a = historySetsFor(n, sourceId)
      .map((x) => ({
        ...x,
        est: A.e1rm(x.exercise, x.set, x.session, workoutRegistry, st.bw),
      }))
      .filter((x) => x.est != null)
      .sort((a, b) => b.est - a.est);
    return a[0] || null;
  };
  W.recordsFor = recordsFor = (n) => {
    const a = historySetsFor(n);
    return {
      count: a.length,
      best: a.length ? Math.max(...a.map((x) => x.w)) : 0,
    };
  };

  const style = D.createElement("style");
  style.textContent =
    "#exercises{padding-bottom:calc(140px + env(safe-area-inset-bottom))}.catalog392-row{display:flex;align-items:center;gap:8px;content-visibility:auto;contain-intrinsic-size:auto 108px}.catalog392-open{display:flex;align-items:center;gap:14px;flex:1;text-align:left;min-width:0}.catalog392-open b{font-size:18px;line-height:1.3}.catalog392-open small{display:block;color:#999;margin-top:6px}.catalog392-thumb{display:grid;place-items:center;width:72px;height:72px;flex:none;background:#fafafa;border-radius:14px;overflow:hidden;color:#b9b9bf}.catalog392-thumb img{width:72px;height:72px;object-fit:contain}.catalog392-media{aspect-ratio:1;background:#fafafa!important;border-radius:22px;display:grid;place-items:center;overflow:hidden;color:#666}.catalog392-media img{width:100%;height:100%;object-fit:contain!important}.catalog392-media span{padding:32px;text-align:center}";
  D.head.append(style);
})();
