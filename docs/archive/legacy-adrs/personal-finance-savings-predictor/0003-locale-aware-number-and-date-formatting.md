# ADR-0003: Locale-Aware Number and Date Formatting

## Status

Accepted

## Context

Users accessing the tool across Vietnamese (`vi`) and English (`en`) locales expect native numerical separators and date presentations. Using a single hardcoded US or Western formatting standard causes cognitive friction for Vietnamese users (e.g., misinterpreting dot vs comma separators), while unlocalized dates create ambiguity around day/month ordering.

## Decision

1. **Vietnamese Locale Formatting (`vi`)**:
   - Currency: Dot thousand separators, comma decimal separators, and `₫` suffix (e.g. `200.000.000 ₫`).
   - Dates: `DD/MM/YYYY` format.
2. **English Locale Formatting (`en`)**:
   - Currency: Comma thousand separators, dot decimal separators, and `VND` suffix (e.g. `200,000,000 VND`).
   - Dates: `YYYY-MM-DD` format.
3. **Dynamic Re-formatting**: Currency and date formatting update dynamically upon switching active language.

## Consequences

- High readability and cognitive alignment for bilingual users.
- Eliminates numerical ambiguity in large multi-digit transactions.
