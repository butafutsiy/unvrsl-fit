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

## v478: expanded recipes and compact interface

524 total recipes: 23 original recipes plus 501 adapted UniTools recipes in Russian, licensed CC BY-SA 4.0. See ../data/meal-recipes-source.md. Bundled data works offline through the existing shell cache. The engine adjusts complete imported serving portions from 0.5 to 2.5 servings without changing ingredient ratios. Imported recipes are excluded from allergen-filtered recommendations because source metadata is incomplete.

The catalog supports text/product/cuisine search, meal filters, 24-item paging and selecting an uneaten meal to replace. Selection preserves other meals and consumed snapshots. Daily metrics show consumed totals; menu totals include manual food records. Compact date navigation, progress bars, ingredient steps, and source attribution work in both themes.

## v480: selected protocols and client menus

Calculator goal buttons save the active cut/maintain/gain protocol and exact midpoint targets. The calculator card and diary show the active protocol. Opening the menu builds a day against these targets; changing goals or recalculating refreshes the current day while preserving consumed snapshots and past days. Manual target edits switch to custom macros. The menu entry moves directly after the calculator even when the calculator mounts later.

Replace opens a searchable meal-specific picker, ranked against the day budget after other meals and manual food. Preview portions use the same fitting function as selection. Opening the picker does not change persisted data; choosing a recipe replaces only the selected uneaten slot.

Shared client progress pages load the same catalog, engine and diary UI using a context adapter. They use only the nutrition goals already returned by the existing private-share RPC. Protocol and diary data are stored locally under the share's SHA-256 hash, isolated per private client link. No raw share token is stored. Diary records are not synced to the trainer or across devices. Supabase schema, permissions and RPCs are unchanged.
