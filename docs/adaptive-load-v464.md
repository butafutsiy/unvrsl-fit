# Adaptive load recommendations, v464

The e1RM-based engine and the trainer's programme remain authoritative. This
change does not replace them with a mandatory double-progression cycle and
does not alter exercises, weeks, prescribed weights or completed workout data.

## Decisions

- Historical strength for ordinary working sets is computed without today's
  unfinished session. Live performance has a separate next-set suggestion.
- Recent complete, uniform series with matching rep and effort targets provide
  an analogous prescription. Its median estimate has 70% weight, with the
  existing robust strength estimate supplying the remaining 30%.
- An on-target series retains its working weight and can suggest one additional
  total repetition, conditional on staying within the prescribed effort.
- A genuinely easy series can increase through e1RM after one workout. There is
  no new universal two-session gate. The existing fallback for mastered series
  now requires all sets, rather than 75%, and checks recorded completeness.
- One late miss blocks progression without declaring loss of strength. Two
  complete comparable series with misses suggest one lower starting increment.
- Skipped/unrecorded sets, or adding more sets than the past workout contains,
  cannot justify a heavier recommendation. Legacy records cannot reveal sets
  that were never stored; this check is necessarily bounded by recorded data.
- Same-task upward changes are capped at 5% after equipment rounding. A changed
  repetition/effort task retains the prior engine's broader 32% projection
  corridor. Added/assisted bodyweight uses a separate absolute step, not a
  percentage of zero or a small additional weight. Profile overrides are
  `maxIncreaseFraction`, `maxRebaseFraction`, `maxAddedLoadIncrease`.
- Missing live effort does not infer RPE from missed repetitions. With no effort
  evidence anywhere, ordinary weight recommendations cannot be applied, though
  workout recording still works. Existing older effort evidence remains usable.
- Progression and weekly rebase are not independently added to a method's
  already increased prescription. Incomplete method blocks constrain increases;
  UNVRSL also checks its other stages before raising the heavy anchor.
- Readiness stays separate, is applied once before live evidence, and does not
  rewrite the strength estimate. Existing explicit manual readiness overrides
  and user-entered weights remain protected.

## Bounded forecast calibration

The correction is an engineering heuristic, not a validated physiological
model. It replays one-step e1RM forecasts on completed same-target, same-role,
same-equipment ordinary series with known effort, matching tempo/rest and no
readiness or deload flag. Targets are predicted only from earlier observations.
It uses at most seven sessions from 56 days, 3–10 reps and RPE 7–10. A minimum
of three forecast errors (five qualifying sessions) is required. Errors must
agree in direction in at least 80% of cases, median absolute deviation must be
at most 2%, and the median error at most 8%. Half the median error is applied,
bounded to ±2.5%; changes smaller than 0.5% are ignored. Without that evidence
the correction is exactly 1. It is not shared across users or exercises, and
does not affect special methods, assisted load or per-side estimates.

These defaults should be evaluated against real owned history before changing
the thresholds. The current validation uses deterministic synthetic fixtures,
not a claim of measured improvements in actual client training outcomes.

## Interface and verification

Recommendation details show the recorded series and a total-repetition goal
when appropriate. Applied forecast corrections show their sample count. The
apply controls and AUTO path both honour the insufficient-effort result.

Regression coverage includes normal progression, a single vs repeated miss,
incomplete series, larger set counts, new rep targets, coarse dumbbell racks,
missing RPE, live vs next-session separation, readiness after reload,
calibration evidence/leakage/isolation, improving effort, manual edits and
dismissed proposals. Existing whole-app and eight-week/method scenarios remain
part of verification.
