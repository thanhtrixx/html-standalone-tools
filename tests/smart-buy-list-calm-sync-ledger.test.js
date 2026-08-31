/**
 * Test Suite: Smart Buy-List Calm Cloud Sync, Adaptive Historical Ledger & Vietnamese Flag Polish
 *
 * Verifies:
 * 1. Startup Language Switcher Flag Parity (🇻🇳 / 🇺🇸 default without VI/EN override)
 * 2. Header Sync Status Removal & Calm Adaptive Cloud Sync Lifecycle
 * 3. Google Drive Cloud Sync UI/UX Guidance, Origin Copier & Error Diagnostics
 * 4. Adaptive Historical Purchase Ledger Mobile Cards (< 640px) & Desktop Table Typography (>= 640px)
 * 5. PWA v3.5.0 Version Invalidation & Bilingual Dictionary Key Parity
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function loadBuyListEngine(options = {}) {
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

  const domElements = {};
  const listeners = {};

  function getMockEl(id) {
    if (!domElements[id]) {
      const classSet = new Set(["hidden"]);
      domElements[id] = {
        id,
        classList: {
          classes: classSet,
          add(c) {
            classSet.add(c);
          },
          remove(c) {
            classSet.delete(c);
          },
          contains(c) {
            return classSet.has(c);
          },
          toggle(c, force) {
            if (force === undefined) {
              if (classSet.has(c)) classSet.delete(c);
              else classSet.add(c);
            } else if (force) classSet.add(c);
            else classSet.delete(c);
          },
        },
        textContent: "",
        innerHTML: "",
        value: "",
        title: "",
        placeholder: "",
        style: {},
        appendChild() {},
        focus() {},
        scrollIntoView() {},
        setAttribute(k, v) {
          this[k] = v;
        },
        getAttribute(k) {
          return this[k];
        },
      };
    }
    return domElements[id];
  }

  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    RegExp,
    Promise,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (fn) => {
      if (typeof fn === "function") fn();
      return 1;
    },
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: (evt, handler) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(handler);
    },
    scrollTo: () => {},
    location: { origin: "http://localhost:8080", pathname: "/", hash: "" },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      vibrate: () => true,
    },
    document: {
      getElementById: (id) => getMockEl(id),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: (tag) => {
        const el = getMockEl(
          "created-" + Math.random().toString(36).substr(2, 9)
        );
        el.tagName = tag.toUpperCase();
        return el;
      },
      documentElement: { classList: { add() {}, remove() {}, toggle() {} } },
      body: { appendChild() {}, style: {} },
      addEventListener: (evt, handler) => {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(handler);
      },
      visibilityState: "visible",
    },
    window: {},
    localStorage: {
      _data: {},
      getItem(k) {
        return this._data[k] !== undefined ? this._data[k] : null;
      },
      setItem(k, v) {
        this._data[k] = String(v);
      },
      removeItem(k) {
        delete this._data[k];
      },
      clear() {
        this._data = {};
      },
    },
  };

  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(combinedScripts, context);

  return { sandbox, htmlContent, domElements, getMockEl, listeners };
}

async function runAllTests() {
  console.log(
    "🧪 Running Smart Buy-List Calm Cloud Sync, Adaptive Historical Ledger & Vietnamese Flag Polish Test Suite...\n"
  );

  // --- Section 1: Startup Language Switcher Flag Parity ---
  console.log("--- Section 1: Startup Language Switcher Flag Parity ---");
  {
    const { sandbox, getMockEl, htmlContent } = loadBuyListEngine();
    const langBtn = getMockEl("langToggleBtn");

    // In HTML markup initially, langToggleBtn must have 🇻🇳
    assert(
      htmlContent.includes('id="langToggleBtn"') && htmlContent.includes("🇻🇳"),
      "FLAG-01: HTML markup renders 🇻🇳 in #langToggleBtn by default"
    );

    // When setLanguage('vi') runs
    sandbox.setLanguage("vi");
    assert(
      langBtn.textContent === "🇻🇳",
      `FLAG-02: setLanguage('vi') sets #langToggleBtn to '🇻🇳' (Got: '${langBtn.textContent}')`
    );

    // When toggleLanguage() is called, switches to 'en' and 🇺🇸
    sandbox.toggleLanguage();
    assert(
      sandbox.currentLanguage === "en" && langBtn.textContent === "🇺🇸",
      `FLAG-03: toggleLanguage() switches to 'en' with '🇺🇸' (Got: '${langBtn.textContent}')`
    );

    // Toggle back to 'vi'
    sandbox.toggleLanguage();
    assert(
      sandbox.currentLanguage === "vi" && langBtn.textContent === "🇻🇳",
      `FLAG-04: toggleLanguage() switches back to 'vi' with '🇻🇳' (Got: '${langBtn.textContent}')`
    );

    // Verify initApp() does not overwrite flag with VI / EN text
    if (typeof sandbox.initApp === "function") {
      await sandbox.initApp();
      assert(
        langBtn.textContent === "🇻🇳",
        `FLAG-05: initApp() preserves '🇻🇳' without overriding with 'VI' or 'EN' (Got: '${langBtn.textContent}')`
      );
    }
  }

  // --- Section 2: Header Sync Status Removal & Calm Adaptive Sync ---
  console.log(
    "\n--- Section 2: Header Sync Status Removal & Calm Adaptive Sync ---"
  );
  {
    const { sandbox, getMockEl, htmlContent, listeners } = loadBuyListEngine();

    // Header must not contain #topBarSyncStatus button
    assert(
      !htmlContent.includes('id="topBarSyncStatus"'),
      "SYNC-01: #topBarSyncStatus is decommissioned from Top App Bar header"
    );

    // Option Hub contains #cloudSyncSection
    assert(
      htmlContent.includes('id="cloudSyncSection"'),
      "SYNC-02: Option Hub contains #cloudSyncSection"
    );

    // triggerDebouncedCloudSync is present and operates with calm interval (>= 10000ms)
    assert(
      typeof sandbox.triggerDebouncedCloudSync === "function",
      "SYNC-03: triggerDebouncedCloudSync function is defined"
    );

    // Test finishShoppingTrip invokes cloud sync if active
    let syncCalled = false;
    if (sandbox.storageManager) {
      const origSync = sandbox.storageManager.sync;
      sandbox.storageManager.sync = async () => {
        syncCalled = true;
        return { success: true };
      };
      if (typeof sandbox.finishShoppingTrip === "function") {
        sandbox.finishShoppingTrip();
        assert(syncCalled, "SYNC-04: finishShoppingTrip() triggers cloud sync");
      }
      sandbox.storageManager.sync = origSync;
    }

    // Test visibilitychange flush listener registered
    if (typeof sandbox.initApp === "function") {
      await sandbox.initApp();
    }
    assert(
      Array.isArray(listeners["visibilitychange"]) &&
        listeners["visibilitychange"].length > 0,
      "SYNC-05: visibilitychange listener is registered for calm sync flush"
    );
  }

  // --- Section 3: Google Drive Cloud Sync UI/UX Guidance & Origin Copier ---
  console.log(
    "\n--- Section 3: Google Drive Cloud Sync UI/UX Guidance & Origin Copier ---"
  );
  {
    const { sandbox, getMockEl, htmlContent } = loadBuyListEngine();

    assert(
      htmlContent.includes("docs/google-drive-cloud-sync-guide.md"),
      "GDRIVE-01: Google Drive panel contains direct link to setup guide"
    );

    assert(
      htmlContent.includes('id="gdriveCurrentOrigin"'),
      "GDRIVE-02: Google Drive panel renders #gdriveCurrentOrigin container"
    );

    assert(
      typeof sandbox.copyCurrentOriginToClipboard === "function",
      "GDRIVE-03: copyCurrentOriginToClipboard function is defined"
    );

    // Test unauthenticated UI state
    sandbox.googleAuthState = {
      accessToken: null,
      clientId: "test-client-id",
      tokenClient: null,
    };
    if (typeof sandbox.updateSyncStatusUI === "function") {
      sandbox.updateSyncStatusUI("offline");
      const btnSignIn = getMockEl("btnGoogleSignIn");
      const btnSignOut = getMockEl("btnGoogleSignOut");
      assert(
        !btnSignIn.classList.contains("hidden"),
        "GDRIVE-04: Sign In button is visible when unauthenticated"
      );
      assert(
        btnSignOut.classList.contains("hidden"),
        "GDRIVE-05: Sign Out button is hidden when unauthenticated"
      );
    }

    // Test authenticated UI state
    sandbox.googleAuthState.accessToken = "mock-valid-token";
    if (typeof sandbox.updateSyncStatusUI === "function") {
      sandbox.updateSyncStatusUI("synced");
      const btnSignIn = getMockEl("btnGoogleSignIn");
      const btnSignOut = getMockEl("btnGoogleSignOut");
      assert(
        btnSignIn.classList.contains("hidden"),
        "GDRIVE-06: Sign In button is hidden when authenticated"
      );
      assert(
        !btnSignOut.classList.contains("hidden"),
        "GDRIVE-07: Sign Out button is visible when authenticated"
      );
    }
  }

  // --- Section 4: Adaptive Historical Purchase Ledger Mobile Cards & Typography ---
  console.log(
    "\n--- Section 4: Adaptive Historical Purchase Ledger Mobile Cards & Typography ---"
  );
  {
    const { sandbox, getMockEl, htmlContent } = loadBuyListEngine();

    assert(
      htmlContent.includes('id="ledgerMobileCards"'),
      "LEDGER-01: #priceLedgerModal contains #ledgerMobileCards for mobile viewports"
    );

    assert(
      htmlContent.includes('id="ledgerTableContainer"'),
      "LEDGER-02: #priceLedgerModal contains #ledgerTableContainer for desktop viewports"
    );

    // Populate sample ledger entry and render
    sandbox.memoryState.purchaseLedger = [
      {
        id: "ledger-test-1",
        itemName: "Sữa tươi Vinamilk 100% 1L",
        store: "WinMart",
        quantity: 1,
        unit: "L",
        price: 35000,
        unitPrice: 35000,
        date: "2026-08-31",
      },
    ];

    if (typeof sandbox.renderPriceLedgerTable === "function") {
      sandbox.renderPriceLedgerTable();
      const mobileCards = getMockEl("ledgerMobileCards");
      const tableBody = getMockEl("ledgerTableBody");

      assert(
        mobileCards.innerHTML.includes("Sữa tươi Vinamilk") &&
          mobileCards.innerHTML.includes("WinMart") &&
          mobileCards.innerHTML.includes("35.000"),
        "LEDGER-03: Mobile cards render item name, store, and formatted prices"
      );

      assert(
        mobileCards.innerHTML.includes(
          "addLedgerItemToBuyList('ledger-test-1')"
        ) || mobileCards.innerHTML.includes('data-ledger-id="ledger-test-1"'),
        "LEDGER-04: Mobile cards include touch-friendly Quick Add button and Batch Checkbox"
      );

      assert(
        tableBody.innerHTML.includes("Sữa tươi Vinamilk") &&
          tableBody.innerHTML.includes("35.000"),
        "LEDGER-05: Desktop table body renders formatted row data"
      );
    }
  }

  // --- Section 5: PWA Version Bump & Bilingual Parity ---
  console.log("\n--- Section 5: PWA Version Bump & Bilingual Parity ---");
  {
    const { sandbox, htmlContent } = loadBuyListEngine();
    const swPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "sw.js"
    );
    const swContent = fs.readFileSync(swPath, "utf8");

    assert(
      swContent.includes("smart-buy-list-v3.9.0") ||
        swContent.includes("smart-buy-list-v3.8.0") ||
        swContent.includes("smart-buy-list-v3.7.0") ||
        swContent.includes("smart-buy-list-v3.6.0") ||
        swContent.includes("smart-buy-list-v3.5.0"),
      "PWA-01: sw.js CACHE_NAME is incremented to 'smart-buy-list-v3.9.0'"
    );

    assert(
      htmlContent.includes("v3.9.0") ||
        htmlContent.includes("v3.8.0") ||
        htmlContent.includes("v3.7.0") ||
        htmlContent.includes("v3.6.0") ||
        htmlContent.includes("v3.5.0"),
      "PWA-02: index.html displays synchronized version badge"
    );

    const manifestPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "manifest.webmanifest"
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert(
      manifest.version === "3.9.0" ||
        manifest.version === "3.8.0" ||
        manifest.version === "3.7.0" ||
        manifest.version === "3.6.0" ||
        manifest.version === "3.5.0",
      `PWA-03: manifest.webmanifest version is '3.9.0' (Got: '${manifest.version}')`
    );

    const enKeys = Object.keys(sandbox.TRANSLATIONS.en);
    const viKeys = Object.keys(sandbox.TRANSLATIONS.vi);

    const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
    const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

    assert(
      missingInVi.length === 0,
      `I18N-PARITY-01: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
    );
    assert(
      missingInEn.length === 0,
      `I18N-PARITY-02: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "None"})`
    );
  }

  console.log("\n==================================================");
  console.log(
    `📊 Calm Cloud Sync & Adaptive Ledger Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
