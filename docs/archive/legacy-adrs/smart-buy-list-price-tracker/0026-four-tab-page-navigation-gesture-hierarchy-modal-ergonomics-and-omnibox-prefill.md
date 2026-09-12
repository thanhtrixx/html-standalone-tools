# ADR-0026: 4-Tab Page Navigation, Horizontal Swipe Gestures, Modal Ergonomics & Omnibox Pre-Fill

## Status

Accepted (v4.1.0 / UI/UX Modernization)

## Context

Smart Buy-List historically operated with a 2-mode header toggle (`Planning` vs `Buy Mode`) while `Price History` (Purchase Ledger) and `Comparator` (Package Comparator) were modal dialog overlays. User feedback highlighted several friction points during shopping and planning workflows (#267):

1. **Navigation Fragment**: `Price History` and `Comparator` required modal overlays that obscured context and could not be reached via standard tab navigation.
2. **Tab Naming**: The bottom navigation pill used `Buy Mode` instead of concise `Buy`.
3. **Touch Gestures & Mobile Navigation**: In-aisle shopping requires quick single-handed thumb gestures. Switching between views required tapping small bottom buttons, and item cards needed gesture conflict resolution.
4. **Modal Ergonomics**: Modals lacked light dismissal (tapping the backdrop overlay or pressing browser Back / Android system back).
5. **Omnibox to Detailed Options Transition**: Users typing item info in `Quick Add Item` (Omnibox) who clicked `Detailed Options` had their parsed inputs lost, forcing manual retyping.
6. **Edit Form Layout**: Edit Item Details displayed `Quantity`, `Unit`, and `Price` stacked vertically with verbose labels, causing unnecessary vertical scrolling.
7. **Legacy Terminology**: Settings was labeled `Option Hub` in several views and documentation.

---

## Decisions

### 1. 4-Tab Top-Level Single Page Architecture

- Restructure `<main id="mainContainer">` to contain 4 distinct page views managed by `setActiveTab(tab)`:
  - `PLANNING` (`#viewPlanning`): Quick Add Omnibox, Detailed Options Form, Store/Category Filters, 3-Row Planning Item Cards.
  - `BUY` (`#viewBuy`): In-Aisle Minimalist Swipeable Check Cards, Shopping Progress Bar.
  - `PRICE_HISTORY` (`#viewPriceHistory`): Embedded Historical Purchase Ledger with search and batch restocking.
  - `COMPARATOR` (`#viewComparator`): In-Aisle Package Deal Comparator with unit normalization.
- `#tripSummarySection` (KPIs & store filter) is displayed on `PLANNING` and `BUY`, and hidden on `PRICE_HISTORY` and `COMPARATOR` to maximize screen real estate.
- Update bottom navigation tab button from `Buy Mode` to `Buy` (`Mua Sắm`).

### 2. Page Horizontal Swipe Gestures & Hierarchy

- Implement touch gesture listeners on document/main container:
  - Swiping Left: Moves forward through `['PLANNING', 'BUY', 'PRICE_HISTORY', 'COMPARATOR']`.
  - Swiping Right: Moves backward through the tab sequence.
  - Threshold: $|\Delta X| \ge 50\text{px}$ with $|\Delta X| > 1.5 \times |\Delta Y|$.
- Gesture Conflict Hierarchy:
  - Touches originating on item cards (`#cardContainer-*`, `#itemCard-*`) trigger card swipe actions (Swipe Right = Check/Uncheck + vibrate; Swipe Left = Open Comparator with candidate A pre-filled).
  - Touches originating on modal dialogs, form controls (`input`, `select`, `textarea`, `button`), or scrollable containers are ignored by the page horizontal gesture engine.

### 3. Modal Light Dismiss & History Popstate Ergonomics

- All modal overlays (`#shareModal`, `#importModal`, `#pasteJsonModal`, `#tripCompleteModal`, `#editItemModal`, `#quickPriceModal`, `#storeManagerModal`, `#settingsModal`) dismiss on backdrop tap (`handleModalBackdropClick`).
- Clicking inside the modal dialog container stops event propagation (`event.stopPropagation()`).
- Maintain `modalHistoryStack` and push `window.history.pushState({ modalId })` on modal open.
- Browser Back navigation (`popstate`) and Escape key dismiss the topmost open modal without triggering page reloads or broken URL states.

### 4. Smart Omnibox Pre-Fill into Detailed Options

- When user enters text into `#smartQuickInput` and expands `Detailed Options` (`toggleAdvancedAddForm()`):
  - Automatically parse the grocery string via `parseSmartGroceryInput()`.
  - Populate `#inputItemName`, `#inputItemPrice`, `#inputItemQty`, `#inputItemUnit`, `#inputItemStore`, `#inputItemCategory`.
  - Clear `#smartQuickInput` and hide live preview badge.
  - Focus `#inputItemName` with smooth scroll into view.

### 5. Edit Item Detail 1-Line 3-Column Grid & Concise Labels

- Lay out `Qty`, `Unit`, `Price` into a responsive 3-column single row (`grid-cols-3 gap-2`).
- Shorten translation labels to `Qty` / `Số Lượng`, `Unit` / `Đơn Vị`, `Price` / `Giá Gói`.

### 6. Standardize Terminology to "Settings" & Bump Version to v4.1.0

- Replace all occurrences of `Option Hub` in UI titles, tooltips, and documentation with clean `Settings` (`Cài Đặt`).
- Bump PWA version across `manifest.webmanifest`, `sw.js`, and `#pwaVersionBadge` to `v4.1.0`.

---

## Consequences

### Positive

- Seamless single-handed in-aisle navigation via horizontal tab swipe gestures.
- Natural gesture hierarchy prevents conflicting card check/compare actions with page tab transitions.
- Frictionless modal dismissal via backdrop tap, Escape key, or mobile hardware Back button.
- Zero data loss when switching between Quick Add Omnibox and Detailed Options form.
- Compact, high-density Edit Item modal fitting comfortably on small screens without scrolling.
- Unified, intuitive terminology across UI and technical documentation.
