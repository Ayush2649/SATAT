# Meal scan component review — implementation checkpoint

15 November 2026. Branch: `feat/complete-ui-change-e2e`. No push or deployment.

## Delivered behavior

The scan result shows editable dish/amount pills, Add food, then a compact horizontal calorie donut and carbs/fat/protein readout. Name and amount edits open only for the selected dish. Recipe/source/nutrient inputs are behind a disclosure. Save applies an edit; Cancel preserves the previous amount and total. One **Looks right · Log meal** action confirms the final inventory.

Logging requires usable amounts/nutrition and resolution of marked dishes or possible missing foods. Conflicting portion descriptions and low-confidence identities show a short note inside the relevant editor. The user can correct the name/amount or save it after review. Logging stays disabled while editing. Missing foods remain uncounted until explicitly added; Already included dismisses an alternate description. An incomplete estimate is a partial subtotal.

Drafts are account/date scoped and expire after 24 hours. Version 2 preserves pending suggestions and edits. Version 1 photo rows are retained and marked for review because they may contain the old duplicates; user-entered corrections are preserved. Images are not stored in the draft. Logging clears it after a successful save; failures retain it. Existing Firestore meal records and their totals are not silently rewritten.

Opening a logged meal now shows the compact donut/macros, without the long provenance/component paragraphs. Only available, finite, non-negative vitamins/minerals appear; unknown values render nothing. Explicit sourced zero remains a valid value. Source and recipe data remain in the optional saved review field.

## 15 November repair: duplicate inventory and layout

The regression had two independently counted lists: structured `foods` and unmatched descriptive `visibleItems`. Three alternate names were appended as new dishes. The repair uses one counted structured list, with per-serving IDs carried through routing, calculation and AI-estimate merging. Labels can annotate a serving or create an uncounted review suggestion. Separate bowls remain separate even when their canonical food names match. Same-name AI estimates are now stored by serving ID so different quantities do not overwrite each other.

| Check | Result |
| --- | --- |
| Exact screenshot fixture: rice 180 g, dal 150 g, roti 70 g, bhindi 70 g | Four counted foods; 629 kcal / 21 g protein / 122 g carbs / 8 g fat |
| Alternate dal/roti/bhindi descriptions | No automatic additions; conflicting 90 g roti label flags review |
| Previous buggy calculation | Seven entries, 1,083 kcal; prevented 454 fixture kcal of duplicate counting |
| Display-only food / omitted dal | Uncounted suggestion and incomplete subtotal until user review |
| Two bowls / explicitly added food | Independent quantities and IDs retained |
| Logged micronutrients | Unknown/invalid hidden; known values including explicit zero rendered |
| Full Vitest | 70 files passed; **776 passed, 26 skipped, zero failures** |
| Production build | **Exit 0**; all 34 routes generated; existing non-fatal lint warnings remain |

Live authenticated browser check with the original supplied rice/roti/dal/okra photo returned four pills (rice 180 g, dal 150 g, roti 70 g, bhindi 70 g) and 629 kcal, without duplicate dishes. This is a successful recognition/counting check, **not weighed calorie validation**. Saving roti at 90 g produced 688 kcal and left the other foods unchanged; Cancel retained 70 g/629 kcal. Logging was disabled while editing. No test meal was saved.

Verified actual CSS widths 320, 391 and 1440 px: donut left/macros right, scan donut after the dish pills, no page-wide horizontal overflow. Macro percentages/values align at the top even when target labels wrap. Restored the browser viewport afterward; discarded only the temporary previous-day test scan, preserving today's existing draft. The audit browser account displayed an empty meal log, so logged-meal nutrient visibility was checked by render regressions; no existing saved meal was opened or altered in that account. Physical-device testing and dark-theme visual comparison remain separate acceptance checks.

Local screenshots:

- [391 px scan](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fuel-scan-repaired-mobile.jpg)
- [320 px scan](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fuel-scan-repaired-320.jpg)
- [Desktop scan](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fuel-scan-repaired-desktop.jpg)
- [Mobile daily summary](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fuel-summary-repaired-mobile.jpg)

To reproduce: scan the supplied photo, check one pill per physical dish, edit only roti, Cancel and confirm unchanged total; repeat and Save a different gram amount. Use the deterministic regression fixture to verify conflicting 70/90 g descriptions, since live model output varies. Old already-logged duplicated meals require explicit correction/re-logging; this repair applies to new scans and draft review. The 629 kcal result must not be treated as measured truth or tuned to Google's unweighed estimate.

## Image, identity and calculation changes

- Scan-specific preprocessing now retains a bounded 1536 px longest edge; the browser uses higher JPEG quality. The existing 768 px helper default remains compatible with other callers. EXIF orientation is applied even for small JPEGs.
- DeepSeek defaults to high detail. The local ignored `.env` non-secret detail setting was changed from low to high. No credentials are committed.
- Shared vision prompts remove calorie/typical-serving anchors and the automatic moderate-oil assumption, call out paneer/egg and banana/fish ambiguity, and explicitly check dal over rice and side dishes. Gemini and DeepSeek now share that prompt.
- Visible labels annotate the single structured inventory. They never automatically add foods; possible omissions are explicit review suggestions. If structured foods are absent, labels remain uncounted until the user adds them.
- Descriptive egg/fish recipes do not collapse through a generic ingredient alias to boiled egg or plain fish. Existing exact aliases remain compatible.
- A canonical match remains available in legacy API fields for compatibility, but new metadata and UI explicitly distinguish database coverage from verified recognition. All photo results require review; no photo identity is labelled verified.
- Automatic home-cooked fat/calorie subtraction and automatic recognition-based selection of add-on chips are removed. Oil can be entered explicitly through a recipe or another food row. The nutrition-estimation stage is bounded by the remaining route budget.
- The UI no longer presents the old fixed ±15% spread as a calibrated confidence interval. Actual ingredient/portion uncertainty remains unmeasured.

## Recipes and micronutrients: what is and is not established

Editable starting recipes are available for paneer bhurji, dal with added oil and raw-banana sabzi. They expose ingredient grams, added oil, cooked batch yield and additional ingredients. Users can switch to label-based prepared-food nutrition. Yield is separate from serving mass, so changing water gain/loss does not silently change the meal's ingredient totals.

**These templates are illustrative, not the user's measured recipes.** Paneer/dal use existing SATAT estimates; their ingredient nutrition must be checked against labels or a suitable reference. The banana template explicitly identifies raw plantain as a proxy, with a [USDA SR28 NDB 09277 source](https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg09.pdf). It does not claim that every green-banana variety has that composition. Additional ingredients, cooking yield and oil need review. Comprehensive IFCT/USDA record ingestion and recipe-specific nutrient retention remain future data work.

Vitamin A (µg), vitamin C (mg), calcium (mg), iron (mg) and potassium (mg) can be supplied per 100 g from a label/reference with a source description. Whole-meal values are calculated only when every component has the nutrient and source; otherwise the value is **Not available**. Source text and values are retained. No LLM-generated vitamin values or automatic micronutrient completeness are claimed. Daily micronutrient target/rollup screens are outside this checkpoint.

## Evaluation and provider findings

The harness supports `deepseek:low`, `deepseek:high` and `gemini:high`, plus an optional original-photo reference manifest. It records status, latency, model/provider usage and costs. With references it computes one-to-one food precision/recall, missing/unexpected foods, matched-item gram MAE and coverage, calorie/protein errors and catastrophic undercounts. Calorie error is null without a positive measured calorie reference and provenance. Development/held-out labels are retained.

Example manifest: `scripts/meal-scan-reference.example.json`. It contains no fabricated weights or calorie ground truth. Add weighed component grams and `measured: { calories, proteinG, source }` to real records before evaluating numerical accuracy. The user confirmed that weighed references are not currently available.

```powershell
$env:SCAN_EVAL_PROFILES='deepseek:low,deepseek:high,gemini:high'
$env:SCAN_EVAL_LABEL='my-comparison'
# Optional: paths to original, consented photos and measured reference records
$env:SCAN_EVAL_PHOTO_DIR='C:/path/to/photos'
$env:SCAN_EVAL_MANIFEST='C:/path/to/references.json'
npx vitest run --config vitest.scan-eval.config.ts
```

The default five existing photos remain recognition/guardrail smoke cases; passing them does not validate calorie accuracy.

| Actual run | Outcome | Interpretation |
|---|---|---|
| DeepSeek low, five photos | 5/5 successful recognition/guardrail cases | No weighed calorie accuracy available |
| DeepSeek high, same photos | 5/5 successful recognition/guardrail cases | Different totals and slower calls on some cases; no accuracy winner established |
| Gemini configured defaults | Requests timed out / circuit opened | Comparison unavailable, retained as failure evidence |
| Gemini model-list probe | Listed older models; generation subsequently rejected them for this account with 404 | Listing does not prove generation access; original configurable defaults retained |

Evidence: `artifacts/scan-evaluation/component-review-matrix.json` and `component-review-gemini-supported.json`. Gemini was not silently substituted for DeepSeek. The old-model probe is not a recommended production configuration.

## Verification

- Final full suite: **69 files passed, 763 tests passed, 26 skipped**. Final production build: **passed, exit 0**, all 34 routes generated; existing non-fatal lint warnings remain. Tests cover independent rice correction, missing food handling, confirmation gates, unknown nutrients, preparation matching, recipe oil/yield, evaluation provenance, high-resolution preprocessing and EXIF.
- Browser: uploaded an existing dosa fixture through the real authenticated scanner, then exercised a **synthetic correction draft** with rice/paneer/banana/dal identities. This is correction-UI testing, not proof that the model recognized the user's original meal. No test meal was logged. The draft was discarded afterward.
- Browser confirmed rice 400 g survives close/reopen; invalid -400 g yields an incomplete subtotal; all confirmations enable Save; adding a blank food disables Save; changing recipe oil preserves rice/other amount fields. Actual 320 px and 1440 px widths showed no page-wide horizontal overflow. Mobile behavior is viewport simulation, not physical camera/keyboard certification.
- Screenshots: [320 px component review](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/scan-components-320.jpg), [desktop component review](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/scan-components-desktop.jpg).

## Remaining acceptance work

Collect 30–50 representative weighed meals, including large rice mounds and dal over rice, with cooking oil and prepared yield. Keep held-out meals separate, repeat across angles/lighting, and measure inventory, identity, portions and nutrition independently. Resolve Gemini generation access before a cross-provider ranking. Add curated source-backed nutrient records/recipe retention data and physical-device/persistent-record testing. No fixed 1,000 kcal target, overall accuracy percentage or claim that a single photograph can weigh food is introduced.
