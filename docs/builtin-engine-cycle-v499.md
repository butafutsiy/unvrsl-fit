> Актуальная инструкция: [Единая таблица периодизации](periodization.md). В v543 убраны отдельные исключения для разгрузки.

# Personal eight-week cycle on the canonical engine

The built-in five-day A1/B/C/A2/D plan now has an explicit **По новому движку** action in Programs and **Мой цикл · 8 недель · новый движок** in the constructor. It creates a separate editable program; the original recipes, performed history, active workout and primary-program selection are preserved.

`builtin-engine-cycle.js` translates the authored exercise identities and method stages into input data for `WorkoutDomain.generateCycle` and `allocateWeek`. It contains no independent percentage, repetition or weight calculation tables. Ordinary exercises use the current `WorkoutDomain.weekProfiles`; isolation uses its own estimate, intensity and effort targets.

| Week | Base intensity | Ordinary base sets × reps | Isolation intensity | Ordinary isolation sets × reps |
| --- | --- | --- | --- | --- |
| 1 | 70–75% | 4 × 10–12 | 70–75% | 3 × 10–12 |
| 2 | 75–80% | 4 × 8–10 | 65–70% | 3 × 12–15 |
| 3 | 80–85% | 3 × 6–8 | 60–65% | 4 × 15–20 |
| 4 | 60–65% | 4 × 10–12 | 80–85% | 3 × 6–8 |
| 5 | 85–88% | 3 × 4–6 | 60–65% | 4 × 15–20 |
| 6 | 65–70% | 4 × 10–12 | 75–80% | 3 × 8–10 |
| 7 | 88–90% | 3 × 3–5 | 60–65% | 4 × 15–20 |
| 8 | 90–100% test target | Two preparation sets, then one single | No ordinary isolation | 0 |

Counts are the weekly budget for each exercise identity. Repeated ordinary exercises share that budget across their selected days. Special methods preserve their complete stage recipes on working weeks, rather than being multiplied or truncated to an ordinary set count. UNVRSL retains three heavy/light pairs and its finish sets; DS keeps its authored descending stages. W4/W6 use the same percentage table as all other non-test weeks; authored methods retain their recipes. Regenerating this new template from week one retains its week-specific method recipes, and Undo restores the previous cycle sources.

Manual kilograms remain in the recipe and are not replaced automatically. The existing recommendation engine proposes a load using comparable history, reps, RPE/RIR and equipment steps. If a prescribed percentage conflicts with reps/effort, the existing visible conflict warning and compatible reps/RIR corridor take precedence. This is relevant to W5's 85–88% and 4–6 repetitions.

Cardio is kept as timed work, including when a program is launched directly through the canonical constructor handler. Program normalization preserves generated preparation/test repetition ranges across save/reload. Legacy `kind: 'reps'` no longer classifies curls, French presses or calf raises as compound movements.

Validation: unit contracts plus DOM creation, all eight weeks, five-day identities, weekly volume, separate isolation targets, special-method roles, manual loads, timed cardio, regeneration, Undo, serialization and immutable original/history checks. Real authenticated cloud saving and iOS/Safari visual inspection are outside these local checks.
