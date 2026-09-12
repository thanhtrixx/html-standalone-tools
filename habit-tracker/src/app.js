/**
 * Atomic Habit & Routine Tracker - Main Application Orchestrator
 */

(function (global) {
  "use strict";

  const engine =
    typeof require !== "undefined"
      ? require("./domain/engine.js")
      : global.HabitEngine;

  const i18n =
    typeof require !== "undefined"
      ? require("./i18n/translations.js")
      : global.Habiti18n;

  const storageModule =
    typeof require !== "undefined"
      ? require("./storage/indexeddb.js")
      : global.HabitStorage;

  const { HabitStore } =
    typeof require !== "undefined"
      ? require("./state/store.js")
      : global.HabitState;

  const exportImport =
    typeof require !== "undefined"
      ? require("./sync/export-import.js")
      : global.HabitExportImport;

  const cloudBackup =
    typeof require !== "undefined"
      ? require("./sync/cloud-backup.js")
      : global.HabitCloud;

  const components =
    typeof require !== "undefined"
      ? require("./ui/components.js")
      : global.HabitComponents;

  const todayView =
    typeof require !== "undefined"
      ? require("./ui/today-view.js")
      : global.HabitTodayView;

  const managerView =
    typeof require !== "undefined"
      ? require("./ui/manager-view.js")
      : global.HabitManagerView;

  const detailSheet =
    typeof require !== "undefined"
      ? require("./ui/detail-sheet.js")
      : global.HabitDetailSheet;

  const insightsView =
    typeof require !== "undefined"
      ? require("./ui/insights-view.js")
      : global.HabitInsightsView;

  const notifications =
    typeof require !== "undefined"
      ? require("./pwa/notifications.js")
      : global.HabitNotifications;

  // Application State
  let store = null;
  let activeTab = "today"; // 'today' | 'insights' | 'manager' | 'settings'
  let timerInterval = null;
  let runningTimerHabitId = null;
  let swipeStartX = 0;
  let swipeStartY = 0;

  /**
   * Initializes the application
   */
  async function initApp() {
    const storage = storageModule.createStorageAdapter();
    store = new HabitStore({ storage });
    await store.init();

    // Populate initial sample habits if empty
    if (store.getHabits(true).length === 0) {
      await seedDefaultHabits();
    }

    // Apply stored theme and language
    const settings = store.getSettings();
    applyTheme(settings.theme || "dark");

    // Bind store reactivity
    store.subscribe(() => {
      renderActiveTab();
      updateTopBar();
    });

    // Render Initial View
    renderApp();
    setupEventListeners();
    setupPwaServiceWorker();

    // Schedule local notifications if permitted
    if (notifications && notifications.scheduleHabitReminders) {
      notifications.scheduleHabitReminders(
        store.getHabits(),
        settings.language
      );
    }
  }

  /**
   * Seeds friendly default habits for new users
   */
  async function seedDefaultHabits() {
    const defaults = [
      {
        id: "h-water",
        name: "Uống 2.5L Nước",
        type: "numeric",
        targetValue: 2500,
        unit: "ml",
        step: 250,
        routine: "afternoon",
        scheduleType: "daily",
        color: "cyan",
        icon: "💧",
        reminderTime: "14:00",
      },
      {
        id: "h-meditate",
        name: "Thiền chánh niệm 10 phút",
        type: "binary",
        targetValue: 1,
        routine: "morning",
        scheduleType: "daily",
        color: "indigo",
        icon: "🧘",
        reminderTime: "07:00",
      },
      {
        id: "h-read",
        name: "Đọc sách 20 phút",
        type: "timer",
        targetValue: 1200,
        unit: "mins",
        routine: "evening",
        scheduleType: "daily",
        color: "amber",
        icon: "📖",
        reminderTime: "21:00",
      },
    ];

    for (const h of defaults) {
      await store.addHabit(h);
    }
  }

  /**
   * Applies Dark/Light theme class to html root
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }

  /**
   * Updates Top Bar (Freeze tokens counter, active date indicator)
   */
  function updateTopBar() {
    const settings = store.getSettings();
    const lang = settings.language || "vi";
    const freezeTokensEl = document.getElementById("freeze-tokens-count");
    if (freezeTokensEl) {
      freezeTokensEl.textContent = settings.freezeTokens ?? 2;
    }

    const langToggleBtn = document.getElementById("lang-toggle-btn");
    if (langToggleBtn) {
      langToggleBtn.textContent = lang === "vi" ? "VI" : "EN";
    }
  }

  /**
   * Renders the entire app shell
   */
  function renderApp() {
    updateTopBar();
    renderActiveTab();
    updateNavigationDock();
  }

  /**
   * Updates the active state of bottom navigation buttons
   */
  function updateNavigationDock() {
    const navButtons = document.querySelectorAll(".nav-tab-btn");
    navButtons.forEach((btn) => {
      const tab = btn.getAttribute("data-tab");
      if (tab === activeTab) {
        btn.classList.add("text-emerald-400", "font-bold");
        btn.classList.remove("text-slate-400");
      } else {
        btn.classList.remove("text-emerald-400", "font-bold");
        btn.classList.add("text-slate-400");
      }
    });
  }

  /**
   * Renders content inside the main content container
   */
  function renderActiveTab() {
    const container = document.getElementById("main-content");
    if (!container) return;

    const settings = store.getSettings();
    const lang = settings.language || "vi";

    if (activeTab === "today") {
      todayView.renderTodayDashboard(store, container, lang);
      bindHabitCardGestures();
    } else if (activeTab === "insights") {
      insightsView.renderInsightsView(store, container, lang);
      bindHeatmapInteractions();
    } else if (activeTab === "manager") {
      managerView.renderManagerView(store, container, lang);
    } else if (activeTab === "settings") {
      renderSettingsTab(container, lang);
    }
  }

  /**
   * Renders Settings Tab HTML
   */
  function renderSettingsTab(container, lang = "vi") {
    const settings = store.getSettings();
    const isDriveConnected = !!(
      settings.cloudSync && settings.cloudSync.googleDriveToken
    );
    const isGistConnected = !!(
      settings.cloudSync && settings.cloudSync.gistToken
    );

    const html = `
      <div class="settings-view max-w-lg mx-auto pb-24 px-1">
        <div class="mb-6">
          <h2 class="text-2xl font-black text-white">${i18n.t("settings_tab", {}, lang)}</h2>
          <p class="text-xs text-slate-400">${i18n.t("settings_title", {}, lang)}</p>
        </div>

        <!-- Language & Appearance Card -->
        <div class="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 mb-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3">🌐 ${i18n.t("language_select", {}, lang)} & ${i18n.t("theme_select", {}, lang)}</h3>
          
          <div class="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span class="text-xs text-slate-300">${i18n.t("language_select", {}, lang)}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="window.HabitApp.switchLanguage('vi')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${lang === "vi" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}">Tiếng Việt</button>
              <button onclick="window.HabitApp.switchLanguage('en')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${lang === "en" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}">English</button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3">
            <span class="text-xs text-slate-300">${i18n.t("theme_select", {}, lang)}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="window.HabitApp.switchTheme('dark')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${settings.theme !== "light" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}">🌙 Dark OLED</button>
              <button onclick="window.HabitApp.switchTheme('light')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${settings.theme === "light" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}">☀️ Light</button>
            </div>
          </div>
        </div>

        <!-- Streak Freeze & Vacation Safeguards Card -->
        <div class="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 mb-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3">🛡️ ${i18n.t("freeze_token", {}, lang)} & ${i18n.t("vacation_pause_mode", {}, lang)}</h3>
          
          <div class="flex items-center justify-between py-2 border-b border-slate-800/60">
            <div>
              <span class="text-xs text-slate-300 block font-semibold">${i18n.t("freeze_tokens_left", { count: settings.freezeTokens ?? 2 }, lang)}</span>
              <span class="text-[11px] text-slate-500">Tự động bảo lưu chuỗi khi bận rộn</span>
            </div>
            <button onclick="window.HabitApp.addFreezeTokens(1)" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl active:scale-95 transition-all">
              +1 🛡️
            </button>
          </div>

          <div class="flex items-center justify-between pt-3">
            <div>
              <span class="text-xs text-slate-300 block font-semibold">${i18n.t("vacation_pause_mode", {}, lang)}</span>
              <span class="text-[11px] text-slate-500">Đóng băng chuỗi cho kỳ nghỉ dài</span>
            </div>
            <button onclick="window.HabitApp.toggleVacationMode()" class="px-3 py-1.5 ${settings.vacationRanges && settings.vacationRanges.length > 0 ? "bg-amber-600/80 text-white" : "bg-slate-800 text-slate-300"} text-xs font-bold rounded-xl active:scale-95 transition-all">
              ${settings.vacationRanges && settings.vacationRanges.length > 0 ? "Đang tạm dừng ⏸️" : "Bật tạm dừng ✈️"}
            </button>
          </div>
        </div>

        <!-- Data Backup & Cloud Sync Card -->
        <div class="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 mb-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3">☁️ ${i18n.t("cloud_backup_title", {}, lang)} & ${i18n.t("export_import_title", {}, lang)}</h3>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <button onclick="window.HabitApp.exportDataJSON()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl text-xs font-bold text-cyan-400 border border-slate-700/50 transition-all">
              <span>📥</span>
              <span>${i18n.t("export_json_btn", {}, lang)}</span>
            </button>
            <label class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl text-xs font-bold text-emerald-400 border border-slate-700/50 cursor-pointer transition-all">
              <span>📤</span>
              <span>${i18n.t("import_json_btn", {}, lang)}</span>
              <input type="file" id="import-json-input" accept=".json" class="hidden" onchange="window.HabitApp.importDataJSON(event)" />
            </label>
          </div>

          <div class="space-y-2 pt-2 border-t border-slate-800/60">
            <button onclick="window.HabitApp.promptDriveBackup()" class="w-full flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-slate-700/40 text-left transition-all">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">📁</span>
                <div>
                  <h4 class="text-xs font-bold text-white">Google Drive Cloud Backup</h4>
                  <span class="text-[10px] text-slate-400">${isDriveConnected ? "Đã liên kết" : "Chưa thiết lập"}</span>
                </div>
              </div>
              <span class="text-xs text-slate-400">⚙️</span>
            </button>

            <button onclick="window.HabitApp.promptGistBackup()" class="w-full flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-slate-700/40 text-left transition-all">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">🐙</span>
                <div>
                  <h4 class="text-xs font-bold text-white">GitHub Gist Cloud Backup</h4>
                  <span class="text-[10px] text-slate-400">${isGistConnected ? "Đã liên kết" : "Chưa thiết lập"}</span>
                </div>
              </div>
              <span class="text-xs text-slate-400">⚙️</span>
            </button>
          </div>
        </div>

        <!-- PWA Status & Updates Card -->
        <div class="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 mb-5 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-white">📲 ${i18n.t("pwa_version", {}, lang)}</h3>
            <span class="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 font-mono">v1.0.0</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button onclick="window.HabitApp.checkForUpdates()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-2xl text-xs font-bold transition-all">
              <span>🔄</span>
              <span>${i18n.t("check_updates_btn", {}, lang)}</span>
            </button>
            <button onclick="window.HabitApp.purgeCacheAndReload()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800/60 border border-transparent active:scale-95 text-slate-300 rounded-2xl text-xs font-bold transition-all">
              <span>🧹</span>
              <span>${i18n.t("purge_cache_btn", {}, lang)}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Binds interactive cell tap/hover popover for insights heatmap
   */
  function bindHeatmapInteractions() {
    const cells = document.querySelectorAll(".heatmap-cell");
    const popover = document.getElementById("heatmap-cell-popover");
    if (!cells || !popover) return;

    cells.forEach((cell) => {
      cell.addEventListener("click", () => {
        const date = cell.getAttribute("data-date");
        const rate = cell.getAttribute("data-rate");
        const completed = cell.getAttribute("data-completed");
        const scheduled = cell.getAttribute("data-scheduled");

        const settings = store.getSettings();
        const lang = settings.language || "vi";
        const dateFormatted = i18n.formatDate(date, lang, "full");

        popover.innerHTML = `
          <div class="flex items-center justify-between font-bold text-white mb-1">
            <span>📅 ${dateFormatted}</span>
            <span class="text-emerald-400">${rate}%</span>
          </div>
          <p class="text-slate-400">${completed}/${scheduled} ${i18n.t("completed", {}, lang)}</p>
        `;
        popover.classList.remove("hidden");
      });
    });
  }

  /**
   * Binds swipe gesture handlers to habit cards
   */
  function bindHabitCardGestures() {
    const cards = document.querySelectorAll(".habit-card");
    cards.forEach((card) => {
      const habitId = card.getAttribute("data-habit-id");
      if (!habitId) return;

      card.addEventListener(
        "touchstart",
        (e) => {
          swipeStartX = e.touches[0].clientX;
          swipeStartY = e.touches[0].clientY;
        },
        { passive: true }
      );

      card.addEventListener("touchend", async (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - swipeStartX;
        const diffY = endY - swipeStartY;

        // Ensure mostly horizontal swipe
        if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX > 0) {
            // Swipe Right -> Complete Habit
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(15);
            }
            await handleToggleHabit(habitId, store.getActiveDate());
          } else {
            // Swipe Left -> Open Detail Sheet
            handleOpenDetailSheet(habitId);
          }
        }
      });
    });
  }

  /**
   * Set up global event delegation
   */
  function setupEventListeners() {
    document.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      const action = target.getAttribute("data-action");
      const habitId = target.getAttribute("data-habit-id");
      const activeDate = store.getActiveDate();

      if (action === "toggle-habit") {
        await handleToggleHabit(habitId, activeDate);
      } else if (action === "step-increment") {
        await handleStepIncrement(habitId, activeDate);
      } else if (action === "step-decrement") {
        await handleStepDecrement(habitId, activeDate);
      } else if (action === "toggle-timer") {
        await handleToggleTimer(habitId, activeDate);
      } else if (action === "open-detail") {
        handleOpenDetailSheet(habitId);
      } else if (action === "select-date") {
        const date = target.getAttribute("data-date");
        if (date) store.setActiveDate(date);
      } else if (action === "open-add-habit") {
        handleOpenEditModal(null);
      }
    });
  }

  /**
   * Habit Toggle Handler (Checks 100% daily victory)
   */
  async function handleToggleHabit(habitId, date) {
    if (!store || !habitId) return;
    await store.toggleHabit(habitId, date);

    // Check if 100% daily completion reached
    const dailyState = store.getDailyState(date);
    if (dailyState && dailyState.dailyProgress.isAllCompleted) {
      const canvas = document.getElementById("confetti-canvas");
      if (canvas && todayView.triggerVictoryConfetti) {
        todayView.triggerVictoryConfetti(canvas);
      }
      showToast(
        i18n.t("daily_congrats_title", {}, store.getSettings().language),
        "success"
      );
    }
  }

  /**
   * Habit Step Increment
   */
  async function handleStepIncrement(habitId, date) {
    const habit = store.getHabit(habitId);
    if (!habit) return;
    const log = store.state.logs[`${habitId}_${date}`] || { value: 0 };
    const step = habit.step || 1;
    await store.logHabit(habitId, date, (log.value || 0) + step);
  }

  /**
   * Habit Step Decrement
   */
  async function handleStepDecrement(habitId, date) {
    const habit = store.getHabit(habitId);
    if (!habit) return;
    const log = store.state.logs[`${habitId}_${date}`] || { value: 0 };
    const step = habit.step || 1;
    const nextVal = Math.max(0, (log.value || 0) - step);
    await store.logHabit(habitId, date, nextVal);
  }

  /**
   * Habit Timer Toggle
   */
  async function handleToggleTimer(habitId, date) {
    const habit = store.getHabit(habitId);
    if (!habit) return;

    if (runningTimerHabitId === habitId) {
      // Stop Timer
      clearInterval(timerInterval);
      runningTimerHabitId = null;
      renderActiveTab();
      return;
    }

    if (runningTimerHabitId) {
      clearInterval(timerInterval);
      runningTimerHabitId = null;
    }

    runningTimerHabitId = habitId;
    timerInterval = setInterval(async () => {
      const currentLog = store.state.logs[`${habitId}_${date}`] || { value: 0 };
      const nextSeconds = (currentLog.value || 0) + 1;
      await store.logHabit(habitId, date, nextSeconds);

      // Auto stop if target reached
      if (nextSeconds >= habit.targetValue) {
        clearInterval(timerInterval);
        runningTimerHabitId = null;
        renderActiveTab();
        showToast(`🎉 Đã hoàn thành thời lượng cho ${habit.name}!`, "success");
      }
    }, 1000);

    renderActiveTab();
  }

  /**
   * Opens Habit Detail Sheet
   */
  function handleOpenDetailSheet(habitId) {
    const habit = store.getHabit(habitId);
    if (!habit) return;

    const sheetContainer = document.getElementById("detail-sheet-container");
    if (!sheetContainer) return;

    const lang = store.getSettings().language || "vi";
    detailSheet.renderDetailSheet(
      habit,
      store,
      sheetContainer,
      lang,
      store.getActiveDate()
    );

    const sheetOverlay = document.getElementById("detail-sheet-overlay");
    if (sheetOverlay) {
      sheetOverlay.classList.remove("hidden");
    }
  }

  /**
   * Closes Detail Sheet
   */
  function closeDetailSheet() {
    const sheetOverlay = document.getElementById("detail-sheet-overlay");
    if (sheetOverlay) {
      sheetOverlay.classList.add("hidden");
    }
  }

  /**
   * Opens Habit Edit Modal
   */
  function handleOpenEditModal(habitId = null) {
    const habit = habitId ? store.getHabit(habitId) : null;
    const modalContainer = document.getElementById("habit-modal-container");
    if (!modalContainer) return;

    const lang = store.getSettings().language || "vi";
    modalContainer.innerHTML = managerView.renderHabitEditModal(habit, lang);

    const modalOverlay = document.getElementById("habit-edit-modal-overlay");
    if (modalOverlay) {
      modalOverlay.classList.remove("hidden");
    }
  }

  /**
   * Closes Habit Edit Modal
   */
  function closeHabitModal() {
    const modalOverlay = document.getElementById("habit-edit-modal-overlay");
    if (modalOverlay) {
      modalOverlay.classList.add("hidden");
    }
  }

  /**
   * Saves habit from modal form submission
   */
  async function saveHabitFromModal(event) {
    if (event) event.preventDefault();
    const nameEl = document.getElementById("modal-habit-name");
    const idEl = document.getElementById("modal-habit-id");
    const typeEl = document.getElementById("modal-habit-type");
    const targetValEl = document.getElementById("modal-target-value");
    const unitEl = document.getElementById("modal-habit-unit");
    const routineEl = document.getElementById("modal-habit-routine");
    const scheduleEl = document.getElementById("modal-schedule-type");
    const iconEl = document.getElementById("modal-habit-icon");
    const colorEl = document.getElementById("modal-habit-color");
    const reminderEl = document.getElementById("modal-reminder-time");

    if (!nameEl || !nameEl.value.trim()) {
      showToast("Vui lòng nhập tên thói quen", "error");
      return;
    }

    const habitData = {
      id: idEl && idEl.value ? idEl.value : `h-${Date.now()}`,
      name: nameEl.value.trim(),
      type: typeEl ? typeEl.value : "binary",
      targetValue: targetValEl ? parseFloat(targetValEl.value) || 1 : 1,
      unit: unitEl ? unitEl.value.trim() : "",
      routine: routineEl ? routineEl.value : "anytime",
      scheduleType: scheduleEl ? scheduleEl.value : "daily",
      icon: iconEl ? iconEl.value.trim() || "🎯" : "🎯",
      color: colorEl ? colorEl.value : "emerald",
      reminderTime: reminderEl ? reminderEl.value : "",
    };

    if (idEl && idEl.value) {
      await store.updateHabit(idEl.value, habitData);
      showToast("Đã cập nhật thói quen!", "success");
    } else {
      await store.addHabit(habitData);
      showToast("Đã thêm thói quen mới!", "success");
    }

    closeHabitModal();
  }

  /**
   * Toast notification helper
   */
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    const bg =
      type === "success"
        ? "bg-emerald-600 text-white"
        : type === "error"
          ? "bg-red-600 text-white"
          : "bg-slate-800 text-slate-200";

    toast.className = `px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold ${bg} transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center gap-2`;
    toast.innerHTML = `<span>${type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span> <span>${message}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * PWA Service Worker Registration
   */
  function setupPwaServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("./sw.js")
          .then((reg) => {
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    const banner = document.getElementById("pwa-update-banner");
                    if (banner) banner.classList.remove("hidden");
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn("[SW] Registration failed:", err);
          });
      });
    }
  }

  // Public API exposed to global
  const HabitApp = {
    init: initApp,
    switchTab(tab) {
      activeTab = tab;
      renderApp();
    },
    switchLanguage(lang) {
      store.updateSettings({ language: lang });
    },
    switchTheme(theme) {
      applyTheme(theme);
      store.updateSettings({ theme });
    },
    addFreezeTokens(count) {
      const current = store.getSettings().freezeTokens || 0;
      store.updateSettings({ freezeTokens: current + count });
      showToast(`Đã nạp thêm ${count} vé bảo lưu chuỗi!`, "success");
    },
    toggleVacationMode() {
      const current = store.getSettings().vacationRanges || [];
      const today = store.getActiveDate();
      if (current.length > 0) {
        store.updateSettings({ vacationRanges: [] });
        showToast("Đã tắt chế độ tạm dừng!", "info");
      } else {
        store.updateSettings({
          vacationRanges: [{ start: today, end: "2099-12-31" }],
        });
        showToast("Đã bật chế độ tạm dừng nghỉ phép!", "info");
      }
    },
    exportDataJSON() {
      exportImport.downloadExportJSON(store.state);
      showToast("Đã tải xuống bản sao lưu JSON!", "success");
    },
    async importDataJSON(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const res = exportImport.parseAndValidateImport(text);
        if (!res.valid) {
          showToast(`Lỗi tệp: ${res.errors.join(", ")}`, "error");
          return;
        }
        const merged = exportImport.mergeHabitStates(
          store.state,
          res.data,
          "merge"
        );
        await store.replaceState(merged);
        showToast("Khôi phục dữ liệu thành công!", "success");
      } catch (err) {
        showToast(`Lỗi nhập tệp: ${err.message}`, "error");
      }
    },
    promptDriveBackup() {
      showToast(
        "Google Drive Sync: Vui lòng thiết lập Client ID trong Settings",
        "info"
      );
    },
    promptGistBackup() {
      showToast(
        "GitHub Gist Sync: Vui lòng thiết lập PAT Token trong Settings",
        "info"
      );
    },
    checkForUpdates() {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.update();
            showToast("Đã kiểm tra phiên bản mới nhất.", "info");
          }
        });
      }
    },
    purgeCacheAndReload() {
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            return Promise.all(keys.map((k) => caches.delete(k)));
          })
          .then(() => {
            window.location.reload();
          });
      }
    },
    applyPwaUpdate() {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
            window.location.reload();
          }
        });
      }
    },
    closeDetailSheet,
    handleOpenEditModal,
    closeHabitModal,
    saveHabitFromModal,
    handleArchiveHabit: async (id) => {
      await store.archiveHabit(id);
      showToast("Đã lưu trữ thói quen", "info");
    },
    handleRestoreHabit: async (id) => {
      await store.restoreHabit(id);
      showToast("Đã khôi phục thói quen", "success");
    },
    handleDeleteHabit: async (id) => {
      await store.deleteHabit(id);
      showToast("Đã xoá thói quen", "info");
    },
    handleSaveNotes: async (habitId, date, notes) => {
      await store.updateNotes(habitId, date, notes);
      showToast("Đã lưu ghi chú nhật ký!", "success");
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = HabitApp;
  } else {
    global.HabitApp = HabitApp;
    window.addEventListener("DOMContentLoaded", () => {
      HabitApp.init();
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
