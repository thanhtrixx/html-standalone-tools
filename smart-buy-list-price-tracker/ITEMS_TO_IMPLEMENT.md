# 📋 Smart Buy-List & Unit Price Tracker — Living Requirements & Specifications (v3.10.0)

> **Target File:** `smart-buy-list-price-tracker/index.html` (Compacted: `smart-buy-list-price-tracker/dist/index.html` or `dist/smart-buy-list-price-tracker.html`)  
> **Source Documents:** [`CONTEXT.md`](./CONTEXT.md), [`I18N.md`](./I18N.md), [`docs/adr/`](./docs/adr/)  
> **Historical Roadmap & Slices Archive:** [`docs/deprecated/ITEMS_TO_IMPLEMENT_HISTORY.md`](./docs/deprecated/ITEMS_TO_IMPLEMENT_HISTORY.md)  
> **Architecture:** Zero-Runtime Build, Standalone Single-File HTML / PWA Application

---

## 🏛️ Domain Concepts & Ubiquitous Language Summary

All system features strictly adhere to the domain model in [`CONTEXT.md`](./CONTEXT.md):

- **Master Item**: Canonical product catalog definition with default unit, aisle category, and purchase history.
- **List Item (Active Item)**: Shopping list entry with target quantity, estimated price, store, aisle, and checked status.
- **Package Size & Normalization**: Base unit conversion across Mass (`kg`), Volume (`L`), and Count (`ea`).
- **Normalized Unit Price**: Calculated unit cost ($/kg, $/L, $/ea, ₫/kg, ₫/L, ₫/cái).
- **Historical Purchase Ledger**: Append-only log of purchase transactions per store, date, and package size with row/batch delete.
- **Deal Indicator**: 🟢 Great Deal ($\le$ ATL or $\ge 10\%$ discount), 🟡 Fair Price, 🔴 Price Spike.
- **In-Aisle Package Comparator**: Side-by-side package size evaluator with bidirectional dimension auto-sync, % savings, and "Apply Winner to Form" pre-filling.
- **Shopping Trip Lifecycle**: `Planning` ➔ `In-Store Shopping` ➔ `Trip Summary/Complete` (with unpurchased item rollover).
- **Share Buy-List Hub**: Lightweight 4-action sharing modal (Native App Share, Formatted Markdown Checklist Copy, Deep Link URL, Standalone JSON File).
- **Option Hub (Settings)**: Symmetrical 2x2 data interchange grid (`[Export File | Copy JSON] / [Import File | Paste JSON]`), store management, preferences, and cloud sync.
- **Storage Provider Seam**: `IndexedDBStorageProvider` (offline engine), `GoogleDriveStorageProvider` (AppData REST v3), `GitHubGistStorageProvider` (Secret Gist PAT with 403 resiliency and Classic scope enforcement), and Deterministic 3-Way Cloud Merge (`Merge3`) with deletion tombstones.

---

## 📊 Active Capabilities Specification Matrix

| Feature Area                                  | ID         | Specification & Architectural Constraints                                                                                                                                                                                                                                                     | ADR Reference                          |
| :-------------------------------------------- | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| **1. Normalization & Deal Intelligence**      | **CAP-01** | Pure normalization engine for Weight (`kg`/`g`/`oz`/`lb`), Volume (`L`/`ml`/`fl oz`/`gal`), and Count (`ea`/`pk`/`box`/`can`/`loc`/`thung`/`khay`/`tui`/`hu`).                                                                                                                                | ADR-0002, ADR-0013                     |
|                                               | **CAP-02** | Chronological purchase ledger with dynamic All-Time Low (ATL), average price calculation, and real-time deal indicator scoring (🟢 / 🟡 / 🔴).                                                                                                                                                | ADR-0002, ADR-0010                     |
|                                               | **CAP-03** | In-Aisle Package Comparator with 13-unit dropdowns, bidirectional unit group dimension auto-sync (Weight ↔ Volume ↔ Count), and "Apply Winner to Form" context pre-filling.                                                                                                                   | ADR-0002, ADR-0010, ADR-0017           |
| **2. Multi-Store & Category Organization**    | **CAP-04** | Store Profile Manager supporting custom store CRUD with automatic cascade renames to active items and historical purchase ledger records.                                                                                                                                                     | ADR-0005                               |
|                                               | **CAP-05** | Dual active buy-list grouping: `By Aisle` (department walking sequence) and `By Store` (retail venue partition with calculated subtotals).                                                                                                                                                    | ADR-0005                               |
|                                               | **CAP-06** | Horizontal aisle department quick filter chips and dedicated Shopping List horizontal store filter chips (`All Stores`, custom stores, `Manage Stores`).                                                                                                                                      | ADR-0019, CONTEXT.md                   |
| **3. Trip Lifecycle & Offline Persistence**   | **CAP-07** | 3-Phase shopping trip lifecycle: Planning mode (rich expanded cards, Smart Omnibox, adaptive completion bar when `checkedCount > 0`), In-Store Buy Mode (minimalist cards, auto-hide finish bar when empty, running total, pacing bar), and Trip Summary/Complete (ledger logging, rollover). | ADR-0004, ADR-0006, ADR-0017, ADR-0018 |
|                                               | **CAP-08** | Offline-first persistence via `IndexedDBStorageProvider` (`SmartBuyListDB`, v1) with schema migration pipeline and localStorage fallback.                                                                                                                                                     | ADR-0001                               |
|                                               | **CAP-09** | Ledger-to-BuyList re-ordering via 1-tap quick add (`➕`) and concise batch restocking (`Add to Buy List` / `Thêm vào danh sách mua`) with additive line price accumulation.                                                                                                                   | ADR-0008, ADR-0017, ADR-0019           |
| **4. Multi-Cloud Sync & Conflict Resolution** | **CAP-10** | Pluggable `StorageManager` registry supporting `Disabled (Local Only)`, `Google Drive (AppData GIS OAuth)`, and `GitHub Gist (Secret Gist PAT)` cloud engines with Classic PAT scope enforcement, CDN auth stripping, and 403 resiliency.                                                     | ADR-0011, ADR-0012, ADR-0019           |
|                                               | **CAP-11** | Calm Cloud Sync architecture: 15-second idle debounce (capped at 45s), tab backgrounding flush (`visibilitychange`), trip finish immediate push, and tab wakeup pull after 120s inactivity.                                                                                                   | ADR-0014                               |
|                                               | **CAP-12** | Deterministic 3-Way Differential Merge (`Merge3`) uniting ledger transactions, merging active items by `updatedAt`, preserving in-flight mutations, and preventing zombie resurrections via 30-day deletion tombstones.                                                                       | ADR-0016                               |
|                                               | **CAP-13** | Detailed diagnostic error interpolation (`res.error                                                                                                                                                                                                                                           |                                        | "Unknown"`) and GitHub API response body inspection across cloud synchronization failure toasts. | ADR-0018, ADR-0019 |
| **5. P2P Sharing & Data Interchange**         | **CAP-14** | Share Buy-List Hub offering Web Share API integration, formatted Markdown checklist copying, `#share=<payload>` URL link copying, and standalone active list `.json` file download.                                                                                                           | ADR-0003, ADR-0018                     |
|                                               | **CAP-15** | Smart Merge Protocol for recipient clients offering non-destructive _Import as New List_, _Merge into Active List_, and _Sync Price Catalog_.                                                                                                                                                 | ADR-0003                               |
|                                               | **CAP-16** | Symmetrical 2x2 Option Hub data interchange grid: `[ Export File                                                                                                                                                                                                                              | Copy JSON ]`and`[ Import File          | Paste JSON ]` with auto-detect hierarchy and fallback textarea modal.                            | ADR-0009, ADR-0018 |
| **6. PWA Shell & Ergonomics**                 | **CAP-17** | Single-source PWA versioning (`3.10.0`) anchored in `manifest.webmanifest`, Network-First HTML navigation with M3 update notification toast, cache purge controls, and companion asset compaction (Terser minified `sw.js`).                                                                  | ADR-0007, ADR-0015, ADR-0018, ADR-0019 |
|                                               | **CAP-18** | Material You (MD3) 4-destination bottom navigation bar (`Planning`, `Buy Mode`, `Price History`, `Comparator`) and in-aisle touch swipe gestures (Swipe Right Done, Swipe Left Compare).                                                                                                      | ADR-0004, ADR-0005                     |
|                                               | **CAP-19** | Smart Quick-Entry Omnibox (`#smartQuickInput`) with real-time NLP parsing (items, quantities, units, prices, `@store`, categories), 1-tap add, undo toast, and multi-line batch paste.                                                                                                        | ADR-0013                               |
|                                               | **CAP-20** | Country flag and full country/language branding (`🇻🇳 Việt Nam (Tiếng Việt)` / `🇺🇸 United States (English)`), currency-aware quick price adjustment delta chips, and 100% bilingual dictionary parity.                                                                                         | ADR-0013, ADR-0014, ADR-0019           |

---

## 💎 Standalone Tool Definition of Done (DoD)

1. **Directory Isolation**: 100% self-contained in `smart-buy-list-price-tracker/` with standalone source `index.html` and compacted deliverable `dist/index.html`.
2. **Domain Glossary (`CONTEXT.md`)**: Ubiquitous terminology, explicit avoided synonyms, and calculation formulas kept in sync with code.
3. **Bilingual Parity (`I18N.md`)**: 100% dictionary key symmetry between English and Vietnamese.
4. **Automated Test Coverage**: 100% green test assertions across all test suites executed via `npm test`.
5. **Quality Gates**: Zero failures in formatting checks (`npm run lint:check`), compaction build (`npm run build`), and release packaging (`npm run pack:release`).

---

## 🔮 Future Backlog & Enhancement Roadmap

- [ ] **B1: Multi-Currency Exchange Rate Converter**: Real-time or cached offline currency conversions when traveling internationally.
- [ ] **B2: Nutritional & Dietary Metadata Tags**: Optional dietary tags (Gluten-Free, Organic, Vegan, Keto) in master catalog.
- [ ] **B3: OCR Receipt Scanning Integration**: Local client-side WebAssembly OCR for automated paper receipt digitizing into the historical purchase ledger.
- [ ] **B4: Barcode Scanner Hardware WebHID / Bluetooth Support**: In-aisle handheld Bluetooth barcode reader support for high-volume grocery restocking.
