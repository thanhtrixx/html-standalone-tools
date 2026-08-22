# Personal Finance Savings Predictor

A standalone, client-side financial simulation and wealth projection tool designed for multi-tier savings, compound salary growth, and inflation modeling.

## Language

### Core Accounts & Balances

**Flexible Pool**:
The primary liquid cash balance that receives salary deposits, pays out scheduled withdrawals, and earns demand interest. Can enter temporary deficit if scheduled outflows exceed liquid funds.
_Avoid_: Checking account, cash wallet, non-term savings

**Fixed Term Deposit**:
A time-locked savings account with a fixed start date, maturity date, principal amount, and fixed annualized interest rate paid upon maturity.
_Avoid_: Certificate of deposit, CD, locked account, time deposit

**Auto Term Deposit**:
A fixed-term savings deposit automatically instantiated whenever the Flexible Pool balance meets or exceeds the sum of the Auto Term Threshold (default 200,000,000 VND) and the Emergency Buffer Reserve. The available liquid pool balance exceeding the Emergency Buffer Reserve is swept into a single term deposit of configurable duration (default 6 months) and annual rate, retaining the Emergency Buffer Reserve in the liquid Flexible Pool. Upon maturity, principal and interest return to the Flexible Pool for immediate re-evaluation.
_Avoid_: Auto 6M chunking, rollover deposit, auto-renew account, recurring term

**Emergency Buffer Reserve**:
The designated minimum liquid cash balance retained in the Flexible Pool during an Auto Term Deposit sweep to preserve liquidity for living expenses and upcoming scheduled withdrawals.
_Avoid_: Cash cushion, minimum balance, safety net, checking reserve

### Cash Flows & Adjustments

**Withdrawal**:
A scheduled one-time cash outflow deducted directly from the Flexible Pool on a designated date.
_Avoid_: Expense, payout, debit, transfer-out

**Annual Bonus**:
An annual supplemental cash inflow calculated as a multiplier of the current monthly salary (default 1.0x) and credited directly to the Flexible Pool on the 1st of a designated calendar month (e.g. January or February).
_Avoid_: 13th month bonus, Tet gift, performance incentive, end-of-year payout

**Purchasing Power (Real Value)**:
The inflation-adjusted equivalent value of nominal balances, discounted continuously from the simulation start date.
_Avoid_: Constant dollars, deflated wealth, net-of-inflation balance

**Demand Interest**:
Interest accrued and compounded daily on the end-of-day balance of the Flexible Pool.
_Avoid_: Pool yield, non-term dividend, daily cash interest

**Maturity Payout**:
The lump-sum return of principal plus accrued term interest transferred into the Flexible Pool upon expiration of a Fixed Term Deposit.
_Avoid_: Liquidation, term refund, maturity return

**Salary Escalation**:
The annual percentage compound increase applied to the monthly salary on each 12-month anniversary of the simulation start date.
_Avoid_: Annual raise, salary hike, cost of living adjustment

### Planning & Comparison

**Milestone Date**:
The exact calendar date during the simulation timeline when Total Wealth first meets or exceeds the Savings Goal.
_Avoid_: Target date, completion time, ETA

**Scenario Comparison**:
A side-by-side execution of two independent simulation parameter sets (Scenario A baseline and Scenario B custom/projected) to contrast wealth growth curves and milestone dates.
_Avoid_: Sensitivity check, what-if multiplier, projection ratio

### UI Input & Formatting

**Currency Input Masking**:
Live formatting of numerical monetary input fields with locale-aware thousand separators (dot `.` in `vi`, comma `,` in `en`) while preserving cursor positions during text insertion/deletion.
_Avoid_: Number spinner, raw unformatted input, unmasked text

**Dynamic Verbal Helper**:
Real-time localized verbal representation of monetary quantities (e.g. `25 Triệu VND` / `25 Million VND`, `1.5 Tỷ VND` / `1.5 Billion VND`) displayed beneath currency inputs.
_Avoid_: Tooltip translation, spelled-out popup, static text hint
