# ADR-0008: Annual Bonus (13th Month) Inflow & Recurring Cashflow Generator

## Status

Accepted

## Context

Users planning long-term wealth accumulation regularly receive 13th-month bonuses or seasonal incentives that significantly alter savings accumulation trajectories. In addition, users need to model repeating cashflows (e.g. quarterly insurance premiums, tuition payments, regular side-income) without manually inserting dozens of repetitive CSV rows.

## Decision

1. **Annual Bonus Multiplier & Month Selector**:
   - Added `annualBonusMultiplier` (default 1.0x) with quick select chips (`[0x]`, `[1x]`, `[1.5x]`, `[2x]`).
   - Added `annualBonusMonth` (default January) supporting months 1 through 12.
   - Simulation engine automatically credits `currentMonthlySalary * annualBonusMultiplier` to Flexible Pool on day 1 of the designated month.
   - Schema upgraded to `SCHEMA_VERSION = 4` with backward-compatible migrations.

2. **Discrete Recurring Cashflow Generator**:
   - Implemented sub-panel tool in CSV Editor supporting monthly (1M), quarterly (3M), semi-annual (6M), and annual (12M) intervals.
   - Generates discrete, editable rows across the specified date range.
   - Added dedicated `+ Add Withdrawal` quick button.
   - Added strict date validation (`EndDate >= StartDate`) preventing invalid negative durations.

## Consequences

- Highly realistic Vietnamese and global personal finance simulations capturing end-of-year bonuses.
- Seamless CSV authoring for multi-year recurring obligations.
