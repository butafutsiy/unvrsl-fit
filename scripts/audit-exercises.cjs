"use strict";
const fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  context = { window: {} };
vm.runInNewContext(
  fs.readFileSync(path.join(root, "exercise-catalog.js"), "utf8"),
  context,
);
const rows = context.window.UNVRSL_EXERCISES;
const fields = {
  id: (e) => e.id,
  media: (e) => e.gif || e.image,
  description: (e) => e.description,
  muscles: (e) => e.bp && e.tg && e.secondary?.length,
  equipment: (e) => e.eq,
  loadType: (e) => e.loadType,
  cues: (e) => e.coaching?.cues?.length >= 3,
  mistakes: (e) => e.coaching?.mistakes?.length >= 3,
  step: (e) => e.weightProfile?.step > 0,
  resultRule: (e) => e.resultRule?.metric,
  start: (e) => e.coaching?.start,
  movement: (e) => e.coaching?.sequence?.length,
  breathing: (e) => e.coaching?.breathing,
  safety: (e) => e.coaching?.safety?.length,
};
const incomplete = rows
  .map((e) => ({
    id: e.id,
    name: e.n,
    missing: Object.entries(fields)
      .filter(([, fn]) => !fn(e))
      .map(([key]) => key),
  }))
  .filter((x) => x.missing.length);
const report = {
  total: rows.length,
  complete: rows.length - incomplete.length,
  incomplete,
  missingGIF: rows.filter((e) => !e.gif).map((e) => ({ id: e.id, name: e.n })),
  missingImage: rows
    .filter((e) => !e.gif && !e.image)
    .map((e) => ({ id: e.id, name: e.n })),
  missingStep: rows
    .filter((e) => !(e.weightProfile?.step > 0))
    .map((e) => ({ id: e.id, name: e.n })),
  duplicateIds: rows.map((e) => e.id).filter((id, i, a) => a.indexOf(id) !== i),
  note: "Completeness checks fields, not media availability or coaching accuracy. No fallback satisfies a missing field.",
};
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(
  path.join(root, "docs/exercise-audit-v392.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (
  report.duplicateIds.length ||
  incomplete.some((x) => x.missing.some((f) => f !== "media")) ||
  (process.argv.includes("--strict") && incomplete.length)
)
  process.exitCode = 1;
