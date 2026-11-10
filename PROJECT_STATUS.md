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

### ✅ Sprint 4.8.1: Workout Page Restoration & AddCardioModal Integration (`components/workout/WorkoutPage.tsx`)
- **Restored Complete `WorkoutPage` Export Default**:
  - Restored full, multi-tab workout tracking architecture (`log`, `templates`, `history`) with full exercise sets, reps, body weight tracking, and Orbit synchronization.
  - Fixed Next.js build failure in `app/dashboard/workout/page.tsx` (`Module '"@/components/workout/WorkoutPage"' has no exported member 'default'`).
- **Clean `AddCardioModal` Integration**:
  - Embedded `AddCardioModal`, `CARDIO_META`, and `calcCardioCals` cleanly as exported helpers above `export default function WorkoutPage()`.
  - Re-exported `CardioActivity` and `CardioLog` types for backwards-compatible consumers.
- **Preserved Batch 1 & 2 Fixes**:
  - Retained `bodyWeightEntriesRef` pattern and `isCancelled` unmount cleanup in `useEffect` (0 ESLint errors/warnings).
  - Maintained `handleSave` and `handleSaveCardioToday` Orbit context synchronization with `formatSessionForOrbit` without overwriting existing data.
- **Validation**:
  - `npm run typecheck` (`tsc --noEmit`): 0 errors.
  - `npm run lint` (`next lint`): 0 errors, 0 warnings in `WorkoutPage.tsx`.
  - `npm run build` (`next build`): successfully compiled all 32 static/dynamic routes.
  - `npx vitest run tests/workouts/orbit-workout-context.test.ts`: 7/7 tests passed.
  - `npx vitest run tests/workouts`: 42/42 tests passed across all 5 workout test suites.
  - `git diff --check`: 0 formatting or whitespace errors.

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
  - Vitest suite: **53 passed (53 files), 634 passed | 26 skipped (660 total), 0 failing**.
  - Next.js production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).

### ✅ Sprint 5.3.1: Emergency Git Recovery — Restored Training Studio & Unified QA Suite
- **Restored Training Studio (`components/workout/WorkoutPage.tsx`)**:
  - Restored 100% of the Natural Athletic Editorial "Training Studio" UI (warm stone canvas `#F6F3EC`, alabaster cards, circadian status, exercise sets/reps logger, cardio drawer, and volume tracking) that was accidentally overwritten by an outdated QA branch merge on `origin/main`.
  - Replaced raw `<img>` in `MealScannerModal.tsx` with compliant `<NextImage fill unoptimized />`.
- **Merged & Unified Full QA Test Coverage**:
  - Fully integrated all QA hardening and test suites from `origin/main` (`tests/api/health-api.test.ts`, `tests/orbit/cold-start-hydration.test.ts`, `tests/workouts/orbit-workout-context.test.ts`, and `tests/diet/meal-preview-image.test.ts`).
  - Updated `meal-preview-image.test.ts` to inspect both `DietPage.tsx` and `MealScannerModal.tsx` for memory hygiene and Next.js image compliance.
- **Test & Build Verification**:
  - `npx tsc --noEmit`: **0 errors**.
  - `npx vitest run`: **53 passed (53 files), 634 passed | 26 skipped (660 total), 0 failing**.
  - `npm run build`: exits with code **0** (all 33 static/dynamic routes compiled).

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

### ✅ Sprint 5.3: Uncongested Execution Header, Two-Level Architecture (Execution Studio vs Dedicated Project Drill-Down), Workspace Deletion, & Bottom Dock Gap Fix
- **Uncongested 3-Row Header (`components/tasks/TaskBoard.tsx`)**:
  - Eliminated header button crowding and premature text wrapping on mobile viewports.
  - Row 1: Full-width eyebrow (`STUDIO V2.4` + matcha dot + `PLAN · CADENCE`).
  - Row 2: Editorial title (`Execution Studio`) + Single Terracotta `+ New Task` button (`bg-[#E05A47]`).
  - Row 3: Full-width subtitle (`Design your daily rhythm, rituals, and deep work.`).
  - Relocated `+ New Project` button into the `PROJECT WORKSPACES` section header where it logically belongs.
- **Two-Level UX Architecture (`activeProjectId: string | null`)**:
  - **VIEW A: Main Execution Studio (`activeProjectId === null`)**:
    - Default landing view when opening `Plan`.
    - Hero Circadian Deep Work instrument card (flow timer dynamically bound to active/next task across the day).
    - Today's Main Tasks & Schedule Section (7-day calendar strip, Today's tasks with compact 48×48 thumbnails and maximum horizontal title room, Schedule/History tabs).
    - Dedicated Project Workspaces Bento Section with folder cards showing pending/completed task counters, direct deletion, and `Open →` drill-down.
    - 2×2 Non-Negotiable Daily Rituals Bento Grid placed cleanly below workspaces.
  - **VIEW B: Dedicated Project Workspace Drill-Down (`activeProjectId !== null`)**:
    - Focuses 100% on the selected workspace (global timer and daily rituals cleanly hidden).
    - Header with `← Back to Execution Studio`, project title, workspace deletion, and `+ New Task` scoped to project.
    - Unified Project Tasks List with both pending (`TO DO IN THIS PROJECT`) and completed (`COMPLETED IN THIS PROJECT`) tasks on one scrollable screen.
    - Direct task focus button (`▶ Focus`) which jumps to Main Execution Studio and starts flow timer on that task.
- **Workspace Deletion & Clean Architecture**:
  - Integrated `deleteProject` from `lib/firestore.ts` with user confirmation dialog, removing project document and cleanly unlinking associated tasks.
- **Eliminated Bottom Floating Dock Gap**:
  - Reduced outer wrapper padding from `pb-28` to `pb-4`, ensuring the last card sits cleanly 16px–20px above the floating bottom dock across all viewports.
- **Test & Build Verification**:
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Vitest suite: **51 passed (51 files), 617 passed | 26 skipped (643 total), 0 failing**.
  - Next.js production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).

---

## 3. Pending / Upcoming Sprints

### ✅ Sprint 5.4: Orbit AI Date-Window Unification & Removal of Rigid Weekly Template Hijacking
- **Date-Window Unification (`lib/orbit/temporalResolver.ts`)**:
  - Unified `"last week"`, `"this week"`, `"past week"`, `"previous week"`, and `"last 7 days"` so they consistently resolve to the rolling last 7 days (`today - 6 days` through `today`, e.g. Oct 25 – Oct 31) rather than an outdated calendar Monday–Sunday block.
- **Context Requirement & Domain Guard (`lib/orbit/contextRequirement.ts`)**:
  - Fixed `isExplicitOverallReview` so domain-targeted queries containing rating requests (e.g., `"rate me out of 10 on my workout structure"`) are not hijacked into 7-domain multi-system reviews when a specific category like `workouts` is explicitly detected.
- **Detailed Workout Session Context (`app/api/aria/route.ts`)**:
  - Implemented `formatDetailedWorkoutSessions` helper that prints all rolling workout sessions with exact dates, titles, duration, full exercise lists, sets, reps, load in kg, and cardio metrics directly into LLM prompt context.
- **Elimination of Rigid Weekly Review Hijacking (`app/api/aria/route.ts`)**:
  - Constrained the canned 6-part `### Weekly Review` template strictly to multi-domain broad requests (`!mode || mode === "all"` without a single target category).
  - Injected targeted workout evaluation directives (`[INSTRUCTIONS FOR WORKOUT & STRUCTURE EVALUATION]`) commanding Orbit to:
    1. Lead immediately with a bold numerical rating (`**X / 10**`) based on structured parameters.
    2. Analyze split balance, muscle group coverage, frequency, and progressive overload.
    3. Provide actionable next steps and recommendations without dumping unrequested nutrition or task bullet points.
- **Table Cell & Header Wrapping Fix (`components/ui/MarkdownText.tsx`)**:
  - Added `whitespace-nowrap` and compact `px-2.5 py-1.5 text-xs` padding to `<th>` and `<td>` elements in markdown tables to prevent header fragmentation (e.g. `"Durat / ion"`) on mobile screens.
- **Test & Build Verification**:
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Vitest suite: **53 passed (53 files), 636 passed | 26 skipped (662 total), 0 failing**.
  - Next.js production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).

---

## 3. Pending / Upcoming Sprints

### ✅ Sprint 5.5: Fix Groq 413 Request Too Large via Context Compaction, Strict Domain Pruning, & Automatic Model Fallback
- **Workouts Compaction (`app/api/aria/route.ts`)**:
  - Replaced multi-line indented exercise/sets dumps with single ultra-compact session lines:
    `2026-10-30 | Upper body (50m, ~350 kcal): Bench Press 3x10@60kg, Incline DB 3x10@20kg, Lat Pulldown 3x12@50kg`.
  - Stripped raw Firestore documents, `aiAnalysis`, internal IDs, image URLs, and duplicate entries.
- **Meals / Nutrition Compaction (`app/api/aria/route.ts`)**:
  - Created `formatDailyNutritionSummary` to summarize historical nutrition day-by-day:
    `2026-10-30: 1,850 kcal, 125g P, 190g C, 55g F [3 meals: Oats, Dal Chawal, Chicken]`.
  - Completely excluded raw item arrays and photo URLs.
- **Chat History Truncation & Duplicate JSON Elimination (`app/api/aria/route.ts`)**:
  - Truncates conversation history to at most the last 4 messages (`slice(-4)`), and truncates previous assistant replies longer than 500 characters to prevent conversation token snowballing.
  - Removed duplicate `{ role: "system", content: contextJson }` message from LLM prompt, instantly eliminating thousands of redundant JSON tokens.
- **Strict Domain Pruning (`lib/orbit/contextRequirement.ts` & `app/api/aria/route.ts`)**:
  - Single-domain queries (such as workouts/training) strictly prune domains to `["workouts", "profile", "goals"]`, completely bypassing unnecessary Firestore queries for meals, nutrition, or tasks.
  - Diet queries strictly prune domains to `["nutrition", "meals", "profile", "goals"]`.
- **Hard Token Budget Guard (`app/api/aria/route.ts`)**:
  - Enforces a strict ceiling of `14,000 characters` (~3,500 tokens) with an automatic 10,000-character context trim threshold, paired with `max_tokens: 1024`, guaranteeing total input + output tokens remain under 4,600 tokens (well below Groq's 8,000 TPM limit).
- **Automatic Fallback & Token Limit Recovery (`lib/ai/models.ts`, `lib/ai/groq.ts`, & `app/api/aria/route.ts`)**:
  - Extended `TEXT_FALLBACK` chain to include `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
  - Configured `classifyError` in `lib/ai/groq.ts` to classify HTTP 413 and "Request too large" with `retryAfterMs: 0` for immediate model fallback without sleeping.
  - Implemented automatic retry with ultra-trimmed context (`slice(-2)` history + compact 500-word prompt) on fallback models and Google Gemini (`@google/genai`).
- **Test & Build Verification**:
  - TypeScript compilation: `npx tsc --noEmit` exits with **0 errors**.
  - Vitest suite: **53 passed (53 files), 638 passed | 26 skipped (664 total), 0 failing**.
  - Next.js production build: `npm run build` exits with code **0** (all 33 static/dynamic routes compiled).

---

## 3. Pending / Upcoming Sprints

### ⏳ Sprint 5.6: Multi-Device Responsive & Final E2E QA
- **Tablet Optimization**: iPad 10th Gen (1024×768) 2-column bento grid verification.
- **Desktop Optimization**: Desktop (1440×900) 3-column layout verification.
- **End-to-End Testing**: Full automated test verification and Playwright regression sweep.

### ✅ Sprint 5.7: Port Mobile Companion Design into Production OrbitView (`components/orbit/OrbitView.tsx`)
- **Top Editorial Header & Context Filter Pills (`components/orbit/OrbitView.tsx`)**:
  - Editorial `Instrument Serif` headline: *"Orbit Intelligence"* with subtitle *"Unified biological & execution copilot."*
  - Sanskrit halant wordmark badge (`स`) and live `● AI Active` Botanical Sage pill (`#2D6A4F`) with animated pulse dot.
  - Interactive Horizontal Context Filter Bar: `● All Domains`, `Workout`, `Diet`, `Tasks`. Active pill styled in Deep Botanical Espresso (`#191D1A` text-white) with glowing Mint synapse dot (`#6EE7B7`), and inactive pills in Warm Stone (`#EFECE4`) with Lucide vector icons.
- **Conversational Feed & Message Bubbles**:
  - **User Message Bubble**: Right-aligned Pure Cream Alabaster (`bg-[#FCFBF9] text-[#1C1917] rounded-[20px] rounded-br-sm p-3.5 border border-[#1C1917]/[0.06] shadow-2xs text-sm`) with sent timestamp.
  - **Orbit AI Response Card**: Left-aligned Deep Botanical Espresso (`bg-[#191D1A] text-[#FCFBF9] rounded-[24px] rounded-tl-sm p-4 shadow-xl border border-white/[0.06]`):
    - Top header row with pulsing Matcha Sage badge `● ORBIT SYNAPSE ACTIVE` (`bg-[#2D6A4F]/40 border border-[#6EE7B7]/25 text-[#6EE7B7]`) and formatted timestamp.
    - Dark glass table formatting with `whitespace-nowrap` on `<th>` headers, tabular figures, and verified delivery footer.
    - Automatic bold score rating highlights (e.g. `7 / 10`) with Terracotta badge accents (`#E05A47`) via `components/ui/MarkdownText.tsx`.
- **Suggested Quick-Prompt Chips (Zero Emojis — Vector Icons Only)**:
  - Scrollable quick-action bar above the input dock using crisp Lucide vector icons (`TrendingUp`, `Utensils`, `Zap`, `CheckCircle2`):
    - *"Rate my weekly workout volume"*
    - *"Protein gap analysis for today"*
    - *"Recommend tomorrow's training split"*
    - *"Prioritize deep work tasks"*
  - Clicking any chip immediately triggers analysis without manual typing.
- **Floating Input Dock Above the Bottom Pill Navbar**:
  - Cream Alabaster capsule (`bg-[#FCFBF9] rounded-full pl-4 pr-2 py-2 border border-[#1C1917]/10 shadow-[0_8px_24px_rgba(25,29,26,0.08)]`) with `Sparkles` icon, standard `aria-label="Ask Orbit"`, and circular Terracotta send button (`#E05A47`, `w-9 h-9`, white `ArrowUp` icon).
  - Responsive safe-area bottom offset: `pb-[calc(56px+max(16px,env(safe-area-inset-bottom))+16px)] lg:pb-6` ensuring clean clearance above the floating pill navbar.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: 0 errors.
  - Full Vitest suite: 53 passed (53 files), 638 passed | 26 skipped (664 total), 0 failing.
  - Production Next.js build: `npm run build` exits with code 0 (all 33 routes compiled).

---

### ✅ Sprint 5.8: Fix All 6 Orbit UI & Context Retrieval Bugs
- **Markdown Table Clipping Fix (`MarkdownText.tsx` & `styles/app-shell.css`)**:
  - Wrapped every table in a scrollable touch container (`overflow-x-auto my-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] [-webkit-overflow-scrolling:touch]`).
  - Set `min-w-0` and `overflow-hidden` on AI cards to guarantee smooth horizontal touch scrolling without clipping right-hand columns (`DURATION`, `SETS/REPS`).
  - Kept `whitespace-nowrap` on headers and short numeric/date cells while allowing exercise/session names to wrap cleanly (`min-w-[110px] whitespace-normal break-words`).
- **Markdown Backslash Unescaping & High-Contrast Badges (`MarkdownText.tsx` & `styles/app-shell.css`)**:
  - Added regex unescaping (`text.replace(/\\([*_~`[\]()#+-])/g, "$1")`) so model backslashes like `\*Volume` render as clean markdown without raw slashes.
  - Styled numbered list badges as high-contrast Matcha Sage / Mint pills (`bg-[#2D6A4F]/45 border border-[#6EE7B7]/35 text-[#6EE7B7]`) for crisp legibility against dark Espresso cards.
- **Context Filter Bar & Bottom Prompt Chips Optimization (`OrbitView.tsx`)**:
  - Condensed top context filter pills (`All`, `Workout`, `Diet`, `Tasks`) with compact padding (`px-3 py-1.5 text-xs`) so all 4 fit inside 300px without right-edge cutoff on 393px screens.
  - Shortened prompt chip labels to punchy 2-word pills (`Rate weekly volume`, `Today's protein gap`, `Tomorrow's split`, `Prioritize tasks`) with horizontal scroll padding (`scroll-px-4 no-scrollbar`).
  - Shortened input placeholder to `"Ask Orbit about training, diet, or focus..."` to eliminate mobile text cutoff while keeping test contracts intact.
- **Diet & Tasks Data Retrieval Intelligence (`app/api/aria/route.ts`)**:
  - Ingests both Firestore Admin DB and client state (`taskContext`, `dietContext`) from request body.
  - Injects all incomplete tasks across all dates and projects with prioritized deep work coaching directives.
  - Injects daily macro/protein goals (e.g. 135g P, 2,000 kcal) and past-week favorite meals, instructing Orbit to calculate the exact remaining protein gap and provide a 3-meal action plan rather than refusing with "I don't see any meals logged".
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: 0 errors.
  - Full Vitest suite: 53 passed (53 files), 638 passed | 26 skipped (664 total), 0 failing.
  - Production Next.js build: `npm run build` exits with code 0 (all 33 routes compiled).

---

### ⏳ Sprint 5.9: Multi-Device Responsive & Final E2E QA
- **Tablet Optimization**: iPad 10th Gen (1024×768) 2-column bento grid verification.
- **Desktop Optimization**: Desktop (1440×900) 3-column layout verification.
- **Settings & Profile** (`app/dashboard/settings/page.tsx`):
  - Alabaster preference controls, notification settings, and biometric targets.

---

### ✅ Sprint 6.0: 1:1 Stitch Implementation of OrbitView with Dead-Center Radar Stage Alignment & Calm Celestial 3D Orbital Physics
- **Dead-Center <Orbit3DCore /> Alignment & Physics (`components/orbit/Orbit3DCore.tsx`)**:
  - **Shared Centered Stage (`w-[184px] h-[184px] relative mx-auto my-2 flex items-center justify-center`)**:
    - Concentric dashed SVG radar circles (`r="86"`, `r="64"`, `r="42"`, `stroke="rgba(255,255,255,0.08)"`, `strokeDasharray="3 3"`) and subtle crosshair lines are locked inside the exact same container as the 3D celestial sphere.
    - Pinned the central 3D planet core at `absolute inset-0 m-auto`, positioning it at the **exact geometric center (50%, 50%)** of the background radar circles.
  - **Locked 3D Tilt Planes & Elimination of Funky Wobble**:
    - Eliminated erratic multi-axis keyframe tumbling (`rotateX` + `rotateY` changing mid-animation).
    - Kept each orbital ring on a fixed, locked 3D tilt plane, rotating ONLY around its local Z axis (`rotateZ(0deg) -> rotateZ(360deg)`):
      - **Inner Ring (Terracotta `#E05A47`, `w-24 h-24`)**: Locked tilt `rotateX(66deg) rotateY(-18deg)`, smooth linear spin of **20s** (idle) / **6s** (thinking) with a 6px glowing Terracotta satellite node on its rim.
      - **Middle Ring (Mint Sage `#6EE7B7`, `w-32 h-32`)**: Locked tilt `rotateX(62deg) rotateY(28deg)`, smooth counter-spin of **28s** (idle) / **8s** (thinking) with a 5px Mint satellite node.
      - **Outer Equatorial Ring (Warm Stone `#D6CFC2`/40, `w-40 h-40`)**: Locked tilt `rotateX(72deg) rotateY(-6deg)`, ultra-calm spin of **36s** (idle) / **10s** (thinking).
      - **Center Planet Core (`w-11 h-11 rounded-full`)**: Smooth 3D shaded Matcha-Emerald sphere (`radial-gradient(circle at 35% 30%, #6EE7B7 0%, #2D6A4F 55%, #0F1713 95%)`) with a soft 6s breathing glow and botanical lotus core identity.
      - **Thinking State Acceleration**: Smoothly speeds up the 3 rings to 6s, 8s, and 10s without wobble and adds a pulsing emerald aura ring.
- **1:1 Stitch OrbitView Architecture (`components/orbit/OrbitView.tsx`)**:
  - **Top Context Bar**: `All Context` (active `#191D1A` pill), `Train`, `Fuel`, `Plan`, `Circadian` fitting cleanly without horizontal clipping.
  - **Dark Botanical Espresso Hero Stage (`bg-[#191D1A] rounded-[30px] p-5 shadow-xl border border-white/[0.08]`)**:
    - Top status pills: `STATE: SYNAPSE READY` (`#2D6A4F`/35) + `3 Domains Linked · 98% Sync`.
    - Center 184×184 stage with `<Orbit3DCore size="lg" state={orbitState} />` at the exact bullseye.
    - Instrument Serif headline: *"How can Orbit optimize your cadence today?"* + subhead *"Cross-synthesizing neuromuscular load, metabolic deficit, and circadian focus blocks."*
    - 3 stacked live biometric ticker pills: `● Train: {workoutSummaryText}` (5 Sessions · 235m), `● Fuel: 135g Target · {proteinDeltaText}` (-48g Gap), `● Plan: {pendingTasksCount} High-Load Slot`.
  - **"CADENCE SHIFT" Mint Insight Banner (`bg-[#D8F3DC]/75 border border-[#2D6A4F]/15 rounded-[22px] p-3.5`)**:
    - Matcha icon with `Zap`, `CADENCE SHIFT` badge, `Auto-applied` indicator, and dynamic neuromuscular fatigue insight text.
  - **"Cadence Actions" 2×2 Telemetry Bento Grid**:
    - Card 1 (`TRAINING LOAD` — `Weekly Training Audit`): Ascending SVG sparkline curve, title, subtitle, and full-width Terracotta button `Run Audit →`.
    - Card 2 (`FUEL DEFICIT` — `Protein Gap & Fuel`): Mini circular progress gauge + `{loggedP}g / 135g`, title, subtitle, and full-width Matcha button `Curate Meal →`.
    - Card 3 (`CIRCADIAN` — `Tomorrow's Split`): Semi-circle readiness arc + `88% HRV · High Readiness`, title, subtitle, and stone pill button `Preview Split →`.
    - Card 4 (`PLAN ENGINE` — `Deep Work Focus`): Vertical equalizer bars + `90m`, title, subtitle, and stone pill button `Rank Slot →`.
    - Clicking any card immediately dispatches its corresponding query into Orbit!
  - **"Circadian Rhythm Alignment" Card (`bg-[#FCFBF9] rounded-[24px] p-4 border border-[#1C1917]/[0.06]`)**:
    - `Dusk Transition` (`19:30 – 21:00` · *"Melatonin priming, blue-light attenuated"*)
    - `Deep Sleep Window` (`22:30 – 06:45` · *"Target: 2.1h Slow-Wave restoration"*)
  - **Seamless Multi-Mode View**: When messages exist, users can seamlessly toggle between the full Cadence Dashboard and the active Chat Stream with zero data loss.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **54 passed (54 files), 642 passed | 26 skipped (668 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.1: Global Orbit 3D Launcher, Orbit New Chat / Reset Action, & Zero Vertical Gap
- **Global 3D Orbit Launcher Across All Screens (`components/Navigation.tsx`)**:
  - **Floating Bottom-Right 3D Orbit Launcher FAB**: Added floating `Orbit AI` FAB positioned at `fixed right-4 bottom-[calc(62px+max(14px,env(safe-area-inset-bottom))+12px)] z-40` whenever `pathname !== "/dashboard/orbit"` with `<Orbit3DCore size="sm" state="idle" />`, `"Orbit AI"` typography, and pulsing `#6EE7B7` synapse dot.
  - **Top App Header Orbit Pill**: Rendered compact `Orbit` pill in the top header next to the notification bell and profile avatar with `<Orbit3DCore size="sm" state="idle" />` and link to `/dashboard/orbit`.
- **"New Chat / Reset" Button & Thread Clearing (`components/orbit/OrbitView.tsx`)**:
  - Added tactile `New Chat` / `Reset` pill button to the `"Orbit Intelligence"` title row with `<RotateCcw />`, `aria-label="Reset chat"`, and `handleResetChat` action.
  - Clicking `New Chat` clears `messages`, `error`, and `input`, purges `sessionStorage` and `localStorage`, resets `orbitState` to `"idle"`, and seamlessly restores the centered **3D Orbit Hero Stage**.
- **Elimination of Vertical Blank Gap Between AI Responses & Prompt Chips (`components/orbit/OrbitView.tsx`)**:
  - Applied `mt-auto` and `space-y-3` to conversational stream container so short conversations (1 user message + 1 AI card) hug the bottom dock tightly with zero empty void.
  - Set viewport bottom padding to `pb-2` and reduced composer dock top padding to `pt-1`, ensuring `"Delivered by Orbit · 100% verified data"` sits tightly 8px–12px above prompt chips.
  - Compacted context filter pills to `px-2.5 py-1 text-[11px] gap-1` so all 5 pills (`All Context`, `Train`, `Fuel`, `Plan`, `Circadian`) fit cleanly without right-edge cutoff.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **55 passed (55 files), 646 passed | 26 skipped (672 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.2: Redesign Global Orbit Launchers into Clean, Rounded-Square 3D Emblem Badges with Moving Orbital Rings and Hover Tooltips
- **Dedicated `<OrbitLauncherBadge />` Component (`components/orbit/OrbitLauncherBadge.tsx`)**:
  - Created a tactile rounded-square emblem container (`rounded-2xl` / `rounded-xl`, `bg-[#191D1A]`, `border border-white/[0.12]`, `shadow-md`, `hover:scale-105 active:scale-95`).
  - Available in two calibrated sizes:
    - `size="md"`: `w-11 h-11` (ideal for top app bar headers).
    - `size="lg"`: `w-12 h-12` (ideal for floating FABs).
  - **Zero Badge-Body Text Directives**: Completely eliminated text clutter (`"Orbit"`, `"AI"`) from within the badge body, leaving only the pure, mesmerizing 3D celestial orbital physics core (`<Orbit3DCore size="sm" state="idle" />`).
  - **Floating Hover Tooltips**: Added smooth, high-contrast dark tooltip (`role="tooltip"`, `bg-[#191D1A] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md border border-white/[0.12] shadow-md pointer-events-none`) with a subtle down/up arrow:
    - Directional positioning: `tooltipPosition="bottom"` (`top-full mt-2`) for top app header and `tooltipPosition="top"` (`bottom-full mb-2`) for floating bottom FAB.
- **Global Entry Point Updates (`components/Navigation.tsx`)**:
  - **Top App Header**: Replaced the pill button with `<OrbitLauncherBadge size="md" tooltipPosition="bottom" />` mounted beside the notification bell and profile avatar.
  - **Floating Bottom-Right Launcher (FAB)**: Replaced the wide pill with `<OrbitLauncherBadge size="lg" tooltipPosition="top" className="fixed right-4 bottom-[calc(62px+max(14px,env(safe-area-inset-bottom))+12px)] z-40" />` positioned cleanly above the bottom dock whenever `pathname !== "/dashboard/orbit"`.
- **Mini 3D Orbital Core Calibration (`components/orbit/Orbit3DCore.tsx`)**:
  - Calibrated `size="sm"` to `containerPx = 30` with `scaleRatio = 30 / 184` and `showRadar = false`, ensuring the 3D rotating planet and its three tilted orbital rings are perfectly framed inside 44px–48px badges with zero boundary clipping.
- **Comprehensive Vitest Suite Added (`tests/navigation/navigation-orbit-launcher.test.ts`)**:
  - 5 tests covering component exports, badge rounded-square geometry, absence of badge body text, presence of hover tooltip, and rendering of the 3D core rings.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **55 passed (55 files), 648 passed | 26 skipped (674 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.3: Mobile Viewport Optimization, Hero Stage Rescaling, Ultra-Crisp Orbit Core & Markdown Footnote / Table Wrapping
- **Ultra-Clear, High-Contrast Orbit 3D Core (`components/orbit/Orbit3DCore.tsx`)**:
  - **85% Container Emblem Framing**: Scaled `size="sm"` to `containerPx = 38` (`scaleRatio = 38 / 184`), making the emblem fill 86.4% (~85%) of the `w-11 h-11` badge container for maximum visibility on mobile screens.
  - **High-Luminance Orbital Rings**: Thickened ring borders to `1.8px` with vibrant high-contrast colors (`#FF6B57` bright Terracotta, `#6EE7B7` bright Mint Emerald, `#F5F2EB` warm Alabaster) that pop against `#191D1A`.
  - **Brighter Planet Shading & Glowing Orbiting Beads**: Shaded the small sphere with `radial-gradient(circle at 32% 28%, #A7F3D0 0%, #34D399 45%, #065F46 90%)`, added crisp specular white highlight dot, and enlarged satellite planet beads to `5.5px` with glowing `box-shadow: 0 0 8px currentColor`.
- **Hero Stage & Card Scaling (`components/orbit/OrbitView.tsx`)**:
  - Shrunk the Hero radar + 3D stage from `184px × 184px` down to **`132px × 132px`** (`<Orbit3DCore size={132} />`) and reduced card padding to `p-4` with rounded-[28px], ensuring the entire Hero card fits comfortably above the fold on mobile.
- **Clean Single Header Orbit Badge (`components/navigation/Navigation.tsx` & `OrbitLauncherBadge.tsx`)**:
  - Maintained the single prominent rounded-square `<OrbitLauncherBadge />` (`w-11 h-11 rounded-[14px] bg-[#191D1A] border border-[#6EE7B7]/30 shadow-[0_6px_18px_rgba(25,29,26,0.25)]`) in the top-right app header.
  - Removed duplicate floating bottom-right launcher to eliminate visual clutter and avoid covering task completion indicators like `"1 of 3 Done"` in Today's Rhythm.
  - Conditioned `app-mobile-header` on `pathname !== "/dashboard/orbit"` so OrbitView maintains complete, conflict-free layout control without double-header scrolling issues.
- **Mobile Viewport & Natural Scroll Flow (`components/orbit/OrbitView.tsx`)**:
  - **Eliminated Double-Scroll**: Configured main viewport with `overscroll-contain touch-pan-y` and safe-area top padding so only the main feed scrolls.
  - **Empty-State Quick Prompt Clean-up**: Hidden bottom horizontal prompt chips during empty state (`messages.length === 0`), saving **44px** of vertical screen space.
  - **Compact Sticky Header When Chatting**: When `messages.length > 0`, collapsed the subtitle and tightened header padding so **75%+ of the screen height** is dedicated to reading responses.
- **Context Filter Pills Optimization (`components/orbit/OrbitView.tsx`)**:
  - Focused on 4 core domains (`All Context`, `Train`, `Fuel`, `Plan`) fitting cleanly across all mobile widths (360px–430px) with zero horizontal clipping or cutoff.
- **Targeted Auto-Scroll to Top of Assistant Response (`components/orbit/OrbitView.tsx`)**:
  - Anchored auto-scroll so when the AI response arrives, the view smoothly scrolls to the **TOP of the new assistant message card** (`lastAssistantMessageRef`), completely eliminating the bottom yank.
- **Table Column Wrapping & Dangling Footnotes (`components/ui/MarkdownText.tsx`)**:
  - **2-Column Table Mobile Wrapping**: Added `table-fixed w-full` for 2-column tables with `w-[75px] whitespace-nowrap` for Day/Date column and `w-auto whitespace-normal break-words` for exercise descriptions.
  - **Dangling Single-Asterisk Footnotes**: Handled lines starting with `*` or `\*` lacking closing asterisks, rendering them cleanly as `text-[11px] italic text-stone-300` without raw markdown asterisks.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **55 passed (55 files), 650 passed | 26 skipped (676 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.4: Responsive Desktop (lg: 1024px+ / xl: 1280px+) & Tablet (md: 768px–1023px) YouTube-Style Architecture Across All 5 SATAT Screens
- **YouTube-Style Responsive App Shell (`components/Navigation.tsx` & `app/globals.css`)**:
  - **Collapsible Navigation Rail**: Implemented a responsive left sidebar (`hidden md:flex fixed left-0 top-0 bottom-0 z-40 bg-[#F6F3EC] border-r border-[#1C1917]/[0.08]`) with two states: `w-[76px]` (Tablet / collapsed) and `w-[240px]` (expanded Desktop).
  - **Brand Header & Dynamic Workspaces**: Features a top brand row with Menu hamburger toggle, `SATAT` serif wordmark, and `OS v2.4` status pill, plus a live `WORKSPACES` section rendering dynamic Firestore user projects (`getProjects(userId)`).
  - **Unified Sticky Top Command Bar**: Implemented `h-16 fixed top-0 right-0 z-30` header for Tablet/Desktop with breadcrumb trail, live synced mint badge, centered `⌘K` command/orbit search bar, context-aware primary Terracotta CTA pill (`+ Quick Track` / `+ New Task` / `+ Scan Meal` / `↻ New Chat`), `<OrbitLauncherBadge size="md" />`, bell, and avatar.
  - **Responsive Layout Tokens**: Added `@media (min-width: 768px)` and `@media (min-width: 1024px)` padding rules to `.app-shell-main` and `.app-shell-content`, with specialized zero-padding overrides for `.orbit-view-root`.

- **Screen 1: `Today` Responsive 12-Column Grid (`components/dashboard/HomeView.tsx`)**:
  - **Left 8 Columns**: Top Greeting + 7-Day Calendar row, 2-Column Hero Row (Dark `#191D1A` Training Split Card + Calorie Budget & Target Protein Synthesis Cards), Today's Rhythm with category filter pills (`All Timeline`, `Meals`, `Movement`, `Deep Work`) and photo-backed cards, plus `ProgressTrendChart` and `ConsistencyHeatmap`.
  - **Right 4 Columns (Sticky Top-20)**: Orbit Adaptive Whisper Card (editorial italic quote with "Open in Orbit AI →"), Daily Rituals 2×2 Photo-Backed Grid with live toggle state, and Circadian Telemetry Card (HRV Readiness, Restful Sleep, Peak Dopamine Window).

- **Screen 2: `Plan` Execution Studio 12-Column Grid (`components/tasks/TaskBoard.tsx`)**:
  - **Left 8 Columns**: Studio Header & Switcher Row (`STUDIO V2.4 · PLAN · CADENCE` + `● Focus Engine Primed`), 7-Day Week Strip & Project Filter Pills (with `+ New Project` having `whitespace-nowrap shrink-0` preventing clipping), Today's Execution Queue (with `onError` fallback on all task thumbnails), and 3-column Project Workspace Folder Cards Grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5`).
  - **Right 4 Columns (Sticky Top-20)**: Vertical Dark Espresso "Circadian Focus Engine" Timer Card (`bg-[#191D1A] rounded-[28px] p-5 text-white`) with 3 duration selector pills (`25m Sprint`, `50m Deep`, `90m Flow`), engaged task title, centered `160px × 160px` circular SVG progress ring, full-width `#E05A47` button (`▷ Enter Flow State`), Daily Rituals 2×2 Photo-Backed Overlay Grid with interactive checkboxes, and 3-Column Execution Metrics Mini-Card (`TASKS DONE` | `FOCUS TIME` | `STREAK`).

- **Screen 3: `Train` Training Studio 12-Column Grid (`components/workout/WorkoutPage.tsx`)**:
  - **Left 5 Columns**: Dark Espresso Assigned Split Hero Card (`bg-[#191D1A] rounded-[28px] p-5 text-white`) with top badges (`● ASSIGNED SPLIT · 5 DAYS/WK`, `Target Strain: 14.5`), wide `h-40` gym dumbbell photo banner with `UPPER HYPERTROPHY BIAS` badge, `primarySession.name` title, full-width `Load Compound Upper A →` `#E05A47` button, quick-switch template pills, 2-column Session Date & Duration row, and Weekly Muscle Recovery & Volume Telemetry Card (Chest 85%, Back 92%, Shoulders 78%, Posterior Chain 64% + Orbit readiness whisper).
  - **Right 7 Columns**: Strength Movements Header Row (`STRENGTH MOVEMENTS`, `+ Add Movement`, `Voice Log`), Tabular Exercise Set Cards with 6-column desktop set table (`SET` | `PREVIOUS` | `WEIGHT (KG)` | `REPS` | `RPE` | `STATUS`) + `Rest Timer: 90s`, and Full-Width Botanical Matcha Sage Save Banner (`bg-[#2D6A4F]` with `Complete & Save Training Session →` and `≈ 380 kcal · Strain 14.2` badge).

- **Screen 4: `Fuel` Nourishment Studio 12-Column Grid (`components/diet/DietPage.tsx`)**:
  - **Left 5 Columns**: Dark Espresso "Circadian Fuel Balance" Macro Card with centered `w-28 h-28` (`112px × 112px`) SVG progress ring (eliminating calorie number green stroke overlap bug), 3 horizontal macro progress bars (Protein `#E05A47`, Carbs `#6EE7B7`, Fats `#D6CFC2`), restorative biological ceiling callout, Orbit Vision Instant Meal Scanner Card, and Cellular Hydration & Creatine Card.
  - **Right 7 Columns**: Chronological Meal Log Header, photo-backed meal cards with `resolveDishThumbnail` and `onError` fallback, and Orbit Autonomous Recommendation ("Adaptive Protein-Gap Dinner") Card with options and 1-tap `+ Log This Recommended Dinner →` button.

- **Screen 5: `Orbit` AI Companion Studio Split Copilot (`components/orbit/OrbitView.tsx`)**:
  - **Left 5 Columns**: Persistent 3D Orbit Core & Biological Telemetry card (`STATE: SYNAPSE READY`, `3 Domains Linked · 98% Sync`, centered `148px × 148px` `<Orbit3DCore size={148} />`, editorial headline, 3 stacked live context pills), Cadence Shift mint insight banner, 2×2 Cadence Actions Bento Grid (`Weekly Training Audit`, `Protein Gap & Fuel`, `Tomorrow's Split`, `Deep Work Focus`), and Circadian Rhythm Alignment Card.
  - **Right 7 Columns**: Studio Top Header with title, context filter pills (`All Context`, `Train`, `Fuel`, `Plan`), and Reset/New Chat button, Conversational Stream (welcoming empty state or Alabaster user bubbles & Espresso Orbit cards with `MarkdownText`, `OrbitRecommendationCard`, and `OrbitInsightCard`), loading thinking state, error retry banner, and Studio Input Dock with Camera, Mic, Paperclip action buttons, auto-resizing textarea, and Terracotta send button.

- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **55 passed (55 files), 650 passed | 26 skipped (676 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.6: Fix All 7 Desktop Layout, Clipping, and Drawer Bugs Captured in Live Desktop Recording
- **Bug 1: Fixed Drawer Overflow & Orbit 12-Column Grid Splitting (`OrbitView.tsx` & `AriaChatbot.tsx`)**:
  - Top-right `<OrbitLauncherBadge />` and `AriaChatbot` trigger now navigate cleanly to `/dashboard/orbit` via Next.js `useRouter().push('/dashboard/orbit')` (or focus the chat prompt if already on the route).
  - Guarded `<OrbitView />` 12-column grid behind `{!isOverlay && ...}` and mobile single-column wrapper behind `!isOverlay && "lg:hidden"`, guaranteeing Orbit never splits into crushed columns inside slide-over drawers or overlay containers.
- **Bug 2: Fixed Sticky Top Command Bar Overlap Across All Studio Screens (`app/globals.css`)**:
  - Added responsive top clearance to `.app-shell-content`: `padding-top: calc(4rem + 2rem)` (`96px`) on `md:` and `lg:` viewports, providing 32px of clean breathing space below the 64px fixed command bar.
  - Added targeted `.app-shell-content:has(.orbit-view-root)` rule resetting `padding-top: 4rem` (64px) with zero inline/bottom padding for the full-bleed Orbit Copilot layout.
- **Bug 3: Fixed Left Sidebar Overlap on Full-Bleed Desktop Orbit (`Navigation.tsx` & `app/globals.css`)**:
  - Added CSS custom property `--sidebar-width: 0px` (mobile), `76px` (tablet / collapsed), and `240px` (expanded desktop).
  - Attached `padding-left: var(--sidebar-width)` to `.app-shell-main` with smooth `transition: padding-left 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.
  - Added `useEffect` in `components/Navigation.tsx` synchronizing `--sidebar-width` dynamically based on `collapsed` state and viewport resize events.
- **Bug 4: Upgraded Landing Page to Responsive Widescreen 12-Column Desktop Architecture (`components/landing/*`)**:
  - Expanded all landing section containers from `max-w-md` to `max-w-[1280px] w-full mx-auto`.
  - `LandingNav.tsx`: Full-width responsive navigation bar with links and Google sign-in triggers.
  - `Hero.tsx` & `HeroProductScene.tsx`: 12-column grid with left 6 columns for editorial typography & dual CTAs and right 6 columns for the physical athlete/oatmeal collage.
  - `ProblemSection.tsx`: Preserves mobile vertical sinusoidal timeline while presenting a 3-column horizontal bento grid (`lg:grid-cols-3`) on desktop.
  - `ProgressSection.tsx`: Desktop 12-column split (Left 5 cols for headline, copy, and comparative pills; Right 7 cols for the 28-day stone continuity matrix).
  - `OrbitSection.tsx`, `FinalCTA.tsx`, `Footer.tsx`: Converted to full-bleed responsive cards with desktop dual-column layouts and preserved `rounded-[32px]` styling.
- **Bug 5: Fixed Daily Non-Negotiable Ritual Cards Contrast & Truncation (`HomeView.tsx` & `TaskBoard.tsx`)**:
  - Replaced white text over white image cards with tactile Cream Alabaster cards (`bg-[#FCFBF9] p-3.5 rounded-[22px] border border-[#1C1917]/[0.08]`).
  - Rendered 44×44 photo thumbnail top-left, dark interactive checkmark button top-right, uppercase stone category tag, and non-truncating 2-line title (`line-clamp-2 text-[12px] font-semibold text-[#1C1917] leading-snug`).
- **Bug 6: Strict Dynamic User Workspaces (`Navigation.tsx` & `TaskBoard.tsx`)**:
  - Verified 100% absence of hardcoded fallback mock projects (`["DailyOS", "ContentStack", "Interview Prep"]`). Workspaces strictly load and render from dynamic Firestore user collections (`getProjects(userId)`).
- **Bug 7: Eliminated Fuel Telemetry and Meal Log Flash (`DietPage.tsx`)**:
  - Initialized `loading` to `true` by default and eliminated premature `setMeals([])` wipes during session checks.
  - Added warm stone shimmer pulse skeletons for macro telemetry and meal cards during data retrieval.
  - Guarded empty states strictly behind `!loading && meals.length === 0`.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **55 passed (55 files), 650 passed | 26 skipped (676 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.7: Revert Orbit Mobile Header Back to Pristine State & Enforce Absolute Mobile Layout Invariant
- **Reverted Orbit Mobile Header to Pristine State (`components/orbit/OrbitView.tsx`)**:
  - Removed unauthorized clutter (`AI ACTIVE` badge on right, `Cadence` and `Chat` view mode split pills) that crammed into the mobile top bar.
  - Re-anchored Top App Bar: Left features clean brand wordmark `SATAT / ORBIT` with Halant `स` badge and live pulsing Matcha Sage dot with dynamic status (`Rhythm Synced` / `Analyzing...` / `Responding...`); Right strictly houses Notification bell + User avatar (and close `X` when in overlay mode).
  - Cleaned Title & Reset Row: `"Orbit Intelligence"` in `Instrument Serif` + subtitle `"Unified biological & execution copilot."` on the left, and the clean `New Chat` (`↻`) button on the right.
  - Restored Clean Single-Row Context Filter: Horizontal scrollable pill row with `● All Context`, `Train`, `Fuel`, `Plan`, and `Circadian` (`FOCUS_MODES`).
- **Enforced Mobile Touch-Lock Architecture (`styles/app-shell.css` & `app/globals.css`)**:
  - Scoped `.app-shell-content:has(.orbit-view-root)` with default `padding-top: 0` on mobile, preventing desktop 64px top command bar clearances from shifting mobile screens down.
  - Applied `@media (min-width: 768px)` constraint for desktop `padding-top: 4rem` (64px) top clearance.
  - Added strict `@media (max-width: 767px)` touch-lock rules in `styles/app-shell.css` forcing `.orbit-view-root` full viewport bounds and hiding `.orbit-desktop-grid`.
- **Zero Regression Standard Verified**:
  - `npx tsc --noEmit`: **0 errors**.
  - Vitest suite: **55 passed (55 files), 650 passed | 26 skipped (676 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.8: Orbit Dual-Layer Schema, Input UI Outline, Ordinal Exercise Resolution & Targeted Network Sync
- **Standardized Dual-Layer API Response Schema (`app/api/aria/route.ts`)**:
  - Wired `executeMutation` from `lib/orbit/mutationEngine.ts` to deterministically execute state updates (`UPSERT_MEAL`, `MODIFY_MEAL`, `UPDATE_WORKOUT`, `MODIFY_PLAN`).
  - Standardized all API responses via `makeOrbitResponse` to return `{ message, reply, action_executed, suggested_actions, activeContext }`.
  - Added support for both `req.json().message` directly and `req.json().messages` array payloads.
- **Fixed Chat Bar Focus Outline Bug (`components/orbit/OrbitView.tsx`)**:
  - Removed browser default outline and harsh focus borders by applying `className="w-full flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ring-0 shadow-none ..."` on `<textarea>`.
  - Added clean subtle terracotta focus ring on parent pill dock: `focus-within:ring-2 focus-within:ring-[#e06d53]/20 focus-within:border-[#e06d53]/40` on both mobile floating dock and desktop studio input.
- **Ordinal & Fuzzy Workout Exercise Resolution (`lib/orbit/mutationEngine.ts`)**:
  - Enhanced `parseMutationIntent` to detect ordinal indicators (`"first"`/`"1st"` -> index 0, `"second"`/`"2nd"` -> index 1, `"third"`/`"3rd"` -> index 2, `"exercise #2"` -> index 1).
  - Enhanced `update_workout_session` to target exercises by ordinal index, exact name, substring, or token overlap (e.g. `"dumbbell press"` -> `"Incline Dumbbell Press"`).
  - Preserved existing workout set weights and units when user only updates reps (e.g. `"Change that second exercise to 12 reps"` maintains 24kg and updates reps to 12).
- **Targeted Network Sync & Contextual Suggestions (`components/orbit/OrbitView.tsx`)**:
  - Added `activeContext` state in `OrbitView` to retain conversational entities across turns without dropping active meal slots or exercise names.
  - Dispatched targeted `satat:data-refresh` custom event with `{ domain, type, details }` on successful mutations to avoid full-page reloads and prevent duplicate Firestore queries.
  - Rendered interactive contextual suggestion chips under assistant cards that trigger quick one-click prompts.
- **Comprehensive Verification & Regression Suite (`tests/orbit/continuity-mutations.test.ts`)**:
  - Expanded test coverage across 17 unit and integration tests including multi-turn diet upserts, workout set mutations, dual-layer schemas, ordinal resolution, error handling, and fast-path conversational contracts.
- **Zero Regression Standard Verified**:
  - `npm run typecheck`: **0 errors**.
  - `npm run lint`: **0 errors**.
  - Vitest suite: **56 passed (56 files), 667 passed | 26 skipped (693 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.9: Universal Orbit Entity Context, Mutation Engine & Suggestion Engine Across All Editable Domains
- **Universal Type Definitions (`types/orbit.ts`)**:
  - Expanded `OrbitEntityContext` to include full cross-domain entity state: `activeWorkoutName`, `activeExerciseIndex`, `activeTaskId`, `activeTaskTitle`, `activePlanId`, `activeHabitType`, `activeSprintId`, and `activeSprintDay`.
  - Standardized `OrbitActionType` across all 5 manually editable domains:
    1. **Workouts & Exercises**: `START_WORKOUT`, `UPDATE_WORKOUT`, `UPDATE_WORKOUT_SET`, `ADD_EXERCISE`, `DELETE_EXERCISE`, `COMPLETE_WORKOUT`.
    2. **Tasks & Schedules**: `CREATE_TASK`, `RESCHEDULE_TASK`, `COMPLETE_TASK`, `DELETE_TASK`, `MODIFY_PLAN`.
    3. **Meals & Macros**: `UPSERT_MEAL`, `MODIFY_MEAL`, `DELETE_MEAL`.
    4. **Daily Rituals & Habits**: `LOG_RITUAL` (hydration, steps, reflection, combined).
    5. **Sprints & Study Milestones**: `UPDATE_SPRINT_PROGRESS` (LeetCode, DSA problems, placement sprint tally).
  - Added `domain: "meals" | "workouts" | "tasks" | "rituals" | "sprints"` to `OrbitActionExecuted`.
  - Formalized `OrbitDualLayerResponse` contract for strict API response typing.
- **Deterministic Universal Mutation Engine (`lib/orbit/mutationEngine.ts`)**:
  - Implemented CRUD handlers for all 5 domains interacting with Firestore (`meals`, `workouts`, `tasks`, `habits`, `sprints`).
  - Added `parseTimeString` utility converting natural language times (`"5 PM"` -> `"17:00"`, `"6 PM"` -> `"18:00"`).
  - Enhanced `update_workout_session` to support multi-turn relative rep increments via `repDelta` (`"Add 2 more reps"`) preserving set weight and units, as well as `isAppendSet` (`"Add a 4th set"`).
  - Enhanced `reschedule_task_entry` and `complete_task_entry` to resolve target tasks by `activeTaskId`, `taskTitle`, or fuzzy matching user's pending tasks.
  - Implemented `log_ritual_entry` supporting hydration, step count compounding, evening reflection journaling, or combined hydration + steps in a single natural language command.
  - Implemented `update_sprint_entry` extracting problem titles and topics (`"Solved Group Anagrams and Valid Balloons on LeetCode using hash map"`).
  - Expanded `generateContextualSuggestions` to emit domain-specific predictive chips for all domains.
- **API Route Integration & Domain Safeguards (`app/api/aria/route.ts`)**:
  - Integrated universal mutation intent parsing and execution on incoming user messages.
  - Updated context requirements domain merging to include `"habits"` for rituals and `"tasks"` / `"habits"` for sprints.
  - Refined domain pruning rules with `hasRitualFocus` and `hasSprintFocus` to ensure necessary data is not dropped during category context retrieval.
  - Ensured dual-layer JSON responses attach `action_executed` with `domain` and contextual suggestions.
- **UI State Synchronization & Targeted Event Sync (`components/orbit/OrbitView.tsx`)**:
  - Updated `setActiveContext` to merge incoming `activeContext` updates dynamically from API responses.
  - Dispatched `satat:data-refresh` event using `data.action_executed.domain` for granular per-studio UI cache invalidation without page reloads.
- **Comprehensive Vitest Suite (`tests/orbit/continuity-mutations.test.ts`)**:
  - Expanded in-memory Firestore mocks to support `habits` and `sprints` collections alongside `meals`, `workouts`, and `tasks`.
  - Added multi-turn task scheduling & rescheduling tests (`"Add 25 min coding sprint at 5 PM"` -> `"Move that sprint to 6 PM"`).
  - Added 3-turn workout lifecycle and rep delta tests (`"Start Push Day"` -> `"Set first exercise to 10 reps at 20kg"` -> `"Add 2 more reps"`).
  - Added daily rituals test (`"Log 1000ml water and 8000 steps"`).
  - Added sprint progress tracking test (`"Solved Group Anagrams and Valid Balloons on LeetCode using hash map"`).
  - All 21 tests pass with 100% success rate.
- **Zero Regression Standard Verified**:
  - `npm run typecheck`: **0 errors**.
  - Vitest suite: **56 passed (56 files), 671 passed | 26 skipped (697 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.10: Fix Silent Save Failures in Train/Plan & Conversational Clarification Engine
- **Conversational Clarification Loop & Parameter Validation (`lib/orbit/mutationEngine.ts` & `types/orbit.ts`)**:
  - Expanded `OrbitEntityContext` with `awaitingParam` and `partialIntent` to retain multi-turn conversational intent when parameters are incomplete.
  - Defined `ClarificationResult` interface (`type: "CLARIFICATION_NEEDED"`, `domain`, `missingParam`, `clarificationMessage`, `suggestedActions`, `updatedContext`).
  - Added workout set validation: if user provides an exercise without sets or reps (e.g. `"Add dumbbell press to my workout"`), Orbit emits a targeted clarifying question without attempting a database write and returns `action_executed: null`.
  - Added plan task validation: if user requests to schedule a task or sprint without a time (e.g. `"Schedule a placement sprint"`), Orbit prompts for the scheduled time/duration and provides contextual quick-chips.
  - Handled slot-filling follow-ups: when user answers the prompt (e.g. `"10 reps at 24kg"` or `"Schedule for 5:00 PM"`), Orbit resolves the pending parameter, executes the mutation, writes to Firestore, and clears `awaitingParam`.
- **Zero Falsified Response Contract & Strict DB Error Guardrails (`app/api/aria/route.ts` & `lib/orbit/mutationEngine.ts`)**:
  - Guaranteed that Orbit never claims an item was saved until the database write succeeds.
  - In `app/api/aria/route.ts`, if `executeMutation` returns `status: "failed"`, the response immediately returns `message: "Unable to save your ${domain}: ${error}. Please try again."` with `status: "failed"` and retry action chips, preventing LLM from hallucinating success.
  - Converted `modify_plan_schedule` to use `set(updates, { merge: true })` ensuring upserts create missing plan documents rather than failing on absent documents.
- **Real-Time Studio Refresh Listeners (`WorkoutPage.tsx`, `TaskBoard.tsx`, `DietPage.tsx`)**:
  - Added `satat:data-refresh` event listeners across Training Studio, Execution Studio, and Fuel Studio so that UI views immediately reload and reflect Orbit mutations in real time without requiring browser refreshes.
- **Comprehensive Verification Suite (`tests/orbit/continuity-mutations.test.ts`)**:
  - Added 4 new integration test cases:
    1. Incomplete workout input triggers clarification prompt with set options and `action_executed: null`.
    2. Multi-turn follow-up resolves pending slot (`"10 reps at 24kg"`), creates workout session, and returns `status: "success"`.
    3. Incomplete plan scheduling triggers clarification prompt for time/duration with `action_executed: null`.
    4. Database write failure explicitly returns `"Unable to save"` and `status: "failed"`.
  - All 25 tests pass clean (100% pass rate).
- **Zero Regression Standard Verified**:
  - `npm run typecheck`: **0 errors**.
  - Vitest suite: **56 passed (56 files), 675 passed | 26 skipped (701 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.11: Multi-Intent Parsing, Timed Exercise Mutations, Task Persistence & Zero False-Positive Confirmations
- **Compound Sentence Clause Segmentation & Multi-Intent Batching (`lib/orbit/mutationEngine.ts` & `app/api/aria/route.ts`)**:
  - Implemented `splitCompoundPrompt` to segment multi-command prompts across punctuation (`;`, `\n`), transitions (`also`, `and also`, `additionally`), and conjunctions (`and`) preceding domain markers or actions, without splitting internal entity lists (such as `"tea and chapati"`).
  - Implemented `parseMutationIntents` returning an array of distinct domain mutations (`ParsedMutation | ClarificationResult`), while preserving `parseMutationIntent` as a single-operation backwards-compatible wrapper.
  - Updated `app/api/aria/route.ts` to execute all parsed operations sequentially in a transactional loop, accumulating updated active context (`activeMealSlot`, `activeExerciseName`, `activeTaskTitle`) across turns.
  - Standardized dual-layer response payload to return all executed operations via `action_executed` (single object or array) and `actions_executed`.
- **Timed & Isometric Exercise Mutations in Training Studio (`types/index.ts`, `types/orbit.ts`, `lib/orbit/mutationEngine.ts`)**:
  - Added `durationSeconds?: number` to `SetLog` and `WorkoutSetInput` schemas.
  - Added timed exercise parser recognizing isometric movements (e.g. `"Plank for 45 seconds"`, `"wall sit for 60s"`, `"dead hang for 30s"`) with automatic duration conversion.
  - Auto-initializes an active workout session in Firestore if none exists for today, logging `{ reps: 1, durationSeconds: 45, unit: "bodyweight", completed: true }`, resolving the empty state ("No Movements Loaded Yet") in Training Studio.
- **Task Schema Alignment with Execution Studio (`TaskBoard.tsx` & `mutationEngine.ts`)**:
  - Enhanced task parser to capture daily plan phrasing (e.g. `"add today's plan for high priority for sending acceptance mail"`), extracting clean imperative task titles (`"Send acceptance mail"`) and priorities (`"high"`).
  - Persists tasks with `dueDate: todayStr` (`YYYY-MM-DD`), `priority: "high"`, and `status: "pending"`, aligning with Execution Studio's `TaskBoard.tsx` date filtering and eliminating "No tasks scheduled for this date".
- **Elimination of False-Positive Confirmations & Strict Database Grounding**:
  - Injected exact database-verified execution results into the system prompt with a critical truthfulness directive, guaranteeing Orbit only acknowledges items successfully written to Firestore.
- **Comprehensive Verification Suite (`tests/orbit/continuity-mutations.test.ts`)**:
  - Added 3 new integration tests (suite expanded from 25 to 28 passing tests):
    1. Compound multi-intent batching: 4 distinct operations (breakfast, lunch, plank 45s, high-priority task) executed and verified across `mockMealStore`, `mockWorkoutStore`, and `mockTaskStore`.
    2. Timed isometric exercise mutation: Plank (45s) auto-creates session with `durationSeconds: 45`.
    3. Task creation schema alignment: `priority: "high"`, `dueDate: todayStr`, `status: "pending"` matching TaskBoard filters.
  - 100% test pass rate across all 28 tests in `tests/orbit/continuity-mutations.test.ts`.
- **Zero Regression Standard Verified**:
  - `npm run typecheck`: **0 errors**.
  - Vitest suite: **56 passed (56 files), 678 passed | 26 skipped (704 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.12: Workout & Training Studio Auto-Session Creation, Schema Alignment & Movement Persistence
- **Dual Schema Alignment (`movements` & `exercises`) in Firestore (`lib/orbit/mutationEngine.ts`, `types/index.ts`)**:
  - Expanded `WorkoutSession` and `ExerciseLog` type definitions to support `movements?: any[]`, `status?: "in-progress" | "completed"`, `duration?: number`, `title?: string`, `type?: "strength" | "isometric"`, and `durationUnit?: string`.
  - In `add_exercise_to_workout` and `update_workout_session`, ensured both `movements` and `exercises` are always populated in sync:
    - Isometric/timed movements: `type: "isometric"`, `duration: dur`, `durationUnit: "seconds"`, `sets: [{ setNumber: 1, reps: 1, duration: dur, durationSeconds: dur, weight: 0, completed: true }]`, `completed: true`.
    - Standard strength movements: `type: "strength"`, `sets: sets.map((s, idx) => ({ setNumber: idx + 1, reps: s.reps, weight: s.weight, unit: s.unit || "kg", completed: s.completed ?? true }))`.
  - When no session exists for today, automatically creates a workout session document with:
    `{ userId, date: todayStr, title: "Daily Workout", name: "Daily Workout", routineTitle: "Daily Workout", status: "in-progress", duration: 45, durationMinutes: 45, movements: [movement], exercises: [newExercise], createdAt: Date.now(), updatedAt: new Date().toISOString() }`.
  - When a session exists, updates both `movements` and `exercises` with `{ merge: true }` preserving existing sets and movements.
- **Training Studio Active Logger State Sync (`components/workout/WorkoutPage.tsx`)**:
  - Implemented `normalizeSessionExercises` helper ensuring seamless conversion from either `exercises` or `movements` array into component `ExerciseLog[]` state.
  - In initial mount `useEffect` and `satat:data-refresh` listener, when a workout session for today exists and is in-progress (or has movements while not completed), automatically populates `exercises` state, sets `isEditingSession: true`, and updates session title/duration.
  - Eliminated the empty state bug ("No Movements Loaded Yet") when logging exercises via Orbit.
  - In VIEW 1B (Completed Session state), guarded with `todaySession.status !== "in-progress" && !isEditingSession` and added fallback to `todaySession.movements` if `todaySession.exercises` is empty, preventing runtime crashes or blank completed cards.
- **Mock Firestore & Integration Test Expansion (`tests/orbit/continuity-mutations.test.ts`)**:
  - Enhanced mock collection's `doc(id)` implementation to support `set: vi.fn(async (data, options) => { ... merge ... })` and `delete: vi.fn()`.
  - Added test `it("auto-creates workout session and appends timed movement (Plank 45s) when no active session exists")` verifying `status: "in-progress"`, `title: "Daily Workout"`, `duration: 45`, `movements` isometric schema, and `exercises` duration schema.
  - Added test `it("updates existing workout movements when session already exists")` verifying both existing movements (Bench Press) and new movements (Plank 45s) persist correctly in both `movements` and `exercises`.

---

### ✅ Sprint 6.13: Cardio & Calisthenics Movement Parsing, Anti-Hallucination Guard & Meal Slot Sanitization
- **Compound Prompt Boundary Expansion & Dedicated Parsers (`lib/orbit/mutationEngine.ts`)**:
  - Extended `splitCompoundPrompt` boundary regex with lookahead for cardio and calisthenics movement verbs (`running|run\b|jogging|cycling|bike|skipping|pull\s*ups?|push\s*ups?|dips?`), ensuring compound workout requests like `"add running 2.5 km and skipping 30 reps 3 sets in training"` are cleanly split into individual movement actions.
  - Added dedicated `isCardioMovement` parser recognizing running, jogging, cycling, treadmill, swimming, rowing, walking with distance (`2.5 km`, `miles`) and duration (`30 mins`), returning `type: "ADD_EXERCISE"`, `movementType: "cardio"`.
  - Added dedicated `isCalisthenicsMovement` parser recognizing bodyweight exercises (skipping, pull ups, push ups, dips, crunches, burpees) with reps-and-sets extraction (`"30 reps 3 sets"` or `"3 sets of 30 reps"`), returning `type: "ADD_EXERCISE"`, `movementType: "calisthenics"`, `unit: "bodyweight"`, `weight: 0`.
  - Removed all Bench Press / 60kg defaults when unknown movements are entered, preventing Orbit from hallucinating unrequested exercises.
- **Cardio & Bodyweight Movement Persistence (`lib/orbit/mutationEngine.ts`, `types/index.ts`)**:
  - Updated `add_exercise_to_workout` to handle `movementType: "cardio"` and `movementType: "calisthenics"`.
  - For cardio movements, stores `type: "cardio"`, `distance`, `distanceUnit`, and auto-creates/appends to `cardioLogs` in the workout document.
  - For calisthenics movements, stores `type: "calisthenics"`, sets with `unit: "bodyweight"` and `weight: 0`.
  - Automatically initializes or updates today's session in Firestore (`status: "in-progress"`), ensuring Training Studio immediately loads both movements and dismisses "No Movements Loaded Yet".
- **Training Studio UI Rendering of Distance & Bodyweight (`components/workout/WorkoutPage.tsx`)**:
  - Enhanced `normalizeSessionExercises` to preserve `distance`, `distanceUnit`, and `type: "cardio"` / `"calisthenics"`.
  - In exercise set rows: for cardio, displays distance (`2.5 km`) instead of weight input; for calisthenics, displays `BW` placeholder and disables weight input.
  - In completed workout cards: renders `${set.distance} ${set.distanceUnit}` for cardio and `BW × ${set.reps}` for calisthenics.
- **Meal Slot Badge Fix & Item Sanitization (`lib/diet/dishMatcher.ts`, `components/diet/DietPage.tsx`, `lib/orbit/mutationEngine.ts`)**:
  - Updated `formatMealTimeAndCategory(createdAt, mealType, mealName)` to accept explicit `mealType` and `mealName`, strictly respecting the target slot badge (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`) over the current system clock (resolving the 8:17 PM evening clock override).
  - Sanitized food item parsing in `parseSingleMutationIntent`: stripped conversational prefix words (`"in breakfast"`, `"in lunch"`, `"today's meal"`, `"add"`, `"also"`), ensuring dishes are stored cleanly (e.g. `["tea", "chapati"]` -> `"Breakfast: tea, chapati"`).
  - In `DietPage.tsx`, stripped redundant leading slot prefix when displaying dish titles on cards (`meal.name.replace(/^(breakfast|lunch|dinner|snack):\s* /i, "")`).
- **Response Guard Directive (`app/api/aria/route.ts`)**:
  - Injected strict instruction in system prompt: `CRITICAL INSTRUCTION: You MUST strictly echo and acknowledge ONLY the actions and movements listed above (${executedNote}). NEVER mention, claim, or hallucinate an unrequested exercise (such as Bench Press) that was not executed in this turn!`.
- **Comprehensive Verification Suite (`tests/orbit/continuity-mutations.test.ts`)**:
  - Added 2 new integration tests (suite expanded from 29 to 31 passing tests):
    1. `correctly parses cardio (running 2.5km) and calisthenics (skipping 30 reps 3 sets) without hallucinating bench press`: verifies both movements are persisted to Firestore with proper distance/sets, and Bench Press is nowhere in the store or response.
    2. `sanitizes food item names, stripping conversational phrases and respecting explicit meal slot`: verifies clean dish titles without `"in breakfast"`/`"in lunch"` and validates that `formatMealTimeAndCategory` returns `"BREAKFAST"` and `"LUNCH"` even at 8:17 PM.
- **Zero Regression Standard Verified**:
  - `npm run typecheck`: **0 errors**.
  - Vitest suite: **56 passed (56 files), 681 passed | 26 skipped (707 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

### ✅ Sprint 6.14: Orbit Chat Auto-Scroll & Nutrition/Fuel Logging Restoration
- **Dedicated Responsive Auto-Scroll in Orbit Chat (`components/orbit/OrbitView.tsx`, `components/ui/AriaChatbot.tsx`)**:
  - Eliminated duplicate `messagesEndRef` ref shadowing across mobile and 12-column desktop viewports by adding separate `mobileScrollContainerRef` / `mobileMessagesEndRef` and `desktopScrollContainerRef` / `desktopMessagesEndRef`.
  - Implemented `scrollToBottom(behavior)` targeting the scrollable chat containers (with smooth fallback) and scrolling via `"auto"` on initial `sessionStorage` restore or overlay open (`isOpen` prop passed from `AriaChatbot.tsx`) and `"smooth"` on subsequent messages/loading updates.
- **Multi-Intent UI Refresh & Client Date Synchronization (`components/orbit/OrbitView.tsx`, `app/api/aria/route.ts`, `lib/orbit/mutationEngine.ts`)**:
  - Added `dispatchMutationRefreshEvents(data)` iterating over both `data.actions_executed` and array/single `data.action_executed` payloads so Nourishment Studio (`DietPage.tsx`), Training Studio (`WorkoutPage.tsx`), and Execution Studio (`TaskBoard.tsx`) receive `satat:data-refresh` events reliably for compound multi-intent turns.
  - Propagated browser local `clientDate` (`todayString()`) from `OrbitView` through `/api/aria` into `parseMutationIntents` and `executeMutation` across all domains (preventing UTC/local midnight date drift between `/api/aria` writes and `DietPage.tsx` `getMeals(userId, date)` queries).
  - Updated `executeMutation` to clear stale `awaitingParam` state after mutation execution and updated `/api/aria` to scan only user turns (`messages[i].role === "user"`) during fallback entity recovery and check `executedActions` across all multi-intent domains during focus pruning.
- **Nutrition Parsing, Anti-Ghosting & Indian Staple Macros (`lib/orbit/mutationEngine.ts`)**:
  - Stripped standalone/leading generic meal preambles (e.g., `"log today's meal, in breakfast..."`) in `splitCompoundPrompt` and removed the phantom `"Custom Meal"` fallback so empty meal phrases or questions (e.g., `"What did I eat for lunch?"`) no longer write phantom records to Firestore.
  - Added shorthand multi-slot boundary/prefix support (`"breakfast: tea and chapati, lunch: dal and rice"`), expanded `FOOD_KEYWORD_REGEX`, added cross-domain guards in `isCreateTask`, `isRescheduleTask`, `isHydration`, `isWorkoutMutation`, and `awaitingParam === "time"` follow-up resolution (`"add 2 bananas at 4 PM"` logs a meal rather than a task), and added macro heuristics for common staples (`tea/chai`, `curd/yoghurt`, `potato/sabzi`, `banana`, `poha`, `idli/dosa`, `whey/protein shake`, `oats`, `milk/lassi`, `toast/bread`).
- **Verification Expansion (`tests/orbit/continuity-mutations.test.ts`, `tests/orbit/orbit-retry.test.ts`)**:
  - Expanded `tests/orbit/continuity-mutations.test.ts` to 36 tests (testing generic preamble stripping without `"Custom Meal"`, shorthand multi-slot parsing, timed food-vs-task disambiguation, question non-mutation guards, and `clientDate` propagation) and `tests/orbit/orbit-retry.test.ts` to 7 tests (auto-scroll refs, overlay reopen, multi-intent refresh dispatch, `clientDate`).
- **Zero Regression Standard Verified**:
  - `npm run typecheck`: **0 errors**.
  - `npm run lint`: **0 errors**.
  - Vitest suite: **56 passed (56 files), 688 passed | 26 skipped in `tests/security/firestore-rules.test.ts` without Firestore emulator (714 total), 0 failing**.
  - Production Next.js build: `npm run build` exits with code **0** (all 33 routes compiled).

---

## 4. Current Quality & Build Metrics
- **TypeScript & Next.js Build**: `npm run build` exits with code `0` (all 33 static/dynamic routes compiled).
- **ESLint & Typecheck**: `npm run typecheck` and `npm run lint` exit with code `0`.
- **Vitest Suite**: `688 passed | 26 skipped` (Firestore security rules suite skipped without emulator on `127.0.0.1:8088`) across `56` test suites (`0` failing), including `36/36 passed` in `tests/orbit/continuity-mutations.test.ts` and `7/7 passed` in `tests/orbit/orbit-retry.test.ts`.
- **Markdown & UI Tests**: `13/13 passed` in `tests/ui/markdown-text.test.tsx`.
- **Navigation & Launcher Tests**: `5/5 passed` in `tests/navigation/navigation-orbit-launcher.test.ts`.
- **Diet Tests**: `213/213 passed` across all 15 test suites in `tests/diet/*`.
- **Workout Tests**: `42/42 passed` across `tests/workouts/*`.
- **Onboarding Tests**: `78/78 passed` across `tests/onboarding/*`.
- **Landing Tests**: `3/3 passed` across `tests/landing/*`.
