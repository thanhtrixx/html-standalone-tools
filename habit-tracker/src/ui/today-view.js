/**
 * Atomic Habit Tracker Today View & Routine Clustering
 *
 * Implements:
 * - 7-day scrollable Date Ribbon with today pill
 * - Ambient streak & freeze token status header
 * - Time-of-day Routine Sections (Morning, Afternoon, Evening, Anytime)
 * - Habit Cards with 1-tap check, numeric stepper, timer controls
 * - Touch swipe-right to complete with spring feedback
 * - 100% Daily Victory Confetti
 */

(function (global) {
  "use strict";

  const engine =
    typeof require !== "undefined"
      ? require("../domain/engine.js")
      : global.HabitEngine;

  const i18n =
    typeof require !== "undefined"
      ? require("../i18n/translations.js")
      : global.Habiti18n;

  const components =
    typeof require !== "undefined"
      ? require("./components.js")
      : global.HabitComponents;

  /**
   * Renders 7-day horizontal scrollable Date Ribbon
   */
  function renderDateRibbon(selectedDateInput, store, lang = "vi") {
    const selectedDate = engine.toDateString(selectedDateInput);
    const todayStr = engine.toDateString(new Date());

    // Generate 7 days centered around today (-3 to +3)
    const days = [];
    for (let i = -3; i <= 3; i++) {
      days.push(engine.shiftDateString(todayStr, i));
    }

    const itemsHtml = days
      .map((dStr) => {
        const isSelected = dStr === selectedDate;
        const isToday = dStr === todayStr;
        const weekday = i18n.formatDate(dStr, lang, "weekday_short");
        const dayNumber = dStr.split("-")[2];

        // Check completion status for this day
        const dailyState = store ? store.getDailyState(dStr) : null;
        const progress = dailyState ? dailyState.dailyProgress.percentage : 0;
        const isAllDone = dailyState
          ? dailyState.dailyProgress.isAllCompleted
          : false;

        const activeClasses = isSelected
          ? "date-pill-active bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400"
          : "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/40";

        const dotIndicator = isAllDone
          ? `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1"></span>`
          : progress > 0
            ? `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1"></span>`
            : `<span class="w-1.5 h-1.5 rounded-full bg-transparent mt-1"></span>`;

        return `
          <button
            type="button"
            data-action="select-date"
            data-date="${dStr}"
            class="flex flex-col items-center justify-center min-w-[52px] h-[68px] rounded-2xl p-2 transition-all duration-200 cursor-pointer select-none ${activeClasses}"
          >
            <span class="text-[11px] uppercase tracking-wider opacity-80">${weekday}</span>
            <span class="text-base font-semibold mt-0.5">${dayNumber}</span>
            ${dotIndicator}
          </button>
        `;
      })
      .join("");

    return `
      <div class="date-ribbon flex items-center justify-between gap-2 overflow-x-auto py-2 px-1 no-scrollbar">
        ${itemsHtml}
      </div>
    `;
  }

  /**
   * Helper to get color hex by theme pill name
   */
  function getColorHex(colorName) {
    const found = engine.HABIT_COLORS.find((c) => c.id === colorName);
    return found ? found.hex : "#10b981";
  }

  /**
   * Renders single Habit Card component
   */
  function renderHabitCard(
    habit,
    logEntry = { value: 0, completed: false, notes: "" },
    lang = "vi"
  ) {
    if (!habit) return "";

    const prog = engine.calculateHabitProgress(habit, logEntry);
    const colorHex = getColorHex(habit.color);
    const isCompleted = prog.isCompleted;

    // Measurement controls
    let controlHtml = "";

    if (habit.type === engine.HABIT_TYPES.BINARY) {
      const checkBg = isCompleted
        ? `style="background-color: ${colorHex};"`
        : "";
      const checkIcon = isCompleted ? "✓" : "";
      controlHtml = `
        <button
          type="button"
          data-action="toggle-habit"
          data-habit-id="${habit.id}"
          aria-label="${i18n.t("completed", {}, lang)}"
          class="w-11 h-11 rounded-full border-2 border-slate-300 dark:border-slate-600/60 flex items-center justify-center text-white font-bold text-lg transition-transform active:scale-90"
          ${checkBg}
        >
          ${checkIcon}
        </button>
      `;
    } else if (habit.type === engine.HABIT_TYPES.NUMERIC) {
      const step = habit.step || 1;
      const unit = habit.unit || "";
      const currentVal = i18n.formatNumber(prog.loggedValue, lang);
      const targetVal = i18n.formatNumber(habit.targetValue, lang);

      controlHtml = `
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-action="step-decrement"
            data-habit-id="${habit.id}"
            data-step="${step}"
            aria-label="Decrease"
            class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-base active:scale-95 border border-slate-200 dark:border-slate-700/50"
          >
            -
          </button>
          <div class="text-right min-w-[70px]">
            <span class="text-sm font-bold tabular-nums font-mono ${isCompleted ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"}">${currentVal} / ${targetVal}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${unit}</span>
          </div>
          <button
            type="button"
            data-action="step-increment"
            data-habit-id="${habit.id}"
            data-step="${step}"
            aria-label="Increase"
            class="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-base active:scale-95 shadow-sm"
            style="background-color: ${colorHex};"
          >
            +
          </button>
        </div>
      `;
    } else if (habit.type === engine.HABIT_TYPES.TIMER) {
      const durationFormatted = i18n.formatDuration(prog.loggedValue, lang);
      const targetDuration = i18n.formatDuration(habit.targetValue, lang);

      controlHtml = `
        <div class="flex items-center gap-2">
          <div class="text-right">
            <span class="text-sm font-mono tabular-nums font-bold ${isCompleted ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"}">${durationFormatted}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${targetDuration}</span>
          </div>
          <button
            type="button"
            data-action="toggle-timer"
            data-habit-id="${habit.id}"
            data-target="${habit.targetValue}"
            class="w-9 h-9 rounded-lg flex items-center justify-center text-white active:scale-95 shadow-sm"
            style="background-color: ${colorHex};"
          >
            ${isCompleted ? "✓" : "▶"}
          </button>
        </div>
      `;
    }

    const completedCardStyle = isCompleted
      ? "opacity-85 border-emerald-500/30 dark:border-emerald-500/20"
      : "border-slate-200 dark:border-slate-800/80";

    const noteIndicator =
      logEntry && logEntry.notes
        ? `<span class="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1"><span class="mr-1">📝</span>${logEntry.notes.slice(0, 24)}${logEntry.notes.length > 24 ? "..." : ""}</span>`
        : "";

    return `
      <div
        id="habit-card-${habit.id}"
        data-habit-card="${habit.id}"
        class="habit-card relative overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 mb-3 border ${completedCardStyle} transition-all duration-300 shadow-md touch-pan-y"
      >
        <!-- Swipe reveal zone (Green check) -->
        <div class="swipe-reveal-complete absolute inset-y-0 left-0 w-24 bg-emerald-500 text-white flex items-center justify-center font-bold text-lg opacity-0 -translate-x-full transition-all pointer-events-none">
          ✓
        </div>

        <div class="flex items-center justify-between gap-3 relative z-10">
          <div class="flex items-center gap-3 cursor-pointer select-none flex-1" data-action="open-detail" data-habit-id="${habit.id}">
            <div class="w-1.5 h-10 rounded-full" style="background-color: ${colorHex};"></div>
            <div class="text-2xl">${habit.icon || "🎯"}</div>
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white text-base ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""}">${habit.name}</h4>
              <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>${habit.routine ? i18n.t(`routine_${habit.routine}`, {}, lang) : ""}</span>
              </div>
              ${noteIndicator}
            </div>
          </div>

          <div class="flex items-center">
            ${controlHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders Time-of-Day Routine Cluster Section
   */
  function renderRoutineSection(
    routineKey,
    store,
    selectedDateInput,
    lang = "vi"
  ) {
    if (!store) return "";
    const selectedDate = engine.toDateString(selectedDateInput);
    const habits = store.getHabits();
    const dailyState = store.getDailyState(selectedDate);

    const routineProg = engine.calculateRoutineProgress(
      habits,
      dailyState.logs,
      selectedDate,
      routineKey
    );

    const routineTitle = i18n.t(`routine_${routineKey}`, {}, lang);
    const routineTime = i18n.t(`routine_${routineKey}_time`, {}, lang);

    const icons = {
      morning: "🌅",
      afternoon: "☀️",
      evening: "🌙",
      anytime: "🔄",
    };

    const scheduledHabits = habits.filter(
      (h) =>
        (h.routine || engine.ROUTINES.ANYTIME) === routineKey &&
        engine.isScheduledDate(h, selectedDate)
    );

    if (scheduledHabits.length === 0) {
      return "";
    }

    const cardsHtml = scheduledHabits
      .map((h) => {
        const log = dailyState.logs[h.id] || {
          value: 0,
          completed: false,
          notes: "",
        };
        return renderHabitCard(h, log, lang);
      })
      .join("");

    return `
      <section class="routine-section mb-6" data-routine="${routineKey}">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <span class="text-xl">${icons[routineKey] || "🎯"}</span>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base leading-tight">${routineTitle}</h3>
              <span class="text-xs text-slate-500 dark:text-slate-400">${routineTime}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold tabular-nums font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700/50">
              ${routineProg.completed}/${routineProg.total} ${i18n.t("done", {}, lang)}
            </span>
          </div>
        </div>

        <div class="routine-cards">
          ${cardsHtml}
        </div>
      </section>
    `;
  }

  /**
   * Renders the complete Today Dashboard view
   */
  function renderTodayDashboard(store, containerElement, lang = "vi") {
    if (!store) return;
    const selectedDate = store.getActiveDate();
    const habits = store.getHabits();
    const dailyState = store.getDailyState(selectedDate);
    const settings = store.getSettings();

    // Top status metrics
    const dailyProgress = dailyState.dailyProgress;
    const streakSummary = engine.calculateStreakAndConsistency(
      habits[0] || { scheduleType: "daily" },
      dailyState.logs,
      settings.freezeTokens || 2,
      settings.vacationRanges || [],
      selectedDate
    );

    const ribbonHtml = renderDateRibbon(selectedDate, store, lang);

    const routineKeys = [
      engine.ROUTINES.MORNING,
      engine.ROUTINES.AFTERNOON,
      engine.ROUTINES.EVENING,
      engine.ROUTINES.ANYTIME,
    ];

    const routineSectionsHtml = routineKeys
      .map((r) => renderRoutineSection(r, store, selectedDate, lang))
      .join("");

    const hasHabits = habits.length > 0;
    const emptyStateHtml = !hasHabits
      ? `
        <div class="text-center py-16 px-4">
          <div class="text-5xl mb-3">🌱</div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">${i18n.t("no_habits_scheduled_today", {}, lang)}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">${i18n.t("app_tagline", {}, lang)}</p>
          <button
            type="button"
            data-action="open-add-habit"
            class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            + ${i18n.t("add_first_habit", {}, lang)}
          </button>
        </div>
      `
      : "";

    const progressRingHtml = components.renderSvgProgressRing(
      36,
      6,
      dailyProgress.percentage,
      dailyProgress.percentage === 100 ? "#10b981" : "#6366f1"
    );

    const html = `
      <div class="today-dashboard max-w-lg mx-auto pb-24">
        <!-- Top Status Header -->
        <header class="ambient-header bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-5 mb-4 border border-slate-200 dark:border-slate-800/80 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">${i18n.formatDate(selectedDate, lang, "full")}</span>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">${i18n.t("today_tab", {}, lang)}</h2>
              <div class="flex items-center gap-3 mt-2">
                <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                  🔥 ${i18n.t("streak_days_count", { count: streakSummary.currentStreak }, lang)}
                </span>
                <span class="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800/50">
                  ❄️ ${settings.freezeTokens || 2}
                </span>
              </div>
            </div>

            <div class="relative flex items-center justify-center">
              ${progressRingHtml}
              <span class="absolute text-sm font-extrabold tabular-nums font-mono text-slate-900 dark:text-white">${dailyProgress.percentage}%</span>
            </div>
          </div>

          <!-- Date Ribbon -->
          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
            ${ribbonHtml}
          </div>
        </header>

        <!-- Routine Clusters -->
        <div class="routine-list">
          ${routineSectionsHtml}
          ${emptyStateHtml}
        </div>
      </div>
    `;

    if (containerElement) {
      containerElement.innerHTML = html;
    }

    return html;
  }

  /**
   * Helper to trigger victory confetti on 100% completion
   */
  function triggerVictoryConfetti(canvasElement, onComplete) {
    components.triggerHapticFeedback("victory");
    components.playCompletionChime();
    components.createConfettiBurst(canvasElement, onComplete);
  }

  const todayExports = {
    renderDateRibbon,
    renderHabitCard,
    renderRoutineSection,
    renderTodayDashboard,
    triggerVictoryConfetti,
    getColorHex,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = todayExports;
  } else {
    global.HabitTodayView = todayExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
