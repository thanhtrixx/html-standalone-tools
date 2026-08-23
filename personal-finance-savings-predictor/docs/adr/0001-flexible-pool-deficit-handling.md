# ADR-0001: Flexible Pool Deficit Handling for Withdrawals

## Status

Accepted

## Context

When scheduled cash outflows or large one-time expenses occur, the required capital may exceed the unencumbered liquid cash balance currently available in the Flexible Pool. Automatically liquidating active Fixed Term Deposits would require making arbitrary assumptions regarding bank penalty rules, interest loss calculations, and account liquidation priority ordering.

## Decision

1. **Permit Liquid Deficits**: The simulation engine permits the Flexible Pool to transition into a negative balance when withdrawals exceed available funds.
2. **Deficit Event Logging**: Emits an explicit `DEFICIT_WARNING` event in the chronological simulation timeline log to alert the user of the cash shortfall.
3. **Salary Replenishment**: Future salary deposits and matured term payouts automatically replenish the negative balance back toward solvency.

## Consequences

- Savers obtain clear, unfiltered visibility into liquidity gaps without opaque automatic liquidation assumptions.
- Mathematical integrity of active term deposits is preserved without guessing early withdrawal penalty rates.
