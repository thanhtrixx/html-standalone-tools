# 📋 Personal Finance Savings Predictor — Items to Implement & Fix

> **Target File:** `personal-finance-savings-predictor.html`  
> **Source Requirement:** `TEST_PLAN.md`  
> **Status:** ⚠️ Audit Completed — 14 Gaps & Defective Items Identified  
> **Generated:** 2026-08-09

---

## 📊 Summary of Requirement Audit (R1 – R21)

| ID      | Feature                     | Requirement                                                      | Current Status               | Action Required                                                                                                      |
| ------- | --------------------------- | ---------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **R1**  | CSV Persistence             | Auto-save CSV data to localStorage; auto-load on reload          | ❌ Console Test Fails        | Save synchronously during `runSimulation()` so `localStorage` is updated immediately                                 |
| **R2**  | Parameter Persistence       | Save/load salary, growth, inflation, goal, rates to localStorage | ❌ Console Test Fails        | Remove 500ms `setTimeout` delay on state persistence when running simulation                                         |
| **R3**  | Reset All                   | Clear localStorage + restore default values                      | ⚠️ Partial                   | `resetAll()` uses `confirm()` which blocks non-interactive/automated tests                                           |
| **R4**  | Salary Growth               | Apply annual compound growth to monthly salary                   | ❌ Console Test Fails        | Expose `simulationLogs` to `window.simulationLogs` so console test assertions can inspect logs                       |
| **R5**  | Inflation Adjustment        | Calculate real value (inflation-adjusted); toggle on/off         | ⚠️ Defective Math            | Fix `baseDate` hardcoding (2026-01-01) in real value line calculation                                                |
| **R6**  | Withdrawals                 | Track manual withdrawals in simulation logs and charts           | ❌ Broken Logic & Test Fails | Fix withdrawal status initialization (`ACTIVE` instead of `WITHDRAWAL`) so timeline loop processes withdrawal events |
| **R7**  | Goal Tracking               | Show progress bar + ring chart when savings goal set             | ❌ Console Test Fails        | Un-hide `#goalRingSection` DOM element when `savingsGoal > 0` in `runSimulation()`                                   |
| **R8**  | Shareable Link              | Serialize params + CSV to URL hash; auto-load on visit           | ❌ Console Test Fails        | Set `window.location.hash = payload` inside `shareSimulation()`                                                      |
| **R9**  | Theme Toggle                | Light/dark toggle; persist preference; CSS transitions           | ✅ Working                   | Verified working                                                                                                     |
| **R10** | Onboarding Tour             | 5-step guided tour on first visit; skip/show again               | ❌ Console Test Fails        | Reset `onboardStep = 0` when `showOnboarding()` is called manually                                                   |
| **R11** | Keyboard Shortcuts          | Enter=run, Ctrl+S=save, Esc=close modals                         | ⚠️ Partial                   | Ensure event handling works when events are dispatched directly to inputs/modals in tests                            |
| **R12** | Toast Notifications         | Slide-in toasts auto-dismiss after 3s                            | ✅ Working                   | Verified working                                                                                                     |
| **R13** | Growth Chart                | Date range filter (All/3M/6M/1Y); Real vs Nominal toggle         | ❌ Broken Chart Logic        | Store original dataset objects & all labels; fix `filterChartDateRange()` dataset structure corruption               |
| **R14** | Heatmap Calendar            | 12-month color intensity grid                                    | ❌ JS ReferenceError         | Fix HTML handler `renderHeatmap()` → `renderHeatmapChart()`; filter grid by selected year                            |
| **R15** | YoY Table                   | Year-by-year breakdown with growth %                             | ❌ Missing Data              | Populate `yearly[y].salary` and `yearly[y].interest` during simulation snapshot processing                           |
| **R16** | CSV Editor                  | Add/Edit/Delete rows; import/export Bank field                   | ✅ Working                   | Verified working                                                                                                     |
| **R17** | Scenario Comparison         | Compare current vs projected 2-year scenario                     | ❌ Hardcoded Dummy Math      | Run actual simulation engine for Scenario B instead of multiplying Scenario A by fake constants `1.3` and `1.5`      |
| **R18** | Export Chart Image          | Download growth chart as PNG                                     | ⚠️ Minor Issue               | Render solid dark background on canvas before exporting PNG to prevent transparent text background                   |
| **R19** | Print Summary               | Print-friendly layout via `window.print()`                       | ✅ Working                   | Verified working                                                                                                     |
| **R20** | Auto 6M Rule                | Create 6M term when pool ≥ 200M VND                              | ❌ Math & Test Fails         | Deduct locked amount from `currentPoolBalance` upon auto 6M creation to prevent double-counting & duplicate accounts |
| **R21** | Vietnamese Language Support | Language selector + full i18n translations for Vietnamese        | ❌ Completely Missing        | Add `langSelector` header dropdown, `data-i18n` attributes, translation dictionary, and `setLanguage()` logic        |

---

## 🛠️ Detailed Implementation Action Items

### 1. 🌐 R21: Vietnamese Language Support (Completely Missing)

- **Issue:** No language selector element, no `data-i18n` attributes, and no translation dictionary exist in `personal-finance-savings-predictor.html`.
- **Items to Implement:**
  1. **Header Control:** Add `<select id="langSelector" onchange="changeLanguage(this.value)">` in header with `en` (English) and `vi` (Tiếng Việt) options.
  2. **Translation Dictionary:** Create a global `TRANSLATIONS` object containing full English and Vietnamese dictionary strings for:
     - Application title & subtitle (`app_title`, `app_subtitle`)
     - Navigation buttons (`btn_import`, `btn_share`, `btn_manage`, `btn_theme`, `btn_help`)
     - Parameter labels (`lbl_target_date`, `lbl_salary`, `lbl_salary_growth`, `lbl_inflation`, `lbl_goal`, `lbl_pool_rate`, `lbl_6m_rate`, `btn_run_sim`, `btn_reset`)
     - Dashboard metric titles (`metric_total_balance`, `metric_total_interest`, `metric_total_salary`, `metric_pool_auto6m`)
     - Section headings (`hdr_wealth_growth`, `hdr_asset_allocation`, `hdr_monthly_income`, `hdr_heatmap`, `hdr_yoy`, `hdr_scenario_comp`, `hdr_savings_accounts`, `hdr_sim_logs`)
     - Onboarding tour step titles and descriptions (Steps 1–5).
  3. **DOM Translation Logic:** Implement `applyTranslations(lang)` that queries all elements with `[data-i18n]` attributes and updates `textContent` or `placeholder`.
  4. **Persistence:** Save selected language (`en` or `vi`) in `localStorage.setItem('lang', lang)` and load it on page startup.

---

### 2. 🧪 Console Test Expositions & State Persistence Fixes (R1, R2, R4, R6, R8, R10)

- **Items to Implement:**
  1. **Synchronous Storage Save (R1 & R2):**
     - Modify `runSimulation()` so `saveToStorage()` executes immediately (synchronously) instead of inside a 500ms `setTimeout`.
     - Ensures `localStorage.getItem('workingCSVData')` and `localStorage.getItem('params')` return updated values immediately after `runSimulation()` in test assertions.
  2. **Expose Simulation Logs & State Globally (R4, R6, R20):**
     - Change `const simulationLogs = []` inside `runSimulation()` to `window.simulationLogs = []`.
     - Ensures console test queries like `simulationLogs.filter(l => l.type === 'SALARY')` work without throwing `ReferenceError`.
  3. **Fix Withdrawal Event Processing (R6):**
     - In `runSimulation()`, set initial status of withdrawal items parsed from CSV to `'ACTIVE'` so the timeline loop evaluates `currentDate >= acc.endDate`.
     - Log withdrawal events with `type: 'WITHDRAWAL'` and update `monthlyWithdrawals[monthKey]`.
  4. **Un-hide Goal Ring Section (R7):**
     - In `runSimulation()`, inside the `if (savingsGoal > 0)` block, add:
       ```javascript
       document.getElementById("goalRingSection").classList.remove("hidden");
       ```
  5. **Set URL Hash in Share Link (R8):**
     - In `shareSimulation()`, explicitly update `window.location.hash = payload` before copying to clipboard so `window.location.hash.length > 10` passes.
  6. **Reset Onboarding Step on Manual Trigger (R10):**
     - In `showOnboarding()`, reset `onboardStep = 0` whenever the tour is launched manually from the `?` header button so the overlay always displays.

---

### 3. 🧮 Simulation Math & Logic Engine Corrections (R5, R17, R20)

- **Items to Implement:**
  1. **Fix Auto 6M Double-Counting (R20):**
     - In `runSimulation()` Step 2 (Maturing Fixed Term Savings), when a term account matures with `payout >= 200M VND`:
       - Deduct the locked amount from `currentPoolBalance` when creating the Auto 6M term account, or prevent Step 4 from executing redundant creation.
  2. **Real Scenario B Simulation Engine (R17):**
     - In `runComparison()`, calculate Scenario B by creating a modified parameters object (e.g. 2-year projected salary growth or alternate rates) and passing it through the actual `runSimulation()` logic.
     - Replace fake multipliers (`totalWealth * 1.3`, `totalInterest * 1.5`) with exact simulation values.
  3. **Inflation Base Date Dynamics (R5):**
     - Dynamic initial base date calculation based on `simStartDate` instead of hardcoded `2026-01-01`.

---

### 4. 📊 Chart & Table Component Fixes (R13, R14, R15, R18)

- **Items to Implement:**
  1. **Fix Growth Chart Date Filtering (`filterChartDateRange`) (R13):**
     - Store full dataset configuration and all labels in `growthChart._allLabels` and `growthChart._allDatasets`.
     - Fix dataset structure in `filterChartDateRange()` so `growthChart.data.datasets` retains object properties (`label`, `borderColor`, `backgroundColor`, etc.) rather than replacing them with raw arrays.
  2. **Fix Heatmap Handler & Year Filter (R14):**
     - Update HTML `<select id="heatmapYearSelect" onchange="renderHeatmap()">` to `onchange="renderHeatmapChart(dailySnapshots)"` or create a wrapper function `renderHeatmap()`.
     - Filter heatmap grid cells according to the year selected in `heatmapYearSelect`.
  3. **Populate YoY Table Salary & Interest Columns (R15):**
     - Aggregate monthly cashflows by year during `runSimulation()` and assign `yearly[y].salary` and `yearly[y].interest` correctly in `renderYearlyTable(snapshots)`.
  4. **Dark Background Fill on Chart Image Export (R18):**
     - Fill a temporary canvas with `#0f172a` background before exporting PNG in `exportChartAsImage()` so text remains crisp and readable.

---

## 🎯 Verification Checklist Post-Implementation

- [ ] Run **R1 & R2** console tests → PASS (`workingCSVData` and `params` exist in `localStorage`).
- [ ] Run **R3** console test → PASS (`resetAll()` restores default values).
- [ ] Run **R4** console test → PASS (`simulationLogs` accessible, salary increases over time).
- [ ] Run **R5** console test → PASS (`metricRealValue` visible and accurate).
- [ ] Run **R6** console test → PASS (`WITHDRAWAL` logs present and withdrawal metric displayed).
- [ ] Run **R7** console test → PASS (`goalProgressSection` and `goalRingSection` un-hidden).
- [ ] Run **R8** console test → PASS (`window.location.hash.length > 10`).
- [ ] Run **R9** console test → PASS (Theme toggles and persists).
- [ ] Run **R10** console test → PASS (Onboarding overlay displays on trigger).
- [ ] Run **R11** console test → PASS (`Enter`, `Ctrl+S`, `Esc` shortcuts functional).
- [ ] Run **R12** console test → PASS (Toasts appear and auto-dismiss after 3s).
- [ ] Run **R13** console test → PASS (`chartDateRange` switches between 1Y, 6M, 3M, and All without breaking chart).
- [ ] Run **R14** console test → PASS (Heatmap year dropdown switches years without console error).
- [ ] Run **R15** console test → PASS (YoY table displays non-zero Salary In and Interest In values).
- [ ] Run **R16** console test → PASS (CSV editor add/edit/delete/export operations work).
- [ ] Run **R17** console test → PASS (Scenario comparison computes actual simulation difference).
- [ ] Run **R18** console test → PASS (PNG export has dark background).
- [ ] Run **R20** console test → PASS (Auto 6M rule creates single 6M account when pool ≥ 200M).
- [ ] Run **R21** console test → PASS (`langSelector` switches UI to Vietnamese and back to English, all assertions pass).

---

_Created: 2026-08-09_  
_File: `ITEMS_TO_IMPLEMENT.md`_
