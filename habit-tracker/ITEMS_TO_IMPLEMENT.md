# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and vertical slice backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🚀 Streamlined Navigation & Checkbox-First Roadmap (ADR-0006)

### Slice 1: Shell & Navigation Streamlining
- [ ] Remove `#top-lens-switcher` sub-header bar from `index.html`, `src/app.js`, and `src/ui/components.js`.
- [ ] Update bottom navigation dock to clean 4-tab layout: `Today` (🔥), `Insights` (📊), `Habits` (🎯), `Settings` (⚙️).
- [ ] Remove the redundant `+` button from the bottom navigation dock.
- [ ] Reposition Quick Add habit action to an ergonomic floating action button / view header action.
- [ ] Ensure 100% bilingual (VI/EN) dictionary parity for all navigation labels and tooltips.

### Slice 2: Checkbox-First Habit Cards & Inline Expandable Modality
- [ ] Refactor `renderHabitCard` in `src/ui/today-view.js` to present a clean, uniform 1-tap checkbox for all habit types.
- [ ] Binary habits: 1-tap checkbox toggles completion ($0 \leftrightarrow 1$) with tactile spring animation and domain glow.
- [ ] Numeric & Timer habits: 1-tap checkbox marks 100% target completion; card body tap smoothly unfolds an inline expanded drawer/accordion.
- [ ] Inline expanded panel for Numeric habits: Rapid `+` / `-` steppers, unit label, and direct value input.
- [ ] Inline expanded panel for Timer habits: Live ticking duration, Play/Pause toggle, and Reset button.

### Slice 3: Reactive Timer Engine Overhaul (PWA-Timer Standard)
- [ ] Implement inline Web Worker ticker in `src/app.js` with exact elapsed timestamp delta calculation (`Date.now() - startedAt`).
- [ ] Add reactive sub-second DOM updates for active card duration, progress ring, and header pill without heavy disk I/O.
- [ ] Implement throttled IndexedDB persistence (every 10s, upon pause, upon completion, and on `visibilitychange`/`pagehide`).
- [ ] Trigger Web Audio harmonic chime, celebratory particle confetti, and Web Notification upon reaching target duration.
- [ ] Integrate Screen Wake Lock API when timer is actively ticking.

### Slice 4: Progressive Identity Onboarding Wizard & Life Pillars in Habits Hub
- [ ] Implement a 3-step First-Run Identity Setup Wizard modal introducing life domains (Health, Mind, Craft, Discipline) and 1-Click Starter Kits.
- [ ] Integrate Life Domain alignment cards and Starter Kit activation into the `Habits` catalog tab as a sub-feature.
- [ ] Allow seamless catalog reordering, domain filtering, archiving, and editing.

### Slice 5: Insights & Analytics View Consolidation
- [ ] Consolidate matrix and stats views into the unified `Insights` tab: 52-week GitHub-style heatmap, 0-baseline weekday adherence, streak milestones, and domain balance.
- [ ] Optimize tabular numerals and mobile typography hierarchy per Impeccable standards.

### Slice 6: Test Suite Overhaul & Verification
- [ ] Update `tests/habit-tracker-ui-components.test.js` to assert the 4-tab dock, checkbox-first card interactions, accordion expansions, reactive timer ticks, and identity onboarding wizard.
- [ ] Ensure 100% test pass on `npm run test:habit`.
- [ ] Verify zero regressions across `npm run verify`.
