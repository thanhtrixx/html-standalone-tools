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

## ⏱️ Focus Timer Engine, Identity Wizard Gateway & Modal Layering (ADR-0008)

### Slice 1: Timer Engine Resilience & CSP Worker Repair

- [x] Update `index.html` Content-Security-Policy to include `worker-src 'self' blob:;` and ensure inline Web Worker creation is allowed.
- [x] Harden `startTimerTicker()` in `src/app.js` with foolproof fallback to `setInterval` if worker instantiation or message dispatch fails.
- [x] Implement timestamp delta calculation `Math.floor((Date.now() - startedAt) / 1000)` with sub-second DOM reactivity and zero dropped ticks across background tab sleep / lock screen.
- [x] Integrate Screen Wake Lock API (`navigator.wakeLock`) management: acquire on start, release on pause/stop/finish.
- [x] Web Audio harmonic sine chime and celebration confetti on reaching target duration with hybrid overtime count-up (+00:01, +00:02...).

### Slice 2: Immersive Focus Timer Modal & Ambient Controls

- [x] Add `#focus-timer-modal-overlay` container to `index.html` and implement `renderFocusTimerModal` in `src/ui/today-view.js` / `src/app.js`.
- [x] Large reactive SVG circular progress dial with remaining/elapsed countdown toggle.
- [x] Quick time adjuster buttons: `+1m`, `+5m`, `-1m` with instant target/time update.
- [x] Play, Pause, and Reset controls with domain glow background bloom and sound chime toggle.
- [x] Ambient header pill (`#header-active-timer-pill`) and dock pill (`#dock-active-timer-pill`) click action opens the Focus Timer modal.

### Slice 3: Empty State Gateway & Post-Wipe Wizard Auto-Launch

- [x] Enhance empty state on `Today` view when `habits.length === 0` to display dual CTAs: Primary `✨ Thiết lập Bản Sắc (3-Step Identity Wizard)` and Secondary `+ Thêm thói quen thủ công`.
- [x] Enhance empty state on `Habits` catalog view (`src/ui/manager-view.js` and `src/ui/identity-view.js`) when `habits.length === 0` with both Identity Wizard and Add Habit buttons.
- [x] Update `confirmFactoryWipe()` in `src/app.js` to clear data, navigate to `Today` tab, and immediately auto-launch the Identity Setup Wizard modal.

### Slice 4: Shell Decluttering, Modal Layering Fix & Test Verification

- [x] Remove `#floating-quick-add-btn` from `index.html` and clean up unused code in `src/app.js`.
- [x] Remove subtitle `Obsidian Glow • Offline-First` from header in `index.html`.
- [x] Fix modal stacking hierarchy: elevate `#habit-edit-modal-overlay` and `#focus-timer-modal-overlay` to `z-[60]` so opening Edit Habit from within Detail Sheet (`z-50`) renders cleanly on top.
- [x] Update unit and UI component test suites in `tests/habit-tracker-ui-components.test.js` and `tests/habit-tracker-engine-math.test.js` to assert Focus Timer, empty state CTAs, and modal z-index invariants.
- [x] Ensure 100% assertions pass on `npm run test:habit` and `npm run verify`.

---

## ⚡ Header Alignment, Insights Accuracy, Language-First Setup Wizard & Floating Timer Dynamic Island (ADR-0009)

### Slice 1: Header Vertical Alignment & Badge Standardization (P0)

- [x] Standardize header container in `index.html` and `src/app.js`: brand logo box (`w-8 h-8` / 32px), title text, freeze token badge (`#freeze-tokens-count`), and language toggle (`#lang-toggle-btn`) all vertically centered with `h-8` (32px) touch targets.
- [x] Fix baseline alignment across text labels and emojis (`🇻🇳`, `🛡️`) with flex centering and normalized font metrics.
- [x] Eliminate top-header timer pill (`#header-active-timer-pill`) in favor of the floating island above dock.

### Slice 2: Insights Analytics Formulas, Data Corrections & Test Seams (P0)

- [x] Fix `calculateStreakAndConsistency` in `src/domain/engine.js`: ensure freeze tokens are never consumed when `currentStreak === 0` or `tempStreak === 0`, preventing false streaks on inactive habits.
- [x] Implement `calculateOverallConsistencyScore(habits, logs, daysBack, refDate)` in `src/domain/engine.js` calculating true global scheduled adherence across all habits.
- [x] Update `renderInsightsView` in `src/ui/insights-view.js` to use `calculateOverallConsistencyScore` for 30d and 90d metrics.
- [x] Fix missing i18n key `heatmap_subtitle` in `src/i18n/translations.js`.
- [x] Remove duplicate `<h2>` headers in `src/ui/identity-view.js` and `src/ui/manager-view.js`.
- [x] Fix date ribbon active item calculation in `tests/habit-tracker-ui-components.test.js` / `src/ui/today-view.js` to be independent of execution date.

### Slice 3: 4-Step Language-First Identity Setup Wizard (P1)

- [x] Refactor `renderIdentityWizardModal` in `src/ui/identity-view.js` into 4 distinct progressive steps:
  - Step 1: Language Selection (`🇻🇳 Tiếng Việt` vs `🇺🇸 English`) with immediate reactive UI translation and storage persistence.
  - Step 2: 4 Life Pillars introduction (`Health`, `Mind`, `Craft`, `Discipline`).
  - Step 3: Curated Starter Kits selection.
  - Step 4: Confirmation & 1-tap activation.
- [x] Update wizard stepper navigation indicators (1 to 4) and back/next footer buttons.
- [x] Add bilingual copy for all wizard step titles, descriptions, and language option cards in `src/i18n/translations.js`.

### Slice 4: Impeccable Timer UI/UX & Floating Dynamic Mini-Player (P1)

- [x] Update timer labels: change `Start Timer` / `Bắt đầu hẹn giờ` to `Start` / `Bắt đầu` (`Pause` / `Tạm dừng`) in `src/i18n/translations.js` and `src/ui/today-view.js`.
- [x] Declutter habit card timer interface: remove redundant subtitles, provide clean single ticker row in expanded drawer (`[ ▶ Start / ⏸ Pause ]`, `[ 🔄 Reset ]`, `12:00 / 20:00`, `[ 🎯 Focus Mode ]`, `[ Details ➔ ]`).
- [x] Implement Floating Dynamic Timer Island (`#floating-timer-island`) anchored above the bottom dock (`bottom-20` / `z-40`) in `index.html` and `src/app.js`:
  - Renders habit icon, name, live countdown ticker, mini progress track, and 1-tap Play/Pause toggle.
  - Tapping the island body opens the Focus Timer Modal.
  - Hidden when timer is stopped/idle; appears reactively on timer start.

### Slice 5: Automated Verification & Lightpanda Smoke Suite Gating (P0)

- [x] Add unit tests in `tests/habit-tracker-engine-math.test.js` verifying 0-streak freeze token resilience, best streak isolation, and 30d/90d aggregate consistency math.
- [x] Update `tests/habit-tracker-lightpanda-smoke.test.js` to verify header height standardization, 4-step wizard language selection, floating timer island reactivity, and Insights accuracy.
- [x] Verify 100% test pass on `npm run test:habit` and `npm run verify`.

---

## 🧪 Verification & DoD Gate

- [x] Scoped unit & UI component tests pass with 100% assertions: `npm run test:habit`.
- [x] Multi-device Playwright E2E scenarios pass: `npm run test:e2e:habit`.
- [x] Outer repository gate clean: `npm run verify`.
