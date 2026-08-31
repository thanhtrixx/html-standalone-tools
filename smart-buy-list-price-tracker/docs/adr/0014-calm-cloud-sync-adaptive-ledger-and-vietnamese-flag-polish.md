# ADR-0014: Calm Cloud Sync, Adaptive Historical Ledger & Startup Flag Parity

## Status

Accepted (v3.5.0)

## Context

Following real-world usage and comprehensive UI/UX review of `smart-buy-list-price-tracker`, four key ergonomic, architectural, and visual opportunities were identified:

1. **Startup Language Switcher Flag Parity**:
   While the language flag toggle dynamically displayed `🇻🇳` for Vietnamese and `🇺🇸` for English during runtime switching, `initApp()` was unconditionally executing a post-render text assignment (`langBtn.textContent = currentLanguage === "en" ? "VI" : "EN"`), overwriting the national flag emoji with literal "EN" text on startup.

2. **Top Bar Decluttering & Calm Adaptive Cloud Sync**:
   The header displayed an intrusive `#topBarSyncStatus` pill that mutated constantly and triggered aggressive 3-second debounced sync calls on every micro-keystroke. Users needed a calm, battery-friendly sync strategy that operates quietly in the background without stealing header real estate.

3. **Google Drive Cloud Sync UI/UX Guidance & Origin Copier**:
   Users setting up Google OAuth 2.0 Client IDs frequently encountered `400: origin_mismatch` due to mismatching authorized JavaScript origins in Google Cloud Console. The Option Hub lacked direct links to the setup guide and did not provide 1-click clipboard copying of `window.location.origin`.

4. **Historical Purchase Ledger Mobile Ergonomics**:
   On mobile screens ($< 640\text{px}$), the Historical Purchase Ledger was rendered as a horizontally crammed desktop table where action buttons and item names were tiny ($< 11\text{px}$) and difficult to tap accurately.

## Decisions

1. **Startup Flag Parity**:
   - Removed the obsolete `langBtn.textContent` override in `initApp()`.
   - Relied exclusively on `applyTranslations()` to render `currentLanguage === "vi" ? "🇻🇳" : "🇺🇸"`, preserving national flag emoji parity on application load.

2. **Calm Adaptive Cloud Sync**:
   - **Header Decluttering**: Decommissioned `#topBarSyncStatus` from the Top App Bar header. Sync status is now cleanly presented inside the Settings / Option Hub via `#cloudSyncStatusPill`.
   - **Relaxed Idle Debounce**: Extended the mutation debounce from 3 seconds to a calm 15 seconds (`15000ms`), capped at 45 seconds from the initial mutation.
   - **Event-Driven Lifecycle Sync**:
     - **Tab Backgrounding**: Registered `visibilitychange` listener when `document.visibilityState === "hidden"` to flush any pending mutations immediately before tab eviction or background sleep.
     - **Tab Wakeup / Inactivity Pull**: On `document.visibilityState === "visible"`, if backgrounded for $> 120\text{s}$, automatically pull remote cloud updates.
     - **Trip Finalization**: In `finishShoppingTrip()`, immediately push the completed purchase records and updated active list to the active cloud provider.
     - **App Startup**: If a cloud provider is already authenticated on boot, trigger an initial cloud pull.

3. **Google Drive Cloud Sync UI/UX Guidance & Origin Copier**:
   - Embedded a direct link (`docs/google-drive-cloud-sync-guide.md`) in the Google Drive configuration header.
   - Added an Authorized JavaScript Origin box displaying `window.location.origin` with a 1-click `copyCurrentOriginToClipboard()` button.
   - Implemented state-aware action buttons: dynamically renders full-width "Sign in with Google" when disconnected, vs. "Disconnect Drive" and "Sync Now" when authenticated.

4. **Adaptive Historical Purchase Ledger (Mobile Cards + Desktop Table)**:
   - Built a dual-representation layout for `#priceLedgerModal`:
     - **Mobile Viewport ($< 640\text{px}$)**: Renders `#ledgerMobileCards` featuring high-contrast cards, bold product titles, store pill badges, formatted date, prominent unit price badges, and full-height ($\ge 44\text{px}$) touch targets for Quick Add (`➕`) and Delete (`🗑️`).
     - **Desktop Viewport ($\ge 640\text{px}$)**: Renders `#ledgerTableContainer` with roomy `text-sm` typography, `h-5 w-5` checkboxes, and `p-3` table cells.
   - Both views share unified row selection, select-all toggle, and batch restocking actions.

5. **PWA Version Invalidation (v3.5.0)**:
   - Incremented Service Worker cache name to `smart-buy-list-v3.5.0`.
   - Incremented `manifest.webmanifest` and UI version badges to `v3.5.0`.

## Consequences

- **Positive**:
  - Consistent visual identity with flag emoji rendering reliably on startup.
  - Zero distraction in top app bar header; cloud synchronization is calm, reliable, and battery-efficient.
  - Effortless Google OAuth setup with instant origin copying and direct documentation access.
  - Touch-friendly and legible Historical Purchase Ledger on mobile devices.
- **Backwards Compatibility**:
  - Fully compatible with existing IndexedDB schemas, Google Drive AppData files, and GitHub Gist sync formats.
