# ADR-0003: Opportunity Cost Delta Reinvestment and Deficit Handling

## Status

Accepted

## Context

To maintain mathematical parity between buying and renting, the total cash committed by the individual in both scenarios must be identical in every simulation period. In early years, buying typically incurs higher monthly outflows (mortgage + HOA + repairs). In later years (post loan payoff or high rent inflation), renting may become more expensive.

## Decision

1. **Initial Capital Equivalence**: The starting capital of the Rent Investment Portfolio is set equal to the total upfront cash spent on buying (Downpayment + Closing Taxes + Furnishing) minus the rental security deposit.
2. **Monthly Delta Sweep**: In any month $t$:
   - If $\text{Outflow}_{\text{Buy}}(t) > \text{Outflow}_{\text{Rent}}(t)$: Excess cash $\Delta$ is invested into the Rent Portfolio at $r_{\text{invest}}$.
   - If $\text{Outflow}_{\text{Rent}}(t) > \text{Outflow}_{\text{Buy}}(t)$: Cash shortfall is withdrawn from the Rent Portfolio.
3. **Deficit Protection**: If high rent exhausts the investment portfolio, the engine tracks a cumulative liquid deficit debt rather than halting.

## Consequences

- Eliminates bias from unequal monthly spending.
- Fairly credits the tenant for investing savings when renting is cheaper and debits the tenant when rent overtakes ownership costs.
