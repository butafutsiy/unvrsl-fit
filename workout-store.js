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
  function mergeProgramLifecycle(target,local){
    if(!target||!local||target.accountOwnerId&&local.accountOwnerId&&target.accountOwnerId!==local.accountOwnerId)return target;
    for(const field of ['programDeletedAt','programRestoredAt','programPurgedAt','templateDeletedAt']){
      target[field]={...(target[field]||{})};
      for(const [key,value] of Object.entries(local[field]||{}))target[field][key]=Math.max(Number(value)||0,Number(target[field][key])||0);
    }
    target.builtinProgramPurgedAt=Math.max(Number(target.builtinProgramPurgedAt||0),Number(local.builtinProgramPurgedAt||0));
    const templates=new Map();for(const t of [...(target.programTemplates||[]),...(local.programTemplates||[])]){const old=templates.get(String(t.id));if(!target.templateDeletedAt['saved:'+t.id]&&(!old||Number(t.updated||t.created||0)>Number(old.updated||old.created||0)))templates.set(String(t.id),clone(t))}target.programTemplates=[...templates.values()];
    target.deletedProgramKeys=[...new Set([...(target.deletedProgramKeys||[]),...(local.deletedProgramKeys||[]),...Object.keys(target.programDeletedAt)])].filter(key=>Number(target.programRestoredAt[key]||0)<=Number(target.programDeletedAt[key]||0));
    const deleted=new Set(target.deletedProgramKeys),keys=p=>[p.id&&'id:'+p.id,!p.independentCopy&&p.seedId&&'seed:'+p.seedId,p.cloudPlanId&&'cloud:'+p.cloudPlanId,!p.independentCopy&&p.templateKey&&'template:'+p.templateKey,!p.independentCopy&&p.isMasterPlan&&'seed:master-trainer-plan',!p.independentCopy&&(p.seedId||p.internetTemplate||p.femaleTemplate||p.templateKey)&&p.name&&'name:'+String(p.name).toLowerCase().replace(/[·•]/g,' ').replace(/\s+/g,' ').trim()].filter(Boolean);
    const programs=new Map(),trash=new Map();
    for(const entry of [...(target.programTrash||[]),...(local.programTrash||[])])if(!trash.has(String(entry.id))||entry.deletedAt>trash.get(String(entry.id)).deletedAt)trash.set(String(entry.id),clone(entry));
    for(const p of [...(target.programs||[]),...(local.programs||[])]){
      if(keys(p).some(key=>deleted.has(key))){if(!trash.has(String(p.id)))trash.set(String(p.id),{id:String(p.id),program:clone(p),deletedAt:Math.max(1,...keys(p).map(key=>Number(target.programDeletedAt[key]||0)))});continue}
      const old=programs.get(String(p.id)),stamp=x=>Math.max(Number(x.updated||0),Number(x.updatedAt||0),Number(x.created||0));
      if(!old||stamp(p)>stamp(old))programs.set(String(p.id),clone(p));
    }
    target.programs=[...programs.values()];target.programTrash=[...trash.values()].filter(entry=>entry.program&&keys(entry.program).some(key=>deleted.has(key))&&Math.max(0,...keys(entry.program).map(key=>Number(target.programPurgedAt[key]||0)))<Number(entry.deletedAt||1));
    target.templateVisibility={...(target.templateVisibility||{})};
    for(const [key,value] of Object.entries(local.templateVisibility||{}))if(!target.templateVisibility[key]||Number(value.at||0)>Number(target.templateVisibility[key].at||0))target.templateVisibility[key]=clone(value);
    for(const field of ['primaryProgram','clientPrimaryProgram']){
      const stamp=field+'SelectedAt',key=field==='primaryProgram'?'primaryProgramId':'clientPrimaryProgramKey';
      if(Number(local[stamp]||0)>Number(target[stamp]||0)){target[stamp]=local[stamp];target[key]=local[key]}
    }
    if(Number(local.builtinProgramVisibilityUpdatedAt||0)>Number(target.builtinProgramVisibilityUpdatedAt||0)){target.builtinProgramHidden=local.builtinProgramHidden;target.builtinProgramVisibilityUpdatedAt=local.builtinProgramVisibilityUpdatedAt}
    return target;
  }
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
          accent: "#bf5af2",
          theme: "dark",
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
      { persist = save, sync = null, userId = null, closeDraft = close } = {},
    ) {
      if (completing) return completing;
      const active = state.current;
      if (!active) return null;
      if (active.userId && userId && active.userId !== userId)
        throw new Error("Войдите в аккаунт владельца тренировки");
      completing = (async () => {
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
        if ((await closeDraft(state, active, "completed")) === false)
          throw new Error("Не удалось закрыть черновик");
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
      close,
      finish,
      journal,
      hydrateJournal,
      activateAccount,
    };
  }
  return { create, PRIMARY, DRAFT, mergeProgramLifecycle };
});
