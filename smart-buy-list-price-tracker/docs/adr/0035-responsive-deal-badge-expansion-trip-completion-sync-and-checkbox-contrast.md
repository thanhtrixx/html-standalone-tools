# ADR-0035: Responsive Deal Badge Expansion, Tailwind Content Scanner, Trip Completion Price History State Synchronization & Checkbox Contrast

## Status

Accepted (v4.6.1)

## Context

Following multi-device integration testing across Android, iPhone, iPad, and Desktop viewports, four specific visual and state synchronization defects were reported in `smart-buy-list-price-tracker`:

1. **Deal Badge Responsive Expansion Glitch**:
   - On tablet and desktop screens ($\ge 640\text{px}$), Deal Badges must expand to show both the emoji indicator and localized label (e.g., `🟡 Fair Price` / `🟡 Giá Thị Trường`), while displaying icon-only on mobile screens (`< 640px`).
   - Two root causes prevented this from functioning:
     - In `scripts/build.js`, `compileTailwindCSS()` configured Tailwind CLI content scanning exclusively for `index.html`. Classes inside `src/**/*.js` (such as `sm:inline`, `text-[11px]`, deal colors) were purged at build time.
     - In `smart-buy-list-price-tracker/index.html`, an inline style declared `.hidden { display: none !important; }`. Because of `!important`, Tailwind's responsive modifier `.sm:inline` could not override `.hidden` on viewports $\ge 640\text{px}$.

2. **Trip Completion Not Logging to Price History**:
   - When a shopper checked off items in Buy Mode and finalized the shopping trip via `#btnFinalizeTrip`, the purchased records were not appearing in the Price History ledger table.
   - `completeTrip()` dispatched the action to `store.completeTrip()`, which updated store state, but `memoryState.purchaseLedger` was not synchronized prior to calling `renderPriceLedgerTable()`. Furthermore, double-pushing occurred when store state was re-reduced without state re-assignment.

3. **Unchecked Checkbox Contrast in Buy Mode**:
   - Unchecked checkboxes used `bg-transparent border-2 border-slate-600`. On dark `bg-slate-900` cards, the transparent hollow button lacked sufficient contrast against the card body.

4. **Checkbox Token Consistency Across Tabs**:
   - Checkbox tokens across Planning (`w-8 h-8 rounded-lg`), Buy Mode (`w-11 h-11 rounded-xl`), and Price History (`<input type="checkbox">`) required alignment with `bg-slate-800/80 border-slate-600` for custom buttons and `accent-emerald-500` for native checkboxes.

---

## Decisions

### 1. Tailwind Build Content Scanner & Removal of Rogue `.hidden !important`

- In `scripts/build.js`, updated `compileTailwindCSS()` to scan:
  - `index.html`
  - `src/**/*.{js,html}`
  - `*.js`
- Removed `.hidden { display: none !important; }` from `smart-buy-list-price-tracker/index.html`, allowing standard Tailwind utilities (`hidden sm:inline`, `hidden sm:flex`, `hidden sm:block`) to operate with correct CSS cascade precedence.

### 2. Atomic Trip Completion State Synchronization

- Refactored `completeTrip(payload)` in `src/ui/trip-completion.js`:
  - When `store.completeTrip(payload)` is invoked, the resulting state is synchronized into `memoryState.purchaseLedger` and `memoryState.activeList.items`.
  - Dispatches `saveToLocalStorage()` to persist the updated ledger and remaining list.
  - Automatically re-renders `renderPriceLedgerTable()`, ensuring immediate visibility when switching to the Price History tab.

### 3. Checkbox High-Contrast Visual Design Tokens

- Updated unchecked state for custom button checkboxes in Buy Mode and Planning Mode:
  - Unchecked: `bg-slate-800/80 border-2 border-slate-600 hover:border-emerald-500 hover:bg-slate-700/80 cursor-pointer`.
  - Checked: `bg-emerald-600 border-emerald-500 text-white shadow-sm`.
- Added `accent-emerald-500` to Price History table checkboxes and mobile card checkboxes.

### 4. Playwright Multi-Device Journey Verification Matrix

- Added comprehensive end-to-end journey tests in `tests/e2e/smart-buy-list-devices.spec.js`:
  - Verifies deal badge icon-only rendering on mobile viewports (`< 640px`) and expansion with text labels on tablet/desktop viewports ($\ge 640\text{px}$).
  - Executes full shopping journey: load sample items $\to$ toggle check $\to$ complete trip $\to$ verify records in Price History ledger.

---

## Consequences

- **Zero Layout Drift**: Standalone single-file deliverable compiled with full Tailwind utility set.
- **Reliable Trip Logging**: All completed shopping trips are deterministically stored and immediately viewable in Price History.
- **Enhanced Ergonomics**: High-contrast, tactile checkboxes across all modes and screens.
- **Verified Across 4 Device Matrix**: Android (393px), iPhone (390px), iPad (810px), and Desktop (1280px) passing 100% green.
