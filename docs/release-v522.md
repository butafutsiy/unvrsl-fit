# v522 – Load calibration and workout focus

Empty adaptive resistance exercises offer a first-load check instead of an
unexplained zero. The default goal comes from the current work set's rep and
RIR targets. Up to three probes adjust one available equipment step, hold, or
reduce according to actual reps, effort and technique. The 12/10/8/6/4/2 ladder
is optional, under advanced settings. A fitting isolated probe can be explicitly
credited as the first work set through the regular validated completion path.
Its stable attempt ID is omitted from nested calibration evidence, preventing
it from contributing twice. The rest timer retains time already spent resting.

Unknown effort is an explicit choice. Actual results remain saved, but no exact
RPE or strength anchor is invented and next-set weight cannot rise from this
observation. A fitting unknown-effort probe can retain its chosen weight without
claiming a strength estimate. The open-ended 6+ RIR entry is also marked as
censored effort in actual work sets. Pain stops that exercise; technique failures
and very easy probes do not supply calibration strength evidence.

Calibration sessions are nested evidence in the current workout payload. They
use the canonical domain estimate, equipment and technique identities, rounding
and prescriptions. Saving evidence alone does not complete a work set or add journal workouts.
Explicit credit completes one work set. No second e1RM formula is introduced. Repeated rendering/saving cannot
apply the same calibration as a fresh strength update. Nested probes and real
work from the same parent workout count as one strength observation. Other
rep ranges remain provisional until observed in later work. Completed workout
payloads already carry these nested records through existing synchronization;
no database schema or authentication change is required.

Focus opens from the workout header or an exercise card. It shows one actual
set with its assigned/recommended weight, rep and effort targets, editable actual
result with equipment-aware −/+ buttons, RIR buttons, technique and pain flags.
Its green-black cards, lime highlights, large recommended-load display and
effort explanation follow the supplied second reference image. It uses the regular validated
completion path. Adaptive weights consume canonical proposals; prescribed,
manual, completed and dismissed weights retain their existing protections.
The legacy focus entry points delegate to this interface and cannot bypass
actual-result entry. A failed draft save leaves the set incomplete.

Normal exercises retain set order. Explicit supersets and trisets rotate by
round: A1, B1, transition/full rest as prescribed, A2, B2. Method phases identified
only by `g` are not reclassified as supersets. Unequal set counts and skipped
sets are supported. Missing first loads are checked before the first round;
those probes remain separate from the fatigued rounds. Superset results cannot
raise an isolated exercise baseline, or confirm a matching isolated work series. Constructor SUPERSET blocks expand to distinct exercises
on launch, with their own repetitions and weights; copy/share autoweight also
clears their nested item settings. Original source programs are preserved.

One persisted timer handles work, rest and transitions. Natural completion or
an explicit end of rest reveals the next set. Closing focus retains the normal
workout; drafts preserve actual sets, calibration evidence and focus position.
The focus overlay hides background navigation, supports keyboard exit, uses the
requested dark green focus theme and a prominent work-set save action. Small
screens wrap the RIR controls to preserve usable touch targets.

Validation:

- Unit and contract suite, including calibration identities, owner isolation,
  multiple rep targets, supersets, skipped sets, units and manual protections.
- 421 passing unit/contract tests.
- Full DOM scenario: current-target default, optional steps, two real probes,
  canonical autoweight, credit/save failure retry without duplicate evidence,
  unknown-effort work, superset preflight, A1/B1/rest/A2 via the real timer,
  real set recording and draft reload.
- Constructor superset launch, including mixed manual/auto load and rep targets.
- Existing eight-week method and equipment keep/auto delivery scenarios.
- Browser visual inspection at 390px and 320px iframe viewports, including
  horizontal overflow and minimum 44px RIR and stepper touch targets.

Native iPhone keyboard and authenticated cross-device synchronization were not
tested. Mobile-width browser inspection is not a native iOS test.
