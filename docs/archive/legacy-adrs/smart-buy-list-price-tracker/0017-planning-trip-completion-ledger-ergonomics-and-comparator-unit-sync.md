# ADR-0017: Planning Trip Completion, Clean Empty State, Ledger Ergonomics & Comparator Unit Sync

## Status

Accepted (v3.8.0)

## Context

In version 3.7.0 and earlier, several usability, visual consistency, and workflow friction points existed across both Planning and In-Store shopping modes:

1. **Intrusive "Load Sample Data" Call-to-Action in Main List Views**:
   - The empty list state card displayed a prominent "Load Sample Data" button directly in the primary workspace for both Planning and Buy modes.
   - For regular users who intentionally cleared their list or completed a shopping trip, this button added visual noise and risked accidental overwriting of clean lists with sample items.
   - In Buy Mode, if the buy list became empty, users had no 1-tap pathway back to Planning mode to add items.

2. **Asymmetric Trip Completion Workflow Restricted to Buy Mode**:
   - The "Complete Shopping Trip" flow (`finishTripBar` and `tripCompleteModal`) was only accessible while switched into In-Store (Buy) mode.
   - Users planning purchases ahead of time, ticking off pantry items, or reviewing already-acquired products in Planning mode had to unnaturally switch to Buy mode merely to trigger trip finalization, archive checked items to the historical purchase ledger, and resolve unpurchased item rollovers.

3. **Inconsistent Historical Purchase Ledger Action Ergonomics**:
   - In the Ledger batch bar, button placement placed the destructive Delete action on the left and the primary Add action on the right.
   - In mobile ledger cards, the Delete button was positioned on the left with an icon only (`🗑️`), lacking a text label, while the Add button was on the right. Standard UI/UX conventions require primary constructive actions on the left (`flex-1`) and secondary destructive actions on the right with clear localized text labels to prevent accidental deletions.

4. **Package Comparator Unit Group Desynchronization**:
   - When comparing Package A and Package B in the Package Comparator modal, selecting a unit in a different measurement dimension for Package A (e.g., Weight `kg` ➔ Volume `L`) left Package B in the previous dimension (`g`), triggering a dimension mismatch warning (`DIMENSION_MISMATCH`) and requiring a manual second dropdown change.
   - Live recalculation required input blurring in some cases instead of instant, real-time re-comparison on every keystroke and selection change.

## Decisions

### 1. Clean Empty State & Sample Data Encapsulation

- Removed the `#btnLoadSampleEmpty` ("Load Sample Grocery List") button from the `#emptyListCard` in the main list workspace.
- Retained `#btnResetSampleData` ("Load Sample Data") inside Option Hub Settings (`#optionHubModal`) as a deliberate, dedicated maintenance action.
- Added `#btnEmptySwitchToPlanning` in `#emptyListCard`:
  - Dynamically displayed only when in In-Store (Buy) mode with 0 items remaining.
  - Clicking smoothly switches the view to Planning Mode (`setTripPhase('PLANNING')`), collapsing the empty state and presenting the smart quick-entry input.
  - Dynamically customizes description text between Planning Mode (`empty_planning_desc`) and Buy Mode (`empty_buy_mode_desc`).

### 2. Adaptive Planning Mode Trip Completion Flow

- Transformed `#finishTripBar` into an adaptive sticky bottom action bar:
  - **In-Store Mode (`IN_STORE`)**: Always visible to provide uninterrupted access to live trip totals and completion.
  - **Planning Mode (`PLANNING`)**: Dynamically revealed when `checkedCount > 0` (and smoothly hidden when `checkedCount === 0`).
- Adapted `#tripSummaryPrompt` label dynamically:
  - Shows `trip_planning_prompt` ("Sẵn sàng hoàn tất chuyến đi / Ready to Complete Trip") in Planning Mode.
  - Shows `trip_active` ("Đang mua sắm tại cửa hàng / In-Store Shopping Active") in Buy Mode.
- Reuses the atomic, deterministic `finalizeTripCompletion()` engine and `#tripCompleteModal`:
  - Deterministic primary keys (`rec_<timestamp>_<idx>_<random>`).
  - Deletion tombstones recorded in `memoryState._deleted.items` to prevent zombie resurrection across 3-way cloud sync.
  - Respects user choice for unpurchased item rollover vs. discard.

### 3. Standardized Right-Aligned Ledger Deletion Ergonomics

- Reordered `#ledgerBatchBar`:
  - `[🛒 Thêm mục đã chọn / Add Selected]` placed on the left as the primary action.
  - `[🗑️ Xoá mục đã chọn / Delete Selected]` placed on the right with a dedicated label span `#btnTextDeleteSelectedLedger`.
- Standardized `#ledgerMobileCards` layout:
  - `[➕ Thêm vào Danh sách / Add to Buy List]` placed on the left (`flex-1`, emerald button).
  - `[🗑️ Xoá / Delete]` placed on the right with both icon and localized text label `btn_delete_ledger_item` (`px-3`, subtle red border/accent).

### 4. Bidirectional Unit Group Auto-Sync in Package Comparator

- Implemented `syncComparatorUnitGroup(source)`:
  ```javascript
  function syncComparatorUnitGroup(source) {
    const compUnitA = document.getElementById("compUnitA");
    const compUnitB = document.getElementById("compUnitB");
    if (!compUnitA || !compUnitB) return;

    const dimA = normalizeQuantity(1, compUnitA.value).dimension;
    const dimB = normalizeQuantity(1, compUnitB.value).dimension;

    const dimensionToBaseUnit = {
      [DIMENSIONS.MASS]: "kg",
      [DIMENSIONS.VOLUME]: "L",
      [DIMENSIONS.COUNT]: "ea",
    };

    if (dimA !== dimB) {
      if (source === "A") {
        compUnitB.value = dimensionToBaseUnit[dimA] || "ea";
      } else {
        compUnitA.value = dimensionToBaseUnit[dimB] || "ea";
      }
    }
    runComparatorCalc();
  }
  ```
- Wired `oninput="runComparatorCalc()"` and `onchange="syncComparatorUnitGroup('A'|'B')"` to ensure immediate, reactive updates without dimension mismatch errors.

### 5. PWA Single-Source Versioning (v3.8.0) & 100% Bilingual Parity

- Synchronized version `3.8.0` across all metadata files:
  - `smart-buy-list-price-tracker/index.html`: `#pwaVersionBadge` set to `v3.8.0`.
  - `smart-buy-list-price-tracker/sw.js`: `CACHE_NAME = "smart-buy-list-v3.8.0"`.
  - `smart-buy-list-price-tracker/manifest.webmanifest`: `"version": "3.8.0"`.
- Added 5 new localization keys in both English and Vietnamese dictionaries:
  - `empty_planning_desc`
  - `empty_buy_mode_desc`
  - `btn_empty_switch_to_planning`
  - `trip_planning_prompt`
  - `btn_delete_ledger_item`

## Consequences

- Clean, uncluttered empty state in main views while preserving sample data reset in Settings.
- Effortless trip completion and ledger archiving from Planning mode without forcing phase transitions.
- Reduced accidental deletions in the Purchase Ledger with standardized action hierarchy and visible text.
- Seamless, error-free package comparisons across units and dimensions with automatic unit group synchronization.
- Full automated test coverage in `tests/smart-buy-list-planning-completion-ledger-comparator.test.js`.
