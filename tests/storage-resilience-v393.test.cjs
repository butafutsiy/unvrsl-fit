"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");

const { memoryIndexedDB } = require("./storage-fixture.cjs");

test("iOS quota fallback remains durable and does not interrupt navigation", async () => {
  const indexed = memoryIndexedDB(),
    notices = [],
    state = {
      sessions: [],
      current: { id: "active-ios", userId: null, ex: [], updatedAt: 1 },
    },
    journal = { schemaVersion: 4, owners: {}, closed: {} },
    quota = Object.assign(new Error("Quota exceeded"), {
      name: "QuotaExceededError",
    }),
    localStorage = {
      getItem: () => null,
      setItem: () => {
        throw quota;
      },
    },
    window = {
      indexedDB: indexed,
      __unvrslHadPrimaryStorageV386: true,
      addEventListener() {},
      dispatchEvent() {},
    },
    context = {
      window,
      indexedDB: indexed,
      localStorage,
      st: state,
      save() {
        throw quota;
      },
      workoutStore: {
        journal: () => journal,
        restore() {},
        save() {},
        checkpoint() {},
      },
      WorkoutStore: {
        DRAFT: "unvrsl-active-workout-v4",
      },
      WorkoutDomain: { migrate() {} },
      workoutRegistry: {},
      document: {
        hidden: false,
        addEventListener() {},
        querySelector: () => null,
      },
      CustomEvent: class {},
      toast: (message) => notices.push(message),
      console,
      Date,
      JSON,
      Promise,
      setTimeout,
      clearTimeout,
      requestAnimationFrame: (fn) => setTimeout(fn, 0),
      scrollY: 0,
      structuredClone,
    };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.resolve(__dirname, "../storage-resilience.js"), "utf8"),
    context,
  );

  let opened = false;
  assert.doesNotThrow(() => {
    context.save({ draftOnly: true });
    opened = true;
  });
  assert.equal(opened, true);
  assert.equal(await window.persistWorkoutState(), true);
  assert.equal(window.__unvrslStorageModeV393, "indexeddb");
  assert.equal(
    indexed.stores.get("state").get("latest").state.current.id,
    "active-ios",
  );
  assert.equal(
    indexed.stores.get("state").get("drafts").state.owners.local.id,
    "active-ios",
  );
  assert.ok(notices.includes("Данные сохранены в резервное хранилище"));
});
