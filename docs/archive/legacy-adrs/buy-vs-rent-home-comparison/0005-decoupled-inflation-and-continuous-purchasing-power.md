# ADR-0005: Decoupled Inflation and Continuous Purchasing Power

## Status

Accepted

## Context

Property market prices, residential rents, and consumer goods do not inflate at identical rates. Using a single monolithic inflation rate distorts real estate simulations over 20–30 year time horizons.

## Decision

1. **Decoupled Growth Rates**: Provide independent configurable parameters for:
   - **Property Appreciation Rate ($r_{\text{prop}}$)**
   - **Rent Inflation Rate ($r_{\text{rent}}$)**
   - **Headline CPI Inflation Rate ($r_{\text{cpi}}$)**
2. **Continuous Real Value Discounting**: Calculate real purchasing power using continuous discounting against headline CPI:
   $$\text{Real Value}(t) = \frac{\text{Nominal Value}(t)}{(1 + r_{\text{cpi}})^{t/12}}$$

## Consequences

- Accurately captures stagflation or real estate boom/bust cycles where property appreciation outperforms rent inflation or vice versa.
- Matches the real vs. nominal purchasing power toggle of [`personal-finance-savings-predictor`](../personal-finance-savings-predictor/CONTEXT.md).
