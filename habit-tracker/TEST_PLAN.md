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
├── habit-tracker-ui-components.test.js       # 4-Lens rendering, multi-modal cards, timer reactivity, drawer, starter kits
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
  - Consumes freeze token on missed days without resetting streak to 0.

### 2. Storage, Persistence & Starter Kits (`tests/habit-tracker-storage-persistence.test.js`)

- [ ] **Starter Kits Seeding**:
  - Seeds 4 curated starter packs (_Morning Mastery_, _Deep Focus_, _Vitality_, _Zen_).
- [ ] **Data Vault JSON Backup & Safe Restore**:
  - `replaceState()` successfully restores complete state and updates in-memory cache without throwing exceptions.
- [ ] **CSV Export**:
  - Produces valid UTF-8 formatted CSV rows with headers and habit log records.

### 3. UI Components, 4-Lens Perspective & Multi-Modal Cards (`tests/habit-tracker-ui-components.test.js`)

- [ ] **Top Lens Switcher**:
  - Switching between `today`, `timeline`, `matrix`, and `identity` lenses renders the appropriate views and updates active pill tokens.
- [ ] **Today Action Board**:
  - Hero progress ring renders accurate completion percentage and momentum score.
  - Domain filter pills filter cards by Health, Mind, Craft, and Discipline.
  - Binary 1-tap checkbox toggles completion and updates daily progress.
  - Stepper card `+` and `-` buttons accurately adjust logged values and custom units.
  - Timer card provides live countdown ticking, Start/Pause, Reset, and triggers completion audio/haptics.
- [ ] **Timeline & Routines Lens**:
  - Renders circadian time-block streams (Morning, Afternoon, Evening, Bedtime) with completion counter badges.
- [ ] **Matrix & Analytics Lens**:
  - Renders 52-week activity heatmap, 0-baseline day-of-week adherence chart, and streak records.
- [ ] **Identity & Life Domains Lens**:
  - Renders domain summary cards and 1-click starter kit activation triggers.
- [ ] **Habit Detail Drawer & Overlays**:
  - Slide-over drawer displays habit heatmap, 30-day consistency score, and reflection notes log.

### 4. Bilingual Parity & Accessibility (`tests/habit-tracker-i18n.test.js`)

- [ ] 100% dictionary parity between Vietnamese (`vi`) and English (`en`).
- [ ] WCAG 2.1 AA/AAA contrast ratios across Dark and Light themes.
