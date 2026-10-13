# v512: consistent external workout tonnage

The trainer and client workout journals used raw weight × repetitions and
undercounted paired dumbbells and cable crossover stacks. Share cards and the
trainer's client view could also show outdated `advancedMetrics.tonnage`.

- `WorkoutDomain.tonnageLoad` is the shared per-set external load calculation.
  Completed set equipment snapshots and explicit counts/total-load units win
  over defaults. Dumbbell recommendations and strength estimates still use the
  weight of one dumbbell. Plate-loaded equipment retains its side count and
  implement weight.
- Default bilateral cable crossovers count both stacks. One-stack settings and
  equipment profiles that record total load are not doubled.
- Bodyweight exercises contribute their additional external load; body mass
  is not added to external tonnage. Assistance, timed and distance work do not
  contribute an invented external weight.
- Journals, workout completion, muscle statistics, strength-series volume and
  share cards calculate from completed working sets. Saved totals are used only
  for summary-only share payloads without raw exercises. Old sessions are not
  mutated, and warmups/skipped/incomplete sets remain excluded.
- Shell, dynamic assets and service worker advance together to v512.

Validation: 371 contract tests passed; screenshot regression gives per-exercise
totals 2880, 2112, 1710, 1440, 1350, 1170 and 323 kg, totaling 10985 kg instead of
7094 kg. DOM integration checked trainer history, client history, trainer client
view, workout metrics and muscle statistics. Full workout integration and real
PNG export checks (six layouts, two designs, two backgrounds and 30 comparison
variants) passed. JavaScript syntax, exercise audit and nutrition audit passed.
DOM/canvas tests are simulations, not a physical iPhone/browser check.
