"use strict";
(() => {
  const W = window;
  const initialRevision = Number(st.storageRevision || 0);
  let hydrating = true;
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
      if (snapshot)
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
  async function readMirror(key) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const q = d.transaction("state").objectStore("state").get(key);
      q.onsuccess = () => resolve(q.result || null);
      q.onerror = () => reject(q.error);
    });
  }
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function draftSnapshot() {
    let journal;
    try {
      journal = clone(workoutStore.journal());
    } catch (_) {
      journal = { schemaVersion: 4, owners: {}, closed: {} };
    }
    journal.schemaVersion = 4;
    journal.owners = journal.owners || {};
    journal.closed = journal.closed || {};
    if (st.current) {
      const key = String(st.current.userId || "local"),
        old = journal.owners[key];
      if (old && old.id !== st.current.id && !journal.closed[old.id]) {
        // Never replace an existing active workout implicitly.
        return journal;
      }
      journal.owners[key] = clone(st.current);
    }
    return journal;
  }
  async function recover() {
    try {
      const [record, draftRecord] = await Promise.all([
        readMirror("latest"),
        readMirror("drafts"),
      ]);
      const localRevision = initialRevision,
        mirrorRevision = Number(record?.state?.storageRevision || 0),
        shouldRestore =
          !!record?.state &&
          (!W.__unvrslHadPrimaryStorageV386 || mirrorRevision > localRevision);
      if (shouldRestore) {
        if (draftRecord?.state) workoutStore.hydrateJournal?.(draftRecord.state);
        if (draftRecord?.state)
          try {
            localStorage.setItem(
              WorkoutStore.DRAFT,
              JSON.stringify(draftRecord.state),
            );
          } catch (_) {}
        st = record.state;
        WorkoutDomain.migrate(st, workoutRegistry);
        workoutStore.restore(st);
        restoreAppearance(st.accountOwnerId);
        try {
          workoutStore.save(st);
        } catch (_) {
          // The IndexedDB copy remains authoritative when Safari storage is full.
        }
      }
    } catch (e) {
      console.warn("Recovery unavailable", e);
    }
  }
  const base = save;
  let pending = Promise.resolve();
  let durable = Promise.resolve(true),
    fallbackNoticeShown = false,
    fallbackErrorShown = false;
  W.save = save = function (options = {}) {
    if (hydrating) {
      // Boot migrations must not overwrite a newer durable fallback before
      // its read transaction has finished.
      durable = recovery.then(() => {
        save(options);
        return durable;
      });
      return true;
    }
    st.storageRevision = Math.max(
      Date.now(),
      Number(st.storageRevision || 0) + 1,
    );
    let localError = null;
    try {
      base(options);
    } catch (e) {
      localError = e;
    }
    if (localError && !/QuotaExceeded|SecurityError|NS_ERROR_DOM_QUOTA_REACHED/.test(localError.name || "")) {
      console.error("UNVRSL save conflict", localError);
      toast(String(localError.message || "Не удалось сохранить изменения"));
      durable = Promise.resolve(false);
      return false;
    }
    const snapshot = !options.draftOnly || localError ? clone(st) : null;
    const drafts = draftSnapshot();
    pending = pending
      .catch(() => {})
      .then(() => mirror(snapshot, "latest", drafts));
    pending.catch(() => {});
    if (localError) {
      durable = pending.then(
        () => {
          W.__unvrslStorageModeV393 = "indexeddb";
          if (!fallbackNoticeShown) {
            fallbackNoticeShown = true;
            toast("Данные сохранены в резервное хранилище");
          }
          return true;
        },
        (error) => {
          W.__unvrslStorageModeV393 = "memory-only";
          if (!fallbackErrorShown) {
            fallbackErrorShown = true;
            toast("Не удалось сохранить данные. Оставьте приложение открытым");
          }
          console.error("UNVRSL durable storage unavailable", error, localError);
          return false;
        },
      );
      // Do not interrupt navigation or opening a workout/exercise. Callers
      // that finalize a workout await persistWorkoutState below.
      return true;
    }
    W.__unvrslStorageModeV393 = "localstorage";
    durable = Promise.resolve(true);
    return true;
  };
  W.persistWorkoutState = async () => {
    await recovery;
    save();
    return durable;
  };
  W.closeWorkoutDraft = async (state, session, reason) => {
    await recovery;
    if (!session || state.current?.id !== session.id) return false;
    const journal = clone(workoutStore.journal());
    journal.schemaVersion = 4;
    journal.owners ||= {};
    journal.closed ||= {};
    journal.closed[session.id] = { at: Date.now(), reason };
    const owner = String(session.userId || "local");
    if (journal.owners[owner]?.id === session.id) delete journal.owners[owner];
    const closed = {
      ...state,
      current: null,
      storageRevision: Math.max(Date.now(), Number(state.storageRevision || 0) + 1),
    };
    // Both records must commit in one IndexedDB transaction. A write failure
    // leaves the in-memory draft untouched so the user can try again.
    try {
      pending = pending.catch(() => {}).then(() => mirror(clone(closed), "latest", journal));
      await pending;
    } catch (error) {
      console.warn("Could not close workout draft", error);
      // Private browsing can disable IndexedDB while localStorage still works.
      const previousRevision = state.storageRevision;
      try {
        state.storageRevision = closed.storageRevision;
        workoutStore.close(state, session, reason);
        return true;
      } catch (_) {
        state.storageRevision = previousRevision;
      }
      return false;
    }
    workoutStore.hydrateJournal(journal);
    Object.assign(state, { current: null, storageRevision: closed.storageRevision });
    try {
      localStorage.setItem(WorkoutStore.PRIMARY, JSON.stringify(closed));
      localStorage.setItem(WorkoutStore.DRAFT, JSON.stringify(journal));
    } catch (_) {
      W.__unvrslStorageModeV393 = "indexeddb";
    }
    return true;
  };
  const recovery = recover().finally(() => {
    hydrating = false;
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
      save({ draftOnly: true });
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
