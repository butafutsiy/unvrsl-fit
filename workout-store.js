"use strict";
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkoutStore = api;
})(typeof window === "undefined" ? null : window, () => {
  const PRIMARY = "unvrsl-fit-v3",
    DRAFT = "unvrsl-active-workout-v4";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const parse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  function create(
    storage,
    {
      now = Date.now,
      id = () => `s-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    } = {},
  ) {
    let recoveredJournal = null;
    function hydrateJournal(value) {
      recoveredJournal = clone(value);
    }
    function journal() {
      return (
        recoveredJournal || parse(storage.getItem(DRAFT)) || {
          schemaVersion: 4,
          owners: {},
          closed: {},
        }
      );
    }
    function owner(session) {
      return String(session?.userId || "local");
    }
    function checkpoint(state) {
      const s = state.current;
      if (!s) return;
      const j = journal(),
        key = owner(s),
        old = j.owners[key];
      if (old && old.id !== s.id && !j.closed[old.id])
        throw new Error("Сначала завершите или удалите сохранённую тренировку");
      if (!s.id) s.id = id();
      s.activeWorkoutId = s.id;
      s.updatedAt = now();
      s.schemaVersion = 4;
      for (const [other, draft] of Object.entries(j.owners))
        if (other !== key && draft.id === s.id) delete j.owners[other];
      j.owners[key] = clone(s);
      storage.setItem(DRAFT, JSON.stringify(j));
      recoveredJournal = null;
    }
    function save(state) {
      checkpoint(state);
      storage.setItem(PRIMARY, JSON.stringify(state));
      return true;
    }
    function restore(state, userId) {
      const j = journal(),
        key = String(userId || state.current?.userId || "local"),
        saved = j.owners[key];
      if (
        saved &&
        !j.closed[saved.id] &&
        (!state.current ||
          (state.current.id === saved.id &&
            (saved.updatedAt || 0) > (state.current.updatedAt || 0)))
      )
        state.current = clone(saved);
      if (state.current && j.closed[state.current.id]) state.current = null;
      return state.current;
    }
    function close(state, s, reason) {
      const j = journal();
      j.closed[s.id] = { at: now(), reason };
      if (j.owners[owner(s)]?.id === s.id) delete j.owners[owner(s)];
      storage.setItem(PRIMARY, JSON.stringify({ ...state, current: null }));
      try {
        storage.setItem(DRAFT, JSON.stringify(j));
        recoveredJournal = null;
      } catch (error) {
        storage.setItem(PRIMARY, JSON.stringify(state));
        throw error;
      }
      state.current = null;
    }
    function discard(state) {
      const s = state.current;
      if (!s) return;
      close(state, s, "discarded");
    }
    function activateAccount(state, userId, previousOwner) {
      const previous = state.accountOwnerId || previousOwner;
      if (previous && previous !== userId) {
        save(state);
        storage.setItem(
          "unvrsl-account-state-v4:" + previous,
          JSON.stringify(state),
        );
        state = parse(storage.getItem("unvrsl-account-state-v4:" + userId)) || {
          schemaVersion: 4,
          bw: [],
          sessions: [],
          programs: [],
          remotePlans: [],
          favorites: [],
          recentExercises: [],
          customExercises: [],
          hiddenExercises: [],
          readinessLog: [],
          planAdds: {},
          aliases: {},
          nextSuggestions: {},
          current: null,
          week: 1,
          accent: state.accent || "#30d158",
          theme: state.theme || "dark",
          body: state.body || "male",
          created: now(),
        };
      }
      if (state.current?.userId && state.current.userId !== userId) {
        checkpoint(state);
        state.current = null;
      }
      state.accountOwnerId = userId;
      restore(state, userId);
      save(state);
      return state;
    }
    let completing = null;
    async function finish(
      state,
      { persist = save, sync = null, userId = null } = {},
    ) {
      if (completing) return completing;
      const active = state.current;
      if (!active) return null;
      if (active.userId && userId && active.userId !== userId)
        throw new Error("Войдите в аккаунт владельца тренировки");
      completing = (async () => {
        checkpoint(state);
        active.pendingCompletion = true;
        active.ended = active.ended || now();
        if ((await persist(state)) === false)
          throw new Error("Не удалось сохранить данные");
        const result = clone(active);
        delete result.pendingCompletion;
        delete result.syncError;
        result.syncStatus = sync ? "synced" : "local";
        if (sync) {
          try {
            if ((await sync(result)) !== true)
              throw new Error("Не удалось сохранить тренировку в облаке");
          } catch (error) {
            active.syncError = String(error.message || error);
            await persist(state);
            throw error;
          }
        }
        const list = state.sessions || (state.sessions = []),
          index = list.findIndex((x) => String(x.id) === String(result.id));
        if (index < 0) list.push(result);
        else list[index] = result;
        if ((await persist(state)) === false)
          throw new Error("Не удалось сохранить результат");
        close(state, active, "completed");
        return result;
      })().finally(() => {
        completing = null;
      });
      return completing;
    }

    return {
      save,
      checkpoint,
      restore,
      discard,
      finish,
      journal,
      hydrateJournal,
      activateAccount,
    };
  }
  return { create, PRIMARY, DRAFT };
});
