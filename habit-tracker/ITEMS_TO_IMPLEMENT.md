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

## ♿ WCAG AA Accessibility, Touch Targets & Codebase Distillation (ADR-0010)

### Slice 1: WCAG AA Accessibility, Reduced Motion & Modal Focus Trap (P1)

- [x] Add `@media (prefers-reduced-motion: reduce)` in `index.html` to suppress confetti particle canvas bursts in favor of a subtle toast, pause `animate-ping` pulses on the running timer, and eliminate scale transforms.
- [x] Add `role="tablist"` to the bottom navigation dock and `role="tab"`, `aria-selected="true|false"`, `aria-controls="main-content"` to all tab buttons in `index.html`.
- [x] Add `role="checkbox"`, dynamic `aria-checked="true|false"`, and localized `aria-label` to habit completion buttons in `src/ui/today-view.js`.
- [x] Add `aria-expanded="true|false"` and `aria-controls="habit-drawer-${id}"` to habit card expand accordion triggers.
- [x] Implement centralized focus trap utility in `src/ui/components.js` (`trapFocus(modalEl)` / `releaseFocus()`), restoring focus on modal dismiss across all 6 modal/sheet surfaces.
- [x] Add unit and DOM tests in `tests/habit-tracker-ui-components.test.js` validating ARIA attributes, keyboard focus trapping, and reduced motion styles.

### Slice 2: Mobile Touch Ergonomics & Micro-Typography Normalization (P2)

- [x] Ensure all interactive buttons (habit reorder arrows, card context triggers, accordion chevrons, date ribbon pills) enforce $\ge 44\times 44\text{px}$ hitboxes via `min-w-[44px] min-h-[44px]` containers or transparent padding.
- [x] Normalize all `text-[10px]` sub-caption font sizes across UI views (`today-view.js`, `insights-view.js`, `manager-view.js`, `identity-view.js`) to `text-[11px]` (micro ramp token per `DESIGN.md`) or `text-xs` (12px) with `tracking-wider`.
- [x] Verify typography and touch target assertions pass in `tests/habit-tracker-ui-components.test.js`.

### Slice 3: Codebase Distillation & Theme Token Unification (P2/P3)

- [ ] Verify all 52-week heatmap, consistency rate, and completion velocity analytics are fully contained in `src/ui/insights-view.js`.
- [ ] Delete orphaned legacy view files `src/ui/timeline-view.js` and `src/ui/matrix-view.js`.
- [ ] Remove legacy script imports (`timeline-view.js`, `matrix-view.js`) from `index.html` and router fallback branches from `src/app.js`.
- [ ] Unify `index.html` body background to use `bg-[var(--bg-base)]` / `#0b0f19` obsidian token.
- [ ] Re-run `.agent/skills/impeccable/scripts/impeccable detect` and verify 0 design detector errors/warnings.

---

## 🎯 Header Alignment, Multi-Kit Wizard, Adherence Invariants & Timer IA (ADR-0011)

### Slice 1: Header Vertical Alignment & Dead-Code Purge (P1)

- [ ] Standardize top header bar in `index.html`: `h-14` (56px) flex container with `items-center justify-between`.
- [ ] Standardize brand logo container (`w-8 h-8`), title text, freeze token badge (`#freeze-tokens-count`), and language toggle (`#lang-toggle-btn`) with `h-8` (32px) height and `inline-flex items-center justify-center leading-none`.
- [ ] Purge all deprecated `#header-active-timer-pill` references in `src/app.js`.

### Slice 2: Multi-Select 1-Click Starter Kits in Setup Wizard (P1)

- [ ] Refactor Step 3 in `src/ui/identity-view.js` to support multi-select toggle cards (checkbox style) tracking `selectedKitIds` array.
- [ ] Update Step 4 review to aggregate habits across all selected packs, applying numbered suffixes (e.g. `Read 15m (1)`, `Read 15m (2)`) for colliding habit names.
- [ ] Implement `store.applyStarterKits(kitIds, lang)` in `src/state/store.js` and handle atomic batch creation in `src/app.js`.

### Slice 3: Invariant Start-Date Scheduling & Weekday Adherence Accuracy (P0)

- [ ] Update `isScheduledDate` in `src/domain/engine.js`: enforce `dateStr >= (habit.startDate || habit.createdAt)` so historical dates before habit inception are strictly unscheduled.
- [ ] Update `calculateWeekdayAdherence` in `src/domain/engine.js` to bound scheduled counts to the habit's active lifetime, eliminating the 8% calculation bug.
- [ ] Apply inception date invariant across `calculateRoutineAdherence` and `calculateOverallConsistencyScore`.
- [ ] Update `src/ui/insights-view.js` to handle weekdays with 0 scheduled occurrences with subtle empty indicator.

### Slice 4: Streamlined Timer Display Architecture & Duplication Elimination (P1)

- [ ] Fix card sub-ticker text interpolation in `src/ui/today-view.js` and `src/app.js` to eliminate `"00:05 / 20m / 20m"` duplicate string output.
- [ ] Streamline habit card expanded drawer: remove redundant static text ticker; feature clean action buttons `[ ▶ Start / ⏸ Pause ]`, `[ 🔄 Reset ]`, `[ 🎯 Focus Mode ]`, `[ Details ➔ ]`.
- [ ] Clean up Focus Timer modal dial subtitle target labels.

### Slice 5: Mathematical Invariants & Multi-Kit Setup Verification (P0)

- [ ] Add unit tests in `tests/habit-tracker-engine-math.test.js` validating start-date scheduling invariants, 100% adherence on newly created habits, and 0-scheduled weekday handling.
- [ ] Add UI/DOM tests in `tests/habit-tracker-ui-components.test.js` validating multi-kit selection, kit habit disambiguation, header alignment metrics, and clean timer DOM tickers.
- [ ] Verify 100% test pass on `npm run test:habit` and `npm run verify`.

---

## ⚡ Starter Kit Ergonomics, Wizard Unchecking, i18n Parity & Routine Exclusivity (ADR-0012)

### Slice 1: Starter Kits Carousel Navigation & Drag Ergonomics (P1)

- [ ] Add accessible Left / Right navigation chevron buttons (`#starter-kits-prev-btn`, `#starter-kits-next-btn`) with minimum 44×44px touch targets on the Starter Kits section in `src/ui/identity-view.js`.
- [ ] Implement mouse drag-to-scroll interaction and keyboard left/right arrow navigation on the carousel container.
- [ ] Preserve smooth CSS snap points (`snap-x snap-start`) and mobile touch swiping.

### Slice 2: Wizard Step 3 Kit ID Normalization & Unrestricted Uncheck (P0)

- [ ] Standardize starter kit IDs across `src/domain/engine.js`, `src/i18n/translations.js`, and `src/app.js` to kebab-case (`morning-mastery`, `deep-focus`, `health-vitality`, `zen-mindfulness`).
- [ ] Remove restrictive length guard in `src/app.js` (`action === "wizard-select-kit"`) to allow unchecking any kit down to 0 selected kits.
- [ ] Update Step 4 review to gracefully handle 0 selected kits with a blank slate message or prompt to add custom habits.

### Slice 3: Systematic i18n Audit & Hardcoded String Purge (P1)

- [ ] Extract hardcoded strings in `src/ui/identity-view.js` (`"4 Trụ Cột Bản Sắc"`, `"Cân bằng phát triển bản thân theo phương pháp Atomic Habits"`, `"${domainHabits.length} thói quen"`) to `src/i18n/translations.js` (`identity_pillars_title`, `identity_pillars_subtitle`, `domain_habits_count`).
- [ ] Localize PWA Service Worker update prompt in `index.html` dynamically upon render and language toggle (`sw_update_title`, `sw_update_desc`, `sw_update_btn`).
- [ ] Localize toast error messages in `src/app.js` (`toast_habit_name_required`).
- [ ] Add automated regression assertions in `tests/habit-tracker-i18n.test.js` checking 100% dictionary parity and absence of hardcoded text in UI templates.

### Slice 4: Routine Assignment Mutual Exclusivity (P1)

- [ ] In `src/app.js` and `src/ui/manager-view.js`, enforce mutual exclusivity between `anytime` and circadian routine slots:
  - Checking `anytime` unchecks `morning`, `afternoon`, and `evening`.
  - Checking any of `morning`, `afternoon`, or `evening` unchecks `anytime`.
  - Allow multi-selection among circadian slots (e.g. `morning` + `evening`).
- [ ] Update habit creation / edit modal preview and form data parsing to reflect exclusive routine state.

### Slice 5: Automated Verification & Regression Suite (P0)

- [ ] Add unit and UI component tests in `tests/habit-tracker-ui-components.test.js` verifying carousel button navigation, drag physics classes, wizard unchecking down to 0 kits, and routine mutual exclusivity.
- [x] Add i18n regression assertions in `tests/habit-tracker-i18n.test.js`.
- [x] Verify 100% pass on `npm run test:habit` and `npm run verify`.

---

## 🚀 Streamlined Habits IA, Vertical Kits, Drag Reordering & Unified Timer Formats (ADR-0013)

### Slice 1: Today Tab Weekday Screen Fit & Scoped Multi-Routine Expansion (P0)

- [x] Refactor 7-day Date Ribbon (`renderDateRibbon` in `src/ui/today-view.js`) into a responsive 7-column flex/grid container (`grid grid-cols-7 gap-1 sm:gap-2 w-full`) with fluid padding and typography so all 7 days fit 100% on any mobile viewport (360px+) without horizontal scrolling.
- [x] Scope habit card DOM elements by routine (e.g. `#habit-card-${routineKey}-${habit.id}`, `#habit-expand-${routineKey}-${habit.id}`, `#chevron-${routineKey}-${habit.id}`).
- [x] Update accordion expand/collapse event handlers in `src/app.js` to target `target.closest('.habit-card')`, isolating accordion expansion to the clicked routine slot.

### Slice 2: Unified Timer Digital Clock Formatting (P0)

- [x] Implement `formatDurationClock(totalSeconds)` in `src/i18n/translations.js`:
  - Returns `MM:SS` when `totalSeconds <= 3600` (e.g. `00:05`, `20:00`, `60:00`).
  - Returns `HH:MM:SS` when `totalSeconds > 3600` (e.g. `01:05:00`).
- [x] Apply unified digital clock formatting across:
  - Habit Card live ticker and sub-ticker (`05:20 / 20:00`).
  - Focus Timer Modal central digits, dial indicators, and sub-tickers.
  - Floating Dynamic Island ticker (`05:20 / 20:00`).
  - Bottom dock timer pill (`05:20`).
  - Detail Sheet and habit catalog listings.
  - Overtime formatting (`+02:15` / `+01:10:00`).

### Slice 3: Habits Catalog Drag-and-Drop Reordering (P1)

- [x] Remove `▲` (`reorder-up`) and `▼` (`reorder-down`) buttons from habit cards in `src/ui/manager-view.js`.
- [x] Add tactile grip handle `⠿` (`.drag-handle`) with `touch-action: none` and accessible semantics.
- [x] Implement HTML5 Drag & Drop for desktop and touch gesture drag reordering for mobile in `src/app.js` and `src/ui/manager-view.js`.
- [x] Implement `store.reorderHabit(routineKey, sourceIndex, targetIndex)` in `src/state/store.js` to atomically persist updated ordering to IndexedDB.

### Slice 4: 8 Vertical Curated Starter Kits & Habits IA Streamlining (P1)

- [x] Remove horizontal carousel container, scroll buttons, and drag-to-scroll scripts from `src/ui/identity-view.js`.
- [x] Render Starter Kits as full-width vertical stacked cards displaying all included habits, domain badges, and a 1-tap `⚡ Apply Kit` action.
- [x] Expand `STARTER_KITS` in `src/domain/engine.js` from 4 to 8 curated packs (`morning-mastery`, `deep-focus-flow`, `health-vitality`, `zen-mindfulness`, `fitness-strength`, `lifelong-learning`, `financial-discipline`, `sleep-recovery`).
- [x] Add bilingual dictionary entries in `src/i18n/translations.js` for all 4 new starter kits.
- [x] Remove `#habits-subview-switcher` segmented switcher from `src/ui/identity-view.js` and unify Habits tab into a single page.

### Slice 5: 4 Core Life Pillars Migration to Insights Tab & Verification Gate (P0)

- [x] Move `renderLifeDomainsSection` (4 Core Life Pillars: Health, Mind, Craft, Discipline with progress rings and habit counts) to `src/ui/insights-view.js` as an "Identity Pillars & Domain Balance" analytics section.
- [x] Update `tests/habit-tracker-ui-components.test.js` to assert Date Ribbon screen fit, scoped multi-routine expansion, drag-and-drop handles, vertical starter kits, and unified clock format (`00:00` / `00:00:00`).
- [x] Update `tests/habit-tracker-i18n.test.js` to assert 100% bilingual parity for the 4 new starter kits.
- [x] Verify 100% test pass on `npm run test:habit` and `npm run verify`.

---

## ⏱️ Screen-Off Active Timer Session Persistence & Cold-Boot Reconciliation (ADR-0014)

### Slice 1: Synchronous Active Session Snapshot & Page Lifecycle Persistence (P0) — #563

- [x] Implement `saveActiveTimerSession(session)` and `clearActiveTimerSession()` in `src/app.js` writing to `localStorage` (`habit_active_timer_session`).
- [x] Persist active session snapshot payload: `{ habitId, date, startedAt, baseValue, isRunning, lastSavedTimestamp, targetValue, timerDisplayMode, timerSoundEnabled }`.
- [x] Invoke synchronous save on timer start (`handleToggleTimer`), pause, reset, time adjust (`timer-adjust`), and 1-second ticker heartbeat.
- [x] Bind Page Lifecycle events: `visibilitychange` (`hidden` and `visible`), `pagehide`, `freeze`, `beforeunload`, `focus`.
- [x] Clear active session snapshot immediately on explicit pause, timer reset, or habit deletion.

### Slice 2: Cold-Boot Time Reconciliation Engine & 12-Hour Safety Cap (P0) — #564

- [ ] Implement `restoreActiveTimerSession()` in `src/app.js` executed during `initApp()` and `visibilitychange: visible`.
- [ ] Reconcile elapsed duration using exact wall-clock timestamp delta: `Math.floor((Date.now() - session.startedAt) / 1000)`.
- [ ] Enforce 12-Hour Safety Cap ($43,200\text{s}$): cap elapsed duration and finalize session if timestamp delta exceeds 12 hours.
- [ ] Attribute elapsed seconds to originating session date (`session.date`), preserving circadian routine context across midnight boundaries.
- [ ] Synchronously update in-memory store logs and commit to IndexedDB without race conditions.

### Slice 3: Wake-Up Celebration, Focus Modal Auto-Open & Ambient Presentation (P1) — #565

- [ ] Detect if habit target was crossed while the screen was suspended: trigger harmonic sine chime (`playTimerCompletionSound`), celebration confetti, and localized completion toast.
- [ ] Automatically open the immersive Focus Timer Modal (`#focus-timer-modal-overlay`) with reactive dial and digits upon cold app launch if an active timer was running.
- [ ] Re-hydrate Floating Dynamic Island (`#floating-timer-island`) and Dock Active Pill (`#dock-active-timer-pill`) with live countdown/overtime format.
- [ ] Seamlessly restart the Web Worker / `setInterval` ticker for continuous live overtime tracking.

### Slice 4: Automated Verification & Lifecycle Test Suite Gating (P0) — #566

- [ ] Add unit & DOM component tests in `tests/habit-tracker-ui-components.test.js` asserting `localStorage` snapshot creation, cold-boot session restoration, 12-hour timeout capping, date rollover preservation, and wake-up celebration.
- [ ] Verify 100% assertions pass on `npm run test:habit`.
- [ ] Verify outer repository gate `npm run verify`.

---

## 🧪 Verification & DoD Gate

- [ ] Scoped unit & UI component tests pass with 100% assertions: `npm run test:habit`.
- [ ] Multi-device Playwright E2E scenarios pass: `npm run test:e2e:habit`.
- [ ] Outer repository gate clean: `npm run verify`.
