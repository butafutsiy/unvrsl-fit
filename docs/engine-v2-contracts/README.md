# Superseded Engine 2 contracts

These assertions describe the old numerical policy, implicit test weeks, external-only pull-up estimates, or unsupported precision. Engine 3 replaces those contracts with `tests/recommendation-engine-v3.test.cjs` and the real active/focus/offline browser checks. Unrelated assertions in the original suites remain active. The original source is retained below for review; it is not silently treated as passing.

## adaptive-load-contract.test.cjs

- applying a valid proposal changes only the pending set
- latest pain signal cannot be bypassed or applied, even with missing effort
- domain and live interface return the same decision for RIR targets
- lever machine transforms effective load back to weight per side
- deload blocks increases, but permits a necessary reduction
- invalid targets cannot request a weight change
- every cell of the specification RIR matrix is reproducible

## adaptive-load-series.test.cjs

- personal forecast correction requires repeated forward-only evidence and remains bounded
- unknown live effort does not infer failure effort from repetitions
- coarse equipment increments cannot turn a slight improvement into a 20% jump
- changed rep task still uses e1RM and is not double rewarded
- adding planned sets is a changed workload, not proof that a shorter series was mastered
- an incomplete easy series cannot authorise a heavier start
- one late miss holds; repeated complete comparable misses reduce next-session load
- one genuinely easy full series can increase through e1RM, without two mastered workouts
- a full on-target series holds the load and offers one total rep

## automatic-pending-load.test.cjs

- auto fills all zero weights with the canonical 110 kg and remains stable after recompute and reload

## canonical-periodization.test.cjs

- target, hard minimum, failed minimum and easy series decisions obey bounded steps
- isolation has its own e1RM and missing history preserves assigned load
- formula and external pull-up load exclude body mass

## client-progress-v521.test.cjs

- client strength history separates machines and compares matching equipment only

## cloud-recommendation-history.test.cjs

- recommendation reloads completed cloud workout, even when local cache lacks it

## equipment-theme-share-v405.test.cjs

- isolation uses its own strength estimate and reports a percentage conflict
- an explicit repetition range wins when weekly percentage conflicts with it
- weekly percentage, rep range and RPE/RIR share one compound calculation
- a new rep range cannot bypass the maximum progression step
- a planned 135 kg progression is not silently replaced with old 115 kg
- a far-off historical load does not replace the current program
- back-off sets cannot turn a 70 kg top set into a 45 kg recommendation
- a substantially failed set suggests two lower steps without replacing the exercise recommendation
- per-hand rack loads are recommended as a single dumbbell weight
- separate Matrix and Foreman machines never transfer recent working weights
- completed sets in legacy history count even if the old session lacks an ended timestamp
- restoring a week-five draft recomputes its saved recommendation from September 21
- autoweight uses the completed set for the next set and refreshes after a new rep target
- zero external load has no external e1RM even with known body mass
- body mass is required for effective-load 1RM and assistance has inverse progression
- a single late miss holds next-session load instead of declaring lost strength
- the September 21 workout drives the next week's 5–7 reps despite stale metadata
- latest saved workout wins with mixed timestamp formats and a changed tempo

## focus-calibration.test.cjs

- credited probes cannot contribute a second strength sample
- probe adjustments use one available equipment step and conservative unknown effort
- one calibration remains one low-confidence observation across different rep ranges
- first-session calibration works immediately and does not leak across accounts or equipment

## live-weight-rounding.test.cjs

- live UNVRSL middle stages apply the rounded next-set weight, not 110 × 120 / 130

## main-unvrsl-v211.test.cjs

- autoweight fills missing loads while prescribed loads require explicit acceptance
- UNVRSL heavy and light phases are not averaged into one recommendation

## method-recommendations-v438.test.cjs

- single TEST matches its target effort, preview back-off uses that attempt, then the actual result
- RPE has one priority over conflicting RIR and unknown effort lowers confidence
- TEST advances from today effort and stops at RPE9.5 without filling another attempt
- wellbeing changes initial load only and never changes e1RM
- method strength histories remain separate with their own confidence
- SLDR increases only after a complete easy circle
- UNVRSL increases Heavy after one easy set while Light on target holds
- ordinary TARGET holds manual actual weight, tolerance and one easy set increase
- DS descends using the recipe and FST-7 responds to actual failed reps
- estimated single follows the requested formula; confirmed single is stored separately
- test back-off cannot be replaced by the normal next-set suggestion
- SLDR without method history preserves its seed instead of importing ordinary e1RM
- SLDR keeps one weight within the round and lowers the next round after failure
- UNVRSL keeps three linked loads and updates the next heavy set after a hard round
- test singleton is never calculated as back-off five and works in custom plans too
- UNVRSL history is isolated from ordinary weeks

## per-leg-reps.test.cjs

- strength estimates use repetitions per leg rather than the combined total

## recommendation-controls-v440.test.cjs

- wellbeing never increases load; actual performance takes priority
- dismissal survives serialization and blocks auto until evidence changes; manual protected
- isolation test checks working range, holds TARGET, and uses actual result for backoffs
- older effort evidence remains usable when latest workout has no RPE

## strength-analytics.test.cjs

- new and unknown equipment remain visible without contributing invented growth
- one exercise family preserves equipment loads and normalizes each baseline independently
- display units match entered load for dumbbells, per-side equipment and legacy set fields
- mean weights each completed set equally across all sessions and methods
- weighted pull-ups use only external load, no body mass or effort adjustment
- deload contributes to growth and mean; muscle filters and load types isolate series
- zero added weight remains zero regardless of body mass, malformed and warmup sets excluded
- equipment is isolated, missing effort does not block estimates; latest decline is not lifetime peak
- display estimates include high reps and method stages
- all history includes old sessions, removes deleted, duplicate, unfinished and future sessions

## tonnage-v512.test.cjs

- paired tonnage does not double displayed dumbbell or cable strength

## week5-rdl-range.test.cjs

- W5 Romanian deadlift uses September 21 for its 4–6 recommendation after a wrapped preview

## week8-test-autoweight.test.cjs

- W8 back-off uses completed test weight and isolation ignores the test percentage
- W8 test suggestions use exercise history, the completed attempt, and equipment step

## weekly-calculated-weight.test.cjs

- day role cannot bias the requested arithmetic midpoint
- W7 narrow effort intersection still recommends rounded weekly midpoint 135 kg
- a coarse equipment rack uses the nearest available weight instead of a blank
- `weekly weight uses ${type} equipment ${JSON.stringify(equipment)}`
- different manual plan stays unchanged until accept; calculated value survives save and reload
- 135 x 3 remains history; 70–75% of 153 selects 110, preserving strength, range, reps and effort

## workout-domain-v392.test.cjs

- weighted dips record and estimate external load separately
- three comparable stable workouts produce an explicit plateau explanation
- next set recommendation uses actual current work and the same individual step
- one abnormal historical session cannot collapse a 60 kg starting load
- strength statistics include completed compatible method work
- UNVRSL heavy and light phases cannot exchange working weights
- no history preserves an off-grid manually chosen current load
- low confidence without effort data, without blocking completion
- 21: dumbbell weight is not doubled in recommendations or 1RM
- 20: individual equipment increment used for recommendation and buttons
- `${num}: ${method} contributes an e1RM without creating a standard-set PR`
- 4: assistance is subtracted, progress reduces assistance
- manual maximum uses the same rules as completed sets without writing a record


## runtime-methods-v438.cjs

The original UI fixture assumed automatic test-week forecasts, generated isolation tests and interchangeable missing tempo. The active scenario now checks all eight weeks retain authored roles and targets, incomparable history cannot supply a weight, manual review blocks Apply, and dismissal preserves plan sets. Precise eligible forecasts are covered by the v3 core matrix and active/focus Chromium scenario.

## recommendation-controls-v440.test.cjs: authored tests

The legacy automatic expansion from two authored sets to six was replaced by an immutability and reload check: preparation never invents attempts or backoffs.
