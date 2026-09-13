# ADR-0007: Obsidian Glow Visual Polish, Keyboard Ergonomics, and IA Decluttering

- **Status:** Accepted
- **Date:** 2026-09-13
- **Deciders:** Engineering & UX Agent, Project Lead
- **Related Issues:** #504, #473, #491
- **Consulted Skills / Critiques:** `grill-wow`, `.impeccable/critique/2026-09-13T07-25-51Z__habit-tracker.md`

---

## 1. Context & Problem Statement

Following the Impeccable Design Critique (`.impeccable/critique/2026-09-13T07-25-51Z__habit-tracker.md`), the Atomic Habit & Routine Tracker scored **33/40 (Grade: B+)** with 100% functional test pass rate. The critique identified key ergonomic, legibility, and architectural refinement vectors:

1. **Habits Tab Cognitive Overload (Heuristic #8)**: Rendering 4 Life Domain rings, 4 full Starter Kit cards, and the entire routine catalog in a single vertical scroll caused cognitive congestion and activation friction.
2. **Manager Card Micro-Button Crowding (Heuristic #5)**: Each habit card in the Manager view packed 5 micro-buttons (`▲`, `▼`, `✏️`, `📦`, `🗑️`) into a cramped bar, presenting a mis-tap hazard on touch screens.
3. **Habit Creation Modal Overload (Heuristic #6)**: Exposing 8+ simultaneous inputs (Name, 16 Emojis, Type, Target, Unit, Step, 4 Routines, Frequency, Days, Colors, Reminder Time) created choice paralysis during initial habit creation.
4. **Desktop Keyboard Ergonomics (Heuristic #7)**: Modals lacked `Escape` key dismissal and focus restoration, and desktop users lacked quick tab/action hotkeys (`1-4`, `N`, `T`).
5. **Token Homogenization & WCAG AAA Contrast (Heuristic #4)**: PWA update banner text required contrast elevation, and side-tab artifacts needed replacement with ambient Obsidian Glow tokens.

---

## 2. Decision Drivers

- **Miller's Law ($\le 4$ working memory chunks)**: Habit management must be instant, separating catalog actions from exploratory identity pillars.
- **Touch Ergonomics**: All interactive touch targets must meet or exceed $\ge 40\text{px}$ with clear touch boundaries.
- **WCAG 2.1 AA / AAA Accessibility**: Universal `Escape` dismissal, focus trapping, high contrast ($\ge 4.5:1$ text contrast, $\ge 7:1$ on banners), and desktop hotkeys.
- **Obsidian Glow Design Identity**: Seamless adherence to `#0b0f19` canvas, frosted glassmorphism surfaces (`rgba(19, 28, 49, 0.75)`), and luminous emerald/cyan/amber accents.
- **Zero Regression**: 100% test pass rate across unit, smoke, i18n, and multi-device E2E suites.

---

## 3. Considered Options & Decision Outcome

### Decision 1: Habits Tab Information Architecture

- **Option A (Chosen)**: **Segmented Sub-View Switcher (`My Habits / Danh mục` vs `Identity & Starter Kits / Hệ giá trị & Gợi ý`)**. Default to `My Habits` for swift daily management, with a top segment control switching to Identity Domains and horizontal Starter Kit carousel.
- **Option B**: Hide Starter Kits when $\ge 3$ habits exist.
- **Option C**: Accordion collapsible sections on a single scroll.

### Decision 2: Manager Card Action Bar Consolidation

- **Option A (Chosen)**: **Primary Edit + Reorder Arrows + `•••` Context Menu**. Expose `✏️ Edit` and $\ge 40\text{px}$ `▲`/`▼` reorder arrows directly on the card; move secondary/destructive actions (`📦 Archive` and `🗑️ Delete`) into an accessible `•••` context popover.
- **Option B**: Swipe actions on mobile + hover row on desktop.
- **Option C**: Dedicated 'Organize Mode' toggle.

### Decision 3: Add/Edit Habit Modal Progressive Disclosure

- **Option A (Chosen)**: **2-Stage Progressive Form + Popover Emoji Picker**.
  - **Stage 1 (Basic Ritual)**: Name, interactive 1-tap popover Emoji trigger, Measurement Type, Target/Unit with a 1-tap "Save Immediately" option using sensible defaults.
  - **Stage 2 (Schedule & Theme)**: Routines, Weekdays, Color Glow Theme, Reminder Time.
- **Option B**: Collapsible accordion for advanced settings.
- **Option C**: 3-tab modal dialog.

### Decision 4: Delivery Strategy

- **Option A (Chosen)**: Single cohesive Tier 1 PR (#504) covering all 5 slices with complete unit and E2E regression suites.

---

## 4. Consequences

### Positive

- Drastically reduced cognitive load and visual clutter across the `Habits` tab and `Add Habit` modal.
- Eradicated mis-tap hazards by replacing cramped 5-button rows with primary edit/reorder and safe `•••` action sheets.
- Full desktop keyboard navigation (`1-4`, `N`, `T`, `Esc`) elevates desktop power-user efficiency.
- WCAG AA / AAA compliance achieved across dark and light colorways.

### Negative / Trade-offs

- Adding a popover emoji picker and 2-stage form requires a few extra DOM event handlers and bilingual strings.
