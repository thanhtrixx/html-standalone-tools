# ADR-0001: IndexedDB Storage Engine & Google Drive Sync Seam

## Status

Accepted

## Context

The Smart Buy-List & Unit Price Tracker requires persistent client-side storage for active shopping lists, a master item catalog, and an append-only purchase ledger with multi-store price history spanning months or years.

Standard browser `localStorage` has a synchronous API and a strict ~5MB quota limit across origins, which can cause UI thread stutter during heavy JSON serialization and premature quota exhaustion when historical ledgers grow. Furthermore, users require cross-device backup and future cloud sync (via Google Drive AppData / Google Sheets) without introducing a proprietary or costly server backend.

## Decision

1. **Primary Persistence via IndexedDB**:
   - Store all items, lists, store profiles, and historical purchase records in an asynchronous `IndexedDB` database (`SmartBuyListDB`, Version 1).
   - Use dedicated object stores: `lists`, `catalog_items`, `stores`, `purchase_ledger`, and `settings`.
   - Provide an automatic in-memory / `localStorage` fallback for legacy or restricted WebViews.
2. **Schema Versioning & Migration Pipeline**:
   - Implement an explicit migration runner executing incremental migrations (`v1` ➔ `v2`) to ensure zero data loss during schema evolution.
3. **Decoupled Storage Provider Interface (`IStorageProvider`)**:
   - Abstract all storage calls behind a unified interface (`getItem`, `saveList`, `logPurchase`, `exportBackup`, `importBackup`, `sync`).
   - Implement `IndexedDBStorageProvider` as the default local offline engine.
   - Establish a prepared seam for `GoogleDriveStorageProvider` (client-side Google OAuth 2.0 + Drive AppData REST API) to enable user-owned cloud synchronization without modifying core application domain logic.

## Consequences

- Virtually unlimited local storage capacity for years of shopping history and price trends.
- Fully asynchronous non-blocking UI operations on mobile devices.
- Seamless future pluggability for Google Drive / Sheets cloud sync without breaking local offline-first capabilities.
