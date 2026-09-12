/**
 * Atomic Habit Tracker Domain Engine
 *
 * Pure mathematical models for:
 * - Habit progress normalization across Binary, Numeric Counter, and Timer/Duration types
 * - Scheduling rules (Daily, Specific Days of Week, Flexible Weekly, Repeat Interval, Vacation Pause)
 * - Anti-guilt active streaks, streak freeze token deductions, and rolling 30d/90d consistency scores
 * - Time-of-day routine cluster and overall daily progress aggregations
 * - 52-week calendar heatmap binning, weekday/routine adherence, and milestone badge logic
 */

(function (global) {
  "use strict";

  const HABIT_TYPES = {
    BINARY: "binary",
    NUMERIC: "numeric",
    TIMER: "timer",
  };

  const ROUTINES = {
    MORNING: "morning",
    AFTERNOON: "afternoon",
    EVENING: "evening",
    ANYTIME: "anytime",
  };

  const SCHEDULE_TYPES = {
    DAILY: "daily",
    SPECIFIC_DAYS: "specific_days",
    FLEXIBLE_WEEKLY: "flexible_weekly",
    INTERVAL: "interval",
  };

  const HABIT_COLORS = [
    { id: "emerald", hex: "#10b981", name: "Emerald Pulse" },
    { id: "indigo", hex: "#6366f1", name: "Electric Indigo" },
    { id: "amber", hex: "#f59e0b", name: "Sunset Amber" },
    { id: "crimson", hex: "#ef4444", name: "Crimson Fire" },
    { id: "violet", hex: "#8b5cf6", name: "Neon Violet" },
    { id: "cyan", hex: "#06b6d4", name: "Cyan Wave" },
  ];

  const MILESTONES = [
    {
      id: "streak-7",
      threshold: 7,
      type: "streak",
      icon: "🌱",
      titleKey: "milestone_7d",
    },
    {
      id: "streak-21",
      threshold: 21,
      type: "streak",
      icon: "⚡",
      titleKey: "milestone_21d",
    },
    {
      id: "streak-30",
      threshold: 30,
      type: "streak",
      icon: "🔥",
      titleKey: "milestone_30d",
    },
    {
      id: "streak-66",
      threshold: 66,
      type: "streak",
      icon: "🧠",
      titleKey: "milestone_66d",
    },
    {
      id: "streak-100",
      threshold: 100,
      type: "streak",
      icon: "🏆",
      titleKey: "milestone_100d",
    },
    {
      id: "streak-365",
      threshold: 365,
      type: "streak",
      icon: "👑",
      titleKey: "milestone_365d",
    },
  ];

  /**
   * Calculates completion progress ratio [0.0, 1.0] and completion status for a habit
   */
  function calculateHabitProgress(habit, logged) {
    if (!habit)
      return { ratio: 0.0, isCompleted: false, loggedValue: 0, targetValue: 1 };

    const type = habit.type || HABIT_TYPES.BINARY;
    const target = Number(habit.targetValue) || 1;

    let value = 0;
    if (typeof logged === "boolean") {
      value = logged ? 1 : 0;
    } else if (typeof logged === "number") {
      value = logged;
    } else if (logged && typeof logged === "object") {
      if (typeof logged.value === "number") value = logged.value;
      else if (logged.completed) value = target;
    }

    if (value < 0) value = 0;

    if (type === HABIT_TYPES.BINARY) {
      const isCompleted = value >= 1;
      return {
        ratio: isCompleted ? 1.0 : 0.0,
        isCompleted,
        loggedValue: isCompleted ? 1 : 0,
        targetValue: 1,
      };
    }

    if (target <= 0) {
      const isCompleted = value > 0;
      return {
        ratio: isCompleted ? 1.0 : 0.0,
        isCompleted,
        loggedValue: value,
        targetValue: 1,
      };
    }

    const ratio = Math.min(1.0, Math.max(0.0, value / target));
    return {
      ratio,
      isCompleted: ratio >= 1.0,
      loggedValue: value,
      targetValue: target,
    };
  }

  /**
   * Formats Date to YYYY-MM-DD
   */
  function toDateString(date) {
    if (!date) return "";
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Shifts a YYYY-MM-DD string by N days
   */
  function shiftDateString(dateStr, days) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    return toDateString(date);
  }

  /**
   * Determines if date is inside any active vacation/sick pause ranges
   */
  function isDateInVacation(dateStr, vacationRanges) {
    if (!Array.isArray(vacationRanges) || vacationRanges.length === 0) {
      return false;
    }
    return vacationRanges.some((range) => {
      if (range.active === false) return false;
      const start = range.startDate || range.start;
      const end = range.endDate || range.end || start;
      if (!start) return false;
      return dateStr >= start && dateStr <= end;
    });
  }

  /**
   * Checks if habit is scheduled to occur on a given calendar date
   */
  function isScheduledDate(habit, dateInput, vacationRanges = []) {
    if (!habit) return false;
    if (habit.isPaused || habit.vacationMode) return false;

    const dateStr = toDateString(dateInput);
    if (!dateStr) return false;

    if (habit.startDate && dateStr < toDateString(habit.startDate)) {
      return false;
    }
    if (habit.createdAt && dateStr < toDateString(habit.createdAt)) {
      return false;
    }

    if (isDateInVacation(dateStr, vacationRanges)) {
      return false;
    }

    const scheduleType = habit.scheduleType || SCHEDULE_TYPES.DAILY;

    if (scheduleType === SCHEDULE_TYPES.DAILY) {
      return true;
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    if (scheduleType === SCHEDULE_TYPES.SPECIFIC_DAYS) {
      const days = habit.scheduleDays || [];
      return days.includes(dayOfWeek);
    }

    if (scheduleType === SCHEDULE_TYPES.INTERVAL) {
      const interval = Math.max(1, Number(habit.intervalDays) || 1);
      const startStr = habit.startDate
        ? toDateString(habit.startDate)
        : toDateString(habit.createdAt || dateStr);
      const [sy, sm, sd] = startStr.split("-").map(Number);
      const startDate = new Date(sy, sm - 1, sd);
      const diffMs = dateObj.getTime() - startDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return false;
      return diffDays % interval === 0;
    }

    if (scheduleType === SCHEDULE_TYPES.FLEXIBLE_WEEKLY) {
      return true;
    }

    return true;
  }

  /**
   * Calculates consecutive active streak, best streak, freeze token consumption, and 30d/90d consistency scores
   */
  function calculateStreakAndConsistency(
    habit,
    logsMap = {},
    availableFreezeTokens = 2,
    vacationRanges = [],
    referenceDate = new Date()
  ) {
    const refDateStr = toDateString(referenceDate);
    if (!habit || !refDateStr) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        freezeTokensRemaining: availableFreezeTokens,
        freezeTokensUsed: 0,
        frozenDates: [],
        consistencyScore30d: 100,
        consistencyScore90d: 100,
        totalCompletions: 0,
        perfectDaysCount: 0,
      };
    }

    // Determine earliest bound
    let earliestBound = habit.startDate ? toDateString(habit.startDate) : null;
    if (!earliestBound && habit.createdAt) {
      earliestBound = toDateString(habit.createdAt);
    }
    if (!earliestBound) {
      const logDates = Object.keys(logsMap)
        .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
        .sort();
      if (logDates.length > 0) {
        earliestBound = logDates[0];
      } else {
        earliestBound = shiftDateString(refDateStr, -365);
      }
    }

    // 1. Calculate Active Current Streak starting from referenceDate
    let currentStreak = 0;
    let tokensLeft = Math.max(0, Number(availableFreezeTokens) || 0);
    let tokensUsed = 0;
    const frozenDates = [];

    // Check today (reference date)
    const refScheduled = isScheduledDate(habit, refDateStr, vacationRanges);
    const refLog = logsMap[refDateStr];
    const refProgress = calculateHabitProgress(habit, refLog);

    let startOffset = 0;
    if (refScheduled) {
      if (refProgress.isCompleted) {
        currentStreak++;
        startOffset = 1;
      } else {
        // Today is pending / not done yet -> streak is preserved from yesterday without consuming freeze token
        startOffset = 1;
      }
    } else {
      // Off-schedule today -> check from yesterday
      startOffset = 1;
    }

    // Traverse backwards up to earliest bound (or max 365 days)
    for (let i = startOffset; i < 365; i++) {
      const curDateStr = shiftDateString(refDateStr, -i);
      if (earliestBound && curDateStr < earliestBound) {
        break;
      }

      const scheduled = isScheduledDate(habit, curDateStr, vacationRanges);
      if (!scheduled) {
        // Non-scheduled days (e.g. weekends or vacation) do not break the streak
        continue;
      }

      const log = logsMap[curDateStr];
      const prog = calculateHabitProgress(habit, log);

      if (prog.isCompleted) {
        currentStreak++;
      } else if (tokensLeft > 0) {
        // Apply freeze token
        tokensLeft--;
        tokensUsed++;
        frozenDates.push(curDateStr);
        currentStreak++;
      } else {
        // Missed day with no freeze tokens -> streak breaks here
        break;
      }
    }

    // 2. Calculate All-Time Best Streak across all recorded logs and dates
    let bestStreak = currentStreak;
    let tempStreak = 0;
    let tempTokens = Math.max(0, Number(availableFreezeTokens) || 0);

    const historyDates = [];
    for (let i = 365; i >= 0; i--) {
      const d = shiftDateString(refDateStr, -i);
      if (!earliestBound || d >= earliestBound) {
        historyDates.push(d);
      }
    }

    for (const dStr of historyDates) {
      const scheduled = isScheduledDate(habit, dStr, vacationRanges);
      if (!scheduled) continue;

      const log = logsMap[dStr];
      const prog = calculateHabitProgress(habit, log);

      if (prog.isCompleted) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (tempTokens > 0) {
        tempTokens--;
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
        tempTokens = Math.max(0, Number(availableFreezeTokens) || 0);
      }
    }

    // 3. Calculate Rolling 30-Day and 90-Day Consistency Scores
    function calculateWindowScore(windowDays) {
      let scheduledCount = 0;
      let completedCount = 0;

      for (let i = 0; i < windowDays; i++) {
        const dStr = shiftDateString(refDateStr, -i);
        const scheduled = isScheduledDate(habit, dStr, vacationRanges);

        if (scheduled) {
          scheduledCount++;
          const log = logsMap[dStr];
          const prog = calculateHabitProgress(habit, log);
          if (prog.isCompleted) {
            completedCount++;
          }
        }
      }

      if (scheduledCount === 0) return 0;
      return Math.round((completedCount / scheduledCount) * 100);
    }

    const consistencyScore30d = calculateWindowScore(30);
    const consistencyScore90d = calculateWindowScore(90);

    // Total lifetime completions
    let totalCompletions = 0;
    for (const dKey in logsMap) {
      const prog = calculateHabitProgress(habit, logsMap[dKey]);
      if (prog.isCompleted) totalCompletions++;
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      freezeTokensRemaining: tokensLeft,
      freezeTokensUsed: tokensUsed,
      frozenDates,
      consistencyScore30d,
      consistencyScore90d,
      totalCompletions,
    };
  }

  /**
   * Helper to normalize habit assigned routines array
   */
  function getHabitRoutines(habit) {
    if (!habit) return [ROUTINES.ANYTIME];
    if (Array.isArray(habit.routines) && habit.routines.length > 0) {
      return habit.routines;
    }
    if (habit.routine) {
      return [habit.routine];
    }
    return [ROUTINES.ANYTIME];
  }

  /**
   * Aggregates progress for habits in a specific time-of-day routine
   */
  function calculateRoutineProgress(
    habits,
    logsMap = {},
    dateInput = new Date(),
    routineKey = "morning"
  ) {
    const dateStr = toDateString(dateInput);
    if (!Array.isArray(habits)) {
      return {
        total: 0,
        completed: 0,
        percentage: 0,
        ratio: 0.0,
        habits: [],
      };
    }

    const routineHabits = habits.filter(
      (h) =>
        getHabitRoutines(h).includes(routineKey) && isScheduledDate(h, dateStr)
    );

    const total = routineHabits.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        percentage: 0,
        ratio: 0.0,
        habits: [],
      };
    }

    let sumRatio = 0;
    let completedCount = 0;

    const habitDetails = routineHabits.map((h) => {
      const log = logsMap[h.id] || logsMap[`${h.id}_${dateStr}`];
      const prog = calculateHabitProgress(h, log);
      sumRatio += prog.ratio;
      if (prog.isCompleted) completedCount++;
      return { habit: h, ...prog };
    });

    const avgRatio = sumRatio / total;
    const percentage = Math.round(avgRatio * 100);

    return {
      total,
      completed: completedCount,
      percentage,
      ratio: avgRatio,
      habits: habitDetails,
    };
  }

  /**
   * Aggregates overall daily progress across all scheduled habits
   */
  function calculateDailyProgress(
    habits,
    logsMap = {},
    dateInput = new Date()
  ) {
    const dateStr = toDateString(dateInput);
    if (!Array.isArray(habits)) {
      return {
        total: 0,
        completed: 0,
        percentage: 0,
        ratio: 0.0,
        isAllCompleted: false,
      };
    }

    const scheduledHabits = habits.filter((h) => isScheduledDate(h, dateStr));
    const total = scheduledHabits.length;

    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        percentage: 0,
        ratio: 0.0,
        isAllCompleted: false,
      };
    }

    let sumRatio = 0;
    let completedCount = 0;

    for (const h of scheduledHabits) {
      const log = logsMap[h.id] || logsMap[`${h.id}_${dateStr}`];
      const prog = calculateHabitProgress(h, log);
      sumRatio += prog.ratio;
      if (prog.isCompleted) completedCount++;
    }

    const avgRatio = sumRatio / total;
    const percentage = Math.round(avgRatio * 100);

    return {
      total,
      completed: completedCount,
      percentage,
      ratio: avgRatio,
      isAllCompleted: completedCount >= total && total > 0,
    };
  }

  /**
   * Computes heatmap level (0 to 4) from percentage
   */
  function getHeatmapLevel(percent) {
    if (!percent || percent <= 0) return 0;
    if (percent <= 33) return 1;
    if (percent <= 66) return 2;
    if (percent <= 99) return 3;
    return 4;
  }

  /**
   * Computes 52-week calendar contribution heatmap grid data
   */
  function computeHeatmapData(
    habits,
    logsMap = {},
    startDate,
    endDate = new Date()
  ) {
    const endStr = toDateString(endDate);
    const startStr = startDate
      ? toDateString(startDate)
      : shiftDateString(endStr, -364);

    const cells = [];
    let cur = startStr;

    while (cur <= endStr) {
      let scheduled = 0;
      let completed = 0;
      let sumRatio = 0;

      for (const h of habits) {
        if (isScheduledDate(h, cur)) {
          scheduled++;
          const log =
            logsMap[`${h.id}_${cur}`] || (logsMap[h.id] && logsMap[h.id][cur]);
          const prog = calculateHabitProgress(h, log);
          sumRatio += prog.ratio;
          if (prog.isCompleted) completed++;
        }
      }

      const rate = scheduled > 0 ? Math.round((sumRatio / scheduled) * 100) : 0;
      cells.push({
        date: cur,
        completionRate: rate,
        completedCount: completed,
        scheduledCount: scheduled,
        level: getHeatmapLevel(rate),
      });

      cur = shiftDateString(cur, 1);
    }

    return cells;
  }

  /**
   * Computes weekday adherence rates (Monday to Sunday)
   */
  function calculateWeekdayAdherence(
    habits,
    logsMap = {},
    daysBack = 90,
    refDate = new Date()
  ) {
    const refStr = toDateString(refDate);
    const stats = Array.from({ length: 7 }, () => ({
      scheduled: 0,
      completed: 0,
    }));

    for (let i = 0; i < daysBack; i++) {
      const dStr = shiftDateString(refStr, -i);
      const [y, m, d] = dStr.split("-").map(Number);
      const dayOfWeek = new Date(y, m - 1, d).getDay();

      for (const h of habits) {
        if (isScheduledDate(h, dStr)) {
          stats[dayOfWeek].scheduled++;
          const log =
            logsMap[`${h.id}_${dStr}`] ||
            (logsMap[h.id] && logsMap[h.id][dStr]);
          const prog = calculateHabitProgress(h, log);
          if (prog.isCompleted) stats[dayOfWeek].completed++;
        }
      }
    }

    return stats.map((s, idx) => ({
      dayOfWeek: idx,
      rate: s.scheduled > 0 ? Math.round((s.completed / s.scheduled) * 100) : 0,
      scheduled: s.scheduled,
      completed: s.completed,
    }));
  }

  /**
   * Computes routine cluster adherence breakdown
   */
  function calculateRoutineAdherence(
    habits,
    logsMap = {},
    daysBack = 30,
    refDate = new Date()
  ) {
    const refStr = toDateString(refDate);
    const routineKeys = [
      ROUTINES.MORNING,
      ROUTINES.AFTERNOON,
      ROUTINES.EVENING,
      ROUTINES.ANYTIME,
    ];
    const stats = {};
    routineKeys.forEach((r) => (stats[r] = { scheduled: 0, completed: 0 }));

    for (let i = 0; i < daysBack; i++) {
      const dStr = shiftDateString(refStr, -i);
      for (const h of habits) {
        if (isScheduledDate(h, dStr)) {
          const assignedRoutines = getHabitRoutines(h);
          for (const rKey of assignedRoutines) {
            if (stats[rKey]) {
              stats[rKey].scheduled++;
              const log =
                logsMap[`${h.id}_${dStr}`] ||
                (logsMap[h.id] && logsMap[h.id][dStr]);
              const prog = calculateHabitProgress(h, log);
              if (prog.isCompleted) stats[rKey].completed++;
            }
          }
        }
      }
    }

    return routineKeys.map((rKey) => ({
      routine: rKey,
      rate:
        stats[rKey].scheduled > 0
          ? Math.round((stats[rKey].completed / stats[rKey].scheduled) * 100)
          : 0,
      scheduled: stats[rKey].scheduled,
      completed: stats[rKey].completed,
    }));
  }

  /**
   * Evaluates milestone badge achievements
   */
  function evaluateMilestoneBadges(
    allTimeBestStreak = 0,
    totalCompletions = 0
  ) {
    return MILESTONES.map((badge) => {
      const unlocked =
        badge.type === "streak"
          ? allTimeBestStreak >= badge.threshold
          : totalCompletions >= badge.threshold;
      return {
        ...badge,
        unlocked,
        progress:
          badge.type === "streak"
            ? Math.min(1.0, allTimeBestStreak / badge.threshold)
            : Math.min(1.0, totalCompletions / badge.threshold),
      };
    });
  }

  const engineExports = {
    HABIT_TYPES,
    ROUTINES,
    SCHEDULE_TYPES,
    HABIT_COLORS,
    MILESTONES,
    getHabitRoutines,
    calculateHabitProgress,
    toDateString,
    shiftDateString,
    isScheduledDate,
    calculateStreakAndConsistency,
    calculateRoutineProgress,
    calculateDailyProgress,
    getHeatmapLevel,
    computeHeatmapData,
    calculateWeekdayAdherence,
    calculateRoutineAdherence,
    evaluateMilestoneBadges,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engineExports;
  } else {
    global.HabitEngine = engineExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
