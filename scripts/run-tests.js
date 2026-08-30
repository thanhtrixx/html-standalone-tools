#!/usr/bin/env node

/**
 * Unified Test Runner & Multi-Format Reporting Engine
 *
 * Runs all repository test suites, captures fine-grained assertions,
 * outputs streaming terminal feedback, and generates:
 * 1. Interactive Standalone HTML Report: test-reports/index.html
 * 2. Structured JSON Report: test-reports/results.json
 * 3. Standard JUnit XML Report: test-reports/junit.xml
 * 4. GitHub Actions Step Summary: $GITHUB_STEP_SUMMARY (when running in CI)
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT_DIR, "test-reports");

const TEST_SUITES = [
  {
    name: "Build Pipeline & Compaction",
    file: "tests/build.test.js",
    category: "Build",
  },
  {
    name: "Internationalization & Localization Parity",
    file: "tests/i18n.test.js",
    category: "i18n",
  },
  {
    name: "Simulation Engine Math & Sweep Logic",
    file: "tests/simulation.test.js",
    category: "Core Math",
  },
  {
    name: "Buy vs Rent Simulation Engine Math",
    file: "tests/buy-vs-rent-simulation.test.js",
    category: "Core Math",
  },
  {
    name: "Buy vs Rent UI Shell & i18n Parity",
    file: "tests/buy-vs-rent-ui-i18n.test.js",
    category: "UI/UX",
  },
  {
    name: "Buy vs Rent Analytics Hub & Visualizations",
    file: "tests/buy-vs-rent-charts.test.js",
    category: "UI/UX",
  },
  {
    name: "Buy vs Rent URL Sharing & AI Decision Dossier",
    file: "tests/buy-vs-rent-sharing-dossier.test.js",
    category: "AI & State",
  },
  {
    name: "Buy vs Rent Contextual Tooltips & Methodology Hub",
    file: "tests/buy-vs-rent-tooltips-formulas.test.js",
    category: "UI/UX",
  },
  {
    name: "Calculation & Utility Helpers",
    file: "tests/helpers.test.js",
    category: "Helpers",
  },
  {
    name: "UI/UX & DOM Component Interactions",
    file: "tests/ui-ux.test.js",
    category: "UI/UX",
  },
  {
    name: "Smart Buy-List Unit Price & Deal Intelligence Engine",
    file: "tests/smart-buy-list-price-tracker.test.js",
    category: "Core Math",
  },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseTestOutput(output) {
  const lines = output.split("\n");
  const tests = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const passMatch = trimmed.match(/^(?:✅\s*)?PASS:\s*(.+)$/i);
    const failMatch = trimmed.match(/^(?:❌\s*)?FAIL:\s*(.+)$/i);

    if (passMatch) {
      tests.push({
        name: passMatch[1].trim(),
        status: "passed",
        error: null,
      });
    } else if (failMatch) {
      tests.push({
        name: failMatch[1].trim(),
        status: "failed",
        error: trimmed,
      });
    }
  }

  return tests;
}

function runSuite(suite) {
  const filePath = path.join(ROOT_DIR, suite.file);
  const startTime = Date.now();

  console.log(`\n▶️  Executing [${suite.name}] (${suite.file})...`);

  const proc = spawnSync(process.execPath, [filePath], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: { ...process.env, CI: process.env.CI || "false" },
  });

  const durationMs = Date.now() - startTime;
  const stdout = proc.stdout || "";
  const stderr = proc.stderr || "";
  const rawOutput = stdout + (stderr ? `\n--- STDERR ---\n${stderr}` : "");

  // Stream output to terminal
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());

  let tests = parseTestOutput(rawOutput);
  let passed = tests.filter((t) => t.status === "passed").length;
  let failed = tests.filter((t) => t.status === "failed").length;

  if (proc.status !== 0 && failed === 0) {
    failed = 1;
    tests.push({
      name: `${suite.name} execution failed`,
      status: "failed",
      error: stderr || `Process exited with code ${proc.status}`,
    });
  }

  const success = proc.status === 0 && failed === 0;

  console.log(
    `⏹️  Completed [${suite.name}]: ${passed} Passed, ${failed} Failed (${(durationMs / 1000).toFixed(2)}s)`
  );

  return {
    name: suite.name,
    file: suite.file,
    category: suite.category,
    durationMs,
    exitCode: proc.status,
    success,
    total: tests.length,
    passed,
    failed,
    tests,
    rawOutput,
  };
}

function generateHtmlReport(reportData) {
  const { summary, suites, timestamp } = reportData;
  const passRate =
    summary.total > 0
      ? ((summary.passed / summary.total) * 100).toFixed(1)
      : "0.0";
  const overallBadgeColor = summary.success ? "#10B981" : "#EF4444";
  const overallBadgeText = summary.success ? "PASSED" : "FAILED";

  const suitesHtml = suites
    .map((suite, suiteIndex) => {
      const suiteBadgeColor = suite.success ? "#10B981" : "#EF4444";
      const suiteBadgeText = suite.success ? "PASS" : "FAIL";
      const testRowsHtml = suite.tests
        .map((t, tIndex) => {
          const isPass = t.status === "passed";
          const icon = isPass ? "✅" : "❌";
          const statusClass = isPass ? "status-pass" : "status-fail";
          const errorHtml = t.error
            ? `<div class="test-error">${escapeHtml(t.error)}</div>`
            : "";
          return `
          <tr class="test-row ${t.status}">
            <td class="test-status ${statusClass}">${icon} ${isPass ? "PASS" : "FAIL"}</td>
            <td class="test-name">${escapeHtml(t.name)}${errorHtml}</td>
          </tr>
        `;
        })
        .join("\n");

      return `
      <div class="suite-card" data-suite-id="${suiteIndex}">
        <div class="suite-header" onclick="toggleSuite(${suiteIndex})">
          <div class="suite-title-group">
            <span class="suite-badge" style="background-color: ${suiteBadgeColor}">${suiteBadgeText}</span>
            <h3 class="suite-title">${escapeHtml(suite.name)}</h3>
            <span class="suite-category">${escapeHtml(suite.category)}</span>
          </div>
          <div class="suite-meta">
            <span><strong>${suite.passed}</strong> / ${suite.total} passed</span>
            <span class="meta-separator">•</span>
            <span>${(suite.durationMs / 1000).toFixed(2)}s</span>
            <span class="accordion-arrow">▼</span>
          </div>
        </div>
        <div class="suite-body" id="suite-body-${suiteIndex}">
          <table class="test-table">
            <tbody>
              ${testRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Execution Report - HTML Standalone Tools</title>
  <style>
    :root {
      --bg-primary: #0F172A;
      --bg-secondary: #1E293B;
      --bg-card: #1E293B;
      --border-color: #334155;
      --text-primary: #F8FAFC;
      --text-secondary: #94A3B8;
      --accent-green: #10B981;
      --accent-red: #EF4444;
      --accent-blue: #38BDF8;
      --accent-yellow: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      padding: 2rem 1rem;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;
    }
    .header-title h1 { font-size: 1.75rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
    .header-title p { color: var(--text-secondary); font-size: 0.875rem; }
    .status-pill {
      font-size: 1rem;
      font-weight: 700;
      padding: 0.5rem 1.25rem;
      border-radius: 9999px;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .metric-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .metric-value { font-size: 1.75rem; font-weight: 700; color: #fff; }
    .metric-sub { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; }
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .filter-buttons { display: flex; gap: 0.5rem; }
    .filter-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .filter-btn.active, .filter-btn:hover {
      background: #334155;
      color: #fff;
      border-color: #64748B;
    }
    .search-input {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      width: 250px;
    }
    .search-input:focus { outline: 2px solid var(--accent-blue); border-color: transparent; }
    .suite-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .suite-card:hover { border-color: #475569; }
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      cursor: pointer;
      background: rgba(255,255,255,0.02);
      user-select: none;
    }
    .suite-title-group { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .suite-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      color: #fff;
      text-transform: uppercase;
    }
    .suite-title { font-size: 1.05rem; font-weight: 600; color: #fff; }
    .suite-category {
      background: #0F172A;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
    }
    .suite-meta { display: flex; align-items: center; gap: 0.75rem; color: var(--text-secondary); font-size: 0.875rem; }
    .meta-separator { opacity: 0.4; }
    .accordion-arrow { transition: transform 0.2s; font-size: 0.75rem; }
    .suite-card.collapsed .accordion-arrow { transform: rotate(-90deg); }
    .suite-card.collapsed .suite-body { display: none; }
    .suite-body { border-top: 1px solid var(--border-color); }
    .test-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .test-row { border-bottom: 1px solid rgba(255,255,255,0.04); }
    .test-row:last-child { border-bottom: none; }
    .test-row:hover { background: rgba(255,255,255,0.02); }
    .test-status { width: 90px; padding: 0.75rem 1.25rem; font-weight: 600; font-size: 0.75rem; }
    .status-pass { color: var(--accent-green); }
    .status-fail { color: var(--accent-red); }
    .test-name { padding: 0.75rem 1.25rem 0.75rem 0; color: #E2E8F0; }
    .test-error {
      margin-top: 0.35rem;
      padding: 0.5rem 0.75rem;
      background: rgba(239, 68, 68, 0.15);
      border-left: 3px solid var(--accent-red);
      color: #FCA5A5;
      font-family: monospace;
      font-size: 0.8rem;
      border-radius: 0.25rem;
      white-space: pre-wrap;
    }
    .footer {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.8rem;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-title">
        <h1>🧪 Test Execution Report</h1>
        <p>Executed on ${new Date(timestamp).toUTCString()} • Multi-Tool Standalone Suite</p>
      </div>
      <div class="status-pill" style="background-color: ${overallBadgeColor}">
        ${overallBadgeText}
      </div>
    </header>

    <div class="summary-grid">
      <div class="metric-card">
        <div class="metric-label">Pass Rate</div>
        <div class="metric-value" style="color: ${overallBadgeColor}">${passRate}%</div>
        <div class="metric-sub">${summary.passed} of ${summary.total} assertions passed</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Suites</div>
        <div class="metric-value">${suites.length}</div>
        <div class="metric-sub">${suites.filter((s) => s.success).length} passed, ${suites.filter((s) => !s.success).length} failed</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Assertions</div>
        <div class="metric-value">${summary.total}</div>
        <div class="metric-sub">${summary.failed} failure(s) recorded</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Duration</div>
        <div class="metric-value">${(summary.durationMs / 1000).toFixed(2)}s</div>
        <div class="metric-sub">Fast native VM execution</div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-buttons">
        <button class="filter-btn active" onclick="filterTests('all')">All Tests (${summary.total})</button>
        <button class="filter-btn" onclick="filterTests('passed')">Passed (${summary.passed})</button>
        <button class="filter-btn" onclick="filterTests('failed')">Failed (${summary.failed})</button>
      </div>
      <input type="text" id="searchInput" class="search-input" placeholder="Search assertions..." oninput="handleSearch()">
    </div>

    <div class="suites-container">
      ${suitesHtml}
    </div>

    <footer class="footer">
      Generated automatically by HTML Standalone Tools Test Engine • Zero-runtime dependencies
    </footer>
  </div>

  <script>
    function toggleSuite(id) {
      const card = document.querySelector('[data-suite-id="' + id + '"]');
      if (card) {
        card.classList.toggle('collapsed');
      }
    }

    function filterTests(status) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      const rows = document.querySelectorAll('.test-row');
      rows.forEach(row => {
        if (status === 'all' || row.classList.contains(status)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    function handleSearch() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('.test-row');
      rows.forEach(row => {
        const text = row.querySelector('.test-name').textContent.toLowerCase();
        if (text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

function generateJunitXml(reportData) {
  const { summary, suites } = reportData;
  const suiteXmls = suites
    .map((suite) => {
      const testcaseXmls = suite.tests
        .map((t) => {
          const failureXml =
            t.status === "failed"
              ? `<failure message="${escapeXml(t.error || "Assertion failed")}">${escapeXml(t.error || "")}</failure>`
              : "";
          return `    <testcase name="${escapeXml(t.name)}" classname="${escapeXml(suite.file)}" time="0.001">
      ${failureXml}
    </testcase>`;
        })
        .join("\n");

      return `  <testsuite name="${escapeXml(suite.name)}" tests="${suite.total}" failures="${suite.failed}" errors="0" time="${(suite.durationMs / 1000).toFixed(3)}">
${testcaseXmls}
  </testsuite>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="HTML Standalone Tools" tests="${summary.total}" failures="${summary.failed}" time="${(summary.durationMs / 1000).toFixed(3)}">
${suiteXmls}
</testsuites>`;
}

function appendGithubStepSummary(reportData) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const { summary, suites } = reportData;
  const statusBadge = summary.success
    ? "🟢 **ALL TESTS PASSED**"
    : "🔴 **TESTS FAILED**";
  const passRate =
    summary.total > 0
      ? ((summary.passed / summary.total) * 100).toFixed(1)
      : "0.0";

  let md = `## ${statusBadge}\n\n`;
  md += `> **Pass Rate:** \`${passRate}%\` | **Total Assertions:** \`${summary.total}\` | **Passed:** \`${summary.passed}\` | **Failed:** \`${summary.failed}\` | **Duration:** \`${(summary.durationMs / 1000).toFixed(2)}s\`\n\n`;
  md += `### 📊 Test Suite Breakdown\n\n`;
  md += `| Status | Test Suite | Category | Assertions | Passed | Failed | Duration |\n`;
  md += `| :---: | :--- | :--- | :---: | :---: | :---: | :---: |\n`;

  for (const suite of suites) {
    const icon = suite.success ? "✅" : "❌";
    md += `| ${icon} | **${suite.name}** | \`${suite.category}\` | ${suite.total} | ${suite.passed} | ${suite.failed} | ${(suite.durationMs / 1000).toFixed(2)}s |\n`;
  }

  md += `\n*Detailed HTML & JSON test reports are available in the downloadable workflow artifacts.*\n`;

  try {
    fs.appendFileSync(summaryFile, md, "utf8");
    console.log(`\n📝 Rendered test summary table to GITHUB_STEP_SUMMARY`);
  } catch (err) {
    console.warn(`⚠️ Failed to write to GITHUB_STEP_SUMMARY:`, err.message);
  }
}

async function main() {
  const startTime = Date.now();
  console.log("==================================================");
  console.log("🚀 HTML Standalone Tools - Unified Test Runner");
  console.log("==================================================");

  const suitesResults = [];
  let totalAssertions = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of TEST_SUITES) {
    const result = runSuite(suite);
    suitesResults.push(result);
    totalAssertions += result.total;
    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  const totalDurationMs = Date.now() - startTime;
  const allSuccess = suitesResults.every((s) => s.success);

  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalAssertions,
      passed: totalPassed,
      failed: totalFailed,
      durationMs: totalDurationMs,
      success: allSuccess,
    },
    suites: suitesResults,
  };

  // Ensure test-reports/ directory exists
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // 1. Write HTML report
  const htmlReportPath = path.join(REPORTS_DIR, "index.html");
  fs.writeFileSync(htmlReportPath, generateHtmlReport(reportData), "utf8");

  // 2. Write JSON report
  const jsonReportPath = path.join(REPORTS_DIR, "results.json");
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2), "utf8");

  // 3. Write JUnit XML report
  const junitXmlPath = path.join(REPORTS_DIR, "junit.xml");
  fs.writeFileSync(junitXmlPath, generateJunitXml(reportData), "utf8");

  // 4. Append GitHub Step Summary
  appendGithubStepSummary(reportData);

  console.log("\n==================================================");
  console.log(`📊 FINAL TEST RUN SUMMARY:`);
  console.log(`   Total Assertions: ${totalAssertions}`);
  console.log(`   Passed:           ${totalPassed}`);
  console.log(`   Failed:           ${totalFailed}`);
  console.log(`   Total Duration:   ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log(`   Report Artifacts: ${path.relative(ROOT_DIR, REPORTS_DIR)}/`);
  console.log(`     • ${path.basename(htmlReportPath)} (Interactive HTML)`);
  console.log(`     • ${path.basename(jsonReportPath)} (Structured JSON)`);
  console.log(`     • ${path.basename(junitXmlPath)} (Standard JUnit XML)`);
  console.log("==================================================\n");

  if (!allSuccess) {
    console.error("❌ Some tests failed.");
    process.exit(1);
  } else {
    console.log("✨ All test suites completed with 100% success!\n");
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Unexpected test runner failure:", err);
    process.exit(1);
  });
}

module.exports = {
  TEST_SUITES,
  runSuite,
  generateHtmlReport,
  generateJunitXml,
};
