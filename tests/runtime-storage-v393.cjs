"use strict";
const assert = require("node:assert/strict");
const { make, wait, errors } = require("./runtime-v392.cjs");
const { memoryIndexedDB } = require("./storage-fixture.cjs");
(async () => {
  const indexedDB = memoryIndexedDB();
  const seed = { "unvrsl-fit-v3": JSON.stringify({
    bw: [], week: 1, sessions: [{ id: "legacy", date: "2026-09-01", started: 1, ended: 2,
      ex: [{ n: "Подтягивания", set: [{ w: 0, r: 10, rpe: 8, ok: true }] }] }],
    current: null, programs: [],
  }) };
  const first = make(seed, { indexedDB, quota: true });
  await wait(2800);
  const w = first.window;
  assert.equal(w.__unvrslStartupComplete, true);
  w.document.querySelector('.nav button[data-p="exercises"]').click();
  assert.equal(w.document.querySelector('.page.active').id, 'exercises');
  assert.equal(w.document.querySelectorAll('.catalog392-row').length, 24);
  w.openExerciseDetail('canon:weighted_pushup');
  assert.ok(w.document.querySelector('#sheet img[data-exercise-media]'));
  w.closeModal();
  w.st.current = { id: "ios-draft", started: Date.now(), date: "2026-09-23", name: "iOS",
    ex: [{ n: "Подтягивания", loadType: "bodyweight_added", set: [{ w: 0, r: 8, rpe: "", rir: "", ok: false }] }] };
  w.document.querySelector('.nav button[data-p="start"]').click();
  assert.equal(w.document.querySelector('.page.active').id, 'start');
  w.editSet(0, 0, 'r', '12');
  assert.equal(await w.persistWorkoutState(), true);
  assert.equal(w.__unvrslStorageModeV393, 'indexeddb');
  w.__disconnectTestObservers();
  first.window.close();
  const second = make(seed, { indexedDB, quota: true });
  await wait(2800);
  assert.equal(second.window.__unvrslStartupComplete, true);
  assert.equal(second.window.st.current.id, 'ios-draft');
  assert.equal(second.window.st.current.ex[0].set[0].r, 12);
  assert.equal(second.window.st.sessions[0].id, 'legacy');
  assert.deepEqual(errors, []);
  second.window.close();
  console.log('PASS: legacy migration, real navigation clicks, exercise detail, draft write and reload under localStorage quota');
})().then(() => process.exit(0), error => { console.error(error, errors); process.exit(1); });
