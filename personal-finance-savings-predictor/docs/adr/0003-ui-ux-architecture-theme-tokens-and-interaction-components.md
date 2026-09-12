# ADR-0003: UI/UX Architecture, Theme Tokens, and Interaction Components

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0003, 0009, 0011, 0012, 0013, 0014, 0016, 0018

---

## Context

A high-density financial planning application requires seamless mobile-to-desktop responsiveness, bilingual formatting, accessibility contrast standards, and non-blocking dialog/tooltip interactions.

---

## Decisions

### 1. Semantic CSS Token Theme System & Dynamic Chart Sync

- Centralized CSS custom properties in `:root` and `:root.light` guaranteeing WCAG 2.1 AA/AAA contrast ratios ($\ge 4.5:1$).
- Theme toggle hook dynamically updates Chart.js gridlines, tick colors, tooltips, and legends in real-time upon switching.

### 2. Localization & Currency Input Masking

- Bilingual localization (`vi` and `en`) with standard thousand separators (`.` in Vietnamese, `,` in English).
- Live input masking and dynamic verbal quantity helpers (e.g. "50 triệu VND", "$50,000 USD") synchronized across typing and preset chips.

### 3. Analytics Hub, Heatmap & Accounts Table

- **Tabbed Analytics Hub**: Seamless switching between Wealth Timeline Chart, 12-column Monthly Heatmap Grid, and Year-over-Year (YoY) metrics.
- **Continuous Multi-Year Heatmap**: Visualizes monthly liquidity density and net wealth shifts with popover breakdowns.
- **Full-Width Accounts Hub**: Categorized portfolio table with status pills (`All`, `Active Fixed`, `Auto Term`, `Matured`, `Withdrawals`).

### 4. Modal Lifecycle & Dialog Layering

- Centralized modal controller (`dismissAllModals()`) enforcing single-active-dialog invariant, escape key dismissals, backdrop clicks, and scroll locking.

### 5. Interactive Tooltip Engine & Mobile Ergonomics

- Floating popover engine providing instant contextual hover explanations on desktop and tap toggle on touch devices.
- Responsive mobile action sheets, 2×2 KPI metric cards, touch preset carousels ($\ge 36\text{px}$ touch targets), and adaptive card views on narrow screens ($< 640\text{px}$).

---

## Consequences

- **Positive**: Fluid user experience across all devices, zero modal focus traps, clear visual hierarchy.
- **Trade-off**: Requires synchronizing Chart.js color palettes and DOM classes upon theme changes.
