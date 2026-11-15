# Meal scan component review — implementation checkpoint

15 November 2026. Branch: `feat/complete-ui-change-e2e`. No push or deployment.

## Delivered behavior

The result is now a list of foods to review, not one dish name and a plate multiplier. Each row has editable identity, amount and unit, source/basis text, optional recipe editing and a check box. Changing rice from 200 g to 400 g changes only that row. A mistaken egg or fish identity can be replaced locally with paneer or a banana recipe; missed dal can be added. Re-analysis cannot silently overwrite user corrections.

Logging requires usable amounts/nutrition, a check for each component and a whole-meal completeness check. An unresolved row produces **Incomplete — known-food subtotal**, disables logging and preserves the known values. Missing nutrients remain unknown, not zero. Invalid numeric amounts are blocked. These are review safeguards; a check box does not make a visual guess accurate.

Drafts are scoped to authenticated account and date, expire after 24 hours and restore after closing/reopening. Discard explicitly clears a review. Images are not stored with the local draft. Successful logging clears the draft; failures retain it. Reviewed component/source/recipe details and optional micronutrients are saved in an optional `scanReview` field, leaving older meal documents and existing ownership rules valid. Logged meals expose their reviewed-food/nutrient details. Photos saved with a meal are bounded thumbnails to avoid oversized Firestore documents.

## Image, identity and calculation changes

- Scan-specific preprocessing now retains a bounded 1536 px longest edge; the browser uses higher JPEG quality. The existing 768 px helper default remains compatible with other callers. EXIF orientation is applied even for small JPEGs.
- DeepSeek defaults to high detail. The local ignored `.env` non-secret detail setting was changed from low to high. No credentials are committed.
- Shared vision prompts remove calorie/typical-serving anchors and the automatic moderate-oil assumption, call out paneer/egg and banana/fish ambiguity, and explicitly check dal over rice and side dishes. Gemini and DeepSeek now share that prompt.
- Visible labels are reconciled with structured food inventory instead of being ignored whenever `foods` is nonempty. Counted roti/samosa labels do not duplicate the same food.
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
