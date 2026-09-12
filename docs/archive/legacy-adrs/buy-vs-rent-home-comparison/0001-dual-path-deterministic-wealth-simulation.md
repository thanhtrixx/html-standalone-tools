# ADR-0001: Dual-Path Deterministic Wealth Simulation Engine

## Status

Accepted

## Context

Evaluating whether to buy a home or rent and invest requires comparing two fundamentally different financial paths over 10–30 years. A static rule-of-thumb (such as Price-to-Rent Ratio) fails to capture dynamic variables: compounding asset growth, loan principal paydown, rate resets, and inflation divergence.

## Decision

We implement a pure, decoupled, month-by-month deterministic simulation engine `simulateBuyVsRent(params)` that evaluates both paths synchronously on the same timeline:

1. **Buy Path**: Tracks mortgage amortization, home appreciation, ownership costs, and net home equity.
2. **Rent Path**: Tracks rent escalations, security deposit management, and the compound growth of the alternative investment portfolio.
3. **Cashflow Equivalence**: Out-of-pocket cash commitment is matched every month by sweeping the cashflow difference into/out of the Rent investment portfolio.

## Consequences

- Completely objective, apples-to-apples comparison of ending net wealth and unrecoverable sunk costs.
- Decoupled pure function enables rapid recalculation for UI charts, sensitivity heatmaps, and scenario comparisons without DOM coupling.
