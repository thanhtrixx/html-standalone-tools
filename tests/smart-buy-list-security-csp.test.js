const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadSecurityEngine() {
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
  const docElementClasses = new Set(["dark"]);
  let activeFocus = null;

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
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
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
        focus: () => {
          activeFocus = id;
        },
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
    indexedDB: null,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  return { sandbox, htmlContent };
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
  "\n🧪 Running Smart Buy-List Security & Content-Security-Policy Test Suite...\n"
);

try {
  const { sandbox, htmlContent } = loadSecurityEngine();

  // SECTION 1: sanitizeHTML Unit Behavior
  console.log("--- Section 1: sanitizeHTML Utility Seam ---");

  assert(
    typeof sandbox.sanitizeHTML === "function",
    "SEC-01: sanitizeHTML utility function is defined and exported globally"
  );

  assert(
    sandbox.sanitizeHTML("<script>alert(1)</script>") ===
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    "SEC-02: sanitizeHTML escapes < and > characters properly"
  );

  assert(
    sandbox.sanitizeHTML("Apples & Oranges") === "Apples &amp; Oranges",
    "SEC-03: sanitizeHTML escapes ampersand (&) character"
  );

  assert(
    sandbox.sanitizeHTML(`Item with "quotes" and 'apostrophe'`) ===
      "Item with &quot;quotes&quot; and &#39;apostrophe&#39;",
    "SEC-04: sanitizeHTML escapes double and single quotes"
  );

  assert(
    sandbox.sanitizeHTML(null) === "",
    "SEC-05: sanitizeHTML safely handles null by returning an empty string"
  );

  assert(
    sandbox.sanitizeHTML(undefined) === "",
    "SEC-06: sanitizeHTML safely handles undefined by returning an empty string"
  );

  assert(
    sandbox.sanitizeHTML(12345) === "12345",
    "SEC-07: sanitizeHTML correctly converts numbers to string representations"
  );

  assert(
    sandbox.sanitizeHTML("<svg/onload=alert('xss')>") ===
      "&lt;svg/onload=alert(&#39;xss&#39;)&gt;",
    "SEC-08: sanitizeHTML neutralizes complex XSS payloads"
  );

  // SECTION 2: Dynamic Component XSS Defenses
  console.log("\n--- Section 2: Dynamic Template XSS Defenses ---");

  const maliciousItem = {
    id: "xss-item-1",
    name: "<img src=x onerror=alert('item-xss')>",
    category: "dairy_eggs",
    quantity: 2,
    unit: "<b onmouseover=alert(1)>L</b>",
    price: 45000,
    store: "<script>alert('store-xss')</script>",
    checked: false,
  };

  // Buy Mode Card
  sandbox.currentPhase = "IN_STORE";
  const buyCardHtml = sandbox.renderItemCard(maliciousItem);
  assert(
    !buyCardHtml.includes("<img src=x onerror=alert('item-xss')>"),
    "SEC-CARD-01: Buy mode card does not render raw unescaped image XSS payload"
  );
  assert(
    buyCardHtml.includes("&lt;img src=x onerror=alert(&#39;item-xss&#39;)&gt;"),
    "SEC-CARD-02: Buy mode card contains properly entity-encoded item name"
  );

  // Planning Mode Card
  sandbox.currentPhase = "PLANNING";
  const planningCardHtml = sandbox.renderItemCard(maliciousItem);
  assert(
    !planningCardHtml.includes("<img src=x onerror="),
    "SEC-CARD-03: Planning mode card does not contain executable HTML tags in item name"
  );
  assert(
    planningCardHtml.includes(
      "&lt;img src=x onerror=alert(&#39;item-xss&#39;)&gt;"
    ),
    "SEC-CARD-04: Planning mode card displays escaped item name text"
  );
  assert(
    !planningCardHtml.includes("<b onmouseover="),
    "SEC-CARD-05: Planning mode card escapes item unit payload"
  );

  // Store Manager List
  sandbox.memoryState.stores = [
    "WinMart",
    "<script>alert('store-xss')</script>",
  ];
  const storeContainer = { innerHTML: "" };
  sandbox.document.getElementById = (id) =>
    id === "storeManagerList" ? storeContainer : null;
  sandbox.renderStoreManagerList();
  assert(
    !storeContainer.innerHTML.includes("<script>alert('store-xss')</script>"),
    "SEC-STORE-01: Store Manager list does not render raw script tags for custom store names"
  );
  assert(
    storeContainer.innerHTML.includes(
      "&lt;script&gt;alert(&#39;store-xss&#39;)&lt;/script&gt;"
    ),
    "SEC-STORE-02: Store Manager list renders entity-escaped custom store names"
  );

  // Store Filter Chips
  const chipContainer = { innerHTML: "" };
  sandbox.document.getElementById = (id) =>
    id === "storeFilterChips" ? chipContainer : null;
  sandbox.renderStoreFilterChips();
  assert(
    !chipContainer.innerHTML.includes("<script>alert('store-xss')</script>"),
    "SEC-STORE-03: Store filter chips do not render raw script tags"
  );

  // Historical Price Ledger
  sandbox.memoryState.purchaseLedger = [
    {
      id: "ledger-xss-1",
      date: "2026-09-01",
      itemName: "<svg onload=alert('ledger-xss')>",
      store: "<iframe src=javascript:alert(1)></iframe>",
      quantity: 1,
      unit: "kg",
      price: 50000,
      unitPrice: 50000,
    },
  ];
  const ledgerTbody = { innerHTML: "" };
  const ledgerMobile = { innerHTML: "" };
  sandbox.document.getElementById = (id) => {
    if (id === "ledgerTableBody") return ledgerTbody;
    if (id === "ledgerMobileCards") return ledgerMobile;
    return null;
  };
  sandbox.renderPriceLedgerTable();

  assert(
    !ledgerTbody.innerHTML.includes("<svg onload="),
    "SEC-LEDGER-01: Desktop ledger table does not render executable SVG XSS payload"
  );
  assert(
    ledgerTbody.innerHTML.includes(
      "&lt;svg onload=alert(&#39;ledger-xss&#39;)&gt;"
    ),
    "SEC-LEDGER-02: Desktop ledger table renders escaped item name"
  );
  assert(
    !ledgerTbody.innerHTML.includes("<iframe"),
    "SEC-LEDGER-03: Desktop ledger table does not render iframe injection"
  );
  assert(
    !ledgerMobile.innerHTML.includes("<svg onload=") &&
      !ledgerMobile.innerHTML.includes("<iframe"),
    "SEC-LEDGER-04: Mobile ledger cards do not render SVG or iframe injections"
  );

  // SECTION 3: Content-Security-Policy Meta Tag Verification
  console.log("\n--- Section 3: Content-Security-Policy (CSP) Directives ---");

  const cspMetaMatch = htmlContent.match(
    /<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"/i
  );

  assert(
    Boolean(cspMetaMatch),
    "SEC-CSP-01: Content-Security-Policy meta tag is present in <head>"
  );

  if (cspMetaMatch) {
    const cspContent = cspMetaMatch[1];

    assert(
      cspContent.includes("default-src 'self'"),
      "SEC-CSP-02: CSP includes 'default-src \\'self\\'' directive"
    );

    assert(
      cspContent.includes("https://cdn.tailwindcss.com"),
      "SEC-CSP-03: CSP whitelists Tailwind CDN (https://cdn.tailwindcss.com)"
    );

    assert(
      cspContent.includes("https://accounts.google.com"),
      "SEC-CSP-04: CSP whitelists Google Accounts (https://accounts.google.com)"
    );

    assert(
      cspContent.includes("https://static.cloudflareinsights.com"),
      "SEC-CSP-05: CSP whitelists Cloudflare Web Analytics (https://static.cloudflareinsights.com)"
    );

    assert(
      cspContent.includes("https://api.github.com"),
      "SEC-CSP-06: CSP connect-src whitelists GitHub API (https://api.github.com)"
    );

    assert(
      cspContent.includes("https://www.googleapis.com"),
      "SEC-CSP-07: CSP connect-src whitelists Google APIs (https://www.googleapis.com)"
    );
  }
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Security & CSP Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
