# ADR 0004: PWA Back-Stack Navigation, Active Dock Highlighting, Timer Engine Reactivity, Data Hygiene Vault, and Interactive Detail Sheet

- **Status**: Accepted
- **Date**: 2026-09-12
- **Context**: `habit-tracker`
- **Lifecycle Phase**: `Active Feature Development` ([ADR-0003](../../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

---

## Context & Problem Statement

Following customer exploration and dogfooding of `habit-tracker`, five critical usability, navigation, and data lifecycle requirements were identified:

1. **PWA Hardware Back-Stack Navigation (#460)**:
   - When users switched tabs or opened modals/sheets, `history.pushState` was omitted.
   - Pressing the browser or mobile hardware back button directly unloaded the application instead of dismissing active overlays or navigating back to the `Today` root before triggering the double-back exit toast.
2. **Active Tab UI Highlighting in Navigation Dock**:
   - The bottom navigation dock lacked distinct active state visual hierarchy; light-mode green text washed out against white cards without an active capsule background, leaving users unsure of their current tab.
3. **Timer Engine Reactivity & Minute Configuration**:
   - Habit form lacked explicit minute inputs for time-based habits (forcing users to calculate seconds).
   - Habit cards on the Today view did not update ticking countdown seconds per tick (only the top header pill pulsed), creating ambiguity about whether the timer was active. Cards also lacked quick reset and pause controls.
4. **Data Hygiene & Vault Reset Feature**:
   - The application lacked an in-app capability to purge test logs, restore default sample habits, or perform a complete factory wipe of IndexedDB with safety confirmation dialogs.
5. **Interactive Habit Detail Deep-Dive Sheet**:
   - The detail bottom sheet was largely read-only, lacking direct check-in actions, an edit shortcut, schedule metadata, and calendar date selection synchronization for reflection notes.

---

## Decision Drivers

1. **Native Mobile Ergonomics**: Provide full PWA back-stack support matching iOS and Android native apps (overlays dismiss on back, visited tabs pop in reverse order, root triggers 2-second double-back exit).
2. **Accessible Contrast & Visual Hierarchy**: Dock tabs must clearly communicate active state with capsule pill backgrounds and indicator dots across both Dark OLED and Light themes.
3. **Reactive Real-Time Time Tracking**: Timers must accept natural minute targets, display live ticking seconds and progress rings on habit cards, and offer quick pause/reset controls.
4. **Data Portability & Clean State Management**: Users must be able to safely reset to starter templates or factory wipe their database with accessible confirmation dialogs.
5. **Interactive Reflection Hub**: The detail sheet must serve as an active workbench allowing immediate logging, editing, and historical reflection backfilling.

---

## Considered Options & Decision Outcomes

### 1. PWA History Push-Stack & Double-Back Exit

- **Decision**: Invoke `history.pushState({ app: 'habit-tracker', tab: activeTab, overlay: currentOverlay }, '')` whenever an overlay is opened or a tab is switched.
- **Back Hierarchy (`popstate`)**:
  - Tier 1: If any overlay (Edit Modal, Detail Sheet, Delete Confirmation, Reset Dialog) is open $\rightarrow$ close overlay, prevent page unload.
  - Tier 2: If active tab $\neq$ `'today'` $\rightarrow$ navigate back to `'today'`.
  - Tier 3: If on `'today'` root $\rightarrow$ show toast _"Nhấn back lần nữa để thoát / Press back again to exit"_; second press within 2000ms permits browser exit.

### 2. Bottom Navigation Dock Active Capsule Highlighting

- **Decision**: Render active dock items with an emerald capsule background (`bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-emerald-500/30 rounded-2xl`) and an emerald micro-indicator dot. Inactive items maintain muted styling (`text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200`).

### 3. Timer Minutes Input, Live Card Reactivity & Reset Control

- **Decision**:
  - Habit creation modal takes target duration in **Minutes** (e.g. `20` = 20 mins = 1200 seconds), displaying `phút / mins` suffix.
  - Today view habit cards for timer habits dynamically update live ticking countdown (`MM:SS`) on every tick while running, with active pulsing border and quick Start/Pause (⏯️) and Reset (🔄) action buttons.
  - On reaching 100%, trigger victory audio chime, victory haptics, and auto-complete habit log.

### 4. Tiered Clean Data & Vault Reset Dialog

- **Decision**: Add a dedicated **"Dữ liệu & Khôi phục / Data & Vault Reset"** card in Settings offering:
  1. _Khôi phục thói quen mẫu / Reset to Sample Habits_: Clears custom logs and restores 3 starter habits.
  2. _Xóa sạch toàn bộ dữ liệu / Complete Factory Wipe_: Purges all IndexedDB stores (`habits`, `logs`, `settings`, `vacations`) and resets to zero habits.
  - Both protected by accessible `role="alertdialog"` confirmation modals.

### 5. Interactive Habit Detail Deep-Dive Sheet

- **Decision**:
  - Header: Direct **✏️ Sửa / Edit** button and **📦 Lưu trữ / Archive** shortcut.
  - Action Bar: Direct 1-tap check-in, numeric step +/- or timer toggle inside sheet.
  - Interactive Mini-Heatmap: Tapping any day cell on the 365-day mini heatmap switches the active date for the Reflection Notes editor.
  - Schedule Summary Badge: Displays complete frequency rule and assigned routines.

---

## Consequences

### Positive

- PWA back button functions identically to native mobile apps without unexpected page exits.
- Clear visual active tab feedback in all lighting environments and themes.
- Intuitive minute-based timer setup with live card countdown feedback.
- Safe data reset and clean state management for privacy and testing.
- Full-featured detail sheet supporting immediate check-ins and reflection logging.

### Negative / Trade-offs

- Continuous second-by-second timer DOM updates require lightweight targeted element mutations to avoid re-rendering entire list containers.
