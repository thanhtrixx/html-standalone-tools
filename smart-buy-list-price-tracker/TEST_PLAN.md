# 🧪 Test Plan — Smart Buy-List & Unit Price Tracker

> **Target File:** `smart-buy-list-price-tracker/index.html`  
> **Test Location:** `tests/smart-buy-list-*.test.js`  
> **Test Runner:** `scripts/run-tests.js` (`npm test`)

---

## 🎯 Test Architecture & Quality Standards

All automated tests adhere to the zero-runtime build constraint and test observable behaviors:

1. **Pure Domain Math & Normalization Tests**: Zero-DOM deterministic tests verifying unit conversion factors, price normalization formulas, and deal scoring algorithms.
2. **State & Migration Tests**: Verifying schema upgrades, IndexedDB store operations, fallback in-memory adapters, and export/import integrity.
3. **Payload Compression & Sharing Tests**: Verifying LZ-String encoding/decoding, URL length constraints, and non-destructive merge deduplication.
4. **DOM & UI Interaction Tests**: JSDOM-driven tests asserting shopping trip phase transitions, live running total updates, in-aisle package comparisons, and modal lifecycle invariants.
5. **Localization & Parity Tests**: 100% dictionary key parity between English (`en`) and Vietnamese (`vi`), translation string completeness, and currency masking.
6. **Store Management & Grouping Tests**: Custom store CRUD, cascade renames to active items and ledger records, active item grouping under aisle/store headers with computed subtotals.
7. **Mobile Swipe Gestures Tests**: Swipe right (Mark Done) and Swipe left (Open Comparator) touch gesture lifecycle.
8. **Option Hub Configuration Tests**: Centralized settings modal management, backup export/import, and UI preferences.

---

## 📋 Detailed Test Case Matrix

### 1. Pure Unit Price Normalization Engine (`normalizeUnitPrice`)

| Test ID     | Scenario                      | Input                                    | Expected Output                               |
| :---------- | :---------------------------- | :--------------------------------------- | :-------------------------------------------- |
| **UNIT-01** | Mass: Grams to Kilograms      | Price: $3.20, Qty: 450, Unit: `g`        | Base Qty: 0.45 kg, Unit Price: $7.1111/kg     |
| **UNIT-02** | Mass: Pounds to Kilograms     | Price: $8.99, Qty: 2, Unit: `lb`         | Base Qty: 0.907184 kg, Unit Price: $9.9098/kg |
| **UNIT-03** | Volume: Millilitres to Litres | Price: $4.50, Qty: 750, Unit: `ml`       | Base Qty: 0.75 L, Unit Price: $6.00/L         |
| **UNIT-04** | Volume: Gallons to Litres     | Price: $5.29, Qty: 1, Unit: `gal`        | Base Qty: 3.78541 L, Unit Price: $1.3975/L    |
| **UNIT-05** | Count: Multi-Pack to Units    | Price: $12.00, Qty: 24, Unit: `can`      | Base Qty: 24 ea, Unit Price: $0.50/ea         |
| **UNIT-06** | Zero & Negative Guard         | Price: $0, Qty: 0, Unit: `g`             | Returns 0 safely without `NaN` or `Infinity`  |
| **UNIT-07** | Unknown Unit Fallback         | Price: $5.00, Qty: 2, Unit: `custom_box` | Treats as Count dimension (2 ea, $2.50/ea)    |

---

### 2. Deal Scoring & Price Indicator Engine (`evaluateDealScore`)

| Test ID     | Scenario                               | Input                                     | Expected Output                       |
| :---------- | :------------------------------------- | :---------------------------------------- | :------------------------------------ |
| **DEAL-01** | All-Time Low (ATL) Match               | Current: $1.50/L, Historical Min: $1.50/L | Badge: `GREAT_DEAL`, Color: 🟢 Green  |
| **DEAL-02** | Substantial Discount (>10% below avg)  | Current: $1.70/L, Avg: $2.00/L            | Badge: `GREAT_DEAL`, Color: 🟢 Green  |
| **DEAL-03** | Fair / Market Price (Within $\pm 5\%$) | Current: $2.00/L, Avg: $2.02/L            | Badge: `FAIR_PRICE`, Color: 🟡 Yellow |
| **DEAL-04** | Price Spike (>10% above avg)           | Current: $2.40/L, Avg: $2.00/L            | Badge: `PRICE_SPIKE`, Color: 🔴 Red   |
| **DEAL-05** | No Historical Ledger (First Purchase)  | Current: $3.00/kg, History: `[]`          | Badge: `NEW_ITEM`, Color: ⚪ Neutral  |

---

### 3. In-Aisle Package Comparator (`comparePackages`)

| Test ID     | Scenario                        | Input                                                     | Expected Output                                        |
| :---------- | :------------------------------ | :-------------------------------------------------------- | :----------------------------------------------------- |
| **COMP-01** | Package A vs Package B (Weight) | A: 450g @ $3.20 ($7.11/kg)<br>B: 1.2kg @ $7.80 ($6.50/kg) | Winner: `Package B`<br>Savings: 8.58% ($0.61/kg saved) |
| **COMP-02** | Package A vs Package B (Volume) | A: 1L @ $2.50 ($2.50/L)<br>B: 2L @ $4.80 ($2.40/L)        | Winner: `Package B`<br>Savings: 4.00% ($0.10/L saved)  |
| **COMP-03** | Identical Unit Price            | A: 500g @ $2.50<br>B: 1000g @ $5.00                       | Winner: `TIE`<br>Savings: 0.00%                        |
| **COMP-04** | Cross-Dimension Mismatch Guard  | A: 500g @ $2.00 vs B: 500ml @ $2.00                       | Throws dimension mismatch warning safely               |

---

### 4. URL State Encoding, Decoding & Merge Protocol

| Test ID      | Scenario                | Assertion                                                                                                              |
| :----------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **SHARE-01** | Round-trip Compression  | `decompress(compress(listState))` strictly equals original `listState`.                                                |
| **SHARE-02** | URL Character Safety    | Compressed hash contains only RFC 3986 URL-safe characters.                                                            |
| **SHARE-03** | Non-Destructive Merge   | Merging incoming list with 3 existing items + 2 incoming (1 duplicate) yields exactly 4 items without data corruption. |
| **SHARE-04** | Malformed Hash Fallback | Corrupted URL hash fails gracefully and displays error toast without crashing the app.                                 |

---

### 5. Shopping Trip Lifecycle & Rollover

| Test ID     | Scenario                      | Assertion                                                                            |
| :---------- | :---------------------------- | :----------------------------------------------------------------------------------- |
| **LIFE-01** | Phase Progression             | Transitions cleanly from `PLANNING` ➔ `IN_STORE` ➔ `COMPLETED`.                      |
| **LIFE-02** | In-Store Running Total        | Checkbox toggles instantly re-sum actual checked spend vs estimated list total.      |
| **LIFE-03** | Trip Completion Ledger Append | Finalizing trip appends all checked items with store/date/price to `SmartBuyListDB`. |
| **LIFE-04** | Unpurchased Rollover          | Unchecked items migrate to a new active draft list when "Rollover" is confirmed.     |

---

### 6. Bilingual & Localization Parity

| Test ID     | Scenario               | Assertion                                                                                         |
| :---------- | :--------------------- | :------------------------------------------------------------------------------------------------ |
| **I18N-01** | 100% Key Parity        | Every key in `TRANSLATIONS.en` exists in `TRANSLATIONS.vi` with non-empty string values.          |
| **I18N-02** | Locale Formatting      | `formatCurrency(1500000, 'VND', 'vi')` produces valid Vietnamese currency format (`1.500.000 ₫`). |
| **I18N-03** | Verbal Quantity Helper | `getVerbalAmount(25000000, 'vi')` returns `"25 Triệu VND"`.                                       |

---

### 7. Material You (MD3) Bottom Navigation & Item Comparator

| Test ID    | Scenario                               | Assertion                                                                                                                                              |
| :--------- | :------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MD3-01** | 4-Destination Navigation Bar Switching | Tapping Planning, Buy Mode, Price History, and Comparator updates the active bottom bar indicator pill and activates the corresponding UI mode/modal.  |
| **MD3-02** | Buy Mode Focus & Ergonomics            | Buy mode collapses add-item form, onboarding alerts, and highlights remaining checklist with $\ge 48\text{px}$ touch targets and live basket total.    |
| **MD3-03** | Item-Centric Comparator Pre-fill       | Tapping `⚖️` on an item card (e.g. Rice 5kg @ $12.00) opens the comparator with Package A pre-populated with item name, price, quantity, and unit.     |
| **MD3-04** | Winner Application to Active Item      | Applying winning Package B from the pre-populated comparator directly updates the active list item's price and quantity.                               |
| **MD3-05** | Top Bar Share & Utility Placement      | Share (`📤`) button is mounted in the sticky top App Bar and excluded from bottom navigation bar.                                                      |
| **MD3-06** | Quick In-Store Price Adjustment        | Tapping price in Buy Mode allows rapid inline/sheet price editing to reflect actual shelf price before checking off.                                   |
| **MD3-07** | **MD3 Theme Tokens**                   | CSS custom properties define `--md-sys-color-primary`, `--md-sys-color-surface-container`, and dark/light tonal tokens with zero runtime dependencies. |

---

### 8. In-Store Progress Pacing, Aisle Filter Chips & Touch Ergonomics

| Test ID             | Scenario                         | Assertion                                                                                                                                   |
| :------------------ | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **PACE-01**         | Buy Mode Linear Progress Bar     | Progress bar element updates width percentage and label (`X of Y items (Z%)`) as items are checked off.                                     |
| **AISLE-01**        | Category Department Filter Chips | Selecting an aisle filter chip (e.g. `Dairy`) isolates active list items to that category and updates active chip pill styling.             |
| **SHEET-01**        | 1-Tap Fast Price Step Chips      | Quick Price bottom sheet step chips (`+0.50`, `+1.00`, `-0.50`, `-1.00`) immediately adjust the price input value without opening keyboard. |
| **HAPTIC-01**       | Tactile Check Feedback           | Toggling an item check invokes `navigator.vibrate?.([15])` safely without errors.                                                           |
| **COMP-VERDICT-01** | Explicit Comparator Verdict      | When comparing two packages, modal displays calculated total package savings and distinct advice for switching vs keeping Package A.        |

---

### 9. Progressive Web Application (PWA) & Icon Artifacts

| Test ID    | Scenario                          | Assertion                                                                                            |
| :--------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **PWA-01** | Vector Icon Existence             | `icon.svg` exists in the tool directory.                                                             |
| **PWA-02** | Vector Icon Geometry & ViewBox    | `icon.svg` defines a valid root `<svg>` with `viewBox="0 0 512 512"`.                                |
| **PWA-03** | HTML Head Favicon Link            | `index.html` connects `./icon.svg` via `<link rel="icon" type="image/svg+xml" href="./icon.svg" />`. |
| **PWA-04** | Apple Touch Icon Link             | `index.html` connects `./icon.svg` via `<link rel="apple-touch-icon" href="./icon.svg" />`.          |
| **PWA-05** | iOS Web App Meta Capability       | `index.html` declares `<meta name="apple-mobile-web-app-capable" content="yes" />`.                  |
| **PWA-06** | iOS Web App Title                 | `index.html` declares `<meta name="apple-mobile-web-app-title" content="BuyList" />`.                |
| **PWA-07** | Web App Manifest Existence        | `manifest.webmanifest` exists in the tool directory.                                                 |
| **PWA-08** | Manifest Standalone Display       | `manifest.webmanifest` specifies `"display": "standalone"`.                                          |
| **PWA-09** | Manifest Name                     | `manifest.webmanifest` specifies `"name": "Smart Buy-List & Unit Price Tracker"`.                    |
| **PWA-10** | Manifest Icon Array Count         | `manifest.webmanifest` contains multiple icon definitions.                                           |
| **PWA-11** | Manifest 'any' Purpose Icon       | `manifest.webmanifest` defines `./icon.svg` entry with `"purpose": "any"`.                           |
| **PWA-12** | Manifest 'maskable' Purpose Icon  | `manifest.webmanifest` defines `./icon.svg` entry with `"purpose": "maskable"`.                      |
| **PWA-13** | Service Worker Script Existence   | `sw.js` exists in the tool directory.                                                                |
| **PWA-14** | Service Worker Cache Version Bump | `sw.js` defines `CACHE_NAME = "smart-buy-list-v2"`.                                                  |
| **PWA-15** | Service Worker Icon Pre-cache     | `sw.js` includes `"./icon.svg"` in `ASSETS_TO_CACHE`.                                                |
| **PWA-16** | Service Worker Cache-First Fetch  | `sw.js` intercepts fetch requests with Cache-First matching strategy.                                |

---

### 10. Store Management, Grouping, Swipe Gestures & Option Hub

| Test ID          | Scenario                        | Assertion                                                                                                          |
| :--------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------- |
| **STORE-01**     | Custom Store Creation           | Adding a new store 'Sprouts' persists it to `memoryState.stores` and updates store select dropdowns.               |
| **STORE-02**     | Store Rename Cascade            | Renaming 'Costco' to 'Costco Wholesale' updates all active items and ledger records assigned to that store.        |
| **STORE-03**     | Store Deletion Guard            | Deleting a store safely reassigns active items to 'Other' / general fallback.                                      |
| **GROUP-01**     | Group By Aisle                  | Active items render with department category headers (`🥦 Produce & Fruits`) in walking route sequence.            |
| **GROUP-02**     | Group By Store with Subtotal    | Active items render with store section headers (`🏪 Costco (3 items • $18.50)`).                                   |
| **SWIPE-01**     | Swipe Right Mark Done Gesture   | Dragging item card right by >60px triggers `toggleItemCheck(id)` and haptic vibration.                             |
| **SWIPE-02**     | Swipe Left Open Compare Gesture | Dragging item card left by <-60px triggers `openItemComparator(id)`.                                               |
| **SETTINGS-01**  | Option Hub Modal Trigger        | Tapping `⚙️` in top bar opens Settings modal with Store Manager, Preferences, and Data Backup sections.            |
| **NAV-CLEAN-01** | Redundancy Removal              | Duplicate Planning/In-Store pill buttons in top card and Compare button in Add Item header are eliminated cleanly. |
