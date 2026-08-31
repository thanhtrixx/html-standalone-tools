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

function loadStorageSandbox(customIndexedDB = null, initialStorage = {}) {
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

  const storageMock = { ...initialStorage };
  const docElementClasses = new Set(["dark"]);

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
    Intl,
    RegExp,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout,
    clearTimeout,
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: () => Promise.resolve(),
    },
    document: {
      getElementById: (id) => ({
        id,
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false,
          toggle: () => {},
        },
        textContent: "",
        innerHTML: "",
        style: {},
        value: "",
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        focus: () => {},
      }),
      createElement: () => ({
        className: "",
        textContent: "",
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        remove: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {
        lang: "vi",
        classList: {
          contains: (c) => docElementClasses.has(c),
          add: (c) => docElementClasses.add(c),
          remove: (c) => docElementClasses.delete(c),
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
  return { sandbox, storageMock, htmlContent };
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

async function runTestSuite() {
  console.log(
    "\n🧪 Running Smart Buy-List IndexedDB Storage & PAT Migration Test Suite...\n"
  );

  // SECTION 1: IndexedDB Initialization & Schema Upgrade
  console.log(
    "--- Section 1: IndexedDB Initialization & Schema V2 Upgrade ---"
  );

  const idbFactory = new FakeIDBFactory();
  const { sandbox } = loadStorageSandbox(idbFactory);

  const initResult = await sandbox.initDatabase();
  assert(
    initResult === true,
    "IDB-01: initDatabase() resolves true when IndexedDB is available"
  );

  const db = idbFactory.databases.get("SmartBuyListDB");
  assert(!!db, "IDB-02: SmartBuyListDB database instance created");
  assert(
    db.version === 2,
    `IDB-03: Database schema upgraded to version 2 (Got: ${db.version})`
  );
  assert(
    db.objectStoreNames.contains("lists"),
    "IDB-04: 'lists' object store exists"
  );
  assert(
    db.objectStoreNames.contains("catalog"),
    "IDB-05: 'catalog' object store exists"
  );
  assert(
    db.objectStoreNames.contains("ledger"),
    "IDB-06: 'ledger' object store exists"
  );
  assert(
    db.objectStoreNames.contains("settings"),
    "IDB-07: 'settings' object store exists"
  );

  // SECTION 2: Silent Auto-Migration from localStorage to IDB
  console.log(
    "\n--- Section 2: Silent Auto-Migration from localStorage to IDB ---"
  );

  const legacyState = {
    activeList: {
      id: "default",
      title: "Chợ Hôm Nay",
      items: [
        {
          id: "item-1",
          name: "Sữa tươi TH",
          price: 38000,
          quantity: 2,
          unit: "L",
          store: "WinMart",
        },
        {
          id: "item-2",
          name: "Thịt heo ba chỉ",
          price: 120000,
          quantity: 1,
          unit: "kg",
          store: "Bách Hoá Xanh",
        },
      ],
    },
    catalog: [{ id: "cat-1", name: "Sữa tươi TH", defaultUnit: "L" }],
    purchaseLedger: [
      { id: 101, itemName: "Sữa tươi TH", store: "WinMart", unitPrice: 38000 },
    ],
    stores: ["WinMart", "Bách Hoá Xanh", "Costco"],
    settings: { language: "vi", currency: "VND", tripPhase: "BUYING" },
  };

  const idbFactory2 = new FakeIDBFactory();
  const initialLocalStorage = {
    smart_buy_list_state: JSON.stringify(legacyState),
    github_sync_token: "ghp_secretTokenForTesting12345",
    github_sync_gist_id: "gist_9988776655",
  };

  const { sandbox: sandbox2, storageMock: storageMock2 } = loadStorageSandbox(
    idbFactory2,
    initialLocalStorage
  );

  await sandbox2.initDatabase();

  const db2 = idbFactory2.databases.get("SmartBuyListDB");
  const listsStore = db2.stores.get("lists");
  const settingsStore = db2.stores.get("settings");
  const ledgerStore = db2.stores.get("ledger");

  const migratedList = listsStore.data.get("default");
  assert(
    migratedList && migratedList.items.length === 2,
    `MIG-01: Legacy active list items silently migrated to IDB 'lists' store (Count: ${migratedList?.items?.length})`
  );
  assert(
    migratedList.title === "Chợ Hôm Nay",
    `MIG-02: List title migrated accurately (Got: ${migratedList?.title})`
  );

  const migratedLedger = ledgerStore.data.get(101);
  assert(
    migratedLedger && migratedLedger.itemName === "Sữa tươi TH",
    "MIG-03: Legacy purchase ledger records migrated to IDB 'ledger' store"
  );

  const migratedToken = settingsStore.data.get("github_sync_token");
  assert(
    migratedToken && migratedToken.value === "ghp_secretTokenForTesting12345",
    "MIG-04: GitHub PAT migrated from localStorage to IDB 'settings' store"
  );

  // Verify localStorage keys were cleaned up
  assert(
    storageMock2.smart_buy_list_state === undefined,
    "MIG-05: localStorage.smart_buy_list_state removed after successful IDB migration"
  );
  assert(
    storageMock2.github_sync_token === undefined,
    "MIG-06: localStorage.github_sync_token removed after successful IDB migration"
  );
  assert(
    storageMock2.github_sync_gist_id === undefined,
    "MIG-07: localStorage.github_sync_gist_id removed after successful IDB migration"
  );

  // SECTION 3: IDB Persistence & Cold-Start Hydration
  console.log("\n--- Section 3: IDB Persistence & Cold-Start Hydration ---");

  // Modify data and save
  sandbox2.memoryState.activeList.items.push({
    id: "item-3",
    name: "Cà phê G7",
    price: 55000,
    quantity: 1,
    unit: "box",
    store: "WinMart",
  });

  await sandbox2.storageManager.local.saveState(sandbox2.memoryState);

  const updatedListInIDB = listsStore.data.get("default");
  assert(
    updatedListInIDB && updatedListInIDB.items.length === 3,
    `IDB-PERSIST-01: saveState() persisted 3 items directly to IDB (Count: ${updatedListInIDB?.items?.length})`
  );

  // SECTION 4: Graceful LocalStorage Fallback (IDB Unavailable/Incognito)
  console.log(
    "\n--- Section 4: Graceful LocalStorage Fallback (IDB Unavailable) ---"
  );

  const { sandbox: fallbackSandbox, storageMock: fallbackStorage } =
    loadStorageSandbox(null);

  const fallbackInit = await fallbackSandbox.initDatabase();
  assert(
    fallbackInit === false,
    "FALLBACK-01: initDatabase() returns false gracefully when IndexedDB is unavailable"
  );

  fallbackSandbox.memoryState.activeList.items.push({
    id: "fb-item-1",
    name: "Bánh mì baguette",
    price: 15000,
    quantity: 2,
    unit: "ea",
    store: "Co.opmart",
  });

  fallbackSandbox.saveToLocalStorage();

  assert(
    typeof fallbackStorage.smart_buy_list_state === "string",
    "FALLBACK-02: saveToLocalStorage() persists to localStorage when IDB is unavailable"
  );

  const parsedFallback = JSON.parse(fallbackStorage.smart_buy_list_state);
  assert(
    parsedFallback.activeList.items.some((i) => i.name === "Bánh mì baguette"),
    "FALLBACK-03: Fallback data round-trips correctly through localStorage"
  );
}

runTestSuite()
  .then(() => {
    console.log("\n==================================================");
    console.log(
      `📊 IndexedDB Storage Test Summary: ${passed} Passed, ${failed} Failed`
    );
    console.log("==================================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("❌ Fatal Test Suite Error:", err);
    process.exit(1);
  });
