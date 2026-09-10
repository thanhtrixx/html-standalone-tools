# 0011. Multi-Tool Playwright E2E Quality Gate, Real DOM Harnessing, and Tautological Test Pruning

Date: 2026-09-11

## Status

Accepted

## Context & Problem Statement

Historically, regression bugs and visual layout flaws have escaped into releases or required multiple feedback loops to fix, despite the test suite reporting 100% green passing rates across 2,600+ assertions.

An in-depth audit of the repository's test suites revealed several foundational flaws:

1. **Tautological DOM Mocks in Node `vm`**: Test suites for `personal-finance-savings-predictor` (`ui-ux.test.js`) and `buy-vs-rent-home-comparison` (`buy-vs-rent-ui-i18n.test.js`) relied on hand-rolled mock element objects where `addEventListener` was a no-op stub, `querySelector` merely stripped `#` and `.`, and DOM queries were simulated with ad-hoc regexes against `innerHTML`. These tests tested the mock itself rather than real DOM reactivity, event propagation, or rendering behavior.
2. **E2E Blindspots**: While `smart-buy-list-price-tracker` possessed comprehensive 4-device Playwright coverage, `personal-finance-savings-predictor` and `buy-vs-rent-home-comparison` had zero Playwright E2E coverage. Real user journeys (currency thousand-separator input masking, sliders, Chart.js canvas rendering, modal backdrop light dismissal, URL state compression/decompression across page reload, and responsive mobile viewport overflow) were never verified in real browser engines.
3. **Low-Value & Brittle String Assertions**: Multiple smoke test suites performed dozens of raw HTML string/regex searches (e.g. `rawHtml.includes('id="xyz"')`) rather than asserting interactive accessibility and visible component behavior.
4. **Runner Output Fragility**: `scripts/run-tests.js` parsed test pass/fail states via text regex matching of `stdout`, creating vulnerability to silent errors or unhandled promise rejections if not explicitly reported as a failure string.

## Decision Drivers

- **Zero False Greens**: Ensure that passing tests guarantee real-world browser correctness and eliminate tautological mock tests.
- **100% Tool E2E Coverage**: Verify all tools (`smart-buy-list`, `savings-predictor`, `buy-vs-rent`, `portal`) across 4 standard device profiles (Pixel 7 Android, iPhone 14 Pro, iPad Pro 11, Desktop Chrome).
- **High Signal-to-Noise Ratio**: Prune negative-ROI mock tests and brittle static regex checks while preserving 100% of pure mathematical and financial invariant tests.
- **Strict Two-Speed Quality Gate**: Fast sub-second inner loop for pure domain unit tests (`npm test` / `npm run test:<tool>`) coupled with a comprehensive outer verification gate (`npm run verify`).

## Considered Options

- **Option 1**: Keep existing Node `vm` mocks and patch missing mock stubs incrementally. (Rejected: Fails to catch real browser layout, event bubbling, and CSS rendering bugs).
- **Option 2**: Expand Playwright E2E coverage across all tools, modernize inner-loop DOM tests with real DOM/JSDOM harnesses, prune tautological mock tests, and enforce the Two-Speed quality gate. (Selected).

## Decision Outcome

We decided to adopt **Option 2**:

1. **Playwright Multi-Device Coverage for All Standalone Tools**:
   - Scaffold dedicated E2E specs under `tests/e2e/`:
     - `tests/e2e/smart-buy-list-devices.spec.js` (Harden existing shopping workflow, touch targets, and offline sync).
     - `tests/e2e/savings-predictor-devices.spec.js` (New: Test currency masks, verbal helpers, sliders, scenario workbench, Chart.js canvas rendering, modal lifecycle, and LZ-String URL state sharing).
     - `tests/e2e/buy-vs-rent-devices.spec.js` (New: Test dual-phase mortgage inputs, sensitivity matrix, opportunity cost charts, tooltip popovers, AI decision dossier, and responsive layout).
     - `tests/e2e/portal-devices.spec.js` (New: Test catalog navigation, dark/light theme switching, and language toggle).
2. **Prune Low-Value & Tautological Tests**:
   - Remove hand-rolled mock object property assertions that test mock logic rather than application behavior.
   - Replace brittle static HTML string/regex checks in smoke suites with semantic Playwright visibility and accessibility assertions.
   - Consolidate duplicate i18n key parity checks into single authoritative per-tool i18n suites.
3. **Preserve & Harden Pure Mathematical Invariant Suites**:
   - Maintain 100% of mathematical simulation tests (`simulation.test.js`, `buy-vs-rent-simulation.test.js`, `smart-buy-list-engine-math.test.js`).
   - Add explicit regression seam test suites for historical bug hotspots (e.g. currency formatting across locales, modal backdrop dismissal, trip completion synchronization).
4. **Harden Test Runner & Quality Gate**:
   - Upgrade `scripts/run-tests.js` to assert zero unhandled promise rejections and clean process termination.
   - Enforce `npm run verify` as the mandatory pre-PR and pre-release quality gate executing formatting checks, compaction build, unit suites, and full Playwright multi-device suites.

## Consequences

### Positive

- Prevents regressions and layout bugs from escaping to releases.
- Eliminates brittle tests that fail on minor whitespace or formatting changes.
- Accelerates inner-loop testing while providing high-confidence outer-gate browser verification.
- Guarantees seamless multi-device responsiveness (Android, iOS, iPad, Desktop) across all standalone tools.

### Negative / Trade-offs

- Running the full multi-device Playwright E2E suite adds ~10-15 seconds to the outer verification gate (`npm run verify`), which is mitigated by running it primarily at PR verification and release boundaries while developers use fast scoped inner-loop commands.
