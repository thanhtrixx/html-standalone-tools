# Test Plan & Verification Strategy (`TEST_PLAN.md`)

This document defines the test matrix, public test seams, and verification coverage for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Test Suite Architecture

Following the repository's Two-Speed TDD standard (ADR-0010 & ADR-0003), testing is divided into fast scoped inner-loop suites and full end-to-end device suites.

```text
tests/
├── habit-tracker-engine-math.test.js        # Pure mathematical models (0% baseline, streaks, consistency, freeze tokens)
├── habit-tracker-storage-persistence.test.js # IndexedDB CRUD, silent multi-routine migration, JSON import/export
├── habit-tracker-cloud-sync.test.js          # Cloud backup encoding, Gist/Drive payloads
├── habit-tracker-ui-components.test.js       # DOM rendering, swipe gestures, back navigation, timer delta, routines
├── habit-tracker-pwa-lifecycle.test.js       # Service worker caching, offline fallback, notifications
├── habit-tracker-i18n.test.js                # Bilingual dictionary 100% key parity & formatters
└── e2e/
    └── habit-tracker-devices.spec.js         # Playwright multi-device mobile (iPhone, Android) & desktop
```

---

## 🧪 Public Test Seams & Coverage Matrix

### 1. Mathematical Domain Engine (`tests/habit-tracker-engine-math.test.js`)

- [ ] **Historical 0% Baseline on Empty History**:
  - `calculateStreakAndConsistency` returns `0%` for 30d/90d consistency when `scheduledCount === 0`.
  - `calculateWeekdayAdherence` returns `0%` for days with no scheduled history.
  - `calculateRoutineAdherence` returns `0%` for routines with no scheduled history.
  - `calculateDailyProgress` and `calculateRoutineProgress` return `percentage: 0`, `ratio: 0.0`, `isAllCompleted: false` when 0 habits scheduled.
- [ ] **Streak & Freeze Token Calculation**:
  - Increments on consecutive days with $\ge 100\%$ target completion.
  - Correctly evaluates today vs yesterday active status.
  - Maintains streak across non-scheduled days and Vacation Pause mode.
  - Consumes freeze token on missed days without resetting streak to 0.
- [ ] **Multi-Routine Habit Progression**:
  - Evaluates multi-routine assigned habits (`routines: ['morning', 'evening']`) correctly within routine progress aggregations.

### 2. Timer Delta Engine & Background Accuracy (`tests/habit-tracker-ui-components.test.js`)

- [ ] **Timestamp Delta Sync**:
  - Timer calculates elapsed time from `Date.now() - startedAt + baseValue`.
  - Simulating page visibility change (`visibilityState: visible`) after elapsed duration catches up accurately.
  - Reaching target duration triggers auto-completion and stops timer loop.

### 3. Multi-Routine Data Persistence & Dashboard UI (`tests/habit-tracker-storage-persistence.test.js` & `tests/habit-tracker-ui-components.test.js`)

- [ ] **Silent Schema Migration**:
  - Legacy habit with `routine: 'morning'` automatically normalizes to `routines: ['morning']`.
- [ ] **Multi-Slot Rendering & Synchronized Check-in**:
  - Habit assigned to `['morning', 'evening']` renders in both routine sections on Today view.
  - Interacting with morning card updates daily log and syncs state on evening card.

### 4. Gestures, Back Navigation & Form UX (`tests/habit-tracker-ui-components.test.js`)

- [ ] **Tab Swipe Left/Right Gesture**:
  - Swiping horizontally across container switches active tab (`today` $\rightarrow$ `insights` $\rightarrow$ `manager` $\rightarrow$ `settings`).
  - Swiping directly on a habit card performs card-level completion/sheet action without switching tabs.
- [ ] **Native Back Stack Hierarchy**:
  - Back event with modal open closes modal.
  - Back event on secondary tab switches to Today tab.
  - Back event on root Today tab triggers exit toast; second back within 2s confirms exit.
- [ ] **Form Real-time Interactive Preview**:
  - Updating name, icon, color, or target immediately reflects in modal preview card.

### 5. Bilingual Localization Parity (`tests/habit-tracker-i18n.test.js`)

- [ ] **Zero Missing Keys Audit**:
  - Automated dictionary audit verifies all UI keys exist across both `vi` and `en`.

### 6. Playwright E2E Multi-Device Verification (`tests/e2e/habit-tracker-devices.spec.js`)

- [ ] Multi-device iPhone 14 & Pixel 7 touch interaction runs.
- [ ] Tab swipe switching, timer delta resume, multi-routine check-in, back navigation, and JSON export.
