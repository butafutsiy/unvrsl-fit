# Periodization and recommendation audit, v465

## Canonical owners

`workout-domain.js` remains the owner of strength estimation, method strategies, recommendations and rounding. Its `weekProfiles`, `bandPrescription`, `cycleProfiles`, `generateCycle` and `allocateWeek` now own generated periodization. No new Readiness Engine was introduced.

The source chain is comparable actual history → robust e1RM → week prescription → reps and effort → compatible load interval → day position → evidence correction → bounded equipment rounding → proposal. A proposal does not replace the assigned weight until explicitly accepted.

## Changes

- Separate strength evidence by exercise ID, physical equipment, technique ID, load type and method. Explicit unequal exercise IDs no longer merge just because their names match. Legacy rows without IDs can still resolve via the catalog.
- External pull-up/dip e1RM uses added load. Body mass remains part of volume/effective-load statistics, not the external-load strength estimate. Dumbbell estimates remain per dumbbell.
- Warm-ups, incomplete ROM, explicitly partial/incomplete and technique-failed sets do not contribute to e1RM. Robust outliers have zero contribution to the main estimate. Evidence includes stable mean, best estimate, confirmed single, latest full sets, effort, date and confidence.
- The requested formula uses actual repetitions plus RIR. A literal 150×1 @10 gives an estimated 155 kg; the confirmed single is stored separately as 150 kg. Missing effort retains lower-confidence legacy estimation, with application blocked when no usable effort evidence exists.
- Isolation uses its own history and inverse-volume profile. Percent, reps and RPE are validated together; incompatible percent intervals produce a warning and the reps/RIR interval wins. Step limits outside that interval also produce a warning.
- Correction is capped at 10% down and 5% up by default (configurable up to 7.5%). If equipment has no legal increment within the cap, retain the load. Cycle deload is a prescribed profile change, not a compounding correction from the previous recommendation.
- On-target complete series hold; an easier complete series can increase one legal increment. Hard but sufficient reps hold. A failed minimum can lower the next-set weight; one late miss does not reset the whole program. Repeated misses can lower the start load.
- Special methods retain their existing block/round strategies and method-specific confidence. AMRAP/EMOM/AFAP/HIIT cannot update ordinary e1RM. TEST still uses the existing test decision path. Generated test weeks have two preparation sets and one single, without ordinary isolation.
- Existing wellbeing/readiness fields only adjust the current session, without positive automatic loading. Two independent fatigue signals suggest early deload; the program is not automatically rewritten.

## Constructor and UI

`coach-programs.js` creates 3/4/6/8/10/11/12-week schedules, validates start and target dates, records goal and strength/hypertrophy priority, and assigns the specified roles for 1–5 days. Repeated placements of the same exercise share its weekly set budget. Method blocks remain intact and are not multiplied across every selected day.

Add exercises to week one, then use “Сформировать цикл из первой недели”. The whole cycle, base/isolation percentages, sets, reps, effort, roles, deload and test are shown in the existing editor. A generated cycle can be undone, and a phase can be replaced. Original manual weights remain in the recipe. Existing explicitly authored programs are not silently rewritten: regeneration is an explicit trainer action.

`program-exercise-rules.js`, `program-week-rep-guidance.js` and `program-week-rpe-rir.js` consume the domain profile instead of maintaining independent rep tables. `training-prescription-bridge.js` transfers generated targets and respects exercise-level manual reps/effort. `training-engine.js` displays the current week, phase, role, strength, calculated and recommended loads, permitted interval, effort, history and reason. Constructor exercise details expose the same calculation.

Acceptance records an original-weight snapshot. Cancellation restores that snapshot if the weight still comes from the accepted proposal, records the dismissal and suppresses automatic reapplication. A later manual edit is not rolled back.

## Removed/disabled competing behavior

- Removed automatic proposal application from `training-load-model.js`.
- Removed independent template percentage tables and nearest-length interpolation from `template-load-profile.js`.
- Removed duplicate hard-coded rep tables from the week/exercise editors.
- Prevented the legacy Sergey/template profile decorators from rewriting newly generated cycles.
- Removed cross-method evidence sharing and cross-ID name fallback when both IDs are explicit.
- Retained legacy module/API names as compatibility adapters; no extra independent progression engine was installed.

## Verification

- 297 unit/contract tests.
- `runtime-periodization.cjs`: real DOM create/edit/preview/generate, weekly allocation, manual load, deload, test, phase replacement and serialization.
- `runtime-v392.cjs`: full workout, finish, restore, navigation, actual program launch and manual zero.
- `runtime-methods-v438.cjs`: eight built-in weeks, method blocks, test controls and recommendation dismissal.
- `runtime-adaptive-load.cjs`: actual recommendation UI, effort missing and manual-weight protection.
- `runtime-storage-v393.cjs`: quota recovery, draft save and reload.

Old assertions requiring cross-method strength sharing, body-mass e1RM for added-weight movements, forced automatic application and uncapped target rebasing were updated to the new requested contracts, not disabled.

## Scope and remaining constraints

- Preserved historical workouts and explicitly authored legacy exercise recipes. New canonical volume/test rules apply when a program is generated/regenerated; old built-in TEST/back-off recipes keep their existing stage structure until converted through the editor.
- Exercise/equipment/technique distinctions require recorded IDs. The engine cannot infer which unnamed physical machine an old record used. Explicitly mismatched old IDs need deliberate migration, not silent merging.
- DOM tests do not substitute for real iOS/Safari visual inspection or an authenticated production cloud-sync test. Those were not performed for this change.
- Percentage tables and the requested e1RM equation have mathematically incompatible cells. These are visible conflicts, not silently forced weights. “100%+” is a test target, never an unconditional automatic overload.
