# 🎯 Personal Finance Savings Predictor — Action Plan

> **Target File:** `personal-finance-savings-predictor.html`  
> **Source Documents:** `ITEMS_TO_IMPLEMENT.md`, `TEST_PLAN.md`  
> **Purpose:** Sequential checklist for implementing fixes, engine corrections, and Vietnamese i18n support.  
> **Status:** ✅ **Completed All 5 Phases**

---

## 📌 Implementation Progress Summary

- [x] **Phase 1: Simulation Engine & Core Math Corrections** `(5/5)`
- [x] **Phase 2: Data Persistence, Link Sharing & UX Guardrails** `(5/5)`
- [x] **Phase 3: Charting, Tables & Export Enhancements** `(4/4)`
- [x] **Phase 4: Full Vietnamese Language Support (i18n)** `(5/5)`
- [x] **Phase 5: Comprehensive Verification & Console Test Suite** `(2/2)`

---

## ⚙️ Phase 1: Simulation Engine & Core Math Corrections

_Focus: Fix mathematical double-counting, status evaluation bugs, and expose simulation state globally for console unit testing._

- [x] **Task 1.1 — Fix Auto 6M Double-Counting (R20)**
  - [x] Deduct locked amount from `currentPoolBalance` when a matured CSV term (≥ 200M VND) creates an Auto 6M account.
  - [x] Ensure Step 4 pool threshold check does not trigger duplicate Auto 6M creations.
  - [x] Verify pool balance and account count match expected math.

- [x] **Task 1.2 — Fix CSV Withdrawal Status & Event Processing (R6)**
  - [x] Change initial `status` of withdrawal rows from `'WITHDRAWAL'` to `'ACTIVE'` during CSV parsing in `runSimulation()`.
  - [x] Allow timeline loop (`currentDate >= acc.endDate`) to process withdrawal maturities.
  - [x] Record `type: 'WITHDRAWAL'` log entries and accumulate totals into `monthlyWithdrawals[monthKey]`.

- [x] **Task 1.3 — Expose Simulation State Globally (R4, R6, R20)**
  - [x] Replace local `const simulationLogs = []` inside `runSimulation()` with `window.simulationLogs = []`.
  - [x] Ensure console test assertions like `simulationLogs.filter(...)` can query logs without `ReferenceError`.

- [x] **Task 1.4 — Fix Inflation Base Date Calculation Dynamics (R5)**
  - [x] Update `renderGrowthChart()` to calculate inflation years dynamically from `simStartDate` rather than hardcoded `2026-01-01`.
  - [x] Ensure real value metric card (`#metricRealValue`) and dashed chart line display accurate inflation adjustment.

- [x] **Task 1.5 — Implement Real Engine Simulation for Scenario B (R17)**
  - [x] Replace fake hardcoded multipliers (`simResult.totalWealth * 1.3`, `totalInterest * 1.5`) in `runComparison()`.
  - [x] Execute an actual simulation pass with 2-year projected salary parameters to generate real Scenario B values.

---

## 💾 Phase 2: Data Persistence, Link Sharing & UX Guardrails

_Focus: Fix state persistence timing, URL hash serialization, and UI modal visibility._

- [x] **Task 2.1 — Synchronous State Persistence on Simulation Run (R1, R2)**
  - [x] Call `saveToStorage()` synchronously inside `runSimulation()` instead of delaying via `setTimeout(..., 500)`.
  - [x] Ensure `localStorage.getItem('workingCSVData')` and `localStorage.getItem('params')` immediately return updated JSON in console tests.

- [x] **Task 2.2 — Update URL Hash in Link Sharing (R8)**
  - [x] Update `shareSimulation()` to explicitly assign `window.location.hash = payload`.
  - [x] Verify `window.location.hash.length > 10` assertion passes after clicking Share.

- [x] **Task 2.3 — Un-hide Goal Progress Ring Section (R7)**
  - [x] In `runSimulation()`, when `savingsGoal > 0`, un-hide both `#goalProgressSection` and `#goalRingSection`.
  - [x] Ensure `#goalRingSection` contains class `hidden` only when `savingsGoal === 0`.

- [x] **Task 2.4 — Reset Onboarding Step on Manual Tour Launch (R10)**
  - [x] In `showOnboarding()`, force `onboardStep = 0` whenever launched via the `?` header button.
  - [x] Ensure onboarding overlay opens consistently regardless of previous `showedOnboarding` storage state.

- [x] **Task 2.5 — Keyboard Shortcut Event Handling (R11)**
  - [x] Verify `Enter`, `Ctrl+S`, and `Esc` keydown listeners handle events properly whether triggered by user input or console `dispatchEvent`.

---

## 📊 Phase 3: Charting, Tables & Export Enhancements

_Focus: Fix Chart.js dataset structure corruption, heatmap event handler errors, YoY table data aggregation, and PNG export background._

- [x] **Task 3.1 — Fix Growth Chart Date Range Filtering (R13)**
  - [x] Store complete dataset configs in `growthChart._allDatasets` and all labels in `growthChart._allLabels`.
  - [x] Fix `filterChartDateRange()` so filtering retains Chart.js dataset objects (`{ label, data, borderColor, ... }`) rather than replacing them with raw arrays `[[...]]`.
  - [x] Ensure switching back to "All" restores all historical date labels and data.

- [x] **Task 3.2 — Fix Heatmap Year Select Handler & Filtering (R14)**
  - [x] Fix HTML `<select id="heatmapYearSelect" onchange="renderHeatmap()">` to call `renderHeatmapChart(dailySnapshots)` (or create wrapper `renderHeatmap()`).
  - [x] Update `renderHeatmapChart()` to filter cells according to the year selected in `#heatmapYearSelect`.

- [x] **Task 3.3 — Populate YoY Table Salary & Interest Columns (R15)**
  - [x] Aggregate annual salary and interest cashflows during `runSimulation()`.
  - [x] Update `renderYearlyTable(snapshots)` to display non-zero values for `Salary In` and `Interest In` per year.

- [x] **Task 3.4 — Dark Background Fill on Chart Image Export (R18)**
  - [x] Modify `exportChartAsImage()` to draw a solid background (`#0f172a`) on canvas before generating PNG blob.
  - [x] Prevent transparent/black text contrast issues on exported chart images.

---

## 🌐 Phase 4: Full Vietnamese Language Support (i18n)

_Focus: Implement Requirement R21 with a language selector, full translation dictionary, DOM binding, and persistence._

- [x] **Task 4.1 — Add Header Language Selector Controls**
  - [x] Add `<select id="langSelector" onchange="changeLanguage(this.value)">` in header.
  - [x] Provide options for `en` (English) and `vi` (Tiếng Việt).

- [x] **Task 4.2 — Create Translation Dictionary (`TRANSLATIONS`)**
  - [x] Build key-value pairs for English and Vietnamese strings covering:
    - App titles, subtitles, and header action buttons.
    - Parameter labels, inputs, preset buttons, and reset button.
    - Metric card headers (`Total Balance`, `Total Interest`, `Total Salary`, `Pool & Auto 6M`).
    - Chart section titles, legends, tooltips, and table headers.
    - Onboarding modal steps (Step 1 to 5 titles & descriptions).

- [x] **Task 4.3 — Add `data-i18n` Attributes across HTML Elements**
  - [x] Annotate text nodes in HTML with `data-i18n="key_name"`.

- [x] **Task 4.4 — Implement Dynamic Language Switching Logic**
  - [x] Write `changeLanguage(lang)` function to update all `data-i18n` elements in DOM.
  - [x] Persist selected language in `localStorage.setItem('lang', lang)`.
  - [x] Auto-load language preference on `DOMContentLoaded`.

- [x] **Task 4.5 — Dynamic Translation for Onboarding Tour**
  - [x] Update `updateOnboardUI()` to render translated titles and text based on current language.

---

## 🧪 Phase 5: Comprehensive Verification & Test Suite Execution

_Focus: Run automated console tests R1–R21 and complete manual verification checklist M1–M25._

- [x] **Task 5.1 — Execute Console Unit Test Suite (R1–R21)**
  - [x] Run R1/R2 Data Persistence Test → PASS
  - [x] Run R3 Reset All Test → PASS
  - [x] Run R4 Salary Growth Test → PASS
  - [x] Run R5 Inflation Adjustment Test → PASS
  - [x] Run R6 Withdrawals Test → PASS
  - [x] Run R7 Goal Tracking Test → PASS
  - [x] Run R8 Shareable Link Test → PASS
  - [x] Run R9 Theme Toggle Test → PASS
  - [x] Run R10 Onboarding Test → PASS
  - [x] Run R11 Keyboard Shortcuts Test → PASS
  - [x] Run R12 Toast Notifications Test → PASS
  - [x] Run R13 Growth Chart Test → PASS
  - [x] Run R14 Heatmap Calendar Test → PASS
  - [x] Run R15 YoY Table Test → PASS
  - [x] Run R16 CSV Editor Test → PASS
  - [x] Run R17 Scenario Comparison Test → PASS
  - [x] Run R20 Auto 6M Rule Test → PASS
  - [x] Run R21 Vietnamese Language Support Test → PASS

- [x] **Task 5.2 — Complete Manual Testing Checklist (M1–M25)**
  - [x] Verify responsive layout, print layout, theme switching, and smooth UI transitions.

---

_File: `ACTION_PLAN.md`_  
_Completed: 2026-08-09_
