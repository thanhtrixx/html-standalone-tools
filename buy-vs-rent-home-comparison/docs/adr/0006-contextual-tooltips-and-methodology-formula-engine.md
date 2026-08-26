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
     - **Section 1: Core Mathematical Formulas & Live Variable Traces**: General formulas alongside dynamically evaluated active input substitutions.
     - **Section 2: Bilingual Glossary**: Ubiquitous domain definitions across Vietnamese and English.
     - **Section 3: Methodology & Simulation Invariants**: Explicit modeling assumptions (deterministic monthly steps, Decoupled CPI, friction costs).
3. **Bilingual Parity**:
   - Maintain 100% dictionary key parity between `TRANSLATIONS.en` and `TRANSLATIONS.vi` for all tooltip keys, formula descriptions, and glossary entries.

## Consequences

- **Positive**: Complete algorithmic transparency eliminates black-box skepticism; users can audit exact mathematical calculations with their own live parameters.
- **Positive**: Accessible across both mobile and desktop viewports with zero third-party dependencies.
- **Neutral**: Adds additional localized string keys to dictionary files, maintained under automated parity tests.
