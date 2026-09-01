# Smart Buy-List & Unit Price Tracker (v4.1.0)

A standalone, mobile-first Progressive Web Application (PWA) designed for grocery and household shopping list management, multi-store purchase ledger tracking, real-time package unit price normalization, and in-aisle deal intelligence.

For Vietnamese domain vocabulary, copywriting standards, and the bilingual terminology guide, refer to [`I18N.md`](./I18N.md).

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. Catalog, Items & Packaging

- **Master Item**: Canonical grocery/household product definition in persistent catalog (e.g. _Whole Milk_, _Jasmine Rice_, _Extra Virgin Olive Oil_). Contains default categorization, preferred measurement unit, and links to historical purchase records.
  _Avoid_: Product entry, inventory record, stock item, grocery SKU.
- **List Item (Active Item)**: Product currently on active shopping list with target quantity, assigned store, target aisle, estimated price, purchase state (pending or checked), and custom package size notes.
  _Avoid_: Cart item, task, todo entry, buy line.
- **Package Size**: Physical quantity contained in a single packaged product unit (e.g. `450g`, `1.2kg`, `750ml`, `1.5L`, `12 eggs`, `6 cans`).
  _Avoid_: Net weight, container volume, pack size, portion.
- **Measurement Dimension & Base Unit**: Standardized physical dimensions for mathematical price comparison:
  - **Mass / Weight**: Base unit is **Kilogram (`kg`)**; sub-units: Gram (`g`), Ounce (`oz`), Pound (`lb`).
  - **Volume / Liquid**: Base unit is **Litre (`L`)**; sub-units: Millilitre (`ml`), Fluid Ounce (`fl oz`), Gallon (`gal`).
  - **Count / Discrete**: Base unit is **Piece / Unit (`ea` / `unit`)**; sub-units: Pack (`pk`), Box (`box`), Bottle / Can (`can`), Bundle / Bunch (`bunch`), Pack of 4/6 (`loc` / Lốc), Carton / Case (`thung` / Thùng), Tray (`khay`), Bag (`tui`), Jar (`hu` / Hũ).
    _Avoid_: Measurement type, size category, quantity metric.

---

### 2. Pricing, Normalization & Deal Intelligence

- **Nominal Package Price ($P$)**: Sticker shelf price paid for an entire package or unit.
  _Avoid_: Sticker price, total price, raw cost.
- **Normalized Unit Price ($P_{\text{unit}}$)**: Price per standardized base unit ($/kg, $/L, $/ea, ₫/kg, ₫/L, ₫/cái) computed as:
  $$P_{\text{unit}} = \frac{P}{\text{Normalized Base Quantity}}$$
  _Avoid_: Unit cost, per-gram price, rate, unit rate.
- **Historical Purchase Ledger**: Chronological log of verified purchases recording `item_id`, `store_id`, `date`, `package_price`, `package_size`, `unit_price`, and `notes`. Supports row-level deletion (`🗑️`) and multi-select batch deletion with dynamic recalculation of All-Time Low (ATL) and Deal ratings. Embedded as a full-page view container under the `Price History` tab.
  _Avoid_: Price history table, expense log, purchase history database.
- **All-Time Low (Best Price Ever)**: Minimum normalized unit price ($P_{\text{min}}$) recorded across all historical purchases and stores for a specific master item.
  _Avoid_: Record low, lowest price, baseline price.
- **Last Purchased Price**: Normalized unit price paid on the most recent completed shopping trip for an item, including store and date.
  _Avoid_: Recent price, previous cost, prior price.
- **Deal Rating / Price Indicator**: Real-time visual assessment of current shelf price against historical records:
  - 🟢 **Great Deal**: Current unit price is $\le$ All-Time Low or $\ge 10\%$ below historical average.
  - 🟡 **Fair / Market Price**: Current unit price is within $\pm 5\%$ of historical average.
  - 🔴 **Price Spike / Inflated**: Current unit price is $\ge 10\%$ higher than last paid price or historical average.
    _Avoid_: Bargain score, discount level, sale badge.
- **In-Aisle Package Comparator**: Full page view comparing 2 package configurations side-by-side (e.g. _Brand A: 450g @ $3.20* vs *Brand B: 1.2kg @ $7.80_) with universal 13-unit dimension alignment, bidirectional unit group auto-sync, percentage savings calculation, and "Apply Winner to Form" context pre-filling. Can be accessed via the bottom `Comparator` tab or invoked directly from any active list item via swipe left gesture.
  _Avoid_: Price calculator, aisle widget, package comparison tool.
- **Ledger-to-BuyList Re-order & Restocking**: Workflow enabling shoppers to review past purchases in the ledger and stage/transfer them onto the active Buy List via 1-tap quick add (`➕`) or multi-select batch adding with sticky summary bar, attribute inheritance, and case-insensitive consolidation.
  _Avoid_: History copy, receipt cloner, repeat order button.

---

### 3. Stores, Aisles & Organization

- **Store Profile & Store Manager**: Retail venue stored in persistent state (`memoryState.stores`). Managed via Store Manager modal (`⚙️ Manage Stores` / `Quản lý cửa hàng`) supporting Add, Rename (with cascade to active list items and ledger records), and Delete.
  _Avoid_: Merchant, shop, vendor, supermarket.
- **Active List Grouping (`By Aisle` vs `By Store`)**:
  - **By Aisle (Department)**: Items partitioned by store aisle category following walking route order, with department badge and item counts.
  - **By Store**: Items partitioned by retail venue with clean store typography (`${sName}`), item count, and computed store subtotal.
    _Avoid_: Tab sort, category flip, list splitter.
- **Department / Aisle Category**: Navigational grouping representing store departments (Produce, Dairy & Eggs, Meat & Seafood, Bakery, Pantry & Grains, Frozen, Beverages, Household & Cleaning, Personal Care, Other).
  _Avoid_: Item tag, section, aisle name, product group.

---

### 4. Shopping Trip Lifecycle

- **Shopping Trip**: Structured shopping session transitioning through three lifecycle stages:
  1. **Planning Mode**: Adding items via full-width Smart Omnibox (`#smartQuickInput`) or Collapsible Add Form (with automatic parsing and pre-fill when expanding `Detailed Options`), full editing via `#editItemModal` (Name, Category, Store, Qty, Unit, Price on 1 responsive row), adjusting quantities, assigning stores/aisles, estimating trip spend with streamlined 3-row cards. Features adaptive Trip Completion bar when checked items exist (`checkedCount > 0`).
  2. **In-Store Buy Mode**: Focused distraction-free checklist with ultra-minimalist cards (checkbox, item name, clickable shelf price opening `#quickPriceModal` with fast delta chips), live running totals, pacing progress, and touch swipe gestures. Automatically hides trip finish bar when buy-list is empty.
  3. **Trip Summary & Completion Phase**: Prompts to log verified purchase prices into the historical ledger, calculate actual trip expenditure, and offer unpurchased item rollover or discard.
     _Avoid_: Shopping cart run, checkout session, shopping list run.
- **Differentiated Item Card Ergonomics**:
  - **Planning Mode Card**: Streamlined 3-row container with rich domain metadata, unit price calculations, responsive deal indicator badges, and unified red-tinted delete action.
  - **Buy Mode Card**: Ultra-minimalist single-row container with thumb-friendly checkbox, pure item name, and clickable shelf price for fast bottom-sheet edits.
    _Avoid_: Uniform card layout, static list item.
- **Item Rollover**: Automatic transfer of unchecked/unpurchased items into a new draft list upon trip completion.
  _Avoid_: Carryover, push to next, leftover migrate.

---

### 5. Sharing, Backup & Data Portability

- **Share Buy-List Hub (`#shareModal`)**: Self-contained sharing modal offering 4 focused actions without third-party dependencies:
  1. 📱 **Share via Apps** (`invokeNativeShare`): Web Share API sharing title, checklist summary, and web URL with copy fallback.
  2. 📋 **Copy Formatted Checklist** (`copyBuyListTextChecklist`): Copies human-readable Markdown/plain-text checklist with items, quantities, stores, prices, total spend, and web import URL.
  3. 🔗 **Copy Shareable Link** (`copyShareUrl`): Copies compressed `#share=<payload>` URL to clipboard.
  4. 📥 **Download Buy-List File (.json)** (`exportBuyListJsonFile`): Downloads standalone JSON file of active list.
     _Avoid_: QR visualizer, external image service, raw dump.
- **Smart Merge Protocol (`#importModal`)**: Recipient client protocol that parses incoming shared URLs or JSON payloads with 3 non-destructive options:
  1. _Import as New List_ (isolated new list).
  2. _Merge into Active List_ (append unique items, deduplicate by name).
  3. _Sync Price Catalog_ (adopt shared store prices).
     _Avoid_: Overwrite import, blind merge, data replace.
- **Symmetrical 2x2 Data Management (Settings Modal)**:
  - **Row 1**: `[ 💾 Export File | 📋 Copy JSON ]` (Full database backup file download & clipboard copy).
  - **Row 2**: `[ 📥 Import File | 📋 Paste JSON ]` (Full database restore from file or clipboard with auto-detect hierarchy and fallback dialog).
    _Avoid_: Asymmetric backup buttons, Option Hub, camera scanner popup.
- **Storage Provider Seam & Multi-Cloud Sync (`IStorageProvider`)**:
  - `IndexedDBStorageProvider`: Default offline-first local persistence engine (`SmartBuyListDB`, v2) with localStorage/memory fallback.
  - `GoogleDriveStorageProvider`: Cloud provider syncing with Google Drive hidden `appDataFolder` (`smart_buy_list_data.json`) via REST API v3 and Google Identity Services (GIS OAuth 2.0).
  - `GitHubGistStorageProvider`: Cloud provider syncing with private Secret GitHub Gists via GitHub REST API v3 and Personal Access Token (PAT) with auto-discovery, `raw_url` fallback, and detailed diagnostic error interpolation.
  - `Deterministic 3-Way Cloud Merge Engine (Merge3)`: Non-destructive multi-device conflict resolution uniting purchase ledger transactions, syncing active list items by `updatedAt` timestamps, merging store profiles, and preserving in-flight user mutations.
  - `Deletion Tombstone Infrastructure & 30-Day TTL Pruning`: Explicit deletion tracking (`_deleted: { items, ledger, stores }`) with ISO-8601 timestamps, preventing zombie item/ledger/store resurrections, auto-pruned after 30 days (`TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000`).
  - `Calm Adaptive Cloud Sync`: 15-second idle debounce (capped at 45s), tab backgrounding flush (`visibilitychange`), trip completion push, and tab wakeup pull after 120s inactivity. Status indicator pill located exclusively in Settings (`#cloudSyncStatusPill`).
    _Avoid_: Polling loop, aggressive live sync, constant header sync pill.

---

### 6. PWA & Mobile Ergonomics

- **Standalone PWA Shell & Single-Source Versioning**: Installable Progressive Web App with Service Worker (`sw.js`) and Web App Manifest (`manifest.webmanifest`). Application version is single-sourced in `manifest.webmanifest` (`version: 4.1.0`), dynamically hydrated in dev (`#pwaVersionBadge`), and stamped into `dist/sw.js` (`CACHE_NAME = "smart-buy-list-v4.1.0"`) and `dist/index.html` during compaction build. Companion assets include minified `sw.js` (Terser), compacted JSON manifest, purged Tailwind CDN cache, and standalone `.zip` packaging.
- **Material You (MD3) 4-Tab Page Navigation**: 4-destination bottom navigation bar (`Planning`, `Buy`, `Price History`, `Comparator`) managing 4 full page views within `<main>`.
- **Horizontal Page Swipe Gestures & Gesture Hierarchy**: Horizontal swipe gestures navigate across the 4 tabs smoothly ($|\Delta X| \ge 50\text{px}$ and $|\Delta X| > 1.5 \times |\Delta Y|$). In-aisle item card swipe gestures (Swipe Right = Check/Done + Haptic Vibrate; Swipe Left = Open Comparator with active item pre-filled) are isolated and take precedence over page horizontal swipe actions.
- **Modal Light Dismiss & History Popstate Ergonomics**: Modals close on backdrop tap, Escape key, or browser/Android back navigation via `window.history.pushState` integration.
- **Full-Width Smart Quick-Entry Omnibox & NLP Parser**: Single-line omnibox input (`#smartQuickInput`) with 100% full width and live preview pill (`#smartQuickPreview`). Expanding `Detailed Options` transfers all parsed NLP attributes directly into the full add item form.
- **Compact 1-Line 3-Column Item Detail Edit**: Form layout featuring `Qty`, `Unit`, `Price` in a clean single row with concise labels.
- **Currency-Aware Quick Price Adjustment Chips**: Bottom sheet dialogs with dynamic 1-tap delta chips adapting to active currency (`[-50k, -10k, -5k, +5k, +10k, +50k]` for `VND`, `[±0.25, ±0.50, ±1.00]` for `USD`).

---

## 📚 Architectural Decision Records (ADRs)

- [ADR-0001: IndexedDB Storage Engine & Google Drive Sync Seam](./docs/adr/0001-indexeddb-storage-engine-and-google-drive-sync-seam.md)
- [ADR-0002: Measurement Normalization & Deal Scoring Intelligence](./docs/adr/0002-measurement-normalization-and-deal-scoring-intelligence.md)
- [ADR-0003: URL Payload Compression & PWA Offline Architecture](./docs/adr/0003-url-payload-compression-and-pwa-offline-architecture.md) _(Partially superseded by ADR-0014, 0015, 0018)_
- [ADR-0004: Material You Navigation & Item Comparator](./docs/adr/0004-material-you-navigation-and-item-comparator.md)
- [ADR-0005: Store Management, Grouping, Swipe Gestures & Option Hub](./docs/adr/0005-store-management-grouping-swipe-gestures-and-option-hub.md) _(Superseded by ADR-0026)_
- [ADR-0006: Differentiated Planning & Buy Mode Card UX](./docs/adr/0006-differentiated-planning-and-buy-mode-card-ux.md)
- [ADR-0007: PWA Service Worker Lifecycle & Update Strategy](./docs/adr/0007-pwa-service-worker-lifecycle-and-update-strategy.md)
- [ADR-0008: Price History Buy List Reorder](./docs/adr/0008-price-history-buy-list-reorder.md)
- [ADR-0009: Clipboard JSON Interchange & Native QR Scanner](./docs/adr/0009-clipboard-json-interchange-and-native-qr-scanner.md) _(Superseded by ADR-0018)_
- [ADR-0010: Ledger Item Deletion, Comparator Unit & Form Prefill](./docs/adr/0010-ledger-item-deletion-comparator-unit-and-form-prefill.md)
- [ADR-0011: Google Drive Cloud Sync Storage Seam](./docs/adr/0011-google-drive-cloud-sync-storage-seam.md) _(Partially superseded by ADR-0014, 0016)_
- [ADR-0012: GitHub Gist Cloud Storage Provider](./docs/adr/0012-github-gist-cloud-storage-provider.md) _(Partially superseded by ADR-0014, 0016, 0018)_
- [ADR-0013: Vietnamese-First Defaults, Smart Omnibox & Currency Ergonomics](./docs/adr/0013-vietnamese-first-defaults-smart-omnibox-and-currency-ergonomics.md)
- [ADR-0014: Calm Cloud Sync, Adaptive Ledger & Vietnamese Flag Polish](./docs/adr/0014-calm-cloud-sync-adaptive-ledger-and-vietnamese-flag-polish.md)
- [ADR-0015: PWA Companion Asset Compaction & Single-Source Versioning](./docs/adr/0015-pwa-companion-asset-compaction-and-single-source-versioning.md)
- [ADR-0016: Deterministic 3-Way Cloud Merge, Deletion Tombstones & Mutation Concurrency](./docs/adr/0016-deterministic-3way-cloud-merge-tombstones-and-concurrency.md)
- [ADR-0017: Planning Trip Completion, Clean Empty State, Ledger Ergonomics & Comparator Unit Sync](./docs/adr/0017-planning-trip-completion-ledger-ergonomics-and-comparator-unit-sync.md)
- [ADR-0018: Enhanced Share Buy-List, Complete QR Code Purge, Symmetrical Settings File Interchange & In-Store Trip Bar Polish](./docs/adr/0018-share-enhancement-qr-removal-and-buy-mode-polish.md)
- [ADR-0019: GitHub Gist 403 Resiliency, Ledger Price Increment, Country Flag Branding & Dedicated Store Filter Chips](./docs/adr/0019-github-gist-403-resiliency-ledger-price-increment-and-store-filter-chips.md)
- [ADR-0020: Quick Add Store Picker, Available-Only Store Filtering, Clean Filter Chips, GitHub Rate Limit Resiliency & Symmetrical Cloud Overrides](./docs/adr/0020-quick-add-store-picker-available-store-filter-and-github-ratelimit-resiliency.md)
- [ADR-0021: Unified Trip Completion Bar Visibility, Settings Data Management Button Standardization, GitHub Rate Limit Diagnostics & Cloud Sync Semantics](./docs/adr/0021-unified-trip-completion-settings-sample-buttons-github-ratelimit-diagnostics-and-sync-semantics.md)
- [ADR-0022: Full Item Edit, Streamlined Planning Card, Quick Add Simplification & Store Icon Consistency](./docs/adr/0022-full-item-edit-streamlined-planning-card-quick-add-simplification-and-store-icon-consistency.md)
- [ADR-0023: Harden parseSmartGroceryInput Parser, Store Aliases & Validation Guards](./docs/adr/0023-harden-smart-grocery-input-parser-and-store-aliases.md)
- [ADR-0024: innerHTML User Input Sanitization & Content-Security-Policy Meta Tag](./docs/adr/0024-sanitize-innerhtml-and-content-security-policy.md)
- [ADR-0025: IndexedDB Storage Engine & GitHub PAT Security Migration](./docs/adr/0025-indexeddb-storage-engine-and-pat-security-migration.md)
- [ADR-0026: 4-Tab Page Navigation, Horizontal Swipe Gestures, Modal Ergonomics & Omnibox Pre-Fill](./docs/adr/0026-four-tab-page-navigation-gesture-hierarchy-modal-ergonomics-and-omnibox-prefill.md)
