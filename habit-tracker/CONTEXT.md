# Atomic Habit & Routine Tracker

> **Lifecycle Phase:** `Hardened Stable` ([ADR-0013](../docs/adr/0013-dual-phase-tool-lifecycle-and-scoped-quality-governance.md))

A standalone, mobile-first Progressive Web Application (PWA) designed for atomic habit building, daily routine clustering (Morning, Afternoon, Evening, Anytime), dual-metric consistency scoring (active streak + 30-day/90-day consistency rate), flexible schedules, and private, local-first offline tracking with optional encrypted cloud backup.

For Vietnamese domain vocabulary, copywriting standards, and bilingual translation dictionary, refer to [`I18N.md`](./I18N.md).
For visual design tokens, gesture physics, micro-interactions, and dark/light themes, refer to [`DESIGN.md`](./DESIGN.md).
For architectural decision history and UI/UX evolution, refer to [`docs/adr/0001-habit-tracker-architecture-and-data-model.md`](./docs/adr/0001-habit-tracker-architecture-and-data-model.md) and [`docs/adr/0002-impeccable-ui-ux-architecture-and-defect-remediation.md`](./docs/adr/0002-impeccable-ui-ux-architecture-and-defect-remediation.md).

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. Habit Taxonomy & Measurement Types

- **Habit**: A recurring personal behavior or ritual tracked over time with a defined target, frequency schedule, time-of-day routine assignment, and visual accent color.
  _Avoid_: Task, todo, chore, activity, job.
- **Habit Type**: The quantitative measurement dimension of a habit:
  - **Binary (Yes/No)**: Simple check-off habit (e.g. _Morning Meditation_, _Floss Teeth_, _Cold Shower_). Done status is boolean ($0$ or $1$).
  - **Numeric Counter (Target Metric)**: Quantitative habit with target value, measurement unit, and incremental step (e.g. _Drink 2,500 ml Water_, _Read 20 Pages_, _Do 50 Push-ups_). Supports quick `+` and `-` increments.
  - **Duration / Timer**: Time-based habit with target duration in minutes/seconds (e.g. _30 mins Deep Work_, _15 mins Stretching_). Features an integrated countdown/stopwatch timer with audio chime upon completion.
    _Avoid_: Task type, measurement category, goal format.
- **Time-of-Day Routine (Routine Cluster)**: Natural circadian grouping of habits into distinct temporal clusters:
  - 🌅 **Morning Routine** (e.g., 05:00 – 12:00)
  - ☀️ **Afternoon Routine** (e.g., 12:00 – 17:00)
  - 🌙 **Evening Routine** (e.g., 17:00 – 23:00)
  - 🔄 **Anytime / Flexible** (Untethered to specific time of day)
    _Avoid_: Category, folder, tag, time slot.
- **Target Value & Unit**: The quantifiable daily threshold to mark a habit as 100% completed (e.g., `2500` `ml`, `20` `pages`, `30` `mins`).
  _Avoid_: Goal quota, completion number, cap.

---

### 2. Frequency & Scheduling Logic

- **Frequency Schedule**: Rule determining which days a habit is scheduled:
  - **Daily**: Every day ($7\text{ days/week}$).
  - **Specific Days of Week**: Defined days (e.g. _Monday, Wednesday, Friday_).
  - **Flexible Weekly Target**: $X$ times per calendar week (e.g. _Gym 3x/week_). Any completed day contributes to the weekly quota.
  - **Repeat Interval**: Every $N$ days (e.g. _Every 2 days_).
    _Avoid_: Repetition mode, cadence rule, habit schedule.
- **Scheduled Day**: A calendar date on which a habit is active and expected to be completed according to its frequency schedule. Non-scheduled days do not appear as pending and do not penalize streaks.
  _Avoid_: Active date, task day, work day.
- **Vacation / Sick Pause Mode**: Global or per-habit temporary suspension toggle that freezes all scheduling expectations during travel, illness, or rest periods without streak penalty or consistency degradation.
  _Avoid_: Snooze, sleep mode, disable mode.

---

### 3. Streaks, Consistency & Mathematical Formulas

- **Daily Habit Completion Rate ($C_{i, d}$)**: The fractional progress of habit $i$ on date $d$:
  $$C_{i, d} = \min\left(1.0, \frac{\text{Logged Value}_{i, d}}{\text{Target Value}_{i}}\right)$$
  For binary habits, $C_{i, d} \in \{0, 1\}$.
- **Active Consecutive Streak ($S_i$)**: The count of consecutive scheduled active days up to today (or yesterday if today is still in progress) where $C_{i, d} \ge 1.0$.
  $$S_i = \text{consecutive scheduled days with } C_{i, d} \ge 1.0$$
- **Streak Freeze Token**: An anti-guilt grace buffer (default: 2 tokens available per 30-day window). When a user misses a single scheduled day, an available freeze token is automatically or manually applied to preserve the streak counter without resetting to 0.
  _Avoid_: Life, shield, cheat day, pass.
- **Rolling Consistency Score ($\text{Score}_{30\text{d}}$)**: The primary psychological momentum metric representing the percentage of scheduled days completed over the past 30 days:
  $$\text{Score}_{30\text{d}} = \frac{\sum_{d=1}^{30} \mathbf{1}_{C_{i, d} \ge 1.0}}{\text{Total Scheduled Days in last 30 days (excluding Paused)}} \times 100\%$$
  _Avoid_: Success rate, win percentage, habit score.
- **Routine Progress Percentage ($R_{\text{routine}, d}$)**:
  $$R_{\text{routine}, d} = \frac{\sum_{i \in \text{routine scheduled}} C_{i, d}}{N_{\text{routine scheduled}}} \times 100\%$$
- **Overall Daily Progress Percentage ($D_d$)**:
  $$D_d = \frac{\sum_{i \in \text{all scheduled today}} C_{i, d}}{N_{\text{all scheduled today}}} \times 100\%$$

---

### 4. User Experience & Impeccable Ergonomics

- **Today View**: Ambient daily dashboard featuring an interactive 7-day date slider, overall daily circular progress ring, time-of-day routine sections (Morning, Afternoon, Evening, Anytime), and fluid swipe-to-complete habit cards with haptic micro-feedback.
  _Avoid_: Main screen, task list, home feed.
- **Insights & Heatmap View**: Comprehensive analytics tab with interactive 52-week calendar contribution heatmap, all-time best streaks, completion rates by day of week, and routine adherence breakdown.
  _Avoid_: Stats tab, report screen, chart view.
- **Interactive Heatmap Date Navigation**: Tapping any day cell on the 52-week heatmap immediately navigates to that date in the Today view with an active pulse highlight.
- **Floating Undo Pill Toast**: A non-intrusive floating bar appearing above the bottom dock for 4 seconds after checking or incrementing a habit, providing 1-tap accidental action reversal.
- **Habit Manager View**: Catalog view to add, edit, reorder (▲/▼), color-code, set reminders, archive, and delete habits with confirmation.
  _Avoid_: Settings list, habit admin, config tab.
- **Habit Deep-Dive Sheet**: Expandable bottom sheet displaying 365-day mini heatmap for a single habit, historical check-in logs with per-day journaling notes, milestone badges, and quick configuration.
  _Avoid_: Detail popup, edit dialog, habit modal.
- **Check-in Note (Micro-Journal)**: Optional brief reflection or log text attached to a daily check-in (e.g. _"Read chapter 4 on cues & rewards"_).
  _Avoid_: Comment, diary entry, description.

---

### 5. Persistence, PWA & Cloud Backup

- **Local-First IndexedDB (`habit_tracker_db`)**: Primary zero-latency offline client database storing `habits`, `logs`, `routines`, and `settings`.
- **LocalStorage Fallback**: Ephemeral JSON cache ensuring functionality if IndexedDB is restricted.
- **Silent Migration**: Automatic schema versioning and backwards-compatible data transformation on startup without user intervention.
- **Encrypted Cloud Backup**: Optional, client-side encrypted backup & restore using GitHub Gist personal access token or Google Drive AppData folder.
- **JSON Data Portability**: 1-tap full data export (`.json`) and merge/replace import.
- **Service Worker (`sw.js`)**: Cache-first offline shell with dynamic update detection and local Web Notification scheduling.
