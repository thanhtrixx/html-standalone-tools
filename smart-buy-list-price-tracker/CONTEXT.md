# Smart Buy-List & Unit Price Tracker

A standalone, mobile-first Progressive Web Application (PWA) designed for grocery and household shopping list management, multi-store purchase ledger tracking, real-time package unit price normalization, and in-aisle deal intelligence.

For Vietnamese domain vocabulary, copywriting standards, and the bilingual terminology guide, refer to [I18N.md](./I18N.md).

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. Catalog, Items & Packaging

**Master Item**:
A canonical grocery or household product definition stored in the persistent item catalog (e.g. _Whole Milk_, _Jasmine Rice_, _Extra Virgin Olive Oil_, _Free-Range Eggs_). Contains default categorization, preferred measurement unit, and links to historical purchase records.
_Avoid_: Product entry, inventory record, stock item, grocery SKU.

**List Item (Active Item)**:
An instance of a product currently on an active shopping list with target quantity, assigned store, target aisle, estimated price, purchase state (pending or checked), and optional custom package size notes.
_Avoid_: Cart item, task, todo entry, buy line.

**Package Size**:
The physical quantity contained in a single packaged product unit (e.g. `450g`, `1.2kg`, `750ml`, `1.5L`, `12 eggs`, `6 cans`).
_Avoid_: Net weight, container volume, pack size, portion.

**Measurement Dimension & Base Unit**:
The standardized physical dimension used to normalize prices for direct mathematical comparison:

- **Mass / Weight**: Base unit is **Kilogram (`kg`)**; sub-units include Gram (`g`), Ounce (`oz`), Pound (`lb`).
- **Volume / Liquid**: Base unit is **Litre (`l`)**; sub-units include Millilitre (`ml`), Fluid Ounce (`fl oz`), Gallon (`gal`).
- **Count / Discrete**: Base unit is **Piece / Unit (`ea` / `unit`)**; sub-units include Pack (`pk`), Box (`box`), Bottle / Can (`can`), Bundle / Bunch (`bunch`), Pack of 4/6 (`loc` / Lốc), Carton / Case (`thung` / Thùng), Tray (`khay`), Bag (`tui`), Jar (`hu` / Hũ).
  _Avoid_: Measurement type, size category, quantity metric.

---

### 2. Pricing, Normalization & Deal Intelligence

**Nominal Package Price ($P$)**:
The sticker shelf price paid for an entire package or unit.
_Avoid_: Sticker price, total price, raw cost.

**Normalized Unit Price ($P_{\text{unit}}$)**:
The mathematically calculated price per standardized base unit ($/kg, $/L, $/ea, ₫/kg, ₫/L, ₫/cái) calculated as:
$$P_{\text{unit}} = \frac{P}{\text{Normalized Base Quantity}}$$
_Avoid_: Unit cost, per-gram price, rate, unit rate.

**Historical Purchase Ledger**:
A chronological log of verified purchases recording `item_id`, `store_id`, `date`, `package_price`, `package_size`, `unit_price`, and `notes`. Supports row-level deletion (🗑️) and multi-select batch deletion to maintain accurate price records, triggering dynamic recalculation of All-Time Low (ATL) and Deal ratings.
_Avoid_: Price history table, expense log, purchase history database.

**All-Time Low (Best Price Ever)**:
The minimum normalized unit price ($P_{\text{min}}$) recorded across all historical purchases and stores for a specific master item.
_Avoid_: Record low, lowest price, baseline price.

**Last Purchased Price**:
The normalized unit price paid on the most recent completed shopping trip for an item, including the store where it was bought and the date.
_Avoid_: Recent price, previous cost, prior price.

**Deal Rating / Price Indicator**:
A real-time visual assessment of a product's current shelf price compared against its historical records:

- 🟢 **Great Deal**: Current unit price is $\le$ All-Time Low or $\ge 10\%$ below historical average.
- 🟡 **Fair / Market Price**: Current unit price is within $\pm 5\%$ of historical average.
- 🔴 **Price Spike / Inflated**: Current unit price is $\ge 10\%$ higher than last paid price or historical average.
  _Avoid_: Bargain score, discount level, sale badge.

**In-Aisle Package Comparator**:
A dedicated rapid-entry modal enabling shoppers to compare 2 or more package configurations side-by-side (e.g. _Brand A: 450g @ $3.20_ vs _Brand B: 1.2kg @ $7.80_) with universal 13-unit dimension alignment (`kg`, `g`, `lb`, `oz`, `L`, `ml`, `gal`, `fl oz`, `ea`, `pk`, `box`, `can`, `bunch`), real-time percentage savings calculations, 1-tap list updating, and "Apply Winner to Form" domain context pre-filling (Name, Aisle, Store, Qty, Unit, Price). Can be invoked globally as a scratchpad or pre-populated directly from any active list item (Package A pre-filled).
_Avoid_: Price calculator, aisle widget, package comparison tool.

**Ledger-to-BuyList Re-order & Batch Restocking**:
The workflow enabling shoppers to review past purchases in the Historical Purchase Ledger and instantly stage or transfer them back onto the active Buy List using 1-tap quick add (`+`) or multi-select batch adding with sticky summary action bar, snapshot attribute inheritance, and case-insensitive quantity consolidation.
_Avoid_: History copy, receipt cloner, repeat order button.

---

### 3. Stores, Aisles & Organization

**Store Profile & Store Manager**:
A physical or online retail venue (e.g. _Costco, Trader Joe's, Local Wet Market, WinMart, Bach Hoa Xanh_) stored in persistent state (`memoryState.stores`). Managed via a dedicated Store Manager modal supporting Add, Rename (with automatic cascade to active list items and historical ledger records), and Delete.
_Avoid_: Merchant, shop, vendor, supermarket.

**Active List Grouping (`By Aisle` vs `By Store`)**:
A visual organization mechanism for the active buy-list:

- **By Aisle (Department)**: Items partitioned by store aisle category following store walking route order, complete with department badge and item counts.
- **By Store**: Items partitioned by retail venue with store icon, item count, and computed store subtotal ($).
  _Avoid_: Tab sort, category flip, list splitter.

**Department / Aisle Category**:
A navigational grouping representing physical store departments (e.g. _Produce / Vegetables_, _Dairy & Eggs_, _Meat & Seafood_, _Bakery_, _Pantry & Grains_, _Frozen_, _Beverages_, _Household & Cleaning_, _Personal Care_).
_Avoid_: Item tag, section, aisle name, product group.

**Store Route Optimization Order**:
An ordered walking sequence of aisle categories allowing shoppers to traverse supermarkets efficiently without doubling back.
_Avoid_: Aisle sorter, path optimizer, walking layout.

---

### 4. Shopping Trip Lifecycle

**Shopping Trip**:
A structured shopping session transitioning through three explicit lifecycle stages:

1. **Planning Mode**: Adding items via Material 3 Floating Action Button (FAB), adjusting quantities, assigning target stores/aisles, estimating trip spend with rich expanded item cards (header with store & deal badges, metrics with $/unit & historical ATL reference, action toolbar with 1-tap Compare, Edit, and Remove).
2. **In-Store Buy Mode**: Focused distraction-free in-aisle shopping mode with ultra-minimalist cards displaying exclusively the large checkbox, item name, and clickable shelf price, backed by live running totals, pacing progress, and touch swipe gestures.
3. **Trip Summary & Completion Phase**: Prompting to log verified purchase prices into the historical ledger, calculate actual trip expenditure, and offer unpurchased item rollover or discard.
   _Avoid_: Shopping cart run, checkout session, shopping list run.

**Differentiated Item Card Ergonomics**:
Tailored visual density and interaction models per lifecycle phase:

- **Planning Mode Card**: Expanded multi-row container presenting rich domain context (Category Icon, Item Name, Store Tag, Deal Score Badge, Quantity & Package Size Pill, Normalized Unit Price, Historical All-Time Low, Compare `⚖️`, Edit `✏️`, Remove `🗑️`, and Estimated Spend).
- **Buy Mode Card**: Ultra-minimalist single-row container presenting solely the essential check-off primitives (Thumb-friendly Checkbox `✓`, Pure Item Name, and Clickable Shelf Price for fast price corrections). Secondary metadata and destructive buttons are hidden.
  _Avoid_: Uniform card layout, static list item.

**Item Rollover**:
The process during Trip Completion where unchecked/unpurchased items are automatically transferred into a new draft list for the next shopping trip.
_Avoid_: Carryover, push to next, leftover migrate.

---

### 5. Sharing, Backup & Data Portability

**URL State Payload**:
A compressed, URL-safe Base64 string (using LZ-String compression) encoding the active buy-list state for instant, serverless peer-to-peer sharing via deep links, dynamic QR codes, and `navigator.share()`. Located in the Top App Bar.
_Avoid_: Share query, URL data, hash link.

**Smart Merge Protocol**:
The recipient client protocol that parses an incoming shared URL payload or JSON backup and offers 3 non-destructive options:

1. _Import as New List_ (isolated new list).
2. _Merge into Active List_ (append unique items, deduplicate by item name).
3. _Sync Price Catalog_ (optionally adopt historical store prices).
   _Avoid_: Overwrite import, blind merge, data replace.

**Settings (Preferences & Option Hub)**:
A centralized modal dialog accessible via the top app bar (`⚙️`) providing comprehensive user preferences (Default Currency, Language selection `EN`/`VI`, Default Grouping `By Aisle`/`By Store`), elevated store management access (`z-[60]` modal stacking), data backup/restore, IndexedDB storage sync status, and PWA version/update controls.
_Avoid_: Prefs panel, control center, admin menu.

**Storage Provider Seam & Multi-Cloud Sync Architecture**:
An abstracted TypeScript/JavaScript client-side storage architecture (`IStorageProvider`) decoupling domain data operations from physical storage implementations:

- `IndexedDBStorageProvider`: Default offline-first local persistence engine with memory and `localStorage` fallback.
- `GoogleDriveStorageProvider`: Composite cloud provider wrapping local storage and syncing with Google Drive's Application Data folder (`spaces=appDataFolder`) via REST API v3 and Google Identity Services (GIS `initTokenClient`) OAuth 2.0.
- `GitHubGistStorageProvider`: Composite cloud provider wrapping local storage and synchronizing with private/secret GitHub Gists (`smart_buy_list_data.json`) via GitHub REST API v3 and Personal Access Token (PAT) authentication with automatic Gist discovery and `raw_url` truncation fallback.
- `StorageManager Multi-Provider Registry`: Central manager orchestrating provider selection (`none`, `googledrive`, `github`) and dispatching mutation triggers.
- `Deterministic Cloud Smart Merge`: Non-destructive multi-device conflict resolution uniting purchase ledger transactions, synchronizing active list items by `updatedAt` timestamps, merging store profiles, and pushing consolidated state back to both local storage and the cloud.
  _Avoid_: Database driver, storage hook, backend adapter, cloud server sync.

**Clipboard JSON Interchange**:
A bidirectional clipboard transfer interface allowing shoppers to copy active buy-list JSON (`{ title, items }`) from the Share modal or full state backups from the Settings Option Hub, and paste multi-format payloads with automatic schema classification (full backup restore vs smart list merge) and a fallback text entry dialog.
_Avoid_: Copy-paste widget, clipboard tool, raw text dump.

**In-App Native QR Scanner**:
A camera viewfinder modal accessible in the Settings Option Hub that utilizes the browser-native `BarcodeDetector` API for real-time camera decoding with environment camera default, camera flip toggle, clean hardware track teardown, static image file upload fallback, and automatic dispatch into the Smart Merge Protocol.
_Avoid_: External QR scanner, barcode reader app, camera popup.

---

### 6. PWA & Mobile Ergonomics

**Standalone PWA Shell & Version Invalidation Rule**:
An installable Web Application utilizing Service Workers (`sw.js`) and Web App Manifest (`manifest.webmanifest`) providing instant Cache-First offline availability, home-screen installation on iOS and Android, and zero external runtime dependencies. Every code release strictly increments `CACHE_NAME` in `sw.js` and the version badge in `index.html` (e.g. `v3.3.0`) to ensure `Check for Updates` reliably discovers new Service Worker revisions.
_Avoid_: Web app wrapper, mobile site, hybrid app.

**Material You (MD3) In-Aisle Navigation**:
A single-source-of-truth 4-destination bottom navigation bar (`Planning`, `Buy Mode`, `Price History`, `Comparator`) built with Material 3 surface containers, pill active indicators, and thumb-friendly touch targets ($\ge 48\text{px}$). Top card mode toggle pills are eliminated to prevent duplicate navigation controls.
_Avoid_: Footer controls, bottom tabs, static menu.

**In-Aisle Touch Swipe Gestures**:
Direct swipe actions on list item cards:

- **Swipe Right**: Reveals green check indicator; releasing marks item as Done/Checked with tactile haptic vibration (`navigator.vibrate([15])`).
- **Swipe Left**: Reveals emerald/indigo scale indicator; releasing opens the In-Aisle Package Comparator pre-filled with that item's details.
  _Avoid_: Slide button, drag action, swipe widget.

**In-Store Shopping Progress Pacing**:
A visual progress bar and completion indicator in Buy Mode displaying real-time checked metrics (`X of Y items checked (Z%)`) and estimated remaining unpurchased spend.
_Avoid_: Cart counter, checklist meter.

**Aisle / Category Department Quick Filters**:
Horizontal scrollable category chips (`All`, `Produce`, `Dairy`, `Meat`, `Bakery`, `Pantry`, `Frozen`, `Beverages`, `Household`, `Personal Care`, `Other`) enabling shoppers to instantly isolate items located in the specific store aisle they are standing in.
_Avoid_: Tag filter, section tabs.

**MD3 Bottom Sheet Modal & Currency-Aware Adjustment Chips**:
Mobile-anchored bottom sheet dialogs with top drag indicators and dynamic 1-tap quick adjustment delta chips that adapt to the active currency: `[-50k, -10k, -5k, +5k, +10k, +50k]` when in `VND`, or `[±0.25, ±0.50, ±1.00]` when in `USD`, for rapid shelf price edits without opening the soft keyboard.
_Avoid_: Popup window, custom drawer.

**Smart Quick-Entry Omnibox & NLP Parser Engine**:
A frictionless single-line omnibox input at the top of Planning mode (`#smartQuickInput`) with real-time interpretation pill (`#smartQuickPreview`). Parses natural language grocery shorthand (e.g. `Sữa tươi 35k/l`, `Thịt ba chỉ 120k 500g WinMart`, `Trứng gà 30k 10 quả`) into structured items (Item Name, Quantity, Unit, Price, Store, Auto-classified Category) with 1-tap direct add (Enter/`➕`), instant Undo toast, and multi-line clipboard batch paste support.
_Avoid_: Command line, raw query input, terminal bar.

**Calm Adaptive Cloud Sync**:
A serene, battery-friendly cloud synchronization architecture that decommissions intrusive header sync pills in favor of clean Option Hub indicators (`#cloudSyncStatusPill`). Employs a relaxed 15-second idle debounce capped at 45 seconds, flushes mutations on tab backgrounding (`visibilitychange`), triggers immediate sync on trip completion, and pulls remote updates on application boot and tab wakeup after 120 seconds of inactivity.
_Avoid_: Polling loop, aggressive live sync, constant sync indicator.

**Adaptive Historical Purchase Ledger (Mobile Cards & Desktop Table)**:
A responsive dual-representation ledger in `#priceLedgerModal`. On mobile viewports ($< 640\text{px}$), renders touch-friendly cards (`#ledgerMobileCards`) with bold titles, store badges, prominent unit price badges, and $\ge 44\text{px}$ touch targets for Quick Add (`➕`) and Delete (`🗑️`). On desktop viewports ($\ge 640\text{px}$), renders a spacious, high-density data table (`#ledgerTableContainer`) with `text-sm` typography and `h-5 w-5` checkboxes.
_Avoid_: Fixed table, cramped mobile view, unscrollable ledger.

**Startup Language Flag Parity**:
An internationalization presentation rule ensuring that the active language button (`#langToggleBtn`) reliably renders the national flag emoji (`🇻🇳` for Vietnamese, `🇺🇸` for English) on startup without being overridden by literal text labels.
_Avoid_: Raw text switcher, locale code pill.
