#!/usr/bin/env node

/**
 * Smart Buy-List Multi-Cloud Sync, Concurrency & Resiliency Test Suite
 * Domain: Multi-Cloud Concurrency & Conflict Resolution
 */

const { spawnSync } = require("child_process");
const path = require("path");

const SUB_SUITES = [
  "cloud-sync-drive.js",
  "cloud-sync-concurrency.js",
  "cloud-sync-calm.js",
  "cloud-sync-gist-resiliency.js",
  "cloud-sync-ambient-header.js",
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
    totalFailed++;
  }
}

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
