# ADR-0021: Unified Trip Completion Bar Visibility, Settings Data Management Button Standardization, GitHub Rate Limit Diagnostics & Cloud Sync Semantics

## Status

Accepted (v3.12.0)

## Context

Following the release of version 3.11.0, real-world usability analysis identified five areas for refinement across shopping trip lifecycle management, settings UI/UX consistency, cloud synchronization error feedback, user mental models, and version lifecycle:

1. **Inconsistent Trip Completion Component Visibility Across Modes**:
   - In `Planning Mode`, the floating `#finishTripBar` was dynamically revealed only when one or more items were checked (`checkedItems.length > 0`).
   - In contrast, in `Buy Mode`, `#finishTripBar` was displayed whenever the active list had items (`filtered.length > 0`), even when 0 items were checked (`checkedItems.length === 0`).
   - This created an inconsistent mental model where Buy Mode shoppers saw a "Complete Trip" call-to-action before actually checking off any items, leading to accidental submissions of empty trips.

2. **Asymmetrical Settings Data Management Buttons**:
   - In Option Hub Settings (`#settingsModal`), Section 3 ("Data Management & Backup") contained a clean 2x2 grid of structured action buttons for `Export File`, `Copy JSON`, `Import File`, and `Paste JSON`.
   - However, the bottom row containing `Load Sample Data` and `Clear All Data` remained plain unstyled text links (`<button class="text-xs text-emerald-400 font-semibold">` and `<button class="text-xs text-red-400 font-semibold">`), breaking visual hierarchy and touch target consistency.

3. **Silent Cloud Sync Overrides & Missing In-Panel Diagnostics**:
   - While `parseGitHubRateLimitError` formatted exact reset times and countdown minutes, `forceUploadCloud()` and `forceDownloadCloud()` lacked error handling branches and failed silently without toasts on rate limits or network rejections.
   - Inside Option Hub Settings, `#cloudSyncStatusPill` only displayed generic "Sync Error" ("Lỗi Đồng Bộ"), while `#cloudSyncLastTime` showed stale timestamp information, giving no explanation of why sync failed or when the GitHub API rate limit window would reset.

4. **Ambiguity Between Routine Sync and Disaster-Recovery Cloud Overrides**:
   - Shoppers were unclear on the functional difference between `Sync Now` and `Force Upload to Cloud`, leading to accidental clobbering or hesitation when syncing across multiple devices.
   - Comprehensive documentation and in-app descriptive tooltips/subtext were needed to clearly differentiate 3-way non-destructive merging from 1-way master pushes.

5. **PWA Version Lifecycle (v3.12.0)**:
   - Version increment required across web app manifests, service workers, UI version badges, and documentation suites.

---

## Decisions

### 1. Unified Trip Completion Bar Visibility & Modal Guarding

- **Single Truth Rule for `#finishTripBar`**:
  - In both `Planning Mode` and `Buy Mode`, `#finishTripBar` is revealed strictly when `checkedItems.length > 0`.
  - When `checkedItems.length === 0` (no items selected/checked), `#finishTripBar` is hidden (`classList.add("hidden")`).
- **`openTripCompleteModal()` Guard**:
  - If `openTripCompleteModal()` is invoked when 0 items are checked, it aborts execution and displays a localized warning toast:
    - Vietnamese: `Vui lòng chọn ít nhất 1 mặt hàng đã mua trước khi hoàn thành chuyến đi.`
    - English: `Please check at least 1 purchased item before completing your trip.`
- **Top KPI Progress Continuity**:
  - The top summary bar (`0 / N` items, running total `$0.00`) remains visible in Buy Mode to guide shoppers as they traverse aisles.

### 2. Symmetrical 2-Column Action Buttons for Data Management & Sample Data

- **Section 3 Layout Standard**:
  - Refactored `Load Sample Data` and `Clear All Data` into a full-width 2-column grid of styled action buttons matching the exact visual language of Cloud Sync action buttons:
    - `[ ✨ Tải Dữ Liệu Mẫu / Load Sample Data ]` (`bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 rounded-xl hover:bg-emerald-900/40`)
    - `[ 🗑️ Xoá Toàn Bộ Dữ Liệu / Clear All Data ]` (`bg-rose-950/40 text-rose-300 border border-rose-800/60 rounded-xl hover:bg-rose-900/40`)
- Standardized minimum touch targets ($\ge 44\text{px}$) with active touch scaling (`active:scale-95`).

### 3. Granular Error Handling & Settings Diagnostic Alert Banner

- **Comprehensive Overrides Toast Notifications**:
  - `forceUploadCloud()` and `forceDownloadCloud()` now catch errors and display localized failure toasts with interpolated details:
    - Vietnamese: `Tải lên đám mây thất bại: {msg}` / `Tải về từ đám mây thất bại: {msg}`
    - English: `Cloud upload failed: {msg}` / `Cloud download failed: {msg}`
- **Inline Diagnostic Error Alert in Settings**:
  - Added `#cloudSyncErrorBanner` beneath the provider cards in Option Hub Settings.
  - When `status === "error"`, displays a high-visibility warning box showing the specific error message (including GitHub rate limit reset time and minutes remaining).

### 4. Explicit Semantic Architecture: `Sync Now` vs `Force Upload to Cloud`

- **`Sync Now` (Two-Way Deterministic 3-Way Merge)**:
  - Non-destructive synchronization via `merge3Way(baseState, localState, remoteState)`.
  - Reconciles local items and remote cloud items by `updatedAt` timestamps, merges purchase ledgers by unique ID, applies 30-day deletion tombstones (`_deleted`), and writes the unified database back to the cloud.
  - Recommended for routine multi-device usage.
- **`Force Upload to Cloud` (One-Way Master Push / Override Cloud)**:
  - Master override that serializes current device state and forcefully overwrites the remote cloud file (`smart_buy_list_data.json`) without reading or merging remote changes.
  - Recommended only for disaster recovery or when resetting cloud state from the authoritative local device.
- **`Force Download from Cloud` (One-Way Master Pull / Override Local)**:
  - Master restore that downloads the remote cloud file and replaces the local device database completely.
- Added descriptive captions and tooltips in Option Hub Settings to communicate these operational characteristics clearly.

### 5. Single-Source PWA Version Bump (v3.12.0)

- Version bumped to `3.12.0` across `manifest.webmanifest`, `sw.js` (`CACHE_NAME = "smart-buy-list-v3.12.0"`), and UI badges.

---

## Consequences

- **Ergonomics & Safety**: Eliminates accidental empty trip completion in Buy Mode and prevents accidental cloud overwrites through clear UI distinctions and tooltips.
- **UI/UX Consistency**: Every action in Option Hub Settings adheres to the 2-column styled container button pattern with clear semantic color accents and touch feedback.
- **Diagnostics & Transparency**: Shoppers encountering GitHub API rate limits know precisely when the rate limit window will reset without inspecting developer console logs.
- **Data Integrity**: Preserves deterministic 3-way merging as the safe default while maintaining master override mechanisms for edge-case recovery.
