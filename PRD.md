# SATAT (सतत्): Indian Meal Specialist

Version: 0.1 · Created: 27 November 2026 · Owner: SATAT product owner

Branch: `feat/indian-meal-specialist`

Status: **Specification and CPU-verified offline training starter prepared. GPU training, trained-model qualification and application integration remain pending.**

Research decision (27 November 2026): user selected a non-commercial Khana prototype first, kept separate from all production training/weights. The optional 10-class pilot below is development data, not a revision or relaxation of the 30-class release protocol.

This is the feature PRD for Indian meal scanning. The existing [product PRD](docs/PRD.md) remains the product-wide source of truth; this document does not change its launch scope, pricing or other domains.

## 1. Problem and intended outcome

SATAT's scanner can confuse visually similar dishes, omit sides, duplicate a dish under different names, and estimate quantities poorly. The earlier rice/paneer/dal/raw-banana example illustrates recognition and portion problems, but its estimated calorie total is **not a measured reference**. The later rice/roti/dal/bhindi photo is another recognition regression, not weighed nutrition evidence.

Build a specialist that recognises a bounded set of everyday Indian foods, detects every component of a thali once, estimates quantities with honest uncertainty, and uses documented composition data for nutrition. Keep DeepSeek for unsupported or uncertain foods, including unfamiliar Indian dishes and international foods.

Passing software tests proves software behaviour. Passing an independent benchmark qualifies a particular model version for the tested scope. Neither proves that every future meal will be correct. Product copy must never say "always accurate", "exact from a photo", or imply that hidden ingredients were measured.

### Goals

- Improve recognition on independently collected Indian household meals against the existing provider.
- Avoid duplicate food components and preserve user corrections.
- Evaluate recognition, quantity and nutrient estimation separately.
- Preserve the existing scan/review/log workflow, authentication and Firestore structures.
- Make training, evaluation and release decisions reproducible and reviewable.

### Non-goals

- Training a foundation model from scratch; fine-tune pretrained vision models instead.
- Replacing Orbit, text/voice logging or all international-food recognition.
- Inferring allergens, food safety, hidden oil, vitamins or medical suitability from appearance.
- Automatically changing personal dietary goals or generating weight-loss prescriptions.
- Deploying a classifier trained on single-food crops as a complete thali scanner.
- Hosting a permanent production service in a Colab notebook.

## 2. Current system and constraints

Verified on 27 November 2026:

| Area | Current implementation / constraint |
|---|---|
| Scan entry | `app/api/analyze-meal/route.ts`; authenticated request; image preprocessing; current route budget `maxDuration = 30` seconds |
| Provider choice | `lib/ai/providers/index.ts`; local `.env` selects `deepseek` and `deepseek-flash`; unset-provider code default is Gemini; deployed configuration not independently verified |
| Legacy override | `GROQ_VISION_ENABLED=true` chooses the other vision path before the registry; record effective flags in every benchmark |
| Contracts | `lib/ai/providers/types.ts`; current provider union does not include a custom specialist; extend deliberately during integration |
| Nutrition | Existing router/calculator and scan-review helpers must remain the calculation/review boundaries |
| Evaluation | `lib/nutrition/scan-evaluation.ts` and `scripts/meal-scan.eval.ts` already distinguish recognition from measured references; retain their existing contracts |
| UI | `components/diet/MealScannerModal.tsx`; retain editable dish pills, add/remove, image, compact totals below foods, and final review before logging |
| Available local compute | PyTorch `2.8.0+cpu`; CUDA unavailable to this installation. This does not establish that the computer has no physical GPU |
| Source base | Created from synchronized `origin/main` at `2851d589ac296cde1175d4b32dd94a45cc7349e3` |

No API keys, private meal images, credentials, model weights or large datasets belong in Git. Read provider configuration by an explicit non-secret allowlist; never print `.env`.

## 3. Users and functional requirements

| ID | Requirement | Acceptance |
|---|---|---|
| FR-01 | Scan one dish or a mixed thali | Every reviewed physical food region appears once; no whole-thali label is added on top of its components |
| FR-02 | Recognise supported Indian dishes | Use calibrated confidence and class-specific failure analysis; allow unknown |
| FR-03 | Handle ambiguity | Paneer/egg bhurji, similar curries and obscured sides can request a short confirmation rather than fabricate certainty |
| FR-04 | Route unfamiliar items | Use general vision for unsupported, uncertain or mixed-cuisine regions; Indian origin alone must not force the specialist |
| FR-05 | Edit before saving | Change name, quantity and units; add/remove food; recompute totals from the corrected components |
| FR-06 | Estimate portions | Mark photo quantities as estimates; accept explicit user quantities; preserve uncertainty and measurement basis |
| FR-07 | Calculate nutrition | Scale documented cooked recipes/ingredient references; keep raw/cooked basis, yield, oil and units explicit |
| FR-08 | Show concise results | Image, editable food pills, nutrition summary, one brief estimate notice and log action; omit unsupported micronutrients |
| FR-09 | Fail gracefully | Specialist timeout/schema failure falls back once within a shared time budget; both failures offer retry/manual entry and save nothing |
| FR-10 | Preserve privacy | Inference does not imply training consent; training contribution is separately opt-in, de-identified and governed by retention/deletion rules |
| FR-11 | Preserve application behaviour | Existing routes, auth, user isolation, storage, accessible labels, text and voice entry continue to work |
| FR-12 | Support all screens | Phone 320/393 px, tablet 768 px, desktop 1440 px, short landscape, light/dark and keyboard checks before integration completion |

## 4. Architecture and routing

```text
authenticated scan -> quality/preprocessing -> food regions
  -> specialist classification per region
     -> supported + calibrated acceptance: retain specialist identity
     -> unsupported / ambiguous / uncertain: general vision (DeepSeek)
  -> reconcile physical regions and canonical IDs (one contribution each)
  -> portion estimate or short user confirmation
  -> versioned recipe/nutrient lookup + deterministic calculation
  -> editable review -> existing log persistence
```

The first classifier operates on **single-food crop inputs only**. Detection/segmentation must supply crops before production multi-food inference. API fallback on a crop must retain enough meal context for interpretation. If fallback sees the whole plate, reconcile its regions instead of concatenating both full predictions.

Design specialist output around canonical dish ID, region ID/bounds, class probabilities, model version and calibrated decision. Numeric confidence must come from held-out validation calibration, not an LLM's self-described confidence. Recognition confidence is distinct from portion and recipe uncertainty.

Host training/evaluation as Python tooling separate from Next.js dependencies. Later expose inference through a private, authenticated service called by the server route. Use bounded payloads, a private configured endpoint, internal authentication, per-user limits, an end-to-end deadline and redacted structured telemetry. Never accept an arbitrary user-supplied inference URL. Default feature flag is off until full qualification. Rollback disables the specialist and restores the configured provider path.

Proposed integration settings (not implemented): `INDIAN_MEAL_SPECIALIST_ENABLED`, `INDIAN_MEAL_SPECIALIST_URL`, server-only auth secret, model/version allowlist and bounded timeout. Keep existing provider settings intact. Do not send a meal to both services by default merely to hide routing uncertainty; evaluation/shadow collection needs a separate documented policy.

## 5. Dataset register and permitted uses

Dataset availability is not proof of commercial permission. Store the exact source, version, licence text, attribution, acquisition date and approval evidence. Restricted research experiments must never silently feed production weights.

| Source | Published contents | Intended use | Permission / limitation |
|---|---|---|---|
| [Khana](https://khana.omkarprabhu.in/) | 131,000+ images, 80 food classes | Recognition research; taxonomy comparison | Publisher limits use to non-commercial research/education and does not own image copyrights; not approved for production training |
| [RASOI](https://fkg-india.github.io/library/datasets/) | Standalone foods and composite thalis with boxes | Thali research/detection | CC BY-NC-SA 4.0; non-commercial research; required attribution: "Created and maintained by the Food Computing Lab, Ashoka University, India." Do not assume pixel masks exist |
| [IndianFood61 paper](https://arxiv.org/abs/2305.07552) | 68,005 platter images, 134,814 dish annotations, 61 dishes reported | Additional detection research | Access and dataset reuse terms must be obtained from creators; paper availability/licence does not establish image rights |
| [Nutrition5k](https://github.com/google-research-datasets/Nutrition5k) | 5,006 plates; RGB/video, some depth, ingredient masses and nutrients | Portion/regression experiments | CC BY 4.0 per publisher; attribution required; cafeteria/US domain does not replace Indian household evaluation; do not download the entire large archive by default |
| [ICMR–NIN IFCT 2017](https://www.nin.res.in/ebooks/IFCT2017_16122024.pdf) | Composition for 528 foods | Ingredient nutrient reference | Confirm product reuse terms; raw ingredients do not equal cooked dishes |
| [INDB](https://www.anuvaad.org.in/methodology/) / [repository](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB-) | 1,014 standard recipes reported by the publisher | Prepared-recipe reference | Verify reuse/redistribution rights; no blanket product licence established by this review; recipes are calculated standards, not every household's ground truth |
| [SohlHealth classification](https://huggingface.co/datasets/SohlHealth/enhanced-indian-food-classification) | Card reports 15,404 images / 43 classes | Optional prototype candidate | Card declares CC BY 4.0, but upstream image provenance and label quality require review before approval |
| SATAT-owned/permissioned collection | Real Indian household images, annotations, weighed components and recipes | Production training and independent test set | Explicit contributor permission, de-identification, deletion/retention policy; review rights before use |
| [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide/) | Ingredient/prepared food composition | Supplementary nutrition reference | Public domain/CC0 per publisher; source attribution retained; not an image corpus |

Do not use model-generated labels or Google/DeepSeek calorie answers as measured truth. Synthetic images may support isolated augmentation studies, never the independent acceptance benchmark or weighed labels.

## 6. Initial supported taxonomy

Freeze these **30 initial class IDs** in the dataset manifest before training. Canonical aliases belong in a versioned mapping, not extra competing labels:

```text
steamed_rice, plain_roti, plain_paratha, aloo_paratha, poori,
dal_tadka, dal_makhani, rajma, chole, paneer_bhurji, egg_bhurji,
bhindi_sabzi, aloo_sabzi, raw_banana_sabzi, mixed_vegetable_sabzi,
poha, upma, idli, plain_dosa, masala_dosa, sambar, coconut_chutney,
chicken_biryani, vegetable_biryani, chicken_curry, fish_curry,
curd, raita, samosa, pav_bhaji
```

This is a bounded starting scope, not coverage of all Indian cuisine. Similar classes may need merging or additional contextual confirmation after annotation review. Changes require a new manifest/taxonomy version and new baseline; never relabel test data to improve an already evaluated model. Unknown foods are present in validation/test and routed away; they are not forced into the 30-way training labels.

## 7. Collection, annotations and split policy

### Pilot versus acceptance data

Pilot planning target: 100–200 independently captured crops per supported class, several hundred annotated thalis and 100–200 weighed meals. These counts permit experiments, not automatic qualification.

Classifier acceptance set v1: at least **30 supported classes × 30 independent test images per class = 900 known crops**, plus **200 unknown images** (at least 50 each: unsupported Indian food, international food, non-food, visually ambiguous/occluded food). Validation must include at least 10 examples per class and 20 per unknown group for operating-point selection. Collect additional evidence for under-represented regions and report where coverage is insufficient.

Later full-scanner acceptance: at least 300 independently annotated mixed thalis and 300 weighed meals with complete recipe-derived nutrient references. Portions must have component-level cooked weights. These may overlap in images, but counted evidence must be reported separately and they must remain separate from training/validation families.

### Manifest

The starter accepts JSON with `dataset_id`, `version`, `classes`, `sources`, `samples`. Each source records `id`, `url`, `permission_reference`, `approved_scope` (`research` or `production`) and `approved` (boolean). These are auditable attestations, not automated legal approval.

Each image sample records:

- Unique `id`; relative `image` path under an explicitly supplied data root; exact `sha256`.
- `split`: `train`, `validation`, or `test`; canonical `label` or `unknown`.
- `group_id`: shared household/restaurant/preparation family across all related captures; keep all members in one split. Do not use a different ID for every angle to bypass this rule.
- `source_id`, pseudonymous `region` and `unknown_kind` when label is unknown.

For the later detection/portion manifest add original meal ID, boxes/polygons, per-region count, scale cue and known dimensions, cooked weight, recipe ID/version, raw ingredient weights, oil/ghee added and retained where known, edible yield, final cooked batch mass, served component mass, nutrient reference method and annotator review. Missing values remain null, not zero.

Example **structure only** (no image, permission or measured truth is supplied by this example):

```json
{
  "dataset_id": "satat-indian-foods",
  "version": "pilot-001",
  "classes": ["steamed_rice", "plain_roti"],
  "sources": [{"id": "owned", "url": "internal://consented-collection", "approved": false, "approved_scope": "production", "permission_reference": "REPLACE_WITH_REVIEWED_PERMISSION"}],
  "samples": [{"id": "REPLACE", "image": "crops/REPLACE.jpg", "sha256": "REPLACE_WITH_64_HEX_DIGITS", "group_id": "REPLACE_WITH_CAPTURE_FAMILY", "split": "train", "label": "steamed_rice", "source_id": "owned", "region": "REPLACE"}]
}
```

The validator rejects this placeholder. It is not a bundled dataset. The small two-class illustration cannot pass the 30-class release gate.

### Data quality

- Human review of identities; second review/adjudication for paneer/egg and other difficult pairs. Preserve genuinely ambiguous labels as unknown.
- Reject missing/corrupt images, invalid hashes, unapproved sources, unsafe paths, duplicate IDs/images and cross-split capture families.
- Detect near-duplicates with perceptual hashing/embedding review before freezing; exact-hash validation alone is insufficient.
- Group split approximately 70/15/15 with a separately collected external household holdout. Honour published dataset splits when making published comparisons.
- Keep all images/crops/frames of the same plate in one group, including derivatives from other datasets. Do not count rotations or adjacent frames as independent test meals.
- Strip GPS and unnecessary personal data; store human-readable identities outside the training manifest. Share only authorised data with Colab/cloud services.

## 8. Training and reproducibility

### Research bootstrap before qualification

`ml/indian_meals/prepare_khana.py` imports ten explicitly mapped Khana categories after research-only/source-term acknowledgement. It can download the publisher's 6.9 GB `dataset.tar.gz` to the user's mounted Drive, prepare a bounded subset, and generate the actual manifest that was missing during the initial Colab setup. The subset, source archive and run outputs live under `SATAT/research`, not production folders.

The tool limits image size/count, rejects unsafe tar paths, ignores non-image/link payloads, strips image metadata, removes exact duplicates, groups perceptual neighbours and quarantines conflicting labels/splits. It preserves supplied split membership when available; otherwise its seeded grouped splits are explicitly provisional. Neither web-image labels nor hash groups establish independently reviewed household truth. Record this limitation in every pilot report. Data preparation needs CPU/Pillow; no GPU inference or DeepSeek API calls are needed.

The unchanged C1 protocol still requires 30 classes and independently reviewed unknown groups. The 10-class research pilot cannot satisfy it. Prototype preparation/head training is an intermediate milestone only; do not change M3 qualification or mark the full feature done. The local tests use generated image archives, and only real archive headers were inspected; full Khana preparation and model training remain a Colab execution step.

### C1: single-food recognition baseline

Use [DINOv2 ViT-S/14](https://github.com/facebookresearch/dinov2) pretrained visual features and train a small linear classifier first. This is **head training on a frozen backbone**, not full-backbone fine-tuning. Record exact backbone commit, weight hash, preprocessing, software versions, seed, device and manifest hash. Use training only for fitting; validation only for checkpoint/temperature/threshold selection; test only for evaluation.

The starter will support: a CUDA preflight, explicit CPU smoke override, frozen feature extraction, deterministic head training, validation-selected best head, validation temperature/threshold calibration, resumable head checkpoints, and prediction export on a sealed test set. Smaller pilots may train but must fail qualification for insufficient class/sample coverage. Pilot data must never be claimed as acceptance data.

After the baseline, compare selective backbone fine-tuning and a larger encoder only if measured errors justify them. Use realistic brightness/blur/angle augmentation, class-balanced sampling and predeclared runs. Log all experiments, including failures; never select a threshold using final test outcomes.

### D1: multiple-food detection

Fine-tune a compact [RT-DETRv2](https://github.com/lyuwenyu/RT-DETR) detector on approved bounding-box annotations. Evaluate detection and food identity jointly. Add instance masks only if touching/overlapping-food errors justify the annotation cost. DINO crop classification alone does not fulfil D1.

### P1/N1: portions and nutrition

Train or compare portion regressors using measured cooked mass, food-region features and available scale cues. Compare against dish-specific typical-portion baselines. Request an additional view or vessel dimension only when it materially reduces error. Use intervals and a manual correction path when scale is unidentifiable.

Calculate nutrition from documented recipes/ingredient references using cooked yield and retained ingredients. Recipe-derived estimates are not laboratory assays. Compare against independently prepared weighed recipes; never train on another model's guessed calorie number as ground truth. Unknown oil and recipe variation remain uncertainty even when dish identity is correct.

## 9. Quantitative acceptance gates

These are **engineering targets, not achieved metrics or guaranteed performance**. Freeze them with the benchmark version before training. If evidence changes the target, record the reason and version the protocol; never quietly lower a failed gate.

| Gate | Required result | Evidence |
|---|---|---|
| T0: data integrity | All source rights/provenance reviewed; 0 exact duplicates, 0 group leakage; near-duplicate review complete; required sample coverage | Manifest/hash, permission register, independent data-review record |
| C1: classifier candidate | Macro F1 ≥ 0.85 and each class recall ≥ 0.70 over **all known test images**, including abstentions; accepted precision ≥ 0.95; known acceptance coverage ≥ 0.70; unknown false acceptance ≤ 0.05 overall and per unknown group | Prediction-level report; minimum 30 classes/30 test cases each and 50 per unknown group; Wilson 95% intervals reported for precision/coverage/unknown rates |
| C1b: baseline benefit | Macro F1 improvement ≥ 0.03 absolute against a pinned DeepSeek baseline on the same heldout crops; paired bootstrap 95% interval for improvement has lower bound > 0 | Baseline predictions, prompts/model/settings/date, cost/latency, paired comparison report; no incomparable whole-photo-vs-crop claims |
| D1: thalis | At least 300 independent thalis; mAP@[.50:.95] ≥ 0.65; component recall ≥ 0.90 and exact whole-plate identity/count ≥ 0.80; duplicate region rate ≤ 0.01 | One-to-one spatial/identity matching; breakdown by side bowl, overlapping items and low light; disclose missed/extra components |
| P1: portions | At least 300 weighed heldout meals; ≥ 95% of annotated components receive a valid estimate; median component relative mass error ≤ 0.20 and p90 ≤ 0.40; ≥ 10% relative improvement in grams MAE over fixed-portion baseline | Report grams MAE, per-dish errors and missing-estimate failures; no excluding difficult predictions; zero/near-zero mass handled separately |
| N1: nutrients | Same fully referenced heldout meals; median calorie relative error ≤ 0.20, p90 ≤ 0.40; catastrophic undercount (<50% of reference) ≤ 0.02; report protein/carbohydrate/fat MAE in grams, including low-content cases | Complete weighed recipe/yield/oil provenance; all model abstentions/errors counted and coverage reported; macro MAE ≤ 5 g protein, ≤ 10 g carbs, ≤ 5 g fat as initial targets |
| I1: integration | Every deterministic software test passes; no auth/isolation/storage regression; all required mobile/desktop cases pass | Existing full CI plus specialist contract/failure/UI tests |
| O1: operations | p95 scan completion ≤ 15 s and maximum bounded by existing 30 s route budget on named reference hardware/network; inference-only identity p95 ≤ 2 s; no silent log writes; rollback verified | At least 100 warm/cold application requests with failure injection; endpoint capacity/concurrency and per-scan cost recorded before rollout |

The executable starter enforces **manifest validation and C1 point-estimate gates only**. It reports confidence intervals but does not pretend to implement C1b, D1, P1, N1, I1 or O1. A passing C1 report says `classifier_candidate_passed` and always retains `production_qualified: false` until the remaining evidence is reviewed. Confidence intervals expose uncertainty; they are not a replacement for sample minima or independent review.

The classifier evaluator must require predictions for every test image, bind them to the exact manifest and calibration artifacts, reject duplicate/extra/missing IDs and invalid probabilities, and fail on missing reference data. An empty/skipped benchmark must never be green. Its JSON result is an auditable experiment report, not a signed certification; the release checklist verifies provenance and reruns inference from the submitted checkpoint.

C1 macro F1 and per-class recall use raw top-1 predictions on all known crops, before confidence rejection. Accepted precision uses all accepted known/unknown inputs; coverage uses all known inputs; false acceptance uses all unknown inputs, overall and per unknown group. Abstentions cannot be removed from coverage denominators. Report Wilson 95% intervals for these acceptance proportions and disclose the independent sample counts.

## 10. Required test catalogue

| ID | Input / scenario | Expected behaviour | Level |
|---|---|---|---|
| DATA-01 | Missing file, wrong SHA-256, unsafe path or corrupt image | Abort before training; identify sample; no partial approval | Executable validator + training preflight |
| DATA-02 | Same image or related capture family across splits | Reject leakage; grouped derivatives stay together | Executable validator; near-duplicate review additional |
| DATA-03 | Missing/unapproved/research-only source in production mode | Reject; no override that silently marks it production-approved | Executable validator |
| DATA-04 | Insufficient classes, test counts or missing unknown group | Training may be a pilot; acceptance fails | Executable C1 gate |
| REC-01 | Correct predictions on a complete synthetic benchmark | C1 logic passes; `production_qualified` remains false | Executable evaluator regression; **not real model evidence** |
| REC-02 | High-confidence wrong labels, majority-class collapse | Precision/F1/per-class recall fails | Executable evaluator regression |
| REC-03 | Every image rejected | Coverage fails even if accepted precision denominator is empty | Executable evaluator regression |
| REC-04 | Sushi, unfamiliar Indian dish, desk, blurred food | Unknown group false-acceptance is measured; do not force a supported label | Real heldout benchmark |
| REC-05 | NaN/out-of-range confidence, missing/duplicate/extra prediction, mismatched artifact hash | Reject benchmark; cannot omit failures from denominators | Executable evaluator regression |
| REC-06 | Paneer versus egg bhurji | Correct identity when evident; ambiguity/review when not | Confusion slice with human-reviewed truth |
| PLATE-01 | Rice + paneer + dal + raw-banana side | Four physical components; no egg substitution, missed dal or invented precise weight | New annotated thali regression; supplied photo has no measured mass |
| PLATE-02 | Rice + folded roti + dal + bhindi bowl | Each region once; aliases do not duplicate dal/roti/bhindi | New annotated thali regression |
| PLATE-03 | Two separate roti regions versus one overlapping stack | Count/portion uncertainty retained; spatial matching distinguishes duplicates from real instances | Detection/count benchmark |
| ROUTE-01 | Indian supported, unknown Indian, sushi and mixed-cuisine plate | Per-region specialist/fallback decisions; no whole-output concatenation | Future service integration tests |
| ROUTE-02 | Specialist timeout, 503, malformed output, wrong model version | Bounded single fallback; existing provider result still reviewed | Future contract tests |
| ROUTE-03 | Both services fail | Clear retry/manual entry; no save or manufactured nutrition | Future failure-injection test |
| PORT-01 | Known weighed 100/200/400 g servings of one recipe | Evaluate quantity error against actual scale readings | Weighed dataset; quantities in old anecdotes are not substituted |
| PORT-02 | Same-looking plate with different hidden oil | Do not claim the photo measured oil; use documented assumption or confirmation | Recipe/uncertainty test |
| NUT-01 | Same dish with raw versus cooked weights, different units/yields | Correct basis conversion; deterministic sums; no double scaling | Existing + new calculation regression |
| NUT-02 | Missing micronutrient reference | Omit unsupported value; do not fabricate or show "not available" cards | Future UI regression |
| UX-01 | Edit a pill, add missing dal, remove duplicate | Totals recompute; correction survives resize/retry and final saved entry | Existing workflow plus new integration regression |
| UX-02 | 320/393/768/1440 px, landscape, themes, keyboard | Reachable controls, no overflow, retained draft and accessible labels | Browser checks; label simulated hardware accurately |
| SEC-01 | Unauthenticated scan; different account; unapproved training upload | Reject access; preserve isolation; no automatic training consent | API/security regression |
| OPS-01 | Rollback flag and request budget exhausted | Restore provider-only path; cancel work; no retry storm | Staging operational test |

## 11. Colab handoff and artifacts

Use `ml/indian_meals/train_colab.ipynb` after the starter is present and the approved data manifest is ready. No dataset is bundled or silently downloaded. The notebook is a training experiment, not an app or a cloud service.

1. Upload the notebook and starter archive prepared locally. Review its cells before running. Choose **Runtime → Change runtime type → GPU**; verify CUDA/device/VRAM in the preflight cell. Do not assume a particular GPU is guaranteed.
2. Supply an authorised dataset and JSON manifest. Select `production` for production-eligible sources; `research` results remain research-only. Use pseudonymous paths and avoid uploading unrelated personal data.
3. Validate hashes/permissions/splits. Fix failures before training; do not edit the acceptance protocol to bypass them.
4. Set a durable output path, configure seed/epochs/batch size, record the GPU and exact pretrained-backbone revision, then start C1 head training. Checkpoint each epoch; resume only when manifest and configuration hashes match.
5. Choose the checkpoint/temperature/acceptance threshold on validation only. Save `head.pt`, calibration and metadata with hashes. Do not inspect test results to select a checkpoint.
6. Evaluate once on the frozen test set using the saved calibration. Export predictions and C1 report, including failures. If the gate fails, analyse development data, retrain, and use a fresh sealed release holdout after test-driven changes.
7. Return the small metadata, calibration, predictions and report files for review. Keep images and large weights outside Git; store versioned artifact references/checksums. A report edited by hand is not valid evidence.
8. Continue D1/P1/N1 and integration milestones; do not mark the complete scanner done from C1 alone.

[Colab's FAQ](https://research.google.com/colaboratory/faq.html) states that resource availability and session lifetime vary. Save resumable checkpoints; no unattended GPU/session availability is promised. GPU runs and paid API benchmark calls have not been started by this documentation task.

## 12. Development sequence and completion ledger

| Milestone | Deliverable | Status | Completion rule |
|---|---|---|---|
| M0 | New synchronized branch, detailed PRD, acceptance protocol | Prepared | Source links and executable taxonomy checked; owner can review this specification |
| M1 | Offline manifest validator, C1 evaluator, unit tests and Colab classifier starter | Implemented and CPU-verified; GPU execution pending | CPU software checks pass; real GPU/data run remains separately pending |
| M2 | Approved, versioned data and independently sealed benchmark | Pending external data | Rights, annotations, hashes and split review complete |
| M3 | Trained crop classifier and C1/C1b evidence | Pending GPU/data | Independent benchmark and baseline comparison pass |
| M4 | Thali detector and duplicate reconciliation | Not implemented | D1 passes on real data |
| M5 | Portion estimator and recipe/nutrition qualification | Not implemented | P1/N1 pass with weighed references |
| M6 | Private service, provider adapter, fallback, UI and rollout | Not implemented | I1/O1 and all prior gates pass |
| M7 | PRD completion update, commit/push and hosted verification | Pending qualification | Reviewed evidence, synchronized code and exact pushed-commit CI success |

### Definition of done

- Every mandatory applicable test and release gate passes with linked evidence. Missing/skipped model evaluation means **not qualified**, never "pass".
- Supported classes, operating conditions, uncertain cases and exclusions are published in a model card.
- Training data/weights/calibration/recipe version hashes, source permissions, sample counts, per-class errors, latency/cost, paired baseline and rollout evidence are attached.
- Update this ledger to distinguish software complete, classifier candidate qualified and complete scanner qualified. Only mark complete development after M2–M6 pass.
- Fetch `origin/main` and the new remote branch if present; preserve both branches' intended behaviour and check conflict markers.
- Run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`; clean `npx tsc --noEmit --incremental false` when TypeScript tests/config change. Run the standalone Python tests and trained-model benchmarks as separate gates. Preserve existing test coverage and auth/storage contracts.
- Update `PROJECT_STATUS.md`; commit and push to **this feature branch only**, then verify GitHub Actions for the exact SHA. Never push or merge main as part of this workflow.
- On 27 November 2026 the user explicitly authorised committing/pushing the completed specification and starter now, on the renamed `feat/indian-meal-specialist` branch. This checkpoint does not mark model training, qualification or the complete feature done. Later trained-feature completion still requires M2–M6 evidence and hosted verification of the release commit.

### Current evidence

- No approved dataset package, weighed reference set, allocated Colab GPU or trained weights supplied yet.
- Existing image fixtures are recognition smoke tests and must not be relabelled as measured nutrition references.
- Latest verification on 27 November 2026: **46 offline-tool tests passed, zero skipped** (26 evaluator/data contracts, 13 generated-image importer tests, 7 CPU training-mechanics tests). The initial starter had 32 tests; the research preparation step adds coverage without changing release targets. No pretrained weights were downloaded and no real model was trained.
- Standalone TypeScript and lint passed (existing non-fatal warnings remain). Full application suite: **76 files passed, 860 tests passed, 33 emulator-dependent tests skipped, zero failures**. Production build: **exit 0, all 34 routes generated**. Logs: `artifacts/indian-meal-{typecheck,lint,app-tests,python-tests,ci-python,build}.log`.
- Notebook code cells parse successfully; the 30 PRD class IDs match `acceptance.v1.json`; local document links resolve. The notebook itself has not been executed in Colab. The source-only handoff archive is `artifacts/indian-meal-starter.zip` (ignored by Git).
- `.github/workflows/ci.yml` includes the evaluator contracts with Python 3.11 and the generated-image importer tests using pinned Pillow; GPU/ML-package checks remain a separate experiment gate. Hosted CI for the research update will be checked after its authorised push. No hosted result should be inferred from the local checks.
- Research-update logs: `artifacts/khana-{typecheck,lint,app-tests,python-tests,build}.log`. All application CI gates passed locally; the production build again exited 0 with 34 routes. Full real Khana import, its actual prepared counts and training execution remain pending in Colab; archive path inspection and synthetic tests are not a substitute.
- No production scan behaviour or existing logo/UI is changed by the offline starter.
