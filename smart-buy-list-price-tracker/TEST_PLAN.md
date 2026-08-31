# 🧪 Living Test Plan & Quality Assurance Strategy (v3.9.0)

> **Target File:** `smart-buy-list-price-tracker/index.html`  
> **Test Location:** `tests/smart-buy-list-*.test.js`  
> **Test Runner:** `scripts/run-tests.js` (`npm test`)  
> **Historical Incremental Test Log Archive:** [`docs/deprecated/TEST_PLAN_HISTORY.md`](./docs/deprecated/TEST_PLAN_HISTORY.md)

---

## 🎯 Test Architecture & Quality Standards

All automated tests strictly adhere to the zero-runtime build constraint and test observable behaviors across six testing dimensions:

1. **Pure Domain Math & Normalization**: Zero-DOM deterministic tests verifying unit conversion factors (Weight, Volume, Count), normalized unit price formulas ($/kg, $/L, $/ea), and deal scoring algorithms.
2. **State, Persistence & Migrations**: Schema evolution tests for IndexedDB (`SmartBuyListDB`), local/session storage fallbacks, JSON backup export/import fidelity, and state hydration.
3. **Multi-Cloud Concurrency & Conflict Resolution**: 3-Way differential merge (`Merge3`) verification, deletion tombstone lifecycle (30-day TTL), in-flight mutation preservation, Google Drive AppData sync, and GitHub Gist REST sync.
4. **DOM & UI Interaction Ergonomics**: JSDOM-driven tests asserting shopping trip phase transitions, Smart Omnibox NLP parsing, in-aisle package comparisons, differentiated card rendering, touch swipe gestures, and modal lifecycle invariants.
5. **Bilingual Localization Parity (i18n)**: 100% dictionary key parity between English (`en`) and Vietnamese (`vi`), translation string completeness, dynamic language switching, and currency masking (`formatCurrency`).
6. **Progressive Web Application (PWA) & Asset Packaging**: Service worker lifecycle (`sw.js` v3.9.0), Network-First navigation with fallback, cache purge controls, companion asset compaction (Terser), and standalone release ZIP packaging.

---

## 📋 Active Regression Test Suite Catalog

| Test Suite File                                                          | Scope & Capabilities Verified                                                                                                          | Key Assertions Covered                                                         |
| :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **`tests/smart-buy-list-price-tracker.test.js`**                         | Core unit price normalization, deal scoring indicators (🟢/🟡/🔴), and basic trip lifecycle.                                           | `UNIT-01..07`, `DEAL-01..05`, `COMP-01..04`                                    |
| **`tests/smart-buy-list-storage.test.js`**                               | `IndexedDBStorageProvider` operations, schema upgrades, and JSON backup export/import integrity.                                       | `STORE-PERSIST-01..08`, `BACKUP-01..04`                                        |
| **`tests/smart-buy-list-sharing-pwa.test.js`**                           | URL state compression, Smart Merge protocol, Markdown checklist copy, standalone JSON download, and PWA icon/manifest.                 | `SHARE-01a..01j`, `MERGE-01..02`, `PWA-01..25`                                 |
| **`tests/smart-buy-list-material-you.test.js`**                          | MD3 4-destination bottom navigation bar, focus mode, and item-centric comparator triggers.                                             | `MD3-01..07`                                                                   |
| **`tests/smart-buy-list-pacing-touch-polish.test.js`**                   | In-store shopping progress pacing bar, aisle filter chips, quick price bottom sheets, and haptic feedback.                             | `PACE-01`, `AISLE-01`, `SHEET-01`, `HAPTIC-01`                                 |
| **`tests/smart-buy-list-stores-grouping-gestures.test.js`**              | Custom store CRUD with cascade rename/delete, active list grouping (`By Aisle`/`By Store`), swipe gestures, and Option Hub modal.      | `STORE-01..03`, `GROUP-01..02`, `SWIPE-01..02`, `SETTINGS-01`                  |
| **`tests/smart-buy-list-differentiated-cards.test.js`**                  | Differentiated card ergonomics per trip phase (ultra-minimalist in Buy Mode vs rich expanded in Planning Mode).                        | `DIFF-01..08`                                                                  |
| **`tests/smart-buy-list-lifecycle.test.js`**                             | Service worker update discovery, `SKIP_WAITING` controller change reload, and QA cache purge controls.                                 | `PWA-UPD-01..11`                                                               |
| **`tests/smart-buy-list-price-history-reorder.test.js`**                 | Historical purchase ledger 1-tap quick add (`➕`), multi-select batch restocking, and case-insensitive deduplication.                  | `REORDER-01..09`                                                               |
| **`tests/smart-buy-list-clipboard-interchange.test.js`**                 | Contextual dual clipboard export, smart multi-format paste detection hierarchy, and fallback textarea modal.                           | `CLIP-01..08`                                                                  |
| **`tests/smart-buy-list-ledger-delete-comparator-prefill.test.js`**      | Ledger row/batch deletion with dynamic ATL recalculation, 13-unit dropdowns, and "Apply Winner to Form" context pre-filling.           | `LEDGER-01..03`, `COMP-01..03`, `PREFILL-01..03`                               |
| **`tests/smart-buy-list-cloud-sync.test.js`**                            | Google Drive AppData REST v3 sync, GIS OAuth ephemeral token lifecycle, and deterministic smart merge.                                 | `SEAM-01..02`, `GIS-01..02`, `DRIVE-01..03`, `MERGE-01`                        |
| **`tests/smart-buy-list-cloud-concurrency.test.js`**                     | GitHub Gist provider, PAT authentication, 3-way differential merge (`Merge3`), and 30-day deletion tombstones.                         | `TOMB-01`, `TOUCH-01..10`, `ZOMB-01..07`, `3WAY-01..05`, `TRIP-01..09`         |
| **`tests/smart-buy-list-vietnamese-omnibox.test.js`**                    | Vietnam-first baseline defaults, Smart Quick-Entry Omnibox NLP parsing, and currency-aware price adjustment chips.                     | `VN-DEF-01..03`, `VN-FLAG-01`, `VND-CHIP-01..02`, `SMART-01..06`, `UNIT-VN-01` |
| **`tests/smart-buy-list-calm-sync-ledger.test.js`**                      | Calm Cloud Sync (15s debounce, tab background flush/wakeup pull), adaptive mobile ledger cards, and startup flag parity.               | `FLAG-01..03`, `SYNC-01..05`, `GDRIVE-01..03`, `LEDGER-01..03`                 |
| **`tests/smart-buy-list-planning-completion-ledger-comparator.test.js`** | Adaptive planning trip completion, clean empty state, ledger button alignment, and bidirectional unit group comparator auto-sync.      | `CLEAN-01..06`, `PLAN-01..07`, `LEDGER-01..04`, `COMP-01..07`                  |
| **`tests/smart-buy-list-settings-backup-interchange.test.js`**           | Complete QR scanner purge verification, symmetrical 2x2 data management grid in Settings, and detailed cloud sync error interpolation. | `BUY-01`, `SYNC-01`, `SETTINGS-01..02`, `SHARE-01..04`                         |
| **`tests/smart-buy-list-i18n-theming.test.js`**                          | 100% Vietnamese and English dictionary key symmetry, currency formatting (`formatCurrency`), verbal amount helpers, and theme tokens.  | `I18N-01..03`, `I18N-PARITY-EN→VI`, `I18N-PARITY-VI→EN`                        |

---

## 🛡️ Non-Negotiable Quality Gates

Every Pull Request and commit must pass all three validation gates locally and in CI (`pr-verify.yml`):

1. **Prettier Code Formatting**:
   ```bash
   npm run lint:check
   ```
2. **Compacted Deliverable Build**:
   ```bash
   npm run build
   ```
3. **Unified Automated Test Suite Execution**:
   ```bash
   npm test
   ```
   _Requirement_: 100% of all automated assertions across all test suites must pass with zero failures.
