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

