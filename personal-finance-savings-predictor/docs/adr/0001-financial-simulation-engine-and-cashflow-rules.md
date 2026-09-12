# ADR-0001: Financial Simulation Engine and Cashflow Rules

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0001, 0002, 0004, 0005, 0006, 0007, 0008

---

## Context

The savings predictor requires a deterministic, highly accurate monthly cash flow simulation engine that models flexible pools, recurring salary growth, bonus inflows, automated term deposits, scheduled withdrawals, and side-by-side scenario comparisons.

---

## Decisions

### 1. Pure Simulation Engine Separation (`simulateSavings`)

The calculation logic is isolated into a pure, side-effect-free function:

- **Inputs**: Initial balances, monthly salary, savings rate, escalation rate, bonus month, fixed term deposits, recurring/one-time cashflows, auto-term threshold and emergency buffer settings.
- **Outputs**: Monthly ledger timeline ($M_1 \dots M_N$), accounts list (active/matured terms), summary KPIs (Total Wealth, Flexible Pool, Total Interest Earned, Inflows/Outflows), and deficit event logs.

### 2. Flexible Pool Mechanics & Deficit Handling

- **Demand Interest**: Flexible pool balances earn compound interest monthly at the demand deposit rate.
- **Deficit Accommodation**: If a scheduled withdrawal exceeds available pool liquidity, the balance becomes negative (deficit) with an explicit warning event logged. Future salary deposits automatically replenish the deficit before generating new savings.

### 3. Salary Escalation & Annual Bonus Generator

- **Anniversary Escalation**: Base monthly salary increases by the compound escalation rate on exact 12-month simulation anniversaries ($m = 12, 24, 36, \dots$).
- **Annual Bonus**: Configurable bonus multiplier (e.g. 13th-month salary) is credited during the designated bonus month each year.

### 4. Auto Term Allocation & Emergency Buffer Rule

- On each simulation month, after salary deposit and withdrawals:
  $$\text{Surplus} = \text{Flexible Balance} - (\text{Auto Term Threshold} + \text{Emergency Buffer Reserve})$$
- If $\text{Surplus} \ge \text{Auto Term Threshold}$, an automated fixed term deposit is opened for the surplus amount at the configured term interest rate.

### 5. Dual-Pass Scenario Comparison Workbench

- Enables executing Scenario A (Baseline) and Scenario B (Adjusted Strategy) simultaneously.
- Renders side-by-side comparison tables with dynamic comparative delta badges (+% gains, -% losses) without cross-scenario state contamination.

---

## Consequences

- **Positive**: Complete separation of financial math from UI rendering; 100% deterministic testability via unit test tables.
- **Trade-off**: Requires cloning simulation parameter trees when executing dual-pass comparisons.
