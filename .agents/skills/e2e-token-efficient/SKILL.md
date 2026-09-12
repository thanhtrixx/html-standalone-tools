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
1. **Always use compact summary runners** (`scripts/e2e-summary.js` / `npm run test:e2e:summary`).
2. **Execute tool-scoped tests during inner loops** (`--tool=<name>`).
3. **Practice lazy trace retrieval** — inspect only the specific ~5-line error snippet on failures, never full execution logs.

---

## 🚦 When to Run E2E Testing (Phase & Tier Matrix)

Follow the Three-Tier Change Classification and Tool Lifecycle Phase:

| Change Tier / Tool Phase | E2E Requirement | Command |
| :--- | :--- | :--- |
| **Tier 0 (Docs-Only)** | ❌ None | None |
| **Tier 1 (Active Feature Development)** | ⚪ Optional | `npm run test:e2e:<tool>` |
| **Tier 1 (Hardened Stable)** | ✅ Mandatory (Tool-Scoped) | `node scripts/e2e-summary.js --tool=<tool>` |
| **Tier 2 (Full Ceremony / Release Gate)** | ✅ Mandatory (Full Suite) | `npm run test:e2e:summary` or `npm run verify` |

*Tool Lifecycle reference:* See [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md).

---

## 🛠️ Execution Commands & Tool Scoping

### 1. Compact Summary Runner (All Tools)

Runs Playwright across all projects (`desktop`, `android`, `iphone`, `ipad`) and aggregates output into a single-line pass signal:

```bash
npm run test:e2e:summary
# or: node scripts/e2e-summary.js
```

**Output on Success (~20 tokens):**
```text
✅ 144/144 passed (buy-rent: 28, habit: 28, portal: 32, predictor: 28, tracker: 28)
```

### 2. Scoped E2E Runner (Single Tool)

When modifying a specific tool, restrict execution to that tool's test specification using `--tool=<alias>`:

```bash
# Habit Tracker
node scripts/e2e-summary.js --tool=habit

# Smart Buy-List Price Tracker
node scripts/e2e-summary.js --tool=tracker

# Buy vs Rent Home Comparison
node scripts/e2e-summary.js --tool=buy-rent

# Personal Finance Savings Predictor
node scripts/e2e-summary.js --tool=predictor

# Portal Catalog Hub
node scripts/e2e-summary.js --tool=portal
```

*Direct npm scripts also available:*
```bash
npm run test:e2e:habit
npm run test:e2e:tracker
npm run test:e2e:buy-rent
npm run test:e2e:predictor
npm run test:e2e:portal
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
1. **Inspect ONLY the truncated failure trace** provided in the runner output.
2. **DO NOT read `playwright-report/index.html`** or raw JSON blobs into context.
3. If an issue is related to element selectors, inspect the relevant component source file or DOM fixture directly rather than dumping the full browser DOM.
4. If a test is flaky due to animations, verify CSS transitions or timeouts in `playwright.config.js`.

---

## 🐼 Lightpanda Integration & Ultra-Fast DOM Smoke Testing

For ultra-fast pre-commit and smoke verification without spinning up full Chromium/WebKit browser binaries:

1. **Lightpanda Smoke Suites**:
   - `tests/smart-buy-list-lightpanda-smoke.test.js` provides sub-second semantic DOM validation.
   - Run alongside unit tests: `npm run test:tracker:smoke`.
2. **Hybrid Strategy**:
   - **Inner Loop (Velocity)**: Unit test suite (`npm run test:<tool>`) + Lightpanda DOM smoke tests.
   - **Outer Loop (Fidelity)**: Playwright multi-device matrix via `scripts/e2e-summary.js`.

---

## 📋 Agent Verification Protocol Checklist

When completing an E2E testing task:
- [ ] Determine tool lifecycle phase from [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md).
- [ ] For scoped changes on `Hardened Stable` tools, run `node scripts/e2e-summary.js --tool=<name>`.
- [ ] Verify output is green: `✅ <n>/<n> passed`.
- [ ] For release/epic gates, run `npm run test:e2e:summary` across the complete repository matrix.
- [ ] Summarize test results in PR description with exact passed counts.
