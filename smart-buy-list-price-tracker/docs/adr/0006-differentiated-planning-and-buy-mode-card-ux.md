# ADR-0006: Differentiated Planning Mode and Buy Mode Item Card UX

## Status

Accepted

## Context

In the Smart Buy-List & Unit Price Tracker application, users interact with grocery items across two distinct phases of the shopping lifecycle:

1. **Planning Mode (`currentPhase === "PLANNING"`)**: Users plan their grocery trip at home or desk. In this phase, users need rich domain intelligence—reviewing quantity/pack configurations, inspecting normalized unit prices ($/kg, $/L, $/ea), comparing current prices against historical All-Time Lows (ATL) or last paid prices, evaluating color-coded deal rating badges, assigning stores, and having easy access to edit (`✏️`), compare (`⚖️`), and remove (`🗑️`) actions.
2. **In-Store Buy Mode (`currentPhase === "IN_STORE"`)**: Shoppers are actively walking supermarket aisles, pushing a shopping cart with one hand while holding a mobile phone in the other. In this phase, cognitive load and visual clutter must be minimized. Plentiful secondary buttons and dense metadata increase the likelihood of accidental clicks (e.g. deleting an item by mistake) and slow down quick visual scanning.

Previously, `renderItemCard(item)` rendered an identical, hybrid card layout regardless of the active trip phase.

## Decision

1. **Ultra-Minimalist Buy Mode Card UX (`IN_STORE`)**:
   - **Visible Elements**: Only the large thumb-friendly checkbox (`✓`), pure text item name (`item.name`), and clickable shelf price (`formatCurrency(item.price)`).
   - **Hidden Elements**: Category emoji icons, quantity/size pills, store name tags, normalized unit prices ($/L, $/kg), deal rating badges, inline comparator buttons (`⚖️`), and remove buttons (`🗑️`) are hidden.
   - **Tap Interactions**:
     - Tapping the Checkbox toggles checked status with tactile haptic vibration (`navigator.vibrate([15])`).
     - Tapping the Shelf Price opens the bottom-sheet Quick Price Update modal with fast delta chips (`+0.25`, `+0.50`, etc.) for zero-friction shelf price corrections.
     - Tapping the card background toggles checked status.
   - **Fluid Swipe Gestures**: Touch swipes remain active (Swipe Right marks Done, Swipe Left opens the In-Aisle Package Comparator pre-filled).

2. **Rich Expanded Planning Mode Card UX (`PLANNING`)**:
   - **Row 1 (Header)**: Staging checkbox (`✓`) + Category emoji icon + bold item name + retail store tag (`🏪 Costco`) + Deal Score Badge (`🟢 Great Deal` / `🟡 Fair Price` / `🔴 Price Spike`).
   - **Row 2 (Metrics & Intelligence)**: Quantity & unit pill (e.g. `📦 2 l`, clickable to edit size/price), normalized unit price (`$1.75 / l`), and historical baseline reference (`ATL: $1.70/l` or `New Item`).
   - **Row 3 (Action Toolbar & Total Price)**:
     - 1-tap Comparator button (`⚖️ Compare`).
     - Dedicated Edit button (`✏️ Edit`).
     - Dedicated Delete button (`🗑️ Remove`).
     - Total estimated spend (`formatCurrency(item.price)`).
   - **Staging Checkbox**: Checkbox remains functional in Planning Mode for pre-shopping pantry audits.

3. **Ubiquitous Language & Bilingual Parity**:
   - Both English (`en`) and Vietnamese (`vi`) translation dictionaries in `TRANSLATIONS` include keys for `edit_btn`, `remove_btn`, `est_price_label`, `new_item`, and `atl_price_label`.

## Consequences

- **Superior In-Aisle Ergonomics**: Buy Mode provides zero-distraction scanning with massive hit targets and rapid checking.
- **Comprehensive Planning Intelligence**: Planning Mode offers full analytical transparency into pack sizes, unit economics, and historical deal context.
- **Zero-Accident Shopping**: Deleting or opening complex modal flows by accidental tap during in-store walking is eliminated in Buy Mode while preserving power-user swipe access.
- **100% Backward Compatibility**: Data models (`memoryState.activeList.items`, `memoryState.purchaseLedger`) and storage structures remain completely unchanged.
