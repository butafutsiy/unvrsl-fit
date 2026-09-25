"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const A = require("../workout-domain"),
  S = require("../workout-store");
const context = { window: {} };
vm.runInNewContext(
  fs.readFileSync(require.resolve("../exercise-catalog.js"), "utf8"),
  context,
);
const catalog = JSON.parse(JSON.stringify(context.window.UNVRSL_EXERCISES)),
  reg = A.registry(catalog);
const pull = {
    n: "Подтягивания с дополнительным весом",
    loadType: "bodyweight_added",
  },
  bar = { n: "Жим штанги лёжа", loadType: "external_total" },
  assist = { n: "Подтягивания в гравитроне", loadType: "bodyweight_assisted" };
const set = (w = 0, r = 10, extra = {}) => ({
  w,
  r,
  ok: true,
  rpe: "",
  rir: "",
  ...extra,
});
const session = (ex = [{ ...pull, set: [set()] }], extra = {}) => ({
  id: "current",
  started: 100,
  date: "2026-09-19",
  ended: 200,
  ex,
  ...extra,
});
const storage = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
};
const prior = (weight, reps = 15, rpe = 7, extra = {}) =>
  [1, 2, 3].map((i) =>
    session(
      [
        {
          ...bar,
          set: [set(weight, reps, { rpe }), set(weight, reps, { rpe })],
        },
      ],
      { id: "s" + i, started: i, programId: "p" + i, ...extra },
    ),
  );
test("manual maximum uses the same rules as completed sets without writing a record", () => {
  assert.equal(A.manualOneRepMax(bar, 60, 8, reg), 76);
  assert.equal(A.manualOneRepMax(pull, 0, 8, reg, 90), 114);
  assert.equal(A.manualOneRepMax(pull, 10, 8, reg, 90), 126.7);
  assert.equal(A.manualOneRepMax(assist, 25, 6, reg, 90), null);
  assert.equal(A.manualOneRepMax(pull, 0, 8, reg), null);
  assert.equal(A.manualOneRepMax(bar, 60, 13, reg), null);
});
test("1 + 27 + 28: bodyweight zero is a real value, never a fake 1 kg", () => {
  assert.equal(A.validSet(pull, set(0), reg), true);
  assert.equal(A.number(0), 0);
  assert.equal(A.number(""), null);
  assert.equal(A.setLabel(pull, set(0), reg), "Собственный вес × 10");
  assert.equal(A.validSet(pull, set(-1), reg), false);
});
test("2: RPE and RIR are optional", () =>
  assert.equal(
    A.complete(pull, set(0, 10, { rpe: undefined, rir: undefined }), reg),
    true,
  ));
test("3: added weight remains distinct from body mass", () => {
  assert.equal(
    A.effectiveLoad(pull, set(10, 8), session(), reg, [
      { d: "2026-09-01", w: 90 },
    ]),
    100,
  );
  assert.equal(
    A.setLabel(pull, set(10, 8), reg),
    "Собственный вес + 10 кг × 8",
  );
});
test("4: assistance is subtracted, progress reduces assistance", () => {
  assert.equal(
    A.effectiveLoad(assist, set(25, 12), session(), reg, [
      { d: "2026-09-01", w: 90 },
    ]),
    65,
  );
  const h = prior(25).map((s) => ({
    ...s,
    ex: s.ex.map((e) => ({ ...e, ...assist })),
  }));
  assert.equal(
    A.recommend(
      assist,
      set(25, 15, { targetRepMin: 8, targetRepMax: 15 }),
      session(),
      h,
      reg,
    ).weight,
    22.5,
  );
});
test("5 + 6: reload / process restart preserves full draft and timer identity", () => {
  const mem = storage(),
    db = S.create(mem),
    state = {
      sessions: [],
      current: session(undefined, {
        ended: null,
        timerEnd: 999,
        scrollY: 700,
        comments: "keep",
        readiness: { factor: 0.9 },
      }),
    };
  db.save(state);
  const reloaded = JSON.parse(mem.getItem(S.PRIMARY));
  S.create(mem).restore(reloaded);
  assert.deepEqual(reloaded.current, state.current);
  assert.equal(reloaded.current.activeWorkoutId, "current");
});
test("7: sync failure preserves draft, successful retry saves exactly once", async () => {
  const mem = storage(),
    db = S.create(mem),
    state = { sessions: [], current: session(undefined, { ended: null }) };
  await assert.rejects(db.finish(state, { sync: async () => false }));
  assert.ok(state.current);
  assert.ok(db.journal().owners.local);
  assert.equal(state.sessions.length, 0);
  await db.finish(state, { sync: async () => true });
  assert.equal(state.current, null);
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].syncStatus, "synced");
  assert.equal(state.sessions[0].pendingCompletion, undefined);
  assert.equal(A.history(pull, state.sessions, reg).length, 1);
});
test("8: repeated restore retains same active ID; parallel finish deduplicates", async () => {
  const mem = storage(),
    db = S.create(mem),
    state = { sessions: [], current: session(undefined, { ended: null }) };
  db.save(state);
  db.restore(state);
  db.restore(state);
  const [a, b] = await Promise.all([db.finish(state), db.finish(state)]);
  assert.equal(a.id, b.id);
  assert.equal(state.sessions.length, 1);
});
test("9 + 10 + 11 + 25: results exclude skipped exercises, empty and incomplete sets", () => {
  const r = A.summary(
    session([
      { ...pull, set: [set(0, 10), set(0, 8, { ok: false })] },
      { ...bar, set: [set(60, 10, { ok: false })] },
      { n: "Пустое", set: [] },
    ]),
    [],
    reg,
  );
  assert.equal(r.exerciseCount, 1);
  assert.equal(r.setCount, 1);
  assert.equal(r.exercises[0].sets.length, 1);
});
test("12: explicit 8–15 range is preserved", () =>
  assert.deepEqual(
    A.repRange(bar, { targetRepMin: 8, targetRepMax: 15, r: 8 }),
    { lo: 8, hi: 15 },
  ));
test("13: warmup does not inflate working volume or 1RM", () => {
  const s = session([
    { ...bar, set: [set(100, 8, { warmup: true }), set(60, 10)] },
  ]);
  assert.equal(A.summary(s, [], reg).volume, 600);
  assert.equal(A.e1rm(bar, s.ex[0].set[0], s, reg), null);
});
for (const [num, method] of [
  [14, "DS"],
  [15, "UNVRSL"],
  [29, "SLDR"],
  [30, "FST-7"],
])
  test(`${num}: ${method} does not create a standard-set PR or 1RM`, () => {
    const e = { ...bar, method, set: [set(100, 10)] },
      s = session([e]);
    assert.equal(A.e1rm(e, e.set[0], s, reg), null);
    assert.equal(A.summary(s, prior(60), reg).records.length, 0);
    assert.equal(A.summary(s, [], reg).setCount, 1);
  });
test("16: stable ID survives renaming", () => {
  const row = reg.resolve(bar);
  assert.equal(
    reg.identity({ exerciseId: row.id, n: "Новое название" }),
    row.id,
  );
});
test("17: legacy alias resolves without changing prescription", () => {
  assert.equal(reg.identity({ n: "Жим лёжа" }), reg.identity(bar));
  const s = {
    sessions: [session([{ n: "Жим лёжа", set: [set(60, 8)] }])],
    programs: [{ id: "keep" }],
  };
  A.migrate(s, reg);
  assert.equal(s.sessions[0].ex[0].n, "Жим лёжа");
  assert.equal(s.sessions[0].ex[0].set[0].w, 60);
  const saved = JSON.stringify(s);
  A.migrate(s, reg);
  assert.equal(JSON.stringify(s), saved);
});
test("18: all programs contribute to one exercise history, IDs deduplicate", () => {
  const h = prior(60);
  assert.equal(A.history(bar, [...h, h[0]], reg).length, 6);
});
test("19: asynchronous auto weights cannot overwrite manual input", () => {
  const s = set(61, 10, { ok: false, manualOverride: true });
  assert.equal(A.applyAuto(s, { weight: 10 }), false);
  assert.equal(s.w, 61);
});
test("20: individual equipment increment used for recommendation and buttons", () => {
  const overrides = { [reg.identity(bar)]: { step: 2.5 } };
  const r = A.recommend(
    bar,
    set(60, 15, { targetRepMin: 8, targetRepMax: 15 }),
    session(),
    prior(60),
    reg,
    overrides,
  );
  assert.equal(r.weight, 62.5);
  assert.equal(A.moveWeight(60, 1, A.profile(bar, reg, overrides)), 62.5);
  assert.equal(
    A.roundWeight(61.4, { step: 2.5, min: 0, rounding: "nearest" }),
    62.5,
  );
});
test("21: dumbbell weight is not doubled in recommendations or 1RM", () => {
  const e = {
    n: "Жим гантелей лёжа",
    loadType: "per_dumbbell",
    implementCount: 2,
  };
  const s = set(20, 10);
  assert.equal(A.e1rm(e, s, session(), reg), 26.7);
  assert.equal(A.effectiveLoad(e, s, session(), reg), 40);
});
test("22: per-side recording requires side count and implement weight for total volume", () => {
  const e = { loadType: "per_side", n: "Machine" };
  assert.equal(A.effectiveLoad(e, set(20), session(), reg), null);
  assert.equal(
    A.effectiveLoad(
      { ...e, loadedSides: 2, implementWeight: 10 },
      set(20),
      session(),
      reg,
    ),
    50,
  );
});
test("26: PR is based on actual completed work with an existing baseline", () => {
  const s = session([
    { ...bar, set: [set(65, 10), set(100, 20, { ok: false })] },
  ]);
  const report = A.summary(s, prior(60, 10), reg);
  assert.equal(report.records.length, 1);
  assert.match(report.records[0].label, /65 кг × 10/);
  assert.equal(A.summary(s, [], reg).records.length, 0);
});
test("unknown bodyweight never borrows a future measurement", () =>
  assert.equal(
    A.effectiveLoad(pull, set(), session(), reg, [{ d: "2026-10-01", w: 90 }]),
    null,
  ));
test("different methods, machines and load conventions are not mixed", () => {
  const h = prior(60).map((s) => ({
    ...s,
    ex: s.ex.map((e) => ({ ...e, method: "DS" })),
  }));
  assert.equal(
    A.recommend(bar, set(60), session(), h, reg).sessionIds.length,
    0,
  );
});
test("low confidence without effort data, without blocking completion", () => {
  const r = A.recommend(bar, set(60, 15), session(), prior(60, 15, ""), reg);
  assert.equal(r.confidence, "низкая");
  assert.ok(r.weight >= 60);
});
test("no history preserves an off-grid manually chosen current load", () => {
  const r = A.recommend(bar, set(61.4, 10), session(), [], reg);
  assert.equal(r.previous, null);
  assert.equal(r.weight, 61.4);
  assert.match(r.reason, /Недостаточно/);
});
test("old deleted draft is not resurrected after cancellation", () => {
  const mem = storage(),
    db = S.create(mem),
    state = { sessions: [], current: session(undefined, { ended: null }) };
  db.save(state);
  const old = JSON.parse(mem.getItem(S.PRIMARY));
  db.discard(state);
  db.restore(old);
  assert.equal(old.current, null);
});
test("storage error does not clear the draft", async () => {
  const mem = storage(),
    db = S.create(mem),
    state = { sessions: [], current: session(undefined, { ended: null }) };
  db.save(state);
  await assert.rejects(db.finish(state, { persist: async () => false }));
  assert.ok(state.current);
  assert.ok(db.journal().owners.local);
});
test("replacement session cannot silently overwrite a draft", () => {
  const mem = storage(),
    db = S.create(mem),
    state = { sessions: [], current: session(undefined, { ended: null }) };
  db.save(state);
  state.current = session(undefined, { id: "other", ended: null });
  assert.throws(() => db.save(state), /Сначала/);
  assert.equal(db.journal().owners.local.id, "current");
});
test("all 189 stable catalog IDs are unique and weight profiles are explicit", () => {
  assert.equal(catalog.length, 189);
  assert.equal(new Set(catalog.map((x) => x.id)).size, 189);
  for (const e of catalog) {
    assert.ok(e.loadType, e.n);
    assert.ok(e.weightProfile.step > 0, e.n);
    assert.ok(e.resultRule, e.n);
    assert.ok(e.coaching?.cues?.length >= 3, e.n);
    assert.ok(e.coaching?.mistakes?.length >= 3, e.n);
  }
});

test("UNVRSL heavy and light phases cannot exchange working weights", () => {
  const e = { ...bar, n: bar.n + " — UNVRSL 3/9" };
  const h = prior(10).map((s) => ({
    ...s,
    ex: s.ex.map((x) => ({ ...x, n: bar.n + " — UNVRSL 9/3" })),
  }));
  assert.equal(A.recommend(e, set(60), session(), h, reg).weight, 60);
});
test("historical PR excludes future sessions", () => {
  const current = session([{ ...bar, set: [set(65, 10)] }], { started: 100 });
  const h = [
    ...prior(60, 10),
    session([{ ...bar, set: [set(100, 10)] }], { id: "future", started: 1000 }),
  ];
  assert.equal(A.summary(current, h, reg).records.length, 1);
});
test("strength statistics and summary use the same completed standard work", () => {
  const s = session([
    {
      ...bar,
      set: [
        set(60, 10),
        set(100, 10, { ok: false }),
        set(80, 10, { warmup: true }),
        set(90, 10, { method: "DS" }),
      ],
    },
  ]);
  const series = A.strengthSeries([s], reg);
  assert.equal(series[0].sets, 1);
  assert.equal(series[0].best, 80);
  assert.equal(series[0].points[0].volume, 600);
});
test("unknown legacy session IDs do not collapse independent history", () => {
  const h = prior(60).map((s) => ({ ...s, id: undefined }));
  assert.equal(A.history(bar, h, reg).length, 6);
});
test("one abnormal historical session cannot collapse a 60 kg starting load", () =>
  assert.equal(
    A.recommend(bar, set(60), session(), prior(10).slice(0, 1), reg).weight,
    60,
  ));

test("switching accounts preserves private history and active drafts per owner", () => {
  const mem = storage(),
    db = S.create(mem);
  const a = {
    accountOwnerId: "a",
    sessions: [session(undefined, { id: "finished-a", userId: "a" })],
    programs: [{ id: "a-plan" }],
    current: session(undefined, { ended: null, userId: "a" }),
  };
  db.save(a);
  const b = db.activateAccount(a, "b");
  assert.equal(b.current, null);
  assert.equal(b.sessions.length, 0);
  b.current = session(undefined, { id: "b-draft", userId: "b", ended: null });
  db.save(b);
  const restored = db.activateAccount(b, "a");
  assert.equal(restored.current.id, "current");
  assert.equal(restored.sessions[0].id, "finished-a");
  assert.equal(restored.programs[0].id, "a-plan");
  assert.equal(db.journal().owners.b.id, "b-draft");
});

test("next set recommendation uses actual current work and the same individual step", () => {
  const e = {
      ...bar,
      set: [
        set(60, 5, { rpe: 10 }),
        set(60, 10, { ok: false, targetRepMin: 8, targetRepMax: 15 }),
      ],
    },
    cur = session([e], { ended: null });
  const r = A.recommend(e, e.set[1], cur, prior(60), reg);
  assert.equal(r.nextSetSuggestion.weight, 57.5);
  assert.equal(r.nextSetSuggestion.action, 'down');
  assert.ok(r.weight >= 60);
  assert.ok(r.evidence.some((x) => x.startsWith("Сегодня:")));
});
test("three comparable stable workouts produce an explicit plateau explanation", () => {
  const r = A.recommend(
    bar,
    set(60, 10, { targetRepMin: 8, targetRepMax: 15 }),
    session(),
    prior(60, 10, 8),
    reg,
  );
  assert.equal(r.trend, "plateau");
  assert.equal(r.weight, 60);
});

test("weighted dips record the plate separately and calculate 1RM from actual body mass", () => {
  const dip = reg.resolve("canon:weighted_dip");
  assert.equal(dip.loadType, "bodyweight_added");
  assert.equal(dip.weightProfile.step, 2.5);
  assert.equal(A.manualOneRepMax(dip, 20, 6, reg, 80), 120);
  assert.equal(A.manualOneRepMax(dip, 0, 6, reg), null);
  assert.equal(A.manualOneRepMax(dip, 0, 6, reg, 80), 96);
});
