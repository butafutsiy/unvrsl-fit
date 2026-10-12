# Recipe dataset attribution

Recipe data: UniTools — theunitools.com, CC BY-SA 4.0.

Source: https://github.com/farcrak/unitools-recipes/blob/main/unitools-recipes-v1.json
Dataset landing page: https://theunitools.com/en/data
Version: 2.0.0, generated 2026-09-02; imported 2026-10-10.
Upstream file SHA-256: 41fdc0572b7272ca557d2df22a0fac1cc1f18146e97ebd2c8258c395daf87d8a
License: https://creativecommons.org/licenses/by-sa/4.0/
Full license: licenses/unitools-CC-BY-SA-4.0.txt

The adapted dataset in `meal-recipes-data.js` remains CC BY-SA 4.0. Changes: Russian-only text, omitted photos and summaries, normalized nutrient keys, derived meal slots and total minutes. All 501 recipes preserved. Nutrition is the publisher's ingredient-based estimate per serving, not independently verified.

Portions scale all ingredients linearly to keep nutrient ratios constant. Source quantities describe the original batch; cooking steps may refer to that batch. Fractional eggs/pieces describe a fraction of the prepared batch, not an instruction to buy fractional units. Base batch size remains visible. Source allergen metadata is incomplete, so imported recipes are excluded from automatic recommendations whenever allergen exclusions are enabled. Vegetarian filtering uses publisher diet tags.

## v496: original everyday meals and pork reference

42 new original recipes were written for the app: 24 use lean pork tenderloin, 18 use other everyday foods. No recipe text or images were copied. The simple catalog now has 189 recipes, including 62 breakfast choices; with the 501 licensed world recipes, the total is 690.

The `pork` food entry describes **raw, boneless pork loin tenderloin**, not a generic fatty cut or commercial mince. Per 100 g: 128 kcal, 20.65 g protein, 3.53 g fat, 0 g carbohydrate. Values come from USDA Agricultural Research Service, *USDA Nutrient Data Set for Fresh Pork (From SR), Release 2.01*, tenderloin table (PDF page 13): https://www.ars.usda.gov/ARSUserFiles/80400525/Data/Pork/Pork1-1.pdf. Published energy is used directly rather than recomputing it from 4/9/4; these figures are approximate reference values. Other cuts and branded products need their own label values. Ground-pork recipes explicitly ask the user to grind tenderloin.

Cooked pork mass uses an approximate yield factor of 0.75, solely for the displayed serving estimate. It does not change ingredient-derived nutrition. Measured final mass remains the basis for exact portion fractions.

## v503: исправление справочника

Ссылка прежнего описания свинины ведёт на Fresh Pork Release 1.1 (2007), а не заявленный Release 2.01. Новые расчёты используют проверенную запись NDB 10060 из SR28: сырая вырезка, только отделяемая нежирная часть. Старые снимки дневника не переписываются. Текущая атрибуция и методика находятся в `nutrition/SOURCES.md`.
