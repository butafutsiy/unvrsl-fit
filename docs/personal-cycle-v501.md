# Personal cycle and constructor correction, v501

The existing `builtinEngineTemplate` copy is upgraded in place from eight to ten weeks. There is no new creation button. Normalization and storage/cloud hydration events apply the same idempotent migration. IDs, manual kilogram values, equipment, names, explicit parameter overrides, performed sessions and the active workout snapshot are retained. Reused weeks receive fresh day/exercise IDs. A previous-cycle snapshot supports the existing undo action.

The canonical ten-week sequence is volume, work, intensification, deload, work, intensification, heavy, recovery, strength, test. The second work block progresses to the heavy phase instead of repeating the first block and skipping it. All prescriptions are derived from WorkoutDomain, also in the general constructor.

| Week | Base percentage | Ordinary base sets/reps | Isolation percentage | Ordinary isolation sets/reps |
|---|---|---|---|---|
| 1 | 70–75% | 4 × 10–12 | 70–75% | 3 × 10–12 |
| 2 | 75–80% | 4 × 8–10 | 65–70% | 3 × 12–15 |
| 3 | 80–85% | 3 × 6–8 | 65–70% | 4 × 12–15 |
| 4 | 60–65% | 3 × 12–15 | 60–70% | 2 × 15–20 |
| 5 | 75–80% | 4 × 8–10 | 65–70% | 3 × 12–15 |
| 6 | 80–85% | 3 × 6–8 | 65–70% | 4 × 12–15 |
| 7 | 85–88% | 3 × 5–7 | 60–65% | 4 × 15–20 |
| 8 | 65–70% | 3 × 12–15 | 60–70% | 2 × 15–20 |
| 9 | 88–90% | 3 × 4–6 | 60–65% | 4 × 12–15 |
| 10 | 90–100% test profile | 2 preparations × 2–4, 1 test × 1 | none | none |

Set counts are per movement per week, distributed across repeated placements. UNVRSL/DS retain their method recipes in the relevant working weeks; ordinary counts in the table do not replace their internal stages. Deloads use ordinary sets. The adapter's introductory cardio is kept timed and assigned RPE 5, with no strength tempo/intensity appended. Explicitly edited cardio parameters are retained during migration.

Day preview and constructor pass the program and selected week explicitly to the shared prescription renderer. A stale editor selection can no longer show W1 repetitions on W7/W9. Each exercise shows one effort prescription; isolation has its own effort and percentage range. The adapter also clears obsolete display labels. Existing manual kilogram values remain planned values, not new recommendations.

The workout-start adapters preserve the per-set test single instead of applying the preparation range to every set. Cardio is excluded from strength targets. Explicit manual rep/effort edits take precedence over generated set targets. A running workout with an older profile snapshot is not rewritten by the background repair after migration.

Constructor duration/day choices now list the lengths/counts accepted by the domain. Regeneration uses the current number of weeks/days and clears an obsolete end date after resizing.

The percentage/repetition/RIR compatibility checks remain active. A percentage profile is not a forced kilogram prescription: when a nominal percentage conflicts with repetitions and effort, the engine warns and uses the compatible repetition/RIR corridor. RPE/RIR are never silently ignored to force a percentage.

Validation includes all unit tests, the existing eight-week adapter scenario, canonical constructor scenario, persisted migration/reload, all fifty ten-week workout launches, stale-context preview, separate base/isolation targets, timed cardio, test roles/labels, manual overrides, and resizing. These DOM scenarios do not replace physical iPhone/Safari or live signed-in cloud QA.
