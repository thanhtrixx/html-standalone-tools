# 9. Streamlined Workbench, Enhanced Currency UX, Collapsible Methodology Above Charts, and Interactive Sensitivity Matrix

Date: 2026-08-28

## Status

Accepted

## Context

Following UI/UX review of `buy-vs-rent-home-comparison/index.html` and research recommendations:

1. **Redundant Property Type Card**: The separate Property Type profile selector card occupied valuable vertical space (~120px) at the top of the Buy column while duplicating preset behavior already provided by the Top Persona presets dropdown.
2. **Suboptimal Price & Rent Input UX**: Home Purchase Price and Monthly Rent inputs lacked currency adornments (`₫`, `/tháng`), quick increment/decrement steppers, live spelled out amount chips, and active visual state on preset chips, making rapid scenario adjustments tedious.
3. **Information Flow & Transparency Order**: The Methodology & Mathematical Formulas section was placed at the very bottom of the long page beneath the Analytics Hub. Users wanting to verify mathematical formulas before inspecting chart projections had to scroll to the bottom. Furthermore, power users needing a distraction-free, clean UI/UX requested an in-place collapse/expand toggle.
4. **Non-Interactive Sensitivity Matrix**: The Sensitivity Matrix presented 36 scenario outcomes as static table cells without interactive click actions to apply those scenarios directly back to the workbench.

## Decision

1. **Eliminate Redundant Property Type Profile Card**:
   - Removed the separate Property Type card from the Buy column DOM, streamlining the workbench directly into Home Purchase Price.
2. **Enhanced Currency Inputs & Quick Stepper Controls**:
   - Added currency prefix adornment `₫` and `/tháng` suffix to Home Purchase Price and Monthly Rent inputs.
   - Added live verbal badges (`#spelled_homePrice`, `#spelled_monthlyRent`) showing formatted readable amounts (e.g., `3.5 Tỷ VND`, `14 Triệu VND`).
   - Added quick increment/decrement stepper button groups:
     - Home Price: `-500Tr`, `+500Tr`, `+1Tỷ` (`stepCurrencyValue('homePrice', delta)`).
     - Monthly Rent: `-1Tr`, `+1Tr`, `+5Tr` (`stepCurrencyValue('monthlyRent', delta)`).
   - Added dynamic active highlight styling (`.price-chip`, `.rent-chip`) syncing chips with active parameter state.
3. **Reposition Methodology Above Charts with Clean UI/UX Toggle**:
   - Swapped DOM ordering so `#methodologySection` is placed directly above `#analyticsHubSection`.
   - Added `#toggleMethodologyVisibilityBtn` with chevron transition icon, collapsible container `#methodologyBodyContainer`, and `toggleMethodologyVisibility()` logic with `localStorage` state persistence.
   - Auto-expanded the section if collapsed when invoked via `scrollToMethodologySection()`.
4. **Interactive Sensitivity Matrix (`applySensitivityScenario`)**:
   - Attached `onclick="applySensitivityScenario(propRate, invRate)"` to all matrix cells.
   - Added hover scale effect (`hover:scale-[1.03]`) and pointer cursor to cells.
   - When clicked, updates `currentParams.propertyAppreciationRate` and `currentParams.rentInvestmentYield`, re-simulates, updates all charts, marks the active baseline with a gold star `★`, and displays feedback toast notifications.

## Consequences

- **Pros**:
  - Intuitive, frictionless parameter adjustments with steppers, masks, and active preset chips.
  - Logical information hierarchy: inputs -> methodology -> visual outcomes.
  - One-click scenario testing from the 2D Sensitivity Matrix.
  - Clean UI toggle preserves compact viewport for users focused on charts.
- **Cons**:
  - Requires maintaining bilingual translation keys for toggle states and sensitivity toasts.
