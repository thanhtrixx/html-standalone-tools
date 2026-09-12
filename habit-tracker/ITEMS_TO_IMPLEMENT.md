# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and vertical slice backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Active Feature Development Roadmap (ADR-0003 & ADR-0004)

### Slice 1: Statistical Zero-Baseline & Mathematical Engine Fixes (ADR-0003)

- [x] Historical zero-baseline calculation in `engine.js` (0% for empty history/weekdays).
- [x] Math seam tests passing 100%.

### Slice 2: Background & Screen-Off Timer Delta Engine (ADR-0003)

- [x] Timestamp delta sync on `visibilitychange` and `window.focus`.
- [x] Auto-complete when target duration reached in background.

### Slice 3: Multi-Routine Data Model & Dashboard Rendering (ADR-0003)

- [x] `routines: string[]` support with backwards-compatible migration.
- [x] Synchronized multi-instance check-ins and routine badge displays.

### Slice 4: Native Gestures & Back Navigation Stack (ADR-0003)

- [x] Container horizontal tab swipe navigation with card disambiguation.

### Slice 5: Add / Edit Habit Form UX Overhaul & Hybrid Reminders (ADR-0003)

- [x] Live preview card, routine chips, emoji palette, and notification settings.

---

## 🚀 PWA Back-Stack, Dock Ergonomics, Timer & Data Hygiene (ADR-0004)

### Slice 6: PWA Full History Push-Stack, Modal Dismissal & Double-Back Exit

- [x] **History Push on Overlays & Tabs (`app.js`)**:
  - Invoke `history.pushState({ app: 'habit-tracker', overlay: 'edit' | 'detail' | 'delete' | 'reset', tab: activeTab }, '')` when any modal or bottom sheet opens.
  - Invoke `history.pushState({ app: 'habit-tracker', tab: nextTab }, '')` when switching between main dock tabs.
- [x] **Multi-Tier `popstate` Back Navigation**:
  - Tier 1: Dismiss active overlays (`closeHabitModal`, `closeDetailSheet`, `closeDeleteModal`, `closeResetModal`).
  - Tier 2: Navigate back to previous tab or `today` root.
  - Tier 3: Show _"Nhấn back lần nữa để thoát / Press back again to exit"_ on `today` root with 2s timeout before allowing exit.

### Slice 7: Bottom Navigation Dock Active Capsule Highlighting & Theme Ergonomics

- [x] **Active Capsule & Indicator Tokens (`index.html`, `app.js`, `DESIGN.md`)**:
  - High-contrast active capsule styling (`bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-emerald-500/30 rounded-2xl px-3 py-1.5`).
  - Active indicator micro-dot under the icon.
  - Muted inactive state with high-contrast text across Light and Dark OLED themes.

### Slice 8: Timer Engine Reactivity, Live Countdown Card, Reset Control & Minute Inputs

- [x] **Habit Form Minute Input (`manager-view.js`, `app.js`)**:
  - Accept target duration in minutes, with explicit `phút / mins` label and automatic $\times 60$ conversion.
- [x] **Live Reactive Countdown on Habit Cards (`today-view.js`, `app.js`)**:
  - Habit card updates real-time ticking `MM:SS` countdown and progress ring every second while running.
  - Direct Start / Pause (⏯️) and Reset (🔄) action controls directly on the habit card.

### Slice 9: Tiered Data Hygiene Vault & Clean State Reset Modal

- [x] **Data & Vault Reset Card in Settings (`app.js`, `store.js`, `translations.js`)**:
  - _Khôi phục thói quen mẫu / Reset to Sample Habits_: Clears custom logs and restores 3 starter habits.
  - _Xóa sạch toàn bộ dữ liệu / Complete Factory Wipe_: Purges all IndexedDB stores (`habits`, `logs`, `settings`, `vacations`) and resets to zero habits.
  - Double confirmation dialog (`role="alertdialog"`) before executing reset.

### Slice 10: Interactive Habit Detail Sheet & Micro-Journal

- [x] **Interactive Action Controls & Shortcuts (`detail-sheet.js`, `app.js`)**:
  - Direct 1-tap check-in, numeric stepper, or timer toggle inside sheet header.
  - Direct **✏️ Sửa / Edit** and **📦 Lưu trữ / Archive** shortcuts.
  - Tapping any date on the 365-day mini heatmap switches the Reflection Notes editor date.
