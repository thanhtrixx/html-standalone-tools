# ADR-0004: Realizable Home Equity and Selling Friction

## Status

Accepted

## Context

Real estate is an illiquid asset. Liquidating a property requires paying broker commissions, transfer notary fees, legal documentation, and state transfer taxes. Comparing raw market property value directly against liquid stock/deposit portfolios overstates real estate wealth.

## Decision

1. **Selling Friction Parameter**: Include a configurable selling transaction cost (default 2.0% to 3.0% of market value).
2. **Realizable Equity Calculation**: Realizable Net Worth for the home at any month $t$ is calculated as:
   $$\text{Realizable Equity}(t) = \text{Market Value}(t) - \text{Remaining Loan Principal}(t) - \text{Selling Friction}(t)$$
3. **Toggle**: Provide a UI toggle to view "Gross Market Equity" vs "Realizable Liquidated Net Worth".

## Consequences

- Prevents artificial inflation of homebuyer net worth.
- Reflects realistic liquidity constraints at the investment horizon exit.
