# ADR-0002: State Serialization, URL Compression, and AI Dossier Engine

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0010, 0015, 0017

---

## Context

Users need to share simulation scenarios via URL hash links without server-side storage, load pre-configured strategy presets, and export structured AI advisor dossiers for external LLM financial consultations while protecting privacy.

---

## Decisions

### 1. Resilient URL Hash State Compression

- **LZ-String Compression**: State configuration is serialized to JSON, compressed using LZ-String `compressToEncodedURIComponent()`, and stored in the URL hash (`#data=...`).
- **Dual-Mode Decompression Fallback**: Decoder attempts LZ-String decompression first; if invalid or corrupted, it falls back to Base64/URI decoding.
- **Hashchange Reactivity**: Listens to browser `hashchange` events to dynamically update state on backward/forward navigation without full page reloads.

### 2. Strategy Persona Presets

- Provides 1-click strategy presets (e.g., "Fresh Graduate Starter", "Aggressive FIRE Saver", "Home Down Payment Plan", "Conservative Bank Ladder").
- Includes a 5-second reversible "Undo" notification banner to safeguard existing user setups against accidental overwrite.

### 3. Client-Side AI Financial Health Dossier Engine

- Generates comprehensive client-side Markdown reports containing:
  - Executive Overview and Core Financial Profile
  - Liquidity vs. Fixed Investment Ratios
  - Risk Analysis (Emergency Buffer adequacy, Deficit alerts)
  - 5 Prompt Blueprints tailored for Claude/ChatGPT/Gemini financial advisors.
- **Zero-Leak Privacy Masking**: Optional toggle to mask absolute currency amounts into relative salary multiples (e.g., $3.5\times$ monthly income) and percentage shares, preventing accidental disclosure of private financial data.
- Supports 1-click clipboard copy and `.md` file download.

---

## Consequences

- **Positive**: Zero backend infrastructure required for rich scenario sharing and AI prompting; robust URL link portability.
- **Trade-off**: Very large scenario files with dozens of custom cash flows produce longer URL hash strings, mitigated by LZ-String compression.
