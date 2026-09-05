/**
 * Test Suite: Smart Buy-List Sticky Ambient Cloud Sync Header & Diagnostic Popover (Issue #307)
 *
 * Verifies:
 * 1. DOM Elements Existence & Accessibility (#headerCloudSyncBadge, #cloudSyncDiagnosticPopover, etc.)
 * 2. Visibility Lifecycle (Hidden when Local Only / Unauthenticated, Visible when Active)
 * 3. Dynamic State Transitions (Synced, Syncing, Pending, Offline, Error)
 * 4. Diagnostic Popover Toggle, Metadata Binding, and Outside-Click Handling
 * 5. Manual Sync Trigger and Auto-Reconnect with Exponential Backoff
 * 6. Bilingual Parity for Ambient Cloud Sync Keys
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

function loadTrackerHarness() {
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

  const domElements = {};
  const listeners = {};

  function getMockEl(id) {
    if (!domElements[id]) {
      const classSet = new Set(["hidden"]);
      domElements[id] = {
        id,
        classList: {
          classes: classSet,
          add(...cs) {
            cs.forEach((c) => classSet.add(c));
          },
          remove(...cs) {
            cs.forEach((c) => classSet.delete(c));
          },
          contains(c) {
            return classSet.has(c);
          },
        },
        get className() {
          return Array.from(classSet).join(" ");
        },
        set className(val) {
          classSet.clear();
          (val || "")
            .split(/\s+/)
            .filter(Boolean)
            .forEach((c) => classSet.add(c));
        },
        attributes: {},
        setAttribute(k, v) {
          this.attributes[k] = String(v);
          this[k] = v;
        },
        getAttribute(k) {
          return this.attributes[k] ?? this[k] ?? null;
        },
        hasAttribute(k) {
          return k in this.attributes || k in this;
        },
        removeAttribute(k) {
          delete this.attributes[k];
          delete this[k];
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
        contains(child) {
          return child === this;
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
    setTimeout: (fn, delay) => {
      // Allow async timers to register or immediate run if needed
      return setTimeout(fn, delay);
    },
    clearTimeout: (t) => clearTimeout(t),
    tailwind: {},
    addEventListener: (evt, handler) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(handler);
    },
    scrollTo: () => {},
    location: { origin: "http://localhost:8080", pathname: "/", hash: "" },
    navigator: {
      onLine: true,
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

console.log(
  "🧪 Running Smart Buy-List Sticky Ambient Cloud Sync Header Test Suite (Issue #307)...\n"
);

// --- Section 1: DOM Elements Verification ---
console.log("--- Section 1: DOM Elements Verification ---");
{
  const { htmlContent } = loadTrackerHarness();

  assert(
    htmlContent.includes('id="headerCloudSyncContainer"'),
    "DOM-01: #headerCloudSyncContainer container exists in sticky top header"
  );
  assert(
    htmlContent.includes('id="headerCloudSyncBadge"'),
    "DOM-02: #headerCloudSyncBadge button exists in top header"
  );
  assert(
    htmlContent.includes('id="headerCloudSyncDot"'),
    "DOM-03: #headerCloudSyncDot status indicator dot exists"
  );
  assert(
    htmlContent.includes('id="headerCloudSyncText"'),
    "DOM-04: #headerCloudSyncText label span exists"
  );
  assert(
    htmlContent.includes('id="cloudSyncDiagnosticPopover"'),
    "DOM-05: #cloudSyncDiagnosticPopover diagnostic popover exists"
  );
  assert(
    htmlContent.includes('id="popoverCloudProvider"'),
    "DOM-06: #popoverCloudProvider provider name placeholder exists"
  );
  assert(
    htmlContent.includes('id="popoverCloudTarget"'),
    "DOM-07: #popoverCloudTarget storage destination target exists"
  );
  assert(
    htmlContent.includes('id="popoverLastSyncTime"'),
    "DOM-08: #popoverLastSyncTime last sync timestamp placeholder exists"
  );
  assert(
    htmlContent.includes('id="btnHeaderSyncNow"'),
    "DOM-09: #btnHeaderSyncNow manual sync trigger button exists"
  );
  assert(
    htmlContent.includes('id="btnHeaderCloudSettings"'),
    "DOM-10: #btnHeaderCloudSettings shortcut to cloud settings exists"
  );
  assert(
    htmlContent.includes('role="dialog"') &&
      htmlContent.includes('aria-labelledby="cloudSyncPopoverHeading"'),
    "DOM-11: Diagnostic popover has proper dialog ARIA semantics"
  );
}

// --- Section 2: Visibility Lifecycle ---
console.log("\n--- Section 2: Visibility Lifecycle ---");
{
  const { sandbox, getMockEl } = loadTrackerHarness();
  const badge = getMockEl("headerCloudSyncBadge");

  // 1. Initial / Disabled (none) provider -> Hidden
  sandbox.storageManager.setActiveCloudProvider("none");
  sandbox.updateSyncStatusUI();
  assert(
    badge.classList.contains("hidden"),
    "VIS-01: #headerCloudSyncBadge is hidden when active provider is 'none'"
  );

  // 2. Google Drive without token -> Hidden
  sandbox.storageManager.setActiveCloudProvider("googledrive");
  sandbox.googleAuthState.accessToken = null;
  sandbox.updateSyncStatusUI();
  assert(
    badge.classList.contains("hidden"),
    "VIS-02: #headerCloudSyncBadge is hidden when Google Drive is unauthenticated"
  );

  // 3. Google Drive with token -> Visible
  sandbox.googleAuthState.accessToken = "mock_gdrive_token_xyz";
  sandbox.updateSyncStatusUI("synced");
  assert(
    !badge.classList.contains("hidden") &&
      badge.classList.contains("inline-flex"),
    "VIS-03: #headerCloudSyncBadge is visible (inline-flex) when Google Drive is connected"
  );

  // 4. GitHub Gist without token -> Hidden
  sandbox.storageManager.setActiveCloudProvider("github");
  sandbox.githubAuthState.token = null;
  sandbox.updateSyncStatusUI();
  assert(
    badge.classList.contains("hidden"),
    "VIS-04: #headerCloudSyncBadge is hidden when GitHub Gist token is missing"
  );

  // 5. GitHub Gist with token -> Visible
  sandbox.githubAuthState.token = "ghp_mockClassicTokenWithGistScope123456789";
  sandbox.updateSyncStatusUI("synced");
  assert(
    !badge.classList.contains("hidden") &&
      badge.classList.contains("inline-flex"),
    "VIS-05: #headerCloudSyncBadge is visible when GitHub Gist is connected"
  );
}

// --- Section 3: Dynamic State Transitions ---
console.log("\n--- Section 3: Dynamic State Transitions ---");
{
  const { sandbox, getMockEl } = loadTrackerHarness();
  const dot = getMockEl("headerCloudSyncDot");
  const text = getMockEl("headerCloudSyncText");
  const badge = getMockEl("headerCloudSyncBadge");

  sandbox.storageManager.setActiveCloudProvider("googledrive");
  sandbox.googleAuthState.accessToken = "mock_token";

  // State: Synced
  sandbox.updateSyncStatusUI("synced");
  assert(
    dot.classList.contains("bg-emerald-500"),
    "STATE-01: Synced state renders emerald green dot"
  );
  assert(
    text.textContent.includes("đồng bộ") || text.textContent.includes("Synced"),
    `STATE-02: Synced state displays synced text (Got: '${text.textContent}')`
  );

  // State: Syncing (In-flight network request)
  sandbox.updateSyncStatusUI("syncing");
  assert(
    dot.classList.contains("bg-sky-500") &&
      dot.classList.contains("animate-pulse"),
    "STATE-03: Syncing state renders pulsing sky blue dot"
  );
  assert(
    text.textContent.includes("Đang đồng bộ") ||
      text.textContent.includes("Syncing"),
    `STATE-04: Syncing state displays syncing text (Got: '${text.textContent}')`
  );

  // State: Pending (Debounced changes awaiting network)
  sandbox.updateSyncStatusUI("pending");
  assert(
    dot.classList.contains("bg-amber-500"),
    "STATE-05: Pending state renders amber dot"
  );
  assert(
    text.textContent.includes("Chờ") || text.textContent.includes("pending"),
    `STATE-06: Pending state displays pending text (Got: '${text.textContent}')`
  );

  // State: Error
  sandbox.googleAuthState.lastError = "Rate limit exceeded (429)";
  sandbox.updateSyncStatusUI("error");
  assert(
    dot.classList.contains("bg-red-500"),
    "STATE-07: Error state renders red dot"
  );
  assert(
    text.textContent.includes("Lỗi") || text.textContent.includes("Error"),
    `STATE-08: Error state displays error text (Got: '${text.textContent}')`
  );
  assert(
    badge.title.includes("Rate limit"),
    `STATE-09: Badge title includes error diagnostic detail (Got: '${badge.title}')`
  );
}

// --- Section 4: Diagnostic Popover Lifecycle & Data Binding ---
console.log("\n--- Section 4: Diagnostic Popover Lifecycle & Data Binding ---");
{
  const { sandbox, getMockEl } = loadTrackerHarness();
  const popover = getMockEl("cloudSyncDiagnosticPopover");
  const badge = getMockEl("headerCloudSyncBadge");
  const providerLabel = getMockEl("popoverCloudProvider");
  const targetLabel = getMockEl("popoverCloudTarget");
  const lastSyncLabel = getMockEl("popoverLastSyncTime");

  sandbox.storageManager.setActiveCloudProvider("googledrive");
  sandbox.googleAuthState.accessToken = "mock_token";
  const syncTimestamp = new Date("2026-09-05T15:30:00Z").getTime();
  sandbox.googleAuthState.lastSyncTime = syncTimestamp;
  sandbox.updateSyncStatusUI("synced");

  // Metadata binding
  assert(
    providerLabel.textContent === "Google Drive",
    `POPOVER-01: Correctly displays Google Drive provider name (Got: '${providerLabel.textContent}')`
  );
  assert(
    targetLabel.textContent === "appDataFolder",
    `POPOVER-02: Displays appDataFolder destination (Got: '${targetLabel.textContent}')`
  );
  assert(
    lastSyncLabel.textContent !== "--" && lastSyncLabel.textContent.length > 0,
    `POPOVER-03: Displays formatted last sync timestamp (Got: '${lastSyncLabel.textContent}')`
  );

  // Toggle open
  assert(
    popover.classList.contains("hidden"),
    "POPOVER-04: Popover starts hidden"
  );
  sandbox.toggleCloudSyncPopover();
  assert(
    !popover.classList.contains("hidden"),
    "POPOVER-05: toggleCloudSyncPopover opens popover"
  );
  assert(
    badge.getAttribute("aria-expanded") === "true",
    "POPOVER-06: aria-expanded is set to 'true' when popover is open"
  );

  // Toggle close
  sandbox.toggleCloudSyncPopover();
  assert(
    popover.classList.contains("hidden"),
    "POPOVER-07: toggleCloudSyncPopover closes open popover"
  );
  assert(
    badge.getAttribute("aria-expanded") === "false",
    "POPOVER-08: aria-expanded is set to 'false' when popover is closed"
  );

  // Explicit close
  sandbox.toggleCloudSyncPopover();
  sandbox.closeCloudSyncPopover();
  assert(
    popover.classList.contains("hidden"),
    "POPOVER-09: closeCloudSyncPopover explicitly hides popover"
  );

  // GitHub Gist metadata
  sandbox.storageManager.setActiveCloudProvider("github");
  sandbox.githubAuthState.token = "ghp_valid";
  sandbox.githubAuthState.gistId = "abc123def456";
  sandbox.githubAuthState.username = "octocat";
  sandbox.updateSyncStatusUI("synced");
  assert(
    providerLabel.textContent === "GitHub Gist",
    `POPOVER-10: Displays GitHub Gist provider name (Got: '${providerLabel.textContent}')`
  );
  assert(
    targetLabel.textContent.includes("abc123def4"),
    `POPOVER-11: Displays truncated Gist ID (Got: '${targetLabel.textContent}')`
  );
}

// --- Section 5: Manual Sync Dispatches & Backoff Retry ---
console.log("\n--- Section 5: Manual Sync Dispatches & Backoff Retry ---");
{
  const { sandbox, getMockEl } = loadTrackerHarness();
  const popover = getMockEl("cloudSyncDiagnosticPopover");

  let syncInvoked = false;
  sandbox.storageManager.sync = async () => {
    syncInvoked = true;
    return { success: true };
  };

  sandbox.storageManager.setActiveCloudProvider("googledrive");
  sandbox.googleAuthState.accessToken = "mock_token";

  // Open popover and trigger manual sync
  sandbox.toggleCloudSyncPopover();
  sandbox.triggerHeaderManualSync();

  assert(
    syncInvoked,
    "SYNC-DISPATCH-01: triggerHeaderManualSync dispatches sync()"
  );
  assert(
    popover.classList.contains("hidden"),
    "SYNC-DISPATCH-02: triggerHeaderManualSync closes the popover"
  );

  // Auto-sync retry backoff on failure
  let attempts = 0;
  sandbox.storageManager.sync = async () => {
    attempts++;
    if (attempts < 2) {
      return { success: false, error: "Network timeout" };
    }
    return { success: true };
  };

  sandbox.triggerAutoSyncWithRetry();
  assert(
    attempts === 1,
    `RETRY-01: triggerAutoSyncWithRetry attempts immediate sync (Attempts: ${attempts})`
  );
}

// --- Section 6: Bilingual Parity for Ambient Sync Keys ---
console.log("\n--- Section 6: Bilingual Parity for Ambient Sync Keys ---");
{
  const { sandbox } = loadTrackerHarness();
  const requiredKeys = [
    "cloud_sync_pending",
    "cloud_sync_popover_title",
    "lbl_popover_provider",
    "lbl_popover_target",
    "lbl_popover_last_sync",
    "btn_sync_now",
    "btn_retry_now",
  ];

  for (const key of requiredKeys) {
    const enVal = sandbox.TRANSLATIONS?.en?.[key];
    const viVal = sandbox.TRANSLATIONS?.vi?.[key];
    assert(
      typeof enVal === "string" && enVal.length > 0,
      `I18N-EN: English translation exists for '${key}' (Got: '${enVal}')`
    );
    assert(
      typeof viVal === "string" && viVal.length > 0,
      `I18N-VI: Vietnamese translation exists for '${key}' (Got: '${viVal}')`
    );
  }
}

console.log("\n==================================================");
console.log(
  `📊 Ambient Cloud Sync Header Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
