# 10. Sensitivity Matrix Visual Clarity, Context-Aware Controls & Toast Timeline Navigation

Date: 2026-08-28

## Status

Accepted

## Context

Following customer bug reports indicating that "the chart does not work" when selecting the _Sensitivity Matrix_ tab:

1. **Visual Mental Model Mismatch**: The Analytics Hub tab switcher groups Chart.js charts (_Net Wealth Timeline_, _Sunk Costs_, _Cashflow Outflows_) alongside the _2D Sensitivity Matrix_. When switching to the Sensitivity Matrix tab, the Chart.js `<canvas>` is hidden in favor of a 2D HTML Table heatmap. Without distinct section subtitle feedback, users interpreted the absence of canvas graphics as a broken chart component.
2. **Inert Controls in Matrix View**: The _Real Purchasing Power (CPI Discount)_ toggle remained active in the Analytics Hub header, despite 2D crossover horizons being invariant to CPI discounting (as crossover depends on relative nominal wealth comparison at each month). This led users to believe clicking the toggle had failed.
3. **Missing Export Functionality**: The _Export Chart PNG_ button in the footer was hidden on the Sensitivity tab, depriving users of the ability to export or copy their sensitivity grid.
4. **Friction in Scenario Exploration**: While [ADR-0009](./0009-streamlined-workbench-and-collapsible-methodology-above-charts.md) enabled 1-click cell scenario testing (`applySensitivityScenario`), users had to manually click back to the _Net Wealth Timeline_ tab to inspect the resulting trajectory curves.

## Decision

1. **Dynamic Analytics Hub Header Context**:
   - Dynamically update the Analytics Hub subtitle (`#chartSubtitleExplainer`) based on active tab:
     - For Chart.js tabs: Display the chart description and currency mode.
     - For Sensitivity Matrix: Display _"Bảng nhiệt 2D Tương tác · Nhấp ô bất kỳ để áp dụng kịch bản"_ / _"Interactive 2D Scenario Heatmap · Click any cell to test scenario"_.
2. **Context-Aware Control Visibility**:
   - On the Sensitivity Matrix tab, visually disable or hide the _Real CPI Discount_ container with an informative tooltip noting that crossover horizons reflect relative wealth comparison.
3. **In-Tab Export & CSV Download**:
   - Provide an in-tab export action button (`exportSensitivityCSV()` / `copySensitivityTable()`) allowing users to download or copy the 6x6 scenario grid.
4. **Actionable Toast with Direct Timeline Navigation**:
   - Upgrade the scenario application toast to include an inline action button: `[Xem Đồ Thị Timeline →]` / `[View Timeline Chart →]`, invoking `switchAnalyticsTab('timeline')` directly from the notification.

## Consequences

- **Pros**:
  - Completely clarifies the transition between Chart.js vector graphs and the 2D Scenario Heatmap table.
  - Eliminates misleading inactive controls on the Sensitivity view.
  - Provides a frictionless bridge between high-level matrix scenario exploration and granular timeline inspection.
  - Retains 100% client-side zero-dependency architecture.
- **Cons**:
  - Requires maintaining bilingual translation keys for matrix subtitles, CSV export labels, and toast navigation action buttons.
