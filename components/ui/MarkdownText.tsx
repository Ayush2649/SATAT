"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Square } from "lucide-react";

interface Props {
  text: string;
  className?: string;
}

/**
 * Checks if a column name represents numeric data (calories, protein, carbs, etc.)
 */
function isNumericHeader(header: string): boolean {
  return /\b(calories?|kcal|protein|carbs?|fat|fiber|weight|kg|g|reps?|sets?|duration|mins?|score|rating|count|total)\b/i.test(header);
}

/**
 * Checks if a column represents a meal or activity description that should wrap comfortably.
 */
function isMealColumn(header: string): boolean {
  return /\b(meal|food|description|item|exercise|workout|activity|name)\b/i.test(header);
}

/**
 * Checks if a cell value is numeric or currency/metric (e.g. "840", "45g", "76.35 kg", "220 kcal").
 */
function isNumericValue(cell: string): boolean {
  return /^[\d,.]+(\s*(g|kg|kcal|cal|min|mins|m|s|%|lb|lbs|pts?))?$/i.test(cell.trim());
}

/**
 * Splits a markdown table row into trimmed cell strings.
 * Handles both enclosed pipes (| a | b |) and open pipes (a | b).
 */
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((c) => c.trim());
}

/**
 * Checks whether a line consists purely of markdown table divider tokens (:---, ---:, :---:, ---).
 */
function isTableDelimiter(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  const cells = parseTableRow(trimmed);
  return cells.length >= 2 && cells.every((c) => /^:?-{1,}:?$/.test(c.trim()));
}

/**
 * Infers column text alignment from delimiter cell syntax (:---, ---:, :---:)
 */
function parseAlignment(delimiterCell: string): "left" | "center" | "right" {
  const d = delimiterCell.trim();
  if (d.startsWith(":") && d.endsWith(":")) return "center";
  if (d.endsWith(":")) return "right";
  return "left";
}

/**
 * Render inline markdown tokens:
 * - Bold + Italic: ***text***, ___text___
 * - Bold: **text**, __text__
 * - Italic: *text*, _text_
 * - Strikethrough: ~~text~~
 * - Inline code: `code`
 * - Links: [label](url)
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match: code, links, bold-italic, bold, italic, strikethrough
  // Tokenizer with word-boundary awareness for * and _ to prevent breaking arithmetic or identifiers
  const tokenRegex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^* \t\n][^*]*\*|(?<!\w)_[^_ \t\n][^_]*_(?!\w)|~~[^~]+~~)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // 1. Inline code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded text-[12px] font-mono font-medium mx-0.5 break-all"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            color: "var(--satat-brand, #6E8BFF)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 2. Bold + Italic: ***text*** or ___text___
    if (
      (part.startsWith("***") && part.endsWith("***") && part.length > 6) ||
      (part.startsWith("___") && part.endsWith("___") && part.length > 6)
    ) {
      return (
        <strong key={i} className="font-semibold" style={{ color: "var(--text-primary, #F2F3F0)" }}>
          <em className="italic">{part.slice(3, -3)}</em>
        </strong>
      );
    }

    // 3. Bold: **bold** or __bold__
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length > 4)
    ) {
      const boldContent = part.slice(2, -2);
      const isRating = /\b(\d+(?:\.\d+)?)\s*\/\s*10\b/.test(boldContent);
      return (
        <strong
          key={i}
          className={cn(
            "font-semibold",
            isRating && "inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[#E05A47] bg-[#E05A47]/15 border border-[#E05A47]/30"
          )}
          style={!isRating ? { color: "var(--text-primary, #F2F3F0)" } : undefined}
        >
          {boldContent}
        </strong>
      );
    }

    // 4. Strikethrough: ~~strikethrough~~
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      return (
        <span key={i} className="line-through opacity-60">
          {part.slice(2, -2)}
        </span>
      );
    }

    // 5. Italic: *italic* or _italic_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2)
    ) {
      return (
        <em key={i} className="italic" style={{ color: "var(--text-secondary, #AEB3B0)" }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    // 6. Markdown link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-opacity hover:opacity-80"
          style={{ color: "var(--satat-brand, #6E8BFF)" }}
        >
          {label}
        </a>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

/**
 * Robust, lightweight structured Markdown renderer for SATAT Orbit and summaries.
 * Supports:
 * - Headings: #, ##, ###, ####, #####, ###### (with inline token support)
 * - Lists: ordered (1., 2.), unordered (-, *, +, •) with indentation
 * - Checklists: - [ ] and - [x]
 * - Code blocks: ```...```
 * - Blockquotes: > ...
 * - Horizontal rules: ---, ***, ___
 * - Tables: responsive, horizontally scrollable on mobile with readable wrapped columns
 * - Bold, italic, bold+italic, strikethrough, inline code, and links
 */
export function MarkdownText({ text, className }: Props) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Empty lines — single collapsed spacer
    if (!trimmed) {
      // Avoid stacking multiple spacers
      if (elements.length > 0 && (elements[elements.length - 1] as any)?.key?.startsWith("sp-")) {
        i++;
        continue;
      }
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // 2. Fenced Code Block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      const lang = trimmed.slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i++; // skip closing ```
      }

      elements.push(
        <div
          key={`code-${i}`}
          className="rounded-xl overflow-hidden my-2.5 border max-w-full"
          style={{
            background: "var(--surface, #0D0F11)",
            borderColor: "var(--border, rgba(255, 255, 255, 0.08))",
          }}
        >
          {lang && (
            <div
              className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider border-b font-semibold"
              style={{
                borderColor: "var(--border-subtle, rgba(255, 255, 255, 0.05))",
                color: "var(--text-muted, #7F8682)",
              }}
            >
              {lang}
            </div>
          )}
          <pre
            className="p-3 text-xs font-mono overflow-x-auto max-w-full leading-relaxed select-text"
            style={{ color: "var(--text-primary, #F2F3F0)" }}
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 3. Horizontal Rule: ---, ***, ___
    if (/^([-*_]){3,}$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-3 border-t"
          style={{ borderColor: "var(--border, rgba(255, 255, 255, 0.08))" }}
        />
      );
      i++;
      continue;
    }

    // 4. Blockquote: > text
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 pl-3 my-2 italic text-sm leading-relaxed"
          style={{
            borderColor: "var(--satat-brand, #6E8BFF)",
            color: "var(--text-secondary, #AEB3B0)",
          }}
        >
          {renderInline(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // 5. Headings: # through ######
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const headingText = hMatch[2];

      const headingClasses = cn(
        "tracking-tight font-display font-semibold",
        level === 1 && "text-base sm:text-lg font-bold mt-4 mb-1.5 text-[var(--text-primary,#F2F3F0)]",
        level === 2 && "text-sm sm:text-base font-bold mt-3.5 mb-1.5 text-[var(--text-primary,#F2F3F0)]",
        level === 3 && "text-xs uppercase tracking-wider font-bold mt-3 mb-1 text-[var(--satat-brand,#6E8BFF)]",
        level === 4 && "text-sm font-semibold mt-2.5 mb-1 text-[var(--text-primary,#F2F3F0)]",
        level === 5 && "text-xs font-semibold mt-2 mb-0.5 text-[var(--text-secondary,#AEB3B0)]",
        level === 6 && "text-xs font-semibold mt-2 mb-0.5 text-[var(--text-muted,#7F8682)]"
      );

      elements.push(
        <p key={`h-${i}`} className={headingClasses}>
          {renderInline(headingText)}
        </p>
      );
      i++;
      continue;
    }

    // 6. Standalone bold heading: **Heading** or **Heading:**
    if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
      const headingText = trimmed.replace(/^\*\*/, "").replace(/\*\*:?\s*$/, "");
      elements.push(
        <p
          key={`bhd-${i}`}
          className="font-semibold text-sm mt-3 mb-1 font-display"
          style={{ color: "var(--text-primary, #F2F3F0)" }}
        >
          {renderInline(headingText)}
        </p>
      );
      i++;
      continue;
    }

    // 7. Checklists: - [ ] or - [x] or * [ ] or + [ ]
    const checkMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (checkMatch) {
      const checked = checkMatch[1].toLowerCase() === "x";
      const checkText = checkMatch[2];
      const leadingSpaces = rawLine.match(/^\s*/)?.[0]?.length || 0;
      const indentLevel = Math.min(Math.floor(leadingSpaces / 2), 3);

      elements.push(
        <div
          key={`chk-${i}`}
          className="flex items-start gap-2.5 my-1 text-sm"
          style={{ paddingLeft: `${indentLevel * 14}px` }}
        >
          <div
            className={cn(
              "w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors",
              checked
                ? "bg-brand/20 border-brand text-brand"
                : "border-white/20 text-muted"
            )}
          >
            {checked ? <Check className="w-3 h-3 stroke-[3]" /> : <Square className="w-3 h-3 opacity-0" />}
          </div>
          <span
            className={cn("leading-relaxed flex-1", checked && "line-through opacity-60")}
            style={{ color: "var(--text-primary, #F2F3F0)" }}
          >
            {renderInline(checkText)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 8. Numbered List Item: 1. or 1)
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      const num = numMatch[1];
      const content = numMatch[2];
      const leadingSpaces = rawLine.match(/^\s*/)?.[0]?.length || 0;
      const indentLevel = Math.min(Math.floor(leadingSpaces / 2), 3);

      elements.push(
        <div
          key={`num-${i}`}
          className="flex items-start gap-2.5 my-1 text-sm"
          style={{ paddingLeft: `${indentLevel * 14}px` }}
        >
          <span
            className="shrink-0 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
            style={{
              background: "rgba(110, 139, 255, 0.12)",
              color: "var(--satat-brand, #6E8BFF)",
              border: "1px solid rgba(110, 139, 255, 0.25)",
            }}
          >
            {num}
          </span>
          <div className="leading-relaxed flex-1" style={{ color: "var(--text-primary, #F2F3F0)" }}>
            {renderInline(content)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 9. Bullet List Item: -, *, +, •
    if (/^[-*+•]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*+•]\s/, "");
      const leadingSpaces = rawLine.match(/^\s*/)?.[0]?.length || 0;
      const indentLevel = Math.min(Math.floor(leadingSpaces / 2), 3);

      elements.push(
        <div
          key={`blt-${i}`}
          className="flex items-start gap-2.5 my-1 text-sm"
          style={{ paddingLeft: `${indentLevel * 14}px` }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
            style={{
              backgroundColor: indentLevel > 0 ? "rgba(255, 255, 255, 0.4)" : "var(--satat-brand, #6E8BFF)",
            }}
          />
          <div className="leading-relaxed flex-1" style={{ color: "var(--text-primary, #F2F3F0)" }}>
            {renderInline(bulletText)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 10. Table: Detected when line contains | and next line is delimiter OR this line is delimiter
    if (trimmed.includes("|") && (i + 1 < lines.length && isTableDelimiter(lines[i + 1]) || isTableDelimiter(trimmed))) {
      const tableLines: string[] = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim().includes("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Identify delimiter line index
      const delimIdx = tableLines.findIndex(isTableDelimiter);
      let headerLine = "";
      let delimLine = "";
      let dataLines: string[] = [];

      if (delimIdx > 0) {
        headerLine = tableLines[0];
        delimLine = tableLines[delimIdx];
        dataLines = tableLines.slice(delimIdx + 1);
      } else if (delimIdx === 0 && tableLines.length > 1) {
        // Delimiter was first row without header
        headerLine = tableLines[1];
        delimLine = tableLines[0];
        dataLines = tableLines.slice(2);
      } else {
        // Fallback: row 0 header, rest data
        headerLine = tableLines[0];
        dataLines = tableLines.slice(1);
      }

      const headerCells = parseTableRow(headerLine);
      const delimCells = delimLine ? parseTableRow(delimLine) : [];
      const alignments = delimCells.map(parseAlignment);

      const bodyRows = dataLines
        .filter((l) => !isTableDelimiter(l))
        .map((l) => {
          const cells = parseTableRow(l);
          // Pad or trim to match header length
          while (cells.length < headerCells.length) cells.push("");
          return cells;
        });

      if (headerCells.length > 0) {
        elements.push(
          <div
            key={`tbl-${i}`}
            className="w-full max-w-full my-3 rounded-xl border overflow-hidden shadow-sm"
            style={{
              borderColor: "var(--border, rgba(255, 255, 255, 0.08))",
              background: "var(--surface, #0D0F11)",
            }}
          >
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full min-w-[480px] border-collapse text-xs">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      borderColor: "var(--border, rgba(255, 255, 255, 0.08))",
                      background: "rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    {headerCells.map((h, colIdx) => {
                      const align = alignments[colIdx] || (isNumericHeader(h) ? "right" : "left");
                      const isMeal = isMealColumn(h);
                      return (
                        <th
                          key={colIdx}
                          className={cn(
                            "py-1.5 px-2.5 font-semibold tracking-wide text-xs select-none whitespace-nowrap",
                            align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
                            isMeal && "min-w-[140px]"
                          )}
                          style={{ color: "var(--text-primary, #F2F3F0)" }}
                        >
                          {renderInline(h)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: "var(--border-subtle, rgba(255, 255, 255, 0.05))" }}
                    >
                      {row.map((cell, colIdx) => {
                        const headerName = headerCells[colIdx] || "";
                        const align = alignments[colIdx] || (isNumericHeader(headerName) ? "right" : "left");
                        const isMeal = isMealColumn(headerName);
                        const isNum = isNumericHeader(headerName) || isNumericValue(cell);
                        return (
                          <td
                            key={colIdx}
                            className={cn(
                              "py-1.5 px-2.5 text-xs",
                              align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
                              isMeal ? "whitespace-normal break-words min-w-[140px] leading-snug" : "whitespace-nowrap",
                              isNum && "font-mono tabular-nums text-[11px]"
                            )}
                            style={{ color: "var(--text-secondary, #AEB3B0)" }}
                          >
                            {renderInline(cell)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      continue;
    }

    // 11. Regular paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm leading-relaxed my-1.5 break-words [overflow-wrap:anywhere]"
        style={{ color: "var(--text-primary, #F2F3F0)" }}
      >
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return (
    <div className={cn("space-y-1 w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere]", className)}>
      {elements}
    </div>
  );
}

export default MarkdownText;
