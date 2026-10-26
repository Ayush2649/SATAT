# SATAT (सतत्) — Project Status & Architecture Roadmap

> **Current Branch**: `feat/complete-ui-change-e2e`  
> **Design Philosophy**: Natural Athletic Editorial  
> **Brand Lineage**: *सतत्* (Sanskrit: *continuous*, *incessant*, *perpetual* with halant ्)  
> **Target Experience**: Clean, human, tactile, non-punitive wellness companion. "A companion, not a dashboard."

---

## 1. Design System & Token Architecture

The design language moves away from robotic, dark-purple SaaS boxes to an earthy, warm sunlit athletic aesthetic.

### Core Color Palette
| Token | Hex / Value | Description & Intent |
|---|---|---|
| `--satat-bg` | `#F6F3EC` | **Warm Sunlit Stone** canvas for all pages |
| `--satat-surface` | `#FCFBF9` | **Pure Cream Alabaster** cards and primary containers |
| `--satat-surface-elevated` | `#FFFFFF` | Elevated dialogs, floating capsules, and dropdowns |
| `--satat-surface-subtle` | `#EFECE4` | Warm inset stone backgrounds, progress tracks, chip pills |
| `--satat-anchor-dark` | `#191D1A` | **Deep Botanical Espresso** for hero cards, bottom floating docks, and primary contrast elements |
| `--satat-text-primary` | `#1C1917` | Warm Charcoal ink for typography |
| `--satat-text-muted` | `#57534E` | Warm stone secondary text |
| `--satat-text-tertiary` | `#8C857B` | Muted metadata and tracking headers |
| `--satat-terracotta` | `#E05A47` | Active accents, action pills, streak dots, primary CTA buttons |
| `--satat-matcha` | `#2D6A4F` | Circadian sync accents, completed milestones, botanical badges |

### Typography Scale
- **Display / Editorial**: `Instrument Serif` (Google Fonts, italic & normal) — used for emotional hooks, personalized headlines, and philosophy quotes.
- **Body & UI**: `Plus Jakarta Sans` / `Inter` — used for tactile metrics, form controls, labels, and readable body text.
- **Numbers / Metrics**: `Plus Jakarta Sans` font-bold and tabular figures.

---

## 2. Sprint Progress & Changelog

### ✅ Sprint 1: Foundation & Global Shell
- **Typography & Scale**: Loaded `Instrument_Serif` in `app/layout.tsx` and exported `fontFamily.serif` in `tailwind.config.ts`.
- **Global Design Tokens**: Standardized `:root` tokens in `styles/satat.tokens.css`.
- **Floating Botanical Dock**: Implemented Deep Botanical Espresso (`#191D1A`) dock in `components/Navigation.tsx` with active Terracotta indicator pill and subtle bottom blur.
- **Dynamic Route Headers**: Replaced legacy titles with standard SATAT editorial header format (`SATAT / Today`, `Plan`, `Train`, `Fuel`, `Orbit`).
- **Living Orbit Orb**: Created `OrbitLivingOrb.tsx` with multi-layered breathing radial rings.

### ✅ Sprint 2: 1:1 Editorial Landing Page Overhaul
- **Frosted Capsule Navigation**: Floating alabaster glass pill (`LandingNav.tsx`) with wordmark `satat.` and Google sign-in triggers.
- **Editorial Hero**: Left-aligned headline with Instrument Serif italic emphasis and multi-layered athlete + curved-arch oatmeal bowl collage (`HeroProductScene.tsx`).
- **Seamless Motion Timeline**: Borderless vertical sinusoidal day-in-motion schedule (`ProblemSection.tsx`) with animated SVG beam connectors.
- **Living Companion Orbit**: Open-canvas breathing orb with real-time prompt chips and quote (`OrbitSection.tsx`).
- **Continuous Proof**: 28-day stone continuity matrix with Sanskrit etymology card (`सतत्`) in `ProgressSection.tsx`.
- **Botanical Footer**: Grounded Deep Botanical Espresso card (`Footer.tsx`) with halant spelling and policy links.

### ✅ Sprint 3 & 3.5: 1:1 Editorial Onboarding Wizard
- **Open Canvas Stage Shell** (`app/onboarding/page.tsx`):
  - Removed dark outer box wrapper; rendered directly on open `#F6F3EC` sunlit canvas.
  - Added subtle top matcha radial wash (`rgba(216, 243, 220, 0.55)`).
  - Clean top bar with dynamic step titles, conditional back navigation, conditional skip button, and Google user profile picture integration.
  - Smooth auto-scroll to top on step transitions.
  - 10-segment calibration progress bar.
- **Card Upgrades Across All 10 Steps**:
  - `StepFocus.tsx`: Asymmetrical 2×2 grid with lifestyle photography for all 4 focus goals (fat loss, muscle gain, habits, vitality).
  - `StepPhysical.tsx`: 2×2 biometric bento grid (Height, Weight, Age, Biological Sex) with steppers and unit switcher (`cm/kg` ↔ `ft+in/lbs`).
  - `StepPace.tsx`: Target weight card with tactile `-` / `+` steppers and unobstructed input, trajectory vector, and 3 pace cards.
  - `StepWorkoutRhythm.tsx`: 4-column day selector, duration pills, atmospheric reminder window thumbnails, experience level photos, and dedicated editorial fallback card for *Nutrition & Habits* selection.
  - `StepWorkoutEnv.tsx`: Rich environment photos for commercial gym, home dumbbells, and bodyweight training spaces.
  - `StepDiet.tsx`: Appetizing culinary background photos and left-hand dish thumbnails across all 5 dietary patterns.
  - `StepHealth.tsx`: RAM-only privacy assurance badge, clinical boundary checkboxes, and non-distorting safety clearance capsule.
  - `StepConsent.tsx`, `StepActivity.tsx`: Refined alabaster cards and accessible controls.
  - `StepReveal.tsx`: Assembled System Blueprint with hero nourishment card (proportional macros), workout prescription, Day 1 ritual, and activation CTA.

### ✅ Sprint 3.6: Onboarding UX Polish & Selection Refinements
- **Dynamic Selection in `StepFocus.tsx`**: Eliminated hardcoded card backgrounds so only the active selected goal receives Deep Botanical Espresso (`#191D1A`) with Terracotta ring and badge, while unselected cards render in clean Alabaster (`#FCFBF9`).
- **Single-Line Multipliers in `StepActivity.tsx`**: Prevented BMR multiplier pills (`1.375× BMR`, `1.725× BMR`) from wrapping on mobile viewports using `whitespace-nowrap shrink-0` and grouped with checkmarks.
- **Deduplicated Window Photos in `StepWorkoutRhythm.tsx`**: Updated Afternoon (`12:30`) to sunlit workout photography and Evening (`18:00`) to warm dusk training photography, eliminating duplicate imagery with the Advanced experience card.
- **Smart Health Default in `StepHealth.tsx` & `useOnboardingWizard.ts`**: Initialized health screening to `"None of the above"` (`["none"]`) with reactive auto-selection and fallback safety, removing unnecessary friction.
- **CI Pipeline Green Standard**: Reconciled `tests/landing/production-landing.test.tsx` by removing legacy tests auto-merged from `main` that asserted on obsolete SaaS sections (`ConnectedSystem`, `87% rolling adherence`, `dark:bg-[#0B0E11]/85`), and fixed headline assertion matching for the Stitch `OrbitSection`. Full suite passes 39/39 test files (516 passed, 26 skipped).

---

## 3. Pending / Upcoming Sprints

### ⏳ Sprint 4: Core Dashboard Alignment (1:1 Stitch Experience)
- **Today / Home View** (`components/dashboard/HomeView.tsx`):
  - Calibrate daily timeline, pebble streak tracker, and morning/afternoon/evening ritual cards.
- **Fuel / Diet View** (`components/diet/DietPage.tsx` + `MealScannerModal.tsx`):
  - Refine macro wheel, recent meals bento, and camera/voice nutrition scanner with Warm Sunlit Stone aesthetic.
- **Train / Workout View** (`components/workout/WorkoutPage.tsx`):
  - Progressive overload tracking, exercise set logger, and recovery gauges.
- **Orbit AI Companion** (`components/orbit/OrbitView.tsx`):
  - Natural conversation interface, context cards, and prompt suggestions.
- **Tasks & Settings** (`TaskBoard.tsx`, `Settings`):
  - Alabaster list items, low-cognitive-load habit tracking, and profile preference controls.

### ⏳ Sprint 5: Multi-Device Responsive & Final E2E QA
- **Tablet Optimization**: iPad 10th Gen (1024×768) 2-column bento grid verification.
- **Desktop Optimization**: Desktop (1440×900) 3-column layout verification.
- **End-to-End Testing**: Full automated test verification and Playwright regression sweep.

---

## 4. Current Quality & Build Metrics
- **TypeScript & Next.js Build**: `npm run build` exits with code `0` (all 32 static/dynamic routes compiled).
- **Vitest Suite**: `516 passed | 26 skipped` across all 39 test suites.
- **Onboarding Tests**: `78/78 passed` across `tests/onboarding/*`.
- **Landing Tests**: `3/3 passed` across `tests/landing/*`.

