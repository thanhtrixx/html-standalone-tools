# ADR-0017: Core Life Pillars Assignment, 52-Week Heatmap Ergonomics, Habits Tab IA Decluttering & Streak Transparency

## Status

Accepted

## Context & Problem Statement

During review and dogfooding of the **Atomic Habit Tracker**, four critical usability gaps and architectural deficiencies were identified:

1. **Life Pillar Categorization Gap**: While the application defines 4 Core Life Pillars (`Health`, `Mind`, `Craft`, `Discipline`) with domain balance rings in Insights, the Add/Edit Habit Modal lacks a Pillar selector. Custom-created habits silently default to `health`, leaving users unable to organize their habits across core life domains.
2. **Heatmap Touch Gesture Collision & Inverted Orientation**:
   - On the `Insights` tab, horizontal swipe navigation (`diffX >= 50px`) captures touch gestures starting on the 52-Week Heatmap (`.heatmap-container` / `.overflow-x-auto`) and erroneously switches tabs to `Habits`.
   - The heatmap grid initially renders at `scrollLeft = 0`, presenting historical activity from 12 months ago rather than today's current momentum.
3. **Habits Tab Cognitive Overload (IA Clutter)**:
   - The `Habits` tab stacks routine reordering, habit management, archived habits, an omnipresent Identity Setup Wizard banner, and 4 lengthy vertical Starter Kit cards on a single page, violating Miller's Law ($\le 4$ working memory chunks) and cluttering everyday habit management.
4. **Streak Calculation & Anti-Guilt Transparency**:
   - The engine supports schedule-aware streak calculation and monthly streak freeze token deductions, but the Habit Detail Sheet lacks transparent auditing on how `Best Streak` and `Current Streak` were achieved (including frozen days and off-schedule days).

## Decision Drivers

- **Atomic Identity First**: Every habit must belong to an explicit Life Pillar (`Health`, `Mind`, `Craft`, `Discipline`) with visible visual identity tokens (accent glow, badges).
- **Mobile Touch Physics & Zero Gesture Conflicts**: Scrolling through data visualizations must never accidentally trigger global tab navigation.
- **Miller's Law & Clean Separation of Concerns**: Keep everyday habit management (high-velocity catalog) separated from exploratory onboarding actions (Starter Kits, Setup Wizard).
- **Anti-Guilt Trust & Streak Auditing**: Provide transparent streak metrics explaining how freeze tokens and off-schedule days preserved momentum.

## Considered Options & Decision Outcome

### 1. Core Life Pillar Assignment in Add/Edit Modal

- **Chosen**: Add a 4-Pillar Segmented Selector (`🌿 Health`, `⚡ Craft`, `🔮 Mind`, `🔥 Discipline`) directly in Stage 1 of `renderHabitEditModal`, persist `habit.domain` in store, and display pillar badges with color glow on Habit Cards and Detail Sheets.

### 2. 52-Week Heatmap Touch Isolation & Ergonomics

- **Chosen**:
  - Add `.heatmap-container`, `.overflow-x-auto`, and `.heatmap-cell` to `skipSelectors` in `setupTabSwipeGestures()`.
  - Auto-scroll the heatmap viewport to the far right (`scrollLeft = scrollWidth`) upon render to immediately display current weeks.
  - Render month indicators (Jan–Dec) along the top and Day-of-Week labels (M, W, F) along the left column.
  - Provide a quick Timeframe Lens Toggle (`Last 30 Days` / `Last 90 Days` / `Full 52 Weeks`).

### 3. Habits Tab Information Architecture (IA) Decluttering

- **Chosen**:
  - Dedicate the `Habits` tab exclusively to active routine management with collapsible routine accordions (`🌅 Morning`, `☀️ Afternoon`, `🌙 Evening`, `🔄 Anytime`), instant habit search/filter, and drag-and-drop reordering.
  - Relocate Curated Starter Kits into a dedicated _"Browse Starter Kits 📚"_ modal/bottom sheet.
  - Render the Identity Setup Wizard banner prominently only during empty states (`habits.length === 0`), accessible via a subtle header action when habits exist.

### 4. Best Streak Auditing & Historical Transparency

- **Chosen**:
  - Enhance the Habit Detail Sheet with a comprehensive "Streak & Momentum Audit" displaying Current Streak, Best Streak record, freeze tokens utilized, and schedule cadence.

## Consequences

### Positive

- Users can deliberately categorize every habit into one of 4 Core Life Pillars with instant domain balance feedback.
- Seamless, conflict-free horizontal scrolling on mobile within the 52-week heatmap, anchored directly to today's date.
- Ultra-clean, fast Habits tab focused solely on daily routine management without sprawling starter kit cards.
- Complete transparency in streak preservation and anti-guilt freeze token usage.

### Negative / Trade-offs

- Starter kits require an extra tap to open the discovery modal, but this declutters the primary daily view.
- Stage 1 of the Add/Edit Habit modal gains a domain selector, requiring clean mobile layout alignment.
