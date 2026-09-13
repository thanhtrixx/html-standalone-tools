/**
 * Atomic Habit Tracker Matrix & Analytics Lens View
 *
 * Implements:
 * - 52-Week GitHub-style Calendar Activity Matrix (Heatmap)
 * - Momentum & Streak Milestone Statistics
 * - 0-Baseline Day-of-Week Adherence Chart
 * - Circadian Routine Cluster Consistency Breakdown
 * - Streak Milestones Grid (7d, 21d, 30d, 66d, 100d, 365d)
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
   * Renders 52-Week Contribution Heatmap Grid HTML
   */
  function renderYearlyHeatmapGrid(cells = [], lang = "vi") {
    const levelColors = [
      "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/30",
      "bg-emerald-950 border-emerald-800 text-emerald-300",
      "bg-emerald-700 border-emerald-600 text-white",
      "bg-emerald-500 border-emerald-400 text-white",
      "bg-emerald-400 border-emerald-300 text-slate-900",
    ];

    const cellsHtml = cells
      .map((cell) => {
        const colorClass = levelColors[cell.level] || levelColors[0];
        const dateFormatted = i18n.formatDate(cell.date, lang, "full");
        const tooltipText = `${dateFormatted}: ${cell.completionRate}% (${cell.completedCount}/${cell.scheduledCount} ${i18n.t("completed", {}, lang)})`;

        return `
          <div
            class="heatmap-cell w-3 h-3 rounded-xs border transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10 ${colorClass}"
            data-action="view-heatmap-date"
            data-date="${cell.date}"
            data-rate="${cell.completionRate}"
            data-completed="${cell.completedCount}"
            data-scheduled="${cell.scheduledCount}"
            title="${tooltipText}"
            role="button"
            tabindex="0"
            aria-label="${dateFormatted}"
          ></div>
        `;
      })
      .join("");

    return `
      <div class="heatmap-container bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 mb-5 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("yearly_heatmap_title", {}, lang)}</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("heatmap_subtitle", {}, lang) || (lang === 'vi' ? 'Lưới hoạt động 52 tuần qua' : '52-week activity contribution grid')}</p>
          </div>
          <!-- Legend -->
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span>${i18n.t("heatmap_less", {}, lang)}</span>
            <span class="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-950 border border-emerald-800"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-700 border border-emerald-600"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 border border-emerald-400"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-300"></span>
            <span>${i18n.t("heatmap_more", {}, lang)}</span>
          </div>
        </div>

        <div class="overflow-x-auto pb-2 no-scrollbar">
          <div class="grid grid-rows-7 grid-flow-col gap-1 w-max">
            ${cellsHtml}
          </div>
        </div>

        <div id="heatmap-cell-popover" class="hidden mt-3 p-3 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200"></div>
      </div>
    `;
  }

  /**
   * Renders Day of Week Consistency Chart with 0-baseline support
   */
  function renderWeekdayChart(weekdayStats = [], lang = "vi") {
    const dayNames = [
      i18n.t("day_sun", {}, lang),
      i18n.t("day_mon", {}, lang),
      i18n.t("day_tue", {}, lang),
      i18n.t("day_wed", {}, lang),
      i18n.t("day_thu", {}, lang),
      i18n.t("day_fri", {}, lang),
      i18n.t("day_sat", {}, lang),
    ];

    const barsHtml = weekdayStats
      .map((stat, idx) => {
        const rate = stat.rate || 0;
        const name = dayNames[stat.dayOfWeek] || dayNames[idx];
        const isScheduled = stat.scheduled > 0;

        return `
          <div class="flex-1 flex flex-col items-center gap-2">
            <span class="text-[11px] font-bold tabular-nums font-mono ${rate > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}">${rate}%</span>
            <div class="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-24 flex items-end p-0.5 border border-slate-200 dark:border-slate-700/40">
              <div class="w-full ${rate >= 80 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-emerald-500'} rounded-full transition-all duration-500 shadow-sm" style="height: ${rate}%;"></div>
            </div>
            <span class="text-xs font-semibold ${isScheduled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}">${name}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 mb-5 shadow-xl">
        <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight mb-4">${i18n.t("weekday_adherence_title", {}, lang)}</h3>
        <div class="flex items-end justify-between gap-2 h-36 pt-2">
          ${barsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders Routine Cluster Adherence Breakdown
   */
  function renderRoutineAdherence(routineStats = [], lang = "vi") {
    const meta = {
      morning: { icon: "🌅", color: "amber", hex: "#f59e0b" },
      afternoon: { icon: "☀️", color: "cyan", hex: "#06b6d4" },
      evening: { icon: "🌙", color: "violet", hex: "#8b5cf6" },
      anytime: { icon: "🔄", color: "emerald", hex: "#10b981" },
    };

    const cardsHtml = routineStats
      .map((stat) => {
        const rTitle = i18n.t(`routine_${stat.routine}`, {}, lang);
        const rMeta = meta[stat.routine] || { icon: "🎯", hex: "#10b981" };
        const ringHtml = components.renderSvgProgressRing(
          20,
          3.5,
          stat.rate,
          rMeta.hex
        );

        return `
          <div class="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${rMeta.icon}</span>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">${rTitle}</h4>
                <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">${stat.completed}/${stat.scheduled} ${i18n.t("completed", {}, lang)}</span>
              </div>
            </div>

            <div class="relative flex items-center justify-center">
              ${ringHtml}
              <span class="absolute text-[11px] font-bold tabular-nums font-mono text-slate-900 dark:text-white">${stat.rate}%</span>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 mb-5 shadow-xl">
        <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight mb-4">${i18n.t("routine_adherence_title", {}, lang)}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders Milestone Badges Grid
   */
  function renderMilestoneBadges(badges = [], lang = "vi") {
    const badgesHtml = badges
      .map((b) => {
        const title = i18n.t(b.titleKey, {}, lang);
        const isUnlocked = b.unlocked;

        const cardStyle = isUnlocked
          ? "bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-transparent border-amber-500/40 text-amber-600 dark:text-amber-300 shadow-md shadow-amber-500/10"
          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 opacity-60 text-slate-500 dark:text-slate-400";

        const badgeIcon = isUnlocked ? b.icon : "🔒";
        const progPercent = Math.round(b.progress * 100);

        return `
          <div class="milestone-badge p-4 rounded-2xl border ${cardStyle} flex flex-col items-center text-center transition-all">
            <span class="text-3xl mb-1.5">${badgeIcon}</span>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white mb-1">${title}</h4>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">${b.threshold} ${i18n.t("streak_days_count", { count: b.threshold }, lang)}</span>
            <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div class="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full" style="width: ${progPercent}%;"></div>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 mb-5 shadow-xl">
        <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight mb-4">${i18n.t("milestones_title", {}, lang)}</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${badgesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders the complete Matrix & Analytics View
   */
  function renderMatrixView(store, containerElement, lang = "vi") {
    if (!store) return "";
    const habits = store.getHabits(true);
    const logs = store.state.logs;
    const settings = store.getSettings();
    const activeDate = store.getActiveDate();

    // 1. Overall stats
    let totalAllCompletions = 0;
    let maxBestStreak = 0;
    for (const h of habits) {
      const hLogs = {};
      for (const k in logs) {
        if (logs[k].habitId === h.id) hLogs[logs[k].date] = logs[k];
      }
      const st = engine.calculateStreakAndConsistency(
        h,
        hLogs,
        settings.freezeTokens || 2,
        settings.vacationRanges || [],
        activeDate
      );
      if (st.bestStreak > maxBestStreak) maxBestStreak = st.bestStreak;
      totalAllCompletions += st.totalCompletions;
    }

    const overallStreak = engine.calculateStreakAndConsistency(
      habits[0] || { scheduleType: "daily" },
      logs,
      settings.freezeTokens || 2,
      settings.vacationRanges || [],
      activeDate
    );

    // 2. Heatmap data
    const heatmapCells = engine.computeHeatmapData(
      habits,
      logs,
      null,
      activeDate
    );
    const perfectDaysCount = heatmapCells.filter((c) => c.level === 4).length;

    // 3. Weekday & Routine adherence
    const weekdayStats = engine.calculateWeekdayAdherence(
      habits,
      logs,
      90,
      activeDate
    );
    const routineStats = engine.calculateRoutineAdherence(
      habits,
      logs,
      30,
      activeDate
    );

    // 4. Milestone badges
    const milestoneBadges = engine.evaluateMilestoneBadges(
      maxBestStreak,
      totalAllCompletions
    );

    // Render sub-components
    const heatmapHtml = renderYearlyHeatmapGrid(heatmapCells, lang);
    const weekdayHtml = renderWeekdayChart(weekdayStats, lang);
    const routineHtml = renderRoutineAdherence(routineStats, lang);
    const milestonesHtml = renderMilestoneBadges(milestoneBadges, lang);

    const html = `
      <div class="matrix-view insights-view max-w-lg mx-auto pb-24">
        <!-- Lens Header -->
        <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 mb-5 border border-slate-200 dark:border-slate-800/80 shadow-md">
          <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">${i18n.t("app_title", {}, lang)}</span>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">${i18n.t("lens_matrix", {}, lang)}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${i18n.t("app_tagline", {}, lang)}</p>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("best_streak", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-amber-500 dark:text-amber-400 mt-1 block">🏆 ${maxBestStreak}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">${i18n.t("streak_days_count", { count: maxBestStreak }, lang)}</span>
          </div>

          <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("consistency_score", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-emerald-500 dark:text-emerald-400 mt-1 block">${overallStreak.consistencyScore30d}%</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">90d: ${overallStreak.consistencyScore90d}%</span>
          </div>

          <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("total_completions", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">${totalAllCompletions}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">${i18n.t("done", {}, lang)}</span>
          </div>

          <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("perfect_days", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-violet-600 dark:text-violet-400 mt-1 block">🌟 ${perfectDaysCount}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">100% ${i18n.t("daily_progress", {}, lang)}</span>
          </div>
        </div>

        <!-- 52-Week Heatmap -->
        ${heatmapHtml}

        <!-- Weekday & Routine Trends -->
        ${weekdayHtml}
        ${routineHtml}

        <!-- Milestone Badges -->
        ${milestonesHtml}
      </div>
    `;

    if (containerElement) {
      containerElement.innerHTML = html;
    }

    return html;
  }

  const matrixExports = {
    renderYearlyHeatmapGrid,
    renderWeekdayChart,
    renderRoutineAdherence,
    renderMilestoneBadges,
    renderMatrixView,
    renderInsightsView: renderMatrixView,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = matrixExports;
  } else {
    global.HabitMatrixView = matrixExports;
    global.HabitInsightsView = matrixExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
