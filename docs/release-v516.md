# v516: muscle-based replacement and full catalog search

Replacement resolves the canonical exercise and its aliases before legacy
metadata. Hip thrust no longer falls through to the upper-arm fallback.
Similar exercises require a muscle/movement relationship within the same body
region; equipment alone cannot qualify a recommendation. Romanian deadlift
variants rank above different movements. Good mornings remain searchable in
the full catalog, but are not default substitutes for other exercises.

The sheet has Similar and All exercises tabs. Typing always searches the whole
catalog, including aliases, muscles and equipment, with multiple words in any
order and normalized hyphens and ё/е. Pagination never truncates the searchable
pool. Hack squat recognizes «в гаке», «гакк приседания» and its English source
name. Russian canonical titles render directly, avoiding repeated equipment
phrases.

Selection updates every entry in a grouped method, preserving set count, reps,
effort targets, tempo, rest and method suffixes. Old movement weights,
recommendations and equipment snapshots are cleared; recommendations recalculate
for the new identity. Completed sets, pending completion and stale session
sheets are protected. This release includes the existing v515 per-leg repetition
behavior.

Validation: 378 contract tests passed. Replacement DOM integration passed for
hip thrust, hack squat alias search and selection, unrelated-muscle global
search, pagination, grouped methods, RDL ranking, load reset, completed-set lock,
stale sheets and per-leg display. Shell and service worker advance to v516.
The DOM tests simulate interaction and do not constitute physical iPhone testing.
