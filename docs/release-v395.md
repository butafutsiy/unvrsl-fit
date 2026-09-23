# UNVRSL FIT v395

## Statistics, exercise media, and light theme

- Muscle-map tonnage now uses the same merged local and cloud session history as the muscle map and follows its 7- or 28-day filter. ISO/date-string workout dates are parsed as dates, so synced sessions no longer disappear from the calculation. Only completed sets contribute; sets whose effective load cannot be known are disclosed instead of being presented as zero-tonnage work.
- The dumbbell step-up remains mapped by its stable catalog ID to the verified 12-frame ExerciseDB GIF rather than a static thumbnail; the detail viewport stays square and scales the full image without cropping. The six recent local exercise GIFs now animate in list cards and detail views. Each uses a square 384 × 384 canvas, consistent frame delays, and infinite looping; list GIFs load only when visible and stop offscreen.
- Settings now offer a persistent dark/light appearance choice. The light theme covers core navigation, workout, exercise, statistics, form, and sheet surfaces. The selected theme is applied to browser controls and the iOS/PWA theme-color metadata. The service worker precaches the theme stylesheet with the current shell.
- Shell and deferred-loader URLs use release 395 so an older PWA cache cannot restore the previous UI.

## Verification

- `node --test tests/*.test.cjs`: 141 passed.
- JavaScript syntax checks and `git diff --check` passed.
- GIF checks verified 384 × 384 canvas size for every frame, multiple frames, and infinite-loop metadata for all six updated local animations. The canonical step-up source retains its verified 12-frame, 180 × 180 logical GIF and square detail viewport.
- No physical iPhone/Safari or installed PWA was available for this run; the live-device appearance still needs confirmation on-device.
