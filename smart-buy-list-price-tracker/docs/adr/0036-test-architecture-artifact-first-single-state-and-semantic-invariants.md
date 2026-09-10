# ADR-0036: Test Architecture Upgrade — Artifact-First Testing, Single Source of Truth State Container, and Semantic Invariants

- **Status**: Accepted
- **Date**: 2026-09-10
- **Authors**: Core Engineering Team & Autonomous Agent
- **Deciders**: Tri Le
- **Consulted**: Ways of Working (WoW), Playwright / Lightpanda Architecture
- **Informed**: All Contributors

---

## Context & Problem Statement

During testing of `smart-buy-list-price-tracker`, several user-facing bugs escaped into release despite having $>2,000$ automated test assertions passing with 100% green status:
1. **Deal Badge Responsive Expansion Glitch**: On tablet/desktop ($\ge 640\text{px}$), deal badges failed to expand to show text labels (`🟡 Fair Price`) because Tailwind CSS purged `sm:inline`, and a rogue `.hidden { display: none !important; }` rule overrode media queries.
2. **Trip Completion Desynchronization**: Finalizing a shopping trip (`Complete Trip`) failed to show newly purchased items in the `Price History` ledger due to state divergence between the Redux `store` and legacy global `memoryState`.
3. **Invisible Unchecked Checkboxes in Buy Mode**: Unchecked checkboxes used `bg-transparent` on dark cards, making them invisible.

### Why Did 2,000+ Tests Miss These Bugs?
- **Hand-Rolled VM DOM Mocks (No CSS Engine)**: Fast unit tests ran in Node.js `vm` contexts with fake `document` mocks (`style: {}`, `setAttribute: () => {}`), lacking a real CSS layout and cascade engine.
- **String-Matching Anti-Pattern**: Tests asserted raw substring presence (`html.includes("bg-transparent ...")`), codifying author implementation strings as expected invariants rather than asserting visual contrast and touch targets.
- **Source Code Testing vs Production Artifact**: Tests imported raw JS source modules directly. The source contained `sm:inline`, so tests passed, but the compiled standalone artifact in `dist/` had the CSS purged by Tailwind.
- **Dual-State Model**: Redux `store` and global `memoryState` were tested in isolation; unit tests tested pure store actions without testing the full UI event wiring to table renders.

---

## Decision Drivers

- **Zero Regression Leakage**: Build-time purges, CSS cascade overrides, and state desync bugs must be caught before code can merge.
- **Two-Speed Testing**: Maintain sub-2s inner-loop speed for math and domain logic while enforcing rigorous, real-browser outer quality gates.
- **Single Source of Truth**: Eliminate dual-state drift by making `store.js` the sole state container.
- **Semantic Invariants**: Assert observable user requirements (DOM selectors, ARIA roles, touch targets $\ge 44\text{px}$, visual contrast) instead of source code string tokens.

---

## Considered Options

### 1. Target Testing Policy
- **Option 1A (Adopted)**: **Artifact-First Testing**. All DOM, UI, smoke, and E2E suites test the compiled, standalone production artifact (`dist/index.html` via local HTTP server). Pure domain math/codecs run directly as modules.
- **Option 1B**: Source-only testing with manual QA.

### 2. Application State Architecture
- **Option 2A (Adopted)**: **Single Source of Truth (`store.js` + UI Subscriptions)**. Migrate all UI modules to read exclusively from `store.getState()` and subscribe via `store.subscribe()`. Completely retire `memoryState`.
- **Option 2B**: Dual state with manual synchronization glue functions.

### 3. Test Invariant Standards
- **Option 3A (Adopted)**: **Semantic & Visual Invariant Assertions**. Refactor tests to assert semantic DOM state, accessibility attributes, computed styles, and multi-device viewport dimensions.
- **Option 3B**: String-matching tests only.

---

## Decision Outcome

1. **Artifact-First Testing**: `npm run verify` runs compaction build first, then serves `dist/` and runs Playwright across 4 device profiles (`android`, `iphone`, `ipad`, `desktop`).
2. **State Container Consolidation**: Unify application state in `store.js`. UI views subscribe directly to store changes.
3. **Semantic Test Invariants**: Test assertions check real DOM semantics (`role`, `aria-*`, `querySelector`, bounding box $\ge 44\text{px}$, contrast $\ge 4.5:1$).

---

## Consequences

### Positive
- Build-time CSS purging errors and cascade overrides are caught immediately in CI.
- Eliminates state desynchronization bugs permanently.
- Unit tests verify user requirements rather than implementation substrings.
- 4-device Playwright suite guarantees layout stability across Android, iPhone, iPad, and Desktop.

### Negative / Trade-offs
- Running the full verification gate takes ~10-15s (acceptable for PR checks, mitigated by fast inner-loop `npm run test:tracker`).
