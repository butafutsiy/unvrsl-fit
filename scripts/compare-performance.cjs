"use strict";
// Each fixture runs in its own process, so an old MutationObserver loop cannot starve the watchdog.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
const baseline = process.argv[2];
if (!baseline)
  throw new Error(
    "Usage: node scripts/compare-performance.cjs <baseline-checkout>",
  );
for (const [label, dir] of [
  ["before", baseline],
  ["after", root],
]) {
  const start = Date.now();
  const run = spawnSync(
    process.execPath,
    [path.join(__dirname, "benchmark-dom.cjs"), dir],
    { env: process.env, timeout: 30000, encoding: "utf8", maxBuffer: 2e6 },
  );
  let result;
  try {
    result = JSON.parse(run.stdout);
  } catch {
    result = {
      environment:
        "Node jsdom; local assets; no real network, layout or device",
      status: run.error?.code === "ETIMEDOUT" ? "timeout" : "failed",
      timeoutMs: 30000,
      elapsedMs: Date.now() - start,
      readyMs: null,
      medianNavigationMs: null,
      error: run.error?.message || run.stderr.slice(-2000),
    };
  }
  fs.writeFileSync(
    path.join(root, `docs/performance-${label}-v392.json`),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(label, result.status || "completed");
}
