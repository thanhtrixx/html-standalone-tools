# 📋 Personal Finance Savings Predictor — Requirements & Specification

> **Target File:** `index.html`  
> **Source Documents:** [`CONTEXT.md`](./CONTEXT.md), [`docs/adr/`](./docs/adr/)  
> **Architecture:** Standalone Single-File Zero-Build HTML application

---

## 🏛️ Domain Concepts & Terminology

All requirements adhere strictly to the project domain model defined in [`CONTEXT.md`](./CONTEXT.md):

- **Flexible Pool**: Primary liquid cash balance receiving monthly salary deposits, paying out scheduled withdrawals, and earning demand interest. Permits temporary deficit balance with explicit simulation warning events ([ADR-0001](./docs/adr/0001-flexible-pool-deficit-handling.md)).
- **Fixed Term Deposit**: Time-locked savings deposit with designated start date, maturity date, and fixed interest rate paid at maturity.
- **Auto 6M Deposit**: Automatic 6-month Fixed Term Deposit triggered whenever the Flexible Pool balance is $\ge$ 200,000,000 VND. On maturity, principal and interest return to the Flexible Pool and immediately re-evaluate the threshold on that date ([ADR-0005](./docs/adr/0005-unified-threshold-auto-6m-allocation.md)).
- **Demand Interest**: Accrues daily on the end-of-day Flexible Pool balance ($\text{balance} \times \frac{r_{\text{pool}}}{365}$) and is credited at calendar month-end.
- **Maturity Payout**: Lump sum principal plus accrued term interest ($\text{Principal} \times r_{\text{term}} \times \frac{\text{Days}}{365}$) deposited into the Flexible Pool.
- **Salary Escalation**: Annual compound percentage increase applied to base monthly salary on each 12-month anniversary from the simulation start date ([ADR-0002](./docs/adr/0002-anniversary-based-salary-escalation.md)).
- **Purchasing Power (Real Value)**: Inflation-discounted value calculated continuously: $\text{Real Value}(t) = \frac{\text{Nominal Value}(t)}{(1 + r_{\text{inflation}})^{t / 365.25}}$.
- **Milestone Date**: The first calendar date when Total Wealth meets or exceeds the Savings Goal.
- **Scenario Comparison**: Side-by-side full simulation runs comparing Scenario A (baseline) against Scenario B (custom/projected parameters) via decoupled pure engine ([ADR-0004](./docs/adr/0004-pure-simulation-engine-separation.md)).

---

## 📊 Core Requirements Matrix (R1 – R21)

| ID      | Feature                       | Specification                                                                                                                                    | Priority | ADR Reference   |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------- |
| **R1**  | CSV Persistence               | Synchronously save parsed CSV portfolio data to `localStorage` (`workingCSVData`) upon edit/run.                                                 | P0       | Global ADR-0001 |
| **R2**  | Parameter Persistence         | Save/load all simulation parameters (`params`) in `localStorage` with versioned schema migration (`SCHEMA_VERSION = 1`).                         | P0       | Global ADR-0001 |
| **R3**  | Reset Defaults                | Restore default portfolio, parameters, and UI settings without blocking prompts.                                                                 | P1       | —               |
| **R4**  | Salary Escalation             | Deposit monthly salary on the 1st of each month; step up base salary by growth rate every 12-month anniversary from start date.                  | P0       | ADR-0002        |
| **R5**  | Purchasing Power Adjustment   | Compute continuous real value from simulation start date; render toggleable dashed curve on Growth Chart and metric card.                        | P0       | —               |
| **R6**  | Scheduled Withdrawals         | Deduct scheduled withdrawals from Flexible Pool. If withdrawal exceeds liquid balance, allow deficit and emit `DEFICIT_WARNING` log.             | P0       | ADR-0001        |
| **R7**  | Goal Tracking & Milestone     | Display progress bar + ring chart when Savings Goal $> 0$, and project the exact Milestone Date.                                                 | P1       | —               |
| **R8**  | Shareable Link                | Serialize simulation state and portfolio CSV into URL hash via URL-safe Base64; auto-load state when visiting hash URL.                          | P1       | Global ADR-0002 |
| **R9**  | Theme Toggle                  | Support Light and Dark modes with persistent preference in `localStorage` and smooth CSS transitions.                                            | P2       | —               |
| **R10** | Onboarding Tour               | 5-step guided interactive tour; allows skip, auto-shows on first visit, re-launchable via header button.                                         | P2       | —               |
| **R11** | Keyboard Shortcuts            | Support `Enter` (run simulation), `Ctrl+S` / `Cmd+S` (save CSV/state), and `Esc` (close modals/overlays).                                        | P2       | —               |
| **R12** | Toast Notifications           | Non-blocking slide-in status and validation toasts with 3s auto-dismiss.                                                                         | P2       | —               |
| **R13** | Growth Chart Analytics        | Render total wealth and flexible pool lines; support date range filters (All, 3M, 6M, 1Y) without dataset corruption.                            | P1       | —               |
| **R14** | Heatmap Calendar              | 12-month color intensity grid displaying monthly balance trajectories with year selector.                                                        | P2       | —               |
| **R15** | YoY Comparison Table          | Year-over-year financial summary table reporting Salary In, Interest In, End Balance, and Growth %.                                              | P2       | —               |
| **R16** | CSV Portfolio Editor          | Interactive modal to add, edit, delete, import, and export portfolio rows (`Bank,Amount,StartDate,EndDate,Rate,Type`).                           | P1       | —               |
| **R17** | Scenario Comparison Engine    | Run an actual dual-pass simulation for Scenario B with independent parameters using decoupled `simulate()` engine.                               | P1       | ADR-0004        |
| **R18** | Chart Image Export            | Export high-resolution PNG of Growth Chart with solid dark canvas background.                                                                    | P3       | —               |
| **R19** | Printable Summary             | Clean `@media print` styling for print and PDF export via `window.print()`.                                                                      | P2       | —               |
| **R20** | Auto 6M Allocation Rule       | Lock 200M VND chunks from Flexible Pool into 6-month Fixed Term Deposits; deduct locked funds from pool immediately via unified threshold check. | P0       | ADR-0005        |
| **R21** | Bilingual Localization (i18n) | Support English (`en`) and Vietnamese (`vi`) with complete text translations, `₫` vs `VND` currency formatting, and localized date formats.      | P1       | ADR-0003        |

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
   - Accrue daily interest on positive Flexible Pool balance: $\text{Daily Interest} = \max(0, \text{Pool Balance}) \times \frac{r_{\text{pool}}}{365}$.
   - Accrue demand interest to Flexible Pool and record in monthly/yearly totals.
5. **Unified Auto 6M Threshold Rule ([ADR-0005](./docs/adr/0005-unified-threshold-auto-6m-allocation.md))**:
   - While Flexible Pool balance $\ge 200,000,000\text{ VND}$:
     - Deduct $200,000,000\text{ VND}$ from Flexible Pool.
     - Create a new 6-month Fixed Term Deposit starting on day $t$ with end date $t + 180\text{ days}$.
     - Record `NEW_6M` event in simulation logs.
6. **Milestone Check**:
   - If Savings Goal $> 0$, Total Wealth $\ge$ Goal, and Milestone Date is not yet recorded, set Milestone Date $= t$.

---

_File: `ITEMS_TO_IMPLEMENT.md`_  
_Updated: 2026-08-22_
