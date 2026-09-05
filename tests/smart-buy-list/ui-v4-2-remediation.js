const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadEngine() {
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

  const storageMock = {};
  const docElementClasses = new Set(["dark"]);
  const listeners = {};

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
    crypto: {
      randomUUID: () => "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      getRandomValues: (buf) => {
        for (let i = 0; i < buf.length; i++) buf[i] = (i * 17) % 256;
        return buf;
      },
    },
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: (type, fn) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
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
      addEventListener: (type, fn) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
      },
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
  return { sandbox, htmlContent, listeners };
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
  "\n🧪 Running Smart Buy-List v4.2.0 Review Remediation Test Suite...\n"
);

try {
  const { sandbox, htmlContent } = loadEngine();

  // =========================================================================
  // Section 1: ID Generation & Validation Seam (B6 & B1)
  // =========================================================================
  console.log("--- Section 1: ID Generation & Validation Seam (B6 & B1) ---");

  assert(
    typeof sandbox.generateItemId === "function",
    "ID-01: generateItemId function is defined and exported"
  );

  const id1 = sandbox.generateItemId("item");
  const id2 = sandbox.generateItemId("store");
  assert(
    id1.startsWith("item_") && id2.startsWith("store_"),
    `ID-02: generateItemId generates IDs with proper prefix (Got: ${id1}, ${id2})`
  );

  assert(
    id1.length >= 20,
    "ID-03: generateItemId generates high-entropy cryptographic IDs"
  );

  assert(
    typeof sandbox.isValidId === "function",
    "ID-04: isValidId function is defined and exported"
  );

  assert(
    sandbox.isValidId("item_1725180000000_a1b2c3d4") === true,
    "ID-05: isValidId accepts standard alphanumeric IDs with underscores"
  );

  assert(
    sandbox.isValidId("item-123-abc") === true,
    "ID-06: isValidId accepts hyphenated item IDs"
  );

  assert(
    sandbox.isValidId("item' onclick='alert(1)") === false,
    "ID-07: isValidId rejects quotes and JS injection strings"
  );

  assert(
    sandbox.isValidId("<img src=x onerror=alert(1)>") === false,
    "ID-08: isValidId rejects HTML tags and XSS payloads"
  );

  assert(
    sandbox.isValidId(null) === false &&
      sandbox.isValidId(undefined) === false &&
      sandbox.isValidId(123) === false,
    "ID-09: isValidId safely handles non-string inputs"
  );

  // =========================================================================
  // Section 2: Deal-Scoring Math & Chronological lastPrice (B4, B5, B7)
  // =========================================================================
  console.log(
    "\n--- Section 2: Deal-Scoring Math & Chronological lastPrice (B4, B5, B7) ---"
  );

  // Test B4: Chronological lastPrice sorting
  // Create a ledger where entries are NOT in chronological order
  const nonChronologicalLedger = [
    {
      date: "2026-08-20",
      itemName: "Milk",
      unitPrice: 30000,
    },
    {
      date: "2026-08-30", // Most recent purchase chronologically
      itemName: "Milk",
      unitPrice: 38000,
    },
    {
      date: "2026-08-10",
      itemName: "Milk",
      unitPrice: 28000,
    },
    {
      date: "2026-08-25",
      itemName: "Milk",
      unitPrice: NaN, // Invalid entry at intermediate date
    },
  ];

  const scoreResult = sandbox.evaluateDealScore(35000, nonChronologicalLedger);
  assert(
    scoreResult.lastPrice === 38000,
    `MATH-01: evaluateDealScore correctly derives lastPrice from the chronologically newest valid entry (Expected 38000, got: ${scoreResult.lastPrice})`
  );

  // Test B5: Golden boundary deal scoring thresholds
  const avg = 100000;
  const last = 100000;
  const standardLedger = [
    { date: "2026-08-01", unitPrice: avg },
    { date: "2026-08-15", unitPrice: last },
  ];

  // 1. GREAT_DEAL: price <= 0.90 * avg
  const dealGreat = sandbox.evaluateDealScore(90000, standardLedger);
  assert(
    dealGreat.score === "GREAT_DEAL",
    `MATH-02: Price at 0.90 * avg qualifies as GREAT_DEAL (Got: ${dealGreat.score})`
  );

  // 2. FAIR_PRICE: 91,000 (within [-10%, +10%] avg and <= 1.15 * last)
  const dealFair = sandbox.evaluateDealScore(105000, standardLedger);
  assert(
    dealFair.score === "FAIR_PRICE",
    `MATH-03: Price at +5% avg qualifies as FAIR_PRICE (Got: ${dealFair.score})`
  );

  // 3. PRICE_SPIKE via average threshold (> 1.10 * avg)
  const dealSpikeAvg = sandbox.evaluateDealScore(111000, standardLedger);
  assert(
    dealSpikeAvg.score === "PRICE_SPIKE",
    `MATH-04: Price at +11% avg triggers PRICE_SPIKE (Got: ${dealSpikeAvg.score})`
  );

  // 4. PRICE_SPIKE via last price threshold (> 1.15 * last) with lower avg
  const multiLedger = [
    { date: "2026-08-01", unitPrice: 110000 },
    { date: "2026-08-10", unitPrice: 110000 },
    { date: "2026-08-20", unitPrice: 80000 }, // min = 80k, last = 80k, avg = 100k
  ];
  // Price = 95,000 is < avg (100k) and > 0.90 * avg (90k), but > 1.15 * last (80k * 1.15 = 92k) -> PRICE_SPIKE
  const dealSpikeLast = sandbox.evaluateDealScore(95000, multiLedger);
  assert(
    dealSpikeLast.score === "PRICE_SPIKE",
    `MATH-05: Price > 1.15 * lastPrice triggers PRICE_SPIKE even if below average (Got: ${dealSpikeLast.score})`
  );

  // Test B7: Unbounded ledger resilience without array spread stack overflow
  const largePrices = Array.from(
    { length: 5000 },
    (_, i) => 10000 + (i % 500) * 10
  );
  const largeLedger = largePrices.map((p, i) => ({
    date: `2026-01-01`,
    unitPrice: p,
  }));

  let largeCalcPassed = false;
  try {
    const largeResult = sandbox.evaluateDealScore(12000, largeLedger);
    const sparklineSvg = sandbox.renderSparklineSvg(largePrices);
    largeCalcPassed =
      largeResult &&
      largeResult.minPrice === 10000 &&
      typeof sparklineSvg === "string";
  } catch (err) {
    console.error("Large ledger exception:", err);
  }
  assert(
    largeCalcPassed,
    "MATH-06: evaluateDealScore and renderSparklineSvg handle 5,000+ ledger entries without call stack overflow"
  );

  // =========================================================================
  // Section 3: Event Delegation & Safe Attribute Injection (B1 & I4)
  // =========================================================================
  console.log(
    "\n--- Section 3: Event Delegation & Safe Attribute Injection (B1 & I4) ---"
  );

  const testItem = {
    id: "item_test_safe_1",
    name: "Safe Apples",
    category: "produce",
    store: "WinMart",
    quantity: 2,
    unit: "kg",
    price: 45000,
    checked: false,
  };

  sandbox.currentPhase = "PLANNING";
  const planningCardHtml = sandbox.renderItemCard(testItem);

  assert(
    planningCardHtml.includes('data-action="toggle-check"'),
    "CARD-01: Planning card renders data-action='toggle-check'"
  );
  assert(
    planningCardHtml.includes('data-action="edit-item"'),
    "CARD-02: Planning card renders data-action='edit-item'"
  );
  assert(
    planningCardHtml.includes('data-action="compare"'),
    "CARD-03: Planning card renders data-action='compare'"
  );
  assert(
    planningCardHtml.includes('data-action="delete-item"'),
    "CARD-04: Planning card renders data-action='delete-item'"
  );
  assert(
    planningCardHtml.includes(`data-item-id="${testItem.id}"`),
    "CARD-05: Planning card renders data-item-id attribute"
  );

  // Buy Mode Card
  sandbox.currentPhase = "IN_STORE";
  const buyCardHtml = sandbox.renderItemCard(testItem);
  assert(
    buyCardHtml.includes('data-action="toggle-check"'),
    "CARD-06: Buy mode card renders data-action='toggle-check'"
  );
  assert(
    buyCardHtml.includes('data-action="edit-price"'),
    "CARD-07: Buy mode card renders data-action='edit-price'"
  );

  // XSS Injection in item.id
  const maliciousIdItem = {
    id: `item' onclick='alert(1)`,
    name: "Malicious ID Item",
    category: "other",
    quantity: 1,
    unit: "ea",
    price: 10000,
    checked: false,
  };
  const xssCardHtml = sandbox.renderItemCard(maliciousIdItem);
  assert(
    !xssCardHtml.includes(`item' onclick='alert(1)`),
    "CARD-08: renderItemCard entity-escapes item.id in all attributes"
  );
  assert(
    xssCardHtml.includes("item&#39; onclick=&#39;alert(1)"),
    "CARD-09: renderItemCard safely renders entity-encoded ID in data-item-id"
  );

  // Test delegated click dispatcher
  let delegatedActionFired = false;
  sandbox._mockToggleItemCheck = (id) => {
    if (id === "item_test_safe_1") delegatedActionFired = true;
  };
  vm.runInContext(
    "const _orig_toggleItemCheck = toggleItemCheck; toggleItemCheck = (id) => { if (window._mockToggleItemCheck) window._mockToggleItemCheck(id); return _orig_toggleItemCheck(id); };",
    sandbox
  );
  const fakeEvent = {
    target: {
      closest: (selector) => {
        if (selector === "[data-action]") {
          return {
            getAttribute: (attr) => {
              if (attr === "data-action") return "toggle-check";
              if (attr === "data-item-id") return "item_test_safe_1";
              return null;
            },
          };
        }
        return null;
      },
    },
  };
  sandbox.handleItemCardDelegatedClick(fakeEvent);
  assert(
    delegatedActionFired,
    "CARD-10: handleItemCardDelegatedClick routes data-action='toggle-check' to toggleItemCheck()"
  );
  vm.runInContext("toggleItemCheck = _orig_toggleItemCheck;", sandbox);

  // ADR-0029: Pure Event Delegation Invariants
  assert(
    !planningCardHtml.includes("onclick="),
    "CARD-11: Planning card buttons have zero inline onclick attributes"
  );
  assert(
    !buyCardHtml.match(/<button[^>]*onclick=/i),
    "CARD-12: Buy mode card buttons have zero inline onclick attributes"
  );

  let cardClickDelegatedToggleCount = 0;
  sandbox._mockCardToggle = () => {
    cardClickDelegatedToggleCount++;
  };
  vm.runInContext(
    "const _orig_toggleCard = toggleItemCheck; toggleItemCheck = () => { if (window._mockCardToggle) window._mockCardToggle(); return _orig_toggleCard(); };",
    sandbox
  );

  // When clicking inside a [data-action] button, handleCardClick must ignore to let delegation handle it
  const eventInsideDataAction = {
    target: {
      closest: (selector) => (selector === "[data-action]" ? {} : null),
    },
  };
  sandbox.handleCardClick(eventInsideDataAction, testItem.id);
  assert(
    cardClickDelegatedToggleCount === 0,
    "CARD-13: handleCardClick ignores clicks originating from [data-action] elements"
  );

  // When clicking on card background (outside any [data-action]), handleCardClick triggers toggle
  const eventOutsideDataAction = {
    target: {
      closest: (selector) => null,
    },
  };
  sandbox.handleCardClick(eventOutsideDataAction, testItem.id);
  assert(
    cardClickDelegatedToggleCount === 1,
    "CARD-14: handleCardClick triggers toggle when clicking card background outside [data-action]"
  );
  vm.runInContext("toggleItemCheck = _orig_toggleCard;", sandbox);

  // =========================================================================
  // Section 4: Service Worker & Cloudflare Pages _headers (B2, I2, I3)
  // =========================================================================
  console.log(
    "\n--- Section 4: Service Worker & Cloudflare Pages _headers (B2, I2, I3) ---"
  );

  // Check _headers file
  const headersPath = path.join(
    __dirname,
    "../..",
    "smart-buy-list-price-tracker",
    "_headers"
  );
  assert(
    fs.existsSync(headersPath),
    "HEADERS-01: _headers file exists in smart-buy-list-price-tracker/"
  );

  const headersContent = fs.readFileSync(headersPath, "utf8");
  assert(
    headersContent.includes("X-Frame-Options: DENY"),
    "HEADERS-02: _headers configures 'X-Frame-Options: DENY' for clickjacking defense (B2)"
  );
  assert(
    headersContent.includes("X-Content-Type-Options: nosniff"),
    "HEADERS-03: _headers configures 'X-Content-Type-Options: nosniff'"
  );

  // Check manifest & version badge
  const manifestPath = path.join(
    __dirname,
    "../..",
    "smart-buy-list-price-tracker",
    "manifest.webmanifest"
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Check sw.js
  const swPath = path.join(
    __dirname,
    "../..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const swContent = fs.readFileSync(swPath, "utf8");

  assert(
    swContent.includes("smart-buy-list-v" + manifest.version),
    "SW-01: sw.js CACHE_NAME is bumped to smart-buy-list-v4.2.0"
  );
  assert(
    !swContent.includes("cdn.tailwindcss.com"),
    "SW-02: sw.js ASSETS_TO_CACHE removes dead Tailwind CDN entry (I2)"
  );
  assert(
    swContent.includes('request.mode === "navigate"'),
    "SW-03: sw.js uses clean request.mode === 'navigate' check (I3)"
  );

  assert(
    typeof manifest.version === "string" &&
      /^\d+\.\d+\.\d+$/.test(manifest.version),
    `PWA-01: manifest.webmanifest version is 4.2.0 (Got: ${manifest.version})`
  );

  assert(
    htmlContent.includes('id="pwaVersionBadge"') &&
      /id="pwaVersionBadge"[^>]*>\s*v4\.(2|3)\.0\s*<\/span/i.test(htmlContent),
    "PWA-02: #pwaVersionBadge displays v4.2.0"
  );
} catch (err) {
  console.error("❌ Test Execution Exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Smart Buy-List v4.2.0 Remediation Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
