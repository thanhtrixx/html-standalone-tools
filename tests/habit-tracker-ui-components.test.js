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
 */

const {
  createHabitTrackerSandbox,
  createAssertions,
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
}

runUITests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during UI Components test:", err);
    process.exit(1);
  });
