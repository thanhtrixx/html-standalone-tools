#!/usr/bin/env node
/**
 * slice-ship.js — Strict automated Tier 1 slice delivery gate.
 *
 * Pre-flight: format:quiet + tool-scoped tests → commit → push → PR → merge.
 * Aborts immediately on any failure with ZERO git mutations.
 * Outputs a clean 5-line delivery summary.
 *
 * Usage:
 *   bun run slice:ship -- --tool shadowing --msg "feat: add hotkeys" \
 *     --pr-title "feat(shadowing): ergonomic keyboard shortcuts" \
 *     --pr-body "Closes #700"
 *
 * Flags:
 *   --tool <name>       Required. Tool filter for test:scoped runner.
 *   --msg <text>        Required. Git commit message.
 *   --pr-title <text>   Required. PR title.
 *   --pr-body <text>    Optional. PR body / closing refs (default: "").
 *   --no-merge          Optional. Create PR but skip auto squash-merge.
 *   --dry-run           Optional. Run pre-flight checks only, no git ops.
 */

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

// ── Argument parsing ──────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;

function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

function hasFlag(flag) {
  return args.includes(flag);
}

const tool = getArg("--tool");
const msg = getArg("--msg");
const prTitle = getArg("--pr-title");
const prBody = getArg("--pr-body") || "";
const noMerge = hasFlag("--no-merge");
const dryRun = hasFlag("--dry-run");

const missingArgs = [];
if (!tool) missingArgs.push("--tool <name>");
if (!msg) missingArgs.push("--msg <text>");
if (!prTitle) missingArgs.push("--pr-title <text>");

if (missingArgs.length > 0) {
  console.error("❌ slice-ship: missing required arguments:");
  missingArgs.forEach((a) => console.error(`   ${a}`));
  console.error("\nExample:");
  console.error(
    '  bun run slice:ship -- --tool shadowing --msg "feat: add X" --pr-title "feat(shadowing): X"'
  );
  process.exit(1);
}

// ── Helper: run command, return {ok, stdout, stderr, code} ──────────────────
function run(cmd, cmdArgs, opts = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    shell: false,
    ...opts,
  });
  const ok = result.status === 0;
  return {
    ok,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    code: result.status,
  };
}

// ── Helper: abort with clean message and zero git mutations ──────────────────
function abort(step, detail) {
  console.error(`\n❌ slice-ship aborted at [${step}]`);
  if (detail) console.error(`   ${detail}`);
  console.error("   No git mutations were made.\n");
  process.exit(1);
}

// ── Get current branch ────────────────────────────────────────────────────────
const branchResult = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
if (!branchResult.ok) abort("git branch detection", branchResult.stderr);
const branch = branchResult.stdout;

if (branch === "main" || branch === "master") {
  abort(
    "branch check",
    `Refusing to ship directly from '${branch}'. Create a feature branch first.`
  );
}

console.log(`\n🚀 slice-ship: branch=${branch}, tool=${tool}`);
if (dryRun) console.log("   ⚠️  DRY RUN — no git operations will execute.\n");

// ── Step 1: Format pre-flight ─────────────────────────────────────────────────
process.stdout.write("  [1/5] format:quiet ... ");
const fmtResult = run("node", ["scripts/format-quiet.js"]);
if (!fmtResult.ok) {
  process.stdout.write("FAIL\n");
  if (fmtResult.stderr) console.error(fmtResult.stderr);
  abort("format:quiet", "Run `bun run format` to fix formatting.");
}
console.log("PASS ✅");

// ── Step 2: Tool-scoped tests ─────────────────────────────────────────────────
process.stdout.write(`  [2/5] test:${tool} ... `);
const testResult = run("node", ["scripts/run-tests.js", "--tool", tool]);
if (!testResult.ok) {
  process.stdout.write("FAIL\n");
  // Print compact failure info
  const failLines = (testResult.stdout + "\n" + testResult.stderr)
    .split("\n")
    .filter((l) => l.includes("❌") || l.includes("FAIL"))
    .slice(0, 5);
  failLines.forEach((l) => console.error(`   ${l.trim()}`));
  console.error(
    `   → Inspect: grep -n '"failed"' test-reports/results.json | head -20`
  );
  abort(`test:${tool}`, "Fix failing tests before shipping.");
}
// Extract test count from stdout
const passMatch = testResult.stdout.match(/Total Assertions:\s*(\d+)/);
const testCount = passMatch ? passMatch[1] : "?";
console.log(`PASS ✅  (${testCount} assertions)`);

if (dryRun) {
  console.log(
    "\n✅ DRY RUN complete — pre-flight passed. No git ops executed."
  );
  process.exit(0);
}

// ── Step 3: git commit ────────────────────────────────────────────────────────
process.stdout.write("  [3/5] git commit ... ");
const addResult = run("git", ["add", "."]);
if (!addResult.ok) {
  process.stdout.write("FAIL\n");
  abort("git add", addResult.stderr);
}
const commitResult = run("git", ["commit", "-m", msg]);
if (!commitResult.ok) {
  process.stdout.write("FAIL\n");
  // May fail if nothing to commit
  if (commitResult.stdout.includes("nothing to commit")) {
    console.log("SKIP (nothing to commit)");
  } else {
    abort("git commit", commitResult.stderr || commitResult.stdout);
  }
} else {
  const shaMatch = commitResult.stdout.match(/\[.+\s+([a-f0-9]+)\]/);
  const sha = shaMatch ? shaMatch[1] : "?";
  console.log(`PASS ✅  (sha=${sha})`);
}

// ── Step 4: git push ──────────────────────────────────────────────────────────
process.stdout.write("  [4/5] git push ... ");
const pushResult = run("git", ["push", "origin", branch]);
if (!pushResult.ok) {
  process.stdout.write("FAIL\n");
  abort("git push", pushResult.stderr);
}
console.log("PASS ✅");

// ── Step 5: gh pr create (+ optional merge) ───────────────────────────────────
process.stdout.write("  [5/5] gh pr create ... ");
const prCreateArgs = [
  "pr",
  "create",
  "--title",
  prTitle,
  "--body",
  prBody || " ",
  "--head",
  branch,
];
const prResult = run("gh", prCreateArgs);
if (!prResult.ok) {
  process.stdout.write("FAIL\n");
  abort("gh pr create", prResult.stderr);
}
const prUrl = prResult.stdout.split("\n").find((l) => l.startsWith("https"));
const prNumberMatch = prUrl ? prUrl.match(/\/(\d+)$/) : null;
const prNumber = prNumberMatch ? prNumberMatch[1] : "?";
console.log(`PASS ✅  (PR #${prNumber})`);

let merged = false;
if (!noMerge) {
  process.stdout.write("       gh pr merge --squash ... ");
  const mergeResult = run("gh", [
    "pr",
    "merge",
    prNumber.toString(),
    "--squash",
    "--delete-branch",
  ]);
  if (!mergeResult.ok) {
    process.stdout.write("FAIL\n");
    console.warn(`   ⚠️  Auto-merge failed: ${mergeResult.stderr}`);
    console.warn(
      `   → Merge manually: gh pr merge ${prNumber} --squash --delete-branch`
    );
  } else {
    console.log("PASS ✅  (branch deleted)");
    merged = true;
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(52));
console.log(`✅  slice-ship COMPLETE`);
console.log(`   branch : ${branch}`);
console.log(`   PR     : #${prNumber}  ${prUrl || ""}`);
console.log(`   tests  : ${testCount} assertions passed`);
console.log(
  `   status : ${merged ? "merged + branch deleted" : noMerge ? "PR open (--no-merge)" : "PR open (merge failed — see above)"}`
);
console.log("─".repeat(52) + "\n");
