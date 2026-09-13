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
          ? "date-pill-active bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400"
          : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700/60 shadow-xs";

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

  // Track expanded cards
  const expandedHabits = new Set();

  function toggleHabitExpanded(habitId) {
    if (expandedHabits.has(habitId)) {
      expandedHabits.delete(habitId);
    } else {
      expandedHabits.add(habitId);
    }
  }

  function isHabitExpanded(habitId) {
    return expandedHabits.has(habitId);
  }

  /**
   * Helper to get color hex by theme pill name
   */
  function getColorHex(colorName) {
    const found = engine.HABIT_COLORS.find((c) => c.id === colorName);
    return found ? found.hex : "#10b981";
  }

  /**
   * Renders single Habit Card component with Checkbox-First modality and in-place expansion
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

    const isRunning =
      habit.type === engine.HABIT_TYPES.TIMER &&
      typeof window !== "undefined" &&
      window.HabitApp &&
      window.HabitApp.runningTimerHabitId === habit.id;

    const isExpanded = expandedHabits.has(habit.id) || isRunning;

    const checkBg = isCompleted ? `style="background-color: ${colorHex};"` : "";
    const checkIcon = isCompleted ? "✓" : "";

    // 1-Tap Checkbox for ALL habits
    const checkboxHtml = `
      <button
        type="button"
        data-action="toggle-habit"
        data-habit-id="${habit.id}"
        aria-label="${i18n.t("completed", {}, lang)}"
        class="w-10 h-10 rounded-full border-2 ${
          isCompleted
            ? "border-transparent shadow-md ring-2 ring-white/20"
            : "border-slate-300 dark:border-slate-600/60 hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-800/40"
        } flex items-center justify-center text-white font-bold text-base transition-all duration-200 active:scale-90 cursor-pointer shrink-0"
        ${checkBg}
      >
        ${checkIcon}
      </button>
    `;

    // Subtitle progress indicator & inline expansion panel
    let progressSubtitle = "";
    let expandPanelHtml = "";

    if (habit.type === engine.HABIT_TYPES.NUMERIC) {
      const step = habit.step || 1;
      const unit = habit.unit || "";
      const currentVal = i18n.formatNumber(prog.loggedValue, lang);
      const targetVal = i18n.formatNumber(habit.targetValue, lang);

      progressSubtitle = `
        <div class="inline-flex items-center gap-1 text-xs ${
          isCompleted
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-slate-600 dark:text-slate-300"
        }">
          <span class="tabular-nums font-mono font-bold">${currentVal} / ${targetVal}</span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400">${unit}</span>
        </div>
      `;

      expandPanelHtml = `
        <div id="habit-expand-${habit.id}" class="habit-expand-panel ${
          isExpanded ? "" : "hidden"
        } mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              data-action="step-decrement"
              data-habit-id="${habit.id}"
              data-step="${step}"
              aria-label="Decrease"
              class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center font-bold text-base border border-slate-200 dark:border-slate-700/50 cursor-pointer"
            >
              -
            </button>
            <div class="text-center min-w-[70px]">
              <span class="text-sm font-bold tabular-nums font-mono ${
                isCompleted
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-slate-900 dark:text-white"
              }">${currentVal} / ${targetVal}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${unit}</span>
            </div>
            <button
              type="button"
              data-action="step-increment"
              data-habit-id="${habit.id}"
              data-step="${step}"
              aria-label="Increase"
              class="w-8 h-8 rounded-lg text-white active:scale-95 flex items-center justify-center font-bold text-base shadow-sm cursor-pointer"
              style="background-color: ${colorHex};"
            >
              +
            </button>
          </div>

          <button
            type="button"
            data-action="open-detail"
            data-habit-id="${habit.id}"
            class="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/40 cursor-pointer"
          >
            ${lang === "vi" ? "Chi tiết" : "Details"} ➔
          </button>
        </div>
      `;
    } else if (habit.type === engine.HABIT_TYPES.TIMER) {
      const durationFormatted = i18n.formatDuration(prog.loggedValue, lang);
      const targetDuration = i18n.formatDuration(habit.targetValue, lang);
      const hasProgress = (prog.loggedValue || 0) > 0;

      progressSubtitle = `
        <div class="inline-flex items-center gap-1 text-xs ${
          isCompleted
            ? "text-emerald-500 dark:text-emerald-400"
            : isRunning
              ? "text-emerald-500 dark:text-emerald-400 animate-pulse"
              : "text-slate-600 dark:text-slate-300"
        }">
          <span>⏱️</span>
          <span id="card-sub-ticker-${habit.id}" class="tabular-nums font-mono font-bold">${durationFormatted}</span>
          <span class="text-slate-400 font-normal">/ ${targetDuration}</span>
        </div>
      `;

      expandPanelHtml = `
        <div id="habit-expand-${habit.id}" class="habit-expand-panel ${
          isExpanded ? "" : "hidden"
        } mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            ${
              hasProgress
                ? `
              <button
                type="button"
                data-action="reset-timer"
                data-habit-id="${habit.id}"
                aria-label="${i18n.t("timer_reset", {}, lang)}"
                class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700/50 cursor-pointer"
              >
                🔄
              </button>
            `
                : ""
            }
            <button
              type="button"
              data-action="toggle-timer"
              data-habit-id="${habit.id}"
              data-target="${habit.targetValue}"
              aria-label="${
                isRunning
                  ? i18n.t("timer_pause", {}, lang)
                  : i18n.t("timer_start", {}, lang)
              }"
              class="h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 text-white active:scale-95 text-xs font-bold shadow-sm transition-all cursor-pointer ${
                isRunning ? "animate-pulse ring-2 ring-emerald-400/50" : ""
              }"
              style="background-color: ${colorHex};"
            >
              <span>${isRunning ? "⏸" : "▶"}</span>
              <span>${
                isRunning
                  ? i18n.t("timer_pause", {}, lang)
                  : i18n.t("timer_start", {}, lang)
              }</span>
            </button>
            <div class="text-left pl-1">
              <span id="card-timer-ticker-${habit.id}" class="text-sm font-mono tabular-nums font-bold ${
                isCompleted
                  ? "text-emerald-500 dark:text-emerald-400"
                  : isRunning
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-900 dark:text-white"
              }">${durationFormatted}</span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">/ ${targetDuration}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              data-action="open-focus-timer"
              data-habit-id="${habit.id}"
              class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold py-1 px-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-95 transition cursor-pointer flex items-center gap-1"
            >
              <span>🎯</span>
              <span>Focus</span>
            </button>

            <button
              type="button"
              data-action="open-detail"
              data-habit-id="${habit.id}"
              class="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/40 cursor-pointer"
            >
              ${lang === "vi" ? "Chi tiết" : "Details"} ➔
            </button>
          </div>
        </div>
      `;
    }

    const hasExpandable =
      habit.type === engine.HABIT_TYPES.NUMERIC ||
      habit.type === engine.HABIT_TYPES.TIMER;

    const completedCardStyle = isCompleted
      ? "opacity-85 border-emerald-500/30 dark:border-emerald-500/20"
      : isRunning
        ? "border-emerald-500/60 dark:border-emerald-500/50 ring-2 ring-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10"
        : "border-slate-200 dark:border-slate-800/80";

    const noteIndicator =
      logEntry && logEntry.notes
        ? `<span class="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 mt-0.5"><span class="mr-1">📝</span>${logEntry.notes.slice(
            0,
            24
          )}${logEntry.notes.length > 24 ? "..." : ""}</span>`
        : "";

    const cardClickAction = hasExpandable ? "toggle-expand" : "open-detail";

    const expandChevron = hasExpandable
      ? `<i class="text-xs not-italic text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
          isExpanded ? "rotate-180" : ""
        }" id="chevron-${habit.id}">▾</i>`
      : "";

    return `
      <div
        id="habit-card-${habit.id}"
        data-habit-card="${habit.id}"
        data-habit-id="${habit.id}"
        class="habit-card relative overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-3.5 mb-3 border ${completedCardStyle} transition-all duration-300 shadow-md touch-pan-y"
      >
        <!-- Swipe reveal zone (Green check) -->
        <div class="swipe-reveal-complete absolute inset-y-0 left-0 w-24 bg-emerald-500 text-white flex items-center justify-center font-bold text-lg opacity-0 -translate-x-full transition-all pointer-events-none">
          ✓
        </div>

        <div class="flex items-center justify-between gap-3 relative z-10">
          <div
            class="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
            data-action="${cardClickAction}"
            data-habit-id="${habit.id}"
          >
            <div class="w-1.5 h-10 rounded-full shrink-0" style="background-color: ${colorHex};"></div>
            <div class="text-2xl shrink-0">${habit.icon || "🎯"}</div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <h4 class="font-semibold text-slate-900 dark:text-white text-sm truncate ${
                  isCompleted
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : ""
                }">${habit.name}</h4>
                ${expandChevron}
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>${engine
                  .getHabitRoutines(habit)
                  .map((r) => i18n.t(`routine_${r}`, {}, lang))
                  .join(", ")}</span>
                ${progressSubtitle ? `&bull; ${progressSubtitle}` : ""}
              </div>
              ${noteIndicator}
            </div>
          </div>

          <div class="flex items-center shrink-0">
            ${checkboxHtml}
          </div>
        </div>

        ${expandPanelHtml}
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
        engine.getHabitRoutines(h).includes(routineKey) &&
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
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              data-action="open-identity-wizard"
              class="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✨</span>
              <span>${i18n.t("empty_state_wizard_btn", {}, lang)}</span>
            </button>
            <button
              type="button"
              data-action="open-add-habit"
              class="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700/80 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>${i18n.t("empty_state_manual_btn", {}, lang)}</span>
            </button>
          </div>
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

  /**
   * Renders Immersive Focus Timer Modal
   */
  function renderFocusTimerModal(
    habitOrStore,
    logEntryOrHabitId = { value: 0, completed: false },
    isRunningOrDisplayMode = false,
    timerDisplayModeOrSound = "remaining",
    soundEnabledOrLang = true,
    langOrUnused = "vi"
  ) {
    let habit = habitOrStore;
    let logEntry = logEntryOrHabitId;
    let isRunning = isRunningOrDisplayMode;
    let timerDisplayMode = timerDisplayModeOrSound;
    let soundEnabled = soundEnabledOrLang;
    let lang = langOrUnused;

    // Support (store, habitId, timerDisplayMode, soundEnabled, lang)
    if (habitOrStore && typeof habitOrStore.getHabit === "function") {
      const store = habitOrStore;
      const habitId = logEntryOrHabitId;
      habit = store.getHabit(habitId);
      const activeDate =
        store.getActiveDate && typeof store.getActiveDate === "function"
          ? store.getActiveDate()
          : new Date().toISOString().split("T")[0];
      logEntry =
        (store.state &&
          store.state.logs &&
          store.state.logs[`${habitId}_${activeDate}`]) || {
          value: 0,
          completed: false,
        };
      isRunning =
        typeof HabitApp !== "undefined" &&
        HabitApp.runningTimerHabitId === habitId;
      timerDisplayMode =
        typeof isRunningOrDisplayMode === "string"
          ? isRunningOrDisplayMode
          : "remaining";
      soundEnabled =
        typeof timerDisplayModeOrSound === "boolean"
          ? timerDisplayModeOrSound
          : true;
      lang =
        typeof soundEnabledOrLang === "string"
          ? soundEnabledOrLang
          : store.getSettings && typeof store.getSettings === "function"
            ? store.getSettings().language || "vi"
            : "vi";
    }

    if (!habit) return "";

    const currentSecs = Math.max(0, (logEntry && logEntry.value) || 0);
    const targetSecs = Math.max(1, habit.targetValue || 1200);
    const isCompleted = currentSecs >= targetSecs;
    const remainingSecs = Math.max(0, targetSecs - currentSecs);
    const overtimeSecs = Math.max(0, currentSecs - targetSecs);

    const colorHex = getColorHex(habit.color);

    let displayTimeStr = "";
    let modeLabel = "";

    if (isCompleted) {
      const m = String(Math.floor(overtimeSecs / 60)).padStart(2, "0");
      const s = String(overtimeSecs % 60).padStart(2, "0");
      displayTimeStr = `+${m}:${s}`;
      modeLabel = i18n.t("focus_timer_overtime", {}, lang);
    } else if (timerDisplayMode === "elapsed") {
      const m = String(Math.floor(currentSecs / 60)).padStart(2, "0");
      const s = String(currentSecs % 60).padStart(2, "0");
      displayTimeStr = `${m}:${s}`;
      modeLabel = i18n.t("focus_timer_elapsed", {}, lang);
    } else {
      const m = String(Math.floor(remainingSecs / 60)).padStart(2, "0");
      const s = String(remainingSecs % 60).padStart(2, "0");
      displayTimeStr = `${m}:${s}`;
      modeLabel = i18n.t("focus_timer_remaining", {}, lang);
    }

    const targetFormatted = i18n.formatDuration(targetSecs, lang);
    const durationFormatted = i18n.formatDuration(currentSecs, lang);

    const radius = 90;
    const circumference = 2 * Math.PI * radius; // 565.487
    const ratio = Math.min(1.0, currentSecs / targetSecs);
    const strokeDashoffset = circumference * (1 - ratio);

    const routineNames = engine
      .getHabitRoutines(habit)
      .map((r) => i18n.t(`routine_${r}`, {}, lang))
      .join(", ");

    return `
      <div id="focus-timer-modal" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden transition-transform max-w-md mx-auto" style="box-shadow: 0 10px 40px -5px ${colorHex}33;">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0" style="background-color: ${colorHex}22; border: 1px solid ${colorHex}66;">
              <span>${habit.icon || "⏱️"}</span>
            </div>
            <div class="min-w-0">
              <h3 id="focus-timer-title" class="font-bold text-base truncate">${habit.name}</h3>
              <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>${routineNames}</span>
                <span>&bull;</span>
                <span>${i18n.t("focus_timer_target", { target: targetFormatted }, lang)}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            data-action="close-focus-timer"
            aria-label="${i18n.t("close", {}, lang)}"
            class="text-slate-400 hover:text-white text-2xl leading-none p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >&times;</button>
        </div>

        <!-- Center Circular Dial -->
        <div class="relative flex flex-col items-center justify-center my-8">
          <svg class="w-64 h-64 -rotate-90 transform" viewBox="0 0 200 200">
            <!-- Background Track -->
            <circle
              cx="100"
              cy="100"
              r="${radius}"
              class="stroke-slate-800 fill-none"
              stroke-width="10"
            />
            <!-- Foreground Reactive Progress Stroke -->
            <circle
              id="focus-modal-svg-ring"
              cx="100"
              cy="100"
              r="${radius}"
              fill="none"
              stroke="${colorHex}"
              stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${strokeDashoffset}"
              class="transition-all duration-300"
            />
          </svg>

          <!-- Inside Dial Content -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <button
              type="button"
              data-action="toggle-timer-display-mode"
              class="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition cursor-pointer px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 mb-2"
              id="focus-modal-mode-badge"
            >
              ${modeLabel} ⇄
            </button>
            <div
              id="focus-modal-timer-digits"
              class="text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tight ${isCompleted ? "text-emerald-400" : isRunning ? "text-emerald-400" : "text-white"}"
            >
              ${displayTimeStr}
            </div>
            <div id="focus-modal-sub-ticker" class="text-xs text-slate-400 font-mono mt-2 tabular-nums">
              ${durationFormatted} / ${targetFormatted}
            </div>
          </div>
        </div>

        <!-- Quick Time Adjustment Steppers -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <button
            type="button"
            data-action="timer-adjust"
            data-habit-id="${habit.id}"
            data-delta="-60"
            class="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold text-slate-300 active:scale-95 transition cursor-pointer"
          >
            -1m
          </button>
          <button
            type="button"
            data-action="timer-adjust"
            data-habit-id="${habit.id}"
            data-delta="60"
            class="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold text-slate-300 active:scale-95 transition cursor-pointer"
          >
            +1m
          </button>
          <button
            type="button"
            data-action="timer-adjust"
            data-habit-id="${habit.id}"
            data-delta="300"
            class="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold text-slate-300 active:scale-95 transition cursor-pointer"
          >
            +5m
          </button>
        </div>

        <!-- Primary Control Actions -->
        <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            data-action="reset-timer"
            data-habit-id="${habit.id}"
            aria-label="${i18n.t("focus_timer_reset", {}, lang)}"
            class="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-lg border border-slate-700/60 text-slate-300 transition cursor-pointer"
            title="${i18n.t("focus_timer_reset", {}, lang)}"
          >
            🔄
          </button>

          <button
            type="button"
            data-action="toggle-timer"
            data-habit-id="${habit.id}"
            id="focus-modal-play-btn"
            class="flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer ${isRunning ? "animate-pulse ring-4 ring-emerald-500/20" : ""}"
            style="background-color: ${colorHex};"
          >
            <span class="text-base">${isRunning ? "⏸" : "▶"}</span>
            <span>${isRunning ? i18n.t("focus_timer_pause", {}, lang) : i18n.t("focus_timer_start", {}, lang)}</span>
          </button>

          <button
            type="button"
            data-action="timer-toggle-sound"
            aria-label="${soundEnabled ? i18n.t("focus_timer_sound_on", {}, lang) : i18n.t("focus_timer_sound_off", {}, lang)}"
            class="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-lg border border-slate-700/60 text-slate-300 transition cursor-pointer"
            title="${soundEnabled ? i18n.t("focus_timer_sound_on", {}, lang) : i18n.t("focus_timer_sound_off", {}, lang)}"
          >
            ${soundEnabled ? "🔔" : "🔕"}
          </button>
        </div>
      </div>
    `;
  }

  const todayExports = {
    renderDateRibbon,
    renderHabitCard,
    renderRoutineSection,
    renderTodayDashboard,
    renderFocusTimerModal,
    triggerVictoryConfetti,
    getColorHex,
    toggleHabitExpanded,
    isHabitExpanded,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = todayExports;
  } else {
    global.HabitTodayView = todayExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
