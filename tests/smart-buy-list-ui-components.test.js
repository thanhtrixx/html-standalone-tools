#!/usr/bin/env node

/**
 * Smart Buy-List UI Interactions, Gestures, Navigation & Modals Test Suite
 * Domain: DOM & UI Interaction Ergonomics
 */

const { spawn } = require("child_process");
const path = require("path");

const SUB_SUITES = [
  "ui-navigation-gestures.js",
  "ui-material-you.js",
  "ui-cards-differentiated.js",
  "ui-stores-grouping.js",
  "ui-history-reorder.js",
  "ui-ledger-delete-prefill.js",
  "ui-planning-completion.js",
  "ui-pacing-polish.js",
  "ui-trip-lifecycle.js",
  "ui-v3-11-enhancements.js",
  "ui-v3-12-enhancements.js",
  "ui-v3-13-enhancements.js",
  "ui-v4-2-remediation.js",
  "ui-v4-3-enhancements.js",
  "ui-vietnamese-omnibox.js",
  "ui-smart-merge-review.js",
];

async function runSubSuite(sub) {
  const fullPath = path.resolve(__dirname, "smart-buy-list", sub);
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [fullPath], {
      cwd: path.resolve(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    proc.on("close", (status) => {
      resolve({ sub, status, stdout, stderr });
    });
  });
}

async function main() {
  const concurrency = 6;
  const results = new Array(SUB_SUITES.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < SUB_SUITES.length) {
      const idx = currentIndex++;
      results[idx] = await runSubSuite(SUB_SUITES[idx]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, SUB_SUITES.length) },
    () => worker()
  );
  await Promise.all(workers);

  let totalFailed = 0;
  for (const res of results) {
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    if (res.status !== 0) {
      console.error(
        `❌ SUB-SUITE FAILED: ${res.sub} with exit code ${res.status}`
      );
      totalFailed++;
    }
  }

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
