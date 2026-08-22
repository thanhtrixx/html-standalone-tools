# 🎯 Personal Finance Savings Predictor — Action Plan

> **Target File:** `index.html`  
> **Source Documents:** `ITEMS_TO_IMPLEMENT.md`, `CONTEXT.md`, `docs/adr/`  
> **Purpose:** Sequential checklist for domain-aligned fixes, engine corrections, and Vietnamese i18n support.  
> **Status:** ✅ **Aligned with Domain Model & ADRs**

---

## 📌 Implementation Progress Summary

- [x] **Phase 1: Simulation Engine & Core Math Corrections** `(5/5)`
- [x] **Phase 2: Data Persistence, Link Sharing & UX Guardrails** `(5/5)`
- [x] **Phase 3: Charting, Tables & Export Enhancements** `(4/4)`
- [x] **Phase 4: Full Vietnamese Language Support (i18n & Currency Formatting)** `(5/5)`
- [x] **Phase 5: Comprehensive Verification & Console Test Suite** `(2/2)`

---

## ⚙️ Phase 1: Simulation Engine & Core Math Corrections

_Focus: Fix mathematical double-counting, status evaluation bugs, and expose simulation state globally for console unit testing._

- [x] **Task 1.1 — Fix Auto 6M Allocation & Reinvestment (R20, ADR-0002)**
  - [x] Deduct locked amount from `Flexible Pool` when creating an Auto 6M Fixed Term Deposit.
  - [x] Upon term maturity, credit full proceeds (principal + interest) back to Flexible Pool and re-evaluate threshold on the same date.
  - [x] Verify pool balance and deposit count match expected math.

- [x] **Task 1.2 — Fix Scheduled Withdrawal Event Processing & Deficit Warnings (R6, ADR-0002)**
  - [x] Initialize status of withdrawal rows as `'ACTIVE'` during CSV parsing.
  - [x] Process withdrawal dates in daily simulation timeline loop.
  - [x] Record `WITHDRAWAL` log entries, allow Flexible Pool deficit if scheduled outflows exceed liquid balance, and emit `DEFICIT_WARNING` event.

- [x] **Task 1.3 — Expose Simulation State Globally (R4, R6, R20)**
  - [x] Expose `window.simulationLogs` and `window.dailySnapshots` for test inspectability.
  - [x] Ensure console test assertions can query logs without `ReferenceError`.

- [x] **Task 1.4 — Continuous Inflation Purchasing Power Calculation (R5)**
  - [x] Update `renderGrowthChart()` to calculate purchasing power discount continuously from `simStartDate`.
  - [x] Display real-value dashed line on Growth Chart and metric card.

- [x] **Task 1.5 — Independent Simulation Pass for Scenario B (R17)**
  - [x] Run an actual dual-pass simulation with independent parameters in `runComparison()`.
  - [x] Contrast wealth growth and milestone dates between Scenario A and Scenario B.

---

## 💾 Phase 2: Data Persistence, Link Sharing & UX Guardrails

_Focus: Fix state persistence timing, versioned storage migration, URL hash serialization, and UI modal visibility._

- [x] **Task 2.1 — Synchronous State Persistence & Schema Migration (R1, R2)**
  - [x] Call `saveToStorage()` synchronously in `runSimulation()`.
  - [x] Support schema versioning (`SCHEMA_VERSION = 1`) with graceful migration for legacy data.

- [x] **Task 2.2 — URL Hash Serialization for Link Sharing (R8, ADR-0001)**
  - [x] Update `shareSimulation()` to encode JSON payload as URL-safe Base64 into `window.location.hash`.
  - [x] Auto-load simulation parameters and CSV from URL hash on page visit.

- [x] **Task 2.3 — Goal Progress & Milestone Date Display (R7)**
  - [x] When Savings Goal $> 0$, display progress bar, ring chart, and project the exact Milestone Date.

- [x] **Task 2.4 — Interactive Onboarding Tour (R10)**
  - [x] Reset `onboardStep = 0` when tour is manually launched via `?` header button.

- [x] **Task 2.5 — Keyboard Shortcuts (R11)**
  - [x] Handle `Enter` (run simulation), `Ctrl+S` / `Cmd+S` (save), and `Esc` (close modals).

---

## 📊 Phase 3: Charting, Tables & Export Enhancements

_Focus: Chart dataset preservation on filtering, Heatmap event handling, YoY data population, and dark background export._

- [x] **Task 3.1 — Date Range Filtering on Growth Chart (R13)**
  - [x] Preserve Chart.js dataset configurations in `growthChart._allDatasets` and labels in `growthChart._allLabels`.
  - [x] Enable filtering across All, 3M, 6M, and 1Y without dataset structure corruption.

- [x] **Task 3.2 — Heatmap Calendar Year Selection (R14)**
  - [x] Filter heatmap grid by selected year in `#heatmapYearSelect`.

- [x] **Task 3.3 — YoY Table Breakdown Data Population (R15)**
  - [x] Aggregate annual Salary In, Interest In, End Balance, and Growth % in `renderYearlyTable()`.

- [x] **Task 3.4 — Solid Background on Chart Image Export (R18)**
  - [x] Draw `#0f172a` canvas background before generating PNG blob in `exportChartAsImage()`.

---

## 🌐 Phase 4: Bilingual Localization & Currency Formatting (i18n)

_Focus: Implement Requirement R21 and ADR-0004 with language switching, translation dictionary, and localized number/date formatting._

- [x] **Task 4.1 — Language Selector Dropdown**
  - [x] Add `<select id="langSelector" onchange="changeLanguage(this.value)">` with `en` and `vi` options.

- [x] **Task 4.2 — Comprehensive Translation Dictionary (`TRANSLATIONS`)**
  - [x] Provide full English and Vietnamese dictionary strings for all titles, labels, metrics, sections, and onboarding steps.

- [x] **Task 4.3 — Locale-Aware Number & Date Formatting (ADR-0004)**
  - [x] In `vi`: Dot thousands, comma decimals, `₫` suffix, `DD/MM/YYYY` dates.
  - [x] In `en`: Comma thousands, dot decimals, `VND` suffix, `YYYY-MM-DD` dates.

- [x] **Task 4.4 — Language Preference Persistence**
  - [x] Save active language in `localStorage.setItem('lang', lang)`.

---

## 🧪 Phase 5: Verification & Console Test Suite

_Focus: Verify automated console tests R1–R21 and manual test scenarios M1–M25._

- [x] **Task 5.1 — Console Unit Test Suite (R1–R21)**
- [x] **Task 5.2 — Manual UX & Responsive Verification (M1–M25)**

---

_File: `ACTION_PLAN.md`_  
_Updated: 2026-08-22_
