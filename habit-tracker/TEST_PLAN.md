# Test Plan & Verification Strategy (`TEST_PLAN.md`)

This document defines the test matrix, public test seams, and verification coverage for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Test Suite Architecture

Following the repository's Two-Speed TDD standard (ADR-0010), testing is divided into fast scoped inner-loop suites and full end-to-end device suites.

```text
tests/
├── habit-tracker-engine-math.test.js        # Pure mathematical engines (streaks, consistency, freeze tokens)
├── habit-tracker-storage-persistence.test.js # IndexedDB CRUD, silent migration, JSON import/export
├── habit-tracker-cloud-sync.test.js          # Cloud backup encoding, Gist/Drive payloads
├── habit-tracker-ui-components.test.js       # DOM rendering, swipe gestures, bottom sheet, routines
├── habit-tracker-pwa-lifecycle.test.js       # Service worker caching, offline fallback, notifications
├── habit-tracker-i18n.test.js                # Bilingual dictionary 100% key parity & formatters
└── e2e/
    └── habit-tracker-devices.spec.js         # Playwright multi-device mobile (iPhone, Android) & desktop
```

---

## 🧪 Public Test Seams & Coverage Matrix

### 1. Mathematical Domain Engine (`tests/habit-tracker-engine-math.test.js`)

- [ ] **Streak Calculation**:
  - Increments on consecutive days with $\ge 100\%$ target completion.
  - Correctly evaluates today vs yesterday active status.
  - Maintains streak across non-scheduled days (e.g. Mon/Wed/Fri schedule on Tuesday/Thursday).
  - Maintains streak across Vacation / Sick Pause mode dates.
- [ ] **Streak Freeze Token Application**:
  - Automatically consumes 1 freeze token on an uncompleted scheduled day.
  - Prevents streak reset to 0 when freeze token is applied.
  - Resets to 0 only when no freeze tokens remain on a missed scheduled day.
- [ ] **Rolling Consistency Score**:
  - Calculates exact 30-day and 90-day consistency score $\%$.
  - Excludes paused/vacation days from denominator.
- [ ] **Quantitative & Timer Progress**:
  - Calculates numeric counter progress ratio $C_{i, d} = \min(1.0, \text{logged}/\text{target})$.
  - Calculates timer duration completion.
- [ ] **Routine & Daily Overall Progress Rings**:
  - Aggregates progress correctly across active scheduled habits.

### 2. Storage & Data Portability (`tests/habit-tracker-storage-persistence.test.js`)

- [ ] **IndexedDB CRUD**:
  - Creates, reads, updates, and deletes habits, logs, routines, and settings.
- [ ] **Data Export & Import Seams (Issue #426)**:
  - Invokes `exportToJson()` without throwing `TypeError` and produces valid schema payload.
  - Imports JSON data in `merge` and `replace` modes via `store.importState()` without crashing.
- [ ] **Habit Reordering Persistence (Issue #427)**:
  - Swapping habit positions with `▲`/`▼` mutates order array and persists to database.

### 3. Form Handling & State Stability (`tests/habit-tracker-ui-components.test.js`)

- [ ] **Form Event Interception (Issue #425)**:
  - Submitting `#habit-edit-form` calls `e.preventDefault()`, persists habit, and closes modal without page reload.
  - Submitting `#habit-note-form` calls `e.preventDefault()`, saves reflection note, and updates history without reload.
- [ ] **Single Modal Overlay & A11y (Issue #429)**:
  - Validates that opening modal or bottom sheet creates exactly one backdrop overlay in DOM with `role="dialog"`.
  - Clicking outside closes modal cleanly.
- [ ] **Light Mode Contrast (Issue #429)**:
  - Validates responsive dark/light class assignments on cards, text, and inputs.

### 4. Interactive UX, Gestures & Motion (`tests/habit-tracker-ui-components.test.js` & E2E)

- [ ] **Preset Emoji Picker (Issue #430)**:
  - Clicking emoji preset updates habit icon input and visual preview.
- [ ] **Floating Undo Toast (Issue #430)**:
  - Completing or incrementing a habit displays floating toast with "Undo" action for 4s.
  - Clicking Undo reverses log value and updates progress rings immediately.
- [ ] **Interactive 52-Week Heatmap Date Navigation (Issue #430)**:
  - Clicking past date cell switches active date and navigates to Today tab with active date highlighted.
- [ ] **Touch Swipe-to-Complete**:
  - Swipe gesture applies real-time resistance transform and triggers completion on threshold.

### 5. Bilingual Localization Parity (`tests/habit-tracker-i18n.test.js`)

- [ ] **Zero Missing Keys (Issue #428)**:
  - Automated dictionary audit verifies all UI keys (`settings_tab`, `theme_select`, `cloud_backup_title`, `export_json_btn`, `import_json_btn`, `pwa_version`, `check_updates_btn`, `purge_cache_btn`) exist in both `vi` and `en`.
- [ ] **Dynamic Tab Label Translation**:
  - Switching language dynamically re-renders bottom navigation dock labels.

### 6. Playwright E2E Multi-Device Verification (`tests/e2e/habit-tracker-devices.spec.js`)

- [ ] Multi-device iPhone 14 & Pixel 7 touch interaction runs.
- [ ] Habit creation, reordering, check-in, undo toast flow, heatmap navigation, and JSON export.
- [ ] Standalone compaction build verification (`dist/index.html`).
