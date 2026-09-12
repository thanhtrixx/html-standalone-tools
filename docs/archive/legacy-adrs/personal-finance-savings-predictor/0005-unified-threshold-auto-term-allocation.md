# ADR-0005: Unified Threshold Auto Term Allocation & Consolidated Sweep

## Status

Accepted (Extended by [ADR-0006](./0006-liquid-emergency-buffer-reserve-in-auto-term-allocation.md))

## Context

Previously, the simulation engine executed an arbitrary fixed 200M chunking loop (`while (pool >= 200M)`), creating multiple duplicate 200M accounts whenever large lump-sums matured. This left residual unallocated cash (e.g. 50M out of 450M) idling at low demand interest rates and did not reflect real-world banking behavior where savers consolidate funds into a single term deposit.

## Decision

1. **Consolidated Sweep**: When the liquid Flexible Pool balance reaches or exceeds the configured Auto Term Threshold ($> 0$), the entire balance is swept into **exactly one** new Fixed Term Deposit.
2. **Configurable Parameters**: Duration ($N$ months, default 6) and annual interest rate are user-customizable. Setting the threshold to 0 disables auto-allocation entirely.
3. **Unified Inflow Routing**: All inflows (salary, CSV term maturities, expired auto-terms) route to the liquid Flexible Pool before evaluating the threshold sweep.

## Consequences

- Maximizes interest compounding by preventing idle unallocated cash.
- Provides savers flexibility to model 3-month rolling ladders, 6-month deposits, or 12-month compounding strategies.
- Eliminates account clutter from multiple fragmented 200M slices.
