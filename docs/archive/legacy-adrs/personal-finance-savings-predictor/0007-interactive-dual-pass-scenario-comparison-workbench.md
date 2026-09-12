# ADR-0007: Interactive Dual-Pass Scenario Comparison Workbench

## Status

Accepted

## Context

Users testing personal finance strategies require multi-variable "what-if" comparative analysis (e.g., comparing conservative baseline returns against aggressive savings or high inflation scenarios). Hardcoding single-variable hypothetical bumps (such as a 2-year salary bump) artificially constrained financial analysis to narrow assumptions.

## Decision

1. **Dual-Pass Simulation Execution**: The pure `simulate()` engine executes two independent simulation passes (Scenario A baseline vs. Scenario B candidate) against the active portfolio dataset.
2. **Independent Parameter Overrides**: Scenario B provides dedicated overrides for base salary, salary growth rate, inflation rate, pool interest rate, auto term parameters, and savings goal.
3. **Comparative Visualization**: Both wealth curves render simultaneously on the primary growth chart with distinct styling and a comparative KPI delta summary banner.

## Consequences

- Full flexibility to explore multi-variable financial scenarios.
- Zero state leakage between Scenario A and Scenario B.
- Immediate visual feedback on wealth differentials and milestone acceleration.
