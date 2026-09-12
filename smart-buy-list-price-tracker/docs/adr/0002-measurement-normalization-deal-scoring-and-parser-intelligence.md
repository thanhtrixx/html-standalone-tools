# ADR-0002: Measurement Normalization, Deal Scoring, and Parser Intelligence

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0002, 0010, 0013, 0023

---

## Context

Grocery shoppers encounter varying packaging units ($500\text{g}$, $1\text{kg}$, $330\text{ml}$, $1.5\text{L}$, bundles, cans) and disparate store prices, making direct comparison tedious. We require smart parsing, unit normalization, cross-store deal scoring, and historical price tracking.

---

## Decisions

### 1. Smart Grocery Input Omnibox Parser

- Parses natural language entries (e.g. `Sữa tươi Vinamilk 1L 32k WinMart`, `Thịt bò 500g 120000 Co.opmart`) into structured fields:
  - Item Name, Quantity, Unit, Price, Store, Category.
- Integrates Vietnamese store alias dictionaries (e.g., `bách hóa xanh` $\rightarrow$ `BHX`, `coop` $\rightarrow$ `Co.opmart`, `lotte` $\rightarrow$ `Lotte Mart`).

### 2. Multi-Unit Measurement Normalization

- Normalizes disparate packaging dimensions to standard base units:
  - Mass: $\text{g}, \text{kg}, \text{lạng}, \text{oz}, \text{lb} \rightarrow \text{kg}$
  - Volume: $\text{ml}, \text{l}, \text{fl oz} \rightarrow \text{L}$
  - Count: $\text{cái}, \text{gói}, \text{lon}, \text{chai}, \text{hộp}, \text{bó} \rightarrow \text{unit}$
- Calculates precise normalized unit prices (e.g., $\text{Price per kg}$, $\text{Price per L}$).

### 3. Deal Scoring & Best-Value Comparator

- Compares normalized unit prices across historical purchases and competing stores.
- Assigns smart badges:
  - 🟢 **Best Deal**: Lowest recorded unit price for the item.
  - 🟡 **Fair Deal**: Within $\le 10\%$ of historical median.
  - 🔴 **Overpriced**: $> 15\%$ above historical median or competing store prices.

### 4. Historical Price Ledger

- Records all completed purchases with store name, date, quantity, and unit price.
- Provides price trend visualization and quick prefill for future shopping trips.

---

## Consequences

- **Positive**: Instant item entry, automated price intelligence, actionable savings insights.
- **Trade-off**: Requires maintaining regex pattern tables and unit conversion matrices in the domain layer.
