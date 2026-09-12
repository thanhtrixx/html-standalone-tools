# ADR-0023: Harden parseSmartGroceryInput Parser, Store Aliases & Validation Guards

## Status

Accepted (v4.0.0 / Parser Hardening)

## Context

The natural language grocery input parser (`parseSmartGroceryInput`) serves as the primary data ingestion engine for the Smart Buy-List application. A detailed product owner review (#250) revealed six distinct parser failure modes:

1. **`@store` Tag Positioning Constraints**: `@store` tags were only recognized at trailing positions or via brittle substring matching, failing on leading (`@winmart Sữa 35k/l`) and inline (`Sữa @bhx 35k/l`) positions.
2. **Missing Store Aliases Support**: Users frequently use store abbreviations (`@bhx` for Bách Hoá Xanh, `@wm` for WinMart, `@cst` for Costco). Without an alias dictionary, custom tags fell back to unformatted raw strings.
3. **Thousands Grouping Separator Bug in Multiplier Shorthand**: Inputs with thousands grouping commas before multipliers (e.g. `1,234k`) were parsed as decimal numbers (`1.234 * 1000 = 1234`), resulting in a 1,000x under-calculation.
4. **Negative Price Corruption**: Negative prices (e.g. `-35k` or `-50000`) caused price parsing failure and corrupted the item name with leading minus characters.
5. **Trailing Numeric Token Leakage**: Unmatched trailing numbers (e.g. `Thức ăn 100k 10 cái 5`) leaked into product names after prices and quantities had already been extracted.
6. **Emoji / Special Character Noise**: Emojis in input strings (e.g. `Milk 🥛 35k/l`) were retained in item titles, creating inconsistency with the standard SVG/category emoji system.
7. **Category Classification Gaps**: Standalone beverage keywords (e.g. `Nước 20k/l`, `Nước ép`) were misclassified into "Other" due to regex precedence conflicts with household and pantry cleaners.

---

## Decisions

### 1. Robust Position-Agnostic `@store` Extraction & Store Alias Engine

- Extract `@store` tags using unicode word boundary matching: `(?:^|\s)@([a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9\.\-]+)`.
- Support leading, inline, and trailing tag positions, stripping the tag token cleanly with space normalization.
- Introduce `DEFAULT_STORE_ALIASES` mapping and persistent user-configurable `memoryState.storeAliases` with full Store Manager CRUD integration (`getStoreAliases`, `setStoreAliases`, `promptEditStoreAliases`).

### 2. Multiplier-Aware Thousands Grouping Resolution

- Differentiate thousands grouping (`1,234k` or `1.234k` where comma/period is followed by triplets) from decimal fractions (`1.5k` or `2.5tr`).
- Correctly evaluate `1,234k` to `1,234,000`.

### 3. Graceful Negative Price & Boundary Guards

- Handle `-?` prefix in fraction, multiplier, and standard price patterns without corrupting item name strings.
- Enforce `Math.max(0, price)` to prevent negative price states.
- Cap astronomical values or warn on extreme prices exceeding 1,000,000,000 VND ($100,000 USD).

### 4. Trailing Numeric Token & Emoji Sanitation

- Strip emojis from item names using standard Unicode `\p{Extended_Pictographic}/gu`.
- Drop trailing unmatched standalone numeric tokens when price or quantity have already been resolved.

### 5. Enriched Beverage & Compound Keyword Categorization

- Prioritize specific household (`nước rửa chén`, `nước giặt`) and pantry (`nước mắm`, `nước tương`) compound terms.
- Classify `\bnước\b`, `nước ngọt`, `nước suối`, `nước khoáng`, `nước ép`, `nước dừa`, `drink`, `soda` under `beverages`.

---

## Consequences

### Positive

- Universal support for natural grocery shorthand across all store tag positions and abbreviations.
- Accurate financial math for large grocery orders formatted with thousands separators.
- Clean, canonical item titles free of stray numbers, trailing minus signs, or noise emojis.

### Breaking Changes

- Slight shift in parser resolution semantics contributing to the v4.0.0 major release milestone.
