# 📋 Personal Finance Savings Predictor — Requirements & Specification

> **Target File:** `index.html` (Compacted output: `dist/index.html`)  
> **Source Documents:** [`CONTEXT.md`](./CONTEXT.md), [`docs/adr/`](./docs/adr/)  
> **Architecture:** Compacted Standalone Single-File HTML application

---

## 🏛️ Domain Concepts & Terminology

All requirements adhere strictly to the project domain model defined in [`CONTEXT.md`](./CONTEXT.md):

- **Flexible Pool**: Primary liquid cash balance receiving monthly salary deposits, paying out scheduled withdrawals, and earning demand interest. Permits temporary deficit balance with explicit simulation warning events ([ADR-0001](./docs/adr/0001-flexible-pool-deficit-handling.md)).
- **Fixed Term Deposit**: Time-locked savings deposit with designated start date, maturity date, and fixed interest rate paid at maturity.
- **Auto Term Deposit**: Automatic fixed-term savings deposit triggered whenever the Flexible Pool balance meets or exceeds the configurable Auto Term Threshold plus Emergency Buffer Reserve ([ADR-0005](./docs/adr/0005-unified-threshold-auto-term-allocation.md) & [ADR-0006](./docs/adr/0006-liquid-emergency-buffer-reserve-in-auto-term-allocation.md)).
- **Demand Interest**: Accrues and compounds daily on positive Flexible Pool balance ($\text{balance} \times \frac{r_{\text{pool}}}{365}$) directly into the liquid Flexible Pool.
- **Maturity Payout**: Lump sum principal plus accrued term interest ($\text{Principal} \times r_{\text{term}} \times \frac{\text{Days}}{365}$) deposited into the Flexible Pool.
- **Salary Escalation**: Annual compound percentage increase applied to base monthly salary on each 12-month anniversary from the simulation start date ([ADR-0002](./docs/adr/0002-anniversary-based-salary-escalation.md)).
- **Purchasing Power (Real Value)**: Inflation-discounted value calculated continuously: $\text{Real Value}(t) = \frac{\text{Nominal Value}(t)}{(1 + r_{\text{inflation}})^{t / 365.25}}$.
- **Milestone Date**: The first calendar date when Total Wealth meets or exceeds the Savings Goal.
- **Scenario Comparison**: Side-by-side full simulation runs comparing Scenario A (baseline) against Scenario B (custom/projected parameters) via decoupled pure engine ([ADR-0004](./docs/adr/0004-pure-simulation-engine-separation.md)).

---

## 📊 Core Requirements Matrix (R1 – R23)

| ID      | Feature                            | Specification                                                                                                                                                                                  | Priority | ADR Reference      |
| ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| **R1**  | CSV Persistence                    | Synchronously save parsed CSV portfolio data to `localStorage` (`workingCSVData`) upon edit/run.                                                                                               | P0       | —                  |
| **R2**  | Parameter Persistence              | Save/load all simulation parameters (`params`) in `localStorage` with versioned schema migration (`SCHEMA_VERSION = 4`).                                                                       | P0       | —                  |
| **R3**  | Reset Defaults                     | Restore default portfolio, parameters, and UI settings without blocking prompts.                                                                                                               | P1       | —                  |
| **R4**  | Salary Escalation                  | Deposit monthly salary on the 1st of each month; step up base salary by growth rate every 12-month anniversary from start date.                                                                | P0       | ADR-0002           |
| **R5**  | Purchasing Power Adjustment        | Compute continuous real value from simulation start date; render toggleable dashed curve on Growth Chart and metric card.                                                                      | P0       | —                  |
| **R6**  | Scheduled Withdrawals              | Deduct scheduled withdrawals from Flexible Pool. If withdrawal exceeds liquid balance, allow deficit and emit `DEFICIT_WARNING` log.                                                           | P0       | ADR-0001           |
| **R7**  | Goal Tracking & Milestone          | Display progress bar + ring chart when Savings Goal $> 0$, and project the exact Milestone Date.                                                                                               | P1       | —                  |
| **R8**  | Shareable Link                     | Serialize simulation state and portfolio CSV into URL hash via LZ-String compression (ADR-0010) with backward-compatible Base64 fallback; auto-load state when visiting hash URL.              | P1       | ADR-0010           |
| **R9**  | Theme Toggle                       | Support Light and Dark modes with persistent preference in `localStorage` and smooth CSS transitions.                                                                                          | P2       | —                  |
| **R10** | Onboarding Tour                    | 5-step guided interactive tour; allows skip, auto-shows on first visit, re-launchable via header button.                                                                                       | P2       | —                  |
| **R11** | Keyboard Shortcuts                 | Support `Enter` (run simulation), `Ctrl+S` / `Cmd+S` (save CSV/state), and `Esc` (close modals/overlays).                                                                                      | P2       | —                  |
| **R12** | Toast Notifications                | Non-blocking slide-in status and validation toasts with 3s auto-dismiss.                                                                                                                       | P2       | —                  |
| **R13** | Growth Chart Analytics             | Render total wealth and flexible pool lines; support date range filters (All, 3M, 6M, 1Y) without dataset corruption.                                                                          | P1       | —                  |
| **R14** | Heatmap Calendar                   | 12-month color intensity grid displaying monthly balance trajectories with year selector.                                                                                                      | P2       | —                  |
| **R15** | YoY Comparison Table               | Year-over-year financial summary table reporting Salary In, Interest In, End Balance, and Growth %.                                                                                            | P2       | —                  |
| **R16** | CSV Portfolio Editor               | Interactive modal to add, edit, delete, import, and export portfolio rows (`Bank,Amount,StartDate,EndDate,Rate,Type`).                                                                         | P1       | —                  |
| **R17** | Scenario Comparison Engine         | Run an actual dual-pass simulation for Scenario B with independent parameters using decoupled `simulate()` engine.                                                                             | P1       | ADR-0004, ADR-0007 |
| **R18** | Chart Image Export                 | Export high-resolution PNG of Growth Chart with solid dark canvas background.                                                                                                                  | P3       | —                  |
| **R19** | Printable Summary                  | Clean `@media print` styling for print and PDF export via `window.print()`.                                                                                                                    | P2       | —                  |
| **R20** | Auto Term Allocation Rule          | When Flexible Pool $\ge$ Auto Term Threshold + Emergency Buffer Reserve ($>0$), sweep balance above buffer into a single Fixed Term Deposit of duration $N$ calendar months (via `addMonths`). | P0       | ADR-0005, ADR-0006 |
| **R21** | Bilingual Localization (i18n)      | Support English (`en`) and Vietnamese (`vi`) with complete text translations, `₫` vs `VND` currency formatting, and localized date formats.                                                    | P1       | ADR-0003           |
| **R22** | Annual Bonus & Recurring Cashflows | Annual bonus inflow multiplier (e.g. 13th month salary in Jan/Feb) and interactive recurring withdrawal cashflow generator.                                                                    | P1       | ADR-0008           |
| **R23** | Strategy Persona Presets           | Strategy preset persona cards (`fresh_grad`, `fire_aspirant`, `home_downpayment`, `bank_ladder`) with 5-second undo safeguard toast.                                                           | P1       | ADR-0010           |

---

## ⚙️ Calculation & Engine Logic Specifications

### 1. Pure Simulation Timeline Engine (`simulate()`)

For each calendar day $t$ from Start Date to Target Date:

1. **Maturity Check**: For each active Fixed Term Deposit maturing on day $t$:
   - Calculate term interest: $\text{Principal} \times \text{Rate} \times \frac{\text{Duration in Days}}{365}$.
   - Credit principal + interest into the Flexible Pool.
   - Record `MATURITY` event in simulation logs.
2. **Salary Inflow**: If day $t$ is the 1st of the month:
   - Calculate current base salary factoring anniversary-based salary escalation.
   - Credit salary into Flexible Pool.
   - Record `SALARY` event in simulation logs.
3. **Withdrawal Outflows**: If scheduled withdrawal exists for day $t$:
   - Deduct withdrawal amount from Flexible Pool (`currentPoolBalance -= amount`).
   - If Flexible Pool $< 0$, record `DEFICIT_WARNING` in simulation logs.
   - Record `WITHDRAWAL` event in simulation logs.
4. **Demand Interest Accrual**:
   - Accrue and compound daily interest on positive Flexible Pool balance: $\text{Daily Interest} = \max(0, \text{Pool Balance}) \times \frac{r_{\text{pool}}}{365}$ directly into Flexible Pool.
   - Record demand interest in monthly and yearly totals.
5. **Unified Auto Term Threshold Rule ([ADR-0005](./docs/adr/0005-unified-threshold-auto-term-allocation.md) & [ADR-0006](./docs/adr/0006-liquid-emergency-buffer-reserve-in-auto-term-allocation.md))**:
   - If $\text{Auto Term Threshold} > 0$ and $\text{Flexible Pool balance} \ge \text{Auto Term Threshold} + \text{Emergency Buffer Reserve}$:
     - Set $\text{Locked Amount} = \text{Flexible Pool balance} - \text{Emergency Buffer Reserve}$.
     - Set $\text{Flexible Pool balance} = \text{Emergency Buffer Reserve}$.
     - Create **exactly one** new Fixed Term Deposit starting on day $t$ with end date $t + \text{autoTermMonths}$ calendar months (computed using exact calendar month date math via `addMonths()`) and rate $\text{autoTermAnnualRate}$.
     - Record `NEW_AUTO_TERM` (or `NEW_6M`) event in simulation logs.
6. **Milestone Check**:
   - If Savings Goal $> 0$, Total Wealth $\ge$ Goal, and Milestone Date is not yet recorded, set Milestone Date $= t$.

---

_File: `ITEMS_TO_IMPLEMENT.md`_  
_Updated: 2026-08-22_
