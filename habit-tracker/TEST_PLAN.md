# Test Plan & Verification Strategy (`TEST_PLAN.md`)

This document defines the test matrix, public test seams, and verification coverage for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Test Suite Architecture

Following the repository's Two-Speed TDD standard (ADR-0010 & ADR-0003), testing is divided into fast scoped inner-loop suites and full end-to-end device suites.

```text
tests/
├── habit-tracker-engine-math.test.js        # Pure mathematical models (0% baseline, streaks, consistency, freeze tokens)
├── habit-tracker-storage-persistence.test.js # IndexedDB CRUD, fresh database seed, starter kits, JSON import/export
├── habit-tracker-cloud-sync.test.js          # Cloud backup encoding, Gist/Drive payloads
├── habit-tracker-ui-components.test.js       # 4-Tab bottom dock, checkbox-first cards, inline expansions, reactive timer, identity wizard
├── habit-tracker-i18n.test.js                # Bilingual dictionary 100% key parity & formatters
└── e2e/
    └── habit-tracker-devices.spec.js         # Playwright multi-device mobile (iPhone, Android) & desktop
```

---

## 🧪 Public Test Seams & Coverage Matrix

### 1. Mathematical Domain Engine (`tests/habit-tracker-engine-math.test.js`)

- [x] **Historical 0% Baseline on Empty History**:
  - `calculateStreakAndConsistency` returns `0%` for 30d/90d consistency when `scheduledCount === 0`.
  - `calculateWeekdayAdherence` returns `0%` for days with no scheduled history.
  - `calculateRoutineAdherence` returns `0%` for routines with no scheduled history.
  - `calculateDailyProgress` and `calculateRoutineProgress` return `percentage: 0`, `ratio: 0.0`, `isAllCompleted: false` when 0 habits scheduled.
- [x] **Streak & Freeze Token Calculation**:
  - Increments on consecutive days with $\ge 100\%$ target completion.
  - Consumes freeze token on missed days without resetting streak to 0.

### 2. Storage, Persistence & Starter Kits (`tests/habit-tracker-storage-persistence.test.js`)

- [x] **Starter Kits Seeding & Identity Setup**:
  - Seeds 4 curated starter packs (_Morning Mastery_, _Deep Focus_, _Vitality_, _Zen_).
- [x] **Data Vault JSON Backup & Safe Restore**:
  - `replaceState()` successfully restores complete state and updates in-memory cache without throwing exceptions.
- [x] **CSV Export**:
  - Produces valid UTF-8 formatted CSV rows with headers and habit log records.

### 3. UI Components, 4-Tab Navigation & Checkbox-First Modality (`tests/habit-tracker-ui-components.test.js`)

- [x] **4-Tab Bottom Dock Navigation**:
  - Switching between `today`, `insights`, `habits`, and `settings` renders the respective views and updates active tab styling.
  - Sub-header lens bar is removed; top header remains sleek and uncluttered.
  - Redundant `+` button is removed from bottom dock.
- [x] **Checkbox-First Habit Cards**:
  - All habit cards render a 1-tap checkbox.
  - Binary habits toggle completed state on checkbox tap.
  - Numeric & Timer habits log full target completion on checkbox tap.
  - Tapping card body on Numeric/Timer habits expands inline drawer/accordion with steppers and live timer controls.
- [x] **Reactive Timer Execution**:
  - Dispatches sub-second ticks via Web Worker delta calculation.
  - Reactively updates DOM duration text, progress ring, and ambient header pill.
  - Throttles IndexedDB writes to avoid disk saturation during active counting.
  - Triggers completion chime and confetti upon reaching target duration.
- [x] **Identity Onboarding Wizard & Life Pillars in Habits**:
  - Renders 3-step setup modal for first-time users or empty state.
  - Displays life domain summary cards and starter kits within the `habits` tab.

### 5. Focus Timer Engine, Empty States & Modal Hierarchy (`tests/habit-tracker-ui-components.test.js`)

- [x] **CSP Compliance & Timer Worker Resilience**:
  - `startTimerTicker()` initializes Web Worker when supported or cleanly falls back to `setInterval` without throwing uncaught exceptions.
  - Sub-second DOM ticker accurately reflects elapsed duration calculated from timestamp deltas.
  - Screen Wake Lock API is invoked on timer start and released on stop/pause/reset.
- [x] **Immersive Focus Timer Modal**:
  - `#focus-timer-modal-overlay` opens on ambient header/dock pill click or card timer tap.
  - Renders large circular progress ring with reactive stroke dashoffset and hybrid countdown/overtime display.
  - Quick time adjustment steppers (`+1m`, `+5m`, `-1m`) mutate the target/duration reactively.
  - Web Audio sine harmonic chime is synthesized upon reaching 100% completion.
- [x] **Dual Empty-State Gateway & Factory Wipe Automation**:
  - Empty `Today` view displays both `✨ Identity Setup Wizard` and `+ Add Habit` buttons.
  - Empty `Habits` catalog view displays both `✨ Identity Setup Wizard` and `+ Add Habit` buttons.
  - Calling `confirmFactoryWipe()` wipes database, redirects to `Today`, and auto-launches the 3-step Identity Setup Wizard modal.
- [x] **Shell Decluttering & Modal Layering Invariants**:
  - `#floating-quick-add-btn` is completely absent from the DOM.
  - Top header is free of the subtitle `Obsidian Glow • Offline-First`.
  - `#habit-edit-modal-overlay` has `z-index >= 60` and displays above `#detail-sheet-overlay` (`z-50`) without z-index collisions.

### 7. WCAG AA Accessibility, Touch Targets & Codebase Distillation (ADR-0010)

- [x] **WCAG AA Semantics & Motion Sensitivity (`tests/habit-tracker-ui-components.test.js`)**:
  - `@media (prefers-reduced-motion: reduce)` in `index.html` suppresses confetti explosions and pauses animations.
  - Bottom navigation dock enforces `role="tablist"` and `role="tab"` + `aria-controls="main-content"`.
  - Habit completion buttons enforce `role="checkbox"`, `aria-checked="true|false"`, and localized `aria-label`.
  - Habit card expand triggers enforce `aria-expanded` and `aria-controls`.
  - Centralized `trapFocus` and `releaseFocus` helper cycles Tab keys and handles Escape key dismiss.
- [x] **Touch Targets & Micro-Typography Normalization (`tests/habit-tracker-ui-components.test.js`)**:
  - All interactive buttons enforce $\ge 44\times 44\text{px}$ hitboxes.
  - Sub-captions normalized to `text-[11px]` micro ramp token.

### 8. Header Alignment, Multi-Kit Wizard, Adherence Invariants & Timer IA (ADR-0011)

- [ ] **Mathematical Invariant & Adherence Accuracy (`tests/habit-tracker-engine-math.test.js`)**:
  - `isScheduledDate` returns `false` for any dates preceding `habit.startDate || habit.createdAt`.
  - Newly created habits with 100% completions on day one evaluate to 100% adherence in `calculateWeekdayAdherence` (eliminating the 8% bug).
  - Weekdays with 0 scheduled occurrences return 0% adherence without skewing overall window metrics.
  - `calculateRoutineAdherence` and `calculateOverallConsistencyScore` respect `habit.startDate || habit.createdAt`.
- [ ] **Multi-Kit Wizard & Starter Packs (`tests/habit-tracker-ui-components.test.js`)**:
  - Step 3 allows multi-selecting multiple starter kits (toggling checkboxes).
  - Step 4 previews all aggregated habits from selected packs and applies numbered disambiguation (e.g. `Read 15m (1)`, `Read 15m (2)`) for duplicate names.
  - `store.applyStarterKits` atomically instantiates all habits across selected kits.
- [ ] **Header Alignment & Timer IA Cleanliness (`tests/habit-tracker-ui-components.test.js`)**:
  - Top header container enforces `h-14` (56px) flex container and `h-8` (32px) height constraint on all interactive buttons.
  - No stale DOM lookups to `#header-active-timer-pill`.
  - Habit card sub-ticker text interpolation renders exactly `05:00 / 20m` without duplicate `/ 20m` suffixing.
  - Card expanded drawer renders clean action buttons without redundant text readouts.

### 9. Starter Kit Ergonomics, Wizard Unchecking, i18n Parity & Routine Exclusivity (ADR-0012)

- [ ] **Starter Kits Carousel & Drag Navigation (`tests/habit-tracker-ui-components.test.js`)**:
  - Carousel renders accessible `#starter-kits-prev-btn` and `#starter-kits-next-btn` with $\ge 44\times 44\text{px}$ touch targets.
  - Clicking prev/next buttons updates `scrollLeft` of the container smoothly.
  - Container maintains `overflow-x-auto snap-x snap-start` and mouse drag-to-scroll class hooks.
- [ ] **Wizard Step 3 Kit Normalization & 0-Kit Unchecking (`tests/habit-tracker-ui-components.test.js`)**:
  - Starter kit IDs normalized to kebab-case in `engine.STARTER_KITS`.
  - Clicking any selected kit (including `morning-mastery`) successfully unchecks it even when it is the sole selected item.
  - Step 4 handles 0 selected kits by showing empty state guidance or allowing blank slate onboarding.
- [ ] **100% i18n Bilingual Parity & Hardcoded String Absence (`tests/habit-tracker-i18n.test.js`)**:
  - Zero hardcoded Vietnamese strings across `identity-view.js` and `index.html`.
  - PWA update banner dynamically displays English and Vietnamese text upon language switch.
  - Complete parity between `en` and `vi` translation dictionary keys.
- [x] **Routine Assignment Mutual Exclusivity (`tests/habit-tracker-ui-components.test.js`)**:
  - Checking `anytime` chip unchecks `morning`, `afternoon`, and `evening` chips.
  - Checking any of `morning`, `afternoon`, or `evening` chips unchecks `anytime` chip.
  - Selecting multiple circadian chips (e.g. `morning` + `evening`) preserves both selections.

### 10. Streamlined Habits IA, Vertical Kits, Drag Reorder & Unified Timer Formats (ADR-0013)

- [x] **Date Ribbon Screen Fit & Routine-Scoped Expansion (`tests/habit-tracker-ui-components.test.js`)**:
  - Date Ribbon renders inside a 7-column responsive container (`grid-cols-7` or full flex) fitting 100% within 360px+ screen width without horizontal scrollbars.
  - Expanding a multi-routine habit card in Evening section only expands that specific Evening card drawer without affecting the Morning card.
  - Event listeners correctly resolve `.habit-card` DOM element via proximity traversal.
- [x] **Unified Timer Digital Clock Formatting (`tests/habit-tracker-i18n.test.js` & `tests/habit-tracker-ui-components.test.js`)**:
  - `formatDurationClock(totalSeconds)` returns `00:00` (MM:SS) for durations $\le 3600$s and `00:00:00` (HH:MM:SS) for durations $> 3600$s.
  - Card tickers, Focus Timer digits, Dynamic Island, dock pill, and detail sheet reflect unified clock formatting.
  - Overtime formatting formats with leading `+` (`+02:15` / `+01:10:00`).
- [x] **Habits Catalog Drag-and-Drop Reordering (`tests/habit-tracker-ui-components.test.js`)**:
  - Habit cards in Manager view render tactile grip handle `⠿` (`.drag-handle`) and omit discrete Up/Down buttons.
  - `store.reorderHabit` re-indexes habit list in memory and updates persistence atomically.
- [x] **8 Vertical Curated Starter Kits & Life Pillars in Insights (`tests/habit-tracker-ui-components.test.js` & `tests/habit-tracker-i18n.test.js`)**:
  - `STARTER_KITS` contains 8 curated packs with 100% bilingual `en`/`vi` key parity.
  - Starter kits render in a full-width vertical stacked layout in Habits tab.
  - 4 Core Life Pillars render in Insights tab under "Identity Pillars & Domain Balance".
  - Habits sub-view switcher `#habits-subview-switcher` is removed.

### 11. Screen-Off Active Timer Session Persistence & Cold-Boot Reconciliation (ADR-0014)

- [x] **Synchronous Session Snapshot & Page Lifecycle Hooks (`tests/habit-tracker-ui-components.test.js`)**:
  - `saveActiveTimerSession` writes `{ habitId, date, startedAt, baseValue, isRunning, lastSavedTimestamp, targetValue, timerDisplayMode, timerSoundEnabled }` synchronously to `localStorage.getItem('habit_active_timer_session')`.
  - Toggling timer, pausing, resetting, or clicking `+1m`/`+5m` adjusters immediately updates `localStorage`.
  - Triggering `visibilitychange` (state = 'hidden'), `pagehide`, and `beforeunload` synchronously persists the latest session snapshot.
  - Pausing or resetting the timer clears `habit_active_timer_session` from `localStorage`.
- [x] **Cold-Boot Restoration & Time Reconciliation (`tests/habit-tracker-ui-components.test.js`)**:
  - Simulating a cold boot with an existing unpaused `habit_active_timer_session` restores `runningTimerHabitId`, calculates exact timestamp delta `Math.floor((Date.now() - session.startedAt) / 1000)`, and resumes live ticking.
  - 12-Hour Safety Cap: Sessions older than 12 hours (43,200s) are automatically capped at 12 hours and marked finalized.
  - Midnight rollover: Restored sessions attribute elapsed seconds to `session.date` without date fragmentation.
- [x] **Wake-Up Celebration & UI Presentation (`tests/habit-tracker-ui-components.test.js`)**:
  - If habit target was crossed during screen-off sleep, triggers celebration chime (`playTimerCompletionSound`), confetti, and completion toast.
  - Cold app launch with active restored session automatically opens the immersive Focus Timer Modal (`#focus-timer-modal-overlay`).
  - Floating Dynamic Island (`#floating-timer-island`) and Dock Active Pill (`#dock-active-timer-pill`) immediately reflect the restored time and running state.

#### 12. Cloud Sync, Deterministic 3-Way Merge & Encrypted Vault (ADR-0015)

- [x] **Deterministic 3-Way Merge & Deletion Tombstones (`tests/habit-tracker-cloud-sync.test.js`)**:
  - `merge3` correctly performs Last-Write-Wins on conflicting habit properties and settings based on `updatedAt`.
  - Deletion tombstones (`deleted: true`, `deletedAt`) propagate across local and remote states without resurrected entities.
  - Daily habit logs are merged additively across calendar dates without dropping records.
  - Concurrent same-day log collisions preserve the maximum completed progress / latest timestamp.
  - Pre-merge snapshot is safely saved to IndexedDB before applying remote mutations.
- [x] **Zero-Knowledge Client-Side Encryption (`tests/habit-tracker-cloud-sync.test.js`)**:
  - AES-GCM-256 + PBKDF2 encrypts and decrypts state payloads faithfully.
  - Invalid passphrase throws descriptive error safely without corrupting stored data.
  - Ephemeral session key cache isolates `CryptoKey` in memory and prevents `localStorage` key leakage.

### 13. Unified Sync Kernel, Adaptive Cadence & Clipboard JSON Portability (ADR-0016)

- [x] **Dual-Speed Cadence & 5-Minute Timer Batching (`tests/habit-tracker-cloud-sync.test.js`)**:
  - Local persistence writes to IndexedDB every 10s during timer ticks.
  - Cloud sync suppresses outgoing network requests during continuous timer ticking until 5 minutes (300s) have accumulated.
  - State boundary transitions (Timer Start, Pause, Reset, 100% Target Completed, App Wake/Init) trigger immediate 5s debounced sync.
  - Non-timer mutations (checkbox toggles, habit edits) continue using standard 5s debounce.
- [ ] **Dirty State Checksum & Adaptive Idle Cadence ("Increase Mechanism") (`tests/habit-tracker-cloud-sync.test.js`)**:
  - Computes deterministic payload hash of normalized state; skips cloud upload when local and remote hashes match.
  - Scales idle background polling from 1m to 3m, 5m, and caps at 15m; resets to 1m upon user interaction or visibility wake.
  - Exponential error backoff on HTTP 429/403/5xx ($5\text{s} \to 15\text{s} \to 30\text{s} \to 60\text{s} \to 5\text{m}$).
- [ ] **1-Click Clipboard JSON Portability & Zero CSV (`tests/habit-tracker-storage-persistence.test.js`)**:
  - `copyJsonToClipboard` writes valid JSON backup payload to clipboard with toast feedback and modal textarea fallback.
  - `pasteAndInspectJson` validates schema, computes diff statistics, supports Merge vs Replace strategy, and creates pre-import safety rollback snapshot.
  - Supports choice of encrypted vault payload vs plaintext JSON when vault encryption is active.
  - CSV export and import functions (`exportToCsv`, `downloadExportCSV`, `parseHabitCsv`) and UI buttons are completely removed.
- [ ] **Settings UI Diagnostics & Local Vault Snapshots (`tests/habit-tracker-ui-components.test.js`)**:
  - Renders 3-card Settings layout (Cloud Sync Hub, Data Portability, Local Vault Snapshots).
  - Status badges dynamically display `connected`, `syncing`, `error`, and `offline` states.
  - Rolling snapshot drawer displays last 5 restore points with 1-click rollback.
