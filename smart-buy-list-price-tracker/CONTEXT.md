# Smart Buy-List & Unit Price Tracker

> **Lifecycle Phase:** `Hardened Stable` ([ADR-0003](../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

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
- **Last Purchased Price**: Normalized unit price paid on the chronologically most recent completed shopping trip for an item, derived by ordering ledger entries chronologically.
  _Avoid_: Recent price, previous cost, prior price.
- **Deal Rating / Price Indicator**: Real-time visual assessment of current shelf price against historical records:
  - 🟢 **Great Deal**: Current unit price is $\le$ All-Time Low ($P_{\text{min}}$) or $\le 0.90 \times P_{\text{avg}}$ ($\ge 10\%$ below historical average).
  - 🟡 **Fair / Market Price**: Current unit price is within $\pm 10\%$ of historical average ($0.90 \times P_{\text{avg}} < P_{\text{unit}} \le 1.10 \times P_{\text{avg}}$) and $\le 1.15 \times P_{\text{last}}$.
  - 🔴 **Price Spike / Inflated**: Current unit price is $> 1.10 \times P_{\text{avg}}$ (exceeds $+10\%$ of historical average) or $> 1.15 \times P_{\text{last}}$ (exceeds $+15\%$ above last paid price).
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
  1. **Planning Mode**: Adding items via full-width Smart Omnibox (`#smartQuickInput`) or Collapsible Add Form (with automatic parsing and pre-fill when expanding `Detailed Options`), full editing via `#editItemModal` (Name, Category, Store, Qty, Unit, Price on 1 responsive row), adjusting quantities, assigning stores/aisles, estimating trip spend with streamlined two-tier cards and swipe-first actions. Features adaptive Trip Completion bar when checked items exist (`checkedCount > 0`).
  2. **In-Store Buy Mode**: Focused distraction-free checklist with heads-up in-aisle intelligence (displaying bold normalized unit price and All-Time Low delta alongside shelf price), single-line ambient pacing ticker, hidden planning chrome, and touch swipe gestures.
  3. **Trip Victory Receipt Phase (`#tripVictoryModal`)**: Celebratory modal calculating total money saved against baseline prices, highlighting the single Best Deal of the trip, logging verified purchases into the historical ledger, and offering 1-tap unpurchased item rollover.
     _Avoid_: Shopping cart run, checkout session, shopping list run, rollover popup.
- **Differentiated Item Card Ergonomics**:
  - **Planning Mode Card (Two-Tier)**: Clean two-row container: Row 1 (Checkbox + Item Icon & Name + Total Price), Row 2 (Quantity Stepper + Normalized Unit Price + Deal Rating Badge), with secondary actions delegated to swipe gestures or 3-dot menu.
  - **Buy Mode Card (In-Aisle Intelligence)**: Focused container with thumb-friendly checkbox, item name, clickable shelf price, bold normalized unit price, and ATL percentage delta.
    _Avoid_: Uniform card layout, static list item.
- **Item Rollover**: Automatic transfer of unchecked/unpurchased items into a new draft list upon trip completion.
  _Avoid_: Carryover, push to next, leftover migrate.

---

#### 5. Sharing, Backup & Data Portability

- **Share Buy-List Hub (`#shareModal`) & CompressionStream Codec**: Self-contained sharing modal offering 4 focused actions without third-party dependencies:
  1. 📱 **Share via Apps** (`invokeNativeShare`): Web Share API sharing title, checklist summary, and compressed web URL with copy fallback.
  2. 📋 **Copy Formatted Checklist** (`copyBuyListTextChecklist`): Copies human-readable Markdown/plain-text checklist with items, quantities, stores, prices, total spend, and web import URL.
  3. 🔗 **Copy Shareable Link** (`copyShareUrl`): Copies compressed `#share=<payload>` URL to clipboard utilizing browser-native `CompressionStream('deflate')` and URL-safe Base64 (with backward-compatible decompression of legacy uncompressed payloads).
  4. 📥 **Download Buy-List File (.json)** (`exportBuyListJsonFile`): Downloads standalone JSON file of active list.
     _Avoid_: QR visualizer, external image service, raw dump.
- **Interactive Smart Merge Protocol (`#mergeReviewModal` / `#importModal`)**: Recipient client protocol that parses incoming shared URLs or JSON payloads:
  - Interactive conflict review dialog displaying item diff badges: `[🆕 New]` (New item), `[🔄 New Price]` (Price update), `[⚖️ Qty Diff]` (Quantity diff), `[✅ Match]` (Exact match).
  - Per-item resolution strategies:
    1. _Quantity Strategy_: Keep Local ($Q_{\text{local}}$), Take Remote ($Q_{\text{remote}}$), or Sum Quantities ($Q_{\text{sum}} = Q_{\text{local}} + Q_{\text{remote}}$).
    2. _Price Catalog Sync_: Adopt shared store prices and refresh master catalog price baselines.
    3. _Save as Draft & New List_: Snapshot current list before creating isolated new list.
       _Avoid_: Overwrite import, blind merge, data replace.
- **Symmetrical 2x2 Data Management & Snapshot Safeguards (Settings Modal)**:
  - **Row 1**: `[ 💾 Export File | 📋 Copy JSON ]` (Full database backup file download & clipboard copy).
  - **Row 2**: `[ 📥 Import File | 📋 Paste JSON ]` (Full database restore with `#backupPreviewModal` side-by-side comparison, metadata inspection, and pre-restore snapshot).
  - **Rolling Snapshots Engine**: Automated rolling snapshots store in IndexedDB (`snapshots`) preserving last 3 trip completions and pre-restore states with 1-tap restore.
    _Avoid_: Asymmetric backup buttons, Option Hub, camera scanner popup.
- **Storage Provider Seam & Multi-Cloud Sync (`IStorageProvider`)**:
  - `IndexedDBStorageProvider`: Default offline-first local persistence engine (`SmartBuyListDB`, v2) with localStorage/memory fallback.
  - `GoogleDriveStorageProvider`: Cloud provider syncing with Google Drive hidden `appDataFolder` (`smart_buy_list_data.json`) via REST API v3 and Google Identity Services (GIS OAuth 2.0).
  - `GitHubGistStorageProvider`: Cloud provider syncing with private Secret GitHub Gists via GitHub REST API v3 and Personal Access Token (PAT) with auto-discovery, `raw_url` fallback, and detailed diagnostic error interpolation.
  - `Deterministic 3-Way Cloud Merge Engine (Merge3)`: Non-destructive multi-device conflict resolution uniting purchase ledger transactions, syncing active list items by `updatedAt` timestamps, merging store profiles, and preserving in-flight user mutations.
  - `Deletion Tombstone Infrastructure & 30-Day TTL Pruning`: Explicit deletion tracking (`_deleted: { items, ledger, stores }`) with ISO-8601 timestamps, preventing zombie item/ledger/store resurrections, auto-pruned after 30 days (`TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000`).
  - `Calm Adaptive Cloud Sync & Ambient Header Indicator`: 15-second idle debounce (capped at 45s), tab backgrounding flush (`visibilitychange`), trip completion push, and tab wakeup pull after 120s inactivity. Real-time glanceable status badge in sticky header (`#headerCloudSyncBadge`: 🟢 Synced, 🔵 Syncing, 🟡 Offline/Pending, 🔴 Error) alongside detailed Settings card (`#cloudSyncStatusPill`).
    _Avoid_: Polling loop, aggressive live sync, constant sync spinners.

---

### 6. PWA & Mobile Ergonomics

- **Standalone PWA Shell & Single-Source Versioning (v4.6.2)**: Installable Progressive Web App with Service Worker (`sw.js`) and Web App Manifest (`manifest.webmanifest`). Application version is single-sourced in `manifest.webmanifest` (`version: 4.6.2`), dynamically hydrated in dev (`#pwaVersionBadge`), and stamped into `dist/sw.js` (`CACHE_NAME = "smart-buy-list-v4.6.2"`) and `dist/index.html` during compaction build. Full iOS PWA support adds `viewport-fit=cover` and `env(safe-area-inset-*)` safe-area padding for the sticky header, MD3 bottom nav, and toasts (notch / Dynamic Island / home indicator). Companion assets include minified `sw.js` (Terser), compacted JSON manifest, purged Tailwind CDN cache, Cloudflare Pages clickjacking protection `_headers` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), and standalone `.zip` packaging.
- **Pure Event Delegation & Zero-Inline Handlers**: All item card action buttons dispatch strictly via root-level event delegation (`handleItemCardDelegatedClick`) on `document`, using `data-action` and `data-item-id` with strict `/^[a-zA-Z0-9_-]+$/` format validation and cryptographic monotonic IDs (`item_${timestamp}_${randomUUID.slice(0,8)}`). Redundant inline `onclick` handlers are completely eliminated to prevent double-invocation regressions.
- **Unchecked Checkbox Clarity & Ergonomics**: Checkboxes use an unambiguous hollow outline (`bg-transparent border-2 border-slate-600 hover:border-emerald-500`) with zero checkmark glyphs in the DOM when unchecked (`${item.checked ? '<span aria-hidden="true">✓</span>' : ''}`). Checked items render a solid emerald fill with checkmark (`bg-emerald-600 border-emerald-500 text-white`). Buy Mode retains an extra-large 44px thumb target (`w-11 h-11`) while Planning Mode uses a compact target (`w-8 h-8`).
- **Unclipped Planning Card Overflow Menu & Multi-Point Deletion**: `#cardContainer-${safeId}` dynamically elevates and toggles `overflow-visible` when `#cardMenu-${safeId}` opens, preventing menu clipping and ensuring full access to Compare, Edit, and Remove. `#editItemModal` provides a dedicated destructive `🗑️ Delete Item` button for direct modal-based removal.
- **Two-Tier Native PWA Back Navigation with Exit Guard**: Back navigation (`popstate`) orchestrates a strict dismissal and exit hierarchy:
  1. _Tier 1 (Modals)_: If `modalHistoryStack` contains active dialogs, dismiss topmost modal and stay on active tab.
  2. _Tier 2 (Tab History)_: Tab switches push `{ tab }` state to `window.history`. Back steps backward through viewed tabs, returning to `PLANNING`.
  3. _Tier 3 (Root Exit Guard - "Press back again to exit")_: If at root `PLANNING` tab with zero active modals, the initial back event intercepts navigation, displays a localized toast (_"Nhấn quay lại lần nữa để thoát"_ / _"Press back again to exit"_), and arms a 2000ms exit window timer. Pressing back a second time within 2000ms permits browser/PWA exit; otherwise the guard re-arms.
- **Responsive Tablet & Mobile Deal Intelligence (`sm:` 640px Breakpoint)**:
  - Consistent case-insensitive item lookup (`normalizeItemKey(name)`) prevents casing mismatches between active items and ledger records.
  - Distinct `⚪ New Item` (`⚪ Hàng Mới`) badge displays for items without historical transactions.
  - On mobile phones (`< 640px`): Deal badges display emoji icons only (`🟢`, `🟡`, `🔴`, `⚪`) in Planning cards, Buy mode cards, Item Comparator, and Mobile Ledger cards to maximize precious horizontal space.
  - On tablet and desktop (`>= 640px`, `sm:inline`): Deal badges expand to display both emoji and full localized label (e.g. `🟢 Great Deal` / `🟢 Giá Siêu Tốt`).
  - Desktop Price History Table (`#ledgerTableContainer`, $\ge 640\text{px}$) features a dedicated **Deal Rating** column (`Đánh Giá Giá`).
- **Resilient Gist Cloud Sync & Status Polish**:
  - `extractGistId(input)` seamlessly extracts 32-hex IDs from raw strings or full Gist URLs (`https://gist.github.com/...`).
  - Anonymous public Gist download allows users to force-download and import shared Gist data without requiring personal access tokens.
  - Expressive animated cloud iconography (`#headerCloudSyncBadge`, `#cloudSyncStatusPill`) visually differentiates in-flight syncing (animated spinning/pulsing cloud), completion checkmark, warning alert, and offline states.
- **Telemetry & Hosting Layer Privacy**: The client-side application operates completely tracker-free with zero runtime analytics scripts. Static delivery via Cloudflare Pages provides privacy-preserving aggregate HTTP telemetry without personal tracking.
- **Material You (MD3) 4-Tab Page Navigation**: 4-destination bottom navigation bar (`Planning`, `Buy`, `Price History`, `Comparator`) managing 4 full page views within `<main>`.
- **Horizontal Page Swipe Gestures & Gesture Hierarchy**: Horizontal swipe gestures navigate across the 4 tabs smoothly ($|\Delta X| \ge 50\text{px}$ and $|\Delta X| > 1.5 \times |\Delta Y|$). In-aisle item card swipe gestures (Swipe Right = Check/Done + Haptic Vibrate; Swipe Left = Open Comparator with active item pre-filled) are isolated and take precedence over page horizontal swipe actions.
- **Modal Light Dismiss & History Popstate Ergonomics**: Modals close on backdrop tap, Escape key, or browser/Android back navigation via `window.history.pushState` integration.
- **Full-Width Smart Quick-Entry Omnibox & NLP Parser**: Single-line omnibox input (`#smartQuickInput`) with 100% full width and live preview pill (`#smartQuickPreview`). Expanding `Detailed Options` transfers all parsed NLP attributes directly into the full add item form.
- **Compact 1-Line 3-Column Item Detail Edit**: Form layout featuring `Qty`, `Unit`, `Price` in a clean single row with concise labels.
- **Currency-Aware Quick Price Adjustment Chips**: Bottom sheet dialogs with dynamic 1-tap delta chips adapting to active currency (`[-50k, -10k, -5k, +5k, +10k, +50k]` for `VND`, `[±0.25, ±0.50, ±1.00]` for `USD`).

- **Modular Source Architecture & Build Pipeline (ADR-0031)**:
  - Structured module authoring under `src/` (`domain/`, `types/`, `state/`, `storage/`, `sync/`, `sharing/`, `ui/`, `i18n/`) preserving standalone single-file distribution via build inlining.
  - Strict JSDoc domain typing (`MasterItem`, `ListItem`, `LedgerEntry`, `SyncPayload`, `Snapshot`) with `checkJs` linting.
  - Centralized observable state container (`createStore`) replacing ad-hoc global `memoryState` mutations.

---

- **In-Aisle Quick Price Popover (`#quickPricePopover`)**: Lightweight, 1-tap in-aisle price editor anchored directly to Buy Mode cards, allowing rapid price corrections with numeric input and 1-tap "Save & Update Ledger" without full modal disruption.
- **Interactive Starter Hauls & Zero-Result Recovery**: Contextual empty states with 1-tap "Weekly Essentials Starter Haul" button, category quick-add chips, and clear recovery actions when active filters yield 0 matches.
- **Sticky Section Grouping & Subtotal Rollup**: Department and store group headers stick beneath the top app bar (`sticky top-14`) with department icons, item counts, and live running subtotal rollups.
- **Spring Micro-Interactions & Reduced Motion**: Tactile spring physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for checkbox states, smooth list transition into completed trays, and fluid progress bar updates, strictly dampened to `0.01ms` when `prefers-reduced-motion: reduce` is active.

---

## 📚 Architectural Decision Records (ADRs)

- [ADR-0001: Persistence, Cloud Sync, and Deterministic 3-Way Merge](./docs/adr/0001-persistence-cloud-sync-and-deterministic-3way-merge.md)
- [ADR-0002: Measurement Normalization, Deal Scoring, and Parser Intelligence](./docs/adr/0002-measurement-normalization-deal-scoring-and-parser-intelligence.md)
- [ADR-0003: PWA Modular Source Architecture and Security Hardening](./docs/adr/0003-pwa-modular-source-architecture-and-security-hardening.md)
- [ADR-0004: UI/UX Navigation, Gesture Hierarchy, and Interaction Design](./docs/adr/0004-ui-ux-navigation-gesture-hierarchy-and-interaction-design.md)
- [ADR-0005: Test Architecture, Artifact-First Invariants, and Harness](./docs/adr/0005-test-architecture-artifact-first-invariants-and-harness.md)
