# ADR-0012: Continuous Multi-Year Calendar Heatmap & Interactive Tooltips

## Status

Accepted

## Context

The previous calendar heatmap only rendered a single selected year at a time via a dropdown selector, limiting the user's ability to visualize multi-year wealth accumulation trajectories and seasonal inflows across their entire financial horizon. Additionally, users could only view end-of-month balances without examining granular breakdown components (Flexible Pool, Fixed Term accounts, demand interest, term interest) or switching to an inflow velocity perspective.

## Decision

1. **Continuous Multi-Year Matrix**:
   - Replaced single-year dropdown view with a continuous multi-row matrix where each row represents a simulation year and columns represent the 12 calendar months (Jan–Dec).
   - Added an Annual Delta summary column for each year row calculating net annual wealth gains ($\Delta \text{Wealth}$) and year-over-year ($\text{YoY \%}$) growth rate.

2. **Dual-Mode Metric Toggling**:
   - **Total Wealth Density (Default)**: Normalizes cell color intensity against maximum total wealth across the simulation horizon.
   - **Monthly Net Inflow Velocity**: Normalizes cell color intensity against peak monthly net inflows (salary + bonus + interest - withdrawals).

3. **Interactive Popover Breakdown Tooltips**:
   - Hovering or tapping a month cell opens an interactive popover detailing:
     - Calendar Month & Year
     - Total Accumulated Wealth
     - Liquid Flexible Pool Balance
     - Active Fixed Term Deposits Balance
     - Demand & Fixed Term Interest Earned
     - Net Inflow for the month

4. **Responsive Horizontal Matrix Scrolling**:
   - Embedded the matrix inside a horizontally scrollable container with a sticky Year column to ensure smooth mobile and tablet usability.

## Consequences

- Holistic multi-year financial visibility without cumbersome dropdown navigation.
- Richer analytical depth through dual-mode density/velocity metrics and popover breakdowns.
- Fully responsive on mobile, tablet, and desktop viewports.
