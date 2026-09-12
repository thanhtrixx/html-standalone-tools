# 8. Sensitivity Matrix Reactivity, Unfolded Acquisition Breakdown & UI Streamlining

Date: 2026-08-28

## Status

Accepted

## Context

Following user feedback and headless browser UX audits via Lightpanda:

1. **Header Clutter**: The top navigation bar included an anchor button (`#methodologyBtn` / `btn_methodology`) pointing to the in-page Methodology section. Having this button alongside the Persona preset dropdown, AI Dossier trigger, Tour button, Language switch, Theme toggle, and Share button created unnecessary density on medium and small viewports.
2. **Sensitivity Matrix Reactivity & Fixed Scope**: The 2D sensitivity matrix (`#sensitivityContainer`) was suspected of being non-operational because `renderApp()` (invoked on all slider and input changes) did not trigger `renderActiveTabChart()`, leaving the table stale until a manual tab click. Furthermore, the 6x6 sensitivity rates were fixed (`3.0%–10.5%` Property Appreciation vs `5.0%–12.5%` Investment Yield) with hardcoded table headers, preventing users with custom scenarios from viewing centered rates or identifying their active baseline cell.
3. **Hidden Acquisition Costs**: Upfront acquisition expenses (0.6% transfer tax, initial interior fit-out/renovation, and total cash required) were enclosed within a `<details>` / `<summary>` collapsible accordion, obscuring critical cash-to-close metrics from immediate user view.
4. **Missing Analytics Tab**: The Chart.js engine implemented cumulative sunk costs (`sunk` dataset comparing mortgage interest + maintenance + HOA vs cumulative rent), but the tab navigation bar only exposed 3 tabs (`timeline`, `cashflow`, `sensitivity`).

## Decision

1. **Top Nav Simplification**:
   - Remove `#methodologyBtn` from the top header navigation bar.
   - Retain the full in-page `#methodologySection` at the bottom of the page for detailed LaTeX formula inspection, live traces, glossary, and invariant verification.
   - Keep Onboarding Tour Step 4 and Step 5 aligned with the in-page layout.

2. **Reactive, Dynamically Centered Sensitivity Matrix with Baseline Highlighting**:
   - Update `renderApp()` to trigger `renderActiveTabChart()` upon all parameter modifications.
   - Dynamically compute adaptive 6x6 sensitivity grids centered around the active user parameters (`baseParams.propertyAppreciationRate` and `baseParams.rentInvestmentYield`), formatting axes with step increments and min clamps.
   - Dynamically generate table column headers (`<th>`) from computed investment yield rates.
   - Render a distinct highlight badge (`ring-2 ring-indigo-400` and `★`) on the cell corresponding to the user's active baseline scenario.
   - Enable sticky column/row headers for smooth scrolling on mobile viewports.

3. **Unfolded Upfront Acquisition Breakdown**:
   - Replace the collapsible `<details>` / `<summary>` accordion with a permanently open, styled sub-card (`#acquisitionBreakdownCard`).
   - Keep 0.6% registration tax, initial renovation input, and total cash required immediately visible and reactive.

4. **Expose Sunk Costs Analytics Tab**:
   - Add `tabBtn_sunk` ("Chi Phí Mất Đi" / "Sunk Costs") to the analytics tab bar.
   - Dynamically update chart footer legend indicators and descriptions when switching between `timeline`, `sunk`, and `cashflow`.

## Consequences

- **Pros**:
  - Immediate visual feedback on the Sensitivity Matrix when adjusting any slider or preset.
  - Zero hidden critical inputs in the Upfront Outflow section.
  - Cleaner header navigation without loss of deep mathematical transparency.
  - Full access to all 4 analytical perspectives: Net Wealth, Sunk Costs, Cashflow Delta, and 2D Sensitivity Matrix.
- **Cons**:
  - Requires updating automated test suites to assert open DOM structure and 4 analytics tabs.
