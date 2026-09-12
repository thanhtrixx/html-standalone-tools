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
    const settings = store ? store.getSettings() : { language: "vi" };
    const lang = (settings && settings.language) || "vi";
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

      if (tab) {
        const tabText = i18n.t(`${tab}_tab`, {}, lang);
        const labelEl =
          btn.querySelector && typeof btn.querySelector === "function"
            ? btn.querySelector(".nav-label")
            : null;
        if (labelEl) {
          labelEl.textContent = tabText;
        }
        if (btn.innerHTML && btn.innerHTML.includes("nav-label")) {
          btn.innerHTML = btn.innerHTML.replace(
            /<span class="nav-label">[\s\S]*?<\/span>/,
            `<span class="nav-label">${tabText}</span>`
          );
        }
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
          <h2 class="text-2xl font-black text-slate-900 dark:text-white">${i18n.t("settings_tab", {}, lang)}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">${i18n.t("settings_title", {}, lang)}</p>
        </div>

        <!-- Language & Appearance Card -->
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">🌐 ${i18n.t("language_select", {}, lang)} & ${i18n.t("theme_select", {}, lang)}</h3>
          
          <div class="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/60">
            <span class="text-xs text-slate-700 dark:text-slate-300">${i18n.t("language_select", {}, lang)}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="window.HabitApp.switchLanguage('vi')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${lang === "vi" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}">Tiếng Việt</button>
              <button onclick="window.HabitApp.switchLanguage('en')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${lang === "en" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}">English</button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3">
            <span class="text-xs text-slate-700 dark:text-slate-300">${i18n.t("theme_select", {}, lang)}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="window.HabitApp.switchTheme('dark')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${settings.theme !== "light" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}">🌙 ${i18n.t("theme_dark", {}, lang)}</button>
              <button onclick="window.HabitApp.switchTheme('light')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${settings.theme === "light" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}">☀️ ${i18n.t("theme_light", {}, lang)}</button>
            </div>
          </div>
        </div>

        <!-- Streak Freeze & Vacation Safeguards Card -->
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">🛡️ ${i18n.t("freeze_token", {}, lang)} & ${i18n.t("vacation_pause_mode", {}, lang)}</h3>
          
          <div class="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/60">
            <div>
              <span class="text-xs text-slate-800 dark:text-slate-300 block font-semibold">${i18n.t("freeze_tokens_left", { count: settings.freezeTokens ?? 2 }, lang)}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">${i18n.t("freeze_tokens_desc", {}, lang)}</span>
            </div>
            <button onclick="window.HabitApp.addFreezeTokens(1)" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl active:scale-95 transition-all">
              +1 🛡️
            </button>
          </div>

          <div class="flex items-center justify-between pt-3">
            <div>
              <span class="text-xs text-slate-800 dark:text-slate-300 block font-semibold">${i18n.t("vacation_pause_mode", {}, lang)}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">${i18n.t("vacation_mode_desc", {}, lang)}</span>
            </div>
            <button onclick="window.HabitApp.toggleVacationMode()" class="px-3 py-1.5 ${settings.vacationRanges && settings.vacationRanges.length > 0 ? "bg-amber-600/80 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"} text-xs font-bold rounded-xl active:scale-95 transition-all">
              ${settings.vacationRanges && settings.vacationRanges.length > 0 ? i18n.t("vacation_active_btn", {}, lang) : i18n.t("vacation_inactive_btn", {}, lang)}
            </button>
          </div>
        </div>

        <!-- Data Backup & Cloud Sync Card -->
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">☁️ ${i18n.t("cloud_backup_title", {}, lang)} & ${i18n.t("export_import_title", {}, lang)}</h3>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <button id="btn-export-json" data-action="export-json" onclick="window.HabitApp.exportDataJSON()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700/50 transition-all">
              <span>📥</span>
              <span>${i18n.t("export_json_btn", {}, lang)}</span>
            </button>
            <label class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700/50 cursor-pointer transition-all">
              <span>📤</span>
              <span>${i18n.t("import_json_btn", {}, lang)}</span>
              <input type="file" id="import-json-input" accept=".json" class="hidden" onchange="window.HabitApp.importDataJSON(event)" />
            </label>
          </div>

          <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
            <button onclick="window.HabitApp.promptDriveBackup()" class="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/40 text-left transition-all">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">📁</span>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white">Google Drive Cloud Backup</h4>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400">${isDriveConnected ? i18n.t("cloud_connected", {}, lang) : i18n.t("cloud_not_connected", {}, lang)}</span>
                </div>
              </div>
              <span class="text-xs text-slate-400">⚙️</span>
            </button>

            <button onclick="window.HabitApp.promptGistBackup()" class="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/40 text-left transition-all">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">🐙</span>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white">GitHub Gist Cloud Backup</h4>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400">${isGistConnected ? i18n.t("cloud_connected", {}, lang) : i18n.t("cloud_not_connected", {}, lang)}</span>
                </div>
              </div>
              <span class="text-xs text-slate-400">⚙️</span>
            </button>
          </div>
        </div>

        <!-- PWA Status & Updates Card -->
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">📲 ${i18n.t("pwa_version", {}, lang)}</h3>
            <span class="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/50 font-mono">v1.0.0</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button onclick="window.HabitApp.checkForUpdates()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all">
              <span>🔄</span>
              <span>${i18n.t("check_updates_btn", {}, lang)}</span>
            </button>
            <button onclick="window.HabitApp.purgeCacheAndReload()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-red-100 dark:hover:bg-red-950/60 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-800/60 border border-transparent active:scale-95 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all">
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
    // Form submit interception
    document.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (e.target && e.target.id === "habit-edit-form") {
        await saveHabitFromModal(e);
      } else if (e.target && e.target.id === "habit-note-form") {
        const habitId = e.target.getAttribute("data-habit-id");
        const date = e.target.getAttribute("data-date");
        const noteInput =
          e.target.querySelector("#habit-note-input") ||
          e.target.querySelector("textarea");
        const notes = noteInput ? noteInput.value.trim() : "";
        if (habitId && date) {
          await HabitApp.handleSaveNotes(habitId, date, notes);
          const habit = store.getHabit(habitId);
          const sheetContainer = document.getElementById(
            "detail-sheet-container"
          );
          if (habit && sheetContainer) {
            const lang = store.getSettings().language || "vi";
            detailSheet.renderDetailSheet(
              habit,
              store,
              sheetContainer,
              lang,
              date
            );
          }
        }
      }
    });

    // Global click delegation
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
      } else if (action === "close-detail-sheet") {
        closeDetailSheet();
      } else if (action === "select-date") {
        const date = target.getAttribute("data-date");
        if (date) store.setActiveDate(date);
      } else if (action === "open-add-habit") {
        handleOpenEditModal(null);
      } else if (action === "close-modal") {
        closeHabitModal();
      } else if (action === "edit-habit") {
        handleOpenEditModal(habitId);
      } else if (action === "archive-habit") {
        await HabitApp.handleArchiveHabit(habitId);
      } else if (action === "restore-habit") {
        await HabitApp.handleRestoreHabit(habitId);
      } else if (action === "delete-habit") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        await app.handleDeleteHabit(habitId);
      } else if (action === "reorder-up" || action === "reorder-down") {
        const routine = target.getAttribute("data-routine");
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        await app.handleReorderHabit(
          habitId,
          routine,
          action === "reorder-up" ? "up" : "down"
        );
      } else if (action === "select-emoji") {
        const emoji = target.getAttribute("data-emoji");
        if (emoji) {
          const iconInput = document.getElementById("modal-habit-icon");
          if (iconInput) {
            iconInput.value = emoji;
          }
          const allPresets = document.querySelectorAll(
            '[data-action="select-emoji"]'
          );
          allPresets.forEach((btn) => {
            if (btn.getAttribute("data-emoji") === emoji) {
              btn.className =
                "emoji-preset-btn w-9 h-9 flex items-center justify-center text-lg rounded-xl transition duration-150 hover:scale-110 active:scale-95 bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30";
            } else {
              btn.className =
                "emoji-preset-btn w-9 h-9 flex items-center justify-center text-lg rounded-xl transition duration-150 hover:scale-110 active:scale-95 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700";
            }
          });
        }
      } else if (action === "undo-toast") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.undoLastAction === "function") {
          await app.undoLastAction();
        } else {
          await undoLastAction();
        }
      } else if (action === "view-heatmap-date") {
        const targetDate = target.getAttribute("data-date");
        if (targetDate) {
          store.setActiveDate(targetDate);
          const app =
            (typeof window !== "undefined" && window.HabitApp) || HabitApp;
          if (app && typeof app.switchTab === "function") {
            app.switchTab("today");
          } else {
            activeTab = "today";
            renderApp();
          }
        }
      } else if (action === "export-json") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        await app.exportDataJSON();
      }
    });
  }

  const undoStack = [];

  /**
   * Undoes the last habit logging or toggling action
   */
  async function undoLastAction() {
    if (!undoStack || undoStack.length === 0) return;
    const last = undoStack.pop();
    if (!last || !store) return;

    const { habitId, date, previousLog } = last;
    const prevValue = previousLog ? previousLog.value : 0;
    const prevNotes = previousLog ? previousLog.notes || "" : "";
    const prevCompleted = previousLog ? !!previousLog.completed : false;

    await store.logHabit(habitId, date, prevValue, prevNotes);

    const currentLog = store.state.logs[`${habitId}_${date}`];
    if (currentLog && currentLog.completed !== prevCompleted) {
      currentLog.completed = prevCompleted;
      if (store.storage && store.storage.saveLog) {
        await store.storage.saveLog(currentLog);
      }
    }

    renderActiveTab();
    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_undo_success", {}, lang), "info");
  }

  /**
   * Habit Toggle Handler (Checks 100% daily victory)
   */
  async function handleToggleHabit(habitId, date) {
    if (!store || !habitId) return;
    const previousLog = store.state.logs[`${habitId}_${date}`]
      ? { ...store.state.logs[`${habitId}_${date}`] }
      : { habitId, date, value: 0, completed: false };

    await store.toggleHabit(habitId, date);
    undoStack.push({ habitId, date, previousLog });

    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    const currentLog = store.state.logs[`${habitId}_${date}`];
    const isNowDone = currentLog && currentLog.completed;
    const toastMsg = isNowDone
      ? i18n.t("toast_habit_completed", {}, lang)
      : i18n.t("toast_habit_saved", {}, lang);

    showToast(toastMsg, "success", {
      label: i18n.t("undo", {}, lang),
      dataAction: "undo-toast",
    });

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
    const previousLog = store.state.logs[`${habitId}_${date}`]
      ? { ...store.state.logs[`${habitId}_${date}`] }
      : { habitId, date, value: 0, completed: false };

    const step = habit.step || 1;
    await store.logHabit(habitId, date, (previousLog.value || 0) + step);
    undoStack.push({ habitId, date, previousLog });

    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_habit_incremented", {}, lang), "info", {
      label: i18n.t("undo", {}, lang),
      dataAction: "undo-toast",
    });
  }

  /**
   * Habit Step Decrement
   */
  async function handleStepDecrement(habitId, date) {
    const habit = store.getHabit(habitId);
    if (!habit) return;
    const previousLog = store.state.logs[`${habitId}_${date}`]
      ? { ...store.state.logs[`${habitId}_${date}`] }
      : { habitId, date, value: 0, completed: false };

    const step = habit.step || 1;
    const nextVal = Math.max(0, (previousLog.value || 0) - step);
    await store.logHabit(habitId, date, nextVal);
    undoStack.push({ habitId, date, previousLog });

    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_habit_incremented", {}, lang), "info", {
      label: i18n.t("undo", {}, lang),
      dataAction: "undo-toast",
    });
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
    if (event && event.preventDefault) event.preventDefault();
    const form =
      event && event.target && event.target.tagName === "FORM"
        ? event.target
        : document.getElementById("habit-edit-form");

    const habitId =
      (form && form.getAttribute("data-habit-id")) ||
      (document.getElementById("modal-habit-id") &&
        document.getElementById("modal-habit-id").value) ||
      "";

    const nameEl =
      (form && form.querySelector('[name="name"]')) ||
      document.getElementById("modal-habit-name");
    const name = nameEl ? nameEl.value.trim() : "";

    if (!name) {
      showToast("Vui lòng nhập tên thói quen", "error");
      return;
    }

    const typeEl =
      (form && form.querySelector('input[name="type"]:checked')) ||
      document.getElementById("modal-habit-type");
    const type = typeEl ? typeEl.value : "binary";

    const targetValEl =
      (form && form.querySelector('[name="targetValue"]')) ||
      document.getElementById("modal-target-value");
    const unitEl =
      (form && form.querySelector('[name="unit"]')) ||
      document.getElementById("modal-habit-unit") ||
      document.getElementById("modal-target-unit");
    const stepEl =
      (form && form.querySelector('[name="step"]')) ||
      document.getElementById("modal-step");
    const routineEl =
      (form && form.querySelector('[name="routine"]')) ||
      document.getElementById("modal-habit-routine");
    const scheduleEl =
      (form && form.querySelector('[name="scheduleType"]')) ||
      document.getElementById("modal-schedule-type");
    const intervalEl = form && form.querySelector('[name="intervalDays"]');
    const iconEl =
      (form && form.querySelector('[name="icon"]')) ||
      document.getElementById("modal-habit-icon");
    const colorEl =
      (form && form.querySelector('input[name="modal-color"]:checked')) ||
      document.getElementById("modal-habit-color");
    const reminderEl =
      (form && form.querySelector('[name="reminderTime"]')) ||
      document.getElementById("modal-reminder-time");

    const scheduleDays = [];
    if (form) {
      form
        .querySelectorAll('input[name="modal-schedule-day"]:checked')
        .forEach((cb) => {
          scheduleDays.push(parseInt(cb.value, 10));
        });
    }

    const habitData = {
      id: habitId || `h-${Date.now()}`,
      name: name,
      type: type,
      targetValue: targetValEl ? parseFloat(targetValEl.value) || 1 : 1,
      unit: unitEl ? unitEl.value.trim() : "",
      step: stepEl ? parseFloat(stepEl.value) || 1 : 1,
      routine: routineEl ? routineEl.value : "morning",
      scheduleType: scheduleEl ? scheduleEl.value : "daily",
      scheduleDays:
        scheduleDays.length > 0 ? scheduleDays : [0, 1, 2, 3, 4, 5, 6],
      intervalDays: intervalEl ? parseInt(intervalEl.value, 10) || 1 : 1,
      icon: iconEl ? iconEl.value.trim() || "🎯" : "🎯",
      color: colorEl ? colorEl.value : "emerald",
      reminderTime: reminderEl ? reminderEl.value : "",
    };

    if (habitId) {
      await store.updateHabit(habitId, habitData);
      showToast("Đã cập nhật thói quen!", "success");
    } else {
      await store.addHabit(habitData);
      showToast("Đã thêm thói quen mới!", "success");
    }

    closeHabitModal();
  }

  /**
   * Toast notification helper with optional interactive action button (e.g. Undo)
   */
  function showToast(message, type = "info", action = null) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    const bg =
      type === "success"
        ? "bg-emerald-600 text-white"
        : type === "error"
          ? "bg-red-600 text-white"
          : "bg-slate-800 text-slate-200";

    toast.className = `px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold ${bg} transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center justify-between gap-3`;
    toast.textContent = message;

    let actionBtnHtml = "";
    if (action && action.label) {
      const actionAttr = action.dataAction || "undo-toast";
      actionBtnHtml = `<button type="button" data-action="${actionAttr}" class="px-2.5 py-1 text-xs font-bold bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-lg transition">${action.label}</button>`;
    }

    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span>
        <span>${message}</span>
      </div>
      ${actionBtnHtml}
    `;

    container.appendChild(toast);
    const raf =
      typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame
        : (fn) => setTimeout(fn, 16);
    raf(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
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
    get store() {
      return store;
    },
    showToast,
    undoLastAction,
    switchTab(tab) {
      activeTab = tab;
      renderApp();
    },
    switchLanguage(lang) {
      if (store) {
        store.updateSettings({ language: lang });
      }
      renderApp();
    },
    switchTheme(theme) {
      applyTheme(theme);
      if (store) {
        store.updateSettings({ theme });
      }
    },
    addFreezeTokens(count) {
      const current =
        (store.getSettings() && store.getSettings().freezeTokens) || 0;
      store.updateSettings({ freezeTokens: current + count });
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_freeze_token_added", { count }, lang), "success");
    },
    toggleVacationMode() {
      const current =
        (store.getSettings() && store.getSettings().vacationRanges) || [];
      const today = store.getActiveDate();
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      if (current.length > 0) {
        store.updateSettings({ vacationRanges: [] });
        notify(i18n.t("toast_vacation_disabled", {}, lang), "info");
      } else {
        store.updateSettings({
          vacationRanges: [{ start: today, end: "2099-12-31" }],
        });
        notify(i18n.t("toast_vacation_enabled", {}, lang), "info");
      }
    },
    exportDataJSON() {
      if (!store) return;
      exportImport.downloadExportJSON(store.state);
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_backup_exported", {}, lang), "success");
    },
    async importDataJSON(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      try {
        const text = await file.text();
        const res = exportImport.parseAndValidateImport(text);
        if (!res.valid) {
          notify(
            i18n.t(
              "toast_import_file_error",
              { errors: res.errors.join(", ") },
              lang
            ),
            "error"
          );
          return;
        }
        const merged = exportImport.mergeHabitStates(
          store.state,
          res.data,
          "merge"
        );
        await store.replaceState(merged);
        notify(i18n.t("toast_import_success", {}, lang), "success");
      } catch (err) {
        notify(
          i18n.t("toast_import_error", { message: err.message }, lang),
          "error"
        );
      }
    },
    promptDriveBackup() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_drive_auth_required", {}, lang), "info");
    },
    promptGistBackup() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_gist_pat_required", {}, lang), "info");
    },
    checkForUpdates() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.update();
            notify(i18n.t("toast_update_checked", {}, lang), "info");
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
    handleOpenDetailSheet,
    openDetailSheet: handleOpenDetailSheet,
    handleOpenEditModal,
    openEditModal: handleOpenEditModal,
    openAddHabitModal: () => handleOpenEditModal(null),
    closeHabitModal,
    saveHabitFromModal,
    handleArchiveHabit: async (id) => {
      await store.archiveHabit(id);
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_habit_archived", {}, lang), "info");
    },
    handleRestoreHabit: async (id) => {
      await store.restoreHabit(id);
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_habit_restored", {}, lang), "success");
    },
    handleDeleteHabit: async (id) => {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      if (
        typeof window !== "undefined" &&
        window.confirm &&
        !window.confirm(i18n.t("delete_confirm_msg", {}, lang))
      ) {
        return;
      }
      await store.deleteHabit(id);
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_habit_deleted", {}, lang), "info");
    },
    handleReorderHabit: async (habitId, routine, direction) => {
      if (!store || !habitId) return;
      const targetRoutine =
        routine ||
        (store.getHabit(habitId)
          ? store.getHabit(habitId).routine
          : "anytime") ||
        "anytime";
      const habits = store
        .getHabits(false)
        .filter((h) => (h.routine || "anytime") === targetRoutine)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const currentIndex = habits.findIndex((h) => h.id === habitId);
      if (currentIndex === -1) return;

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= habits.length) return;

      const orderedIds = habits.map((h) => h.id);
      const temp = orderedIds[currentIndex];
      orderedIds[currentIndex] = orderedIds[targetIndex];
      orderedIds[targetIndex] = temp;

      await store.reorderHabits(targetRoutine, orderedIds);
      renderActiveTab();
    },
    handleSaveNotes: async (habitId, date, notes) => {
      await store.updateNotes(habitId, date, notes);
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_notes_saved", {}, lang), "success");
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
