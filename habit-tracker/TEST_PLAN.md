# Test Plan & Verification Strategy (`TEST_PLAN.md`)

This document defines the test matrix, public test seams, and verification coverage for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Test Suite Architecture

Following the repository's Two-Speed TDD standard (ADR-0010 & ADR-0003), testing is divided into fast scoped inner-loop suites and full end-to-end device suites.

```text
tests/
├── habit-tracker-engine-math.test.js        # Pure mathematical models (0% baseline, streaks, consistency, freeze tokens)
├── habit-tracker-storage-persistence.test.js # IndexedDB CRUD, fresh database seed, starter kits, JSON import/export
├── habit-tracker-cloud-sync.test.js          # Cloud backup encoding, Gist/Drive payloads
├── habit-tracker-ui-components.test.js       # 4-Tab bottom dock, checkbox-first cards, inline expansions, reactive timer, identity wizard
├── habit-tracker-i18n.test.js                # Bilingual dictionary 100% key parity & formatters
└── e2e/
    └── habit-tracker-devices.spec.js         # Playwright multi-device mobile (iPhone, Android) & desktop
```

---

## 🧪 Public Test Seams & Coverage Matrix

### 1. Mathematical Domain Engine (`tests/habit-tracker-engine-math.test.js`)

- [x] **Historical 0% Baseline on Empty History**:
  - `calculateStreakAndConsistency` returns `0%` for 30d/90d consistency when `scheduledCount === 0`.
  - `calculateWeekdayAdherence` returns `0%` for days with no scheduled history.
  - `calculateRoutineAdherence` returns `0%` for routines with no scheduled history.
  - `calculateDailyProgress` and `calculateRoutineProgress` return `percentage: 0`, `ratio: 0.0`, `isAllCompleted: false` when 0 habits scheduled.
- [x] **Streak & Freeze Token Calculation**:
  - Increments on consecutive days with $\ge 100\%$ target completion.
  - Consumes freeze token on missed days without resetting streak to 0.

### 2. Storage, Persistence & Starter Kits (`tests/habit-tracker-storage-persistence.test.js`)

- [x] **Starter Kits Seeding & Identity Setup**:
  - Seeds 4 curated starter packs (_Morning Mastery_, _Deep Focus_, _Vitality_, _Zen_).
- [x] **Data Vault JSON Backup & Safe Restore**:
  - `replaceState()` successfully restores complete state and updates in-memory cache without throwing exceptions.
- [x] **CSV Export**:
  - Produces valid UTF-8 formatted CSV rows with headers and habit log records.

### 3. UI Components, 4-Tab Navigation & Checkbox-First Modality (`tests/habit-tracker-ui-components.test.js`)

- [x] **4-Tab Bottom Dock Navigation**:
  - Switching between `today`, `insights`, `habits`, and `settings` renders the respective views and updates active tab styling.
  - Sub-header lens bar is removed; top header remains sleek and uncluttered.
  - Redundant `+` button is removed from bottom dock.
- [x] **Checkbox-First Habit Cards**:
  - All habit cards render a 1-tap checkbox.
  - Binary habits toggle completed state on checkbox tap.
  - Numeric & Timer habits log full target completion on checkbox tap.
  - Tapping card body on Numeric/Timer habits expands inline drawer/accordion with steppers and live timer controls.
- [x] **Reactive Timer Execution**:
  - Dispatches sub-second ticks via Web Worker delta calculation.
  - Reactively updates DOM duration text, progress ring, and ambient header pill.
  - Throttles IndexedDB writes to avoid disk saturation during active counting.
  - Triggers completion chime and confetti upon reaching target duration.
- [x] **Identity Onboarding Wizard & Life Pillars in Habits**:
  - Renders 3-step setup modal for first-time users or empty state.
  - Displays life domain summary cards and starter kits within the `habits` tab.

### 4. Bilingual Parity & Accessibility (`tests/habit-tracker-i18n.test.js`)

- [x] 100% dictionary parity between Vietnamese (`vi`) and English (`en`) for all navigation tabs, modalities, and actions.
- [x] Minimum 44px touch targets on mobile for all interactive buttons and checkboxes.
