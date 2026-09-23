# UNVRSL FIT v394

The active application is the existing static GitHub Pages project. This release changes the current exercise catalog, workout UI, cloud sharing and persistence; it does not add another interface or replace user data.

## Fixes

- Exercise detail now puts an explicit manual one-rep-max calculator near the top of the card. The estimate shares the same completed-set rules and Epley formula used in history; it is not saved as a workout or a personal record. Bodyweight movements need an actual body-mass entry. Exercises for which 1RM is unsuitable retain their appropriate historical metric.
- Weight increments remain the canonical per-exercise equipment profiles for auto-weight and recommendations. The editable increment field was removed from the exercise detail. Existing saved per-exercise overrides are preserved.
- Workout set weight is entered directly. The small +/- controls and the repeated “RPE и RIR необязательны. … кг” label were removed; effort remains optional.
- Cancel confirms the user's decision and atomically closes the active ID in IndexedDB together with the primary state. On IndexedDB failure, an intact localStorage transaction is attempted. A failed durable close keeps the workout in place, including on a quota-limited reload. Workout completion uses the same durable close.
- Program sharing updates the canonical cloud plan snapshot before issuing an invite. Acceptance waits for the recipient profile, serializes repeated taps and only clears the invitation after durable local persistence. The database function permits a consumed one-use invite to be retried by its already assigned original recipient; it remains unavailable to anyone else.
- Six exercise entries now reference local two-frame GIFs and matching static thumbnails. The three generated static illustrations have motion keyframes. The three hip-thrust variants use new barefoot anatomical motion keyframes. Each GIF is 384 × 384; thumbnails stay static and GIFs are lazy-loaded only when an exercise detail is in view. No other catalog IDs were changed.
- All shell/script URLs and the service worker use release 394 so older cached code cannot mix with this release.

## Verification

- `node --test tests/*.test.cjs` (includes sharing, 1RM and workload domain rules)
- `node scripts/audit-exercises.cjs --strict` (188/188 complete, no missing images, GIFs or profiles)
- `UNVRSL_JSDOM=... node tests/runtime-storage-v393.cjs`
- `UNVRSL_JSDOM=... node tests/runtime-v394.cjs` (direct weight input, manual 1RM, cancel failure/retry and reload under quota)
- `UNVRSL_JSDOM=... UNVRSL_CANVAS=... node tests/runtime-v392.cjs` (full start-to-finish session and sharing preview)
- The six GIFs were inspected for 384 × 384 geometry and two distinct motion frames. Cloud migration `invite_accept_retry_v394` was applied and verified with authenticated-only EXECUTE privilege.

The DOM integration simulation is not a physical iPhone/PWA test. A real trainer and client login were not used during this release verification, so invite behavior with actual recipient accounts still needs a device check.
