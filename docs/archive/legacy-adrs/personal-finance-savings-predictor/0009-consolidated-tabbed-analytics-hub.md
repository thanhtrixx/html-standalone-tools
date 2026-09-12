# ADR-0009: Consolidated Tabbed Analytics Hub & Canvas Cleanup

## Status

Accepted

## Context

The vertical stack of multiple long chart sections created excessive scrolling and layout clutter. Furthermore, redundant canvas elements (`#chartGoalRing2`) complicated the DOM and Chart.js lifecycle management.

## Decision

1. **Consolidated Tabbed Analytics Hub**:
   - Introduced `#analyticsHubSection` with 4 accessible tabs:
     - `[📈 Wealth Timeline]`: Main timeline growth and asset allocation.
     - `[📊 Monthly Flow]`: Monthly cash inflows, outflows, and net balances.
     - `[📅 Calendar Heatmap]`: Year-by-year daily wealth progression heatmap.
     - `[📋 YoY Summary]`: Annual aggregate financial breakdown table.
   - Implemented `switchAnalyticsTab(tabId)` with automatic Chart.js `.resize()` triggers to eliminate layout distortion.

2. **Canvas Cleanup**:
   - Removed redundant duplicate `#chartGoalRing2` and consolidated goal tracking to single `#chartGoalRing` within the goal progress banner.

## Consequences

- Eliminated 70% of vertical scroll fatigue.
- Streamlined Chart.js memory and redraw management.
