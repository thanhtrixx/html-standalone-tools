# 🧪 Historical Test Plan Archive (v1.0 – v3.9.0)

> [!NOTE]
> **Archived QA Record**: This document contains the historical 24-phase incremental test case matrix (including superseded QR scanner suites and legacy version assertions).
> For the active living test plan and test suite catalog, see [`TEST_PLAN.md`](../../TEST_PLAN.md).

---

## 🎯 Test Architecture & Quality Standards (Historical)

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

## 📋 Detailed Historical Test Case Matrix (Phases 1 – 24)

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

---

### 11. Differentiated Planning & Buy Mode Card Ergonomics

| Test ID     | Scenario                           | Assertion                                                                                                                             |
| :---------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **DIFF-01** | Buy Mode Ultra-Minimalist Content  | In Buy Mode, item cards render only Checkbox, Item Name, and Shelf Price.                                                             |
| **DIFF-02** | Buy Mode Secondary Element Hiding  | Category icon, quantity pill, store badge, normalized unit price, deal rating badge, comparator button, and remove button are hidden. |
| **DIFF-03** | Buy Mode Tap Price Modal Trigger   | Tapping shelf price in Buy Mode opens the Quick Price bottom sheet modal for instant price correction.                                |
| **DIFF-04** | Buy Mode Tap Check Interaction     | Tapping checkbox or card background in Buy Mode marks item as checked with haptic vibration.                                          |
| **DIFF-05** | Buy Mode Touch Swipe Retention     | Swipe Right marks Done; Swipe Left opens In-Aisle Comparator pre-filled.                                                              |
| **DIFF-06** | Planning Mode Expanded Header      | In Planning Mode, item cards render Category icon, Item name, Store badge, and Deal rating badge in row 1.                            |
| **DIFF-07** | Planning Mode Metrics Intelligence | Quantity & unit pill, normalized unit price ($/kg, $/L, $/ea), and historical ATL baseline are rendered.                              |
| **DIFF-08** | Planning Mode Action Toolbar       | Action row renders 1-tap Compare (`⚖️`), Edit (`✏️`), Remove (`🗑️`) buttons alongside estimated price.                                |

---

### 12. Network-First Navigation, PWA Update Lifecycle & QA Cache Controls

| Test ID        | Scenario                              | Assertion                                                                                                             |
| :------------- | :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| **PWA-UPD-01** | Service Worker Version Bump (v3)      | `sw.js` bumps cache name to `"smart-buy-list-v3"`.                                                                    |
| **PWA-UPD-02** | Network-First Navigation Handling     | `sw.js` intercepts navigation requests with network-first strategy and 2.5s timeout fallback to cached `index.html`.  |
| **PWA-UPD-03** | Cache-First Static Asset Retention    | `sw.js` preserves cache-first strategy for static assets (`./icon.svg`, `./manifest.webmanifest`, CDN resources).     |
| **PWA-UPD-04** | `SKIP_WAITING` Message Listener       | `sw.js` responds to `{ type: 'SKIP_WAITING' }` messages by calling `self.skipWaiting()`.                              |
| **PWA-UPD-05** | Client `controllerchange` Auto-Reload | `index.html` listens for `controllerchange` on `navigator.serviceWorker` and triggers `window.location.reload()`.     |
| **PWA-UPD-06** | Material 3 Update Notification Toast  | When a new worker is in `installed`/`waiting` state, `showUpdateToast()` renders the M3 update notification.          |
| **PWA-UPD-07** | Update Button Message Dispatch        | Clicking the "Update Now" button in the toast posts `{ type: 'SKIP_WAITING' }` to the waiting worker.                 |
| **PWA-UPD-08** | Multi-Trigger Update Discovery        | `registration.update()` is called on startup, on `visibilitychange` (when document becomes visible), and on interval. |
| **PWA-UPD-09** | Option Hub "Check for Updates"        | Clicking "Check for Updates" in Option Hub invokes `registration.update()` and shows user feedback toast.             |
| **PWA-UPD-10** | Option Hub "Purge Cache & Reload"     | Clicking "Purge Cache & Reload" clears all CacheStorage keys, unregisters service workers, and reloads the window.    |
| **PWA-UPD-11** | Bilingual Parity for Update UI        | 100% of update and cache-purge strings exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                         |

---

### 13. Price History Re-order & Batch Restocking

| Test ID        | Scenario                          | Assertion                                                                                                                                                   |
| :------------- | :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REORDER-01** | Single Item Quick-Add from Ledger | Clicking 1-tap `+` on a ledger entry creates a new active Buy List item with inherited name, store, category, quantity, unit, and price.                    |
| **REORDER-02** | Case-Insensitive Deduplication    | Re-ordering an item that already exists on the active list increments its target quantity by the ledger entry's quantity and updates reference price.       |
| **REORDER-03** | Multi-Select Checkbox Selection   | Checking one or more ledger rows updates selection state and reveals the sticky batch action toolbar (`#ledgerBatchBar`).                                   |
| **REORDER-04** | Sticky Batch Bar Metrics          | Batch action bar accurately displays the count of selected items and computed estimated subtotal cost.                                                      |
| **REORDER-05** | Select All / Deselect All Toggle  | Tapping `[Select All]` checks all visible filtered rows; tapping again deselects all rows and hides the batch bar.                                          |
| **REORDER-06** | Batch Re-order Execution          | Clicking `Add Selected to Buy List` transfers all selected ledger entries into active list, clears selections, and hides the batch bar.                     |
| **REORDER-07** | Actionable Toast Navigation       | After adding items from ledger, toast displays actionable `[View List]` button which closes Price History modal, sets phase to `PLANNING`, and scrolls top. |
| **REORDER-08** | PWA Version Bump Synchronization  | `sw.js` bumps cache name to `smart-buy-list-v3.1.0` and `index.html` displays synchronized version badge `v3.1.0`.                                          |
| **REORDER-09** | Bilingual Parity for Re-order UI  | 100% of ledger re-order and batch restocking strings exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                                                 |

---

### 14. Clipboard JSON Interchange (Export & Multi-Format Import)

| Test ID     | Scenario                              | Assertion                                                                                                                     |
| :---------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- |
| **CLIP-01** | Copy Buy-List JSON from Share Modal   | Clicking 'Copy Buy-List JSON' writes valid JSON `{ title, items }` to `navigator.clipboard` and shows success toast.          |
| **CLIP-02** | Copy Full Backup JSON from Settings   | Clicking 'Copy Backup JSON' in Option Hub writes full `memoryState` JSON to `navigator.clipboard` and shows success toast.    |
| **CLIP-03** | Paste Full Backup JSON Auto-Restore   | Pasting JSON containing `activeList`/`purchaseLedger` shows confirmation modal and restores application state.                |
| **CLIP-04** | Paste Buy-List JSON Auto-Merge        | Pasting JSON with `{ title, items }` or `{ t, i }` stages `pendingSharedList` and launches `#importModal` (Merge or Replace). |
| **CLIP-05** | Paste `#share=` Link URL              | Pasting a URL containing `#share=<base64>` extracts hash payload, decodes items, and launches `#importModal`.                 |
| **CLIP-06** | Clipboard Fallback Modal Presentation | If clipboard read is denied or unsupported, opens Paste Dialog Modal (`#pasteJsonModal`) with textarea and import trigger.    |
| **CLIP-07** | Corrupted Clipboard Data Resilience   | Pasting non-JSON, non-URL garbage displays localized warning toast (`toast_invalid_clipboard_data`) without throwing.         |
| **CLIP-08** | Bilingual Parity for Clipboard UI     | 100% of clipboard export/import keys exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                                   |

---

### 15. Native BarcodeDetector QR Scanner in Option Hub (Superseded by ADR-0018)

| Test ID     | Scenario                             | Assertion                                                                                                                                         |
| :---------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SCAN-01** | QR Scanner Modal Trigger in Settings | Clicking 'Scan QR Code' in Option Hub opens `#qrScannerModal` with video viewfinder, reticle, and camera switch controls.                         |
| **SCAN-02** | Camera Hardware Stream Lifecycle     | Opening scanner requests `getUserMedia({ video: { facingMode: 'environment' } })`; closing modal immediately calls `track.stop()` on all tracks.  |
| **SCAN-03** | BarcodeDetector QR Code Decode       | When `BarcodeDetector.detect()` identifies a `#share=` URL or Buy-List JSON, triggers haptic feedback, stops stream, and launches `#importModal`. |
| **SCAN-04** | Non-Buylist Scanned Content Guard    | Scanning an arbitrary external URL displays informative toast without navigating away or corrupting state.                                        |
| **SCAN-05** | Static QR Image Upload Fallback      | Selecting an image file via `#qrImageFileInput` decodes the QR code from image bitmap and routes payload to `#importModal`.                       |
| **SCAN-06** | Camera Flip / Facing Mode Toggle     | Clicking 'Flip Camera' toggles facingMode between `environment` and `user` and restarts video stream cleanly.                                     |
| **SCAN-07** | Bilingual Parity for Scanner UI      | 100% of scanner modal, camera permission, and error strings exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                                |

---

### 16. Ledger Deletion, Comparator Unit Sync & Form Pre-fill (v3.2.0)

| Test ID        | Scenario                                       | Assertion                                                                                                                                           |
| :------------- | :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LEDGER-01**  | Row-Level Delete Action                        | Clicking `🗑️` on a ledger row executes `deleteLedgerItem(id)`, removes entry from `memoryState.purchaseLedger`, and refreshes table.                |
| **LEDGER-02**  | Multi-Select Batch Delete                      | Selecting multiple ledger checkboxes and clicking `#btnDeleteSelectedLedger` removes all selected entries and hides batch bar.                      |
| **LEDGER-03**  | Dynamic ATL & Deal Rating Recalculation        | Deleting the lowest price record dynamically recomputes All-Time Low (ATL) and deal scoring on active list cards without reload.                    |
| **COMP-01**    | 13-Unit Dropdown Population                    | `#compUnitA` and `#compUnitB` contain all 13 supported units (`kg`, `g`, `lb`, `oz`, `L`, `ml`, `gal`, `fl oz`, `ea`, `pk`, `box`, `can`, `bunch`). |
| **COMP-02**    | Unit Casing & Active Item Unit Sync            | `openItemComparator(itemId)` sets `#compUnitA` to `item.unit` (including `L`, `lb`, `pk`, `box`, etc.) without defaulting to `g`.                   |
| **COMP-03**    | Dimension Auto-Alignment                       | `openItemComparator(itemId)` initializes `#compUnitB` to the matching dimension base unit (`kg`, `L`, `ea`), avoiding immediate mismatch.           |
| **PREFILL-01** | Apply Winner to Form (Price/Qty/Unit)          | `applyComparatorWinner()` transfers winning price, quantity, and unit into `#inputItemPrice`, `#inputItemQty`, `#inputItemUnit`.                    |
| **PREFILL-02** | Apply Winner to Form (Domain Context Pre-fill) | When comparing an active item, `applyComparatorWinner()` pre-fills `#inputItemName`, `#inputItemCategory` (Aisle), and `#inputItemStore`.           |
| **PREFILL-03** | Planning Navigation & Form Focus               | `applyComparatorWinner()` sets trip phase to `PLANNING`, invokes `updateLiveUnitPreview()`, and closes `#comparatorModal`.                          |
| **PWA-01**     | PWA Version Bump Synchronization               | `sw.js` bumps cache name to `smart-buy-list-v3.2.0` and `index.html` displays synchronized version badge `v3.2.0`.                                  |
| **I18N-01**    | Bilingual Parity for New Actions               | 100% of ledger delete and comparator prefill translation keys exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                                |

---

### 17. Google Drive Cloud Sync Storage Seam & GIS OAuth (v3.3.0)

| Test ID        | Scenario                                     | Assertion                                                                                                                                            |
| :------------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEAM-01**    | `StorageProvider` Seam Interface             | `StorageProvider`, `IndexedDBStorageProvider`, and `GoogleDriveStorageProvider` exist and inherit common async contracts.                            |
| **SEAM-02**    | `storageManager` Default Delegation          | `storageManager.getProvider()` defaults to `IndexedDBStorageProvider` and falls back gracefully to `localStorage` / memory state.                    |
| **GIS-01**     | Dynamic GIS Script Loader Offline Resilience | `loadGisScript()` fails gracefully offline without throwing or blocking app boot.                                                                    |
| **GIS-02**     | Ephemeral Token In-Memory Retention          | OAuth `access_token` is stored only in runtime memory; `localStorage` strictly stores only `google_client_id`.                                       |
| **DRIVE-01**   | AppData File Query & Discovery               | `queryAppDataFile()` issues valid `GET` request to Drive REST v3 `spaces=appDataFolder` searching for `smart_buy_list_data.json`.                    |
| **DRIVE-02**   | AppData Multipart File Creation              | `createAppDataFile()` issues valid multipart `POST` request with JSON metadata (`parents: ['appDataFolder']`) and state payload.                     |
| **DRIVE-03**   | AppData Media File Update                    | `updateAppDataFile(fileId)` issues `PATCH` request with `uploadType=media` and serialized state payload.                                             |
| **MERGE-01**   | Multi-Device Deterministic Smart Merge       | Merging local and remote states unions all purchase ledger records (preserving ATL), merges active items by latest `updatedAt`, and combines stores. |
| **TRIGGER-01** | Sync Trigger on Mutation & Startup           | `triggerDebouncedCloudSync()` initiates background sync after 3s debounce following state mutations when connected.                                  |
| **UI-SYNC-01** | Option Hub Cloud Sync Card Controls          | Renders Google Client ID input, Sign In/Out buttons, Last Synced timestamp, and manual Sync Now trigger in Option Hub.                               |
| **UI-SYNC-02** | Top App Bar Live Sync Status Pill            | Renders status indicator pill next to Settings `⚙️` transitioning through Synced (🟢), Syncing (🟡), Offline (⚪), and Error (🔴).                   |
| **PWA-01**     | PWA Version Bump Synchronization             | `sw.js` bumps cache name to `smart-buy-list-v3.3.0` and `index.html` displays synchronized version badge `v3.3.0`.                                   |
| **I18N-01**    | Bilingual Parity for Cloud Sync UI           | 100% of cloud sync translation keys exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                                                           |

---

### 18. GitHub Gist Cloud Sync & Multi-Provider Registry (v3.5.0)

| Test ID         | Scenario                                    | Assertion                                                                                                                                       |
| :-------------- | :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEAM-06**     | `GitHubGistStorageProvider` Inheritance     | `GitHubGistStorageProvider` exists, inherits `StorageProvider`, and implements `init`, `getState`, `saveState`, `sync`, `getStatus`.            |
| **REGISTRY-01** | `StorageManager` Multi-Provider Switching   | `storageManager.setActiveCloudProvider(type)` cleanly activates `none`, `googledrive`, or `github`, persisting choice in settings.              |
| **GIST-01**     | GitHub PAT Authentication & Headers         | `GitHubGistStorageProvider` requests attach `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, and `X-GitHub-Api-Version`. |
| **GIST-02**     | Secret Gist Creation Payload                | Creating a new Gist sends `POST /gists` with `"public": false`, description, and `files["smart_buy_list_data.json"]`.                           |
| **GIST-03**     | Gist Auto-Discovery via List                | Queries `GET /gists?per_page=100` and correctly detects Gist containing `smart_buy_list_data.json` or matching description.                     |
| **GIST-04**     | Gist Update (Patch)                         | Updates remote backup via `PATCH /gists/{gist_id}` with updated serialized JSON payload envelope.                                               |
| **GIST-05**     | Gist Read & `raw_url` Truncation Fallback   | If Gist API returns `truncated: true` or missing `content`, fetches full payload from `file.raw_url` with authorization header.                 |
| **GIST-06**     | Multi-Device Deterministic Smart Merge      | Merges GitHub Gist remote state with local IndexedDB state additively for ledger and by `updatedAt` for active items.                           |
| **TOKEN-01**    | Optional "Remember Token" Storage           | If "Remember Token" is checked, stores token in `localStorage.github_sync_token`; if unchecked, stores strictly in ephemeral memory.            |
| **UI-GIST-01**  | Option Hub Provider Dropdown & GitHub Panel | Option Hub renders Cloud Provider dropdown (`none`, `googledrive`, `github`), PAT input with visibility toggle, Gist ID, and helper link.       |
| **UI-GIST-02**  | Direct "View Gist on GitHub ↗" Link         | Displays clickable external link to `https://gist.github.com/<gist_id>` once Gist is identified/created.                                        |
| **UI-GIST-03**  | Dynamic Top App Bar Octocat / Provider Pill | Top App Bar sync pill displays 🐙 GitHub icon when GitHub is active and reflects Synced (🟢), Syncing (🟡), Offline (⚪), and Error (🔴).       |
| **PWA-02**      | PWA Version Bump Synchronization            | `sw.js` bumps cache name to `smart-buy-list-v3.5.0` and `index.html` displays synchronized version badge `v3.5.0`.                              |
| **I18N-02**     | Bilingual Parity for GitHub Gist UI         | 100% of GitHub sync translation keys exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                                                     |

---

### 19. Vietnamese-First Defaults, Smart Omnibox & Currency Ergonomics (v3.4.0)

| Test ID         | Scenario                                     | Assertion                                                                                                                                       |
| :-------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **VN-DEF-01**   | Vietnam-First Default State Initialization   | Initial state defaults to `language: 'vi'`, `currency: 'VND'`, `unitSystem: 'metric'`, empty `items: []`, and empty `purchaseLedger: []`.       |
| **VN-DEF-02**   | Default Vietnam Retail Store Roster          | `DEFAULT_STORES` contains `WinMart`, `Bách Hoá Xanh`, `Co.opmart`, `Big C / GO!`, `Lotte Mart`, `Chợ truyền thống`, `Cửa hàng tiện lợi`.        |
| **VN-DEF-03**   | Decommissioned Sample Banner                 | `#sampleDataBanner` element is removed from DOM and does not render on app initialization.                                                      |
| **VN-FLAG-01**  | Flag Emoji Language Toggle                   | Header language switcher `#langToggleBtn` renders `🇻🇳` in Vietnamese mode and `🇺🇸` in English mode; clicking toggles language without reload.   |
| **VND-CHIP-01** | Currency-Aware Step Chips (VND Mode)         | When `currency === 'VND'`, quick price adjustment chips render `[-50k, -10k, -5k, +5k, +10k, +50k]` and step by ±5000, ±10000, ±50000 ₫ safely. |
| **VND-CHIP-02** | Currency-Aware Step Chips (USD/Decimal Mode) | When `currency !== 'VND'`, quick price adjustment chips render `[-1.00, -0.50, -0.25, +0.25, +0.50, +1.00]`.                                    |
| **SMART-01**    | Smart Omnibox Price Extraction               | `parseSmartGroceryInput('Sữa 35k/l')` correctly extracts name 'Sữa', price 35000, quantity 1, and unit 'L'.                                     |
| **SMART-02**    | Smart Omnibox Vietnamese Number Formatting   | `parseSmartGroceryInput('Thịt bò 120.000 500g')` correctly extracts price 120000, quantity 500, unit 'g'.                                       |
| **SMART-03**    | Smart Omnibox Auto-Category Classification   | Automatically assigns category: `produce` for vegetables, `dairy_eggs` for milk/eggs, `meat_seafood` for beef/fish, `pantry` for spices/rice.   |
| **SMART-04**    | Smart Omnibox Store Extraction               | `parseSmartGroceryInput('Rau muống 10k @winmart')` extracts store 'WinMart' and item 'Rau muống'.                                               |
| **SMART-05**    | 1-Tap Direct Add with Enter / ➕             | Submitting Smart Omnibox stages item into active list, resets input, updates KPIs, and shows Undo toast.                                        |
| **SMART-06**    | Multi-Line Clipboard Batch Ingest            | Pasting multi-line text into `#smartQuickInput` parses all lines in parallel and stages all items with batch summary toast.                     |
| **UNIT-VN-01**  | Expanded Packaging Units Normalization       | Units `loc`, `thung`, `khay`, `tui`, `hu` normalize unit prices with discrete count dimension base.                                             |
| **ICON-01**     | Icon-First Action Triggers                   | Ledger table quick add uses `➕` icon button with accessible tooltip; top bar buttons streamlined for touch.                                    |
| **I18N-VN-01**  | Bilingual Parity for Smart Omnibox Tokens    | 100% of Smart Omnibox and Vietnamese units translation keys exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.                              |

---

### 20. Calm Cloud Sync, Adaptive Historical Ledger & Startup Flag Parity (v3.5.0)

| Test ID       | Scenario                                       | Assertion                                                                                                                                         |
| :------------ | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FLAG-01**   | Startup Language Flag Markup Default           | HTML markup initializes `#langToggleBtn` with `🇻🇳` national flag emoji.                                                                           |
| **FLAG-02**   | Runtime Language Switcher Flag Synchronization | `setLanguage('vi')` sets `#langToggleBtn` to `🇻🇳`; `toggleLanguage()` switches to English with `🇺🇸`.                                              |
| **FLAG-03**   | Startup Flag Override Elimination              | `initApp()` preserves national flag emoji on application boot without overriding with literal text `"VI"` or `"EN"`.                              |
| **SYNC-01**   | Top App Bar Header Decluttering                | `#topBarSyncStatus` button is decommissioned from the header bar; sync status is consolidated cleanly inside Option Hub (`#cloudSyncStatusPill`). |
| **SYNC-02**   | Calm Adaptive Idle Debounce                    | `triggerDebouncedCloudSync()` operates with a relaxed 15-second idle debounce delay (capped at 45s from initial mutation).                        |
| **SYNC-03**   | Tab Backgrounding Flush                        | When `document.visibilityState === "hidden"`, any pending debounced cloud sync is flushed immediately before sleep/backgrounding.                 |
| **SYNC-04**   | Tab Wakeup Pull & App Boot Sync                | When `document.visibilityState === "visible"` after $> 120\text{s}$ inactivity or on app startup, automatically syncs with active cloud provider. |
| **SYNC-05**   | Trip Completion Immediate Push                 | `finishShoppingTrip()` flushes pending changes and triggers cloud sync immediately upon completion.                                               |
| **GDRIVE-01** | Direct Setup Guide Link in Option Hub          | Google Drive panel renders a direct link to `docs/google-drive-cloud-sync-guide.md`.                                                              |
| **GDRIVE-02** | 1-Click Authorized JavaScript Origin Copier    | Option Hub renders `#gdriveCurrentOrigin` container with `window.location.origin` and 1-tap `copyCurrentOriginToClipboard()` button.              |
| **GDRIVE-03** | State-Aware Google Drive Action Controls       | Shows full-width Sign In button when disconnected; dynamically reveals Disconnect, Sync Now, and Force Push/Pull actions when authenticated.      |
| **LEDGER-01** | Adaptive Mobile Card Representation            | `#priceLedgerModal` renders `#ledgerMobileCards` on mobile screens ($< 640\text{px}$) with bold title, store badge, date, and unit price badge.   |
| **LEDGER-02** | Mobile Touch Targets ($\ge 44\text{px}$)       | Mobile ledger cards provide $\ge 44\text{px}$ touch targets for Quick Add (`➕`) and Delete (`🗑️`) buttons.                                       |
| **LEDGER-03** | Spacious Desktop Data Table Layout             | `#priceLedgerModal` renders `#ledgerTableContainer` on desktop screens ($\ge 640\text{px}$) with `text-sm` typography and `h-5 w-5` checkboxes.   |
| **PWA-03**    | PWA Cache Invalidation & Version Bump          | `sw.js` cache name is `smart-buy-list-v3.6.0`, `manifest.webmanifest` version is `3.6.0`, and UI version badge displays `v3.6.0`.                 |
| **I18N-03**   | Bilingual Parity for v3.5.0 Polish Strings     | 100% of new cloud sync, guide link, origin copier, and adaptive ledger translation keys exist in both `TRANSLATIONS.en` and `TRANSLATIONS.vi`.    |

---

### 21. PWA Companion Asset Compaction, Single-Source Versioning & Release Packaging (v3.6.0)

| Test ID    | Scenario                                     | Assertion                                                                                                                                           |
| :--------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PWA-04** | Single-Source Manifest Versioning (`3.6.0`)  | `manifest.webmanifest.version` is `"3.6.0"`, `dist/sw.js` CACHE_NAME is `smart-buy-list-v3.6.0`, and `dist/index.html` statically stamped `v3.6.0`. |
| **PWA-05** | Companion Asset Terser Minification & Syntax | `dist/sw.js` is minified with `terser` (smaller than source, zero comments) and evaluates without error in a mock ServiceWorker context.            |
| **PWA-06** | Production Tailwind CDN Purge & Integrity    | `dist/sw.js` purges `https://cdn.tailwindcss.com` from `ASSETS_TO_CACHE`, and 100% of cached local files physically exist in `dist/`.               |
| **PWA-07** | Standalone Deployable PWA Release Packaging  | `scripts/pack-release.js` packages dedicated standalone PWA deployment archive (`smart-buy-list-price-tracker-<version>.zip`) with complete assets. |

---

### 22. Deterministic 3-Way Cloud Merge, Deletion Tombstones & Mutation Concurrency (v3.7.0)

| Test ID      | Scenario                                   | Assertion                                                                                                                                     |
| :----------- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **TOMB-01**  | Tombstone Lifecycle & 30-Day TTL Pruning   | `pruneDeletedTombstones` purges tombstones older than 30 days while preserving recent deletion records.                                       |
| **TOUCH-01** | Touch Mutation Invariants                  | All item mutators update `item.updatedAt` monotonically and clear resurrecting tombstones.                                                    |
| **ZOMB-01**  | Zombie Item & Ledger Resurrection Guard    | `mergeCloudState` prevents deleted items, ledger records, and stores from reappearing when merging remote payloads.                           |
| **3WAY-01**  | 3-Way Differential Merge Engine            | In-flight local mutations occurring during remote async network requests are preserved in the final merged state without overwrite data loss. |
| **TRIP-01**  | Atomic Trip Completion & Deterministic IDs | `finalizeTripCompletion` generates unique deterministic IDs (`rec_<timestamp>_<idx>_<random>`) and sets item deletion tombstones.             |

---

### 23. Planning Trip Completion, Clean Empty State, Ledger Ergonomics & Comparator Unit Sync (v3.8.0)

| Test ID       | Scenario                                      | Assertion                                                                                                                                |
| :------------ | :-------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **CLEAN-01**  | Sample Button Removal from Empty State Card   | `#btnLoadSampleEmpty` removed from `#emptyListCard`; `#btnResetSampleData` preserved in Option Hub Settings.                             |
| **CLEAN-02**  | Buy Mode Empty Switch-to-Planning Action      | `#btnEmptySwitchToPlanning` appears in empty Buy Mode and switches trip phase to `PLANNING`; hidden in Planning Mode.                    |
| **PLAN-01**   | Adaptive Planning Mode finishTripBar Presence | `#finishTripBar` dynamically shown in Planning Mode when `checkedCount > 0`; hidden when `checkedCount === 0`; always shown in Buy Mode. |
| **PLAN-02**   | Context-Aware Trip Summary Prompt             | `#tripSummaryPrompt` displays `trip_planning_prompt` in Planning Mode and `trip_active` in Buy Mode.                                     |
| **LEDGER-01** | Batch Bar Action Ordering & Labels            | `btnAddSelectedLedgerToBuyList` on left; `btnDeleteSelectedLedger` on right with text label span `#btnTextDeleteSelectedLedger`.         |
| **LEDGER-02** | Mobile Card Delete Button Alignment & Text    | Mobile ledger cards render Add on left (`flex-1`) and Delete on right with icon & localized text label `btn_delete_ledger_item`.         |
| **COMP-01**   | Bidirectional Unit Group Auto-Sync            | `syncComparatorUnitGroup` aligns Package B to Package A's dimension (and vice versa) across Weight (`kg`), Volume (`L`), Count (`ea`).   |
| **COMP-02**   | Real-Time Instant Re-comparison               | All price, quantity, and unit inputs trigger `runComparatorCalc()` immediately without manual blur or dimension mismatch error.          |
| **VER-01**    | PWA v3.8.0 Single-Source Versioning           | `manifest.webmanifest`, `sw.js` cache name, and `index.html` version badge synchronized to `3.8.0`.                                      |
| **I18N-01**   | 100% Bilingual Parity for v3.8.0 Keys         | 100% dictionary symmetry between English and Vietnamese for all new empty state, planning prompt, and delete button strings.             |

---

### 24. Enhanced Share Buy-List, Complete QR Purge, Symmetrical Settings & Buy Mode Polish (v3.9.0)

| Test ID         | Scenario                                  | Assertion                                                                                                                                          |
| :-------------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUY-01**      | In-Store Empty Buy-List Complete Trip Bar | `#finishTripBar` is hidden in Buy Mode (`IN_STORE`) when active shopping list is empty (`items.length === 0`), and shown when 1+ items exist.      |
| **SYNC-01**     | GitHub Gist Cloud Sync Error Diagnostics  | `syncCloudNow()` interpolates `{msg}` in `toast_github_sync_error` with `(res.error \|\| "Unknown")` across English and Vietnamese.                |
| **SETTINGS-01** | Complete QR Scanner Purge                 | `#qrScannerModal`, `#btnOpenQrScanner`, camera streaming, and barcode detection helpers are completely purged from HTML and JavaScript.            |
| **SETTINGS-02** | Symmetrical 2x2 Data Interchange Grid     | Settings modal displays symmetrical `[ Export File \| Copy JSON ] / [ Import File \| Paste JSON ]` layout with full backup export/import fidelity. |
| **SHARE-01**    | Human-Readable Checklist Export           | `generateBuyListTextChecklist` formats Markdown checklist with store tags, quantities, estimated prices, total, and web share link to clipboard.   |
| **SHARE-02**    | Rich Web Share API Integration            | `invokeNativeShare` shares title, checklist summary, and compressed web URL via `navigator.share` with graceful fallback to copy link.             |
| **SHARE-03**    | Standalone Buy-List JSON Export           | `exportBuyListJsonFile` triggers browser download of `smart-buy-list-YYYY-MM-DD.json` containing active shopping list data.                        |
| **SHARE-04**    | Zero External QR Network Calls            | `#shareModal` has no QR image container (`#shareQrContainer`), hint text, or third-party image service calls (`api.qrserver.com`).                 |
| **VER-02**      | PWA v3.9.0 Single-Source Versioning       | `manifest.webmanifest`, `sw.js` cache name (`smart-buy-list-v3.9.0`), and `index.html` version badge synchronized to `3.9.0`.                      |
| **I18N-02**     | 100% Bilingual Parity for v3.9.0 Keys     | 100% dictionary symmetry between English and Vietnamese for all new share actions, backup labels, and toast strings.                               |
