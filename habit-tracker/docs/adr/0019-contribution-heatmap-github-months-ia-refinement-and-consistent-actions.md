# ADR-0019: Contribution Heatmap GitHub-Style Month Headers, Insights Section Reordering, Today Tab Subtitle Decluttering & Habits Header Action Consistency

## Status

Accepted

## Context & Problem Statement

During UX refinement and dogfooding of the **Atomic Habit & Routine Tracker**, five usability, visual hierarchy, and information architecture improvements were identified:

1. **Today Tab Habit Item Subtitle Redundancy**: Habit items are already grouped into collapsible circadian routine sections (`🌅 Morning Routine`, `☀️ Afternoon Routine`, `🌙 Evening Routine`, `🔄 Anytime`). Displaying the routine name within each habit card's subtitle (e.g. `Morning • 0 / 2,000 ml`) creates redundant cognitive noise and text clutter.
2. **Insights Contribution Heatmap Nomenclature & Centering**: The title "52-Week Contribution Heatmap" is rigid when users switch between `30d`, `90d`, and `52w` timeframe lenses. Furthermore, the timeframe segmented control (`#heatmap-timeframe-picker`) is left-aligned on large viewports rather than harmoniously centered.
3. **Heatmap Chronological Month Orientation (GitHub-Style)**: The horizontal heatmap cell grid displays 7 weekday rows without month reference headers across the top, making long-range horizontal navigation disorienting compared to the standard GitHub contribution graph.
4. **Insights Section Information Flow**: "Day of Week Consistency" was positioned below the Contribution Heatmap. Placing 7-day cyclical weekly consistency directly below the High-Level Life Domain Pillars provides a more natural macro-to-micro analytics progression before the granular day-by-day contribution heatmap.
5. **Habits Tab Action Consistency & Footer Decluttering**:
   - The Habits tab had a redundant secondary footer button (`Browse All Starter Kits`) at the bottom of the catalog.
   - The top header button for Starter Kits (`📚`) hid its text on mobile (`hidden sm:inline`), rendering an ambiguous bare icon button.
   - The `+ Add Habit` button lacked an icon container for visual consistency with the `📚` action button.

## Decision Drivers

- **Zero Redundancy (Clean Subtitles)**: Eliminate duplicated circadian routine tags from habit card subtitles in the Today tab.
- **GitHub Contribution Parity**: Provide localized month indicators (`Jan`, `Feb`, ... / `Thg 1`, `Thg 2`, ...) aligned with week columns across all timeframes (`30d`, `90d`, `52w`) with collision prevention.
- **Macro-to-Micro Analytics Hierarchy**: Streamline Insights layout: Stat Cards ➔ Life Domain Pillars ➔ Day-of-Week Consistency ➔ Contribution Heatmap ➔ Routine Adherence ➔ Milestone Badges.
- **Header Action Ergonomics & Consistency**: Standardize header action buttons with paired icons and responsive text (`[ 📚 Starter Kits ]` / `[ ➕ Add Habit ]`), and eliminate redundant footer CTAs.

## Considered Options & Decision Outcome

### 1. Today Tab Habit Subtitle Decluttering

- **Chosen**: Remove the routine text mapping entirely from `renderHabitCard` in `today-view.js`. The subtitle cleanly displays numeric/timer progress (e.g. `1,200 / 2,000 ml` or `⏱️ 08:30 / 15:00`) and note previews when present, without any preceding routine name string.

### 2. Contribution Heatmap Title, Centering & GitHub-Style Month Indicators

- **Chosen**:
  - Update i18n key `yearly_heatmap_title` to "Contribution Heatmap" (`Contribution Heatmap` in EN, `Biểu đồ đóng góp` in VI).
  - Center `#heatmap-timeframe-picker` using `mx-auto` on all viewports.
  - Dynamically compute month header labels corresponding to the start of each month in the week columns of the selected timeframe (`30d`, `90d`, `52w`). Place month labels in a top header row with a minimum 3-week column gap to prevent collision, scrolling synchronously with the heatmap grid.

### 3. Insights Tab Section Reordering

- **Chosen**: Move `renderWeekdayChart` (`${weekdayHtml}`) above `renderYearlyHeatmapGrid` (`${heatmapHtml}`) in `renderInsightsView` inside `insights-view.js`.

### 4. Habits Tab Action Consistency & Footer Removal

- **Chosen**:
  - Remove the bottom `Browse All Starter Kits` footer button block from `identity-view.js`.
  - In the Habits tab header:
    - Update `[ 📚 ]` button to display responsive text `📚 Starter Kits` (EN) / `📚 Gói mẫu` (VI) on mobile, expanding to `📚 Browse Starter Kits` (EN) / `📚 Gói thói quen mẫu` (VI) on tablet/desktop.
    - Standardize the `[ + Add Habit ]` button to use icon + text `➕ Add Habit` (EN) / `➕ Thêm thói quen` (VI) with uniform padding, rounded corners, and touch targets.

## Consequences

### Positive

- Clean, focused habit cards in the Today view free of redundant routine badges.
- Intuitive GitHub-grade contribution graph with localized month labels and centered timeframe controls.
- Logical macro-to-micro analytics progression on the Insights tab.
- Unified, consistent icon + text header buttons in the Habits tab with zero footer clutter.

### Negative / Trade-offs

- Heatmap grid rendering code requires calculating week-to-month column offsets for dynamic timeframes.
