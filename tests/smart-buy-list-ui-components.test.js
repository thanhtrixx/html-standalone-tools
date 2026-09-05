#!/usr/bin/env node

/**
 * Smart Buy-List UI Interactions, Gestures, Navigation & Modals Test Suite
 * Domain: DOM & UI Interaction Ergonomics
 */

const { spawnSync } = require("child_process");
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
  "ui-vietnamese-omnibox.js",
];

let totalFailed = 0;

for (const sub of SUB_SUITES) {
  const fullPath = path.resolve(__dirname, "smart-buy-list", sub);
  const proc = spawnSync(process.execPath, [fullPath], {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8",
  });

  if (proc.stdout) process.stdout.write(proc.stdout);
  if (proc.stderr) process.stderr.write(proc.stderr);

  if (proc.status !== 0) {
    console.error(`❌ SUB-SUITE FAILED: ${sub} with exit code ${proc.status}`);
    totalFailed++;
  }
}

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
