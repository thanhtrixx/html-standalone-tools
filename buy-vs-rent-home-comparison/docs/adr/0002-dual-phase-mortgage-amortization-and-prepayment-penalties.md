# ADR-0002: Dual-Phase Mortgage Amortization with Prepayment Penalties

## Status

Accepted

## Context

Mortgage structures vary across banking regimes. In Vietnam and emerging markets, loans commonly utilize **Linear Principal Amortization** (equal principal monthly + interest on remaining balance) rather than Western-style **Equal Monthly Installments (Annuity / Fixed EMI)**. Furthermore, bank loans typically offer an introductory teaser rate (12–36 months) before resetting to floating rates, along with early prepayment settlement penalties (Years 1–3: ~2%, Years 4–5: ~1%, Year 6+: 0%).

## Decision

1. **Amortization Schemes**: Provide a toggle supporting both `fixed_emi` (Annuity) and `linear_principal` (Reducing balance).
2. **Dual-Phase Rates**: Model promotional teaser rate ($r_{\text{teaser}}$ for $M$ months) resetting to floating rate benchmark ($r_{\text{floating}}$).
3. **Prepayment & Penalty Schedule**: Allow optional monthly extra principal repayments and calculate exact early settlement penalty fees based on loan tenure year.

## Consequences

- Full fidelity for both Vietnamese local home buyers and international users.
- Clear transparency on the upfront cash burden of linear principal repayments vs. annuities.
