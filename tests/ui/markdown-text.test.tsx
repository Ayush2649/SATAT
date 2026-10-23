import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownText } from "@/components/ui/MarkdownText";

describe("MarkdownText Component — Rendering & Formatting", () => {
  it("renders level 3 and level 4 headings without raw hash syntax", () => {
    const markdown = [
      "### Weekly Review",
      "#### Overall Assessment",
      "#### Key Metrics",
      "#### What Went Well",
      "#### What Needs Improvement",
      "#### Your Score",
      "#### Priorities for Next Week",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    // Must NOT contain raw markdown hash syntax
    expect(html).not.toContain("###");
    expect(html).not.toContain("####");

    // Must contain proper heading texts
    expect(html).toContain("Weekly Review");
    expect(html).toContain("Overall Assessment");
    expect(html).toContain("Key Metrics");
    expect(html).toContain("What Went Well");
    expect(html).toContain("What Needs Improvement");
    expect(html).toContain("Your Score");
    expect(html).toContain("Priorities for Next Week");

    // Level 3 should have uppercase brand styling
    expect(html).toContain("uppercase tracking-wider");
    expect(html).toContain("font-display");
  });

  it("renders inline bold, italic, bold+italic, code, strikethrough, and links correctly", () => {
    const markdown = [
      "Here is **bold text** and __alternative bold__.",
      "Here is *italic text* and _alternative italic_.",
      "Here is ***bold and italic*** and ~~strikethrough~~.",
      "Here is `inline code block` and a [SATAT Link](https://satat.app).",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    // Bold tags
    expect(html).toContain("<strong");
    expect(html).toContain("bold text");
    expect(html).toContain("alternative bold");
    expect(html).not.toContain("**bold text**");
    expect(html).not.toContain("__alternative bold__");

    // Italic tags
    expect(html).toContain("<em");
    expect(html).toContain("italic text");
    expect(html).toContain("alternative italic");

    // Strikethrough
    expect(html).toContain("line-through");
    expect(html).toContain("strikethrough");

    // Code
    expect(html).toContain("<code");
    expect(html).toContain("inline code block");
    expect(html).not.toContain("`inline code block`");

    // Links
    expect(html).toContain('href="https://satat.app"');
    expect(html).toContain("SATAT Link");
  });

  it("handles standalone bold headers like **Period:** cleanly", () => {
    const markdown = "**Period:** Oct 16 – Oct 23, 2026";
    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    expect(html).toContain("<strong");
    expect(html).toContain("Period:");
    expect(html).not.toContain("**Period:**");
    expect(html).toContain("Oct 16 – Oct 23, 2026");
  });

  it("renders bullet lists with custom aligned dots and supports nesting", () => {
    const markdown = [
      "- **Workouts**: 4 sessions completed",
      "- **Nutrition**: 2,400 kcal daily average",
      "  - High protein intake on training days",
      "  - Missed water tracking on Wednesday",
      "* Another bullet point format",
      "+ Plus bullet point format",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    // No raw bullet characters at beginning of items
    expect(html).not.toContain("&gt;");
    expect(html).toContain("Workouts");
    expect(html).toContain("4 sessions completed");
    expect(html).toContain("Nutrition");
    expect(html).toContain("High protein intake");

    // Check nested indentation padding
    expect(html).toContain("padding-left:14px");

    // Bold inline labels rendered inside <strong>
    expect(html).toContain("<strong");
  });

  it("renders ordered numbered lists with styled numeric badges", () => {
    const markdown = [
      "1. Prioritize adequate post-workout protein intake",
      "2. Schedule 4 strength sessions this week",
      "3. Complete 3 overdue focus tasks by Friday",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
    expect(html).toContain(">3<");
    expect(html).toContain("Prioritize adequate post-workout protein intake");
    expect(html).toContain("Schedule 4 strength sessions this week");
    expect(html).toContain("Complete 3 overdue focus tasks by Friday");
  });

  it("renders interactive checklists with check and square icons", () => {
    const markdown = [
      "- [x] Morning mobility warmup",
      "- [ ] 45-minute upper body workout",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    expect(html).toContain("line-through");
    expect(html).toContain("Morning mobility warmup");
    expect(html).toContain("45-minute upper body workout");
  });

  it("renders responsive meal-analysis tables with horizontal scroll wrapper and wrapped meal column", () => {
    const tableMarkdown = [
      "| Date | Meal | Calories | Protein (g) | Carbs (g) |",
      "|:---|:---|---:|---:|---:|",
      "| 2026-10-22 | Grilled tandoori chicken with brown basmati rice and salad | 840 | 45 | 90 |",
      "| 2026-10-21 | Rolled oats with whey protein isolate and chia seeds | 420 | 34 | 52 |",
      "| 2026-10-20 | Paneer bhurji with two whole wheat rotis | 560 | 28 | 48 |",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: tableMarkdown }));

    // Renders proper table elements
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain("<th");
    expect(html).toContain("<td");

    // Delimiter syntax should NOT be in the rendered HTML
    expect(html).not.toContain("|:---|");
    expect(html).not.toContain("|---|");

    // Wrapper has overflow-x-auto and max-w-full to prevent chat expansion
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("w-full");
    expect(html).toContain("max-w-full");

    // Table has min-w-[480px] to preserve legibility on 393px mobile screens
    expect(html).toContain("min-w-[480px]");

    // Meal column has wrapping classes
    expect(html).toContain("whitespace-normal break-words min-w-[140px]");

    // Numeric columns have tabular-nums font-mono text-right
    expect(html).toContain("text-right");
    expect(html).toContain("tabular-nums");
    expect(html).toContain("font-mono");

    // Contains cell values
    expect(html).toContain("Grilled tandoori chicken");
    expect(html).toContain("840");
    expect(html).toContain("45");
  });

  it("parses tables that omit leading and trailing pipes gracefully", () => {
    const tableMarkdown = [
      "Date | Meal | Calories | Protein (g)",
      "---|---|---|---",
      "Oct 22 | Chicken Rice | 650 | 48",
      "Oct 21 | Whey Shake | 220 | 30",
    ].join("\n");

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: tableMarkdown }));

    expect(html).toContain("<table");
    expect(html).toContain("Chicken Rice");
    expect(html).toContain("650");
    expect(html).toContain("Whey Shake");
    expect(html).not.toContain("---|---|");
  });

  it("does not corrupt identifiers with underscores or simple arithmetic with asterisks", () => {
    const markdown = "Check user_profile_data and note that 2 * 3 = 6.";
    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: markdown }));

    expect(html).toContain("user_profile_data");
    expect(html).toContain("2 * 3 = 6");
  });

  it("renders a full comprehensive Orbit weekly review without raw markdown syntax", () => {
    const weeklyReviewMarkdown = `### Weekly Review
**Period**: 2026-10-16 – 2026-10-23

#### Overall Assessment
You demonstrated solid momentum with strength workouts this week. Nutrition tracking was consistent on logged days.

#### Key Metrics
- **Workouts**: 2 session(s) (43 min total)
- **Nutrition**: 2 meals across 1 days (avg 840 kcal, 23g P/day)
- **Tasks**: 0 completed, 1 pending
- **Body Weight**: 76.35 kg

#### What Went Well
- Strength workout completed on Oct 19 with 3 exercises.
- Logged meal hit high protein target.

#### What Needs Improvement
- 5 untracked nutrition days.
- 1 task pending due Oct 22.

#### Your Score
**7.0/10** — Strong consistency on active days; tracking frequency needs improvement for higher momentum.

#### Priorities for Next Week
1. Log at least 3 strength workout sessions
2. Track nutrition on at least 5 days
3. Clear all pending tasks`;

    const html = renderToStaticMarkup(React.createElement(MarkdownText, { text: weeklyReviewMarkdown }));

    // Confirm headings
    expect(html).toContain("Weekly Review");
    expect(html).toContain("Overall Assessment");
    expect(html).toContain("Key Metrics");
    expect(html).toContain("What Went Well");
    expect(html).toContain("What Needs Improvement");
    expect(html).toContain("Your Score");
    expect(html).toContain("Priorities for Next Week");

    // Zero raw markdown heading hashes
    expect(html).not.toContain("### Weekly Review");
    expect(html).not.toContain("#### Overall Assessment");
    expect(html).not.toContain("#### Key Metrics");

    // Zero raw bullet hashes or unparsed bold tags
    expect(html).not.toContain("**Workouts**");
    expect(html).not.toContain("**Nutrition**");
    expect(html).not.toContain("**7.0/10**");

    // Content rendered inside semantic tags
    expect(html).toContain("<strong");
    expect(html).toContain("Workouts");
    expect(html).toContain("7.0/10");
  });
});

