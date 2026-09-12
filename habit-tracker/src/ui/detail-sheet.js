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
  function renderMiniHeatmap(habit, logsMap, refDate = new Date()) {
    const refDateStr = engine.toDateString(refDate);
    const startStr = engine.shiftDateString(refDateStr, -364);

    let cur = startStr;
    const cells = [];

    while (cur <= refDateStr) {
      const scheduled = engine.isScheduledDate(habit, cur);
      const log = logsMap[`${habit.id}_${cur}`] || logsMap[cur];
      const prog = engine.calculateHabitProgress(habit, log);

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
              ? "bg-slate-800"
              : "bg-slate-900 opacity-40";

      cells.push(`
        <div
          class="w-2.5 h-2.5 rounded-xs ${colorClass} cursor-pointer hover:ring-1 hover:ring-white transition"
          title="${cur}: ${prog.isCompleted ? "Completed" : scheduled ? "Missed/Pending" : "Off-schedule"}"
          data-date="${cur}"
        ></div>
      `);

      cur = engine.shiftDateString(cur, 1);
    }

    return `
      <div class="mini-heatmap-grid grid grid-rows-7 grid-flow-col gap-1 p-2 bg-slate-950/60 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-slate-800/60">
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

    const miniHeatmapHtml = renderMiniHeatmap(habit, habitLogs, selectedDate);
    const colorHex = todayView.getColorHex(habit.color);

    // Current log note for selectedDate
    const curLog = habitLogs[selectedDate] || {
      value: 0,
      completed: false,
      notes: "",
    };

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
        return `
          <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/40 mb-2 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">${i18n.formatDate(date, lang, "full")}</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-700 text-slate-400"}">
                ${isDone ? i18n.t("completed", {}, lang) : i18n.t("pending", {}, lang)}
              </span>
            </div>
            ${noteText ? `<p class="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg mt-1 italic">"${noteText}"</p>` : ""}
          </div>
        `;
      })
      .join("");

    const html = `
      <div id="habit-detail-sheet-backdrop" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4 transition-opacity">
        <div class="sheet-card bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-white">
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-2 h-10 rounded-full" style="background-color: ${colorHex};"></div>
              <span class="text-3xl">${habit.icon || "🎯"}</span>
              <div>
                <h3 class="text-xl font-bold">${habit.name}</h3>
                <span class="text-xs text-slate-400">${i18n.t(`routine_${habit.routine || "anytime"}`, {}, lang)} • ${i18n.t(`type_${habit.type || "binary"}`, {}, lang)}</span>
              </div>
            </div>
            <button type="button" data-action="close-detail-sheet" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-2 my-4">
            <div class="bg-slate-800/60 border border-slate-700/40 p-3 rounded-2xl text-center">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 block">${i18n.t("current_streak", {}, lang)}</span>
              <span class="text-xl font-black text-amber-400 mt-1 block">🔥 ${streakStats.currentStreak}</span>
            </div>
            <div class="bg-slate-800/60 border border-slate-700/40 p-3 rounded-2xl text-center">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 block">${i18n.t("best_streak", {}, lang)}</span>
              <span class="text-xl font-black text-white mt-1 block">🏆 ${streakStats.bestStreak}</span>
            </div>
            <div class="bg-slate-800/60 border border-slate-700/40 p-3 rounded-2xl text-center">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 block">${i18n.t("consistency_score", {}, lang)}</span>
              <span class="text-xl font-black text-emerald-400 mt-1 block">${streakStats.consistencyScore30d}%</span>
            </div>
          </div>

          <!-- 365-Day Mini Heatmap -->
          <div class="mb-5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">${i18n.t("mini_heatmap_365", {}, lang)}</h4>
            ${miniHeatmapHtml}
          </div>

          <!-- Micro-Journal Reflection Notes Editor -->
          <div class="mb-5 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <span>📝</span> ${i18n.t("checkin_notes", {}, lang)} (${i18n.formatDate(selectedDate, lang, "full")})
            </h4>
            <form id="habit-note-form" data-habit-id="${habit.id}" data-date="${selectedDate}">
              <textarea
                id="habit-note-input"
                rows="2"
                placeholder="${i18n.t("add_note_placeholder", {}, lang)}"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
              >${curLog.notes || ""}</textarea>
              <div class="flex items-center justify-end gap-2">
                <button type="submit" class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm">
                  ${i18n.t("save_note", {}, lang)}
                </button>
              </div>
            </form>
          </div>

          <!-- Recent Check-In History -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">${i18n.t("checkin_logs", {}, lang)}</h4>
            <div class="max-h-48 overflow-y-auto pr-1">
              ${recentLogsHtml}
            </div>
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
