# UNVRSL FIT Recommendation Engine 3.0

Implementation against `UNVRSL_FIT_Recommendation_Engine_3_0.pdf` (30 pages), on top of the Engine 2 branch. Application shell/cache version: v535. This branch is for review; it does not merge or deploy the application.

## Calculation and data ownership

- `recommendation-engine.js` is the pure owner of normalization, local capacity estimates, equipment candidates, strategies, START, LIVE, NEXT_SESSION, PHASE_CHANGE, CALIBRATION and TEST. Time, actor and history are explicit inputs.
- `exercise-profiles.js` resolves explicit identities and confirmed variant overrides; `data/exercise-profile-routing.json` is the reviewable routing source. A test requires the embedded browser routing and JSON to agree.
- `recommendation-adapter.js` translates the result for existing application APIs. `adaptive-load.js`, `workout-domain.js`, performance reports and strength analytics delegate their numerical forecasts to the engine.
- `recommendation-ui.js` supplies the same card and actions in active and focus workouts. The completion summary requests NEXT_SESSION separately. The offline weekly planner requires an explicit exercise, reference type/value and equipment configuration.

Pending plan values cannot become actual performance. Actual RIR 0 is valid; RPE 0 and missing effort are unknown. RPE 1–5 and censored RIR produce qualitative advice. Conflicting RPE/RIR, unknown side counting, pain, execution problems and incompatible protocols block precise changes.

## Profiles and equipment

Routing contains 189 canonical catalog IDs, two declared squat variants and ten cardio IDs. F01–F27 have separate movement, metric, effort and cap policies. The 24 disputed Appendix B catalog IDs are deliberately F00/manual_only. Other catalog mappings are provisional until equipment and variant metadata are confirmed.

Exact reviewed aliases and numbered program labels resolve established identities. Broad labels such as “Присед со штангой”, mixed alternatives, unknown stable archive IDs and unknown custom exercises remain manual. A timer alone is insufficient to classify an exercise as cardio.

The coverage audit executes all eight built-in source plans, popular and female factories, and the supplied named plans. Its optional runtime export includes the actual registry and saved program references. The checked-in snapshot comes from an isolated clean app fixture, not a user's private account. The full report, including unresolved entries and reasons, is in [exercise-profile-coverage.md](exercise-profile-coverage.md) and its JSON companion. Entries marked manual are a review queue, not validated auto-coaching coverage.

Equipment rounding uses an explicit list of available loads or known minimum, maximum and step. Missing machine base, loaded-side count, implement count and plate configuration are never replaced by invented values. Added bodyweight models use BW + added load; assistance uses BW − assistance on a known machine; neither model adds body mass to external tonnage. Per-implement forecasts remain expressed per implement. A coarse recovery option beyond a normal correction cap requires manual selection.

## Scope and strategy

LIVE uses capacity (repetitions + estimated RIR), the nearest breached target boundary, tolerance, damping, family caps and conservative available-load rounding. The bench reference matrix is tested in all 25 cells.

History is bounded to five comparable sessions within 90 days. It excludes future/current/foreign sessions and separates equipment, variants, tempo, ROM, method, roles and grouped positions. The local baseline uses eligible early sets, per-session medians and a weighted median over the latest three sessions. Outliers and older evidence reduce confidence or require confirmation.

Double progression requires the complete planned series, not a 75% majority. Linear sets and explicit percentage prescriptions use their own rules. Percentages require an identified measured maximum, estimate or training max. There is no universal plateau deload. Readiness changes the start once and does not modify recorded capacity.

SLDR/rest-pause segments use the initial segment for a capacity estimate, never summed mini-set repetitions. Grouped roles retain their context. Bodyweight, isometric, ballistic, cardio and mixed-protocol families do not inherit an ordinary kilogram forecast. Optional metric progression changes one agreed parameter after two completed matching sessions.

Calibration permits at most three loaded trials at the current target; the former repetition ladder is removed. An unfamiliar exercise and unresolved profile do not receive a guessed first weight. Tests require explicit authorization, an eligible family and suitable history. The initial test attempt remains a manual review decision. No isolation tests, attempts or backoffs are generated merely because the week is numbered eight.

## Applying and migrating

Apply validates the input fingerprint, selected pending target and current application fingerprint. It changes one selected future target, preserves the original coach prescription, rejects stale results and repeated application, and supports undo after serialization. Dismissal persists until relevant inputs change. Completed, skipped and failed sets are protected, including canonical-status imports without legacy `ok` flags.

Schema 3 migration is idempotent. It invalidates old pending recommendation caches while preserving completed facts. Existing raw manual strength entries remain editable; a context-free weight/repetition pair no longer generates a new precise e1RM. Historical derived values are not bulk rewritten. Explicitly editing an old context-free entry clears its unsupported derived estimate.

## Verification and limits

Local final validation (2026-10-24): 397/397 active Node tests, including 35 Engine 3 tests and all 25 reference-matrix cells. The production static build and strict 189/189 exercise-media audit pass. All four Chromium scenarios pass: active/focus recommendations, PWA persistence, program/mobile layout, and management/IndexedDB quota recovery. Full runtime results are recorded in `recommendation-engine-3-verification.json`.

Coverage inventory: 3,151 occurrences, comprising the canonical/declaration inventory and 2,477 source-program references plus clean runtime references. After grouping equivalent identity/source results, 434 rows are provisional, 673 manual_only and 21 resolved. These are grouped coverage rows, not counts of unique canonical exercises. Each row retains source names and reference IDs. Broad ambiguous names and missing variants explain much of the manual queue.


Automated checks cover normalization, all reference matrix cells, family and equipment models, strategies, comparable history, privacy boundaries, method roles, side results, calibration, stale Apply, undo and migration. Runtime checks exercise application storage, programs, focus flows, equipment editing and offline history. Real Chromium scenarios exercise shared active/focus advice, mobile hit targets, completed/coach weight protection, pain blocking, PWA caching and offline reload.

Engine 2's old numerical assertions are not reported as passing Engine 3. Their original sources and a list of superseded assertions are retained in [engine-v2-contracts/README.md](engine-v2-contracts/README.md). Relevant old UI fixtures were updated to supply matching equipment/tempo or assert explicit review where the new specification forbids a fabricated forecast. Existing unrelated storage, ownership, nutrition, program and tonnage checks remain active.

Passing code tests does not validate a machine's physical transfer ratio, confirm a provisional exercise variant, or clinically validate training prescriptions. Private custom/archive inventories and real-device Safari/Android testing were not supplied in this task. These limits remain visible through manual/provisional status and conservative refusal to calculate.
