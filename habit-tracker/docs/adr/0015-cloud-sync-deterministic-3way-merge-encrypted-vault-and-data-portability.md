# 15. Cloud Sync, Deterministic 3-Way Merge, Encrypted Vault, and Comprehensive Data Portability

Date: 2026-09-17
Status: Accepted

## Context & Problem Statement

The Atomic Habit & Routine Tracker is designed as an offline-first PWA with private IndexedDB persistence. While the application previously featured foundational cryptographic primitives (`src/sync/cloud-backup.js`) and basic JSON/CSV export routines (`src/sync/export-import.js`), real-world usage and multi-device routines identified several critical architectural and UX limitations:

1. **Stubbed Cloud Connectivity**: Cloud backup buttons ("Google Drive Cloud Backup" and "GitHub Gist Cloud Backup") in `src/app.js` were informational stubs that merely displayed auth requirement toasts without functional API connectors or credential managers.
2. **Lack of Multi-Device Conflict Reconciliation**: There was no 3-way synchronization or merge engine. Using the app across a mobile phone and laptop risked clobbering habit completions, streaks, and focus timer logs.
3. **Missing Passphrase Encryption UI**: Although AES-GCM-256 PBKDF2 encryption routines existed in `cloud-backup.js`, users had no UI mechanism to encrypt exports, unlock encrypted cloud vaults, or securely manage passphrases without leaking keys into persistent storage.
4. **Blind Non-Interactive Import**: File imports immediately merged incoming JSON payloads without previewing affected habits/dates, offering a strategy choice (`Merge` vs `Replace`), or creating an automatic pre-import safety rollback point.
5. **Limited CSV Interoperability**: CSV export lacked rich metadata (streaks, adherence percentages, notes), and there was no universal CSV importer to migrate historical data from external trackers (such as Loop Habit Tracker, Everyday, or custom spreadsheets).
6. **No Local Safety Snapshots**: Users lacked an automated, local version history in the browser to recover from accidental deletions, faulty imports, or unwanted sync operations.

## Decision Drivers

- **Zero-Backend Cloud Synchronization**: Multi-device sync must function reliably without requiring custom backend servers or user tracking databases.
- **Battle-Tested Repository Alignment**: Cloud sync and merge architecture should mirror the proven, hardened standards established in `smart-buy-list-price-tracker` (GitHub Gist PAT + Google Drive AppData).
- **Deterministic Zero-Loss Merging**: Synchronization must be commutative and conflict-resilient, preserving daily logs across distinct dates/devices and using Last-Write-Wins (LWW) with tombstones for habit metadata and deletions.
- **Zero-Knowledge Privacy**: Users must have the option to encrypt all cloud sync payloads and export files using client-side WebCrypto AES-GCM-256 with PBKDF2 key derivation, holding encryption keys strictly in ephemeral session memory.
- **Safe, Transparent Portability**: Imports must provide full schema validation, diff previews, strategy selection (`Merge` vs `Replace`), and automated pre-import local safety snapshots.
- **Spreadsheet & Ecosystem Interoperability**: Provide rich UTF-8 BOM CSV exports and a flexible, auto-detecting CSV importer for external tracker migration.
- **Bilingual & Ergonomic Excellence**: 100% Vietnamese and English localization with WCAG AA compliance, Obsidian Glow design tokens, and smooth tactile feedback.

## Considered Options & Decision Outcome

### Decision 1: Dual-Provider Cloud Hub (GitHub Gist PAT & Google Drive AppData)

- **Outcome**: Implement a dual-provider cloud sync adapter in `src/sync/cloud-sync.js` supporting:
  - **GitHub Gist**: Connect via GitHub Personal Access Token (PAT with `gist` scope), creating/linking private secret gists, with secure client-side IndexedDB token storage.
  - **Google Drive**: Connect via Google Identity Services OAuth 2.0 Client ID saving to the user's isolated `appDataFolder`.
  - **Connection Diagnostics**: Live status indicators (`🟢 Connected`, `🟡 Syncing...`, `🔴 Connection Error`, `⚪ Offline`), relative sync timestamps, and 1-tap `[ 🔄 Sync Now ]` manual trigger with tactile rotation animation.

### Decision 2: Calm Debounced Sync Cadence & Exponential Backoff

- **Outcome**: Automatically trigger synchronization on app launch (`initApp`), device online event (`online`), and tab visibility restore (`visibilitychange: visible`).
- Local mutations (habit edits, completions, counter increments, timer flushes) trigger a **5-second debounced sync** to minimize API calls during rapid check-offs.
- Exponential backoff retry handling on HTTP 429/403 rate-limit responses with UI warning badges.

### Decision 3: Deterministic 3-Way Merge with Deletion Tombstones & Additive Log Union

- **Outcome**: Implement a robust 3-way merge engine in `src/sync/merge3.js`:
  - **Habits & Settings**: Merged using Last-Write-Wins based on entity `updatedAt` timestamps.
  - **Deletion Tombstones**: Deleted habits write `{ id, deleted: true, deletedAt: timestamp }` records so deletions propagate across devices instead of causing zombie restorations.
  - **Daily Habit Logs**: Merged additively across dates and habits without data loss. For collisions on the exact same habit and date, the maximum progress/latest timestamp is safely preserved.
  - **Pre-Merge Safety Snapshot**: A local snapshot is saved to IndexedDB before applying remote changes.

### Decision 4: Client-Side Zero-Knowledge Encryption & Ephemeral Key Cache

- **Outcome**: Support optional user-defined vault passphrase encryption (WebCrypto AES-GCM-256 with PBKDF2, 100,000 SHA-256 iterations, 16-byte salt, 12-byte IV) for cloud sync and JSON export.
- Derived `CryptoKey` instances are cached solely in browser memory during the active session. On cold boot or new devices, an unlock dialog prompts for the passphrase with immediate decryption verification.

### Decision 5: Interactive Import Inspection & Safe Restoration

- **Outcome**: Enhance `src/sync/export-import.js` and `src/app.js` with an interactive Import Preview Modal:
  - Parses `.json` or `.enc.json`, validates schema, checks encryption, and previews habit count, log count, date ranges, and settings.
  - Provides strategy selection: `[ 🔄 Merge & Combine (Safe Additive) ]` vs `[ ⚠️ Replace Entire Database (Clean Restore) ]`.
  - Automatically captures a **Pre-Import Safety Snapshot** in local history before applying changes.

### Decision 6: Full-Spectrum CSV Portability & Universal Importer

- **Outcome**:
  - **Export**: Generates UTF-8 BOM CSV including habit metadata, routine, schedule, target, logged values, completion status, notes, streaks, and adherence percentages.
  - **Universal CSV Importer**: Auto-detects headers from external applications (Loop Habit Tracker, Everyday, Habitify, standard spreadsheets) with an interactive preview before committing to database.

### Decision 7: Rolling Local Vault Snapshots (Last 5 Versions)

- **Outcome**: Maintain a rolling history of the last 5 automated snapshots in IndexedDB (`snapshots` store), captured before sync pull, import, or wipe.
- The Settings tab includes a "Local Snapshot History" drawer displaying timestamp, cause, item count, and a 1-tap `[ ↩️ Rollback ]` action.

## Consequences

### Positive

- Complete multi-device synchronization without backend infrastructure or subscription costs.
- Deterministic 3-way merge prevents accidental data loss across concurrent offline and online edits.
- End-to-end zero-knowledge encryption ensures user habit privacy even on third-party cloud storage.
- Safe, inspectable data imports with guaranteed 1-click rollback via pre-import snapshots.
- Seamless onboarding and migration from external habit tracking ecosystems via universal CSV import.
- Architectural consistency with repository-wide standards established in `smart-buy-list-price-tracker`.

### Negative

- Increases JavaScript bundle size slightly (~15-20KB unminified) for merge and cloud connector logic.
- Requires user to supply a GitHub PAT or Google Client ID for automated cloud sync.
