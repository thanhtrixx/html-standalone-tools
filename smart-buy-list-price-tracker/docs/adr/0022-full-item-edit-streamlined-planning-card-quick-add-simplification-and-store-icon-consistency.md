# ADR-0022: Full Item Edit, Streamlined Planning Card, Quick Add Simplification & Store Icon Consistency

## Status

Accepted (v3.13.0)

## Context

Following user feedback on real-world grocery shopping and planning workflows in version 3.12.0, five key UI/UX ergonomics issues were identified:

1. **Incomplete Item Editing in Planning Mode**:
   - In `Planning Mode`, clicking `✏️ Edit` on an item card opened `quickPriceModal` (originally built for in-store shelf price tweaks), which only allowed editing `price` and `quantity`.
   - Shoppers could not edit the item name, category department, assigned store, or measurement unit without deleting and recreating the item from scratch.

2. **Planning Item Card Visual Clutter & Broken Layouts**:
   - The top row of Planning cards displayed a redundant store badge (`🏪 Store`), which took up valuable horizontal space alongside long item names and deal badges.
   - Deal rating badges (`🟢 Great Deal`, `🟡 Fair Price`, `🔴 Price Spike`) occupied top-row space and forced wrapping on small mobile displays.

3. **Inconsistent Delete Button Styling & Terminology**:
   - In `Historical Purchase Ledger`, deletion was handled by a compact red-tinted icon button `[ 🗑️ ]` (`bg-red-500/20 text-red-300 border-red-500/40`) with tooltip/title "Delete record" / "Xoá bản ghi".
   - In Planning Mode cards, it was rendered as an unstyled text button `[ 🗑️ Remove ]` / `[ 🗑️ Xoá ]`. Terminology and button ergonomics needed unification across the application.

4. **Quick Add Omnibox Layout Breakage on Mobile**:
   - The `<select id="smartQuickStoreSelect">` dropdown embedded inside the single-line Quick Add Omnibox compressed the text input on mobile screens (< 640px), causing text truncation and awkward wrapping.
   - The omnibox parser already supported natural language `@store` shorthand (e.g., `Sữa tươi 35k @winmart`) and automatic store filter context inheritance.

5. **Inconsistent Store Icon Presence**:
   - Some components displayed store emoji icons (`🏪`), such as By Store group headers and the Store Manager title, while other components (ledger rows, store filter chips, dropdowns, Omnibox preview) displayed clean plain text without icons.

6. **PWA Version Lifecycle (v3.13.0)**:
   - Version increment required across web app manifests, service workers, UI version badges, and documentation suites.

---

## Decisions

### 1. Dual-Modal Editing Architecture: Full Edit Modal (`#editItemModal`) vs. Quick Price Update (`#quickPriceModal`)

- **Dedicated Full Edit Item Modal (`#editItemModal`)**:
  - In `Planning Mode`, clicking `✏️ Edit` opens `#editItemModal` with full support for:
    - **Item Name** (`#editItemName` text input, autofocus).
    - **Category / Department** (`#editItemCategory` select with all 10 departments).
    - **Assigned Store** (`#editItemStore` select with all active stores + "Manage Stores...").
    - **Quantity / Pack Size** (`#editItemQty` number input, `min="0.01"`).
    - **Measurement Unit** (`#editItemUnit` select with all 13 standard units across Mass, Volume, and Count).
    - **Package / Shelf Price** (`#editItemPrice` number input with currency formatting).
    - **Live Normalized Unit Price & Deal Intelligence Preview** (`#editItemLivePreview` showing unit price and real-time deal scoring badge as inputs change).
    - **Cancel & Save Actions** (`#btnCancelEditItem`, `#btnSaveEditItem`).
- **Dedicated Quick Price Update Modal (`#quickPriceModal`)**:
  - In `In-Store Buy Mode`, tapping an item price or card continues to open the lightweight bottom sheet `#quickPriceModal` with 1-tap currency delta chips for distraction-free in-aisle price updates.

### 2. Streamlined 3-Row Planning Card Hierarchy

- **Row 1 (Header)**:
  - Large thumb-friendly Checkbox (`✓`), Category Icon, and Item Name.
  - Redundant store badge removed completely from the top row to give maximum space to product names.
- **Row 2 (Metrics & Deal Intelligence)**:
  - Package Size badge (`📦 1 kg`).
  - Normalized Unit Price badge (`35.000 ₫/kg`).
  - Relocated Deal Rating Badge:
    - **Mobile (`< 640px`)**: Compact emoji icon only (`🟢`, `🟡`, `🔴`, `⚪`) with explanatory tooltip.
    - **Desktop (`>= 640px`)**: Full descriptive badge (`🟢 Great Deal`, `🟡 Fair Price`, `🔴 Price Spike`, `⚪ New Item`).
  - Historical All-Time Low (ATL) benchmark (`ATL: 30.000 ₫/kg` or `New Item`).
- **Row 3 (Actions & Spend)**:
  - Action Toolbar: `[ ⚖️ Compare ]`, `[ ✏️ Edit ]`, and `[ 🗑️ Remove ]` / `[ 🗑️ Xoá ]` red-tinted action button.
  - Right: Total estimated package price (`35.000 ₫`).

### 3. Unified Delete Action Ergonomics & Vocabulary

- Standardized the Planning Card delete button to a red-tinted action button `[ 🗑️ Remove ]` / `[ 🗑️ Xoá ]` (`bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg`) matching the structural ergonomics of adjacent Compare and Edit buttons.

### 4. Quick Add Omnibox Simplification

- Removed `#smartQuickStoreSelect` dropdown from the Quick Add Omnibox row.
- The `#smartQuickInput` field expands to **100% full width**, preventing layout wrapping on small mobile screens.
- Store assignment in Quick Add is resolved cleanly:
  1. Active Store Filter Chip context (if a specific store is filtered, e.g. "Costco").
  2. Natural language `@store` shorthand typed in the input (e.g. `@winmart`).
  3. Default to the primary store or "General".
  4. Detailed upfront store selection remains available in the Collapsible Detailed Add Form (`#addItemSection`) and via Full Edit Modal.

### 5. Store Emoji Purge for Clean Typography

- Purged `🏪` store emoji icons across all store components:
  - "By Store" grouping header displays clean text `${sName}` without emoji prefix.
  - Store Manager dialog header uses standard tool icon `⚙️ Manage Stores` / `Quản lý cửa hàng`.
  - Settings Store Manager entry uses clean standard styling.

### 6. Header Bar Uniform Height & Currency Order Polish

- Standardized all 4 header action controls (`langToggleBtn`, `themeToggleBtn`, Share button, and `btnOpenSettings`) with uniform `h-8` height and `inline-flex items-center justify-center` alignment.
- Elevated `VND (₫)` to the top option in Settings Default Currency (`#settingsCurrencySelect`).

### 7. Single-Source PWA Version Bump (v3.13.0)

- Version bumped to `3.13.0` across `manifest.webmanifest`, `sw.js` (`CACHE_NAME = "smart-buy-list-v3.13.0"`), and `index.html` badge.

---

## Consequences

- **Editing Freedom**: Shoppers in Planning Mode can completely update any item attribute without losing historical price association or recreating items.
- **Mobile Ergonomics**: Removing the Quick Add store dropdown and relocating deal badges produces clean, unbroken single-line layouts across all mobile screen sizes.
- **Visual Consistency**: Consistent delete buttons and clean typography without arbitrary emoji prefixes elevate the user experience to professional standards.
- **Bilingual Symmetry**: 100% Vietnamese and English dictionary key parity maintained.
