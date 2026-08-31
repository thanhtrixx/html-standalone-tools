# ADR-0016: Deterministic 3-Way Cloud Merge, Deletion Tombstones & Mutation Concurrency

## Status

Accepted (v3.7.0)

## Context

During comprehensive QA review and edge-case testing of the multi-provider cloud synchronization architecture (Google Drive & GitHub Gist), several critical concurrency and state reconciliation vulnerabilities were uncovered:

1. **Zombie Item, Ledger & Store Resurrections**:
   - Deletions were performed locally by removing elements from in-memory arrays (`activeList.items`, `purchaseLedger`, `stores`).
   - When merging with a remote cloud payload containing stale items deleted on the local device (or vice versa), the union merge algorithm had no historical knowledge of deletions and treated missing elements as newly added items from the remote peer, permanently resurrecting them.
2. **In-Flight Mutation Race Conditions**:
   - Cloud synchronization operations (`sync()`) are asynchronous and take several seconds over high-latency cellular connections (e.g., in a grocery store aisle).
   - In previous versions, local state was captured before network dispatch and unconditionally overwritten via `Object.assign(memoryState, merged)` upon network completion. Any rapid user interactions occurring during the network flight window (such as ticking off an item or adjusting a quantity) were completely erased.
3. **Trip Completion Non-Determinism & Ledger Collisions**:
   - `finalizeTripCompletion()` created ledger entries using timestamp-based collision-prone IDs (`Date.now() + index`), risking identical primary keys across simultaneous sync peers.
   - Checked items moved to the ledger were removed from the active list without deletion markers, causing remote peers to resurrect them onto the active list upon subsequent sync.
   - Dual uncoordinated sync triggers were dispatched simultaneously (`saveToLocalStorage()` triggering debounced sync while `flushPendingCloudSync()` triggered immediate sync), causing race conditions on network provider sockets.
4. **Store Deletion Desynchronization**:
   - Renaming or deleting stores only modified the active string array, causing deleted stores to resurrect whenever a remote payload still referenced them.

## Decisions

### 1. Deletion Tombstone Infrastructure & 30-Day TTL Pruning

- Introduced a dedicated `_deleted` dictionary within state and cloud payloads:
  ```json
  "_deleted": {
    "items": { "<itemId>": "<iso8601Timestamp>" },
    "ledger": { "<ledgerId>": "<iso8601Timestamp>" },
    "stores": { "<storeName>": "<iso8601Timestamp>" }
  }
  ```
- Any deletion event (`deleteItem`, `deleteLedgerItem`, `deleteSelectedLedgerItems`, `deleteStore`, and `finalizeTripCompletion` item archiving) records an ISO-8601 UTC timestamp in `_deleted`.
- Implemented `pruneDeletedTombstones(deletedDict, nowMs)` with a 30-day TTL (`TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000`) executed on database initialization, ensuring unbounded tombstone growth does not bloat storage or payload sizes.

### 2. Centralized Mutation Touch Invariant (`touchItem`)

- Centralized all item updates through `touchItem(item)`:
  - Initializes `item.createdAt` if absent.
  - Updates `item.updatedAt = new Date().toISOString()`.
  - Automatically purges `item.id` from `_deleted.items` if an item is explicitly re-created or resurrected by the user.
- Updated all item mutator entry points (`handleAddItemSubmit`, `toggleItemCheck`, `quickUpdateItemPrice`, `processBatchQuickInput`, `importMerge`, `reorder`, `applyWinnerToActiveItem`, `processLedgerEntryIntoBuyList`) to guarantee strictly monotonic timestamps.

### 3. Deterministic 3-Way Differential Merge Engine ($\text{Merge3}$)

- Implemented a 3-way differential merge algorithm:
  $$\text{FinalState} = \text{Merge3}(S_0, S_{\text{live}}, R) = \text{Merge}(\text{Merge}(S_0, R), S_{\text{live}})$$
  - $S_0$: Base snapshot taken immediately prior to initiating the async network fetch.
  - $R$: Remote state retrieved from Google Drive or GitHub Gist.
  - $S_{\text{live}}$: Live in-memory state reflecting user interactions performed while the network request was in-flight.
- The underlying `mergeCloudState(local, remote)` handles:
  - **Tombstones**: Merged via `max(localTimestamp, remoteTimestamp)`. Items, ledger records, and stores with an update timestamp older than or equal to their tombstone timestamp are pruned.
  - **Active Items**: Merged via Last-Write-Wins (LWW) per item ID.
  - **Purchase Ledger**: Merged via deduplication on string primary keys (`rec_<timestamp>_<nano>`).
  - **Stores**: Merged via union excluding any tombstoned store names.
  - **Schema & Versioning**: Migrates schema versions monotonically.

### 4. Active Sync Mutex & Trailing Sync Pass Queueing

- Equipped `StorageProvider` implementations (`GoogleDriveStorageProvider` and `GitHubGistStorageProvider`) with:
  - `this.isSyncing`: Boolean mutex preventing re-entrant parallel network dispatches.
  - `this.needsTrailingSync`: Boolean flag set when `sync()` is triggered while `isSyncing === true`.
- When an active sync resolves in `finally`, if `needsTrailingSync` is true, a delayed follow-up sync pass is automatically queued to upload mutations accumulated during the initial sync window.

### 5. Atomic Trip Finalization

- Refactored `finalizeTripCompletion()`:
  - Generates globally unique, collision-proof deterministic string IDs: `rec_<timestamp>_<index>_<nano>`.
  - Records tombstones for all completed items in `_deleted.items`.
  - Preserves rollover items with refreshed timestamps (`touchItem`).
  - Consolidates persistence into a single atomic `saveToLocalStorage()` and single flushed sync pass.

### 6. Atomic Memory State Reconciliation (`reconcileMemoryState`)

- Replaced destructive `Object.assign(memoryState, merged)` with atomic state reconciliation:
  - Selectively replaces internal collections (`activeList`, `purchaseLedger`, `stores`, `_deleted`).
  - Persists directly to `localStorage` and triggers calm UI re-rendering without resetting focused inputs or active modal states.

## Consequences

### Positive

- **Zero Zombie Resurrections**: Deleted items, ledger entries, and stores remain deleted across all synced devices, even across long offline periods.
- **In-Flight Data Safety**: Users can check off items and edit prices in real-time in grocery store aisles while background sync operations take place without fear of edits being lost.
- **Zero Network Socket Collisions**: Concurrent sync triggers cleanly coalesce into a primary sync pass followed by a trailing catch-up pass.
- **Auditable & Deterministic State History**: Unique string IDs prevent duplicate historical records.

### Tradeoffs & Mitigations

- **Payload Size**: Storing `_deleted` maps introduces minor JSON overhead (~40 bytes per deleted item). _Mitigation_: 30-day TTL auto-pruning bounds tombstone storage indefinitely.
