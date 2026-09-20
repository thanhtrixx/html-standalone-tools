#!/usr/bin/env node
/**
 * slice-inspect.js — Surgical symbol extractor for monolithic files.
 *
 * Extracts the exact line range of a named function, class, or const arrow
 * without reading the whole file. Prints startLine, endLine, and the snippet,
 * enabling targeted replace_file_content calls with zero wide-view waste.
 *
 * Usage:
 *   bun run slice:inspect -- <file> <symbol>
 *   node scripts/slice-inspect.js english-shadowing/index.html handleGlobalKeydown
 *   node scripts/slice-inspect.js scripts/run-tests.js runSuiteAsync
 *
 * Output (Markdown to stdout):
 *   ## handleGlobalKeydown
 *   **File:** english-shadowing/index.html
 *   **Lines:** 19843–19912 (70 lines)
 *
 *   ```js
 *   function handleGlobalKeydown(e) {
 *     ...
 *   }
 *   ```
 *
 * Exit codes: 0 = found, 1 = not found / error
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

// ── Argument parsing ──────────────────────────────────────────────────────────
// Support both: node slice-inspect.js <file> <symbol>
// and:          bun run slice:inspect -- <file> <symbol>
const rawArgs = process.argv.slice(2);
// Drop leading "--" separator that bun injects
const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;

if (args.length < 2) {
  console.error("Usage: slice-inspect.js <file> <symbol>");
  console.error("  <file>   — path relative to repo root or absolute");
  console.error("  <symbol> — function/class/const name to locate");
  process.exit(1);
}

const [fileArg, symbol] = args;
const filePath = path.isAbsolute(fileArg)
  ? fileArg
  : path.join(ROOT_DIR, fileArg);

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// ── Pattern matching ──────────────────────────────────────────────────────────
// Covers common JS/HTML patterns:
//   function foo(           async function foo(
//   const foo = (           const foo = async (
//   const foo = function(   const foo = async function(
//   foo(                    (as method inside object/class)
//   class Foo {
const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATTERNS = [
  new RegExp(`^\\s*(?:async\\s+)?function\\s+${escaped}\\s*[(<]`),
  new RegExp(
    `^\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${escaped}\\s*[(<]`
  ),
  new RegExp(
    `^\\s*(?:export\\s+)?const\\s+${escaped}\\s*=\\s*(?:async\\s+)?(?:function|\\(|\\w)`
  ),
  new RegExp(
    `^\\s*(?:export\\s+)?(?:let|var)\\s+${escaped}\\s*=\\s*(?:async\\s+)?(?:function|\\()`
  ),
  new RegExp(`^\\s*(?:export\\s+)?class\\s+${escaped}[\\s{<]`),
  new RegExp(`^\\s*${escaped}\\s*(?:=\\s*(?:async\\s+)?(?:function|\\())`),
  new RegExp(`^\\s*${escaped}\\s*:\\s*(?:async\\s+)?function`),
];

// ── File reading & line scan ─────────────────────────────────────────────────
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

let startLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (PATTERNS.some((p) => p.test(lines[i]))) {
    startLine = i + 1; // 1-indexed
    break;
  }
}

if (startLine === -1) {
  console.error(`❌ Symbol not found: "${symbol}" in ${fileArg}`);
  console.error(
    `   Tried patterns for: function, const arrow, async function, class`
  );
  process.exit(1);
}

// ── Brace balancing to find end line ─────────────────────────────────────────
// Walk from startLine, count { and }, handle strings/comments naively.
// Works well for functions/classes; degrades gracefully on edge cases.
let depth = 0;
let endLine = startLine;
let foundOpenBrace = false;

for (let i = startLine - 1; i < lines.length; i++) {
  const line = lines[i];

  // Naive brace counting (ignores strings/template literals but good enough
  // for typical JS code structures at function boundaries)
  for (const ch of line) {
    if (ch === "{") {
      depth++;
      foundOpenBrace = true;
    } else if (ch === "}") {
      depth--;
    }
  }

  if (foundOpenBrace && depth === 0) {
    endLine = i + 1; // 1-indexed
    break;
  }
}

// ── Extract snippet (max 80 lines to keep output compact) ────────────────────
const MAX_SNIPPET_LINES = 80;
const snippetLines = lines.slice(startLine - 1, endLine);
const truncated = snippetLines.length > MAX_SNIPPET_LINES;
const snippet =
  snippetLines.slice(0, MAX_SNIPPET_LINES).join("\n") +
  (truncated
    ? `\n... (${snippetLines.length - MAX_SNIPPET_LINES} more lines, see endLine)`
    : "");

// ── Infer language for fenced code block ─────────────────────────────────────
const ext = path.extname(fileArg).toLowerCase();
const langMap = {
  ".js": "js",
  ".ts": "ts",
  ".mjs": "js",
  ".cjs": "js",
  ".html": "html",
  ".css": "css",
  ".json": "json",
  ".py": "python",
  ".sh": "bash",
};
const lang = langMap[ext] || "";

// ── Output (structured Markdown) ──────────────────────────────────────────────
const totalLines = endLine - startLine + 1;
const truncatedNote = snippet.endsWith(")")
  ? "" // already has note appended in snippet string
  : "";

console.log(`## ${symbol}`);
console.log(`**File:** ${fileArg}`);
console.log(`**Lines:** ${startLine}–${endLine} (${totalLines} lines)`);
console.log();
console.log(`\`\`\`${lang}`);
console.log(snippet);
console.log("```");
process.exit(0);
