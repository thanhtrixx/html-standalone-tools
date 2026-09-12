# ADR-0015: Resilient URL State Sharing & Dual-Mode Decompression

## Status

Accepted

## Context

The "Share via URL" feature previously exhibited failure modes when links were shared across real-world communication channels:

1. **Percent-Encoded Character Corruption**: Messaging applications (Slack, Telegram, Microsoft Teams, WhatsApp, Zalo, Mail) and certain browser address bar interactions percent-encode special characters in URL hash strings (e.g. `+` -> `%2B`, `#` -> `%23`, `$` -> `%24`). When raw hash strings containing `%` were passed directly to `LZString.decompressFromEncodedURIComponent`, dictionary lookups failed and returned `null`, causing the shared simulation to silently fail and fall back to local storage defaults.
2. **`file://` Protocol Base URL Breakage**: `window.location.origin` evaluates to `"null"` in standard desktop browsers running standalone HTML files from the local filesystem (`file:///...`), producing corrupted URLs (`null/path/to/index.html#...`).
3. **Incomplete Analytical State Serialization**: URL payloads previously omitted Scenario B comparison workbench parameters, Real vs. Nominal Purchasing Power toggles (`showRealValues`), language selection (`currentLang`), and active analytics hub tabs (`heatmap`, `yoy`, `flow`, `timeline`).
4. **Lack of Dynamic In-Page Hash Reactivity**: Navigating browser history or pasting a new hash into an already open page did not trigger `loadFromURL()` without a full page refresh.
5. **Insecure / Local Context Clipboard Failures**: `navigator.clipboard.writeText` threw synchronous exceptions in non-HTTPS environments (local IP/LAN, embedded webviews).

## Decision

1. **Dual-Mode Candidate Decompression in `loadFromURL()`**:
   - Sanitizes hash candidates by testing both `decodeURIComponent(hash)` and raw `hash`.
   - Explicitly strips leading `#` markers from each candidate before decompression.
   - Preserves automatic backward compatibility with legacy Base64 decoding.
   - Clears accounts properly when loading empty portfolio payloads (`Array.isArray(payload.csv)`).

2. **Robust Base URL Construction in `shareSimulation()`**:
   - Builds share links via `window.location.href.split('#')[0] + '#' + payload`, ensuring 100% path integrity across `http://`, `https://`, and `file:///` protocols without dropping query parameters.

3. **Comprehensive Analytical State Serialization (`payload.ui`)**:
   - Serializes complete workspace state: baseline parameters (`p`), custom portfolio CSV rows (`csv`), and UI configuration (`ui`):
     - `ui.real`: Real vs Nominal purchasing power toggle state.
     - `ui.lang`: Language preference (`en` / `vi`).
     - `ui.tab`: Active analytics hub tab (`timeline`, `flow`, `heatmap`, `yoy`).
     - `ui.cat`: Portfolio accounts filter category.
     - `ui.metric`: Calendar heatmap metric mode (`wealth` / `inflow`).
     - `ui.chartRange`: Growth chart date range filter.
     - `ui.comparisonActive` & `ui.compParams`: Scenario B comparison state and parameters.

4. **Reactive In-Page Hash Navigation**:
   - Added `window.addEventListener('hashchange', ...)` to reload state and re-execute calculations dynamically upon history navigation or URL hash changes.

5. **Cross-Context Resilient Clipboard Helper (`copyTextToClipboard()`)**:
   - Safely checks for asynchronous `navigator.clipboard.writeText` support with automatic fallback to `document.execCommand('copy')` via a temporary textarea and browser `prompt()`.

## Consequences

- Shared links open reliably when pasted into chat applications, emails, or different browsers regardless of URL percent-encoding.
- Standalone offline execution via `file://` protocol copies valid share links.
- Recipient view matches the exact analytical and comparative workbench state configured by the sender.
- Hot-reloading of shared URLs in open tabs without requiring full browser reload.
