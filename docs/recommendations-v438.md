# Recommendation engine v438

All screens and autoweight use `WorkoutDomain`. Physical compatibility is separate from method and phase. Methods share strength evidence but keep their stage histories.

## Strength estimate

Completed, valid, non-warmup, non-skipped sets with 1–12 repetitions produce local estimates. RPE takes precedence over a contradictory RIR. Missing effort remains usable with less weight. A completed single at RPE 10 equals the actual load. Dumbbell estimates use one dumbbell; assisted and additional-bodyweight exercises use effective load; per-side input includes the implement.

The shared estimate combines sets into workout observations and then combines workouts. Weights depend on method, role, effort, repetitions, position and recency (35-day half-life). Heavy UNVRSL participates fully; middle, light and fatigue-heavy methods have progressively smaller weights. Deload evidence has little downward influence. A lone exceptional workout is downweighted until other workouts corroborate it. Confirmed singles are stored separately from estimated strength.

The reported range is a heuristic spread of the evidence, not a calibrated statistical confidence interval. These starting coefficients need validation against real training outcomes. RPE below 6 and long/fatigued sets carry little information about maximal strength.

## Recommendations

- The resolved week profile, method, stage, repetitions, effort and compatible equipment determine the starting recommendation. Explicit target percentages override the week percentage.
- Standard: a matching performed set holds its actual weight. One easy set can increase it. A substantial miss lowers it by two equipment increments; a smaller miss uses one. Effort tolerance is ±0.5 RPE.
- UNVRSL: heavy, light and middle have separate live anchors. A light set that meets its target holds even when heavy increases.
- SLDR: weight stays fixed inside a three-mini-set circle; the complete circle determines the next weight.
- Drop sets preserve planned stage ratios and can reduce more after a failed stage.
- FST-7 uses block history for progression; an incomplete easy block cannot authorize an increase. Current failures can lower subsequent stages.
- TEST is an explicit role, independent of week number. Today's attempts determine subsequent increments. RPE 9.5–10 or a failed attempt stops automatic advancement.
- Back-off uses the best completed test load, its percentage and a repetition/effort cap. Later back-off sets use their actual performance.
- Existing readiness input adjusts initial recommendations. Completed compatible work takes precedence. Readiness never changes e1RM.
- Autoweight only applies the shared recommendation. Completed sets and manual input remain protected. A STOP result is never auto-applied.

The built-in profile and editor defaults share `WorkoutDomain.weekProfiles`. Explicit program values still override defaults. PWA assets and dynamic loaders share release v438.

## Verification

`node --test tests/*.test.cjs` includes the new method regression suite. `tests/runtime-methods-v438.cjs` launches all eight built-in weeks through the real application modules, checks grouped methods, test/back-off targets and the shared exercise card. The existing full workout runtime verifies draft recovery, completion, manual values and program launch.
