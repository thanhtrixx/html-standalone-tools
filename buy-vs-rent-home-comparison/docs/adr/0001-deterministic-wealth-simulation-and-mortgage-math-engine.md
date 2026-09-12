# ADR-0001: Deterministic Wealth Simulation and Mortgage Math Engine

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0001, 0002, 0003, 0004, 0005

---

## Context

The Buy vs Rent comparison requires an uncompromisingly accurate, month-by-month financial simulation reflecting realistic Vietnamese and international property acquisition conditions:

1. **Dual-Path Deterministic Simulation**: Parallel evaluation of the Buying path vs. Renting path over identical multi-year horizons ($N \in [1, 30]$ years).
2. **Dual-Phase Mortgage Amortization**: Standard loans feature an initial promotional fixed-rate phase ($T_{\text{promo}}$ months at $r_{\text{promo}}$) followed by a floating market rate phase ($r_{\text{float}} = r_{\text{base}} + \text{margin}$), subject to prepayment penalties.
3. **Opportunity Cost & Delta Reinvestment**: Renters invest the down payment difference and monthly cash flow differential $(\text{Outflow}_{\text{Buy}} - \text{Outflow}_{\text{Rent}})$ at an expected investment return $r_{\text{invest}}$. Deficits are drawn from the portfolio.
4. **Realizable Home Equity & Selling Friction**: Net buyer wealth accounts for selling transaction costs (agent fees, transfer tax, notary) and outstanding loan principal payoff.
5. **Inflation Decoupling & Purchasing Power**: Wealth and cash flows can be toggled between nominal values and inflation-adjusted real purchasing power.

---

## Decisions

### 1. Mathematical Simulation Engine (`simulateBuyVsRent`)

The engine is a decoupled, pure JavaScript function operating deterministically on monthly intervals:

```
For month m = 1 to TotalMonths:
  Buyer:
    - Amortize mortgage balance with current phase interest rate
    - Calculate monthly ownership costs (mortgage payment + maintenance + HOA + property tax + insurance)
    - Appreciate property value at annual rate g_home
  Renter:
    - Calculate monthly rent (escalating annually by g_rent)
    - Compound investment portfolio at monthly rate (1 + r_invest)^(1/12) - 1
    - Reinvest cashflow delta (Buyer_Outflow - Renter_Outflow) into investment portfolio
    - If delta < 0, liquidate portfolio units to cover rent deficit
```

### 2. Dual-Phase Mortgage & Prepayment Penalty Mechanics

- **Phase 1 (Fixed Teaser)**: Months $1 \le m \le T_{\text{promo}}$ amortize using $r_{\text{promo}} / 12$.
- **Phase 2 (Floating)**: Months $m > T_{\text{promo}}$ recalculate monthly installment based on remaining principal and $r_{\text{float}} / 12$.
- **Early Liquidation Penalty**: When calculating sale equity before full loan maturity, apply tier-based prepayment penalty penalties according to the bank fee schedule.

### 3. Realizable Net Wealth Valuation

- **Buyer Net Wealth at Month $m$**:
  $$\text{Net Wealth}_{\text{Buy}}(m) = \text{Home Value}(m) \times (1 - \text{Selling Cost \%}) - \text{Remaining Loan Principal}(m) - \text{Prepayment Penalty}(m)$$
- **Renter Net Wealth at Month $m$**:
  $$\text{Net Wealth}_{\text{Rent}}(m) = \text{Investment Portfolio Balance}(m)$$

### 4. Purchasing Power Discounting

- When Real Mode is active, all terminal wealth values and cash flow projections are discounted using cumulative inflation:
  $$\text{Real Value}(m) = \frac{\text{Nominal Value}(m)}{(1 + i_{\text{inflation}})^{m/12}}$$

---

## Consequences

- **Positive**: Strict mathematical integrity, reproducible outcomes, exact parity with banking amortization schedules.
- **Trade-off**: Requires running full monthly loop (up to 360 iterations) per simulation update, easily handled in < 2ms in modern JavaScript.
