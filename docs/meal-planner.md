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

### v481 – everyday meals, ranges and client accent

- Client nutrition controls and the shared diary modal use the existing purple client accent. Protocol labels keep normal word wrapping on narrow screens.
- Calculator goals carry all four original ranges into the diary, daily status, remaining calories and substitutions. Generation minimizes distance outside each interval; an in-range value has zero penalty. Only menus actually inside all four intervals say «В диапазоне». Manual numeric goals retain the existing tolerance.
- Preference changes preserve calculator ranges. Editing numeric goals switches to manual targets. Saved v480 current protocols upgrade on open without modifying past-day goals or consumed snapshots.
- Added 48 everyday recipes: 71 simple recipes total, including 30 breakfasts, alongside 501 world recipes. New automatic menus use everyday recipes by default; the world-cuisine checkbox enables the broader pool. Catalog search and manual replacements retain the entire catalog and show everyday replacements first.
- 20 simple recipes link to 11 verified RussianFood and IamCook photo tutorials. Links are related cooking examples, clearly labelled: their ingredients and nutrition may differ from the adjusted in-app meal. No external photos or instructions are copied. All linked steps and photos open on the original website.
- Diaries remain local to the current device/account or hashed private share. This release does not add coach diary viewing or cloud synchronization.

### v482 – nutrition layout refinement

Energy has a full-width row in the plan calculator card, diary and menu summary; protein, fat and carbs keep three equal columns. Range values retain their original numbers and never use truncation. Diary progress tracks align consistently, the native date field loses its nested border, remaining calories can wrap as a whole line, and meal actions and ingredient quantities use explicit grids. Client purple and each app user's theme/accent stay intact. Existing diary and calculator behavior is unchanged.


## v484 – ready portions and own food

- 115 simple recipes (38 breakfasts) and 501 world recipes, 616 total. Added 44 independent everyday recipes. Shellfish and seed exclusion options cover the new ingredients.
- `servingWeight` estimates the cooked mass of simple meals from ingredient yields; uncooked assembled food uses its ingredient sum. Water and cooking methods vary, so cooked estimates are labelled ≈. World recipes have no guessed mass. A user can enter the measured final mass of the entire displayed serving, including all sides, excluding the container.
- Record cooked grams or a serving multiplier. Both controls describe the same portion; ingredient-derived macros scale with that fraction. Measured mass scales in consumed snapshots too. Original macro ranges and consumed history are preserved.
- Add own product/dish with per-100-g macros, grams and meal name. Save up to 100 reusable foods per account; duplicate names update the saved food, existing diary entries remain snapshots. Deleting a reusable food does not delete history.
- Ten user-supplied product reference sheets are optional lazy-loaded local images. Their incomplete/brand-specific values are not imported into the macro engine.
- Optional locally hosted photos show example plating, not exact recipe composition. Commons attribution and license links are visible under each photo; see `data/meal-photos-source.md`.


## v486 – compact recipe cards

Removed illustrative photos from the diary, recipe catalog and replacements at the user’s request. Cooked weights, recipe instructions and the user-supplied product reference sheets remain available.


## v487 – eggs and buckwheat

Added 16 egg dishes and 16 buckwheat recipes (some contain both). All use ingredient-derived macros, cooked serving estimates, allergy exclusions and the existing menu/replacement engine. The catalog now has 147 simple recipes and 501 world recipes, 648 total; 54 simple breakfast choices.


### v488 — случайный подбор
Каждое нажатие «Подобрать» заново выбирает незаписанные блюда с учётом КБЖУ, ограничений и времени готовки. Предыдущие блюда исключаются для соответствующего приёма, когда есть разрешённые альтернативы. Записанные приёмы сохраняются. Автоматическое открытие дневника не перемешивает меню.
