# Buy vs. Rent Home Comparison

A standalone, client-side financial decision engine and dual-path wealth simulator designed to evaluate the long-term economic outcomes of homeownership versus renting and investing the difference.

## Language

### Core Comparison Scenarios

**Buy Path**:
The simulation scenario modeling all capital outflows, debt obligations, ongoing maintenance, property taxes, HOA fees, asset appreciation, and realized equity associated with purchasing and owning residential real estate.
_Avoid_: Owner path, house track, property branch

**Rent Path**:
The simulation scenario modeling initial capital preservation, security deposits, monthly rent payments, annual rent escalations, and the compound growth of all capital savings invested in an alternative asset portfolio.
_Avoid_: Tenant path, lease track, non-owner branch

**Net Worth Crossover Date**:
The exact calendar month and year on the simulation timeline when the cumulative net wealth of the Buy Path surpasses the Rent Path (or vice versa).
_Avoid_: Break-even date, inflection point, parity day

**Price-to-Rent Ratio (PRR)**:
The ratio of the total purchase price of the home to the annualized initial rent ($\frac{\text{Home Price}}{\text{Annual Rent}}$), serving as a standard rule-of-thumb valuation benchmark.
_Avoid_: Rent multiplier, property-to-lease ratio

**Gross Rental Yield**:
The annual baseline rental income expressed as a percentage of the total home purchase price ($\frac{\text{Annual Rent}}{\text{Home Price}} \times 100\%$).
_Avoid_: Cap rate, rental return percentage

---

### Home Financing & Mortgage

**Mortgage Amortization Scheme**:
The mathematical method used to calculate periodic principal and interest repayments. Supported schemes include **Equal Monthly Installments (Annuity / Fixed EMI)** and **Linear Principal Reduction (Equal Principal + Reducing Interest)**.
_Avoid_: Loan repayment type, debt schedule model

**Teaser Rate Period**:
An introductory promotional phase (typically 12 to 36 months) during which the mortgage incurs a discounted fixed interest rate prior to resetting to a floating rate benchmark.
_Avoid_: Promo duration, discount window, introductory rate period

**Floating Rate Benchmark**:
The long-term annualized interest rate applied to the remaining mortgage balance after the Teaser Rate Period expires, typically derived from a bank's cost of funds plus a risk margin.
_Avoid_: Standard rate, variable rate, post-promo interest

**Early Prepayment Penalty Tier**:
A structured penalty fee percentage charged on extra principal payments or full loan payoffs during early loan years (e.g. Years 1–3: 2.0%, Years 4–5: 1.0%, Year 6+: 0%).
_Avoid_: Prepayment fee, early payoff fine, settlement charge

**Remaining Loan Principal**:
The outstanding unpaid loan balance owed to the lender at any given month $t$ on the timeline.
_Avoid_: Debt balance, loan remainder, mortgage principal left

---

### Real Estate Equity & Ownership Costs

**Realizable Home Equity**:
The net liquidated value of the home at month $t$, defined as the appreciated market value minus the remaining mortgage balance and estimated selling friction costs.
_Avoid_: Paper equity, gross home value, raw property equity

**Selling Friction Cost**:
The total percentage of property market value deducted upon hypothetical sale at horizon exit to account for broker commissions, notary, title transfer fees, and transfer taxes (default 2.0%–3.0%).
_Avoid_: Exit fee, liquidation penalty, broker cost

**Upfront Acquisition Outflows**:
The sum of downpayment, government registration tax (Lệ phí trước bạ), title notary and legal fees, bank origination/insurance fees, and initial interior furnishing & renovation fit-out.
_Avoid_: Closing fees, purchase setup costs, initial buying costs

**Property Maintenance Buffer**:
An annual allocation for physical wear-and-tear, repairs, and recurring renovations, calculated as a percentage of the current appreciated property market value (e.g. 0.5%–1.0%/yr).
_Avoid_: Repair sinking fund, upkeep cost, home maintenance

**Building Management & HOA Fee**:
Recurring monthly dues paid for common building services, security, and amenities, escalating over time with general consumer price inflation (CPI).
_Avoid_: Strata fee, condo fee, monthly service charge

---

### Renting & Opportunity Cost Portfolio

**Initial Rent Investment Portfolio**:
The starting liquid capital pool in the Rent Path, calculated as the total upfront home acquisition outflows minus the rental security deposit and initial move-in expenses.
_Avoid_: Opportunity capital, seed portfolio, alternative investment balance

**Rent Security Deposit**:
A refundable deposit (e.g. 2 months' rent) held by the landlord that escalates proportionately with rent increases and is fully credited back to net worth at horizon exit.
_Avoid_: Lease bond, damage deposit, caution money

**Monthly Cashflow Delta Sweep**:
The dynamic monthly transfer between scenarios: if buying costs exceed renting, the positive difference is invested into the Rent Investment Portfolio; if renting costs exceed buying, the shortfall is drawn from the portfolio.
_Avoid_: Monthly savings transfer, delta injection, opportunity rebalance

**Rent Investment Yield**:
The expected compound annual nominal return rate earned by the Rent Investment Portfolio (default 8.0% p.a. for VND, 7.0% for USD).
_Avoid_: Market return, alternative yield, portfolio growth rate

**Cumulative Unrecoverable Costs (Sunk Costs)**:
The total sum of non-equity-building expenditures over time, contrasting rent payments against mortgage interest, property taxes, maintenance, HOA fees, and purchase/sale transaction friction.
_Avoid_: Wasted money, non-equity costs, dead money

---

### Inflation & Purchasing Power

**Property Appreciation Rate**:
The annual percentage compound growth rate applied to the market value of the residential real estate asset.
_Avoid_: Home price growth, house appreciation, real estate inflation

**Rent Inflation Rate**:
The annual percentage compound increase applied to monthly rent at each 12-month lease anniversary.
_Avoid_: Rental escalation, lease increase rate

**Headline Inflation Rate (CPI)**:
The general consumer price inflation rate used to continuously calculate the inflation-discounted Real Purchasing Power curve.
_Avoid_: Cost of living index, general inflation

**Purchasing Power (Real Value)**:
The inflation-adjusted equivalent value of nominal balances discounted continuously from the simulation start date.
_Avoid_: Constant currency, deflated net worth, real terms

---

### Analytics & User Ergonomics

**Continuous Multi-Variable Sensitivity Matrix**:
A 2D matrix heatmap showing the resulting Net Worth Crossover Horizon across varying combinations of Property Appreciation Rates and Rent Investment Yields.
_Avoid_: Grid heatmap, sensitivity table, scenario matrix

**Strategy Persona Preset**:
A predefined real estate profile (e.g. Urban Apartment Condo, Suburban Landed House, Aggressive FIRE Investor Renter, High-Yield Expat) with one-click parameter loading and 5-second undo safeguard.
_Avoid_: Template, default scenario, profile preset

**AI Decision Dossier**:
A structured, portable analytical Markdown summary generated from simulation parameters and month-by-month results, synthesizing crossover metrics, cashflow obligations, and tailored AI advisory blueprints.
_Avoid_: AI prompt, report export, LLM dump

**Privacy Anonymization Mask**:
A client-side sanitization toggle that converts absolute monetary values in the AI Decision Dossier into relative home-price multiples and percentage shares before export.
_Avoid_: Data hide, obfuscator, privacy shield

**Currency Input Masking**:
Live formatting of numerical monetary input fields with locale-aware thousand separators (dot `.` in `vi`, comma `,` in `en`) while preserving cursor positions during text insertion/deletion.
_Avoid_: Number spinner, raw unformatted input, unmasked text

**Dynamic Verbal Helper**:
Real-time localized verbal representation of monetary quantities (e.g. `2.5 Tỷ VND` / `2.5 Billion VND`, `35 Triệu VND` / `35 Million VND`) displayed beneath currency inputs.
_Avoid_: Tooltip translation, spelled-out popup, static text hint
