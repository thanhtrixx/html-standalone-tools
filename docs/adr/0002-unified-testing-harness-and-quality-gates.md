# ADR-0002: Unified Testing Harness, Quality Gates, and Anti-Tautological Invariants

> **Status:** Accepted  
> **Supersedes:** Legacy Global ADRs 0005, 0009, 0011

---

## Context

To ensure robust reliability without sacrificing speed:

1. **Multi-Format Test Runner**: We need consistent execution of domain unit tests, state invariant checks, localization audits, and browser E2E suites across all tools.
2. **Elimination of Tautological Mocks**: Historically, mock element stubs in Node `vm` tested mock implementations rather than real DOM rendering, event propagation, or calculations.
3. **Multi-Device E2E Matrix**: Standalone applications must be validated against real viewport configurations (Desktop 1280×800, Tablet 768×1024, Mobile 375×667) using Playwright.
4. **Token-Efficient E2E Aggregation**: Raw Playwright output can dump 30k–50k tokens of browser logs. A compact reporter aggregates outcomes into one-line actionable digests.

---

## Decisions

### 1. Unified Test Runner Architecture (`scripts/run-tests.js`)

- Supports running individual tool suites (`npm run test:<tool>`) or repository-wide suites (`npm test`).
- Exposes structured reporting formats (`--reporter=compact`, `--reporter=json`, `--reporter=tap`) for CLI readability and machine parsing.

### 2. Anti-Tautological Invariant Testing

- **Artifact-First Testing**: Tests evaluate the real compacted distribution HTML (`dist/<tool>/index.html`) or actual DOM bindings using JSDOM / real browser contexts.
- **Pure Engine Isolation**: Financial math, deal algorithms, and data converters are tested as pure functions with deterministic input/output tables.
- **Strict Prohibition of Ad-hoc DOM Stubs**: No hand-rolled stubbed `querySelector` or dummy `addEventListener` in unit suites.

### 3. Multi-Device Playwright Matrix

- Every stable tool undergoes E2E validation across Desktop, Tablet, and Mobile viewport presets with touch event emulation.
- Verifies interactive journeys: input masking, slider reactivity, canvas rendering (Chart.js), modal focus trapping, touch gestures, and responsive layouts.

### 4. E2E Summary Aggregation (`scripts/e2e-summary.js`)

- Playwright test runs are wrapped by an error aggregator that outputs compact summaries (e.g. `✅ 144/144 passed` or `❌ 3 failed: [details]`), saving ~30k+ tokens during agent turns. Detailed traces are loaded only on failure.

---

## Consequences

- **Positive**: High test fidelity, zero mock leakage, immediate detection of visual or layout regressions across form factors.
- **Trade-off**: Running full multi-browser Playwright suites requires local browser binaries (`npx playwright install`), reserved for outer-gate verification before PR merge.
