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

### 2. Storage & Silent Migration (`tests/habit-tracker-storage-persistence.test.js`)

- [ ] **IndexedDB CRUD**:
  - Creates, reads, updates, and deletes habits, logs, routines, and settings.
- [ ] **Silent Migration**:
  - Upgrades legacy schema payloads to v1.0 without data loss.
- [ ] **Data Portability**:
  - Generates valid JSON export containing all habits, logs, and settings.
  - Imports JSON data safely with validation schema and duplicate detection.

### 3. Cloud Sync & Backup (`tests/habit-tracker-cloud-sync.test.js`)

- [ ] Serializes state to encrypted payload.
- [ ] Validates GitHub Gist and Google Drive backup structures.

### 4. UI Components & Gestures (`tests/habit-tracker-ui-components.test.js`)

- [ ] **Today View**:
  - Renders 7-day date slider and selects active date.
  - Renders routine sections (Morning, Afternoon, Evening, Anytime) with accurate progress counts.
  - Triggers swipe-right completion event and emits celebratory visual effects.
- [ ] **Insights & Heatmap View**:
  - Generates 52-week calendar heatmap grid with accurate color density.
  - Displays Best Streak and 30-day Consistency Score badges.
- [ ] **Habit Manager View**:
  - Opens Add/Edit modal, validates required fields, updates state.
- [ ] **Deep-Dive Bottom Sheet**:
  - Opens bottom sheet on habit click, displays 365-day mini heatmap and check-in notes.

### 5. PWA Lifecycle & Reminders (`tests/habit-tracker-pwa-lifecycle.test.js`)

- [ ] Service worker registers and caches core assets (`index.html`, `manifest.webmanifest`, `icon.svg`).
- [ ] Local notification scheduler computes next trigger times for habit reminders.

### 6. Bilingual Parity (`tests/habit-tracker-i18n.test.js`)

- [ ] 100% Vietnamese (`vi`) and English (`en`) dictionary key equivalence.
- [ ] Number and date formatting conforms to locale conventions.

### 7. Playwright E2E Multi-Device (`tests/e2e/habit-tracker-devices.spec.js`)

- [ ] Mobile iPhone & Android touch swipe habit completion flow.
- [ ] Habit creation, routine assignment, and 100% daily victory confetti check.
- [ ] Heatmap inspection and note logging flow.
