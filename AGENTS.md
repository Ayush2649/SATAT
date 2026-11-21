# AGENTS.md — Mandatory AI Agent Operating Protocol

This file defines the strict, non-negotiable operating rules for **Antigravity** and any AI coding agents working within the **DailyOS / SATAT (सतत्)** codebase. Every agent turn and code modification MUST follow these laws.

---

## 1. Design System Law (Natural Athletic Editorial)
- **Palette Invariant**: Strictly use the tokens defined in `styles/satat.tokens.css` and the design guidelines in `DESIGN.md`.
  - Canvas: `--satat-bg: #F6F3EC` (Warm Sunlit Stone)
  - Cards: `--satat-surface: #FCFBF9` (Pure Cream Alabaster)
  - Accent / Anchors: `--satat-anchor-dark: #191D1A` (Deep Botanical Espresso), `--satat-terracotta: #E05A47` (Terracotta Clay), `--satat-matcha: #2D6A4F` (Matcha Sage)
- **Anti-Slop Directives**:
  - **Zero dark-purple cyberpunk neon gradients** or dark box wrappers around light content.
  - **Zero robotic or terminal jargon** in user-facing copy (e.g. use "A companion, not a dashboard", "Circadian flow", "Natural rhythm" rather than "Optimization engine", "Compute baseline").
  - Maintain the Sanskrit halant spelling: **सतत्** (always include the virama/halant `्` under the final `त`).

---

## 2. Test & Build Gate (Zero Regression Standard)
- Every code change must preserve 100% of existing backend routes, Firebase Firestore state structures, NextAuth Google session flows, and Vitest test contracts.
- **Verification Rule**: Before finishing ANY user request or sprint:
  1. Run `npx vitest run` (or targeted test files first, followed by full suite) to ensure **0 failing tests**.
  2. Run `npm run build` to ensure the Next.js production build exits with code `0` and compiles all static/dynamic routes.
- **Accessible Attributes**: Never delete or break `aria-label`, input `id`s, or placeholder contracts that unit and integration tests rely upon.

---

## 3. Image & Asset Optimization Law
- All external imagery (e.g. Unsplash lifestyle photography and dish photos) must use optimized query parameters:
  - `?auto=format&fit=crop&w=500&q=75` (or `w=400`/`w=600` depending on container scale).
  - Always specify `loading="lazy"` on lifestyle and background images to prevent layout shift and minimize initial page weight.
- Include proper fallback handling (e.g., solid background color containers like `bg-[#EFECE4]`) so that cards render gracefully even during slow network loads.

---

## 4. Status Tracking Law
- After completing ANY iteration, sprint, or user-prompted upgrade:
  - The agent **MUST automatically update `PROJECT_STATUS.md`** with:
    - Newly created or modified files.
    - Resolved UX or visual bugs.
    - Updated test metrics and build status.
    - Current progress against upcoming sprints.

---

## 5. Architectural Cleanliness & Syntax Safeguards
- Always verify the end of modified React files to prevent accidental duplicate closing braces (`}`) or truncated JSX tags.
- Respect Next.js App Router rules (`"use client"` directives where hooks or interactive state are present; server components for pure data-fetching where appropriate).
- Avoid unnecessary external dependencies; prioritize existing Tailwind utility classes and Lucide icons.

---

## 6. Main Synchronization & CI Gate
- Before development, inspect the working tree, fetch the current remote feature branch and `origin/main`, and integrate their latest changes into the working feature branch. Preserve uncommitted user work and any existing conflict-resolution commits. Never develop on a stale base or push directly to `main`.
- Before pushing, fetch again, ensure `origin/main` is an ancestor of the feature branch, and resolve any new conflicts by preserving the intended behavior from both branches. Do not blanket-select one side to hide conflicts. Check for leftover conflict markers.
- Run the actual CI gates on the synchronized result: `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build`. Also run a clean type check with `npx tsc --noEmit --incremental false` when compiler configuration or test TypeScript changes. A passing build or Vitest run does not substitute for the standalone type check.
- After pushing, inspect the GitHub Actions run for the exact new commit and address failures before reporting CI success. Report skipped tests, outstanding checks, or external blockers accurately. Recheck branch compatibility if `main` advances during verification.

## 7. Responsive UI Verification
- Treat every UI change as a change for phones, tablets and desktop. Verify narrow phone widths, common phone widths, tablet/desktop breakpoints and short landscape heights in both light and dark themes before completion.
- For chat or form changes, verify keyboard opening/closing, visible headers, composer placement, focus, draft/history preservation across resizing, and horizontal overflow. Prefer one shared responsive interaction surface over duplicated mobile/desktop forms.
- Use isolated sessions and clearly label simulated keyboard/device checks when physical hardware is unavailable. Do not claim a physical iPhone or other device was tested unless it actually was.

