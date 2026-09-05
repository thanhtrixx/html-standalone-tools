const fs = require("fs");
const path = require("path");
const vm = require("vm");

// In-Memory IndexedDB Mock for Node.js Testing
class FakeIDBObjectStore {
  constructor(name, keyPath, autoIncrement = false) {
    this.name = name;
    this.keyPath = keyPath;
    this.autoIncrement = autoIncrement;
    this.data = new Map();
    this.autoIncCounter = 1;
  }

  put(val) {
    let key;
    if (this.keyPath) {
      key = val[this.keyPath];
    } else if (this.autoIncrement) {
      key = val.id || this.autoIncCounter++;
      val.id = key;
    } else {
      key = String(this.autoIncCounter++);
    }
    this.data.set(key, JSON.parse(JSON.stringify(val)));
    const req = { result: key, onsuccess: null, onerror: null };
    setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
    return req;
  }

  get(key) {
    const val = this.data.get(key);
    const req = {
      result: val ? JSON.parse(JSON.stringify(val)) : undefined,
      onsuccess: null,
      onerror: null,
    };
    setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
    return req;
  }

  getAll() {
    const vals = Array.from(this.data.values()).map((v) =>
      JSON.parse(JSON.stringify(v))
    );
    const req = { result: vals, onsuccess: null, onerror: null };
    setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
    return req;
  }

  delete(key) {
    this.data.delete(key);
    const req = { result: undefined, onsuccess: null, onerror: null };
    setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
    return req;
  }

  clear() {
    this.data.clear();
    const req = { result: undefined, onsuccess: null, onerror: null };
    setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
    return req;
  }
}

class FakeIDBDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.stores = new Map();
    this.objectStoreNames = {
      contains: (n) => this.stores.has(n),
    };
  }

  createObjectStore(name, options = {}) {
    const store = new FakeIDBObjectStore(
      name,
      options.keyPath,
      options.autoIncrement
    );
    this.stores.set(name, store);
    return store;
  }

  transaction(storeNames, mode) {
    const db = this;
    const tx = {
      mode,
      oncomplete: null,
      onerror: null,
      objectStore: (name) => {
        if (!db.stores.has(name)) {
          throw new Error(`Store ${name} not found`);
        }
        return db.stores.get(name);
      },
    };
    setTimeout(() => {
      if (tx.oncomplete) tx.oncomplete();
    }, 5);
    return tx;
  }
}

class FakeIDBFactory {
  constructor() {
    this.databases = new Map();
  }

  open(name, version) {
    const req = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    setTimeout(() => {
      let db = this.databases.get(name);
      const isNew = !db;
      if (!db) {
        db = new FakeIDBDatabase(name, version);
        this.databases.set(name, db);
      }

      if (isNew || (version && version > db.version)) {
        db.version = version;
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: { result: db } });
        }
      }

      req.result = db;
      if (req.onsuccess) {
        req.onsuccess({ target: { result: db } });
      }
    }, 0);

    return req;
  }
}

function loadSandbox(options = {}) {
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

  const storageMock = { ...(options.initialStorage || {}) };
  const domElements = {};
  let persistCalled = false;

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
        },
        textContent: "",
        innerHTML: "",
        value: "",
        checked: true,
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

  const fakeIdb = options.idb || new FakeIDBFactory();

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
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (fn, ms) => setTimeout(fn, ms || 0),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: () => {},
    clearInterval: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      share: () => Promise.resolve(),
      storage: {
        persist: () => {
          persistCalled = true;
          return Promise.resolve(true);
        },
      },
    },
    document: {
      getElementById: (id) => getMockEl(id),
      getElementsByName: (name) => [{ checked: true, value: "rollover" }],
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          className: "",
          textContent: "",
          classList: { add: () => {}, remove: () => {}, contains: () => false },
          remove: () => {},
          setAttribute: (k, v) => {
            el[k] = v;
          },
          appendChild: () => {},
          click: () => {},
        };
        return el;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {
        lang: "en",
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
      body: {
        style: {},
        appendChild: () => {},
      },
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
    indexedDB: fakeIdb,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return {
    sandbox,
    storageMock,
    domElements,
    fakeIdb,
    getPersistCalled: () => persistCalled,
  };
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

async function runTests() {
  console.log(
    "\n🧪 Running Smart Buy-List Snapshots & Backup Preview Test Suite (Issue #308)...\n"
  );

  const htmlPath = path.join(
    __dirname,
    "../..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const rawHtml = fs.readFileSync(htmlPath, "utf8");

  // --- Section 1: DOM & ARIA Verification ---
  console.log("--- Section 1: DOM & ARIA Verification ---");
  assert(
    rawHtml.includes('id="backupPreviewModal"'),
    "SNAPSHOT-01a: #backupPreviewModal exists in DOM"
  );
  assert(
    rawHtml.includes('role="dialog"') &&
      rawHtml.includes('aria-modal="true"') &&
      rawHtml.includes('aria-labelledby="backupPreviewModalTitle"'),
    "SNAPSHOT-01b: #backupPreviewModal has complete dialog ARIA semantics"
  );
  assert(
    rawHtml.includes('id="btnConfirmBackupRestore"'),
    "SNAPSHOT-01c: #btnConfirmBackupRestore button exists in backup preview modal"
  );
  assert(
    rawHtml.includes('id="btnRestoreLastSnapshot"'),
    "SNAPSHOT-01d: #btnRestoreLastSnapshot 1-tap rollback button exists in Settings modal"
  );
  assert(
    rawHtml.includes('id="snapshotCountBadge"'),
    "SNAPSHOT-01e: #snapshotCountBadge counter exists in Settings modal"
  );

  // --- Section 2: WebKit ITP Storage Eviction Defense ---
  console.log("\n--- Section 2: WebKit ITP Storage Eviction Defense ---");
  const { sandbox, getPersistCalled } = loadSandbox();
  await sandbox.initDatabase();
  assert(
    getPersistCalled(),
    "SNAPSHOT-02a: initDatabase() requests navigator.storage.persist() for ITP eviction defense"
  );

  // --- Section 3: Rolling Snapshots & 5-Item Cap ---
  console.log("\n--- Section 3: Rolling Snapshots & 5-Item Cap ---");
  assert(
    typeof sandbox.saveFullStateSnapshot === "function",
    "SNAPSHOT-03a: saveFullStateSnapshot is globally exported"
  );
  assert(
    typeof sandbox.restoreSnapshot === "function",
    "SNAPSHOT-03b: restoreSnapshot is globally exported"
  );
  assert(
    typeof sandbox.restoreLastSnapshot === "function",
    "SNAPSHOT-03c: restoreLastSnapshot is globally exported"
  );

  // Reset snapshots
  sandbox.memoryState.snapshots = [];

  // Create 7 snapshots to verify 5-item rolling cap
  for (let i = 1; i <= 7; i++) {
    sandbox.saveFullStateSnapshot(`TEST_SNAPSHOT_${i}`);
  }

  assert(
    sandbox.memoryState.snapshots.length === 5,
    `SNAPSHOT-03d: Snapshots capped at 5 entries (Got: ${sandbox.memoryState.snapshots.length})`
  );
  assert(
    sandbox.memoryState.snapshots[0].reason === "TEST_SNAPSHOT_7",
    "SNAPSHOT-03e: Most recent snapshot is first in array"
  );
  assert(
    sandbox.memoryState.snapshots[4].reason === "TEST_SNAPSHOT_3",
    "SNAPSHOT-03f: Oldest pruned snapshots beyond 5 are discarded"
  );

  // --- Section 4: 1-Tap Snapshot Rollback ---
  console.log("\n--- Section 4: 1-Tap Snapshot Rollback ---");
  sandbox.memoryState.activeList.items = [
    { id: "orig-1", name: "Original Item 1", price: 50 },
  ];
  const snap = sandbox.saveFullStateSnapshot("BEFORE_MODIFICATION");

  // Modify active list
  sandbox.memoryState.activeList.items = [
    { id: "mod-1", name: "Modified Item 1", price: 999 },
    { id: "mod-2", name: "Modified Item 2", price: 888 },
  ];

  assert(
    sandbox.memoryState.activeList.items.length === 2,
    "SNAPSHOT-04a: State modified to 2 items"
  );

  const restored = sandbox.restoreLastSnapshot();
  assert(restored === true, "SNAPSHOT-04b: restoreLastSnapshot returns true");
  assert(
    sandbox.memoryState.activeList.items.length === 1,
    `SNAPSHOT-04c: State reverted to 1 item (Got: ${sandbox.memoryState.activeList.items.length})`
  );
  assert(
    sandbox.memoryState.activeList.items[0].name === "Original Item 1",
    "SNAPSHOT-04d: Reverted state item name matches original item"
  );

  // --- Section 5: Trip Completion Automatic Snapshot ---
  console.log("\n--- Section 5: Trip Completion Automatic Snapshot ---");
  sandbox.memoryState.activeList.items = [
    { id: "milk-1", name: "Whole Milk", price: 35, checked: true },
  ];
  sandbox.finalizeTripCompletion();
  assert(
    sandbox.memoryState.snapshots.length > 0,
    "SNAPSHOT-05a: Snapshots array populated after trip completion"
  );
  assert(
    sandbox.memoryState.snapshots[0].reason === "TRIP_COMPLETION",
    `SNAPSHOT-05b: Trip completion triggers automatic snapshot with reason 'TRIP_COMPLETION' (Got: ${sandbox.memoryState.snapshots[0]?.reason})`
  );

  // --- Section 6: Backup Preview Modal & Side-by-Side Comparison ---
  console.log(
    "\n--- Section 6: Backup Preview Modal & Side-by-Side Comparison ---"
  );
  assert(
    typeof sandbox.openBackupPreviewModal === "function",
    "SNAPSHOT-06a: openBackupPreviewModal is globally exported"
  );
  assert(
    typeof sandbox.executeConfirmedBackupRestore === "function",
    "SNAPSHOT-06b: executeConfirmedBackupRestore is globally exported"
  );

  const mockBackup = {
    version: "4.4.0",
    exportDate: "2026-09-05T12:00:00.000Z",
    activeList: {
      items: [
        { id: "b1", name: "Backup Item 1", price: 10 },
        { id: "b2", name: "Backup Item 2", price: 20 },
      ],
    },
    purchaseLedger: [
      { id: "pl1", itemName: "Past Item 1", price: 15, date: "2026-09-01" },
      { id: "pl2", itemName: "Past Item 2", price: 25, date: "2026-09-02" },
      { id: "pl3", itemName: "Past Item 3", price: 35, date: "2026-09-03" },
    ],
    stores: ["Store A", "Store B"],
  };

  sandbox.openBackupPreviewModal(mockBackup);

  const incomingItemCount = sandbox.document.getElementById(
    "backupIncomingItemCount"
  );
  const incomingLedgerCount = sandbox.document.getElementById(
    "backupIncomingLedgerCount"
  );
  const incomingStoreCount = sandbox.document.getElementById(
    "backupIncomingStoreCount"
  );
  const modalEl = sandbox.document.getElementById("backupPreviewModal");

  assert(
    String(incomingItemCount.textContent) === "2",
    `SNAPSHOT-06c: Incoming item count formatted correctly (Got: ${incomingItemCount.textContent})`
  );
  assert(
    String(incomingLedgerCount.textContent) === "3",
    `SNAPSHOT-06d: Incoming ledger count formatted correctly (Got: ${incomingLedgerCount.textContent})`
  );
  assert(
    String(incomingStoreCount.textContent) === "2",
    `SNAPSHOT-06e: Incoming store count formatted correctly (Got: ${incomingStoreCount.textContent})`
  );
  assert(
    !modalEl.classList.contains("hidden"),
    "SNAPSHOT-06f: #backupPreviewModal is unhidden after openBackupPreviewModal"
  );

  // Execute restore
  sandbox.executeConfirmedBackupRestore();

  assert(
    sandbox.memoryState.activeList.items.length === 2,
    `SNAPSHOT-06g: Active list items restored from backup (Got: ${sandbox.memoryState.activeList.items.length})`
  );
  assert(
    sandbox.memoryState.purchaseLedger.length === 3,
    `SNAPSHOT-06h: Purchase ledger restored from backup (Got: ${sandbox.memoryState.purchaseLedger.length})`
  );
  assert(
    modalEl.classList.contains("hidden"),
    "SNAPSHOT-06i: #backupPreviewModal closed after confirmed restore"
  );

  // --- Section 7: Bilingual Dictionary Parity ---
  console.log("\n--- Section 7: Bilingual Dictionary Parity ---");
  const requiredKeys = [
    "backup_preview_title",
    "backup_preview_subtitle",
    "lbl_backup_export_date",
    "lbl_backup_version",
    "th_data_category",
    "th_current_database",
    "th_incoming_backup",
    "lbl_compare_active_items",
    "lbl_compare_ledger_records",
    "lbl_compare_stores",
    "lbl_auto_snapshot_title",
    "lbl_auto_snapshot_desc",
    "btn_confirm_restore",
    "btn_restore_last_snapshot",
    "toast_snapshot_restored",
    "toast_no_snapshot",
  ];

  const enKeys = Object.keys(sandbox.TRANSLATIONS.en);
  const viKeys = Object.keys(sandbox.TRANSLATIONS.vi);

  requiredKeys.forEach((key) => {
    assert(
      enKeys.includes(key),
      `SNAPSHOT-07a: Key '${key}' exists in TRANSLATIONS.en`
    );
    assert(
      viKeys.includes(key),
      `SNAPSHOT-07b: Key '${key}' exists in TRANSLATIONS.vi`
    );
  });

  console.log("\n==================================================");
  console.log(
    `📊 Snapshots & Backup Preview Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
