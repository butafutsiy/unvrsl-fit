# v513: per-hand plan weight display

Paired dumbbells and bilateral cable stacks now show `25 / 25 kg` (Russian
decimal notation for fractional weights) in routine previews, program
prescriptions, trainer client plan summaries, active weight fields and
recommendations. STANDARD, UNVRSL, DS, SLDR and FST-7 share the formatter.
Program fields explain that a entered weight applies to each hand.

The numeric stored weight is unchanged: 25 still means 25 per implement/side,
not a string or total of 50. Active inputs temporarily show the one numeric
weight while focused, then restore the paired display. Matching pair paste is
accepted; unequal pairs are rejected without corrupting the existing load.
Single-hand exercises and explicit total-load profiles keep one number.
Saved set equipment snapshots control display in the same way as tonnage.

Validation: 374 contract tests passed. DOM integration verified all five
strength prescription methods, focus/blur without mutations, comma decimals,
numeric editing, pair paste and preserved volume units. Weekly recommendation
and periodization UI integrations passed. JavaScript syntax and exercise and
nutrition audits passed. The shell and service worker advance to v513.
DOM tests are simulations, not physical iPhone/browser verification.
