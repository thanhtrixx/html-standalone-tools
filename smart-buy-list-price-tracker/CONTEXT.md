# Smart Buy-List & Unit Price Tracker

A standalone, mobile-first Progressive Web Application (PWA) designed for grocery and household shopping list management, multi-store purchase ledger tracking, real-time package unit price normalization, and in-aisle deal intelligence.

For Vietnamese domain vocabulary, copywriting standards, and the bilingual terminology guide, refer to [I18N.md](./I18N.md).

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. Catalog, Items & Packaging

**Master Item**:
A canonical grocery or household product definition stored in the persistent item catalog (e.g. _Whole Milk_, _Jasmine Rice_, _Extra Virgin Olive Oil_, _Free-Range Eggs_). Contains default categorization, preferred measurement unit, and links to historical purchase records.
_Avoid_: Product entry, inventory record, stock item, grocery SKU.

**List Item (Active Item)**:
An instance of a product currently on an active shopping list with target quantity, assigned store, target aisle, estimated price, purchase state (pending or checked), and optional custom package size notes.
_Avoid_: Cart item, task, todo entry, buy line.

**Package Size**:
The physical quantity contained in a single packaged product unit (e.g. `450g`, `1.2kg`, `750ml`, `1.5L`, `12 eggs`, `6 cans`).
_Avoid_: Net weight, container volume, pack size, portion.

**Measurement Dimension & Base Unit**:
The standardized physical dimension used to normalize prices for direct mathematical comparison:

- **Mass / Weight**: Base unit is **Kilogram (`kg`)**; sub-units include Gram (`g`), Ounce (`oz`), Pound (`lb`).
- **Volume / Liquid**: Base unit is **Litre (`l`)**; sub-units include Millilitre (`ml`), Fluid Ounce (`fl oz`), Gallon (`gal`).
- **Count / Discrete**: Base unit is **Piece / Unit (`ea` / `unit`)**; sub-units include Pack (`pk`), Box (`box`), Bottle (`btl`), Can (`can`), Bundle / Bunch (`bunch`).
  _Avoid_: Measurement type, size category, quantity metric.

---

### 2. Pricing, Normalization & Deal Intelligence

**Nominal Package Price ($P$)**:
The sticker shelf price paid for an entire package or unit.
_Avoid_: Sticker price, total price, raw cost.

**Normalized Unit Price ($P_{\text{unit}}$)**:
The mathematically calculated price per standardized base unit ($/kg, $/L, $/ea, ₫/kg, ₫/L, ₫/cái) calculated as:
$$P_{\text{unit}} = \frac{P}{\text{Normalized Base Quantity}}$$
_Avoid_: Unit cost, per-gram price, rate, unit rate.

**Historical Purchase Ledger**:
An append-only chronological log of verified purchases recording `item_id`, `store_id`, `date`, `package_price`, `package_size`, `unit_price`, and `notes`.
_Avoid_: Price history table, expense log, purchase history database.

**All-Time Low (Best Price Ever)**:
The minimum normalized unit price ($P_{\text{min}}$) recorded across all historical purchases and stores for a specific master item.
_Avoid_: Record low, lowest price, baseline price.

**Last Purchased Price**:
The normalized unit price paid on the most recent completed shopping trip for an item, including the store where it was bought and the date.
_Avoid_: Recent price, previous cost, prior price.

**Deal Rating / Price Indicator**:
A real-time visual assessment of a product's current shelf price compared against its historical records:

- 🟢 **Great Deal**: Current unit price is $\le$ All-Time Low or $\ge 10\%$ below historical average.
- 🟡 **Fair / Market Price**: Current unit price is within $\pm 5\%$ of historical average.
- 🔴 **Price Spike / Inflated**: Current unit price is $\ge 10\%$ higher than last paid price or historical average.
  _Avoid_: Bargain score, discount level, sale badge.

**In-Aisle Package Comparator**:
A dedicated rapid-entry modal enabling shoppers to compare 2 or more package configurations side-by-side (e.g. _Brand A: 450g @ $3.20_ vs _Brand B: 1.2kg @ $7.80_) with real-time percentage savings calculations and 1-tap list updating. Can be invoked globally as a scratchpad or pre-populated directly from any active list item (Package A pre-filled).
_Avoid_: Price calculator, aisle widget, package comparison tool.

---

### 3. Stores, Aisles & Organization

**Store Profile**:
A physical or online retail venue (e.g. _Costco, Trader Joe's, Local Wet Market, WinMart, Bach Hoa Xanh_) with customizable default currency, location tags, and associated price records.
_Avoid_: Merchant, shop, vendor, supermarket.

**Department / Aisle Category**:
A navigational grouping representing physical store departments (e.g. _Produce / Vegetables_, _Dairy & Eggs_, _Meat & Seafood_, _Bakery_, _Pantry & Grains_, _Frozen_, _Beverages_, _Household & Cleaning_, _Personal Care_).
_Avoid_: Item tag, section, aisle name, product group.

**Store Route Optimization Order**:
An ordered walking sequence of aisle categories allowing shoppers to traverse supermarkets efficiently without doubling back.
_Avoid_: Aisle sorter, path optimizer, walking layout.

---

### 4. Shopping Trip Lifecycle

**Shopping Trip**:
A structured shopping session transitioning through three explicit lifecycle stages:

1. **Planning Mode**: Adding items via Material 3 Floating Action Button (FAB), adjusting quantities, assigning target stores/aisles, estimating trip spend.
2. **In-Store Buy Mode**: Focused in-aisle shopping mode with large thumb-friendly checkboxes, live running total, rapid inline price/quantity adjustments, and 1-tap package comparisons.
3. **Trip Summary & Completion Phase**: Prompting to log verified purchase prices into the historical ledger, calculate actual trip expenditure, and offer unpurchased item rollover or discard.
   _Avoid_: Shopping cart run, checkout session, shopping list run.

**Item Rollover**:
The process during Trip Completion where unchecked/unpurchased items are automatically transferred into a new draft list for the next shopping trip.
_Avoid_: Carryover, push to next, leftover migrate.

---

### 5. Sharing, Backup & Data Portability

**URL State Payload**:
A compressed, URL-safe Base64 string (using LZ-String compression) encoding the active buy-list state for instant, serverless peer-to-peer sharing via deep links, dynamic QR codes, and `navigator.share()`. Located in the Top App Bar.
_Avoid_: Share query, URL data, hash link.

**Smart Merge Protocol**:
The recipient client protocol that parses an incoming shared URL payload or JSON backup and offers 3 non-destructive options:

1. _Import as New List_ (isolated new list).
2. _Merge into Active List_ (append unique items, deduplicate by item name).
3. _Sync Price Catalog_ (optionally adopt historical store prices).
   _Avoid_: Overwrite import, blind merge, data replace.

**Storage Provider Seam**:
An abstracted TypeScript/JavaScript client-side storage interface (`IStorageProvider`) decoupling domain data operations from physical storage implementations (`IndexedDBStorageProvider` for offline-first local persistence, and `GoogleDriveStorageProvider` for user-owned cloud synchronization).
_Avoid_: Database driver, storage hook, backend adapter.

---

### 6. PWA & Mobile Ergonomics

**Standalone PWA Shell**:
An installable Web Application utilizing Service Workers (`sw.js`) and Web App Manifest (`manifest.webmanifest`) providing instant Cache-First offline availability, home-screen installation on iOS and Android, and zero external runtime dependencies.
_Avoid_: Web app wrapper, mobile site, hybrid app.

**Material You (MD3) In-Aisle Navigation**:
A 4-destination bottom navigation bar (`Planning`, `Buy Mode`, `Price History`, `Comparator`) built with Material 3 surface containers, pill active indicators, and thumb-friendly touch targets ($\ge 48\text{px}$).
_Avoid_: Footer controls, bottom tabs, static menu.

**In-Store Shopping Progress Pacing**:
A visual progress bar and completion indicator in Buy Mode displaying real-time checked metrics (`X of Y items checked (Z%)`) and estimated remaining unpurchased spend.
_Avoid_: Cart counter, checklist meter.

**Aisle / Category Department Quick Filters**:
Horizontal scrollable category chips (`All`, `Produce`, `Dairy`, `Meat`, `Bakery`, `Pantry`, `Frozen`, `Beverages`, `Household`, `Personal Care`, `Other`) enabling shoppers to instantly isolate items located in the specific store aisle they are standing in.
_Avoid_: Tag filter, section tabs.

**MD3 Bottom Sheet Modal & Fast Adjustment Chips**:
Mobile-anchored bottom sheet dialogs with top drag indicators and 1-tap quick adjustment delta chips (`+0.25`, `+0.50`, `+1.00`, `-0.25`, `-0.50`, `-1.00`) for rapid shelf price edits without opening the soft keyboard.
_Avoid_: Popup window, custom drawer.
