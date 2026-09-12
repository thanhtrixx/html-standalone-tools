/**
 * Atomic Habit Tracker Deep-Dive Bottom Sheet
 *
 * Implements:
 * - Expandable Bottom Sheet (#habit-detail-sheet)
 * - 365-Day Mini Heatmap Activity Grid for selected habit
 * - Key Habit Metrics (Current streak, Best streak, 30-Day Consistency %)
 * - Historical check-in logs list with Reflection Notes editor (Micro-Journal)
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

  const todayView =
    typeof require !== "undefined"
      ? require("./today-view.js")
      : global.HabitTodayView;

  /**
   * Renders 365-Day Mini Heatmap Grid for a specific habit
   */
  function renderMiniHeatmap(
    habit,
    logsMap,
    refDate = new Date(),
    selectedDateStr = null
  ) {
    const refDateStr = engine.toDateString(refDate);
    const startStr = engine.shiftDateString(refDateStr, -364);
    const activeSelected = selectedDateStr || refDateStr;

    let cur = startStr;
    const cells = [];

    while (cur <= refDateStr) {
      const scheduled = engine.isScheduledDate(habit, cur);
      const log = logsMap[`${habit.id}_${cur}`] || logsMap[cur];
      const prog = engine.calculateHabitProgress(habit, log);
      const isSelectedDay = cur === activeSelected;

      let level = 0;
      if (scheduled) {
        level = prog.isCompleted ? 4 : prog.ratio > 0 ? 2 : 0;
      }

      const colorClass =
        level === 4
          ? "bg-emerald-500"
          : level === 2
            ? "bg-emerald-500/40"
            : scheduled
              ? "bg-slate-200 dark:bg-slate-800"
              : "bg-slate-100 dark:bg-slate-900 opacity-40";

      const selectedRing = isSelectedDay
        ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 scale-125 z-10"
        : "hover:ring-1 hover:ring-white";

      cells.push(`
        <div
          class="mini-heatmap-cell w-2.5 h-2.5 rounded-xs ${colorClass} ${selectedRing} cursor-pointer transition select-none"
          title="${cur}: ${prog.isCompleted ? "Completed" : scheduled ? "Missed/Pending" : "Off-schedule"}"
          data-date="${cur}"
          data-habit-id="${habit.id}"
          data-action="select-detail-date"
        ></div>
      `);

      cur = engine.shiftDateString(cur, 1);
    }

    return `
      <div class="mini-heatmap-grid grid grid-rows-7 grid-flow-col gap-1 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-slate-200 dark:border-slate-800/60">
        ${cells.join("")}
      </div>
    `;
  }

  /**
   * Renders the complete Habit Detail Bottom Sheet
   */
  function renderDetailSheet(
    habit,
    store,
    containerElement,
    lang = "vi",
    selectedDateInput = null
  ) {
    if (!habit || !store) return "";
    const selectedDate = engine.toDateString(
      selectedDateInput || store.getActiveDate()
    );
    const settings = store.getSettings();

    // Calculate specific habit streak & stats
    const habitLogs = {};
    for (const key in store.state.logs) {
      const l = store.state.logs[key];
      if (l.habitId === habit.id) {
        habitLogs[l.date] = l;
      }
    }

    const streakStats = engine.calculateStreakAndConsistency(
      habit,
      habitLogs,
      settings.freezeTokens || 2,
      settings.vacationRanges || [],
      selectedDate
    );

    const miniHeatmapHtml = renderMiniHeatmap(
      habit,
      habitLogs,
      selectedDate,
      selectedDate
    );
    const colorHex = todayView.getColorHex(habit.color);

    // Current log note for selectedDate
    const curLog = habitLogs[selectedDate] || {
      value: 0,
      completed: false,
      notes: "",
    };
    const currentProg = engine.calculateHabitProgress(habit, curLog);
    const isCompleted = currentProg.isCompleted;

    // Build Direct Quick Action Section for selectedDate
    let quickActionHtml = "";
    if (habit.type === engine.HABIT_TYPES.BINARY) {
      quickActionHtml = `
        <button
          type="button"
          data-action="toggle-habit"
          data-habit-id="${habit.id}"
          class="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
            isCompleted
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
          }"
        >
          <span>${isCompleted ? "✅" : "⭕"}</span>
          <span>${isCompleted ? i18n.t("completed", {}, lang) : i18n.t("pending", {}, lang) + " — " + i18n.t("swipe_to_complete", {}, lang)}</span>
        </button>
      `;
    } else if (habit.type === engine.HABIT_TYPES.NUMERIC) {
      const step = habit.step || 1;
      const unit = habit.unit || "";
      quickActionHtml = `
        <div class="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            data-action="step-decrement"
            data-habit-id="${habit.id}"
            data-step="${step}"
            aria-label="Decrease"
            class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 border border-slate-200 dark:border-slate-700/50 cursor-pointer"
          >
            -
          </button>
          <div class="text-center">
            <span class="text-base font-bold tabular-nums font-mono ${isCompleted ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"}">${curLog.value || 0} / ${habit.targetValue}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${unit}</span>
          </div>
          <button
            type="button"
            data-action="step-increment"
            data-habit-id="${habit.id}"
            data-step="${step}"
            aria-label="Increase"
            class="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-lg active:scale-95 shadow-md cursor-pointer"
            style="background-color: ${colorHex};"
          >
            +
          </button>
        </div>
      `;
    } else if (habit.type === engine.HABIT_TYPES.TIMER) {
      const isRunning =
        typeof window !== "undefined" &&
        window.HabitApp &&
        window.HabitApp.runningTimerHabitId === habit.id;
      const durationFormatted = i18n.formatDuration(curLog.value || 0, lang);
      const targetDuration = i18n.formatDuration(habit.targetValue, lang);
      const hasProgress = (curLog.value || 0) > 0;

      quickActionHtml = `
        <div class="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2">
            ${
              hasProgress
                ? `
              <button
                type="button"
                data-action="reset-timer"
                data-habit-id="${habit.id}"
                aria-label="${i18n.t("timer_reset", {}, lang)}"
                class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-sm active:scale-95 border border-slate-200 dark:border-slate-700/50 transition cursor-pointer"
              >
                🔄
              </button>
            `
                : ""
            }
            <div>
              <span class="text-base font-mono tabular-nums font-bold ${isCompleted ? "text-emerald-500 dark:text-emerald-400" : isRunning ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}">${durationFormatted}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${targetDuration}</span>
            </div>
          </div>
          <button
            type="button"
            data-action="toggle-timer"
            data-habit-id="${habit.id}"
            data-target="${habit.targetValue}"
            aria-label="${isRunning ? i18n.t("timer_pause", {}, lang) : i18n.t("timer_start", {}, lang)}"
            class="px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 active:scale-95 shadow-md transition-all cursor-pointer ${isRunning ? "animate-pulse ring-2 ring-emerald-400/50" : ""}"
            style="background-color: ${colorHex};"
          >
            <span>${isCompleted ? "✓" : isRunning ? "⏸" : "▶"}</span>
            <span>${isCompleted ? i18n.t("completed", {}, lang) : isRunning ? i18n.t("timer_pause", {}, lang) : i18n.t("timer_start", {}, lang)}</span>
          </button>
        </div>
      `;
    }

    // Recent 14 days history logs
    const recentLogs = [];
    for (let i = 0; i < 14; i++) {
      const dStr = engine.shiftDateString(selectedDate, -i);
      const scheduled = engine.isScheduledDate(habit, dStr);
      if (scheduled) {
        const l = habitLogs[dStr] || { value: 0, completed: false, notes: "" };
        recentLogs.push({
          date: dStr,
          log: l,
          prog: engine.calculateHabitProgress(habit, l),
        });
      }
    }

    const recentLogsHtml = recentLogs
      .map(({ date, log, prog }) => {
        const isDone = prog.isCompleted;
        const noteText = log.notes || "";
        const isSel = date === selectedDate;
        return `
          <div class="p-3 ${isSel ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15" : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40"} rounded-xl border mb-2 flex flex-col gap-1 transition cursor-pointer" data-action="select-detail-date" data-date="${date}" data-habit-id="${habit.id}">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${i18n.formatDate(date, lang, "full")}${isSel ? " 📍" : ""}</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isDone ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-400"}">
                ${isDone ? i18n.t("completed", {}, lang) : i18n.t("pending", {}, lang)}
              </span>
            </div>
            ${noteText ? `<p class="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-lg mt-1 italic border border-slate-200 dark:border-slate-800/50">"${noteText}"</p>` : ""}
          </div>
        `;
      })
      .join("");

    const html = `
      <div class="sheet-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-900 dark:text-white" role="dialog" aria-modal="true" aria-labelledby="detail-sheet-title">
        <!-- Header with Edit & Archive Actions -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-2 h-10 rounded-full" style="background-color: ${colorHex};"></div>
            <span class="text-3xl">${habit.icon || "🎯"}</span>
            <div>
              <h3 id="detail-sheet-title" class="text-xl font-bold text-slate-900 dark:text-white">${habit.name}</h3>
              <span class="text-xs text-slate-500 dark:text-slate-400">${engine
                .getHabitRoutines(habit)
                .map((r) => i18n.t(`routine_${r}`, {}, lang))
                .join(
                  ", "
                )} • ${i18n.t(`type_${habit.type || "binary"}`, {}, lang)}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              data-action="edit-habit"
              data-habit-id="${habit.id}"
              class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="${i18n.t("edit_habit_shortcut", {}, lang)}"
              title="${i18n.t("edit_habit_shortcut", {}, lang)}"
            >
              ✏️
            </button>
            <button
              type="button"
              data-action="${habit.archived ? "restore-habit" : "archive-habit"}"
              data-habit-id="${habit.id}"
              class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="${i18n.t(habit.archived ? "restore_habit" : "archive_habit", {}, lang)}"
              title="${i18n.t(habit.archived ? "restore_habit" : "archive_habit", {}, lang)}"
            >
              ${habit.archived ? "📂" : "📦"}
            </button>
            <button
              type="button"
              data-action="close-detail-sheet"
              class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none px-2 py-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>

        <!-- Quick Action Card for Selected Date -->
        <div class="detail-sheet-quick-actions my-4 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/40">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${i18n.t("today_progress_label", {}, lang)}: ${i18n.formatDate(selectedDate, lang, "full")}</span>
            <span class="text-xs font-bold ${isCompleted ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500"}">${isCompleted ? "✓ " + i18n.t("completed", {}, lang) : "○ " + i18n.t("pending", {}, lang)}</span>
          </div>
          ${quickActionHtml}
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 p-3 rounded-2xl text-center">
            <span class="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">${i18n.t("current_streak", {}, lang)}</span>
            <span class="text-xl font-black tabular-nums font-mono text-amber-500 dark:text-amber-400 mt-1 block">🔥 ${streakStats.currentStreak}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 p-3 rounded-2xl text-center">
            <span class="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">${i18n.t("best_streak", {}, lang)}</span>
            <span class="text-xl font-black tabular-nums font-mono text-slate-900 dark:text-white mt-1 block">🏆 ${streakStats.bestStreak}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 p-3 rounded-2xl text-center">
            <span class="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">${i18n.t("consistency_score", {}, lang)}</span>
            <span class="text-xl font-black tabular-nums font-mono text-emerald-500 dark:text-emerald-400 mt-1 block">${streakStats.consistencyScore30d}%</span>
          </div>
        </div>

        <!-- 365-Day Mini Heatmap (Clickable) -->
        <div class="mb-5">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${i18n.t("mini_heatmap_365", {}, lang)}</h4>
            <span class="text-[10px] text-slate-400">${i18n.formatDate(selectedDate, lang, "full")}</span>
          </div>
          ${miniHeatmapHtml}
        </div>

        <!-- Micro-Journal Reflection Notes Editor -->
        <div class="mb-5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/40">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <span>📝</span> ${i18n.t("checkin_notes", {}, lang)} (${i18n.formatDate(selectedDate, lang, "full")})
          </h4>
          <form id="habit-note-form" data-habit-id="${habit.id}" data-date="${selectedDate}">
            <textarea
              id="habit-note-input"
              rows="2"
              placeholder="${i18n.t("add_note_placeholder", {}, lang)}"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
            >${curLog.notes || ""}</textarea>
            <div class="flex items-center justify-end gap-2">
              <button type="submit" class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer active:scale-95">
                ${i18n.t("save_note", {}, lang)}
              </button>
            </div>
          </form>
        </div>

        <!-- Recent Check-In History -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">${i18n.t("checkin_logs", {}, lang)}</h4>
          <div class="max-h-48 overflow-y-auto pr-1">
            ${recentLogsHtml}
          </div>
        </div>
      </div>
    `;

    if (containerElement) {
      containerElement.innerHTML = html;
    }

    return html;
  }

  const detailExports = {
    renderMiniHeatmap,
    renderDetailSheet,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = detailExports;
  } else {
    global.HabitDetailSheet = detailExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
