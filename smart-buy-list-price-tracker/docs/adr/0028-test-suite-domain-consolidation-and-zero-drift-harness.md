# ADR-0028: Test Suite Domain Consolidation & Zero-Drift Harness

## Status

Accepted (v4.3.0)

## Context

During previous release cycles and feature PRs (notably PR #282 for v4.3.0), significant test maintenance friction, token consumption, and fragility were identified across the `smart-buy-list-price-tracker` test suite:

1. **Proliferation of Version-Named Test Suites**:
   - The test suite had accumulated 29 separate test files in `tests/`, many named after historical version increments (e.g. `smart-buy-list-v3-11-enhancements.test.js`, `smart-buy-list-v3-12-enhancements.test.js`, `smart-buy-list-v3-13-enhancements.test.js`, `smart-buy-list-v4-1-navigation-and-gestures.test.js`, `smart-buy-list-v4-2-review-remediation.test.js`, `smart-buy-list-ios-pwa-safe-area.test.js`).
   - Adding a new feature or bumping the version required touching multiple legacy files just to update version string assertions or duplicate existing tests.

2. **Hardcoded Version Invariants & Cascading Failures**:
   - Several historical test suites asserted hardcoded version strings (e.g. `assert(manifestContent.version === "4.2.0")`), causing cascading assertion failures across 4+ files whenever `manifest.webmanifest` was incremented to a new SemVer release.

3. **Duplicated Sandboxes & Timers**:
   - Each test file instantiated its own bespoke mock DOM, `localStorage`, `indexedDB`, and Node `vm` sandbox.
   - Unmocked `setTimeout` / `setInterval` in historical tests held the Node event loop open, unnecessarily slowing test runs down and inflating execution costs.

4. **Lack of Tool-Specific Test Filtering in Inner Loop**:
   - Running `npm test` executed all repository suites across all tools. Developers working on `smart-buy-list-price-tracker` had no single command to run only the tracker's test suite, creating inner-loop friction.

---

## Decisions

### 1. Permanent 7 Domain Architecture Consolidation

The 29 legacy test files have been consolidated into exactly 7 permanent, domain-scoped test suites:

1. **Math Engine & Comparator Intelligence** (`tests/smart-buy-list-engine-math.test.js`):
   - Unit price normalization (13 units across mass, volume, and count).
   - Deal scoring algorithms (GREAT_DEAL, FAIR_PRICE, PRICE_SPIKE, ALL_TIME_LOW).
   - Historical ledger calculations, sparkline SVG rendering, parser hardening, and stack-safe reductions.
2. **Storage & Persistence** (`tests/smart-buy-list-storage-persistence.test.js`):
   - LocalStorage baseline, schema versioning, and migration safety.
   - IndexedDB engine, stores, transactions, and fallback behavior.
   - Settings backup/restore and clipboard JSON interchange.
3. **Cloud Sync & Multi-Device Concurrency** (`tests/smart-buy-list-cloud-sync.test.js`):
   - Google Drive and GitHub Gist sync seams.
   - 3-way conflict resolution, tombstones, and calm-sync debouncing.
   - Rate limit handling (HTTP 403/429) and network fault tolerance.
4. **UI Interactions, Gestures & Components** (`tests/smart-buy-list-ui-components.test.js`):
   - Four-tab page navigation and touch gesture routing.
   - Planning vs Buy mode card ergonomics and event delegation.
   - Modal management (Full Item Edit, Quick Price Update, Option Hub).
   - Smart Quick-Entry Omnibox NLP and batch paste parsing.
5. **PWA Lifecycle, Cache & Safe-Area** (`tests/smart-buy-list-pwa-lifecycle.test.js`):
   - Manifest validation and single-source version parity.
   - Service worker caching, fetch interceptors, and navigation mode checks.
   - iOS safe-area insets, standalone display mode, and viewport meta tag.
6. **i18n Parity, Currency & Accessibility** (`tests/smart-buy-list-i18n.test.js`):
   - 100% key symmetry between English (`en`) and Vietnamese (`vi`).
   - Vietnam-first defaults (VND, default stores, flag emoji).
   - Multi-currency formatting, ARIA labels, and keyboard navigability.
7. **Security, CSP & Content Sanitization** (`tests/smart-buy-list-security.test.js`):
   - Strict Content Security Policy (CSP) compliance and zero-inline script execution.
   - HTML entity sanitization (`sanitizeHTML`).
   - Clickjacking and MIME sniffing defense headers (`_headers`).

### 2. Centralized Mock DOM & VM Sandbox Harness

Implemented `tests/helpers/smart-buy-list-harness.js` providing:

- Unified mock DOM with DOM element factories, class list mocks, attribute handling, and event dispatchers.
- Storage mocking (`localStorage`, `sessionStorage`, `indexedDB`).
- Synchronous timer mocking (`setTimeout`, `setInterval`) to prevent hanging Node event loops.
- Sandboxed Node `vm` context runner loading application scripts with customizable mocked globals (e.g. `fetch`, `navigator`, `crypto`).

### 3. Dynamic SemVer Version Parity Invariant

Hardcoded SemVer strings are strictly forbidden in functional test suites. Version verification is enforced through dynamic parity:

```javascript
// Valid: Asserts that sw.js and index.html match manifest.webmanifest dynamically
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert(swContent.includes(`smart-buy-list-v${manifest.version}`));
```

No test suite may fail solely due to a valid SemVer increment in `manifest.webmanifest`.

### 4. Prohibition of Version-Named Test Files in Ways of Working

Documented in `docs/agents/ways-of-working.md`:

- Contributors and AI coding agents MUST NOT create new version-named test files (e.g. `smart-buy-list-v4-4.test.js`).
- New features and bugfixes must extend the existing 7 domain test suites (or their domain sub-modules under `tests/smart-buy-list/`).

### 5. Inner-Loop Developer Ergonomics (`--tool` flag)

- Updated `scripts/run-tests.js` to support `--tool <name>` (e.g. `node scripts/run-tests.js --tool smart-buy-list-price-tracker`).
- Configured npm scripts in `package.json`:
  - `npm run test:tracker`: Runs all 7 tracker domain suites concurrently.
  - `npm run test:tracker:math`: Runs Math Engine suite.
  - `npm run test:tracker:storage`: Runs Storage & Persistence suite.
  - `npm run test:tracker:cloud`: Runs Cloud Sync suite.
  - `npm run test:tracker:ui`: Runs UI Interactions suite.
  - `npm run test:tracker:pwa`: Runs PWA Lifecycle suite.
  - `npm run test:tracker:i18n`: Runs i18n & Accessibility suite.
  - `npm run test:tracker:security`: Runs Security suite.

---

## Consequences

- **Zero Test Loss**: All 1,264 historical assertions and test IDs (`MATH-*`, `DEAL-*`, `SYNC-*`, `CARD-*`, etc.) are preserved and pass 100%.
- **Zero Token Waste**: Feature PRs and version bumps no longer require updating dozens of outdated test files.
- **Fast Execution**: Parallel test runner executes the entire 1,264 assertion tracker test suite in ~12 seconds.
- **Zero Runtime Dependencies**: The test harness relies entirely on Node.js built-in modules (`fs`, `path`, `vm`, `child_process`).
