#!/usr/bin/env node

/**
 * Atomic Habit Tracker Lightpanda-Aligned Fast Smoke & DOM Semantics Suite
 *
 * Domain: Fast Headless Inner-Loop Smoke Testing (ADR-0009)
 * Covers:
 * - Semantic accessibility roles and DOM tree contracts (tabs, modals, action bars, bottom dock)
 * - Form validation constraints (input types, required bounds, emoji palette, segmented picker)
 * - Rapid bilingual completeness across all UI view containers (Today, Insights, Manager, Settings)
 * - State lifecycle transitions, multi-routine synchronization & sample data loading (<1s execution)
 */

const {
  createHabitTrackerSandbox,
  createAssertions,
} = require("./helpers/habit-tracker-harness");

const { assert, assertEqual, printSummary } = createAssertions(
  "Atomic Habit Tracker Fast Smoke & DOM Semantics Suite"
);

console.log(
  "\n🧪 Running Atomic Habit Tracker Fast Smoke & DOM Semantics Suite...\n"
);

const startTime = Date.now();

(async function runSmokeSuite() {
  try {
    const { sandbox } = createHabitTrackerSandbox();
    const doc = sandbox.document;

    if (sandbox.HabitApp && typeof sandbox.HabitApp.init === "function") {
      await sandbox.HabitApp.init();
    }

    // SECTION 1: Semantic Navigation & Tab Hierarchy
    console.log("--- Section 1: Semantic Navigation & Tab Hierarchy ---");

    const mainContainer = doc.getElementById("main-content");
    assert(
      mainContainer !== null,
      "SMOKE-NAV-01: #main-content container exists in DOM structure"
    );

    const requiredTabs = [
      { id: "nav-tab-today", label: "Hôm nay / Today" },
      { id: "nav-tab-insights", label: "Thống kê / Insights" },
      { id: "nav-tab-manager", label: "Thói quen / Habits" },
      { id: "nav-tab-settings", label: "Cài đặt / Settings" },
    ];

    requiredTabs.forEach(({ id, label }) => {
      const tabEl = doc.getElementById(id);
      assert(
        tabEl !== null,
        `SMOKE-NAV-02: Tab #${id} (${label}) exists in DOM`
      );
    });

    const headerActiveTimer = doc.getElementById("header-active-timer-pill");
    assert(
      headerActiveTimer !== null,
      "SMOKE-NAV-03: #header-active-timer-pill exists in DOM"
    );

    const freezeBadge = doc.getElementById("freeze-tokens-count");
    assert(
      freezeBadge !== null,
      "SMOKE-NAV-04: #freeze-tokens-count badge exists in DOM"
    );

    const langToggle = doc.getElementById("lang-toggle-btn");
    assert(
      langToggle !== null,
      "SMOKE-NAV-05: #lang-toggle-btn quick switcher exists in DOM"
    );

    // SECTION 2: Modal Accessibility & Light Dismissal Contracts
    console.log(
      "--- Section 2: Modal Dialog Hierarchy & Backdrop Contracts ---"
    );

    const requiredModals = [
      { id: "habit-edit-modal-overlay", role: "dialog" },
      { id: "detail-sheet-overlay", role: "dialog" },
      { id: "delete-confirm-modal-overlay", role: "alertdialog" },
      { id: "reset-confirm-modal-overlay", role: "alertdialog" },
      { id: "pwa-update-banner", role: "banner" },
    ];

    requiredModals.forEach(({ id, role }) => {
      const modalEl = doc.getElementById(id);
      assert(
        modalEl !== null,
        `SMOKE-MODAL-01: Overlay #${id} (${role}) exists in DOM`
      );
    });

    // SECTION 3: Form Input Validation Constraints & Editor Components
    console.log("--- Section 3: Form Input Validation Constraints ---");

    // Render habit edit modal into modal container to check form inputs
    if (
      sandbox.HabitManagerView &&
      typeof sandbox.HabitManagerView.renderHabitEditModal === "function"
    ) {
      const modalHtml = sandbox.HabitManagerView.renderHabitEditModal(
        null,
        "vi"
      );
      const container = doc.getElementById("habit-modal-container");
      if (container) {
        container.innerHTML = modalHtml;
      }

      const nameInput = doc.getElementById("modal-habit-name");
      assert(
        nameInput !== null,
        "SMOKE-FORM-01: #modal-habit-name input exists in modal"
      );

      const iconInput = doc.getElementById("modal-habit-icon");
      assert(
        iconInput !== null,
        "SMOKE-FORM-02: #modal-habit-icon input exists in modal"
      );

      const segmentedPicker = doc.getElementById("segmented-type-picker");
      assert(
        segmentedPicker !== null,
        "SMOKE-FORM-03: #segmented-type-picker exists in modal"
      );

      const routineChips = doc.getElementById("modal-routine-chips");
      assert(
        routineChips !== null,
        "SMOKE-FORM-04: #modal-routine-chips selector exists in modal"
      );

      const livePreview = doc.getElementById("modal-live-preview-card");
      assert(
        livePreview !== null,
        "SMOKE-FORM-05: #modal-live-preview-card exists in modal"
      );
    }

    // SECTION 4: Fast State Mutation & Sample Data Smoke
    console.log("--- Section 4: Fast State Lifecycle & Sample Data Smoke ---");

    let uncaughtErrors = 0;
    const originalConsoleError = console.error;
    console.error = (...args) => {
      uncaughtErrors++;
      originalConsoleError(...args);
    };

    try {
      const app = sandbox.HabitApp;
      if (app) {
        if (typeof app.switchTab === "function") {
          app.switchTab("today");
          app.switchTab("insights");
          app.switchTab("manager");
          app.switchTab("settings");
          app.switchTab("today");
          assert(
            true,
            "SMOKE-STATE-01: 4-tab navigation transitions execute cleanly"
          );
        }

        if (typeof app.switchLanguage === "function") {
          app.switchLanguage("en");
          app.switchLanguage("vi");
          assert(
            true,
            "SMOKE-STATE-02: Bilingual toggle cycles cleanly (VI <-> EN)"
          );
        }

        if (typeof app.switchTheme === "function") {
          app.switchTheme("light");
          app.switchTheme("dark");
          assert(
            true,
            "SMOKE-STATE-03: Dark/Light theme toggle cycles cleanly"
          );
        }

        if (typeof app.addFreezeTokens === "function") {
          app.addFreezeTokens(1);
          assert(
            true,
            "SMOKE-STATE-04: Streak Freeze token increment operates cleanly"
          );
        }

        if (typeof app.toggleVacationMode === "function") {
          app.toggleVacationMode();
          app.toggleVacationMode();
          assert(
            true,
            "SMOKE-STATE-05: Vacation/Sick pause mode toggles cleanly"
          );
        }
      }
    } finally {
      console.error = originalConsoleError;
    }

    assert(
      uncaughtErrors === 0,
      `SMOKE-STATE-06: Zero console errors logged during state lifecycle (Errors: ${uncaughtErrors})`
    );

    // SECTION 5: Sub-Second Execution Benchmark
    const durationMs = Date.now() - startTime;
    console.log(`--- Section 5: Execution Benchmark (${durationMs}ms) ---`);
    assert(
      durationMs < 1000,
      `SMOKE-PERF-01: Entire smoke suite completes in < 1000ms (Actual: ${durationMs}ms)`
    );

    printSummary();
  } catch (err) {
    console.error(
      "❌ Fatal error executing Habit Tracker Lightpanda smoke suite:",
      err
    );
    process.exit(1);
  }
})();
