# 16. Unified Sync Kernel, Adaptive Cadence, Timer 5-Minute Batching, and Clipboard JSON Portability

Date: 2026-09-18
Status: Accepted

## Context & Problem Statement

Following the initial cloud synchronization and data portability design in ADR-0015, real-world usage and performance stress testing in the Atomic Habit & Routine Tracker revealed four critical operational deficiencies:

1. **Timer Persistence Flooding**: While focus timers run, sub-second ticks persist locally to IndexedDB every 10 seconds for crash resilience. However, because state mutation listeners unconditionally scheduled a 5-second debounced cloud sync, long focus sessions (e.g. 45-minute Pomodoro) sent network sync requests every 10–15 seconds to GitHub Gist / Google Drive. This quickly triggered API rate limits (HTTP 429/403 secondary limits), exhausted mobile battery, and wasted bandwidth.
2. **Redundant No-Op Cloud Uploads**: The previous sync mechanism pushed complete encrypted payloads whenever a mutation event fired, even if the resulting data payload had no substantive delta or had already been synchronized.
3. **Missing Idle Cadence & Increase Mechanism**: There was no adaptive backoff cadence during idle background tabs or on network/rate-limit errors.
4. **CSV Technical Debt & Clutter**: CSV export and universal matrix CSV parsing introduced ~450 lines of complex string splitting, quoting, and heuristic header mapping, while remaining inherently lossy (unable to represent vault encryption envelopes, custom settings, or timer intervals). Users lacked 1-click clipboard portability (`Copy JSON` / `Paste JSON`) for effortless cross-device and cross-app transfer.

## Decision Drivers

- **Zero API Saturation during Active Timers**: High-frequency local timer ticks must never flood remote cloud endpoints.
- **Change-Only Cloud Uploads (Dirty State Fingerprinting)**: Remote uploads must occur only when local or remote state hashes actually diverge.
- **Adaptive Idle Cadence & Exponential Backoff**: Background polling must scale from 1m to 15m when idle, and back off gracefully on HTTP 429/403/5xx errors.
- **Streamlined, Lossless Data Portability**: Replace bloated, lossy CSV import/export with instant 1-click Clipboard JSON copy/paste and validated JSON/encrypted file exchange.
- **Reusable Canonical Blueprint**: Architecture must serve as the canonical blueprint for standalone tools across the repository.

## Considered Options & Decision Outcome

### Decision 1: Dual-Speed Cadence with 5-Minute Timer Cloud Batching

- **Outcome**: Decouple local persistence from cloud synchronization:
  - **Local Persistence**: Timers continue to write to IndexedDB every 10 seconds and on `visibilitychange`/`pagehide` for local crash durability.
  - **Cloud Sync Throttling**: Continuous timer running state is held back from cloud sync until **5 minutes (300 seconds)** of accumulated focus time elapse.
  - **State Boundary Immediate Sync**: Immediate 5-second debounced cloud sync is triggered whenever a state boundary occurs (Timer Start, Pause, Reset, 100% Target Completed, or Screen Wake/App Init).
  - Regular habit interactions (checkbox toggle, counter steppers, adding/editing habits) continue using the responsive 5-second debounce.

### Decision 2: Change-Only Dirty State Hashing

- **Outcome**: The Unified Sync Kernel calculates a deterministic payload hash (SHA-256 / normalized checksum) of current state and caches the last synced remote hash.
- If `localHash === lastSyncedRemoteHash` and the dirty flag is false, outgoing cloud PUT/PATCH requests are skipped entirely, saving network bandwidth and battery.

### Decision 3: Adaptive Idle Remote Cadence & Exponential Error Backoff

- **Outcome**:
  - **Active Cadence (0–1m)**: Immediate 5s debounce on mutations.
  - **Adaptive Idle Remote Pull**: While the app sits open without local edits, remote state is pulled at an increasing interval:
    $$1\text{m} \longrightarrow 3\text{m} \longrightarrow 5\text{m} \longrightarrow 15\text{m (maximum cap)}$$
    Any user interaction, tab focus (`visibilitychange: visible`), or online reconnect immediately resets the idle cadence back to 1m.
  - **Exponential Error Backoff**: On network errors or HTTP 429/403/5xx rate limits, backoff exponentially ($5\text{s} \to 15\text{s} \to 30\text{s} \to 60\text{s} \to 5\text{m}$) and display an ambient non-blocking warning badge in Settings.

### Decision 4: 1-Click Clipboard JSON Portability & Full CSV Decommissioning

- **Outcome**:
  - **1-Click Copy JSON**: `[ 📋 Copy JSON to Clipboard ]` writes the backup payload to clipboard via `navigator.clipboard.writeText` with instant toast feedback. When clipboard permission is blocked or unsupported, automatically opens a fallback modal (`#clipboard-fallback-modal-overlay`) with pre-selected JSON text and full WCAG focus trapping.
  - **Interactive Paste & Inspect JSON**: `[ 📥 Paste JSON ]` opens an inspection modal (`#paste-json-modal-overlay`) with direct clipboard paste / textarea input, schema validation, diff statistics (new vs updated habits, log date spans), strategy selector (`[ 🔄 Merge & Combine ]` vs `[ ⚠️ Replace Database ]`), and automated pre-import safety rollback snapshot.
  - **Encrypted Import Passphrase Unlock Dialog**: When importing an encrypted backup (`atomic-habit-tracker-encrypted-backup`), presents a dedicated `#import-decrypt-modal-overlay` prompt. Decrypts client-side using `HabitCloud.decryptPayload` (AES-GCM-256 + PBKDF2) and seamlessly transitions into the inspection preview upon correct passphrase entry.
  - **Encrypted / Decrypted Export Choice Modal**: When vault encryption is active (`cloudSyncManager.encryptionEnabled === true`), clicking Copy or Export presents a lightweight choice modal (`#export-format-modal-overlay`): `[ 🔒 Encrypted Vault JSON ]` vs `[ 📄 Plaintext JSON ]`. When encryption is disabled, triggers immediate 1-click export.
  - **CSV Decommissioning**: Fully remove all CSV export/import buttons, `exportToCsv`, `downloadExportCSV`, and `parseHabitCsv` functions, shedding ~450 lines of dead code and eliminating schema divergence.

### Decision 5: Canonical Blueprint Architecture for Unified Sync

- **Outcome**: Structure the sync system inside `habit-tracker/src/sync/` as a modular, decoupled engine:
  - `src/sync/cloud-sync.js`: Generic Sync Kernel (connectors, dirty hashing, cadence scheduler, and crypto vault).
  - `src/sync/merge3.js`: Tool-specific 3-way merge implementation.
  - `src/sync/tombstones.js`: Entity deletion tracking.
  - `src/sync/export-import.js`: Streamlined JSON & Clipboard portability.

## Consequences

### Positive

- Zero cloud API flooding during active workout/focus timer sessions.
- Up to 90% reduction in unnecessary network transfers via dirty state hashing and adaptive idle cadence.
- 1-click effortless data portability via modern clipboard exchange across devices.
- Codebase distillation: removes ~450 lines of complex CSV parsing baggage.
- Clean architectural blueprint easily adoptable by other standalone tools in the repository.

### Negative

- Users who previously imported raw CSV files from spreadsheet tools must use JSON format or standard JSON migration tools.
