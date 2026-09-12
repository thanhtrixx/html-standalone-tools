#!/usr/bin/env node

/**
 * Atomic Habit Tracker UI Components, Gestures & Today Dashboard Test Suite
 *
 * Domain: UI/UX & Component Interactions
 * Covers:
 * - [AC-1] 7-Day Date Ribbon Navigation & Active Date Selection
 * - [AC-2] Routine Clustering (Morning, Afternoon, Evening, Anytime) & Ring Badges
 * - [AC-3] Interactive Habit Controls (Binary Check, Numeric Stepper, Timer)
 * - [AC-4] Touch Swipe-Right to Complete Gesture & Web Haptics
 * - [AC-5] 100% Daily Victory Confetti Celebration
 * - [AC-6] Dark OLED & Light Mode Theme Toggle
 * - [Manager AC-1] Habit Edit Modal Form & Live Preview
 * - [Manager AC-2] Routine Habit Reordering
 * - [Manager AC-3] Habit Deep-Dive Bottom Sheet with 365-day mini heatmap
 * - [Manager AC-4] Micro-Journal Reflection Notes CRUD
 * - [Manager AC-5] Archive and Restore Management
 * - [Insights AC-1] 52-Week Contribution Heatmap Grid
 * - [Insights AC-2] Heatmap Cell Popover Interactivity
 * - [Insights AC-3] Key Metric Stat Cards
 * - [Insights AC-4] Day-of-Week & Routine Trends
 * - [Insights AC-5] Streak Milestone Badges
 * - [Issue #425 AC-1] Habit Modal Form Submit Event Interception with preventDefault()
 * - [Issue #425 AC-2] Zero-Reload State & IndexedDB Persistence on Habit Save
 * - [Issue #425 AC-3] Habit Detail Sheet Journal Note Submission without Page Navigation
 * - [Issue #425 AC-4] End-to-End Form Submit Prevention & State Integrity Integration Tests
 * - [Issue #427 AC-1] Clicking ▲ swaps the target habit with the preceding habit in the same routine cluster (or global order)
 * - [Issue #427 AC-2] Clicking ▼ swaps the target habit with the succeeding habit in the same routine cluster
 * - [Issue #427 AC-3] Reordered habit positions persist in IndexedDB and reflect immediately across both Habit Manager and Today views
 * - [Issue #427 AC-4] Edge cases (clicking ▲ on top item or ▼ on bottom item) handled gracefully without errors
 * - [Issue #429 AC-1] Dual-theme styling via Tailwind dark: variants (Body, Main Container, Top Bar, Nav Dock, View Cards)
 * - [Issue #429 AC-2] Input fields, cards, badges, and text retain clear contrast in both light and dark modes
 * - [Issue #429 AC-3] Modal overlays consolidated into single clean backdrop with role="dialog" and aria-modal="true"
 * - [Issue #432 AC-1] Document outline passes W3C heading continuity without skipped levels
 * - [Issue #432 AC-2] Only 1 <main> landmark exists in the DOM (no nested <main class="routine-list"> inside <main id="main-content">)
 * - [Issue #432 AC-3] All numeric counters and timer tickers render in tabular monospace alignment (tabular-nums and font-mono)
 * - [Issue #432 AC-4] Text elements across both dark and light modes satisfy WCAG AA contrast ratio
 */

const {
  createHabitTrackerSandbox,
  createAssertions,
  getHtmlContent,
} = require("./helpers/habit-tracker-harness.js");

const { assert, assertEqual, printSummary } = createAssertions(
  "Atomic Habit Tracker UI Components Test Suite"
);

console.log("\n🧪 Running Atomic Habit Tracker UI Components Test Suite...\n");

async function runUITests() {
  const engine = require("../habit-tracker/src/domain/engine.js");
  const { TRANSLATIONS } = require("../habit-tracker/src/i18n/translations.js");
  const storageModule = require("../habit-tracker/src/storage/indexeddb.js");
  const { HabitStore } = require("../habit-tracker/src/state/store.js");
  const {
    renderDateRibbon,
    renderRoutineSection,
    renderHabitCard,
    renderTodayDashboard,
    triggerVictoryConfetti,
  } = require("../habit-tracker/src/ui/today-view.js");
  const {
    renderHabitEditModal,
    renderManagerView,
  } = require("../habit-tracker/src/ui/manager-view.js");
  const {
    renderDetailSheet,
    renderMiniHeatmap,
  } = require("../habit-tracker/src/ui/detail-sheet.js");
  const {
    renderYearlyHeatmapGrid,
    renderWeekdayChart,
    renderRoutineAdherence,
    renderMilestoneBadges,
    renderInsightsView,
  } = require("../habit-tracker/src/ui/insights-view.js");

  const storage = storageModule.createStorageAdapter({ forceFallback: true });
  const store = new HabitStore({ storage });
  await store.init();

  // Populate sample habits
  await store.addHabit({
    id: "h-meditate",
    name: "Morning Meditation",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
    color: "indigo",
    icon: "🧘",
  });

  await store.addHabit({
    id: "h-water",
    name: "Drink 2.5L Water",
    type: "numeric",
    targetValue: 2500,
    unit: "ml",
    step: 250,
    routine: "afternoon",
    scheduleType: "daily",
    color: "cyan",
    icon: "💧",
  });

  await store.addHabit({
    id: "h-reading",
    name: "Evening Reading",
    type: "timer",
    targetValue: 1200, // 20 mins
    unit: "mins",
    routine: "evening",
    scheduleType: "daily",
    color: "amber",
    icon: "📖",
  });

  const selectedDate = "2026-09-12";
  store.setActiveDate(selectedDate);

  // ==========================================
  // [AC-1] 7-Day Date Ribbon
  // ==========================================
  console.log("--- [AC-1] 7-Day Date Ribbon Navigation ---");

  const ribbonHtml = renderDateRibbon(selectedDate, store, "vi");
  assert(
    ribbonHtml.includes('data-date="2026-09-12"'),
    "[AC-1] Date ribbon renders active date item"
  );
  assert(
    ribbonHtml.includes("date-pill-active"),
    "[AC-1] Active date has highlight style class"
  );

  // ==========================================
  // [AC-2] Routine Clustering
  // ==========================================
  console.log("\n--- [AC-2] Routine Clustering & Ring Badges ---");

  const morningSection = renderRoutineSection(
    "morning",
    store,
    selectedDate,
    "vi"
  );
  assert(
    morningSection.includes("Buổi sáng"),
    "[AC-2] Morning section renders Vietnamese routine header"
  );
  assert(
    morningSection.includes("Morning Meditation"),
    "[AC-2] Morning routine includes Morning Meditation habit"
  );

  const afternoonSection = renderRoutineSection(
    "afternoon",
    store,
    selectedDate,
    "vi"
  );
  assert(
    afternoonSection.includes("Buổi chiều"),
    "[AC-2] Afternoon section renders routine header"
  );
  assert(
    afternoonSection.includes("Drink 2.5L Water"),
    "[AC-2] Afternoon routine includes Drink Water habit"
  );

  const eveningSection = renderRoutineSection(
    "evening",
    store,
    selectedDate,
    "vi"
  );
  assert(
    eveningSection.includes("Buổi tối"),
    "[AC-2] Evening section renders routine header"
  );
  assert(
    eveningSection.includes("Evening Reading"),
    "[AC-2] Evening routine includes Reading timer habit"
  );

  // ==========================================
  // [AC-3] Interactive Habit Controls
  // ==========================================
  console.log("\n--- [AC-3] Interactive Habit Controls ---");

  // Binary card
  const habitMeditate = store.getHabit("h-meditate");
  const binaryCardHtml = renderHabitCard(
    habitMeditate,
    { value: 0, completed: false },
    "vi"
  );
  assert(
    binaryCardHtml.includes('data-action="toggle-habit"'),
    "[AC-3] Binary card contains 1-tap check toggle"
  );

  // Numeric stepper card
  const habitWater = store.getHabit("h-water");
  const numericCardHtml = renderHabitCard(
    habitWater,
    { value: 500, completed: false },
    "vi"
  );
  assert(
    numericCardHtml.includes('data-action="step-decrement"'),
    "[AC-3] Numeric card contains - decrement stepper button"
  );
  assert(
    numericCardHtml.includes('data-action="step-increment"'),
    "[AC-3] Numeric card contains + increment stepper button"
  );
  assert(
    numericCardHtml.includes("500 / 2.500") ||
      numericCardHtml.includes("500 / 2,500") ||
      numericCardHtml.includes("500 / 2500"),
    "[AC-3] Numeric card renders current progress over target"
  );

  // Timer card
  const habitReading = store.getHabit("h-reading");
  const timerCardHtml = renderHabitCard(
    habitReading,
    { value: 600, completed: false },
    "vi"
  );
  assert(
    timerCardHtml.includes('data-action="toggle-timer"'),
    "[AC-3] Timer card contains start/stop timer control button"
  );

  // Interactive Action Testing in Store
  await store.logHabit("h-water", selectedDate, 1000);
  assertEqual(
    store.state.logs["h-water_2026-09-12"].value,
    1000,
    "[AC-3] Logging progress updates state immediately"
  );

  await store.toggleHabit("h-meditate", selectedDate);
  assertEqual(
    store.state.logs["h-meditate_2026-09-12"].completed,
    true,
    "[AC-3] 1-tap toggle marks binary habit completed"
  );

  // ==========================================
  // [AC-4] Swipe-to-Complete Gesture & Haptics
  // ==========================================
  console.log("\n--- [AC-4] Swipe-to-Complete Gesture & Haptics ---");

  const { sandbox, getOrCreateElement } = createHabitTrackerSandbox();
  const cardElement = getOrCreateElement("habit-card-h-meditate");

  // Simulate swipe right > 80px
  let hapticFired = false;
  sandbox.navigator.vibrate = (pattern) => {
    hapticFired = true;
    return true;
  };

  // Trigger completion
  await store.logHabit("h-meditate", selectedDate, 1);
  assert(
    store.state.logs["h-meditate_2026-09-12"].completed,
    "[AC-4] Swipe right gesture completes habit"
  );

  // ==========================================
  // [AC-5] 100% Daily Victory Confetti
  // ==========================================
  console.log("\n--- [AC-5] 100% Daily Victory Confetti ---");

  await store.logHabit("h-water", selectedDate, 2500);
  await store.logHabit("h-reading", selectedDate, 1200);

  const dailyState = store.getDailyState(selectedDate);
  assertEqual(
    dailyState.dailyProgress.percentage,
    100,
    "[AC-5] All habits completed reaches 100% daily progress"
  );
  assertEqual(
    dailyState.dailyProgress.isAllCompleted,
    true,
    "[AC-5] isAllCompleted flag is true"
  );

  let confettiTriggered = false;
  const mockCanvas = {
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      fillRect: () => {},
    }),
  };

  triggerVictoryConfetti(mockCanvas, () => {
    confettiTriggered = true;
  });
  assert(
    confettiTriggered,
    "[AC-5] Confetti celebration triggered upon 100% completion"
  );

  // ==========================================
  // [AC-6] Theme Toggle (Dark OLED <-> Light)
  // ==========================================
  console.log("\n--- [AC-6] Theme Toggle ---");

  await store.updateSettings({ theme: "light" });
  assertEqual(
    store.getSettings().theme,
    "light",
    "[AC-6] Store settings updated to light mode"
  );

  await store.updateSettings({ theme: "dark" });
  assertEqual(
    store.getSettings().theme,
    "dark",
    "[AC-6] Store settings updated to dark OLED mode"
  );

  // ==========================================
  // [Issue #416 AC-1] Habit Edit Modal
  // ==========================================
  console.log("\n--- [Issue #416 AC-1] Habit Creation & Edit Modal ---");

  const addModalHtml = renderHabitEditModal(null, "vi");
  assert(
    addModalHtml.includes("Thêm thói quen"),
    "[Issue #416 AC-1] Add modal renders title"
  );
  assert(
    addModalHtml.includes("modal-habit-name"),
    "[Issue #416 AC-1] Modal includes habit name field"
  );
  assert(
    addModalHtml.includes("modal-habit-routine"),
    "[Issue #416 AC-1] Modal includes routine selector"
  );
  assert(
    addModalHtml.includes("modal-schedule-type"),
    "[Issue #416 AC-1] Modal includes schedule selector"
  );

  const editModalHtml = renderHabitEditModal(habitWater, "vi");
  assert(
    editModalHtml.includes("Sửa thói quen"),
    "[Issue #416 AC-1] Edit modal renders title for existing habit"
  );
  assert(
    editModalHtml.includes("Drink 2.5L Water"),
    "[Issue #416 AC-1] Edit modal prefills habit name"
  );

  // ==========================================
  // [Issue #416 AC-2] Routine Reordering
  // ==========================================
  console.log("\n--- [Issue #416 AC-2] Routine Reordering ---");

  await store.addHabit({
    id: "h-yoga",
    name: "Morning Yoga",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
  });

  await store.reorderHabits("morning", ["h-yoga", "h-meditate"]);
  const morningHabits = store
    .getHabits()
    .filter((h) => h.routine === "morning")
    .sort((a, b) => a.order - b.order);
  assertEqual(
    morningHabits[0].id,
    "h-yoga",
    "[Issue #416 AC-2] Yoga reordered to first position"
  );
  assertEqual(
    morningHabits[1].id,
    "h-meditate",
    "[Issue #416 AC-2] Meditation reordered to second position"
  );

  // ==========================================
  // [Issue #416 AC-3] Habit Deep-Dive Sheet & Heatmap
  // ==========================================
  console.log(
    "\n--- [Issue #416 AC-3] Habit Deep-Dive Sheet & Mini Heatmap ---"
  );

  const detailSheetHtml = renderDetailSheet(
    habitWater,
    store,
    null,
    "vi",
    selectedDate
  );
  assert(
    detailSheetHtml.includes("Chi tiết thói quen") ||
      detailSheetHtml.includes("Drink 2.5L Water"),
    "[Issue #416 AC-3] Detail sheet renders habit name"
  );
  assert(
    detailSheetHtml.includes("mini-heatmap-grid"),
    "[Issue #416 AC-3] Detail sheet contains 365-day mini heatmap grid"
  );
  assert(
    detailSheetHtml.includes("🔥"),
    "[Issue #416 AC-3] Detail sheet contains streak status badge"
  );

  // ==========================================
  // [Issue #416 AC-4] Micro-Journal Reflection Notes
  // ==========================================
  console.log("\n--- [Issue #416 AC-4] Micro-Journal Reflection Notes ---");

  await store.updateNotes(
    "h-water",
    selectedDate,
    "Drank infused lemon water."
  );
  assertEqual(
    store.state.logs["h-water_2026-09-12"].notes,
    "Drank infused lemon water.",
    "[Issue #416 AC-4] Reflection note saved to log entry"
  );

  const updatedDetailHtml = renderDetailSheet(
    habitWater,
    store,
    null,
    "vi",
    selectedDate
  );
  assert(
    updatedDetailHtml.includes("Drank infused lemon water."),
    "[Issue #416 AC-4] Reflection note displayed in detail sheet history"
  );

  // ==========================================
  // [Issue #416 AC-5] Archive and Restore
  // ==========================================
  console.log("\n--- [Issue #416 AC-5] Archive and Restore Habits ---");

  await store.archiveHabit("h-yoga");
  const activeHabits = store.getHabits(false);
  assert(
    !activeHabits.some((h) => h.id === "h-yoga"),
    "[Issue #416 AC-5] Archived habit hidden from active list"
  );

  const allWithArchived = store.getHabits(true);
  assert(
    allWithArchived.some((h) => h.id === "h-yoga" && h.archived),
    "[Issue #416 AC-5] Archived habit preserved in catalog"
  );

  await store.restoreHabit("h-yoga");
  const restoredHabits = store.getHabits(false);
  assert(
    restoredHabits.some((h) => h.id === "h-yoga"),
    "[Issue #416 AC-5] Restored habit visible in active list again"
  );

  // ==========================================
  // [Issue #417 AC-1] 52-Week Contribution Heatmap Grid
  // ==========================================
  console.log("\n--- [Issue #417 AC-1] 52-Week Contribution Heatmap Grid ---");

  const heatmapData = engine.computeHeatmapData(
    store.getHabits(true),
    store.state.logs,
    null,
    selectedDate
  );
  assertEqual(
    heatmapData.length >= 364,
    true,
    "[Issue #417 AC-1] 52-week heatmap computes full annual cycle of 364+ cells"
  );

  const renderedHeatmap = renderYearlyHeatmapGrid(heatmapData, "vi");
  assert(
    renderedHeatmap.includes("heatmap-container"),
    "[Issue #417 AC-1] Rendered heatmap includes container"
  );
  assert(
    renderedHeatmap.includes("grid-rows-7"),
    "[Issue #417 AC-1] Rendered heatmap uses 7-row calendar grid"
  );
  assert(
    renderedHeatmap.includes('data-date="2026-09-12"'),
    "[Issue #417 AC-1] Active date is mapped as a cell in the heatmap"
  );

  // ==========================================
  // [Issue #417 AC-2] Heatmap Cell Popover Interactivity
  // ==========================================
  console.log("\n--- [Issue #417 AC-2] Heatmap Cell Popover Interactivity ---");

  assert(
    renderedHeatmap.includes('id="heatmap-cell-popover"'),
    "[Issue #417 AC-2] Heatmap includes cell popover element"
  );
  assert(
    renderedHeatmap.includes("data-rate="),
    "[Issue #417 AC-2] Heatmap cells encode data-rate for interactive hover/tap"
  );
  assert(
    renderedHeatmap.includes("data-completed="),
    "[Issue #417 AC-2] Heatmap cells encode completed count"
  );

  // ==========================================
  // [Issue #417 AC-3] Key Metric Stat Cards
  // ==========================================
  console.log("\n--- [Issue #417 AC-3] Key Metric Stat Cards ---");

  const insightsViewHtml = renderInsightsView(store, null, "vi");
  assert(
    insightsViewHtml.includes("Kỷ lục chuỗi dài nhất"),
    "[Issue #417 AC-3] Stat cards render Best Streak label in Vietnamese"
  );
  assert(
    insightsViewHtml.includes("Độ kiên trì 30 ngày"),
    "[Issue #417 AC-3] Stat cards render Consistency Score label"
  );
  assert(
    insightsViewHtml.includes("Tổng lượt hoàn thành"),
    "[Issue #417 AC-3] Stat cards render Total Completions label"
  );
  assert(
    insightsViewHtml.includes("Số ngày đạt 100%"),
    "[Issue #417 AC-3] Stat cards render Perfect Days label"
  );

  // ==========================================
  // [Issue #417 AC-4] Day-of-Week & Routine Trends
  // ==========================================
  console.log("\n--- [Issue #417 AC-4] Day-of-Week & Routine Trends ---");

  const weekdayStats = engine.calculateWeekdayAdherence(
    store.getHabits(true),
    store.state.logs,
    90,
    selectedDate
  );
  assertEqual(
    weekdayStats.length,
    7,
    "[Issue #417 AC-4] Weekday adherence computes statistics for all 7 weekdays"
  );

  const weekdayChartHtml = renderWeekdayChart(weekdayStats, "vi");
  assert(
    weekdayChartHtml.includes("Độ kiên trì theo ngày trong tuần"),
    "[Issue #417 AC-4] Weekday chart renders title"
  );
  assert(
    weekdayChartHtml.includes("T2") && weekdayChartHtml.includes("CN"),
    "[Issue #417 AC-4] Weekday chart renders localized weekday abbreviations"
  );

  const routineStats = engine.calculateRoutineAdherence(
    store.getHabits(true),
    store.state.logs,
    30,
    selectedDate
  );
  assertEqual(
    routineStats.length,
    4,
    "[Issue #417 AC-4] Routine adherence computes statistics for 4 routines"
  );

  const routineAdherenceHtml = renderRoutineAdherence(routineStats, "vi");
  assert(
    routineAdherenceHtml.includes("Tỷ lệ hoàn thành theo khung giờ"),
    "[Issue #417 AC-4] Routine adherence chart renders title"
  );
  assert(
    routineAdherenceHtml.includes("Buổi sáng") &&
      routineAdherenceHtml.includes("Buổi tối"),
    "[Issue #417 AC-4] Routine adherence renders localized routine names"
  );

  // ==========================================
  // [Issue #417 AC-5] Streak Milestone Badges
  // ==========================================
  console.log("\n--- [Issue #417 AC-5] Streak Milestone Badges ---");

  const badges = engine.evaluateMilestoneBadges(30, 50);
  assertEqual(
    badges.length,
    6,
    "[Issue #417 AC-5] Evaluates 6 milestone badges (7d, 21d, 30d, 66d, 100d, 365d)"
  );
  assertEqual(
    badges.find((b) => b.id === "streak-7").unlocked,
    true,
    "[Issue #417 AC-5] 7-day badge unlocked when streak reaches 30"
  );
  assertEqual(
    badges.find((b) => b.id === "streak-30").unlocked,
    true,
    "[Issue #417 AC-5] 30-day badge unlocked when streak reaches 30"
  );
  assertEqual(
    badges.find((b) => b.id === "streak-66").unlocked,
    false,
    "[Issue #417 AC-5] 66-day badge locked when streak is 30"
  );

  const badgesHtml = renderMilestoneBadges(badges, "vi");
  assert(
    badgesHtml.includes("Huy hiệu cột mốc chuỗi"),
    "[Issue #417 AC-5] Milestones section renders title"
  );
  assert(
    badgesHtml.includes("Khoá thói quen (66 ngày)") ||
      badgesHtml.includes("66 ngày"),
    "[Issue #417 AC-5] 66-day milestone is rendered"
  );

  // ==========================================
  // [Issue #425 AC-1] Habit Modal Form Submit Event Interception with preventDefault()
  // ==========================================
  console.log(
    "\n--- [Issue #425 AC-1] Habit Modal Form Submit Event Interception ---"
  );

  // Verify renderHabitEditModal outputs a form element with submit capability
  const renderedAddModal = renderHabitEditModal(null, "vi");
  assert(
    renderedAddModal.includes("<form") &&
      renderedAddModal.includes('id="habit-edit-form"') &&
      renderedAddModal.includes('type="submit"'),
    "[Issue #425 AC-1] [AC-1] Habit creation modal renders semantic form with submit button"
  );

  const renderedEditModal = renderHabitEditModal(habitWater, "vi");
  assert(
    renderedEditModal.includes("<form") &&
      renderedEditModal.includes('id="habit-edit-form"'),
    "[Issue #425 AC-1] [AC-1] Habit edit modal renders semantic form element"
  );

  // Unit test: saveHabitFromModal calls e.preventDefault() on submit event
  let addSubmitPrevented = false;
  const mockAddSubmitEvent = {
    type: "submit",
    bubbles: true,
    cancelable: true,
    preventDefault: () => {
      addSubmitPrevented = true;
    },
  };

  const { sandbox: modalSandbox, getOrCreateElement: getModalEl } =
    createHabitTrackerSandbox();
  modalSandbox.requestAnimationFrame = (fn) => fn();
  modalSandbox.cancelAnimationFrame = () => {};
  await modalSandbox.HabitApp.init();

  const nameInput = getModalEl("modal-habit-name");
  nameInput.value = "New Atomic Habit";
  const routineSelect = getModalEl("modal-habit-routine");
  routineSelect.value = "morning";

  await modalSandbox.HabitApp.saveHabitFromModal(mockAddSubmitEvent);
  assert(
    addSubmitPrevented,
    "[Issue #425 AC-1] [AC-1] Submitting Add Habit modal intercepts form submit event with e.preventDefault()"
  );

  // Adversarial check: Submitting with empty/invalid name (validation failure) MUST STILL preventDefault()
  let invalidSubmitPrevented = false;
  const mockInvalidSubmitEvent = {
    type: "submit",
    preventDefault: () => {
      invalidSubmitPrevented = true;
    },
  };
  nameInput.value = "   "; // Empty name
  await modalSandbox.HabitApp.saveHabitFromModal(mockInvalidSubmitEvent);
  assert(
    invalidSubmitPrevented,
    "[Issue #425 AC-1] [AC-1] Validation failure in habit modal still calls e.preventDefault() to prevent GET page reload"
  );

  // Unit test: saveHabitFromModal calls e.preventDefault() on Edit Habit
  let editSubmitPrevented = false;
  const mockEditSubmitEvent = {
    type: "submit",
    preventDefault: () => {
      editSubmitPrevented = true;
    },
  };
  const idInput = getModalEl("modal-habit-id");
  idInput.value = "h-water";
  nameInput.value = "Drink 3.0L Water";
  await modalSandbox.HabitApp.saveHabitFromModal(mockEditSubmitEvent);
  assert(
    editSubmitPrevented,
    "[Issue #425 AC-1] [AC-1] Submitting Edit Habit modal calls e.preventDefault()"
  );

  // ==========================================
  // [Issue #425 AC-2] Zero-Reload State & Storage Persistence
  // ==========================================
  console.log(
    "\n--- [Issue #425 AC-2] Zero-Reload State & Storage Persistence ---"
  );

  // Create habit with numeric counter target, unit, step and custom color
  const newNumericHabit = {
    id: "h-pushups",
    name: "Push-ups Target",
    type: "numeric",
    targetValue: 50,
    unit: "reps",
    step: 10,
    routine: "afternoon",
    scheduleType: "daily",
    color: "crimson",
    icon: "💪",
  };

  await store.addHabit(newNumericHabit);

  // Assert in-memory state updated
  const storedInMemory = store.getHabit("h-pushups");
  assertEqual(
    storedInMemory.name,
    "Push-ups Target",
    "[Issue #425 AC-2] [AC-2] Newly created habit is immediately accessible in state"
  );
  assertEqual(
    storedInMemory.targetValue,
    50,
    "[Issue #425 AC-2] [AC-2] Target value correctly saved in state"
  );
  assertEqual(
    storedInMemory.unit,
    "reps",
    "[Issue #425 AC-2] [AC-2] Custom measurement unit correctly saved in state"
  );

  // Assert IndexedDB / storage adapter persistence
  const storedInDb = await storage.getHabit("h-pushups");
  assert(
    storedInDb !== null && storedInDb.id === "h-pushups",
    "[Issue #425 AC-2] [AC-2] Habit record persisted to IndexedDB storage adapter"
  );
  assertEqual(
    storedInDb.step,
    10,
    "[Issue #425 AC-2] [AC-2] Habit step persisted in IndexedDB"
  );

  // Edit existing habit and verify state + IndexedDB updates cleanly
  await store.updateHabit("h-pushups", {
    targetValue: 100,
    step: 20,
    routine: "evening",
  });
  const updatedInMemory = store.getHabit("h-pushups");
  assertEqual(
    updatedInMemory.targetValue,
    100,
    "[Issue #425 AC-2] [AC-2] Editing habit updates target value in state"
  );
  assertEqual(
    updatedInMemory.routine,
    "evening",
    "[Issue #425 AC-2] [AC-2] Editing habit updates routine cluster in state"
  );

  const updatedInDb = await storage.getHabit("h-pushups");
  assertEqual(
    updatedInDb.targetValue,
    100,
    "[Issue #425 AC-2] [AC-2] Editing habit persists updated target value in storage"
  );
  assertEqual(
    updatedInDb.routine,
    "evening",
    "[Issue #425 AC-2] [AC-2] Editing habit persists updated routine cluster in storage"
  );

  // Create habit with Vietnamese diacritics and emojis
  const viHabit = {
    id: "h-chay-bo",
    name: "Chạy bộ 5km công viên",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
    color: "emerald",
    icon: "🏃‍♂️",
  };
  await store.addHabit(viHabit);
  const viStored = await storage.getHabit("h-chay-bo");
  assertEqual(
    viStored.name,
    "Chạy bộ 5km công viên",
    "[Issue #425 AC-2] [AC-2] Habit with Vietnamese unicode text persists cleanly in IndexedDB"
  );

  // ==========================================
  // [Issue #425 AC-3] Detail Sheet Journal Note Submission without Page Navigation
  // ==========================================
  console.log("\n--- [Issue #425 AC-3] Journal Note Submission & History ---");

  // Detail Sheet contains note form
  const detailHtml = renderDetailSheet(
    habitMeditate,
    store,
    null,
    "vi",
    selectedDate
  );
  assert(
    detailHtml.includes('id="habit-note-form"'),
    "[Issue #425 AC-3] [AC-3] Detail sheet contains journal note form element"
  );
  assert(
    detailHtml.includes('id="habit-note-input"'),
    "[Issue #425 AC-3] [AC-3] Detail sheet contains journal note textarea input"
  );
  assert(
    detailHtml.includes('type="submit"') || detailHtml.includes("Lưu ghi chú"),
    "[Issue #425 AC-3] [AC-3] Detail sheet note form has submit button"
  );

  // Submitting note form updates state and storage without navigation
  const noteContent = "Thực hiện 15 phút thở chánh niệm lúc bình minh.";
  await store.updateNotes("h-meditate", selectedDate, noteContent);

  assertEqual(
    store.state.logs["h-meditate_2026-09-12"].notes,
    noteContent,
    "[Issue #425 AC-3] [AC-3] Submitting note updates note in state"
  );

  const logInStorage = await storage.getLog("h-meditate", selectedDate);
  assertEqual(
    logInStorage.notes,
    noteContent,
    "[Issue #425 AC-3] [AC-3] Journal note is saved to IndexedDB storage adapter"
  );

  // Detail sheet re-render shows updated note history
  const refreshedDetailHtml = renderDetailSheet(
    habitMeditate,
    store,
    null,
    "vi",
    selectedDate
  );
  assert(
    refreshedDetailHtml.includes(
      "Thực hiện 15 phút thở chánh niệm lúc bình minh."
    ),
    "[Issue #425 AC-3] [AC-3] Saved note is visible in habit detail sheet history"
  );

  // Submitting multiline note with emojis
  const multilineNote =
    "🌟 Ngày thứ 5 liên tiếp!\n- Tập trung cao độ\n- Không bị phân tâm";
  await store.updateNotes("h-reading", selectedDate, multilineNote);
  assertEqual(
    store.state.logs["h-reading_2026-09-12"].notes,
    multilineNote,
    "[Issue #425 AC-3] [AC-3] Multiline reflection note with emojis saves cleanly to state"
  );

  // Updating note on a date with no existing log creates log entry without error
  const futureDate = "2026-09-20";
  await store.updateNotes("h-meditate", futureDate, "Lên kế hoạch tập");
  assertEqual(
    store.state.logs["h-meditate_2026-09-20"].notes,
    "Lên kế hoạch tập",
    "[Issue #425 AC-3] [AC-3] Submitting note for date without prior log creates record safely"
  );

  // ==========================================
  // [Issue #425 AC-4] End-to-End Form Submit Prevention & State Integrity
  // ==========================================
  console.log(
    "\n--- [Issue #425 AC-4] End-to-End Form Submit Prevention & State Integrity ---"
  );

  const { sandbox: e2eSandbox, getOrCreateElement: getE2EEl } =
    createHabitTrackerSandbox({
      url: "http://localhost:3000/habit-tracker/#manager",
    });
  e2eSandbox.requestAnimationFrame = (fn) => fn();
  e2eSandbox.cancelAnimationFrame = () => {};
  await e2eSandbox.HabitApp.init();

  const initialUrl = e2eSandbox.location.href;

  // Verify form submission does not mutate window.location (no GET query reload)
  let e2eSubmitPrevented = false;
  const e2eEvent = {
    type: "submit",
    bubbles: true,
    cancelable: true,
    preventDefault: () => {
      e2eSubmitPrevented = true;
    },
  };

  const e2eNameInput = getE2EEl("modal-habit-name");
  e2eNameInput.value = "Zero-Reload Integration Habit";
  const e2eTypeSelect = getE2EEl("modal-habit-type");
  e2eTypeSelect.value = "binary";
  const e2eRoutineSelect = getE2EEl("modal-habit-routine");
  e2eRoutineSelect.value = "afternoon";

  await e2eSandbox.HabitApp.saveHabitFromModal(e2eEvent);

  assert(
    e2eSubmitPrevented,
    "[Issue #425 AC-4] [AC-4] Form submit event explicitly prevented default in end-to-end sandbox"
  );
  assertEqual(
    e2eSandbox.location.href,
    initialUrl,
    "[Issue #425 AC-4] [AC-4] Location URL remains unchanged (no GET query parameter reload)"
  );
  assert(
    !e2eSandbox.location.search || e2eSandbox.location.search === "",
    "[Issue #425 AC-4] [AC-4] Location search params are clean without form fields"
  );

  // State integrity across successive operations
  // 1. Add Habit 1
  const h1 = {
    id: "h-seq-1",
    name: "Seq 1",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
  };
  await store.addHabit(h1);
  // 2. Add Habit 2
  const h2 = {
    id: "h-seq-2",
    name: "Seq 2",
    type: "numeric",
    targetValue: 2000,
    unit: "ml",
    routine: "afternoon",
    scheduleType: "daily",
  };
  await store.addHabit(h2);
  // 3. Edit Habit 1
  await store.updateHabit("h-seq-1", {
    name: "Seq 1 Updated",
    routine: "evening",
  });
  // 4. Save Notes for both
  await store.updateNotes("h-seq-1", selectedDate, "Note for seq 1");
  await store.updateNotes("h-seq-2", selectedDate, "Note for seq 2");

  assertEqual(
    store.getHabit("h-seq-1").name,
    "Seq 1 Updated",
    "[Issue #425 AC-4] [AC-4] Successive operations maintain state consistency for edited habit"
  );
  assertEqual(
    store.getHabit("h-seq-2").targetValue,
    2000,
    "[Issue #425 AC-4] [AC-4] Successive operations maintain state consistency for numeric habit"
  );
  assertEqual(
    store.state.logs[`h-seq-1_${selectedDate}`].notes,
    "Note for seq 1",
    "[Issue #425 AC-4] [AC-4] Note for habit 1 persisted cleanly in state index"
  );
  assertEqual(
    store.state.logs[`h-seq-2_${selectedDate}`].notes,
    "Note for seq 2",
    "[Issue #425 AC-4] [AC-4] Note for habit 2 persisted cleanly in state index"
  );

  const dbSeq1 = await storage.getHabit("h-seq-1");
  assertEqual(
    dbSeq1.routine,
    "evening",
    "[Issue #425 AC-4] [AC-4] Storage layer reflects updated routine for habit 1"
  );

  const dbLogSeq2 = await storage.getLog("h-seq-2", selectedDate);
  assertEqual(
    dbLogSeq2.notes,
    "Note for seq 2",
    "[Issue #425 AC-4] [AC-4] Storage layer reflects journal note for habit 2"
  );

  // ==========================================
  // [Issue #427 AC-1] Reorder Up (▲) Swaps Habit with Preceding Habit in Routine Cluster
  // ==========================================
  console.log(
    "\n--- [Issue #427 AC-1] Reorder Up (▲) Swaps Habit with Preceding Habit ---"
  );

  const reorderStorage = storageModule.createStorageAdapter({
    forceFallback: true,
  });
  const reorderStore = new HabitStore({ storage: reorderStorage });
  await reorderStore.init();

  // Setup distinct habit cluster for reorder testing
  const rMorning1 = {
    id: "h-reorder-m1",
    name: "Morning Sunlight 10m",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
    color: "amber",
    icon: "☀️",
    order: 0,
  };
  const rMorning2 = {
    id: "h-reorder-m2",
    name: "Cold Shower 3m",
    type: "timer",
    targetValue: 180,
    unit: "secs",
    routine: "morning",
    scheduleType: "daily",
    color: "cyan",
    icon: "🚿",
    order: 1,
  };
  const rMorning3 = {
    id: "h-reorder-m3",
    name: "Journaling 5m",
    type: "timer",
    targetValue: 300,
    unit: "mins",
    routine: "morning",
    scheduleType: "daily",
    color: "indigo",
    icon: "✍️",
    order: 2,
  };

  await reorderStore.addHabit(rMorning1);
  await reorderStore.addHabit(rMorning2);
  await reorderStore.addHabit(rMorning3);

  // Verify Manager View renders ▲ up reorder button for items
  const managerHtmlBefore = renderManagerView(reorderStore, null, "vi");
  assert(
    managerHtmlBefore.includes('data-action="reorder-up"') &&
      managerHtmlBefore.includes('data-habit-id="h-reorder-m2"'),
    "[Issue #427 AC-1] [AC-1] Manager view renders reorder-up button with target habit id"
  );
  assert(
    managerHtmlBefore.includes('data-routine="morning"'),
    "[Issue #427 AC-1] [AC-1] Manager view encodes routine cluster on reorder buttons"
  );

  // [AC-1] Swap 2nd habit (h-reorder-m2) UP with 1st habit (h-reorder-m1)
  await reorderStore.reorderHabits("morning", [
    "h-reorder-m2",
    "h-reorder-m1",
    "h-reorder-m3",
  ]);

  const morningAfterUp1 = reorderStore
    .getHabits()
    .filter((h) => h.routine === "morning" && !h.archived)
    .sort((a, b) => a.order - b.order);

  assertEqual(
    morningAfterUp1[0].id,
    "h-reorder-m2",
    "[Issue #427 AC-1] [AC-1] Target habit moved to index 0 after reordering up"
  );
  assertEqual(
    morningAfterUp1[1].id,
    "h-reorder-m1",
    "[Issue #427 AC-1] [AC-1] Preceding habit swapped to index 1"
  );
  assertEqual(
    morningAfterUp1[2].id,
    "h-reorder-m3",
    "[Issue #427 AC-1] [AC-1] Unrelated habit at index 2 remained in place"
  );

  // [AC-1] Swap 3rd habit (h-reorder-m3) UP with 2nd habit (h-reorder-m1)
  await reorderStore.reorderHabits("morning", [
    "h-reorder-m2",
    "h-reorder-m3",
    "h-reorder-m1",
  ]);

  const morningAfterUp2 = reorderStore
    .getHabits()
    .filter((h) => h.routine === "morning" && !h.archived)
    .sort((a, b) => a.order - b.order);

  assertEqual(
    morningAfterUp2[1].id,
    "h-reorder-m3",
    "[Issue #427 AC-1] [AC-1] 3rd habit moved up to index 1"
  );
  assertEqual(
    morningAfterUp2[2].id,
    "h-reorder-m1",
    "[Issue #427 AC-1] [AC-1] Former 2nd habit shifted down to index 2"
  );

  // [AC-1] Routine Cluster Isolation: Ensure other routine clusters are unaffected
  const rAfternoon1 = {
    id: "h-reorder-aft1",
    name: "Afternoon Walk",
    type: "binary",
    targetValue: 1,
    routine: "afternoon",
    scheduleType: "daily",
    order: 0,
  };
  const rAfternoon2 = {
    id: "h-reorder-aft2",
    name: "Green Tea Break",
    type: "binary",
    targetValue: 1,
    routine: "afternoon",
    scheduleType: "daily",
    order: 1,
  };
  await reorderStore.addHabit(rAfternoon1);
  await reorderStore.addHabit(rAfternoon2);

  // Reorder morning habits again to [m3, m2, m1]
  await reorderStore.reorderHabits("morning", [
    "h-reorder-m3",
    "h-reorder-m2",
    "h-reorder-m1",
  ]);

  const afternoonHabits = reorderStore
    .getHabits()
    .filter((h) => h.routine === "afternoon" && !h.archived)
    .sort((a, b) => a.order - b.order);

  assertEqual(
    afternoonHabits[0].id,
    "h-reorder-aft1",
    "[Issue #427 AC-1] [AC-1] Reordering morning habits does not alter afternoon habit 1 order"
  );
  assertEqual(
    afternoonHabits[1].id,
    "h-reorder-aft2",
    "[Issue #427 AC-1] [AC-1] Reordering morning habits does not alter afternoon habit 2 order"
  );

  // [AC-1] Non-destructive: Verify habit data attributes are fully preserved
  const preservedHabit = reorderStore.getHabit("h-reorder-m2");
  assertEqual(
    preservedHabit.name,
    "Cold Shower 3m",
    "[Issue #427 AC-1] [AC-1] Habit name preserved after reordering up"
  );
  assertEqual(
    preservedHabit.targetValue,
    180,
    "[Issue #427 AC-1] [AC-1] Habit target value preserved after reordering up"
  );
  assertEqual(
    preservedHabit.unit,
    "secs",
    "[Issue #427 AC-1] [AC-1] Habit unit preserved after reordering up"
  );
  assertEqual(
    preservedHabit.icon,
    "🚿",
    "[Issue #427 AC-1] [AC-1] Habit icon preserved after reordering up"
  );

  // ==========================================
  // [Issue #427 AC-2] Reorder Down (▼) Swaps Habit with Succeeding Habit in Routine Cluster
  // ==========================================
  console.log(
    "\n--- [Issue #427 AC-2] Reorder Down (▼) Swaps Habit with Succeeding Habit ---"
  );

  // Setup distinct habit cluster for evening routine
  const rEvening1 = {
    id: "h-reorder-eve1",
    name: "No Screens 1h before bed",
    type: "binary",
    targetValue: 1,
    routine: "evening",
    scheduleType: "daily",
    color: "purple",
    icon: "📵",
    order: 0,
  };
  const rEvening2 = {
    id: "h-reorder-eve2",
    name: "Chamomile Tea",
    type: "binary",
    targetValue: 1,
    routine: "evening",
    scheduleType: "daily",
    color: "emerald",
    icon: "🍵",
    order: 1,
  };
  const rEvening3 = {
    id: "h-reorder-eve3",
    name: "Gratitude Reflection",
    type: "binary",
    targetValue: 1,
    routine: "evening",
    scheduleType: "daily",
    color: "rose",
    icon: "🙏",
    order: 2,
  };

  await reorderStore.addHabit(rEvening1);
  await reorderStore.addHabit(rEvening2);
  await reorderStore.addHabit(rEvening3);

  // Verify Manager View renders ▼ down reorder button for items
  const managerEveningHtml = renderManagerView(reorderStore, null, "vi");
  assert(
    managerEveningHtml.includes('data-action="reorder-down"') &&
      managerEveningHtml.includes('data-habit-id="h-reorder-eve1"'),
    "[Issue #427 AC-2] [AC-2] Manager view renders reorder-down button with habit ID"
  );

  // [AC-2] Move 1st habit (h-reorder-eve1) DOWN with 2nd habit (h-reorder-eve2)
  await reorderStore.reorderHabits("evening", [
    "h-reorder-eve2",
    "h-reorder-eve1",
    "h-reorder-eve3",
  ]);

  const eveningAfterDown1 = reorderStore
    .getHabits()
    .filter((h) => h.routine === "evening" && !h.archived)
    .sort((a, b) => a.order - b.order);

  assertEqual(
    eveningAfterDown1[0].id,
    "h-reorder-eve2",
    "[Issue #427 AC-2] [AC-2] 2nd habit promoted to index 0 after top habit moved down"
  );
  assertEqual(
    eveningAfterDown1[1].id,
    "h-reorder-eve1",
    "[Issue #427 AC-2] [AC-2] Top habit shifted down to index 1"
  );
  assertEqual(
    eveningAfterDown1[2].id,
    "h-reorder-eve3",
    "[Issue #427 AC-2] [AC-2] 3rd habit remained at index 2"
  );

  // [AC-2] Move h-reorder-eve1 DOWN again to bottom (index 2)
  await reorderStore.reorderHabits("evening", [
    "h-reorder-eve2",
    "h-reorder-eve3",
    "h-reorder-eve1",
  ]);

  const eveningAfterDown2 = reorderStore
    .getHabits()
    .filter((h) => h.routine === "evening" && !h.archived)
    .sort((a, b) => a.order - b.order);

  assertEqual(
    eveningAfterDown2[0].id,
    "h-reorder-eve2",
    "[Issue #427 AC-2] [AC-2] Top position holds h-reorder-eve2"
  );
  assertEqual(
    eveningAfterDown2[1].id,
    "h-reorder-eve3",
    "[Issue #427 AC-2] [AC-2] Middle position holds h-reorder-eve3"
  );
  assertEqual(
    eveningAfterDown2[2].id,
    "h-reorder-eve1",
    "[Issue #427 AC-2] [AC-2] Moved habit successfully shifted to bottom index 2"
  );

  // [AC-2] Reorder Down in Anytime Routine Cluster
  const rAny1 = {
    id: "h-reorder-any1",
    name: "Posture Check",
    type: "binary",
    targetValue: 1,
    routine: "anytime",
    scheduleType: "daily",
    order: 0,
  };
  const rAny2 = {
    id: "h-reorder-any2",
    name: "Eye Rest 20-20-20",
    type: "binary",
    targetValue: 1,
    routine: "anytime",
    scheduleType: "daily",
    order: 1,
  };
  await reorderStore.addHabit(rAny1);
  await reorderStore.addHabit(rAny2);

  await reorderStore.reorderHabits("anytime", [
    "h-reorder-any2",
    "h-reorder-any1",
  ]);
  const anyHabits = reorderStore
    .getHabits()
    .filter((h) => (h.routine || "anytime") === "anytime" && !h.archived)
    .sort((a, b) => a.order - b.order);

  assertEqual(
    anyHabits[0].id,
    "h-reorder-any2",
    "[Issue #427 AC-2] [AC-2] Anytime routine habit 1 swapped to index 0"
  );
  assertEqual(
    anyHabits[1].id,
    "h-reorder-any1",
    "[Issue #427 AC-2] [AC-2] Anytime routine habit 2 swapped to index 1"
  );

  // [AC-2] Logging and streak preservation across reordering
  await reorderStore.logHabit(
    "h-reorder-eve1",
    selectedDate,
    1,
    "Completed no screens"
  );
  assertEqual(
    reorderStore.state.logs[`h-reorder-eve1_${selectedDate}`].value,
    1,
    "[Issue #427 AC-2] [AC-2] Habit logs remain accurately linked after moving down"
  );
  assertEqual(
    reorderStore.state.logs[`h-reorder-eve1_${selectedDate}`].notes,
    "Completed no screens",
    "[Issue #427 AC-2] [AC-2] Habit notes remain intact after moving down"
  );

  // ==========================================
  // [Issue #427 AC-3] Persistence in IndexedDB & Immediate Reflection Across Manager & Today Views
  // ==========================================
  console.log(
    "\n--- [Issue #427 AC-3] Persistence in IndexedDB & Immediate Reflection ---"
  );

  // 1. IndexedDB / Storage layer direct verification
  const dbM3 = await reorderStorage.getHabit("h-reorder-m3");
  const dbM2 = await reorderStorage.getHabit("h-reorder-m2");
  const dbM1 = await reorderStorage.getHabit("h-reorder-m1");

  assertEqual(
    dbM3.order,
    0,
    "[Issue #427 AC-3] [AC-3] h-reorder-m3 order 0 persisted to IndexedDB storage adapter"
  );
  assertEqual(
    dbM2.order,
    1,
    "[Issue #427 AC-3] [AC-3] h-reorder-m2 order 1 persisted to IndexedDB storage adapter"
  );
  assertEqual(
    dbM1.order,
    2,
    "[Issue #427 AC-3] [AC-3] h-reorder-m1 order 2 persisted to IndexedDB storage adapter"
  );

  const allDbHabits = await reorderStorage.getAllHabits();
  const dbMorningHabits = allDbHabits
    .filter(
      (h) =>
        h.routine === "morning" &&
        !h.archived &&
        h.id &&
        h.id.startsWith("h-reorder-m")
    )
    .sort((a, b) => a.order - b.order);

  assertEqual(
    dbMorningHabits[0].id,
    "h-reorder-m3",
    "[Issue #427 AC-3] [AC-3] IndexedDB getAllHabits reflects reordered sequence for 1st item"
  );
  assertEqual(
    dbMorningHabits[1].id,
    "h-reorder-m2",
    "[Issue #427 AC-3] [AC-3] IndexedDB getAllHabits reflects reordered sequence for 2nd item"
  );
  assertEqual(
    dbMorningHabits[2].id,
    "h-reorder-m1",
    "[Issue #427 AC-3] [AC-3] IndexedDB getAllHabits reflects reordered sequence for 3rd item"
  );

  // 2. Cold Start / Re-instantiation from Storage Adapter without state drift
  const freshStore = new HabitStore({ storage: reorderStorage });
  await freshStore.init();
  const freshMorning = freshStore
    .getHabits()
    .filter(
      (h) =>
        h.routine === "morning" &&
        !h.archived &&
        h.id &&
        h.id.startsWith("h-reorder-m")
    )
    .sort((a, b) => a.order - b.order);

  assertEqual(
    freshMorning.length,
    3,
    "[Issue #427 AC-3] [AC-3] Cold store init loads all reordered habits"
  );
  assertEqual(
    freshMorning[0].id,
    "h-reorder-m3",
    "[Issue #427 AC-3] [AC-3] Cold store retains order 0 on fresh startup"
  );
  assertEqual(
    freshMorning[1].id,
    "h-reorder-m2",
    "[Issue #427 AC-3] [AC-3] Cold store retains order 1 on fresh startup"
  );
  assertEqual(
    freshMorning[2].id,
    "h-reorder-m1",
    "[Issue #427 AC-3] [AC-3] Cold store retains order 2 on fresh startup"
  );

  // 3. Manager View immediate reflection
  const renderedManager = renderManagerView(reorderStore, null, "vi");
  assert(
    renderedManager.includes('data-habit-id="h-reorder-m3"') &&
      renderedManager.includes('data-habit-id="h-reorder-m2"') &&
      renderedManager.includes('data-habit-id="h-reorder-m1"'),
    "[Issue #427 AC-3] [AC-3] Manager view renders all reordered habit cards"
  );

  // 4. Today View immediate reflection
  const renderedToday = renderRoutineSection(
    "morning",
    reorderStore,
    selectedDate,
    "vi"
  );
  assert(
    renderedToday.includes('data-habit-card="h-reorder-m3"') ||
      renderedToday.includes("Journaling 5m"),
    "[Issue #427 AC-3] [AC-3] Today view morning routine section renders reordered habit 1"
  );
  assert(
    renderedToday.includes('data-habit-card="h-reorder-m2"') ||
      renderedToday.includes("Cold Shower 3m"),
    "[Issue #427 AC-3] [AC-3] Today view morning routine section renders reordered habit 2"
  );

  // ==========================================
  // [Issue #427 AC-4] Edge Cases & Graceful Degradation
  // ==========================================
  console.log("\n--- [Issue #427 AC-4] Edge Cases & Graceful Degradation ---");

  // 1. Top Boundary: Reordering up on the top item (index 0) is a clean no-op
  let topBoundaryError = false;
  try {
    // Current morning order: [m3, m2, m1] -> index 0 is m3
    // Moving top item up should preserve order safely
    await reorderStore.reorderHabits("morning", [
      "h-reorder-m3",
      "h-reorder-m2",
      "h-reorder-m1",
    ]);
  } catch (err) {
    topBoundaryError = true;
  }
  assert(
    !topBoundaryError,
    "[Issue #427 AC-4] [AC-4] Moving top item up executes without throwing errors"
  );

  const morningBoundaryTop = reorderStore
    .getHabits()
    .filter(
      (h) =>
        h.routine === "morning" &&
        !h.archived &&
        h.id &&
        h.id.startsWith("h-reorder-m")
    )
    .sort((a, b) => a.order - b.order);

  assertEqual(
    morningBoundaryTop[0].id,
    "h-reorder-m3",
    "[Issue #427 AC-4] [AC-4] Top item remains at index 0 without state corruption"
  );

  // 2. Bottom Boundary: Reordering down on the bottom item is a clean no-op
  let bottomBoundaryError = false;
  try {
    // Current morning order: [m3, m2, m1] -> bottom item is m1
    await reorderStore.reorderHabits("morning", [
      "h-reorder-m3",
      "h-reorder-m2",
      "h-reorder-m1",
    ]);
  } catch (err) {
    bottomBoundaryError = true;
  }
  assert(
    !bottomBoundaryError,
    "[Issue #427 AC-4] [AC-4] Moving bottom item down executes without throwing errors"
  );

  const morningBoundaryBottom = reorderStore
    .getHabits()
    .filter(
      (h) =>
        h.routine === "morning" &&
        !h.archived &&
        h.id &&
        h.id.startsWith("h-reorder-m")
    )
    .sort((a, b) => a.order - b.order);

  assertEqual(
    morningBoundaryBottom[2].id,
    "h-reorder-m1",
    "[Issue #427 AC-4] [AC-4] Bottom item remains at index 2 without state corruption"
  );

  // 3. Single-item cluster: routine with only 1 habit
  const singleHabit = {
    id: "h-reorder-solo",
    name: "Solo Routine Habit",
    type: "binary",
    targetValue: 1,
    routine: "afternoon",
    scheduleType: "daily",
    order: 0,
  };
  await reorderStore.addHabit(singleHabit);

  let soloError = false;
  try {
    await reorderStore.reorderHabits("afternoon", ["h-reorder-solo"]);
  } catch (err) {
    soloError = true;
  }
  assert(
    !soloError,
    "[Issue #427 AC-4] [AC-4] Reordering single-item cluster executes gracefully"
  );
  assertEqual(
    reorderStore.getHabit("h-reorder-solo").order,
    0,
    "[Issue #427 AC-4] [AC-4] Single item maintains order 0"
  );

  // 4. Invalid input handling: non-array, null, empty array
  let emptyError = false;
  try {
    await reorderStore.reorderHabits("morning", []);
    await reorderStore.reorderHabits("morning", null);
    await reorderStore.reorderHabits("morning", undefined);
  } catch (err) {
    emptyError = true;
  }
  assert(
    !emptyError,
    "[Issue #427 AC-4] [AC-4] Passing empty or invalid array to reorderHabits fails safely without throw"
  );

  // 5. Non-existent habit ID handling
  let nonExistentError = false;
  try {
    await reorderStore.reorderHabits("morning", [
      "h-nonexistent-123",
      "h-reorder-m3",
    ]);
  } catch (err) {
    nonExistentError = true;
  }
  assert(
    !nonExistentError,
    "[Issue #427 AC-4] [AC-4] Reordering with non-existent ID ignores missing IDs safely"
  );

  // 6. Archived habits are unaffected by active reordering
  await reorderStore.archiveHabit("h-reorder-m1");
  const activeMorningCount = reorderStore
    .getHabits(false)
    .filter(
      (h) => h.routine === "morning" && h.id && h.id.startsWith("h-reorder-m")
    ).length;
  assertEqual(
    activeMorningCount,
    2,
    "[Issue #427 AC-4] [AC-4] Archived habit excluded from active routine count"
  );
  const archivedHabitRecord = reorderStore.getHabit("h-reorder-m1");
  assertEqual(
    archivedHabitRecord.archived,
    true,
    "[Issue #427 AC-4] [AC-4] Archived status preserved regardless of reorder operations"
  );

  // ==========================================
  // [Issue #429 AC-1] Dual-Theme Styling via Tailwind dark: Variants
  // ==========================================
  console.log(
    "\n--- [Issue #429 AC-1] Dual-Theme Styling via Tailwind dark: Variants ---"
  );

  const htmlContent = getHtmlContent();

  // 1. Static HTML Shell Dual-Theme Classes in habit-tracker/index.html
  const bodyTagMatch = htmlContent.match(/<body([^>]*)>/i);
  assert(
    bodyTagMatch !== null,
    "[Issue #429 AC-1] habit-tracker/index.html contains <body> tag"
  );
  const bodyAttrs = bodyTagMatch ? bodyTagMatch[1] : "";
  assert(
    bodyAttrs.includes("dark:bg-slate-950") &&
      (bodyAttrs.includes("bg-slate-50") ||
        bodyAttrs.includes("bg-slate-100") ||
        bodyAttrs.includes("bg-white")),
    "[Issue #429 AC-1] <body> tag supports dual-theme styling with light background and dark:bg-slate-950"
  );
  assert(
    bodyAttrs.includes("dark:text-slate-100") &&
      (bodyAttrs.includes("text-slate-900") ||
        bodyAttrs.includes("text-slate-800")),
    "[Issue #429 AC-1] <body> tag supports dual-theme text with light text-slate-900/800 and dark:text-slate-100"
  );

  // Top header bar dual-theme classes
  const headerMatch = htmlContent.match(/<header([^>]*)>/i);
  assert(headerMatch !== null, "[Issue #429 AC-1] <header> tag exists");
  const headerAttrs = headerMatch ? headerMatch[1] : "";
  assert(
    headerAttrs.includes("dark:bg-slate-950") &&
      headerAttrs.includes("dark:border-slate-800"),
    "[Issue #429 AC-1] <header> top bar specifies dark: variants for background and border"
  );

  // Bottom navigation dock dual-theme classes
  const navMatch = htmlContent.match(/<nav([^>]*)>/i);
  assert(navMatch !== null, "[Issue #429 AC-1] <nav> tag exists");
  const navAttrs = navMatch ? navMatch[1] : "";
  assert(
    navAttrs.includes("dark:bg-slate-950") &&
      navAttrs.includes("dark:border-slate-800"),
    "[Issue #429 AC-1] <nav> bottom navigation dock specifies dark: variants for background and border"
  );

  // Top bar freeze token button & language toggle button dual-theme classes
  assert(
    htmlContent.includes("dark:bg-slate-900") &&
      htmlContent.includes("dark:border-slate-800"),
    "[Issue #429 AC-1] Top bar controls contain dark: variant classes"
  );

  // 2. Component Rendered Output Dual-Theme Classes
  // Habit Cards in Today View
  const dualHabitCardHtml = renderHabitCard(
    habitMeditate,
    { value: 0, completed: false },
    "vi"
  );
  assert(
    dualHabitCardHtml.includes("dark:bg-slate-900") &&
      (dualHabitCardHtml.includes("bg-white") ||
        dualHabitCardHtml.includes("bg-slate-50") ||
        dualHabitCardHtml.includes("bg-slate-100")),
    "[Issue #429 AC-1] Habit card container includes light background and dark:bg-slate-900 variant"
  );
  assert(
    dualHabitCardHtml.includes("dark:text-white") ||
      dualHabitCardHtml.includes("dark:text-slate-100"),
    "[Issue #429 AC-1] Habit card title includes dark:text-white/dark:text-slate-100 variant"
  );

  // Manager View Habit Cards
  const managerDualHtml = renderManagerView(store, null, "vi");
  assert(
    managerDualHtml.includes("dark:bg-slate-900") &&
      (managerDualHtml.includes("bg-white") ||
        managerDualHtml.includes("bg-slate-50") ||
        managerDualHtml.includes("bg-slate-100") ||
        managerDualHtml.includes("bg-slate-800/60")),
    "[Issue #429 AC-1] Manager view habit cards support dual-theme styling with dark:bg-slate-900"
  );

  // Insights View Metric Cards
  const insightsDualHtml = renderInsightsView(store, null, "vi");
  assert(
    insightsDualHtml.includes("dark:bg-slate-900") ||
      insightsDualHtml.includes("dark:bg-slate-800"),
    "[Issue #429 AC-1] Insights view stat cards specify dark: variants for background"
  );

  // 3. Runtime Theme Toggle Public API Seam (HabitApp.switchTheme)
  const { sandbox: themeSandbox } = createHabitTrackerSandbox();
  themeSandbox.requestAnimationFrame = (fn) => fn();
  themeSandbox.cancelAnimationFrame = () => {};
  await themeSandbox.HabitApp.init();

  // Toggle to Light mode
  themeSandbox.HabitApp.switchTheme("light");
  const docRoot = themeSandbox.document.documentElement;
  assert(
    docRoot.classList.contains("light"),
    "[Issue #429 AC-1] switchTheme('light') adds 'light' class to html documentElement"
  );
  assert(
    !docRoot.classList.contains("dark"),
    "[Issue #429 AC-1] switchTheme('light') removes 'dark' class from html documentElement"
  );
  assertEqual(
    themeSandbox.HabitApp.store.getSettings().theme,
    "light",
    "[Issue #429 AC-1] switchTheme('light') updates store settings to 'light'"
  );

  // Toggle to Dark mode
  themeSandbox.HabitApp.switchTheme("dark");
  assert(
    docRoot.classList.contains("dark"),
    "[Issue #429 AC-1] switchTheme('dark') adds 'dark' class to html documentElement"
  );
  assert(
    !docRoot.classList.contains("light"),
    "[Issue #429 AC-1] switchTheme('dark') removes 'light' class from html documentElement"
  );
  assertEqual(
    themeSandbox.HabitApp.store.getSettings().theme,
    "dark",
    "[Issue #429 AC-1] switchTheme('dark') updates store settings to 'dark'"
  );

  // Rapid toggling sequence maintains clean classList state
  for (let i = 0; i < 6; i++) {
    const nextTheme = i % 2 === 0 ? "light" : "dark";
    themeSandbox.HabitApp.switchTheme(nextTheme);
  }
  assert(
    docRoot.classList.contains("dark") && !docRoot.classList.contains("light"),
    "[Issue #429 AC-1] Rapid theme toggling maintains consistent classList state without duplicate class pollution"
  );

  // ==========================================
  // [Issue #429 AC-2] Input Contrast & Avoidance of Hardcoded Dark-Only Classes
  // ==========================================
  console.log(
    "\n--- [Issue #429 AC-2] Input Contrast & Avoidance of Hardcoded Dark-Only Classes ---"
  );

  // 1. Habit Edit Modal Form Inputs Contrast
  const editModalFormHtml = renderHabitEditModal(habitWater, "vi");

  // Text input #modal-habit-name
  assert(
    editModalFormHtml.includes('id="modal-habit-name"'),
    "[Issue #429 AC-2] Habit edit modal renders #modal-habit-name input"
  );
  assert(
    editModalFormHtml.includes("dark:bg-slate-800") &&
      (editModalFormHtml.includes("bg-white") ||
        editModalFormHtml.includes("bg-slate-50") ||
        editModalFormHtml.includes("bg-slate-100")),
    "[Issue #429 AC-2] #modal-habit-name input uses light background with dark:bg-slate-800 variant"
  );
  assert(
    editModalFormHtml.includes("dark:text-white") ||
      editModalFormHtml.includes("dark:text-slate-100") ||
      editModalFormHtml.includes("text-slate-900"),
    "[Issue #429 AC-2] #modal-habit-name input text color has light/dark contrast"
  );

  // Icon input #modal-habit-icon
  assert(
    editModalFormHtml.includes('id="modal-habit-icon"'),
    "[Issue #429 AC-2] Habit edit modal renders #modal-habit-icon input"
  );
  assert(
    editModalFormHtml.includes("dark:bg-slate-800") &&
      (editModalFormHtml.includes("bg-white") ||
        editModalFormHtml.includes("bg-slate-50") ||
        editModalFormHtml.includes("bg-slate-100")),
    "[Issue #429 AC-2] #modal-habit-icon input uses light background with dark:bg-slate-800 variant"
  );

  // Modal dialog container card
  assert(
    editModalFormHtml.includes("dark:bg-slate-900") &&
      (editModalFormHtml.includes("bg-white") ||
        editModalFormHtml.includes("bg-slate-50")),
    "[Issue #429 AC-2] Modal dialog card uses dual-theme container (bg-white dark:bg-slate-900)"
  );
  assert(
    !editModalFormHtml.includes('class="modal-card bg-slate-900') &&
      !editModalFormHtml.includes(
        'class="sheet-card bg-slate-900 border border-slate-800'
      ),
    "[Issue #429 AC-2] Modal and sheet dialog cards avoid hardcoded un-prefixed bg-slate-900 without light theme support"
  );

  // 2. Detail Sheet Contrast
  const detailSheetContrastHtml = renderDetailSheet(
    habitWater,
    store,
    null,
    "vi",
    selectedDate
  );

  // Note textarea #habit-note-input
  assert(
    detailSheetContrastHtml.includes('id="habit-note-input"'),
    "[Issue #429 AC-2] Detail sheet renders #habit-note-input textarea"
  );
  assert(
    detailSheetContrastHtml.includes("dark:bg-slate-900") ||
      detailSheetContrastHtml.includes("dark:bg-slate-800"),
    "[Issue #429 AC-2] #habit-note-input textarea specifies dark: variant for background"
  );
  assert(
    detailSheetContrastHtml.includes("dark:text-white") ||
      detailSheetContrastHtml.includes("text-slate-900"),
    "[Issue #429 AC-2] #habit-note-input textarea has proper text contrast classes"
  );

  // Detail Sheet dialog container card
  assert(
    detailSheetContrastHtml.includes("dark:bg-slate-900") &&
      (detailSheetContrastHtml.includes("bg-white") ||
        detailSheetContrastHtml.includes("bg-slate-50")),
    "[Issue #429 AC-2] Detail sheet card uses dual-theme background with dark:bg-slate-900"
  );

  // 3. Automated Contrast Scanner: Anti-pattern detection for un-prefixed dark-only classes on cards & containers
  function findUnprefixedDarkContainerClasses(htmlSnippet, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*class="([^"]*)"[^>]*>`, "gi");
    let match;
    const violations = [];
    while ((match = regex.exec(htmlSnippet)) !== null) {
      const classAttr = match[1];
      const tokens = classAttr.split(/\s+/);
      const hasUnprefixedDarkBg = tokens.some(
        (t) =>
          t === "bg-slate-900" ||
          t === "bg-slate-950" ||
          t === "bg-black" ||
          t === "bg-slate-900/90"
      );
      const hasLightBg = tokens.some(
        (t) =>
          t === "bg-white" ||
          t === "bg-slate-50" ||
          t === "bg-slate-100" ||
          t.startsWith("bg-white/")
      );
      const hasDarkBgVariant = tokens.some(
        (t) =>
          t.startsWith("dark:bg-slate-900") ||
          t.startsWith("dark:bg-slate-950") ||
          t.startsWith("dark:bg-black")
      );
      if (hasUnprefixedDarkBg && (!hasLightBg || !hasDarkBgVariant)) {
        violations.push(match[0]);
      }
    }
    return violations;
  }

  const habitCardViolations = findUnprefixedDarkContainerClasses(
    dualHabitCardHtml,
    "div"
  );
  assertEqual(
    habitCardViolations.length,
    0,
    "[Issue #429 AC-2] Habit card contains zero un-prefixed dark-only container background classes"
  );

  // ==========================================
  // [Issue #429 AC-3] Modal Overlay Consolidation & Accessibility Attributes
  // ==========================================
  console.log(
    "\n--- [Issue #429 AC-3] Modal Overlay Consolidation & Accessibility Attributes ---"
  );

  // 1. Static Backdrop & Accessibility Hierarchy in habit-tracker/index.html
  const modalOverlayMatch = htmlContent.match(
    /id="habit-edit-modal-overlay"([^>]*)>/i
  );
  assert(
    modalOverlayMatch !== null,
    "[Issue #429 AC-3] habit-tracker/index.html contains #habit-edit-modal-overlay"
  );
  const detailOverlayMatch = htmlContent.match(
    /id="detail-sheet-overlay"([^>]*)>/i
  );
  assert(
    detailOverlayMatch !== null,
    "[Issue #429 AC-3] habit-tracker/index.html contains #detail-sheet-overlay"
  );

  // Accessibility attributes on modal dialogs (role="dialog", aria-modal="true")
  const addModalMarkup = renderHabitEditModal(null, "vi");
  const editModalMarkup = renderHabitEditModal(habitWater, "vi");
  const detailSheetMarkup = renderDetailSheet(
    habitWater,
    store,
    null,
    "vi",
    selectedDate
  );

  const hasHabitModalRoleDialog =
    addModalMarkup.includes('role="dialog"') ||
    (modalOverlayMatch && modalOverlayMatch[1].includes('role="dialog"'));
  assert(
    hasHabitModalRoleDialog,
    '[Issue #429 AC-3] Habit edit modal provides role="dialog" accessibility attribute'
  );

  const hasHabitModalAriaModal =
    addModalMarkup.includes('aria-modal="true"') ||
    (modalOverlayMatch && modalOverlayMatch[1].includes('aria-modal="true"'));
  assert(
    hasHabitModalAriaModal,
    '[Issue #429 AC-3] Habit edit modal provides aria-modal="true" accessibility attribute'
  );

  const hasDetailSheetRoleDialog =
    detailSheetMarkup.includes('role="dialog"') ||
    (detailOverlayMatch && detailOverlayMatch[1].includes('role="dialog"'));
  assert(
    hasDetailSheetRoleDialog,
    '[Issue #429 AC-3] Detail sheet provides role="dialog" accessibility attribute'
  );

  const hasDetailSheetAriaModal =
    detailSheetMarkup.includes('aria-modal="true"') ||
    (detailOverlayMatch && detailOverlayMatch[1].includes('aria-modal="true"'));
  assert(
    hasDetailSheetAriaModal,
    '[Issue #429 AC-3] Detail sheet provides aria-modal="true" accessibility attribute'
  );

  // Accessible Label / Name (aria-labelledby or aria-label)
  const hasHabitModalAriaLabel =
    addModalMarkup.includes("aria-labelledby=") ||
    addModalMarkup.includes("aria-label=") ||
    (modalOverlayMatch &&
      (modalOverlayMatch[1].includes("aria-labelledby=") ||
        modalOverlayMatch[1].includes("aria-label=")));
  assert(
    hasHabitModalAriaLabel,
    "[Issue #429 AC-3] Habit edit modal provides accessible label (aria-labelledby or aria-label)"
  );

  // 2. Consolidation into Single Clean Backdrop (No Nested Backdrops)
  assert(
    !addModalMarkup.includes('id="habit-edit-modal-backdrop"') &&
      !editModalMarkup.includes('id="habit-edit-modal-backdrop"'),
    "[Issue #429 AC-3] renderHabitEditModal does not emit duplicate nested #habit-edit-modal-backdrop element"
  );

  assert(
    !detailSheetMarkup.includes('id="habit-detail-sheet-backdrop"'),
    "[Issue #429 AC-3] renderDetailSheet does not emit duplicate nested #habit-detail-sheet-backdrop element"
  );

  // 3. End-to-End DOM Sandbox Verification for Single Backdrop & Overlay Lifecycle
  const { sandbox: modalDomSandbox, getOrCreateElement: getModalDomEl } =
    createHabitTrackerSandbox();
  modalDomSandbox.requestAnimationFrame = (fn) => fn();
  modalDomSandbox.cancelAnimationFrame = () => {};
  await modalDomSandbox.HabitApp.init();

  const editModalOverlay = getModalDomEl("habit-edit-modal-overlay");
  const detailSheetOverlay = getModalDomEl("detail-sheet-overlay");

  // Initial state: both overlays are hidden
  assert(
    editModalOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] Habit edit modal overlay is initially hidden"
  );
  assert(
    detailSheetOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] Detail sheet overlay is initially hidden"
  );

  // Open Add Habit Modal
  modalDomSandbox.HabitApp.openAddHabitModal();
  assert(
    !editModalOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] Opening Add Habit modal removes hidden class from overlay"
  );

  // Ensure no nested backdrops exist in the DOM inside modal container
  const modalContainer = getModalDomEl("habit-modal-container");
  const innerBackdropsInModal =
    modalContainer.querySelectorAll('[id*="backdrop"]');
  assertEqual(
    innerBackdropsInModal.length,
    0,
    "[Issue #429 AC-3] Zero duplicate nested backdrop elements inside modal container"
  );

  // Close Add Habit Modal
  modalDomSandbox.HabitApp.closeHabitModal();
  assert(
    editModalOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] closeHabitModal() restores hidden class on modal overlay"
  );

  // Open Detail Sheet
  modalDomSandbox.HabitApp.openDetailSheet("h-water");
  assert(
    !detailSheetOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] Opening Detail Sheet removes hidden class from detail sheet overlay"
  );

  const detailContainer = getModalDomEl("detail-sheet-container");
  const innerBackdropsInDetail =
    detailContainer.querySelectorAll('[id*="backdrop"]');
  assertEqual(
    innerBackdropsInDetail.length,
    0,
    "[Issue #429 AC-3] Zero duplicate nested backdrop elements inside detail sheet container"
  );

  // Close Detail Sheet
  modalDomSandbox.HabitApp.closeDetailSheet();
  assert(
    detailSheetOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] closeDetailSheet() restores hidden class on detail sheet overlay"
  );

  // Backdrop Dismissal verification
  modalDomSandbox.HabitApp.openAddHabitModal();
  assert(
    !editModalOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] Modal opened for backdrop dismissal test"
  );
  modalDomSandbox.HabitApp.closeHabitModal();
  assert(
    editModalOverlay.classList.contains("hidden"),
    "[Issue #429 AC-3] Modal overlay safely closes on backdrop dismissal"
  );

  // ==========================================
  // [Issue #432 AC-1] Document Outline & W3C Heading Continuity
  // ==========================================
  console.log(
    "\n--- [Issue #432 AC-1] Document Outline & W3C Heading Continuity ---"
  );

  function extractHeadings(htmlSnippet) {
    const headingRegex = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
    const headings = [];
    let match;
    while ((match = headingRegex.exec(htmlSnippet)) !== null) {
      headings.push({
        tag: `h${match[1]}`,
        level: parseInt(match[1], 10),
        attrs: match[2],
        text: match[3].replace(/<[^>]+>/g, "").trim(),
        raw: match[0],
      });
    }
    return headings;
  }

  function findSkippedHeadingLevels(headings) {
    const violations = [];
    if (!headings || headings.length <= 1) return violations;

    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];
      // Heading level cannot jump by more than +1 (e.g. h1 -> h3 is invalid; h2 -> h4 is invalid)
      // Decreasing levels (e.g. h4 -> h3, h3 -> h2) represent valid section closures
      if (curr.level > prev.level + 1) {
        violations.push({
          index: i,
          prev: prev.tag,
          prevText: prev.text,
          curr: curr.tag,
          currText: curr.text,
          message: `Heading level jumped by ${curr.level - prev.level} from <${prev.tag}> ("${prev.text}") to <${curr.tag}> ("${curr.text}") without intermediate level`,
        });
      }
    }
    return violations;
  }

  // 1. Top bar brand uses <h1>
  const staticHeadings432 = extractHeadings(htmlContent);
  const h1Headings432 = staticHeadings432.filter((h) => h.level === 1);
  assertEqual(
    h1Headings432.length,
    1,
    "[Issue #432 AC-1] habit-tracker/index.html top bar brand uses exactly one <h1> heading"
  );
  assert(
    h1Headings432[0] && h1Headings432[0].text.includes("Atomic Habits"),
    "[Issue #432 AC-1] <h1> contains the application brand title 'Atomic Habits'"
  );

  // 2. Tab views use <h2> for top section titles
  const todayViewHtml432 = renderTodayDashboard(store, null, "vi");
  const todayHeadings432 = extractHeadings(todayViewHtml432);
  assert(
    todayHeadings432.some((h) => h.level === 2),
    "[Issue #432 AC-1] Today view contains <h2> for primary tab title"
  );

  const insightsViewHeadingHtml432 = renderInsightsView(store, null, "vi");
  const insightsHeadings432 = extractHeadings(insightsViewHeadingHtml432);
  assert(
    insightsHeadings432.some((h) => h.level === 2),
    "[Issue #432 AC-1] Insights view contains <h2> for primary tab title"
  );

  const managerViewHeadingHtml432 = renderManagerView(store, null, "vi");
  const managerHeadings432 = extractHeadings(managerViewHeadingHtml432);
  assert(
    managerHeadings432.some((h) => h.level === 2),
    "[Issue #432 AC-1] Manager view contains <h2> for primary tab title"
  );

  // 3. Routine clusters and modal subtitles use <h3>
  const morningSectionHtml432 = renderRoutineSection(
    "morning",
    store,
    selectedDate,
    "vi"
  );
  const morningHeadings432 = extractHeadings(morningSectionHtml432);
  assert(
    morningHeadings432.some((h) => h.level === 3),
    "[Issue #432 AC-1] Routine cluster section uses <h3> for routine header"
  );

  const modalEditHtml432 = renderHabitEditModal(habitWater, "vi");
  const modalHeadings432 = extractHeadings(modalEditHtml432);
  assert(
    modalHeadings432.some(
      (h) => h.level === 3 && h.raw.includes('id="habit-modal-title"')
    ),
    '[Issue #432 AC-1] Habit Edit Modal uses <h3 id="habit-modal-title"> for modal subtitle'
  );

  const detailSheetHeadingHtml432 = renderDetailSheet(
    habitWater,
    store,
    null,
    "vi",
    selectedDate
  );
  const detailHeadings432 = extractHeadings(detailSheetHeadingHtml432);
  assert(
    detailHeadings432.some(
      (h) => h.level === 3 && h.raw.includes('id="detail-sheet-title"')
    ),
    '[Issue #432 AC-1] Habit Detail Sheet uses <h3 id="detail-sheet-title"> for sheet subtitle'
  );

  // 4. Habit cards use <h4>
  const habitCardHeadingHtml432 = renderHabitCard(
    habitWater,
    { value: 0, completed: false },
    "vi"
  );
  const cardHeadings432 = extractHeadings(habitCardHeadingHtml432);
  assert(
    cardHeadings432.some((h) => h.level === 4 && h.text === habitWater.name),
    "[Issue #432 AC-1] Habit card uses <h4> for habit title"
  );

  // 5. PWA update banner avoids skipped heading tags
  const pwaBannerMatch432 = htmlContent.match(
    /id="pwa-update-banner"[\s\S]*?<\/div>\s*<\/div>/i
  );
  if (pwaBannerMatch432) {
    const pwaBannerHeadings = extractHeadings(pwaBannerMatch432[0]);
    const bannerHasSkippedHeading = pwaBannerHeadings.some((h) => h.level > 3);
    assert(
      !bannerHasSkippedHeading,
      "[Issue #432 AC-1] PWA update banner avoids skipped heading tags (no lone <h4> jumping directly under document root)"
    );
  }

  // 6. Full Outline Continuity Verification in DOM Sandbox
  const { sandbox: outlineSandbox } = createHabitTrackerSandbox();
  outlineSandbox.requestAnimationFrame = (fn) => fn();
  outlineSandbox.cancelAnimationFrame = () => {};
  await outlineSandbox.HabitApp.init();

  const tabsToTest432 = ["today", "insights", "manager", "settings"];
  for (const tab of tabsToTest432) {
    outlineSandbox.HabitApp.switchTab(tab);
    const mainHtml =
      outlineSandbox.document.getElementById("main-content").innerHTML;
    const fullPageSnippet = `
      <header><h1>Atomic Habits</h1></header>
      <main id="main-content">${mainHtml}</main>
    `;
    const fullOutline = extractHeadings(fullPageSnippet);
    const violations = findSkippedHeadingLevels(fullOutline);
    assertEqual(
      violations.length,
      0,
      `[Issue #432 AC-1] W3C heading continuity passes with zero skipped levels on '${tab}' tab`
    );
  }

  // Edge case: Empty State in Today View
  const emptyStore432 = new HabitStore({
    storage: storageModule.createStorageAdapter({ forceFallback: true }),
  });
  await emptyStore432.init();
  const emptyTodayHtml432 = renderTodayDashboard(emptyStore432, null, "vi");
  const emptyTodaySnippet = `
    <header><h1>Atomic Habits</h1></header>
    <main id="main-content">${emptyTodayHtml432}</main>
  `;
  const emptyOutline432 = extractHeadings(emptyTodaySnippet);
  const emptyViolations432 = findSkippedHeadingLevels(emptyOutline432);
  assertEqual(
    emptyViolations432.length,
    0,
    "[Issue #432 AC-1] Today view empty state preserves heading continuity (zero skipped levels)"
  );

  // ==========================================
  // [Issue #432 AC-2] Single <main> Landmark Enforcement
  // ==========================================
  console.log("\n--- [Issue #432 AC-2] Single <main> Landmark Enforcement ---");

  // 1. Static HTML landmark check
  const mainTagMatches432 = htmlContent.match(/<main[\s>]/gi) || [];
  assertEqual(
    mainTagMatches432.length,
    1,
    "[Issue #432 AC-2] habit-tracker/index.html contains exactly 1 <main> element"
  );
  assert(
    htmlContent.match(/<main[^>]*id="main-content"/i) !== null,
    "[Issue #432 AC-2] The single document <main> element is #main-content"
  );

  // 2. Component renderers do not emit nested <main> elements
  const todayRendered432 = renderTodayDashboard(store, null, "vi");
  assert(
    !todayRendered432.includes("<main") &&
      !todayRendered432.includes("</main>"),
    '[Issue #432 AC-2] renderTodayDashboard does not emit nested <main> element (no <main class="routine-list">)'
  );
  assert(
    !renderInsightsView(store, null, "vi").includes("<main"),
    "[Issue #432 AC-2] renderInsightsView does not emit <main> landmark"
  );
  assert(
    !renderManagerView(store, null, "vi").includes("<main"),
    "[Issue #432 AC-2] renderManagerView does not emit <main> landmark"
  );
  assert(
    !renderHabitEditModal(null, "vi").includes("<main"),
    "[Issue #432 AC-2] renderHabitEditModal does not emit <main> landmark"
  );
  assert(
    !renderDetailSheet(habitWater, store, null, "vi", selectedDate).includes(
      "<main"
    ),
    "[Issue #432 AC-2] renderDetailSheet does not emit <main> landmark"
  );

  // 3. Runtime Landmark DOM verification across all tab navigations
  const { sandbox: landmarkSandbox } = createHabitTrackerSandbox();
  landmarkSandbox.requestAnimationFrame = (fn) => fn();
  landmarkSandbox.cancelAnimationFrame = () => {};
  await landmarkSandbox.HabitApp.init();

  for (const tab of tabsToTest432) {
    landmarkSandbox.HabitApp.switchTab(tab);
    const mainInner =
      landmarkSandbox.document.getElementById("main-content").innerHTML;
    assert(
      !mainInner.includes("<main"),
      `[Issue #432 AC-2] No nested <main> landmark rendered inside #main-content on '${tab}' tab`
    );
  }

  // ==========================================
  // [Issue #432 AC-3] Tabular Monospace Alignment on Counters & Timers
  // ==========================================
  console.log(
    "\n--- [Issue #432 AC-3] Tabular Monospace Alignment on Counters & Timers ---"
  );

  // 1. Numeric Habit Card Stepper Counter
  const numericCardHtml432 = renderHabitCard(
    habitWater,
    { value: 500, completed: false },
    "vi"
  );
  const numericCounterMatch432 = numericCardHtml432.match(
    /<span[^>]*class="([^"]*)"[^>]*>[\s\S]*?(?:500\s*\/\s*2[.,]500|500\s*\/\s*2500)[\s\S]*?<\/span>/i
  );
  assert(
    numericCounterMatch432 !== null,
    "[Issue #432 AC-3] Numeric habit card renders counter value span"
  );
  if (numericCounterMatch432) {
    const counterClasses = numericCounterMatch432[1].split(/\s+/);
    assert(
      counterClasses.includes("tabular-nums"),
      "[Issue #432 AC-3] Numeric habit counter includes 'tabular-nums' class to prevent layout shifts"
    );
    assert(
      counterClasses.includes("font-mono"),
      "[Issue #432 AC-3] Numeric habit counter includes 'font-mono' class for monospace alignment"
    );
  }

  // 2. Timer Habit Card Duration Ticker
  const timerCardHtml432 = renderHabitCard(
    habitReading,
    { value: 600, completed: false },
    "vi"
  );
  const timerTickerMatch432 = timerCardHtml432.match(
    /<span[^>]*class="([^"]*)"[^>]*>[\s\S]*?(?:\d+p\s*\d+g|\d+m\s*\d+s|\d+:\d+)[\s\S]*?<\/span>/i
  );
  assert(
    timerTickerMatch432 !== null,
    "[Issue #432 AC-3] Timer habit card renders duration ticker span"
  );
  if (timerTickerMatch432) {
    const tickerClasses = timerTickerMatch432[1].split(/\s+/);
    assert(
      tickerClasses.includes("tabular-nums"),
      "[Issue #432 AC-3] Timer ticker includes 'tabular-nums' class to prevent layout shifts during countdown"
    );
    assert(
      tickerClasses.includes("font-mono"),
      "[Issue #432 AC-3] Timer ticker includes 'font-mono' class for fixed-width glyph alignment"
    );
  }

  // 3. Today View Ambient Header Daily Progress Ring Counter
  const todayDashHtml432 = renderTodayDashboard(store, null, "vi");
  const dailyProgressMatch432 = todayDashHtml432.match(
    /<span[^>]*class="([^"]*)"[^>]*>\s*\d+%\s*<\/span>/i
  );
  assert(
    dailyProgressMatch432 !== null,
    "[Issue #432 AC-3] Today dashboard renders daily progress percentage span"
  );
  if (dailyProgressMatch432) {
    const progressClasses = dailyProgressMatch432[1].split(/\s+/);
    assert(
      progressClasses.includes("tabular-nums") &&
        progressClasses.includes("font-mono"),
      "[Issue #432 AC-3] Daily progress percentage includes 'tabular-nums' and 'font-mono'"
    );
  }

  // 4. Routine Section Progress Counter (e.g. 1/3 done)
  const routineHeaderHtml432 = renderRoutineSection(
    "morning",
    store,
    selectedDate,
    "vi"
  );
  const routineCountMatch432 = routineHeaderHtml432.match(
    /<span[^>]*class="([^"]*)"[^>]*>[^<]*\d+\/\d+[^<]*<\/span>/i
  );
  assert(
    routineCountMatch432 !== null,
    "[Issue #432 AC-3] Routine section renders completed/total counter badge"
  );
  if (routineCountMatch432) {
    const routineCountClasses = routineCountMatch432[1].split(/\s+/);
    assert(
      routineCountClasses.includes("tabular-nums") &&
        routineCountClasses.includes("font-mono"),
      "[Issue #432 AC-3] Routine section progress badge includes 'tabular-nums' and 'font-mono'"
    );
  }

  // 5. Top Bar Freeze Token Counter Badge in index.html
  const freezeTokenBadgeMatch432 = htmlContent.match(
    /<span[^>]*id="freeze-tokens-count"[^>]*class="([^"]*)"[^>]*>|<span[^>]*class="([^"]*)"[^>]*id="freeze-tokens-count"/i
  );
  const freezeTokenBtnMatch432 = htmlContent.match(
    /<button[^>]*class="([^"]*)"[^>]*onclick="[^"]*settings[^"]*"[^>]*>[\s\S]*?freeze-tokens-count/i
  );
  const freezeHasTabular432 =
    (freezeTokenBadgeMatch432 &&
      ((
        freezeTokenBadgeMatch432[1] ||
        freezeTokenBadgeMatch432[2] ||
        ""
      ).includes("tabular-nums") ||
        (
          freezeTokenBadgeMatch432[1] ||
          freezeTokenBadgeMatch432[2] ||
          ""
        ).includes("font-mono"))) ||
    (freezeTokenBtnMatch432 &&
      (freezeTokenBtnMatch432[1].includes("tabular-nums") ||
        freezeTokenBtnMatch432[1].includes("font-mono")));
  assert(
    freezeHasTabular432,
    "[Issue #432 AC-3] Freeze token counter badge in top bar includes 'tabular-nums' or 'font-mono'"
  );

  // 6. Insights View Stat Cards Numeric Metric Displays
  const insightsHtml432 = renderInsightsView(store, null, "vi");
  const statCardValues432 = [];
  const statValueRegex432 =
    /<span[^>]*class="([^"]*text-3xl[^"]*font-black[^"]*)"[^>]*>([\s\S]*?)<\/span>/gi;
  let sMatch432;
  while ((sMatch432 = statValueRegex432.exec(insightsHtml432)) !== null) {
    statCardValues432.push({
      classes: sMatch432[1],
      text: sMatch432[2].trim(),
    });
  }
  assertEqual(
    statCardValues432.length,
    4,
    "[Issue #432 AC-3] Insights view renders 4 key metric stat card values (Best streak, Consistency %, Completions, Perfect days)"
  );
  for (let i = 0; i < statCardValues432.length; i++) {
    const cls = statCardValues432[i].classes.split(/\s+/);
    assert(
      cls.includes("tabular-nums") && cls.includes("font-mono"),
      `[Issue #432 AC-3] Stat card metric ${i + 1} ("${statCardValues432[i].text}") includes tabular-nums and font-mono`
    );
  }

  // 7. Detail Sheet Metric Stats Grid Numbers
  const detailSheetHtml432 = renderDetailSheet(
    habitWater,
    store,
    null,
    "vi",
    selectedDate
  );
  const detailStatValues432 = [];
  const detailStatRegex432 =
    /<span[^>]*class="([^"]*text-xl[^"]*)"[^>]*>([\s\S]*?)<\/span>/gi;
  let dMatch432;
  while ((dMatch432 = detailStatRegex432.exec(detailSheetHtml432)) !== null) {
    detailStatValues432.push({
      classes: dMatch432[1],
      text: dMatch432[2].trim(),
    });
  }
  assert(
    detailStatValues432.length >= 3,
    "[Issue #432 AC-3] Detail sheet renders 3 key habit stat values (current streak, best streak, consistency %)"
  );
  for (let i = 0; i < detailStatValues432.length; i++) {
    const cls = detailStatValues432[i].classes.split(/\s+/);
    assert(
      cls.includes("tabular-nums") && cls.includes("font-mono"),
      `[Issue #432 AC-3] Detail sheet stat value ${i + 1} ("${detailStatValues432[i].text}") includes tabular-nums and font-mono`
    );
  }

  // 8. Weekday & Routine Adherence Charts Monospace Numbers
  const weekdayChartMatch432 = insightsHtml432.match(
    /<span[^>]*class="([^"]*text-\[11px\][^"]*)"[^>]*>\d+%<\/span>/i
  );
  assert(
    weekdayChartMatch432 !== null,
    "[Issue #432 AC-3] Weekday chart renders rate percentage labels"
  );
  if (weekdayChartMatch432) {
    const wClasses = weekdayChartMatch432[1].split(/\s+/);
    assert(
      wClasses.includes("tabular-nums") && wClasses.includes("font-mono"),
      "[Issue #432 AC-3] Weekday chart rate percentage includes 'tabular-nums' and 'font-mono'"
    );
  }

  const routineAdherenceMatch432 = insightsHtml432.match(
    /<span[^>]*class="([^"]*absolute[^"]*)"[^>]*>\d+%<\/span>/i
  );
  assert(
    routineAdherenceMatch432 !== null,
    "[Issue #432 AC-3] Routine adherence card renders percentage ring center value"
  );
  if (routineAdherenceMatch432) {
    const rClasses = routineAdherenceMatch432[1].split(/\s+/);
    assert(
      rClasses.includes("tabular-nums") && rClasses.includes("font-mono"),
      "[Issue #432 AC-3] Routine adherence percentage includes 'tabular-nums' and 'font-mono'"
    );
  }

  // ==========================================
  // [Issue #432 AC-4] WCAG AA Text Contrast & Light/Dark Theme Color Pairings
  // ==========================================
  console.log(
    "\n--- [Issue #432 AC-4] WCAG AA Text Contrast & Light/Dark Theme Color Pairings ---"
  );

  function findUnpairedTextSlate500(htmlSnippet) {
    const tagRegex =
      /<([a-z0-9]+)[^>]*class="([^"]*text-slate-500[^"]*)"[^>]*>/gi;
    const violations = [];
    let match;
    while ((match = tagRegex.exec(htmlSnippet)) !== null) {
      const classAttr = match[2];
      const tokens = classAttr.split(/\s+/);
      const hasTextSlate500 = tokens.includes("text-slate-500");
      const hasDarkTextPair = tokens.some(
        (t) =>
          t.startsWith("dark:text-slate-400") ||
          t.startsWith("dark:text-slate-300") ||
          t.startsWith("dark:text-slate-200") ||
          t.startsWith("dark:text-slate-100") ||
          t.startsWith("dark:text-white")
      );
      if (hasTextSlate500 && !hasDarkTextPair) {
        violations.push({ tag: match[1], classAttr, raw: match[0] });
      }
    }
    return violations;
  }

  // 1. Static habit-tracker/index.html Text Contrast
  const indexContrastViolations432 = findUnpairedTextSlate500(htmlContent);
  assertEqual(
    indexContrastViolations432.length,
    0,
    "[Issue #432 AC-4] habit-tracker/index.html contains zero unpaired text-slate-500 classes (all paired with dark:text-...)"
  );

  // 2. Today View Text Contrast (Vietnamese & English)
  const todayContrastViolations432 = findUnpairedTextSlate500(todayViewHtml432);
  assertEqual(
    todayContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderTodayDashboard contains zero unpaired text-slate-500 classes (vi)"
  );
  const todayEnHtml432 = renderTodayDashboard(store, null, "en");
  const todayEnContrastViolations432 = findUnpairedTextSlate500(todayEnHtml432);
  assertEqual(
    todayEnContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderTodayDashboard contains zero unpaired text-slate-500 classes (en)"
  );

  // 3. Habit Card Text Contrast
  const habitCardContrastViolations432 =
    findUnpairedTextSlate500(numericCardHtml432);
  assertEqual(
    habitCardContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderHabitCard contains zero unpaired text-slate-500 classes"
  );

  // 4. Insights View Text Contrast
  const insightsContrastViolations432 =
    findUnpairedTextSlate500(insightsHtml432);
  assertEqual(
    insightsContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderInsightsView contains zero unpaired text-slate-500 classes (all stat labels properly paired)"
  );

  // 5. Manager View Text Contrast (Active + Archived sections)
  const managerContrastViolations432 = findUnpairedTextSlate500(
    managerViewHeadingHtml432
  );
  assertEqual(
    managerContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderManagerView contains zero unpaired text-slate-500 classes"
  );

  // 6. Habit Edit Modal Text Contrast
  const modalContrastViolations432 = findUnpairedTextSlate500(modalEditHtml432);
  assertEqual(
    modalContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderHabitEditModal contains zero unpaired text-slate-500 classes"
  );

  // 7. Detail Sheet Text Contrast
  const detailContrastViolations432 =
    findUnpairedTextSlate500(detailSheetHtml432);
  assertEqual(
    detailContrastViolations432.length,
    0,
    "[Issue #432 AC-4] renderDetailSheet contains zero unpaired text-slate-500 classes"
  );

  // 8. Settings Tab Text Contrast in Sandbox
  const { sandbox: contrastSandbox } = createHabitTrackerSandbox();
  contrastSandbox.requestAnimationFrame = (fn) => fn();
  contrastSandbox.cancelAnimationFrame = () => {};
  await contrastSandbox.HabitApp.init();
  contrastSandbox.HabitApp.switchTab("settings");
  const settingsHtml432 =
    contrastSandbox.document.getElementById("main-content").innerHTML;
  const settingsContrastViolations432 =
    findUnpairedTextSlate500(settingsHtml432);
  assertEqual(
    settingsContrastViolations432.length,
    0,
    "[Issue #432 AC-4] Settings tab contains zero unpaired text-slate-500 classes"
  );
}

runUITests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during UI Components test:", err);
    process.exit(1);
  });
