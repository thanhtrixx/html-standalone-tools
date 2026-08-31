# ADR-0020: Quick Add Store Picker, Available-Only Store Filtering, Clean Filter Chips, GitHub Rate Limit Resiliency & Symmetrical Cloud Overrides

## Status

Accepted (v3.11.0)

## Context

Following the release of version 3.10.0, user feedback highlighted five specific areas for ergonomic improvement and architectural refinement across item entry, list filtering, visual decluttering, cloud synchronization, and Settings action consistency:

1. **Quick Add Store Selection Ergonomics**:
   - The Smart Omnibox (`#smartQuickInput`) parsed natural language `@store` shorthand (e.g. `Sữa 35k @coopmart`) from text, but defaulted blindly to `memoryState.stores[0]` ("WinMart") when no `@store` tag was typed.
   - Shoppers who wanted to add items to a specific store without manually typing `@store` every time had to open the Advanced Add Form (`#advancedAddFields`).
   - Quick Add did not observe the active Shopping List store filter context. When a shopper filtered their list by a specific store (e.g. `currentStoreFilter === "Big C"`), entering items via Quick Add still defaulted to the primary store rather than the active store context.

2. **Store Filter Inconsistency with Aisle Filtering**:
   - The Department / Aisle filter (`#categoryFilterChips`) dynamically isolates only categories that contain active items on the Buy List (`availableCategories.has(c.key)`).
   - In contrast, `#storeFilterChips` iterated across all configured stores in `memoryState.stores`, rendering chips with `(0)` item count for stores without any active items. This created horizontal scrolling clutter and confusion during active shopping.

3. **Store Filter Visual Clutter in Shopping List**:
   - `#storeFilterChips` prepended generic emojis (`🏬` for All Stores, `🏪` for all custom stores). Because stores already have clear, unique names (e.g. WinMart, Co.opmart, Costco), these repeated emojis added visual noise without providing semantic distinction.

4. **GitHub Gist Sync HTTP 403 Rate Limit Diagnostics**:
   - When users encountered HTTP 403 or HTTP 429 from GitHub API due to API rate limits (primary rate limits at 5,000 requests/hr or secondary rate limits during bursts), the app displayed generic error messages (`HTTP 403`) or raw response text without informing the user when the rate limit window would reset.
   - GitHub API includes `x-ratelimit-remaining`, `x-ratelimit-reset`, and `Retry-After` headers on rate-limited responses, providing exact epoch timestamps for rate limit recovery.

5. **Asymmetrical Force Upload / Download UI/UX**:
   - In Option Hub Settings (`#settingsModal`), under both Google Drive and GitHub Gist sync sections, "Force Upload to Cloud" and "Force Download from Cloud" were rendered as plain text links (`<button class="text-[11px] text-emerald-400 ...">`) rather than structured action buttons.
   - This contrasted sharply with the primary action buttons (`[ Connect ]`, `[ Disconnect ]`, `[ Sync Now ]`), creating inconsistent click targets and diminished touch ergonomics.

---

## Decisions

### 1. Hybrid Quick Add Store Picker & Filter Context Inheritance

- **Inline Store Picker (`#smartQuickStoreSelect`)**:
  - Added a compact store dropdown selector right inside `#smartQuickForm` alongside the text input.
  - Automatically populated with all configured stores (`memoryState.stores`) plus `[ ⚙️ Quản lý / Manage Stores ]`.
- **Filter Context Reactivity**:
  - When the user changes `currentStoreFilter` to a specific store (not `"ALL"`), `#smartQuickStoreSelect` automatically updates to match the selected store.
- **NLP Shorthand Bidirectional Sync**:
  - If the user types an explicit `@store` tag in `#smartQuickInput` (e.g. `@lotte`), the NLP parser recognizes the store and auto-synchronizes `#smartQuickStoreSelect` to that store.
  - When no `@store` tag is typed, the item inherits the store selected in `#smartQuickStoreSelect`.

### 2. Available-Only Store Filtering Synchronization

- **Dynamic Store Filter Isolation**:
  - Updated `renderStoreFilterChips()` and `renderStoreFilterOptions()` to inspect `availableStores = new Set(memoryState.activeList.items.map(i => i.store).filter(Boolean))`.
  - Only stores present in `availableStores` are rendered as filter chips in `#storeFilterChips` and options in `#storeFilterSelect` (along with `ALL` and `MANAGE_STORES`).
  - If a filter is active for a store that no longer has active items, `currentStoreFilter` gracefully resets to `"ALL"`.

### 3. Clean Store Filter Chips (Emoji Removal)

- Removed `🏬` and `🏪` emoji prefixes from all store filter chips in `#storeFilterChips`.
- Rendered clean text badges with item counts: `[ Tất Cả (N) ]`, `[ WinMart (N) ]`, `[ Co.opmart (N) ]`, followed by the `[ ⚙️ Quản lý ]` management trigger.

### 4. GitHub API Rate Limit Detection & Local Reset Time Calculation

- Implemented rate limit detection inspecting `res.status === 403 || res.status === 429`, `x-ratelimit-remaining === "0"`, `x-ratelimit-reset`, and `retry-after` headers.
- When rate limited, converts epoch reset timestamp into formatted local time (`HH:MM`) and remaining duration (`X min`):
  - English: `GitHub API rate limit exceeded. Resets at ${timeStr} (in ${mins}m).`
  - Vietnamese: `Đã đạt giới hạn yêu cầu GitHub API. Tự động mở lại lúc ${timeStr} (sau ${mins} phút).`
- Surfaced across all GitHub Gist operations (`validateToken`, `discoverOrCreateGist`, `readRemoteGist`, `updateRemoteGist`, `sync`).

### 5. Symmetrical 2-Button Grid for Cloud Overrides

- Replaced text links in `#cloudSyncAdvancedActions` (Google Drive) and `#githubGistActions` (GitHub Gist) with a unified 2-column button grid (`grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80`):
  - `[ ⬆️ Tải Lên Đám Mây / Force Upload to Cloud ]` (Emerald subtle accent border/bg)
  - `[ ⬇️ Tải Về Từ Đám Mây / Force Download from Cloud ]` (Sky subtle accent border/bg)
- Standardized touch target sizes ($\ge 44\text{px}$) and active touch scaling (`active:scale-95`).

### 6. PWA Version Increment (v3.11.0)

- Version bumped to `3.11.0` across `manifest.webmanifest`, `sw.js` (`CACHE_NAME = "smart-buy-list-v3.11.0"`), and `index.html`.

---

## Consequences

- Quick Add entry becomes context-aware and store-flexible without requiring modal transitions or repetitive typing.
- Store filtering aligns perfectly with Aisle filtering, displaying only relevant stores.
- Store filter chips present a cleaner, less noisy interface in the Shopping List.
- GitHub sync errors provide actionable time-based guidance during API rate-limiting events.
- Settings cloud manual overrides gain visual harmony and touch-friendly button targets.
- Preserves 100% offline-first capability, bilingual parity, and zero-runtime build dependencies.
