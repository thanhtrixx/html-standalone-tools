/**
 * Atomic Habit Tracker Timeline & Routines Lens View
 *
 * Implements circadian time-block streams:
 * - Morning (05:00 - 12:00) 🌅
 * - Afternoon (12:00 - 17:00) ☀️
 * - Evening (17:00 - 23:00) 🌙
 * - Bedtime & Flexible (23:00+) 🌌
 *
 * Features:
 * - Visual vertical time connectors and routine anchor cues
 * - Routine-level completion metrics and synchronized progress
 * - Interactive multi-modal habit cards with 1-tap checks
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
   * Renders a circadian time-block node in the timeline
   */
  function renderTimelineBlock(
    routineKey,
    store,
    selectedDate,
    lang = "vi",
    isLast = false
  ) {
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

    const meta = {
      morning: {
        icon: "🌅",
        color: "amber",
        hex: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.2)",
      },
      afternoon: {
        icon: "☀️",
        color: "cyan",
        hex: "#06b6d4",
        glow: "rgba(6, 182, 212, 0.2)",
      },
      evening: {
        icon: "🌙",
        color: "violet",
        hex: "#8b5cf6",
        glow: "rgba(139, 92, 246, 0.2)",
      },
      anytime: {
        icon: "🔄",
        color: "emerald",
        hex: "#10b981",
        glow: "rgba(16, 185, 129, 0.2)",
      },
    }[routineKey] || {
      icon: "🎯",
      color: "emerald",
      hex: "#10b981",
      glow: "rgba(16, 185, 129, 0.2)",
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
        return todayView.renderHabitCard(h, log, lang);
      })
      .join("");

    const isAllDone =
      routineProg.total > 0 && routineProg.completed === routineProg.total;

    return `
      <div class="timeline-block relative pl-7 pb-8" data-routine="${routineKey}">
        <!-- Vertical connector line -->
        ${
          !isLast
            ? `<div class="absolute left-3 top-7 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 dark:from-slate-700 to-slate-200 dark:to-slate-800"></div>`
            : ""
        }

        <!-- Timeline Node Icon / Circle -->
        <div
          class="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-slate-50 dark:ring-slate-950 transition-all ${
            isAllDone
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }"
          style="${isAllDone ? `background-color: ${meta.hex};` : ""}"
        >
          ${isAllDone ? "✓" : meta.icon}
        </div>

        <!-- Routine Header & Adherence Counter -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-black text-slate-900 dark:text-white text-base leading-tight flex items-center gap-2">
              <span>${routineTitle}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium font-mono">${routineTime}</span>
            </h3>
          </div>
          <span class="text-xs font-mono font-bold tabular-nums px-2.5 py-0.5 rounded-full ${
            isAllDone
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"
          }">
            ${routineProg.completed}/${routineProg.total} ${i18n.t("done", {}, lang)}
          </span>
        </div>

        <!-- Cards stream -->
        <div class="routine-cards space-y-2">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders the complete Timeline & Routines View
   */
  function renderTimelineView(store, containerElement, lang = "vi") {
    if (!store) return "";
    const selectedDate = store.getActiveDate();
    const habits = store.getHabits();
    const dailyState = store.getDailyState(selectedDate);
    const dailyProgress = dailyState.dailyProgress;

    const ribbonHtml = todayView.renderDateRibbon(selectedDate, store, lang);

    const routineKeys = [
      engine.ROUTINES.MORNING,
      engine.ROUTINES.AFTERNOON,
      engine.ROUTINES.EVENING,
      engine.ROUTINES.ANYTIME,
    ];

    const blocksHtml = routineKeys
      .map((r, idx) =>
        renderTimelineBlock(
          r,
          store,
          selectedDate,
          lang,
          idx === routineKeys.length - 1
        )
      )
      .join("");

    const hasHabits = habits.length > 0;
    const emptyStateHtml = !hasHabits
      ? `
        <div class="text-center py-16 px-4">
          <div class="text-5xl mb-3">⏳</div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">${i18n.t("no_habits_scheduled_today", {}, lang)}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">${i18n.t("app_tagline", {}, lang)}</p>
          <button
            type="button"
            data-action="open-add-habit"
            class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            + ${i18n.t("add_first_habit", {}, lang)}
          </button>
        </div>
      `
      : "";

    const html = `
      <div class="timeline-view max-w-lg mx-auto pb-24">
        <!-- Timeline Header -->
        <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 mb-5 border border-slate-200 dark:border-slate-800/80 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">${i18n.formatDate(selectedDate, lang, "full")}</span>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">${i18n.t("lens_timeline", {}, lang)}</h2>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black font-mono tabular-nums text-emerald-500 dark:text-emerald-400">${dailyProgress.percentage}%</span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 block">${dailyProgress.completed}/${dailyProgress.total} ${i18n.t("done", {}, lang)}</span>
            </div>
          </div>

          <!-- Date Ribbon -->
          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
            ${ribbonHtml}
          </div>
        </div>

        <!-- Circadian Timeline Stream -->
        <div class="timeline-stream px-2">
          ${blocksHtml}
          ${emptyStateHtml}
        </div>
      </div>
    `;

    if (containerElement) {
      containerElement.innerHTML = html;
    }

    return html;
  }

  const timelineExports = {
    renderTimelineBlock,
    renderTimelineView,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = timelineExports;
  } else {
    global.HabitTimelineView = timelineExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
