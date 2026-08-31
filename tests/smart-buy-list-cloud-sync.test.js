const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListCloudSyncEngine(options = {}) {
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

  const storageMock = { ...(options.initialStorage || {}) };
  const domElements = {};
  const fetchCalls = [];

  function getMockEl(id) {
    if (!domElements[id]) {
      const classSet = new Set(["hidden"]);
      domElements[id] = {
        id,
        tagName: "DIV",
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
        title: "",
        style: {},
        appendChild() {},
        focus() {},
        scrollIntoView() {},
        setAttribute(k, v) {
          this[k] = v;
        },
        removeAttribute(k) {
          delete this[k];
        },
      };
    }
    return domElements[id];
  }

  const mockFetch = async (url, fetchOptions = {}) => {
    fetchCalls.push({ url, options: fetchOptions });
    if (options.mockFetchHandler) {
      return options.mockFetchHandler(url, fetchOptions);
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ files: [] }),
      text: async () => JSON.stringify({}),
    };
  };

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
    fetch: mockFetch,
    setTimeout: (fn, ms) => setTimeout(fn, ms || 0),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (fn, ms) => setInterval(fn, ms || 0),
    clearInterval: (id) => clearInterval(id),
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      vibrate: () => {},
      onLine: true,
      share: undefined,
    },
    document: {
      getElementById: (id) => getMockEl(id),
      querySelector: (sel) => getMockEl(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => {
        const el = getMockEl(`dyn_${Date.now()}_${Math.random()}`);
        el.tagName = tag.toUpperCase();
        return el;
      },
      addEventListener: () => {},
      documentElement: {
        classList: {
          classes: new Set(["dark"]),
          contains: (cls) => cls === "dark",
          add() {},
          remove() {},
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
    indexedDB: {
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
    },
  };
  sandbox.window = sandbox;

  if (options.google) {
    sandbox.google = options.google;
  }

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  return { sandbox, storageMock, domElements, fetchCalls };
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

console.log(
  "\n🧪 Running Smart Buy-List Google Drive Cloud Sync Seam Test Suite (v3.3.0)...\n"
);

async function runCloudSyncTests() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const swContent = fs.readFileSync(swPath, "utf8");

  try {
    // =========================================================================
    // SECTION 1: DOM Elements & Markup Verification
    // =========================================================================
    console.log("--- Section 1: DOM Elements & Option Hub Markup ---");

    assert(
      htmlContent.includes('id="cloudSyncSection"') ||
        htmlContent.includes('id="cloudSyncCard"'),
      "SYNC-DOM-01: Option Hub contains Cloud Sync section container"
    );
    assert(
      htmlContent.includes('id="googleClientIdInput"'),
      "SYNC-DOM-02: Option Hub contains Google Client ID input (#googleClientIdInput)"
    );
    assert(
      htmlContent.includes('id="btnGoogleSignIn"'),
      "SYNC-DOM-03: Option Hub contains Sign in with Google button (#btnGoogleSignIn)"
    );
    assert(
      htmlContent.includes('id="btnGoogleSignOut"'),
      "SYNC-DOM-04: Option Hub contains Disconnect button (#btnGoogleSignOut)"
    );
    assert(
      htmlContent.includes('id="btnGoogleSyncNow"'),
      "SYNC-DOM-05: Option Hub contains Sync Now button (#btnGoogleSyncNow)"
    );
    assert(
      htmlContent.includes('id="cloudSyncStatusPill"'),
      "SYNC-DOM-06: Option Hub contains Cloud Sync status pill (#cloudSyncStatusPill)"
    );
    assert(
      htmlContent.includes('id="cloudSyncLastTime"'),
      "SYNC-DOM-07: Option Hub contains Last Synced timestamp container (#cloudSyncLastTime)"
    );
    assert(
      htmlContent.includes('id="topBarSyncStatus"'),
      "SYNC-DOM-08: Top App Bar contains live sync status indicator (#topBarSyncStatus)"
    );

    // =========================================================================
    // SECTION 2: Storage Provider Seam Architecture (IStorageProvider)
    // =========================================================================
    console.log("\n--- Section 2: Storage Provider Seam Architecture ---");

    const engine = loadBuyListCloudSyncEngine();
    await engine.sandbox.initDatabase();

    assert(
      typeof engine.sandbox.StorageProvider === "function" ||
        typeof engine.sandbox.IStorageProvider === "function",
      "SEAM-01: StorageProvider base interface / class exists"
    );
    assert(
      typeof engine.sandbox.IndexedDBStorageProvider === "function",
      "SEAM-02: IndexedDBStorageProvider class exists"
    );
    assert(
      typeof engine.sandbox.GoogleDriveStorageProvider === "function",
      "SEAM-03: GoogleDriveStorageProvider class exists"
    );
    assert(
      typeof engine.sandbox.storageManager === "object" &&
        engine.sandbox.storageManager !== null,
      "SEAM-04: Global storageManager singleton exists"
    );

    const activeProvider = engine.sandbox.storageManager.getProvider();
    assert(
      activeProvider instanceof engine.sandbox.IndexedDBStorageProvider,
      "SEAM-05: Default storage provider is IndexedDBStorageProvider"
    );

    const currentStatus = activeProvider.getStatus();
    assert(
      currentStatus && typeof currentStatus.provider === "string",
      "SEAM-06: Storage provider returns structured status object"
    );

    // =========================================================================
    // SECTION 3: Google Identity Services (GIS) & Ephemeral Auth Lifecycle
    // =========================================================================
    console.log("\n--- Section 3: GIS Loader & Ephemeral Auth Lifecycle ---");

    assert(
      typeof engine.sandbox.initGoogleAuthClient === "function",
      "AUTH-01: initGoogleAuthClient function is exported"
    );
    assert(
      typeof engine.sandbox.handleGoogleSignIn === "function",
      "AUTH-02: handleGoogleSignIn function is exported"
    );
    assert(
      typeof engine.sandbox.handleGoogleSignOut === "function",
      "AUTH-03: handleGoogleSignOut function is exported"
    );

    // Test offline resilience: Calling without GIS script does not throw
    let offlineAuthThrew = false;
    try {
      engine.sandbox.initGoogleAuthClient();
    } catch (e) {
      offlineAuthThrew = true;
    }
    assert(
      !offlineAuthThrew,
      "AUTH-04: initGoogleAuthClient executes safely when offline / GIS unavailable"
    );

    // Mock Google Identity Services Token Client
    let requestTokenCallback = null;
    const mockTokenClient = {
      callback: null,
      requestAccessToken: (config) => {
        if (mockTokenClient.callback) {
          mockTokenClient.callback({
            access_token: "mock_gdrive_access_token_xyz123",
            expires_in: 3600,
          });
        }
      },
    };

    const mockGoogleGis = {
      accounts: {
        oauth2: {
          initTokenClient: (config) => {
            mockTokenClient.callback = config.callback;
            return mockTokenClient;
          },
        },
      },
    };

    const authEngine = loadBuyListCloudSyncEngine({
      google: mockGoogleGis,
      initialStorage: {
        google_client_id: "test-client-id-12345.apps.googleusercontent.com",
      },
    });
    await authEngine.sandbox.initDatabase();

    // Trigger Sign In
    authEngine.sandbox.handleGoogleSignIn();
    assert(
      authEngine.sandbox.googleAuthState &&
        authEngine.sandbox.googleAuthState.accessToken ===
          "mock_gdrive_access_token_xyz123",
      "AUTH-05: Successful GIS authorization populates ephemeral in-memory accessToken"
    );
    assert(
      authEngine.storageMock["google_client_id"] ===
        "test-client-id-12345.apps.googleusercontent.com",
      "AUTH-06: Persists user google_client_id to localStorage"
    );
    assert(
      authEngine.storageMock["google_access_token"] === undefined,
      "AUTH-07: Strictly does NOT persist OAuth bearer token to localStorage (Security Invariant)"
    );

    // Test Sign Out
    authEngine.sandbox.handleGoogleSignOut();
    assert(
      !authEngine.sandbox.googleAuthState.accessToken,
      "AUTH-08: handleGoogleSignOut purges in-memory access token"
    );

    // =========================================================================
    // SECTION 4: Google Drive AppData REST API v3 Integration
    // =========================================================================
    console.log("\n--- Section 4: Google Drive AppData REST API v3 ---");

    let gdriveFilesStore = [];
    const mockDriveFetch = async (url, opts = {}) => {
      const urlStr = String(url);
      const authHeader = opts.headers?.Authorization || "";

      if (!authHeader.includes("mock_gdrive_access_token_xyz123")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { message: "Unauthorized" } }),
        };
      }

      // Query files in appDataFolder
      if (
        urlStr.includes("/drive/v3/files") &&
        (!opts.method || opts.method === "GET")
      ) {
        if (urlStr.includes("alt=media")) {
          // Download content
          const file = gdriveFilesStore.find((f) => urlStr.includes(f.id));
          return {
            ok: !!file,
            status: file ? 200 : 404,
            json: async () => (file ? file.content : {}),
            text: async () => (file ? JSON.stringify(file.content) : "{}"),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            files: gdriveFilesStore.map((f) => ({
              id: f.id,
              name: f.name,
              modifiedTime: f.modifiedTime,
            })),
          }),
        };
      }

      // Create multipart file
      if (urlStr.includes("/upload/drive/v3/files") && opts.method === "POST") {
        const newFile = {
          id: "drive_file_id_999",
          name: "smart_buy_list_data.json",
          modifiedTime: new Date().toISOString(),
          content: { schemaVersion: 2, app: "smart-buy-list-price-tracker" },
        };
        gdriveFilesStore.push(newFile);
        return {
          ok: true,
          status: 200,
          json: async () => newFile,
        };
      }

      // Update media file
      if (
        urlStr.includes("/upload/drive/v3/files") &&
        opts.method === "PATCH"
      ) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "drive_file_id_999",
            modifiedTime: new Date().toISOString(),
          }),
        };
      }

      return { ok: true, status: 200, json: async () => ({}) };
    };

    const driveEngine = loadBuyListCloudSyncEngine({
      google: mockGoogleGis,
      mockFetchHandler: mockDriveFetch,
      initialStorage: {
        google_client_id: "test-client-id-12345.apps.googleusercontent.com",
      },
    });
    await driveEngine.sandbox.initDatabase();
    driveEngine.sandbox.handleGoogleSignIn();

    // Instantiate GoogleDriveStorageProvider
    const gdriveProvider = new driveEngine.sandbox.GoogleDriveStorageProvider(
      driveEngine.sandbox.storageManager.getProvider()
    );

    const syncResult = await gdriveProvider.sync();
    assert(
      syncResult.success === true,
      "DRIVE-01: GoogleDriveStorageProvider.sync() completes successfully"
    );
    assert(
      driveEngine.fetchCalls.some((c) =>
        c.url.includes("spaces=appDataFolder")
      ),
      "DRIVE-02: Queries Google Drive REST v3 spaces=appDataFolder endpoint"
    );
    assert(
      driveEngine.fetchCalls.some(
        (c) =>
          c.url.includes("/upload/drive/v3/files") &&
          c.options.method === "POST"
      ),
      "DRIVE-03: Creates smart_buy_list_data.json via multipart POST upload"
    );

    // =========================================================================
    // SECTION 5: Deterministic Multi-Device Cloud Smart Merge Engine
    // =========================================================================
    console.log("\n--- Section 5: Deterministic Cloud Smart Merge Engine ---");

    assert(
      typeof driveEngine.sandbox.mergeCloudState === "function",
      "MERGE-01: mergeCloudState pure function is exported"
    );

    const localState = {
      activeList: {
        id: "default",
        title: "Weekly Groceries",
        items: [
          {
            id: "item_1",
            name: "Whole Milk",
            quantity: 2,
            unit: "L",
            price: 3.5,
            checked: false,
            updatedAt: "2026-08-30T10:00:00.000Z",
          },
          {
            id: "item_2",
            name: "Jasmine Rice",
            quantity: 5,
            unit: "kg",
            price: 12.0,
            checked: false,
            updatedAt: "2026-08-30T10:00:00.000Z",
          },
        ],
      },
      purchaseLedger: [
        {
          id: 1,
          itemName: "Whole Milk",
          store: "Costco",
          unitPrice: 1.75,
          date: "2026-08-15",
          timestamp: 1723700000000,
        },
      ],
      stores: ["Costco", "Trader Joe's"],
      settings: { language: "en", currency: "USD" },
    };

    const remoteState = {
      activeList: {
        id: "default",
        title: "Weekly Groceries",
        items: [
          {
            id: "item_1",
            name: "Whole Milk",
            quantity: 3, // Updated remotely
            unit: "L",
            price: 3.5,
            checked: true,
            updatedAt: "2026-08-30T11:00:00.000Z", // Newer
          },
          {
            id: "item_3",
            name: "Avocados",
            quantity: 4,
            unit: "ea",
            price: 4.0,
            checked: false,
            updatedAt: "2026-08-30T11:00:00.000Z",
          },
        ],
      },
      purchaseLedger: [
        {
          id: 1,
          itemName: "Whole Milk",
          store: "Costco",
          unitPrice: 1.75,
          date: "2026-08-15",
          timestamp: 1723700000000,
        },
        {
          id: 2,
          itemName: "Avocados",
          store: "Trader Joe's",
          unitPrice: 1.0,
          date: "2026-08-20",
          timestamp: 1724100000000,
        },
      ],
      stores: ["Costco", "WinMart"],
      settings: { language: "vi", currency: "VND" },
    };

    const merged = driveEngine.sandbox.mergeCloudState(localState, remoteState);

    assert(
      merged.activeList.items.length === 3,
      "MERGE-02: Merged active list contains exactly 3 items (Milk, Rice, Avocados)"
    );

    const mergedMilk = merged.activeList.items.find((i) => i.id === "item_1");
    assert(
      mergedMilk && mergedMilk.quantity === 3 && mergedMilk.checked === true,
      "MERGE-03: Adopts newer remote item state (quantity 3, checked true)"
    );

    const mergedRice = merged.activeList.items.find((i) => i.id === "item_2");
    assert(
      mergedRice && mergedRice.name === "Jasmine Rice",
      "MERGE-04: Retains unique local item (Jasmine Rice)"
    );

    assert(
      merged.purchaseLedger.length === 2,
      "MERGE-05: Unions purchase ledger transactions without duplication"
    );

    assert(
      merged.stores.includes("Costco") &&
        merged.stores.includes("Trader Joe's") &&
        merged.stores.includes("WinMart"),
      "MERGE-06: Mathematical union of store profiles"
    );

    // =========================================================================
    // SECTION 6: Synchronization Triggers & Mutation Debounce
    // =========================================================================
    console.log("\n--- Section 6: Mutation Debounce & Sync Triggers ---");

    assert(
      typeof driveEngine.sandbox.triggerDebouncedCloudSync === "function",
      "TRIG-01: triggerDebouncedCloudSync function is exported"
    );

    // =========================================================================
    // SECTION 7: PWA Version Bump & Bilingual Translation Parity
    // =========================================================================
    console.log("\n--- Section 7: PWA Version & Bilingual Parity ---");

    assert(
      swContent.includes('CACHE_NAME = "smart-buy-list-v3.3.0"') ||
        swContent.includes('CACHE_NAME = "smart-buy-list-v3.4.0"'),
      "PWA-01: sw.js bumps CACHE_NAME to 'smart-buy-list-v3.3.0' or higher"
    );
    assert(
      htmlContent.includes("v3.3.0") || htmlContent.includes("v3.4.0"),
      "PWA-02: index.html displays synchronized version badge v3.3.0 or higher"
    );

    const requiredI18nKeys = [
      "cloud_sync_title",
      "cloud_sync_synced",
      "cloud_sync_syncing",
      "cloud_sync_offline",
      "cloud_sync_error",
      "cloud_sync_client_id_label",
      "cloud_sync_client_id_placeholder",
      "btn_google_signin",
      "btn_google_signout",
      "btn_google_sync_now",
      "btn_force_upload",
      "btn_force_download",
      "cloud_sync_last_synced",
      "toast_cloud_sync_success",
      "toast_cloud_sync_error",
      "toast_cloud_connected",
      "toast_cloud_disconnected",
    ];

    for (const key of requiredI18nKeys) {
      assert(
        driveEngine.sandbox.TRANSLATIONS.en[key] !== undefined &&
          driveEngine.sandbox.TRANSLATIONS.en[key].length > 0,
        `I18N-EN: English translation exists for '${key}'`
      );
      assert(
        driveEngine.sandbox.TRANSLATIONS.vi[key] !== undefined &&
          driveEngine.sandbox.TRANSLATIONS.vi[key].length > 0,
        `I18N-VI: Vietnamese translation exists for '${key}'`
      );
    }
  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`📊 Cloud Sync Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCloudSyncTests();
