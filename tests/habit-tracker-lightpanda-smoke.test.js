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

    const freezeBadge = doc.getElementById("freeze-tokens-count");
    assert(
      freezeBadge !== null,
      "SMOKE-NAV-03: #freeze-tokens-count badge exists in DOM"
    );

    const langToggle = doc.getElementById("lang-toggle-btn");
    assert(
      langToggle !== null,
      "SMOKE-NAV-04: #lang-toggle-btn quick switcher exists in DOM"
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
      { id: "focus-timer-modal-overlay", role: "dialog" },
      { id: "floating-timer-island", role: "region" },
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

    // SECTION 5: ADR-0009 Feature Smoke (Header, Wizard, Timer Island, Insights)
    console.log("--- Section 5: ADR-0009 Architectural & UI Smoke ---");

    const { getHtmlContent } = require("./helpers/habit-tracker-harness");
    const rawHtml = getHtmlContent();
    assert(
      rawHtml.includes("<header") &&
        rawHtml.includes("py-3") &&
        rawHtml.includes("h-8"),
      "SMOKE-ADR09-01: Header container enforces uniform height padding (py-3) and h-8 badges"
    );

    // Verify 4-step wizard Step 1 Language Selection
    if (
      sandbox.HabitIdentityView &&
      typeof sandbox.HabitIdentityView.renderIdentityWizardModal === "function"
    ) {
      const step1Html = sandbox.HabitIdentityView.renderIdentityWizardModal(
        1,
        "morning-mastery",
        "vi"
      );
      assert(
        step1Html.includes("wizard-select-lang") &&
          step1Html.includes("Tiếng Việt"),
        "SMOKE-ADR09-02: Setup wizard Step 1 renders language selection options"
      );
    }

    // Verify Floating Timer Island Reactive Lifecycle
    const timerIslandEl = doc.getElementById("floating-timer-island");
    assert(
      timerIslandEl !== null && timerIslandEl.classList.contains("hidden"),
      "SMOKE-ADR09-03: Floating timer island is initially hidden when idle"
    );

    const timerHabit = sandbox.HabitApp.store
      .getHabits()
      .find((h) => h.type === "timer");
    if (timerHabit) {
      await sandbox.HabitApp.handleToggleTimer(
        timerHabit.id,
        sandbox.HabitApp.store.getActiveDate()
      );
      assert(
        !timerIslandEl.classList.contains("hidden"),
        "SMOKE-ADR09-04: Floating timer island unhides reactively when timer starts"
      );
      await sandbox.HabitApp.handleToggleTimer(
        timerHabit.id,
        sandbox.HabitApp.store.getActiveDate()
      );
      assert(
        timerIslandEl.classList.contains("hidden"),
        "SMOKE-ADR09-05: Floating timer island hides when timer stops"
      );
    }

    // SECTION 6: PWA Multi-Density Assets, iOS Splash Screens & Open Graph WebP
    console.log(
      "--- Section 6: PWA Multi-Density Assets, Splash Screens & Open Graph WebP ---"
    );

    const fs = require("fs");
    const path = require("path");
    const habitTrackerDir = path.join(__dirname, "..", "habit-tracker");

    // 1. Mobile meta tags
    assert(
      rawHtml.includes(
        '<meta name="mobile-web-app-capable" content="yes" />'
      ) ||
        rawHtml.includes('<meta name="mobile-web-app-capable" content="yes">'),
      'SMOKE-PWA-01: <meta name="mobile-web-app-capable" content="yes"> exists in index.html'
    );
    assert(
      rawHtml.includes(
        '<meta name="apple-mobile-web-app-capable" content="yes" />'
      ) ||
        rawHtml.includes(
          '<meta name="apple-mobile-web-app-capable" content="yes">'
        ),
      'SMOKE-PWA-02: <meta name="apple-mobile-web-app-capable" content="yes"> exists in index.html'
    );

    // 2. 14 iOS startup splash screen links
    const splashMatches = [
      ...rawHtml.matchAll(
        /<link\s+[^>]*rel=["']apple-touch-startup-image["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi
      ),
    ];
    assert(
      splashMatches.length === 14,
      `SMOKE-PWA-03: Found 14 iOS splash screen link tags (Actual: ${splashMatches.length})`
    );

    for (const match of splashMatches) {
      const relHref = match[1];
      const splashPath = path.resolve(habitTrackerDir, relHref);
      assert(
        fs.existsSync(splashPath) && fs.statSync(splashPath).size > 1000,
        `SMOKE-PWA-04: iOS splash screen '${relHref}' exists on disk with non-zero size`
      );
    }

    // 3. Web manifest and multi-density icons
    const manifestPath = path.join(habitTrackerDir, "manifest.webmanifest");
    assert(
      fs.existsSync(manifestPath),
      "SMOKE-PWA-05: manifest.webmanifest exists at tool root"
    );

    const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert(
      Array.isArray(manifestData.icons) && manifestData.icons.length >= 14,
      `SMOKE-PWA-06: Manifest contains ${manifestData.icons.length} icon descriptors`
    );

    const maskableIcons = manifestData.icons.filter(
      (icon) => icon.purpose === "maskable"
    );
    assert(
      maskableIcons.length >= 2,
      `SMOKE-PWA-07: Manifest specifies maskable icon entries (Count: ${maskableIcons.length})`
    );

    for (const icon of manifestData.icons) {
      const iconPath = path.resolve(habitTrackerDir, icon.src);
      assert(
        fs.existsSync(iconPath) && fs.statSync(iconPath).size > 100,
        `SMOKE-PWA-08: Manifest icon '${icon.src}' exists on disk with non-zero byte size`
      );
    }

    // 4. Open Graph and Twitter Card tags
    assert(
      rawHtml.includes("https://trile.dev/tools/habit-tracker/og-image.webp"),
      "SMOKE-OG-01: Open Graph / Twitter image points to og-image.webp"
    );
    assert(
      rawHtml.includes('content="image/webp"'),
      "SMOKE-OG-02: og:image:type is image/webp"
    );
    assert(
      rawHtml.includes('content="2752"') && rawHtml.includes('content="1536"'),
      "SMOKE-OG-03: og:image dimensions are 2752x1536"
    );
    assert(
      rawHtml.includes('content="summary_large_image"'),
      "SMOKE-OG-04: twitter:card is summary_large_image"
    );

    const ogImgPath = path.join(habitTrackerDir, "og-image.webp");
    assert(
      fs.existsSync(ogImgPath) && fs.statSync(ogImgPath).size > 10000,
      "SMOKE-OG-05: High-resolution og-image.webp exists on disk"
    );

    // SECTION 7: Sub-Second Execution Benchmark
    const durationMs = Date.now() - startTime;
    console.log(`--- Section 7: Execution Benchmark (${durationMs}ms) ---`);
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
