# 🧪 Test Plan — Smart Buy-List & Unit Price Tracker

> **Target File:** `smart-buy-list-price-tracker/index.html`  
> **Test Location:** `tests/smart-buy-list-price-tracker.test.js`  
> **Test Runner:** `scripts/run-tests.js` (`npm test`)

---

## 🎯 Test Architecture & Quality Standards

All automated tests adhere to the zero-runtime build constraint and test observable behaviors:

1. **Pure Domain Math & Normalization Tests**: Zero-DOM deterministic tests verifying unit conversion factors, price normalization formulas, and deal scoring algorithms.
2. **State & Migration Tests**: Verifying schema upgrades, IndexedDB store operations, fallback in-memory adapters, and export/import integrity.
3. **Payload Compression & Sharing Tests**: Verifying LZ-String encoding/decoding, URL length constraints, and non-destructive merge deduplication.
4. **DOM & UI Interaction Tests**: JSDOM-driven tests asserting shopping trip phase transitions, live running total updates, in-aisle package comparisons, and modal lifecycle invariants.
5. **Localization & Parity Tests**: 100% dictionary key parity between English (`en`) and Vietnamese (`vi`), translation string completeness, and currency masking.

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
| **MD3-07** | MD3 Theme Tokens                       | CSS custom properties define `--md-sys-color-primary`, `--md-sys-color-surface-container`, and dark/light tonal tokens with zero runtime dependencies. |
