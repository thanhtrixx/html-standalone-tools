#!/usr/bin/env node

/**
 * Atomic Habit Tracker Domain Engine & Math Test Suite
 *
 * Domain: Core Math & Scheduling Engine
 * Covers:
 * - [AC-1] Habit Measurement Types (Binary, Numeric Counter, Timer/Duration)
 * - [AC-2] Scheduling & Vacation Pause Mode (Daily, Specific Days, Flexible X/wk, Interval, Vacation)
 * - [AC-3] Active Consecutive Streak Calculation (Today vs Yesterday, Non-scheduled invariance)
 * - [AC-4] Streak Freeze Token Application & Anti-Guilt Buffer
 * - [AC-5] Rolling 30-day & 90-day Consistency Score Percentages
 * - [AC-6] Routine-Level & Daily Overall Progress Ring Aggregations
 * - Heatmap Data Binning, Weekday/Routine Adherence & Milestone Badges
 */

const engine = require("../habit-tracker/src/domain/engine.js");
const { createAssertions } = require("./helpers/habit-tracker-harness.js");

const { assert, assertEqual, assertClose, printSummary } = createAssertions(
  "Atomic Habit Tracker Engine Math Test Suite"
);

console.log("\n🧪 Running Atomic Habit Tracker Engine Math Test Suite...\n");

try {
  // ==========================================
  // [AC-1] Habit Measurement Types
  // ==========================================
  console.log("--- [AC-1] Habit Measurement Types ---");

  // Binary Habit
  const binaryHabit = {
    id: "h-binary-1",
    name: "Morning Meditation",
    type: "binary",
    targetValue: 1,
  };

  const binProgress0 = engine.calculateHabitProgress(binaryHabit, 0);
  assertEqual(
    binProgress0.ratio,
    0.0,
    "[AC-1] Binary habit with 0 logged has 0.0 ratio"
  );
  assertEqual(
    binProgress0.isCompleted,
    false,
    "[AC-1] Binary habit with 0 logged is not completed"
  );

  const binProgress1 = engine.calculateHabitProgress(binaryHabit, 1);
  assertEqual(
    binProgress1.ratio,
    1.0,
    "[AC-1] Binary habit with 1 logged has 1.0 ratio"
  );
  assertEqual(
    binProgress1.isCompleted,
    true,
    "[AC-1] Binary habit with 1 logged is completed"
  );

  const binProgressTrue = engine.calculateHabitProgress(binaryHabit, true);
  assertEqual(
    binProgressTrue.ratio,
    1.0,
    "[AC-1] Binary habit with boolean true has 1.0 ratio"
  );
  assertEqual(
    binProgressTrue.isCompleted,
    true,
    "[AC-1] Binary habit with boolean true is completed"
  );

  // Numeric Counter Habit
  const numericHabit = {
    id: "h-numeric-1",
    name: "Drink Water",
    type: "numeric",
    targetValue: 2500,
    unit: "ml",
    step: 250,
  };

  const numProgress0 = engine.calculateHabitProgress(numericHabit, 0);
  assertEqual(
    numProgress0.ratio,
    0.0,
    "[AC-1] Numeric habit with 0 ml has 0.0 ratio"
  );

  const numProgressHalf = engine.calculateHabitProgress(numericHabit, 1250);
  assertClose(
    numProgressHalf.ratio,
    0.5,
    0.001,
    "[AC-1] Numeric habit with 1250/2500 ml has 0.5 ratio"
  );
  assertEqual(
    numProgressHalf.isCompleted,
    false,
    "[AC-1] Numeric habit with 1250/2500 ml is not completed"
  );

  const numProgressFull = engine.calculateHabitProgress(numericHabit, 2500);
  assertEqual(
    numProgressFull.ratio,
    1.0,
    "[AC-1] Numeric habit with 2500/2500 ml has 1.0 ratio"
  );
  assertEqual(
    numProgressFull.isCompleted,
    true,
    "[AC-1] Numeric habit with 2500/2500 ml is completed"
  );

  const numProgressOver = engine.calculateHabitProgress(numericHabit, 3000);
  assertEqual(
    numProgressOver.ratio,
    1.0,
    "[AC-1] Numeric habit with 3000/2500 ml caps ratio at 1.0"
  );
  assertEqual(
    numProgressOver.isCompleted,
    true,
    "[AC-1] Numeric habit with 3000/2500 ml is completed"
  );

  // Timer / Duration Habit
  const timerHabit = {
    id: "h-timer-1",
    name: "Deep Work",
    type: "timer",
    targetValue: 1800, // 30 minutes in seconds
    unit: "mins",
  };

  const timerProgress0 = engine.calculateHabitProgress(timerHabit, 0);
  assertEqual(
    timerProgress0.ratio,
    0.0,
    "[AC-1] Timer habit with 0s logged has 0.0 ratio"
  );

  const timerProgressHalf = engine.calculateHabitProgress(timerHabit, 900);
  assertClose(
    timerProgressHalf.ratio,
    0.5,
    0.001,
    "[AC-1] Timer habit with 900/1800s has 0.5 ratio"
  );

  const timerProgressFull = engine.calculateHabitProgress(timerHabit, 1800);
  assertEqual(
    timerProgressFull.ratio,
    1.0,
    "[AC-1] Timer habit with 1800/1800s has 1.0 ratio"
  );
  assertEqual(
    timerProgressFull.isCompleted,
    true,
    "[AC-1] Timer habit with 1800s logged is completed"
  );

  // Edge cases & null safety
  const zeroTargetHabit = { id: "h-zero", type: "numeric", targetValue: 0 };
  const zeroTargetRes = engine.calculateHabitProgress(zeroTargetHabit, 5);
  assertEqual(
    zeroTargetRes.ratio,
    1.0,
    "[AC-1] Zero target defaults safely to complete on positive value"
  );

  const negativeLoggedRes = engine.calculateHabitProgress(numericHabit, -50);
  assertEqual(
    negativeLoggedRes.ratio,
    0.0,
    "[AC-1] Negative logged value clamps to 0.0"
  );

  // ==========================================
  // [AC-2] Scheduling & Vacation Pause Mode
  // ==========================================
  console.log("\n--- [AC-2] Scheduling & Vacation Pause Mode ---");

  // Daily Schedule
  const dailyHabit = { id: "h-daily", scheduleType: "daily" };
  assertEqual(
    engine.isScheduledDate(dailyHabit, "2026-09-12"),
    true,
    "[AC-2] Daily habit is scheduled on 2026-09-12"
  );
  assertEqual(
    engine.isScheduledDate(dailyHabit, "2026-09-13"),
    true,
    "[AC-2] Daily habit is scheduled on 2026-09-13"
  );

  // Specific Days of Week (e.g., Mon=1, Wed=3, Fri=5)
  // 2026-09-11 is Friday (5), 2026-09-12 is Saturday (6), 2026-09-14 is Monday (1)
  const specificDaysHabit = {
    id: "h-specific",
    scheduleType: "specific_days",
    scheduleDays: [1, 3, 5], // Mon, Wed, Fri
  };

  assertEqual(
    engine.isScheduledDate(specificDaysHabit, "2026-09-11"),
    true,
    "[AC-2] Specific days habit scheduled on Friday (5)"
  );
  assertEqual(
    engine.isScheduledDate(specificDaysHabit, "2026-09-12"),
    false,
    "[AC-2] Specific days habit NOT scheduled on Saturday (6)"
  );
  assertEqual(
    engine.isScheduledDate(specificDaysHabit, "2026-09-14"),
    true,
    "[AC-2] Specific days habit scheduled on Monday (1)"
  );

  // Interval (Every N days)
  const intervalHabit = {
    id: "h-interval",
    scheduleType: "interval",
    intervalDays: 2,
    startDate: "2026-09-01",
  };
  assertEqual(
    engine.isScheduledDate(intervalHabit, "2026-09-01"),
    true,
    "[AC-2] Interval habit scheduled on day 0 (start date)"
  );
  assertEqual(
    engine.isScheduledDate(intervalHabit, "2026-09-02"),
    false,
    "[AC-2] Interval habit not scheduled on day 1"
  );
  assertEqual(
    engine.isScheduledDate(intervalHabit, "2026-09-03"),
    true,
    "[AC-2] Interval habit scheduled on day 2"
  );

  // Vacation / Sick Pause Mode
  const vacationRanges = [
    {
      id: "vac-1",
      startDate: "2026-09-05",
      endDate: "2026-09-08",
      reason: "Beach Trip",
      active: true,
    },
  ];

  assertEqual(
    engine.isScheduledDate(dailyHabit, "2026-09-04", vacationRanges),
    true,
    "[AC-2] Before vacation date is scheduled"
  );
  assertEqual(
    engine.isScheduledDate(dailyHabit, "2026-09-06", vacationRanges),
    false,
    "[AC-2] Date inside vacation range is NOT scheduled"
  );
  assertEqual(
    engine.isScheduledDate(dailyHabit, "2026-09-09", vacationRanges),
    true,
    "[AC-2] After vacation date is scheduled again"
  );

  // Per-habit paused state
  const pausedHabit = { id: "h-paused", scheduleType: "daily", isPaused: true };
  assertEqual(
    engine.isScheduledDate(pausedHabit, "2026-09-12"),
    false,
    "[AC-2] Paused habit is not scheduled"
  );

  // ==========================================
  // [AC-3] Active Consecutive Streak Calculation
  // ==========================================
  console.log("\n--- [AC-3] Active Consecutive Streak Calculation ---");

  // 5-day consecutive daily completions up to today (2026-09-12)
  const logs5Days = {
    "2026-09-08": { value: 1, completed: true },
    "2026-09-09": { value: 1, completed: true },
    "2026-09-10": { value: 1, completed: true },
    "2026-09-11": { value: 1, completed: true },
    "2026-09-12": { value: 1, completed: true },
  };

  const streakRes5 = engine.calculateStreakAndConsistency(
    dailyHabit,
    logs5Days,
    0, // freezeTokens
    [],
    "2026-09-12"
  );
  assertEqual(
    streakRes5.currentStreak,
    5,
    "[AC-3] 5 consecutive days completed yields currentStreak = 5"
  );
  assertEqual(streakRes5.bestStreak, 5, "[AC-3] Best streak is 5");

  // Today not completed yet: streak from yesterday (4 days) remains active
  const logsTodayPending = {
    "2026-09-08": { value: 1, completed: true },
    "2026-09-09": { value: 1, completed: true },
    "2026-09-10": { value: 1, completed: true },
    "2026-09-11": { value: 1, completed: true },
    // 2026-09-12 not completed yet
  };
  const streakResPending = engine.calculateStreakAndConsistency(
    dailyHabit,
    logsTodayPending,
    0,
    [],
    "2026-09-12"
  );
  assertEqual(
    streakResPending.currentStreak,
    4,
    "[AC-3] Today pending preserves yesterday's 4-day streak"
  );

  // Non-scheduled days do not break streak:
  // specificDaysHabit scheduled Mon (Sep 7), Wed (Sep 9), Fri (Sep 11)
  const logsMonWedFri = {
    "2026-09-07": { value: 1, completed: true }, // Mon
    "2026-09-09": { value: 1, completed: true }, // Wed
    "2026-09-11": { value: 1, completed: true }, // Fri
  };
  const streakResMWF = engine.calculateStreakAndConsistency(
    specificDaysHabit,
    logsMonWedFri,
    0,
    [],
    "2026-09-12" // Sat (non-scheduled)
  );
  assertEqual(
    streakResMWF.currentStreak,
    3,
    "[AC-3] Non-scheduled intervening days do NOT break streak"
  );

  // ==========================================
  // [AC-4] Streak Freeze Tokens
  // ==========================================
  console.log("\n--- [AC-4] Streak Freeze Tokens ---");

  // User completed Sep 8, 9, missed Sep 10 (scheduled), completed Sep 11, 12
  // With 1 freeze token, Sep 10 is frozen -> streak = 5
  const logsWithMissedDay = {
    "2026-09-08": { value: 1, completed: true },
    "2026-09-09": { value: 1, completed: true },
    "2026-09-10": { value: 0, completed: false }, // Missed!
    "2026-09-11": { value: 1, completed: true },
    "2026-09-12": { value: 1, completed: true },
  };

  const streakWithFreeze = engine.calculateStreakAndConsistency(
    dailyHabit,
    logsWithMissedDay,
    2, // 2 freeze tokens available
    [],
    "2026-09-12"
  );
  assertEqual(
    streakWithFreeze.currentStreak,
    5,
    "[AC-4] Freeze token preserves streak across missed scheduled day"
  );
  assertEqual(
    streakWithFreeze.freezeTokensRemaining,
    1,
    "[AC-4] Consumed 1 freeze token, 1 remaining"
  );
  assertEqual(
    streakWithFreeze.freezeTokensUsed,
    1,
    "[AC-4] Exactly 1 freeze token used"
  );
  assert(
    streakWithFreeze.frozenDates.includes("2026-09-10"),
    "[AC-4] Frozen dates list includes 2026-09-10"
  );

  // With 0 freeze tokens, missed day resets streak
  const streakNoFreeze = engine.calculateStreakAndConsistency(
    dailyHabit,
    logsWithMissedDay,
    0, // 0 freeze tokens
    [],
    "2026-09-12"
  );
  assertEqual(
    streakNoFreeze.currentStreak,
    2,
    "[AC-4] Zero freeze tokens resets streak to post-miss count (2)"
  );
  assertEqual(
    streakNoFreeze.bestStreak,
    2,
    "[AC-4] Best streak records max segment"
  );

  // ==========================================
  // [AC-5] Rolling Consistency Score
  // ==========================================
  console.log("\n--- [AC-5] Rolling Consistency Score ---");

  // Create 30 days of logs: 24 completed out of 30 scheduled daily days
  const logs30d = {};
  for (let i = 1; i <= 30; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    const dateKey = `2026-08-${dayStr}`;
    // Complete 24 days (skip every 5th day)
    if (i % 5 !== 0) {
      logs30d[dateKey] = { value: 1, completed: true };
    }
  }

  const scoreRes = engine.calculateStreakAndConsistency(
    dailyHabit,
    logs30d,
    0,
    [],
    "2026-08-30"
  );
  // 24 completed out of 30 scheduled = 80%
  assertEqual(
    scoreRes.consistencyScore30d,
    80,
    "[AC-5] 24/30 completed days calculates exact 80% consistency score"
  );

  // Consistency score with vacation days excluded from denominator
  const vac30d = [
    {
      id: "vac-30",
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      active: true,
    }, // 5 paused days
  ];
  const scoreWithVac = engine.calculateStreakAndConsistency(
    dailyHabit,
    logs30d,
    0,
    vac30d,
    "2026-08-30"
  );
  // 30 days - 5 vacation days = 25 scheduled days.
  // In days 6..30 (25 days), skipped 10, 15, 20, 25, 30 (5 missed) -> 20 completed out of 25 scheduled = 80%
  assertEqual(
    scoreWithVac.consistencyScore30d,
    80,
    "[AC-5] Vacation days excluded from denominator"
  );

  // ==========================================
  // [AC-6] Routine & Daily Ring Progress
  // ==========================================
  console.log("\n--- [AC-6] Routine & Daily Ring Progress ---");

  const habitsList = [
    {
      id: "h1",
      name: "Meditation",
      routine: "morning",
      type: "binary",
      targetValue: 1,
      scheduleType: "daily",
    },
    {
      id: "h2",
      name: "Journaling",
      routine: "morning",
      type: "binary",
      targetValue: 1,
      scheduleType: "daily",
    },
    {
      id: "h3",
      name: "Water 2L",
      routine: "afternoon",
      type: "numeric",
      targetValue: 2000,
      scheduleType: "daily",
    },
    {
      id: "h4",
      name: "Read 30m",
      routine: "evening",
      type: "timer",
      targetValue: 1800,
      scheduleType: "daily",
    },
  ];

  const todayLogs = {
    h1: { value: 1, completed: true }, // 100%
    h2: { value: 0, completed: false }, // 0% -> Morning: 50%
    h3: { value: 1500, completed: false }, // 75% -> Afternoon: 75%
    h4: { value: 1800, completed: true }, // 100% -> Evening: 100%
  };

  const morningProg = engine.calculateRoutineProgress(
    habitsList,
    todayLogs,
    "2026-09-12",
    "morning"
  );
  assertEqual(
    morningProg.total,
    2,
    "[AC-6] Morning routine has 2 scheduled habits"
  );
  assertEqual(
    morningProg.completed,
    1,
    "[AC-6] Morning routine has 1 fully completed habit"
  );
  assertEqual(
    morningProg.percentage,
    50,
    "[AC-6] Morning routine progress percentage is 50%"
  );

  const afternoonProg = engine.calculateRoutineProgress(
    habitsList,
    todayLogs,
    "2026-09-12",
    "afternoon"
  );
  assertEqual(
    afternoonProg.total,
    1,
    "[AC-6] Afternoon routine has 1 scheduled habit"
  );
  assertEqual(
    afternoonProg.percentage,
    75,
    "[AC-6] Afternoon routine progress percentage is 75%"
  );

  const eveningProg = engine.calculateRoutineProgress(
    habitsList,
    todayLogs,
    "2026-09-12",
    "evening"
  );
  assertEqual(
    eveningProg.percentage,
    100,
    "[AC-6] Evening routine progress is 100%"
  );

  // Overall Daily Progress: (1.0 + 0.0 + 0.75 + 1.0) / 4 = 2.75 / 4 = 68.75% -> 69%
  const dailyProg = engine.calculateDailyProgress(
    habitsList,
    todayLogs,
    "2026-09-12"
  );
  assertEqual(dailyProg.total, 4, "[AC-6] Total daily scheduled habits is 4");
  assertEqual(dailyProg.completed, 2, "[AC-6] Fully completed habits is 2");
  assertEqual(
    dailyProg.percentage,
    69,
    "[AC-6] Daily progress rounds correctly to 69%"
  );
  assertEqual(
    dailyProg.isAllCompleted,
    false,
    "[AC-6] Daily not fully completed yet"
  );

  // Perfect Day check
  const perfectLogs = {
    h1: { value: 1, completed: true },
    h2: { value: 1, completed: true },
    h3: { value: 2000, completed: true },
    h4: { value: 1800, completed: true },
  };
  const perfectDailyProg = engine.calculateDailyProgress(
    habitsList,
    perfectLogs,
    "2026-09-12"
  );
  assertEqual(
    perfectDailyProg.percentage,
    100,
    "[AC-6] Perfect day reaches 100%"
  );
  assertEqual(
    perfectDailyProg.isAllCompleted,
    true,
    "[AC-6] Perfect day marks isAllCompleted = true"
  );

  // ==========================================
  // Heatmap Bins, Weekdays & Milestone Badges
  // ==========================================
  console.log("\n--- Analytics, Heatmap & Milestone Badges ---");

  // Heatmap intensity levels
  assertEqual(engine.getHeatmapLevel(0), 0, "0% maps to level 0");
  assertEqual(engine.getHeatmapLevel(25), 1, "25% maps to level 1 (1-33%)");
  assertEqual(engine.getHeatmapLevel(50), 2, "50% maps to level 2 (34-66%)");
  assertEqual(engine.getHeatmapLevel(80), 3, "80% maps to level 3 (67-99%)");
  assertEqual(engine.getHeatmapLevel(100), 4, "100% maps to level 4");

  // Milestone Badges
  const badges7 = engine.evaluateMilestoneBadges(7, 10);
  assert(
    badges7.find((b) => b.id === "streak-7" && b.unlocked),
    "7-day streak badge unlocked"
  );
  assert(
    !badges7.find((b) => b.id === "streak-21" && b.unlocked),
    "21-day streak badge locked"
  );

  const badges100 = engine.evaluateMilestoneBadges(105, 200);
  assert(
    badges100.find((b) => b.id === "streak-100" && b.unlocked),
    "100-day streak badge unlocked"
  );

  // ==========================================
  // [AC-7] Statistical Zero-Baseline on Empty History (Issue #457)
  // ==========================================
  console.log("\n--- [AC-7] Statistical Zero-Baseline on Empty History ---");

  const emptyHabit = {
    id: "h-empty",
    name: "New Unstarted Habit",
    scheduleType: "specific_days",
    scheduleDays: [1, 3, 5],
    startDate: "2026-09-12",
  };

  const emptyStreak = engine.calculateStreakAndConsistency(
    emptyHabit,
    {},
    2,
    [],
    "2026-09-12"
  );
  assertEqual(
    emptyStreak.consistencyScore30d,
    0,
    "[AC-7] Unstarted habit with 0 scheduled history returns 0% for 30d consistency"
  );
  assertEqual(
    emptyStreak.consistencyScore90d,
    0,
    "[AC-7] Unstarted habit with 0 scheduled history returns 0% for 90d consistency"
  );

  const emptyWeekdayStats = engine.calculateWeekdayAdherence(
    [],
    {},
    90,
    "2026-09-12"
  );
  for (const wStat of emptyWeekdayStats) {
    assertEqual(
      wStat.rate,
      0,
      `[AC-7] Weekday ${wStat.dayOfWeek} with 0 scheduled days returns rate: 0%`
    );
  }

  const emptyRoutineStats = engine.calculateRoutineAdherence(
    [],
    {},
    30,
    "2026-09-12"
  );
  for (const rStat of emptyRoutineStats) {
    assertEqual(
      rStat.rate,
      0,
      `[AC-7] Routine ${rStat.routine} with 0 scheduled days returns rate: 0%`
    );
  }

  const emptyDailyProgress = engine.calculateDailyProgress(
    [],
    {},
    "2026-09-12"
  );
  assertEqual(
    emptyDailyProgress.percentage,
    0,
    "[AC-7] Empty scheduled list returns 0% daily progress"
  );
  assertEqual(
    emptyDailyProgress.isAllCompleted,
    false,
    "[AC-7] Empty scheduled list marks isAllCompleted = false"
  );

  // Issue #459: Multi-routine habit assignment engine tests
  const multiRoutineHabit = {
    id: "h-multi-walk",
    name: "Walking",
    type: "numeric",
    targetValue: 5000,
    unit: "steps",
    routines: ["morning", "evening"],
    scheduleType: "daily",
  };
  const legacyHabit = {
    id: "h-legacy",
    name: "Legacy Afternoon",
    type: "binary",
    targetValue: 1,
    routine: "afternoon",
    scheduleType: "daily",
  };
  const unassignedHabit = {
    id: "h-none",
    name: "No routine",
    type: "binary",
    targetValue: 1,
    scheduleType: "daily",
  };

  assertEqual(
    JSON.stringify(engine.getHabitRoutines(multiRoutineHabit)),
    JSON.stringify(["morning", "evening"]),
    "[Issue #459 AC-1] getHabitRoutines returns full routines array"
  );
  assertEqual(
    JSON.stringify(engine.getHabitRoutines(legacyHabit)),
    JSON.stringify(["afternoon"]),
    "[Issue #459 AC-1] getHabitRoutines normalizes legacy routine field"
  );
  assertEqual(
    JSON.stringify(engine.getHabitRoutines(unassignedHabit)),
    JSON.stringify(["anytime"]),
    "[Issue #459 AC-1] getHabitRoutines falls back to anytime"
  );

  const multiTestHabits = [multiRoutineHabit, legacyHabit];
  const multiLogs = {
    "h-multi-walk": { value: 5000, completed: true },
    "h-legacy": { value: 0, completed: false },
  };

  const morningMR = engine.calculateRoutineProgress(
    multiTestHabits,
    multiLogs,
    "2026-09-12",
    "morning"
  );
  assertEqual(
    morningMR.total,
    1,
    "[Issue #459 AC-2] Multi-routine habit counted in morning routine progress"
  );
  assertEqual(
    morningMR.completed,
    1,
    "[Issue #459 AC-2] Multi-routine habit marked completed in morning"
  );

  const eveningMR = engine.calculateRoutineProgress(
    multiTestHabits,
    multiLogs,
    "2026-09-12",
    "evening"
  );
  assertEqual(
    eveningMR.total,
    1,
    "[Issue #459 AC-2] Multi-routine habit counted in evening routine progress"
  );
  assertEqual(
    eveningMR.percentage,
    100,
    "[Issue #459 AC-2] Evening routine progress is 100%"
  );

  const routineAdherenceStats = engine.calculateRoutineAdherence(
    multiTestHabits,
    { "h-multi-walk_2026-09-12": { value: 5000, completed: true } },
    1,
    "2026-09-12"
  );
  const morningAdherence = routineAdherenceStats.find(
    (r) => r.routine === "morning"
  );
  const eveningAdherence = routineAdherenceStats.find(
    (r) => r.routine === "evening"
  );
  assertEqual(
    morningAdherence.rate,
    100,
    "[Issue #459 AC-3] Routine adherence counts multi-routine habit in morning stats"
  );
  assertEqual(
    eveningAdherence.rate,
    100,
    "[Issue #459 AC-3] Routine adherence counts multi-routine habit in evening stats"
  );
} catch (err) {
  console.error("❌ Exception during Engine Math test execution:", err);
  process.exit(1);
}

printSummary();
