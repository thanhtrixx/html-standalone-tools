#!/usr/bin/env node

/**
 * Smart Buy-List v3.12.0 Enhancements Test Suite
 *
 * Exercises:
 * Section 1: Unified Trip Completion Bar (#finishTripBar) Visibility (Planning & Buy Mode)
 * Section 2: Guarded openTripCompleteModal() on 0 Checked Items
 * Section 3: Option Hub Settings Symmetrical 2-Column Action Buttons (Load Sample & Clear All)
 * Section 4: Cloud Sync Overrides Error Handling & Toast Interpolation (Force Upload & Download)
 * Section 5: Option Hub Settings In-Panel Diagnostic Error Alert Banner (#cloudSyncErrorBanner)
 * Section 6: Cloud Sync Semantics & Explanatory Tooltips (Sync Now vs Force Upload)
 * Section 7: PWA Version Synchronization (v3.12.0)
 * Section 8: Bilingual Translation Parity
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passedAssertions++;
    console.log(`  ✅ PASS: ${message} (Got: ${actual})`);
  } else {
    failedAssertions++;
    console.error(
      `  ❌ FAIL: ${message} - Expected '${expected}', got '${actual}'`
    );
  }
}

function loadTestSandbox(mockFetch = null) {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerHTML: "",
        placeholder: "",
        className: "",
        title: "",
        options: [],
        children: [],
        appendChild: function (child) {
          this.children.push(child);
          if (child.tagName === "OPTION" || child.value !== undefined) {
            this.options.push(child);
          }
        },
        classList: {
          classes: new Set(),
          add: function (...cls) {
            cls.forEach((c) => this.classes.add(c));
          },
          remove: function (...cls) {
            cls.forEach((c) => this.classes.delete(c));
          },
          contains: function (c) {
            return this.classes.has(c);
          },
          toggle: function (c) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
          },
        },
        style: {},
        focus: function () {},
      };
    }
    return elements[id];
  }

  const localStorageData = {};
  const mockLocalStorage = {
    getItem: (key) => localStorageData[key] || null,
    setItem: (key, val) => {
      localStorageData[key] = String(val);
    },
    removeItem: (key) => {
      delete localStorageData[key];
    },
    clear: () => {
      Object.keys(localStorageData).forEach((k) => delete localStorageData[k]);
    },
  };

  const toastsShown = [];
  const modalsOpened = [];
  const modalsClosed = [];

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    Error,
    tailwind: {},
    RegExp,
    Set,
    Map,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    fetch:
      mockFetch ||
      (async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({}),
        text: async () => "",
      })),
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      getElementsByName: () => [],
      createElement: (tagName) => ({
        tagName: tagName.toUpperCase(),
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        classList: {
          classes: new Set(),
          add: function (...cls) {
            cls.forEach((c) => this.classes.add(c));
          },
          remove: function (...cls) {
            cls.forEach((c) => this.classes.delete(c));
          },
          contains: function (c) {
            return this.classes.has(c);
          },
        },
        setAttribute: function () {},
        appendChild: function () {},
      }),
      head: { appendChild: function () {} },
      body: { appendChild: function () {} },
    },
    window: {
      localStorage: mockLocalStorage,
      location: { origin: "https://localhost:8080" },
      navigator: {
        vibrate: () => {},
        clipboard: { writeText: async () => {}, readText: async () => "" },
      },
    },
    localStorage: mockLocalStorage,
    navigator: {
      vibrate: () => {},
      clipboard: { writeText: async () => {}, readText: async () => "" },
    },
    location: { origin: "https://localhost:8080" },
    showToast: (msg) => {
      toastsShown.push(msg);
    },
    openModal: (id) => {
      modalsOpened.push(id);
    },
    closeModal: (id) => {
      modalsClosed.push(id);
    },
  };

  sandbox.window.document = sandbox.document;
  sandbox.window.showToast = sandbox.showToast;
  sandbox.window.openModal = sandbox.openModal;
  sandbox.window.closeModal = sandbox.closeModal;

  const context = vm.createContext(sandbox);
  vm.runInContext(combinedScripts, context);

  if (context.window) {
    Object.assign(context, context.window);
  }

  // Intercept showToast to capture toasts into toastsShown array
  const origShowToast = context.showToast;
  context.showToast = (msg, duration) => {
    toastsShown.push(msg);
    if (typeof origShowToast === "function") {
      origShowToast(msg, duration);
    }
  };
  if (context.window) {
    context.window.showToast = context.showToast;
  }

  return { context, elements, toastsShown, modalsOpened, modalsClosed };
}

async function runTestSuite() {
  console.log("=".repeat(80));
  console.log("🧪 RUNNING SMART BUY-LIST v3.12.0 ENHANCEMENTS TEST SUITE");
  console.log("=".repeat(80));

  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // =========================================================================
  // SECTION 1: Unified Trip Completion Bar (#finishTripBar) Visibility
  // =========================================================================
  console.log("\n--- SECTION 1: Unified Trip Completion Bar Visibility ---");
  {
    const { context, elements } = loadTestSandbox();

    // 1. Planning Mode with 0 checked items -> finishBar hidden
    context.memoryState.activeList.items = [
      {
        id: "1",
        name: "Milk",
        price: 35000,
        quantity: 1,
        unit: "L",
        checked: false,
      },
      {
        id: "2",
        name: "Eggs",
        price: 30000,
        quantity: 10,
        unit: "ea",
        checked: false,
      },
    ];
    context.setTripPhase("PLANNING");
    const finishBar = elements["finishTripBar"];
    assert(
      finishBar.classList.contains("hidden"),
      "TRIP-01: In Planning Mode with 0 checked items, finishTripBar is HIDDEN"
    );

    // 2. Buy Mode with 0 checked items -> finishBar MUST ALSO BE HIDDEN
    context.setTripPhase("IN_STORE");
    assert(
      finishBar.classList.contains("hidden"),
      "TRIP-02: In Buy Mode with 0 checked items, finishTripBar is HIDDEN (Unified Logic)"
    );

    // 3. Buy Mode with 1 checked item -> finishBar is REVEALED
    context.memoryState.activeList.items[0].checked = true;
    context.renderApp();
    assert(
      !finishBar.classList.contains("hidden"),
      "TRIP-03: In Buy Mode with checked item, finishTripBar is VISIBLE"
    );

    // 4. Planning Mode with 1 checked item -> finishBar is REVEALED
    context.setTripPhase("PLANNING");
    assert(
      !finishBar.classList.contains("hidden"),
      "TRIP-04: In Planning Mode with checked item, finishTripBar is VISIBLE"
    );

    // 5. Unchecking item hides finishBar in Buy Mode
    context.memoryState.activeList.items[0].checked = false;
    context.setTripPhase("IN_STORE");
    context.renderApp();
    assert(
      finishBar.classList.contains("hidden"),
      "TRIP-05: Unchecking last item in Buy Mode hides finishTripBar"
    );
  }

  // =========================================================================
  // SECTION 2: Guarded openTripCompleteModal() on 0 Checked Items
  // =========================================================================
  console.log(
    "\n--- SECTION 2: Guarded openTripCompleteModal() on 0 Checked Items ---"
  );
  {
    const { context, toastsShown, modalsOpened } = loadTestSandbox();
    context.memoryState.activeList.items = [
      {
        id: "1",
        name: "Beef",
        price: 120000,
        quantity: 500,
        unit: "g",
        checked: false,
      },
    ];

    // Trigger openTripCompleteModal() with 0 checked items
    context.openTripCompleteModal();
    assert(
      !modalsOpened.includes("tripCompleteModal"),
      "GUARD-01: openTripCompleteModal does NOT open modal when 0 items checked"
    );
    assert(
      toastsShown.length > 0,
      "GUARD-02: openTripCompleteModal displays warning toast when 0 items checked"
    );

    // Now check 1 item and verify it opens normally
    context.memoryState.activeList.items[0].checked = true;
    context.openTripCompleteModal();
    assert(
      modalsOpened.includes("tripCompleteModal"),
      "GUARD-03: openTripCompleteModal opens tripCompleteModal when items are checked"
    );
  }

  // =========================================================================
  // SECTION 3: Option Hub Settings Symmetrical 2-Column Action Buttons
  // =========================================================================
  console.log("\n--- SECTION 3: Option Hub Settings Action Buttons ---");
  {
    assert(
      htmlContent.includes('id="btnResetSampleData"'),
      "SETTINGS-01: #btnResetSampleData exists in HTML"
    );
    assert(
      htmlContent.includes('id="btnClearAllDataInSettings"'),
      "SETTINGS-02: #btnClearAllDataInSettings exists in HTML"
    );

    // Verify styled button container classes (2-column grid)
    assert(
      htmlContent.includes('onclick="loadSampleData()"') &&
        htmlContent.includes("bg-emerald-950/40"),
      "SETTINGS-03: Load Sample Data uses styled emerald container button"
    );
    assert(
      htmlContent.includes('onclick="clearAllData(false)"') &&
        htmlContent.includes("bg-rose-950/40"),
      "SETTINGS-04: Clear All Data uses styled rose container button"
    );
  }

  // =========================================================================
  // SECTION 4: Cloud Sync Overrides Error Handling & Toast Interpolation
  // =========================================================================
  console.log(
    "\n--- SECTION 4: Cloud Sync Overrides Error Handling & Diagnostics ---"
  );
  {
    // Mock fetch returning GitHub rate limit 403
    const mockRateLimitFetch = async (url) => {
      if (String(url).includes("api.github.com")) {
        return {
          ok: false,
          status: 403,
          headers: {
            get: (h) => {
              if (h === "x-ratelimit-remaining") return "0";
              if (h === "x-ratelimit-reset")
                return String(Math.floor(Date.now() / 1000) + 1200); // 20m from now
              return null;
            },
          },
          json: async () => ({ message: "API rate limit exceeded" }),
          text: async () => "API rate limit exceeded",
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };

    const { context, toastsShown } = loadTestSandbox(mockRateLimitFetch);
    context.githubAuthState.token = "ghp_validclassictoken123456789";
    context.storageManager.activeProviderType = "github";

    // 1. Test Force Upload Error Toast
    toastsShown.length = 0;
    await context.forceUploadCloud();
    assert(
      toastsShown.some(
        (t) =>
          t.includes("GitHub API") ||
          t.includes("thất bại") ||
          t.includes("failed")
      ),
      "SYNC-ERR-01: forceUploadCloud surfaces rate limit / error toast on failure"
    );

    // 2. Test Force Download Error Toast
    toastsShown.length = 0;
    await context.forceDownloadCloud();
    assert(
      toastsShown.some(
        (t) =>
          t.includes("GitHub API") ||
          t.includes("thất bại") ||
          t.includes("failed")
      ),
      "SYNC-ERR-02: forceDownloadCloud surfaces rate limit / error toast on failure"
    );
  }

  // =========================================================================
  // SECTION 5: Option Hub Settings Diagnostic Error Banner (#cloudSyncErrorBanner)
  // =========================================================================
  console.log("\n--- SECTION 5: Option Hub Settings Diagnostic Banner ---");
  {
    assert(
      htmlContent.includes('id="cloudSyncErrorBanner"'),
      "BANNER-01: #cloudSyncErrorBanner element exists in Settings HTML markup"
    );
    assert(
      htmlContent.includes('id="cloudSyncErrorBannerText"'),
      "BANNER-02: #cloudSyncErrorBannerText element exists for dynamic error interpolation"
    );

    const { context, elements } = loadTestSandbox();

    // When status is error, banner is revealed
    context.githubAuthState.token = "ghp_mock";
    context.githubAuthState.lastError =
      "GitHub API rate limit exceeded. Resets at 18:30 (in 20m).";
    context.storageManager.activeProviderType = "github";
    context.updateSyncStatusUI("error");

    const errorBanner =
      elements["cloudSyncErrorBanner"] ||
      context.document.getElementById("cloudSyncErrorBanner");
    const bannerText =
      elements["cloudSyncErrorBannerText"] ||
      context.document.getElementById("cloudSyncErrorBannerText");

    assert(
      !errorBanner.classList.contains("hidden"),
      "BANNER-03: #cloudSyncErrorBanner is revealed when sync status is 'error'"
    );
    assert(
      bannerText.textContent.includes("rate limit") ||
        bannerText.textContent.includes("18:30"),
      "BANNER-04: #cloudSyncErrorBannerText displays detailed rate limit reset info"
    );

    // When status is synced, banner is hidden
    context.githubAuthState.lastError = null;
    context.updateSyncStatusUI("synced");
    assert(
      errorBanner.classList.contains("hidden"),
      "BANNER-05: #cloudSyncErrorBanner is hidden when sync status is 'synced'"
    );
  }

  // =========================================================================
  // SECTION 6: Cloud Sync Semantics & Explanatory Tooltips
  // =========================================================================
  console.log(
    "\n--- SECTION 6: Cloud Sync Semantics & Explanatory Tooltips ---"
  );
  {
    assert(
      htmlContent.includes("btnForceUpload") && htmlContent.includes("title="),
      "SEMANTICS-01: Force Upload button includes explanatory tooltip / title attribute"
    );
    assert(
      htmlContent.includes("btnForceDownload") &&
        htmlContent.includes("title="),
      "SEMANTICS-02: Force Download button includes explanatory tooltip / title attribute"
    );
    assert(
      htmlContent.includes("btnGithubSyncNow") ||
        htmlContent.includes("btnGoogleSyncNow"),
      "SEMANTICS-03: Cloud Sync sections include dedicated Sync Now action"
    );
  }

  // =========================================================================
  // SECTION 7: PWA Version Synchronization (v3.12.0)
  // =========================================================================
  console.log("\n--- SECTION 7: PWA Version Synchronization (v3.12.0) ---");
  {
    const manifestPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "manifest.webmanifest"
    );
    const swPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "sw.js"
    );

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const swContent = fs.readFileSync(swPath, "utf8");

    assertEqual(
      manifestContent.version,
      "3.12.0",
      "VER-01: manifest.webmanifest version is 3.12.0"
    );
    assert(
      swContent.includes("smart-buy-list-v3.12.0"),
      "VER-02: sw.js CACHE_NAME is smart-buy-list-v3.12.0"
    );
    assert(
      htmlContent.includes("3.12.0"),
      "VER-03: index.html references v3.12.0"
    );
  }

  // =========================================================================
  // SECTION 8: Bilingual Translation Parity
  // =========================================================================
  console.log("\n--- SECTION 8: Bilingual Translation Parity ---");
  {
    const { context } = loadTestSandbox();
    const TRANSLATIONS = context.TRANSLATIONS;
    assert(
      TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.vi,
      "I18N-01: TRANSLATIONS object loaded"
    );

    const requiredKeys = [
      "toast_no_checked_items",
      "toast_uploading_cloud",
      "toast_upload_success",
      "toast_upload_error",
      "toast_downloading_cloud",
      "toast_download_success",
      "toast_download_error",
      "toast_github_missing_token",
      "toast_gdrive_missing_auth",
      "btn_load_sample_data",
      "btn_clear_all_data_settings",
      "sync_now_tooltip",
      "force_upload_tooltip",
      "force_download_tooltip",
    ];

    requiredKeys.forEach((key) => {
      assert(
        TRANSLATIONS.en[key] !== undefined,
        `I18N-KEY-EN: TRANSLATIONS.en contains key '${key}'`
      );
      assert(
        TRANSLATIONS.vi[key] !== undefined,
        `I18N-KEY-VI: TRANSLATIONS.vi contains key '${key}'`
      );
    });

    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const viKeys = Object.keys(TRANSLATIONS.vi).sort();

    const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
    const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

    assertEqual(
      missingInVi.length,
      0,
      `I18N-PARITY-EN→VI: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
    );
    assertEqual(
      missingInEn.length,
      0,
      `I18N-PARITY-VI→EN: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "None"})`
    );
  }

  console.log("\n" + "=".repeat(80));
  console.log(
    `🏁 RESULTS: ${passedAssertions} passed, ${failedAssertions} failed.`
  );
  console.log("=".repeat(80));

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error("Test execution threw error:", e);
  process.exit(1);
});
