# ADR 0006: Contextual Tooltip Popovers, Methodology Hub, and Dynamic Formula Traces

## Status

Accepted

## Context

Residential real estate and dual-path investment comparison models involve specialized mathematical concepts, amortizations, opportunity cost delta reinvestments, selling frictions, and inflation discounting. Without accessible, contextual explanations and transparent mathematical proofs, end-users face cognitive friction and risk treating the simulator as an opaque "black-box".

Users require:

1. Contextual information icons (`(i)`) across every parameter input, KPI metric, and analytics tab that provide plain-language explanations on hover (desktop) and tap (mobile).
2. A comprehensive **Methodology & Formula Hub Modal** providing rigorous mathematical formulations for:
   - Fixed EMI Annuity Mortgage Payments vs. Linear Principal Amortization.
   - Net Realizable Home Equity with Selling Friction.
   - Dual-Path Opportunity Delta Reinvestment & Deficit Drawdowns.
   - Decoupled Real Purchasing Power Continuous Discounting.
   - Price-to-Rent Ratio (PRR) and Gross Rental Yield Benchmarks.
   - Break-Even Crossover Horizon Determination.
3. Live numeric substitutions (Interactive Formula Variable Traces) plugging the user's active inputs directly into the mathematical formulas.
4. A structured, bilingual Real Estate & Financial Terminology Glossary categorized by Mortgage, Investment, and Macroeconomics.

## Decision

1. **Global Floating Tooltip Engine**:
   - Implement a lightweight, zero-dependency popover engine (`showAppTooltip`, `hideAppTooltip`, `handleTooltipClick`) positioned dynamically using viewport boundary detection.
   - Ensure `<100ms` hover trigger on desktop and single-tap trigger on mobile with click-event isolation (`stopPropagation`, `preventDefault`) to prevent accidental input focus.
2. **Methodology & Formula Hub Modal**:
   - Add a dedicated `#methodologyModal` accessible via the header toolbar (`#methodologyBtn`) and footer link.
   - Structure into 3 organized sections:
     - **Section 1: Core Mathematical Formulas, Variable Notations & Live Traces**:
       - Integrate **KaTeX mathematical typesetting** (`katex@0.16.11`) via CDN with graceful plain-text LaTeX fallback.
       - Format all core financial formulations in standard LaTeX math notation:
         - **Fixed EMI Annuity**: $$\text{EMI} = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
         - **Linear Principal**: $$\text{Principal}_t = \frac{P}{n}, \quad \text{Interest}_t = \text{Balance}_t \times r$$
         - **Realizable Home Equity**: $$\text{Equity}(t) = \left[ P_0 \times (1 + g_{\text{property}})^{t/12} \right] \times (1 - f_{\text{selling}}) - \text{Debt}(t)$$
         - **Rent & Invest Portfolio Accumulation**: $$\text{Portfolio}(t) = \text{Portfolio}(t-1) \times \left(1 + \frac{r_{\text{invest}}}{12}\right) + \left[ \text{Outflow}_{\text{Buy}}(t) - \text{Outflow}_{\text{Rent}}(t) \right]$$
         - **Valuation Metrics (PRR & Yield)**: $$\text{PRR} = \frac{P_0}{\text{Annual Rent}}, \quad \text{Gross Rental Yield} = \frac{\text{Annual Rent}}{P_0} \times 100\%$$
       - Embed explicit **Variable Notations Legends** beneath each formula block defining all mathematical symbols ($P$, $r$, $n$, $\text{Balance}_t$, $P_0$, $g_{\text{prop}}$, $f_{\text{sell}}$, $\text{Debt}(t)$, $\text{Portfolio}(t)$, $r_{\text{invest}}$, $\text{Outflow}_{\text{Buy}}$, $\text{Outflow}_{\text{Rent}}$, $\text{PRR}$, $\text{Yield}$) in both English and Vietnamese.
       - Provide live active variable traces dynamically plugging user parameters into real numeric calculations.
     - **Section 2: Bilingual Glossary**: Ubiquitous domain definitions across Vietnamese and English.
     - **Section 3: Methodology & Simulation Invariants**: Explicit modeling assumptions (deterministic monthly compounding, decoupled CPI, selling friction).
   - Display an accurate automated test verification badge (`134 automated test assertions` / `134 assertions tự động`) reflecting the tool's dedicated test suite.
3. **Bilingual Parity & Lifecycle Safeguards**:
   - Maintain 100% dictionary key parity between `TRANSLATIONS.en` and `TRANSLATIONS.vi` for all tooltip keys, formula descriptions, variable notation labels, and glossary entries.
   - Synchronize `document.documentElement.lang` on language toggle (`vi` / `en`) and guard Chart.js canvas re-rendering via `Chart.getChart(canvas)?.destroy()`.

## Consequences

- **Positive**: Complete algorithmic transparency eliminates black-box skepticism; users can inspect and audit exact mathematical calculations with their own live parameters and clear symbol definitions.
- **Positive**: LaTeX equations render with crisp, professional typography via KaTeX with zero runtime degradation and plain-text fallback.
- **Positive**: Accessible across both mobile and desktop viewports with zero blocking build dependencies.
- **Neutral**: Adds additional localized string keys to dictionary files, maintained under automated parity tests.
