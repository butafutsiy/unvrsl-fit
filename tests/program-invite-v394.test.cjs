"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function fixture() {
  const alerts = [], state = { programs: [{ id: "local-plan", name: "Новый план", weeks: [{ days: [] }] }] }, calls = [];
  const context = {
    window: { shareProgram() {}, renderProgramEditor() {}, planPage() {}, beginProgramDay() {} },
    st: state, cloud: { user: { id: "trainer" }, invite: "token", ready: false },
    cloudConfigured: () => true, trainerIsTrainer: () => true,
    programById: id => state.programs.find(p => p.id === id),
    cloudEnsureProfile: async () => ({ id: "client" }),
    trainerCloudPlanForProgram: async p => { calls.push({ name: p.name, weeks: p.weeks.length }); return { planId: "cloud-plan" }; },
    crypto: { randomUUID: () => "generated-token" },
    location: { origin: "https://app.test", pathname: "/unvrsl-fit/" },
    trainerShareSheet: (title, link) => calls.push({ title, link }),
    toast() {}, alert: message => alerts.push(message), save() { return true; },
    setTimeout() {}, console, JSON, Date, Array,
    uid: () => "client-plan", ensureProgramShape: p => p,
    allowAcceptedClientPlan: id => calls.push({ assigned: id }),
    history: { replaceState: () => calls.push({ cleared: true }) },
    closeModal() {}, render() {},
    persistWorkoutState: async () => true,
  };
  context.window.cloud = context.cloud;
  context.window.persistWorkoutState = context.persistWorkoutState;
  context.cloud.client = {
    from: table => ({ insert: row => ({ select: () => ({ single: async () => { calls.push({ table, row }); return { data: row }; } }) }) }),
    rpc: async () => ({ data: { snapshot: { kind: "coach-program", program: { name: "Новый план", weeks: [{ days: [] }] } }, plan_id: "cloud-plan", version: 2, trainer_id: "trainer", trainer: "Тренер" } }),
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("cloud-programs.js", "utf8"), context);
  return { context, calls, alerts, state };
}

test("sharing a plan publishes the canonical snapshot and makes a usable link", async () => {
  const { context, calls, alerts } = fixture();
  await vm.runInContext('cloudShareProgram("local-plan")', context);
  assert.equal(calls.find(x => x.weeks)?.weeks, 1);
  assert.equal(calls.find(x => x.table === "plan_invites")?.row.plan_id, "cloud-plan");
  assert.match(calls.find(x => x.link).link, /\?invite=generatedtoken$/);
  assert.deepEqual(alerts, []);
});

test("recipient profile precedes acceptance; repeated tap cannot consume invite twice", async () => {
  const { context, calls, state, alerts } = fixture();
  context.cloud.user = { id: "client" };
  let release;
  context.cloudEnsureProfile = async () => { await new Promise(resolve => release = resolve); calls.push({ profile: true }); };
  let accepted = 0;
  context.cloud.client.rpc = async () => { accepted++; assert.ok(calls.some(x => x.profile)); return { data: { snapshot: { kind: "coach-program", program: { name: "Новый план", weeks: [{ days: [] }] } }, plan_id: "cloud-plan", version: 2, trainer_id: "trainer" } }; };
  const first = vm.runInContext('cloudAcceptInviteProgramAware()', context);
  await vm.runInContext('cloudAcceptInviteProgramAware()', context);
  assert.equal(accepted, 0);
  release();
  await first;
  assert.equal(accepted, 1);
  assert.equal(state.programs.filter(x => x.cloudPlanId === "cloud-plan").length, 1);
  assert.deepEqual(alerts, []);
});
