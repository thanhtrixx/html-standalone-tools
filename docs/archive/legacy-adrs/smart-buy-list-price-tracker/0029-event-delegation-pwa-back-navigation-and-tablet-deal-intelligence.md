# ADR-0029: Pure Event Delegation, Two-Tier PWA Back Navigation & Responsive Tablet Deal Intelligence

## Status

Accepted (v4.4.0)

## Context

During dogfooding and automated text-only browser testing with Lightpanda MCP, four high-impact usability and architectural discrepancies were identified in `smart-buy-list-price-tracker`:

1. **Checkbox Double-Invocation in Planning Mode**:
   - In Planning Mode, item card buttons had both an inline `onclick="toggleItemCheck('${safeId}')"` and a `data-action="toggle-check"` attribute.
   - When clicked, the inline handler toggled the check state from `false` to `true`. Then the click event bubbled to `document.addEventListener("click", handleItemCardDelegatedClick)`, which matched `data-action="toggle-check"` and invoked `toggleItemCheck` a second time in the same microtask (`true` $\to$ `false`).
   - Consequently, checkboxes in Planning Mode appeared completely broken/unclickable. Similar double-execution affected Edit (`openFullItemEdit`) and Compare (`openItemComparator`).
   - In Buy Mode, this double-invocation was masked solely by an inline `event.stopPropagation()`.

2. **Deal Badges Missing or Inconsistent on Tablet & Desktop**:
   - `renderItemCard()` matched ledger history using strict case-sensitive equality (`l.itemName === item.name`), while the Edit modal used case-insensitive matching. Typing on physical keyboards on desktop/tablet with differing capitalization resulted in zero ledger matches.
   - When an item had no purchase ledger history (`score === "NEW_ITEM"`), `dealBadgeHtml` returned an empty string, omitting any visual deal state.
   - Buy Mode cards completely omitted deal badges, leaving shoppers on tablet/desktop without price deal intelligence in-aisle.
   - The Desktop Table View of Price History (`#ledgerTableContainer`, $\ge 640\text{px}$) had no Deal Rating column.
   - On viewports $\ge 640\text{px}$, the desktop label duplicated the emoji (e.g. `🟡 🟡 Giá Thị Trường` / `🟢 🟢 Great Deal`) because both the parent badge and translation string contained the emoji.

3. **PWA Back Navigation Exited the Application**:
   - `window.addEventListener("popstate", ...)` only checked `modalHistoryStack`.
   - When switching between the 4 main navigation tabs (`PLANNING`, `BUY`, `PRICE_HISTORY`, `COMPARATOR`), `history.pushState` was never invoked.
   - Pressing the browser or Android hardware "Back" button while on `BUY`, `PRICE_HISTORY`, or `COMPARATOR` caused the browser to exit the entire PWA rather than stepping back to the previous tab or home.

4. **DOM Navigation ID Hook & Item Key Normalization**:
   - The `<nav>` element lacked `id="bottomNavBar"`, causing `.light nav#bottomNavBar` CSS rules to miss direct ID specificity.
   - Autocomplete and quick lookup lacked unified normalization (`normalizeItemKey(str) = str.trim().toLowerCase()`).

---

## Decisions

### 1. Strict Event Delegation (Eliminate Inline `onclick` Handlers)

- Remove all redundant inline `onclick="..."` attributes from item cards in both Planning Mode and Buy Mode.
- Rely 100% on the root-level delegated click listener `handleItemCardDelegatedClick(event)` attached to `document`.
- Use `event.target.closest("[data-action]")` with sanitized `data-item-id` and strict validation `/^[a-zA-Z0-9_-]+$/`.
- Route all item actions cleanly:
  - `toggle-check` $\to$ `toggleItemCheck(itemId)`
  - `edit-price` $\to$ `openQuickPriceEdit(itemId)`
  - `edit-item` $\to$ `openFullItemEdit(itemId)`
  - `compare` $\to$ `openItemComparator(itemId)`
  - `delete-item` $\to$ `deleteItem(itemId)`

### 2. Responsive Deal Intelligence Badges & Desktop Ledger Integration

- **Item History Normalization**: Use case-insensitive and trimmed name comparison (`normalizeItemKey`) across `renderItemCard`, `openFullItemEdit`, and `evaluateDealScore` lookups.
- **New Item Badge**: Render `⚪ New Item` (`⚪ Hàng Mới`) badge when `deal.score === "NEW_ITEM"` with subtle slate styling.
- **Desktop Label Cleanup**: Strip redundant leading emojis from desktop text spans to prevent double-emoji rendering (`sm:inline` shows clean text).
- **Buy Mode Deal Badge**: Display deal badge on tablet/desktop (`sm:inline-flex`) in Buy Mode cards, providing deal intelligence in-aisle without compromising mobile touch targets.
- **Desktop Ledger Table Deal Column**: Add a **Deal Rating** (`Đánh Giá Giá`) column to the desktop ledger table (`#ledgerTableContainer`) displaying normalized deal badges for historical transactions.

### 3. Two-Tier Native PWA Back Navigation (`popstate` + Tab History)

- Implement a two-tier navigation stack:
  1. **Tier 1 (Modals)**: If `modalHistoryStack.length > 0`, pop and close the topmost modal.
  2. **Tier 2 (Tabs)**: When navigating between tabs via `setActiveTab(tab)`:
     - Push history state `{ tab }` if tab changes and is not caused by `popstate`.
     - On `popstate`, if `event.state && event.state.tab`, activate that tab without pushing history.
     - If `event.state` is empty or at root and current tab is not `PLANNING`, navigate back to `PLANNING`.
  3. **Tier 3 (Root Exit)**: If on `PLANNING` tab with zero open modals, allow natural browser back / app exit.

### 4. DOM Hook & Helper Normalization

- Assign `id="bottomNavBar"` to the main bottom `<nav>` element.
- Introduce `normalizeItemKey(name)` helper to guarantee consistent lookup across ledger, autocomplete, and card rendering.

---

## Consequences

### Positive

- Checkbox toggling in Planning Mode works reliably on every click without state reversion.
- Elimination of inline `onclick` attributes reinforces CSP compliance and clean separation of concerns.
- Deal intelligence is clearly visible across mobile, tablet, and desktop in Planning, Buy, and Ledger views.
- PWA feels indistinguishable from a native mobile application during back gesture/button usage.
- All existing 1,264 assertions remain green with new assertions added for the remediated behaviors.

### Negative

- Tab navigation now manipulates browser history; deep links or page refreshes must account for `{ tab }` state recovery.
