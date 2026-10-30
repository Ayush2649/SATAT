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

### ✅ Sprint 4.4: 1:1 Stitch Training Studio Overhaul (`WorkoutPage.tsx`)
- **Shared Top Header & 3-Tab Segmented Switcher**:
  - Editorial headline `Training Studio` in Instrument Serif with subtitle `Move with steady, progressive form.`.
  - Tactile interactive Body Weight Pill (`⚖️ {latestBodyWeight} kg`) with quick log modal.
  - 3-tab segmented pill switcher (`Log Workout`, `Templates`, `History`).
- **View 1A: Active Logging State (`image_7939bf.jpg`)**:
  - Assigned Split Hero Launcher Card (`bg-[#191D1A]`) with lifestyle photo thumbnail, assigned routine badge (`ASSIGNED SPLIT · {days} DAYS / WK`), primary `Load {session} →` CTA, and horizontal other-sessions strip.
  - 2-Column Bento row for Session Date (calendar picker) & Duration (tactile `-` / `+` 5m stepper buttons).
  - Strength Movements section with Alabaster exercise cards, `SET | PREV | KG | REPS | DONE` grid, and `⊕ Add Set` / Voice logging triggers.
  - Cardio & Zone 2 card + full-width Terracotta `Complete & Analyze Session ✓` CTA with reassurance micro-copy.
- **View 1B: Completed Session & "Session Intelligence" State (`image_793942.jpg`)**:
  - Completed Session Hero Card (`bg-[#191D1A]`) with dynamic split title (e.g. `Push Day — Upper Body`, never generic `"Workout logged today"`), muscle pills, `Edit Session` toggle, and 4-column telemetry strip (`DURATION`, `ENERGY` with dynamic calories, `VOLUME`, `SETS`).
  - Movement Breakdown card with top sets and volume PR badges.
  - Orbit Biomechanical Synthesis card parsing AI coach reports into 3 structured sub-cards (Mint Sage Highlight, Warm Stone Progression, Deep Botanical Espresso Next Session Tip) stripped of markdown asterisks.
- **View 2: Templates Tab (`image_7938fd.jpg`)**:
  - Section 1 (Assigned Architecture): Photo thumbnail cards with dark overlay labels (`CHEST/BACK`, `QUADS/HINGE`), `ASSIGNED` pill, full titles (zero truncation), `Load →` CTA, and expandable scheduled movement drawers.
  - Section 2 (Curated Splits): 2×2 photo masonry grid for preset routines with movement count pills and instant load triggers.
  - Section 3 (Personal Workout Templates): Custom splits list and `Create Your Own Split` invitation card with `+ Build New Split Template` modal.
- **View 3: History Tab (`image_7938a1.png`)**:
  - Monthly Archive Summary Banner with sessions completed, total volume, and average calorie burn.
  - Interactive Muscle Category Filter Strip (`All Sessions`, `Upper Body`, `Lower Body`, `Push / Pull`, `Cardio`).
  - Chronological session cards with split title in Instrument Serif, category badge, telemetry pills, and expandable set breakdown.
- **Dynamic Calorie Extraction & Classification Engine (`lib/workouts/workoutMeta.ts`)**:
  - Resolved `— Kcal` bug: extracts calories from `caloriesBurned` or coach report regex, falling back to physiological MET calculation (`duration * 6.8 + sets * 4`) so completed sessions never show `0 kcal`.
  - Deterministic `inferWorkoutSplitMeta` helper maps exercises and templates to rich titles and muscle groups.
  - 100% test coverage in `tests/workouts/workoutMeta.test.ts`.

### ✅ Sprint 4.5: Workout Studio UX Refinements & Layout Polish (`WorkoutPage.tsx`)
- **Post-Completion "Edit Session" Trap Solved**:
  - Tab navigation away from `"Log Workout"` automatically resets `isEditingSession` so returning to the tab displays the Completed Session summary.
  - When editing today's session, hid the Assigned Split launcher card and rendered an editorial status bar (`✎ Editing Today's Session` + `← Back to Summary`).
  - Added primary button `"Save Session Changes ✓"` and secondary ghost action `"Cancel & Return to Summary"`.
  - Added `+ Cardio` quick-action pill in the Completed Session hero row with instant persistence to Firestore.
  - Rendered dedicated cardio breakdown card for logged cardio activities in today's completed session.
- **Single-Letter Wrapping Fixed in Templates Tab**:
  - Applied `text-[15px] sm:text-lg whitespace-nowrap truncate` to template titles and reduced container padding (`p-3.5 gap-3`, button `px-3 py-1.5 text-[11px]`), preventing orphaned letters (`Compound Upper A`, `Compound Lower A`, etc.).
- **Scannable Session Intelligence Sub-Cards**:
  - Clamped `VOLUME HIGHLIGHT` and `LOAD PROGRESSION` text to `line-clamp-3` by default with an interactive `"Show full analysis ⌄"` / `"Show less ⌃"` toggle button.
- **History Filter Pill Scroll Fixed**:
  - Added `overflow-x-auto no-scrollbar pb-1 -mx-1 px-1` to the filter pill container with `shrink-0 whitespace-nowrap` on all 5 chips, allowing smooth scrolling to the 5th `Cardio` pill.
- **Eliminated Bottom Margin Gap**:
  - Reduced outer wrapper padding from `pb-16` to `pb-6`, aligning the bottom-most card 16px–24px above the floating dock.
- **Single-Line Horizontal Capsule Hardening**:
  - Resolved vertical pill distortion in Completed Session hero card where `+ Cardio` and `Edit Session` wrapped into tall two-line shapes (`+` over `Cardio`, `Edit` over `Session`).
  - Standardized the action buttons with `h-7 px-3 inline-flex items-center justify-center whitespace-nowrap shrink-0 leading-none`, locking in horizontal pill geometry.
  - Streamlined the mobile badge to `✓ COMPLETED` (`hidden sm:inline` for `SESSION `) and wrapped buttons in `shrink-0 whitespace-nowrap`, guaranteeing that the left badge, `+ Cardio`, and `Edit Session` sit side-by-side on a single row without wrapping or distortion.
  - Applied `whitespace-nowrap shrink-0` across movement breakdown badges, set chips, and history telemetry pills.

### ✅ Sprint 4.6: Strict 1:1 Stitch Nourishment Studio (`DietPage.tsx`, `MealScannerModal.tsx`, `MacroDonutBreakdown.tsx`)
- **Top Header & Quick-Action Icon Pills**:
  - Rendered `Nourishment Studio` in Instrument Serif with subtitle `Mindful fueling, zero calorie anxiety.`
  - Added 3 circular tactile icon buttons in Alabaster stone: Voice Log (`Mic`), Saved Repertoire (`Bookmark`), and Daily Macro Goals (`Settings`).
- **Date Navigator Capsule**:
  - Smooth date switcher pill with previous/next triggers and active mint `Today` pill.
- **Hero Dark Botanical Nutrition Summary Card**:
  - Implemented Deep Botanical Espresso card (`#191D1A`) with dynamic calorie remaining readout against target goals.
  - Rendered 3-segment MyFitnessPal-style macro donut breakdown (`MacroDonutBreakdown`) with warm amber (carbs), terracotta (fat), and matcha/emerald (protein) arcs and 3px gap geometry.
- **Flagship USP Launcher Card ("Scan Plate or Barcode")**:
  - Viewfinder food bowl thumbnail with terracotta corner brackets.
  - Dual action pills: `Scan Plate` (opens plate AI mode) and `Barcode` (opens barcode & label mode).
- **"TODAY'S NOURISHMENT LOG" & Expandable Meal Drawers**:
  - Rendered chronological photo-backed meal cards with `resolveDishThumbnail` auto-photo matcher.
  - Added time & circadian category labels (`08:30 AM · BREAKFAST`, `01:30 PM · LUNCH`, etc.).
  - Collapsed state displays compact macro pills (`kcal`, `P`, `C`, `F`).
  - Interactive accordion expansion renders individual meal 3-segment `<MacroDonutBreakdown variant="light" />` drawers.
- **Flagship Dual-Mode Food Scanner Sheet (`MealScannerModal.tsx`)**:
  - Non-overlapping clean header with `RITUAL SCAN` eyebrow and `Fuel Scanner` title.
  - Mode 1 (`Plate Photo AI`): Viewfinder card with corner brackets, detected component tags, confidence badge, context hint modifiers (`+ 1 tsp Ghee`, `+ 1 Scoop Whey`), portion multiplier stepper (`0.5×`–`3.0× Bowl`), and live macro donut breakdown.
  - Mode 2 (`Barcode & Label`): 60FPS laser autofocus viewfinder HUD with pulsating terracotta laser line, packaged staples search, serving steppers, and one-tap logging.
- **Smart Custom Dish Logger & Natural Voice Parser**:
  - `AddMealModal` with live dish photo auto-matcher, 2×2 tactile stepper grid for calories and macros, and repertoire save option.
  - `VoiceMealModal` with Natural Athletic Editorial styling and photo-backed parsed item cards.

### ✅ Sprint 4.7: Complete Nourishment Studio Polish & Fixes (`DietPage.tsx`, `MealScannerModal.tsx`, `MacroDonutBreakdown.tsx`, `VoiceMealModal.tsx`, `dishMatcher.ts`)
- **Fullscreen Modal Stacking & Clipping Fix (`z-[100]`)**:
  - Elevated all modal backdrops (`Fuel Scanner`, `Voice Log`, `Saved Staples`, `Daily Macro Goals`, `Log a Custom Dish`) to `fixed inset-0 z-[100] bg-[#191D1A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto`.
  - Configured inner dialog containers with `max-h-[90dvh] my-auto overflow-y-auto`, ensuring all modal headers and footer buttons sit above both the top app bar (`z-40`) and bottom floating dock (`z-50`) without being clipped.
- **1:1 Geometric Macro Donut Engine & Unified Ring Arc Colors (`MacroDonutBreakdown.tsx`)**:
  - Rebuilt SVG donut ring with `strokeLinecap="butt"` for crisp flat geometric cuts matching Stitch and MyFitnessPal.
  - Unified all rings across the entire application (Daily Nutrition Summary hero card, expanded meal cards, Plate Photo AI results, and meal template previews) to use identical ring arc colors:
    - **Carbs Arc**: Teal (`#14B8A6`)
    - **Fat Arc**: Amber (`#F59E0B`)
    - **Protein Arc**: Vibrant Violet (`#8B5CF6`)
  - Aligned high-contrast percentage readouts for dark (`#14B8A6`, `#F59E0B`, `#A78BFA`) and light (`#0D9488`, `#D97706`, `#7C3AED`) card surfaces.
  - 4px gap perimeter subtraction math with zero-macro guard preventing phantom colored dots at 0 kcal.
  - Centered calorie summary with dynamic remaining/consumed indicator and 3-column inset breakdown box (`Carbs · Fat · Protein` with percentages and grams).
- **True 3-State Plate Photo AI Scanner (`MealScannerModal.tsx`)**:
  - Eliminated preloaded fake paratha photo and hardcoded "Dal Tadka" result.
  - Clean state machine: (1) Initial empty dashed capture card with camera upload button; (2) Live analyzing state overlaying the user's real uploaded photo with animated scanner bar; (3) Real parsed results card with detected tags, confidence badge, portion steppers, and live donut.
- **Barcode & Label Scanner Experience & Quantity Stepper Fix (`MealScannerModal.tsx`)**:
  - Moved the quantity stepper pill (`- 1 +`) to the top-right corner of each packaged food card, directly adjacent to the item title and macros.
  - Streamlined the bottom row to cleanly hold only the "Verified Nutrition Label" badge on the left and the "Add to Fuel →" button on the right.
  - Added `overflow-x-hidden` and `p-4 sm:p-6` to the scanner dialog sheet and `min-w-0` to the search input flex row, completely eliminating horizontal scrolling and overflow on mobile viewports (`393px`).
  - Integrated prominent "Scan Barcode / Label Now" camera action button directly inside the laser viewfinder.
  - Added packaged staples search lookup with instant macro loading.
  - Refined product cards with 2-row layout (`text-xs font-bold leading-snug line-clamp-2`), preventing truncated 5-letter titles.
- **Daily Macro Goals Modal CSS Fix (`DietPage.tsx`)**:
  - Converted form rows to `grid grid-cols-12 items-center gap-3` (Label: `col-span-3 text-xs font-bold`, Input: `col-span-7`, Unit: `col-span-2 text-xs font-semibold text-[#8C857B] whitespace-nowrap text-left`).
  - Completely resolved line wrapping for `"kcal"` and `"g"` units across all viewport widths.
- **Culinary Photo Matching Precision (`lib/diet/dishMatcher.ts`)**:
  - Added dedicated photography mappings for Boiled Corn, Rolled Oats, Paneer Bhurji/Curry, Masala Dosa, Chicken Breast, etc.
  - Reordered matching rules so specific dish keywords (e.g. `paneer`, `oats`, `corn`) take precedence over generic ingredient terms (`bhurji`, `roti`).
- **Complete Anti-Slop Emoji Audit**:
  - Systematically purged all system emojis and unicode pseudo-glyphs (`📷`, `▮▯`, `✨`, `✓`, `🎙️`, `🔖`, `⚙️`) across all Diet views and modals, replacing them with Lucide icons (`Camera`, `Barcode`, `ScanBarcode`, `Sparkles`, `Check`, `Mic`, `Bookmark`, `Settings`).
- **1:1 Apple Voice Memos Waveform Visualizer (`AudioWaveformVisualizer.tsx`, `VoiceMealModal.tsx`)**:
  - Implemented the iconic Apple Voice Memos recording card 1:1 matching user design reference (`media_1793076878200_04c09e7c.png`).
  - Dark charcoal rounded card (`bg-[#1C1C1E] rounded-[24px]`) with symmetrical vertical pill bars.
  - Signature vertical cyan/blue playhead needle (`#0A84FF`) with top and bottom circular beads.
  - Symmetrical bars scroll smoothly across the needle: recorded audio on the left in vivid red (`#FF3B30`), incoming audio stream on the right in white (`bg-white/90`).
  - Clean, uncluttered UI: prominent timer, live audio streaming, and circular red stop button with white square.
  - Verified with unit tests in `tests/ui/audioWaveform.test.tsx` (2/2 passing).
- **Merge Conflict Resolution & Image Compliance Gate (`DietPage.tsx`)**:
  - Resolved merge conflict markers in `components/diet/DietPage.tsx` from upstream merge commit `0cf69de`.
  - Added compliant `MealPhotoPreview` component using `next/image` (`fill`, `unoptimized`, `object-cover`), passing `tests/diet/meal-preview-image.test.ts` with 0 warnings.
  - Zero conflict markers in entire repository.
- **Test & Build Verification**:
  - Added unit tests in `tests/diet/dishMatcher.test.ts` (12/12 passing), `tests/diet/macroDonut.test.tsx` (4/4 passing), `tests/ui/audioWaveform.test.tsx` (2/2 passing), and `tests/diet/meal-preview-image.test.ts` (5/5 passing).
  - Full Vitest suite: **47 passed (47 files), 564 passed | 26 skipped (590 total)**.
  - Production build: `npm run build` exits with code `0` (all 32 static/dynamic routes compiled).

### ✅ Sprint 4.8: Responsive Bottom Dock, Header Alignment, Modal Portals & Food Scanner Hardening (`Navigation.tsx`, `HomeView.tsx`, `DietPage.tsx`, `MealScannerModal.tsx`, `VoiceMealModal.tsx`, `dishMatcher.ts`)
- **Responsive Floating Bottom Dock (`Navigation.tsx` & `styles/app-shell.css`)**:
  - Pinned dock with `fixed left-1/2 -translate-x-1/2 bottom-[max(10px,env(safe-area-inset-bottom))] z-50`.
  - Responsive multi-device width: `w-[calc(100vw-24px)] max-w-[400px] sm:max-w-[480px] md:max-w-[600px] lg:max-w-[720px]` with compact height `h-[58px] sm:h-[62px]`.
  - Moved safe area inset from internal padding to bottom offset, preventing bloated 90px pills on iPhone.
  - Configured 5-column CSS grid (`grid grid-cols-5 items-center justify-items-center w-full h-full`) distributing `Today`, `Plan`, `Track (+)`, `Train`, and `Fuel` with mathematically equal spacing on iPhone, iPad, and desktop.
  - Proportional center `+` button (`w-10 h-10 sm:w-11 sm:h-11 -mt-3 bg-[#E05A47]`) with `Track` label.
- **Greeting & Streak Badge Overlap Fix (`components/dashboard/HomeView.tsx`)**:
  - Moved `🔥 {activeStreakDays}d` badge into the top eyebrow row alongside the date (`● TUESDAY, OCT 27` on left, streak on right).
  - Rendered master greeting `<h1 className="font-serif font-normal text-[1.6rem] sm:text-3xl leading-tight tracking-tight text-[#1C1917] mt-1">` on its own full-width row, completely eliminating collisions on narrow screens.
- **Modal Portaling to `document.body` & Body Scroll Lock (`DietPage.tsx`, `MealScannerModal.tsx`, `VoiceMealModal.tsx`)**:
  - Portaled all modal overlays (`Modal`, `MealScannerModal`, `VoiceMealModal`) directly to `document.body` via `createPortal`, breaking out of parent CSS transform stacking contexts.
  - Locked background scrolling via `useEffect` (`document.body.style.overflow = "hidden"` on open, restored on unmount).
  - Configured standard layout: `fixed inset-0 z-[9999] bg-[#191D1A]/65 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center sm:p-4`, sticky header, and independently scrollable body (`max-h-[92dvh]`).
- **Barcode & Label Tab Polish (`MealScannerModal.tsx`)**:
  - Removed hardcoded "POPULAR PACKAGED STAPLES" list when search query is empty; displays only laser viewfinder and search box.
  - Added always-visible `Search / Estimate` action button.
  - Rendered all 4 macro pills (`kcal`, `protein`, `carbs`, `fat`) as clean flex-wrap badges (`flex flex-wrap gap-1.5 mt-1.5`), completely eliminating fat gram truncation.
- **Plate Photo AI Error / Non-Food & Confidence Handling (`MealScannerModal.tsx`, `app/api/analyze-meal/route.ts`, `lib/ai/providers/common.ts`, `gemini.ts`)**:
  - Reordered item extraction before candidate fallback so food from visibleItems is correctly assigned.
  - Eliminated fake `"Unknown Indian Dish"` fallback; returns `noFoodDetected: true` and `calories: 0`.
  - Rendered Amber Guidance Card (`bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-[24px] p-4 text-[#92400E]`) with `<AlertCircle />` and re-analyze/retake actions when no food is detected.
  - Applied strict confidence badge styling:
    - High: mint green (`bg-[#D1FAE5] text-[#065F46]`) with `<Check className="w-3 h-3" /> High Confidence · Depth Calibrated`
    - Medium: warm amber (`bg-[#FEF3C7] text-[#92400E]`) with `Medium Confidence · Portion Estimated`
    - Low: soft coral (`bg-[#FEE2E2] text-[#991B1B]`) with `Low Confidence · Add a Context Hint below` (zero green checkmarks on low confidence).
  - Stacked detected dish title on its own full-width line (`font-serif text-xl sm:text-2xl text-white leading-snug break-words`) with portion stepper row below.
- **Logged Meal Row Alignment & Soya Photography (`DietPage.tsx`, `lib/diet/dishMatcher.ts`)**:
  - Expanded dish title area with `line-clamp-1 text-[15px] font-bold text-[#1C1917] leading-snug`.
  - Moved bookmark and delete icons into compact top-right button group (`gap-1`).
  - Added dedicated high-protein soya dish photo mapping (`https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=300&q=75`).
- **Test & Build Verification**:
  - Added unit tests in `tests/diet/dishMatcher.test.ts` (13/13 passing) and `tests/diet/mealScannerModal.test.tsx` (2/2 passing).
  - Full Vitest suite: **48 passed (48 files), 567 passed | 26 skipped (593 total)**.
  - Production build: `npm run build` exits with code `0` (all 32 static/dynamic routes compiled).

---

## 3. Pending / Upcoming Sprints


### ✅ Sprint 4.9: Clinical Nutrition Engine Overhaul & Apple Voice Memo 1:1 Experience
- **Deterministic Food Anchor & Atwater Engine (`lib/nutrition/foodAnchors.ts`)**:
  - Grounded in IFCT (Indian Food Composition Tables, ICMR-NIN) and USDA FoodData Central data.
  - Distinguishes raw vs. cooked staples explicitly: dry soya chunks (50g raw/dry default = 173 kcal, 26g P, 16.5g C, 0.3g F vs. 150g boiled = 180 kcal, 27g P), raw vs. grilled chicken breast, plain roti vs. roti with ghee, etc.
  - Implemented `enforceAtwaterMath<T>(item: T): T`, enforcing strict consistency with Atwater factors (`4P + 4C + 9F`) and calibrating drift > 8% so the macro donut ring and total calories are 100% mathematically synchronized.
  - Added fitness staples (`soya_chunks_dry`, `soya_chunks_boiled`, `oats_rolled`, `paneer_fresh`, `egg_whole`, `egg_white`, `chicken_breast_cooked`, `whey_isolate`) into `INDIAN_FOOD_DATABASE` (`lib/ai/nutrition/database.ts`) for instant deterministic lookups.
- **Dedicated Barcode & Nutrition Facts Label OCR Route (`app/api/diet/barcode/route.ts`)**:
  - Direct barcode lookup via OpenFoodFacts API v2 with automatic macro extraction and Atwater enforcement.
  - Nutrition label photo OCR using Google Gemini Vision (with Groq Vision fallback) to extract product name, serving size, calories, protein, carbs, fat, and printed barcode digits directly from camera uploads.
  - Search / estimate query handler combining ground-truth food anchors with OpenFoodFacts search catalog.
- **Barcode & Label Modal UX Overhaul (`components/diet/MealScannerModal.tsx`)**:
  - Scanning a barcode or nutrition label photo stays strictly within the Barcode & Label tab (no longer erroneously forces switch to plate photo mode).
  - Shows dedicated scanning states: `Scanning nutrition label & barcode with OCR...` with active status badge.
  - Displays detected plate components (`result.visibleItems`) as clean, interactive pills above candidate alternatives.
- **Apple Voice Memos 1:1 Live Waveform Visualizer (`components/ui/AudioWaveformVisualizer.tsx`)**:
  - Symmetrical dark card with animated vertical audio bars: Apple Red (`#FF3B30`) on the left (recorded audio), bright white (`#FFFFFF/90`) on the right (upcoming audio).
  - Electric blue playhead needle (`#0A84FF`) with luminous top and bottom circular beads (`shadow-[0_0_12px_rgba(10,132,255,0.85)]`).
  - Organic motion breathing simulation during quiet pauses ensures the audio visualizer is always lively and never looks static or flat.
- **Voice Meal Log Accuracy (`app/api/voice-meal/route.ts`)**:
  - Integrated IFCT reference values for fitness staples and protein sources.
  - Applied `enforceAtwaterMath` on all parsed meal items to eliminate calorie-to-macro mismatches.
- **Test & Build Verification**:
  - Added unit test suite in `tests/diet/nutrition-accuracy.test.ts` (15/15 passing).
  - Full Vitest suite: **49 passed (49 files), 582 passed | 26 skipped (608 total)**.
  - Production build: `npm run build` exits with code `0` (all 33 static/dynamic routes compiled).

### ✅ Sprint 4.10: Compound Meal Resolution, Resilient Barcode Pipeline & Unified Donut Colors
- **Compound Multi-Item Meal Splitting Engine (`lib/nutrition/foodAnchors.ts`, `app/api/estimate-meal/route.ts`)**:
  - Implemented `resolveMultiItemFoodAnchors(query)` splitting on compound separators (`/\s+(?:with|and|plus|along with|&|\+)\s+|\s*,\s*/i`).
  - Completely fixes dropping items in compound queries (e.g. `"2 whole eggs with 2 rotis"` correctly resolves both eggs and rotis together instead of only rotis).
  - Accurate ground-truth calibration for fitness and Indian meal anchors:
    - Standard roti (35g): `104 kcal, 3.1g P, 21g C, 0.8g F` (2 rotis = `208 kcal, 6.2g P, 42g C, 1.6g F`).
    - Whole boiled egg (50g): `72 kcal, 6.3g P, 0.4g C, 4.8g F` (2 eggs = `144 kcal, 12.6g P, 0.8g C, 9.6g F`).
    - Combined total for `"2 whole eggs with 2 rotis"`: **`352 kcal, 18.8g P, 42.8g C, 11.2g F`**.
    - `"200 gms paneer"`: **`530 kcal, 36.6g P, 6.8g C, 41.6g F`**.
  - If any ingredient in a multi-item query is not found in deterministic anchors, safely falls back to Gemini AI multi-dish decomposition without dropping any items.
- **Resilient Barcode & Label Pipeline (Zero 422 Errors) (`app/api/diet/barcode/route.ts`, `components/diet/MealScannerModal.tsx`)**:
  - Eliminated all 422 rejection errors: guarantees a structured `{ success: true, item: { ... } }` payload with editable fallbacks.
  - Multi-stage resolution: OpenFoodFacts v2 & v0 lookup with fallback to Gemini AI product inference for unindexed Indian `890...` barcodes and food packaging wrappers.
  - Client-side `BarcodeDetector` integration to read barcode symbologies before upload.
  - High-contrast client canvas downsampling (`maxDim: 1400`, `quality: 0.9`).
- **Packaged Food Lookup & Stepper UI Polish (`components/diet/MealScannerModal.tsx`)**:
  - Relocated quantity stepper (`- 1 +`) to the top right corner of staple and lookup cards.
  - Added `w-full overflow-hidden` and sanitized button text (`Add to Fuel`), eliminating all horizontal scrolling on mobile viewports (`393x852`).
- **Unified Macro Donut Ring Colors (`components/diet/MacroDonutBreakdown.tsx`, `tests/diet/macroDonut.test.tsx`)**:
  - Standardized macro ring arc colors everywhere to match the Daily Nutrition Summary card 1:1:
    - Carbs: **Warm Amber** (`#F59E0B`)
    - Fat: **Terracotta Clay** (`#E05A47`)
    - Protein: **Matcha Sage** (`#2D6A4F`)
- **Apple Voice Memos 1:1 Live Waveform (`components/ui/AudioWaveformVisualizer.tsx`, `VoiceMealModal.tsx`)**:
  - Symmetrical dark card with animated vertical audio bars: Apple Red (`#FF3B30`) on the left, bright white (`#FFFFFF/90`) on the right, and electric blue playhead needle (`#0A84FF`) with top and bottom beads.
- **Test & Build Verification**:
  - Targeted tests in `tests/diet/nutrition-accuracy.test.ts` (18/18 passing), `tests/diet/barcode-route.test.ts` (3/3 passing), and `tests/diet/macroDonut.test.tsx` (4/4 passing).
  - Full Vitest suite: **50 passed (50 files), 588 passed | 26 skipped (614 total), 0 failing**.
  - Production build: `npm run build` exits with code `0` (all 33 static/dynamic routes compiled).

### ✅ Sprint 4.11: Deterministic 1D/2D Barcode Decoder, Fake Fallback Elimination & Robust Multi-Item/Typo Parsing
- **Elimination of Fake Fallback ("Scanned Packaged Product") (`app/api/diet/barcode/route.ts`)**:
  - Completely deleted all hardcoded fallback objects (`"Scanned Packaged Product"`, 160 kcal, 180 kcal, etc.).
  - Unrecognized barcodes return structured payload `{ success: true, item: null, barcode, unrecognized: true, message: ... }` with pre-filled search suggestions.
- **Client-Side Deterministic 1D/2D Barcode Decoder (`@zxing/library`, `components/diet/MealScannerModal.tsx`)**:
  - Installed and wired `@zxing/library` (`BrowserMultiFormatReader`) alongside native `window.BarcodeDetector`.
  - Directly decodes EAN-13, EAN-8, UPC-A, UPC-E, Code-128, and QR codes directly from image uploads on any browser (Chrome, Safari, iOS, Windows) without requiring browser experimental flags.
  - Multi-database cascade: OpenFoodFacts (Indian & Global catalogs) -> UPCitemdb trial API -> Gemini Vision packaging/label identification.
- **Robust Multi-Item & Typo Egg Parsing Engine (`lib/nutrition/foodAnchors.ts`, `lib/ai/nutrition/calculator.ts`, `app/api/estimate-meal/route.ts`)**:
  - Dedicated egg recognizer (`/\b(eggs?|anda|ande|boiled eggs?|whole eggs?|omelette|omlet|bhurji)\b/i` without "white") guarantees `"2 wgole eggs with 2 rotis"` resolves both items to **`352 kcal, 18.8g P, 42.8g C, 11.2g F`** (never 80 kcal).
  - Dedicated flatbread recognizer matches `"2 rotis"` to **`208 kcal, 6.2g P, 42g C, 1.6g F`** (never 80 kcal).
  - Eliminated partial-match poisoning on compound queries in `resolveFoodItem` and `calculateMealNutrition` (bypasses single-food resolvers when compound separators are detected, delegating unanchored compound dishes directly to Gemini AI multi-item decomposition).
  - Updated `roti_plain` in `INDIAN_FOOD_DATABASE` to 35g / 104 kcal standard.
- **Test & Build Verification**:
  - Updated `tests/diet/nutrition-accuracy.test.ts` (22/22 passing), `tests/diet/barcode-route.test.ts` (3/3 passing), and `tests/diet/nutrition-engine.test.ts` (26/26 passing).
  - Full Vitest suite: **50 passed (50 files), 592 passed | 26 skipped (618 total), 0 failing**.
  - Production build: `npm run build` exits with code `0` (all 33 static/dynamic routes compiled).

### ✅ Sprint 4.12: Streamlined Plate Photo AI Studio & Dated Clinical Nutrition Benchmark Suite (2026-10-28)
- **Removal of Barcode UI from Fuel Studio (`components/diet/DietPage.tsx`, `components/diet/MealScannerModal.tsx`)**:
  - Renamed launcher card from `"Scan Plate or Barcode"` to **`"Scan Your Meal Plate"`** with subtitle: *"Point at Dal Chawal, thalis, bowls, or home-cooked meals for instant macro breakdown."*
  - Cleaned launcher card buttons: removed dark `"Barcode"` button, keeping a sleek Terracotta **`Scan Plate`** action button.
  - Streamlined `MealScannerModal.tsx`: removed the 2-tab mode switcher (`Plate Photo AI` | `Barcode & Label`), opening directly into the zero-clutter Plate Photo AI viewfinder with subtitle *"Hold plate in clear daylight for component-by-component macro estimation."*
  - Preserved internal barcode engine and `@zxing/library` decoders in backend routes for future packaged scanner sprints.
- **Nutrition Accuracy & Food Anchor Expansion (`lib/nutrition/foodAnchors.ts`)**:
  - Expanded ground-truth food anchors with IFCT 2017 & USDA FoodData Central references:
    - Added `banana_fresh` (1 medium ~118g = 105 kcal, 1.3g P, 27.0g C, 0.4g F).
    - Added `rajma_curry` (1 bowl ~180g = 215 kcal, 9.1g P, 30.0g C, 6.0g F).
    - Added `poha_cooked` (1 bowl ~150g = 180 kcal, 3.5g P, 36.0g C, 2.5g F).
    - Added `aloo_paratha` (1 paratha ~100g = 210 kcal, 4.8g P, 32.0g C, 7.05g F; 2 parathas = 420 kcal, 9.6g P, 64.0g C, 14.1g F).
    - Added `brown_bread` (1 slice ~30g = 74 kcal, 3.0g P, 15.0g C, 0.9g F; 2 slices = 148 kcal, 6.0g P, 30.0g C, 1.8g F).
    - Added `paneer_curry` (100g portion = 265 kcal, 18.3g P, 3.4g C, 20.8g F).
  - Enhanced `parseQueryPortion`:
    - Conversational prefix stripping (`"I had"`, `"Post-workout:"`, etc.).
    - Zero-calorie vehicle suffix stripping (`"in water"`, `"with water"`).
    - Written number-word conversion (`"one"` through `"ten"` -> `1` through `10`).
    - Extended unit recognition for `tsp`, `tbsp`, `slice`, `scoop`, `bowl`, and `glass`.
  - Upgraded `resolveMultiItemFoodAnchors`:
    - Added parenthetical component breakdown parsing (e.g. `"Homestyle Dal Chawal (150g rice + 1 bowl dal) with 1 tsp ghee"` and `"Oatmeal bowl (50g oats, 200ml milk, 1 banana)"`).
  - Fixed identifier lookup in dedicated food recognizers (`rice_steamed`, `dal_yellow_tadka`, `egg_white_boiled`).
- **Clinical Nutrition Benchmark Suite & Dated Report (`tests/diet/nutrition-benchmark-report.test.ts`, `docs/NUTRITION_ACCURACY_BENCHMARK_2026-10-28.md`)**:
  - Implemented 24 comprehensive test cases across 3 active clinical pipelines:
    - **Category A (Manual Dish Log, 8 cases)**: 100.0% Kcal / 100.0% Protein Accuracy.
    - **Category B (Natural Voice Log, 8 cases)**: 100.0% Kcal / 99.9% Protein Accuracy.
    - **Category C (Plate Component & Modifier Engine, 8 cases)**: 99.9% Kcal / 100.0% Protein Accuracy.
    - **Overall System Accuracy**: **100.0%** (all 24 cases meeting or exceeding the 95.0% clinical benchmark threshold).
    - **Atwater Factor Checks**: 24/24 cases pass thermodynamic consistency ($4P + 4C + 9F = \text{kcal}$).
- **Test & Build Verification**:
  - `tests/diet/nutrition-benchmark-report.test.ts`: **25/25 passed**.
  - `tests/diet/nutrition-accuracy.test.ts`: **22/22 passed**.
  - Full Vitest suite: **51 passed (51 files), 617 passed | 26 skipped (643 total), 0 failing**.
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Production build: `npm run build` exits with code `0` (all 33 static/dynamic routes compiled).

### ✅ Sprint 5.0: 1:1 Apple Voice Memos Waveform, YouTube Floating Pill Dock, Global Shimmer Skeletons & Execution Studio Overhaul
- **Apple Voice Memos 1:1 Waveform & Recording (`AudioWaveformVisualizer.tsx`, `VoiceMealModal.tsx`, `VoiceLogModal.tsx`)**:
  - Rebuilt `AudioWaveformVisualizer` to match the Apple Voice Memos iOS aesthetic 1:1:
    - Symmetrical dark card (`bg-[#1C1C1E] rounded-[28px] border border-white/[0.08]`) with 37 responsive audio bars.
    - Vibrant Apple Red (`#FF3B30`) left of the needle for recorded audio, and pure crisp white (`bg-white/90`) right of the needle for incoming audio.
    - Iconic Electric Blue (`#0A84FF`) playhead needle with top and bottom circular anchor pins (`shadow-[0_0_12px_rgba(10,132,255,0.85)]`).
    - Multi-harmonic organic speech cadence & real-time Web Audio API frequency analysis (peaks between 25% and 94% height) ensuring the audio waveform is energetic, fluid, and never looks static or flat.
  - Unified voice recording experience in both `VoiceMealModal.tsx` and `VoiceLogModal.tsx` with clean monospace recording timer, pulsing red status dot, full-width Apple visualizer, and tactile Stop button.
  - Portaled both modals to `document.body` (`z-[9999]`) with body scroll locking.
- **1:1 YouTube-Style Floating Pill Navbar (`components/Navigation.tsx`)**:
  - Locked dock height to sleek 56px (`h-[56px]`) with responsive widths across phone, tablet, and desktop (`w-[calc(100vw-32px)] max-w-[380px] sm:max-w-[460px] md:max-w-[540px] lg:max-w-[620px]`).
  - Dark floating capsule: `rounded-full bg-[#141715]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.35)] px-2`.
  - Icon-only aesthetic with `sr-only` labels preserving 100% test and accessibility contracts.
  - Active tab rendered as soft translucent pill (`w-14 h-10 rounded-full bg-white/[0.15] text-white`).
  - Center `+` button contained completely within column 3 of the 56px capsule (`w-11 h-11 rounded-full bg-white/[0.12] hover:bg-white/[0.20]`).
- **Global YouTube-Style Shimmer Skeletons (`components/ui/PageSkeletons.tsx`, Next.js Route Loading Boundaries)**:
  - Created reusable warm stone shimmer skeletons (`TodayPageSkeleton`, `PlanPageSkeleton`, `TrainPageSkeleton`, `FuelPageSkeleton`) using SATAT stone tokens (`#E6E1D6`, `#FCFBF9`).
  - Wired into Next.js App Router loading boundaries:
    - `app/dashboard/loading.tsx`
    - `app/dashboard/tasks/loading.tsx`
    - `app/dashboard/workout/loading.tsx`
    - `app/dashboard/diet/loading.tsx`
  - Integrated into in-component loading states in `HomeView.tsx` and `TaskBoard.tsx`.
- **Complete `Plan` Execution Studio Overhaul (`components/tasks/TaskBoard.tsx`)**:
  - Top editorial header: `Instrument Serif` "Execution Studio", subtitle "Design your daily rhythm, rituals, and deep work.", and single primary Terracotta capsule `+ New Task`.
  - Workspaces horizontal pill strip with scrollbar suppression (`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`).
  - **Feature A: Daily Non-Negotiable Rituals Card**: 2×2 grid with daily check-in persistence in `localStorage` keyed by `selectedDate`, 4 default rituals (Deep Work 90m, 3g Creatine & Hydration, 10k Steps / Zone 2, Evening Plan & Wind-Down), and animated progress bar.
  - **Feature B: Built-in Live Deep Focus Timer**: 25m Pomodoro banner with active task title, countdown, Play/Pause, Reset, and Done triggers.
  - 7-day date strip + Schedule/History tabs without scrollbar.
  - Circadian energy badges (`High · Deep Focus`, `Medium · Execution`, `Low · Admin`), circular completion checkboxes, and `▶ Focus` buttons.
  - Editorial empty state with 1-tap template generators (`Deep Work Sprint (90m)`, `System Review`, `Admin Sweep`).
  - Portaled `AddTaskModal`, `EditTaskModal`, and `AddProjectModal` to `document.body` (`z-[9999]`) with body scroll locking.
- **Test & Build Verification**:
  - Full Vitest suite: **51 passed (51 files), 617 passed | 26 skipped (643 total), 0 failing**.
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).
  - Vercel build conflict audit: **0 merge conflict markers** across entire repository.

### ✅ Sprint 5.1: Strict 1:1 Stitch Execution Studio, SATAT Bottom Nav (#2D6A4F + #E05A47), & Quick Track Composer
- **Strict 1:1 Stitch Bottom Navbar (`components/Navigation.tsx` — `image_cc4fd8.jpg`)**:
  - Capsule geometry: `w-[calc(100vw-28px)] max-w-[390px] sm:max-w-[460px] md:max-w-[560px] lg:max-w-[640px] h-[62px] rounded-full bg-[#191D1A]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_14px_34px_rgba(0,0,0,0.32)] px-2.5 flex items-center`.
  - 5-Column even grid distribution across all devices.
  - Active Tab Highlight: Botanical Matcha Sage pill (`px-3.5 py-1.5 rounded-full bg-[#2D6A4F] text-white flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(45,106,79,0.4)]`).
  - Inactive Tab: `text-stone-400 hover:text-stone-200 flex flex-col items-center justify-center gap-0.5`.
  - Center `+` FAB: Terracotta Clay circular button contained inside capsule (`w-11 h-11 rounded-full bg-[#E05A47] hover:bg-[#C94A38] text-white shadow-[0_4px_14px_rgba(224,90,71,0.45)]`).
- **Quick Track Composer Modal Sheet (`components/navigation/TrackSheet.tsx` — `image_cc4f9d.jpg` top half)**:
  - Portaled to `document.body` (`z-[9999]`) with body scroll locking.
  - Eyebrow: `SATAT INSTANT CAPTURE` + `4 Quick Paths` badge.
  - Headline in Instrument Serif: `What are we logging right now?`.
  - 2×2 Photo-Backed Action Grid:
    1. **Scan Meal Plate** (`Instant AI Vision · Fuel` -> `/dashboard/diet?action=scan`).
    2. **Start Workout** (`Training Studio · Train` -> `/dashboard/workout`).
    3. **Deep Work Task** (`Execution Studio · Plan` -> `/dashboard/tasks?action=new`).
    4. **Water & Biometrics** (`74.1 kg · Daily Log` -> inline weight check-in).
- **Deterministic Task Photo Matcher (`resolveTaskThumbnail`)**:
  - Maps any task title/project keyword to high-res, aesthetic Unsplash editorial photography (Code/API, DSA/Study, Design/UI, Video/Script, Workout/Health, Architectural Desk).
- **Plan View 1: `Schedule` Mode Overhaul (`components/tasks/TaskBoard.tsx` — `image_cc501e.jpg`)**:
  - Header: `STUDIO V2.4` + green dot + `PLAN · CADENCE`, Instrument Serif `Execution Studio`, subtitle, and Terracotta `+ New Task` capsule.
  - Workspaces horizontal pill strip with native scrollbar suppression.
  - **Circadian Deep Work Hero Instrument Card**:
    - Desk photo background overlay with opacity-15 luminosity.
    - Duration selector capsule (`25m`, `50m`, `90m`).
    - Col 7: Active task title, subtitle with cognitive load, Terracotta Flow button (`Enter Flow State` / `Pause Flow`), and reset button.
    - Col 5: Circular SVG flow dial with dynamic progress arc (`stroke="#6EE7B7"`, 289 circumference), live countdown time, and `FLOW` sub-label.
  - **2×2 Photo-Backed Non-Negotiable Rituals Bento Grid (ZERO Emojis)**:
    - 4 default rituals with 44×44 rounded-xl lifestyle photography and green check circles:
      1. `90m Deep Work` (`COGNITIVE`)
      2. `3g Creatine & 3L Water` (`CELLULAR FUEL`)
      3. `8,000 Steps & Zone 2` (`MOVEMENT`)
      4. `Evening Journal & Plan` (`RESTORATION`)
    - Daily check-in persistence in `localStorage` keyed by `selectedDate`.
  - **Photo-Backed Scheduled Task Cards**:
    - Left 14×14 rounded-2xl photo thumbnail.
    - Middle: Circadian window eyebrow (`MORNING DEEP`, `AFTERNOON`, `EVENING RESTORATION`) + project name, bold single-line title, `High Impact` priority badge (`whitespace-nowrap`), and time slot label.
    - Right: Dark Focus pill (`▶ Focus`) to load task directly into flow dial, and green completion check circle.
- **Plan View 2: `History` Mode Overhaul ("Execution Archive" — `image_cc4fd8.jpg`)**:
  - Execution Velocity Hero card with 3-column metrics (`TASKS DONE`, `FOCUS TIME`, `RITUAL STREAK`) and Orbit telemetry insight.
  - Chronological date-grouped archive list with thumbnail + green checkmark badge, completion timestamp, workspace pill, priority pill, and `⏱ 25m Logged` badge.
  - Editorial footer quote: `“Consistency compounds quietly.”` + `DAILY RITUAL ARCHIVE`.
- **Plan View 3: Portaled Task Composer Modal (`image_cc4f9d.jpg` bottom half)**:
  - Portaled to `document.body` (`z-[9999]`) with body scroll locking.
  - Live auto-matched thumbnail preview with `✓ Matched` badge.
  - Workspace selector pills.
  - 3-column Circadian energy window selector cards (`Morning Deep`, `Afternoon`, `Evening`) with Lucide vector icons (`Sunrise`, `Sun`, `Moon`).
  - Assigned slot date picker & focus target stepper (`{blocks * 25} min`).
  - Full-width Terracotta submit button (`Schedule into Today's Rhythm →`).
- **Test & Build Verification**:
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Vitest suite: **51 passed (51 files), 617 passed | 26 skipped (643 total), 0 failing**.
  - Next.js production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).

### ✅ Sprint 5.2: Bottom Navbar Active Pill Geometry & Project-First Execution Hierarchy
- **Locked Active Navbar Pill Geometry (`components/Navigation.tsx`)**:
  - Replaced variable padding (`px-3.5`) with strict fixed capsule dimensions on all 4 navigation tabs (`Today`, `Plan`, `Train`, `Fuel`):
    `w-[64px] sm:w-[72px] h-[44px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none shrink-0`.
  - Active tab receives Matcha Sage pill highlight (`bg-[#2D6A4F] text-white shadow-[0_4px_12px_rgba(45,106,79,0.4)]`).
  - Active highlight maintains perfectly identical geometry across all tabs regardless of label word length.
- **Strict Project-First Task Hierarchy (`components/tasks/TaskBoard.tsx`)**:
  - **Zero Hardcoded Projects**: Completely eliminated all hardcoded strings (`"DailyOS"`, `"ContentStack"`, `"Interview Prep"`). Workspaces and tasks derive 100% from user's live Firestore state.
  - **Zero-Project Empty State**: When user has 0 workspaces, renders an inviting editorial card with Instrument Serif typography and Terracotta `+ Create First Project` action.
  - **Real-Time Project Pending Task Badges**: Workspace horizontal pill strip now computes live pending task counts per project (`${p.name} · ${count}`) directly from user tasks.
  - **Selected Project Scoping**:
    - Scopes `tasksForDate`, `completedForDate`, `overdueTasks`, and `historyGroups` strictly to `task.projectId === selectedProject`.
    - Hero Circadian Deep Work instrument card dynamically binds to the first pending task of `selectedProject` (or displays `"No pending tasks in {selectedProject.name}"`).
    - When selected project has 0 tasks for the date, shows `"No tasks in {selectedProject.name} for this date"` with 1-tap `+ Add Task to {selectedProject.name}` action.
    - `TaskComposerModal` domain pills populated strictly from real user projects, auto-assigning newly created tasks to `activeProjectId`.
  - **Preserved Test & Accessibility Invariants**:
    - Retained all `aria-label`, placeholder, and button contracts (`"New task"`, `"Add task"`, `"What needs to be done?"`, `"Schedule"`, `"History"`).
- **Test & Build Verification**:
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Vitest suite: **51 passed (51 files), 617 passed | 26 skipped (643 total), 0 failing**.
  - Next.js production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).

### ⏳ Sprint 5.3: Multi-Device Responsive & Final E2E QA
- **Tablet Optimization**: iPad 10th Gen (1024×768) 2-column bento grid verification.
- **Desktop Optimization**: Desktop (1440×900) 3-column layout verification.
- **End-to-End Testing**: Full automated test verification and Playwright regression sweep.

---

## 4. Current Quality & Build Metrics
- **TypeScript & Next.js Build**: `npm run build` exits with code `0` (all 33 static/dynamic routes compiled).
- **Vitest Suite**: `617 passed | 26 skipped` across all 51 test suites (0 failing).
- **Diet Tests**: `213/213 passed` across all 15 test suites in `tests/diet/*`.
- **Workout Tests**: `42/42 passed` across `tests/workouts/*`.
- **Onboarding Tests**: `78/78 passed` across `tests/onboarding/*`.
- **Landing Tests**: `3/3 passed` across `tests/landing/*`.

