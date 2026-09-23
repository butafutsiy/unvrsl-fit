"use strict";
// Optional integration runner: npm install --prefix <runtime> jsdom@26.1.0
const { JSDOM, ResourceLoader, VirtualConsole } = require(
    process.env.UNVRSL_JSDOM || "jsdom",
  ),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = process.argv[2] || path.resolve(__dirname, "..");
const errors = [],
  loaded = [];
class Local extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith("http://app.test/")) return null;
    const file = new URL(url).pathname.slice(1),
      target = path.join(root, file);
    if (!fs.existsSync(target)) return null;
    loaded.push(file);
    return Promise.resolve(fs.readFileSync(target));
  }
}
const logs = new VirtualConsole();
logs.on("jsdomError", (e) => {
  if (process.env.TRACE_RUNTIME) console.error(e.detail?.stack || e.stack);
  if (!/Not implemented: (window.scroll|HTMLCanvas)/.test(e.message))
    errors.push(e.message);
});
logs.on("error", (e) => errors.push(String(e)));
function make(seed, options = {}) {
  return new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
    url: "http://app.test/",
    runScripts: "dangerously",
    resources: new Local(),
    pretendToBeVisual: true,
    virtualConsole: logs,
    beforeParse(w) {
      if (process.env.UNVRSL_CANVAS) {
        const { createCanvas, GlobalFonts } = require(
          process.env.UNVRSL_CANVAS,
        );
        for (const [file, family] of [
          ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "Arial"],
          ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "Arial"],
        ])
          if (fs.existsSync(file)) GlobalFonts.registerFromPath(file, family);
        const canvases = new WeakMap();
        const native = (el) => {
          let c = canvases.get(el);
          if (!c) {
            c = createCanvas(el.width, el.height);
            canvases.set(el, c);
          }
          return c;
        };
        w.HTMLCanvasElement.prototype.getContext = function (kind) {
          return native(this).getContext(kind);
        };
        w.HTMLCanvasElement.prototype.toDataURL = function () {
          return native(this).toDataURL("image/png");
        };
        w.HTMLCanvasElement.prototype.toBlob = function (callback) {
          const bytes = native(this).toBuffer("image/png");
          w.__unvrslTestCanvasBytes = bytes;
          setTimeout(() => callback(new w.Blob([bytes], { type: "image/png" })), 0);
        };
        const shareBlobs = new Map();
        let blobId = 0;
        w.URL.createObjectURL = (blob) => {
          const url = `blob:http://app.test/share-${++blobId}`;
          shareBlobs.set(url, blob);
          return url;
        };
        w.URL.revokeObjectURL = (url) => shareBlobs.delete(url);
        w.__unvrslTestShareBlobs = shareBlobs;
      }

      if (process.env.TRACE_OBSERVERS) {
        const Observer = w.MutationObserver;
        w.MutationObserver = class extends Observer {
          constructor(cb) {
            const at = new Error().stack;
            let count = 0;
            super((r, o) => {
              if (++count === 1000)
                console.error(
                  "observer target",
                  at.split("\n")[2],
                  r
                    .slice(0, 3)
                    .map(
                      (x) =>
                        x.target.outerHTML?.slice(0, 300) || x.target.nodeName,
                    ),
                );
              cb(r, o);
            });
          }
        };
      }
      w.matchMedia = () => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      });
      w.fetch = async (url) => {
        const target = path.join(root, String(url).replace(/^\.\//, ""));
        return String(url).startsWith("./data/") && fs.existsSync(target)
          ? {
              ok: true,
              json: async () => JSON.parse(fs.readFileSync(target, "utf8")),
            }
          : { ok: false, status: 503, json: async () => [] };
      };
      w.__mediaObservers = [];
      w.IntersectionObserver = class {
        constructor(cb) {
          this.cb = cb;
          this.targets = new Set();
          w.__mediaObservers.push(this);
        }
        observe(t) {
          this.targets.add(t);
        }
        unobserve(t) {
          this.targets.delete(t);
        }
        disconnect() {
          this.targets.clear();
        }
      };
      w.ResizeObserver = class {
        observe() {}
        disconnect() {}
      };
      w.requestIdleCallback = (f) => w.setTimeout(f, 0);
      w.scrollTo = () => {};
      w.structuredClone = structuredClone;
      w.confirm = () => true;
      if (options.indexedDB) w.indexedDB = options.indexedDB;
      if (seed)
        for (const [k, v] of Object.entries(seed)) w.localStorage.setItem(k, v);
      if (options.quota) {
        const observers = [], NativeObserver = w.MutationObserver;
        w.MutationObserver = class extends NativeObserver {
          constructor(callback) { super(callback); observers.push(this); }
        };
        w.__disconnectTestObservers = () => observers.forEach(o => o.disconnect());
        const original = w.Storage.prototype.setItem;
        w.Storage.prototype.setItem = function (key, value) {
          if (this === w.localStorage && /^(unvrsl-fit-v3|unvrsl-active-workout-v4)$/.test(key))
            throw new w.DOMException("Quota exceeded", "QuotaExceededError");
          return original.call(this, key, value);
        };
      }
    },
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = { make, wait, errors };
if (require.main === module) (async () => {
  const dom = make();
  await wait(2600);
  const w = dom.window,
    result = {
      kind: "DOM integration simulation, not a browser or iPhone",
      loaded: loaded.length,
      ready: w.__unvrslStartupComplete,
    };
  try {
    assert.ok(result.ready);
    assert.ok(loaded.includes("equipment-profiles-v405.js"),
      "equipment module must be loaded from its real filename");
    assert.equal(w.__equipmentProfilesV405, true,
      "equipment module must initialize during startup");
    w.document.getElementById("gear").click();
    assert.ok(w.document.querySelector("#sheet [data-cloud-settings]"),
      "cloud controls remain on the canonical settings screen");
    const lightTheme = [...w.document.querySelectorAll("#sheet .seg button")]
      .find((button) => button.textContent.includes("Светлая"));
    assert.ok(lightTheme, "settings expose the active light-theme control");
    assert.equal(lightTheme.disabled, false, "the light-theme control is enabled");
    lightTheme.click();
    assert.equal(w.document.documentElement.dataset.theme, "light");
    assert.equal(w.document.getElementById("modal").classList.contains("show"), false,
      "choosing a theme closes the settings overlay so navigation is available");
    assert.match(w.localStorage.getItem("unvrsl-fit-v3"), /"theme":"light"/,
      "theme preference is persisted");
    w.nav("stats");
    assert.equal(w.document.querySelector(".page.active")?.id, "stats");
    result.settingsThemeAndNavigation = true;
    assert.equal(w.catalogRecords().length, 188);
    result.catalog = 188;
    result.pages = {};
    for (const p of ["home", "exercises", "plan", "start", "stats"]) {
      const times = [];
      for (let i = 0; i < 5; i++) {
        const t = performance.now();
        w.nav(p);
        times.push(performance.now() - t);
      }
      result.pages[p] = times.sort((a, b) => a - b)[2];
    }
    assert.equal(
      w.document.querySelectorAll("#exList .catalog392-row").length,
      24,
    );
    assert.equal(w.document.querySelectorAll("#exList img[src]").length, 0);
    const img = w.document.querySelector("#exList img"),
      observer = w.__mediaObservers.find((x) => x.targets.has(img));
    observer.cb([{ target: img, isIntersecting: true }]);
    assert.equal(w.document.querySelectorAll("#exList img[src]").length, 1);
    w.openExerciseDetail(w.catalogRecords().find((x) => x.gif).id);
    const gif = w.document.querySelector("#sheet img[data-exercise-media]");
    observer.cb([{ target: gif, isIntersecting: true }]);
    assert.ok(gif.getAttribute("src"));
    observer.cb([{ target: gif, isIntersecting: false }]);
    assert.equal(gif.getAttribute("src"), null);
    w.closeModal();
    result.lazyMedia = true;
    const localGifById = {
      "canon:weighted_pushup": "assets/exercises/weighted-pushup-v396.gif",
      "canon:weighted_hyperextension": "assets/exercises/weighted-hyperextension-v396.gif",
      "canon:box_jump": "assets/exercises/box-jump-v396.gif",
    };
    for (const id of Object.keys(localGifById)) {
      const exercise = w.catalogRecords().find((x) => x.id === id);
      assert.ok(exercise.image.startsWith("assets/exercises/"));
      assert.equal(new URL(w.mediaUrl(exercise.image), w.location.href).pathname, "/" + exercise.image);
      w.openExerciseDetail(id);
      const media = w.document.querySelector("#sheet img[data-exercise-media]");
      assert.ok(media);
      observer.cb([{ target: media, isIntersecting: true }]);
      assert.equal(new URL(media.src).pathname, "/" + localGifById[id]);
      assert.ok(fs.existsSync(path.join(root, exercise.image)));
      assert.ok(fs.existsSync(path.join(root, localGifById[id])));
      w.closeModal();
    }
    result.localIllustrations = true;
    w.st.current = {
      id: "test-pullup",
      started: Date.now() - 120000,
      date: "2026-09-19",
      trainingEngineRevision: 295,
      ex: [
        {
          n: "Подтягивания с дополнительным весом",
          set: [{ w: 0, r: 10, rpe: "", rir: "", ok: false }],
        },
      ],
    };
    w.save();
    w.nav("start");
    await wait(80);
    assert.ok(w.document.querySelector("#start .exercise .eq405-control"),
      "the active exercise must show its equipment control");
    w.toggleSet(0, 0);
    assert.equal(w.st.current.ex[0].set[0].ok, true);
    result.zeroCompleted = true;
    w.editSet(0, 0, "w", "5");
    assert.equal(w.st.current.ex[0].set[0].manualOverride, true);
    w.st.current.ex[0].set[0].w = 0;
    w.timer(180);
    w.save();
    const expectedTimer = w.st.current.timerEnd;
    assert.ok(expectedTimer > Date.now());
    const seed = {};
    for (let i = 0; i < w.localStorage.length; i++) {
      const k = w.localStorage.key(i);
      seed[k] = w.localStorage.getItem(k);
    }
    const recovered = make(seed);
    await wait(2200);
    assert.equal(recovered.window.st.current.id, "test-pullup");
    assert.equal(recovered.window.st.current.ex[0].set[0].ok, true);
    result.reload = true;
    assert.equal(recovered.window.st.current.timerEnd, expectedTimer);
    result.timerRecovered = true;
    const rw = recovered.window;
    rw.cloud = rw.cloud || {};
    rw.cloud.user = { id: "integration-user" };
    rw.st.current.userId = "integration-user";
    rw.cloudSyncSession = async () => false;
    await rw.completeWorkout();
    assert.equal(rw.st.current.id, "test-pullup");
    assert.equal(rw.st.current.pendingCompletion, true);
    assert.equal(
      rw.st.sessions.filter((s) => s.id === "test-pullup").length,
      0,
    );
    assert.ok(
      rw.localStorage.getItem(rw.WorkoutStore.DRAFT).includes("test-pullup"),
    );
    rw.resumeWorkoutDraft();
    assert.equal(rw.st.current.pendingCompletion, undefined);
    rw.editSet(0, 0, "r", "11");
    assert.equal(rw.st.current.ex[0].set[0].r, 11);
    rw.editSet(0, 0, "r", "10");
    result.syncFailureRetainsEditableDraft = true;
    let uploads = 0;
    rw.cloudSyncSession = async () => {
      uploads++;
      return true;
    };
    await Promise.all([rw.completeWorkout(), rw.completeWorkout()]);
    assert.equal(uploads, 1);
    result.concurrentCompletionSingleUpload = true;
    rw.cloud.user = null;
    assert.equal(recovered.window.st.current, null);
    assert.equal(
      recovered.window.st.sessions.filter((s) => s.id === "test-pullup").length,
      1,
    );
    assert.match(
      recovered.window.document.querySelector("#sheet").textContent,
      /Собственный вес × 10/,
    );
    result.finished = true;
    if (process.env.UNVRSL_CANVAS) {
      recovered.window.previewWorkoutShare();
      let preview = recovered.window.document.querySelector("#sp264Preview");
      for (let attempt = 0; attempt < 30 && (!preview || preview.hidden); attempt++) {
        await wait(100);
        preview = recovered.window.document.querySelector("#sp264Preview");
      }
      assert.ok(preview && !preview.hidden, `PNG preview: ${recovered.window.document.querySelector("#sp264Status")?.textContent || "no status"}; element: ${preview?.outerHTML || "missing"}`);
      assert.match(preview.src, /^blob:http:\/\/app\.test\/share-/);
      assert.equal(recovered.window.__unvrslTestShareBlobs.get(preview.src)?.type, "image/png");
      fs.writeFileSync(
        path.join(root, "docs/share-fixture-v392.png"),
        Buffer.from(recovered.window.__unvrslTestCanvasBytes),
      );
      result.sharePreview = true;
    }

    recovered.window.begin(1, "A1");
    await recovered.window.trainingConfirmReadiness200(false);
    await wait(100);
    assert.ok(recovered.window.st.current?.id);
    const launchedId = recovered.window.st.current.id;
    assert.ok(recovered.window.st.current.ex.length);
    recovered.window.begin(1, "B");
    assert.equal(recovered.window.st.current.id, launchedId);
    await recovered.window.cancelWorkout();
    assert.equal(recovered.window.st.current, null);
    result.realProgramLaunch = true;
    const pullup = rw
      .catalogRecords()
      .find((e) => e.n === "Подтягивания с дополнительным весом");
    assert.ok(pullup);
    rw.clientFreeWorkoutOpenV334();
    rw.document.getElementById("cfwExercise").value = pullup.n;
    rw.document.getElementById("cfwWeight").value = "0";
    rw.document.getElementById("cfwWeightMode").value = "manual";
    rw.clientFreeWorkoutAddV334();
    rw.clientFreeWorkoutStartV334();
    await rw.trainingConfirmReadiness200(false);
    await wait(100);
    const free = rw.st.current;
    assert.ok(free?.id);
    assert.equal(free.ex[0].set[0].w, 0);
    assert.equal(free.ex[0].programWeightMode, "prescribed");
    rw.editSet(0, 0, "r", "8");
    rw.toggleSet(0, 0);
    assert.equal(free.ex[0].set[0].ok, true);
    rw.cancelWorkout();
    result.freeWorkoutManualZero = true;
    rw.st.programs.push({
      id: "zero-editor",
      weeks: [{ n: 1, days: [{ name: "День", ex: [] }] }],
    });
    rw.programExerciseForm({
      pid: "zero-editor",
      wi: 0,
      di: 0,
      n: pullup.n,
      sourceId: pullup.id,
      eq: pullup.eq,
      existingIndex: null,
    });
    rw.programSetParameterModeV381("weight", "manual");
    rw.document.getElementById("pmWeight").value = "0";
    rw.saveProgramExercise(
      "zero-editor",
      0,
      0,
      encodeURIComponent(pullup.n),
      encodeURIComponent(pullup.id),
      "back",
      "lats",
      encodeURIComponent(pullup.eq),
      null,
    );
    const edited = rw.st.programs.find((p) => p.id === "zero-editor").weeks[0]
      .days[0].ex[0];
    assert.equal(edited.sets[0].w, 0);
    assert.equal(edited.weightMode, "manual");
    assert.equal(edited.exerciseId, pullup.id);
    result.programEditorManualZero = true;
    result.errors = [...errors];
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(root, "docs/runtime-v392.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(JSON.stringify(result, null, 2));
    recovered.window.close();
    dom.window.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify({ result, errors }, null, 2));
    process.exit(1);
  }
})();
