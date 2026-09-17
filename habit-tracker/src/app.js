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

  const cloudSyncModule =
    typeof require !== "undefined"
      ? require("./sync/cloud-sync.js")
      : global.HabitCloudSync;

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
  let lastTimerPersistedAt = 0;
  let wakeLockSentinel = null;
  let wizardCurrentStep = 1;
  let wizardSelectedKitIds = ["morning-mastery"];
  let wizardSelectedKitId = "morning-mastery";
  let pendingDeleteHabitId = null;
  let habitsSubView = "catalog"; // 'catalog' | 'identity'
  let swipeStartX = 0;
  let swipeStartY = 0;
  let activeFocusModalHabitId = null;
  let timerDisplayMode = "remaining"; // 'remaining' | 'elapsed'
  let timerSoundEnabled = true;
  let cloudSyncManager = null;
  let vaultUnlockPendingCallback = null;
  let pendingImportData = null;
  let selectedImportStrategy = "merge";

  const ACTIVE_TIMER_STORAGE_KEY = "habit_active_timer_session";

  /**
   * Saves active running timer session snapshot to localStorage synchronously
   */
  function saveActiveTimerSession(sessionData = null) {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      if (sessionData) {
        window.localStorage.setItem(
          ACTIVE_TIMER_STORAGE_KEY,
          JSON.stringify(sessionData)
        );
        return;
      }
      if (!runningTimerHabitId || !runningTimerStartedAt || !store) {
        clearActiveTimerSession();
        return;
      }
      const habit = store.getHabit(runningTimerHabitId);
      const targetDate = runningTimerDate || store.getActiveDate();
      const payload = {
        habitId: runningTimerHabitId,
        date: targetDate,
        startedAt: runningTimerStartedAt,
        baseValue: runningTimerBaseValue,
        isRunning: true,
        lastSavedTimestamp: Date.now(),
        targetValue: habit ? habit.targetValue : 1200,
        timerDisplayMode: timerDisplayMode || "remaining",
        timerSoundEnabled: timerSoundEnabled !== false,
      };
      window.localStorage.setItem(
        ACTIVE_TIMER_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch (_) {}
  }

  /**
   * Clears active timer session snapshot from localStorage synchronously
   */
  function clearActiveTimerSession() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
      }
    } catch (_) {}
  }

  /**
   * Gets active timer session snapshot from localStorage safely
   */
  function getActiveTimerSession() {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      const raw = window.localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  const MAX_ACTIVE_TIMER_SESSION_SECONDS = 12 * 3600; // 12-hour safety cap

  /**
   * Reconciles and restores active timer session from localStorage on cold boot or screen wake
   */
  async function restoreActiveTimerSession(options = {}) {
    if (!store) return null;
    const session = getActiveTimerSession();
    if (
      !session ||
      !session.habitId ||
      !session.startedAt ||
      session.isRunning !== true
    ) {
      return null;
    }

    const habit = store.getHabit(session.habitId);
    if (!habit || habit.archived) {
      clearActiveTimerSession();
      return null;
    }

    const now = Date.now();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now - Number(session.startedAt)) / 1000)
    );

    // 12-Hour Stale Session Safety Cap: prevent runaway duration if abandoned
    if (elapsedSeconds > MAX_ACTIVE_TIMER_SESSION_SECONDS) {
      const cappedTotal =
        (Number(session.baseValue) || 0) + MAX_ACTIVE_TIMER_SESSION_SECONDS;
      const targetDate = session.date || store.getActiveDate();
      try {
        await store.logHabit(session.habitId, targetDate, cappedTotal);
      } catch (_) {}
      clearActiveTimerSession();
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
        i18n.t("toast_timer_session_expired", {}, lang) ||
          "Focus timer session capped at 12 hours",
        "info"
      );
      return { expired: true, cappedTotal };
    }

    const targetDate = session.date || store.getActiveDate();
    const baseValue = Number(session.baseValue) || 0;
    const totalSecs = baseValue + elapsedSeconds;
    const targetValue = habit.targetValue || 1200;
    const isCompleted = totalSecs >= targetValue;
    const crossedTargetInSleep = isCompleted && baseValue < targetValue;

    // Hydrate in-memory state
    runningTimerHabitId = session.habitId;
    runningTimerDate = targetDate;
    runningTimerStartedAt = session.startedAt;
    runningTimerBaseValue = baseValue;
    runningTimerTickCount = elapsedSeconds;
    timerDisplayMode = session.timerDisplayMode || "remaining";
    timerSoundEnabled = session.timerSoundEnabled !== false;
    hasTriggeredCelebrationForRun = isCompleted;
    lastTimerPersistedAt = now;

    // Update in-memory log cache
    if (store.state && store.state.logs) {
      const existing =
        store.state.logs[`${session.habitId}_${targetDate}`] || {};
      store.state.logs[`${session.habitId}_${targetDate}`] = {
        ...existing,
        id: `${session.habitId}_${targetDate}`,
        habitId: session.habitId,
        date: targetDate,
        value: totalSecs,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
      };
    }

    // Persist to storage
    try {
      await store.logHabit(session.habitId, targetDate, totalSecs);
    } catch (_) {}

    // Save updated heartbeat
    saveActiveTimerSession();

    // Start background ticker
    startTimerTicker();
    updateAmbientTimerPill();
    renderActiveTab();
    refreshDetailSheetIfOpen(session.habitId, targetDate);

    // Target crossed celebration
    if (crossedTargetInSleep) {
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      showToast(
        `🎉 ${i18n.t("timer_completed", {}, lang)} (${habit.name})`,
        "success"
      );
      if (timerSoundEnabled) {
        playTimerCompletionSound();
      }
      if (todayView && typeof todayView.triggerVictoryConfetti === "function") {
        todayView.triggerVictoryConfetti();
      }
    }

    // Auto open focus modal on cold boot if requested/configured
    if (options.isColdBoot) {
      openFocusTimerModal(session.habitId);
    }

    return {
      restored: true,
      habitId: session.habitId,
      totalSecs,
      crossedTargetInSleep,
    };
  }

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
    const focusTimerModal = document.getElementById(
      "focus-timer-modal-overlay"
    );
    const editModal = document.getElementById("habit-edit-modal-overlay");
    const detailSheetEl = document.getElementById("detail-sheet-overlay");
    const deleteModal = document.getElementById("delete-confirm-modal-overlay");
    const resetModal = document.getElementById("reset-confirm-modal-overlay");
    const wizardModal = document.getElementById(
      "identity-wizard-modal-overlay"
    );

    const isFocusTimerOpen =
      focusTimerModal && !focusTimerModal.classList.contains("hidden");
    const isEditOpen = editModal && !editModal.classList.contains("hidden");
    const isDetailOpen =
      detailSheetEl && !detailSheetEl.classList.contains("hidden");
    const isDeleteOpen =
      deleteModal && !deleteModal.classList.contains("hidden");
    const isResetOpen = resetModal && !resetModal.classList.contains("hidden");
    const isWizardOpen =
      wizardModal && !wizardModal.classList.contains("hidden");

    // Tier 1: Dismiss active overlays (top-most first)
    if (isFocusTimerOpen) {
      closeFocusTimerModal();
      return;
    }
    if (isDeleteOpen) {
      closeDeleteModal();
      return;
    }
    if (isResetOpen) {
      closeResetModal();
      return;
    }
    if (isWizardOpen) {
      closeIdentityWizard();
      return;
    }
    if (isEditOpen) {
      closeHabitModal();
      return;
    }
    if (isDetailOpen) {
      closeDetailSheet();
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
          "#focus-timer-modal-overlay",
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

    // Reconcile and restore active running timer session if present
    await restoreActiveTimerSession({ isColdBoot: true });

    // Schedule local notifications if permitted
    if (notifications && notifications.scheduleHabitReminders) {
      notifications.scheduleHabitReminders(
        store.getHabits(),
        settings.language
      );
    }

    // Dual-Provider Cloud Synchronization Hub Initialization
    if (cloudSyncModule && cloudSyncModule.CloudSyncManager) {
      cloudSyncManager = new cloudSyncModule.CloudSyncManager({
        store,
        storage,
        merge3:
          typeof require !== "undefined"
            ? require("./sync/merge3.js")
            : global.HabitMerge3,
        crypto:
          typeof require !== "undefined"
            ? require("./sync/cloud-backup.js")
            : global.HabitCloud,
        debounceDelayMs: 5000,
      });
      await cloudSyncManager.init();

      cloudSyncManager.subscribe(() => {
        if (activeTab === "settings") {
          renderActiveTab();
        }
      });

      // Calm debounced auto-sync on store mutations
      store.subscribe(() => {
        if (
          cloudSyncManager &&
          cloudSyncManager.autoSyncEnabled &&
          cloudSyncManager.activeProvider !== "none"
        ) {
          cloudSyncManager.scheduleDebouncedSync();
        }
      });

      // Background sync on boot if already connected
      if (cloudSyncManager.activeProvider !== "none") {
        cloudSyncManager.sync().catch((err) => {
          console.warn("[CloudSync] Initial boot sync failed:", err);
        });
      }
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
        createdAt: "2026-01-01",
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
        createdAt: "2026-01-01",
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
        createdAt: "2026-01-01",
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
      langToggleBtn.textContent = lang === "vi" ? "🇻🇳" : "🇺🇸";
      const titleText =
        lang === "vi"
          ? "Ngôn ngữ: 🇻🇳 Tiếng Việt — Bấm để đổi sang 🇺🇸 English"
          : "Language: 🇺🇸 English — Click to switch to 🇻🇳 Tiếng Việt";
      langToggleBtn.title = titleText;
      langToggleBtn.setAttribute("aria-label", titleText);
    }

    const pwaTitle = document.getElementById("pwa-update-title");
    const pwaDesc = document.getElementById("pwa-update-desc");
    const pwaBtn = document.getElementById("pwa-update-btn");
    if (pwaTitle) pwaTitle.textContent = i18n.t("sw_update_title", {}, lang);
    if (pwaDesc) pwaDesc.textContent = i18n.t("sw_update_desc", {}, lang);
    if (pwaBtn) pwaBtn.textContent = i18n.t("sw_update_btn", {}, lang);
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
      insights: "insights",
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
          "lens-tab-btn flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-200 active:scale-95 bg-emerald-500 text-emerald-950 font-bold shadow-md shadow-emerald-500/20";
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
    } else if (activeTab === "insights" || activeTab === "matrix") {
      insightsView.renderInsightsView(store, container, lang);
      bindHeatmapInteractions();
    } else if (activeTab === "manager" || activeTab === "identity") {
      if (
        identityView &&
        typeof identityView.renderIdentityView === "function"
      ) {
        identityView.renderIdentityView(store, container, lang, habitsSubView);
      } else if (
        managerView &&
        typeof managerView.renderManagerView === "function"
      ) {
        managerView.renderManagerView(store, container, lang);
      }
    } else if (activeTab === "settings") {
      renderSettingsTab(container, lang);
    }

    updateAmbientTimerPill();
  }

  /**
   * Formats ISO timestamp to human-friendly relative time
   */
  function formatRelativeTime(isoString, lang = "vi") {
    if (!isoString) return lang === "vi" ? "Chưa đồng bộ" : "Never";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return lang === "vi" ? "Chưa đồng bộ" : "Never";
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 30) return i18n.t("cloud_synced_just_now", {}, lang);
    if (diffMin < 60)
      return i18n.t("cloud_synced_ago", { time: `${diffMin}m` }, lang);
    if (diffHr < 24)
      return i18n.t("cloud_synced_ago", { time: `${diffHr}h` }, lang);
    return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Renders Settings Tab HTML
   */
  function renderSettingsTab(container, lang = "vi") {
    const settings = store.getSettings();
    const syncStatus = cloudSyncManager
      ? cloudSyncManager.getStatus()
      : {
          provider: "none",
          connected: false,
          syncing: false,
          lastSync: null,
          statusBadge: "offline",
          autoSync: true,
        };

    const isDriveConnected =
      syncStatus.provider === "googledrive" && syncStatus.connected;
    const isGistConnected =
      syncStatus.provider === "github" && syncStatus.connected;

    let statusBadgeHtml = "";
    if (syncStatus.syncing) {
      statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-bold border border-sky-300 dark:border-sky-800/50"><span class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> ${i18n.t("cloud_syncing", {}, lang)}</span>`;
    } else if (syncStatus.error) {
      statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold border border-red-300 dark:border-red-800/50">🔴 ${lang === "vi" ? "Lỗi đồng bộ" : "Sync Error"}</span>`;
    } else if (syncStatus.connected) {
      statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800/50">🟢 ${i18n.t("cloud_connected", {}, lang)}</span>`;
    } else {
      statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">⚪ ${i18n.t("cloud_not_connected", {}, lang)}</span>`;
    }

    const relativeSyncTime = formatRelativeTime(syncStatus.lastSync, lang);
    const isAutoSyncOn = syncStatus.autoSync !== false;

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

    const isVi = lang === "vi";
    const isDark = settings.theme !== "light";
    const toggleActiveCls = "bg-emerald-600 text-white shadow-xs";
    const toggleInactiveCls =
      "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300";
    const viBtnCls = isVi ? toggleActiveCls : toggleInactiveCls;
    const enBtnCls = !isVi ? toggleActiveCls : toggleInactiveCls;
    const darkBtnCls = isDark ? toggleActiveCls : toggleInactiveCls;
    const lightBtnCls = !isDark ? toggleActiveCls : toggleInactiveCls;

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
              <button onclick="window.HabitApp.switchLanguage('vi')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${viBtnCls}">Tiếng Việt</button>
              <button onclick="window.HabitApp.switchLanguage('en')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${enBtnCls}">English</button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3">
            <span class="text-xs text-slate-700 dark:text-slate-300">${i18n.t("theme_select", {}, lang)}</span>
            <div class="flex items-center gap-1.5">
              <button onclick="window.HabitApp.switchTheme('dark')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${darkBtnCls}">🌙 ${i18n.t("theme_dark", {}, lang)}</button>
              <button onclick="window.HabitApp.switchTheme('light')" class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${lightBtnCls}">☀️ ${i18n.t("theme_light", {}, lang)}</button>
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
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">☁️ ${i18n.t("cloud_backup_title", {}, lang)}</h3>
            ${statusBadgeHtml}
          </div>

          <!-- Live Sync Status & Manual Sync Action -->
          <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/40 mb-3">
            <div>
              <span class="text-xs font-bold text-slate-900 dark:text-white block">
                ${syncStatus.provider === "github" ? "GitHub Gist" : syncStatus.provider === "googledrive" ? "Google Drive" : lang === "vi" ? "Chưa chọn dịch vụ" : "No Cloud Provider"}
              </span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">🕒 ${relativeSyncTime}</p>
            </div>
            <button
              type="button"
              id="btn-cloud-sync-now"
              onclick="window.HabitApp.syncCloudNow()"
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span class="${syncStatus.syncing ? "animate-spin inline-block" : ""}">🔄</span>
              <span>${i18n.t("cloud_sync_now", {}, lang)}</span>
            </button>
          </div>

          <!-- Auto-Sync Toggle -->
          <div class="flex items-center justify-between py-2.5 px-1 border-b border-slate-200 dark:border-slate-800/60 mb-3">
            <div>
              <span class="text-xs text-slate-800 dark:text-slate-300 block font-semibold">${i18n.t("cloud_auto_sync", {}, lang)}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">${lang === "vi" ? "Tự động đồng bộ sau 5 giây khi có thay đổi" : "Debounced 5s auto-sync on habit updates"}</span>
            </div>
            <button
              type="button"
              id="btn-toggle-auto-sync"
              onclick="window.HabitApp.toggleAutoSync()"
              class="px-3 py-1 rounded-xl text-xs font-bold transition-colors ${isAutoSyncOn ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}"
            >
              ${isAutoSyncOn ? (lang === "vi" ? "Bật" : "ON") : lang === "vi" ? "Tắt" : "OFF"}
            </button>
          </div>

          <!-- Dual-Provider Connectors -->
          <div class="space-y-2 mb-4">
            <button
              type="button"
              id="btn-open-gist-modal"
              onclick="window.HabitApp.openGistModal()"
              class="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/40 text-left transition-all cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-lg">🐙</span>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white">${i18n.t("cloud_gist_title", {}, lang)}</h4>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">${isGistConnected ? "🟢 " + i18n.t("cloud_connected", {}, lang) : i18n.t("cloud_gist_desc", {}, lang)}</span>
                </div>
              </div>
              <span class="text-xs text-slate-400">⚙️</span>
            </button>

            <button
              type="button"
              id="btn-open-drive-modal"
              onclick="window.HabitApp.openDriveModal()"
              class="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/40 text-left transition-all cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-lg">📁</span>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white">${i18n.t("cloud_drive_title", {}, lang)}</h4>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">${isDriveConnected ? "🟢 " + i18n.t("cloud_connected", {}, lang) : i18n.t("cloud_drive_desc", {}, lang)}</span>
                </div>
              </div>
              <span class="text-xs text-slate-400">⚙️</span>
            </button>
          </div>

          <!-- Zero-Knowledge Vault Encryption -->
          <div class="pt-3 pb-2 border-t border-slate-200 dark:border-slate-800/60 mb-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-1.5">
                <span class="text-sm">🔒</span>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white">${i18n.t("vault_encryption_title", {}, lang)}</h4>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${i18n.t("vault_encryption_desc", {}, lang)}</span>
                </div>
              </div>
              <button
                type="button"
                id="btn-toggle-vault-encryption"
                onclick="window.HabitApp.toggleVaultEncryption()"
                class="px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${syncStatus.encryptionEnabled ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}"
              >
                ${syncStatus.encryptionEnabled ? (lang === "vi" ? "Bật" : "ON") : lang === "vi" ? "Tắt" : "OFF"}
              </button>
            </div>

            ${
              syncStatus.encryptionEnabled
                ? `
              <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/40 mt-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs">${syncStatus.isVaultUnlocked ? "🔓" : "🔒"}</span>
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    ${syncStatus.isVaultUnlocked ? i18n.t("vault_status_unlocked", {}, lang) : i18n.t("vault_status_locked", {}, lang)}
                  </span>
                </div>
                ${
                  syncStatus.isVaultUnlocked
                    ? `
                  <button
                    type="button"
                    id="btn-vault-lock"
                    onclick="window.HabitApp.lockVault()"
                    class="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    🔒 ${i18n.t("vault_lock_btn", {}, lang)}
                  </button>
                `
                    : `
                  <button
                    type="button"
                    id="btn-vault-unlock"
                    onclick="window.HabitApp.openVaultUnlockModal()"
                    class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    🔓 ${i18n.t("vault_unlock_btn", {}, lang)}
                  </button>
                `
                }
              </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Card 2: Data Portability & File Exchange -->
        <div id="settings-data-portability" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl">
          <div class="mb-3">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">📦 ${i18n.t("data_portability_card_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">${i18n.t("data_portability_card_desc", {}, lang)}</p>
          </div>

          <div class="grid grid-cols-4 gap-2">
            <button id="btn-export-json" data-action="export-json" onclick="window.HabitApp.exportDataJSON()" class="flex items-center justify-center gap-1 py-2.5 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer" title="Export JSON">
              <span>📥</span>
              <span class="truncate">JSON</span>
            </button>
            <button id="btn-export-csv" data-action="export-csv" onclick="window.HabitApp.exportDataCSV()" class="flex items-center justify-center gap-1 py-2.5 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer" title="Export CSV">
              <span>📊</span>
              <span class="truncate">CSV</span>
            </button>
            <label class="flex items-center justify-center gap-1 py-2.5 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700/50 cursor-pointer transition-all" title="Import JSON">
              <span>📤</span>
              <span class="truncate">+JSON</span>
              <input type="file" id="import-json-input" accept=".json" class="hidden" onchange="window.HabitApp.importDataJSON(event)" />
            </label>
            <label class="flex items-center justify-center gap-1 py-2.5 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-2xl text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/50 cursor-pointer transition-all" title="Import CSV">
              <span>📑</span>
              <span class="truncate">+CSV</span>
              <input type="file" id="import-csv-input" accept=".csv,text/csv" class="hidden" onchange="window.HabitApp.importDataCSV(event)" />
            </label>
          </div>
        </div>

        <!-- Card 3: Local Data Vault & Safety Snapshots History -->
        <div id="settings-data-vault" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-5 mb-5 shadow-sm dark:shadow-xl space-y-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">🛡️ ${i18n.t("data_vault_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">${i18n.t("data_vault_desc", {}, lang)}</p>
          </div>

          <!-- Storage Statistics -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">${i18n.t("import_stat_habits", {}, lang)}</span>
              <span class="text-base font-black text-slate-900 dark:text-white mt-0.5 block">${(store && store.getHabits && store.getHabits().length) || 0}</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">${i18n.t("import_stat_logs", {}, lang)}</span>
              <span class="text-base font-black text-slate-900 dark:text-white mt-0.5 block">${(store && store.state && store.state.logs && (Array.isArray(store.state.logs) ? store.state.logs.length : Object.keys(store.state.logs).length)) || 0}</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">${i18n.t("vacation_pause_mode", {}, lang) || "Pause"}</span>
              <span class="text-base font-black text-slate-900 dark:text-white mt-0.5 block">${(store && store.state && store.state.settings && store.state.settings.vacationRanges && store.state.settings.vacationRanges.length) || 0}</span>
            </div>
          </div>

          <!-- Rolling Snapshots History Section -->
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800/60">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📸</span>
                  <span>${i18n.t("snapshot_history_title", {}, lang)}</span>
                </h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">${i18n.t("snapshot_history_desc", {}, lang)}</p>
              </div>
              <button
                type="button"
                id="btn-create-snapshot"
                data-action="create-snapshot"
                onclick="window.HabitApp.createManualSnapshot()"
                class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl transition cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700/60 shrink-0"
              >
                + ${i18n.t("create_snapshot_btn", {}, lang)}
              </button>
            </div>
            <div id="snapshots-history-list" class="space-y-2 mt-2">
              <div class="p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 animate-pulse">
                <p class="text-[11px] text-slate-400">Loading snapshots...</p>
              </div>
            </div>
          </div>

          <!-- Starter Kits & Identity Wizard -->
          <div class="pt-2 border-t border-slate-200 dark:border-slate-800/60 space-y-2.5">
            <div class="flex items-center justify-between p-3 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl border border-emerald-500/30 gap-3">
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>✨</span>
                  <span>${i18n.t("wizard_title", {}, lang)}</span>
                </h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">${i18n.t("wizard_subtitle", {}, lang)}</p>
              </div>
              <button
                type="button"
                id="btn-launch-wizard"
                data-action="open-identity-wizard"
                onclick="window.HabitApp.openIdentityWizard()"
                class="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                ${i18n.t("open_identity_wizard", {}, lang)}
              </button>
            </div>

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
            <button onclick="window.HabitApp.purgeCacheAndReload()" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all">
              <span>🧹</span>
              <span>${i18n.t("purge_cache_btn", {}, lang)}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Asynchronously fetch rolling snapshots and populate #snapshots-history-list
    if (store && typeof store.getSnapshots === "function") {
      store
        .getSnapshots()
        .then((snapshots) => {
          const listEl = document.getElementById("snapshots-history-list");
          if (listEl) {
            listEl.innerHTML = renderSnapshotsListHtml(snapshots, lang);
          }
        })
        .catch(() => {});
    }
  }

  function renderSnapshotsListHtml(snapshots, lang = "vi") {
    if (!snapshots || snapshots.length === 0) {
      return `
        <div class="p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <p class="text-[11px] text-slate-500 dark:text-slate-400">${i18n.t("no_snapshots_yet", {}, lang)}</p>
        </div>
      `;
    }

    return `
      <div class="space-y-2">
        ${snapshots
          .slice(0, 5)
          .map((s) => {
            const timeStr = formatRelativeTime(s.timestamp, lang);
            const habitCount =
              s.data && Array.isArray(s.data.habits)
                ? s.data.habits.length
                : s.data && s.data.habits
                  ? Object.keys(s.data.habits).length
                  : 0;
            const logCount =
              s.data && typeof s.data.logs === "object"
                ? Array.isArray(s.data.logs)
                  ? s.data.logs.length
                  : Object.keys(s.data.logs).length
                : 0;

            let reasonBadge = "";
            if (s.reason === "pre_import_backup") {
              reasonBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">${i18n.t("snap_reason_import", {}, lang)}</span>`;
            } else if (s.reason === "pre_sync") {
              reasonBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">${i18n.t("snap_reason_sync", {}, lang)}</span>`;
            } else {
              reasonBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">${i18n.t("snap_reason_manual", {}, lang)}</span>`;
            }

            return `
            <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${reasonBadge}
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">${timeStr}</span>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ${habitCount} ${i18n.t("import_stat_habits", {}, lang)} • ${logCount} ${i18n.t("import_stat_logs", {}, lang)}
                </p>
              </div>
              <button
                type="button"
                data-action="restore-snapshot"
                data-snapshot-id="${s.id}"
                onclick="window.HabitApp.restoreSnapshotFromHistory('${s.id}')"
                class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 active:scale-95 border border-indigo-200 dark:border-indigo-800/50"
              >
                ↩️ ${i18n.t("snapshot_restore_btn", {}, lang)}
              </button>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
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
    // Global Keyboard Accessibility & Shortcuts
    document.addEventListener("keydown", (e) => {
      // 1. Escape: Dismiss any active modal/sheet/popover
      if (e.key === "Escape") {
        const focusModal = document.getElementById("focus-timer-modal-overlay");
        const editModal = document.getElementById("habit-edit-modal-overlay");
        const detailSheetEl = document.getElementById("detail-sheet-overlay");
        const deleteModal = document.getElementById(
          "delete-confirm-modal-overlay"
        );
        const resetModal = document.getElementById(
          "reset-confirm-modal-overlay"
        );
        const wizardModal = document.getElementById(
          "identity-wizard-modal-overlay"
        );
        const gistModal = document.getElementById("gist-config-modal-overlay");
        const driveModal = document.getElementById(
          "drive-config-modal-overlay"
        );
        const vaultUnlockModal = document.getElementById(
          "vault-unlock-modal-overlay"
        );
        const popover = document.getElementById("heatmap-cell-popover");

        if (popover && !popover.classList.contains("hidden")) {
          popover.classList.add("hidden");
        }
        if (
          vaultUnlockModal &&
          !vaultUnlockModal.classList.contains("hidden")
        ) {
          closeVaultUnlockModal();
          return;
        }
        if (gistModal && !gistModal.classList.contains("hidden")) {
          closeGistModal();
          return;
        }
        if (driveModal && !driveModal.classList.contains("hidden")) {
          closeDriveModal();
          return;
        }
        if (focusModal && !focusModal.classList.contains("hidden")) {
          closeFocusTimerModal();
          return;
        }
        if (editModal && !editModal.classList.contains("hidden")) {
          closeHabitModal();
          return;
        }
        if (detailSheetEl && !detailSheetEl.classList.contains("hidden")) {
          closeDetailSheet();
          return;
        }
        if (deleteModal && !deleteModal.classList.contains("hidden")) {
          closeDeleteModal();
          return;
        }
        if (resetModal && !resetModal.classList.contains("hidden")) {
          closeResetModal();
          return;
        }
        if (wizardModal && !wizardModal.classList.contains("hidden")) {
          closeIdentityWizard();
          return;
        }
        return;
      }

      // Ignore accelerators if typing inside text fields
      const activeTag = document.activeElement
        ? document.activeElement.tagName.toLowerCase()
        : "";
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        (document.activeElement && document.activeElement.isContentEditable)
      ) {
        return;
      }

      // Hotkeys (1-4: Switch Tabs)
      if (e.key === "1") {
        e.preventDefault();
        HabitApp.switchTab("today");
      } else if (e.key === "2") {
        e.preventDefault();
        HabitApp.switchTab("insights");
      } else if (e.key === "3") {
        e.preventDefault();
        HabitApp.switchTab("manager");
      } else if (e.key === "4") {
        e.preventDefault();
        HabitApp.switchTab("settings");
      } else if (e.key === "n" || e.key === "N") {
        // N: Add Habit
        const editModal = document.getElementById("habit-edit-modal-overlay");
        if (!editModal || editModal.classList.contains("hidden")) {
          e.preventDefault();
          handleOpenEditModal(null);
        }
      } else if (e.key === "t" || e.key === "T") {
        // T: Jump to today
        if (store) {
          const todayStr = engine.toDateString(new Date());
          store.setActiveDate(todayStr);
        }
      } else if (
        document.activeElement &&
        document.activeElement.id === "starter-kits-carousel-container"
      ) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          document.activeElement.scrollBy({ left: -280, behavior: "smooth" });
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          document.activeElement.scrollBy({ left: 280, behavior: "smooth" });
        }
      }
    });

    // Horizontal Drag-to-Scroll for Starter Kits Carousel
    let isDraggingCarousel = false;
    let carouselStartX = 0;
    let carouselScrollLeft = 0;
    let carouselMoved = false;

    document.addEventListener("mousedown", (e) => {
      const carousel = e.target.closest("#starter-kits-carousel-container");
      if (!carousel) return;
      isDraggingCarousel = true;
      carouselMoved = false;
      carouselStartX = e.pageX - carousel.offsetLeft;
      carouselScrollLeft = carousel.scrollLeft;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDraggingCarousel) return;
      const carousel = document.getElementById(
        "starter-kits-carousel-container"
      );
      if (!carousel) return;
      const x = e.pageX - carousel.offsetLeft;
      const walk = x - carouselStartX;
      if (Math.abs(walk) > 5) {
        carouselMoved = true;
        carousel.scrollLeft = carouselScrollLeft - walk;
      }
    });

    document.addEventListener("mouseup", () => {
      isDraggingCarousel = false;
    });

    // Drag & Drop Reordering for Manager Habit Cards (Desktop)
    let draggedHabitId = null;
    let draggedRoutine = null;
    let dragOverHabitId = null;
    let dragInsertAfter = false;

    document.addEventListener("dragstart", (e) => {
      const card = e.target.closest(".manager-habit-card");
      if (!card) return;
      draggedHabitId = card.getAttribute("data-habit-id");
      draggedRoutine = card.getAttribute("data-routine");
      if (e.dataTransfer) {
        try {
          e.dataTransfer.setData("text/plain", draggedHabitId || "");
          e.dataTransfer.effectAllowed = "move";
        } catch (_err) {
          // Ignore in headless test envs
        }
      }
      card.classList.add("opacity-40", "scale-[0.98]");
    });

    document.addEventListener("dragover", (e) => {
      const card = e.target.closest(".manager-habit-card");
      if (!card || !draggedHabitId) return;
      const targetRoutine = card.getAttribute("data-routine");
      if (targetRoutine !== draggedRoutine) return;

      e.preventDefault();
      if (e.dataTransfer) {
        try {
          e.dataTransfer.dropEffect = "move";
        } catch (_err) {
          // Ignore in headless test envs
        }
      }

      const rect = card.getBoundingClientRect
        ? card.getBoundingClientRect()
        : { top: 0, height: 40 };
      const midY = rect.top + rect.height / 2;
      const targetId = card.getAttribute("data-habit-id");
      dragOverHabitId = targetId;
      dragInsertAfter = e.clientY > midY;

      // Reset indicators on all cards
      document.querySelectorAll(".manager-habit-card").forEach((c) => {
        c.classList.remove("border-t-2", "border-b-2", "!border-emerald-500");
      });

      if (targetId !== draggedHabitId) {
        if (dragInsertAfter) {
          card.classList.add("border-b-2", "!border-emerald-500");
        } else {
          card.classList.add("border-t-2", "!border-emerald-500");
        }
      }
    });

    document.addEventListener("dragleave", (e) => {
      const card = e.target.closest(".manager-habit-card");
      if (
        card &&
        e.relatedTarget &&
        card.contains &&
        !card.contains(e.relatedTarget)
      ) {
        card.classList.remove(
          "border-t-2",
          "border-b-2",
          "!border-emerald-500"
        );
      }
    });

    document.addEventListener("drop", async (e) => {
      const card = e.target.closest(".manager-habit-card");
      if (!card || !draggedHabitId || !draggedRoutine) return;
      e.preventDefault();

      const targetId = card.getAttribute("data-habit-id");
      const targetRoutine = card.getAttribute("data-routine");

      document.querySelectorAll(".manager-habit-card").forEach((c) => {
        c.classList.remove(
          "border-t-2",
          "border-b-2",
          "!border-emerald-500",
          "opacity-40",
          "scale-[0.98]"
        );
      });

      if (
        targetRoutine === draggedRoutine &&
        targetId &&
        targetId !== draggedHabitId
      ) {
        await store.reorderHabit(
          draggedRoutine,
          draggedHabitId,
          targetId,
          dragInsertAfter
        );
        renderActiveTab();
      }

      draggedHabitId = null;
      draggedRoutine = null;
      dragOverHabitId = null;
    });

    document.addEventListener("dragend", () => {
      document.querySelectorAll(".manager-habit-card").forEach((c) => {
        c.classList.remove(
          "border-t-2",
          "border-b-2",
          "!border-emerald-500",
          "opacity-40",
          "scale-[0.98]"
        );
      });
      draggedHabitId = null;
      draggedRoutine = null;
      dragOverHabitId = null;
    });

    // Touch Drag Reordering for Mobile Devices
    let touchDragCard = null;
    let touchDraggedHabitId = null;
    let touchDraggedRoutine = null;
    let touchLastTargetId = null;
    let touchInsertAfter = false;

    document.addEventListener(
      "touchstart",
      (e) => {
        const handle = e.target.closest(".drag-handle");
        if (!handle) return;
        const card = handle.closest(".manager-habit-card");
        if (!card) return;

        touchDragCard = card;
        touchDraggedHabitId = card.getAttribute("data-habit-id");
        touchDraggedRoutine = card.getAttribute("data-routine");
        card.classList.add("opacity-50", "scale-[0.98]", "shadow-lg");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(10);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!touchDragCard || !touchDraggedHabitId) return;
        const touch = e.touches && e.touches[0];
        if (!touch) return;

        const elementUnder = document.elementFromPoint
          ? document.elementFromPoint(touch.clientX, touch.clientY)
          : null;
        const targetCard = elementUnder
          ? elementUnder.closest(".manager-habit-card")
          : null;

        document.querySelectorAll(".manager-habit-card").forEach((c) => {
          c.classList.remove("border-t-2", "border-b-2", "!border-emerald-500");
        });

        if (
          targetCard &&
          targetCard.getAttribute("data-routine") === touchDraggedRoutine
        ) {
          const targetId = targetCard.getAttribute("data-habit-id");
          touchLastTargetId = targetId;
          const rect = targetCard.getBoundingClientRect
            ? targetCard.getBoundingClientRect()
            : { top: 0, height: 40 };
          const midY = rect.top + rect.height / 2;
          touchInsertAfter = touch.clientY > midY;

          if (targetId !== touchDraggedHabitId) {
            if (touchInsertAfter) {
              targetCard.classList.add("border-b-2", "!border-emerald-500");
            } else {
              targetCard.classList.add("border-t-2", "!border-emerald-500");
            }
          }
        }
      },
      { passive: true }
    );

    document.addEventListener("touchend", async () => {
      if (!touchDragCard) return;

      document.querySelectorAll(".manager-habit-card").forEach((c) => {
        c.classList.remove(
          "border-t-2",
          "border-b-2",
          "!border-emerald-500",
          "opacity-50",
          "scale-[0.98]",
          "shadow-lg"
        );
      });

      if (
        touchDraggedRoutine &&
        touchDraggedHabitId &&
        touchLastTargetId &&
        touchLastTargetId !== touchDraggedHabitId
      ) {
        await store.reorderHabit(
          touchDraggedRoutine,
          touchDraggedHabitId,
          touchLastTargetId,
          touchInsertAfter
        );
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(15);
        }
        renderActiveTab();
      }

      touchDragCard = null;
      touchDraggedHabitId = null;
      touchDraggedRoutine = null;
      touchLastTargetId = null;
    });

    document.addEventListener("touchcancel", () => {
      if (touchDragCard) {
        document.querySelectorAll(".manager-habit-card").forEach((c) => {
          c.classList.remove(
            "border-t-2",
            "border-b-2",
            "!border-emerald-500",
            "opacity-50",
            "scale-[0.98]",
            "shadow-lg"
          );
        });
        touchDragCard = null;
        touchDraggedHabitId = null;
        touchDraggedRoutine = null;
        touchLastTargetId = null;
      }
    });

    // Dismiss heatmap popover on outside click
    document.addEventListener(
      "click",
      (e) => {
        if (
          carouselMoved &&
          e.target.closest("#starter-kits-carousel-container")
        ) {
          e.stopPropagation();
          e.preventDefault();
          carouselMoved = false;
        }

        const popover = document.getElementById("heatmap-cell-popover");
        if (!popover || popover.classList.contains("hidden")) return;
        const clickedCell = e.target.closest(".heatmap-cell");
        const clickedPopover = e.target.closest("#heatmap-cell-popover");
        if (!clickedCell && !clickedPopover) {
          popover.classList.add("hidden");
        }
      },
      true
    );

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
      // Outside click dismissal for context menus & emoji popovers
      if (
        !e.target.closest('[data-action="toggle-card-menu"]') &&
        !e.target.closest(".card-context-menu")
      ) {
        document
          .querySelectorAll(".card-context-menu")
          .forEach((m) => m.classList.add("hidden"));
      }
      if (
        !e.target.closest('[data-action="toggle-emoji-popover"]') &&
        !e.target.closest("#habit-emoji-popover")
      ) {
        const popover = document.getElementById("habit-emoji-popover");
        if (popover) popover.classList.add("hidden");
      }

      const target = e.target.closest("[data-action]");
      if (!target) return;

      const action = target.getAttribute("data-action");
      const habitId = target.getAttribute("data-habit-id");
      const activeDate = store.getActiveDate();

      if (action === "toggle-habit") {
        await handleToggleHabit(habitId, activeDate);
      } else if (action === "switch-habits-subview") {
        const subview = target.getAttribute("data-subview") || "catalog";
        habitsSubView = subview;
        renderActiveTab();
      } else if (action === "toggle-card-menu") {
        const menuId = `card-menu-${habitId}`;
        const menu = document.getElementById(menuId);
        const allMenus = document.querySelectorAll(".card-context-menu");
        allMenus.forEach((m) => {
          if (m !== menu) m.classList.add("hidden");
        });
        if (menu) {
          menu.classList.toggle("hidden");
        }
      } else if (action === "toggle-emoji-popover") {
        const popover = document.getElementById("habit-emoji-popover");
        if (popover) {
          popover.classList.toggle("hidden");
        }
      } else if (action === "modal-switch-stage") {
        const stage = parseInt(target.getAttribute("data-stage") || "1", 10);
        switchModalStage(stage);
      } else if (action === "modal-next-stage") {
        switchModalStage(2);
      } else if (action === "modal-prev-stage") {
        switchModalStage(1);
      } else if (action === "toggle-expand") {
        const routineKey =
          target.getAttribute("data-routine-slot") ||
          target.getAttribute("data-routine") ||
          "";
        if (todayView && typeof todayView.toggleHabitExpanded === "function") {
          todayView.toggleHabitExpanded(habitId, routineKey);
        }
        const card = target.closest(".habit-card");
        if (card) {
          const panel = card.querySelector(".habit-expand-panel");
          const chevron =
            card.querySelector(".expand-chevron") ||
            card.querySelector(`[id^="chevron-"]`);
          if (panel) {
            panel.classList.toggle("hidden");
          }
          if (chevron) {
            chevron.classList.toggle("rotate-180");
          }
        } else {
          const panel = document.getElementById(`habit-expand-${habitId}`);
          const chevron = document.getElementById(`chevron-${habitId}`);
          if (panel) {
            panel.classList.toggle("hidden");
          }
          if (chevron) {
            chevron.classList.toggle("rotate-180");
          }
        }
      } else if (action === "step-increment") {
        await handleStepIncrement(habitId, activeDate);
      } else if (action === "step-decrement") {
        await handleStepDecrement(habitId, activeDate);
      } else if (action === "toggle-timer") {
        await handleToggleTimer(habitId, activeDate);
      } else if (action === "reset-timer") {
        await handleResetTimer(habitId, activeDate);
      } else if (action === "open-focus-timer") {
        openFocusTimerModal(habitId);
      } else if (action === "close-focus-timer") {
        closeFocusTimerModal();
      } else if (action === "toggle-timer-display-mode") {
        toggleTimerDisplayMode();
      } else if (action === "timer-toggle-sound") {
        toggleTimerSound();
      } else if (action === "timer-adjust") {
        const delta = parseInt(target.getAttribute("data-delta") || "60", 10);
        await handleTimerAdjust(habitId, delta);
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
          const currentEmojiDisplay = document.getElementById(
            "current-emoji-display"
          );
          if (currentEmojiDisplay) {
            currentEmojiDisplay.textContent = emoji;
          }
          const popover = document.getElementById("habit-emoji-popover");
          if (popover) {
            popover.classList.add("hidden");
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
      } else if (action === "undo-delete-habit") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.undoDeleteHabit === "function") {
          await app.undoDeleteHabit();
        } else {
          await undoDeleteHabit();
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
      } else if (action === "starter-kits-prev") {
        const carousel = document.getElementById(
          "starter-kits-carousel-container"
        );
        if (carousel) {
          carousel.scrollBy({ left: -280, behavior: "smooth" });
        }
      } else if (action === "starter-kits-next") {
        const carousel = document.getElementById(
          "starter-kits-carousel-container"
        );
        if (carousel) {
          carousel.scrollBy({ left: 280, behavior: "smooth" });
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
      } else if (action === "open-identity-wizard") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.openIdentityWizard === "function") {
          app.openIdentityWizard(1);
        } else {
          openIdentityWizard(1);
        }
      } else if (action === "wizard-select-lang") {
        const selectedLang =
          target.getAttribute("data-lang") ||
          target.closest("[data-lang]")?.getAttribute("data-lang");
        if (selectedLang && store) {
          await store.updateSettings({
            lang: selectedLang,
            language: selectedLang,
          });
          const langBtn = document.getElementById("lang-toggle-btn");
          if (langBtn) {
            langBtn.innerHTML = `<span class="leading-none select-none">${selectedLang === "vi" ? "🇻🇳" : "🇺🇸"}</span>`;
            langBtn.title =
              selectedLang === "vi"
                ? "Ngôn ngữ: 🇻🇳 Tiếng Việt — Bấm để đổi sang 🇺🇸 English"
                : "Language: 🇺🇸 English — Click to switch to 🇻🇳 Tiếng Việt";
            langBtn.setAttribute("aria-label", langBtn.title);
          }
          renderWizardModal();
        }
      } else if (action === "wizard-next-step") {
        wizardCurrentStep = Math.min(4, wizardCurrentStep + 1);
        renderWizardModal();
      } else if (action === "wizard-prev-step") {
        wizardCurrentStep = Math.max(1, wizardCurrentStep - 1);
        renderWizardModal();
      } else if (action === "wizard-select-kit") {
        const kitId =
          target.getAttribute("data-kit-id") ||
          target.closest("[data-kit-id]")?.getAttribute("data-kit-id");
        if (kitId) {
          const normalized = kitId.replace(/_/g, "-");
          const idx = wizardSelectedKitIds.findIndex(
            (id) => id === kitId || id.replace(/_/g, "-") === normalized
          );
          if (idx >= 0) {
            wizardSelectedKitIds.splice(idx, 1);
          } else {
            wizardSelectedKitIds.push(normalized);
          }
          wizardSelectedKitId = wizardSelectedKitIds[0] || "";
          renderWizardModal();
        }
      } else if (action === "wizard-skip") {
        const app =
          (typeof window !== "undefined" && window.HabitApp) || HabitApp;
        if (app && typeof app.closeIdentityWizard === "function") {
          app.closeIdentityWizard();
        } else {
          closeIdentityWizard();
        }
      } else if (action === "wizard-finish") {
        let kitIds = wizardSelectedKitIds || [];
        try {
          const rawIds = target.getAttribute("data-kit-ids");
          if (rawIds) {
            const parsed = JSON.parse(rawIds);
            if (Array.isArray(parsed)) {
              kitIds = parsed;
            }
          }
        } catch (_) {}
        if ((!kitIds || kitIds.length === 0) && wizardSelectedKitId) {
          kitIds = [wizardSelectedKitId];
        }

        if (kitIds && kitIds.length > 0 && store) {
          const lang =
            (store.getSettings() && store.getSettings().language) || "vi";
          if (typeof store.applyStarterKits === "function") {
            await store.applyStarterKits(kitIds, lang);
          } else {
            for (const kid of kitIds) {
              await store.applyStarterKit(kid, lang);
            }
          }
          showToast(i18n.t("starter_kit_applied_toast", {}, lang), "success");
        }
        closeIdentityWizard();
        activeTab = "today";
        renderApp();
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

      // Routine chip toggle styling & mutual exclusivity (Anytime vs Morning/Afternoon/Evening)
      if (target.name === "routines") {
        const value = target.value;
        const routineContainer =
          target.closest("#modal-routine-chips") || document;
        const allRoutineInputs = routineContainer.querySelectorAll(
          'input[name="routines"]'
        );

        if (value === "anytime" && target.checked) {
          // Uncheck all circadian chips
          allRoutineInputs.forEach((inp) => {
            if (inp.value !== "anytime") {
              inp.checked = false;
              const lbl = inp.closest("label.routine-chip");
              if (lbl) {
                lbl.className =
                  "routine-chip flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer text-xs transition select-none bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
              }
            }
          });
        } else if (value !== "anytime" && target.checked) {
          // Uncheck anytime chip
          allRoutineInputs.forEach((inp) => {
            if (inp.value === "anytime") {
              inp.checked = false;
              const lbl = inp.closest("label.routine-chip");
              if (lbl) {
                lbl.className =
                  "routine-chip flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer text-xs transition select-none bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
              }
            }
          });
        }

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

    // Page visibility & focus listeners for background timer delta synchronization & wake lock
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible") {
        if (runningTimerHabitId) {
          await requestWakeLock();
          syncRunningTimer();
        } else {
          await restoreActiveTimerSession();
        }
      } else {
        if (runningTimerHabitId) {
          saveActiveTimerSession();
          await flushRunningTimerToStorage();
        }
      }
    });
    window.addEventListener("focus", () => {
      if (runningTimerHabitId) {
        syncRunningTimer();
      } else {
        restoreActiveTimerSession();
      }
    });
    window.addEventListener("pagehide", () => {
      if (runningTimerHabitId) {
        saveActiveTimerSession();
        flushRunningTimerToStorage();
      }
    });
    if (typeof document !== "undefined") {
      document.addEventListener("freeze", () => {
        if (runningTimerHabitId) {
          saveActiveTimerSession();
          flushRunningTimerToStorage();
        }
      });
    }
    window.addEventListener("beforeunload", () => {
      if (runningTimerHabitId) {
        saveActiveTimerSession();
        flushRunningTimerToStorage();
      }
    });

    // Tab swipe gestures & hardware back button popstate listener
    setupTabSwipeGestures();
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("popstate", (e) => {
        handlePopState(e);
      });
      window.addEventListener("online", () => {
        if (
          cloudSyncManager &&
          cloudSyncManager.activeProvider !== "none" &&
          cloudSyncManager.autoSyncEnabled
        ) {
          cloudSyncManager.sync().catch(() => {});
        }
      });
    }

    if (typeof document !== "undefined" && document.addEventListener) {
      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          cloudSyncManager &&
          cloudSyncManager.activeProvider !== "none" &&
          cloudSyncManager.autoSyncEnabled
        ) {
          cloudSyncManager.sync().catch(() => {});
        }
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
   * Updates ambient running timer dynamic island and dock pill
   */
  function updateAmbientTimerPill() {
    const floatingIsland = document.getElementById("floating-timer-island");
    const dockPill = document.getElementById("dock-active-timer-pill");

    if (!runningTimerHabitId || !store) {
      if (floatingIsland) {
        floatingIsland.classList.add("hidden", "translate-y-4", "opacity-0");
        floatingIsland.classList.remove("translate-y-0", "opacity-100");
      }
      if (dockPill) dockPill.classList.add("hidden");
      return;
    }

    const habit = store.getHabit(runningTimerHabitId);
    const date = runningTimerDate || store.getActiveDate();
    const log = (store.state &&
      store.state.logs &&
      store.state.logs[`${runningTimerHabitId}_${date}`]) || { value: 0 };
    const totalSecs = Math.max(0, log.value || 0);
    const targetSecs = (habit && habit.targetValue) || 1200;
    const lang = (store.getSettings() && store.getSettings().language) || "vi";

    const durationFormatted = i18n.formatDuration(totalSecs, lang);
    const targetFormatted = i18n.formatDuration(targetSecs, lang);
    const progressPct = Math.min(
      100,
      Math.round((totalSecs / (targetSecs || 1)) * 100)
    );

    const icon = habit ? habit.icon || "⏱️" : "⏱️";
    const name = habit ? habit.name : "";

    if (floatingIsland) {
      floatingIsland.classList.remove("hidden");
      setTimeout(() => {
        floatingIsland.classList.remove("translate-y-4", "opacity-0");
        floatingIsland.classList.add("translate-y-0", "opacity-100");
      }, 10);

      const iconEl = document.getElementById("floating-timer-icon");
      if (iconEl) iconEl.textContent = icon;

      const nameEl = document.getElementById("floating-timer-name");
      if (nameEl) nameEl.textContent = name;

      const tickerEl = document.getElementById("floating-timer-ticker");
      if (tickerEl)
        tickerEl.textContent = `${durationFormatted} / ${targetFormatted}`;

      const progressBarEl = document.getElementById(
        "floating-timer-progress-bar"
      );
      if (progressBarEl) progressBarEl.style.width = `${progressPct}%`;

      const playBtn = document.getElementById("floating-timer-play-btn");
      if (playBtn) {
        playBtn.setAttribute("data-habit-id", runningTimerHabitId);
        playBtn.setAttribute("data-target", targetSecs);
        playBtn.innerHTML = "⏸";
        playBtn.setAttribute("aria-label", i18n.t("timer_pause", {}, lang));
      }

      const bodyBtn = document.getElementById("floating-timer-body-btn");
      if (bodyBtn) {
        bodyBtn.setAttribute("data-habit-id", runningTimerHabitId);
      }
    }

    const tickerStr = i18n.formatDurationClock
      ? i18n.formatDurationClock(totalSecs)
      : `${String(Math.floor(totalSecs / 60)).padStart(2, "0")}:${String(totalSecs % 60).padStart(2, "0")}`;

    if (dockPill) {
      dockPill.classList.remove("hidden");
      dockPill.className =
        "items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm tabular-nums font-mono animate-pulse cursor-pointer hover:bg-emerald-500/20 flex";
      dockPill.innerHTML = `<span>${icon}</span> <span class="tabular-nums font-mono font-bold">${tickerStr}</span>`;
    }
  }

  /**
   * Jumps to running timer view (switches to 'today' tab, restores active date, and opens Focus Timer modal)
   */
  async function jumpToRunningTimer() {
    if (!runningTimerHabitId || !store) return;
    if (runningTimerDate) {
      store.setActiveDate(runningTimerDate);
    }
    activeTab = "today";
    renderApp();
    openFocusTimerModal(runningTimerHabitId);
  }

  /**
   * Requests Screen Wake Lock to keep display active while timer runs
   */
  async function requestWakeLock() {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.wakeLock &&
        typeof navigator.wakeLock.request === "function"
      ) {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
          wakeLockSentinel = null;
        });
      }
    } catch (_) {}
  }

  /**
   * Releases Screen Wake Lock
   */
  async function releaseWakeLock() {
    try {
      if (wakeLockSentinel && typeof wakeLockSentinel.release === "function") {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      }
    } catch (_) {}
  }

  let hasTriggeredCelebrationForRun = false;

  /**
   * Directly updates reactive timer DOM elements across header, dock, active card, detail sheet, and focus timer modal without disk I/O
   */
  function updateTimerDom(habitId, currentSecs, targetSecs) {
    if (!store) return;
    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    const durationFormatted = i18n.formatDuration(currentSecs, lang);
    const targetFormatted = i18n.formatDuration(targetSecs, lang);
    const isCompleted = currentSecs >= targetSecs;
    const remainingSecs = Math.max(0, targetSecs - currentSecs);
    const overtimeSecs = Math.max(0, currentSecs - targetSecs);

    const tickerStr = i18n.formatDurationClock
      ? i18n.formatDurationClock(currentSecs)
      : `${String(Math.floor(currentSecs / 60)).padStart(2, "0")}:${String(currentSecs % 60).padStart(2, "0")}`;

    // 0. Floating Dynamic Timer Island
    const floatingTicker = document.getElementById("floating-timer-ticker");
    if (floatingTicker) {
      floatingTicker.textContent = `${durationFormatted} / ${targetFormatted}`;
    }
    const floatingProgress = document.getElementById(
      "floating-timer-progress-bar"
    );
    if (floatingProgress) {
      const pct = Math.min(
        100,
        Math.round((currentSecs / (targetSecs || 1)) * 100)
      );
      floatingProgress.style.width = `${pct}%`;
    }
    const floatingPlayBtn = document.getElementById("floating-timer-play-btn");
    if (floatingPlayBtn) {
      const isRunning = runningTimerHabitId === habitId;
      floatingPlayBtn.innerHTML = isRunning ? "⏸" : "▶";
      floatingPlayBtn.setAttribute(
        "aria-label",
        isRunning
          ? i18n.t("timer_pause", {}, lang)
          : i18n.t("timer_start", {}, lang)
      );
    }

    // 1. Header ambient ticker
    const headerTicker = document.getElementById("header-timer-ticker");
    if (headerTicker) {
      headerTicker.textContent = tickerStr;
    }

    // 2. Dock ambient ticker
    const dockPill = document.getElementById("dock-active-timer-pill");
    if (dockPill) {
      const habit = store.getHabit(habitId);
      const icon = habit ? habit.icon || "⏱️" : "⏱️";
      dockPill.innerHTML = `<span>${icon}</span> <span class="tabular-nums font-mono font-bold">${tickerStr}</span>`;
    }

    // 3. Card expandable drawer ticker
    const cardTicker = document.getElementById(`card-timer-ticker-${habitId}`);
    if (cardTicker) {
      cardTicker.textContent = durationFormatted;
    }

    // 4. Card header sub-progress (update all instances across routines)
    const cardSubTickers = document.querySelectorAll(
      `[data-card-sub-ticker="${habitId}"], #card-sub-ticker-${habitId}`
    );
    cardSubTickers.forEach((el) => {
      el.textContent = durationFormatted;
    });

    // 5. Detail sheet ticker
    const detailTicker = document.getElementById(
      `detail-timer-ticker-${habitId}`
    );
    if (detailTicker) {
      detailTicker.textContent = durationFormatted;
    }

    // 6. Focus Timer Modal reactive elements
    if (activeFocusModalHabitId === habitId) {
      const modalDigits = document.getElementById("focus-modal-timer-digits");
      const modalSubTicker = document.getElementById("focus-modal-sub-ticker");
      const modalRing = document.getElementById("focus-modal-svg-ring");
      const modalModeBadge = document.getElementById("focus-modal-mode-badge");
      const modalPlayBtn = document.getElementById("focus-modal-play-btn");

      let displayTimeStr = "";
      let modeLabel = "";
      if (currentSecs >= targetSecs && targetSecs > 0) {
        displayTimeStr = i18n.formatDurationClock
          ? i18n.formatDurationClock(overtimeSecs, "+")
          : `+${String(Math.floor(overtimeSecs / 60)).padStart(2, "0")}:${String(overtimeSecs % 60).padStart(2, "0")}`;
        modeLabel = i18n.t("focus_timer_overtime", {}, lang);
      } else if (timerDisplayMode === "elapsed") {
        displayTimeStr = tickerStr;
        modeLabel = i18n.t("focus_timer_elapsed", {}, lang);
      } else {
        displayTimeStr = i18n.formatDurationClock
          ? i18n.formatDurationClock(remainingSecs)
          : `${String(Math.floor(remainingSecs / 60)).padStart(2, "0")}:${String(remainingSecs % 60).padStart(2, "0")}`;
        modeLabel = i18n.t("focus_timer_remaining", {}, lang);
      }

      if (modalDigits) {
        modalDigits.textContent = displayTimeStr;
        const isRunning = runningTimerHabitId === habitId;
        if (isCompleted || isRunning) {
          modalDigits.className =
            "text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tight text-emerald-400";
        } else {
          modalDigits.className =
            "text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tight text-white";
        }
      }

      if (modalModeBadge) {
        modalModeBadge.textContent = `${modeLabel} ⇄`;
      }

      if (modalSubTicker) {
        modalSubTicker.textContent = `${durationFormatted} / ${targetFormatted}`;
      }

      if (modalRing) {
        const radius = 90;
        const circumference = 2 * Math.PI * radius; // 565.487
        const ratio =
          targetSecs > 0 ? Math.min(1.0, currentSecs / targetSecs) : 1;
        const strokeDashoffset = circumference * (1 - ratio);
        modalRing.setAttribute("stroke-dashoffset", strokeDashoffset);
      }

      if (modalPlayBtn) {
        const isRunning = runningTimerHabitId === habitId;
        modalPlayBtn.innerHTML = `<span class="text-base">${isRunning ? "⏸" : "▶"}</span><span>${isRunning ? i18n.t("focus_timer_pause", {}, lang) : i18n.t("focus_timer_start", {}, lang)}</span>`;
        if (isRunning) {
          modalPlayBtn.classList.add(
            "animate-pulse",
            "ring-4",
            "ring-emerald-500/20"
          );
        } else {
          modalPlayBtn.classList.remove(
            "animate-pulse",
            "ring-4",
            "ring-emerald-500/20"
          );
        }
      }
    }
  }

  /**
   * Flushes running timer state directly to persistent storage (IndexedDB)
   */
  async function flushRunningTimerToStorage() {
    if (!runningTimerHabitId || !runningTimerStartedAt || !store) return;
    const now = Date.now();
    const timeElapsed = Math.max(
      0,
      Math.floor((now - runningTimerStartedAt) / 1000)
    );
    const elapsedSecs = Math.max(runningTimerTickCount, timeElapsed);
    const totalSecs = runningTimerBaseValue + elapsedSecs;
    const targetDate = runningTimerDate || store.getActiveDate();

    if (store.state && store.state.logs) {
      const existing =
        store.state.logs[`${runningTimerHabitId}_${targetDate}`] || {};
      const habit = store.getHabit(runningTimerHabitId);
      const isCompleted = habit ? totalSecs >= habit.targetValue : false;
      store.state.logs[`${runningTimerHabitId}_${targetDate}`] = {
        ...existing,
        id: `${runningTimerHabitId}_${targetDate}`,
        habitId: runningTimerHabitId,
        date: targetDate,
        value: totalSecs,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
      };
    }
    lastTimerPersistedAt = now;
    saveActiveTimerSession();
    try {
      await store.logHabit(runningTimerHabitId, targetDate, totalSecs);
    } catch (_) {}
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
   * Handles timer target completion celebration without abruptly killing timer (supports overtime)
   */
  async function handleTimerCompleted(habit, targetDate, nextSeconds) {
    if (hasTriggeredCelebrationForRun) return;
    hasTriggeredCelebrationForRun = true;

    const habitId = habit.id;
    // Immediate persistence on reaching target
    await store.logHabit(habitId, targetDate, nextSeconds);

    updateAmbientTimerPill();
    renderActiveTab();
    refreshDetailSheetIfOpen(habitId, targetDate);

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(
      `🎉 ${i18n.t("timer_completed", {}, lang)} (${habit.name})`,
      "success"
    );
    if (timerSoundEnabled) {
      playTimerCompletionSound();
    }

    if (todayView && typeof todayView.triggerVictoryConfetti === "function") {
      todayView.triggerVictoryConfetti();
    }

    try {
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification(habit.name, {
          body: i18n.t("timer_completed", {}, lang),
          icon: "icon.svg",
        });
      }
    } catch (_) {}
  }

  /**
   * Synchronizes active timer value with exact elapsed timestamp delta and throttled persistence
   */
  async function syncRunningTimer(isIntervalTick = false) {
    if (!runningTimerHabitId || !runningTimerStartedAt || !store) return;
    const habit = store.getHabit(runningTimerHabitId);
    if (!habit) return;

    if (isIntervalTick) {
      runningTimerTickCount++;
    }

    const now = Date.now();
    const targetDate = runningTimerDate || store.getActiveDate();
    const timeElapsed = Math.max(
      0,
      Math.floor((now - runningTimerStartedAt) / 1000)
    );
    const elapsedSecs = Math.max(runningTimerTickCount, timeElapsed);
    runningTimerTickCount = elapsedSecs;
    const nextSeconds = runningTimerBaseValue + elapsedSecs;
    const isCompleted = nextSeconds >= habit.targetValue;

    // In-memory update for instant synchronous access
    if (store.state && store.state.logs) {
      const existing =
        store.state.logs[`${runningTimerHabitId}_${targetDate}`] || {};
      store.state.logs[`${runningTimerHabitId}_${targetDate}`] = {
        ...existing,
        id: `${runningTimerHabitId}_${targetDate}`,
        habitId: runningTimerHabitId,
        date: targetDate,
        value: nextSeconds,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
      };
    }

    // Reactive DOM update across UI components
    updateTimerDom(runningTimerHabitId, nextSeconds, habit.targetValue);
    saveActiveTimerSession();

    // Throttled IndexedDB persistence: flush every 10 seconds
    if (now - lastTimerPersistedAt >= 10000) {
      lastTimerPersistedAt = now;
      store
        .logHabit(runningTimerHabitId, targetDate, nextSeconds)
        .catch(() => {});
    }

    // Trigger completion celebration once when target reached (timer continues ticking for overtime)
    if (isCompleted && !hasTriggeredCelebrationForRun) {
      await handleTimerCompleted(habit, targetDate, nextSeconds);
    }
  }

  /**
   * Starts background timer ticker using Web Worker (or setInterval fallback)
   */
  function startTimerTicker() {
    stopTimerTicker();
    requestWakeLock();
    lastTimerPersistedAt = Date.now();

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
        timerWorker.onerror = (err) => {
          console.warn(
            "[TimerWorker] Worker runtime error, falling back to interval:",
            err
          );
          stopTimerTicker();
          timerInterval = setInterval(() => {
            syncRunningTimer(true);
          }, 1000);
        };
        return;
      }
    } catch (e) {
      console.warn("[TimerWorker] Failed to create worker:", e);
    }

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
    releaseWakeLock();
  }

  /**
   * Habit Timer Toggle
   */
  async function handleToggleTimer(habitId, date) {
    const habit = store.getHabit(habitId);
    if (!habit) return;
    const targetDate = date || store.getActiveDate();

    if (runningTimerHabitId === habitId) {
      // Stop Timer - immediate persistence
      await flushRunningTimerToStorage();
      stopTimerTicker();
      clearActiveTimerSession();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      hasTriggeredCelebrationForRun = false;
      updateAmbientTimerPill();
      renderActiveTab();
      refreshDetailSheetIfOpen(habitId, targetDate);
      if (activeFocusModalHabitId === habitId) {
        const currentLog = (store.state &&
          store.state.logs &&
          store.state.logs[`${habitId}_${targetDate}`]) || { value: 0 };
        updateTimerDom(habitId, currentLog.value || 0, habit.targetValue);
      }
      return;
    }

    if (runningTimerHabitId) {
      await flushRunningTimerToStorage();
      stopTimerTicker();
      clearActiveTimerSession();
      const prevHabitId = runningTimerHabitId;
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      hasTriggeredCelebrationForRun = false;
      if (activeFocusModalHabitId === prevHabitId) {
        const prevHabit = store.getHabit(prevHabitId);
        if (prevHabit) {
          const prevLog = (store.state &&
            store.state.logs &&
            store.state.logs[`${prevHabitId}_${targetDate}`]) || { value: 0 };
          updateTimerDom(
            prevHabitId,
            prevLog.value || 0,
            prevHabit.targetValue
          );
        }
      }
    }

    const currentLog = (store.state &&
      store.state.logs &&
      store.state.logs[`${habitId}_${targetDate}`]) || { value: 0 };

    runningTimerHabitId = habitId;
    runningTimerDate = targetDate;
    runningTimerStartedAt = Date.now();
    runningTimerBaseValue = currentLog.value || 0;
    runningTimerTickCount = 0;
    hasTriggeredCelebrationForRun = currentLog.value >= habit.targetValue;
    lastTimerPersistedAt = Date.now();
    saveActiveTimerSession();

    updateAmbientTimerPill();
    startTimerTicker();
    renderActiveTab();
    refreshDetailSheetIfOpen(habitId, targetDate);
    if (activeFocusModalHabitId === habitId) {
      updateTimerDom(habitId, runningTimerBaseValue, habit.targetValue);
    }
  }

  /**
   * Resets active timer progress to 0 for specified habit and date
   */
  async function handleResetTimer(habitId, date) {
    if (!store || !habitId) return;
    const targetDate = date || store.getActiveDate();

    if (runningTimerHabitId === habitId) {
      stopTimerTicker();
      clearActiveTimerSession();
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
    if (activeFocusModalHabitId === habitId) {
      const habit = store.getHabit(habitId);
      if (habit) {
        updateTimerDom(habitId, 0, habit.targetValue);
      }
    }

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_timer_reset", {}, lang), "info");
  }

  /**
   * Opens the immersive Focus Timer modal for a duration habit
   */
  function openFocusTimerModal(habitId) {
    if (!store || !habitId) return;
    const habit = store.getHabit(habitId);
    if (!habit || (habit.type !== "timer" && habit.type !== "duration")) return;

    activeFocusModalHabitId = habitId;
    const overlay = document.getElementById("focus-timer-modal-overlay");
    if (!overlay) return;

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    const modalHtml = todayView.renderFocusTimerModal(
      store,
      habitId,
      timerDisplayMode,
      timerSoundEnabled,
      lang
    );

    overlay.innerHTML = `<div id="focus-timer-modal-container" class="w-full max-w-md my-auto">${modalHtml}</div>`;
    overlay.classList.remove("hidden");
    const targetDate =
      runningTimerHabitId === habitId
        ? runningTimerDate || store.getActiveDate()
        : store.getActiveDate();
    const currentLog = (store.state &&
      store.state.logs &&
      store.state.logs[`${habitId}_${targetDate}`]) || { value: 0 };
    const currentSecs =
      runningTimerHabitId === habitId
        ? runningTimerBaseValue + runningTimerTickCount
        : currentLog.value || 0;
    updateTimerDom(habitId, currentSecs, habit.targetValue);
    if (components && typeof components.trapFocus === "function") {
      components.trapFocus(overlay, { onEscape: closeFocusTimerModal });
    }
    pushNavigationState(activeTab, "focus-timer");
  }

  /**
   * Closes the immersive Focus Timer modal
   */
  function closeFocusTimerModal() {
    activeFocusModalHabitId = null;
    if (components && typeof components.releaseFocus === "function") {
      components.releaseFocus();
    }
    const overlay = document.getElementById("focus-timer-modal-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.innerHTML = "";
    }
  }

  /**
   * Toggles between remaining and elapsed countdown presentation modes
   */
  function toggleTimerDisplayMode() {
    timerDisplayMode =
      timerDisplayMode === "remaining" ? "elapsed" : "remaining";
    if (runningTimerHabitId) {
      saveActiveTimerSession();
    }
    if (activeFocusModalHabitId && store) {
      const habit = store.getHabit(activeFocusModalHabitId);
      if (habit) {
        const targetDate = runningTimerDate || store.getActiveDate();
        const currentLog = (store.state &&
          store.state.logs &&
          store.state.logs[`${activeFocusModalHabitId}_${targetDate}`]) || {
          value: 0,
        };
        const currentSecs =
          runningTimerHabitId === activeFocusModalHabitId
            ? runningTimerBaseValue + runningTimerTickCount
            : currentLog.value || 0;
        updateTimerDom(activeFocusModalHabitId, currentSecs, habit.targetValue);
      }
    }
  }

  /**
   * Toggles completion sound effects on/off
   */
  function toggleTimerSound() {
    timerSoundEnabled = !timerSoundEnabled;
    if (runningTimerHabitId) {
      saveActiveTimerSession();
    }
    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";
    const soundBtn = document.querySelector(
      '[data-action="timer-toggle-sound"]'
    );
    if (soundBtn) {
      soundBtn.textContent = timerSoundEnabled ? "🔔" : "🔕";
      soundBtn.setAttribute(
        "aria-label",
        timerSoundEnabled
          ? i18n.t("focus_timer_sound_on", {}, lang)
          : i18n.t("focus_timer_sound_off", {}, lang)
      );
      soundBtn.title = timerSoundEnabled
        ? i18n.t("focus_timer_sound_on", {}, lang)
        : i18n.t("focus_timer_sound_off", {}, lang);
    }
  }

  /**
   * Adjusts active or logged duration by a delta in seconds (+60, +300, -60)
   */
  async function handleTimerAdjust(habitId, deltaSeconds) {
    if (!store || !habitId) return;
    const habit = store.getHabit(habitId);
    if (!habit || (habit.type !== "duration" && habit.type !== "timer")) return;

    const targetDate =
      runningTimerHabitId === habitId
        ? runningTimerDate || store.getActiveDate()
        : store.getActiveDate();

    if (runningTimerHabitId === habitId) {
      runningTimerBaseValue = Math.max(0, runningTimerBaseValue + deltaSeconds);
      saveActiveTimerSession();
      await syncRunningTimer(false);
    } else {
      const currentLog = (store.state &&
        store.state.logs &&
        store.state.logs[`${habitId}_${targetDate}`]) || { value: 0 };
      const currentVal = currentLog.value || 0;
      const nextVal = Math.max(0, currentVal + deltaSeconds);
      await store.logHabit(habitId, targetDate, nextVal);
      renderActiveTab();
      refreshDetailSheetIfOpen(habitId, targetDate);
      if (activeFocusModalHabitId === habitId) {
        updateTimerDom(habitId, nextVal, habit.targetValue);
      }
    }
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
      if (components && typeof components.trapFocus === "function") {
        components.trapFocus(overlay, { onEscape: closeDeleteModal });
      }
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
      if (components && typeof components.trapFocus === "function") {
        components.trapFocus(overlay, { onEscape: closeResetModal });
      }
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
      if (components && typeof components.trapFocus === "function") {
        components.trapFocus(overlay, { onEscape: closeResetModal });
      }
    }
    pushNavigationState(activeTab, "reset");
  }

  /**
   * Closes data vault reset confirmation modal
   */
  function closeResetModal() {
    if (components && typeof components.releaseFocus === "function") {
      components.releaseFocus();
    }
    const overlay = document.getElementById("reset-confirm-modal-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  /**
   * Opens 3-step Identity Setup Wizard Modal
   */
  function openIdentityWizard(step = 1, kitIds = ["morning-mastery"]) {
    wizardCurrentStep = step;
    if (Array.isArray(kitIds)) {
      wizardSelectedKitIds = [...kitIds];
      wizardSelectedKitId = kitIds[0] || "morning-mastery";
    } else if (typeof kitIds === "string") {
      wizardSelectedKitIds = [kitIds];
      wizardSelectedKitId = kitIds;
    }
    renderWizardModal();
    const overlay = document.getElementById("identity-wizard-modal-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      if (components && typeof components.trapFocus === "function") {
        components.trapFocus(overlay, { onEscape: closeIdentityWizard });
      }
    }
    pushNavigationState(activeTab, "wizard");
  }

  /**
   * Closes Identity Setup Wizard Modal
   */
  function closeIdentityWizard() {
    if (components && typeof components.releaseFocus === "function") {
      components.releaseFocus();
    }
    const overlay = document.getElementById("identity-wizard-modal-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("habit_wizard_done", "true");
      }
    } catch (_) {}
  }

  /**
   * Renders the current step of the Identity Setup Wizard
   */
  function renderWizardModal() {
    const overlay = document.getElementById("identity-wizard-modal-overlay");
    const container = document.getElementById("identity-wizard-container");
    const lang =
      (store && store.getSettings() && store.getSettings().language) || "vi";

    if (
      !identityView ||
      typeof identityView.renderIdentityWizardModal !== "function"
    )
      return;
    const modalHtml = identityView.renderIdentityWizardModal(
      wizardCurrentStep,
      wizardSelectedKitIds,
      lang
    );

    if (container) {
      container.innerHTML = modalHtml;
    }
    if (overlay) {
      overlay.innerHTML = `<div id="identity-wizard-container" class="w-full max-w-xl my-auto">${modalHtml}</div>`;
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
      clearActiveTimerSession();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      updateAmbientTimerPill();
    }

    await store.factoryWipe();
    closeResetModal();

    activeTab = "today";
    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_factory_wipe_success", {}, lang), "info");
    renderApp();
    openIdentityWizard(1);
  }

  /**
   * Closes delete confirmation modal
   */
  function closeDeleteModal() {
    pendingDeleteHabitId = null;
    if (components && typeof components.releaseFocus === "function") {
      components.releaseFocus();
    }
    const overlay = document.getElementById("delete-confirm-modal-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  let lastDeletedHabitData = null;

  /**
   * Confirms habit deletion and purges historical check-in logs with instant undo capability
   */
  async function confirmDeleteHabit() {
    if (!store || !pendingDeleteHabitId) return;
    const habitId = pendingDeleteHabitId;
    const habit = store.getHabit(habitId);
    if (!habit) {
      closeDeleteModal();
      return;
    }

    // Capture habit copy and associated logs for instant undo recovery
    const logs = [];
    if (store.state && store.state.logs) {
      Object.keys(store.state.logs).forEach((key) => {
        if (key.startsWith(`${habitId}_`)) {
          logs.push(JSON.parse(JSON.stringify(store.state.logs[key])));
        }
      });
    }
    lastDeletedHabitData = {
      habit: JSON.parse(JSON.stringify(habit)),
      logs,
    };

    if (runningTimerHabitId === habitId) {
      stopTimerTicker();
      clearActiveTimerSession();
      runningTimerHabitId = null;
      runningTimerDate = null;
      runningTimerStartedAt = null;
      runningTimerBaseValue = 0;
      runningTimerTickCount = 0;
      updateAmbientTimerPill();
    }

    await store.deleteHabit(habitId);
    closeDeleteModal();

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(i18n.t("toast_habit_deleted", {}, lang), "info", {
      label: i18n.t("undo", {}, lang) || "Undo",
      dataAction: "undo-delete-habit",
    });
    renderApp();
  }

  /**
   * Restores the most recently deleted habit and its check-in history
   */
  async function undoDeleteHabit() {
    if (!lastDeletedHabitData || !store) return;
    const { habit, logs } = lastDeletedHabitData;
    lastDeletedHabitData = null;

    await store.addHabit(habit);
    if (logs && logs.length > 0 && store.storage && store.storage.saveLog) {
      for (const log of logs) {
        store.state.logs[`${log.habitId}_${log.date}`] = log;
        await store.storage.saveLog(log);
      }
    }

    const lang = (store.getSettings() && store.getSettings().language) || "vi";
    showToast(
      i18n.t("toast_habit_restored", {}, lang) || "Habit restored",
      "success"
    );
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
      if (components && typeof components.trapFocus === "function") {
        components.trapFocus(sheetOverlay, { onEscape: closeDetailSheet });
      }
    }
    pushNavigationState(activeTab, "detail");
  }

  /**
   * Closes Detail Sheet
   */
  function closeDetailSheet() {
    if (components && typeof components.releaseFocus === "function") {
      components.releaseFocus();
    }
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
            `<span class="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${i18n.t(`routine_${r}`, {}, lang)}</span>`
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
      if (components && typeof components.trapFocus === "function") {
        components.trapFocus(modalOverlay, { onEscape: closeHabitModal });
      }
    }
    updateHabitModalPreview();
    pushNavigationState(activeTab, "edit");
  }

  /**
   * Closes Habit Edit Modal
   */
  function closeHabitModal() {
    if (components && typeof components.releaseFocus === "function") {
      components.releaseFocus();
    }
    const modalOverlay = document.getElementById("habit-edit-modal-overlay");
    if (modalOverlay) {
      modalOverlay.classList.add("hidden");
    }
  }

  /**
   * Switches Add/Edit Habit Modal between Stage 1 (Basic) and Stage 2 (Schedule & Styling)
   */
  function switchModalStage(stage = 1) {
    const stage1 = document.getElementById("modal-stage-1");
    const stage2 = document.getElementById("modal-stage-2");
    const tab1 = document.getElementById("stage-tab-1");
    const tab2 = document.getElementById("stage-tab-2");
    if (stage === 1) {
      if (stage1) stage1.classList.remove("hidden");
      if (stage2) stage2.classList.add("hidden");
      if (tab1) {
        tab1.className =
          "flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600";
      }
      if (tab2) {
        tab2.className =
          "flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
      }
    } else {
      if (stage1) stage1.classList.add("hidden");
      if (stage2) stage2.classList.remove("hidden");
      if (tab2) {
        tab2.className =
          "flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600";
      }
      if (tab1) {
        tab1.className =
          "flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
      }
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
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      showToast(i18n.t("toast_habit_name_required", {}, lang), "error");
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
    undoDeleteHabit,
    switchTab(tab) {
      if (!tab) return;
      const normalized = tab === "habits" ? "manager" : tab;
      if (normalized !== activeTab) {
        activeTab = normalized;
        pushNavigationState(normalized, null);
      }
      renderApp();
    },
    switchLens(lens) {
      this.switchTab(lens);
    },
    async applyStarterKits(kitIds) {
      if (!store) return [];
      const lang =
        (store.getSettings() && store.getSettings().language) || "vi";
      const created = await store.applyStarterKits(kitIds, lang);
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("starter_kit_applied_toast", {}, lang), "success");
      renderApp();
      return created;
    },
    async applyStarterKit(kitId) {
      return this.applyStarterKits([kitId]);
    },
    toggleLanguage() {
      const current =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const nextLang = current === "vi" ? "en" : "vi";
      this.switchLanguage(nextLang);
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
          if (event.target) event.target.value = "";
          return;
        }
        pendingImportData = res.data;
        selectedImportStrategy = "merge";
        if (event.target) event.target.value = "";
        HabitApp.openImportPreviewModal();
      } catch (err) {
        if (event.target) event.target.value = "";
        notify(
          i18n.t("toast_import_error", { message: err.message }, lang),
          "error"
        );
      }
    },

    async importDataCSV(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      try {
        const text = await file.text();
        const res = exportImport.parseHabitCsv(text);
        if (!res.valid) {
          notify(
            i18n.t(
              "toast_csv_import_error",
              { message: res.error || (res.errors && res.errors.join(", ")) },
              lang
            ),
            "error"
          );
          if (event.target) event.target.value = "";
          return;
        }
        pendingImportData = res.data;
        selectedImportStrategy = "merge";
        if (event.target) event.target.value = "";
        HabitApp.openImportPreviewModal();
      } catch (err) {
        if (event.target) event.target.value = "";
        notify(
          i18n.t("toast_csv_import_error", { message: err.message }, lang),
          "error"
        );
      }
    },

    openImportPreviewModal() {
      if (!pendingImportData) return;
      const overlay = document.getElementById("import-preview-modal-overlay");
      const container = document.getElementById("import-preview-container");
      if (!overlay || !container) return;

      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";

      const diff = exportImport.inspectImportPayload(
        pendingImportData,
        store && store.state
      );

      const dateSpanText = diff.dateSpan
        ? `${diff.dateSpan.minDate} → ${diff.dateSpan.maxDate}`
        : i18n.t("import_no_date_span", {}, lang);

      container.innerHTML = `
        <div id="import-preview-card" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">📥</span>
              <div>
                <h3 id="import-preview-title" class="text-base font-black text-slate-900 dark:text-white">${i18n.t("import_preview_title", {}, lang)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">${i18n.t("import_preview_desc", {}, lang)}</p>
              </div>
            </div>
            <button type="button" onclick="window.HabitApp.closeImportPreviewModal()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">✕</button>
          </div>

          <!-- Diff Stat Grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">${i18n.t("import_stat_habits", {}, lang)}</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="text-lg font-black text-slate-900 dark:text-white">${diff.incomingHabitsCount}</span>
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">(${diff.newHabitsCount} ${i18n.t("import_stat_new", {}, lang)}, ${diff.updatedHabitsCount} ${i18n.t("import_stat_existing", {}, lang)})</span>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">${i18n.t("import_stat_logs", {}, lang)}</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="text-lg font-black text-slate-900 dark:text-white">${diff.incomingLogsCount}</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">${i18n.t("import_stat_date_range", {}, lang)}</span>
            <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">${dateSpanText}</span>
          </div>

          <!-- Strategy Selection -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block">${i18n.t("import_strategy_title", {}, lang)}</label>
            <div class="space-y-2">
              <label class="flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${selectedImportStrategy === "merge" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}" onclick="window.HabitApp.selectImportStrategy('merge')">
                <input type="radio" name="import-strategy" value="merge" ${selectedImportStrategy === "merge" ? "checked" : ""} class="mt-0.5 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <div class="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🔄</span> ${i18n.t("import_strategy_merge_title", {}, lang)}
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${i18n.t("import_strategy_merge_desc", {}, lang)}</p>
                </div>
              </label>
              <label class="flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${selectedImportStrategy === "replace" ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}" onclick="window.HabitApp.selectImportStrategy('replace')">
                <input type="radio" name="import-strategy" value="replace" ${selectedImportStrategy === "replace" ? "checked" : ""} class="mt-0.5 text-amber-600 focus:ring-amber-500" />
                <div>
                  <div class="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>⚠️</span> ${i18n.t("import_strategy_replace_title", {}, lang)}
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${i18n.t("import_strategy_replace_desc", {}, lang)}</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Safety Snapshot Notice -->
          <div class="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
            <span class="text-lg">🛡️</span>
            <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">${i18n.t("import_snapshot_notice", {}, lang)}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 pt-1">
            <button
              type="button"
              onclick="window.HabitApp.closeImportPreviewModal()"
              class="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              ${i18n.t("import_cancel_btn", {}, lang)}
            </button>
            <button
              type="button"
              id="confirm-import-btn"
              onclick="window.HabitApp.confirmImport()"
              class="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📥</span> ${i18n.t("import_confirm_btn", {}, lang)}
            </button>
          </div>
        </div>
      `;

      overlay.classList.remove("hidden");
    },

    closeImportPreviewModal() {
      const overlay = document.getElementById("import-preview-modal-overlay");
      if (overlay) overlay.classList.add("hidden");
      pendingImportData = null;
    },

    selectImportStrategy(strategy) {
      selectedImportStrategy = strategy;
      HabitApp.openImportPreviewModal();
    },

    async confirmImport() {
      if (!pendingImportData) return;
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      try {
        // 1. Automatically capture pre-import safety rollback snapshot
        if (store && typeof store.saveSnapshot === "function") {
          await store.saveSnapshot("pre_import_backup");
        }

        // 2. Perform merge or replace
        const nextState = await exportImport.mergeHabitStates(
          store.state,
          pendingImportData,
          selectedImportStrategy
        );

        if (store && typeof store.replaceState === "function") {
          await store.replaceState(nextState);
        }

        HabitApp.closeImportPreviewModal();
        notify(i18n.t("toast_import_success", {}, lang), "success");
        renderActiveTab();

        // 3. Schedule calm cloud auto-sync if connected
        if (cloudSyncManager && cloudSyncManager.activeProvider !== "none") {
          cloudSyncManager.scheduleDebouncedSync();
        }
      } catch (err) {
        notify(
          i18n.t("toast_import_error", { message: err.message }, lang),
          "error"
        );
      }
    },
    openGistModal() {
      const overlay = document.getElementById("gist-config-modal-overlay");
      const container = document.getElementById("gist-config-container");
      if (!overlay || !container) return;

      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const status = cloudSyncManager
        ? cloudSyncManager.getStatus()
        : { connected: false };
      const currentToken = cloudSyncManager
        ? cloudSyncManager.githubToken || ""
        : "";
      const currentGistId = cloudSyncManager
        ? cloudSyncManager.githubGistId || ""
        : "";

      container.innerHTML = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">🐙</span>
              <div>
                <h3 id="gist-modal-title" class="text-base font-black text-slate-900 dark:text-white">${i18n.t("gist_modal_title", {}, lang)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">${status.connected && status.provider === "github" ? "🟢 " + i18n.t("cloud_connected", {}, lang) : "⚪ " + i18n.t("cloud_not_connected", {}, lang)}</p>
              </div>
            </div>
            <button type="button" onclick="window.HabitApp.closeGistModal()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">✕</button>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${i18n.t("gist_modal_desc", {}, lang)}</p>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" for="gist-token-input">${i18n.t("gist_token_label", {}, lang)}</label>
              <input type="password" id="gist-token-input" value="${currentToken}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" for="gist-id-input">${i18n.t("gist_id_label", {}, lang)}</label>
              <input type="text" id="gist-id-input" value="${currentGistId}" placeholder="32-hex characters (e.g. 7f8a9c...)" class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition" />
            </div>
          </div>

          <div class="pt-2 flex items-center gap-2">
            <button type="button" id="btn-gist-test" onclick="window.HabitApp.testGistConnection()" class="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer">
              🔍 ${i18n.t("gist_test_btn", {}, lang)}
            </button>
            <button type="button" id="btn-gist-save" onclick="window.HabitApp.saveGistConfig()" class="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer">
              💾 ${i18n.t("gist_save_btn", {}, lang)}
            </button>
          </div>

          ${
            status.connected && status.provider === "github"
              ? `<button type="button" id="btn-gist-disconnect" onclick="window.HabitApp.disconnectGist()" class="w-full py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold rounded-xl transition text-center cursor-pointer">
                  ⚠️ ${i18n.t("gist_disconnect_btn", {}, lang)}
                </button>`
              : ""
          }
        </div>
      `;

      overlay.classList.remove("hidden");
    },

    closeGistModal() {
      const overlay = document.getElementById("gist-config-modal-overlay");
      if (overlay) overlay.classList.add("hidden");
    },

    async testGistConnection() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      const input = document.getElementById("gist-token-input");
      const token = input ? input.value.trim() : "";

      if (!token) {
        notify(i18n.t("toast_gist_pat_required", {}, lang), "warning");
        return;
      }

      notify("Connecting to GitHub...", "info");
      const res = await cloudSyncModule.GitHubGistAPI.validateToken(token);
      if (res.valid) {
        notify(`GitHub Connected: @${res.user}`, "success");
      } else {
        notify(`GitHub Token Error: ${res.error || "Invalid token"}`, "error");
      }
    },

    async saveGistConfig() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      const tokenInput = document.getElementById("gist-token-input");
      const gistIdInput = document.getElementById("gist-id-input");

      const token = tokenInput ? tokenInput.value.trim() : "";
      const gistId = gistIdInput ? gistIdInput.value.trim() : "";

      if (!token) {
        notify(i18n.t("toast_gist_pat_required", {}, lang), "warning");
        return;
      }

      if (cloudSyncManager) {
        await cloudSyncManager.setGitHubConfig(token, gistId || null);
        HabitApp.closeGistModal();
        notify(i18n.t("toast_gist_connected", {}, lang), "success");
        renderActiveTab();
        cloudSyncManager.sync().catch((err) => {
          console.warn("[CloudSync] Initial sync after connect failed:", err);
        });
      }
    },

    async disconnectGist() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (cloudSyncManager) {
        await cloudSyncManager.disconnect();
        HabitApp.closeGistModal();
        notify(i18n.t("toast_gist_disconnected", {}, lang), "info");
        renderActiveTab();
      }
    },

    openDriveModal() {
      const overlay = document.getElementById("drive-config-modal-overlay");
      const container = document.getElementById("drive-config-container");
      if (!overlay || !container) return;

      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const status = cloudSyncManager
        ? cloudSyncManager.getStatus()
        : { connected: false };
      const currentClientId = cloudSyncManager
        ? cloudSyncManager.googleClientId || ""
        : "";

      container.innerHTML = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">📁</span>
              <div>
                <h3 id="drive-modal-title" class="text-base font-black text-slate-900 dark:text-white">${i18n.t("drive_modal_title", {}, lang)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">${status.connected && status.provider === "googledrive" ? "🟢 " + i18n.t("cloud_connected", {}, lang) : "⚪ " + i18n.t("cloud_not_connected", {}, lang)}</p>
              </div>
            </div>
            <button type="button" onclick="window.HabitApp.closeDriveModal()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">✕</button>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${i18n.t("drive_modal_desc", {}, lang)}</p>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" for="drive-client-id-input">${i18n.t("drive_client_id_label", {}, lang)}</label>
              <input type="text" id="drive-client-id-input" value="${currentClientId}" placeholder="xxxx-xxxx.apps.googleusercontent.com" class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition" />
            </div>
          </div>

          <div class="pt-2 flex items-center gap-2">
            <button type="button" id="btn-drive-connect" onclick="window.HabitApp.saveDriveConfig()" class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer">
              🚀 ${i18n.t("drive_connect_btn", {}, lang)}
            </button>
          </div>

          ${
            status.connected && status.provider === "googledrive"
              ? `<button type="button" id="btn-drive-disconnect" onclick="window.HabitApp.disconnectDrive()" class="w-full py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold rounded-xl transition text-center cursor-pointer">
                  ⚠️ ${i18n.t("drive_disconnect_btn", {}, lang)}
                </button>`
              : ""
          }
        </div>
      `;

      overlay.classList.remove("hidden");
    },

    closeDriveModal() {
      const overlay = document.getElementById("drive-config-modal-overlay");
      if (overlay) overlay.classList.add("hidden");
    },

    async saveDriveConfig() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      const input = document.getElementById("drive-client-id-input");
      const clientId = input ? input.value.trim() : "";

      if (!clientId) {
        notify(i18n.t("toast_drive_auth_required", {}, lang), "warning");
        return;
      }

      if (cloudSyncManager) {
        await cloudSyncManager.setGoogleDriveConfig(clientId);
        HabitApp.closeDriveModal();
        notify(i18n.t("toast_drive_connected", {}, lang), "success");
        renderActiveTab();
      }
    },

    async disconnectDrive() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (cloudSyncManager) {
        await cloudSyncManager.disconnect();
        HabitApp.closeDriveModal();
        notify(i18n.t("toast_drive_disconnected", {}, lang), "info");
        renderActiveTab();
      }
    },

    openVaultUnlockModal(mode = "unlock", pendingCallback = null) {
      vaultUnlockPendingCallback = pendingCallback;
      const overlay = document.getElementById("vault-unlock-modal-overlay");
      const container = document.getElementById("vault-unlock-container");
      if (!overlay || !container) return;

      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";

      const isSetup = mode === "setup";
      const titleText = isSetup
        ? i18n.t("vault_setup_title", {}, lang)
        : i18n.t("vault_unlock_title", {}, lang);
      const descText = isSetup
        ? i18n.t("vault_setup_desc", {}, lang)
        : i18n.t("vault_unlock_desc", {}, lang);
      const btnText = isSetup
        ? lang === "vi"
          ? "Lưu mật khẩu"
          : "Save Passphrase"
        : i18n.t("vault_unlock_btn", {}, lang);

      container.innerHTML = `
        <div id="vault-unlock-card" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${isSetup ? "🛡️" : "🔒"}</span>
              <div>
                <h3 id="vault-unlock-title" class="text-base font-black text-slate-900 dark:text-white">${titleText}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">AES-GCM-256 + PBKDF2</p>
              </div>
            </div>
            <button type="button" onclick="window.HabitApp.closeVaultUnlockModal()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">✕</button>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${descText}</p>

          <form id="vault-unlock-form" onsubmit="event.preventDefault(); window.HabitApp.submitVaultUnlock('${mode}');" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" for="vault-passphrase-input">${i18n.t("vault_passphrase_label", {}, lang)}</label>
              <div class="relative flex items-center">
                <input
                  type="password"
                  id="vault-passphrase-input"
                  placeholder="${i18n.t("vault_passphrase_placeholder", {}, lang)}"
                  autocomplete="current-password"
                  class="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  required
                />
                <button
                  type="button"
                  id="btn-toggle-pass-visibility"
                  onclick="window.HabitApp.toggleVaultPassphraseVisibility()"
                  class="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  title="Toggle Visibility"
                >
                  👁️
                </button>
              </div>
            </div>

            <div id="vault-unlock-error" class="hidden p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold"></div>

            <div class="pt-2 flex items-center gap-2">
              <button
                type="button"
                onclick="window.HabitApp.closeVaultUnlockModal()"
                class="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
              >
                ${i18n.t("delete_cancel_btn", {}, lang)}
              </button>
              <button
                type="submit"
                id="btn-submit-vault-unlock"
                class="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                ${btnText}
              </button>
            </div>
          </form>
        </div>
      `;

      overlay.classList.remove("hidden");
      const passInput = document.getElementById("vault-passphrase-input");
      if (passInput) {
        setTimeout(() => passInput.focus(), 50);
      }
    },

    closeVaultUnlockModal() {
      const overlay = document.getElementById("vault-unlock-modal-overlay");
      if (overlay) overlay.classList.add("hidden");
      vaultUnlockPendingCallback = null;
    },

    toggleVaultPassphraseVisibility() {
      const input = document.getElementById("vault-passphrase-input");
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    },

    async submitVaultUnlock(mode = "unlock") {
      const input = document.getElementById("vault-passphrase-input");
      const errorEl = document.getElementById("vault-unlock-error");
      const cardEl = document.getElementById("vault-unlock-card");
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      const passphrase = input ? input.value.trim() : "";
      if (!passphrase) return;

      if (mode === "setup") {
        if (cloudSyncManager) {
          await cloudSyncManager.setEncryptionEnabled(true, passphrase);
        }
        HabitApp.closeVaultUnlockModal();
        notify(i18n.t("toast_vault_encryption_enabled", {}, lang), "success");
        renderActiveTab();
        if (cloudSyncManager && cloudSyncManager.activeProvider !== "none") {
          cloudSyncManager.sync().catch(() => {});
        }
        return;
      }

      if (cloudSyncManager) {
        cloudSyncManager.setSessionPassphrase(passphrase);
        const res = await cloudSyncManager.sync(passphrase);
        if (res && res.success) {
          const cb = vaultUnlockPendingCallback;
          HabitApp.closeVaultUnlockModal();
          notify(i18n.t("toast_vault_unlocked", {}, lang), "success");
          renderActiveTab();
          if (typeof cb === "function") {
            cb();
          }
        } else {
          if (errorEl) {
            errorEl.textContent = i18n.t("vault_error_wrong_pass", {}, lang);
            errorEl.classList.remove("hidden");
          }
          if (cardEl) {
            cardEl.classList.remove("animate-shake");
            void cardEl.offsetWidth; // Trigger reflow
            cardEl.classList.add("animate-shake");
          }
          if (input) input.focus();
        }
      }
    },

    lockVault() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (cloudSyncManager) {
        cloudSyncManager.clearSessionPassphrase();
        notify(i18n.t("toast_vault_locked", {}, lang), "info");
        renderActiveTab();
      }
    },

    async toggleVaultEncryption() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (!cloudSyncManager) return;
      if (cloudSyncManager.encryptionEnabled) {
        await cloudSyncManager.setEncryptionEnabled(false);
        notify(i18n.t("toast_vault_encryption_disabled", {}, lang), "info");
        renderActiveTab();
        if (cloudSyncManager.activeProvider !== "none") {
          cloudSyncManager.sync().catch(() => {});
        }
      } else {
        HabitApp.openVaultUnlockModal("setup");
      }
    },

    async syncCloudNow() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;

      if (!cloudSyncManager || cloudSyncManager.activeProvider === "none") {
        HabitApp.openGistModal();
        return;
      }

      if (cloudSyncManager.isVaultLocked) {
        HabitApp.openVaultUnlockModal("unlock", () => {
          HabitApp.syncCloudNow();
        });
        return;
      }

      notify(i18n.t("cloud_syncing", {}, lang), "info");
      renderActiveTab();
      const res = await cloudSyncManager.sync();
      if (res && res.success) {
        notify(i18n.t("toast_sync_success", {}, lang), "success");
      } else if (res && res.error === "ENCRYPTED_VAULT_LOCKED") {
        HabitApp.openVaultUnlockModal("unlock", () => {
          HabitApp.syncCloudNow();
        });
      } else {
        notify(
          i18n.t(
            "toast_sync_error",
            { message: res ? res.error : "Unknown" },
            lang
          ),
          "error"
        );
      }
      renderActiveTab();
    },

    async toggleAutoSync() {
      if (!cloudSyncManager) return;
      cloudSyncManager.autoSyncEnabled = !cloudSyncManager.autoSyncEnabled;
      if (store && store.storage) {
        await store.storage.putSetting(
          "auto_sync_enabled",
          cloudSyncManager.autoSyncEnabled
        );
      }
      renderActiveTab();
    },

    async createManualSnapshot() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      if (!store) return;
      try {
        await store.createSnapshot("manual");
        notify(i18n.t("toast_snapshot_created", {}, lang), "success");
        renderActiveTab();
      } catch (e) {
        notify(e.message, "error");
      }
    },

    async restoreSnapshotFromHistory(snapshotId) {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      if (!store) return;
      try {
        // Automatically save an emergency pre-restore undo snapshot before restoring
        await store.createSnapshot("pre_restore_undo");
        await store.restoreSnapshot(snapshotId);
        notify(i18n.t("toast_snapshot_restored", {}, lang), "success");
        renderActiveTab();
      } catch (e) {
        notify(e.message, "error");
      }
    },

    promptDriveBackup() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_drive_auth_required", {}, lang), "info");
      HabitApp.openDriveModal();
    },

    promptGistBackup() {
      const lang =
        (store && store.getSettings() && store.getSettings().language) || "vi";
      const notify =
        (typeof HabitApp !== "undefined" && HabitApp.showToast) || showToast;
      notify(i18n.t("toast_gist_pat_required", {}, lang), "info");
      HabitApp.openGistModal();
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
    undoDeleteHabit,
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
    handleReorderHabit: async (arg1, arg2, arg3, arg4) => {
      if (!store) return;
      if (
        typeof arg3 === "boolean" ||
        (arg3 && arg3 !== "up" && arg3 !== "down")
      ) {
        // signature: (routineKey, sourceId, targetId, insertAfter)
        await store.reorderHabit(arg1, arg2, arg3, arg4 ?? false);
        renderActiveTab();
        return;
      }
      // signature: (habitId, routine, direction)
      const habitId = arg1;
      const routine = arg2;
      const direction = arg3;
      if (!habitId) return;
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
    updateTimerDom,
    openFocusTimerModal,
    closeFocusTimerModal,
    toggleTimerDisplayMode,
    toggleTimerSound,
    handleTimerAdjust,
    get activeFocusModalHabitId() {
      return activeFocusModalHabitId;
    },
    get timerDisplayMode() {
      return timerDisplayMode;
    },
    get timerSoundEnabled() {
      return timerSoundEnabled;
    },
    promptResetDefaults,
    promptFactoryWipe,
    closeResetModal,
    confirmResetDefaults,
    confirmFactoryWipe,
    openIdentityWizard,
    closeIdentityWizard,
    renderWizardModal,
    get wizardCurrentStep() {
      return wizardCurrentStep;
    },
    get wizardSelectedKitIds() {
      return wizardSelectedKitIds;
    },
    get wizardSelectedKitId() {
      return wizardSelectedKitIds[0] || wizardSelectedKitId;
    },
    get activeTab() {
      return activeTab;
    },
    get habitsSubView() {
      return habitsSubView;
    },
    switchHabitsSubView: (subview) => {
      habitsSubView = subview;
      renderActiveTab();
    },
    ACTIVE_TIMER_STORAGE_KEY,
    MAX_ACTIVE_TIMER_SESSION_SECONDS,
    saveActiveTimerSession,
    clearActiveTimerSession,
    getActiveTimerSession,
    restoreActiveTimerSession,
    switchModalStage,
    handlePopState,
    setupTabSwipeGestures,
    get cloudSyncManager() {
      return cloudSyncManager;
    },
    get pendingImportData() {
      return pendingImportData;
    },
    get selectedImportStrategy() {
      return selectedImportStrategy;
    },
    formatRelativeTime,
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
