# ADR-0018: Enhanced Share Buy-List, Complete QR Code Purge, Symmetrical Settings File Interchange & In-Store Trip Bar Polish

## Status

Accepted (v3.9.0)

## Context

In version 3.8.0 and earlier, several user experience friction points and legacy dependencies existed across Buy Mode, error diagnostics, Settings, and List Sharing:

1. **In-Store Empty Buy-List Bottom Bar Anomaly**:
   - When users switched into In-Store (Buy) mode with 0 items, the sticky `#finishTripBar` ("Complete Trip") remained permanently visible at the bottom of the screen despite no items existing to purchase or finalize.
   - This created visual clutter and confusion when reviewing an empty list.

2. **GitHub Gist Cloud Sync Error Diagnostics Masking**:
   - When cloud synchronization via GitHub Gist encountered network, token, or permission errors, the toast displayed a literal template string or placeholder without interpolating the specific diagnostic reason from the HTTP response or exception (`res.error`).

3. **Legacy QR Scanner Overhead & External Image Service Dependency**:
   - In Settings and the Share modal, legacy QR functionality relied on camera permissions (`getUserMedia`, `BarcodeDetector`) and third-party external image generation APIs (`api.qrserver.com`).
   - The in-app camera scanner introduced unnecessary camera permission prompts, potential CSP/network failures, and UI complexity.
   - Settings data backup buttons had asymmetric labels ("Export JSON" vs "Import File").

4. **Limited Share Buy-List Modalities**:
   - The Share modal lacked direct export of human-readable shopping checklists suitable for pasting into messaging apps (WhatsApp, Telegram, SMS, Notes) and dedicated active buy-list `.json` file downloads.

## Decisions

### 1. In-Store Mode Empty List Polish

- Refactored `setTripPhase('IN_STORE')` and `renderKpis()`:
  - When in In-Store (Buy) mode and `memoryState.activeList.items.length === 0`, `#finishTripBar` is hidden.
  - When 1 or more items exist in the active list, `#finishTripBar` is displayed.
  - In Planning mode, `#finishTripBar` dynamically reveals when 1 or more checked items exist (`checkedCount > 0`).

### 2. Detailed Cloud Sync Error Diagnostics

- Updated `syncCloudNow()` in GitHub Gist and cloud sync flows:
  - Interpolates `{msg}` in `toast_github_sync_error` with `(res.error || "Unknown")` for both English and Vietnamese localization strings.
  - Guarantees clear, actionable troubleshooting messages (e.g., "Bad credentials", "Network timeout", "Rate limited").

### 3. Complete Purge of In-App QR Scanner & Symmetrical Settings 2x2 Grid

- Completely purged the camera scanner viewfinder modal (`#qrScannerModal`), camera streaming helpers (`startQrScannerStream`, `stopQrScannerStream`, `flipQrCamera`, `handleScannedQrResult`), and barcode detection code.
- Removed `#btnOpenQrScanner` from the Settings modal.
- Renamed "Export JSON" to "Export File" (`btn_export_json_backup: "Export File"` / `"Xuất Tệp"`), creating a clean, symmetrical 2x2 data management layout in Settings:
  - **Row 1**: `[ 💾 Export File | 📋 Copy JSON ]`
  - **Row 2**: `[ 📥 Import File | 📋 Paste JSON ]`
- Maintained 100% data fidelity for full database JSON backup export and import, as well as clipboard Copy/Paste JSON operations.

### 4. Enhanced Share Buy-List Modal

- Re-architected `#shareModal` into a lightweight, self-contained sharing hub with 4 focused actions:
  1. 📱 **Share via Apps** (`#btnNativeShare` / `invokeNativeShare()`): Uses Web Share API with title, checklist content, and web import URL. Fallback to copy link.
  2. 📋 **Copy Formatted Checklist** (`#btnCopyTextChecklist` / `copyBuyListTextChecklist()`): Copies human-readable Markdown/plain-text checklist with item names, quantities, units, store tags, estimated prices, total spend, and web import URL to clipboard.
  3. 🔗 **Copy Shareable Link** (`#btnCopyUrl` / `copyShareUrl()`): Copies `#share=<payload>` URL to clipboard.
  4. 📥 **Download Buy-List File (.json)** (`#btnExportBuyListFile` / `exportBuyListJsonFile()`): Downloads a standalone JSON file containing only the active shopping list.
- Removed `#shareQrContainer`, `#qrHintText`, and external calls to `api.qrserver.com`.

### 5. PWA Single-Source Versioning (v3.9.0) & 100% Bilingual Localization Parity

- Synchronized version `3.9.0` across:
  - `smart-buy-list-price-tracker/index.html`: `#pwaVersionBadge` set to `v3.9.0`.
  - `smart-buy-list-price-tracker/sw.js`: `CACHE_NAME = "smart-buy-list-v3.9.0"`.
  - `smart-buy-list-price-tracker/manifest.webmanifest`: `"version": "3.9.0"`.
- Maintained 100% bilingual dictionary symmetry across `TRANSLATIONS.en` and `TRANSLATIONS.vi` for all new buttons, headers, descriptions, and toasts.

## Consequences

- Zero external third-party image or API dependencies; 100% offline-first and private.
- Clean, ergonomic sharing across chat apps, text notes, shareable URLs, and standalone files.
- Consistent, symmetrical Settings layout for file and clipboard data interchange.
- Fully automated test suite validating all PWA and UI invariants.
