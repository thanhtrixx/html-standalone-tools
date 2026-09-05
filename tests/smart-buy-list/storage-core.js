const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListStorageEngine(
  customIndexedDB = null,
  initialStorageMock = {}
) {
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

  const storageMock = { ...initialStorageMock };
  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        classList: {
          classes: new Set(),
          contains: function (cls) {
            return this.classes.has(cls);
          },
          add: function (cls) {
            this.classes.add(cls);
          },
          remove: function (cls) {
            this.classes.delete(cls);
          },
        },
        style: {},
        focus: () => {},
        scrollIntoView: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        removeAttribute: () => {},
        remove: () => {},
      };
    }
    return elements[id];
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
    Promise,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: undefined,
    },
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => {
        const el = getOrCreateElement(`dyn_${Date.now()}_${Math.random()}`);
        el.tagName = tag.toUpperCase();
        return el;
      },
      addEventListener: () => {},
      documentElement: {
        classList: {
          classes: new Set(["dark"]),
          contains: function (cls) {
            return this.classes.has(cls);
          },
          add: function (cls) {
            this.classes.add(cls);
          },
          remove: function (cls) {
            this.classes.delete(cls);
          },
        },
      },
      body: { style: {} },
    },
    localStorage: {
      getItem: (key) => storageMock[key] || null,
      setItem: (key, val) => {
        storageMock[key] = String(val);
      },
      removeItem: (key) => {
        delete storageMock[key];
      },
      clear: () => {
        Object.keys(storageMock).forEach((k) => delete storageMock[k]);
      },
    },
    indexedDB: customIndexedDB,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  return { sandbox, storageMock };
}

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

console.log("\n🧪 Running Smart Buy-List Storage & Migration Test Suite...\n");

async function runStorageTests() {
  try {
    const { sandbox, storageMock } = loadBuyListStorageEngine();

    // 1. STORAGE PROVIDER SEAM & FALLBACK TESTS
    console.log("--- Section 1: Storage Provider Architecture ---");

    assert(
      typeof sandbox.initDatabase === "function",
      "initDatabase function exists globally"
    );
    assert(
      typeof sandbox.loadSampleData === "function",
      "loadSampleData function exists globally"
    );
    assert(
      typeof sandbox.clearAllData === "function",
      "clearAllData function exists globally"
    );
    assert(
      typeof sandbox.exportJsonBackup === "function",
      "exportJsonBackup function exists globally"
    );

    // 2. MEMORY & LOCALSTORAGE FALLBACK PERSISTENCE
    console.log("\n--- Section 2: Persistence & LocalStorage Fallback ---");

    // Load sample data into fallback store
    sandbox.loadSampleData();
    const savedStateRaw = storageMock["smart_buy_list_state"];
    assert(
      typeof savedStateRaw === "string" && savedStateRaw.length > 0,
      "STORE-01: State successfully serialized to persistent storage key 'smart_buy_list_state'"
    );

    const parsedState = JSON.parse(savedStateRaw);
    assert(
      Array.isArray(parsedState.activeList.items) &&
        parsedState.activeList.items.length >= 5,
      "STORE-02: Seed grocery items (>= 5 items) stored in activeList"
    );
    assert(
      Array.isArray(parsedState.purchaseLedger) &&
        parsedState.purchaseLedger.length >= 5,
      "STORE-03: Seed historical ledger entries (>= 5 records) stored in purchaseLedger"
    );

    // 3. SCHEMA MIGRATION & SEED DATA VALIDATION
    console.log("\n--- Section 3: Schema Structure & Integrity ---");

    const firstItem = parsedState.activeList.items[0];
    assert(
      firstItem.name &&
        firstItem.quantity > 0 &&
        firstItem.unit &&
        firstItem.price > 0,
      "STORE-04: Seed item has valid normalized fields (name, qty, unit, price)"
    );

    const firstLedger = parsedState.purchaseLedger[0];
    assert(
      firstLedger.itemName && firstLedger.unitPrice > 0 && firstLedger.date,
      "STORE-05: Seed ledger entry contains historical unit price and transaction date"
    );

    // 4. CLEAN RESET & RESTORE TESTS
    console.log("\n--- Section 4: Data Reset & Isolation ---");

    sandbox.clearAllData(true);
    const clearedStateRaw = storageMock["smart_buy_list_state"];
    const clearedState = JSON.parse(clearedStateRaw);
    assert(
      clearedState.activeList.items.length === 0,
      "STORE-06: clearAllData clears active items list"
    );
    assert(
      clearedState.purchaseLedger.length === 0,
      "STORE-07: clearAllData clears purchase ledger"
    );

    // 5. PAGE REFRESH HYDRATION & SETTINGS PERSISTENCE (Issue #178)
    console.log(
      "\n--- Section 5: Page Refresh Hydration & Settings Persistence (Issue #178) ---"
    );

    // Prepare a mock state representing an active user's session
    const userSessionState = {
      activeList: {
        id: "default",
        title: "Weekly Groceries",
        items: [
          {
            id: "user-item-1",
            name: "Dragonfruit",
            price: 5.0,
            quantity: 2,
            unit: "kg",
            checked: false,
            store: "WinMart",
            category: "produce",
          },
        ],
      },
      catalog: [],
      purchaseLedger: [
        {
          id: 1,
          itemName: "Dragonfruit",
          store: "WinMart",
          unitPrice: 2.5,
          date: "2026-08-30",
        },
      ],
      stores: ["WinMart", "Bach Hoa Xanh", "Costco"],
      settings: {
        language: "vi",
        currency: "VND",
        theme: "light",
        tripPhase: "IN_STORE",
        grouping: "STORE",
        unitSystem: "metric",
        density: "comfortable",
        vibrate: true,
      },
    };

    const initialStorage = {
      smart_buy_list_state: JSON.stringify(userSessionState),
    };

    // Standard Browser with IndexedDB support
    const browserIndexedDB = {
      open: () => {
        const req = {
          result: {
            objectStoreNames: { contains: () => true },
            createObjectStore: () => {},
          },
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess({ target: req });
        }, 0);
        return req;
      },
    };

    // Simulate opening the app on page refresh
    const freshSession = loadBuyListStorageEngine(
      browserIndexedDB,
      initialStorage
    );
    await freshSession.sandbox.initDatabase();

    // Verify data is hydrated into memoryState despite IndexedDB onsuccess
    assert(
      freshSession.sandbox.memoryState.activeList.items.length === 1 &&
        freshSession.sandbox.memoryState.activeList.items[0].name ===
          "Dragonfruit",
      "STORE-REFRESH-01: initDatabase() hydronates activeList items from storage on app startup"
    );
    assert(
      freshSession.sandbox.memoryState.stores.includes("WinMart") &&
        freshSession.sandbox.memoryState.stores.length === 3,
      "STORE-REFRESH-02: initDatabase() hydronates custom stores array on app startup"
    );
    assert(
      freshSession.sandbox.memoryState.purchaseLedger.length === 1 &&
        freshSession.sandbox.memoryState.purchaseLedger[0].itemName ===
          "Dragonfruit",
      "STORE-REFRESH-03: initDatabase() hydronates historical purchase ledger on app startup"
    );
    assert(
      freshSession.sandbox.memoryState.settings.language === "vi" &&
        freshSession.sandbox.memoryState.settings.currency === "VND" &&
        freshSession.sandbox.memoryState.settings.theme === "light" &&
        freshSession.sandbox.memoryState.settings.tripPhase === "IN_STORE" &&
        freshSession.sandbox.memoryState.settings.grouping === "STORE",
      "STORE-REFRESH-04: initDatabase() hydronates all user settings on app startup"
    );

    // Verify settings mutators persist immediately
    freshSession.sandbox.setLanguage("en");
    let persisted = JSON.parse(
      freshSession.storageMock["smart_buy_list_state"]
    );
    assert(
      persisted.settings.language === "en",
      "STORE-SETTINGS-01: setLanguage updates and persists settings.language to storage"
    );

    freshSession.sandbox.setCurrency("EUR");
    persisted = JSON.parse(freshSession.storageMock["smart_buy_list_state"]);
    assert(
      persisted.settings.currency === "EUR",
      "STORE-SETTINGS-02: setCurrency updates and persists settings.currency to storage"
    );

    freshSession.sandbox.setTripPhase("PLANNING");
    persisted = JSON.parse(freshSession.storageMock["smart_buy_list_state"]);
    assert(
      persisted.settings.tripPhase === "PLANNING",
      "STORE-SETTINGS-03: setTripPhase updates and persists settings.tripPhase to storage"
    );

    freshSession.sandbox.setGrouping("AISLE");
    persisted = JSON.parse(freshSession.storageMock["smart_buy_list_state"]);
    assert(
      persisted.settings.grouping === "AISLE",
      "STORE-SETTINGS-04: setGrouping updates and persists settings.grouping to storage"
    );

    freshSession.sandbox.toggleTheme();
    persisted = JSON.parse(freshSession.storageMock["smart_buy_list_state"]);
    assert(
      typeof persisted.settings.theme === "string" &&
        persisted.settings.theme.length > 0,
      "STORE-SETTINGS-05: toggleTheme updates and persists settings.theme to storage"
    );
  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(
    `📊 Storage & Migration Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStorageTests();
