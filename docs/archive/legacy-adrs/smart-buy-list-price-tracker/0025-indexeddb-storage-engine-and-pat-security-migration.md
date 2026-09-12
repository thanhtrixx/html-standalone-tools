# ADR-0025: IndexedDB Storage Engine & GitHub PAT Security Migration

## Status

Accepted (v4.0.0 / Storage Engine Wiring)

## Context

In early versions of Smart Buy-List, `IndexedDBStorageProvider` declared the object store schema (`lists`, `catalog`, `ledger`, `settings`) in `onupgradeneeded` but routed all runtime persistence calls through synchronous `localStorage` (`localStorage.setItem("smart_buy_list_state", ...)`). This led to several structural deficiencies identified in review (#250 / #253):

1. **LocalStorage Quota Limitation**: `localStorage` is restricted to ~5MB to 10MB across browsers. Multi-year grocery and purchase ledger histories risk throwing `QuotaExceededError`.
2. **Security of GitHub PAT Credential**: Storing personal access tokens (`github_sync_token`) in `localStorage` leaves credentials vulnerable to trivial retrieval by third-party scripts or extensions.
3. **Dead Code & Unused Schema**: IndexedDB was opened but remained completely empty during normal operations.

---

## Decisions

### 1. Active IndexedDB Persistence Engine

- Upgrade `DB_VERSION` from `1` to `2`.
- Maintain four dedicated object stores:
  - `lists` (keyPath: `id`): Stores active grocery lists.
  - `catalog` (keyPath: `id`): Stores catalog item master data.
  - `ledger` (keyPath: `id`, autoIncrement: true): Stores immutable purchase transaction ledger entries.
  - `settings` (keyPath: `key`): Key-value store for app settings, store profiles, store aliases, deletion tombstones, and GitHub sync tokens.

### 2. Silent Auto-Migration from `localStorage`

- During `IndexedDBStorageProvider.init()`:
  - Check for existing data in `localStorage.getItem("smart_buy_list_state")` and credentials in `localStorage.getItem("github_sync_token")`.
  - Atomically write state into IndexedDB object stores.
  - Upon successful transaction completion, remove `smart_buy_list_state`, `github_sync_token`, and `github_sync_gist_id` from `localStorage`.

### 3. Graceful Incognito & Storage Block Fallback

- If `window.indexedDB` is unavailable, throws an exception, or fails to open (e.g. private browsing storage lockouts):
  - Fall back seamlessly to `localStorage` without throwing errors or interrupting user workflows.

### 4. GitHub PAT Relocation

- Store GitHub Personal Access Token inside IndexedDB `settings` store under `{ key: "github_sync_token", value: token }`.
- Ensure `localStorage.getItem("github_sync_token")` returns `null` after cold start migration.

---

## Consequences

### Positive

- Expanded storage headroom capable of handling tens of thousands of ledger records and multiple lists without quota limits.
- Improved credential isolation: GitHub tokens are no longer plaintext entries in `localStorage`.
- Zero-downtime, invisible migration for existing users upgrading to v4.0.0.
