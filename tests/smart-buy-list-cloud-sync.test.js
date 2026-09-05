#!/usr/bin/env node

/**
 * Smart Buy-List Multi-Cloud Sync, Concurrency & Resiliency Test Suite
 * Domain: Multi-Cloud Concurrency & Conflict Resolution
 */

const { spawn } = require("child_process");
const path = require("path");

const SUB_SUITES = [
  "cloud-sync-drive.js",
  "cloud-sync-concurrency.js",
  "cloud-sync-calm.js",
  "cloud-sync-gist-resiliency.js",
  "cloud-sync-ambient-header.js",
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
  const results = await Promise.all(SUB_SUITES.map(runSubSuite));

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
