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

**Auto 6M Deposit**:
A 6-month Fixed Term Deposit automatically instantiated whenever the Flexible Pool balance meets or exceeds the allocation threshold (200,000,000 VND). Upon maturity, principal and interest return to the Flexible Pool for immediate re-evaluation.
_Avoid_: Rollover deposit, auto-renew account, recurring term

### Cash Flows & Adjustments

**Withdrawal**:
A scheduled one-time cash outflow deducted directly from the Flexible Pool on a designated date.
_Avoid_: Expense, payout, debit, transfer-out

**Purchasing Power (Real Value)**:
The inflation-adjusted equivalent value of nominal balances, discounted continuously from the simulation start date.
_Avoid_: Constant dollars, deflated wealth, net-of-inflation balance

**Demand Interest**:
Interest accrued daily on the end-of-day balance of the Flexible Pool and credited at the end of each calendar month.
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
