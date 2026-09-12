# ADR-0004: Material You (MD3) Bottom Navigation & Item-Centric In-Aisle Comparator

## Status

Accepted

## Context

During in-store grocery shopping, users experience high cognitive load and physical constraints (holding a shopping basket, pushing a cart, operating a mobile device with one hand under supermarket lighting).

The initial UI implementation suffered from several ergonomic limitations:

1. **Mode Switching Fragmentation**: Planning vs. In-Store shopping mode was toggled via small top-level pill buttons, far outside the single-handed thumb reach zone.
2. **Suboptimal Bottom Bar Real Estate**: Sharing was placed in the bottom navigation bar, displacing high-frequency shopping destinations (`Planning Mode` and `Buy Mode`).
3. **Manual Package Comparison Friction**: The in-aisle package comparator was generic and decoupled from list items, forcing users to manually type package name, price, quantity, and unit from scratch.
4. **Visual Hierarchy & Theming**: The UI used generic utility styling lacking Material Design 3 (Material You) surface container elevation, tonal palette tokens, floating action buttons (FABs), and bottom sheet interaction patterns.

## Decision

1. **Material You (MD3) CSS Token System & Zero-Dependency Theming**:
   - Establish semantic CSS custom properties in `:root` and `:root.light`:
     - Surface tokens: `--md-sys-color-surface`, `--md-sys-color-surface-container`, `--md-sys-color-surface-container-high`, `--md-sys-color-surface-container-lowest`.
     - Tonal and Accent tokens: `--md-sys-color-primary`, `--md-sys-color-on-primary`, `--md-sys-color-primary-container`, `--md-sys-color-on-primary-container`, `--md-sys-color-secondary-container`.
     - Shape tokens: `--md-sys-shape-corner-full`, `--md-sys-shape-corner-xl` (28px), `--md-sys-shape-corner-large` (16px).
   - Implement active indicator pills with smooth transitions in the navigation bar and primary Floating Action Buttons (FABs) in Planning Mode.

2. **MD3 Bottom Navigation Bar Architecture**:
   - Re-architect the persistent bottom navigation into 4 dedicated core destinations:
     1. **`📝 Planning`**: Active list management, category filtering, budget estimation, item addition FAB.
     2. **`🛒 Buy Mode`**: In-aisle focus mode, large $\ge 48\text{px}$ touch targets, running basket total, unpurchased items prioritized.
     3. **`📈 Price Ledger`**: Historical purchase transactions, multi-store price comparisons, all-time lows.
     4. **`⚖️ Comparator`**: Standalone dual-pack scratchpad calculator.
   - Relocate **Share** (`📤`) and utility toggles (Theme, Currency, Language) exclusively to the **Top App Bar** / overflow header.

3. **Item-Centric In-Aisle Package Comparator Trigger**:
   - Equip every list item card with a 1-tap comparator trigger (`⚖️`).
   - Launching comparator from an item automatically pre-populates **Package A** with:
     - `name`: active item name.
     - `price`: active item sticker/estimated price.
     - `quantity`: active item quantity.
     - `unit`: active item unit dimension.
   - The user only inputs **Package B** (alternative brand/size on shelf).
   - A 1-tap "Apply Winner to List" action instantly updates the list item's package size and price if Package B provides superior unit value.

4. **Buy Mode In-Line Price & Quantity Adjustments**:
   - In Buy Mode, tapping item price or quantity opens a rapid adjustment bottom sheet or inline edit field so shoppers can align estimated prices with actual shelf prices before checking off.

## Consequences

- Significantly reduced tap count and typing friction while standing in supermarket aisles.
- Dedicated, distraction-free Buy Mode optimized for single-thumb checklist completion.
- Cohesive Material Design 3 aesthetic with high-contrast readability under bright supermarket lights.
- Zero extra runtime dependencies; fully compliant with single-file HTML deliverable standards.
