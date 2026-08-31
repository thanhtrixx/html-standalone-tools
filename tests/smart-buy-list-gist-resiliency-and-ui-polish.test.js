#!/usr/bin/env node

/**
 * Smart Buy-List GitHub Gist 403 Resiliency, Ledger Price Increment & UI Polish Test Suite (v3.10.0)
 *
 * Exercises:
 * Section 1: GitHub Gist 403 Resiliency, Classic Scope Validation & Raw CDN Stripping
 * Section 2: Ledger-to-BuyList Additive Line Price Accumulation
 * Section 3: Ledger Batch Action Button Copy & Translations (Add to Buy List)
 * Section 4: Country Flag & Full Country Name Language Switcher
 * Section 5: Dedicated Horizontal Store Filter Chips in Shopping List
 * Section 6: PWA Version Synchronization (v3.10.0)
 * Section 7: Bilingual Dictionary Parity
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
      for (const k in localStorageData) delete localStorageData[k];
    },
  };

  const toastsShown = [];
  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
    },
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
    Promise,
    RegExp,
    Error,
    tailwind: {},
    window: {
      location: {
        href: "http://localhost:3000/",
        origin: "http://localhost:3000",
        pathname: "/",
        hash: "",
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (id) => clearTimeout(id),
      scrollTo: () => {},
    },
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        value: "",
        textContent: "",
        innerHTML: "",
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
        appendChild: function () {},
        setAttribute: function () {},
        style: {},
      }),
      body: {
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {} },
      },
      head: { appendChild: () => {} },
      addEventListener: () => {},
    },
    navigator: {
      clipboard: {
        writeText: async () => true,
        readText: async () => "",
      },
      vibrate: () => true,
      serviceWorker: {
        register: async () => ({
          addEventListener: () => {},
          waiting: null,
          active: { postMessage: () => {} },
        }),
      },
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    fetch:
      mockFetch ||
      (async (url) => ({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
        headers: { get: () => "gist" },
      })),
    Intl: Intl,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    showToast: (msg) => toastsShown.push(msg),
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

  return { context, elements, htmlContent, toastsShown };
}

async function runTests() {
  console.log(
    "🧪 Running Smart Buy-List GitHub Gist 403 Resiliency & UI Polish Test Suite...\n"
  );

  // ==========================================
  // Section 1: GitHub Gist 403 Resiliency & Scope Checking
  // ==========================================
  console.log(
    "\n--- Section 1: GitHub Gist 403 Resiliency & Classic Scope Validation ---"
  );

  {
    const { context } = loadTestSandbox();
    const ghProvider = new context.GitHubGistStorageProvider();

    // GIST-01: Rejects fine-grained PAT
    let patError = null;
    try {
      await ghProvider.validateToken("github_pat_11AAAAAA_xxxxxxxxxxxx");
    } catch (e) {
      patError = e.message;
    }
    assert(
      patError && patError.includes("Fine-grained tokens"),
      `GIST-01: validateToken rejects fine-grained token with actionable guidance (Got: ${patError})`
    );

    // GIST-02: Rejects token missing 'gist' scope
    let scopeError = null;
    const fetchWithoutGistScope = async (url) => {
      if (url.includes("/user")) {
        return {
          ok: true,
          status: 200,
          headers: {
            get: (name) => (name === "x-oauth-scopes" ? "repo, read:user" : ""),
          },
          json: async () => ({ login: "testuser" }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };
    const { context: ctxScope } = loadTestSandbox(fetchWithoutGistScope);
    const ghProviderScope = new ctxScope.GitHubGistStorageProvider();
    try {
      await ghProviderScope.validateToken("ghp_classic_token_without_gist");
    } catch (e) {
      scopeError = e.message;
    }
    assert(
      scopeError && scopeError.includes("missing the 'gist' scope"),
      `GIST-02: validateToken rejects classic token when 'gist' scope is missing (Got: ${scopeError})`
    );

    // GIST-03: Accepts valid Classic PAT with 'gist' scope
    const fetchWithGistScope = async (url) => {
      if (url.includes("/user")) {
        return {
          ok: true,
          status: 200,
          headers: {
            get: (name) => (name === "x-oauth-scopes" ? "gist, read:user" : ""),
          },
          json: async () => ({ login: "validoctocat", id: 12345 }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };
    const { context: ctxValid } = loadTestSandbox(fetchWithGistScope);
    const ghProviderValid = new ctxValid.GitHubGistStorageProvider();
    const authResult = await ghProviderValid.validateToken(
      "ghp_valid_classic_token"
    );
    assert(
      authResult && authResult.user && authResult.user.login === "validoctocat",
      `GIST-03: validateToken accepts Classic PAT with 'gist' scope (User: ${authResult?.user?.login})`
    );

    // GIST-04: Strip Authorization header when reading raw CDN URL
    let rawFetchHeaders = null;
    const fetchRawUrlCapture = async (url, options) => {
      if (url.includes("api.github.com/gists/gist123")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "gist123",
            files: {
              "smart_buy_list_data.json": {
                truncated: true,
                raw_url: "https://gist.githubusercontent.com/raw/test12345",
              },
            },
          }),
        };
      }
      if (url.includes("gist.githubusercontent.com")) {
        rawFetchHeaders = (options && options.headers) || null;
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ activeList: { items: [] } }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };
    const { context: ctxRaw } = loadTestSandbox(fetchRawUrlCapture);
    const ghProviderRaw = new ctxRaw.GitHubGistStorageProvider();
    const readResult = await ghProviderRaw.readRemoteGist(
      "gist123",
      "ghp_mock_token"
    );
    assert(
      rawFetchHeaders === null,
      "GIST-04: readRemoteGist strips Authorization header when fetching raw CDN URL"
    );
    assert(
      readResult && readResult.data !== null,
      "GIST-05: readRemoteGist successfully parses JSON from raw CDN URL"
    );

    // GIST-06: Extracts detailed JSON error message on HTTP 403 failure
    const fetch403Error = async (url) => {
      if (url.includes("/gists/gist403")) {
        return {
          ok: false,
          status: 403,
          json: async () => ({
            message: "Resource not accessible by personal access token",
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };
    const { context: ctx403 } = loadTestSandbox(fetch403Error);
    const ghProvider403 = new ctx403.GitHubGistStorageProvider();
    let read403Err = null;
    try {
      await ghProvider403.readRemoteGist("gist403", "ghp_bad_token");
    } catch (e) {
      read403Err = e.message;
    }
    assert(
      read403Err &&
        read403Err.includes(
          "HTTP 403: Resource not accessible by personal access token"
        ),
      `GIST-07: readRemoteGist extracts GitHub JSON error message on 403 (Got: ${read403Err})`
    );
  }

  // ==========================================
  // Section 2: Ledger-to-BuyList Price Scaling
  // ==========================================
  console.log(
    "\n--- Section 2: Ledger-to-BuyList Additive Line Price Accumulation ---"
  );

  {
    const { context } = loadTestSandbox();

    // Initialize clean state with 1 active item
    context.memoryState.activeList = {
      items: [
        {
          id: "item-101",
          name: "Sữa tươi Vinamilk",
          category: "dairy_eggs",
          store: "WinMart",
          quantity: 1,
          unit: "L",
          price: 35000,
          checked: false,
        },
      ],
    };

    // Re-order same item from ledger: qty 1, price 35000
    const ledgerEntry1 = {
      id: 1,
      itemName: "Sữa tươi Vinamilk",
      store: "WinMart",
      quantity: 1,
      unit: "L",
      price: 35000,
    };

    const res1 = context.processLedgerEntryIntoBuyList(ledgerEntry1);
    assertEqual(
      res1.type,
      "incremented",
      "PRICE-01: Re-adding existing item triggers 'incremented' type"
    );
    assertEqual(
      res1.item.quantity,
      2,
      "PRICE-02: Quantity increases from 1 to 2"
    );
    assertEqual(
      res1.item.price,
      70000,
      "PRICE-03: Line price accumulates additively from 35,000 to 70,000 VND"
    );

    // Re-order same item again with qty 2, price 70000
    const ledgerEntry2 = {
      id: 2,
      itemName: "SỮA TƯƠI VINAMILK", // Case-insensitive
      store: "WinMart",
      quantity: 2,
      unit: "L",
      price: 70000,
    };
    const res2 = context.processLedgerEntryIntoBuyList(ledgerEntry2);
    assertEqual(
      res2.item.quantity,
      4,
      "PRICE-04: Quantity increases from 2 to 4"
    );
    assertEqual(
      res2.item.price,
      140000,
      "PRICE-05: Line price accumulates from 70,000 to 140,000 VND"
    );

    // Add brand new item from ledger
    const ledgerEntryNew = {
      id: 3,
      itemName: "Dầu ăn Simply",
      store: "Co.opmart",
      quantity: 1,
      unit: "L",
      price: 58000,
    };
    const resNew = context.processLedgerEntryIntoBuyList(ledgerEntryNew);
    assertEqual(
      resNew.type,
      "created",
      "PRICE-06: Brand new ledger entry creates new buy list item"
    );
    assertEqual(
      resNew.item.price,
      58000,
      "PRICE-07: New item receives initial entry price (58,000 VND)"
    );
    assertEqual(
      context.memoryState.activeList.items.length,
      2,
      "PRICE-08: Active list contains 2 distinct items"
    );
  }

  // ==========================================
  // Section 3: Ledger Batch Action Button Copy
  // ==========================================
  console.log(
    "\n--- Section 3: Ledger Batch Action Button Copy (Add to Buy List) ---"
  );

  {
    const { context, htmlContent } = loadTestSandbox();

    assertEqual(
      context.TRANSLATIONS.en.btn_add_selected_ledger,
      "Add to Buy List",
      "LEDGER-01: English translation for btn_add_selected_ledger is 'Add to Buy List'"
    );

    assertEqual(
      context.TRANSLATIONS.vi.btn_add_selected_ledger,
      "Thêm vào danh sách mua",
      "LEDGER-02: Vietnamese translation for btn_add_selected_ledger is 'Thêm vào danh sách mua'"
    );

    assert(
      htmlContent.includes('id="btnTextAddSelectedLedger"') &&
        htmlContent.includes("Add to Buy List"),
      "LEDGER-03: HTML markup contains updated 'Add to Buy List' span text"
    );
  }

  // ==========================================
  // Section 4: Country Flag & Full Country Name Language Switcher
  // ==========================================
  console.log(
    "\n--- Section 4: Country Flag & Full Country Name Language Switcher ---"
  );

  {
    const { context, elements, htmlContent } = loadTestSandbox();

    // Verify select options in HTML
    assert(
      htmlContent.includes(
        '<option value="vi">🇻🇳 Việt Nam (Tiếng Việt)</option>'
      ),
      "I18N-01: HTML language select includes '🇻🇳 Việt Nam (Tiếng Việt)'"
    );
    assert(
      htmlContent.includes(
        '<option value="en">🇺🇸 United States (English)</option>'
      ),
      "I18N-02: HTML language select includes '🇺🇸 United States (English)'"
    );

    // Switch to Vietnamese
    context.setLanguage("vi");
    const langBtnVi = elements["langToggleBtn"];
    assertEqual(
      langBtnVi.textContent,
      "🇻🇳",
      "I18N-03: VI mode displays 🇻🇳 flag on quick-toggle button"
    );
    assert(
      langBtnVi.title.includes("🇻🇳 Việt Nam (Tiếng Việt)") &&
        langBtnVi.title.includes("🇺🇸 United States (English)"),
      `I18N-04: VI mode tooltip includes full country and language names (Got: ${langBtnVi.title})`
    );

    // Switch to English
    context.setLanguage("en");
    const langBtnEn = elements["langToggleBtn"];
    assertEqual(
      langBtnEn.textContent,
      "🇺🇸",
      "I18N-05: EN mode displays 🇺🇸 flag on quick-toggle button"
    );
    assert(
      langBtnEn.title.includes("🇺🇸 United States (English)") &&
        langBtnEn.title.includes("🇻🇳 Việt Nam (Tiếng Việt)"),
      `I18N-06: EN mode tooltip includes full country and language names (Got: ${langBtnEn.title})`
    );
  }

  // ==========================================
  // Section 5: Dedicated Store Filter Chips in Shopping List
  // ==========================================
  console.log("\n--- Section 5: Dedicated Horizontal Store Filter Chips ---");

  {
    const { context, elements, htmlContent } = loadTestSandbox();

    // Verify #storeFilterChips exists in HTML markup
    assert(
      htmlContent.includes('id="storeFilterChips"'),
      "FILTER-01: #storeFilterChips container exists in HTML markup"
    );

    // Setup sample state with custom stores and active items
    context.memoryState.stores = ["Costco", "WinMart", "Bach Hoa Xanh"];
    context.memoryState.activeList.items = [
      { id: "1", name: "Milk", store: "Costco", price: 10, checked: false },
      { id: "2", name: "Eggs", store: "WinMart", price: 5, checked: false },
      { id: "3", name: "Bread", store: "Costco", price: 4, checked: false },
      {
        id: "4",
        name: "Apple",
        store: "Bach Hoa Xanh",
        price: 3,
        checked: false,
      },
    ];

    context.currentStoreFilter = "ALL";
    context.renderStoreFilterChips();

    const chipsHtml = elements["storeFilterChips"].innerHTML;
    assert(
      chipsHtml.includes("All Stores") || chipsHtml.includes("Tất Cả Cửa Hàng"),
      "FILTER-02: Store filter chips include All Stores option"
    );
    assert(
      chipsHtml.includes("Costco") &&
        chipsHtml.includes("WinMart") &&
        chipsHtml.includes("Bach Hoa Xanh"),
      "FILTER-03: Store filter chips render all stores in state"
    );
    assert(
      chipsHtml.includes("bg-emerald-600"),
      "FILTER-04: Active store chip receives emerald highlight styling"
    );

    // Two-way sync: Filter to Costco
    context.onStoreFilterChange("Costco");
    assertEqual(
      context.window.currentStoreFilter,
      "Costco",
      "FILTER-05: onStoreFilterChange updates currentStoreFilter to Costco"
    );
    const updatedChipsHtml = elements["storeFilterChips"].innerHTML;
    assert(
      updatedChipsHtml.includes("Costco"),
      "FILTER-06: Store filter chips re-render with updated active state"
    );
  }

  // ==========================================
  // Section 6: PWA Version Synchronization (v3.11.0)
  // ==========================================
  console.log("\n--- Section 6: PWA Version Synchronization (v3.11.0) ---");

  {
    const swPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "sw.js"
    );
    const manifestPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "manifest.webmanifest"
    );
    const htmlPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "index.html"
    );

    const swContent = fs.readFileSync(swPath, "utf8");
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    assert(
      /CACHE_NAME = "smart-buy-list-v3\.(1[0-9]|[2-9]\d+)\.0"/.test(swContent),
      "VER-01: sw.js CACHE_NAME is updated"
    );
    assert(
      /^3\.(1[0-9]|[2-9]\d+)\.0$/.test(manifestContent.version),
      "VER-02: manifest.webmanifest version is valid"
    );
    assert(
      /v3\.(1[0-9]|[2-9]\d+)\.0/.test(htmlContent),
      "VER-03: index.html contains version badge"
    );
  }

  // ==========================================
  // Section 7: Bilingual Dictionary Parity
  // ==========================================
  console.log("\n--- Section 7: Bilingual Dictionary Parity ---");

  {
    const { context } = loadTestSandbox();
    const enKeys = Object.keys(context.TRANSLATIONS.en);
    const viKeys = Object.keys(context.TRANSLATIONS.vi);

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

  console.log("\n==================================================");
  console.log(
    `📊 Gist Resiliency & UI Polish Test Summary: ${passedAssertions} Passed, ${failedAssertions} Failed`
  );
  console.log("==================================================");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTests();
