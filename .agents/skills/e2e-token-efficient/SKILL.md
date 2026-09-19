---
name: e2e-token-efficient
description: "Token-efficient E2E and multi-device browser testing skill. Teaches autonomous agents how to execute Playwright and Lightpanda test suites with compact error aggregation, tool-scoped filtering, and lazy failure trace inspection."
---

# Token-Efficient E2E & Multi-Device Testing

This skill operationalizes the **Token Economics & E2E Testing Guardrails** defined in [ADR-0003](../../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md) and [Ways of Working (WoW)](../../docs/agents/ways-of-working.md).

It guides autonomous coding agents and human engineers on running E2E multi-device browser tests without consuming massive context window tokens (saving 30k–50k tokens per test run).

---

## 🎯 The Token Problem in E2E Testing

Standard Playwright CLI runs output hundreds of lines containing progress bars, ANSI terminal codes, worker allocation messages, and DOM dumps. When fed directly into an LLM context, a single test run can consume **30,000 to 50,000 tokens**.

To maximize agent code generation throughput and keep context windows lean:
1. **Always use compact summary runners** (`scripts/e2e-summary.js` / `bun run test:e2e:summary`).
2. **Execute tool-scoped tests during inner loops** (`--tool=<name>`).
3. **Practice lazy trace retrieval** — inspect only the specific ~5-line error snippet on failures, never full execution logs.

---

## ⚡ Runtime Preference: Bun for Speed

Always invoke E2E test commands using **`bun`** (`bun run test:e2e:summary`, `bun run test:e2e:<tool>`). Bun starts up instantly and orchestrates test runners with minimal CPU overhead.

---

## 🚦 When to Run E2E Testing (Phase & Tier Matrix)

Follow the Three-Tier Change Classification and Tool Lifecycle Phase:

| Change Tier / Tool Phase | E2E Requirement | Command |
| :--- | :--- | :--- |
| **Tier 0 (Docs-Only)** | ❌ None | None |
| **Tier 1 (Active Feature Development)** | ⚪ Optional | `bun run test:e2e:<tool>` |
| **Tier 1 (Hardened Stable)** | ✅ Mandatory (Tool-Scoped) | `node scripts/e2e-summary.js --tool=<tool>` |
| **Tier 2 (Full Ceremony / Release Gate)** | ✅ Mandatory (Full Suite) | `bun run test:e2e:summary` or `bun run verify` |

*Tool Lifecycle reference:* See [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md).

---

## 🛠️ Execution Commands & Tool Scoping

### 1. Compact Summary Runner (All Tools)

Runs Playwright across all projects (`desktop`, `android`, `iphone`, `ipad`) and aggregates output into a single-line pass signal:

```bash
bun run test:e2e:summary
# or: node scripts/e2e-summary.js
```

**Output on Success (~20 tokens):**
```text
✅ 204/204 passed (buy-rent: 28, habit: 48, portal: 32, predictor: 28, shadowing: 40, tracker: 28)
```

### 2. Scoped E2E Runner (Single Tool)

When modifying a specific tool, restrict execution to that tool's test specification using `--tool=<alias>`:

```bash
# Habit Tracker
bun run test:e2e:habit
# or: node scripts/e2e-summary.js --tool=habit

# English Shadowing
bun run test:e2e:shadowing
# or: node scripts/e2e-summary.js --tool=shadowing

# Smart Buy-List Price Tracker
bun run test:e2e:tracker
# or: node scripts/e2e-summary.js --tool=tracker

# Buy vs Rent Home Comparison
bun run test:e2e:buy-rent
# or: node scripts/e2e-summary.js --tool=buy-rent

# Personal Finance Savings Predictor
bun run test:e2e:predictor
# or: node scripts/e2e-summary.js --tool=predictor

# Portal Catalog Hub
bun run test:e2e:portal
# or: node scripts/e2e-summary.js --tool=portal
```

---

## 🔍 Lazy Log & Failure Trace Retrieval Protocol

When a test fails, the summary runner automatically formats failures with concise error traces (capped at max 5 lines per failure):

```text
❌ 1 failed: [habit:Swipe gesture test]

--- [habit] Swipe gesture test (iphone) ---
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: locator('[data-testid="toast-success"]')
Expected: visible
Received: <element(s) not found>
    ...
```

### Agent Rules for Failure Diagnostics:
1. **Inspect the truncated failure trace** provided in the runner output first.
2. **Detailed Troubleshooting Artifact**: Full Playwright JSON output is preserved at `test-reports/playwright-results.json`. Use `grep -n` or targeted slice reading on this file if deep locator/action details are needed.
3. **DO NOT dump whole report files** or large HTML pages into context.
4. If an issue is related to element selectors, inspect the relevant component source file or DOM fixture directly rather than dumping the full browser DOM.
5. If a test is flaky due to animations, verify CSS transitions or timeouts in `playwright.config.js`.

---

## 🐼 Lightpanda Integration & Ultra-Fast DOM Smoke Testing

For ultra-fast pre-commit and smoke verification without spinning up full Chromium/WebKit browser binaries:

1. **Lightpanda Smoke Suites**:
   - `tests/smart-buy-list-lightpanda-smoke.test.js` provides sub-second semantic DOM validation.
   - Run alongside unit tests: `bun run test:tracker:smoke`.
2. **Hybrid Strategy**:
   - **Inner Loop (Velocity)**: Unit test suite (`bun run test:<tool>`) + Lightpanda DOM smoke tests.
   - **Outer Loop (Fidelity)**: Playwright multi-device matrix via `scripts/e2e-summary.js`.

---

## 📋 Agent Verification Protocol Checklist

When completing an E2E testing task:
- [ ] Determine tool lifecycle phase from [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md).
- [ ] For scoped changes on `Hardened Stable` tools, run `node scripts/e2e-summary.js --tool=<name>`.
- [ ] Verify output is green: `✅ <n>/<n> passed`.
- [ ] For release/epic gates, run `bun run test:e2e:summary` across the complete repository matrix.
- [ ] Summarize test results in PR description with exact passed counts.
