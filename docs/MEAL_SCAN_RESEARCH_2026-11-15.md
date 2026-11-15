# Meal scan failure: rice, dal, raw banana sabzi and paneer bhurji

Research date: 15 November 2026 (Asia/Kolkata). Application commit inspected: `b99d936`, branch `feat/complete-ui-change-e2e`. This checkpoint changes documentation only. No new accuracy fix or model comparison is claimed.

## Conclusion

The reported 393 kcal is an unreliable estimate for the meal the user describes. The problem is not evidence of a bad API key. SATAT is successfully using `deepseek-flash` for image inference, but its image settings, recognition-to-database matching, portion assumptions, completeness checks and correction UX are insufficient for this mixed Indian meal. Changing providers might improve recognition; it will not by itself establish portion mass or recipe composition.

The photograph cannot establish 200 g or 400 g precisely. Treat the user's approximately 400 g cooked-rice statement as a correction, not as a mass measured from the image. At the 130 kcal/100 g value in SATAT's rice record, 400 g alone is about 520 kcal. The complete meal therefore cannot be 393 kcal under that corrected assumption. Around 1,000 kcal may be plausible with the other dishes, but it remains unverified without their portions and recipes. A USDA cooked-rice reference also lists 130 kcal/100 g; water content and rice preparation affect the applicable value. [USDA cooked-rice table](https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg20.pdf)

## What is observed, confirmed or inferred

| Evidence level | Finding |
|---|---|
| Screenshot | Labels show steamed rice ~200 g, scrambled egg masala ~90 g and fried fish pieces ~60 g; detected dish is Egg Bhurji; total 393 kcal; Boiled Egg chip selected. |
| User-supplied correction | Approximately 400 g cooked rice, paneer bhurji rather than egg bhurji, raw banana sabzi rather than the misidentified side, and dal also present. These identities are accepted as the user's knowledge of their meal, not independently confirmed from the screenshot. |
| Local configuration | `MEAL_VISION_PROVIDER=deepseek`, `DEEPSEEK_VISION_MODEL=deepseek-flash`, `DEEPSEEK_IMAGE_DETAIL=low`, `DEEPSEEK_THINKING_MODE=false`. API key contents were not read into the report. |
| Latest server trace | An Egg Bhurji request succeeded using DeepSeek, low image detail, one provider call, about 3.67 s server time and no nutrition-estimation fallback. It is consistent with this screenshot; raw image/component response was not retained, so the trace alone cannot prove the full per-component calculation. |
| Arithmetic inference | 200 g rice at 130 kcal/100 g = 260 kcal; 90 g whole egg at 148 kcal/100 g = 133 kcal after rounding. Their sum is exactly 393 kcal. This strongly suggests a rice-plus-egg subtotal; it is not a confirmed reconstruction of the original response. |

## Confirmed weaknesses in the current implementation

### 1. Visual detail is reduced repeatedly

The browser resizes to a 1024 px longest edge at JPEG quality 0.82 (`MealScannerModal.tsx:209`). The server can resize again to 768 px and JPEG quality 80 (`image-preprocessing.ts:30`). The configured provider then receives `detail: low` (`deepseek.ts:129`). DeepSeek documents low detail as downscaling to 512×512; high/original preserve more input detail. Small or visually similar side dishes are credible casualties of this setting. Its causal contribution to this particular mistake still needs an A/B test. DeepSeek currently supports images with `deepseek-flash`; this is not a text-only model accidentally being asked to see. [DeepSeek vision documentation](https://api-docs.deepseek.com/guides/vision/)

### 2. Typical-serving examples can bias portions

The vision prompt includes numerous gram and calorie anchors, a generic small thali example, and a moderate-oil homestyle default (`providers/common.ts:27`). These are examples, not measurements. The prompt requests precise numeric quantities while the input lacks calibrated scale/depth. That combination can favor a familiar serving over an unusually large mound. There is no measured per-component mass, plate dimension, second angle or calibrated interval.

### 3. Recognition, database availability and verification are conflated

The router accepts a canonical name match before applying confidence thresholds (`nutrition/router.ts:49`). The calculator then marks the item verified. This establishes that a database record exists, not that the photographed dish or gram amount is correct. A wrong egg guess can therefore receive canonical nutrition confidently.

The longest-contained-alias resolver still allows generic `egg` to match a descriptive scrambled-egg dish to `Whole Egg (Boiled)` (`nutrition/calculator.ts`, contained-alias pass; `database.ts:836`). Preparation and recipe differences can disappear. Similar broad mappings, such as potato masala/greens into generic sabzi, need review. Fixing only shake aliases did not solve this broader class of mismatch.

### 4. Missing food is not recovered by arithmetic

The response has separate `foods` and `visibleItems` lists. The route calculates from `foods` whenever it is nonempty, using `visibleItems` only as a fallback when the entire foods list is empty (`analyze-meal/route.ts:312`). It does not guarantee that every visible label has a corresponding calculated component. Food omitted from both lists, such as dal, is even harder to discover without a second inventory/check or user confirmation.

Unresolved items have null nutrition and block logging, which is good. But the main card can still show the sum of known items like a whole-meal total. That subtotal needs an explicit incomplete label. A review checkbox does not restore a missing ingredient or wrong identity.

### 5. Correction UX is at the whole-plate level

The current controls adjust a plate multiplier or a dish candidate. They cannot directly turn rice 200 g into 400 g while retaining the correct gram amounts for paneer, dal and banana. Doubling the plate would double every component incorrectly. Manual handoff edits aggregate macros rather than a structured component list.

The selected Boiled Egg chip has a separate confirmed cause: response parsing selects it for any `egg` text in `visibleItems`, including scrambled eggs (`MealScannerModal.tsx:388`). It should represent an explicit user-added boiled egg, not a recognition synonym. The existing de-duplication attempts to avoid double-counting already detected egg; the screenshot does not establish that an extra egg's calories were added.

### 6. Oil and uncertainty are handled too simply

The route reduces fat by 25%, capped at 8 g, when a hint says home-cooked/low-oil. Home cooking alone does not establish this reduction. The calculator's ±15% range is a fixed spread; it does not propagate uncertainty in food identity, grams, hidden oil or missing components. It is not a calibrated confidence interval and cannot cover all errors in this screenshot.

### 7. Nutrition coverage/provenance is incomplete

The local `FoodCompositionItem.per100g` contains calories, protein, carbohydrate, fat and fiber. It has no vitamin/mineral fields, source food ID, recipe ingredient breakdown, cooked yield, retention factor or nutrient completeness metadata. Header comments referencing IFCT/USDA do not replace record-level provenance. No dedicated raw-banana sabzi entry was found. A larger database alone will not fix a wrong visual match, but it is needed for useful nutrient coverage and preparation distinctions.

### 8. The previous evaluation was too weak

Five smoke checks tested a dish-family regex, HTTP success and a finite total, plus coffee/no-food guards. They did not require all components, exact dish identity, gram accuracy, recipe correctness or weighed calories. `toast|avocado|egg` can pass while another component is missed. Five passing cases must not be described as meal accuracy validation. The improvements in latency and specific portion bugs are real observations; overall nutrition accuracy remains unmeasured.

## What MyFitnessPal actually documents

MyFitnessPal says its recognition models were trained on millions of photos and suggest foods from its verified database. Its workflow asks users to select suggestions, adjust servings and add missed items. It explicitly anticipates wrong suggestions and recommends scanning dishes individually for better suggestions. This supports a design centered on editable components, rather than trusting one automatic total. The documentation does not provide a controlled accuracy figure for this meal or disclose a reproducible model architecture; it cannot establish that MyFitnessPal would outperform SATAT on this specific photo. [Official Meal Scanner help](https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner)

MyFitnessPal supports tracking vitamin A, vitamin C, calcium, iron and potassium. These values are associated with logged food data; the camera is not measuring vitamin molecules. Correct food, preparation and amount are prerequisites, and nutrient coverage can vary by database entry. [Official micronutrient help](https://support.myfitnesspal.com/hc/en-us/articles/360032625091-Nutrition-101-Vitamins-Minerals), [food nutrition preview](https://support.myfitnesspal.com/hc/en-us/articles/360032621791-How-to-preview-nutrition-information-before-logging-a-food)

## Research implications for SATAT

Nutrition5k includes component weights, multiple captures and depth information precisely because absolute meal nutrition requires more than a dish label. It is useful evidence for weighed evaluation, not proof of performance on Indian home cooking. [Nutrition5k, CVPR 2021](https://arxiv.org/abs/2103.03375)

DietAI24 separates food identification, portion selection and nutrient-database retrieval. That supports SATAT's general two-stage direction, while also showing why independent evaluation of each stage matters. Published benchmark gains do not transfer automatically to our implementation or this meal. [DietAI24 paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12589391/)

For Indian recipes, IFCT is valuable but mostly reports raw foods, except poultry/egg. A cooked dish needs ingredient quantities, added fats, cooking yield and suitable nutrient-retention treatment; raw rice values cannot be applied directly to cooked-rice grams. USDA FNDDS provides prepared-food nutrient/portion data, but local recipes still vary. Missing nutrient data must stay unknown rather than become zero. [NIN IFCT general information](https://www.nin.res.in/ebooks/IFCT2017.pdf), [USDA data types](https://fdc.nal.usda.gov/data-documentation/), [USDA missing-data explanation](https://fdc.nal.usda.gov/docs/BFPDB_Doc_Aug2018.pdf)

## Recommended implementation order

1. **P0: Make every component reviewable.** Show food identity, alternatives, grams/household units and source per row; support replace/add/remove; label incomplete totals; never label a photo-identified food as verified solely because its name matched. Separate explicit add-ons from recognition.
2. **P0: Honor corrections deterministically.** The user's rice=400 g, paneer bhurji, raw banana sabzi and dal corrections should update those rows without another model overruling them or multiplying the rest of the plate. Ask only the necessary question for hidden oil/ambiguous paneer-vs-egg.
3. **P1: A/B image quality and recognition.** Compare current low-detail baseline against higher-resolution DeepSeek and an alternative available vision model on the same consented original photos. Test whole image plus dish crops/completeness review. Higher resolution is a hypothesis to test, not a promised fix. Log model/version, prompt, resolution, repeat variation, latency and cost.
4. **P1: Replace anchoring with calibrated portions.** Prefer supplied grams; otherwise provide editable household units/ranges, ask for a plate/bowl size or optional second angle, and preserve uncertainty. Remove automatic homestyle fat discounts.
5. **P1: Ground recipes and micronutrients.** Use record IDs and preparation-aware matching; cover paneer bhurji, cooked dal and raw-banana sabzi recipes explicitly. Add vitamins/minerals only with source/units/completeness metadata; use null for unavailable values. Do not ask an LLM to invent micronutrient numbers.
6. **P1: Establish a real acceptance benchmark.** Begin with 30–50 weighed representative meals and repeat scans across angles/lighting. Include large rice portions, dal over rice, paneer-vs-egg, banana-vs-fish/potato, oily curries, occlusion and multiple plates. Keep development and held-out meals separate. Compare models and MyFitnessPal using the same original images if access permits; no winner is assumed.

### Benchmark measurements

| Stage | Required measurement |
|---|---|
| Inventory | Food precision/recall, missed-component rate, hallucinated-food rate |
| Identity | Per-component correct dish/preparation, especially paneer vs egg and banana vs fish |
| Portion | Gram MAE and relative error, separately with/without supplied scale |
| Nutrition | Meal calorie/protein MAE, median relative error, catastrophic undercount rate; recipe-derived reference with uncertainty |
| Trust | Accuracy by confidence bin; review/abstention coverage; whether intervals cover reference totals |
| Micronutrients | Error and coverage only where reference nutrient data exists; never score unknown as zero |
| Product | Correction time, number of questions, latency and provider cost |

Suggested acceptance rule to agree before implementation: this exact corrected meal must retain all four user-specified components, never substitute egg/fish, honor the supplied rice grams, and not present a partial calculation as the complete meal. Numerical accuracy targets should be set against measured meals rather than chosen to make one photograph land near 1,000 kcal.

## Checkpoint verification

Application code is unchanged in this research checkpoint. Full Vitest rerun: **67 files passed, 740 tests passed, 26 skipped**. Production build rerun: **passed, exit 0**, all 34 routes generated; existing non-fatal image/hook lint warnings remain. No personal screenshot was uploaded to an external model, no new API key was requested, and no live cross-provider accuracy result is claimed.
