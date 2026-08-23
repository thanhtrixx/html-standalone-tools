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

### AI Consultation & Financial Diagnostics

**Financial Health Dossier**:
A structured, portable analytical Markdown summary generated from simulation parameters and month-by-month results, synthesizing liquidity ratios, savings retention rates, capital efficiency, inflation drag, and tailored AI advisory blueprints for external LLM consultation.
_Avoid_: AI dump, summary text, raw data output

**AI Advisory Blueprint**:
A specialized prompt framing strategy (e.g. General Financial Health, FIRE Acceleration, Real Estate Downpayment, Deposit Ladder, Dual-Pass Comparative Audit) appended to the Financial Health Dossier instructing external AI advisors on specific analytical objectives and constraint optimization.
_Avoid_: LLM prompt, system prompt, AI text

**Liquidity Runway Ratio**:
The number of months of baseline living costs and scheduled outflows secured by the unencumbered liquid Flexible Pool and Emergency Buffer Reserve.
_Avoid_: Cash cushion time, survival months

**Savings Retention Rate**:
The proportion of all gross capital injected (initial starting portfolio plus cumulative salary deposits and annual bonuses) successfully retained and compounded into ending net wealth.
_Avoid_: Savings ratio, deposit percentage

**Privacy Anonymization Mask**:
A client-side sanitization transformation that converts absolute monetary values in the Financial Health Dossier into normalized salary multiples and portfolio percentage shares, transforms calendar dates into relative simulation month offsets, and anonymizes financial institution names before export or clipboard transfer.
_Avoid_: Data hide, obfuscation

### Micro-Interactions & Contextual Help

**Interactive Floating Tooltip Engine**:
A zero-dependency floating popover engine providing instant (<100ms) hover explanations, mobile touch toggle with event isolation from parent form labels, smart viewport collision detection, and full WCAG 2.1 AA keyboard accessibility across all simulation parameters and summary KPI metric cards.
_Avoid_: Native browser title tooltip, delayed OS tooltips, un-isolated label clicks

---

## Vietnamese Domain Vocabulary & Copywriting Standards (Chuẩn Hóa Thuật Ngữ Tiếng Việt)

To maintain clarity, natural financial phrasing, and customer empathy in Vietnamese localization, the following ubiquitous terms MUST be used:

### Core Terms Mapping

| English Domain Term                    | Vietnamese Standard Term                                           | Explicitly Avoided Synonyms             |
| :------------------------------------- | :----------------------------------------------------------------- | :-------------------------------------- |
| **Flexible Pool**                      | `Quỹ Linh Hoạt` / `Tiền Linh Hoạt`                                 | `Pool`, `Ví tiền`, `Tài khoản vãng lai` |
| **Fixed Term Deposit**                 | `Sổ Tiết Kiệm Có Kỳ Hạn` / `Tiết Kiệm Có Kỳ Hạn`                   | `Chứng chỉ tiền gửi`, `Sổ khóa`         |
| **Auto Term Deposit**                  | `Tiết Kiệm Gửi Tự Động` / `Gửi Tự Động`                            | `Tự động quét`, `Gom sổ`                |
| **Emergency Buffer Reserve**           | `Quỹ Dự Phòng Khẩn Cấp` / `Khoản Dự Phòng An Toàn`                 | `Tiền đệm`, `Khoản giữ lại`             |
| **Salary Contribution / Total Salary** | `Thu Nhập Lương` / `Tổng Lương Tích Lũy` / `Nhận Lương Hàng Tháng` | `Lương nạp`, `Nạp lương`, `Bơm lương`   |
| **Scenario Projection (Scenario B)**   | `Kịch Bản Dự Kiến` / `Kịch Bản Giả Định`                           | `Kịch bản dự phóng`, `Dự phóng`         |
| **Milestone Date**                     | `Ngày Đạt Cột Mốc` / `Ngày Đạt Mục Tiêu`                           | `Ngày ETA`, `Mốc thời gian`             |
| **Goal Shortfall Advisor**             | `Kế Hoạch Bù Đắp Mục Tiêu` / `Cố Vấn Bù Đắp Mục Tiêu`              | `Thâm hụt dự kiến`, `Lỗ mục tiêu`       |
| **Projected Deficit / Gap**            | `Số Tiền Còn Thiếu Dự Kiến`                                        | `Thâm hụt dự kiến`                      |
| **Annual Bonus**                       | `Thưởng Năm (Lương Tháng 13)`                                      | `Quà Tết`, `Thưởng nạp`                 |
| **Demand Interest**                    | `Lãi Không Kỳ Hạn`                                                 | `Lãi linh hoạt`, `Lãi hàng ngày`        |
| **Term Interest**                      | `Lãi Có Kỳ Hạn`                                                    | `Lãi sổ khóa`, `Lãi cố định`            |
| **Purchasing Power (Real Value)**      | `Giá Trị Thực Tế (Sau Lạm Phát)`                                   | `Tiền thật`, `Giá trị chiết khấu`       |
