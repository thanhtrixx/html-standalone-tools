# ADR-0010: LZ-String URL Compression & Strategy Persona Presets

## Status

Accepted

## Context

Sharing rich simulation states (containing dozens of CSV account rows) via Base64 produced long, cumbersome URL hashes that often exceeded browser limits or were truncated by chat applications. Additionally, new users needed fast 1-click templates for common financial life stages.

## Decision

1. **Inlined Zero-Dependency LZ-String Compression**:
   - Integrated lightweight LZ-String encoder (`compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`).
   - Achieves 60-70% payload size reduction for URL sharing.
   - `loadFromURL()` features automatic backward compatibility: tries LZ-String decompression first, falling back to legacy Base64 decoding.

2. **Strategy Persona Presets Modal**:
   - Implemented 4 presets: Fresh Graduate (`fresh_grad`), Aggressive FIRE (`fire_aspirant`), Home Downpayment (`home_downpayment`), and Conservative Bank Ladder (`bank_ladder`).
   - 5-second Undo safeguard: snapshots state to `window._undoState` and presents an interactive toast with an "Undo" action button.

## Consequences

- Ultra-compact, shareable URL links.
- Instant, high-value onboarding for diverse user demographics.
