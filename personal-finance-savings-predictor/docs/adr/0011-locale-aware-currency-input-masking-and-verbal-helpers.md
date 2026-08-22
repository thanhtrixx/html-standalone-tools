# ADR-0011: Locale-Aware Currency Input Masking & Dynamic Verbal Helpers

## Status

Accepted

## Context

Users entering large currency sums in financial simulation inputs (Monthly Salary, Savings Goal, Auto Term Threshold, Emergency Buffer Reserve, CSV principal amounts) frequently experienced readability difficulty with long unformatted number strings (e.g., `200000000`). Furthermore, standard HTML5 `<input type="number">` does not support thousand separators, and naive formatting solutions cause jarring cursor jumps to the end of input fields when editing in the middle of a string.

## Decision

1. **Locale-Aware Currency Input Masking**:
   - Converted primary monetary inputs to `<input type="text" inputmode="numeric">`.
   - Implemented `formatNumberWithSeparators(val, lang)` and `parseFormattedNumber(val)`.
   - Thousand separator dynamically switches according to active locale: dot `.` for Vietnamese (`vi`) and comma `,` for English (`en`).
   - Built a cursor preservation mechanism in `applyCurrencyMask(input)` that tracks the digit count preceding the cursor and restores caret placement accurately post-formatting.

2. **Dynamic Spelled-Out Verbal Helpers**:
   - Attached real-time linguistic helper labels (`#helperSalary`, `#helperSavingsGoal`, etc.) below currency inputs.
   - Converts raw integer amounts into concise verbal terms (e.g. `25 Triệu VND` / `25 Million VND`, `1.5 Tỷ VND` / `1.5 Billion VND`).
   - Recomputes and updates dynamically on every user input event and language toggle.

3. **Sanitized State Pipeline**:
   - Ensured simulation computations (`runSimulation()`, `simulate()`), URL hash serializations (`shareSimulation()`), and storage persistence (`localStorage`) sanitize input values through `parseFormattedNumber()`.

## Consequences

- Vastly improved numerical readability and error prevention during large balance configuration.
- Cursor stability during mid-string insertions or deletions.
- Seamless bilingual localization parity across English and Vietnamese interfaces.
