---
name: inner-loop-verification
description: "Sub-second, tool-scoped inner loop verification skill. Enforces strict execution of tool-scoped test suites (bun run test:<tool>), grep-first file navigation, and scoped formatting checks while strictly prohibiting whole-repo bun run verify in inner loops."
---

# Inner-Loop Verification & Token-First Development

This skill operationalizes the **Token Economics & Subagent Strategy** defined in [ADR-0003](../../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md) and [Ways of Working (WoW)](../../docs/agents/ways-of-working.md).

It guides autonomous agents and human engineers on conducting ultra-fast, high-throughput inner development loops while eliminating context-window bloat and token waste.

---

## ⚡ Runtime Preference: Bun for Speed

Always execute inner-loop commands using **`bun`** (`bun run <script>`, `bun test`). Bun provides sub-millisecond invocation startup, cutting test cycle latency by ~35–50% compared to Node. Use `npm` / `node` only when Bun is not available.

---

## 🎯 The Token Economics Problem in Inner Loops

Running full repository verification (`bun run verify`) or sweeping multi-file linters on every incremental code change is a major source of latency and token wastage:
- `bun run verify` builds all 5 standalone tools, runs 30 unit suites, and executes 204 multi-device Playwright tests, taking **~1.5–3 minutes** and dumping thousands of tokens of output.
- Sequential speculative `view_file` calls across monolithic files (>5,000 lines) consume thousands of tokens on unneeded markup.

To maintain maximum agent velocity and keep token consumption below budget:
1. **Always use tool-scoped runners** (`bun run test:<tool>`).
2. **Practice Grep-First line pinpointing** before reading files.
3. **Reserve full `bun run verify` exclusively for the outer PR/release gate**.

---

## ⚡ The 3-Step Inner Loop Protocol

```
1. Grep-First Navigation  ──►  2. Surgical Edit  ──►  3. Scoped Verification
   grep -n "function"            replace_file_content     bun run test:<tool>
   (Pinpoint exact line)         (Targeted diff block)    (<0.05s, ~15 lines output)
```

### Step 1: Grep-First File Navigation
Before viewing large files (>500 lines) like `english-shadowing/index.html` or `smart-buy-list-price-tracker/index.html`:
- Run a targeted `grep -n` command:
  ```bash
  grep -n "function setPlaybackSpeed" english-shadowing/index.html
  ```
- Use `view_file` with `StartLine` and `EndLine` covering *only* the specific $\pm 25$ line range around the discovered line number.
- **PROHIBITED**: Sequential multi-slice browsing without grepping first.

### Step 2: Surgical Edits
- Always use `replace_file_content` for contiguous blocks.
- Never use `write_to_file` whole-file overwrites for incremental modifications.

### Step 3: Tool-Scoped Verification
- Execute *only* the unit/DOM suite for the tool under active development using **`bun`**:

| Tool Directory | Inner-Loop Unit/DOM Command (Preferred) | Fallback Command | Execution Time | Output Size |
| :--- | :--- | :--- | :--- | :--- |
| `buy-vs-rent-home-comparison/` | `bun run test:buy-rent` | `npm run test:buy-rent` | ~0.05s | ~15 lines |
| `english-shadowing/` | `bun run test:shadowing` | `npm run test:shadowing` | ~0.04s | ~15 lines |
| `habit-tracker/` | `bun run test:habit` | `npm run test:habit` | ~0.06s | ~18 lines |
| `personal-finance-savings-predictor/` | `bun run test:sim` | `npm run test:sim` | ~0.04s | ~12 lines |
| `smart-buy-list-price-tracker/` | `bun run test:tracker` | `npm run test:tracker` | ~0.06s | ~20 lines |
| `portal/` | `bun run test:portal` | `npm run test:portal` | ~0.03s | ~10 lines |

---

## 🚫 Hard Invariants & Prohibitions

1. ❌ **STRICTLY PROHIBITED**: Running `bun run verify` or `npm run verify` in inner loops during active code editing or debugging.
2. ❌ **STRICTLY PROHIBITED**: Running full-repo `prettier --check .` during inner loops. Use scoped format checks:
   ```bash
   bunx prettier --check <tool-directory>/**
   # or: npx prettier --check <tool-directory>/**
   ```
3. ❌ **STRICTLY PROHIBITED**: Speculatively viewing >200 lines of files without line-number discovery via `grep -n`.
4. ❌ **STRICTLY PROHIBITED**: Running raw un-aggregated `playwright test` in inner loops (use `bun run test:e2e:<tool>` or `scripts/e2e-summary.js`).

---

## 🚦 Gate Transition to Outer Loop (Tier 2 / PR Creation)

Only after all tool-scoped inner tests pass:
1. Run scoped E2E if tool is `Hardened Stable`: `bun run test:e2e:<tool>`.
2. Run format fix: `bun run format`.
3. Run outer-gate verification **once** before opening PR: `bun run verify`.
4. Open PR via GitHub Flow.
