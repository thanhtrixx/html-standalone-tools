# ADR-0033: Critique Remediation: Buy Mode Deal Intelligence, Viewport Decluttering, Two-Tier Planning Cards, and Trip Victory Receipt

## Status

Accepted (v4.6.0)

## Context

An Impeccable UX/UI Design Critique of `smart-buy-list-price-tracker` evaluated against Nielsen's 10 Heuristics, cognitive load principles, and deterministic design linting identified five core deficiencies across the shopping lifecycle:

1. **Buy Mode Deal Blindness (P0)**:
   - While shoppers stand in front of physical supermarket shelves comparing prices, the in-aisle Buy Mode card displayed only the package price and a tiny deal emoji badge. The normalized unit price ($/kg, $/L, $/ea) and All-Time Low (ATL) benchmark delta were stripped from the card, forcing shoppers to memorize past unit rates or switch back to Planning mode.
2. **Viewport Asphyxiation & Container Slop (P1)**:
   - The mobile viewport was congested by 6 stacked horizontal control tiers (App Header, 3 KPI Metric Cards, Omnibox, Grouping Switcher, Store Chips, Category Chips), consuming over 50% of vertical screen space.
   - The detector flagged 26 `nested-cards` warnings from modal containers enclosing bordered sub-cards enclosing bordered item rows, causing severe visual clutter and wasting mobile horizontal real estate.
3. **Planning Card Action Paralysis (P2)**:
   - Each item card in Planning mode displayed 5 separate action buttons (`Check`, `Quantity Stepper`, `Compare`, `Edit`, `Delete`) plus a clickable price. This violated cognitive load constraints (≤4 choices per decision point) and created frequent mis-taps on mobile touchscreens.
4. **Anti-Climactic Trip Completion (P3)**:
   - Finishing a 45-minute grocery trip concluded with an administrative unpurchased-item rollover radio dialog and a generic toast, offering zero emotional reward, celebratory feedback, or validation of money saved against supermarket inflation.
5. **Token Drift & Contrast Inconsistencies (P4)**:
   - Static analysis revealed 29 ad-hoc occurrences of undocumented `10px` and `11px` typography classes, 13 undocumented daylight palette tokens in `DESIGN.md`, and a `gray-on-color` contrast defect (`text-slate-950 on bg-emerald-500`) in `src/ui/modals.js:750`.

---

## Decisions

### 1. In-Store Buy Mode Unit Price & ATL Deal Delta (P0)

- Update Buy Mode card rendering in `src/ui/render.js`:
  - Display the normalized unit price ($/kg, $/L, $/ea, ₫/kg, etc.) directly alongside the line price in bold, legible typography.
  - Render an inline deal delta indicator comparing current unit price against the item's All-Time Low (e.g. `+8% vs ATL` or `Best Deal`).
  - Retain responsive deal badge presentation (compact icon `< 640px`, full badge $\ge 640\text{px}$).

### 2. Context-Adaptive Viewport & Unified Container Surfaces (P1)

- In **In-Store Buy Mode**:
  - Automatically hide the Smart Omnibox (`#smartQuickInput`) and the Planning Grouping switcher (`By Aisle` / `By Store`).
  - Collapse the 3 large KPI cards into an ambient, single-line sticky pacing ticker (`Checked: X/Y · $Spent / $Total`).
  - Consolidate store and category filters into a compact horizontal scroll bar or bottom filter sheet.
- **Container Flattening**:
  - Refactor modal layouts in `index.html` and dynamic card templates to eliminate nested card borders. Use subtle divider lines (`divide-y divide-slate-800/60`), tonal surface shifts, and whitespace to separate content without enclosing cards within cards.

### 3. Two-Tier Planning Card Hierarchy & Gesture Delegation (P2)

- Redesign Planning Mode cards into a clean two-row structure:
  - **Row 1**: Checkbox + Item Icon & Name + Total Shelf Price.
  - **Row 2**: Quantity Stepper + Normalized Unit Price + Deal Rating Badge.
- Delegate secondary actions:
  - Tapping the item card body opens `#editItemModal`.
  - `Compare` and `Delete` actions are delegated to horizontal touch swipe gestures (Swipe Right to Compare, Swipe Left to Delete).
  - For non-touch desktop users, provide a compact 3-dot overflow menu (`⋯`) for secondary actions.

### 4. Interactive Trip Victory Receipt Modal (P3)

- Introduce an interactive `#tripVictoryModal` displayed upon completing a shopping trip:
  - Calculates and showcases total money saved against baseline/average prices (e.g. `🎉 Bạn đã tiết kiệm 85.000₫ (15%)` / `🎉 You saved $12.40 (15%)`).
  - Highlights the single "Best Deal of the Trip" (e.g. `🏆 Deal hời nhất: Sữa tươi (-25%)`).
  - Summarizes purchased vs unpurchased items with a 1-tap rollover toggle to carry unpurchased items into the next draft list before committing to the historical ledger.

### 5. Design System Token & Contrast Harmonization (P4)

- **Typography Ramp**: Officially add `caption: 11px` to the type scale in `DESIGN.md`.
- **Class Normalization**: Upgrade all sub-11px (`10px`) typography classes across the codebase to `11px` or Tailwind `text-xs` (12px) for store-floor readability.
- **Contrast Remediation**: In `src/ui/modals.js:750`, update toast button text from `text-slate-950` to `text-emerald-950` on `bg-emerald-500` for chromatic harmony and WCAG compliance.
- **Light Theme Tokens**: Register the 12 daylight palette tokens in `DESIGN.md` YAML metadata so automated tools validate them as official system tokens.

---

## Consequences

### Positive

- In-aisle shoppers can instantly verify if a shelf price is good without extra taps.
- Mobile viewport gains >150px of visible grocery list items.
- Planning cards are clean, thumb-friendly, and free of button clutter.
- Completing a trip provides positive psychological reinforcement for grocery budgeting.
- Zero design detector warnings or unrecorded design tokens.

### Negative / Trade-offs

- Users on non-touch desktop browsers must use the 3-dot menu to access Compare and Delete instead of explicit standalone toolbar buttons.
- Calculating "Trip Savings" requires fallback estimation when an item has no prior historical ledger entries (defaults to 0 savings).
