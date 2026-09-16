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

### 5. Focus Timer Engine, Empty States & Modal Hierarchy (`tests/habit-tracker-ui-components.test.js`)

- [x] **CSP Compliance & Timer Worker Resilience**:
  - `startTimerTicker()` initializes Web Worker when supported or cleanly falls back to `setInterval` without throwing uncaught exceptions.
  - Sub-second DOM ticker accurately reflects elapsed duration calculated from timestamp deltas.
  - Screen Wake Lock API is invoked on timer start and released on stop/pause/reset.
- [x] **Immersive Focus Timer Modal**:
  - `#focus-timer-modal-overlay` opens on ambient header/dock pill click or card timer tap.
  - Renders large circular progress ring with reactive stroke dashoffset and hybrid countdown/overtime display.
  - Quick time adjustment steppers (`+1m`, `+5m`, `-1m`) mutate the target/duration reactively.
  - Web Audio sine harmonic chime is synthesized upon reaching 100% completion.
- [x] **Dual Empty-State Gateway & Factory Wipe Automation**:
  - Empty `Today` view displays both `✨ Identity Setup Wizard` and `+ Add Habit` buttons.
  - Empty `Habits` catalog view displays both `✨ Identity Setup Wizard` and `+ Add Habit` buttons.
  - Calling `confirmFactoryWipe()` wipes database, redirects to `Today`, and auto-launches the 3-step Identity Setup Wizard modal.
- [x] **Shell Decluttering & Modal Layering Invariants**:
  - `#floating-quick-add-btn` is completely absent from the DOM.
  - Top header is free of the subtitle `Obsidian Glow • Offline-First`.
  - `#habit-edit-modal-overlay` has `z-index >= 60` and displays above `#detail-sheet-overlay` (`z-50`) without z-index collisions.

### 6. Header Alignment, Insights Accuracy & Floating Dynamic Island (ADR-0009)

- [x] **Header Height Harmony**:
  - Logo (`w-8 h-8`), title text, freeze token badge (`#freeze-tokens-count`), and language switcher (`#lang-toggle-btn`) render with uniform height (`32px`) and vertically centered flex baselines.
- [x] **Insights Mathematical Integrity & Zero-Baseline Gating**:
  - `calculateStreakAndConsistency` preserves `bestStreak: 0` and consumes 0 freeze tokens on empty history.
  - `calculateOverallConsistencyScore` returns exact percentage of scheduled habit completions across 30d/90d windows.
  - `renderInsightsView` renders localized `heatmap_subtitle` and zero duplicate titles.
- [x] **4-Step Language-First Identity Setup Wizard**:
  - Step 1 renders language selection (`🇻🇳` / `🇺🇸`); selecting language reactively updates modal UI and persists to store.
  - Stepper indicators accurately reflect 4 steps with working back/next navigation.
- [x] **Timer Card Decluttering & Floating Dynamic Mini-Player**:
  - Button label uses `Start` / `Bắt đầu` and `Pause` / `Tạm dừng`.
  - Card drawer renders a clean single ticker row without duplicate numbers.
  - `#floating-timer-island` appears above bottom dock when timer is running and provides 1-tap play/pause and focus modal expansion across all tabs.
