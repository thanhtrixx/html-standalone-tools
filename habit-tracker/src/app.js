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

  const timelineView =
    typeof require !== "undefined"
      ? require("./ui/timeline-view.js")
      : global.HabitTimelineView;

  const managerView =
    typeof require !== "undefined"
      ? require("./ui/manager-view.js")
      : global.HabitManagerView;

  const identityView =
    typeof require !== "undefined"
      ? require("./ui/identity-view.js")
      : global.HabitIdentityView;

  const detailSheet =
    typeof require !== "undefined"
      ? require("./ui/detail-sheet.js")
      : global.HabitDetailSheet;

  const insightsView =
    typeof require !== "undefined"
      ? require("./ui/insights-view.js")
      : global.HabitInsightsView;

  const matrixView =
    typeof require !== "undefined"
      ? require("./ui/matrix-view.js")
      : global.HabitMatrixView;

  const notifications =
    typeof require !== "undefined"
      ? require("./pwa/notifications.js")
      : global.HabitNotifications;

  // Application State
  const APP_TABS = ["today", "insights", "manager", "settings"];
  let store = null;
  let activeTab = "today"; // 'today' | 'insights' | 'manager' | 'settings'
  let lastBackPressTime = 0;
  let timerInterval = null;
  let timerWorker = null;
  let runningTimerHabitId = null;
  let runningTimerDate = null;
  let runningTimerStartedAt = null;
  let runningTimerBaseValue = 0;
  let runningTimerTickCount = 0;
  let pendingDeleteHabitId = null;
  let swipeStartX = 0;
  let swipeStartY = 0;

  /**
   * Pushes history state for navigation
   */
  function pushNavigationState(tab, overlay = null) {
    if (typeof history !== "undefined" && history.pushState) {
      try {
        history.pushState(
          { app: "habit-tracker", tab: tab || activeTab, overlay },
          ""
        );
      } catch (_) {}
    }
  }

  /**
   * Replaces history state for navigation
   */
  function replaceNavigationState(tab, overlay = null) {
    if (typeof history !== "undefined" && history.replaceState) {
      try {
        history.replaceState(
          { app: "habit-tracker", tab: tab || activeTab, overlay },
          ""
        );
      } catch (_) {}
    }
  }

  /**
   * Handles browser / hardware back button navigation with tiered hierarchy
   */
  function handlePopState(e) {
    const editModal = document.getElementById("habit-edit-modal-overlay");
    const detailSheetEl = document.getElementById("detail-sheet-overlay");
    const deleteModal = document.getElementById("delete-confirm-modal-overlay");
    const resetModal = document.getElementById("reset-confirm-modal-overlay");

    const isEditOpen = editModal && !editModal.classList.contains("hidden");
    const isDetailOpen =
      detailSheetEl && !detailSheetEl.classList.contains("hidden");
    const isDeleteOpen =
      deleteModal && !deleteModal.classList.contains("hidden");
    const isResetOpen = resetModal && !resetModal.classList.contains("hidden");

    // Tier 1: Dismiss active overlays
    if (isEditOpen || isDetailOpen || isDeleteOpen || isResetOpen) {
      if (isEditOpen) closeHabitModal();
      if (isDetailOpen) closeDetailSheet();
      if (isDeleteOpen) closeDeleteModal();
      if (isResetOpen) closeResetModal();
      return;
    }

    // Tier 2: If on secondary tab -> return to Today tab
    if (activeTab !== "today") {
      activeTab = "today";
      renderApp();
      return;
    }

    // Tier 3: On Today root -> 2s double-back exit confirmation
    const now = Date.now();
    if (lastBackPressTime && now - lastBackPressTime < 2000) {
      // Allow default browser back / exit
      lastBackPressTime = 0;
      return;
    }

    // First back press on root Today view -> show exit warning toast & push state to keep page active
    lastBackPressTime = now;
    pushNavigationState("today");
    const lang = (store && store.getSettings().language) || "vi";
    const notify =
      (typeof window !== "undefined" &&
        window.HabitApp &&
        window.HabitApp.showToast) ||
      (typeof globalThis !== "undefined" &&
        globalThis.HabitApp &&
        globalThis.HabitApp.showToast) ||
      (typeof HabitApp !== "undefined" && HabitApp && HabitApp.showToast) ||
      showToast;
    notify(i18n.t("toast_press_back_again", {}, lang), "info");
  }

  /**
   * Setup container horizontal swipe gesture detector
   */
  function setupTabSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let isEligible = false;

    document.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches || !e.touches[0]) return;
        const target = e.target;

        // Skip if touch starts on habit cards, date ribbon, form inputs, buttons, sliders, or overlays
        const skipSelectors = [
          ".habit-card",
          "#date-ribbon",
          "input",
          "textarea",
          "select",
          "button",
          "canvas",
          "#habit-edit-modal-overlay",
          "#detail-sheet-overlay",
          "#delete-confirm-modal-overlay",
        ];
        const isExcluded = skipSelectors.some(
          (sel) => target && target.closest && target.closest(sel)
        );
        if (isExcluded) {
          isEligible = false;
          return;
        }

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isEligible = true;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      (e) => {
        if (!isEligible) return;
        isEligible = false;

        const touch =
          (e.changedTouches && e.changedTouches[0]) ||
          (e.touches && e.touches[0]);
        if (!touch) return;

        const endX = touch.clientX;
        const endY = touch.clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Horizontal swipe threshold: distance >= 50px, horizontal dominant
        if (Math.abs(diffX) >= 50 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
          const currentIdx = APP_TABS.indexOf(activeTab);
          if (diffX < 0) {
            // Swipe Left -> next tab
            if (currentIdx < APP_TABS.length - 1) {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try {
                  navigator.vibrate(10);
                } catch (_) {}
              }
              const app =
                (typeof window !== "undefined" && window.HabitApp) || HabitApp;
              if (app && typeof app.switchTab === "function") {
                app.switchTab(APP_TABS[currentIdx + 1]);
              } else {
                activeTab = APP_TABS[currentIdx + 1];
                renderApp();
              }
            }
          } else {
            // Swipe Right -> prev tab
            if (currentIdx > 0) {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try {
                  navigator.vibrate(10);
                } catch (_) {}
              }
              const app =
                (typeof window !== "undefined" && window.HabitApp) || HabitApp;
              if (app && typeof app.switchTab === "function") {
                app.switchTab(APP_TABS[currentIdx - 1]);
              } else {
                activeTab = APP_TABS[currentIdx - 1];
                renderApp();
              }
            }
          }
        }
      },
      { passive: true }
    );
  }

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

    // Replace root history state
    replaceNavigationState(activeTab);

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
    const settings = store
      ? store.getSettings()
      : { language: "vi", freezeTokens: 2 };
    const lang = (settings && settings.language) || "vi";
    const freezeTokensEl = document.getElementById("freeze-tokens-count");
    if (freezeTokensEl) {
      freezeTokensEl.textContent = (settings && settings.freezeTokens) ?? 2;
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
    updateLensSwitcher();
    updateAmbientTimerPill();
  }

  /**
   * Updates the active state of top lens switcher buttons
   */
  function updateLensSwitcher() {
    const settings = store ? store.getSettings() : { language: "vi" };
    const lang = (settings && settings.language) || "vi";
    const lensButtons = document.querySelectorAll(".lens-tab-btn");

    // Mapping between activeTab and lens ID
    const tabToLensMap = {
      today: "today",
      timeline: "timeline",
      matrix: "matrix",
      insights: "matrix",
      identity: "identity",
      manager: "identity",
    };
    const currentLens = tabToLensMap[activeTab] || "today";

    lensButtons.forEach((btn) => {
      const lens = btn.getAttribute("data-lens");
      const isActive = lens === currentLens;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");

      if (isActive) {
        btn.className =
          "lens-tab-btn flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-200 active:scale-95 bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20";
      } else {
        btn.className =
          "lens-tab-btn flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-200 active:scale-95 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium";
      }

      if (lens) {
        const labelEl =
          btn.querySelector && typeof btn.querySelector === "function"
            ? btn.querySelector(".lens-label")
            : null;
        if (labelEl) {
          labelEl.textContent = i18n.t(`lens_${lens}`, {}, lang);
        }
      }
    });
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
      const dot =
        (btn.querySelector && btn.querySelector(".nav-dot")) ||
        document.getElementById(`nav-dot-${tab}`);
      const isActive = tab === activeTab;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) {
        btn.className =
          "nav-tab-btn flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-emerald-500/30 shadow-sm";
        if (dot) {
          dot.className =
            "nav-dot w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-100 scale-100 transition-all";
        }
      } else {
        btn.className =
          "nav-tab-btn flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium";
        if (dot) {
          dot.className =
            "nav-dot w-1.5 h-1.5 rounded-full bg-transparent opacity-0 scale-0 transition-all";
        }
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
    } else if (activeTab === "timeline") {
      timelineView.renderTimelineView(store, container, lang);
      bindHabitCardGestures();
    } else if (activeTab === "insights" || activeTab === "matrix") {
      const renderFn =
        (matrixView && matrixView.renderMatrixView) ||
        (insightsView && insightsView.renderInsightsView);
      renderFn(store, container, lang);
      bindHeatmapInteractions();
    } else if (activeTab === "manager" || activeTab === "identity") {
      const renderFn =
        (identityView && identityView.renderIdentityView) ||
        (managerView && managerView.renderManagerView);
      renderFn(store, container, lang);
    } else if (activeTab === "settings") {
      renderSettingsTab(container, lang);
    }

    updateAmbientTimerPill();
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

    const notifPermission =
      notifications && notifications.getPermission
        ? notifications.getPermission()
        : "default";
    let notifBadge = "";
    if (notifPermission === "granted") {
      notifBadge = `<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800/50">🟢 ${i18n.t("perm_granted", {}, lang)}</span>`;
    } else if (notifPermission === "denied") {
      notifBadge = `<span class="text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold border border-red-300 dark:border-red-800/50">🔴 ${i18n.t("perm_denied", {}, lang)}</span>`;
    } else {
      notifBadge = `<span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">⚪ ${i18n.t("perm_default", {}, lang)}</span>`;
    }

    let notifActionBtn = "";
    if (notifPermission === "granted") {
      notifActionBtn = `
        <button id="btn-test-notification" onclick="window.HabitApp.testNotification()" class="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-all flex items-center justify-center gap-2">
          <span>🚀</span>
          <span>${i18n.t("send_test_notification_btn", {}, lang)}</span>
        </button>
      `;
    } else if (notifPermission === "denied") {
      notifActionBtn = `
        <p class="text-[11px] text-amber-600 dark:text-amber-400 text-center">${i18n.t("toast_notifications_blocked", {}, lang)}</p>
      `;
    } else {
      notifActionBtn = `
        <button id="btn-enable-notifications" onclick="window.HabitApp.requestNotificationPermission()" class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
          <span>🔔</span>
          <span>${i18n.t("enable_notifications_btn", {}, lang)}</span>
        </button>
      `;
    }

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

        <!-- Daily Reminders & Notifications Card -->
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">🔔 ${i18n.t("reminders_notifications_title", {}, lang)}</h3>
            ${notifBadge}
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">${i18n.t("reminders_notifications_desc", {}, lang)}</p>
          ${notifActionBtn}
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

          <div class="grid grid-cols-3 gap-2 mb-4">
            <button id="btn-export-json" data-action="export-json" onclick="window.HabitApp.exportDataJSON()" class="flex items-center justify-center gap-1 py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer">
              <span>📥</span>
              <span class="truncate">JSON</span>
            </button>
            <button id="btn-export-csv" data-action="export-csv" onclick="window.HabitApp.exportDataCSV()" class="flex items-center justify-center gap-1 py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer">
              <span>📊</span>
              <span class="truncate">CSV</span>
            </button>
            <label class="flex items-center justify-center gap-1 py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700/50 cursor-pointer transition-all">
              <span>📤</span>
              <span class="truncate">Import</span>
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

        <!-- Data Hygiene & Vault Reset Card -->
        <div id="settings-data-vault" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">🧹 ${i18n.t("data_vault_title", {}, lang)}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">${i18n.t("data_vault_desc", {}, lang)}</p>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/40 gap-3">
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white">${i18n.t("reset_defaults_btn", {}, lang)}</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">${i18n.t("reset_defaults_desc", {}, lang)}</p>
              </div>
              <button
                type="button"
                id="btn-reset-defaults"
                data-action="prompt-reset-defaults"
                onclick="window.HabitApp.promptResetDefaults()"
                class="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                ${i18n.t("reset_confirm_btn", {}, lang)}
              </button>
            </div>

            <div class="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 gap-3">
              <div>
                <h4 class="text-xs font-bold text-rose-600 dark:text-rose-400">${i18n.t("factory_wipe_btn", {}, lang)}</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">${i18n.t("factory_wipe_desc", {}, lang)}</p>
              </div>
              <button
                type="button"
                id="btn-factory-wipe"
                data-action="prompt-factory-wipe"
                onclick="window.HabitApp.promptFactoryWipe()"
                class="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                ${i18n.t("factory_wipe_confirm_btn", {}, lang)}
              </button>
            </div>
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
   * Binds swipe gesture handlers to habit cards with spring resistance
   */
  function bindHabitCardGestures() {
    const cards = document.querySelectorAll(".habit-card");
    cards.forEach((card) => {
      const habitId =
        card.getAttribute("data-habit-id") ||
        card.getAttribute("data-habit-card");
      if (!habitId) return;

      const revealZone =
        card.querySelector(".swipe-reveal-complete") ||
        card.querySelector("[data-swipe-reveal]");

      let startX = 0;
      let startY = 0;
      let isDragging = false;

      card.addEventListener(
        "touchstart",
        (e) => {
          if (!e.touches || !e.touches[0]) return;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          isDragging = true;
          card.style.transition = "none";
        },
        { passive: true }
      );

      card.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging || !e.touches || !e.touches[0]) return;
          const currentX = e.touches[0].clientX;
          const currentY = e.touches[0].clientY;
          const deltaX = currentX - startX;
          const deltaY = currentY - startY;

          // Vertical scroll protection: if vertical movement is dominant, keep neutral
          if (Math.abs(deltaY) > Math.abs(deltaX)) {
            card.style.transform = "translateX(0px)";
            if (revealZone) {
              revealZone.style.opacity = "0";
              revealZone.style.transform = "translateX(-100%)";
            }
            return;
          }

          if (e.cancelable && e.preventDefault) {
            e.preventDefault();
          }

          if (deltaX > 0) {
            // Apply spring damping resistance: linear below 80px, progressive damping above 80px
            const tx =
              deltaX <= 80 ? deltaX * 0.85 : 68 + Math.pow(deltaX - 80, 0.7);
            card.style.transform = `translateX(${tx}px)`;
            if (revealZone) {
              const opacity = Math.min(1, tx / 60);
              revealZone.style.opacity = String(opacity);
              revealZone.style.transform = `translateX(${Math.min(
                0,
                -100 + (tx / 80) * 100
              )}%)`;
            }
          } else {
            // Leftward drag resistance
            const tx = -Math.min(40, Math.abs(deltaX) * 0.4);
            card.style.transform = `translateX(${tx}px)`;
            if (revealZone) {
              revealZone.style.opacity = "0";
              revealZone.style.transform = "translateX(-100%)";
            }
          }
        },
        { passive: false }
      );

      card.addEventListener("touchend", async (e) => {
        if (!isDragging) return;
        isDragging = false;
        card.style.transition = "";
        card.style.transform = "";
        if (revealZone) {
          revealZone.style.opacity = "";
          revealZone.style.transform = "";
        }

        const endX =
          e.changedTouches && e.changedTouches[0]
            ? e.changedTouches[0].clientX
            : startX;
        const endY =
          e.changedTouches && e.changedTouches[0]
            ? e.changedTouches[0].clientY
            : startY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Ensure mostly horizontal swipe with threshold >= 80px
        if (Math.abs(diffX) >= 80 && Math.abs(diffX) > Math.abs(diffY)) {
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
      } else if (action === "reset-timer") {
        await handleResetTimer(habitId, activeDate);
      } else if (action === "open-detail") {
        handleOpenDetailSheet(habitId);
      } else if (action === "close-detail-sheet") {
        closeDetailSheet();
      } else if (action === "select-detail-date") {
        const date = target.getAttribute("data-date");
        const hId = target.getAttribute("data-habit-id") || habitId;
        if (hId && date) {
          const habit = store.getHabit(hId);
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
      } else if (action === "cancel-delete") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.closeDeleteModal === "function") {
          app.closeDeleteModal();
        } else {
          closeDeleteModal();
        }
      } else if (action === "confirm-delete") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.confirmDeleteHabit === "function") {
          await app.confirmDeleteHabit();
        } else {
          await confirmDeleteHabit();
        }
      } else if (action === "prompt-reset-defaults") {
        promptResetDefaults();
      } else if (action === "prompt-factory-wipe") {
        promptFactoryWipe();
      } else if (action === "cancel-reset") {
        closeResetModal();
      } else if (action === "confirm-reset-defaults") {
        await confirmResetDefaults();
      } else if (action === "confirm-factory-wipe") {
        await confirmFactoryWipe();
      } else if (action === "jump-to-timer") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.jumpToRunningTimer === "function") {
          await app.jumpToRunningTimer();
        } else {
          jumpToRunningTimer();
        }
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
          updateHabitModalPreview();
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
      } else if (action === "apply-starter-kit") {
        const kitId = target.getAttribute("data-kit-id");
        if (kitId) {
          const app =
            (typeof window !== "undefined" && window.HabitApp) || HabitApp;
          if (app && typeof app.applyStarterKit === "function") {
            await app.applyStarterKit(kitId);
          } else if (store) {
            const lang =
              (store.getSettings() && store.getSettings().language) || "vi";
            await store.applyStarterKit(kitId, lang);
            showToast(i18n.t("starter_kit_applied_toast", {}, lang), "success");
            renderApp();
          }
        }
      } else if (action === "export-json") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        await app.exportDataJSON();
      } else if (action === "export-csv") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        await app.exportDataCSV();
      }
    });

    // Delegated input listener for modal live preview
    document.addEventListener("input", (e) => {
      const target = e.target;
      if (!target) return;
      if (
        target.id === "modal-habit-name" ||
        target.id === "modal-habit-icon" ||
        target.id === "modal-target-value" ||
        target.id === "modal-target-unit" ||
        target.id === "modal-habit-unit"
      ) {
        updateHabitModalPreview();
      }
    });

    // Delegated change listener for form components
    document.addEventListener("change", (e) => {
      const target = e.target;
      if (!target) return;

      // Routine chip toggle styling
      if (target.name === "routines") {
        const label = target.closest("label.routine-chip");
        if (label) {
          if (target.checked) {
            label.className =
              "routine-chip flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer text-xs transition select-none bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold";
          } else {
            label.className =
              "routine-chip flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer text-xs transition select-none bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
          }
        }
        updateHabitModalPreview();
      }

      // Color picker change
      if (target.name === "modal-color") {
        updateHabitModalPreview();
      }

      // Measurement type change & segmented styling
      if (target.name === "type") {
        const targetFields = document.getElementById("modal-target-fields");
        if (targetFields) {
          if (target.value === "binary") {
            targetFields.classList.add("hidden");
          } else {
            targetFields.classList.remove("hidden");
          }
        }
        const segmentedLabels = document.querySelectorAll(
          "#segmented-type-picker .segmented-type-option"
        );
        segmentedLabels.forEach((lbl) => {
          const radio = lbl.querySelector('input[type="radio"]');
          if (radio && radio.checked) {
            lbl.className =
              "segmented-type-option flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold transition select-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600";
          } else {
            lbl.className =
              "segmented-type-option flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl cursor-pointer text-xs font-semibold transition select-none text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
          }
        });
        updateHabitModalPreview();
      }

      // Schedule type change
      if (target.name === "scheduleType") {
        const specificDays = document.getElementById(
          "modal-specific-days-container"
        );
        const intervalCont = document.getElementById(
          "modal-interval-container"
        );
        if (specificDays) {
          if (target.value === "specific_days") {
            specificDays.classList.remove("hidden");
          } else {
            specificDays.classList.add("hidden");
          }
        }
        if (intervalCont) {
          if (target.value === "interval") {
            intervalCont.classList.remove("hidden");
          } else {
            intervalCont.classList.add("hidden");
          }
        }
      }
    });

    // Page visibility & focus listeners for background timer delta synchronization
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        syncRunningTimer();
      }
    });
    window.addEventListener("focus", () => {
      syncRunningTimer();
    });

    // Tab swipe gestures & hardware back button popstate listener
    setupTabSwipeGestures();
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("popstate", (e) => {
        handlePopState(e);
      });
    }
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
   * Refreshes Habit Detail Bottom Sheet if currently active/open for specified habit
   */
  function refreshDetailSheetIfOpen(habitId, date) {
    const sheetOverlay = document.getElementById("detail-sheet-overlay");
    const sheetContainer = document.getElementById("detail-sheet-container");
    if (
      sheetOverlay &&
      !sheetOverlay.classList.contains("hidden") &&
      sheetContainer
    ) {
      const habit = store.getHabit(habitId);
      if (habit) {
        const lang =
          (store.getSettings() && store.getSettings().language) || "vi";
        detailSheet.renderDetailSheet(
          habit,
          store,
          sheetContainer,
          lang,
          date || store.getActiveDate()
        );
      }
    }
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
    refreshDetailSheetIfOpen(habitId, date);

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
    refreshDetailSheetIfOpen(habitId, date);

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
    refreshDetailSheetIfOpen(habitId, date);

    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_habit_incremented", {}, lang), "info", {
      label: i18n.t("undo", {}, lang),
      dataAction: "undo-toast",
    });
  }

  /**
   * Updates ambient running timer pills in header and dock
   */
  function updateAmbientTimerPill() {
    const headerPill = document.getElementById("header-active-timer-pill");
    const dockPill = document.getElementById("dock-active-timer-pill");

    if (!runningTimerHabitId || !store) {
      if (headerPill) headerPill.classList.add("hidden");
      if (dockPill) dockPill.classList.add("hidden");
      return;
    }

    const habit = store.getHabit(runningTimerHabitId);
    const date = runningTimerDate || store.getActiveDate();
    const log = (store.state &&
      store.state.logs &&
      store.state.logs[`${runningTimerHabitId}_${date}`]) || { value: 0 };
    const totalSecs = Math.max(0, log.value || 0);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const s = String(totalSecs % 60).padStart(2, "0");
    const tickerStr = `${m}:${s}`;
    const icon = habit ? habit.icon || "⏱️" : "⏱️";
    const name = habit ? habit.name : "";

    if (headerPill) {
      headerPill.classList.remove("hidden");
      headerPill.className =
        "items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm tabular-nums font-mono animate-pulse cursor-pointer hover:bg-emerald-500/20 flex";
      headerPill.innerHTML = `<span>${icon}</span> <span class="tabular-nums font-mono max-w-[100px] truncate hidden sm:inline">${name}</span> <span id="header-timer-ticker" class="tabular-nums font-mono font-bold">${tickerStr}</span>`;
    }
    if (dockPill) {
      dockPill.classList.remove("hidden");
      dockPill.className =
        "items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm tabular-nums font-mono animate-pulse cursor-pointer hover:bg-emerald-500/20 flex";
      dockPill.innerHTML = `<span>${icon}</span> <span class="tabular-nums font-mono font-bold">${tickerStr}</span>`;
    }
  }

  /**
   * Jumps to running timer view (switches to 'today' tab and restores active date)
   */
  async function jumpToRunningTimer() {
    if (!runningTimerHabitId || !store) return;
    if (runningTimerDate) {
      store.setActiveDate(runningTimerDate);
    }
    activeTab = "today";
    renderApp();
  }

  /**
   * Plays a harmonic audio chime when a timer habit completes
   */
  function playTimerCompletionSound() {
    try {
      const AudioCtx =
        typeof window !== "undefined" &&
        (window.AudioContext || window.webkitAudioContext);
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }

  /**
   * Synchronizes active timer value with exact elapsed timestamp delta
   */
  async function syncRunningTimer(isIntervalTick = false) {
    if (!runningTimerHabitId || !runningTimerStartedAt || !store) return;
    const habit = store.getHabit(runningTimerHabitId);
    if (!habit) return;

    if (isIntervalTick) {
      runningTimerTickCount++;
    }

    const targetDate = runningTimerDate || store.getActiveDate();
    const timeElapsed = Math.max(
      0,
      Math.floor((Date.now() - runningTimerStartedAt) / 1000)
    );
    const elapsedSecs = Math.max(runningTimerTickCount, timeElapsed);
    runningTimerTickCount = elapsedSecs;
    const nextSeconds = runningTimerBaseValue + elapsedSecs;

    await store.logHabit(runningTimerHabitId, targetDate, nextSeconds);
    updateAmbientTimerPill();

    // Auto stop if target reached
    if (nextSeconds >= habit.targetValue) {
      stopTimerTicker();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      updateAmbientTimerPill();
      renderActiveTab();
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      showToast(
        `🎉 ${i18n.t("timer_completed", {}, lang)} (${habit.name})`,
        "success"
      );
      playTimerCompletionSound();
    }
  }

  /**
   * Starts background timer ticker using Web Worker (or setInterval fallback)
   */
  function startTimerTicker() {
    stopTimerTicker();
    try {
      if (
        typeof Worker !== "undefined" &&
        typeof Blob !== "undefined" &&
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
      ) {
        const blob = new Blob(
          ["setInterval(function() { postMessage('tick'); }, 1000);"],
          { type: "application/javascript" }
        );
        const workerUrl = URL.createObjectURL(blob);
        timerWorker = new Worker(workerUrl);
        timerWorker.onmessage = () => {
          syncRunningTimer(true);
        };
        return;
      }
    } catch (_) {}

    timerInterval = setInterval(() => {
      syncRunningTimer(true);
    }, 1000);
  }

  /**
   * Stops timer ticker interval and worker
   */
  function stopTimerTicker() {
    if (timerWorker) {
      try {
        timerWorker.terminate();
      } catch (_) {}
      timerWorker = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * Habit Timer Toggle
   */
  async function handleToggleTimer(habitId, date) {
    const habit = store.getHabit(habitId);
    if (!habit) return;
    const targetDate = date || store.getActiveDate();

    if (runningTimerHabitId === habitId) {
      // Stop Timer
      await syncRunningTimer();
      stopTimerTicker();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      updateAmbientTimerPill();
      renderActiveTab();
      refreshDetailSheetIfOpen(habitId, targetDate);
      return;
    }

    if (runningTimerHabitId) {
      await syncRunningTimer();
      stopTimerTicker();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
    }

    const currentLog = (store.state &&
      store.state.logs &&
      store.state.logs[`${habitId}_${targetDate}`]) || { value: 0 };

    runningTimerHabitId = habitId;
    runningTimerDate = targetDate;
    runningTimerStartedAt = Date.now();
    runningTimerBaseValue = currentLog.value || 0;
    runningTimerTickCount = 0;

    updateAmbientTimerPill();
    startTimerTicker();
    renderActiveTab();
    refreshDetailSheetIfOpen(habitId, targetDate);
  }

  /**
   * Resets active timer progress to 0 for specified habit and date
   */
  async function handleResetTimer(habitId, date) {
    if (!store || !habitId) return;
    const targetDate = date || store.getActiveDate();

    if (runningTimerHabitId === habitId) {
      stopTimerTicker();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      updateAmbientTimerPill();
    }

    await store.logHabit(habitId, targetDate, 0);
    renderActiveTab();
    refreshDetailSheetIfOpen(habitId, targetDate);

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_timer_reset", {}, lang), "info");
  }

  /**
   * Prompts user with accessible delete confirmation alertdialog modal
   */
  async function promptDeleteHabit(habitId) {
    if (!store || !habitId) return;
    pendingDeleteHabitId = habitId;
    const habit = store.getHabit(habitId);
    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    const habitName = habit ? habit.name : habitId;

    const overlay = document.getElementById("delete-confirm-modal-overlay");
    const container = document.getElementById("delete-modal-container");

    const modalHtml = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-desc">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold">
            🗑️
          </div>
          <div>
            <h3 id="delete-dialog-title" class="text-base font-bold text-slate-900 dark:text-white">
              ${i18n.t("delete_confirm_title", {}, lang)}
            </h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">${habit ? (habit.icon || "🎯") + " " + habit.name : ""}</span>
          </div>
        </div>

        <p id="delete-dialog-desc" class="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          ${i18n.t("delete_confirm_desc", { name: habitName }, lang)}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            data-action="cancel-delete"
            class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            ${i18n.t("delete_cancel_btn", {}, lang)}
          </button>
          <button
            type="button"
            data-action="confirm-delete"
            data-habit-id="${habitId}"
            class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 transition-all active:scale-95 cursor-pointer"
          >
            ${i18n.t("delete_confirm_btn", {}, lang)}
          </button>
        </div>
      </div>
    `;

    if (container) {
      container.innerHTML = modalHtml;
    }
    if (overlay) {
      overlay.innerHTML = `<div id="delete-modal-container" class="w-full max-w-sm my-auto">${modalHtml}</div>`;
      overlay.classList.remove("hidden");
    }
    pushNavigationState(activeTab, "delete");
  }

  /**
   * Prompts user with accessible sample reset confirmation modal
   */
  function promptResetDefaults() {
    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    const overlay = document.getElementById("reset-confirm-modal-overlay");
    const container = document.getElementById("reset-modal-container");

    const modalHtml = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white" role="alertdialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-desc">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
            🔄
          </div>
          <div>
            <h3 id="reset-dialog-title" class="text-base font-bold text-slate-900 dark:text-white">
              ${i18n.t("reset_confirm_title", {}, lang)}
            </h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">Atomic Habits</span>
          </div>
        </div>

        <p id="reset-dialog-desc" class="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          ${i18n.t("reset_confirm_desc", {}, lang)}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            data-action="cancel-reset"
            class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            ${i18n.t("cancel", {}, lang)}
          </button>
          <button
            type="button"
            data-action="confirm-reset-defaults"
            class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
          >
            ${i18n.t("reset_confirm_btn", {}, lang)}
          </button>
        </div>
      </div>
    `;

    if (container) {
      container.innerHTML = modalHtml;
    }
    if (overlay) {
      overlay.innerHTML = `<div id="reset-modal-container" class="w-full max-w-sm my-auto">${modalHtml}</div>`;
      overlay.classList.remove("hidden");
    }
    pushNavigationState(activeTab, "reset");
  }

  /**
   * Prompts user with accessible complete factory wipe confirmation modal
   */
  function promptFactoryWipe() {
    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    const overlay = document.getElementById("reset-confirm-modal-overlay");
    const container = document.getElementById("reset-modal-container");

    const modalHtml = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white" role="alertdialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-desc">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 id="reset-dialog-title" class="text-base font-bold text-rose-600 dark:text-rose-400">
              ${i18n.t("factory_wipe_confirm_title", {}, lang)}
            </h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">Factory Wipe</span>
          </div>
        </div>

        <p id="reset-dialog-desc" class="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-medium">
          ${i18n.t("factory_wipe_confirm_desc", {}, lang)}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            data-action="cancel-reset"
            class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            ${i18n.t("cancel", {}, lang)}
          </button>
          <button
            type="button"
            data-action="confirm-factory-wipe"
            class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 transition-all active:scale-95 cursor-pointer"
          >
            ${i18n.t("factory_wipe_confirm_btn", {}, lang)}
          </button>
        </div>
      </div>
    `;

    if (container) {
      container.innerHTML = modalHtml;
    }
    if (overlay) {
      overlay.innerHTML = `<div id="reset-modal-container" class="w-full max-w-sm my-auto">${modalHtml}</div>`;
      overlay.classList.remove("hidden");
    }
    pushNavigationState(activeTab, "reset");
  }

  /**
   * Closes data vault reset confirmation modal
   */
  function closeResetModal() {
    const overlay = document.getElementById("reset-confirm-modal-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  /**
   * Confirms reset to starter default habits
   */
  async function confirmResetDefaults() {
    if (!store) return;
    if (runningTimerHabitId) {
      stopTimerTicker();
      runningTimerHabitId = null;
      runningTimerDate = null;
      updateAmbientTimerPill();
    }

    await store.resetToDefaults();
    await seedDefaultHabits();
    closeResetModal();

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_reset_defaults_success", {}, lang), "success");
    renderApp();
  }

  /**
   * Confirms complete factory wipe
   */
  async function confirmFactoryWipe() {
    if (!store) return;
    if (runningTimerHabitId) {
      stopTimerTicker();
      runningTimerHabitId = null;
      runningTimerDate = null;
      updateAmbientTimerPill();
    }

    await store.factoryWipe();
    closeResetModal();

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_factory_wipe_success", {}, lang), "info");
    renderApp();
  }

  /**
   * Closes delete confirmation modal
   */
  function closeDeleteModal() {
    pendingDeleteHabitId = null;
    const overlay = document.getElementById("delete-confirm-modal-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  /**
   * Confirms habit deletion and purges historical check-in logs
   */
  async function confirmDeleteHabit() {
    if (!store || !pendingDeleteHabitId) return;
    const habitId = pendingDeleteHabitId;

    if (runningTimerHabitId === habitId) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      runningTimerHabitId = null;
      runningTimerDate = null;
      updateAmbientTimerPill();
    }

    await store.deleteHabit(habitId);
    closeDeleteModal();

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_habit_deleted", {}, lang), "info");
    renderApp();
  }

  /**
   * Main habit deletion handler
   */
  async function handleDeleteHabit(habitId, confirmed = false) {
    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    const confirmFn =
      typeof window !== "undefined" && typeof window.confirm === "function"
        ? window.confirm
        : typeof globalThis !== "undefined" &&
            typeof globalThis.confirm === "function"
          ? globalThis.confirm
          : null;

    if (confirmFn) {
      const isConfirmed = confirmFn(i18n.t("delete_confirm_msg", {}, lang));
      if (!isConfirmed) {
        return;
      }
      pendingDeleteHabitId = habitId;
      await confirmDeleteHabit();
      return;
    }

    if (confirmed) {
      pendingDeleteHabitId = habitId;
      await confirmDeleteHabit();
    } else {
      await promptDeleteHabit(habitId);
    }
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
    pushNavigationState(activeTab, "detail");
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
   * Dynamically updates the habit edit/create live preview card
   */
  function updateHabitModalPreview() {
    const previewCard = document.getElementById("modal-live-preview-card");
    if (!previewCard) return;

    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";

    const nameInput = document.getElementById("modal-habit-name");
    const iconInput = document.getElementById("modal-habit-icon");
    const targetValInput = document.getElementById("modal-target-value");
    const unitInput =
      document.getElementById("modal-target-unit") ||
      document.getElementById("modal-habit-unit");
    const colorInput = document.querySelector(
      'input[name="modal-color"]:checked'
    );
    const typeInput = document.querySelector('input[name="type"]:checked');

    const name =
      (nameInput && nameInput.value.trim()) ||
      (lang === "vi" ? "Tên thói quen mới" : "New habit name");
    const icon = (iconInput && iconInput.value.trim()) || "🎯";
    const color = (colorInput && colorInput.value) || "emerald";
    const type = (typeInput && typeInput.value) || "binary";
    const targetVal = (targetValInput && targetValInput.value) || 1;
    const unit =
      (unitInput && unitInput.value.trim()) ||
      (type === "timer" ? i18n.t("minutes_unit", {}, lang) : "");

    // Selected routines
    const routineCheckboxes = document.querySelectorAll(
      'input[name="routines"]:checked, input[name="modal-routine"]:checked'
    );
    const routines = Array.from(routineCheckboxes).map((cb) => cb.value);
    if (routines.length === 0) {
      const singleRoutine = document.getElementById("modal-habit-routine");
      if (singleRoutine && singleRoutine.value) {
        routines.push(singleRoutine.value);
      } else {
        routines.push("morning");
      }
    }

    const previewName = document.getElementById("preview-name");
    if (previewName) previewName.textContent = name;

    const previewIcon = document.getElementById("preview-icon");
    if (previewIcon) previewIcon.textContent = icon;

    const previewIconBox = document.getElementById("preview-icon-box");
    if (previewIconBox) {
      previewIconBox.style.backgroundColor = todayView.getColorHex(color);
    }

    const previewTypeTarget = document.getElementById("preview-type-target");
    if (previewTypeTarget) {
      if (type === "binary") {
        previewTypeTarget.textContent = i18n.t("type_binary", {}, lang);
      } else {
        previewTypeTarget.textContent = `${targetVal} ${unit}`.trim();
      }
    }

    const previewRoutines = document.getElementById("preview-routines");
    if (previewRoutines) {
      previewRoutines.innerHTML = routines
        .map(
          (r) =>
            `<span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${i18n.t(`routine_${r}`, {}, lang)}</span>`
        )
        .join("");
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
    updateHabitModalPreview();
    pushNavigationState(activeTab, "edit");
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
    const isTimer = type === "timer";

    const targetValEl =
      (form && form.querySelector('[name="targetValue"]')) ||
      document.getElementById("modal-target-value");
    const rawTarget = targetValEl ? parseFloat(targetValEl.value) || 1 : 1;
    const targetValue = isTimer
      ? Math.max(1, Math.round(rawTarget * 60))
      : rawTarget;

    const unitEl =
      (form && form.querySelector('[name="unit"]')) ||
      document.getElementById("modal-habit-unit") ||
      document.getElementById("modal-target-unit");
    const unit = unitEl ? unitEl.value.trim() : isTimer ? "mins" : "";

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

    const routines = [];
    if (form) {
      form
        .querySelectorAll(
          'input[name="routines"]:checked, input[name="modal-routine"]:checked'
        )
        .forEach((cb) => {
          routines.push(cb.value);
        });
    }
    if (routineEl && routineEl.value) {
      if (
        routines.length === 0 ||
        (routines.length === 1 && !routines.includes(routineEl.value))
      ) {
        routines.length = 0;
        routines.push(routineEl.value);
      }
    }
    if (routines.length === 0) {
      routines.push("morning");
    }

    const habitData = {
      id: habitId || `h-${Date.now()}`,
      name: name,
      type: type,
      targetValue: targetValue,
      unit: unit,
      step: stepEl ? parseFloat(stepEl.value) || 1 : 1,
      routines: routines,
      routine: routines[0] || "morning",
      scheduleType: scheduleEl ? scheduleEl.value : "daily",
      scheduleDays:
        scheduleDays.length > 0 ? scheduleDays : [0, 1, 2, 3, 4, 5, 6],
      intervalDays: intervalEl ? parseInt(intervalEl.value, 10) || 1 : 1,
      icon: iconEl ? iconEl.value.trim() || "🎯" : "🎯",
      color: colorEl ? colorEl.value : "emerald",
      reminderTime: reminderEl ? reminderEl.value : "",
    };

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    if (habitId) {
      await store.updateHabit(habitId, habitData);
      showToast(i18n.t("toast_habit_updated", {}, lang), "success");
    } else {
      await store.addHabit(habitData);
      showToast(i18n.t("toast_habit_saved", {}, lang), "success");
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
      if (!tab) return;
      if (tab !== activeTab) {
        activeTab = tab;
        pushNavigationState(tab, null);
      }
      renderApp();
    },
    switchLens(lens) {
      this.switchTab(lens);
    },
    async applyStarterKit(kitId) {
      if (!store) return [];
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      const created = await store.applyStarterKit(kitId, lang);
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("starter_kit_applied_toast", {}, lang), "success");
      renderApp();
      return created;
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
          vacationRanges: [
            {
              id: `vac-${Date.now()}`,
              startDate: today,
              endDate: "2099-12-31",
              start: today,
              end: "2099-12-31",
              active: true,
            },
          ],
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
    exportDataCSV() {
      if (!store) return;
      exportImport.downloadExportCSV(store.state);
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_csv_exported", {}, lang), "success");
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
    async requestNotificationPermission() {
      const notifs =
        (typeof require !== "undefined" && require("./pwa/notifications.js")) ||
        (typeof window !== "undefined" && window.HabitNotifications) ||
        notifications;
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (!notifs || !notifs.isSupported || !notifs.isSupported()) {
        notify(i18n.t("toast_notifications_blocked", {}, lang), "error");
        return "denied";
      }

      const perm = await notifs.requestPermission();
      if (perm === "granted") {
        notify(i18n.t("toast_notifications_enabled", {}, lang), "success");
        if (store && notifs.scheduleHabitReminders) {
          notifs.scheduleHabitReminders(store.getHabits(), lang);
        }
      } else if (perm === "denied") {
        notify(i18n.t("toast_notifications_blocked", {}, lang), "warning");
      }
      renderActiveTab();
      return perm;
    },
    async testNotification() {
      const notifs =
        (typeof require !== "undefined" && require("./pwa/notifications.js")) ||
        (typeof window !== "undefined" && window.HabitNotifications) ||
        notifications;
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (!notifs || !notifs.isSupported || !notifs.isSupported()) {
        notify(i18n.t("toast_notifications_blocked", {}, lang), "error");
        return null;
      }

      if (notifs.getPermission() !== "granted") {
        const perm = await notifs.requestPermission();
        if (perm !== "granted") {
          notify(i18n.t("toast_notifications_blocked", {}, lang), "warning");
          renderActiveTab();
          return null;
        }
      }

      const res = await notifs.sendTestNotification(lang);
      notify(i18n.t("toast_notification_test_sent", {}, lang), "success");
      renderActiveTab();
      return res;
    },
    closeDetailSheet,
    handleOpenDetailSheet,
    openDetailSheet: handleOpenDetailSheet,
    handleOpenEditModal,
    openEditModal: handleOpenEditModal,
    openAddHabitModal: () => handleOpenEditModal(null),
    closeHabitModal,
    updateHabitModalPreview,
    saveHabitFromModal,
    handleToggleHabit,
    handleStepIncrement,
    handleStepDecrement,
    handleToggleTimer,
    syncRunningTimer,
    playTimerCompletionSound,
    get runningTimerHabitId() {
      return runningTimerHabitId;
    },
    get runningTimerStartedAt() {
      return runningTimerStartedAt;
    },
    get runningTimerBaseValue() {
      return runningTimerBaseValue;
    },
    updateAmbientTimerPill,
    jumpToRunningTimer,
    promptDeleteHabit,
    closeDeleteModal,
    confirmDeleteHabit,
    handleDeleteHabit,
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
    handleReorderHabit: async (habitId, routine, direction) => {
      if (!store || !habitId) return;
      const targetRoutine =
        routine ||
        (store.getHabit(habitId)
          ? engine.getHabitRoutines(store.getHabit(habitId))[0]
          : "anytime") ||
        "anytime";
      const habits = store
        .getHabits(false)
        .filter((h) => engine.getHabitRoutines(h).includes(targetRoutine))
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
    handleResetTimer,
    promptResetDefaults,
    promptFactoryWipe,
    closeResetModal,
    confirmResetDefaults,
    confirmFactoryWipe,
    get activeTab() {
      return activeTab;
    },
    handlePopState,
    setupTabSwipeGestures,
  };

  global.HabitApp = HabitApp;

  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("DOMContentLoaded", () => {
      HabitApp.init();
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = HabitApp;
  }
})(typeof window !== "undefined" ? window : globalThis);
