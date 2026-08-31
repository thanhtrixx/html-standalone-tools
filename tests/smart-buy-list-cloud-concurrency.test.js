#!/usr/bin/env node

/**
 * Smart Buy-List 3-Way Cloud Concurrency, Deletion Tombstones & Mutation Invariants Test Suite (v3.8.0)
 *
 * Exercises:
 * 1. Tombstone Lifecycle & 30-Day TTL Pruning
 * 2. Touch Mutation Invariants across Item Mutators
 * 3. Deterministic Cloud Merge & Zombie Resurrection Prevention
 * 4. 3-Way Differential Merge Engine & In-Flight Concurrency Guard
 * 5. Atomic Trip Completion & Deterministic Ledger IDs
 * 6. Provider Mutex & Trailing Sync Pass
 * 7. PWA Version Stamp & Bilingual Parity
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

function createMockStorage() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get _store() {
      return store;
    },
  };
}

function setupTrackerSandbox() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let allScripts = "";
  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (
      !match[0].includes("tailwindcss") &&
      !match[0].includes("html5-qrcode")
    ) {
      allScripts += match[1] + "\n";
    }
  }

  const localStorageMock = createMockStorage();

  const domElements = {};
  function getOrCreateElement(id) {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {},
          toggle: () => {},
        },
        style: {},
        scrollIntoView: () => {},
        focus: () => {},
        appendChild: () => {},
        options: [],
        checked: false,
      };
    }
    return domElements[id];
  }

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
    },
    localStorage: localStorageMock,
    sessionStorage: createMockStorage(),
    document: {
      getElementById: (id) => getOrCreateElement(id),
      getElementsByName: (name) => [{ checked: true, value: "ROLLOVER" }],
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: "",
        innerHTML: "",
        textContent: "",
        style: {},
        appendChild: () => {},
        addEventListener: () => {},
        setAttribute: () => {},
        classList: { add: () => {}, remove: () => {} },
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
      },
      documentElement: {
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
      },
    },
    window: {
      location: { reload: () => {}, hash: "" },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    navigator: {
      vibrate: () => true,
      clipboard: { writeText: async () => {} },
    },
    fetch: async () => ({
      ok: true,
      json: async () => ({}),
      text: async () => "{}",
    }),
    setTimeout: (fn) => fn(),
    setInterval: () => 1,
    clearTimeout: () => {},
    clearInterval: () => {},
    tailwind: {},
    Date: Date,
    Math: Math,
    JSON: JSON,
    Array: Array,
    Object: Object,
    Set: Set,
    Map: Map,
    String: String,
    Number: Number,
    Boolean: Boolean,
  };

  sandbox.window.tailwind = sandbox.tailwind;

  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.window.sessionStorage = sandbox.sessionStorage;
  sandbox.window.navigator = sandbox.navigator;
  sandbox.window.fetch = sandbox.fetch;
  sandbox.window.setTimeout = sandbox.setTimeout;
  sandbox.window.setInterval = sandbox.setInterval;
  sandbox.window.clearTimeout = sandbox.clearTimeout;
  sandbox.window.clearInterval = sandbox.clearInterval;
  sandbox.window.console = sandbox.console;

  vm.createContext(sandbox);
  vm.runInContext(allScripts, sandbox);

  return { sandbox, htmlContent };
}

async function runSuite() {
  console.log(
    "🧪 Running Smart Buy-List 3-Way Cloud Concurrency & Deletion Tombstones Test Suite..."
  );

  const { sandbox, htmlContent } = setupTrackerSandbox();
  const win = sandbox.window;

  // --- Section 1: Tombstone State Lifecycle & 30-Day TTL Pruning ---
  console.log(
    "\n--- Section 1: Tombstone State Lifecycle & 30-Day TTL Pruning ---"
  );
  {
    assert(
      win.memoryState._deleted !== undefined,
      "TOMB-01: memoryState._deleted dictionary is initialized"
    );
    assert(
      typeof win.memoryState._deleted.items === "object",
      "TOMB-02: memoryState._deleted.items dictionary exists"
    );
    assert(
      typeof win.memoryState._deleted.ledger === "object",
      "TOMB-03: memoryState._deleted.ledger dictionary exists"
    );
    assert(
      typeof win.memoryState._deleted.stores === "object",
      "TOMB-04: memoryState._deleted.stores dictionary exists"
    );
    assertEqual(
      win.TOMBSTONE_TTL_MS,
      30 * 24 * 60 * 60 * 1000,
      "TOMB-05: TOMBSTONE_TTL_MS equals 30 days (2,592,000,000 ms)"
    );

    // Record item tombstone
    win.recordDeletedItem("item_test_101");
    assert(
      win.memoryState._deleted.items["item_test_101"] !== undefined,
      "TOMB-06: recordDeletedItem correctly stores ISO-8601 timestamp for item_test_101"
    );

    // Record ledger tombstone
    win.recordDeletedLedger("rec_test_202");
    assert(
      win.memoryState._deleted.ledger["rec_test_202"] !== undefined,
      "TOMB-07: recordDeletedLedger correctly stores ISO-8601 timestamp for rec_test_202"
    );

    // Record store tombstone
    win.recordDeletedStore("OldStore");
    assert(
      win.memoryState._deleted.stores["OldStore"] !== undefined,
      "TOMB-08: recordDeletedStore correctly stores ISO-8601 timestamp for OldStore"
    );

    // Prune test: expired (31 days ago) vs fresh (2 days ago)
    const now = Date.now();
    const thirtyOneDaysAgo = new Date(
      now - 31 * 24 * 60 * 60 * 1000
    ).toISOString();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

    const testDict = {
      items: {
        expired_item: thirtyOneDaysAgo,
        fresh_item: twoDaysAgo,
      },
      ledger: {
        expired_rec: thirtyOneDaysAgo,
        fresh_rec: twoDaysAgo,
      },
      stores: {
        expired_store: thirtyOneDaysAgo,
        fresh_store: twoDaysAgo,
      },
    };

    win.pruneDeletedTombstones(testDict, now);
    assert(
      testDict.items.expired_item === undefined &&
        testDict.items.fresh_item !== undefined,
      "TOMB-09: pruneDeletedTombstones purges expired items and keeps fresh items"
    );
    assert(
      testDict.ledger.expired_rec === undefined &&
        testDict.ledger.fresh_rec !== undefined,
      "TOMB-10: pruneDeletedTombstones purges expired ledger records and keeps fresh records"
    );
    assert(
      testDict.stores.expired_store === undefined &&
        testDict.stores.fresh_store !== undefined,
      "TOMB-11: pruneDeletedTombstones purges expired stores and keeps fresh stores"
    );
  }

  // --- Section 2: Touch Mutation Invariants ---
  console.log("\n--- Section 2: Touch Mutation Invariants ---");
  {
    const rawItem = { id: "item_touch_01", name: "Sữa tươi", price: 35000 };
    win.touchItem(rawItem);

    assert(
      rawItem.createdAt !== undefined,
      "TOUCH-01: touchItem initializes createdAt timestamp when missing"
    );
    assert(
      rawItem.updatedAt !== undefined,
      "TOUCH-02: touchItem sets ISO-8601 updatedAt timestamp"
    );

    // If item was in tombstones, touchItem should remove it (explicit resurrection)
    win.memoryState._deleted.items["item_touch_01"] = new Date().toISOString();
    win.touchItem(rawItem);
    assert(
      win.memoryState._deleted.items["item_touch_01"] === undefined,
      "TOUCH-03: touchItem clears item from _deleted.items upon active edit/re-creation"
    );

    // Verify toggleItemCheck touches updatedAt
    win.memoryState.activeList.items = [
      {
        id: "item_toggle_01",
        name: "Trứng gà",
        checked: false,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    win.toggleItemCheck("item_toggle_01");
    const toggled = win.memoryState.activeList.items[0];
    assert(
      toggled.checked === true,
      "TOUCH-04: toggleItemCheck toggles item check state"
    );
    assert(
      new Date(toggled.updatedAt).getTime() >
        new Date("2026-01-01T00:00:00.000Z").getTime(),
      "TOUCH-05: toggleItemCheck updates item.updatedAt"
    );

    // Verify quickUpdateItemPrice touches updatedAt
    win.quickUpdateItemPrice("item_toggle_01", 42000, 2);
    const priceUpdated = win.memoryState.activeList.items[0];
    assertEqual(
      priceUpdated.price,
      42000,
      "TOUCH-06: quickUpdateItemPrice updates price"
    );
    assertEqual(
      priceUpdated.quantity,
      2,
      "TOUCH-07: quickUpdateItemPrice updates quantity"
    );
    assert(
      priceUpdated.updatedAt !== undefined,
      "TOUCH-08: quickUpdateItemPrice ensures updatedAt is set"
    );

    // Verify deleteItem records tombstone
    win.deleteItem("item_toggle_01");
    assert(
      win.memoryState.activeList.items.length === 0,
      "TOUCH-09: deleteItem removes item from active list"
    );
    assert(
      win.memoryState._deleted.items["item_toggle_01"] !== undefined,
      "TOUCH-10: deleteItem records tombstone in _deleted.items"
    );
  }

  // --- Section 3: Deterministic Cloud Merge & Zombie Resurrection Prevention ---
  console.log(
    "\n--- Section 3: Deterministic Cloud Merge & Zombie Resurrection Prevention ---"
  );
  {
    const baseDate = "2026-08-30T10:00:00.000Z";
    const deleteDate = "2026-08-31T08:00:00.000Z";

    const localStateWithTombstone = {
      activeList: {
        id: "default",
        title: "Danh Sách Mua Sắm",
        items: [],
      },
      purchaseLedger: [],
      stores: ["WinMart", "Co.opmart"],
      _deleted: {
        items: { zombie_item_01: deleteDate },
        ledger: { zombie_ledger_01: deleteDate },
        stores: { DeletedStore: deleteDate },
      },
    };

    const staleRemoteData = {
      activeList: {
        id: "default",
        title: "Danh Sách Mua Sắm",
        items: [
          {
            id: "zombie_item_01",
            name: "Bánh mì cũ",
            price: 15000,
            updatedAt: baseDate,
          },
          {
            id: "valid_remote_01",
            name: "Gạo ST25",
            price: 220000,
            updatedAt: deleteDate,
          },
        ],
      },
      purchaseLedger: [
        {
          id: "zombie_ledger_01",
          itemName: "Bánh mì cũ",
          price: 15000,
          date: "2026-08-30",
        },
        {
          id: "valid_ledger_01",
          itemName: "Gạo ST25",
          price: 220000,
          date: "2026-08-31",
        },
      ],
      stores: ["WinMart", "Co.opmart", "DeletedStore", "Lotte Mart"],
      _deleted: { items: {}, ledger: {}, stores: {} },
    };

    const merged = win.mergeCloudState(
      localStateWithTombstone,
      staleRemoteData
    );

    // Active List Zombie Prevention
    const mergedItemIds = merged.activeList.items.map((i) => i.id);
    assert(
      !mergedItemIds.includes("zombie_item_01"),
      "ZOMBIE-01: mergeCloudState does NOT resurrect deleted item 'zombie_item_01'"
    );
    assert(
      mergedItemIds.includes("valid_remote_01"),
      "ZOMBIE-02: mergeCloudState includes non-deleted remote item 'valid_remote_01'"
    );

    // Purchase Ledger Zombie Prevention
    const mergedLedgerIds = merged.purchaseLedger.map((l) => l.id);
    assert(
      !mergedLedgerIds.includes("zombie_ledger_01"),
      "ZOMBIE-03: mergeCloudState does NOT resurrect deleted ledger record 'zombie_ledger_01'"
    );
    assert(
      mergedLedgerIds.includes("valid_ledger_01"),
      "ZOMBIE-04: mergeCloudState includes non-deleted ledger record 'valid_ledger_01'"
    );

    // Stores Zombie Prevention
    assert(
      !merged.stores.includes("DeletedStore"),
      "ZOMBIE-05: mergeCloudState does NOT resurrect deleted store 'DeletedStore'"
    );
    assert(
      merged.stores.includes("Lotte Mart"),
      "ZOMBIE-06: mergeCloudState includes newly added remote store 'Lotte Mart'"
    );

    // Tombstones Union
    assert(
      merged._deleted.items["zombie_item_01"] === deleteDate,
      "ZOMBIE-07: mergeCloudState preserves tombstones in merged state payload"
    );
  }

  // --- Section 4: 3-Way Differential Merge Engine & In-Flight Concurrency Guard ---
  console.log(
    "\n--- Section 4: 3-Way Differential Merge Engine & In-Flight Concurrency Guard ---"
  );
  {
    const ts0 = "2026-08-31T09:00:00.000Z";
    const tsRemote = "2026-08-31T09:00:05.000Z";
    const tsInFlight = "2026-08-31T09:00:10.000Z";

    // Base Snapshot before network call started (S_0)
    const baseSnapshot = {
      activeList: {
        id: "default",
        items: [
          {
            id: "item_concurrent_01",
            name: "Dầu ăn Simply",
            price: 60000,
            checked: false,
            updatedAt: ts0,
          },
          {
            id: "item_concurrent_02",
            name: "Nước mắm Nam Ngư",
            price: 30000,
            checked: false,
            updatedAt: ts0,
          },
        ],
      },
      purchaseLedger: [],
      stores: ["WinMart"],
      _deleted: { items: {}, ledger: {}, stores: {} },
    };

    // Remote peer updated price of item_concurrent_01 and added item_concurrent_03 (R)
    const remoteData = {
      activeList: {
        id: "default",
        items: [
          {
            id: "item_concurrent_01",
            name: "Dầu ăn Simply",
            price: 65000,
            checked: false,
            updatedAt: tsRemote,
          },
          {
            id: "item_concurrent_03",
            name: "Hạt nêm Knorr",
            price: 28000,
            checked: false,
            updatedAt: tsRemote,
          },
        ],
      },
      purchaseLedger: [],
      stores: ["WinMart", "Bách Hoá Xanh"],
      _deleted: { items: {}, ledger: {}, stores: {} },
    };

    // User checked item_concurrent_01 in aisle and deleted item_concurrent_02 while sync was in flight (S_live)
    const liveState = {
      activeList: {
        id: "default",
        items: [
          {
            id: "item_concurrent_01",
            name: "Dầu ăn Simply",
            price: 60000,
            checked: true,
            updatedAt: tsInFlight,
          },
        ],
      },
      purchaseLedger: [],
      stores: ["WinMart"],
      _deleted: {
        items: { item_concurrent_02: tsInFlight },
        ledger: {},
        stores: {},
      },
    };

    const finalMerged = win.merge3Way(baseSnapshot, liveState, remoteData);

    const mergedItem01 = finalMerged.activeList.items.find(
      (i) => i.id === "item_concurrent_01"
    );
    assert(
      mergedItem01 !== undefined,
      "3WAY-01: Merged active list contains item_concurrent_01"
    );
    assertEqual(
      mergedItem01.checked,
      true,
      "3WAY-02: In-flight checked status (checked: true) is preserved"
    );

    // item_concurrent_02 was deleted in flight
    const mergedItem02 = finalMerged.activeList.items.find(
      (i) => i.id === "item_concurrent_02"
    );
    assert(
      mergedItem02 === undefined,
      "3WAY-03: In-flight deleted item_concurrent_02 remains deleted"
    );

    // item_concurrent_03 was added remotely
    const mergedItem03 = finalMerged.activeList.items.find(
      (i) => i.id === "item_concurrent_03"
    );
    assert(
      mergedItem03 !== undefined,
      "3WAY-04: Remote newly added item_concurrent_03 is successfully merged"
    );

    // Remote newly added store
    assert(
      finalMerged.stores.includes("Bách Hoá Xanh"),
      "3WAY-05: Remote store 'Bách Hoá Xanh' is successfully merged"
    );
  }

  // --- Section 5: Atomic Trip Completion & Deterministic Ledger IDs ---
  console.log(
    "\n--- Section 5: Atomic Trip Completion & Deterministic Ledger IDs ---"
  );
  {
    win.memoryState.activeList.items = [
      {
        id: "trip_item_01",
        name: "Thịt heo",
        price: 120000,
        quantity: 1,
        unit: "kg",
        store: "WinMart",
        checked: true,
      },
      {
        id: "trip_item_02",
        name: "Rau cải",
        price: 15000,
        quantity: 2,
        unit: "bunch",
        store: "WinMart",
        checked: true,
      },
      {
        id: "trip_item_03",
        name: "Xà phòng",
        price: 45000,
        quantity: 1,
        unit: "ea",
        store: "WinMart",
        checked: false,
      },
    ];
    win.memoryState.purchaseLedger = [];
    win.memoryState._deleted = { items: {}, ledger: {}, stores: {} };

    win.finalizeTripCompletion();

    // 2 checked items moved to ledger
    assertEqual(
      win.memoryState.purchaseLedger.length,
      2,
      "TRIP-01: finalizeTripCompletion moves 2 purchased items into purchaseLedger"
    );

    const rec0 = win.memoryState.purchaseLedger[0];
    const rec1 = win.memoryState.purchaseLedger[1];
    assert(
      typeof rec0.id === "string" && rec0.id.startsWith("rec_"),
      `TRIP-02: Ledger record 0 has deterministic string ID starting with 'rec_' (Got: ${rec0.id})`
    );
    assert(
      typeof rec1.id === "string" && rec1.id.startsWith("rec_"),
      `TRIP-03: Ledger record 1 has deterministic string ID starting with 'rec_' (Got: ${rec1.id})`
    );
    assert(
      rec0.id !== rec1.id,
      "TRIP-04: Ledger record IDs are globally unique across items in the batch"
    );

    // Checked items must have tombstones recorded so remote peers don't resurrect them
    assert(
      win.memoryState._deleted.items["trip_item_01"] !== undefined,
      "TRIP-05: Tombstone recorded for completed item 'trip_item_01'"
    );
    assert(
      win.memoryState._deleted.items["trip_item_02"] !== undefined,
      "TRIP-06: Tombstone recorded for completed item 'trip_item_02'"
    );

    // Rollover item remains on active list with checked: false
    assertEqual(
      win.memoryState.activeList.items.length,
      1,
      "TRIP-07: Unchecked item rolls over to active list"
    );
    assertEqual(
      win.memoryState.activeList.items[0].checked,
      false,
      "TRIP-08: Rollover item check state is reset to false"
    );
    assertEqual(
      win.memoryState.activeList.items[0].id,
      "trip_item_03",
      "TRIP-09: Rollover item is 'trip_item_03'"
    );
  }

  // --- Section 6: Provider Mutex & Trailing Sync Pass ---
  console.log("\n--- Section 6: Provider Mutex & Trailing Sync Pass ---");
  {
    // Re-instantiate storage manager in sandbox
    win.initDatabase();
    const driveProvider = new win.GoogleDriveStorageProvider();
    const gistProvider = new win.GitHubGistStorageProvider();

    assert(
      driveProvider.isSyncing === false,
      "MUTEX-02: GoogleDriveStorageProvider isSyncing starts false"
    );
    assert(
      gistProvider.isSyncing === false,
      "MUTEX-03: GitHubGistStorageProvider isSyncing starts false"
    );

    // Simulate mutex lock
    gistProvider.isSyncing = true;
    sandbox.localStorage.setItem("github_sync_token", "ghp_mock_token_123");
    win.initGithubAuthState();
    gistProvider.sync();
    assert(
      gistProvider.needsTrailingSync === true,
      "MUTEX-04: Concurrent sync dispatch sets needsTrailingSync to true"
    );
    gistProvider.isSyncing = false;
  }

  // --- Section 7: PWA Version Stamp & Bilingual Parity ---
  console.log("\n--- Section 7: PWA Version Stamp & Bilingual Parity ---");
  {
    const swPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "sw.js"
    );
    const swContent = fs.readFileSync(swPath, "utf8");
    assert(
      swContent.includes('CACHE_NAME = "smart-buy-list-v3.8.0"'),
      "PWA-01: sw.js CACHE_NAME is stamped as 'smart-buy-list-v3.8.0'"
    );

    assert(
      htmlContent.includes("v3.8.0"),
      "PWA-02: index.html displays synchronized version badge 'v3.8.0'"
    );

    const manifestPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "manifest.webmanifest"
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assertEqual(
      manifest.version,
      "3.8.0",
      "PWA-03: manifest.webmanifest version is '3.8.0'"
    );

    const enKeys = Object.keys(win.TRANSLATIONS.en);
    const viKeys = Object.keys(win.TRANSLATIONS.vi);

    const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
    const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

    assertEqual(
      missingInVi.length,
      0,
      `I18N-PARITY-01: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
    );
    assertEqual(
      missingInEn.length,
      0,
      `I18N-PARITY-02: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "None"})`
    );
  }

  console.log("\n==================================================");
  console.log(
    `📊 Cloud Concurrency & Deletion Tombstones Test Summary: ${passedAssertions} Passed, ${failedAssertions} Failed`
  );
  console.log("==================================================");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test suite runtime exception:", err);
  process.exit(1);
});
