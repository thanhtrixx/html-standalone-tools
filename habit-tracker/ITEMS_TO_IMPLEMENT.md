# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and vertical slice backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Active Feature Development Roadmap (ADR-0003)

### Slice 1: Statistical Zero-Baseline & Mathematical Engine Fixes

- [ ] **Historical Zero-Baseline Calculation (`engine.js`)**:
  - `calculateStreakAndConsistency`: When `scheduledCount === 0`, return `consistencyScore30d = 0` and `consistencyScore90d = 0` instead of `100`.
  - `calculateWeekdayAdherence`: When `stats[dayOfWeek].scheduled === 0`, return `rate: 0` instead of `100`.
  - `calculateRoutineAdherence`: When `stats[rKey].scheduled === 0`, return `rate: 0` instead of `100`.
  - `calculateDailyProgress` & `calculateRoutineProgress`: When total scheduled habits is 0, return `percentage: 0`, `ratio: 0.0`, `isAllCompleted: false`.
- [ ] **Unit Math Seam Tests (`tests/habit-tracker-engine-math.test.js`)**:
  - Assert zero-baseline on fresh habits without history.
  - Assert weekday adherence returns 0% for days with no scheduled history.

---

### Slice 2: Background & Screen-Off Timer Delta Engine

- [ ] **Timestamp Delta Sync (`app.js`, `store.js`)**:
  - Record `{ habitId, date, startedAt, baseValue }` when timer starts.
  - Calculate real-world elapsed seconds on tick: `currentVal = baseValue + Math.floor((Date.now() - startedAt) / 1000)`.
  - Hook `document.addEventListener('visibilitychange')` and `window.addEventListener('focus')` to immediately synchronize elapsed time when screen turns back on or app is foregrounded.
  - Auto-complete habit, stop timer, and trigger victory toast/audio chime when target duration is reached while backgrounded.
- [ ] **Timer Seam Tests (`tests/habit-tracker-ui-components.test.js`)**:
  - Simulate elapsed background time via mocked `Date.now()` and visibilitychange event, verifying exact delta catch-up.

---

### Slice 3: Multi-Routine Data Model & Dashboard Rendering

- [ ] **Multi-Routine Schema & Migration (`engine.js`, `store.js`, `indexeddb.js`)**:
  - Support `routines: string[]` (e.g. `['morning', 'evening']`) on habit entities.
  - Silent backwards-compatible normalization for habits with legacy single `routine: string`.
  - Update `isScheduledDate` / routine filtering to check `habit.routines.includes(rKey)`.
- [ ] **Today Dashboard & Manager Multi-Routine Section Rendering (`today-view.js`, `manager-view.js`)**:
  - Render habit card under every assigned routine cluster section on the Today tab.
  - Synchronize live check-ins across multiple rendered instances of the same habit.
  - Update Habit Manager catalog to display multi-routine badges and group habits accurately.

---

### Slice 4: Native Gestures & Back Navigation Stack

- [ ] **Tab Swipe Left / Right Navigation (`app.js`)**:
  - Implement container-level touch gesture detector switching between 4 tabs: `Today` (0) ⇄ `Insights` (1) ⇄ `Habits` (2) ⇄ `Settings` (3).
  - Add gesture disambiguation so card swipe-to-complete and sheet open gestures take priority without triggering tab switches.
- [ ] **Native Back Stack & Double-Back Exit (`app.js`)**:
  - Intercept `window.addEventListener('popstate')`.
  - Close active modal dialogs, detail sheets, or delete confirmation dialogs if open.
  - Navigate to `Today` tab if currently on `Insights`, `Habits`, or `Settings`.
  - On `Today` tab, show toast _"Nhấn back lần nữa để thoát / Press back again to exit"_; second back press within 2000ms triggers exit.

---

### Slice 5: Add / Edit Habit Form UX Overhaul & Hybrid Daily Reminders

- [ ] **Add / Edit Form UX Modernization (`manager-view.js`, `translations.js`)**:
  - Multi-routine toggle chip selector (🌅 Sáng, ☀️ Chiều, 🌙 Tối, 🔄 Linh hoạt).
  - Segmented measurement type picker (`✓ Check`, `🔢 Số lượng`, `⏱️ Thời gian`).
  - Real-time interactive preview card updating as name, icon, color, and target change.
  - Expanded quick-pick emoji palette and contextual frequency schedule inputs.
- [ ] **Hybrid Daily Reminders (`notifications.js`, `app.js`, `translations.js`)**:
  - 1-tap "Bật thông báo / Enable Notifications" permission banner in Settings with live permission status badge.
  - Service Worker notification trigger handling for scheduled reminder times.
  - Ambient reminder pill and toast for habits with active reminder windows.
