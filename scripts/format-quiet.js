#!/usr/bin/env node
/**
 * format-quiet.js — Silent Prettier format check.
 *
 * Zero stdout on success. Lists only failing files on failure.
 * Exits non-zero when any file needs reformatting.
 *
 * Usage:
 *   bun run format:quiet
 *   node scripts/format-quiet.js
 *   node scripts/format-quiet.js --path "english-shadowing/**"  (scoped)
 */

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

// Parse optional --path argument for scoped checks
const args = process.argv.slice(2);
let checkPath = ".";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--path" && args[i + 1]) {
    checkPath = args[i + 1];
    i++;
  } else if (args[i].startsWith("--path=")) {
    checkPath = args[i].split("=").slice(1).join("=");
  }
}

// Run prettier --check silently, capture output
const result = spawnSync("npx", ["prettier", "--check", checkPath], {
  cwd: ROOT_DIR,
  encoding: "utf8",
  shell: false,
});

const exitCode = result.status ?? 1;

if (exitCode === 0) {
  // Success — zero output (the whole point)
  process.exit(0);
}

// Failure — extract only the "reformatting needed" file lines from prettier output
// Prettier --check prints: "Checking formatting...\n[filename]\n...\nCode style issues found in N files."
const output = (result.stdout || "") + (result.stderr || "");
const lines = output.split("\n");

// Prettier marks failing files with a plain path (no leading icon on --check)
// Filter: skip the "Checking formatting..." header and the summary line
const failingFiles = lines.filter((line) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("Checking formatting")) return false;
  if (trimmed.startsWith("All matched files")) return false;
  if (trimmed.startsWith("Code style issues")) return false;
  if (trimmed.startsWith("[warn]")) return false;
  return true;
});

if (failingFiles.length > 0) {
  console.error("❌ Prettier: files need reformatting:");
  failingFiles.forEach((f) => console.error(`   ${f.trim()}`));
} else {
  // Fallback: print raw output if we couldn't parse individual files
  console.error("❌ Prettier check failed:");
  console.error(output.trim());
}

process.exit(exitCode);
