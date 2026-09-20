---
name: token-economics
description: "Token-efficient agent workflows for this repo. Covers 4 hotspot rules (format stdout, test noise, monolithic file navigation, multi-turn ceremony), mandatory grep-first patterns, quiet test runner, slice-inspect, and slice-ship delivery gate. Read when optimizing token spend or shipping a Tier 1 slice."
---

# Token Economics — Hotspot Elimination & Surgical Workflows

Operationalizes the four token hotspots identified in the Milestone 9 retrospective.
Cross-reference: [inner-loop-verification](../inner-loop-verification/SKILL.md) for scoped test gate rules.

---

## Hotspot 1 — Format stdout wall (90% reducible)

**Problem**: `bun run format:check` (raw Prettier) enumerates every file in the repo (~300+ lines) even on success.

**Fix**: Use the quiet wrapper instead.

```bash
# ✅ Agent-safe — zero output on success, only failing files on error
bun run format:quiet

# Scoped to one tool directory
node scripts/format-quiet.js --path "english-shadowing/**"

# ❌ PROHIBITED in agent inner loops — floods context with 300+ lines
bun run format:check
prettier --check .
```

---

## Hotspot 2 — Test noise (91% reducible)

**Problem**: `IndexedDB not available` warns flood from VM-context tests (18+ lines per run). Stack traces dump 10–20 lines each.

**Fix**: Run with `--quiet` flag or set `AGENT_QUIET=1` to activate stderr filtering in `run-tests.js`.

```bash
# ✅ Quiet mode — strips IndexedDB warns, limits stacks to 3 lines
bun run test:shadowing -- --quiet

# ✅ Via env var (useful when test:* aliases don't pass flags through)
AGENT_QUIET=1 bun run test:shadowing

# Failure diagnostics — grep first, never dump the full file
grep -n '"failed"' test-reports/results.json | head -20
```

**When test fails**: `run-tests.js` always writes `test-reports/results.json`. Inspect it surgically:

```bash
# Find the failing test name
grep -n '"status": "failed"' test-reports/results.json | head -10
# Read only the surrounding slice (±15 lines around the match line number)
```

---

## Hotspot 3 — Monolithic file navigation (58% reducible)

**Problem**: `english-shadowing/index.html` is 20,500+ lines. Wide `view_file` calls without anchoring waste thousands of tokens.

**Rule**: Grep-first on any file >500 lines. Never open >200 lines without a line-number anchor.

### Pattern A — grep anchor (fastest)

```bash
# Pinpoint the function start line
grep -n "function handleGlobalKeydown" english-shadowing/index.html
# → e.g., 19843:  function handleGlobalKeydown(e) {

# Then read only the target window
# view_file StartLine=19840 EndLine=19870
```

### Pattern B — slice-inspect (full block extraction)

When you need the complete function body for `replace_file_content`:

```bash
bun run slice:inspect -- english-shadowing/index.html handleGlobalKeydown
```

Output (structured Markdown):
```
## handleGlobalKeydown
**File:** english-shadowing/index.html
**Lines:** 19843–19912 (70 lines)

```js
function handleGlobalKeydown(e) {
  ...
}
```
```

Use `startLine`/`endLine` from the **Lines:** metadata directly in `replace_file_content` — no wide reads needed.

**Supported symbol patterns**:
- `function foo(` / `async function foo(`
- `const foo = (` / `const foo = async (`
- `const foo = function(` / `class Foo {`

---

## Hotspot 4 — Multi-turn CLI ceremony (62% reducible)

**Problem**: Sequential format-check → test → commit → push → PR → merge requires 5–6 separate tool calls and repeated terminal outputs.

**Fix**: Use `slice-ship.js` for Tier 1 Scoped Lightweight changes.

```bash
bun run slice:ship -- \
  --tool shadowing \
  --msg "feat(shadowing): ergonomic hotkeys" \
  --pr-title "feat(shadowing): ergonomic keyboard shortcuts" \
  --pr-body "Closes #700"
```

**Gate sequence** (abort-on-fail, zero git mutations before commit):
1. `format:quiet` — format pre-flight
2. `test:<tool>` — scoped unit tests
3. `git add . && git commit -m "..."` — only if both pass
4. `git push origin <branch>`
5. `gh pr create` → `gh pr merge --squash --delete-branch`

**Output**: Clean 5-line summary (branch, PR #, test count, status).

**Flags**:
- `--dry-run` — run pre-flight only, no git ops (safe to test the gate)
- `--no-merge` — create PR but skip auto-merge

**Safety invariant**: Never run `slice-ship` from `main`/`master` — it hard-aborts.

---

## Compound command idiom

Collapse format + test into one tool call:

```bash
bun run format:quiet && bun run test:shadowing -- --quiet
```

One tool call, ≤25 lines output on success (just the per-suite pass lines + summary).

---

## Quick reference

| Task | Preferred command | Prohibited |
|:-----|:-----------------|:-----------|
| Format check | `bun run format:quiet` | `bun run format:check` / `prettier --check .` |
| Scoped tests | `bun run test:<tool> -- --quiet` | `bun run verify` |
| Symbol lookup | `bun run slice:inspect -- <file> <sym>` | Wide `view_file` without grep |
| Tier 1 delivery | `bun run slice:ship -- --tool <t> ...` | Manual 5-step ceremony |
| Failure drill | `grep -n '"failed"' test-reports/results.json` | Dump whole JSON |
