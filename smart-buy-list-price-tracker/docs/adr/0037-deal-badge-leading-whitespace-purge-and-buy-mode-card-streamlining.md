# ADR-0037: Deal Badge Whitespace Purge, Buy Mode Card Streamlining & PWA v4.6.1

## Status

Accepted (v4.6.1)

## Context

Following user feedback and visual inspection on desktop/table views and in-aisle grocery shopping workflows, two user-facing interface defects and a versioning requirement were identified in `smart-buy-list-price-tracker`:

1. **Deal Badge Whitespace & Character Artifact in Tables & Desktop View**:
   - In the Price History ledger table (`#ledgerTableBody`), active item cards, and comparator/edit modal previews, Deal Badges rendered with unexpected leading double-space artifacts (e.g., `"  Great Deal"`, `"  Price Spike"`).
   - Root causes:
     - Multi-line template literals in `src/ui/gestures.js`, `src/ui/trip-completion.js`, and `src/ui/comparator.js` contained newline and indentation spaces between the emoji container `<span aria-hidden="true">` and the label `<span class="hidden sm:inline">`. In HTML inline rendering, these collapse into literal space characters.
     - The emoji extraction regex did not strictly strip leading/trailing whitespace around labels.
     - Spacing was compounded by `ml-1` margins alongside inline template spaces.

2. **Buy Mode Item Card Visual Overload**:
   - While in Buy Mode (`IN_STORE` phase), item cards displayed normalized unit prices (`$X.XX/kg`) and All-Time Low deltas (`+15% vs ATL`), cluttering what is intended to be a fast, high-contrast, distraction-free in-aisle checklist.
   - User requirement: each Buy Mode item card must strictly contain only 4 core components: (1) Checkbox (`data-action="toggle-check"`), (2) Item Name, (3) Total Amount (clickable shelf price), and (4) Deal Badge.

3. **PWA SemVer Bump to `v4.6.1`**:
   - Synchronize the application version to `4.6.1` across manifest, service worker cache name, UI badge, and living domain documentation.

---

## Decisions

### 1. Deal Badge Clean Template & Whitespace Purge

- Refactor Deal Badge rendering across `src/ui/gestures.js`, `src/ui/trip-completion.js`, `src/ui/comparator.js`, and `smart-buy-list-price-tracker/index.html`:
  - Eliminate multi-line template literal whitespace between inline `<span>` elements:
    ```javascript
    const cleanDealLabel = (raw) =>
      (raw || "").replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "").trim();
    ```
  - Use single-line tag composition with `gap-1` or explicit inline layout:
    ```javascript
    `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ..."><span aria-hidden="true">${emoji}</span><span class="hidden sm:inline">${cleanDealLabel(rawLabel)}</span></span>`
    ```
  - Ensure rendered text content on tablet/desktop views ($\ge 640\text{px}$) is cleanly formatted as `🟢 Great Deal` / `🟢 Giá Siêu Tốt` with zero double spaces or leading whitespace artifacts.

### 2. Streamlined Buy Mode Item Card Layout

- Simplify `renderItemCard(item)` in `src/ui/gestures.js` when `currentPhase === "IN_STORE"`:
  - Render strictly:
    1. **Thumb-Friendly Checkbox** (`data-action="toggle-check"` with `w-11 h-11 rounded-xl`).
    2. **Item Name** (truncated bold title with strike-through when checked).
    3. **Deal Badge** (responsive icon-only on mobile `< 640px`, icon+text $\ge 640\text{px}$).
    4. **Total Amount Button** (`data-action="edit-price"`, displaying `formatCurrency(item.price)`).
  - Completely remove the secondary Unit Price (`$X.XX/kg`) and ATL delta (`+X% vs ATL`) sub-row from Buy Mode cards.
  - Retain touch swipe gestures (Swipe Right = Check/Done, Swipe Left = Compare) and click handlers.
  - Retain full two-tier card layout in Planning Mode (`PLANNING` phase).

### 3. PWA Version Bump to `v4.6.1`

- Synchronize version `4.6.1` across:
  - `smart-buy-list-price-tracker/manifest.webmanifest` (`"version": "4.6.1"`)
  - `smart-buy-list-price-tracker/sw.js` (`CACHE_NAME = "smart-buy-list-v4.6.1"`)
  - `smart-buy-list-price-tracker/index.html` (`#pwaVersionBadge` -> `v4.6.1`)
  - `smart-buy-list-price-tracker/CONTEXT.md`, `ITEMS_TO_IMPLEMENT.md`, `TEST_PLAN.md`.

---

## Consequences

- **Typographic Precision**: Zero leading whitespace or double-space artifacts across all table rows, desktop cards, and modal previews.
- **Distraction-Free Shopping**: Buy Mode provides a clean, glanceable in-aisle checklist focused on purchasing progress and shelf prices.
- **Backwards Compatibility**: Planning Mode remains fully featured for planning and estimation without regression.
- **Test Integrity**: Unit tests (`tests/smart-buy-list-ui-components.test.js`) and Playwright E2E tests (`tests/e2e/smart-buy-list-devices.spec.js`) verify clean badge text and minimal Buy Mode card DOM structure.
