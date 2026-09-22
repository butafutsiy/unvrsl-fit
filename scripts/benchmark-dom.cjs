"use strict";
// Same local resources and in-memory exercise fixture for both versions. No network, painting or layout metrics.
const { JSDOM, ResourceLoader, VirtualConsole } = require(
  process.env.UNVRSL_JSDOM || "jsdom",
);
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(process.argv[2] || "."),
  source = process.env.UNVRSL_EXERCISE_FIXTURE
    ? fs.readFileSync(process.env.UNVRSL_EXERCISE_FIXTURE, "utf8")
    : null;
let bytes = 0,
  count = 0,
  sourceRequests = 0;
const errors = [];
class Local extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith("http://app.test/")) return null;
    const p = path.join(root, new URL(url).pathname);
    if (!fs.existsSync(p)) return null;
    const data = fs.readFileSync(p);
    bytes += data.length;
    count++;
    return Promise.resolve(data);
  }
}
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  if (!/Not implemented/.test(e.message)) errors.push(e.message);
});
const started = performance.now();
let ready = null;
const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  url: "http://app.test/",
  runScripts: "dangerously",
  resources: new Local(),
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(w) {
    w.matchMedia = () => ({ matches: false, addEventListener() {} });
    w.fetch = async (url) => {
      if (
        source &&
        String(url) ===
          "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json"
      ) {
        sourceRequests++;
        return { ok: true, json: async () => JSON.parse(source) };
      }
      return { ok: false, json: async () => [] };
    };
    w.IntersectionObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
    w.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    w.requestIdleCallback = (f) => w.setTimeout(f, 0);
    w.scrollTo = () => {};
    w.structuredClone = structuredClone;
    w.addEventListener(
      "unvrsl:app-ready",
      () => (ready = performance.now() - started),
    );
  },
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await wait(3000);
  const w = dom.window;
  w.nav("exercises");
  await wait(700);
  const result = {
    environment:
      "Node jsdom, local assets, in-memory catalog fixture, no layout/network, anatomy fetch unavailable in both runs",
    readyMs: ready,
    scripts: count,
    scriptBytes: bytes,
    catalogTransferBytes:
      sourceRequests * (source ? Buffer.byteLength(source) : 0),
    catalogRequests: sourceRequests,
    catalogCount: w.catalogRecords().length,
    medianNavigationMs: {},
    errors,
  };
  for (const p of ["home", "exercises", "plan", "start", "stats"]) {
    w.nav(p);
    const times = [];
    for (let i = 0; i < 15; i++) {
      const t = performance.now();
      w.nav(p);
      times.push(performance.now() - t);
    }
    result.medianNavigationMs[p] = +times.sort((a, b) => a - b)[7].toFixed(2);
  }
  console.log(JSON.stringify(result, null, 2));
  dom.window.close();
  process.exit(0);
})();
