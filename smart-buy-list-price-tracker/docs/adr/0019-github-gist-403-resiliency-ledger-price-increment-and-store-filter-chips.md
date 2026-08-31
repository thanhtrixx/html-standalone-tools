# ADR-0019: GitHub Gist 403 Resiliency, Ledger Price Increment, Country Flag Branding & Dedicated Store Filter Chips

## Status

Accepted (v3.10.0)

## Context

In version 3.9.0, several edge-case defects and UX enhancements were identified across cloud synchronization, historical price ledger restocking, language selection, and shopping list organization:

1. **GitHub Gist Sync HTTP 403 Errors**:
   - Users connecting with GitHub Personal Access Tokens often encountered `HTTP 403 Forbidden` errors during synchronization.
   - Root causes:
     - GitHub's REST API for Gists only supports **Classic Personal Access Tokens (PAT)** with the `gist` scope. Fine-grained PATs (`github_pat_...`) return HTTP 403 (`Resource not accessible by personal access token`). The app placeholder previously mentioned `github_pat_...` without scope validation.
     - Token validation against `GET /user` succeeded without verifying the `x-oauth-scopes` header contained `gist`.
     - When fetching truncated files from `file.raw_url` (`gist.githubusercontent.com`), sending `Authorization: Bearer <token>` triggered CDN CORS/403 credential rejections.
2. **Historical Ledger Re-order Button Text Density**:
   - The batch action button in the sticky summary bar read `Add Selected to Buy List` (`btn_add_selected_ledger`). Shortening to `Add to Buy List` (`Thêm vào danh sách mua`) creates a crisper, more balanced UI alongside `Delete Selected`.
3. **Ledger-to-BuyList Price Scaling Defect**:
   - When an item already existed in the active Buy List (`memoryState.activeList.items`), `processLedgerEntryIntoBuyList` incremented the item quantity (`existing.quantity += incQty`) but overwrote `existing.price = entry.price`, leaving total line expenditure understated. In Smart Buy-List's domain model, `item.price` represents the total line estimated cost, which must increase additively.
4. **Language Switcher Ergonomics**:
   - Settings language selector used abbreviations (`English (EN)` / `Tiếng Việt (VI)`). Upgrading to country flag emojis paired with full official country and language names (`🇻🇳 Việt Nam (Tiếng Việt)` and `🇺🇸 United States (English)`) enhances visual scanability and accessibility.
5. **Shopping List Store Filtering Navigation**:
   - The Shopping List section only contained category/aisle filter chips (`#categoryFilterChips`), forcing users to look up to the top Shopping Trip KPI section to filter by store. A dedicated horizontal store chip line within the Shopping List component provides 1-tap store switching with bidirectional synchronization.

---

## Decisions

### 1. GitHub Gist 403 Resiliency & Classic PAT Enforcement

- **Scope & Prefix Validation**:
  - `validateToken(token)` inspects token prefixes: if starting with `github_pat_`, throws an explicit error explaining that Fine-grained tokens do not support Gists and directing the user to generate a Classic PAT with `gist` scope.
  - Inspects `x-oauth-scopes` header from `GET /user`: if present and missing `gist`, throws an actionable scope error.
- **Raw CDN Fetch Credential Stripping**:
  - In `readRemoteGist`, requests to `file.raw_url` (`gist.githubusercontent.com`) are executed without `Authorization` headers, avoiding CDN CORS/403 rejection.
- **Rich Diagnostic Error Surface**:
  - All GitHub REST API calls (`/user`, `/gists`, `/gists/{id}`) inspect response JSON for GitHub's error `message` to surface exact diagnostic reasons in toasts.
- **Documentation & UI Guidance**:
  - Updated `githubTokenInput` placeholder to `ghp_... (Classic PAT with 'gist' scope)`.
  - Updated `docs/github-gist-cloud-sync-guide.md` to remove obsolete Fine-grained PAT references.

### 2. Concise Ledger Batch Re-order Button Copy

- Renamed `btn_add_selected_ledger`:
  - English: `Add to Buy List`
  - Vietnamese: `Thêm vào danh sách mua`
- Maintained `🛒` icon and full responsive alignment.

### 3. Additive Line Total Price Accumulation

- Updated `processLedgerEntryIntoBuyList(entry)`:
  - When deduplicating against an existing active item:
    $$\text{quantity}_{\text{new}} = \text{quantity}_{\text{existing}} + \text{quantity}_{\text{entry}}$$
    $$\text{price}_{\text{new}} = \text{price}_{\text{existing}} + \text{price}_{\text{entry}}$$
  - Updates unit and store metadata if previously unassigned.

### 4. Country Flag & Full Country Name Branding

- Updated `#settingsLanguageSelect` options:
  - `vi`: `🇻🇳 Việt Nam (Tiếng Việt)`
  - `en`: `🇺🇸 United States (English)`
- Updated `#langToggleBtn` title tooltips with full bilingual descriptions.

### 5. Dedicated Horizontal Store Filter Chips in Shopping List

- Added `#storeFilterChips` horizontal scrollable chip bar in the Shopping List section directly above aisle chips.
- Implemented `renderStoreFilterChips()` with:
  - `[ 🏬 Tất cả cửa hàng | Store 1 | Store 2 | ... | ⚙️ Quản lý ]`
  - Active store highlighted in Emerald pill styling (`bg-emerald-600 text-white font-semibold`).
  - 100% two-way reactive synchronization between `#storeFilterChips` and top KPI `#storeFilterSelect`.

### 6. PWA Version Increment (v3.10.0)

- Version bumped to `3.10.0` across `manifest.webmanifest`, `sw.js` (`CACHE_NAME = "smart-buy-list-v3.10.0"`), and `index.html`.

---

## Consequences

- Resolves GitHub Gist 403 sync failures with proactive token guidance.
- Corrects shopping list price calculations when restocking items from purchase history.
- Improves in-aisle store navigation through dedicated horizontal filter chips.
- Enhances language switching clarity with country flags and native localized names.
- Preserves 100% offline-first reliability, bilingual symmetry, and zero-runtime dependency architecture.
