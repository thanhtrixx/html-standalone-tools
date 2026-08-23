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

**Strategy Persona Preset**:
A predefined financial strategy configuration (e.g. Fresh Graduate, FIRE Aspirant, Home Downpayment, Bank Rate Ladder) that instantly loads tailored monthly salaries, goals, and multi-account portfolios, protected by an interactive 5-second undo toast action.
_Avoid_: User profile, default config, template scheme, portfolio starter

### UI Input & Formatting

**Currency Input Masking**:
Live formatting of numerical monetary input fields with locale-aware thousand separators (dot `.` in `vi`, comma `,` in `en`) while preserving cursor positions during text insertion/deletion.
_Avoid_: Number spinner, raw unformatted input, unmasked text

**Dynamic Verbal Helper**:
Real-time localized verbal representation of monetary quantities (e.g. `25 Triệu VND` / `25 Million VND`, `1.5 Tỷ VND` / `1.5 Billion VND`) displayed beneath currency inputs.
_Avoid_: Tooltip translation, spelled-out popup, static text hint

**Quick Preset Chips**:
Interactive 1-click numerical target and additive delta modifier chips beneath simulation parameters allowing rapid value setting and increments with debounced live recalculation.
_Avoid_: Stepper buttons, increment arrows, manual slider

### Analytics & Visualization

**Continuous Multi-Year Heatmap Matrix**:
A comprehensive multi-year calendar grid rendering all simulation years simultaneously in rows (columns = Jan–Dec) with global normalized color shading, annual deltas, and dual-mode density/velocity metrics.
_Avoid_: Single-year calendar, dropdown heatmap, separate year tables

**Savings Accounts Hub**:
A dedicated full-width portfolio table view featuring aggregated KPI summary pills (Total Locked Principal, Active Accounts, Auto Sweeps, Weighted Average Rate) and instant category filtering tabs (`All`, `Active Fixed`, `Auto Term`, `Matured`, `Withdrawals`).
_Avoid_: Split-column table, cramped list, static accounts table

**Tabbed Analytics Hub**:
A unified interactive analytics switcher integrating the Wealth Timeline area chart, Continuous Multi-Year Heatmap Matrix, and Year-over-Year (YoY) comparison breakdown with accessible tab roles and keyboard navigation.
_Avoid_: Chart view selector, analytics tabs, sub-panels

### Modal & Dialog Architecture

**Modal Lifecycle Controller**:
Centralized dialog manager preventing modal stacking and ensuring strict single-active-dialog invariants, background scroll locking, standardized backdrop dismissals, and unified Escape key interception.
_Avoid_: Layered dialogs, stacked popups, independent modal listeners

### Theme & Visual System

**Semantic Design Tokens**:
CSS custom properties (`--bg-page`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`, `--input-bg`) defining centralized visual styling for both Dark and Light themes with WCAG 2.1 AA/AAA contrast compliance.
_Avoid_: Ad-hoc inline colors, hardcoded dark classes, un-themed overrides

**Dynamic Chart Re-Theming**:
The real-time recoloring and re-rendering of all active Chart.js canvas instances (gridlines, axis ticks, legends, tooltips) upon switching between Dark and Light themes.
_Avoid_: Static chart colors, hardcoded canvas themes, un-synced charts

### Mobile & Tablet Ergonomics

**Responsive Mobile Action Sheet**:
A sleek overflow action menu grouping secondary utilities (`Import CSV`, `Manage Data`, `Share via URL`, `Help`) on screens `< 768px` while presenting primary actions (`Theme`, `Presets`, `Language`) as dedicated icon-buttons to prevent multi-line header wrapping.
_Avoid_: Cluttered multi-row nav, hidden header items, squished top-bar

**Touch Preset Carousel**:
A single-row, horizontally scrollable chip track featuring accessible touch targets (min 36px height) and edge scroll gradient hints for rapid parameter selection without vertical layout sprawl.
_Avoid_: Multi-row chip wrap, tiny touch buttons, stepper clusters

**Adaptive Mobile Card-View**:
A responsive viewport-triggered rendering pattern that transforms wide desktop tabular data (`min-w-[650px]`) into touch-friendly account cards on screens `< 640px`.
_Avoid_: Cramped table pinching, unbounded horizontal table scroll, truncated table cells

