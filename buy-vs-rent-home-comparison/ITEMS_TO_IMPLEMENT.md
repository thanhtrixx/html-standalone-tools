# 📋 Buy vs. Rent Home Comparison — Requirements & Specification

> **Target File:** `buy-vs-rent-home-comparison/index.html` (Compacted output: `dist/buy-vs-rent-home-comparison.html` or `buy-vs-rent-home-comparison/dist/index.html`)  
> **Source Documents:** [`CONTEXT.md`](./CONTEXT.md), [`docs/adr/`](./docs/adr/)  
> **Architecture:** Zero-Runtime Build, Standalone Single-File HTML application

---

## 🏛️ Domain Concepts & Terminology

All requirements adhere strictly to the project domain model defined in [`CONTEXT.md`](./CONTEXT.md):

- **Buy Path**: All capital outflows, debt obligations, ongoing maintenance, property taxes, HOA fees, asset appreciation, and realized equity.
- **Rent Path**: Initial capital preservation, security deposits, monthly rent payments, annual rent escalations, and compound growth of alternative investment portfolio.
- **Net Worth Crossover Date**: The exact calendar month/year on the simulation timeline when Buy net wealth surpasses Rent net wealth (or vice versa).
- **Price-to-Rent Ratio (PRR)**: Home price divided by annual rent ($\frac{\text{Home Price}}{\text{Annual Rent}}$).
- **Gross Rental Yield**: Annual rent divided by home price ($\frac{\text{Annual Rent}}{\text{Home Price}} \times 100\%$).
- **Mortgage Amortization Schemes**: Equal Monthly Installment (Annuity / Fixed EMI) vs. Linear Principal Reduction (Reducing Interest).
- **Realizable Home Equity**: Appreciated market value minus remaining loan principal minus selling friction.
- **Opportunity Cost Delta Sweep**: Monthly reinvestment or drawdown of cashflow differences between scenarios.

---

## 📊 Core Requirements Matrix (R1 – R35)

| ID      | Feature                                         | Specification                                                                                                                                                    | Priority | ADR Reference   |
| :------ | :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :-------------- |
| **R1**  | **Pure Dual-Path Simulation Engine**            | Decoupled deterministic engine `simulateBuyVsRent(params)` computing month-by-month net wealth, cashflows, and cumulative sunk costs.                            | P0       | ADR-0001        |
| **R2**  | **Dual Mortgage Amortization Schemes**          | Support both `fixed_emi` (Annuity) and `linear_principal` (Reducing interest) with exact monthly schedules.                                                      | P0       | ADR-0002        |
| **R3**  | **Dual-Phase Interest Rates**                   | Promotional teaser rate ($r_{\text{teaser}}$ for $M$ months) automatically resetting to floating benchmark ($r_{\text{floating}}$).                              | P0       | ADR-0002        |
| **R4**  | **Prepayment & Penalty Schedule**               | Optional monthly extra principal repayment with tiered early settlement penalty calculation (Years 1–3, 4–5, 6+).                                                | P1       | ADR-0002        |
| **R5**  | **Opportunity Cost Delta Sweep**                | Reinvest positive cashflow delta into Rent Investment Portfolio; withdraw during rental deficit with liquid debt tracking.                                       | P0       | ADR-0003        |
| **R6**  | **Realizable Home Equity & Selling Friction**   | Deduct configurable selling friction (default 2%–3%) from property market value; provide gross vs. net equity toggle.                                            | P0       | ADR-0004        |
| **R7**  | **Decoupled Inflation & Appreciation**          | Independent parameters for Property Appreciation ($r_{\text{prop}}$), Rent Inflation ($r_{\text{rent}}$), and Headline CPI ($r_{\text{cpi}}$).                   | P0       | ADR-0005        |
| **R8**  | **Purchasing Power (Real Value) Toggle**        | Continuous inflation-discounting toggle displaying Nominal vs. Real Purchasing Power curves on charts and KPI metrics.                                           | P0       | ADR-0005        |
| **R9**  | **Upfront Acquisition Breakdown**               | Expandable acquisition breakdown: Downpayment, Registration Tax (0.5%), Notary/Legal, Furnishing/Renovation Fit-out, Loan Insurance.                             | P1       | CONTEXT.md      |
| **R10** | **Property Type Presets**                       | 1-click toggle for Apartment/Condo vs. Landed House/Townhouse adjusting HOA dues, maintenance rates, and appreciation profiles.                                  | P1       | CONTEXT.md      |
| **R11** | **Rule-of-Thumb Valuation Badges**              | Dynamic live badges for Price-to-Rent Ratio (PRR) and Gross Rental Yield with color-coded valuation benchmarks.                                                  | P1       | CONTEXT.md      |
| **R12** | **Net Wealth Crossover & Break-Even Detector**  | Highlight the exact crossover year and month, total wealth delta at horizon, and milestone timeline markers.                                                     | P0       | ADR-0001        |
| **R13** | **Cumulative Sunk Cost Visualizer**             | Side-by-side breakdown comparing Rent Paid vs. Mortgage Interest + Property Taxes + HOA + Maintenance + Acquisition/Selling Fees.                                | P1       | CONTEXT.md      |
| **R14** | **Monthly Cashflow Delta Visualizer**           | Chart showing monthly out-of-pocket obligation curves over time (highlighting mortgage payoff date and rent escalation crossover).                               | P1       | CONTEXT.md      |
| **R15** | **2D Sensitivity Matrix Heatmap**               | Interactive heatmap grid showing crossover horizon across Property Appreciation Rates (2%–12%) vs. Investment Yields (4%–14%).                                   | P1       | CONTEXT.md      |
| **R16** | **Strategy Persona Presets**                    | 4 Presets: _Urban Apartment Condo_, _Suburban Landed House_, _Aggressive FIRE Investor Renter_, _High-Yield Expat_ with 5s undo toast.                           | P1       | CONTEXT.md      |
| **R17** | **State Persistence & Schema Migration**        | Save/load all simulation parameters in `localStorage` (`buyVsRent_params`) with versioned schema migration (`SCHEMA_VERSION = 1`).                               | P0       | —               |
| **R18** | **Shareable URL Hash (LZ-String)**              | Serialize complete simulation parameters into URL hash via LZ-String compression with Base64 fallback; auto-load on visit.                                       | P1       | —               |
| **R19** | **Bilingual Localization (i18n)**               | Complete English (`en`) and Vietnamese (`vi`) language parity with seamless toggle and persisted preference.                                                     | P1       | —               |
| **R20** | **Currency Input Masking & Verbal Helpers**     | Locale-aware thousand separator masking (`.` for `vi`, `,` for `en`) with real-time Vietnamese verbal helpers (`2.5 Tỷ VND`, `35 Triệu VND`).                    | P1       | CONTEXT.md      |
| **R21** | **Quick Presets & Debounced Recalculation**     | Interactive 1-click preset chips under inputs (Price, Downpayment, Rent, Yield) with active highlighting and debounced recalc.                                   | P1       | —               |
| **R22** | **AI Real Estate Decision Dossier**             | Generate structured Markdown dossier with 5 consultation blueprints (Verdict, Debt Stress-Test, FIRE Audit, Asset Allocation, Custom).                           | P1       | CONTEXT.md      |
| **R23** | **Privacy Anonymization Mask**                  | Client-side toggle converting absolute sums in the AI Dossier to home price multiples and percentage shares before export.                                       | P1       | CONTEXT.md      |
| **R24** | **WCAG 2.1 Dark/Light Theme System**            | Semantic CSS custom properties (`:root` / `:root.light`) with high-contrast compliance and dynamic Chart.js theme re-rendering.                                  | P1       | —               |
| **R25** | **Responsive Mobile Ergonomics**                | Mobile-first layout with compact 2x2 metric cards, horizontally scrollable touch preset carousels ($\ge 36\text{px}$ targets), and action sheet.                 | P1       | —               |
| **R26** | **Printable Executive Summary**                 | Clean `@media print` layout and PDF export styling via `window.print()`.                                                                                         | P2       | —               |
| **R27** | **Chart Image Export**                          | 1-click high-resolution PNG export of all active Chart.js canvas instances with solid background fill.                                                           | P2       | —               |
| **R28** | **Interactive Floating Tooltips**               | Zero-dependency floating popover engine for all parameters, metric badges, and chart legends with keyboard accessibility.                                        | P1       | —               |
| **R29** | **Modal Lifecycle Manager**                     | Single-active-dialog invariant, scroll locking, backdrop click dismissals, and unified `Esc` key interception.                                                   | P1       | —               |
| **R30** | **Toast Notification Engine**                   | Non-blocking slide-in status, validation, and undo toasts with auto-dismiss timers.                                                                              | P1       | —               |
| **R31** | **Extreme Number & Boundary Guard**             | Robust handling of 0% downpayments, 0% interest rates, 100B+ VND home valuations, and edge-case timelines without NaN.                                           | P0       | —               |
| **R32** | **Keyboard Shortcuts**                          | Quick hotkeys: `Enter` (re-run/refresh), `Ctrl+S`/`Cmd+S` (save state), `Esc` (dismiss modals/sheets).                                                           | P2       | —               |
| **R33** | **Onboarding Tour Walkthrough**                 | 5-step guided interactive tour introducing key input sections, valuation badges, crossover charts, and AI dossier.                                               | P2       | —               |
| **R34** | **Reset to Defaults**                           | 1-click restore to pristine default parameters and UI state with instant refresh.                                                                                | P1       | —               |
| **R35** | **Zero-Build Compaction Deliverable**           | Single standalone HTML source file compacted into `dist/` verifying 100% offline standalone capability.                                                          | P0       | ADR-0001 (Root) |
| **R36** | **In-Page Methodology & Bottom Chart Layout**   | Balanced 2-column parameter workbench, full-width 12-col bottom analytics chart hub, and dedicated in-page methodology section with header smooth-scroll anchor. | P1       | ADR-0007        |
| **R37** | **Sensitivity Reactivity & Unfolded Breakdown** | Reactive 6x6 adaptive sensitivity matrix centered around active parameters with baseline cell highlight, unfolded acquisition sub-card, and 4-tab analytics hub. | P1       | ADR-0008        |
| **R38** | **Sensitivity Clarity & Timeline Navigation**   | Dynamic Analytics Hub header context, context-aware Real CPI toggle, in-tab matrix CSV export, and actionable toast timeline navigation.                         | P1       | ADR-0010        |

---

## ⚙️ Calculation & Engine Logic Specifications

For each month $m = 1, 2, \dots, N$ (where $N = \text{horizonYears} \times 12$):

### 1. Buy Path Monthly Step

1. **Property Value Update**:
   $$\text{Home Value}(m) = \text{Home Value}(m-1) \times (1 + r_{\text{prop}})^{1/12}$$
2. **Mortgage Amortization**:
   - Determine current rate: if $m \le \text{teaserMonths}$, rate is $r_{\text{teaser}}$; else $r_{\text{floating}}$.
   - **Fixed EMI Mode**: Monthly payment $PMT = P_0 \times \frac{r/12}{1 - (1 + r/12)^{-n}}$. Interest $I(m) = P(m-1) \times \frac{r}{12}$, Principal $PR(m) = PMT - I(m) + \text{ExtraPrincipal}$.
   - **Linear Principal Mode**: Base principal $PR(m) = \frac{P_0}{n} + \text{ExtraPrincipal}$. Interest $I(m) = P(m-1) \times \frac{r}{12}$. $PMT(m) = PR(m) + I(m)$.
   - Update $P(m) = \max(0, P(m-1) - PR(m))$.
3. **Ownership Expenses**:
   - $\text{Maint}(m) = \text{Home Value}(m) \times \frac{\text{maintRate}}{12}$.
   - $\text{HOA}(m) = \text{InitialHOA} \times (1 + r_{\text{cpi}})^{\lfloor (m-1)/12 \rfloor}$.
   - $\text{TaxIns}(m) = \text{InitialTaxIns} \times (1 + r_{\text{cpi}})^{\lfloor (m-1)/12 \rfloor}$.
   - Total Outflow $\text{Outflow}_{\text{Buy}}(m) = PMT(m) + \text{Maint}(m) + \text{HOA}(m) + \text{TaxIns}(m)$.
4. **Sunk Cost Accumulation**:
   $$\text{Sunk}_{\text{Buy}}(m) = \text{Sunk}_{\text{Buy}}(m-1) + I(m) + \text{Maint}(m) + \text{HOA}(m) + \text{TaxIns}(m)$$
5. **Realizable Equity**:
   $$\text{NetWorth}_{\text{Buy}}(m) = \text{Home Value}(m) - P(m) - (\text{Home Value}(m) \times \text{sellingFrictionRate})$$

### 2. Rent & Invest Path Monthly Step

1. **Monthly Rent Payment**:
   $$\text{Rent}(m) = \text{InitialRent} \times (1 + r_{\text{rent\_inflation}})^{\lfloor (m-1)/12 \rfloor}$$
   - Total Outflow $\text{Outflow}_{\text{Rent}}(m) = \text{Rent}(m) + \text{TenantInsurance}(m)$.
   - Sunk Cost $\text{Sunk}_{\text{Rent}}(m) = \text{Sunk}_{\text{Rent}}(m-1) + \text{Rent}(m) + \text{TenantInsurance}(m)$.
2. **Opportunity Cost Delta Sweep**:
   $$\Delta(m) = \text{Outflow}_{\text{Buy}}(m) - \text{Outflow}_{\text{Rent}}(m)$$
3. **Portfolio Compounding & Cashflow Adjustment**:
   $$\text{Portfolio}(m) = \text{Portfolio}(m-1) \times (1 + r_{\text{invest}})^{1/12} + \Delta(m)$$
4. **Net Worth Calculation**:
   $$\text{NetWorth}_{\text{Rent}}(m) = \text{Portfolio}(m) + \text{CurrentSecurityDeposit}(m)$$

### 3. Crossover Detection

- Track the sign of $\Delta \text{NetWorth}(m) = \text{NetWorth}_{\text{Buy}}(m) - \text{NetWorth}_{\text{Rent}}(m)$.
- The first month $m^*$ where $\Delta \text{NetWorth}(m^*) \ge 0$ (starting from negative) is recorded as the **Buy Crossover Date**.
