# 13. Streamlined Habits IA, Vertical Starter Kits, Drag-and-Drop Catalog Reordering, Unified Timer Formatting, Scoped Multi-Routine Expansion, and Date Ribbon Mobile Screen Fit

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: `habit-tracker`

---

## Context & Problem Statement

Following hands-on user feedback on the `Today` and `Habits` tabs of the `habit-tracker` PWA, several critical UX, information architecture, and behavioral defects were reported:

1. **Today Tab Date Ribbon Screen Fit**:
   - The 7-day horizontal date ribbon uses fixed `min-w-[52px]` buttons and `gap-2` (~412px total width), which causes horizontal scrolling and overflow on standard 360px–390px mobile screens instead of fitting cleanly within the viewport.
2. **Multi-Routine Card Expansion State Collision**:
   - When a habit is assigned to multiple routines (e.g. `Morning` and `Evening`), both rendered cards share identical DOM IDs (`#habit-card-${habit.id}`, `#habit-expand-${habit.id}`). Clicking the expand chevron on the Evening card mistakenly toggles the Morning card drawer because `document.getElementById` queries the first DOM match.
3. **Timer Display Format Fragmentation**:
   - Timer countdowns, durations, and labels are displayed inconsistently across widgets (e.g. `00p 05g / 20p 00g`, `00:05`, `12m 00s`, `+00:01`). A unified digital clock standard is required: `00:00` (MM:SS) when duration $\le 60$ minutes (3600s), and `00:00:00` (HH:MM:SS) when duration $> 60$ minutes.
4. **Habits Catalog Reorder Ergonomics**:
   - In `Habits` (`My Habits`), habits are currently reordered using discrete `▲` (`reorder-up`) and `▼` (`reorder-down`) buttons. Users requested removing these buttons and replacing them with fluid drag-and-drop reordering.
5. **Curated Starter Kits IA & Format Overhaul**:
   - The Curated Starter Kits horizontal carousel with `<` and `>` buttons needs to be converted into a vertical stacked list of full expanded cards displaying all habits.
   - The starter kit library needs to expand from 4 to 8 curated packs, adding Fitness & Strength, Lifelong Learning, Financial Discipline, and Sleep & Recovery.
6. **4 Core Life Pillars Migration to Insights Tab**:
   - The `4 Core Life Pillars` (Health, Mind, Craft, Discipline) currently live in the `Habits` tab under a segmented sub-view switcher (`My Habits` vs `Identity & Starter Kits`). Moving Life Pillars to the `Insights` tab unifies all quantitative performance metrics into one analytics hub and allows eliminating the sub-view switcher in `Habits`, streamlining the `Habits` tab into a single high-velocity page (Catalog + Vertical Starter Kits).

---

## Decision Drivers

- **Zero-Scroll Mobile Week Overview**: Ensure the 7-day date ribbon fits 100% of standard mobile viewports without horizontal scrolling.
- **Isolated Multi-Routine Expansion State**: Eliminate duplicate DOM IDs and ensure each routine card drawer operates independently.
- **Unified Clock Standard**: Apply `00:00` ($\le 60$m) and `00:00:00` ($> 60$m) format across all timer tickers, dials, and labels.
- **Fluid Catalog Reordering**: Provide tactile grip handle `⠿` with HTML5 drag-and-drop on desktop and touch-drag reordering on mobile.
- **Rich Starter Kit Catalog**: Offer 8 full-width vertical starter kits for instant 1-click habit pack activation.
- **Cohesive Analytics & Clean Habits Hub**: Move Life Pillars into `Insights` and simplify `Habits` into an uncluttered, single-page catalog.

---

## Considered Options & Decision Outcome

### Decision 1: Date Ribbon Mobile Viewport Fit (Today Tab)

- **Outcome**:
  - Replace fixed min-width buttons with a responsive 7-column flex/grid container (`grid grid-cols-7 gap-1 sm:gap-2 w-full`) with fluid padding and responsive typography (`text-[10px] sm:text-[11px]` for weekday label, `text-sm sm:text-base` for day number).
  - All 7 days fit 100% within 360px+ screen widths without horizontal scrollbars.

### Decision 2: Multi-Routine Scoped Card Expansion (Today Tab)

- **Outcome**:
  - Scope all habit card DOM elements by routine (e.g. `#habit-card-${routineKey}-${habit.id}`, `#habit-expand-${routineKey}-${habit.id}`, `#chevron-${routineKey}-${habit.id}`).
  - Resolve click actions using event delegation and DOM proximity (`target.closest('.habit-card')`), isolating expansion to the clicked routine instance.

### Decision 3: Unified Timer Format Standard (`00:00` vs `00:00:00`)

- **Outcome**:
  - Implement a standardized formatter `formatDurationClock(totalSeconds)` returning `MM:SS` when $\le 3600$s and `HH:MM:SS` when $> 3600$s.
  - Apply consistently across Habit Card tickers, Focus Timer Modal dial and subtitles, Floating Dynamic Island ticker, Bottom Dock mini-pill, Detail Sheet, and overtime tracking (`+MM:SS` / `+HH:MM:SS`).

### Decision 4: Habits Catalog Drag-and-Drop Reordering (Habits Tab)

- **Outcome**:
  - Remove `▲` and `▼` reordering buttons from habit cards in Manager view.
  - Add a visual grip handle `⠿` (`.drag-handle`) with `touch-action: none`.
  - Implement HTML5 Drag & Drop for desktop (`draggable="true"`, `dragstart`, `dragover`, `drop`, `dragend` with drop target indicators) and touch drag sorting for mobile devices with haptic feedback.
  - Persist updated habit ordering atomically to `store` and IndexedDB.

### Decision 5: Curated Starter Kits Vertical Expansion & Catalog Growth

- **Outcome**:
  - Eliminate the horizontal carousel container and `<` / `>` navigation buttons.
  - Render Starter Kits as full-width vertical stacked cards displaying all included habits, domain badges, and a 1-tap `⚡ Apply Kit` CTA.
  - Expand `STARTER_KITS` to 8 curated packs:
    1. `morning-mastery` (Morning Mastery)
    2. `deep-focus-flow` (Deep Focus & Flow)
    3. `health-vitality` (Health & Vitality)
    4. `zen-mindfulness` (Zen & Mindfulness)
    5. `fitness-strength` (Fitness & Strength)
    6. `lifelong-learning` (Lifelong Learning)
    7. `financial-discipline` (Financial Discipline)
    8. `sleep-recovery` (Sleep & Recovery)

### Decision 6: Move 4 Life Pillars to Insights Tab & Unify Habits Tab

- **Outcome**:
  - Relocate the `4 Core Life Pillars` (Health, Mind, Craft, Discipline) with adherence rings and habit counts to the `Insights` tab under an "Identity Pillars & Domain Balance" section.
  - Remove the segmented sub-view switcher (`#habits-subview-switcher`) from the `Habits` tab.
  - Unify the `Habits` tab into a single streamlined view: Habit Catalog (with drag-and-drop reordering) followed by the Vertical Curated Starter Kits section.

---

## Consequences

### Positive

- All 7 days on the Today tab fit seamlessly across every mobile screen size without horizontal scrolling.
- Multi-routine habits expand their respective cards without cross-routine interference.
- Sleek, uniform digital clock formatting throughout all timer controls and stats.
- Intuitive drag-and-drop habit reordering replaces clumsy individual button clicks.
- Users can explore 8 comprehensive starter packs vertically without horizontal scrolling friction.
- Insights becomes the complete single source of truth for analytics, while Habits becomes a focused management workspace.

### Negative

- Drag-and-drop event listeners require careful touch gesture management to prevent scrolling conflicts.
