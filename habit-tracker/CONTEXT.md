# Atomic Habit & Routine Tracker

> **Lifecycle Phase:** `Active Feature Development` ([ADR-0003](../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

A standalone, mobile-first Progressive Web Application (PWA) designed for frictionless daily habit tracking, atomic identity formation, multi-modal logging (checkbox-first binary, expandable quantitative counters, reactive interval timers), a streamlined 4-tab bottom navigation architecture (`Today`, `Insights`, `Habits`, `Settings`), and private, zero-backend offline IndexedDB persistence.

For Vietnamese domain vocabulary, copywriting standards, and bilingual translation dictionary, refer to [`I18N.md`](./I18N.md).
For visual design tokens, gesture physics, micro-interactions, and dark/light themes, refer to [`DESIGN.md`](./DESIGN.md).
For architectural decision history and UI/UX evolution, refer to:

- [`docs/adr/0001-habit-tracker-architecture-and-data-model.md`](./docs/adr/0001-habit-tracker-architecture-and-data-model.md)
- [`docs/adr/0002-impeccable-ui-ux-architecture-and-defect-remediation.md`](./docs/adr/0002-impeccable-ui-ux-architecture-and-defect-remediation.md)
- [`docs/adr/0003-native-mobile-gestures-timer-delta-and-multi-routine-evolution.md`](./docs/adr/0003-native-mobile-gestures-timer-delta-and-multi-routine-evolution.md)
- [`docs/adr/0004-pwa-back-stack-dock-highlight-timer-reactivity-and-data-hygiene.md`](./docs/adr/0004-pwa-back-stack-dock-highlight-timer-reactivity-and-data-hygiene.md)
- [`docs/adr/0005-obsidian-glow-multi-lens-architecture-and-ux-overhaul.md`](./docs/adr/0005-obsidian-glow-multi-lens-architecture-and-ux-overhaul.md)
- [`docs/adr/0006-streamlined-navigation-checkbox-first-modality-and-reactive-timer-engine.md`](./docs/adr/0006-streamlined-navigation-checkbox-first-modality-and-reactive-timer-engine.md)

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. The 4 Application Tabs (Bottom Dock Navigation)

The application organizes daily execution, deep analytics, habit catalog management, and preferences into four primary tabs:

- **Today Action Board (`today`)**: High-velocity daily execution board. Features a hero progress ring, 7-day horizontal date ribbon, domain filter pills, circadian routine sections, and clean checkbox-first habit cards with inline expandability.
- **Insights & Analytics (`insights`)**: Quantitative analytics hub featuring a 52-week GitHub-style contribution heatmap, 0-baseline day-of-week radar/bar adherence charts, streak milestone records, and completion velocity.
- **Habits Catalog & Identity (`habits`)**: Comprehensive personal habit catalog management (Add, Edit, Reorder, Archive, Delete) with integrated **Identity System & Life Pillars** (Health, Mind, Craft, Discipline) and Curated Starter Kits.
- **Settings & Data Vault (`settings`)**: Configuration hub for streak freeze tokens, vacation pause mode, bilingual language switching (VI/EN), dark/light theme toggle, and 1-click JSON backup/restore & CSV export.
  _Avoid_: Sub-header bar, lens switcher, tab page, screen switch.

---

### 2. Habit Taxonomy & Checkbox-First Multi-Modal Measurement

- **Habit**: A recurring personal behavior or ritual tracked over time with a defined target, frequency schedule, routine assignment, domain category, and visual accent glow.
  _Avoid_: Task, todo, chore, activity, job.
- **Checkbox-First Card Display & Modality**:
  - **Uniform Checkbox**: Every habit card on the main board presents a tactile 1-tap checkbox with luminous domain glow bloom.
  - **Binary (Check-off)**: Simple boolean completion ($0 \leftrightarrow 1$) with tactile spring animation.
  - **Numeric Counter (Target Metric)**: Quantitative habit with target quota and custom unit (`ml`, `pages`, `reps`, `km`). Tapping the checkbox marks 100% completion; tapping the card expands inline `+/-` number steppers for granular logging.
  - **Duration / Timer**: Time-based habit with target duration in minutes/seconds. Tapping the checkbox marks full completion; tapping the card expands live Web Worker-driven Timer controls (Play/Pause/Reset) with sub-second DOM reactivity and Web Audio chime.
    _Avoid_: Task type, measurement category, goal format.
- **Life Domain**: High-level personal pillar categorizing habits:
  - 🌿 **Health & Vitality** (Emerald Glow)
  - ⚡ **Deep Work & Craft** (Cyan Glow)
  - 🔮 **Mind & Mindfulness** (Violet Glow)
  - 🔥 **Discipline & Routine** (Amber Glow)
    _Avoid_: Folder, tag, department.

---

### 3. Progressive Identity Onboarding & Starter Kits

- **Identity Onboarding Wizard**: A 3-step setup modal appearing on first run or empty state to introduce life domains and guide initial habit configuration without overwhelming the daily dashboard.
- **Curated Starter Kits**: Pre-configured habit packs that allow immediate 1-click adoption:
  - **Morning Mastery**: Morning hydration, 10-min meditation, light stretching, daily planning.
  - **Deep Focus & Flow**: 45-min pomodoro session, zero social media block, reading 20 pages.
  - **Health & Vitality**: 2500ml water tracking, 30-min workout, 8 hours sleep schedule.
  - **Zen & Mindfulness**: Evening reflection journaling, gratitude log, digital sunset.
    _Avoid_: Default templates, boilerplate habits, sample items.

---

### 4. Reactive Timer Architecture (PWA-Timer Standard) & Focus Session Mode

- **Inline Web Worker & Fallback**: Executes timer ticks on a background thread with CSP-compliant `worker-src 'self' blob:;` policy and instantaneous fallback to `setInterval` if worker creation is blocked.
- **Exact Timestamp Delta**: Calculates elapsed duration using `Math.floor((Date.now() - startedAt) / 1000)` ensuring 100% time accuracy across phone lock, app switching, and tab suspension.
- **Hybrid Countdown with Overtime Logging**: Counts down from target duration (e.g. 20:00 ➔ 00:00). When target is reached, triggers completion chime and celebratory confetti, then continues counting up (+00:01, +00:02...) to record full overtime focus sessions.
- **Immersive Focus Timer Modal**: A dedicated distraction-free modal (`#focus-timer-modal-overlay`) featuring a large circular SVG progress dial, remaining/elapsed time display, play/pause/reset controls, quick time steppers (`+1m`, `+5m`), and ambient domain glow.
- **Reactive DOM Ticker**: Directly updates card duration, header pill, and focus modal without heavy disk I/O.
- **Throttled IndexedDB Flush**: Writes timer logs to IndexedDB periodically (every 10s, on pause, on target completion, and on `visibilitychange`/`pagehide`).
- **Screen Wake Lock & Web Audio**: Holds screen wake lock while ticking and sounds harmonic sine chime upon reaching target duration.

---

### 5. Streaks, Momentum & Mathematical Formulas

- **Daily Habit Completion Rate ($C_{i, d}$)**:
  $$C_{i, d} = \min\left(1.0, \frac{\text{Logged Value}_{i, d}}{\text{Target Value}_{i}}\right)$$
- **Active Consecutive Streak ($S_i$)**: Consecutive scheduled active days where $C_{i, d} \ge 1.0$.
- **Streak Freeze Token**: Anti-guilt buffer (2 tokens per 30-day window) preserving streak count on missed scheduled days.
- **Rolling 30-Day Consistency Score ($\text{Score}_{30\text{d}}$)**:
  $$\text{Score}_{30\text{d}} = \begin{cases} 0\% & \text{if Total Scheduled Days} = 0 \\ \frac{\sum_{d=1}^{30} \mathbf{1}_{C_{i, d} \ge 1.0}}{\text{Total Scheduled Days in last 30 days (excluding Paused)}} \times 100\% & \text{otherwise} \end{cases}$$
- **Day-of-Week Consistency Rate ($\text{Rate}_{w}$)**:
  $$\text{Rate}_{w} = \begin{cases} 0\% & \text{if Scheduled}_{w} = 0 \\ \frac{\text{Completed}_{w}}{\text{Scheduled}_{w}} \times 100\% & \text{otherwise} \end{cases}$$
- **Overall Daily Progress Percentage ($D_d$)**:
  $$D_d = \begin{cases} 0\% & \text{if } N_{\text{scheduled today}} = 0 \\ \frac{\sum_{i \in \text{scheduled today}} C_{i, d}}{N_{\text{scheduled today}}} \times 100\% & \text{otherwise} \end{cases}$$

---

### 6. Interaction Ergonomics, Modal Hierarchy & PWA Invariants

- **Sleek Top Header**: Stripped of sub-header clutter and taglines; carries title, ambient running timer pill, freeze token counter badge, and language toggle.
- **Clean 4-Tab Bottom Dock**: Ergonomic thumb access to `Today`, `Insights`, `Habits`, and `Settings` without floating button obstructions.
- **Dual Empty-State Gateway**: Both `Today` and `Habits` tabs offer prominent dual CTAs when empty: Primary `✨ Identity Setup Wizard` and Secondary `+ Add Habit`.
- **Post-Wipe Auto-Onboarding**: Factory Wipe automatically routes to Today and presents the Identity Setup Wizard modal.
- **Modal Stacking Hierarchy**: Enforces strict z-index layering (`Detail Sheet` at `z-50`, `Edit Modal` at `z-60`, `Focus Timer` at `z-60`) ensuring nested actions (e.g. Details ➔ Edit Habit) render properly without clipping.
- **Local-First Zero-Backend Persistence**: 100% offline client-side storage in IndexedDB (`habit_tracker_db`) with fallback to localStorage.
- **Bilingual Parity**: 100% Vietnamese (`vi`) and English (`en`) dictionary translation coverage.
