# ADR 0003: Native Mobile Gestures, Background Timer Delta Sync, Multi-Routine Architecture, and Statistical Zero-Baseline

- **Status**: Accepted
- **Date**: 2026-09-12
- **Context**: `habit-tracker`
- **Lifecycle Phase**: `Active Feature Development`

---

## Context & Problem Statement

User feedback gathered during the Active Feature Development phase of `habit-tracker` identified 7 key functional and ergonomic requirements:

1. **Tab Swipe Navigation**: Seamless horizontal gesture navigation across the 4 primary tabs (`Today` ⇄ `Insights` ⇄ `Habits` ⇄ `Settings`).
2. **Native Back Navigation**: Interception of browser/hardware back button with tiered hierarchy (dismiss overlays $\rightarrow$ return to Today $\rightarrow$ "Press back again to exit" toast).
3. **Screen-Off Timer Pausing Defect**: Web browser `setInterval` throttling when locking screen or backgrounding apps causes timers to lose count and fail target alarms.
4. **Multi-Routine Habit Support**: Users need single habits (e.g. _Walking_) assigned across multiple circadian routines (e.g. Morning 🌅 and Evening 🌙) with shared daily target progress.
5. **Historical 100% Baseline Flaw**: Empty historical records and zero-scheduled days previously computed to `100%` consistency, distorting analytics when starting new habits.
6. **Add / Edit Form UX Modernization**: Need for live preview cards, multi-routine chip selectors, segmented habit types, and streamlined schedule inputs.
7. **Reliable Daily Reminders in Offline PWA**: Elimination of fragile in-memory `setTimeout` in favor of a hybrid notification permission flow and ambient reminders.

---

## Decision Drivers

1. **Native App Ergonomics**: Provide tactile swipe-to-switch tabs and double-back exit UX matching native mobile applications.
2. **Mathematical Precision**: Timers and historical consistency formulas must maintain exact real-world truth regardless of app visibility or missing past records.
3. **Flexible Circadian Routines**: Support habits naturally performed at multiple times of day without duplicating habit entities.
4. **Zero Runtime Dependencies & Standalone PWA Architecture**: Maintain 100% offline-first local storage and standard Web APIs without external server dependencies.
5. **Two-Speed Verifiability**: Implement through verifiable vertical slices with inner-loop test coverage.

---

## Considered Options & Decision Outcomes

### 1. Tab Swipe Gestures (Decision: View-level Swipe with Card Disambiguation)

- **Outcome**: View-level touch event listener on container/margins calculating horizontal $\Delta X$ vs vertical $\Delta Y$. Card-level touch handlers (`habit-card`) maintain `stopPropagation()` / priority flag so card swipe-to-complete and sheet-open gestures operate without accidental tab switches.

### 2. Native Back Button Navigation (Decision: Tiered popstate Hook with 2s Double-Back Exit)

- **Outcome**: Manage browser history state via `history.pushState({ app: 'habit-tracker', tab: activeTab }, '')`.
  - Level 1: Open Modals / Sheets / Delete Confirmations close first (`e.preventDefault()`).
  - Level 2: Active tab $\neq$ `'today'` switches to `'today'`.
  - Level 3: Active tab $==$ `'today'` at root triggers a 2-second toast _"Nhấn back lần nữa để thoát / Press back again to exit"_. Second back within 2000ms allows default history back / exit.

### 3. Background & Screen-Off Timer (Decision: Timestamp Delta Sync + Page Visibility + Worker)

- **Outcome**: Store active timer state `{ habitId, date, startedAt: Date.now(), baseValue: log.value }`. On `document.visibilitychange` / `window.focus` or timer tick, calculate `currentValue = baseValue + Math.floor((Date.now() - startedAt) / 1000)`. If `currentValue >= targetValue`, trigger completion state, update store, and chime.

### 4. Multi-Routine Data Model (Decision: `routines: string[]` with Shared Daily Target)

- **Outcome**: Schema updated to `routines: ['morning', 'evening']` (silent migration wraps legacy `routine: 'morning'` $\rightarrow$ `routines: ['morning']`). In Today and Catalog views, habit renders in all assigned routine sections. Checking in on any section updates the shared daily log value for that date.

### 5. Historical Adherence Zero Baseline (Decision: 0% on Zero Scheduled Days)

- **Outcome**: `calculateStreakAndConsistency`, `calculateWeekdayAdherence`, and `calculateRoutineAdherence` return `0%` when `scheduledCount === 0` or no historical logs exist.

### 6. Add/Edit Habit Form UX (Decision: Live Interactive Preview & Multi-Routine Chips)

- **Outcome**: Add/edit modal features real-time interactive preview card, multi-routine selectable toggle chips, segmented measurement selector (`✓ Binary`, `🔢 Numeric`, `⏱️ Timer`), and dynamic schedule fields.

### 7. Hybrid Daily Reminders (Decision: Notification Permission Banner + In-App Ambient Alerts)

- **Outcome**: Direct permission request banner in Settings, Service Worker notification scheduling on startup, and ambient in-app reminder pill for pending habits during reminder windows.

---

## Consequences

### Positive

- High-fidelity native mobile ergonomics with fluid tab swiping, back-button safety, and real-time form preview.
- 100% accurate time tracking surviving screen lock, tab switches, and app backgrounding.
- Accurate statistics reflecting honest zero-baseline progress for new habits and uncompleted weekdays.
- Seamless multi-routine scheduling without data duplication.

### Negative / Trade-offs

- Multi-routine habits rendered multiple times on the same dashboard require synchronized DOM element updates when one instance is checked or incremented.
