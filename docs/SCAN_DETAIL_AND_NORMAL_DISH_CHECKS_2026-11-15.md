# Scan detail UI and normal-dish checks

15 November 2026. Current branch: `feat/complete-ui-change-e2e`. No push or deployment.

## UI changes

The result now follows the deployed reference hierarchy: a fitted meal photo, a botanical dark card containing the detected meal title, horizontal calorie donut/macros, compact component pills and the terracotta log action. Each pill still opens the existing independent name/amount editor. Possible-missing-food review, incomplete totals, Save/Cancel and disabled logging while editing remain intact. Nutrition/source inputs stay behind a disclosure; unavailable vitamins stay hidden.

The photo can toggle between a filled frame and the full original composition so cropped side bowls can be inspected. A short estimated-portions badge replaces repeated descriptive food overlays. Components are listed once from the counted inventory. Whole-plate multipliers and candidate replacements that could overwrite individual corrections were not restored. After an explicit user edit, the title becomes “Your meal”; repeated identical components use their actual component name instead of an unsupported candidate title such as “Protein Smoothie”.

## Bugs found and fixed in the broader run

- **Pure-fat recipe match:** Butter Chicken 200 g matched the plain-butter alias, producing 1,434 kcal for that component. Generic butter/ghee containment no longer classifies recipes as pure fat; exact butter, Butter Naan and Paneer Butter Masala references remain supported. A later live Butter Chicken result used an explicitly labelled AI recipe estimate (360 kcal for the guessed 200 g). That is a corrected routing path, not a measured calorie truth.
- **Per-unit multiplication:** a response with `basis: per_unit` and no optional `nutritionPerUnit` object ignored the requested count. Two Pav pieces now multiply one-unit values by two. Regression verifies calories, all macros and calorie range.
- **Dry versus prepared oats:** cooked oatmeal/porridge/bowls no longer match Rolled Oats (Dry). Removed the misleading “oatmeal” alias from the dry ingredient so editor lookup agrees with scan routing. Explicit dry/raw oats remain supported. The targeted live bowl used an AI estimate rather than 250 g of dry oats.
- **Prepared rice fallback:** curd/yogurt/coconut/lemon/tamarind/fried rice without an exact supported recipe no longer collapses through a generic rice alias. Exact known recipe matches remain supported. The targeted curd-rice side stayed unresolved and the response was marked incomplete.

## Live test method and results

Used the existing local fixtures through the real analyze-meal route with DeepSeek high detail. Only the test session is mocked; preprocessing, provider calls, food routing, AI estimates and calculation run normally. No meal records are saved. Credentials are not included in evidence.

Manually reviewed the photos before setting coarse visible-category expectations. Legacy filenames are not reliable labels: file 05 shows idli/chutney rather than vada; 06 shows pav bhaji rather than chole bhature; 09 has an ambiguous mixed protein salad; 12 is mixed pasta rather than proven arrabbiata; 13 shows berry drinks, not demonstrated protein powder/banana.

| Fixture | Coarse visual check |
| --- | --- |
| 01 mixed Indian meal | Rice and curry |
| 02 curry and flatbread | Naan/flatbread and curry family; protein identity unverified |
| 03 two rice bowls | Biryani family; chicken/vegetable identity unverified |
| 04 dosa plate | Dosa plus sambar/chutney |
| 05 idli plate | Idli plus chutney |
| 06 pav bhaji plate | Bread/pav plus vegetable curry |
| 07 fried pastries | Samosa |
| 08 breakfast/fruit bowls | Porridge/yogurt family plus fruit |
| 09 mixed salad | Salad/vegetables plus a visible protein family |
| 10 toast | Egg and toast/bread |
| 11 fish plate | Fish and vegetables; species unverified |
| 12 mixed pasta | Pasta family |
| 13 berry drinks | Smoothie/berry drink family; supplements unverified |
| 14 black coffee | Coffee and <=15 estimated kcal guardrail |
| 15 desk | No-food guardrail |

The initial run passed 14/15 checks; the curry case's regex omitted the name “Butter Chicken”. The corrected expectation includes that curry-family name; it does not certify whether the chunks are paneer or chicken. The second full run passed **15/15** coarse checks, with mean observed end-to-end latency about **8.0 seconds**. After the additional prepared-oats/rice guards, the two relevant photos passed **2/2** follow-up checks. Retain both runs: their different expectations and stochastic portions mean they are not a controlled accuracy comparison.

Evidence: `artifacts/scan-evaluation/normal-dishes-2026-11-15.json`, `normal-dishes-after-guards-2026-11-15.json`, `prepared-food-guards-2026-11-15.json`. These are developmental smoke cases already used during implementation, not a held-out dataset. A regex hit is not full component recall or recipe/portion correctness.

## What is still not established

**It is not accurate for every normal dish.** There are no weighed references, so calorie/protein error, percentage accuracy and improvement in measured accuracy cannot be reported. Important remaining limits are:

- Similar curries, paneer/tofu/egg/meat identity, hidden oil/sugar/supplements and mixed-recipe composition remain uncertain.
- Default container/piece conversions can be unsuitable for a particular bowl, berry, egg or piece. The live berry case treated three strawberries through a generic berry-serving reference. Review gram amounts; a passing category check does not validate them.
- Descriptive annotations can still create redundant possible-missing-food questions. They do not add calories automatically, but resolving them can add friction. Some composite foods need a review of which sides/ingredients are already included.
- The mixed pasta result was unresolved/zero subtotal in one run and estimated in another. The UI blocks incomplete logging; this demonstrates variability, not universal support.
- Two visually similar unweighed runs can change guessed grams and totals substantially. Recipe/reference coverage and weighed held-out meals are required before a broad accuracy claim.

## Verification and review

Final validation: **70 test files passed; 779 tests passed, 26 skipped, zero failures. Production build passed, exit 0, all 34 routes generated.** Existing non-fatal lint warnings remain. Browser control repeatedly timed out on this revision, including reconnecting to the existing tab and inventory requests. Therefore the new card has **not** received a fresh browser visual/interaction check or screenshot; earlier screenshots belong to the previous layout. No claim of pixel-perfect matching, dark-theme verification or physical-device verification is made.

To review locally: open `/dashboard/diet`, scan a photo, inspect the single dark result card and tap a component. Cancel should preserve the previous amount; Save should change only that component. Check the filled/full-photo toggle, possible-missing-food actions and the disabled log action while editing. Repeat at 320/393 px and desktop widths in light and dark themes. Do not save a test meal into an account with real records just to check the presentation.
