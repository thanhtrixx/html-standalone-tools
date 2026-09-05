#!/usr/bin/env node

/**
 * Unified Quality Gate Verification Engine
 *
 * Runs formatting check (Prettier), compaction build pipeline (scripts/build.js),
 * and all automated test suites (scripts/run-tests.js) using the caller's active runtime.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const runtime = process.execPath;
const isBun = typeof process.versions.bun !== "undefined";

console.log(
  `\n🔍 Quality Gate Verification [Runtime: ${isBun ? "Bun " + process.versions.bun : "Node " + process.version}]`
);

// 1. Lint / Format Check (Prettier)
console.log("\n[1/3] Running Formatting Check (Prettier)...");
const prettierBin = path.join(
  ROOT_DIR,
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs"
);
let lintProc;
if (fs.existsSync(prettierBin)) {
  lintProc = spawnSync(runtime, [prettierBin, "--check", "."], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
} else {
  const runner = isBun ? "bunx" : "npx";
  lintProc = spawnSync(runner, ["prettier", "--check", "."], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
}

if (lintProc.status !== 0) {
  console.error("\n❌ Formatting check failed.");
  process.exit(lintProc.status || 1);
}

// 2. Build Pipeline
console.log("\n[2/3] Running Compaction Build Pipeline...");
const buildProc = spawnSync(
  runtime,
  [path.join(ROOT_DIR, "scripts", "build.js")],
  {
    cwd: ROOT_DIR,
    stdio: "inherit",
  }
);

if (buildProc.status !== 0) {
  console.error("\n❌ Build pipeline failed.");
  process.exit(buildProc.status || 1);
}

// 3. Test Runner
console.log("\n[3/3] Running Automated Test Suites...");
const testProc = spawnSync(
  runtime,
  [path.join(ROOT_DIR, "scripts", "run-tests.js")],
  {
    cwd: ROOT_DIR,
    stdio: "inherit",
  }
);

if (testProc.status !== 0) {
  console.error("\n❌ Automated tests failed.");
  process.exit(testProc.status || 1);
}

console.log("\n✨ Quality Gate Passed! All checks 100% green.");
