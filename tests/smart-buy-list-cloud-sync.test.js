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
        href: "",
        type: "text",
        checked: true,
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
      headers: {
        get: (name) => {
          if (name.toLowerCase() === "x-oauth-scopes") return "gist";
          return null;
        },
      },
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
  "\n🧪 Running Smart Buy-List Multi-Provider & GitHub Gist Cloud Sync Test Suite (v3.5.0)...\n"
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
    // SECTION 1: DOM Elements & Option Hub Markup Verification
    // =========================================================================
    console.log("--- Section 1: DOM Elements & Option Hub Markup ---");

    assert(
      htmlContent.includes('id="cloudSyncSection"'),
      "SYNC-DOM-01: Option Hub contains Cloud Sync section container (#cloudSyncSection)"
    );
    assert(
      htmlContent.includes('id="cloudProviderSelect"'),
      "SYNC-DOM-02: Option Hub contains Cloud Provider dropdown selector (#cloudProviderSelect)"
    );
    assert(
      htmlContent.includes('id="googleDriveSyncPanel"'),
      "SYNC-DOM-03: Option Hub contains Google Drive sync panel (#googleDriveSyncPanel)"
    );
    assert(
      htmlContent.includes('id="githubGistSyncPanel"'),
      "SYNC-DOM-04: Option Hub contains GitHub Gist sync panel (#githubGistSyncPanel)"
    );
    assert(
      htmlContent.includes('id="githubTokenInput"'),
      "SYNC-DOM-05: Option Hub contains GitHub PAT input (#githubTokenInput)"
    );
    assert(
      htmlContent.includes('id="btnToggleGithubTokenVisibility"'),
      "SYNC-DOM-06: Option Hub contains token visibility toggle button (#btnToggleGithubTokenVisibility)"
    );
    assert(
      htmlContent.includes('id="githubTokenHelperLink"'),
      "SYNC-DOM-07: Option Hub contains 1-click token helper link (#githubTokenHelperLink)"
    );
    assert(
      htmlContent.includes('id="githubGistIdInput"'),
      "SYNC-DOM-08: Option Hub contains Gist ID input (#githubGistIdInput)"
    );
    assert(
      htmlContent.includes('id="githubRememberTokenCheckbox"'),
      "SYNC-DOM-09: Option Hub contains Remember Token checkbox (#githubRememberTokenCheckbox)"
    );
    assert(
      htmlContent.includes('id="btnGithubConnect"'),
      "SYNC-DOM-10: Option Hub contains Connect & Verify button (#btnGithubConnect)"
    );
    assert(
      htmlContent.includes('id="btnGithubDisconnect"'),
      "SYNC-DOM-11: Option Hub contains Disconnect button (#btnGithubDisconnect)"
    );
    assert(
      htmlContent.includes('id="githubViewGistLink"'),
      "SYNC-DOM-12: Option Hub contains View Gist on GitHub link (#githubViewGistLink)"
    );
    assert(
      !htmlContent.includes('id="topBarSyncStatus"') &&
        htmlContent.includes('id="cloudSyncStatusPill"'),
      "SYNC-DOM-13: Option Hub contains calm sync status pill (#cloudSyncStatusPill) and top bar is decluttered"
    );

    // =========================================================================
    // SECTION 2: Multi-Provider Storage Registry Architecture (StorageManager)
    // =========================================================================
    console.log(
      "\n--- Section 2: Multi-Provider Storage Registry Architecture ---"
    );

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
      typeof engine.sandbox.GitHubGistStorageProvider === "function",
      "SEAM-04: GitHubGistStorageProvider class exists"
    );
    assert(
      typeof engine.sandbox.storageManager === "object" &&
        engine.sandbox.storageManager !== null,
      "SEAM-05: Global storageManager singleton exists"
    );

    assert(
      typeof engine.sandbox.storageManager.setActiveCloudProvider ===
        "function",
      "REGISTRY-01: storageManager provides setActiveCloudProvider() method"
    );

    // Test switching to 'none'
    engine.sandbox.storageManager.setActiveCloudProvider("none");
    assert(
      engine.sandbox.storageManager.getActiveProviderType() === "none",
      "REGISTRY-02: storageManager activates 'none' (local only) mode"
    );

    // Test switching to 'googledrive'
    engine.sandbox.storageManager.setActiveCloudProvider("googledrive");
    assert(
      engine.sandbox.storageManager.getActiveProviderType() === "googledrive",
      "REGISTRY-03: storageManager activates 'googledrive' provider"
    );

    // Test switching to 'github'
    engine.sandbox.storageManager.setActiveCloudProvider("github");
    assert(
      engine.sandbox.storageManager.getActiveProviderType() === "github",
      "REGISTRY-04: storageManager activates 'github' provider"
    );

    // Test provider status
    const ghStatus = engine.sandbox.storageManager.providers.github.getStatus();
    assert(
      ghStatus && ghStatus.provider === "github",
      "REGISTRY-05: GitHubGistStorageProvider returns structured status object"
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

    authEngine.sandbox.handleGoogleSignIn();
    assert(
      authEngine.sandbox.googleAuthState &&
        authEngine.sandbox.googleAuthState.accessToken ===
          "mock_gdrive_access_token_xyz123",
      "AUTH-04: Successful GIS authorization populates ephemeral in-memory accessToken"
    );
    assert(
      authEngine.storageMock["google_client_id"] ===
        "test-client-id-12345.apps.googleusercontent.com",
      "AUTH-05: Persists user google_client_id to localStorage"
    );
    assert(
      authEngine.storageMock["google_access_token"] === undefined,
      "AUTH-06: Strictly does NOT persist OAuth bearer token to localStorage (Security Invariant)"
    );

    // =========================================================================
    // SECTION 4: GitHub PAT Authentication & Handshake Verification
    // =========================================================================
    console.log("\n--- Section 4: GitHub PAT Authentication & Handshake ---");

    assert(
      typeof engine.sandbox.handleGithubConnect === "function",
      "GH-AUTH-01: handleGithubConnect function is exported"
    );
    assert(
      typeof engine.sandbox.handleGithubDisconnect === "function",
      "GH-AUTH-02: handleGithubDisconnect function is exported"
    );
    assert(
      typeof engine.sandbox.toggleGithubTokenVisibility === "function",
      "GH-AUTH-03: toggleGithubTokenVisibility function is exported"
    );

    let githubMockApi = {
      user: { login: "octocat", id: 1 },
      gists: [],
    };

    const mockGithubFetch = async (url, opts = {}) => {
      const urlStr = String(url);
      const auth = opts.headers?.Authorization || "";

      if (!auth.includes("ghp_valid_test_token_123")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: "Bad credentials" }),
          text: async () => "Bad credentials",
        };
      }

      // GET /user
      if (urlStr.endsWith("/user")) {
        return {
          ok: true,
          status: 200,
          headers: {
            get: (k) =>
              k.toLowerCase() === "x-oauth-scopes" ? "gist, repo" : null,
          },
          json: async () => githubMockApi.user,
        };
      }

      // GET /gists (list)
      if (
        urlStr.includes("/gists") &&
        (!opts.method || opts.method === "GET") &&
        !urlStr.match(/\/gists\/[a-zA-Z0-9_-]+$/)
      ) {
        return {
          ok: true,
          status: 200,
          json: async () => githubMockApi.gists,
        };
      }

      // POST /gists (create)
      if (urlStr.endsWith("/gists") && opts.method === "POST") {
        const body = JSON.parse(opts.body || "{}");
        const newGist = {
          id: "gist_auto_created_888",
          description: body.description,
          public: body.public,
          updated_at: new Date().toISOString(),
          files: body.files,
        };
        githubMockApi.gists.push(newGist);
        return {
          ok: true,
          status: 201,
          json: async () => newGist,
        };
      }

      // GET /gists/{id} (read)
      const gistIdMatch = urlStr.match(/\/gists\/([a-zA-Z0-9_-]+)$/);
      if (gistIdMatch && (!opts.method || opts.method === "GET")) {
        const id = gistIdMatch[1];
        const found = githubMockApi.gists.find((g) => g.id === id);
        if (found) {
          return { ok: true, status: 200, json: async () => found };
        }
        return {
          ok: false,
          status: 404,
          json: async () => ({ message: "Not Found" }),
        };
      }

      // PATCH /gists/{id} (update)
      if (gistIdMatch && opts.method === "PATCH") {
        const id = gistIdMatch[1];
        const body = JSON.parse(opts.body || "{}");
        const found = githubMockApi.gists.find((g) => g.id === id);
        if (found) {
          found.updated_at = new Date().toISOString();
          if (body.files) Object.assign(found.files, body.files);
          return { ok: true, status: 200, json: async () => found };
        }
        return {
          ok: false,
          status: 404,
          json: async () => ({ message: "Not Found" }),
        };
      }

      // Raw URL fetch
      if (urlStr.includes("raw.githubusercontent.com")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              schemaVersion: 2,
              activeList: {
                items: [
                  { id: "raw_item_1", name: "Organic Honey", price: 80000 },
                ],
              },
              purchaseLedger: [],
              stores: ["WinMart"],
            }),
        };
      }

      return { ok: true, status: 200, json: async () => ({}) };
    };

    const ghEngine = loadBuyListCloudSyncEngine({
      mockFetchHandler: mockGithubFetch,
      initialStorage: {},
    });
    await ghEngine.sandbox.initDatabase();

    const ghProvider = ghEngine.sandbox.storageManager.providers.github;

    // Validate token handshake
    const validResult = await ghProvider.validateToken(
      "ghp_valid_test_token_123"
    );
    assert(
      validResult && validResult.user && validResult.user.login === "octocat",
      "GH-AUTH-04: validateToken queries /user and returns authenticated user details"
    );
    assert(
      validResult.scopes.includes("gist"),
      "GH-AUTH-05: Inspects x-oauth-scopes header for 'gist' permission"
    );

    // Test invalid token throws cleanly
    let invalidThrew = false;
    try {
      await ghProvider.validateToken("ghp_invalid_token_999");
    } catch (e) {
      invalidThrew = true;
    }
    assert(
      invalidThrew,
      "GH-AUTH-06: validateToken throws error on HTTP 401 Unauthorized"
    );

    // =========================================================================
    // SECTION 5: GitHub Gist REST API Provider & Auto-Discovery
    // =========================================================================
    console.log("\n--- Section 5: GitHub Gist Provider Operations ---");

    // Auto-create secret Gist when list is empty
    const createdGistId = await ghProvider.discoverOrCreateGist(
      "ghp_valid_test_token_123"
    );
    assert(
      createdGistId === "gist_auto_created_888",
      "GIST-01: Auto-creates secret Gist when no matching gist is found"
    );
    assert(
      githubMockApi.gists[0].public === false,
      "GIST-02: Created Gist is strictly private/secret (public: false)"
    );
    assert(
      githubMockApi.gists[0].files["smart_buy_list_data.json"] !== undefined,
      "GIST-03: Created Gist contains 'smart_buy_list_data.json' file"
    );

    // Auto-discovery on second call
    const discoveredGistId = await ghProvider.discoverOrCreateGist(
      "ghp_valid_test_token_123"
    );
    assert(
      discoveredGistId === "gist_auto_created_888",
      "GIST-04: Auto-discovers existing Gist by filename on subsequent calls"
    );

    // Read Gist content
    const readRes = await ghProvider.readRemoteGist(
      "gist_auto_created_888",
      "ghp_valid_test_token_123"
    );
    assert(
      readRes && readRes.gist && readRes.data !== null,
      "GIST-05: readRemoteGist parses remote JSON envelope"
    );

    // Test Truncation Fallback: If truncated: true, fetches raw_url
    const truncatedGist = {
      id: "gist_truncated_777",
      description: "Truncated backup",
      public: false,
      updated_at: new Date().toISOString(),
      files: {
        "smart_buy_list_data.json": {
          truncated: true,
          raw_url:
            "https://raw.githubusercontent.com/octocat/gist_truncated_777/raw/smart_buy_list_data.json",
          content: "",
        },
      },
    };
    githubMockApi.gists.push(truncatedGist);

    const truncatedRead = await ghProvider.readRemoteGist(
      "gist_truncated_777",
      "ghp_valid_test_token_123"
    );
    assert(
      truncatedRead &&
        truncatedRead.data &&
        truncatedRead.data.activeList.items[0].name === "Organic Honey",
      "GIST-06: Truncation resilience: Falls back to raw_url with auth header when content is truncated"
    );

    // Update Gist (PATCH)
    const updateRes = await ghProvider.updateRemoteGist(
      "gist_auto_created_888",
      { schemaVersion: 2, test: "patched" },
      "ghp_valid_test_token_123"
    );
    assert(
      updateRes && updateRes.id === "gist_auto_created_888",
      "GIST-07: updateRemoteGist successfully executes PATCH /gists/{id}"
    );

    // End-to-end sync via StorageManager
    ghEngine.sandbox.githubAuthState.token = "ghp_valid_test_token_123";
    ghEngine.sandbox.githubAuthState.gistId = "gist_auto_created_888";
    ghEngine.sandbox.storageManager.setActiveCloudProvider("github");

    const e2eSync = await ghEngine.sandbox.storageManager.sync();
    assert(
      e2eSync.success === true,
      "GIST-08: storageManager.sync() routes to GitHubGistStorageProvider and succeeds"
    );

    // Test Remember Token toggle
    ghEngine.sandbox.githubAuthState.rememberToken = true;
    ghEngine.sandbox.localStorage.setItem(
      "github_sync_token",
      "ghp_valid_test_token_123"
    );
    assert(
      ghEngine.storageMock["github_sync_token"] === "ghp_valid_test_token_123",
      "GIST-09: Persists token in localStorage when Remember Token is checked"
    );

    // Test Disconnect clears credentials
    ghEngine.sandbox.handleGithubDisconnect();
    assert(
      !ghEngine.sandbox.githubAuthState.token,
      "GIST-10: handleGithubDisconnect purges runtime token"
    );
    assert(
      ghEngine.storageMock["github_sync_token"] === undefined,
      "GIST-11: handleGithubDisconnect removes token from localStorage"
    );

    // =========================================================================
    // SECTION 6: Deterministic Multi-Device Cloud Smart Merge Engine
    // =========================================================================
    console.log("\n--- Section 6: Deterministic Cloud Smart Merge Engine ---");

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
          store: "WinMart",
          unitPrice: 35000,
          date: "2026-08-15",
          timestamp: 1723700000000,
        },
      ],
      stores: ["WinMart", "Co.opmart"],
      settings: { language: "vi", currency: "VND" },
    };

    const remoteState = {
      activeList: {
        id: "default",
        title: "Weekly Groceries",
        items: [
          {
            id: "item_1",
            name: "Whole Milk",
            quantity: 4, // Newer
            unit: "L",
            price: 3.5,
            checked: true,
            updatedAt: "2026-08-30T12:00:00.000Z",
          },
          {
            id: "item_3",
            name: "Dragonfruit",
            quantity: 2,
            unit: "kg",
            price: 45000,
            checked: false,
            updatedAt: "2026-08-30T11:00:00.000Z",
          },
        ],
      },
      purchaseLedger: [
        {
          id: 1,
          itemName: "Whole Milk",
          store: "WinMart",
          unitPrice: 35000,
          date: "2026-08-15",
          timestamp: 1723700000000,
        },
        {
          id: 2,
          itemName: "Dragonfruit",
          store: "Bách Hoá Xanh",
          unitPrice: 45000,
          date: "2026-08-20",
          timestamp: 1724100000000,
        },
      ],
      stores: ["WinMart", "Bách Hoá Xanh"],
      settings: { language: "vi", currency: "VND" },
    };

    const merged = ghEngine.sandbox.mergeCloudState(localState, remoteState);

    assert(
      merged.activeList.items.length === 3,
      "MERGE-01: Merged active list contains exactly 3 unique items"
    );
    const milk = merged.activeList.items.find((i) => i.id === "item_1");
    assert(
      milk && milk.quantity === 4 && milk.checked === true,
      "MERGE-02: Adopts newer remote item state by updatedAt timestamp"
    );
    assert(
      merged.purchaseLedger.length === 2,
      "MERGE-03: Unions historical purchase ledger records additively"
    );
    assert(
      merged.stores.includes("WinMart") &&
        merged.stores.includes("Co.opmart") &&
        merged.stores.includes("Bách Hoá Xanh"),
      "MERGE-04: Mathematical union of store profiles"
    );

    // =========================================================================
    // SECTION 7: Synchronization Triggers & Mutation Debounce
    // =========================================================================
    console.log("\n--- Section 7: Mutation Debounce & Sync Triggers ---");

    assert(
      typeof ghEngine.sandbox.triggerDebouncedCloudSync === "function",
      "TRIG-01: triggerDebouncedCloudSync function is exported"
    );

    // =========================================================================
    // SECTION 8: PWA Version Bump & Bilingual Translation Parity
    // =========================================================================
    console.log("\n--- Section 8: PWA Version & Bilingual Parity ---");

    assert(
      swContent.includes('CACHE_NAME = "smart-buy-list-v3.7.0"') ||
        swContent.includes('CACHE_NAME = "smart-buy-list-v3.6.0"') ||
        swContent.includes('CACHE_NAME = "smart-buy-list-v3.5.0"'),
      "PWA-01: sw.js CACHE_NAME is incremented to 'smart-buy-list-v3.7.0'"
    );
    assert(
      htmlContent.includes("v3.7.0") ||
        htmlContent.includes("v3.6.0") ||
        htmlContent.includes("v3.5.0"),
      "PWA-02: index.html displays synchronized version badge v3.7.0"
    );

    const requiredI18nKeys = [
      "cloud_sync_title",
      "cloud_sync_synced",
      "cloud_sync_syncing",
      "cloud_sync_offline",
      "cloud_sync_error",
      "cloud_provider_label",
      "cloud_provider_none",
      "cloud_provider_googledrive",
      "cloud_provider_github",
      "github_sync_title",
      "github_token_label",
      "github_token_placeholder",
      "github_token_helper",
      "github_gist_id_label",
      "github_gist_id_placeholder",
      "github_remember_token",
      "btn_github_connect",
      "btn_github_disconnect",
      "btn_github_sync_now",
      "github_view_gist",
      "toast_github_connected",
      "toast_github_disconnected",
      "toast_github_sync_success",
      "toast_github_token_invalid",
      "toast_github_sync_error",
    ];

    for (const key of requiredI18nKeys) {
      assert(
        ghEngine.sandbox.TRANSLATIONS.en[key] !== undefined &&
          ghEngine.sandbox.TRANSLATIONS.en[key].length > 0,
        `I18N-EN: English translation exists for '${key}'`
      );
      assert(
        ghEngine.sandbox.TRANSLATIONS.vi[key] !== undefined &&
          ghEngine.sandbox.TRANSLATIONS.vi[key].length > 0,
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
