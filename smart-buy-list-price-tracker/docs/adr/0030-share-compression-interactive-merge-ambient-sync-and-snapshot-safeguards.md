# ADR-0030: Share Payload Compression, Interactive Merge Protocol, Ambient Cloud Sync Indicator & Snapshot Safeguards

## Status

Accepted (v4.4.0)

## Context

Following a comprehensive Product Management review (Issue #303) across Data Management, Cloud Synchronization, and Buy-List Sharing, four core architectural seams and user experience friction points were identified:

1. **Share Payload Codec & URL Length Bloat**:
   - Sharing lists via URL hashes (`#share=<payload>`) currently encodes raw JSON tuples using deprecated JavaScript globals `escape()` / `unescape()` and uncompressed Base64.
   - For lists exceeding 15–20 items with UTF-8 Vietnamese strings, payload URLs exceed 2,048 characters, causing URLs to break in SMS and messaging apps.

2. **Crude Binary Merge Protocol in Shared List Import**:
   - When importing a shared list with `mode = "MERGE"`, incoming items matching existing item names are silently dropped.
   - If a family member or co-shopper updated prices, stores, or quantities, those updates are permanently lost without user notification.
   - Choosing "Import as New List" destructively replaces the active shopping list without saving an undoable snapshot or multi-list separation.

3. **Invisible In-Aisle Cloud Sync Status**:
   - The cloud sync status indicator pill is buried exclusively inside the Settings modal.
   - Shoppers in grocery store aisles have zero visibility into whether their additions, price checks, or trip completions have synchronized across devices or whether a network error occurred.

4. **Lack of Destructive Action Safeguards & Import Previews**:
   - Restoring a full database JSON backup replaces active items, settings, and purchase ledger records after a generic browser `confirm()` prompt.
   - Users cannot inspect the backup version, item count, or ledger transactions before committing, and cannot undo accidental overwrites.

---

## Decisions

### 1. Web Streams `CompressionStream('deflate')` Share Payload Codec

- Modernize `encodeSharePayload(list)` and `decodeSharePayload(encoded)`:
  - Utilize browser-native `CompressionStream('deflate')` and `DecompressionStream('deflate')` with fallback to `TextEncoder` / `TextDecoder`.
  - Replace deprecated `escape()` / `unescape()` with standard Uint8Array to URL-safe Base64 conversion (`+` ➔ `-`, `/` ➔ `_`, `=` stripped).
  - Prefix compressed streams (e.g. `cz:`) to maintain 100% backward compatibility with legacy uncompressed Base64 links.
  - Reduces URL payload size by 65–75%, comfortably fitting 50+ item shopping lists within standard URL length limits.

### 2. Interactive Smart Merge Protocol & Conflict Review Dialog

- Replace the binary modal with a dedicated `#mergeReviewModal`:
  - Parses incoming shared lists and matches against existing active items using `normalizeItemKey(name)`.
  - Displays interactive diff badges: `[🆕 Mới]` (New item), `[🔄 Giá mới]` (Price update), `[⚖️ Khác số lượng]` (Quantity diff), `[✅ Trùng khớp]` (Exact match).
  - Allows users to select resolution strategies per item:
    - **Quantity Strategy**: Choose between Keep Local ($Q_{\text{local}}$), Take Remote ($Q_{\text{remote}}$), or Sum Quantities ($Q_{\text{sum}} = Q_{\text{local}} + Q_{\text{remote}}$).
    - **Price Catalog Sync**: Automatically update catalog reference prices and store associations when shared prices are lower or more recent.
  - Allows saving current list to a temporary draft snapshot prior to importing as a new list.

### 3. Sticky Ambient Cloud Sync Indicator in App Header

- Add `#headerCloudSyncBadge` to the sticky top navigation header adjacent to the Settings button:
  - 🟢 **Synced**: All local mutations successfully synced to Google Drive or GitHub Gist.
  - 🔵 **Syncing** (Pulsing): In-flight network request active.
  - 🟡 **Offline / Pending**: Local mutations queued; awaiting network idle flush.
  - 🔴 **Sync Error**: Network failure, rate limit, or invalid token.
- Clicking the badge opens a lightweight diagnostic popover showing last sync timestamp, cloud provider name, and a 1-tap "Sync Now" trigger.

### 4. Automated Rolling Snapshots & Backup Preview Modal

- Upgrade `SmartBuyListDB` IndexedDB schema to maintain a dedicated `snapshots` object store:
  - Automatically records state snapshots before trip completions, full database backup restores, and list replacements (capped at 5 rolling snapshots).
  - Add a 1-tap "Undo Trip Completion" / "Restore Last Snapshot" action.
- Introduce `#backupPreviewModal` triggered upon file or clipboard JSON import:
  - Displays metadata: Export timestamp, application version, active list item count, ledger record count, store profiles.
  - Compares incoming vs. current database records side-by-side prior to final confirmation.

---

## Consequences

### Positive

- **Zero-Dependency Modernization**: Eliminates deprecated legacy APIs (`escape`/`unescape`) while remaining 100% zero-dependency single-file HTML.
- **65–75% URL Size Reduction**: Enables sharing large lists via URL hash without truncation warnings.
- **Elimination of Silent Data Loss**: Shoppers gain complete visibility and control over merged grocery items and updated prices.
- **High In-Aisle Confidence**: Ambient sync indicator gives glanceable confirmation that data is saved and synced.
- **Accidental Wipe Immunity**: Rolling snapshots prevent disastrous data loss from accidental restores or browser cache clears.

### Negative & Tradeoffs

- Minor async overhead introduced by `CompressionStream` and `DecompressionStream` promises during share link generation and hash decoding (handled gracefully with sub-millisecond resolution).
