# v515 – repetitions on each leg

Unilateral leg exercises show left/right repetitions in the workout, program editor,
plan previews, recommendations and workout history editor. Existing totals remain
unchanged: 24 is displayed as 12 / 12. A single entered 12 means 12 on each leg;
12 / 10 records an asymmetric result as 22 total. Program target fields use equal
pairs; their From/To controls still describe a repetition range, not separate legs.

The stored actual repetitions remain totals for journal compatibility and tonnage.
Strength estimates and load progression compare repetitions per leg. Asymmetric
sets use the lower side count for strength estimation. Manual legacy plan ranges
remain totals; resolved workout targets and weekly automatic ranges are per leg.
An explicit per-leg legacy description is honored and saved with an unambiguous
counting mode when edited. Bilateral exercise repetition fields remain unchanged.

Validation: 378 contract tests; new unit tests and full DOM scenario covering
legacy display, numeric/slash/asymmetric input, invalid input, serialization,
plan edit/save/reopen/save/start, and target units. Existing paired weight, tonnage,
weekly recommendation and all 40 eight-week launches passed. JavaScript syntax,
strict exercise catalog and nutrition audits passed.
