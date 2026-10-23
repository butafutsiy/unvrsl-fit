# v522 – Load calibration and workout focus

Empty adaptive resistance exercises now offer a first-load calibration instead
of presenting an unexplained zero. The selectable probe targets are 12, 10, 8,
6, 4 and 2 repetitions. These are choices, not a required six-set ladder.
Up to five attempts can use one load or a one-step adjustment based on reported
RIR. Actual repetitions and effort must be entered; a preliminary estimate can
be saved after one valid probe. Pain stops calibration, technique failures and
very easy probes remain visible but do not supply strength evidence.

Calibration sessions are nested evidence in the current workout payload. They
use the canonical domain estimate, equipment and technique identities, rounding
and prescriptions. They do not mark work sets complete, add workouts to the
journal or introduce a second e1RM formula. Repeated rendering/saving cannot
apply the same calibration as a fresh strength update. Completed workout
payloads already carry these nested records through existing synchronization;
no database schema or authentication change is required.

Focus opens from the workout header or an exercise card. It shows one actual
set with its assigned/recommended weight, rep and effort targets, editable actual
result, RIR buttons, technique and pain flags. It uses the regular validated
completion path. Adaptive weights consume canonical proposals; prescribed,
manual, completed and dismissed weights retain their existing protections.
The legacy focus entry points delegate to this interface and cannot bypass
actual-result entry. A failed draft save leaves the set incomplete.

Normal exercises retain set order. Explicit supersets and trisets rotate by
round: A1, B1, transition/full rest as prescribed, A2, B2. Method phases identified
only by `g` are not reclassified as supersets. Unequal set counts and skipped
sets are supported. Constructor SUPERSET blocks expand to distinct exercises
on launch, with their own repetitions and weights; copy/share autoweight also
clears their nested item settings. Original source programs are preserved.

One persisted timer handles work, rest and transitions. Natural completion or
an explicit end of rest reveals the next set. Closing focus retains the normal
workout; drafts preserve actual sets, calibration evidence and focus position.
The focus overlay hides background navigation, supports keyboard exit, follows
the selected theme and keeps the work-set save action at the bottom. Small
screens wrap the RIR controls to preserve usable touch targets.

Validation:

- Unit and contract suite, including calibration identities, owner isolation,
  multiple rep targets, supersets, skipped sets, units and manual protections.
- Full DOM scenario: first-load wizard, two real probes, canonical autoweight,
  A1/B1/rest/A2 via the actual timer, real set recording and draft reload.
- Constructor superset launch, including mixed manual/auto load and rep targets.
- Existing eight-week method and equipment keep/auto delivery scenarios.
- Browser visual inspection of the focus overlay and fixed save action.

Native iPhone keyboard and authenticated cross-device synchronization were not
tested. The browser visual check used a desktop viewport; it is not an iOS test.
