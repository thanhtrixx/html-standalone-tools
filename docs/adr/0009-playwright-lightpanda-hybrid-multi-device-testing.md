# ADR-0009: Hybrid Multi-Device UI/UX Testing Architecture with Playwright and Lightpanda

> **Status:** Accepted

## Context

The repository provides zero-dependency, standalone, client-side HTML applications (`smart-buy-list-price-tracker`, `buy-vs-rent-home-comparison`, `personal-finance-savings-predictor`, `portal`). Previously, UI/UX automated testing relied on Node.js VM mock-DOM environments (`tests/ui-ux.test.js`, `tests/smart-buy-list-ui-components.test.js`).

While mock DOM tests are fast (<2s), they lack:

1. **Real Layout & Viewport Geometry**: Inability to detect horizontal page overflow (`scrollWidth > innerWidth`), clipped text, or responsive breakpoint regressions.
2. **Touch-Target & Accessibility Dimensions**: Inability to measure computed bounding boxes for minimum mobile touch targets (≥44×44px).
3. **Multi-Device Engine Parity**: Inability to assert rendering behavior across real browser engines (WebKit Mobile, Chromium Mobile, Tablet, Desktop).
4. **Visual Regression Baselines**: Lack of automated pixel-level snapshot verification across releases.

At the same time, running full browser engines for every granular unit or state test increases CI duration and developer inner-loop cycle times.

## Decision

We adopt a **Two-Tier Hybrid Testing Strategy** leveraging the complementary capabilities of **Lightpanda** and **Playwright**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Two-Speed Test Pipeline                         │
├──────────────────────────────────┬─────────────────────────────────────┤
│   Tier 1: Lightpanda / VM        │   Tier 2: Playwright Multi-Device   │
│   (Inner Loop: npm test)         │   (Outer Gate: npm run test:e2e)    │
├──────────────────────────────────┼─────────────────────────────────────┤
│ • Sub-second headless execution  │ • Real rendering across 4 devices   │
│ • State transitions & math flows │ • Viewport overflow detection       │
│ • Bilingual dictionary parity    │ • Touch target size verification    │
│ • Form validation contracts      │ • Visual screenshot diffing         │
│ • Zero browser launch overhead   │ • Real WebKit/Chromium engines      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### 1. Lightpanda Responsibilities (Fast Inner Loop)

- Ultra-fast headless DOM tree inspection (`tree`, `findElement`, `interactiveElements`).
- Bilingual string completeness & translation key symmetry (EN ↔ VI).
- Calculation state updates and input sanitization smoke tests.
- JavaScript console log inspection for runtime error detection.

### 2. Playwright Responsibilities (Multi-Device Outer Gate)

- Dedicated runner `@playwright/test` targeting four standardized device profiles:
  1. 📱 **Android**: `Pixel 7` (Chromium Mobile, 412 × 915)
  2. 🍎 **iPhone**: `iPhone 14 Pro` (WebKit Mobile, 393 × 852)
  3. 📱 **iPad**: `iPad Pro 11` (WebKit Tablet, 834 × 1194)
  4. 💻 **Desktop**: `Desktop Chrome` (Chromium Desktop, 1280 × 800)
- Automated assertion of critical UI/UX invariants:
  - **Zero Horizontal Overflow**: `document.body.scrollWidth <= window.innerWidth` across all viewports.
  - **Accessible Touch Sizing**: Mobile interactive controls (tabs, primary action buttons, checkboxes) meet ≥44×44px hit areas.
  - **Bilingual Visual Stability**: Switching between English and Vietnamese preserves card bounds without clipping or layout shifts.
  - **Visual Regression Snapshots**: Snapshot comparisons (`toHaveScreenshot()`) per device profile.

### 3. Playwright MCP Server Integration

- Configure `@executeautomation/playwright-mcp-server` in `mcp_config.json` alongside Lightpanda.
- Enables AI agents to interactively launch real browser sessions, inspect computed styles, capture visual screenshots, and debug layout defects live during pair-programming sessions.

### 4. Phased Rollout

- **Phase 1 Pilot**: Focus initial test suite implementation on `smart-buy-list-price-tracker` (mobile-first grocery PWA).
- **Phase 2 Expansion**: Expand multi-device coverage to `buy-vs-rent-home-comparison`, `personal-finance-savings-predictor`, and `portal`.

## Consequences

### Positive

- **Guaranteed Mobile & Tablet Quality**: Eliminates responsive layout bugs, clipped translations, and unclickable touch targets before merging.
- **Fast Developer Inner Loop**: Preserves sub-second local test execution while gating PRs and releases on real browser rendering.
- **AI-Driven Visual Diagnostics**: Allows AI coding agents to launch Playwright via MCP for interactive UI debugging and visual validation.

### Negative / Trade-offs

- Playwright requires local browser binary installations (`npx playwright install --with-deps`) on developer machines and in CI workflows.
