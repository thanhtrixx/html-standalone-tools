# ADR 0007: In-Page Methodology Hub and Full-Width Bottom Chart Layout Redesign

## Status

Accepted

## Context

In the initial architecture (ADR-0006), the parameter inputs occupied a 5-column left stack (~1,250px vertical height) alongside a 7-column right Analytics Hub card (~560px vertical height), with the mathematical formulations and glossary relegated to a modal dialog (`#methodologyModal`).

During UI/UX design review and Lightpanda headless DOM inspection:

1. **Vertical Asymmetry & Dead Space**: On desktop screens, the difference in height between the input stack (1,250px) and the analytics card (560px) created substantial blank dead space and caused the chart to scroll completely out of view when users scrolled down to modify Rent or Macroeconomic parameters.
2. **Horizontal Chart Squeeze**: Squeezing a 30-year (360 monthly data points) dual net-wealth timeline, monthly cashflow obligations, and 6x6 sensitivity heatmap into a 7-column width (~650px) cramped axis labels, milestone markers, and tooltip interaction targets.
3. **Modal Friction & Math Obscurity**: Hiding essential mathematical formulas, variable notation legends, and live substitution traces inside a popup dialog forced extra clicks and obstructed immediate mathematical validation.

## Decision

1. **Balanced Side-by-Side Dual-Column Configuration Workbench (Upper Section)**:
   - Restructure the parameter inputs into a balanced 2-column grid (`grid-cols-1 md:grid-cols-2`):
     - **Left Column (Buy Path)**: Property Type Selector Card + Home Purchase & Financing Card (Price, downpayment, tenure, amortization scheme, interest rates, upfront breakdown `<details>`).
     - **Right Column (Rent Path & Macroeconomics)**: Renting & Investment Opportunity Card (Rent, inflation, yield, initial portfolio summary) + Macroeconomics & Horizon Card (Property growth, CPI inflation, horizon years).
   - Both columns achieve equal visual weight (~550px height) without dead space.

2. **Full-Width Analytics & Visualization Hub (Middle Section)**:
   - Relocate the Analytics Hub directly below the configuration workbench spanning the full 12-column grid (`w-full min-h-[480px] lg:min-h-[500px]`).
   - Canvas expands to 100% width (~1,200px on desktop) with `maintainAspectRatio: false`, significantly boosting line curve resolution, crossover marker clarity, and sensitivity heatmap touch target sizing.
   - Maintain tab navigation (`Tài Sản Ròng`, `Dòng Tiền Ra`, `Ma Trận Độ Nhạy`), Real Purchasing Power CPI toggle, legend, and PNG export.

3. **In-Page Methodology & Mathematical Formula Hub (Lower Section)**:
   - Transform the modal `#methodologyModal` into a dedicated in-page section card `#methodologySection` positioned directly below the Chart Hub.
   - Retain 3 internal switcher tabs:
     - `[Công Thức & Thay Số Thực Tế]`: KaTeX LaTeX formulas, variable notations, and live dynamic user substitution traces (`trace_mortgage`, `trace_equity`, `trace_rent`, `trace_prr`).
     - `[Từ Điển Thuật Ngữ]`: Bilingual domain glossary grid (Sunk Costs, Crossover, Teaser Rates, PRR).
     - `[Giả Định & Quy Chuẩn]`: Core simulation invariants and test verification badge.
   - Top header button `#methodologyBtn` smoothly scrolls to `#methodologySection` (`scrollIntoView({ behavior: 'smooth' })`), activates the formulas tab, and briefly pulses a glowing focus ring (`ring-2 ring-indigo-500/50`).
   - Methodology footer features an automated test verification badge and a "Về đầu trang" (Back to top) button.

4. **Linear Guided Tour Sequence**:
   - Update `startOnboardingTour()` to follow the 5-step natural visual hierarchy:
     - Step 1: Top KPI Summary Cards
     - Step 2: Buy Path Configuration Card
     - Step 3: Rent Path & Macro Configuration Card
     - Step 4: Full-Width Analytics Chart Hub
     - Step 5: In-Page Mathematical Methodology & AI Decision Dossier.

## Consequences

- **Positive**: Eliminates dead space on desktop viewports; parameters can be configured side-by-side with immediate clarity.
- **Positive**: 360-month time-series chart gains 2x horizontal resolution, making net worth crossovers and cashflow divergences easily readable.
- **Positive**: Formulas and live calculation traces are discoverable directly on the page, eliminating modal friction while maintaining full auditability.
- **Positive**: 100% backwards-compatible with existing headless test suites and zero-runtime single-file deliverable constraint.
