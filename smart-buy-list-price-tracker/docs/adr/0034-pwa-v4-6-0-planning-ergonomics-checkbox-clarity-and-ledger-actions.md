# ADR-0034: PWA v4.6.0 Release, Planning Card Overflow & Deletion Ergonomics, Unchecked Checkbox Clarity, and Price History Touch Targets

## Status

Accepted (v4.6.0)

## Context

Following the release of Epic #335 (PRs #341–#345) which remediated prioritized UX critique defects P0–P4, product review identified 5 specific ergonomics, visual clarity, and versioning issues in `smart-buy-list-price-tracker`:

1. **PWA Version Synchronization**:
   - The application version remained at `4.5.1` despite the substantial architectural, visual, and workflow changes delivered in Epic #335. A formal SemVer bump to `v4.6.0` is required across `manifest.webmanifest`, `sw.js` cache name, `index.html`, and living documentation.
2. **Planning Overflow Menu Clipping & Inability to Delete Items**:
   - In `src/ui/gestures.js`, `#cardContainer-${safeId}` enforces `overflow-hidden` for swipe animations.
   - When the `⋯` button toggled `#cardMenu-${safeId}` (`absolute top-full right-0`), the dropdown was clipped by the container boundary. The `🗑️ Remove` button positioned at the bottom was completely hidden and unclickable.
   - Furthermore, `#editItemModal` (Full Item Edit) lacked a destructive delete button, leaving shoppers with zero discoverable path to remove items in Planning Mode.
3. **`#editItemDealBadge` Presentation**:
   - In `src/ui/comparator.js`, the live deal preview in `#editItemModal` rendered `<span class="hidden sm:inline ml-1">${cleanDealLabel(rawLabel)}</span>`. On mobile devices (`< 640px`), the text label was hidden, showing only an icon like `🟡`. On tablet/desktop screens ($\ge 640\text{px}$), the full text label must be displayed.
4. **Checkbox Consistency & "Unchecked Looks Checked" Confusion**:
   - While Buy Mode uses a large thumb-friendly checkbox (`w-11 h-11`) and Planning Mode uses a compact checkbox (`w-8 h-8`) tailored to list density, both rendered unchecked items with a filled dark background (`bg-slate-800 border-slate-700`) and placed a `<span aria-hidden="true">✓</span>` inside a `text-transparent` container.
   - On WebKit/Safari browsers and mobile screens, Unicode symbol glyph rendering can bleed through `text-transparent`, and the filled dark surface created visual ambiguity where unchecked items appeared checked.
5. **Price History Bulk Action Touch Target Defect**:
   - In the Price History view, the floating bulk action bar buttons (`#btnAddSelectedLedgerToBuyList` and `#btnDeleteSelectedLedger`) used `py-2` (~32px total height), falling short of the WCAG 2.5.5 thumb-friendly 44px minimum touch target standard.

---

## Decisions

### 1. PWA SemVer Bump to `v4.6.0`

- Synchronize version `4.6.0` across:
  - `manifest.webmanifest` (`"version": "4.6.0"`)
  - `sw.js` (`CACHE_NAME = "smart-buy-list-v4.6.0"`)
  - `dist/manifest.webmanifest`, `dist/manifest.json`, and `dist/sw.js`
  - `index.html` header version badge and documentation references (`CONTEXT.md`, `ITEMS_TO_IMPLEMENT.md`, `TEST_PLAN.md`).

### 2. Planning Card Overflow Menu & Multi-Point Deletion Ergonomics

- **Unclipped Overflow Menu**:
  - Dynamically toggle `overflow-visible` and elevation (`z-30`) on `#cardContainer-${safeId}` when `#cardMenu-${safeId}` is opened.
  - Implement outside-click listener and action-click dismissals so the menu closes cleanly upon selecting an action or clicking anywhere outside.
- **Dedicated Modal Deletion**:
  - Add a destructive `🗑️ Delete Item` / `🗑️ Xoá món` button to the footer of `#editItemModal` (`btnDeleteEditItem`), allowing immediate deletion from the edit dialog with confirmation.

### 3. Responsive `#editItemDealBadge` Presentation

- Ensure `#editItemDealBadge` follows the responsive design system:
  - Mobile phones (`< 640px`): Render emoji icon only (`🟡`) to conserve modal real estate.
  - Tablet and desktop screens ($\ge 640\text{px}$, `sm:`): Render emoji icon plus localized text label (e.g., `🟡 Fair Price` / `🟡 Giá Hợp Lý`).
  - Guarantee alignment and whitespace formatting so the badge renders cleanly across both breakpoints.

### 4. Checkbox Clarity: Hollow Outline & Conditional Checkmark DOM

- Retain differentiated sizing for operational context (`w-11 h-11 rounded-xl` in Buy Mode for in-aisle walking vs `w-8 h-8 rounded-lg` in Planning Mode for list scanning).
- Redesign the unchecked state into a clear hollow outline:
  - Unchecked: `bg-transparent border-2 border-slate-600 hover:border-emerald-500`.
  - DOM structure: Conditionally render the checkmark span only when `item.checked` is true (`${item.checked ? '<span aria-hidden="true">✓</span>' : ''}`), completely removing the `✓` glyph from the DOM when unchecked.
  - Checked: Solid `bg-emerald-600 border-emerald-500 text-white shadow-sm`.

### 5. Price History Bulk Action 44px Touch Targets

- Upgrade `#btnAddSelectedLedgerToBuyList` and `#btnDeleteSelectedLedger` from `py-2` to `min-h-[44px] py-2.5 px-4`, matching the single-item mobile card buttons and satisfying WCAG 2.5.5 criteria.

---

## Consequences

### Positive

- Zero clipping on Planning Mode secondary action menus; shoppers can immediately access Compare, Edit, and Remove.
- Redundant, accessible deletion workflow available directly inside the Full Edit Modal.
- Complete elimination of checkbox ambiguity: unchecked items are visibly hollow with no hidden DOM checkmarks.
- Consistent 44px touch targets across all mobile action buttons in Price History.
- Version integrity restored with single-source `v4.6.0` PWA release.

### Negative / Trade-offs

- Toggling `overflow-visible` on `#cardContainer` during menu display requires an active click listener to restore `overflow-hidden` when the menu dismisses.
