# Remaining audit fixes — 16 November 2026

The remaining confirmed defects were fixed on `feat/complete-ui-change-e2e`. All fourteen original findings have implementation fixes; this iteration closes additional race/quantity/state/copy defects and adds isolated persistence coverage. No production Firebase records were used or changed. This does not certify every possible device or dish.

## Fixes in this iteration

| Priority | Problem and resulting behavior | Files |
|---|---|---|
| P1 | Pending Firebase operations could outlive logout/account changes. SDK mutations are now serialized, obsolete requests cancelled, mismatched identities rejected and the previous identity immediately masked. | `components/FirebaseAuthProvider.tsx`, `lib/auth/firebase-session.ts` |
| P1 | Orbit could retain old account context or finish an obsolete request. Context now has an owner, rejects old publishers, and identity changes clear chat request/input/retry state. | `lib/orbitContext.ts`, `components/orbit/OrbitView.tsx`, Home/Plan/Fuel/Train callers |
| P1 | Three strawberries could become three large default servings. References without a weight per piece now require grams; reference nutrients remain available for correction. | `lib/ai/nutrition/calculator.ts`, `router.ts`, `lib/nutrition/scan-review.ts` |
| P2 | Descriptive labels produced redundant missing-food questions; differing gram/piece estimates escaped review. Annotations now associate with counted inventory, background exclusions stay uncounted, and conflicting amounts require review without adding servings. Possible omissions appear one at a time. | `lib/nutrition/scan-review.ts`, `components/diet/ScanComponentEditor.tsx` |
| P2 | Saved meals accepted invalid portions and lacked reliable pending protection and keyboard semantics. Invalid logging is disabled, submissions guarded, and controls are named real buttons. | `components/diet/DietPage.tsx` |
| P2 | Old ritual/timer snapshots could flash after identity changes; stray ritual IDs inflated counts. Hooks mask old state until restoration; counts use known definitions. Completion copy no longer invents a time or health action. | `lib/useRituals.ts`, `lib/useFocusTimer.ts`, Home/Plan |
| P2 | Late microphone permission or recorder-construction failure could leave tracks active. Recording sessions own stream/timer cleanup, prevent duplicate starts and suppress completion after disposal. | `hooks/useAudioRecorder.ts`, `lib/media/recording-session.ts` |
| P2/P3 | Empty setup fabricated a 1,780 kcal resting estimate; consent appeared active before agreement; Plan retained Cognitive Load wording. Estimates require valid inputs, consent labels reflect checkbox state, and Plan uses ordinary task-effort copy. | physical/consent setup components, `components/tasks/TaskBoard.tsx` |

No production routes, Firestore schemas or Google credentials changed. No dependencies were added.

## Verification

- **Full suite: 73 files, 829 tests passed, zero failures/skips.** Includes **33 Firestore rules/CRUD tests** on loopback emulator project `demo-satat-rules`, with required-emulator mode. Previous checkpoint: 779 passed, 26 skipped. This adds 24 tests and runs the 26 formerly skipped cases.
- **Production build: exit 0, all 34 routes generated.** Existing non-fatal image/hook lint warnings remain; this is not a repository-wide lint cleanup.
- New regressions: five auth cases, two context-owner cases, three nutrition/annotation cases, four media cases, three setup cases and seven collection round trips.
- Rules tests cover owner create/read/query/update/reload/delete and denied cross-account access/owner transfer for projects, tasks, workouts, body weight, meals, meal templates and workout templates. Train CRUD was not separately exercised through browser UI this iteration.

### Isolated browser checks

The standalone fixture bundles real Fuel/Plan/setup components and the Firebase SDK, with two mock identities and demo emulator data. Its banner identifies isolation and the fixed scanner response. It adds no production auth bypass or application route. UI screenshots prove layout/editing, **not model accuracy**.

1. A created a 400 kcal manual meal and saved template. Both persisted after remount. Saved quantity zero disabled Log; 0.5 logged 200 kcal / 10 g protein / 25 g carbs / 5 g fat with a disabled pending state.
2. B had empty meals/templates/workspaces; A's records returned on switching back. Workspace/task creation, task-title editing, remount persistence and deletion were confirmed.
3. A's ritual/timer state stayed separate from B. Returning to A/remounting preserved the running deadline. Unknown fixture ritual IDs did not count toward real habits.
4. Synthetic setup: empty details showed no invented energy, under-18 took the rejection route, adulthood allowed continuation, and bodyweight/home choices retained correct enums. Begin required both consent checkboxes. The existing handler records consent state when the Terms checkbox is checked, before Begin. No agreement was accepted for the user.
5. Supplied thali photo with a fixed UI response: four pills appeared once. Editing rice 180 → 230 g changed total 629 → 694 kcal, leaving other portions unchanged. Logging was disabled during editing. The logged meal persisted; expanded details showed horizontal donut/macros without unavailable-vitamin text.
6. Actual CSS widths 320/393/1440 px and light/dark fixture themes were inspected. At 320 px the summary header wraps, while donut/macros stay beside each other. At 393 px title/actions share a row. Screenshots supplement scroll-width checks, which alone miss internal overlap.

Disposable meals/templates/tasks/workspaces were deleted after verification; viewport overrides were reset. No real microphone/camera permission, Google switch or wearable connection was used. These checks were performed through browser automation; the fixture is not an unattended browser test runner.

### Additional live scanner checks

Two public photos ran through the actual production analysis route using configured DeepSeek credentials, separately from the fixed UI response. Both coarse recognition assertions passed:

| Photo | Result | Limit |
|---|---|---|
| Four samosas/chutney | Four pieces retained, chutney counted once; 60–70 g annotations conflict with 80 g reference pieces and require review. Observed 6.42 s. | 878 kcal is unweighed; hidden filling/oil/mass remain uncertain. |
| Oats/fruit bowl | Oatmeal family recognized; strawberries remain unresolved without piece mass, and gram conflicts require review. Observed 8.14 s. | Fruit identities and portions need correction. Returned 367 kcal is incomplete, not the full meal. |

Evidence: `artifacts/scan-evaluation/remaining-audit-portions-2026-11-16.json`. Thirteen other cases were filtered out of this two-case run; their skipped count is separate from the zero-skip full suite. Prior fifteen-photo recognition evidence remains in earlier reports. No weighed references exist: no measured calorie/gram accuracy percentage or universal dish guarantee is justified.

## Reproduce

With installed dependencies, Java and Firebase CLI, use separate terminals:

```powershell
# Terminal 1: do not substitute the production project.
firebase emulators:start --only firestore --project demo-satat-audit

# Terminal 2: fail rather than silently skip when emulator is absent.
$env:REQUIRE_FIRESTORE_EMULATOR='1'
npx vitest run --maxWorkers=2 --minWorkers=1
npm run build

# Optional interactive fixture at http://localhost:4180
node scripts/audit-browser.mjs

# Optional live provider checks; uses configured API credentials/usage.
$env:SCAN_EVAL_LABEL='remaining-audit-portions-review'
npx vitest run --config vitest.scan-eval.config.ts --maxWorkers=1 --minWorkers=1 -t '07_samosa|08_oats_berries'
```

The fixture loads actual Firestore rules into its demo namespace; rules tests use a separate namespace and do not clear fixture records.

## Original findings and remaining verification

All fourteen original findings have code fixes: fabricated personal values, unknown-food matching, manual nutrition validation, keyboard workout save, account-owned chat, consistent goals, query handoff, New Chat/composer actions, persistent timer, desktop cardio parity, narrow macros, scoped local rituals, labelled forms/dialog focus and plain copy. Earlier implementation/browser evidence remains in `docs/SATAT_AUDIT_FIXES_2026-11-15.md`.

Rituals remain account-scoped **on this device**; cross-device sync is not implemented. Real Google switching, physical mobile camera/microphone/keyboard, push delivery and wearable ingestion require the hardware/accounts excluded by the selected isolated-test scope. Photo nutrition still requires review. These are verification/product limits, not passed end-to-end claims.

Screenshots are in `C:/Users/ayush/.codex/visualizations/2026/11/14/01a1d936-5dff-7f90-965e-a8b893bc3c8f/`: `audit-closure-scan-393.jpg`, `audit-closure-fuel-393.jpg`, `audit-closure-fuel-dark-320.jpg`, `audit-closure-fuel-desktop.jpg`. The banner identifies the fixed scanner response.

This iteration changes 32 files against 380 tracked at its start (~8.4%), including tests/status/report/evidence, below the requested 10% cap. Further scope expansion was stopped.
