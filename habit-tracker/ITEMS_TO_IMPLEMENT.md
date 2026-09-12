# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and feature backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎯 Impeccable UI/UX Overhaul & Defect Backlog

### Stage 1: Core Hardening & Defect Remediation (Issues #425, #426, #427)

- [ ] **Form Event Interception (#425)**:
  - Attach `e.preventDefault()` on `#habit-edit-form` submit to stop browser GET page reloads.
  - Attach `e.preventDefault()` on `#habit-note-form` in Detail Sheet to save reflection notes without page reload.
  - Validate non-empty name and positive numeric targets/step values.
- [ ] **Data Export & Import API Repair (#426)**:
  - Fix method binding in `app.js` to call `exportImport.exportToJson` and trigger browser file download.
  - Implement `store.importState(data, mode)` supporting `merge` and `replace` without throwing `TypeError`.
  - Display localized success/error toasts upon export/import completion.
- [ ] **Habit Reordering Engine (#427)**:
  - Implement `▲` (move up) and `▼` (move down) habit reordering within the same routine cluster in Habit Manager.
  - Handle boundary edge cases gracefully (disable or no-op on top/bottom habits).
  - Persist updated habit sequence to IndexedDB and update Today view ordering immediately.

---

### Stage 2: Localization Parity, Clean Modal Backdrops & Light Mode Contrast (Issues #428, #429)

- [ ] **Bilingual Dictionary Completion (#428)**:
  - Map all raw keys (`settings_tab`, `theme_select`, `cloud_backup_title`, `export_import_title`, `export_json_btn`, `import_json_btn`, `pwa_version`, `check_updates_btn`, `purge_cache_btn`) in `translations.js`.
  - Bind bottom navigation dock tab labels dynamically to active language (`Hôm nay` / `Today`, `Thống kê` / `Insights`, `Thói quen` / `Habits`, `Cài đặt` / `Settings`).
  - Translate all system toasts and cloud sync dialog messages.
- [ ] **Single Clean Modal Overlay Architecture (#429)**:
  - Remove redundant inner `#habit-edit-modal-backdrop` and `#habit-detail-sheet-backdrop` from template generators (`manager-view.js`, `detail-sheet.js`).
  - Utilize single outer container in `index.html` with `role="dialog"`, `aria-modal="true"`, and click-outside backdrop dismissal.
  - Resolve iOS scroll lock on nested scrollable sheets.
- [ ] **Light Mode Contrast Parity (#429)**:
  - Refactor all hardcoded dark classes (`bg-slate-950`, `bg-slate-900`, `text-white`, `border-slate-800`) to use responsive dark variants (`bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`).
  - Ensure all text, badges, borders, and inputs satisfy WCAG AA ratio ($\ge 4.5:1$) in both light and dark modes.

---

### Stage 3: Impeccable Visual Foundations & Typographic Scale (`audit`, `typeset`, `colorize`, `layout`)

- [ ] **Accessible Heading Hierarchy & Document Outline**:
  - Adjust top header to `<h1>Atomic Habits</h1>` (`text-sm font-black` identifier).
  - Use `<h2>` for primary view tabs, `<h3>` for routine section headers, and `<h4>` for habit card titles.
  - Eliminate skipped headings in PWA update banners.
  - Remove nested `<main class="routine-list">` element inside outer `<main id="main-content">`.
- [ ] **Fluid Typography & Number Tabular Alignment**:
  - Apply `tabular-nums` / `font-mono` to all numeric counters, countdown timers, streak values, and consistency percentages.
  - Enforce strict $\ge 1.25\times$ typographic ratio between headings and adjacent body elements.
- [ ] **Color Contrast Remediation**:
  - Upgrade low-contrast subtitle text from `text-slate-500` (#64748b, 3.1:1) to `text-slate-400` (#94a3b8, 4.64:1) or `text-slate-300` (#cbd5e1, 8.52:1).
  - Eliminate AI-telltale palette warnings (`text-violet-400` on dark headings).
- [ ] **Mobile Thumb-Zone Layout & Safe Insets**:
  - Verify bottom dock safe area padding (`env(safe-area-inset-bottom, 16px)`).
  - Maintain $\ge 48 \times 48\text{px}$ minimum touch targets on all interactive controls.

---

### Stage 4: Motion, Delight, Onboarding & Polish (`animate`, `delight`, `onboard`, Issue #430, `polish`)

- [ ] **Preset Emoji / Icon Grid Picker in Habit Modal (#430)**:
  - Provide a quick-pick grid of 12+ popular habit emojis (🏃, 💧, 📖, 🧘, 💻, 🥗, 💊, ✍️, 🏋️, 😴, 🎯, 🌿) with custom write-in input.
- [ ] **Floating Glassmorphic "Undo" Pill Toast (#430)**:
  - Render a floating pill toast positioned above the bottom dock for 4 seconds after completing or incrementing a habit.
  - Clicking **Hoàn tác / Undo** immediately rolls back the check-in and updates progress rings without leaving the view.
- [ ] **Interactive 52-Week Calendar Heatmap Navigation (#430)**:
  - Enable tapping/clicking on past date cells in the 52-week heatmap to jump active date to that day on the Today tab with a pulsing highlight.
- [ ] **Live Touch Gesture Resistance**:
  - Add real-time `touchmove` CSS `transform: translateX(px)` on swipe-to-complete with rubber-band spring resistance.
- [ ] **Running Timer Floating Ambient Indicator**:
  - Display an active timer ticker badge in the top header or dock when a countdown/stopwatch is ticking in the background.
- [ ] **Habit Deletion Confirmation Dialog**:
  - Display an accessible confirmation modal before permanently deleting a habit and its historical logs.
- [ ] **Compaction Build & Final Quality Gate**:
  - Run `npm run build:habit-tracker` and verify compact single-file `dist/index.html`.
  - Pass full multi-device automated Playwright E2E and unit test suites.
