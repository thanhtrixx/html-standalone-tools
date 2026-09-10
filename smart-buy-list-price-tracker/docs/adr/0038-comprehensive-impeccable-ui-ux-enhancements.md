# ADR-0038: Comprehensive Impeccable UI/UX Enhancements, In-Aisle Ergonomics & Motion Architecture

- **Status**: Accepted
- **Date**: 2026-09-10
- **Context**: Smart Buy-List & Unit Price Tracker (PWA v4.6.2)

---

## Context & Problem Statement

The `smart-buy-list-price-tracker` tool has matured in functionality, covering offline-first storage (IndexedDB), multi-cloud sync (Google Drive & GitHub Gist), unit price normalization ($/kg, $/L, $/ea), 3-way merge conflict resolution, and PWA lifecycle management.

However, an end-to-end design audit and critique using the **Impeccable** design framework identified opportunities across 5 key UI/UX dimensions:

1. **In-Aisle Glanceability & Visual Hierarchy**: High-contrast price reading, deal badge distinction, and typographic scale under harsh supermarket lighting.
2. **Micro-Interactions & Motion Physics**: Engaging, tactile feedback on checkbox toggles, smooth list item transitions into the completed tray, and fluid progress bar updates with strict accessibility motion reduction (`prefers-reduced-motion`).
3. **In-Aisle Rapid Price Adjustments**: When shoppers spot shelf prices that differ from their planned estimate, opening the full `#editItemModal` introduces unnecessary friction and cognitive load.
4. **Onboarding & Empty State Activation**: First-time users are greeted with a plain empty placeholder without actionable paths to explore deal intelligence or sample data; active filters returning 0 results lack 1-tap recovery.
5. **Sticky Section Grouping & Subtotal Rollups**: In long shopping lists grouped by aisle or store, section headers scroll out of view, losing aisle context and departmental spend visibility.

---

## Decision Drivers

- **The In-Aisle Column Rule**: Maintain the single-column centered posture (max-width 480px) and one-handed thumb ergonomics.
- **Zero External Runtime Dependencies**: Implement all motion, popovers, and visual styling via pure CSS3 / Tailwind utility classes and native DOM APIs without unbundled npm libraries.
- **Two-Speed TDD & 100% Verification**: Ensure all new DOM components, states, and keyboard flows are backed by automated assertions in `tests/smart-buy-list-ui-components.test.js` and `tests/smart-buy-list-i18n.test.js`.
- **Bilingual Parity**: Maintain 100% Vietnamese (`vi`) and English (`en`) translation parity for all new UI strings, helper copy, and starter templates.
- **Accessibility & Craft Floor**: Comply with WCAG AA (contrast ≥ 4.5:1, touch bounds ≥ 44x44px, screen-reader semantics, and `0.01ms` motion dampening on reduced-motion).

---

## Considered Options & Decision Outcome

### 1. In-Aisle Glanceability & Deal Badges

- **Decision**: Elevate card typography with distinct weight steps (nominal package price in bold font-bold, normalized unit price in tabular-nums with emerald accent), and render deal rating badges with semantic pill borders (`🟢 Great Deal`, `🟡 Fair Price`, `🔴 Price Spike`).

### 2. Micro-Interactions & Spring Motion

- **Decision**: Introduce cubic-bezier spring physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for checkbox states, smooth height & opacity transitions as checked items slide into the completed section, and fluid shopping progress bar fill physics. Respect `prefers-reduced-motion: reduce` by zeroing transition durations.

### 3. In-Store 1-Tap Inline Price Adjustment Popover

- **Decision**: In In-Store Buy Mode, clicking the shelf price on an active item card toggles an ultra-compact inline price popover directly anchored to the card. Shoppers can adjust the price using quick nudge buttons or numeric input and tap "Save & Update", updating the active item and price ledger seamlessly.

### 4. Interactive Starter Hauls & Zero-Result Filter Recovery

- **Decision**: Replace static empty states with an interactive "Weekly Essentials Starter Haul" 1-tap template, department quick-chips, and contextual "Clear Active Filters" recovery buttons when store/category filters yield zero items.

### 5. Sticky Section Grouping & Subtotal Rollup

- **Decision**: When grouped `By Aisle` or `By Store`, section headers stick beneath the top app bar (`sticky top-14 backdrop-blur-md z-10`), displaying department icons, item count badges, and real-time subtotal spend rollups.

---

## Consequences

### Positive

- Greatly improved in-aisle usability, glanceability, and one-handed thumb navigation.
- Increased user delight and engagement through tactile micro-interactions and celebratory victory receipts.
- Faster first-run activation via starter grocery templates.
- Zero dead-end filter states with instant 1-tap recovery.

### Negative / Trade-offs

- Requires careful CSS layering (`z-index` coordination between sticky header, sticky section headers, sticky finish trip bar, and bottom navigation).
- Additional test assertions required across DOM suites to verify popover lifecycles, starter hauls, and sticky subtotal calculations.
