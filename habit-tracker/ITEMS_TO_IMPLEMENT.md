# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and vertical slice backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🚀 Streamlined Navigation & Checkbox-First Roadmap (ADR-0006)

### Slice 1: Shell & Navigation Streamlining

- [x] Remove `#top-lens-switcher` sub-header bar from `index.html`, `src/app.js`, and `src/ui/components.js`.
- [x] Update bottom navigation dock to clean 4-tab layout: `Today` (🔥), `Insights` (📊), `Habits` (🎯), `Settings` (⚙️).
- [x] Remove the redundant `+` button from the bottom navigation dock.
- [x] Reposition Quick Add habit action to an ergonomic floating action button / view header action.
- [x] Ensure 100% bilingual (VI/EN) dictionary parity for all navigation labels and tooltips.

### Slice 2: Checkbox-First Habit Cards & Inline Expandable Modality

- [x] Refactor `renderHabitCard` in `src/ui/today-view.js` to present a clean, uniform 1-tap checkbox for all habit types.
- [x] Binary habits: 1-tap checkbox toggles completion ($0 \leftrightarrow 1$) with tactile spring animation and domain glow.
- [x] Numeric & Timer habits: 1-tap checkbox marks 100% target completion; card body tap smoothly unfolds an inline expanded drawer/accordion.
- [x] Inline expanded panel for Numeric habits: Rapid `+` / `-` steppers, unit label, and direct value input.
- [x] Inline expanded panel for Timer habits: Live ticking duration, Play/Pause toggle, and Reset button.

### Slice 3: Reactive Timer Engine Overhaul (PWA-Timer Standard)

- [x] Implement inline Web Worker ticker in `src/app.js` with exact elapsed timestamp delta calculation (`Date.now() - startedAt`).
- [x] Add reactive sub-second DOM updates for active card duration, progress ring, and header pill without heavy disk I/O.
- [x] Implement throttled IndexedDB persistence (every 10s, upon pause, upon completion, and on `visibilitychange`/`pagehide`).
- [x] Trigger Web Audio harmonic chime, celebratory particle confetti, and Web Notification upon reaching target duration.
- [x] Integrate Screen Wake Lock API when timer is actively ticking.

### Slice 4: Progressive Identity Onboarding Wizard & Life Pillars in Habits Hub

- [x] Implement a 3-step First-Run Identity Setup Wizard modal introducing life domains (Health, Mind, Craft, Discipline) and 1-Click Starter Kits.
- [x] Integrate Life Domain alignment cards and Starter Kit activation into the `Habits` catalog tab as a sub-feature.
- [x] Allow seamless catalog reordering, domain filtering, archiving, and editing.

### Slice 5: Insights & Analytics View Consolidation

- [x] Consolidate matrix and stats views into the unified `Insights` tab: 52-week GitHub-style heatmap, 0-baseline weekday adherence, streak milestones, and domain balance.
- [x] Optimize tabular numerals and mobile typography hierarchy per Impeccable standards.

### Slice 6: Test Suite Overhaul & Verification

- [x] Update `tests/habit-tracker-ui-components.test.js` to assert the 4-tab dock, checkbox-first card interactions, accordion expansions, reactive timer ticks, and identity onboarding wizard.
- [x] Ensure 100% test pass on `npm run test:habit`.
- [x] Verify zero regressions across `npm run verify`.

---

## 🎨 Impeccable Critique Remediation Roadmap (Issue #504)

### Slice 1: Visual Polish & Obsidian Glow Token Homogenization

- [x] Fix PWA update banner WCAG AA contrast (upgraded to 7.95:1 AAA with `text-slate-950 font-semibold` on `bg-emerald-500`).
- [x] Eliminate `border-left: 4px solid ...` side-tab artifacts in `src/ui/identity-view.js` in favor of ambient glow/border rings.
- [x] Harmonize KPI card heading colors with Obsidian Glow domain tokens (`amber-500` / emerald / cyan).
- [x] Clean header branding: removed legacy PRO badge, elevated subtitle micro-typography to $\ge 11\text{px}$.
- [x] Standardize `#0b0f19` dark canvas and frosted glassmorphism card surfaces.
- [x] Interactive live polish: Country flag emoji language switcher (`🇻🇳` / `🇺🇸`) with instant 1-tap toggling and accessibility tooltips.
- [x] Bottom navigation dock active tab indicator polish (clean luminous pill without dot icon artifacts).

### Slice 2: Desktop Keyboard Ergonomics & Accessibility (P0)

- [x] Global `Escape` key listener in `src/app.js` to dismiss all active modals/sheets (`#habit-edit-modal-overlay`, `#detail-sheet-overlay`, `#identity-wizard-overlay`, `#habit-delete-modal-overlay`).
- [x] Focus trap and focus restoration for modal dialogs.
- [x] Desktop hotkeys: `1-4` (tabs), `N` (new habit), `T` (jump to today).

### Slice 3: Habits Tab IA & Card Action Decluttering (P1)

- [x] Implement segmented sub-view switcher in `Habits` tab (`#habits-subview-switcher`):
  - **Tab 1: `My Habits (Danh mục)`**: Displays routine clusters and active habit management cards.
  - **Tab 2: `Identity & Starter Kits (Hệ giá trị & Gợi ý)`**: Displays 4 Life Domain identity rings and a compact horizontal starter kit carousel.
- [x] Convert Starter Kits into a responsive horizontal scroll carousel with 1-click preview and install modal.
- [x] Consolidate Manager Card action bar in `src/ui/manager-view.js`:
  - Primary `✏️ Edit` button with high-contrast label and $\ge 40\text{px}$ touch target.
  - Generous `▲` / `▼` priority reordering arrows ($\ge 40\text{px}$) with explicit `aria-label`s.
  - Consolidated `••• More` action popover/menu containing `📦 Archive` and `🗑️ Delete` with safety guardrails.

### Slice 4: Habit Creation Modal Progressive Disclosure (P1)

- [x] Restructure Add/Edit Habit Modal (`#habit-edit-modal-overlay`) into 2-stage progressive disclosure:
  - **Stage 1 (Basic Ritual)**: Habit Name, interactive Popover Emoji Trigger (`#habit-emoji-popover-trigger`), Measurement Type (Binary / Numeric / Timer), Target Value & Unit, and 1-tap "Save Immediately" (using sensible defaults) / "Next: Schedule" button.
  - **Stage 2 (Schedule & Theme)**: Multi-routine selector, Weekday schedule chips, Domain color theme picker, Daily reminder time, and "Save Habit" button.
- [x] Collapse 16-emoji grid into an interactive popover picker that opens upon clicking the emoji trigger button and auto-dismisses on emoji selection or outside click.
- [x] Add full bilingual translation parity in `src/i18n/translations.js` for all stage tabs, picker buttons, and context menu actions.

### Slice 5: Safety & Interaction Polish

- [x] Add floating undo toast upon habit deletion (`undoDeleteHabit`).
- [x] Increase light mode date ribbon border contrast to `#cbd5e1`.
- [x] Dismiss heatmap cell tooltip on outside click.
- [x] Manager View action buttons updated with touch dimensions $\ge 44\text{px}$ and explicit `aria-label`s.

---

## 🧪 Verification & DoD Gate

- [x] Scoped unit & UI component tests pass with 100% assertions: `npm run test:habit`.
- [x] Multi-device Playwright E2E scenarios pass: `npm run test:e2e:habit`.
- [x] Outer repository gate clean: `npm run verify`.
