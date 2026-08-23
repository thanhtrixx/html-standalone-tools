# ADR-0006: Liquid Emergency Buffer Reserve in Auto Term Allocation

## Status

Accepted (Builds upon [ADR-0005](./0005-unified-threshold-auto-term-allocation.md))

## Context

Sweeping 100% of available Flexible Pool cash to 0 VND upon triggering an Auto Term allocation (as originally implemented in ADR-0005) caused severe liquidity deficiencies. Savers do not lock all available liquidity without reserving cash for living expenses, and subsequent scheduled withdrawals immediately triggered artificial deficit warnings.

## Decision

1. **Threshold + Buffer Condition**: The Auto Term sweep triggers only when:
   $$\text{Flexible Pool} \ge \text{Auto Term Threshold} + \text{Emergency Buffer Reserve}$$
2. **Buffer Preservation**: Exactly $\text{Flexible Pool} - \text{Emergency Buffer Reserve}$ is locked into the new term deposit, leaving the Emergency Buffer Reserve liquid in the Flexible Pool.
3. **Minimum Deposit Integrity**: Guarantees that the locked principal is always at least equal to the user's configured Auto Term Threshold.

## Consequences

- Prevents artificial cash deficit warnings following automated sweeps.
- Accurately models real-world emergency cash cushions alongside automated wealth compounding.
