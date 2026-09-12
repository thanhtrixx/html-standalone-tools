const {
  TOOL_MAP,
  resolveToolSpec,
  mapFileToToolLabel,
  cleanErrorTrace,
  parsePlaywrightJson,
  formatSummary,
} = require("../scripts/e2e-summary");

async function runTests() {
  console.log("🧪 Running E2E Summary Parser & Aggregator Unit Tests...\n");
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // 1. Tool Spec Resolution & Aliases
  console.log("--- 1. Tool Spec Resolution & Aliases ---");
  const habitResolved = resolveToolSpec("habit");
  assert(
    habitResolved &&
      habitResolved.spec === "tests/e2e/habit-tracker-devices.spec.js" &&
      habitResolved.label === "habit",
    "Resolves 'habit' alias"
  );

  const habitTrackerResolved = resolveToolSpec("habit-tracker");
  assert(
    habitTrackerResolved && habitTrackerResolved.label === "habit",
    "Resolves 'habit-tracker' alias"
  );

  const atomicHabitResolved = resolveToolSpec("atomic-habit");
  assert(
    atomicHabitResolved && atomicHabitResolved.label === "habit",
    "Resolves 'atomic-habit' alias"
  );

  const trackerResolved = resolveToolSpec("tracker");
  assert(
    trackerResolved &&
      trackerResolved.spec === "tests/e2e/smart-buy-list-devices.spec.js" &&
      trackerResolved.label === "tracker",
    "Resolves 'tracker' alias"
  );

  const buyRentResolved = resolveToolSpec("buy-vs-rent");
  assert(
    buyRentResolved &&
      buyRentResolved.spec === "tests/e2e/buy-vs-rent-devices.spec.js" &&
      buyRentResolved.label === "buy-rent",
    "Resolves 'buy-vs-rent' alias"
  );

  const predictorResolved = resolveToolSpec("savings");
  assert(
    predictorResolved &&
      predictorResolved.spec ===
        "tests/e2e/savings-predictor-devices.spec.js" &&
      predictorResolved.label === "predictor",
    "Resolves 'savings' alias"
  );

  const portalResolved = resolveToolSpec("portal");
  assert(
    portalResolved &&
      portalResolved.spec === "tests/e2e/portal-devices.spec.js" &&
      portalResolved.label === "portal",
    "Resolves 'portal' alias"
  );

  const invalidResolved = resolveToolSpec("non-existent-tool");
  assert(invalidResolved === null, "Returns null for unknown tool alias");

  const nullResolved = resolveToolSpec(null);
  assert(nullResolved === null, "Returns null for null tool input");

  // 2. mapFileToToolLabel
  console.log("\n--- 2. mapFileToToolLabel ---");
  assert(
    mapFileToToolLabel("tests/e2e/habit-tracker-devices.spec.js") === "habit",
    "Maps habit spec filename to 'habit'"
  );
  assert(
    mapFileToToolLabel("portal-devices.spec.js") === "portal",
    "Maps portal filename to 'portal'"
  );
  assert(
    mapFileToToolLabel("custom-tool-devices.spec.js") === "custom-tool",
    "Maps fallback filename without suffix"
  );

  // 3. cleanErrorTrace
  console.log("\n--- 3. cleanErrorTrace ---");
  const ansiTrace =
    "\x1B[31mError: Expected true\x1B[39m\n    at Object.test (foo.js:10:5)\n    at Runner.run (runner.js:20:9)";
  const cleaned = cleanErrorTrace(ansiTrace, 5);
  assert(!cleaned.includes("\x1B[31m"), "Strips ANSI color codes");
  assert(
    cleaned.startsWith("Error: Expected true"),
    "Preserves error message content"
  );

  const longTrace = Array.from({ length: 15 }, (_, i) => `Line ${i + 1}`).join(
    "\n"
  );
  const truncated = cleanErrorTrace(longTrace, 4);
  assert(truncated.includes("Line 4"), "Includes up to maxLines");
  assert(!truncated.includes("Line 5"), "Excludes beyond maxLines");
  assert(truncated.endsWith("..."), "Appends ellipsis on truncation");

  // 4. parsePlaywrightJson & formatSummary - All Pass
  console.log("\n--- 4. All-Pass Report Parsing ---");
  const mockSuccessReport = {
    suites: [
      {
        file: "tests/e2e/savings-predictor-devices.spec.js",
        specs: [
          {
            title: "Savings growth test",
            tests: [
              {
                projectName: "desktop",
                status: "expected",
                results: [{ status: "passed" }],
              },
              {
                projectName: "mobile",
                status: "expected",
                results: [{ status: "passed" }],
              },
            ],
          },
        ],
      },
      {
        file: "tests/e2e/habit-tracker-devices.spec.js",
        specs: [
          {
            title: "Habit streak test",
            tests: [
              {
                projectName: "desktop",
                status: "expected",
                results: [{ status: "passed" }],
              },
            ],
          },
        ],
      },
    ],
  };

  const parsedSuccess = parsePlaywrightJson(mockSuccessReport);
  assert(parsedSuccess.total === 3, "Total tests parsed correctly (3)");
  assert(parsedSuccess.passed === 3, "Passed tests parsed correctly (3)");
  assert(parsedSuccess.failed === 0, "Failed count is 0");
  assert(
    parsedSuccess.toolBreakdown.predictor === 2,
    "Predictor breakdown is 2"
  );
  assert(parsedSuccess.toolBreakdown.habit === 1, "Habit breakdown is 1");

  const formattedSuccess = formatSummary(parsedSuccess);
  assert(formattedSuccess.exitCode === 0, "Exit code is 0 on all pass");
  assert(
    formattedSuccess.summary === "✅ 3/3 passed (predictor: 2, habit: 1)",
    `Summary line format matches: ${formattedSuccess.summary}`
  );

  // 5. parsePlaywrightJson & formatSummary - Failure with Traces
  console.log("\n--- 5. Failure Report Parsing & Trace Output ---");
  const mockFailureReport = {
    suites: [
      {
        file: "tests/e2e/habit-tracker-devices.spec.js",
        specs: [
          {
            title: "Swipe gesture test",
            tests: [
              {
                projectName: "mobile",
                status: "unexpected",
                results: [
                  {
                    status: "failed",
                    errors: [
                      {
                        message:
                          "Timed out 5000ms waiting for [data-testid=swipe-item]",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const parsedFailure = parsePlaywrightJson(mockFailureReport);
  assert(parsedFailure.total === 1, "Total tests parsed is 1");
  assert(parsedFailure.failed === 1, "Failed tests count is 1");
  assert(
    parsedFailure.failures.length === 1,
    "Failures array contains 1 entry"
  );
  assert(
    parsedFailure.failures[0].tool === "habit",
    "Failure tool identified as 'habit'"
  );

  const formattedFailure = formatSummary(parsedFailure);
  assert(formattedFailure.exitCode === 1, "Exit code is 1 on failure");
  assert(
    formattedFailure.summary.includes(
      "❌ 1 failed: [habit:Swipe gesture test]"
    ),
    "Failure header contains formatted test name"
  );
  assert(
    formattedFailure.summary.includes(
      "Timed out 5000ms waiting for [data-testid=swipe-item]"
    ),
    "Failure output contains specific error trace"
  );

  // 6. > 5 Failures Capped List
  console.log("\n--- 6. >5 Failures Formatting ---");
  const mockManyFailures = {
    total: 8,
    passed: 1,
    failed: 7,
    skipped: 0,
    flaky: 0,
    toolBreakdown: {},
    failures: [
      { tool: "toolA", testName: "Test 1", project: "p1", errorTrace: "err 1" },
      { tool: "toolA", testName: "Test 2", project: "p1", errorTrace: "err 2" },
      { tool: "toolB", testName: "Test 3", project: "p1", errorTrace: "err 3" },
      { tool: "toolB", testName: "Test 4", project: "p1", errorTrace: "err 4" },
      { tool: "toolC", testName: "Test 5", project: "p1", errorTrace: "err 5" },
      { tool: "toolC", testName: "Test 6", project: "p1", errorTrace: "err 6" },
      { tool: "toolC", testName: "Test 7", project: "p1", errorTrace: "err 7" },
    ],
  };
  const formattedMany = formatSummary(mockManyFailures);
  assert(formattedMany.exitCode === 1, "Exit code is 1");
  assert(
    formattedMany.summary.includes("(+2 more)"),
    "Summary caps failure list with remaining count (+2 more)"
  );

  // 7. Malformed / Empty JSON Input
  console.log("\n--- 7. Malformed / Empty JSON Input ---");
  const parsedNull = parsePlaywrightJson(null);
  assert(parsedNull.failed > 0, "Gracefully handles null input as failure");
  const formattedNull = formatSummary(parsedNull);
  assert(formattedNull.exitCode === 1, "Exit code is 1 for null input");

  console.log("\n==================================================");
  console.log(
    `📊 Total: ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`
  );
  console.log("==================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
