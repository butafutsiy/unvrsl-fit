# Nutrition menu and diary

Entry: Plan → Menu and nutrition diary, or the existing calorie calculator.
The engine is original JavaScript, runs offline, and has no external API or model dependency.
No third-party recipe code, scraped Food.com data, or image assets are incorporated.

## Calculation

- Goals import the existing calculator's midpoint calories/protein/fat; carbs use the remaining energy.
- Users can edit all targets, select 3–5 meals, exclude ingredients, and limit cooking time.
- The initial catalog contains 23 original simple meal templates. Food values are generic reference estimates,
  with calories computed as 4P + 9F + 4C, and are explicitly described as approximate in the interface.
  They do not replace a manufacturer's label. Ingredient weights are edible uncooked weights unless marked ready-to-eat.
- Candidate recipes are filtered before selection. Beam search selects a daily combination;
  bounded coordinate descent adjusts ingredient grams across the whole day. Eggs use ~50 g whole units.
- Targets are soft. Actual totals and differences are displayed; ±10% (with small absolute tolerances)
  is the UI fit indicator, never a guarantee of clinical precision or a guarantee for every configuration.
- Swapping preserves other meals; regenerating preserves consumed snapshots. Manual food records subtract
  from the planning target. Impossible/exceeded goals display differences rather than deleting consumption.

## Storage and scope

State: `st.mealNutritionV1`, included in the existing account-local persistence and JSON backups.
Daily menu, consumed meal snapshots and manual label-based records are separate. Dates are device-local.
Account switches guard stale modal actions. This release does not add cloud trainer diary synchronization,
barcode lookup, custom recipe editing, or seven-day automatic planning.

## Verification

`node --test tests/meal-engine.test.cjs` verifies target fit, bounded portions, exclusions,
immutable consumed meals, swaps, target import, and input validation.
`node tests/runtime-meal-planner.cjs` exercises UI persistence, dates, manual records and account changes.
