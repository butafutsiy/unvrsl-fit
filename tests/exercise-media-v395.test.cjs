const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function inspectGif(relative) {
  const b = fs.readFileSync(path.join(root, relative));
  assert.ok(b.subarray(0, 3).toString() === "GIF", `${relative} is a GIF`);
  const width = b.readUInt16LE(6), height = b.readUInt16LE(8), packed = b[10];
  let i = 13, frames = 0, loopsForever = false, delays = [];
  if (packed & 0x80) i += 3 * (1 << ((packed & 7) + 1));
  const skipBlocks = () => { while (i < b.length) { const size = b[i++]; if (!size) break; i += size; } };
  while (i < b.length) {
    const marker = b[i++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = b[i++];
      if (label === 0xff) {
        const size = b[i++], app = b.subarray(i, i + size).toString(); i += size;
        const blockSize = b[i++], block = b.subarray(i, i + blockSize); i += blockSize;
        if (app === "NETSCAPE2.0" && block[0] === 1 && block.readUInt16LE(1) === 0) loopsForever = true;
        skipBlocks();
      } else {
        if (label === 0xf9 && b[i] === 4) delays.push(b.readUInt16LE(i + 2));
        skipBlocks();
      }
      continue;
    }
    if (marker !== 0x2c) throw new Error(`Unexpected GIF block 0x${marker.toString(16)} in ${relative}`);
    i += 4;
    const frameWidth = b.readUInt16LE(i), frameHeight = b.readUInt16LE(i + 2), framePacked = b[i + 4]; i += 5;
    assert.equal(frameWidth, width, `${relative} frame ${frames} has the same width as its canvas`);
    assert.equal(frameHeight, height, `${relative} frame ${frames} has the same height as its canvas`);
    if (framePacked & 0x80) i += 3 * (1 << ((framePacked & 7) + 1));
    i++;
    skipBlocks();
    frames++;
  }
  return { width, height, frames, loopsForever, delays };
}

test("exercise animations use one square canvas and loop indefinitely", () => {
  const assets = [
    "box-jump-v424.gif", "hip-thrust-barbell-v424.gif", "hip-thrust-machine-v424.gif",
    "hip-thrust-smith-v424.gif", "weighted-hyperextension-v424.gif", "weighted-pushup-v424.gif", "weighted-dip-v424.gif",
  ];
  for (const asset of assets) {
    const info = inspectGif(`assets/exercises/${asset}`);
    assert.equal(info.width, info.height, `${asset} is square`);
    assert.ok(info.frames > 1, `${asset} is animated`);
    assert.ok(info.loopsForever, `${asset} loops forever`);
    assert.equal(info.delays.length, info.frames, `${asset} gives every frame an explicit duration`);
    assert.ok(info.delays.every(delay => delay >= 40), `${asset} runs at the slower 400 ms frame cadence`);
  }
});

test("dumbbell step-up retains its verified animated GIF on the stable catalog ID", () => {
  const catalog = fs.readFileSync(path.join(root, "exercise-catalog.js"), "utf8");
  const verified = fs.readFileSync(path.join(root, "exercise-media-verified.js"), "utf8");
  const ui = fs.readFileSync(path.join(root, "exercise-catalog-ui.js"), "utf8");
  const row = catalog.match(/"id": "canon:stepup_db"[\s\S]{0,400}"gif": "([^"]+)"/);
  assert.equal(row?.[1], "videos/0431-aXtJhlg.gif");
  assert.match(verified, /"stepup_db"[\s\S]{0,260}"gif": "videos\/0431-aXtJhlg\.gif"/);
  assert.match(ui, /\.catalog392-media\{aspect-ratio:1/);
  assert.match(ui, /\.catalog392-media img\{width:100%;height:100%;object-fit:contain/);
});

test("recent exercise cards animate their seven square local GIFs with visibility-aware loading", () => {
  const ui = fs.readFileSync(path.join(root, "exercise-catalog-ui.js"), "utf8");
  assert.match(ui, /"canon:weighted_hyperextension": "assets\/exercises\/weighted-hyperextension-v424\.gif"/);
  assert.match(ui, /"canon:box_jump": "assets\/exercises\/box-jump-v424\.gif"/);
  assert.match(ui, /"canon:weighted_dip": "assets\/exercises\/weighted-dip-v424\.gif"/);
  assert.match(ui, /"canon:weighted_pushup": "assets\/exercises\/weighted-pushup-v424\.gif"/);
  assert.match(ui, /"unvrsl:hip-thrust-smith": "assets\/exercises\/hip-thrust-smith-v424\.gif"/);
  assert.match(ui, /"unvrsl:hip-thrust-machine": "assets\/exercises\/hip-thrust-machine-v424\.gif"/);
  assert.match(ui, /"canon:barbell_hip_thrust": "assets\/exercises\/hip-thrust-barbell-v424\.gif"/);
  assert.match(ui, /animated \? 'data-animated="1"'/);
  assert.match(ui, /else if \(target\.dataset\.animated === "1"\)[\s\S]*target\.removeAttribute\("src"\)/);
});
