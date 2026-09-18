/**
 * Atomic Habit Tracker Insights & Analytics Dashboard
 *
 * Implements:
 * - 52-Week GitHub-style Calendar Contribution Heatmap Grid
 * - Core Metric Summary Stat Cards (Best Streak, 30d/90d Consistency %, Perfect Days)
 * - Day-of-Week Consistency Chart (Monday - Sunday breakdown)
 * - Routine Cluster Adherence Breakdown
 * - Streak Milestone Badges Grid (7d, 21d, 30d, 66d, 100d, 365d)
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
   * Renders Life Domain Hub Cards (Health, Mind, Craft, Discipline)
   */
  function renderLifeDomainsSection(habits = [], logs = {}, lang = "vi") {
    const domainKeys = ["health", "mind", "craft", "discipline"];
    const domainMeta = {
      health: {
        titleKey: "domain_health",
        icon: "🌿",
        color: "emerald",
        hex: "#10b981",
        glow: "rgba(16, 185, 129, 0.25)",
      },
      mind: {
        titleKey: "domain_mind",
        icon: "🧠",
        color: "violet",
        hex: "#8b5cf6",
        glow: "rgba(139, 92, 246, 0.25)",
      },
      craft: {
        titleKey: "domain_craft",
        icon: "💻",
        color: "cyan",
        hex: "#06b6d4",
        glow: "rgba(6, 182, 212, 0.25)",
      },
      discipline: {
        titleKey: "domain_discipline",
        icon: "⚡",
        color: "amber",
        hex: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.25)",
      },
    };

    const cardsHtml = domainKeys
      .map((dKey) => {
        const meta = domainMeta[dKey];
        const domainHabits = habits.filter(
          (h) => (h.domain || "health") === dKey && !h.archived
        );
        const title = i18n.t(meta.titleKey, {}, lang);

        let totalCompletions = 0;
        let totalScheduled = 0;
        domainHabits.forEach((h) => {
          for (const k in logs) {
            if (logs[k].habitId === h.id) {
              totalScheduled++;
              if (logs[k].completed) totalCompletions++;
            }
          }
        });

        const rate =
          totalScheduled > 0
            ? Math.round((totalCompletions / totalScheduled) * 100)
            : 0;

        const ringHtml = components.renderSvgProgressRing(
          22,
          3.5,
          rate,
          meta.hex
        );

        const countText =
          domainHabits.length === 1
            ? i18n.t("domain_habits_count_singular", { count: 1 }, lang)
            : i18n.t(
                "domain_habits_count",
                { count: domainHabits.length },
                lang
              );

        return `
          <div class="life-domain-card domain-card bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between transition-all hover:border-emerald-500/40" style="box-shadow: 0 4px 20px -2px ${meta.glow};">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                ${meta.icon}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-base leading-snug">${title}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${countText}</span>
                  <span class="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">${rate}%</span>
                </div>
              </div>
            </div>
            <div class="shrink-0 flex items-center justify-center">
              ${ringHtml}
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="life-domains-section mb-6">
        <div class="mb-3 px-1 flex items-center justify-between">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("identity_pillars_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("identity_pillars_subtitle", {}, lang)}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders 52-Week Contribution Heatmap Grid HTML
   */
  function renderYearlyHeatmapGrid(cells = [], lang = "vi", timeframe = "52w") {
    const levelColors = [
      "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/30",
      "bg-emerald-950 border-emerald-800 text-emerald-300",
      "bg-emerald-700 border-emerald-600 text-white",
      "bg-emerald-500 border-emerald-400 text-white",
      "bg-emerald-400 border-emerald-300 text-emerald-950 font-bold",
    ];

    let filteredCells = cells;
    if (timeframe === "30d") {
      filteredCells = cells.slice(-30);
    } else if (timeframe === "90d") {
      filteredCells = cells.slice(-90);
    } else {
      filteredCells = cells.slice(-365);
    }

    const cellsHtml = filteredCells
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

    const dayLabels = [
      lang === "vi" ? "T2" : "Mon",
      lang === "vi" ? "T4" : "Wed",
      lang === "vi" ? "T6" : "Fri",
    ];

    // Dynamic localized month headers aligned with week columns
    const numCols = Math.ceil(filteredCells.length / 7);
    const monthHeaders = [];
    let lastMonth = null;
    let lastColIdx = -999;

    for (let c = 0; c < numCols; c++) {
      const cellIndex = c * 7;
      if (cellIndex < filteredCells.length) {
        const cell = filteredCells[cellIndex];
        const cellDate = new Date(cell.date + "T00:00:00");
        const monthNum = cellDate.getMonth();
        if (monthNum !== lastMonth) {
          if (c - lastColIdx >= 3 || lastMonth === null) {
            const label =
              lang === "vi"
                ? `Thg ${monthNum + 1}`
                : cellDate.toLocaleDateString("en-US", { month: "short" });
            monthHeaders.push({ colIdx: c, label });
            lastMonth = monthNum;
            lastColIdx = c;
          }
        }
      }
    }

    const monthHeaderHtml = `
      <div class="relative h-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1 select-none pointer-events-none" style="width: ${Math.max(0, numCols * 16 - 4)}px;">
        ${monthHeaders
          .map(
            (mh) =>
              `<span class="absolute top-0 whitespace-nowrap" style="left: ${mh.colIdx * 16}px;">${mh.label}</span>`
          )
          .join("")}
      </div>
    `;

    return `
      <div class="heatmap-container bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-6 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">${i18n.t("yearly_heatmap_title", {}, lang)}</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("heatmap_subtitle", {}, lang)}</p>
          </div>
          <!-- Legend -->
          <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>${i18n.t("heatmap_less", {}, lang)}</span>
            <span class="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-950 border border-emerald-800"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-700 border border-emerald-600"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 border border-emerald-400"></span>
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-300"></span>
            <span>${i18n.t("heatmap_more", {}, lang)}</span>
          </div>
        </div>

        <!-- Timeframe Lens Selector -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-3.5 max-w-xs mx-auto" id="heatmap-timeframe-picker">
          ${[
            { id: "30d", key: "timeframe_30d" },
            { id: "90d", key: "timeframe_90d" },
            { id: "52w", key: "timeframe_52w" },
          ]
            .map(
              (tf) => `
            <button
              type="button"
              data-action="switch-heatmap-timeframe"
              data-timeframe="${tf.id}"
              class="flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all ${
                timeframe === tf.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }"
            >
              ${i18n.t(tf.key, {}, lang)}
            </button>
          `
            )
            .join("")}
        </div>

        <div class="flex items-start gap-2">
          <!-- Weekday Labels Column -->
          <div class="grid grid-rows-7 gap-1 pt-5 text-[9px] font-semibold text-slate-400 dark:text-slate-500 select-none shrink-0 h-33">
            <span class="leading-none"></span>
            <span class="leading-none">${dayLabels[0]}</span>
            <span class="leading-none"></span>
            <span class="leading-none">${dayLabels[1]}</span>
            <span class="leading-none"></span>
            <span class="leading-none">${dayLabels[2]}</span>
            <span class="leading-none"></span>
          </div>

          <!-- Heatmap Cells Grid with Touch Isolation & Synchronized Month Headers -->
          <div id="insights-heatmap-scroll" class="overflow-x-auto pb-2 no-scrollbar flex-1" style="overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; touch-action: pan-x;">
            <div class="w-max">
              ${monthHeaderHtml}
              <div class="grid grid-rows-7 grid-flow-col gap-1">
                ${cellsHtml}
              </div>
            </div>
          </div>
        </div>

        <div id="heatmap-cell-popover" class="hidden mt-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200"></div>
      </div>
    `;
  }

  /**
   * Renders Day of Week Consistency Chart
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
        const hasScheduled = stat.scheduled > 0;
        const name = dayNames[stat.dayOfWeek] || dayNames[idx];
        const displayLabel = hasScheduled ? `${rate}%` : "--";
        const barHeight = hasScheduled ? rate : 0;
        const barColor = hasScheduled ? "bg-emerald-500" : "bg-transparent";

        return `
          <div class="flex-1 flex flex-col items-center gap-2">
            <span class="text-[11px] font-bold tabular-nums font-mono ${hasScheduled ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"}">${displayLabel}</span>
            <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-24 flex items-end p-0.5">
              <div class="w-full ${barColor} rounded-full transition-all duration-500" style="height: ${barHeight}%;"></div>
            </div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${name}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-6 shadow-xl">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4">${i18n.t("weekday_adherence_title", {}, lang)}</h3>
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
    const icons = {
      morning: "🌅",
      afternoon: "☀️",
      evening: "🌙",
      anytime: "🔄",
    };

    const cardsHtml = routineStats
      .map((stat) => {
        const rTitle = i18n.t(`routine_${stat.routine}`, {}, lang);
        const icon = icons[stat.routine] || "🎯";
        const ringHtml = components.renderSvgProgressRing(
          20,
          3.5,
          stat.rate,
          "#10b981"
        );

        return `
          <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${icon}</span>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">${rTitle}</h4>
                <span class="text-xs text-slate-500 dark:text-slate-400">${stat.completed}/${stat.scheduled} ${i18n.t("completed", {}, lang)}</span>
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
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-6 shadow-xl">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4">${i18n.t("routine_adherence_title", {}, lang)}</h3>
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
          ? "bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border-amber-500/40 text-amber-600 dark:text-amber-300"
          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 opacity-60 text-slate-500 dark:text-slate-400";

        const badgeIcon = isUnlocked ? b.icon : "🔒";
        const progPercent = Math.round(b.progress * 100);

        return `
          <div class="milestone-badge p-4 rounded-2xl border ${cardStyle} flex flex-col items-center text-center">
            <span class="text-3xl mb-1.5">${badgeIcon}</span>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white mb-1">${title}</h4>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">${b.threshold} ${i18n.t("streak_days_count", { count: b.threshold }, lang)}</span>
            <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div class="bg-amber-400 h-full rounded-full" style="width: ${progPercent}%;"></div>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-6 shadow-xl">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4">${i18n.t("milestones_title", {}, lang)}</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${badgesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders the complete Insights & Analytics View
   */
  function renderInsightsView(
    store,
    containerElement,
    lang = "vi",
    timeframe = "52w"
  ) {
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

    const consistencyScore30d = engine.calculateOverallConsistencyScore
      ? engine.calculateOverallConsistencyScore(
          habits,
          logs,
          30,
          activeDate,
          settings.vacationRanges || []
        )
      : 0;

    const consistencyScore90d = engine.calculateOverallConsistencyScore
      ? engine.calculateOverallConsistencyScore(
          habits,
          logs,
          90,
          activeDate,
          settings.vacationRanges || []
        )
      : 0;

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

    // 5. Life Domains & Identity Pillars
    const domainsHtml = renderLifeDomainsSection(habits, logs, lang);

    // Render components
    const heatmapHtml = renderYearlyHeatmapGrid(heatmapCells, lang, timeframe);
    const weekdayHtml = renderWeekdayChart(weekdayStats, lang);
    const routineHtml = renderRoutineAdherence(routineStats, lang);
    const milestonesHtml = renderMilestoneBadges(milestoneBadges, lang);

    const html = `
      <div class="insights-view max-w-lg mx-auto pb-24">
        <div class="mb-6 px-1">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white">${i18n.t("insights_tab", {}, lang)}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">${i18n.t("app_tagline", {}, lang)}</p>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("best_streak", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-amber-500 dark:text-amber-400 mt-1 block">🏆 ${maxBestStreak}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">${i18n.t("streak_days_count", { count: maxBestStreak }, lang)}</span>
          </div>

          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("consistency_score", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-emerald-500 dark:text-emerald-400 mt-1 block">${consistencyScore30d}%</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">90d: ${consistencyScore90d}%</span>
          </div>

          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("total_completions", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">${totalAllCompletions}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">${i18n.t("done", {}, lang)}</span>
          </div>

          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-4 shadow-xl">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">${i18n.t("perfect_days", {}, lang)}</span>
            <span class="text-3xl font-black tabular-nums font-mono text-amber-500 dark:text-amber-400 mt-1 block">🌟 ${perfectDaysCount}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">100% ${i18n.t("daily_progress", {}, lang)}</span>
          </div>
        </div>

        <!-- Identity Pillars & Life Domains Balance -->
        ${domainsHtml}

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

  const insightsExports = {
    renderLifeDomainsSection,
    renderYearlyHeatmapGrid,
    renderWeekdayChart,
    renderRoutineAdherence,
    renderMilestoneBadges,
    renderInsightsView,
  };

  global.HabitInsightsView = insightsExports;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = insightsExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
