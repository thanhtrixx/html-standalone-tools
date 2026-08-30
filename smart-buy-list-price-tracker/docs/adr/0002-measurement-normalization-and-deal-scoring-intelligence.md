# ADR-0002: Measurement Normalization & Deal Scoring Intelligence

## Status

Accepted

## Context

Grocery items are packaged and sold in widely varying units, packaging sizes, and multi-packs (e.g. 450g vs 1.2kg, 750ml vs 1.5L, 6-pack vs 12-pack). Shoppers cannot easily determine which package offers genuine economic value without tedious manual math while standing in store aisles.

Additionally, understanding whether a current shelf price represents an authentic bargain, a standard market rate, or an inflationary spike requires comparing normalized unit prices against historical purchase records across multiple stores.

## Decision

1. **Standardized Base Dimension Normalization Engine**:
   - Classify all units into three standard physical dimensions:
     - **Mass / Weight**: Base unit is **Kilogram (`kg`)**; conversion factors: `1 g = 0.001 kg`, `1 oz = 0.0283495 kg`, `1 lb = 0.453592 kg`.
     - **Volume / Liquid**: Base unit is **Litre (`l`)**; conversion factors: `1 ml = 0.001 l`, `1 fl oz = 0.0295735 l`, `1 gal = 3.78541 l`.
     - **Count / Discrete**: Base unit is **Piece / Unit (`ea`)**; conversion factors: `1 unit / piece / fruit / quả = 1 ea`, `1 pk / box / pack (N units) = N ea`.
   - Calculate Normalized Unit Price: $P_{\text{unit}} = \frac{P}{\text{Base Quantity}}$.
2. **Multi-Store Deal Scoring & Indicator Badges**:
   - Compare the candidate unit price against the item's historical ledger:
     - 🟢 **Great Deal**: $P_{\text{unit}} \le P_{\text{min}}$ (All-Time Low) OR $P_{\text{unit}} \le 0.90 \times P_{\text{avg}}$.
     - 🟡 **Fair Price**: $0.90 \times P_{\text{avg}} < P_{\text{unit}} \le 1.05 \times P_{\text{avg}}$.
     - 🔴 **Price Spike**: $P_{\text{unit}} > 1.05 \times P_{\text{last}}$ OR $P_{\text{unit}} > 1.10 \times P_{\text{avg}}$.
3. **In-Aisle Side-by-Side Package Comparator**:
   - Provide a mobile-first dual package input modal (Price + Quantity + Unit for Package A & B) that computes live normalized unit prices, highlights the cheaper option with exact percentage savings, and allows 1-tap application to the active list item.

## Consequences

- Instant clarity for shoppers evaluating different brand packaging sizes in store aisles.
- Automatic historical baseline learning: the more the user shops, the smarter and more accurate the deal ratings become.
- Clean mathematical decoupling between raw user input units and normalized database records.
