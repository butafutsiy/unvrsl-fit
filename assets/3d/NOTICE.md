# UNVRSL FIT movement demo

## Human mesh, skeleton, skinning weights

Source: MakeHuman Community, https://github.com/makehumancommunity/makehuman

Original assets:
- `makehuman/data/3dobjs/base.obj`
- `makehuman/data/rigs/default.mhskel`
- `makehuman/data/rigs/default_weights.mhw`
- `makehuman/data/targets/macrodetails/caucasian-male-young.target`
- `makehuman/data/targets/macrodetails/universal-male-young-maxmuscle-averageweight.target`

These assets are released under **CC0 1.0 Universal**. The MakeHuman
application's code license is separate; no MakeHuman application code is
included in this demo. See the upstream `LICENSE.md`, section C, and
`LICENSE.ASSETS.md` (https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.ASSETS.md).

Asset credits: Data Collection AB, Joel Palmius, Jonas Hauquier and the
MakeHuman contributors. Downloaded 2026-10-02.

Modifications: body-only mesh extraction, triangulation, scale normalization,
four skinning influences per vertex, JSON conversion, surface region colors,
outfit shader, male/muscular morph targets, stylized athletic mesh relief and
contour shading, procedural joint animation. Anatomical helper objects are
excluded. The surface highlights are illustrative regions, not segmented
muscle anatomy or measured activation.

## Renderer

Three.js, MIT License. See `THREE-LICENSE.txt`. OrbitControls is bundled from
the same distribution. Dumbbells, UI and demo animation are created for
UNVRSL FIT. No external analytics, model API or paid runtime is used.

## Rebuilding

Download the five upstream assets to a directory and run:

```
python scripts/build-human-demo.py /path/to/assets
```

The JavaScript source is `scripts/movement-lab-src.js`. Bundle it with esbuild
and Three.js (version recorded in `build-info.json`). The runtime uses only
local assets. The model is lazy-loaded exclusively on `movement-lab.html`.
