# Atomic Habit & Routine Tracker

> **Lifecycle Phase:** `Active Feature Development` ([ADR-0003](../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

A standalone, mobile-first Progressive Web Application (PWA) designed for frictionless daily habit tracking, atomic identity formation, multi-modal logging (binary, quantitative counters, timers), four dynamic perspective lenses (Today Action Board, Routine Timeline, Matrix & Analytics, Identity & Life Domains), and private, zero-backend offline IndexedDB persistence.

For Vietnamese domain vocabulary, copywriting standards, and bilingual translation dictionary, refer to [`I18N.md`](./I18N.md).
For visual design tokens, gesture physics, micro-interactions, and dark/light themes, refer to [`DESIGN.md`](./DESIGN.md).
For architectural decision history and UI/UX evolution, refer to:

- [`docs/adr/0001-habit-tracker-architecture-and-data-model.md`](./docs/adr/0001-habit-tracker-architecture-and-data-model.md)
- [`docs/adr/0002-impeccable-ui-ux-architecture-and-defect-remediation.md`](./docs/adr/0002-impeccable-ui-ux-architecture-and-defect-remediation.md)
- [`docs/adr/0003-native-mobile-gestures-timer-delta-and-multi-routine-evolution.md`](./docs/adr/0003-native-mobile-gestures-timer-delta-and-multi-routine-evolution.md)
- [`docs/adr/0004-pwa-back-stack-dock-highlight-timer-reactivity-and-data-hygiene.md`](./docs/adr/0004-pwa-back-stack-dock-highlight-timer-reactivity-and-data-hygiene.md)
- [`docs/adr/0005-obsidian-glow-multi-lens-architecture-and-ux-overhaul.md`](./docs/adr/0005-obsidian-glow-multi-lens-architecture-and-ux-overhaul.md)

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. The 4 Perspective Lenses (Navigation & Mental Model)

The application organizes daily execution and long-term reflection into four top-level perspective lenses:

- **Today Action Board (`today`)**: The high-velocity daily action board. Features a hero progress ring, 7-day date strip, domain filter pills, quick 1-tap completions, and instant stepper increments.
- **Timeline & Routines Lens (`timeline`)**: Chronological circadian schedule view grouping habits into Morning 🌅, Afternoon ☀️, Evening 🌙, and Bedtime/Night 🌌 time-blocks with cue-routine connection indicators.
- **Matrix & Analytics Lens (`matrix`)**: Quantitative analytics hub featuring a 52-week GitHub-style contribution heatmap, 0-baseline day-of-week radar/bar adherence charts, streak records, and completion velocity.
- **Identity & Life Domains Lens (`identity`)**: Holistic habit architecture grouped by life pillars (Health & Vitality, Mind & Wisdom, Deep Work & Craft, Daily Discipline) with 1-click curated Starter Kits.
  _Avoid_: Tab page, screen switch, view mode.

---

### 2. Habit Taxonomy & Multi-Modal Measurement

- **Habit**: A recurring personal behavior or ritual tracked over time with a defined target, frequency schedule, routine assignment, domain category, and visual accent glow.
  _Avoid_: Task, todo, chore, activity, job.
- **Habit Modality (Measurement Type)**:
  - **Binary (Check-off)**: Simple boolean completion ($0$ or $1$) with tactile spring animation and luminous glow bloom.
  - **Numeric Counter (Target Metric)**: Quantitative habit with target quota, custom unit (`ml`, `pages`, `reps`, `km`), and rapid `+` / `-` stepper buttons.
  - **Duration / Timer**: Time-based habit with target duration in minutes/seconds. Features background-accurate timestamp delta counting, live ticking card display, audio chime, and pause/reset controls.
    _Avoid_: Task type, measurement category, goal format.
- **Life Domain**: High-level personal pillar categorizing habits:
  - 🌿 **Health & Vitality** (Emerald Glow)
  - ⚡ **Deep Work & Craft** (Cyan Glow)
  - 🔮 **Mind & Mindfulness** (Violet Glow)
  - 🔥 **Discipline & Routine** (Amber Glow)
    _Avoid_: Folder, tag, department.

---

### 3. Curated Starter Kits

- **Starter Kit**: Pre-configured habit packs that allow immediate 1-click onboarding without empty-state paralysis:
  - **Morning Mastery**: Morning hydration, 10-min meditation, light stretching, daily planning.
  - **Deep Focus & Flow**: 45-min pomodoro session, zero social media block, reading 20 pages.
  - **Health & Vitality**: 2500ml water tracking, 30-min workout, 8 hours sleep schedule.
  - **Zen & Mindfulness**: Evening reflection journaling, gratitude log, digital sunset.
    _Avoid_: Default templates, boilerplate habits, sample items.

---

### 4. Streaks, Momentum & Mathematical Formulas

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

### 5. Interaction Ergonomics & PWA Invariants

- **Top Lens Switcher**: Sleek segmented pill header with luminous active indicator and smooth sliding transitions.
- **Bottom Ergonomic Action Bar**: Thumb-accessible bottom bar housing the Quick Add button (`+`), Floating Undo Pill Toast, and Settings/Data Vault trigger.
- **Interactive Habit Detail Drawer**: Slide-over drawer exposing habit-level calendar heatmap, 30-day consistency score, streak records, notes reflection log, and edit controls.
- **Local-First Zero-Backend Architecture**: 100% offline client-side storage in IndexedDB (`habit_tracker_db`) with fallback to localStorage.
- **Data Portability**: Clean JSON backup/restore and CSV log export with safe state replacement.
- **Bilingual Parity**: 100% Vietnamese (`vi`) and English (`en`) dictionary translation coverage.
