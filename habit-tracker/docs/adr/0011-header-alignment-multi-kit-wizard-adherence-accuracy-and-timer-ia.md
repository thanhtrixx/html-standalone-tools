# 11. Header Alignment, Multi-Select Starter Kits, Adherence Invariants, and Timer IA

- **Status**: Accepted
- **Date**: 2026-09-16
- **Context**: `habit-tracker`

---

## Context & Problem Statement

Following user review and field testing of the `habit-tracker` application, four key functional and UX defects were identified:

1. **Header Vertical Alignment & Dead Code**:
   - The top navigation bar exhibited subtle vertical misalignment between the 32px (`w-8 h-8`) brand logo and right-hand badges (`#freeze-tokens-count`, `#lang-toggle-btn`) caused by unconstrained line-heights and disparate emoji font metrics (`🔥`, `🛡️`, `🇻🇳`).
   - Residual references to the deprecated `#header-active-timer-pill` remained in `src/app.js`, attempting DOM updates on non-existent elements.
2. **Single-Select Starter Kit Constraint in Setup Wizard**:
   - Step 3 of the 4-Step Setup Wizard only permitted selecting a single starter kit (`selectedKitId`), preventing users from adopting multi-faceted lifestyle routines (e.g. Morning Mastery + Deep Focus + Health) during onboarding.
3. **Day of Week Consistency 8% Calculation Flaw**:
   - In `src/domain/engine.js`, `calculateWeekdayAdherence` evaluated scheduled habit occurrences over a rolling 90-day window (`daysBack = 90`).
   - Because `isScheduledDate` only checked `habit.startDate` (which was undefined for newly created habits) instead of `habit.startDate || habit.createdAt`, every historical weekday occurrence over the past 90 days (~13 occurrences per weekday) was counted as a missed scheduled day.
   - Checking off all habits on day one produced $1 / 13 \approx 7.7\% \rightarrow 8\%$ adherence, severely distorting analytics and violating anti-guilt principles.
4. **Timer Display Duplication & Visual Redundancy**:
   - In `today-view.js`, the card subtitle contained `<span id="card-sub-ticker-${id}">${duration}</span> <span>/ ${target}</span>`. `updateTimerDom` in `src/app.js` populated `${duration} / ${target}` into the span, producing duplicate strings (`"00:05 / 20m / 20m"`).
   - In the expanded habit card drawer, the exact same `${duration} / ${target}` text was rendered redundantly alongside the Play/Pause button.
   - The Focus Timer modal dial presented redundant stacked target indicators across header, dial, and subtitle.

---

## Decision Drivers

- **Mathematical Truth & Anti-Guilt Invariants**: Never schedule or penalize habits for calendar dates preceding their creation date (`habit.startDate || habit.createdAt`).
- **Frictionless Onboarding**: Enable multi-kit routine assembly in the Setup Wizard without duplicate habit conflicts.
- **Visual & Typographic Precision**: Maintain strict 32px height parity, line-height normalization, and vertical centering across top header elements.
- **Streamlined Information Architecture**: Clean, uncluttered timer feedback across cards, floating island, and immersive focus modal.

---

## Considered Options & Decision Outcome

### Decision 1: Header Vertical Alignment & Dead Code Purge (Slice 1)

- **Outcome**:
  - Enforce fixed 56px (`h-14`) header container with `flex items-center justify-between`.
  - Standardize all interactive badges and logo container to `h-8` (32px) touch targets with `inline-flex items-center justify-center leading-none`.
  - Normalize emoji baseline shifts via flex centering and optical padding.
  - Purge all references to `#header-active-timer-pill` in `src/app.js` and sync DOM reactivity exclusively to `#floating-timer-island` and `#dock-active-timer-pill`.

### Decision 2: Multi-Select Starter Kits in Setup Wizard with Disambiguation (Slice 2)

- **Outcome**:
  - Refactor Step 3 in `src/ui/identity-view.js` to support multi-select toggle cards (checkbox style) storing `selectedKitIds` (array of selected kit IDs).
  - Step 4 aggregates habits across all selected kits. If identical habit names exist across different kits, append numbered disambiguation suffixes (e.g. "Read 15m (1)", "Read 15m (2)").
  - Update `store.applyStarterKits(kitIds, lang)` in `src/state/store.js` to apply all selected kits in a single atomic transaction.

### Decision 3: Mathematical Invariant Fix for Adherence & Consistency (Slice 3)

- **Outcome**:
  - Update `isScheduledDate(habit, dateStr)` in `src/domain/engine.js` to verify:
    $$\text{dateStr} \ge \text{toDateString}(\text{habit.startDate} \lor \text{habit.createdAt})$$
    Days prior to habit inception are strictly **unscheduled**.
  - In `calculateWeekdayAdherence`, calculate scheduled occurrences only within the habit's active lifetime (bounded by `min(daysBack, daysSinceCreation)`). If scheduled count is 0, return 0% adherence with empty visual styling.
  - Apply the same start-date invariant to `calculateOverallConsistencyScore` and `calculateRoutineAdherence`.

### Decision 4: Holistic Timer Display Architecture & Duplication Elimination (Slice 4)

- **Outcome**:
  - **Habit Card (Collapsed)**: Render clean duration progress (`⏱️ 05:00 / 20m`) with single reactive text insertion, fixing duplicate `/ 20m` string concatenation.
  - **Habit Card (Expanded Drawer)**: Remove redundant static text ticker; feature streamlined action controls: `[▶ Start / ⏸ Pause]`, `[🔄 Reset]`, `[🎯 Focus Mode]`, `[Details ➔]`.
  - **Floating Dynamic Island**: Maintain persistent floating controller showing `[Icon + Name]`, `[Elapsed / Target]`, `[Progress Bar]`, and `[Play/Pause]`.
  - **Focus Timer Modal**: Primary center dial displays prominent active countdown/elapsed digits (`15:00`), circular SVG progress ring, quick +/- 1m / 5m steppers, and harmonic audio feedback.

---

## Consequences

### Positive

- Header alignment is pixel-perfect across browsers and devices.
- New users can adopt rich multi-domain habits (e.g. 10 habits across 3 starter packs) seamlessly during setup.
- Analytics, consistency scores, and weekday charts reflect 100% mathematical integrity on day one.
- Timer UI is uncluttered and eliminates all duplicate text artifacts.

### Negative

- Multi-kit selection requires managing array state in wizard navigation.
