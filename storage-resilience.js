"use strict";
(() => {
  const W = window;
  W.__unvrslStorageResilienceV386 = true;
  let dbPromise;
  function db() {
    return (
      dbPromise ||
      (dbPromise = new Promise((resolve, reject) => {
        const q = indexedDB.open("unvrsl-fit-fallback", 1);
        q.onupgradeneeded = () => q.result.createObjectStore("state");
        q.onsuccess = () => resolve(q.result);
        q.onerror = () => reject(q.error);
      }))
    );
  }
  async function mirror(snapshot, key = "latest", drafts = null) {
    const d = await db();
    await new Promise((resolve, reject) => {
      const tx = d.transaction("state", "readwrite");
      tx.objectStore("state").put(
        { savedAt: Date.now(), state: snapshot },
        key,
      );
      if (drafts)
        tx.objectStore("state").put(
          { savedAt: Date.now(), state: drafts },
          "drafts",
        );
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  async function recover() {
    if (W.__unvrslHadPrimaryStorageV386) return;
    try {
      const d = await db(),
        record = await new Promise((resolve, reject) => {
          const q = d.transaction("state").objectStore("state").get("latest");
          q.onsuccess = () => resolve(q.result);
          q.onerror = () => reject(q.error);
        });
      if (record?.state) {
        const draftRecord = await new Promise((resolve, reject) => {
          const q = d.transaction("state").objectStore("state").get("drafts");
          q.onsuccess = () => resolve(q.result);
          q.onerror = () => reject(q.error);
        });
        if (draftRecord?.state && !localStorage.getItem(WorkoutStore.DRAFT))
          localStorage.setItem(
            WorkoutStore.DRAFT,
            JSON.stringify(draftRecord.state),
          );
        st = record.state;
        WorkoutDomain.migrate(st, workoutRegistry);
        workoutStore.restore(st);
        workoutStore.save(st);
      }
    } catch (e) {
      console.warn("Recovery unavailable", e);
    }
  }
  const base = save;
  let pending = Promise.resolve();
  W.save = save = function (options = {}) {
    let localError = null;
    try {
      base(options);
    } catch (e) {
      localError = e;
    }
    const snapshot = JSON.parse(
      JSON.stringify(options.draftOnly ? workoutStore.journal() : st),
    );
    const drafts = options.draftOnly
      ? null
      : JSON.parse(JSON.stringify(workoutStore.journal()));
    pending = pending
      .catch(() => {})
      .then(() =>
        mirror(snapshot, options.draftOnly ? "drafts" : "latest", drafts),
      );
    pending.catch(() => {});
    if (localError) {
      toast(
        "Не удалось записать локальные данные. Не закрывайте тренировку до сохранения.",
      );
      throw localError;
    }
    return true;
  };
  W.persistWorkoutState = async () => {
    save();
    await pending.catch(() => {});
    return true;
  };
  recover().finally(() => {
    W.__unvrslStorageHydrationSettledV386 = true;
    W.dispatchEvent(new CustomEvent("unvrsl:storage-hydrated"));
  });
  function checkpoint() {
    if (!st.current) return;
    try {
      if (document.querySelector("#start.active")) st.current.scrollY = scrollY;
      const snapshot = W.workoutTimerSnapshot?.();
      if (snapshot && snapshot.workoutId === String(st.current.id)) {
        st.current.timer = snapshot;
        st.current.timerEnd = snapshot.end;
      }
      workoutStore.checkpoint(st);
    } catch (e) {
      console.warn("Workout checkpoint failed", e);
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) checkpoint();
  });
  W.addEventListener("pagehide", checkpoint);
  W.addEventListener("pageshow", () => {
    workoutStore.restore(st);
    if (W.restoreWorkoutTimer) W.restoreWorkoutTimer();
    else if (st.current?.timerEnd > Date.now())
      timer((st.current.timerEnd - Date.now()) / 1000);
  });
  // input, not change: iOS may terminate before blur or unload fires.
  document.addEventListener("input", (event) => {
    const el = event.target,
      handler = el?.getAttribute?.("onchange") || "";
    const match = handler.match(/editSet\((\d+),(\d+),'([^']+)'/);
    if (match) editSet(+match[1], +match[2], match[3], el.value, el);
  });
  let scrollFrame = 0;
  W.addEventListener(
    "scroll",
    () => {
      if (
        scrollFrame ||
        !st.current ||
        !document.querySelector("#start.active")
      )
        return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        checkpoint();
      });
    },
    { passive: true },
  );
  W.addEventListener("storage", (event) => {
    if (event.key !== WorkoutStore.DRAFT) return;
    const before = st.current?.updatedAt || 0;
    workoutStore.restore(st);
    if ((st.current?.updatedAt || 0) > before) W.startPage?.();
  });
  W.addEventListener("unvrsl:app-ready", () => {
    if (W.restoreWorkoutTimer) W.restoreWorkoutTimer();
    else if (st.current?.timerEnd > Date.now())
      timer((st.current.timerEnd - Date.now()) / 1000);
    W.showWorkoutDraft?.();
  });
})();
