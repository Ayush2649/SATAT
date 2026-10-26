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

### ✅ Sprint 4.1: Strict 1:1 Stitch Today Dashboard Implementation (`components/dashboard/HomeView.tsx`)
- **Greeting Header & 7-Day Week Capsule Strip**:
  - Dynamic date eyebrow in uppercase (`SUNDAY, OCT 25`) with personalized serif greeting (`Good morning, <span className="italic text-[#2D6A4F]">{firstName}</span>`).
  - Top-right `24d flow` pill with Matcha Sage status indicator dot.
  - 7 vertical pill capsules (`M`..`S`) for the current week: active today rendered in Deep Botanical Espresso (`#191D1A`) with Terracotta indicator dot (`#E05A47`), and past/future days in Alabaster (`#FCFBF9`) with Matcha Sage dots.
- **Asymmetric Bento Grid (col-span-7 / col-span-5)**:
  - Left: Deep Botanical Espresso workout card (`#191D1A`) with ambient sage wash, `6:00 PM · 45 MIN` time pill, dynamic workout routine title/summary, and full-width Terracotta `Start Session ▷` button.
  - Right: Stacked Alabaster cards: (Top) Calorie progress ring SVG with center flame and `kcal left` readout; (Bottom) Protein card with percentage pill (`83%`), progress bar, and `Almost there` micro-status.
- **"MINDFUL WHISPER" Callout Strip**:
  - Warm stone card (`bg-[#EFECE4]/85`) with peach sparkle badge (`#FADCD5` / `#E05A47`), context-aware protein proximity readout, and low-cognitive-load guidance.
- **"TODAY'S RHYTHM" Timeline (Strictly Inter-Node Connected)**:
  - Connected timeline rail (`w-[1.5px] bg-stone-300/80`) running strictly between Node 1->2 and 2->3 with zero dangling line below Node 3.
  - Node 1: Fuel card with green checkmark node, oatmeal & berries photo, logged calories, and checkmark.
  - Node 2: Active Focus card with dark node + glowing Terracotta dot, task title/description, and interactive completion radio button.
  - Node 3: Evening Restoration card with muted stone node, wind-down title, and crescent moon icon.
- **"PROGRESS TRAJECTORY — Weekly Momentum" Card (`components/dashboard/ProgressTrendChart.tsx`)**:
  - 3-pill range switcher (`7D`, `30D`, `90D`), 3-column KPI strip (Adherence, Strength, Fuel), responsive Bezier area curve SVG with linear gradient wash, hollow/solid nodes, vertical dashed guide line, floating botanical tooltip (`Fri: 100% · Upper Body A`), and bottom weekday axis labels.
- **"CONTINUITY · सतत् — Habit Compounding" Card (`components/dashboard/ConsistencyHeatmap.tsx`)**:
  - 2-pill toggle (`Month` / `Year`), 2×2 summary pill grid (`🔥 24d Streak`, `🌿 87% Adherence`, `🏆 28d Best`, `✓ 21 Active`), weekday headers, 35-cell rounded pebble grid with exact Stitch tier colors, interactive day tap inspection pill, and bottom legend strip (`Rest`, `1-2 habits`, `Target Hit (3)`, `Today`).

### ✅ Sprint 4.2: Dashboard Mobile Layout Polish & Dynamic History Integration
- **Single-Line Greeting & Dynamic Streak**:
  - Implemented single-line greeting headline with `whitespace-nowrap truncate` to guarantee the user's name never wraps to a second line on narrow mobile viewports (`393px`).
  - Replaced static placeholder badge with real calculated active streak (`🔥 {activeStreakDays}d streak`) derived dynamically from user logs.
- **Side-by-Side Bento Grid & AI Note Cleanup**:
  - Locked 12-column Bento grid (`grid-cols-12 gap-3 items-stretch`) across all screen sizes, rendering the Workout card (`col-span-7`, `h-[244px]`) and stacked Calorie + Protein cards (`col-span-5`, `h-[244px]`) side-by-side on mobile.
  - Removed raw AI markdown coaching essays from the workout card, clamping title to 2 lines and subtitle to concise session metrics (`✓ Session complete · ~X kcal burned · Y exercises`).
  - Scaled calorie SVG ring down to `w-11 h-11` and added dynamic protein status indicator (`Goal hit ✓`, `Almost there`, or `{g} to go`).
- **Text Truncation Safeguard in "TODAY'S RHYTHM"**:
  - Applied `min-w-0 overflow-hidden` and `truncate` across all cards, titles, and subtitles, preventing long meal names and task titles from breaking the card layout.
- **Dynamic Weekly Momentum Chart (`ProgressTrendChart.tsx`)**:
  - Fixed header title wrapping with `whitespace-nowrap`.
  - Wired real user session, meal, and task data across 7D, 30D, and 90D ranges with interactive SVG node tapping and dynamic tooltip readouts.
- **Dynamic Habit Compounding Heatmap (`ConsistencyHeatmap.tsx`)**:
  - Fixed header title wrapping with `whitespace-nowrap`.
  - Dynamically generated current month calendar grid aligned to real ISO weekdays, mapping daily habit completion (0, 1-2, 3 habits) with interactive tap detail inspections.
- **Bottom Clearance Polish**:
  - Removed excessive `mb-24` and `pb-28` margins, leaving a clean `pb-6` that aligns the heatmap 16px–24px above the floating navigation dock.

### ✅ Sprint 4.3: Mobile Spacing, Flowing Timeline Beam & Dynamic Rhythm Polish
- **Editorial Greeting Headline & Matcha Dot**:
  - Scaled greeting headline font to a prominent editorial serif scale (`text-[1.95rem] xs:text-[2.15rem] sm:text-4xl md:text-5xl leading-[1.08] tracking-tight text-[#1C1917]`) with italic matcha user name.
  - Added a botanical matcha pulse dot indicator beside the date eyebrow (`flex items-center gap-2`).
  - Polished the dynamic streak badge (`🔥 {activeStreakDays}d`, `px-3 py-1.5 shadow-xs`).
- **Continuous Flowing Animated Timeline Rail in "TODAY'S RHYTHM"**:
  - Replaced low-opacity pseudo-lines with a continuous flowing vertical track (`absolute left-4 -translate-x-1/2 w-[3px] rounded-full overflow-hidden z-0 pointer-events-none`) anchored at `top: 36px` to `bottom: 36px`.
  - Applied a luminous botanical gradient: `linear-gradient(180deg, #2D6A4F 0%, #D97706 45%, #E05A47 100%)` with soft ambient glow `box-shadow: 0 0 8px rgba(45, 106, 79, 0.35)`.
  - Added an internal animated luminous pulse (`animate-timeline-beam`) looping continuously to give the schedule a live, flowing pulse of energy.
  - Centered nodes in `w-8 flex items-center justify-center shrink-0` (exact center at 16px aligning with `left-4`) masked with `ring-4 ring-[#F6F3EC]` so the line connects seamlessly behind each circle without poking out top or bottom.
- **Eliminated Double Horizontal Padding & Prevented Header Truncation**:
  - Removed duplicate `px-4` from `HomeView.tsx` (using `px-0 sm:px-2`), allowing cards to span almost the full mobile width (14px total margin matching Stitch reference `image_8b0600.png`).
  - Removed `truncate` from `"Weekly Momentum"` and `"Habit Compounding"`, setting font size to `font-serif text-[1.15rem] sm:text-xl text-[#1C1917] leading-tight whitespace-nowrap` with `shrink-0` containers so neither title cuts off on mobile.
- **100% Truthful Dynamic Year & Month Heatmap**:
  - Completely purged all mock arrays, deterministic seed generators, and hardcoded distributions.
  - Built unified `dailyHabitMap` derived 100% from Firestore user records (`meals`, `sessions`, `tasks`).
  - In `Year` view, renders 52 weeks × 7 days matrix where only days with actual logged activity light up; unlogged days render truthfully as warm stone rest (`#EFECE4`).
  - Dynamic summary pills calculate exact streak, adherence, and active days for both Month and Year views.

---

## 3. Pending / Upcoming Sprints

### ⏳ Sprint 4.2+: Core Dashboard Alignment (1:1 Stitch Experience)
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

