const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListStorageEngine(customIndexedDB = null) {
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

  const storageMock = {};
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
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: undefined,
    },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
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
        parsedState.activeList.items.length === 5,
      "STORE-02: Seed grocery items (5 items) stored in activeList"
    );
    assert(
      Array.isArray(parsedState.purchaseLedger) &&
        parsedState.purchaseLedger.length === 5,
      "STORE-03: Seed historical ledger entries (5 records) stored in purchaseLedger"
    );

    // 3. SCHEMA MIGRATION & SEED DATA VALIDATION
    console.log("\n--- Section 3: Schema Structure & Integrity ---");

    const firstItem = parsedState.activeList.items[0];
    assert(
      firstItem.name === "Fresh Whole Milk" &&
        firstItem.quantity === 2 &&
        firstItem.unit === "l" &&
        firstItem.price === 3.5,
      "STORE-04: Seed item has valid normalized fields (name, qty, unit, price)"
    );

    const firstLedger = parsedState.purchaseLedger[0];
    assert(
      firstLedger.itemName === "Fresh Whole Milk" &&
        firstLedger.unitPrice === 1.7 &&
        firstLedger.date === "2026-07-15",
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
