# 🧪 Living Test Plan & Quality Assurance Strategy (v4.5.0)

> **Target File:** `smart-buy-list-price-tracker/index.html`  
> **Test Architecture:** 7 Permanent Domain Suites (`tests/smart-buy-list-*.test.js`)  
> **Shared Harness:** `tests/helpers/smart-buy-list-harness.js`  
> **Test Runner:** `scripts/run-tests.js` (`bun test` / `npm test`, `bun run test:tracker` / `npm run test:tracker`)  
> **Architecture Decision Record:** [`docs/adr/0028-test-suite-domain-consolidation-and-zero-drift-harness.md`](./docs/adr/0028-test-suite-domain-consolidation-and-zero-drift-harness.md), [`docs/adr/0007-migrate-runtime-and-package-manager-to-bun.md`](../docs/adr/0007-migrate-runtime-and-package-manager-to-bun.md) & [`docs/adr/0031-modular-source-architecture-jsdoc-contracts-and-state-container.md`](./docs/adr/0031-modular-source-architecture-jsdoc-contracts-and-state-container.md)  
> **Historical Incremental Test Log Archive:** [`docs/deprecated/TEST_PLAN_HISTORY.md`](./docs/deprecated/TEST_PLAN_HISTORY.md)

---

## 🎯 Test Architecture & Domain Organization

Per **ADR-0028**, **ADR-0007**, and **ADR-0031**, the `smart-buy-list-price-tracker` test suite operates under a **Dual-Level Strategy**:

1. **Direct Domain Unit Tests**: Pure mathematical logic (`src/domain/`), normalization, compression codecs, and storage contracts are imported directly as ES/CommonJS modules, bypassing regex `<script>` parsing.
2. **Scoped DOM Integration Tests**: UI interactions, gestures, modal stacks, and event delegation execute within the sandboxed DOM harness (`tests/helpers/smart-buy-list-harness.js`).

### Developer Inner Loop

| Target Scope                 | Command (Bun)                   | Command (Node.js)               | Description                                                                                                     |
| :--------------------------- | :------------------------------ | :------------------------------ | :-------------------------------------------------------------------------------------------------------------- |
| **All Tracker Suites**       | `bun run test:tracker`          | `npm run test:tracker`          | Executes all 7 domain suites concurrently via `scripts/run-tests.js --tool smart-buy-list-price-tracker` (~12s) |
| **Core Math & Scoring**      | `bun run test:tracker:math`     | `npm run test:tracker:math`     | Unit price normalization, deal scoring, comparator intelligence, sparklines                                     |
| **Storage & State**          | `bun run test:tracker:storage`  | `npm run test:tracker:storage`  | LocalStorage, IndexedDB migrations, backup/restore, clipboard interchange                                       |
| **Cloud Sync & Concurrency** | `bun run test:tracker:cloud`    | `npm run test:tracker:cloud`    | Drive & Gist sync, 3-way merge, 30-day tombstones, 403 rate limit handling                                      |
| **UI Interactions**          | `bun run test:tracker:ui`       | `npm run test:tracker:ui`       | 4-tab SPA navigation, swipe gestures, cards, modals, Smart Omnibox                                              |
| **PWA Lifecycle & Cache**    | `bun run test:tracker:pwa`      | `npm run test:tracker:pwa`      | Manifest validation, dynamic SemVer parity, service worker caching, iOS safe-area                               |
| **i18n & Accessibility**     | `bun run test:tracker:i18n`     | `npm run test:tracker:i18n`     | 100% bilingual key parity, VND/currency formatting, ARIA audit                                                  |
| **Security & CSP**           | `bun run test:tracker:security` | `npm run test:tracker:security` | Strict CSP compliance, HTML entity sanitization, `_headers` framing protection                                  |

---

## 📋 Active Domain Test Suite Catalog (1,264 Assertions)

| Domain Suite File                                      | Scope & Capabilities Verified                                                                                                                                                                                                                                                                                                   | Key Assertions Covered                                                                                                                                     |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`tests/smart-buy-list-engine-math.test.js`**         | Unit price normalization (13 units across mass, volume, count), deal scoring algorithms (`GREAT_DEAL`, `FAIR_PRICE`, `PRICE_SPIKE`, `ALL_TIME_LOW`), chronological newest `lastPrice` derivation, SVG sparklines, and stack-safe reductions.                                                                                    | `UNIT-01..07`, `DEAL-01..05`, `COMP-01..04`, `MATH-01..06`, `SPARK-01..04`, `PRICE-01`                                                                     |
| **`tests/smart-buy-list-storage-persistence.test.js`** | LocalStorage schema upgrades, `IndexedDBStorageProvider` object stores & transactions, PAT token migration safety, symmetric Settings 2x2 data management, and clipboard JSON interchange.                                                                                                                                      | `STORE-01..08`, `IDB-01..06`, `BACKUP-01..04`, `CLIP-01..08`                                                                                               |
| **`tests/smart-buy-list-cloud-sync.test.js`**          | Google Drive AppData REST v3, GitHub Gist REST sync, 3-way differential merge (`Merge3`), 30-day deletion tombstones, calm cloud sync debounce (15s), and HTTP 403/429 rate limit diagnostics & countdown banners.                                                                                                              | `SEAM-01..02`, `GIS-01..02`, `DRIVE-01..03`, `3WAY-01..05`, `TOMB-01..06`, `TOUCH-01..10`, `ZOMB-01..07`, `GIST-01..03`, `SYNC-ERR-01..06`                 |
| **`tests/smart-buy-list-ui-components.test.js`**       | 4-tab SPA navigation (`Planning`, `Buy`, `Price History`, `Comparator`), touch gestures, item card pure event delegation (`handleItemCardDelegatedClick`), XSS immunity, dual-modal architecture, Smart Quick-Entry Omnibox NLP, case-insensitive item matching, responsive tablet deal badges, and desktop ledger deal column. | `NAV-01..16`, `GESTURE-01..12`, `DIFF-01..08`, `CARD-01..14`, `ID-01..09`, `EDIT-01..06`, `SMART-00..07`, `PACE-01..03`, `SHEET-01..04`, `DEAL-TAB-01..05` |
| **`tests/smart-buy-list-pwa-lifecycle.test.js`**       | Dynamic SemVer version parity invariant (`manifest.webmanifest` ↔ `sw.js` ↔ `#pwaVersionBadge`), service worker update flow, cache purge controls, URL state compression/share payloads, iOS safe-area insets, and two-tier native PWA back navigation hierarchy (`popstate` + tab history stack).                              | `VER-01..03`, `PWA-01..25`, `PWA-UPD-01..11`, `SHARE-01a..01j`, `IOS-01..14`, `SW-01..03`, `BACK-NAV-01..06`                                               |

| **`tests/smart-buy-list-i18n.test.js`** | 100% dictionary key symmetry between English (`en`) and Vietnamese (`vi`), Vietnam-first defaults (`vi`, `VND`, default VN supermarket chains), currency formatting (`formatCurrency`), and ARIA accessibility labels. | `I18N-01..03`, `I18N-PARITY-EN→VI`, `I18N-PARITY-VI→EN`, `VN-DEF-01..03`, `VN-FLAG-01`, `ARIA-01..06` |
| **`tests/smart-buy-list-security.test.js`** | Strict Content Security Policy (`default-src 'self'`), zero-inline scripts audit, HTML entity sanitization (`sanitizeHTML`), input identifier validation (`isValidId`), and Cloudflare Pages clickjacking defense (`_headers`). | `SEC-01..08`, `CSP-01..05`, `HEADERS-01..03`, `XSS-01..05` |

---

## 🛡️ Non-Negotiable Quality Gates

Every Pull Request and commit must pass all validation gates locally and in CI (`pr-verify.yml`):

1. **Prettier Code Formatting**:
   ```bash
   bun run lint:check   # or: npm run lint:check
   ```
2. **Compacted Deliverable Build**:
   ```bash
   bun run build        # or: npm run build
   ```
3. **Targeted Inner-Loop Verification**:
   ```bash
   bun run test:tracker # or: npm run test:tracker
   ```
4. **Unified Automated Test Suite Execution**:
   ```bash
   bun test             # or: npm test
   # Or full verification gate:
   bun run verify       # or: npm run verify
   ```
   _Requirement_: 100% of all 2,222+ automated assertions across all repository test suites must pass with zero failures in both Bun and Node.

---

## 🚫 Anti-Patterns & Invariants

1. **Never create version-named test files** (e.g. `tests/smart-buy-list-v4-4.test.js`). All new tests must be added to the appropriate domain suite or a domain sub-module under `tests/smart-buy-list/`.
2. **Never hardcode SemVer strings in functional tests**. Verify version synchronization dynamically using the single source of truth (`manifest.webmanifest`).
3. **Always use the centralized test harness** (`tests/helpers/smart-buy-list-harness.js`) for mock DOM elements, timers, and storage sandboxing.
