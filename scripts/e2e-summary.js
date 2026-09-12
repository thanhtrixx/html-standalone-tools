#!/usr/bin/env node

/**
 * E2E Token-Efficient Error Aggregation Summary Runner
 *
 * Wraps Playwright test execution with the JSON reporter and aggregates results
 * into a compact pass/fail signal (~100 tokens), preventing agent token waste.
 * On failure, outputs only the specific failure traces (max ~5 lines per failure).
 *
 * Usage:
 *   node scripts/e2e-summary.js
 *   node scripts/e2e-summary.js --tool=habit
 *   node scripts/e2e-summary.js --tool tracker
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const isBun = typeof process.versions.bun !== "undefined";
const runtime = process.execPath;

const TOOL_MAP = {
  predictor: {
    spec: "tests/e2e/savings-predictor-devices.spec.js",
    label: "predictor",
    aliases: ["predictor", "savings", "personal-finance-savings-predictor"],
  },
  "buy-rent": {
    spec: "tests/e2e/buy-vs-rent-devices.spec.js",
    label: "buy-rent",
    aliases: ["buy-rent", "buy-vs-rent", "buy-vs-rent-home-comparison"],
  },
  tracker: {
    spec: "tests/e2e/smart-buy-list-devices.spec.js",
    label: "tracker",
    aliases: ["tracker", "smart-buy-list", "smart-buy-list-price-tracker"],
  },
  habit: {
    spec: "tests/e2e/habit-tracker-devices.spec.js",
    label: "habit",
    aliases: ["habit", "habit-tracker", "atomic-habit"],
  },
  portal: {
    spec: "tests/e2e/portal-devices.spec.js",
    label: "portal",
    aliases: ["portal"],
  },
};

/**
 * Resolves tool alias to its spec file and standard label.
 * @param {string} toolName
 * @returns {{ spec: string, label: string } | null}
 */
function resolveToolSpec(toolName) {
  if (!toolName) return null;
  const normalized = String(toolName).trim().toLowerCase();

  for (const key of Object.keys(TOOL_MAP)) {
    const entry = TOOL_MAP[key];
    if (entry.aliases.includes(normalized)) {
      return { spec: entry.spec, label: entry.label };
    }
  }

  // Direct filename fallback check
  if (normalized.endsWith(".spec.js") || normalized.includes("tests/e2e/")) {
    return { spec: normalized, label: path.basename(normalized, ".spec.js") };
  }

  return null;
}

/**
 * Maps a test file name to standard tool label.
 * @param {string} file
 * @returns {string}
 */
function mapFileToToolLabel(file) {
  if (!file) return "unknown";
  const base = path.basename(file);
  for (const key of Object.keys(TOOL_MAP)) {
    if (path.basename(TOOL_MAP[key].spec) === base) {
      return TOOL_MAP[key].label;
    }
  }
  return base.replace(/-devices\.spec\.js$/, "").replace(/\.spec\.js$/, "");
}

/**
 * Clean and truncate an error trace/message to ~5 meaningful lines.
 * @param {string} trace
 * @param {number} maxLines
 * @returns {string}
 */
function cleanErrorTrace(trace, maxLines = 5) {
  if (!trace) return "";
  // Strip ANSI color codes
  const stripped = trace.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").trim();
  const lines = stripped
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);
  if (lines.length <= maxLines) {
    return lines.join("\n");
  }
  return lines.slice(0, maxLines).join("\n") + "\n    ...";
}

/**
 * Parses Playwright JSON reporter output.
 * @param {object} report
 * @returns {{
 *   total: number,
 *   passed: number,
 *   failed: number,
 *   skipped: number,
 *   flaky: number,
 *   toolBreakdown: Record<string, number>,
 *   failures: Array<{ tool: string, testName: string, project: string, errorTrace: string }>
 * }}
 */
function parsePlaywrightJson(report) {
  if (!report || typeof report !== "object") {
    return {
      total: 0,
      passed: 0,
      failed: 1,
      skipped: 0,
      flaky: 0,
      toolBreakdown: {},
      failures: [
        {
          tool: "general",
          testName: "Execution",
          project: "all",
          errorTrace: "Invalid or empty Playwright JSON report.",
        },
      ],
    };
  }

  const toolBreakdown = {};
  const failures = [];
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let flaky = 0;

  function traverseSuite(suite, currentFile = "") {
    const file = suite.file || currentFile;

    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        const specFile = spec.file || file;
        const tool = mapFileToToolLabel(specFile);

        if (Array.isArray(spec.tests)) {
          for (const test of spec.tests) {
            total++;
            const project = test.projectName || "default";
            const results = Array.isArray(test.results) ? test.results : [];
            const isExpected = test.status === "expected";
            const isSkipped = test.status === "skipped";
            const isFlaky = test.status === "flaky";

            if (isExpected) {
              passed++;
              toolBreakdown[tool] = (toolBreakdown[tool] || 0) + 1;
            } else if (isSkipped) {
              skipped++;
            } else if (isFlaky) {
              flaky++;
              passed++;
              toolBreakdown[tool] = (toolBreakdown[tool] || 0) + 1;
            } else {
              failed++;
              let errorTrace = "";
              for (const res of results) {
                if (Array.isArray(res.errors) && res.errors.length > 0) {
                  errorTrace = res.errors
                    .map(
                      (e) =>
                        e.message || e.value || e.stack || JSON.stringify(e)
                    )
                    .join("\n");
                  break;
                }
              }
              if (!errorTrace && test.error) {
                errorTrace =
                  test.error.message || test.error.stack || String(test.error);
              }
              failures.push({
                tool,
                testName: spec.title || "Unnamed test",
                project,
                errorTrace: cleanErrorTrace(
                  errorTrace || "Test failed without explicit error message."
                ),
              });
            }
          }
        }
      }
    }

    if (Array.isArray(suite.suites)) {
      for (const childSuite of suite.suites) {
        traverseSuite(childSuite, file);
      }
    }
  }

  if (Array.isArray(report.suites)) {
    for (const rootSuite of report.suites) {
      traverseSuite(rootSuite);
    }
  }

  // Also check top-level reporter errors
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    for (const err of report.errors) {
      failed++;
      failures.push({
        tool: "runner",
        testName: "Reporter Top-Level Error",
        project: "global",
        errorTrace: cleanErrorTrace(err.message || err.stack || String(err)),
      });
    }
  }

  return {
    total,
    passed,
    failed,
    skipped,
    flaky,
    toolBreakdown,
    failures,
  };
}

/**
 * Formats the parsed Playwright results into a compact summary string.
 * @param {ReturnType<typeof parsePlaywrightJson>} parsed
 * @returns {{ summary: string, exitCode: number }}
 */
function formatSummary(parsed) {
  if (parsed.failed === 0 && parsed.failures.length === 0) {
    const breakdownEntries = Object.entries(parsed.toolBreakdown).map(
      ([tool, count]) => `${tool}: ${count}`
    );
    const breakdownStr =
      breakdownEntries.length > 0 ? ` (${breakdownEntries.join(", ")})` : "";
    const summary = `✅ ${parsed.passed}/${parsed.total} passed${breakdownStr}`;
    return { summary, exitCode: 0 };
  }

  const failureNames = parsed.failures
    .slice(0, 5)
    .map((f) => `${f.tool}:${f.testName}`);
  const remainingCount = parsed.failures.length - 5;
  const failureListStr = `[${failureNames.join(", ")}${
    remainingCount > 0 ? `, ... (+${remainingCount} more)` : ""
  }]`;

  let summary = `❌ ${parsed.failures.length} failed: ${failureListStr}`;

  const traceBlocks = parsed.failures.slice(0, 5).map((f) => {
    return `\n--- [${f.tool}] ${f.testName} (${f.project}) ---\n${f.errorTrace}`;
  });

  summary += traceBlocks.join("\n");
  return { summary, exitCode: 1 };
}

/**
 * CLI Runner Entry Point
 */
function runE2ESummary(argv = process.argv.slice(2)) {
  let toolArg = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--tool=")) {
      toolArg = argv[i].split("=")[1];
    } else if (argv[i] === "--tool" && argv[i + 1]) {
      toolArg = argv[i + 1];
      i++;
    }
  }

  const playwrightArgs = ["test", "--reporter=json"];

  if (toolArg) {
    const resolved = resolveToolSpec(toolArg);
    if (!resolved) {
      console.error(`❌ Unknown tool or invalid filter: '${toolArg}'`);
      console.error(`Available tools: ${Object.keys(TOOL_MAP).join(", ")}`);
      process.exit(1);
    }
    playwrightArgs.push(resolved.spec);
  }

  const playwrightBin = path.join(
    ROOT_DIR,
    "node_modules",
    "@playwright",
    "test",
    "cli.js"
  );

  let proc;
  const env = { ...process.env, CI: process.env.CI || "1" };

  if (fs.existsSync(playwrightBin)) {
    proc = spawnSync(runtime, [playwrightBin, ...playwrightArgs], {
      cwd: ROOT_DIR,
      env,
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf8",
    });
  } else {
    const runner = isBun ? "bunx" : "npx";
    proc = spawnSync(runner, ["playwright", ...playwrightArgs], {
      cwd: ROOT_DIR,
      env,
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf8",
    });
  }

  const rawStdout = proc.stdout || "";
  const rawStderr = proc.stderr || "";

  let reportJson;
  try {
    // Playwright with --reporter=json dumps JSON to stdout. Find JSON start if mixed with server logs
    const jsonStartIdx = rawStdout.indexOf("{");
    if (jsonStartIdx !== -1) {
      const trimmedJson = rawStdout.substring(jsonStartIdx);
      reportJson = JSON.parse(trimmedJson);
    } else {
      throw new Error("No JSON payload detected in stdout.");
    }
  } catch (err) {
    console.error("❌ Failed to parse Playwright JSON output.");
    if (rawStderr) {
      console.error("Stderr:", rawStderr.trim());
    }
    if (rawStdout) {
      console.error("Stdout:", rawStdout.trim().slice(0, 500));
    }
    process.exit(proc.status || 1);
  }

  const parsed = parsePlaywrightJson(reportJson);
  const { summary, exitCode } = formatSummary(parsed);

  console.log(summary);
  process.exit(exitCode);
}

if (require.main === module) {
  runE2ESummary();
}

module.exports = {
  TOOL_MAP,
  resolveToolSpec,
  mapFileToToolLabel,
  cleanErrorTrace,
  parsePlaywrightJson,
  formatSummary,
  runE2ESummary,
};
