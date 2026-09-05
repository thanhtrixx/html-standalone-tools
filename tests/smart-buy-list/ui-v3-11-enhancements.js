#!/usr/bin/env node

/**
 * Smart Buy-List v3.11.0 Enhancements Test Suite
 *
 * Exercises:
 * Section 1: Quick Add Target Store Selection & Filter Inheritance (Option C)
 * Section 2: Available-Only Store Filtering (Chips & Header Dropdown)
 * Section 3: Store Filter Chip Visual Polish (Removal of Store Emojis)
 * Section 4: GitHub Gist 403 Rate Limit Error Detection & Local Reset Resiliency
 * Section 5: Settings Symmetrical 2-Button Grid Layout for Cloud Overrides
 * Section 6: PWA Version Synchronization (v3.11.0)
 * Section 7: Bilingual Translation Parity
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
    "../..",
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
      createElement: (tagName) => ({
        tagName: tagName.toUpperCase(),
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        title: "",
        children: [],
        appendChild: function (child) {
          this.children.push(child);
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
        },
      }),
      body: getOrCreateElement("body"),
      head: { appendChild: () => {} },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    window: {
      localStorage: mockLocalStorage,
      location: {
        href: "http://localhost:3000/",
        origin: "http://localhost:3000",
        pathname: "/",
        hash: "",
        reload: () => {},
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      navigator: {
        onLine: true,
        clipboard: {
          writeText: async () => true,
          readText: async () => "",
        },
      },
    },
    localStorage: mockLocalStorage,
    navigator: {
      onLine: true,
      clipboard: {
        writeText: async () => true,
        readText: async () => "",
      },
    },
    Intl: Intl,
    showToast: (msg) => {
      toastsShown.push(msg);
    },
  };

  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.window.navigator = sandbox.navigator;
  sandbox.window.tailwind = sandbox.tailwind;

  const context = vm.createContext(sandbox);
  vm.runInContext(combinedScripts, context);

  // Expose window exports on context root
  if (context.window) {
    Object.assign(context, context.window);
  }

  return { sandbox: context, elements, toastsShown, localStorageData };
}

async function runTests() {
  console.log(
    "\n================================================================================"
  );
  console.log("🧪 RUNNING SMART BUY-LIST v3.11.0 ENHANCEMENTS TEST SUITE");
  console.log(
    "================================================================================\n"
  );

  // ---------------------------------------------------------------------------
  // SECTION 1: Quick Add Store Selection & Filter Inheritance (Option C)
  // ---------------------------------------------------------------------------
  console.log(
    "--- SECTION 1: Quick Add Store Selection & Filter Inheritance ---"
  );
  {
    const { sandbox, elements } = loadTestSandbox();

    // Setup initial state with available items
    sandbox.memoryState.stores = ["WinMart", "Bách Hoá Xanh", "Co.opmart"];
    sandbox.memoryState.activeList.items = [
      {
        id: "i0",
        name: "Rau",
        store: "Bách Hoá Xanh",
        quantity: 1,
        unit: "kg",
        price: 15000,
      },
      {
        id: "i1",
        name: "Sữa",
        store: "WinMart",
        quantity: 1,
        unit: "l",
        price: 35000,
      },
      {
        id: "i2",
        name: "Cá",
        store: "Co.opmart",
        quantity: 1,
        unit: "kg",
        price: 50000,
      },
    ];
    sandbox.onStoreFilterChange("ALL");
    sandbox.renderStoreFilterOptions();

    // Case 1: Default fallback when filter is ALL
    const defaultStore = sandbox.getQuickAddDefaultStore();
    assertEqual(
      defaultStore,
      "WinMart",
      "When filter is ALL and no quick store selected, defaults to memoryState.stores[0]"
    );

    // Case 2: Changing currentStoreFilter synchronizes default store
    sandbox.onStoreFilterChange("Bách Hoá Xanh");
    assertEqual(
      sandbox.window.currentStoreFilter,
      "Bách Hoá Xanh",
      "currentStoreFilter updated to Bách Hoá Xanh"
    );

    // Parsing item without @store uses the selected store
    const parsed1 = sandbox.parseSmartGroceryInput("Sữa tươi 35k 1l");
    assertEqual(parsed1.name, "Sữa tươi", "Correct item name extracted");
    assertEqual(
      parsed1.store,
      "Bách Hoá Xanh",
      "Item without @store inherits active store filter"
    );

    // Case 3: Explicit store filter change
    sandbox.onStoreFilterChange("Co.opmart");
    const parsed2 = sandbox.parseSmartGroceryInput("Trứng gà 30k 10 quả");
    assertEqual(
      parsed2.store,
      "Co.opmart",
      "Item inherits active store filter Co.opmart"
    );

    // Case 4: Explicit @store tag in text overrides active filter
    const parsed3 = sandbox.parseSmartGroceryInput(
      "Gạo ST25 150k 5kg @WinMart"
    );
    assertEqual(
      parsed3.name,
      "Gạo ST25",
      "Item name extracted cleanly without @store tag"
    );
    assertEqual(
      parsed3.store,
      "WinMart",
      "Explicit @WinMart tag correctly overrides active store filter"
    );

    // Case 5: Batch input uses active filter store
    sandbox.onStoreFilterChange("Co.opmart");
    const batchText = "Thịt bò 120k 500g\nBánh mì 15k";
    sandbox.processBatchQuickInput(batchText);
    const items = sandbox.memoryState.activeList.items;
    const added1 = items[items.length - 2];
    const added2 = items[items.length - 1];
    assertEqual(
      added1.store,
      "Co.opmart",
      "Batch item 1 inherits quick add store"
    );
    assertEqual(
      added2.store,
      "Co.opmart",
      "Batch item 2 inherits quick add store"
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: Available-Only Store Filtering (Chips & Header Dropdown)
  // ---------------------------------------------------------------------------
  console.log(
    "\n--- SECTION 2: Available-Only Store Filtering (Chips & Header) ---"
  );
  {
    const { sandbox, elements } = loadTestSandbox();
    sandbox.memoryState.stores = [
      "WinMart",
      "Bách Hoá Xanh",
      "Co.opmart",
      "Lotte Mart",
    ];
    sandbox.memoryState.activeList.items = [
      {
        id: "i1",
        name: "Sữa",
        store: "WinMart",
        quantity: 1,
        unit: "l",
        price: 35000,
      },
      {
        id: "i2",
        name: "Trứng",
        store: "WinMart",
        quantity: 10,
        unit: "ea",
        price: 30000,
      },
      {
        id: "i3",
        name: "Thịt",
        store: "Co.opmart",
        quantity: 1,
        unit: "kg",
        price: 150000,
      },
    ];
    sandbox.onStoreFilterChange("ALL");

    sandbox.renderStoreFilterChips();
    sandbox.renderStoreFilterOptions();

    const chipsHtml = elements["storeFilterChips"].innerHTML;
    assert(
      chipsHtml.includes("WinMart"),
      "StoreFilterChips contains WinMart (has items)"
    );
    assert(
      chipsHtml.includes("Co.opmart"),
      "StoreFilterChips contains Co.opmart (has items)"
    );
    assert(
      !chipsHtml.includes("Bách Hoá Xanh"),
      "StoreFilterChips excludes Bách Hoá Xanh (0 items in list)"
    );
    assert(
      !chipsHtml.includes("Lotte Mart"),
      "StoreFilterChips excludes Lotte Mart (0 items in list)"
    );

    // Check storeFilterSelect options
    const filterSelect = elements["storeFilterSelect"];
    const optionValues = filterSelect.options.map((o) => o.value);
    assert(optionValues.includes("ALL"), "storeFilterSelect includes ALL");
    assert(
      optionValues.includes("WinMart"),
      "storeFilterSelect includes available store WinMart"
    );
    assert(
      optionValues.includes("Co.opmart"),
      "storeFilterSelect includes available store Co.opmart"
    );
    assert(
      !optionValues.includes("Bách Hoá Xanh"),
      "storeFilterSelect excludes store Bách Hoá Xanh with 0 items"
    );
    assert(
      optionValues.includes("MANAGE_STORES"),
      "storeFilterSelect includes MANAGE_STORES action"
    );

    // Auto-reset when selected store no longer has items
    sandbox.onStoreFilterChange("Co.opmart");
    assertEqual(
      sandbox.window.currentStoreFilter,
      "Co.opmart",
      "currentStoreFilter active on Co.opmart"
    );
    // Remove Co.opmart item
    sandbox.memoryState.activeList.items =
      sandbox.memoryState.activeList.items.filter(
        (i) => i.store !== "Co.opmart"
      );
    sandbox.renderStoreFilterChips();
    assertEqual(
      sandbox.window.currentStoreFilter,
      "ALL",
      "currentStoreFilter auto-resets to ALL when active store runs out of items"
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: Store Filter Chip Visual Polish (Emoji Removal)
  // ---------------------------------------------------------------------------
  console.log(
    "\n--- SECTION 3: Store Filter Chip Visual Polish (Emoji Removal) ---"
  );
  {
    const { sandbox, elements } = loadTestSandbox();
    sandbox.memoryState.stores = ["WinMart", "Co.opmart"];
    sandbox.memoryState.activeList.items = [
      {
        id: "i1",
        name: "Sữa",
        store: "WinMart",
        quantity: 1,
        unit: "l",
        price: 35000,
      },
      {
        id: "i2",
        name: "Thịt",
        store: "Co.opmart",
        quantity: 1,
        unit: "kg",
        price: 150000,
      },
    ];
    sandbox.renderStoreFilterChips();

    const chipsHtml = elements["storeFilterChips"].innerHTML;
    assert(
      !chipsHtml.includes("🏬"),
      "StoreFilterChips does not contain 🏬 emoji"
    );
    assert(
      !chipsHtml.includes("🏪"),
      "StoreFilterChips does not contain 🏪 emoji"
    );
    assert(
      chipsHtml.includes("⚙️"),
      "StoreFilterChips retains ⚙️ icon for Manage Stores button"
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: GitHub Gist 403 Rate Limit Resiliency
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION 4: GitHub Gist 403 Rate Limit Resiliency ---");
  {
    const { sandbox } = loadTestSandbox();
    const parseRateLimit = sandbox.parseGitHubRateLimitError;
    assert(
      typeof parseRateLimit === "function",
      "parseGitHubRateLimitError helper is defined and exposed"
    );

    // Test 1: Normal 401/403 bad token (NOT rate limit)
    const normal403Res = {
      status: 403,
      headers: {
        get: (h) => (h === "x-ratelimit-remaining" ? "4995" : null),
      },
    };
    const normalErr = { message: "Bad credentials" };
    assertEqual(
      parseRateLimit(normal403Res, normalErr),
      null,
      "Non-rate-limit 403 returns null"
    );

    // Test 2: 403 with x-ratelimit-remaining === "0" and x-ratelimit-reset header
    const futureResetEpoch = Math.floor(Date.now() / 1000) + 1200; // 20 mins in future
    const rateLimit403Res = {
      status: 403,
      headers: {
        get: (h) => {
          if (h === "x-ratelimit-remaining") return "0";
          if (h === "x-ratelimit-reset") return String(futureResetEpoch);
          return null;
        },
      },
    };
    const rateLimitErr = { message: "API rate limit exceeded for user" };

    sandbox.setLanguage("vi");
    const viMsg = parseRateLimit(rateLimit403Res, rateLimitErr);
    assert(
      viMsg && viMsg.includes("Đã đạt giới hạn yêu cầu GitHub API"),
      `Vietnamese rate limit message formatted correctly: "${viMsg}"`
    );
    assert(
      viMsg.includes("phút"),
      "Vietnamese message contains remaining minutes"
    );

    sandbox.setLanguage("en");
    const enMsg = parseRateLimit(rateLimit403Res, rateLimitErr);
    assert(
      enMsg && enMsg.includes("GitHub API rate limit exceeded"),
      `English rate limit message formatted correctly: "${enMsg}"`
    );
    assert(
      enMsg.includes("in ") && enMsg.includes("m"),
      "English message contains formatted countdown in minutes"
    );

    // Test 3: Secondary rate limit (429 / 403 with secondary rate limit message)
    const secondary403Res = {
      status: 403,
      headers: {
        get: (h) => (h === "retry-after" ? "60" : null),
      },
    };
    const secondaryErr = {
      message:
        "You have exceeded a secondary rate limit. Please wait a few minutes.",
    };
    const secMsg = parseRateLimit(secondary403Res, secondaryErr);
    assert(
      secMsg && (secMsg.includes("rate limit") || secMsg.includes("giới hạn")),
      "Secondary rate limit message detected from error payload"
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: Symmetrical 2-Button Grid Layout for Cloud Overrides
  // ---------------------------------------------------------------------------
  console.log(
    "\n--- SECTION 5: Symmetrical 2-Button Grid Layout for Cloud Overrides ---"
  );
  {
    const htmlPath = path.join(
      __dirname,
      "../..",
      "smart-buy-list-price-tracker",
      "index.html"
    );
    const html = fs.readFileSync(htmlPath, "utf8");

    // Google Drive manual overrides
    assert(
      html.includes('id="cloudSyncAdvancedActions"') &&
        html.includes(
          'class="hidden grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80"'
        ),
      "cloudSyncAdvancedActions uses symmetrical 2-column grid layout"
    );
    assert(
      html.includes('id="btnForceUpload"') &&
        html.includes('id="btnForceUploadText"'),
      "btnForceUpload has span id btnForceUploadText"
    );
    assert(
      html.includes('id="btnForceDownload"') &&
        html.includes('id="btnForceDownloadText"'),
      "btnForceDownload has span id btnForceDownloadText"
    );

    // GitHub Gist manual overrides
    assert(
      html.includes('id="githubGistActions"') &&
        html.includes(
          'class="hidden grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80"'
        ),
      "githubGistActions uses symmetrical 2-column grid layout"
    );
    assert(
      html.includes('id="btnGithubForceUpload"') &&
        html.includes('id="btnGithubForceUploadText"'),
      "btnGithubForceUpload has span id btnGithubForceUploadText"
    );
    assert(
      html.includes('id="btnGithubForceDownload"') &&
        html.includes('id="btnGithubForceDownloadText"'),
      "btnGithubForceDownload has span id btnGithubForceDownloadText"
    );

    // Test applyTranslations updating both button texts
    const { sandbox, elements } = loadTestSandbox();
    sandbox.setLanguage("vi");
    assertEqual(
      elements["btnForceUploadText"].textContent,
      "Buộc Tải Lên Đám Mây",
      "btnForceUploadText translated to Vietnamese"
    );
    assertEqual(
      elements["btnGithubForceUploadText"].textContent,
      "Buộc Tải Lên Đám Mây",
      "btnGithubForceUploadText translated to Vietnamese"
    );

    sandbox.setLanguage("en");
    assertEqual(
      elements["btnForceUploadText"].textContent,
      "Force Upload to Cloud",
      "btnForceUploadText translated to English"
    );
    assertEqual(
      elements["btnGithubForceUploadText"].textContent,
      "Force Upload to Cloud",
      "btnGithubForceUploadText translated to English"
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 6: PWA Version Synchronization (v3.11.0)
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION 6: PWA Version Synchronization (v3.11.0) ---");
  {
    const rootDir = path.join(
      __dirname,
      "../..",
      "smart-buy-list-price-tracker"
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(rootDir, "manifest.webmanifest"), "utf8")
    );
    const swContent = fs.readFileSync(path.join(rootDir, "sw.js"), "utf8");
    const indexContent = fs.readFileSync(
      path.join(rootDir, "index.html"),
      "utf8"
    );

    assert(
      /^(?:3\.(1[1-9]|[2-9]\d+)|[4-9]\.\d+)\.\d+$/.test(manifest.version),
      `manifest.webmanifest version is 3.11.0 or higher (Got: ${manifest.version})`
    );
    assert(
      /smart-buy-list-v(?:3\.(1[1-9]|[2-9]\d+)|[4-9]\.\d+)\.\d+/.test(
        swContent
      ),
      "sw.js CACHE_NAME is smart-buy-list-v3.11.0 or higher"
    );
    assert(
      />v(?:3\.(1[1-9]|[2-9]\d+)|[4-9]\.\d+)\.\d+</.test(indexContent),
      "index.html pwaVersionBadge displays v3.11.0 or higher"
    );

    // Verify ADR-0020
    const adrPath = path.join(
      rootDir,
      "docs",
      "adr",
      "0020-quick-add-store-picker-available-store-filter-and-github-ratelimit-resiliency.md"
    );
    assert(fs.existsSync(adrPath), "ADR-0020 markdown file exists");
  }

  // ---------------------------------------------------------------------------
  // SECTION 7: Bilingual Translation Parity
  // ---------------------------------------------------------------------------
  console.log("\n--- SECTION 7: Bilingual Translation Parity ---");
  {
    const { sandbox } = loadTestSandbox();
    const tEn = sandbox.TRANSLATIONS.en;
    const tVi = sandbox.TRANSLATIONS.vi;

    const requiredKeys = [
      "smart_quick_store_title",
      "error_github_ratelimit",
      "btn_force_upload",
      "btn_force_download",
      "store_all",
      "manage_stores_title",
    ];

    requiredKeys.forEach((k) => {
      assert(
        typeof tEn[k] === "string" && tEn[k].length > 0,
        `TRANSLATIONS.en contains key '${k}'`
      );
      assert(
        typeof tVi[k] === "string" && tVi[k].length > 0,
        `TRANSLATIONS.vi contains key '${k}'`
      );
    });
  }

  console.log(
    "\n================================================================================"
  );
  console.log(
    `🏁 RESULTS: ${passedAssertions} passed, ${failedAssertions} failed.`
  );
  console.log(
    "================================================================================\n"
  );

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with unhandled error:", err);
  process.exit(1);
});
