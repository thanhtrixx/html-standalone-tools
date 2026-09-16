# 9. Header Height Harmony, Insights Mathematical Corrections, Language-First Setup Wizard, and Floating Dynamic Timer Island

Date: 2026-09-16
Status: Accepted

## Context & Problem Statement

User feedback and systematic Lightpanda headless browser audits identified four critical areas requiring architectural refinement and UX polish in the `habit-tracker` tool:

1. **Header Vertical Misalignment**: The top navigation header exhibited uneven button heights (26px–32px) and baseline misalignments between the 32px (`w-8 h-8`) brand logo and right-side interactive badges (`#freeze-tokens-count`, `#lang-toggle-btn`), caused by differing font sizes (`text-xs` vs `text-base` for flag emojis) and fluctuating line-heights.
2. **Insights Analytics Mathematical Anomalies & UI Defects**:
   - **Phantom Streaks with Zero Activity**: The history loop in `engine.js:calculateStreakAndConsistency` consumed streak freeze tokens even when `tempStreak === 0`, awarding false 1-day or 2-day streaks to inactive or newly created habits. Freeze tokens must strictly preserve *existing active streaks* ($> 0$), never start streaks out of empty days.
   - **Broken 30d/90d Consistency Scoring**: In `insights-view.js`, `calculateStreakAndConsistency` was invoked with `habits[0]` and all logs (keyed by `${habitId}_${date}`), causing `logsMap[dStr]` lookups to fail and returning misleading `0%` consistency scores.
   - **Missing i18n Keys & Duplicate Headers**: The translation key `heatmap_subtitle` was rendered as a raw key literal, and the Habits catalog tab rendered duplicate `<h2>` titles from both `identity-view.js` and `manager-view.js`.
3. **Setup Wizard Language Sequence**: The First-Run / Empty-State Setup Wizard modal launched directly into domain pillars on Step 1, ignoring user language preferences and forcing bilingual users to navigate in the default language unless toggled in the header.
4. **Timer UI Clutter & Cramped Header Indication**:
   - Habit cards rendered repetitive numbers across both the collapsed subtitle (`00:00 / 20:00`) and the expanded drawer (`00:00 / 20:00`), along with verbose action labels (`Start Timer` / `Bắt đầu hẹn giờ`).
   - The active running timer state was indicated only via a small top-header pill (`#header-active-timer-pill`), which is outside the natural thumb zone on mobile devices and easily overlooked during vertical scrolling.

## Decision Drivers

- **Pixel-Perfect Alignment & Touch Ergonomics**: Standardize header elements to unified heights (`h-8` / 32px) with centered flex baselines and touch targets.
- **Mathematical Integrity in Analytics**: Ensure consistency scores, streaks, freeze token deductions, and heatmap cells reflect accurate formulas and zero-baseline invariants.
- **Language-First Onboarding**: Respect user language choice as Step 1 of the Setup Wizard so all subsequent steps, domain pillars, and habit starter kits render in the selected language.
- **Impeccable Timer Interface**: Eliminate duplicate time rows in cards, simplify labels to `Start` / `Pause` (`Bắt đầu` / `Tạm dừng`), and introduce a thumb-accessible Floating Dynamic Timer Island above the bottom navigation dock across all application views.

## Considered Options & Decision Outcome

### Decision 1: Header Vertical Alignment & Token Standardization
- **Outcome**: Standardize all header action elements (`#freeze-tokens-count`, `#lang-toggle-btn`) to fixed `h-8` (32px) with `inline-flex items-center justify-center`, matching the 32px brand logo. Standardize border-radius (`rounded-full`), normalize padding, and ensure baseline font alignment across English and Vietnamese glyphs.

### Decision 2: Insights Analytics Correction & Zero-Regression Gating
- **Outcome**:
  - Update `calculateStreakAndConsistency`: Freeze tokens are consumed only when `tempStreak > 0` (for historical best streak) and `currentStreak > 0` (for active streak).
  - Implement `calculateOverallConsistencyScore(habits, logs, daysBack, refDate)` in `engine.js` computing global aggregate adherence:
    $$\text{Score}_{\text{window}} = \frac{\sum_{d=1}^{W} \text{Completed Scheduled Habits}}{\sum_{d=1}^{W} \text{Total Scheduled Habits}} \times 100\%$$
  - Fix `insights-view.js` to compute `Score30d` and `Score90d` via the aggregate formula across all active habits.
  - Add missing translations (`heatmap_subtitle`) and eliminate duplicate `<h2>` titles in `identity-view.js`.
  - Add regression test cases in `tests/habit-tracker-engine-math.test.js` and `tests/habit-tracker-lightpanda-smoke.test.js`.

### Decision 3: 4-Step Language-First Setup Wizard
- **Outcome**: Restructure the Identity Setup Wizard into a 4-step progressive modal:
  - **Step 1: Language Selection**: Prominent interactive selection cards (`🇻🇳 Tiếng Việt` vs `🇺🇸 English`) with immediate reactivity and persistence to `store.updateSettings({ lang })`.
  - **Step 2: 4 Life Pillars**: Introduction to core domains (`Health`, `Mind`, `Craft`, `Discipline`).
  - **Step 3: Curated Starter Kits**: 1-click starter kit selection (`Morning Mastery`, `Deep Focus`, `Vitality`, `Zen`).
  - **Step 4: Confirmation & Instant Launch**: Preview selected habits and 1-tap activation.

### Decision 4: Impeccable Timer Refinement & Floating Dynamic Island
- **Outcome**:
  - Update timer button labels: change `Start Timer` / `Bắt đầu hẹn giờ` to concise `Start` / `Bắt đầu` (`Pause` / `Tạm dừng`).
  - **Card Timer Decluttering**: Remove redundant time numbers. Collapsed subtitle displays concise status (`⏱️ 12:00 / 20:00` or `⏱️ Còn 8 phút` when running). Expanded drawer provides a clean control bar (`[ ▶ Start ]`, `[ 🔄 Reset ]`, single focal ticker `12:00 / 20:00`, `[ 🎯 Focus Mode ]`, `[ Details ➔ ]`).
  - **Floating Dynamic Timer Island (`#floating-timer-island`)**: Replace top-header timer pill with an ergonomic floating island anchored above the bottom dock (`bottom-20` / `z-40`). Displays habit icon, habit name, live sub-second countdown, mini progress bar, and 1-tap Play/Pause toggle. Tapping the island opens the distraction-free Focus Timer Modal.

## Consequences

### Positive
- Header layout is perfectly aligned across screen sizes with uniform touch targets.
- Insights metrics are mathematically accurate with zero false streaks.
- Non-Vietnamese speakers can immediately switch to English on first launch.
- Habit cards are decluttered and intuitive to operate.
- Active timer status is accessible anywhere in the app with ergonomic thumb reach.

### Negative
- Adds a dynamic floating island element requiring coordinate positioning above the bottom navigation dock.
