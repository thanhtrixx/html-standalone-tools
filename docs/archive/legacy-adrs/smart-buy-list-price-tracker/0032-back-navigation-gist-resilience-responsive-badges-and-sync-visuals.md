# ADR-0032: Two-Tier PWA Back Exit Guard, Gist URL Resilience, Responsive Deal Badges, and Cloud Sync Status Polish

## Status

Accepted (v4.5.1)

## Context

Following user feedback and field reports from mobile and tablet shoppers using `smart-buy-list-price-tracker` (v4.5.0), several key issues and enhancements were identified:

1. **Accidental PWA Exit on Back Navigation**:
   - On Android and mobile browsers, pressing the system/hardware Back button on the initial `PLANNING` tab immediately exited the application, causing shoppers to lose their active navigation context. Shoppers expect standard native mobile ergonomics: pressing Back at the root tab warns with a toast ("Nhấn quay lại lần nữa để thoát" / "Press back again to exit") and only exits if pressed a second time within a 2000ms window.
2. **Cloud Sync Gist URL & Download Bugs**:
   - Shoppers pasting full GitHub Gist URLs (e.g. `https://gist.github.com/6b6ea1ec9fba7c2a610bbd38ff844193` or `https://gist.github.com/user/id`) experienced sync failures because the input expected a raw 32-hex ID, generating an invalid endpoint `https://api.github.com/gists/https://gist.github.com/...` (HTTP 404).
   - `forceDownloadCloud()` aborted prematurely when no GitHub Personal Access Token was provided, even though public Gists can be read anonymously without authentication.
   - Sample data loaded with static IDs (`id: 1`..`5`) collided with remote tombstone deletion records in `_deleted.ledger`, resulting in sample history disappearing when syncing or force-downloading from cloud.
3. **Inconsistent Deal Badge Layouts across Screen Densities**:
   - On mobile phones, screen space in item cards and comparator views is crowded by full deal badge text (`🟢 Great Deal` / `🟢 Giá Siêu Tốt`). Conversely, on tablets and wide screens ($\ge 640\text{px}$), ample horizontal space is available to display the full label.
   - In Buy Mode, deal badges were completely hidden on mobile phones (`hidden sm:flex`), depriving in-aisle shoppers of quick deal intelligence.
4. **Cloud Sync Status Visibility & Feedback**:
   - The ambient header badge and settings status pill lacked expressive cloud iconography and clear visual animation states to communicate in-flight sync progress, sync completion, and error states.
5. **Version Bump to 4.5.1**:
   - Update SemVer version parity across all companion assets (`manifest.webmanifest`, `sw.js`, `index.html`, and documentation).

---

## Decisions

### 1. Two-Tier Root Back Navigation with "Press Back Again to Exit" Guard

- Extend `handlePopState` in `src/ui/modals.js` and history initialization:
  - **Tier 1 (Modals)**: Dismiss topmost modal if `modalHistoryStack` is non-empty.
  - **Tier 2 (Tab History)**: If active tab is not `PLANNING`, return to `PLANNING` tab.
  - **Tier 3 (Root Exit Guard)**: When on the root `PLANNING` tab with no active modals:
    - Push an initial root history trap state (`{ root: true }`).
    - On the first popstate from root, display a localized toast:
      - Vietnamese: _"Nhấn quay lại lần nữa để thoát"_
      - English: _"Press back again to exit"_
    - Arm a 2000ms exit window timer (`backExitTimer`).
    - If a second back event occurs within 2000ms, allow browser exit / navigation to proceed.
    - If the 2000ms timer expires without a second press, re-arm the root trap state.

### 2. Gist URL Extraction, Anonymous Public Download & Dynamic Sample IDs

- **URL Extraction Seam**:
  - Introduce `extractGistId(input)` supporting both raw 32-hex IDs and full URLs (`https://gist.github.com/([a-f0-9]{32})` and `https://gist.github.com/[^/]+/([a-f0-9]{32})`).
- **Anonymous Public Gist Download**:
  - In `GitHubGistStorageProvider.readRemoteGist(gistId, token)`: omit `Authorization` header if `token` is absent, allowing frictionless read-only sync and force download from public Gists.
  - In `forceDownloadCloud()`: allow execution when `activeType === 'github'` as long as a valid Gist ID exists, even without a token.
- **Dynamic Sample Data IDs & Tombstone Isolation**:
  - In `src/ui/sample-data.js`: generate unique dynamic IDs for sample items and ledger entries on load, and unrecord/prune sample IDs from `_deleted` tombstones to ensure loaded sample data is never purged by historical cloud tombstones.
  - Guarantee `renderPriceLedgerTable()` is explicitly invoked after `reconcileMemoryState()` during cloud downloads.

### 3. Responsive Deal Badges Across Mobile and Tablet (`sm:` 640px Breakpoint)

- Unify deal badge rendering across Planning Mode cards, Buy Mode cards, Item Comparator, and Price History:
  - **Mobile (< 640px)**: Compact emoji icon only (`🟢`, `🟡`, `🔴`, `⚪`) with accessible `aria-label` and `title` tooltip.
  - **Tablet & Desktop ($\ge 640\text{px}$, `sm:inline`)**: Full badge displaying both emoji icon and localized text label (e.g. `🟢 Great Deal` / `🟢 Giá Siêu Tốt`).
  - **In Buy Mode**: Render the compact icon on mobile and full label on tablet/desktop, ensuring in-aisle shoppers always see deal scoring.

### 4. Expressive Cloud Sync Status & Animations

- Enhance `#headerCloudSyncBadge` and `#cloudSyncStatusPill` with dedicated cloud SVG icons and CSS animations:
  - **Syncing (`syncing`)**: Cloud icon with rotating sync arrows (`animate-spin` or pulse) and Amber/Sky styling.
  - **Synced (`synced`)**: Cloud icon with checkmark badge (Emerald/Green).
  - **Error (`error`)**: Cloud icon with warning alert (Red).
  - **Offline / Local (`offline`)**: Cloud with slash or offline indicator (Slate).

### 5. Single-Source Versioning (v4.5.1)

- Increment application version from `4.5.0` to `4.5.1` across `manifest.webmanifest`, `sw.js` (`CACHE_NAME = "smart-buy-list-v4.5.1"`), `#pwaVersionBadge` in `index.html`, and test harnesses.

---

## Consequences

### Positive

- **Native App Feel**: Zero accidental app exits when pressing Back on Android and mobile browsers.
- **Frictionless Sharing & Gist Sync**: Users can paste directly from the browser URL bar, and public Gists can be downloaded anonymously without requiring developer PATs.
- **Clean Responsive Information Architecture**: Mobile screens remain uncluttered with clean icons while tablets leverage wide screens for full contextual labels.
- **Transparent Sync Feedback**: Shoppers immediately see whether data is actively syncing, completed, or offline.

### Negative & Tradeoffs

- History trap requires managing an initial dummy history push on PWA startup.
- Anonymous Gist downloads are subject to GitHub API IP-based unauthenticated rate limits (60 requests/hour).
