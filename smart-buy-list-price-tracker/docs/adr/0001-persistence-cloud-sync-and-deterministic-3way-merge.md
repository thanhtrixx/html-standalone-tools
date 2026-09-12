# ADR-0001: Persistence, Cloud Sync, and Deterministic 3-Way Merge

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0001, 0009, 0011, 0012, 0014, 0016, 0018, 0019, 0020, 0021, 0025, 0030, 0032

---

## Context

A smart grocery tracker requires reliable local-first persistence, frictionless multi-device synchronization without dedicated backend servers, robust conflict resolution for concurrent shopping trips, and secure credential handling.

---

## Decisions

### 1. IndexedDB Storage Engine & Silent Migration

- Primary client-side database using IndexedDB (`smart_buy_list_db`) with `localStorage` fallback.
- **Silent Migration**: Schema changes auto-migrate transparently on application launch without user prompts or data loss.

### 2. GitHub Gist Cloud Sync Provider & PAT Security

- Uses GitHub Personal Access Tokens (Fine-Grained or Classic `gist` scope) stored securely in client-side IndexedDB (never in URLs or public storage).
- **Calm Sync & Rate-Limit Resilience**: Sync occurs ambiently with exponential backoff on HTTP 403 / 429 rate-limit responses and clear UI diagnostic badges.

### 3. Deterministic 3-Way Merge with Tombstones

- Synchronizes local state with cloud Gist state via a deterministic 3-way merge algorithm:
  - Tracks entity modification timestamps (`updatedAt`) and deletion tombstones (`deleted: true`).
  - Automatically merges non-conflicting item edits across devices.
  - When field-level conflicts occur on the same item, the most recent timestamp wins (`LWW`).
  - Pre-merge snapshot backup is saved locally to allow 1-click rollback.

### 4. URL Hash State Sharing

- Compact shareable links generated via LZ-String encoded URI components (`#share=...`) for instant 1-tap list sharing across family members without credentials.

---

## Consequences

- **Positive**: Zero backend hosting requirements, offline-first reliability, transparent multi-device syncing, zero data loss during concurrent edits.
- **Trade-off**: Requires users to configure a GitHub Gist token for automated background cloud sync.
