# SATAT audit fixes and meal scanning review

**16 November follow-up:** remaining race, quantity, state and copy defects plus isolated persistence/setup/media checks are documented in [Remaining audit closure](REMAINING_AUDIT_CLOSURE_2026-11-16.md). Latest full verification: 829 tests passed, zero failures/skips; production build passed. Results below describe the earlier checkpoint, not the latest state.

Date: 15 November 2026 (Asia/Kolkata). Branch: `feat/complete-ui-change-e2e`. Local app: http://localhost:3000. No deployment, push or merge.

## Scope and approach

The original authenticated desktop/mobile audit recorded 14 issues. This iteration fixes their identified causes and adds meal-scan testing and the adjacent UX corrections listed below. Existing uncommitted nutrition work was retained. No Firebase document structure, authentication route or backend endpoint was removed. User records were not deleted or populated with audit meals/workouts/tasks.

The review combined signed-in browser interaction, source inspection, deterministic regression tests and real configured-provider calls through the production meal-analysis handler. The separate live-evaluation harness mocks the session only within Vitest; the application authentication path is unchanged. The user's checkpoint instruction ends further scope expansion; this is a reviewable fix set, not a promise that every possible bug is gone.

## Original findings and corrections

| Priority / issue | Result | Reproduce or verify |
|---|---|---|
| P1: fabricated personal metrics/actions | Removed fixed readiness, hydration, creatine, streak, recovery, strain, target-PR and auto-applied schedule claims from the audited views. Missing data is described as unmeasured; suggestions are labelled. | Compare Today, Plan, Train, Fuel and Orbit with no logs; suggestions must not claim to have changed records. |
| P1: unknown foods marked verified | Generic shake/smoothie contained matches no longer resolve arbitrary food names. Ambiguous slash/or identities remain unresolved. | Run nutrition-engine, nemotron-provider and audit-regressions tests; unknown shakes have null nutrition and require review. |
| P1: negative/blank manual nutrition | All four fields are required; positive finite energy and finite nonnegative nutrients are enforced in the form and Firestore meal helper. Zero nutrients must be explicit. Pending meal submissions are guarded. | Fuel → Manual Log → enter a name and -100 energy, or leave macro fields blank: Save is disabled. Enter valid values: Save becomes enabled. |
| P1: inaccessible desktop workout save | Actual button with disabled/loading state replaces clickable div. | Load a workout at desktop width; Tab to the completion button. |
| P1: shared Orbit history | Session storage keys include authenticated identity; unowned legacy history is discarded. In-flight requests are aborted on reset/account change. | Inspect scoped storage implementation; a real two-account switch remains a follow-up verification. |
| P2: conflicting goals | Shared defaults: 2,000 kcal / 150 g protein / 200 g carbs / 65 g fat; saved goals remain authoritative. | Compare Today, Fuel and Orbit without custom goals. |
| P2: search query discarded | Orbit consumes `q` and prefills the composer for review. | Header search → enter a question → Enter; the question is present in Orbit. |
| P2: New Chat and dead icons | Header New Chat resets the conversation; camera/voice open Fuel entry flows. File attachment is explicitly disabled with a descriptive label. | Send a greeting, use New Chat, then camera. No silent inactive enabled attachment control. |
| P2: timer resets/repeated notifications | Account-scoped session draft stores deadline; elapsed time survives navigation/throttling. Completion changes state once. | Plan → start timer → Fuel → Plan: remaining time continues; pause/reset work. Pure deadline arithmetic regression included. |
| P2: desktop cardio/assignment mismatch | Desktop exposes cardio/template/review controls and uses the same four-day fallback as mobile. | Resize Train; open cardio and compare fallback assignment. |
| P2: 320 px macro overlap | Summary stacks below 480 px; labels wrap; header actions and grid children can shrink/wrap. | Fuel at 320 px: macro labels and remaining calories do not collide. |
| P2: rituals shared across accounts | Shared helper scopes keys to user and date, synchronizes Today/Plan and labels progress as on this device. No unowned legacy import. | Toggle in one view and inspect the other; key-isolation regression included. Cross-device persistence is not implemented. |
| P2: form accessibility | Named reminder switches/time fields, macro inputs and steppers; dialog Escape, Tab containment and opener restoration; keyboard-operable rituals. | Tab/Shift+Tab around meal dialogs; Escape dismisses; inspect switch/input accessible names. |
| P3: robotic copy | Replaced audited system/telemetry/synthesis copy with everyday descriptions in core views, setup and settings. | Inspect headings and empty states; automated placeholder/aria contracts remain preserved. |

Additional corrections: scan/voice/manual query actions are consumed and cleared so repeated entry works; Plan handles the new-project action; selected focus duration survives task editing through the existing notes field; focus minutes are no longer inferred from arbitrary completed-task counts; onboarding no longer invents a missing weight target or completion horizon; navigation spacing and several constrained headers wrap consistently; meal estimate failures are visible and stale responses are ignored after the dish changes.

## Meal scanning: observed problems and changes

1. **Wrong count and hidden serving reduction.** The before samosa photo contained four pieces, but the request produced two. Prompts now enumerate every visible piece and do not silently turn sharing plates into one person's portion. Users adjust the plate multiplier themselves.
2. **Small bowls inflated.** A visible ~30 g condiment could remain `1 katori`, becoming 150 g in calculation. Visible gram/ml weights now reconcile generic bowl/katori/cup quantities. The dosa plate changed from an intermediate inflated 806 kcal to 507 kcal in the final live run; that difference is an estimate correction, not independently measured calorie accuracy.
3. **Explicit weights capped.** The calculator now respects explicit gram amounts, so a second serving is not silently clipped to a single-serving ceiling.
4. **False identity certainty.** Unknown shakes and ambiguous food alternatives cannot become canonical verified foods through a generic contained alias. UI distinguishes a recognized dish from an estimated portion. Unresolved foods block logging; ambiguity/estimated nutrition requires review. Manual handoff preserves the draft and requires acknowledgement when missing foods need including.
5. **Candidate replacement lost sides.** Changing the detected dish now re-analyzes the complete photo with a correction hint instead of replacing the entire plate with one database serving.
6. **Negated hints added food.** `no egg`, `without boiled egg` and similar exclusions do not add an egg. Affirmative clauses remain supported.
7. **Provider reliability/latency.** The configured provider was DeepSeek. Requests explicitly send the top-level `thinking` setting; omitting it could enable thinking by default. The initial after-run included a 503/empty response and is retained in evidence. Later runs passed all five cases. See the [official request schema](https://api-docs.deepseek.com/api/create-chat-completion/).
8. **Calorie-range double scaling.** The estimator returns portion-scaled ranges. The merge marks that basis explicitly so the calculator does not multiply a small portion twice; older per-100 g caller behavior is preserved and tested. This final arithmetic correction was verified deterministically after the final live run.
9. **Recovery and honesty.** Photo type/size guards, bounded client request duration, review state, manual correction and visible error messages replace silent/infinite failure states. Results continue to be approximations; a photo does not reveal cooking oil, exact mass or hidden fillings.

### Live recognition/guardrail results

| Case | Before kcal | After kcal | Before latency | After latency | What the check establishes |
|---|---:|---:|---:|---:|---|
| Dosa plate | 416 | 507 | 19.257 s | 5.644 s | Dosa family recognized; sides included, ambiguity review required |
| Four samosas | 421 | 875 | 3.965 s | 3.806 s | All four pieces counted in final output |
| Egg/avocado toast | 301 | 301 | 8.378 s | 4.428 s | Toast/avocado/egg identity recognized |
| Black coffee | 4 | 4 | 3.578 s | 2.031 s | Low-energy coffee not rejected as no food |
| Laptop/desk | 0 | 0 | 2.333 s | 1.985 s | Explicit no-food result |

Both before and final runs passed the broad recognition checks **5/5**. The improvement is in piece counts, portions, uncertainty, validation and observed latency, not an increased recognition percentage. Mean latency was **7.50 s → 3.58 s** (about 52% lower in these two runs); this is a small uncontrolled sample, not a performance guarantee. Intermediate results are retained rather than hidden.

**No measured calorie-accuracy percentage is claimed.** The reference photos have no weighed serving mass or complete recipes. Hidden fillings and lookalike sides remain uncertain. The existing historical MAPE figures elsewhere in PROJECT_STATUS are not revalidated by this iteration. Next accuracy work should use weighed ingredients/portions and recipes, repeated scans across lighting/angles, and separate recognition, count, gram error, calorie MAE/MAPE and unresolved rates.

Evidence: `artifacts/scan-evaluation/before.json`, `after.json`, `after-fixed-provider.json`, `after-final.json`. Run `npx vitest run --config vitest.scan-eval.config.ts` with configured provider credentials and the locally available `scripts/photos/edge-cases/` fixtures. These live calls incur normal provider usage. The live harness is deliberately excluded from ordinary unit tests. Photo fixtures and the pre-existing separate edge-case runner are left outside this commit.

## Verification and limits

- Full suite: **67 files passed; 740 tests passed; 26 skipped**. Original audit baseline: 718 passed, 2 failed, 26 skipped. Twenty focused audit regression cases were added; the two original unknown-food failures are resolved.
- Production build: **passed, exit 0**, with all 34 routes generated. Existing image-optimization and hook-dependency lint warnings remain non-fatal; no dependency changes were introduced.
- Browser-confirmed fixes: 320 px Fuel summary, disabled invalid meal submission, labelled inputs and Escape dismissal, Orbit query/reset/camera handoff, desktop cardio/completion controls, and a timer that continued after navigating away and back.
- Viewport coverage: original audit at 1440 × 1000 and 390 × 844, additional Fuel 320 px inspection; final viewport automation occasionally captured loading skeletons and is not counted as proof of fully loaded screen coverage. Do not infer alignment correctness solely from root scroll width.
- The final production browser recheck could not reconnect after the server restart. The build itself passed and earlier signed-in checks are retained; this final reload is not represented as passed.
- Not certified: actual iOS/Android camera/microphone/virtual keyboard, wearable ingestion/push delivery, account switching with two live accounts, and persistent create/edit/delete round trips using disposable records. Those branches were not represented as passed.

## Screenshot evidence

The original audit and screenshots remain in `C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/`.

- [Corrected 320 px Fuel summary](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fixed-fuel-320.jpg)
- [Invalid meal blocked](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fixed-negative-meal.jpg)
- [Desktop Orbit corrections](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fixed-orbit-desktop.jpg)
- [Desktop Plan timer](C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/fixed-plan-desktop.jpg)

Screenshots are local review artifacts; health-sync secrets are excluded from this report.
