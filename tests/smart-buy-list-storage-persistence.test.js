#!/usr/bin/env node

/**
 * Smart Buy-List Storage, Persistence, IndexedDB & Interchange Test Suite
 * Domain: State, Persistence & Migrations
 */

const { spawnSync } = require("child_process");
const path = require("path");

const SUB_SUITES = [
  "storage-core.js",
  "storage-indexeddb.js",
  "storage-clipboard.js",
  "storage-backup-settings.js",
  "storage-snapshots-backup-preview.js",
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
