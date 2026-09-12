/**
 * Atomic Habit Tracker Habit Catalog & Routine Manager
 *
 * Implements:
 * - Habit Catalog List grouped by Routine
 * - Habit Reordering (Up/Down order controls)
 * - Add/Edit Habit Modal with live preview, color themes, emoji picker, schedule builder
 * - Archive & Restore management
 * - Delete Habit with confirmation
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
   * Renders the Add / Edit Habit Modal HTML
   */
  function renderHabitEditModal(habit = null, lang = "vi") {
    const isEdit = !!(habit && habit.id);
    const modalTitle = isEdit
      ? i18n.t("edit_habit", {}, lang)
      : i18n.t("add_habit", {}, lang);

    const habitId = habit ? habit.id : "";
    const name = habit ? habit.name : "";
    const type = habit ? habit.type || "binary" : "binary";
    const targetValue = habit ? habit.targetValue || 1 : 1;
    const unit = habit ? habit.unit || "" : "";
    const step = habit ? habit.step || 1 : 1;
    const assignedRoutines = habit
      ? engine.getHabitRoutines(habit)
      : ["morning"];
    const routine = assignedRoutines[0] || "morning";
    const scheduleType = habit ? habit.scheduleType || "daily" : "daily";
    const scheduleDays = habit
      ? habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6]
      : [0, 1, 2, 3, 4, 5, 6];
    const intervalDays = habit ? habit.intervalDays || 1 : 1;
    const color = habit ? habit.color || "emerald" : "emerald";
    const icon = habit ? habit.icon || "🎯" : "🎯";
    const reminderTime = habit ? habit.reminderTime || "" : "";

    const colorPillsHtml = engine.HABIT_COLORS.map((c) => {
      const isSelected = c.id === color;
      return `
        <label class="cursor-pointer">
          <input type="radio" name="modal-color" value="${c.id}" class="sr-only" ${isSelected ? "checked" : ""}>
          <div class="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : ""}" style="background-color: ${c.hex};">
            ${isSelected ? "✓" : ""}
          </div>
        </label>
      `;
    }).join("");

    const dayLabels = [
      { day: 1, key: "day_mon" },
      { day: 2, key: "day_tue" },
      { day: 3, key: "day_wed" },
      { day: 4, key: "day_thu" },
      { day: 5, key: "day_fri" },
      { day: 6, key: "day_sat" },
      { day: 0, key: "day_sun" },
    ];

    const specificDaysHtml = dayLabels
      .map((d) => {
        const isChecked = scheduleDays.includes(d.day);
        return `
        <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
          <input type="checkbox" name="modal-schedule-day" value="${d.day}" class="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500" ${isChecked ? "checked" : ""}>
          <span>${i18n.t(d.key, {}, lang)}</span>
        </label>
      `;
      })
      .join("");

    const presetEmojis = [
      "🏃",
      "💧",
      "📖",
      "🧘",
      "💻",
      "🥗",
      "💊",
      "✍️",
      "🏋️",
      "😴",
      "🎯",
      "🚶",
      "🍎",
      "🌿",
      "🧠",
      "🎨",
    ];

    const presetEmojisHtml = presetEmojis
      .map((e) => {
        const isSelected = icon === e;
        return `
          <button
            type="button"
            data-action="select-emoji"
            data-emoji="${e}"
            aria-label="${e}"
            class="emoji-preset-btn w-9 h-9 flex items-center justify-center text-lg rounded-xl transition duration-150 hover:scale-110 active:scale-95 ${
              isSelected
                ? "bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700"
            }"
          >
            ${e}
          </button>
        `;
      })
      .join("");

    return `
      <div class="modal-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-900 dark:text-white" role="dialog" aria-modal="true" aria-labelledby="habit-modal-title">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <h3 id="habit-modal-title" class="text-xl font-bold">${modalTitle}</h3>
          <button type="button" data-action="close-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form id="habit-edit-form" data-habit-id="${habitId}" class="space-y-4 pt-4">
          <!-- Name & Icon -->
          <div class="flex items-center gap-3">
            <div class="w-16">
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("icon_emoji_label", {}, lang)}</label>
              <input type="text" id="modal-habit-icon" name="icon" value="${icon}" class="w-full text-center text-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-1 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
            <div class="flex-1">
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("habit_name_label", {}, lang)} *</label>
              <input type="text" id="modal-habit-name" name="name" value="${name}" placeholder="${i18n.t("habit_name_placeholder", {}, lang)}" required class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
          </div>

          <!-- Quick-Preset Emoji Palette -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">${i18n.t("quick_emoji_presets", {}, lang)}</label>
            <div class="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
              ${presetEmojisHtml}
            </div>
          </div>

          <!-- Measurement Type -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("habit_type_label", {}, lang)}</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                <input type="radio" name="type" value="binary" class="sr-only" ${type === "binary" ? "checked" : ""}>
                <span class="text-base mb-0.5">✓</span>
                <span class="font-medium">${i18n.t("type_binary", {}, lang)}</span>
              </label>
              <label class="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                <input type="radio" name="type" value="numeric" class="sr-only" ${type === "numeric" ? "checked" : ""}>
                <span class="text-base mb-0.5">🔢</span>
                <span class="font-medium">${i18n.t("type_numeric", {}, lang)}</span>
              </label>
              <label class="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                <input type="radio" name="type" value="timer" class="sr-only" ${type === "timer" ? "checked" : ""}>
                <span class="text-base mb-0.5">⏱️</span>
                <span class="font-medium">${i18n.t("type_timer", {}, lang)}</span>
              </label>
            </div>
          </div>

          <!-- Target & Unit (For numeric / timer) -->
          <div id="modal-target-fields" class="grid grid-cols-3 gap-3 ${type === "binary" ? "hidden" : ""}">
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("target_value_label", {}, lang)}</label>
              <input type="number" id="modal-target-value" name="targetValue" value="${targetValue}" min="1" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("target_unit_label", {}, lang)}</label>
              <input type="text" id="modal-target-unit" name="unit" value="${unit}" placeholder="ml, pages, mins" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("step_delta_label", {}, lang)}</label>
              <input type="number" id="modal-step" name="step" value="${step}" min="1" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
          </div>

          <!-- Routine Assignment -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">${i18n.t("routine_label", {}, lang)}</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="modal-routine-chips">
              ${[
                { id: "morning", icon: "🌅", key: "routine_morning" },
                { id: "afternoon", icon: "☀️", key: "routine_afternoon" },
                { id: "evening", icon: "🌙", key: "routine_evening" },
                { id: "anytime", icon: "🔄", key: "routine_anytime" },
              ]
                .map((r) => {
                  const isChecked = assignedRoutines.includes(r.id);
                  return `
                  <label class="routine-chip flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer text-xs transition select-none ${
                    isChecked
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }">
                    <input type="checkbox" name="routines" value="${r.id}" class="sr-only" ${isChecked ? "checked" : ""}>
                    <span>${r.icon}</span>
                    <span>${i18n.t(r.key, {}, lang)}</span>
                  </label>
                `;
                })
                .join("")}
            </div>
            <select name="routine" id="modal-habit-routine" class="hidden">
              <option value="morning" ${routine === "morning" ? "selected" : ""}>🌅 ${i18n.t("routine_morning", {}, lang)}</option>
              <option value="afternoon" ${routine === "afternoon" ? "selected" : ""}>☀️ ${i18n.t("routine_afternoon", {}, lang)}</option>
              <option value="evening" ${routine === "evening" ? "selected" : ""}>🌙 ${i18n.t("routine_evening", {}, lang)}</option>
              <option value="anytime" ${routine === "anytime" ? "selected" : ""}>🔄 ${i18n.t("routine_anytime", {}, lang)}</option>
            </select>
          </div>

          <!-- Frequency Schedule -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("schedule_label", {}, lang)}</label>
            <select name="scheduleType" id="modal-schedule-type" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white mb-2">
              <option value="daily" ${scheduleType === "daily" ? "selected" : ""}>${i18n.t("freq_daily", {}, lang)}</option>
              <option value="specific_days" ${scheduleType === "specific_days" ? "selected" : ""}>${i18n.t("freq_specific_days", {}, lang)}</option>
              <option value="interval" ${scheduleType === "interval" ? "selected" : ""}>${i18n.t("freq_interval", {}, lang)}</option>
            </select>

            <div id="modal-specific-days-container" class="grid grid-cols-4 gap-2 pt-1 ${scheduleType === "specific_days" ? "" : "hidden"}">
              ${specificDaysHtml}
            </div>

            <div id="modal-interval-container" class="flex items-center gap-2 pt-1 ${scheduleType === "interval" ? "" : "hidden"}">
              <span class="text-xs text-slate-500 dark:text-slate-400">Every</span>
              <input type="number" name="intervalDays" value="${intervalDays}" min="1" max="30" class="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-1.5 px-3 text-sm text-center text-slate-900 dark:text-white">
              <span class="text-xs text-slate-500 dark:text-slate-400">days</span>
            </div>
          </div>

          <!-- Color Theme Pills -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">${i18n.t("color_theme_label", {}, lang)}</label>
            <div class="flex items-center gap-3">
              ${colorPillsHtml}
            </div>
          </div>

          <!-- Daily Reminder Time -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">${i18n.t("reminder_time_label", {}, lang)}</label>
            <input type="time" name="reminderTime" value="${reminderTime}" class="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" data-action="close-modal" class="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl">
              ${i18n.t("cancel", {}, lang)}
            </button>
            <button type="submit" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95">
              ${i18n.t("save", {}, lang)}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Renders the Manager Catalog View
   */
  function renderManagerView(store, containerElement, lang = "vi") {
    if (!store) return "";
    const habits = store.getHabits(true); // Include archived

    const routineKeys = [
      engine.ROUTINES.MORNING,
      engine.ROUTINES.AFTERNOON,
      engine.ROUTINES.EVENING,
      engine.ROUTINES.ANYTIME,
    ];

    const routineSectionsHtml = routineKeys
      .map((rKey) => {
        const routineHabits = habits
          .filter(
            (h) => !h.archived && engine.getHabitRoutines(h).includes(rKey)
          )
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (routineHabits.length === 0) return "";

        const itemsHtml = routineHabits
          .map((h, idx) => {
            const colorHex = todayView.getColorHex(h.color);
            const isFirst = idx === 0;
            const isLast = idx === routineHabits.length - 1;
            const assignedRoutines = engine.getHabitRoutines(h);
            const routineBadges =
              assignedRoutines.length > 1
                ? `<div class="flex flex-wrap gap-1 mt-1">${assignedRoutines
                    .map(
                      (r) =>
                        `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">${i18n.t(`routine_${r}`, {}, lang)}</span>`
                    )
                    .join("")}</div>`
                : "";

            return `
              <div class="manager-habit-card bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 mb-3 flex items-center justify-between gap-3 shadow-md" data-habit-id="${h.id}">
                <div class="flex items-center gap-3 flex-1">
                  <div class="w-1.5 h-10 rounded-full" style="background-color: ${colorHex};"></div>
                  <span class="text-2xl">${h.icon || "🎯"}</span>
                  <div>
                    <h4 class="font-semibold text-slate-900 dark:text-white text-base">${h.name}</h4>
                    <span class="text-xs text-slate-500 dark:text-slate-400">${i18n.t(`type_${h.type || "binary"}`, {}, lang)}</span>
                    ${routineBadges}
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <!-- Reorder buttons -->
                  <button type="button" data-action="reorder-up" data-habit-id="${h.id}" data-routine="${rKey}" class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs border border-slate-200 dark:border-transparent ${isFirst ? "opacity-30 cursor-not-allowed" : ""}" ${isFirst ? 'disabled="disabled"' : ""} title="Move Up">▲</button>
                  <button type="button" data-action="reorder-down" data-habit-id="${h.id}" data-routine="${rKey}" class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs border border-slate-200 dark:border-transparent ${isLast ? "opacity-30 cursor-not-allowed" : ""}" ${isLast ? 'disabled="disabled"' : ""} title="Move Down">▼</button>
                  <!-- Edit -->
                  <button type="button" data-action="edit-habit" data-habit-id="${h.id}" class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-sm ml-1 border border-slate-200 dark:border-transparent" title="${i18n.t("edit", {}, lang)}">✏️</button>
                  <!-- Archive -->
                  <button type="button" data-action="archive-habit" data-habit-id="${h.id}" class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-sm border border-slate-200 dark:border-transparent" title="${i18n.t("archive_habit", {}, lang)}">📦</button>
                  <!-- Delete -->
                  <button type="button" data-action="delete-habit" data-habit-id="${h.id}" class="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 text-sm border border-rose-200 dark:border-transparent" title="${i18n.t("delete", {}, lang)}">🗑️</button>
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="mb-6">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">${i18n.t(`routine_${rKey}`, {}, lang)}</h3>
            <div>${itemsHtml}</div>
          </div>
        `;
      })
      .join("");

    const archivedHabits = habits.filter((h) => h.archived);
    const archivedHtml =
      archivedHabits.length > 0
        ? `
        <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">${i18n.t("archive_habit", {}, lang)} (${archivedHabits.length})</h3>
          <div class="space-y-2">
            ${archivedHabits
              .map(
                (h) => `
                <div class="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 rounded-xl p-3 flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <div class="flex items-center gap-2">
                    <span>${h.icon || "🎯"}</span>
                    <span class="line-through text-sm">${h.name}</span>
                  </div>
                  <button type="button" data-action="restore-habit" data-habit-id="${h.id}" class="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1 rounded-lg">
                    ${i18n.t("restore_habit", {}, lang)}
                  </button>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `
        : "";

    const html = `
      <div class="manager-view max-w-lg mx-auto pb-24">
        <div class="flex items-center justify-between mb-6 px-1">
          <div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">${i18n.t("manager_tab", {}, lang)}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">${i18n.t("app_tagline", {}, lang)}</p>
          </div>
          <button
            type="button"
            data-action="open-add-habit"
            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            + ${i18n.t("add_habit", {}, lang)}
          </button>
        </div>

        <div class="routine-manager-groups">
          ${routineSectionsHtml}
          ${archivedHtml}
        </div>
      </div>
    `;

    if (containerElement) {
      containerElement.innerHTML = html;
    }

    return html;
  }

  const managerExports = {
    renderHabitEditModal,
    renderManagerView,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = managerExports;
  } else {
    global.HabitManagerView = managerExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
