# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and feature backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Feature Specifications & Requirements

### 1. Core Domain Engine (`src/domain/`)

- [ ] **Habit Types Support**:
  - Binary (Yes/No completion).
  - Numeric Counter with target, unit (`ml`, `pages`, `pushups`, etc.), and configurable step increments (`+1`, `+5`, `+100`, etc.).
  - Duration/Timer with target minutes/seconds, interactive stopwatch/countdown, and completion chime.
- [ ] **Frequency & Schedule Engine**:
  - Daily ($7\text{ days/week}$).
  - Specific Days of Week (e.g. Mon, Wed, Fri).
  - Flexible Weekly Target ($X$ times per week).
  - Interval (Every $N$ days).
  - Vacation / Sick Pause mode suspending schedules without streak penalty.
- [ ] **Streak & Consistency Engine**:
  - Consecutive active streak calculation.
  - Streak Freeze Token management (default 2 tokens/30d) protecting streaks on missed days.
  - Rolling 30-day and 90-day Consistency Score (%) calculation.
  - Routine-level and daily overall progress ring percentages.

### 2. State, Storage & Portability (`src/storage/`, `src/state/`, `src/sync/`)

- [ ] **IndexedDB Persistence (`habit_tracker_db`)**:
  - Schema stores: `habits`, `logs` (`habitId + date`), `routines`, `settings`.
  - Silent auto-migration system supporting backward-compatible schema upgrades.
  - LocalStorage fallback when IndexedDB is blocked.
- [ ] **Data Portability & Cloud Backup**:
  - 1-tap full JSON export and validation import (merge/replace modes).
  - Optional client-side encrypted cloud backup via GitHub Gist or Google Drive.

### 3. Mobile-First UI/UX & Views (`src/ui/`)

- [ ] **Today View (`#tab-today`)**:
  - Horizontal scrollable 7-day date slider with Today pill and completion dots.
  - Daily progress ring header with fire streak icon and freeze token counter.
  - Routine-grouped cards (🌅 Morning, ☀️ Afternoon, 🌙 Evening, 🔄 Anytime) with collapsible headers and routine progress badges.
  - Habit card with color accent, icon/emoji, target progress, and interactive stepper/toggle.
  - Touch gesture swipe-right to complete, swipe-left to open deep-dive sheet.
  - Celebratory victory confetti burst on 100% daily completion.
- [ ] **Insights & Analytics View (`#tab-insights`)**:
  - Interactive 52-week GitHub-style calendar contribution heatmap with color scale.
  - Metric summary cards: Best streak, Average consistency %, Total completions, Perfect days.
  - Day-of-week adherence chart (Monday – Sunday completion breakdown).
  - Routine adherence distribution.
- [ ] **Habit Manager View (`#tab-manager`)**:
  - Add / Edit habit modal with live preview, color theme picker, icon selector, routine selector, schedule builder, and reminder time.
  - Drag-and-drop or up/down reordering within routines.
  - Archive and delete with confirmation.
- [ ] **Habit Deep-Dive Sheet (`#habit-detail-sheet`)**:
  - Swipeable bottom sheet displaying 365-day mini heatmap for selected habit.
  - Historical check-in log list with micro-journal notes.
  - Quick note editor to add reflection to any past or current check-in.
- [ ] **Aesthetics & Micro-Interactions**:
  - Modern iOS Fitness / Craft Dark-OLED theme with full Light Mode toggle.
  - Web Haptic feedback on completions (`navigator.vibrate`).
  - Fluid SVG ring stroke transitions.

### 4. PWA, Notifications & Localization (`src/pwa/`, `src/i18n/`)

- [ ] **PWA Lifecycle**:
  - Valid `manifest.webmanifest` and companion SVG/PNG icons.
  - Service Worker (`sw.js`) with cache-first offline shell and background sync.
  - Install prompt banner with custom dismissal memory.
- [ ] **Reminders & Notifications**:
  - Web Notifications API integration firing scheduled habit alerts.
- [ ] **Bilingual Parity**:
  - 100% dictionary parity between Vietnamese (`vi`) and English (`en`).
  - Locale-aware number and date formatters.
