# ADR-0005: Store List Management, Aisle/Store Grouping, Touch Swipe Gestures & Option Hub

## Status

Accepted

## Context

Following user feedback and product review of the Smart Buy-List & Unit Price Tracker application, several ergonomics, organization, and customizability gaps were identified:

1. **Navigation Duplication**: Trip lifecycle modes (`Planning` vs `In-Store`) were duplicated across both the top trip summary card (`tabPlanning` / `tabInStore`) and the MD3 bottom navigation bar (`navPlanningBtn` / `navBuyModeBtn`), creating visual clutter and fragmented state indication.
2. **Hardcoded Store List**: Retail stores were hardcoded in a static set without persistence or CRUD operations (Add, Rename with ledger cascade, Delete).
3. **Add Item Header Clutter**: An extra "Compare Package Sizes" text button in the "Add Item to List" section header cluttered the quick creation form while duplicating comparator triggers already present on item cards and in the bottom navigation bar.
4. **Non-Functional Grouping**: The UI contained "By Aisle" and "By Store" buttons, but `renderItemList()` rendered a flat list regardless of `currentGrouping`.
5. **Lack of Fast Swipe Interactions**: In-aisle shopping requires rapid single-handed gestures to mark items as done or compare prices without precise button tapping.
6. **Fragmented Settings**: Preferences (currency, unit systems, data backups, reset, theme) lacked a centralized configuration hub.

## Decision

1. **Streamlined Single-Source-of-Truth Navigation**:
   - Remove redundant mode switch pills from the top trip summary card.
   - The **MD3 Bottom Navigation Bar** acts as the single source of truth for switching between `📝 Planning` (item entry, budget prep) and `🛒 Buy Mode` (in-aisle focus, large check targets, pacing metrics).
   - Remove the redundant `[⚖️ Compare Package Sizes]` text button from the "Add Item to List" section header.

2. **Custom Store Management (`memoryState.stores`)**:
   - Store list is stored in persistent state (`memoryState.stores`) with default preloaded stores: `["Costco", "Trader Joe's", "Target", "Whole Foods", "WinMart", "Bach Hoa Xanh", "Local Market"]`.
   - Provide a dedicated **Store Manager Dialog**:
     - **Add Store**: Create new store names.
     - **Rename Store**: Rename existing stores with automatic cascading updates to active list items (`item.store`) and purchase ledger records (`ledger.store`).
     - **Delete Store**: Remove unused stores with safe reassignment of active items.
   - Accessible via the new Option Hub (Settings) and via a _"⚙️ Manage Stores..."_ option in the Store filter dropdown.

3. **Active List Grouping (`By Aisle` & `By Store`)**:
   - When `currentGrouping === "AISLE"`:
     - Items are partitioned by department category following store walking order (`🥦 Produce & Fruits`, `🥛 Dairy & Eggs`, `🥩 Meat & Seafood`, `🍞 Bakery`, `🥫 Pantry & Grains`, `🧊 Frozen Foods`, `🥤 Beverages & Coffee`, `🧹 Household & Cleaning`, `🧴 Personal Care`, `📦 Other Items`).
     - Each department renders an aisle header with category emoji, translated title, and active item count badge.
   - When `currentGrouping === "STORE"`:
     - Items are partitioned by assigned store.
     - Each store renders a store header with store icon, name, item count, and computed store subtotal (`🏪 Costco (4 items • $24.50)`).
   - Completed/checked items remain collapsed in the dedicated bottom Checked section.

4. **Mobile Touch Swipe Gestures**:
   - Implement touch event listeners on list item cards:
     - **Swipe Right** ($\Delta x > 60\text{px}$): Reveals green background with `✓ Mark Done` / `Đã mua` indicator; on release toggles item checked state with tactile vibration feedback (`navigator.vibrate([15])`).
     - **Swipe Left** ($\Delta x < -60\text{px}$): Reveals indigo/emerald background with `⚖️ Compare` / `So sánh` indicator; on release opens the In-Aisle Package Comparator pre-populated with that item.
   - Spring-back CSS transitions handle drag cancellation gracefully. Desktop click buttons remain for full keyboard/mouse parity.

5. **Centralized Option Hub (Settings Modal)**:
   - Sticky top app bar includes a `⚙️` Settings button.
   - The Option Hub consolidates:
     - **Store Management**: Direct trigger to Store Manager.
     - **General Preferences**: Default currency, default unit system, default grouping (`By Aisle` vs `By Store`).
     - **Display & Pacing**: Item card density (`Comfortable` vs `Compact`), haptic feedback toggle.
     - **Data Management**: JSON Export, JSON Import with non-destructive merge/replace, Reset to Sample Data, Clear All Data.
     - **Cloud Sync Seam**: Google Drive / Cloud Sync status indicator.

6. **Ubiquitous Language & Bilingual Parity**:
   - Maintain 100% dictionary parity between English (`en`) and Vietnamese (`vi`) in `TRANSLATIONS` for all new settings, store management, grouping, and swipe strings.

## Consequences

- Streamlined UI with clear visual hierarchy and zero redundant controls.
- Fast, fluid in-aisle shopping workflow via swipe gestures and walking-route aisle grouping.
- Full customizability of retail stores and application preferences without losing offline-first PWA portability.
- 100% backward compatibility with existing URL state payloads and JSON backup schemas.
