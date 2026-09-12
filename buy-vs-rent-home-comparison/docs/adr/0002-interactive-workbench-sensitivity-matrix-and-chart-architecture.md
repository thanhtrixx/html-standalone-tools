# ADR-0002: Interactive Workbench, Sensitivity Matrix, and Chart Architecture

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0006, 0007, 0008, 0009, 0010

---

## Context

To make complex long-term financial trade-offs intuitive:

1. **Interactive Workbench**: Real-time parameter inputs (property price, down payment, loan terms, rent, investment yield, inflation) with immediate chart and metric reactivity.
2. **2D Sensitivity Matrix**: Visual cross-tabulation mapping investment return vs. property appreciation to reveal crossover breakeven zones.
3. **In-Page Methodology & Formula Engine**: Transparent disclosure of formulas and definitions directly in the UI with contextual hover tooltips.
4. **Responsive Visualization**: Chart.js net wealth timelines, monthly cash flow breakdowns, and timeline scrubber navigation adapting to mobile and desktop viewports.

---

## Decisions

### 1. Dual-Layout Responsive Workbench

- **Desktop (≥ 1024px)**: Two-column layout with sticky input controls on the left and full-width analytics/charts on the right.
- **Mobile (< 1024px)**: Single-column collapsible accordion sections with sticky summary KPI bar.

### 2. Sensitivity Matrix Engine & Heatmap

- Computes a grid across $\pm 3\%$ variations of Home Appreciation Rate (Y-axis) and Investment Return Rate (X-axis).
- Cells are dynamically colored (Green = Buy Advantage, Blue = Rent Advantage) with clear contrast ratios and financial delta labels.
- Supports clicking any matrix cell to immediately load that scenario into the workbench.

### 3. Collapsible Methodology Drawer & Tooltip Engine

- Formula explanations are rendered in-page using lightweight semantic HTML.
- Floating popovers provide immediate parameter definitions without cluttering primary input labels.

### 4. Chart.js Lifecycle Management

- Multi-dataset line and bar charts (Cumulative Wealth, Annual Outflows, Equity Breakdown).
- Automatic color and gridline synchronization with the active theme (Dark/Light).

---

## Consequences

- **Positive**: Immediate feedback on parameter adjustments, deep analytical insights via sensitivity scanning, crystal-clear formula transparency.
- **Trade-off**: Requires lightweight canvas redraw debouncing (~16ms) to ensure smooth 60fps slider interactions.
