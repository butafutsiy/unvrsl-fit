const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "muscle-map-full.js"), "utf8");

function calculate(sessions) {
  const window = { __unvrslMuscleMapFullV176: false, addEventListener() {} };
  const document = {
    createElement: () => ({ style: {} }),
    head: { appendChild() {} },
    getElementById: () => null,
    addEventListener() {},
  };
  const context = {
    window,
    document,
    st: { bw: [] },
    workoutRegistry: { resolve: () => null },
    WorkoutDomain: { summary: (session) => ({ volume: session.volume || 0, unknownVolumeSets: session.unknown || 0 }) },
    getComputedStyle: () => ({ getPropertyValue: () => "#30d158" }),
    setTimeout() {},
    console,
    Date,
    Map,
    Set,
    URL,
  };
  context.window.WorkoutDomain = context.WorkoutDomain;
  vm.runInNewContext(source, context);
  return window.unvrslMuscleMapCalculate211(sessions, 7);
}

test("tonnage uses completed cloud sessions whose dates are ISO strings", () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const result = calculate([
    { date, volume: 18400, ex: [{ n: "Приседания со штангой", set: [{ ok: true }, { ok: true }, { ok: false }] }] },
    { date, volume: 9000, unknown: 2, pendingCompletion: true, ex: [{ n: "Приседания", set: [{ ok: true }] }] },
  ]);
  assert.equal(result.volume, 18400);
  assert.equal(result.sets, 2);
  assert.equal(result.unknownVolumeSets, 0);
  assert.ok(result.scores.get("quadriceps") > 0);
});

test("tonnage surfaces unknown loads without presenting them as zero kg", () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const result = calculate([{ date, volume: 0, unknown: 3, ex: [{ n: "Зашагивания на платформу", set: [{ ok: true }] }] }]);
  assert.equal(result.volume, 0);
  assert.equal(result.unknownVolumeSets, 3);
});
